import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Types
export interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  timestamp: string;
  audioUrl?: string;
  transcription?: string;
}

export interface Conversation {
  id: string;
  sessionId: string;
  channel: "CHAT" | "VOICE";
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
  bigIdea?: string;
  features?: string;
  timeline?: string;
  budget?: string;
  techPreferences?: string;
  feasibilityScore?: number;
  feasibilityNotes?: string;
  recommendedTechStack?: string;
  messages: ChatMessage[];
  report?: Report;
}

export interface Report {
  id: string;
  conversationId: string;
  summary: string;
  feasibility: string;
  techStack: string;
  recommendations: string;
  riskFactors: string;
  estimatedCost?: string;
  estimatedTimeline?: string;
  createdAt: string;
}

export interface ChatMessageRequest {
  sessionId: string;
  message: string;
}

export interface ChatMessageResponse {
  success: boolean;
  message: ChatMessage;
  conversation: Conversation;
  isComplete: boolean;
}

export interface ConversationStats {
  total: number;
  active: number;
  completed: number;
}

// API functions
export const chatAPI = {
  // Send a chat message
  sendMessage: async (
    sessionId: string,
    message: string
  ): Promise<ChatMessageResponse> => {
    const response = await api.post("/api/chat/message", {
      sessionId,
      message,
    });
    return response.data;
  },

  // Get conversation by session ID
  getConversation: async (sessionId: string): Promise<Conversation> => {
    const response = await api.get(`/api/chat/conversation/${sessionId}`);
    return response.data.conversation;
  },

  // Create a new conversation
  createConversation: async (
    sessionId: string,
    channel: "CHAT" | "VOICE" = "CHAT"
  ): Promise<Conversation> => {
    const response = await api.post("/api/chat/conversation", {
      sessionId,
      channel,
    });
    return response.data.conversation;
  },

  // Generate report for a conversation
  generateReport: async (sessionId: string): Promise<Report> => {
    const response = await api.post(`/api/chat/report/${sessionId}`);
    return response.data.report;
  },

  // Get conversation statistics
  getStats: async (): Promise<ConversationStats> => {
    const response = await api.get("/api/chat/stats");
    return response.data.stats;
  },
};

export const voiceAPI = {
  // Process voice transcription
  transcribe: async (
    audioUrl: string,
    sessionId: string,
    phoneNumber?: string
  ) => {
    const response = await api.post("/api/voice/transcribe", {
      audioUrl,
      sessionId,
      phoneNumber,
    });
    return response.data;
  },
};

// Error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
