import { Router } from "express";
import { ConversationService } from "../services/conversation";
import { VoiceWebhookRequest, VoiceWebhookResponse } from "../types";

const router = Router();

// Jambonz webhook for incoming calls
router.post("/webhook/answer", async (req, res) => {
  try {
    const { call_sid, from, to }: VoiceWebhookRequest = req.body;

    console.log("Incoming call:", { call_sid, from, to });

    // Create session ID from call SID
    const sessionId = `voice_${call_sid}`;

    // Create conversation for voice call
    await ConversationService.createConversation(sessionId, "VOICE", from);

    // Jambonz webhook response
    const response: VoiceWebhookResponse = {
      success: true,
      message: "Call answered successfully",
      next_action: "gather",
    };

    // Return Jambonz webhook format
    return res.json({
      verb: "gather",
      input: ["speech"],
      actionHook: `${process.env.BACKEND_URL}/api/voice/webhook/gather`,
      speech: {
        language: "en-US",
        model: "enhanced",
        enhanced: true,
      },
      play: {
        text: "Hello! I'm here to help you plan your software project. What is the main idea or concept for your project?",
        voice: "alice",
      },
    });
  } catch (error) {
    console.error("Answer Hook Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Jambonz webhook for speech input
router.post("/webhook/gather", async (req, res) => {
  try {
    const { call_sid, from, speech }: VoiceWebhookRequest = req.body;

    console.log("Speech input:", { call_sid, from, speech });

    const sessionId = `voice_${call_sid}`;
    const userMessage = speech || "";

    if (!userMessage) {
      // No speech detected, ask again
      return res.json({
        verb: "gather",
        input: ["speech"],
        actionHook: `${process.env.BACKEND_URL}/api/voice/webhook/gather`,
        speech: {
          language: "en-US",
          model: "enhanced",
          enhanced: true,
        },
        play: {
          text: "I didn't catch that. Could you please repeat what you said?",
          voice: "alice",
        },
      });
    }

    // Process the speech input
    const aiResponse = await ConversationService.processUserMessage(
      sessionId,
      userMessage,
      "VOICE"
    );

    // Check if conversation is complete
    if (aiResponse.isComplete) {
      return res.json({
        verb: "gather",
        input: ["speech"],
        actionHook: `${process.env.BACKEND_URL}/api/voice/webhook/finalize`,
        speech: {
          language: "en-US",
          model: "enhanced",
          enhanced: true,
        },
        play: {
          text: `${aiResponse.message} Great! I have all the information I need. I\'ll generate a comprehensive report for you. Would you like me to send it to your email?`,
          voice: "alice",
        },
      });
    }

    // Continue gathering information
    return res.json({
      verb: "gather",
      input: ["speech"],
      actionHook: `${process.env.BACKEND_URL}/api/voice/webhook/gather`,
      speech: {
        language: "en-US",
        model: "enhanced",
        enhanced: true,
      },
      play: {
        text: aiResponse.message,
        voice: "alice",
      },
    });
  } catch (error) {
    console.error("Gather Hook Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Jambonz webhook for finalizing conversation
router.post("/webhook/finalize", async (req, res) => {
  try {
    const { call_sid, from, speech }: VoiceWebhookRequest = req.body;

    console.log("Finalizing call:", { call_sid, from, speech });

    const sessionId = `voice_${call_sid}`;
    const userResponse = speech || "";

    // Generate report
    const report = await ConversationService.generateReport(sessionId);

    let finalMessage =
      "Thank you for sharing your project details with me. I've generated a comprehensive report with feasibility assessment and tech recommendations. ";

    if (
      userResponse.toLowerCase().includes("email") ||
      userResponse.toLowerCase().includes("send")
    ) {
      finalMessage +=
        "I'll send the report to your email address. Have a great day!";
    } else {
      finalMessage +=
        "You can access your report through our web interface. Have a great day!";
    }

    return res.json({
      verb: "play",
      play: {
        text: finalMessage,
        voice: "alice",
      },
      hangup: true,
    });
  } catch (error) {
    console.error("Finalize Hook Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Jambonz webhook for call status updates
router.post("/webhook/status", async (req, res) => {
  try {
    const { call_sid, status }: VoiceWebhookRequest = req.body;

    console.log("Call status update:", { call_sid, status });

    // Handle call status updates (completed, failed, etc.)
    if (status === "completed" || status === "failed") {
      const sessionId = `voice_${call_sid}`;
      // You could update conversation status here if needed
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Status Hook Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// POST /api/voice/transcribe
router.post("/transcribe", async (req, res) => {
  try {
    const { audioUrl, sessionId, phoneNumber } = req.body;

    if (!audioUrl || !sessionId) {
      return res.status(400).json({
        success: false,
        error: "Audio URL and session ID are required",
      });
    }

    // Process voice message
    const aiResponse = await ConversationService.processVoiceMessage(
      sessionId,
      audioUrl,
      phoneNumber || ""
    );

    return res.json({
      success: true,
      response: aiResponse,
    });
  } catch (error) {
    console.error("Transcribe Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
