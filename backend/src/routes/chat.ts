import { Router } from "express";
import { ConversationService } from "../services/conversation";
import { ChatMessageRequest, ChatMessageResponse } from "../types";
import { z } from "zod";

const router = Router();

// Validation schema
const chatMessageSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  message: z.string().min(1, "Message cannot be empty"),
});

// POST /api/chat/message
router.post("/message", async (req, res) => {
  try {
    // Validate request body
    const validation = chatMessageSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors,
      });
    }

    const { sessionId, message }: ChatMessageRequest = validation.data;

    // Process the message
    const aiResponse = await ConversationService.processUserMessage(
      sessionId,
      message
    );

    // Get updated conversation
    const conversation = await ConversationService.getConversation(sessionId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
      });
    }

    // Get the last message (AI response)
    const lastMessage = conversation.messages[conversation.messages.length - 1];

    const response: ChatMessageResponse = {
      success: true,
      message: lastMessage,
      conversation,
      isComplete: aiResponse.isComplete,
    };

    return res.json(response);
  } catch (error) {
    console.error("Chat Message Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/chat/conversation/:sessionId
router.get("/conversation/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const conversation = await ConversationService.getConversation(sessionId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
      });
    }

    return res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Get Conversation Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/chat/conversation
router.post("/conversation", async (req, res) => {
  try {
    const { sessionId, channel = "CHAT" } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "Session ID is required",
      });
    }

    const conversation = await ConversationService.createConversation(
      sessionId,
      channel
    );

    return res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Create Conversation Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/chat/report/:sessionId
router.post("/report/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const report = await ConversationService.generateReport(sessionId);

    return res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Generate Report Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/chat/stats
router.get("/stats", async (req, res) => {
  try {
    const stats = await ConversationService.getConversationStats();

    return res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get Stats Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
