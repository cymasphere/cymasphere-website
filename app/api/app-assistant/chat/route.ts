/**
 * @fileoverview In-app help assistant API for Cymasphere desktop/mobile clients.
 * @module api/app-assistant/chat
 */
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  buildAppAssistantSystemPrompt,
  resolveAppAssistantMode,
  type AppAssistantContext,
} from "@/lib/app-assistant-knowledge";
import { getAppAssistantTools } from "@/lib/app-assistant-tools";
import { checkRateLimit, getClientIp } from "@/utils/rate-limit";
import {
  MAX_HISTORY_CHARS,
  MAX_HISTORY_MESSAGES,
  MAX_MESSAGE_CHARS,
} from "@/lib/chat-limits";

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string | Date;
}

interface ToolResult {
  toolCallId: string;
  name: string;
  result?: unknown;
  error?: string;
}

interface ToolCallResponse {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

interface ToolTranscriptTurn {
  assistantToolCalls: ToolCallResponse[];
  toolResults: ToolResult[];
}

interface AppAssistantRequest {
  message: string;
  conversationHistory: ChatMessage[];
  language?: string;
  appContext?: AppAssistantContext;
  /** Full multi-round tool chain (preferred). */
  toolTranscript?: ToolTranscriptTurn[];
  /** Echoed from the prior response when submitting toolResults (legacy single batch). */
  assistantToolCalls?: ToolCallResponse[];
  toolResults?: ToolResult[];
  /** When true, respond with text/event-stream (SSE token deltas). */
  stream?: boolean;
  /** Chat = read-only inspect tools; Agent = full tools + plan. Defaults to chat. */
  mode?: "chat" | "agent";
}

const MAX_TOOL_ROUNDS = 32;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/** Help-only keyword fallbacks — no pricing or sales content. */
const HELP_FAQ: Record<
  string,
  Record<string, { keywords: string[]; response: string }>
> = {
  en: {
    features: {
      keywords: [
        "feature",
        "tool",
        "what can",
        "capabilities",
        "what does",
      ],
      response:
        "Cymasphere covers chord progressions (Palette), voice-led voicings (Voicing), melody patterns (Track/Sequencer), mixing, and plugin hosting including CymaSynth. What are you trying to do right now?",
    },
    getting_started: {
      keywords: [
        "start",
        "begin",
        "how to",
        "tutorial",
        "learn",
        "new user",
        "first time",
      ],
      response:
        "Quick start: open the Palette view to build a chord progression, switch to Voicing for smooth voice leading, then add a melody in the Track view. Use the ? help button to hover over any control for explanations. What step would you like detail on?",
    },
    support: {
      keywords: [
        "help",
        "support",
        "problem",
        "issue",
        "bug",
        "contact",
        "broken",
      ],
      response:
        "I can help troubleshoot workflows. To file a bug use Profile menu → Bug Report (or https://cymasphere.com/bug-report). For account or billing use Manage Account, or email support@cymasphere.com. What's blocking you in the app?",
    },
    technical: {
      keywords: [
        "system requirements",
        "specs",
        "compatible",
        "performance",
        "crash",
      ],
      response:
        "Cymasphere runs as Standalone, AU (macOS), and VST3 on Mac and Windows. Check Audio / MIDI Settings in the profile menu for device setup. What OS and setup are you using?",
    },
    pricing_redirect: {
      keywords: [
        "price",
        "cost",
        "pricing",
        "subscription",
        "plan",
        "trial",
        "buy",
        "purchase",
      ],
      response:
        "For billing, subscriptions, or account details, open Manage Account from the profile menu (avatar, top right) or visit cymasphere.com. I'm here to help you use the app — what feature can I explain?",
    },
  },
};

function matchesKeyword(message: string, keyword: string): boolean {
  const lowerMessage = message.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  if (/^[a-z0-9\s']+$/i.test(keyword)) {
    const pattern = new RegExp(
      `\\b${lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i"
    );
    return pattern.test(lowerMessage);
  }
  return lowerMessage.includes(lowerKeyword);
}

function detectHelpIntent(message: string, language = "en"): string | null {
  const faq = HELP_FAQ[language] || HELP_FAQ.en;
  for (const [intent, data] of Object.entries(faq)) {
    if (data.keywords.some((kw) => matchesKeyword(message, kw))) {
      return intent;
    }
  }
  return null;
}

function generateHelpFallback(message: string, language = "en"): string {
  const faq = HELP_FAQ[language] || HELP_FAQ.en;
  const intent = detectHelpIntent(message, language);
  if (intent && faq[intent]) {
    return faq[intent].response;
  }

  const lower = message.toLowerCase().trim();
  if (lower.includes("hello") || lower.includes("hi") || lower === "hey") {
    return "Hi! I'm Cyma, your in-app help assistant. Ask me about any Cymasphere feature, workflow, or music theory tied to the app. What are you working on?";
  }
  if (lower.includes("thank")) {
    return "You're welcome! Ask anytime if you need more help with Cymasphere.";
  }

  return "I'm here to help you use Cymasphere. Try asking about a specific view (Song, Palette, Voicing, Track, Mixer) or feature, or use the ? button for control-level help. What would you like to do?";
}

function isCymasphereUserAgent(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent") ?? "";
  return ua.toLowerCase().includes("cymasphere");
}

function parseToolArguments(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeToolTranscript(
  body: AppAssistantRequest
): ToolTranscriptTurn[] {
  if (Array.isArray(body.toolTranscript) && body.toolTranscript.length > 0) {
    return body.toolTranscript.filter(
      (turn) =>
        Array.isArray(turn?.assistantToolCalls) &&
        turn.assistantToolCalls.length > 0 &&
        Array.isArray(turn?.toolResults) &&
        turn.toolResults.length > 0
    );
  }

  const toolResults = Array.isArray(body.toolResults) ? body.toolResults : [];
  const assistantToolCalls = Array.isArray(body.assistantToolCalls)
    ? body.assistantToolCalls
    : [];
  if (toolResults.length > 0 && assistantToolCalls.length > 0) {
    return [{ assistantToolCalls, toolResults }];
  }
  return [];
}

function appendToolTurn(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  turn: ToolTranscriptTurn
) {
  messages.push({
    role: "assistant",
    content: null,
    tool_calls: turn.assistantToolCalls.map((tc) => ({
      id: tc.id,
      type: "function" as const,
      function: {
        name: tc.name,
        arguments: JSON.stringify(tc.arguments ?? {}),
      },
    })),
  });
  for (const tr of turn.toolResults) {
    messages.push({
      role: "tool",
      tool_call_id: tr.toolCallId,
      content: tr.error
        ? JSON.stringify({ error: tr.error })
        : JSON.stringify(tr.result ?? null),
    });
  }
}

function buildOpenAiMessages(
  body: AppAssistantRequest,
  language: string
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const history = Array.isArray(body.conversationHistory)
    ? body.conversationHistory
    : [];
  const transcript = normalizeToolTranscript(body);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: buildAppAssistantSystemPrompt(
        body.appContext,
        resolveAppAssistantMode(body.mode)
      ),
    },
    ...history.map((msg) => ({
      role: (msg.isUser ? "user" : "assistant") as "user" | "assistant",
      content: String(msg.text ?? ""),
    })),
  ];

  if (body.message) {
    messages.push({ role: "user", content: body.message });
  }

  for (const turn of transcript) {
    appendToolTurn(messages, turn);
  }

  return messages;
}

async function generateAssistantResponse(
  body: AppAssistantRequest,
  language: string
): Promise<{ response: string; toolCalls?: ToolCallResponse[] }> {
  if (!openai) {
    return {
      response: generateHelpFallback(body.message || "", language),
    };
  }

  try {
    const tools = getAppAssistantTools(resolveAppAssistantMode(body.mode));
    const messages = buildOpenAiMessages(body, language);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages,
      ...(tools.length > 0 ? { tools, tool_choice: "auto" as const } : {}),
    });

    const choice = completion.choices[0]?.message;
    if (!choice) {
      return {
        response: generateHelpFallback(body.message || "", language),
      };
    }

    const toolCalls: ToolCallResponse[] = [];
    if (choice.tool_calls && choice.tool_calls.length > 0) {
      for (const tc of choice.tool_calls) {
        if (tc.type === "function") {
          toolCalls.push({
            id: tc.id,
            name: tc.function.name,
            arguments: parseToolArguments(tc.function.arguments),
          });
        }
      }
    }

    const text = choice.content?.trim() ?? "";

    if (toolCalls.length > 0) {
      return { response: text, toolCalls };
    }

    if (!text) {
      return {
        response: generateHelpFallback(body.message || "", language),
      };
    }

    return { response: text };
  } catch (error) {
    console.error("[app-assistant] OpenAI error:", error);
    return {
      response: generateHelpFallback(body.message || "", language),
    };
  }
}

function sseEncode(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

/**
 * @brief Streams OpenAI tokens as SSE events (industry-standard for chat UIs).
 * Events: { type: "delta", text }, { type: "done", response, ... }, { type: "error", error }
 * Always uses stream:true (with tools when registered) so text arrives as real token deltas.
 */
function createAssistantSseStream(
  body: AppAssistantRequest,
  language: string
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(sseEncode(payload));
      };

      try {
        if (!openai) {
          const fallback = generateHelpFallback(body.message || "", language);
          send({ type: "delta", text: fallback });
          send({
            type: "done",
            response: fallback,
            timestamp: new Date().toISOString(),
            language,
          });
          controller.close();
          return;
        }

        const tools = getAppAssistantTools(resolveAppAssistantMode(body.mode));
        const messages = buildOpenAiMessages(body, language);

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.2,
          messages,
          stream: true,
          ...(tools.length > 0 ? { tools, tool_choice: "auto" as const } : {}),
        });

        let full = "";
        type AccToolCall = {
          id: string;
          name: string;
          arguments: string;
        };
        const toolAcc = new Map<number, AccToolCall>();

        for await (const chunk of completion) {
          const choice = chunk.choices[0];
          if (!choice) continue;

          const delta = choice.delta;
          if (delta?.content) {
            full += delta.content;
            send({ type: "delta", text: delta.content });
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const index = typeof tc.index === "number" ? tc.index : 0;
              let acc = toolAcc.get(index);
              if (!acc) {
                acc = { id: "", name: "", arguments: "" };
                toolAcc.set(index, acc);
              }
              if (tc.id) acc.id = tc.id;
              if (tc.function?.name) acc.name += tc.function.name;
              if (tc.function?.arguments) acc.arguments += tc.function.arguments;
            }
          }
        }

        const toolCalls: ToolCallResponse[] = [];
        const sortedIndexes = [...toolAcc.keys()].sort((a, b) => a - b);
        for (const index of sortedIndexes) {
          const acc = toolAcc.get(index);
          if (!acc || !acc.name) continue;
          toolCalls.push({
            id: acc.id || `call_${index}`,
            name: acc.name,
            arguments: parseToolArguments(acc.arguments),
          });
        }

        if (toolCalls.length > 0) {
          // Tool round: client executes tools and continues (no fake text).
          send({
            type: "done",
            response: full.trim(),
            timestamp: new Date().toISOString(),
            language,
            toolCalls,
          });
          controller.close();
          return;
        }

        const response =
          full.trim() || generateHelpFallback(body.message || "", language);
        if (!full.trim()) {
          send({ type: "delta", text: response });
        }

        send({
          type: "done",
          response,
          timestamp: new Date().toISOString(),
          language,
        });
        controller.close();
      } catch (error) {
        console.error("[app-assistant] SSE error:", error);
        try {
          // Fallback: non-stream completion if streaming with tools fails.
          const { response, toolCalls } = await generateAssistantResponse(
            body,
            language
          );
          if (toolCalls && toolCalls.length > 0) {
            send({
              type: "done",
              response: response || "",
              timestamp: new Date().toISOString(),
              language,
              toolCalls,
            });
            controller.close();
            return;
          }
          if (response) {
            send({ type: "delta", text: response });
          }
          send({
            type: "done",
            response: response || "",
            timestamp: new Date().toISOString(),
            language,
          });
          controller.close();
          return;
        } catch (fallbackError) {
          console.error("[app-assistant] SSE fallback error:", fallbackError);
          const fallback = generateHelpFallback(body.message || "", language);
          send({ type: "delta", text: fallback });
          send({
            type: "done",
            response: fallback,
            timestamp: new Date().toISOString(),
            language,
          });
          controller.close();
        }
      }
    },
  });
}

/**
 * @brief POST — in-app help assistant (Cymasphere clients only).
 * Set body.stream=true (or Accept: text/event-stream) for SSE token streaming.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isCymasphereUserAgent(request)) {
      return NextResponse.json(
        { error: "This endpoint is for Cymasphere app clients only." },
        { status: 403 }
      );
    }

    const clientIp = getClientIp(request);
    if (!checkRateLimit(`app-assistant:min:${clientIp}`, 20, 60)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
    if (!checkRateLimit(`app-assistant:hour:${clientIp}`, 60, 3600)) {
      return NextResponse.json(
        { error: "Hourly limit reached. Please try again later." },
        { status: 429 }
      );
    }

    const body: AppAssistantRequest = await request.json();
    const transcript = normalizeToolTranscript(body);
    const hasToolResults = transcript.length > 0;

    if (transcript.length > MAX_TOOL_ROUNDS) {
      return NextResponse.json(
        {
          error: `Tool execution limit reached (max ${MAX_TOOL_ROUNDS} rounds).`,
        },
        { status: 400 }
      );
    }

    if (!hasToolResults) {
      if (!body.message || typeof body.message !== "string") {
        return NextResponse.json(
          { error: "Message is required" },
          { status: 400 }
        );
      }
      if (body.message.length > MAX_MESSAGE_CHARS) {
        return NextResponse.json(
          { error: `Message too long (max ${MAX_MESSAGE_CHARS} characters).` },
          { status: 400 }
        );
      }
    }

    const history = Array.isArray(body.conversationHistory)
      ? body.conversationHistory
      : [];
    if (history.length > MAX_HISTORY_MESSAGES) {
      return NextResponse.json(
        {
          error: `Conversation history too long (max ${MAX_HISTORY_MESSAGES} messages).`,
        },
        { status: 400 }
      );
    }

    const historyChars = history.reduce(
      (sum, msg) => sum + String(msg?.text ?? "").length,
      0
    );
    if (historyChars > MAX_HISTORY_CHARS) {
      return NextResponse.json(
        {
          error: `Conversation history too large (max ${MAX_HISTORY_CHARS} characters).`,
        },
        { status: 400 }
      );
    }

    const chatLanguage = body.language || "en";
    const wantsStream =
      body.stream === true ||
      (request.headers.get("accept") ?? "").includes("text/event-stream");

    if (wantsStream) {
      return new Response(createAssistantSseStream(body, chatLanguage), {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    const { response, toolCalls } = await generateAssistantResponse(
      body,
      chatLanguage
    );

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
      language: chatLanguage,
      ...(toolCalls && toolCalls.length > 0 ? { toolCalls } : {}),
    });
  } catch (error) {
    console.error("[app-assistant] API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
