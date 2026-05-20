/**
 * @fileoverview Admin AI support response generator API endpoint
 * 
 * This endpoint generates AI-powered support ticket responses using OpenAI GPT.
 * Provides context from the current ticket conversation, all tickets for pattern
 * recognition, and a comprehensive Cymasphere knowledge base. Falls back to
 * template responses if OpenAI is unavailable. Requires admin authentication.
 * 
 * @module api/admin/support-tickets/ai-response
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAdmin } from "@/app/actions/user-management";
import OpenAI from "openai";
import { CYMASPHERE_KNOWLEDGE_BASE } from "@/lib/cymasphere-knowledge-base";

/**
 * OpenAI client instance initialized with API key from environment variables
 * Null if API key is not configured
 */
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

/**
 * @brief POST endpoint to generate AI-powered support ticket response
 * 
 * Generates a professional support response using OpenAI GPT-4o-mini with
 * context from the current ticket conversation, all tickets for pattern
 * recognition, and the Cymasphere knowledge base. Falls back to template
 * responses if OpenAI is unavailable or encounters errors.
 * 
 * Request body (JSON):
 * - prompt: User's prompt/instruction for the AI (required)
 * - ticketId: Current ticket ID to include conversation context (optional)
 * - allTickets: Array of all tickets for pattern recognition (optional)
 * 
 * Responses:
 * 
 * 200 OK - Success (AI response):
 * ```json
 * {
 *   "success": true,
 *   "response": "Thank you for contacting Cymasphere support! Based on your message..."
 * }
 * ```
 * 
 * 200 OK - Success (fallback response):
 * ```json
 * {
 *   "success": true,
 *   "response": "Thank you for contacting Cymasphere support!...",
 *   "isFallback": true,
 *   "error": "OpenAI API key not configured - using template response"
 * }
 * ```
 * 
 * 400 Bad Request - Missing prompt:
 * ```json
 * {
 *   "error": "Prompt is required"
 * }
 * ```
 * 
 * 401 Unauthorized - Not admin:
 * ```json
 * {
 *   "error": "Unauthorized"
 * }
 * ```
 * 
 * @param request Next.js request object containing JSON body with prompt and context
 * @returns NextResponse with AI-generated response or fallback template
 * @note Requires admin authentication
 * @note Uses GPT-4o-mini model for cost-effective responses
 * @note Includes full conversation thread if ticketId provided
 * @note Falls back to template responses if OpenAI unavailable
 * @note Template responses are context-aware based on prompt keywords
 * 
 * @example
 * ```typescript
 * // POST /api/admin/support-tickets/ai-response
 * // Body: { prompt: "Write a response about refunds", ticketId: "uuid", allTickets: [...] }
 * // Returns: { success: true, response: "Thank you for contacting..." }
 * ```
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  if (!(await checkAdmin(supabase))) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { prompt, ticketId, allTickets } = body;

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json(
      { error: "Prompt is required" },
      { status: 400 }
    );
  }

  try {
    if (!openai) {
      // If OpenAI is not configured, use fallback
      console.log('[AI Response] OpenAI client not initialized - API key missing');
      const fallbackResponse = generateFallbackResponse(prompt, '');
      return NextResponse.json({
        success: true,
        response: fallbackResponse,
        isFallback: true,
        error: "OpenAI API key not configured - using template response"
      });
    }
    
    console.log('[AI Response] OpenAI client initialized, proceeding with API call');

    // Get the current ticket details if ticketId is provided
    let currentTicketContext = '';
    if (ticketId) {
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .select(`
          *,
          support_messages (
            id,
            content,
            is_admin,
            created_at,
            user_id
          )
        `)
        .eq("id", ticketId)
        .single();

      if (!ticketError && ticket) {
        // Get user email from profile
        let customerEmail = 'N/A';
        if (ticket.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", ticket.user_id)
            .single();
          customerEmail = profile?.email || 'N/A';
        }

        const messages = (ticket.support_messages || []).sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Format conversation history with clear structure and message numbers
        const conversationHistory = messages.map((msg: any, index: number) => {
          const timestamp = new Date(msg.created_at).toLocaleString();
          const role = msg.is_admin ? 'Support Agent (You)' : 'Customer';
          const messageNum = index + 1;
          return `Message ${messageNum} [${timestamp}] - ${role}:\n${msg.content}`;
        }).join('\n\n---\n\n');

        currentTicketContext = `
## CURRENT SUPPORT TICKET - FULL CONVERSATION THREAD

**Ticket Information:**
- Ticket #${ticket.ticket_number}: ${ticket.subject}
- Status: ${ticket.status}
- Customer Email: ${customerEmail}
- Created: ${new Date(ticket.created_at).toLocaleString()}
- Last Updated: ${ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : 'N/A'}

**Original Issue Description:**
${ticket.description || 'N/A'}

**COMPLETE CONVERSATION THREAD** (in chronological order, ${messages.length} total messages):
${conversationHistory || 'No messages yet - this is a new ticket.'}

---
**END OF CONVERSATION THREAD**

**IMPORTANT**: Read the entire conversation above carefully. The customer's questions, concerns, and any issues they've mentioned are in the messages above. Your response should directly address what the customer has said in this conversation.
`;
      }
    }

    // Format all tickets as context (for pattern recognition and similar issues)
    let allTicketsContext = '';
    if (allTickets && Array.isArray(allTickets) && allTickets.length > 0) {
      // Sort by most recent first, limit to 100 most recent tickets
      const sortedTickets = [...allTickets]
        .sort((a: any, b: any) => {
          const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
          const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 100);

      allTicketsContext = `
## All Support Tickets Context (for reference and pattern recognition)

This section contains information about other support tickets to help you:
- Recognize similar issues or patterns
- Reference how similar problems were resolved
- Understand common customer concerns
- Maintain consistency in responses

**Recent Tickets** (${sortedTickets.length} tickets shown):
${sortedTickets.map((ticket: any) => {
  const createdDate = ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A';
  const description = ticket.description ? (ticket.description.length > 150 ? ticket.description.substring(0, 150) + '...' : ticket.description) : 'No description';
  return `- **Ticket #${ticket.ticket_number}** (${ticket.status}): ${ticket.subject}
  - Customer: ${ticket.user_email || 'Unknown'}
  - Created: ${createdDate}
  - Issue: ${description}`;
}).join('\n\n')}

**Note**: Use this context to identify patterns and similar issues, but always prioritize the CURRENT ticket conversation when writing your response.
`;
    }

    // Build the user prompt with conversation context prominently featured
    let userPrompt = '';
    
    if (currentTicketContext) {
      userPrompt = `${currentTicketContext}\n\n---\n\n**Your Task**: ${prompt}\n\nPlease write a response based on the conversation above.`;
    } else {
      userPrompt = prompt;
    }

    // Build the system prompt with knowledge base
    const systemPrompt = `You are a helpful support agent for Cymasphere, a music creation software. Your role is to help write professional, friendly, and helpful responses to customer support tickets.

${CYMASPHERE_KNOWLEDGE_BASE}

${allTicketsContext ? `\n${allTicketsContext}\n` : ''}

**CRITICAL INSTRUCTIONS:**
- Read the ENTIRE conversation thread provided in the user message
- Address the customer's specific questions and concerns from the conversation
- Reference previous messages in the thread to show you understand the context
- Write responses that are professional, empathetic, and solution-oriented
- Use information from the knowledge base above when relevant
- Keep responses concise but complete
- Use a friendly, helpful tone
- If you don't know something, suggest contacting support@cymasphere.com
- Always be respectful and patient`;

    // Generate AI response
    let response: string;
    
    try {
      console.log('[AI Response] Attempting to connect to OpenAI API...');
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      response = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
      console.log('[AI Response] Successfully received response from OpenAI API');
    } catch (apiError: any) {
      // If OpenAI API fails (quota, errors, etc.), provide a helpful fallback response
      console.error("OpenAI API error:", apiError);
      
      // Generate a basic template response based on the prompt
      response = generateFallbackResponse(prompt, currentTicketContext);
      
      // Still return success but indicate it's a fallback
      return NextResponse.json({
        success: true,
        response,
        isFallback: true,
        error: apiError?.status === 429 
          ? "OpenAI quota exceeded - using template response"
          : apiError?.status === 401
          ? "OpenAI API key issue - using template response"
          : "OpenAI API error - using template response"
      });
    }

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error: any) {
    console.error("Error generating AI response:", error);
    
    // Final fallback - generate a basic response
    // Note: body was already parsed above, so we use the prompt from there
    const fallbackResponse = generateFallbackResponse(prompt || "", "");
    
    return NextResponse.json({
      success: true,
      response: fallbackResponse,
      isFallback: true,
      error: "Error occurred - using template response"
    });
  }
}

/**
 * @brief Generates fallback template response when OpenAI is unavailable
 * 
 * Creates context-aware template responses based on prompt keywords when
 * OpenAI API is unavailable, quota exceeded, or encounters errors. Provides
 * helpful responses for common support scenarios like refunds, installation,
 * trials, pricing, and features.
 * 
 * @param prompt User's prompt/instruction
 * @param ticketContext Current ticket context (optional)
 * @returns Template response string based on prompt keywords
 * @note Uses keyword matching to provide relevant template responses
 * @note Falls back to generic helpful response if no keywords match
 * 
 * @example
 * ```typescript
 * const response = generateFallbackResponse("How do I get a refund?", "");
 * // Returns: Template refund response
 * ```
 */
function generateFallbackResponse(prompt: string, ticketContext: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  // Basic template responses based on common support scenarios
  if (lowerPrompt.includes("refund") || lowerPrompt.includes("money back")) {
    return `Thank you for reaching out. I understand your concern about a refund.

Cymasphere offers a free trial period to ensure the software meets your needs before making a purchase. As a digital software product, we generally do not offer refunds after purchase, as stated in our refund policy.

However, I'd be happy to help troubleshoot any issues you're experiencing. Could you please share more details about what's not working as expected? Our support team is here to help make sure you get the most out of Cymasphere.

If you have specific technical issues, please let me know and I'll do my best to assist you.`;
  }
  
  if (lowerPrompt.includes("install") || lowerPrompt.includes("installation") || lowerPrompt.includes("setup")) {
    return `I'd be happy to help you with installation!

**Windows:**
- Standalone: Install to C:\\ (default location)
- VST3: Install to your DAW's VST3 plugin folder

**macOS:**
- Standalone: Install to /Applications/
- AU Plugin: Install to /Library/Audio/Plug-Ins/Components/
- VST3: Install to /Library/Audio/Plug-Ins/VST3/

On first launch, you'll need to log in with your Cymasphere account credentials.

If you're having trouble with a specific DAW integration, let me know which DAW you're using and I can provide more specific guidance.`;
  }
  
  if (lowerPrompt.includes("trial") || lowerPrompt.includes("free")) {
    return `Great question about our trial options!

Cymasphere offers two trial options:
- **7-day free trial** - No credit card required
- **14-day free trial** - With a card on file (you won't be charged until the trial ends)

Both options give you full access to all premium features. After your trial ends, you can choose from our subscription plans:
- Monthly: $6/month
- Annual: $59/year (save 25%)
- Lifetime: $149 one-time payment

Is there anything specific about the trial or features you'd like to know more about?`;
  }
  
  if (lowerPrompt.includes("pricing") || lowerPrompt.includes("price") || lowerPrompt.includes("cost")) {
    return `Here's our simple pricing:

- **Monthly**: $6/month - Most flexible, cancel anytime
- **Annual**: $59/year - Save 25% with yearly billing
- **Lifetime**: $149 one-time payment - Best value, all future updates included

All plans include full access to all features. We also offer free trials so you can try before you buy.

Which plan interests you most?`;
  }
  
  if (lowerPrompt.includes("feature") || lowerPrompt.includes("what can") || lowerPrompt.includes("capabilities")) {
    return `Cymasphere is a complete song creation suite with powerful features:

**Key Features:**
- Song Builder with multi-track management
- Intelligent Pattern Editor & Chord Adaptation
- Gestural Harmony Palette Interface
- Advanced Voice Leading & Chord Voicings
- Interactive Chord Progression Timeline
- Complete Voice and Range Control
- Standalone App & DAW Plugin Support (AU/VST3)
- Real-Time Chord Reharmonization Tools

It works as both a standalone application and as a plugin in your DAW. Would you like more details about any specific feature?`;
  }
  
  // Default helpful response
  return `Thank you for contacting Cymasphere support!

${ticketContext ? `Based on the ticket information, ` : ''}I'm here to help. Could you please provide a bit more detail about what you need assistance with? 

Some common topics I can help with:
- Installation and setup
- Feature questions
- DAW integration
- Troubleshooting technical issues
- Billing and subscription questions

Feel free to share more details, and I'll do my best to assist you!

If you need immediate assistance, you can also reach us at support@cymasphere.com or join our Discord community.`;
}

