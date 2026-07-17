/**
 * @fileoverview In-app help assistant API for Cymasphere desktop/mobile clients.
 * @module api/app-assistant/chat
 */
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  buildAppAssistantSystemPrompt,
  type AppAssistantContext,
} from "@/lib/app-assistant-knowledge";
import { getAppAssistantTools } from "@/lib/app-assistant-tools";
import { checkRateLimit, getClientIp } from "@/utils/rate-limit";

const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_MESSAGES = 30;
const MAX_HISTORY_CHARS = 16_000;

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

interface AppAssistantRequest {
  message: string;
  conversationHistory: ChatMessage[];
  language?: string;
  appContext?: AppAssistantContext;
  /** Echoed from the prior response when submitting toolResults. */
  assistantToolCalls?: ToolCallResponse[];
  toolResults?: ToolResult[];
}

interface ToolCallResponse {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

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
        "I can help troubleshoot workflows. For account or billing issues use Manage Account in the profile menu, or email support@cymasphere.com. What's blocking you in the app?",
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

function buildOpenAiMessages(
  body: AppAssistantRequest,
  language: string
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const history = Array.isArray(body.conversationHistory)
    ? body.conversationHistory
    : [];
  const toolResults = Array.isArray(body.toolResults) ? body.toolResults : [];
  const assistantToolCalls = Array.isArray(body.assistantToolCalls)
    ? body.assistantToolCalls
    : [];

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: buildAppAssistantSystemPrompt(body.appContext),
    },
    ...history.map((msg) => ({
      role: (msg.isUser ? "user" : "assistant") as "user" | "assistant",
      content: String(msg.text ?? ""),
    })),
  ];

  if (toolResults.length > 0 && assistantToolCalls.length > 0) {
    if (body.message) {
      messages.push({ role: "user", content: body.message });
    }
    messages.push({
      role: "assistant",
      content: null,
      tool_calls: assistantToolCalls.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: {
          name: tc.name,
          arguments: JSON.stringify(tc.arguments ?? {}),
        },
      })),
    });
    for (const tr of toolResults) {
      messages.push({
        role: "tool",
        tool_call_id: tr.toolCallId,
        content: tr.error
          ? JSON.stringify({ error: tr.error })
          : JSON.stringify(tr.result ?? null),
      });
    }
  } else if (toolResults.length > 0) {
    for (const tr of toolResults) {
      messages.push({
        role: "tool",
        tool_call_id: tr.toolCallId,
        content: tr.error
          ? JSON.stringify({ error: tr.error })
          : JSON.stringify(tr.result ?? null),
      });
    }
  } else if (body.message) {
    messages.push({ role: "user", content: body.message });
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
    const tools = getAppAssistantTools();
    const messages = buildOpenAiMessages(body, language);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
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

/**
 * @brief POST — in-app help assistant (Cymasphere clients only).
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
    const toolResults = Array.isArray(body.toolResults) ? body.toolResults : [];
    const hasToolResults = toolResults.length > 0;

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
