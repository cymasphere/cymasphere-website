import { ChatOpenAI } from "@langchain/openai";
import { CYMASPHERE_KNOWLEDGE_BASE } from "@/lib/cymasphere-knowledge-base";

/** Cached static system prefix (instructions + full KB) for OpenAI prompt caching. */
let cachedStaticSystemPrompt: string | null = null;

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: "Respond in English.",
  es: "Respond in Spanish.",
  fr: "Respond in French.",
  de: "Respond in German.",
  it: "Respond in Italian.",
  pt: "Respond in Portuguese.",
  nl: "Respond in Dutch.",
  pl: "Respond in Polish.",
  ru: "Respond in Russian.",
  ja: "Respond in Japanese.",
  zh: "Respond in Chinese.",
  ko: "Respond in Korean.",
};

export interface ChatHistoryMessage {
  text?: string;
  isUser?: boolean;
}

interface NEPQState {
  needs: string[];
  pains: string[];
  currentTools: string[];
  experienceLevel: string;
  budget: string;
  decisionContext: string;
}

function getLanguageInstruction(language: string): string {
  const code = (language || "en").split("-")[0].toLowerCase();
  return (
    LANGUAGE_INSTRUCTIONS[code] ||
    `Respond in the user's language (${language}) when possible; otherwise use English.`
  );
}

/** Static system message: persona, rules, full KB (identical every request for prompt caching). */
export function buildStaticSystemPrompt(): string {
  if (cachedStaticSystemPrompt) {
    return cachedStaticSystemPrompt;
  }

  cachedStaticSystemPrompt = `You are the Cymasphere Assistant on the public website—a friendly, helpful guide for musicians exploring Cymasphere. You are empathetic about creative struggles and accurate about product facts.

PERSONA:
- Support-first: answer the user's question clearly using the knowledge base below.
- Be warm and encouraging for emotional or creative struggles; use the musical support sections in the knowledge base.
- You may ask at most ONE short follow-up question when it genuinely helps (workflow, DAW, or goals)—never interrogate or push sales.

CRITICAL RULES:
1) Answer product questions (features, pricing, trials, installation, technical requirements) using ONLY the knowledge base below. Search the full knowledge base before answering.
2) Do not invent features, pricing, or capabilities not described in the knowledge base.
3) If the knowledge base truly does not contain a specific fact, say you are not sure, suggest support@cymasphere.com or https://discord.gg/gXGqqYR47B, and point to cymasphere.com—do not refuse to answer when the knowledge base has the information.
4) Prefer short, skimmable answers tied to the user's situation.
5) Connect concerns to relevant Cymasphere workflows (Harmony Palette, Song Builder, Pattern Editor, Voicing Generator, DAW plugin).

KNOWLEDGE BASE:
${CYMASPHERE_KNOWLEDGE_BASE}

Instructions for each turn:
- Give a concise, knowledge-grounded answer first.
- Optionally end with one helpful follow-up question if it moves the conversation forward.`;

  return cachedStaticSystemPrompt;
}

/** Per-turn dynamic context (separate system message so the static prefix can be prompt-cached). */
function buildConversationContextMessage(nepqState: NEPQState, language: string): string {
  return `CONVERSATION CONTEXT (this turn only):
- ${getLanguageInstruction(language)}
- Creative needs noted: ${nepqState.needs.join(", ") || "unknown"}
- Pains or blockers noted: ${nepqState.pains.join(", ") || "unknown"}
- Tools mentioned: ${nepqState.currentTools.join(", ") || "unknown"}
- Experience level: ${nepqState.experienceLevel || "unknown"}
- Budget sensitivity: ${nepqState.budget || "unknown"}
- Decision context: ${nepqState.decisionContext || "unknown"}`;
}

export function extractNEPQState(
  conversationHistory: ChatHistoryMessage[] = [],
  latestUserMessage: string = ""
): NEPQState {
  const recent = [...conversationHistory].slice(-10);
  const texts = recent.map((m) => m?.text || "").concat(latestUserMessage || "");
  const joined = texts.join("\n").toLowerCase();

  const needs: string[] = [];
  const pains: string[] = [];
  const currentTools: string[] = [];
  let experienceLevel: string | null = null;
  let budget: string | null = null;
  let decisionContext: string | null = null;

  if (/melod(y|ies)|lead|topline/.test(joined)) needs.push("melody creation");
  if (/chord|progression|voicing|harmony/.test(joined)) needs.push("chords & harmony");
  if (/arrang(e|ement)|structure/.test(joined)) needs.push("song structure");

  if (/struggl|hard|confus|stuck|block|problem|issue/.test(joined)) pains.push("creative friction");
  if (/theory|scale|mode|voic(e|ing)s? hard|don'?t know theory/.test(joined)) {
    pains.push("music theory complexity");
  }

  if (/ableton|fl studio|logic|reaper|bitwig|pro tools|studio one|cubase/.test(joined)) {
    currentTools.push("DAW mentioned");
  }

  if (/beginner|new to|just starting/.test(joined)) experienceLevel = "beginner";
  else if (/intermediate|some experience/.test(joined)) experienceLevel = "intermediate";
  else if (/advanced|expert|pro/.test(joined)) experienceLevel = "advanced";

  if (/(budget|price range|too expensive|afford|cost)/.test(joined)) budget = "budget sensitive";
  if (/(manager|boss|team|client|approval|procurement)/.test(joined)) {
    decisionContext = "multiple stakeholders";
  }

  return {
    needs: Array.from(new Set(needs)),
    pains: Array.from(new Set(pains)),
    currentTools: Array.from(new Set(currentTools)),
    experienceLevel: experienceLevel || "",
    budget: budget || "",
    decisionContext: decisionContext || "",
  };
}

class CymasphereChatAssistant {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.1,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateResponse(
    query: string,
    conversationHistory: ChatHistoryMessage[] = [],
    language: string = "en"
  ): Promise<string> {
    const nepqState = extractNEPQState(conversationHistory, query);

    const messages = [
      { role: "system" as const, content: buildStaticSystemPrompt() },
      { role: "system" as const, content: buildConversationContextMessage(nepqState, language) },
      ...conversationHistory.slice(-8).map((msg) => ({
        role: (msg.isUser ? "user" : "assistant") as "user" | "assistant",
        content: msg.text || "",
      })),
      { role: "user" as const, content: query },
    ];

    const response = await this.llm.invoke(messages);
    const text = typeof response.content === "string" ? response.content : String(response.content);

    const usage = (response as { response_metadata?: { tokenUsage?: { prompt_tokens_details?: { cached_tokens?: number } } } })
      ?.response_metadata?.tokenUsage;
    const cached = usage?.prompt_tokens_details?.cached_tokens;
    if (typeof cached === "number" && cached > 0) {
      console.log(`[chat-assistant] OpenAI prompt cache hit: ${cached} cached tokens`);
    }

    return text;
  }

  verifyResponse(response: string): boolean {
    const keyTerms = [
      "cymasphere",
      "song",
      "standalone",
      "plugin",
      "daw",
      "chord",
      "melody",
      "harmony",
      "pricing",
      "trial",
      "monthly",
      "yearly",
      "lifetime",
      "palette",
      "voicing",
    ];
    const lower = response.toLowerCase();
    const grounded = keyTerms.some((term) => lower.includes(term));

    const looksLikeDiscovery =
      response.trim().endsWith("?") ||
      /what|which|how|when|who|why/i.test(response.split("\n")[0] || "");

    const isEmpathetic =
      lower.includes("totally get") ||
      lower.includes("every musician") ||
      lower.includes("so common") ||
      lower.includes("creative") ||
      lower.includes("feeling stuck") ||
      lower.includes("support@cymasphere") ||
      lower.includes("discord.gg");

    const denylist = [
      "web-based platform",
      "browser-based daw",
      "mobile app only",
      "ios only",
      "android only",
      "ai generates full songs automatically without input",
      "no daw support",
    ];
    const hitsDenylist = denylist.some((term) => lower.includes(term));
    const tooShort = response.trim().length < 20;

    return (grounded || looksLikeDiscovery || isEmpathetic) && !tooShort && !hitsDenylist;
  }
}

export const cymasphereChatAssistant = new CymasphereChatAssistant();
