import { prisma } from "./database";
import { AIService } from "./ai";
import { ConversationWithMessages, ProjectDetails, AIResponse } from "../types";
import { Channel, MessageRole } from "@prisma/client";

export class ConversationService {
  static async createConversation(
    sessionId: string,
    channel: Channel = "CHAT",
    phoneNumber?: string
  ): Promise<ConversationWithMessages> {
    try {
      const conversation = await prisma.conversation.create({
        data: {
          sessionId,
          channel,
          phoneNumber,
          status: "ACTIVE",
        },
        include: {
          messages: true,
          report: true,
        },
      });

      // Add initial system message
      await this.addMessage(
        conversation.id,
        "SYSTEM",
        "Hello! I'm here to help you plan your software project. Let's start by understanding your vision. What is the main idea or concept for your project?"
      );

      return conversation;
    } catch (error) {
      console.error("Create Conversation Error:", error);
      throw new Error("Failed to create conversation");
    }
  }

  static async getConversation(
    sessionId: string
  ): Promise<ConversationWithMessages | null> {
    try {
      return await prisma.conversation.findUnique({
        where: { sessionId },
        include: {
          messages: {
            orderBy: { timestamp: "asc" },
          },
          report: true,
        },
      });
    } catch (error) {
      console.error("Get Conversation Error:", error);
      throw new Error("Failed to get conversation");
    }
  }

  static async addMessage(
    conversationId: string,
    role: MessageRole,
    content: string,
    audioUrl?: string,
    transcription?: string
  ): Promise<any> {
    try {
      return await prisma.message.create({
        data: {
          conversationId,
          role,
          content,
          audioUrl,
          transcription,
        },
      });
    } catch (error) {
      console.error("Add Message Error:", error);
      throw new Error("Failed to add message");
    }
  }

  static async processUserMessage(
    sessionId: string,
    userMessage: string,
    channel: Channel = "CHAT"
  ): Promise<AIResponse> {
    try {
      // Get or create conversation
      let conversation = await this.getConversation(sessionId);
      if (!conversation) {
        conversation = await this.createConversation(sessionId, channel);
      }

      // Add user message
      await this.addMessage(conversation.id, "USER", userMessage);

      // Get conversation history
      const conversationHistory = this.buildConversationHistory(
        conversation.messages
      );

      // Extract current project details
      const projectDetails = this.extractProjectDetails(conversation);

      // Generate AI response
      const aiResponse = await AIService.generateResponse(
        userMessage,
        conversationHistory,
        projectDetails
      );

      // Add AI response to conversation
      await this.addMessage(conversation.id, "ASSISTANT", aiResponse.message);

      // Update conversation with new project details
      if (aiResponse.projectDetails) {
        await this.updateProjectDetails(
          conversation.id,
          aiResponse.projectDetails
        );
      }

      // Mark conversation as complete if all details are collected
      if (aiResponse.isComplete) {
        await this.completeConversation(conversation.id);
      }

      return aiResponse;
    } catch (error) {
      console.error("Process User Message Error:", error);
      throw new Error("Failed to process user message");
    }
  }

  static async processVoiceMessage(
    sessionId: string,
    audioUrl: string,
    phoneNumber: string
  ): Promise<AIResponse> {
    try {
      // Get or create conversation
      let conversation = await this.getConversation(sessionId);
      if (!conversation) {
        conversation = await this.createConversation(
          sessionId,
          "VOICE",
          phoneNumber
        );
      }

      // TODO: Implement transcription using VoiceService
      // const transcription = await VoiceService.transcribeAudio({ audioUrl });
      const transcription = "Mock transcription - implement with VoiceService";

      // Process the transcribed message
      return await this.processUserMessage(sessionId, transcription, "VOICE");
    } catch (error) {
      console.error("Process Voice Message Error:", error);
      throw new Error("Failed to process voice message");
    }
  }

  static async generateReport(sessionId: string): Promise<any> {
    try {
      const conversation = await this.getConversation(sessionId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Extract project details
      const projectDetails: ProjectDetails = {
        bigIdea: conversation.bigIdea || "",
        features: conversation.features || "",
        timeline: conversation.timeline || "",
        budget: conversation.budget || "",
        techPreferences: conversation.techPreferences || "",
      };

      // Generate report using AI
      const reportData = await AIService.generateReport(projectDetails);

      // Save report to database
      const report = await prisma.report.create({
        data: {
          conversationId: conversation.id,
          summary: reportData.summary,
          feasibility: reportData.feasibility,
          techStack: reportData.techStack,
          recommendations: reportData.recommendations,
          riskFactors: reportData.riskFactors,
          estimatedCost: reportData.estimatedCost,
          estimatedTimeline: reportData.estimatedTimeline,
        },
      });

      return report;
    } catch (error) {
      console.error("Generate Report Error:", error);
      throw new Error("Failed to generate report");
    }
  }

  private static buildConversationHistory(messages: any[]): string {
    return messages
      .filter((msg) => msg.role !== "SYSTEM")
      .map(
        (msg) => `${msg.role === "USER" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n");
  }

  private static extractProjectDetails(
    conversation: ConversationWithMessages
  ): Partial<ProjectDetails> {
    return {
      bigIdea: conversation.bigIdea || undefined,
      features: conversation.features || undefined,
      timeline: conversation.timeline || undefined,
      budget: conversation.budget || undefined,
      techPreferences: conversation.techPreferences || undefined,
    };
  }

  private static async updateProjectDetails(
    conversationId: string,
    projectDetails: Partial<ProjectDetails>
  ): Promise<void> {
    try {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: projectDetails,
      });
    } catch (error) {
      console.error("Update Project Details Error:", error);
      throw new Error("Failed to update project details");
    }
  }

  private static async completeConversation(
    conversationId: string
  ): Promise<void> {
    try {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: "COMPLETED" },
      });
    } catch (error) {
      console.error("Complete Conversation Error:", error);
      throw new Error("Failed to complete conversation");
    }
  }

  static async getConversationStats(): Promise<any> {
    try {
      const [total, active, completed] = await Promise.all([
        prisma.conversation.count(),
        prisma.conversation.count({ where: { status: "ACTIVE" } }),
        prisma.conversation.count({ where: { status: "COMPLETED" } }),
      ]);

      return { total, active, completed };
    } catch (error) {
      console.error("Get Stats Error:", error);
      throw new Error("Failed to get conversation stats");
    }
  }
}
