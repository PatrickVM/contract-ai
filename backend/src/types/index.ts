import {
  Conversation,
  Message,
  Report,
  Channel,
  ConversationStatus,
  MessageRole,
} from "@prisma/client";

// Database types
export type ConversationWithMessages = Conversation & {
  messages: Message[];
  report?: Report | null;
};

export type MessageWithConversation = Message & {
  conversation: Conversation;
};

// API Request/Response types
export interface ChatMessageRequest {
  sessionId: string;
  message: string;
}

export interface ChatMessageResponse {
  success: boolean;
  message: Message;
  conversation: ConversationWithMessages;
  isComplete: boolean;
}

export interface VoiceWebhookRequest {
  call_sid: string;
  from: string;
  to: string;
  direction: string;
  status: string;
  recording_url?: string;
  transcription_text?: string;
  speech?: string;
}

export interface VoiceWebhookResponse {
  success: boolean;
  message?: string;
  next_action?: string;
}

// AI Service types
export interface ProjectDetails {
  bigIdea?: string;
  features?: string;
  timeline?: string;
  budget?: string;
  techPreferences?: string;
}

export interface AIResponse {
  message: string;
  isComplete: boolean;
  projectDetails?: Partial<ProjectDetails>;
  nextQuestion?: string;
}

export interface ReportData {
  summary: string;
  feasibility: string;
  techStack: string;
  recommendations: string;
  riskFactors: string;
  estimatedCost?: string;
  estimatedTimeline?: string;
}

// Voice Service types
export interface TranscriptionRequest {
  audioUrl: string;
  model?: string;
}

export interface TranscriptionResponse {
  text: string;
  confidence: number;
}

export interface TTSRequest {
  text: string;
  voice?: string;
}

export interface TTSResponse {
  audioUrl: string;
  duration: number;
}

// Error types
export interface APIError {
  message: string;
  code: string;
  status: number;
}

// Session types
export interface SessionData {
  sessionId: string;
  channel: Channel;
  phoneNumber?: string;
}

// Validation schemas
export interface ValidationError {
  field: string;
  message: string;
}
