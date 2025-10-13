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
  smalltalk: {
    keywords: [
      'how are you',
      "how's it going",
      'hows it going',
      "what's up",
      'whats up',
      'sup',
      'yo',
      'hey there'
    ],
    response: "I'm doing great and ready to help with your music. Are you focusing on chord progressions, melodies, or arranging a full song?"
  },
  pricing: {
    keywords: ['price', 'cost', 'pricing', 'subscription', 'plan', 'free', 'trial', 'money'],
    response: "Cymasphere keeps pricing simple—Monthly $6, Yearly $59 (save 25%), Lifetime $149. Which option best fits how you plan to use Cymasphere?"
  },
  features: {
    keywords: ['feature', 'tool', 'synthesizer', 'drum', 'instrument', 'effect', 'what can', 'capabilities'],
    response: "Cymasphere helps with chords, melody patterns, voice-led progressions, and DAW integration (AU/VST3/Standalone). What are you creating—progressions, melodies, or arranging a full song?"
  },
  getting_started: {
    keywords: ['start', 'begin', 'how to', 'tutorial', 'learn', 'new user', 'first time'],
    response: "Quick start: build a chord progression with the Harmony Palette, enable Voicing Generator for smooth transitions, then add a melody in the Dynamic Pattern Editor. Would you like a 3-step guide for your DAW?"
  },
  support: {
    keywords: ['help', 'support', 'problem', 'issue', 'bug', 'contact', 'customer service'],
    response: "I can help troubleshoot. Cymasphere includes built-in help and premium support. What’s blocking you right now in your workflow?"
  },
  comparison: {
    keywords: ['vs', 'compare', 'better than', 'alternative', 'competitor', 'fl studio', 'ableton', 'logic'],
    response: "Cymasphere complements your DAW by generating harmonically sound progressions, voice-led voicings, and adaptive melody patterns. What DAW are you using so I can tailor guidance?"
  },
  technical: {
    keywords: ['system requirements', 'specs', 'compatible', 'browser', 'device', 'performance'],
    response: "Cymasphere runs as Standalone, AU (macOS), and VST3—works with major DAWs on Mac/Windows. What OS and DAW are you on?"
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
  
  // Default responses for common questions (NEPQ-optimized, value-weaving)
  if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
    return "Hello! I'm here to help you explore Cymasphere—tools for harmony, melody, and arrangement that integrate with your DAW. What's the main result you're hoping to create right now?";
  }

  // Handle ultra-short smalltalk like just "what" or "what?"
  const trimmed = message.trim().toLowerCase();
  if (trimmed === 'what' || trimmed === 'what?') {
    return "I'm here to help with your music. What are you working on—chord progressions, melodies, or arranging your track?";
  }
  
  if (message.toLowerCase().includes('thank')) {
    return "You're welcome! Is there anything else I can help you with today?";
  }
  
  if (message.toLowerCase().includes('bye') || message.toLowerCase().includes('goodbye')) {
    return "Thanks for chatting! Feel free to come back anytime if you have more questions.";
  }
  
  // Handle musical struggles and emotional questions with empathy
  if (message.toLowerCase().includes('sucks') || 
      message.toLowerCase().includes('terrible') || 
      message.toLowerCase().includes('bad at music') ||
      message.toLowerCase().includes('not good') ||
      message.toLowerCase().includes('awful')) {
    return "I totally get that feeling - every musician has been there! The good news is that Cymasphere is designed to help you create musically satisfying results even when you're feeling stuck. It guides you toward chord progressions and melodies that work together harmonically. What's the main thing that's frustrating you right now - getting started, or feeling like your ideas don't sound right?";
  }

  if (message.toLowerCase().includes('stuck') || 
      message.toLowerCase().includes('rut') ||
      message.toLowerCase().includes('blocked') ||
      message.toLowerCase().includes('can\'t create')) {
    return "Creative blocks are so common! Cymasphere can help break you out of that rut by suggesting new harmonic possibilities and chord progressions you might not have considered. The Harmony Palette lets you explore different musical directions visually. What type of music are you trying to create - are you working on chord progressions, melodies, or full arrangements?";
  }

  if (message.toLowerCase().includes('theory') && 
      (message.toLowerCase().includes('don\'t know') || 
       message.toLowerCase().includes('confused') ||
       message.toLowerCase().includes('hard'))) {
    return "You don't need to know music theory to use Cymasphere! That's actually one of its biggest strengths - it handles all the complex theory behind the scenes while you focus on creating. The visual interfaces help you understand musical relationships intuitively as you work. What would you like to create - chord progressions, melodies, or full songs?";
  }

  // General helpful response using NEPQ methodology (ask ONE high-impact question) and always tie back to Cymasphere
  return "I don't know that information. Cymasphere helps producers, composers, songwriters, students, and educators with chords, melody patterns, and voice-led progressions. What feels most challenging right now—chord progressions, melodies, or arranging your song?";
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
