import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { cymasphereRAG } from '@/lib/rag';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatRequest {
  message: string;
  conversationHistory: ChatMessage[];
}

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Sales-focused responses and FAQ data
const FAQ_RESPONSES = {
  pricing: {
    keywords: ['price', 'cost', 'pricing', 'subscription', 'plan', 'free', 'trial', 'money'],
    response: "For current pricing and plans, please check the pricing section on the Cymasphere website. What specific pricing questions do you have?"
  },
  features: {
    keywords: ['feature', 'tool', 'synthesizer', 'drum', 'instrument', 'effect', 'what can', 'capabilities'],
    response: "To see all available features and tools, please visit the features section on the Cymasphere website. What are you hoping to create?"
  },
  getting_started: {
    keywords: ['start', 'begin', 'how to', 'tutorial', 'learn', 'new user', 'first time'],
    response: "Check out the getting started guide and tutorials on the Cymasphere website. What would you like to learn first?"
  },
  support: {
    keywords: ['help', 'support', 'problem', 'issue', 'bug', 'contact', 'customer service'],
    response: "For support, please visit the help center on the Cymasphere website or contact support directly. What specific issue are you having?"
  },
  comparison: {
    keywords: ['vs', 'compare', 'better than', 'alternative', 'competitor', 'fl studio', 'ableton', 'logic'],
    response: "To see how Cymasphere compares to other tools, check the comparison information on the website. What are you currently using?"
  },
  technical: {
    keywords: ['system requirements', 'specs', 'compatible', 'browser', 'device', 'performance'],
    response: "For technical requirements and compatibility, please check the system requirements section on the Cymasphere website. What device are you planning to use?"
  }
};

const SALES_RESPONSES = {
  trial: {
    keywords: ['trial', 'test', 'try', 'demo', 'sample'],
    response: "To learn about trial options, please check the Cymasphere website. What are you hoping to test out?"
  },
  upgrade: {
    keywords: ['upgrade', 'premium', 'pro', 'studio', 'paid'],
    response: "For upgrade options and premium features, please visit the pricing section on the Cymasphere website. What features are you most interested in?"
  },
  pricing_concerns: {
    keywords: ['expensive', 'cheap', 'worth', 'value', 'affordable'],
    response: "For detailed pricing and value information, please check the pricing section on the Cymasphere website. What's your budget range?"
  }
};

function detectIntent(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  // Check for sales intents first
  for (const [intent, data] of Object.entries(SALES_RESPONSES)) {
    if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return intent;
    }
  }
  
  // Then check FAQ intents
  for (const [intent, data] of Object.entries(FAQ_RESPONSES)) {
    if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return intent;
    }
  }
  
  return null;
}

async function generateAIResponse(message: string, conversationHistory: ChatMessage[]): Promise<string> {
  // Check if OpenAI is available
  if (!openai) {
    console.log('OpenAI API key not configured, using fallback responses');
    return generateFallbackResponse(message);
  }

  try {
    // Layer 1: RAG - Retrieve relevant context from knowledge base
    const context = await cymasphereRAG.retrieveRelevantContext(message);
    
    // Layer 2: Generate response with retrieved context
    const response = await cymasphereRAG.generateResponse(message, conversationHistory);
    
    // Layer 3: Verification - Fact-check the response against context
    const isVerified = await cymasphereRAG.verifyResponse(response, context);
    
    if (!isVerified) {
      console.log('Response failed verification, using fallback');
      return generateFallbackResponse(message);
    }
    
    return response;
  } catch (error) {
    console.error('RAG system error:', error);
    // Fallback to keyword-based responses if RAG fails
    return generateFallbackResponse(message);
  }
}

function generateFallbackResponse(message: string): string {
  const intent = detectIntent(message);
  
  if (intent && SALES_RESPONSES[intent as keyof typeof SALES_RESPONSES]) {
    return SALES_RESPONSES[intent as keyof typeof SALES_RESPONSES].response;
  }
  
  if (intent && FAQ_RESPONSES[intent as keyof typeof FAQ_RESPONSES]) {
    return FAQ_RESPONSES[intent as keyof typeof FAQ_RESPONSES].response;
  }
  
  // Default responses for common questions (NEPQ-optimized)
  if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
    return "Hello! I'm here to help you explore Cymasphere. What's the main result you're hoping to create right now?";
  }
  
  if (message.toLowerCase().includes('thank')) {
    return "You're welcome! Is there anything else I can help you with today?";
  }
  
  if (message.toLowerCase().includes('bye') || message.toLowerCase().includes('goodbye')) {
    return "Thanks for chatting! Feel free to come back anytime if you have more questions.";
  }
  
  // General helpful response using NEPQ methodology (ask ONE high-impact question)
  return "I don't know that information. I can help with Cymasphere. What feels most challenging right now—chord progressions, melodies, or arranging your song?";
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, conversationHistory } = body;
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Generate AI response
    const response = await generateAIResponse(message, conversationHistory);
    
    return NextResponse.json({
      response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
