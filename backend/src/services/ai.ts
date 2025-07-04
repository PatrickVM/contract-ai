import OpenAI from "openai";
import { AIResponse, ProjectDetails, ReportData } from "../types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert AI solutions engineer helping gather software project details. Your role is to:

1. Ask relevant questions to understand the project requirements
2. Guide the conversation to collect: big idea, features, timeline, budget, and tech preferences
3. Provide helpful, professional responses
4. Generate comprehensive project reports with feasibility assessments

Be conversational, professional, and thorough in your questioning.`;

const CONVERSATION_PROMPT = `Based on the conversation history, determine the next appropriate response. 

Current conversation context:
- Big Idea: {bigIdea}
- Features: {features}
- Timeline: {timeline}
- Budget: {budget}
- Tech Preferences: {techPreferences}

If any of these details are missing, ask for them in a natural way. If all details are collected, indicate completion and offer to generate a report.

Respond in a conversational, helpful manner.`;

const REPORT_PROMPT = `Based on the collected project details, generate a comprehensive project assessment report.

Project Details:
- Big Idea: {bigIdea}
- Features: {features}
- Timeline: {timeline}
- Budget: {budget}
- Tech Preferences: {techPreferences}

Generate a structured report with the following sections:

1. **Summary**: Brief overview of the project
2. **Feasibility Assessment**: Technical and business feasibility analysis (1-10 scale)
3. **Recommended Tech Stack**: Specific technologies and frameworks
4. **Recommendations**: Implementation suggestions and best practices
5. **Risk Factors**: Potential challenges and mitigation strategies
6. **Estimated Cost**: Rough cost breakdown
7. **Estimated Timeline**: Realistic timeline for development

Be specific, practical, and provide actionable insights.`;

export class AIService {
  static async generateResponse(
    userMessage: string,
    conversationHistory: string,
    projectDetails: Partial<ProjectDetails>
  ): Promise<AIResponse> {
    try {
      const prompt = CONVERSATION_PROMPT.replace(
        "{bigIdea}",
        projectDetails.bigIdea || "Not provided"
      )
        .replace("{features}", projectDetails.features || "Not provided")
        .replace("{timeline}", projectDetails.timeline || "Not provided")
        .replace("{budget}", projectDetails.budget || "Not provided")
        .replace(
          "{techPreferences}",
          projectDetails.techPreferences || "Not provided"
        );

      const messages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        {
          role: "user" as const,
          content: `Conversation History:\n${conversationHistory}\n\nUser: ${userMessage}\n\n${prompt}`,
        },
      ];

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const aiMessage =
        response.choices[0]?.message?.content ||
        "I apologize, but I encountered an error. Could you please repeat your question?";

      // Check if all project details are collected
      const isComplete = this.checkCompletion(projectDetails);

      return {
        message: aiMessage,
        isComplete,
        projectDetails,
        nextQuestion: isComplete
          ? undefined
          : this.getNextQuestion(projectDetails),
      };
    } catch (error) {
      console.error("AI Service Error:", error);
      return {
        message:
          "I apologize, but I encountered a technical issue. Please try again.",
        isComplete: false,
      };
    }
  }

  static async generateReport(
    projectDetails: ProjectDetails
  ): Promise<ReportData> {
    try {
      const prompt = REPORT_PROMPT.replace(
        "{bigIdea}",
        projectDetails.bigIdea || "Not provided"
      )
        .replace("{features}", projectDetails.features || "Not provided")
        .replace("{timeline}", projectDetails.timeline || "Not provided")
        .replace("{budget}", projectDetails.budget || "Not provided")
        .replace(
          "{techPreferences}",
          projectDetails.techPreferences || "Not provided"
        );

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert software project consultant.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const reportText = response.choices[0]?.message?.content || "";

      // Parse the report into structured sections
      return this.parseReport(reportText);
    } catch (error) {
      console.error("Report Generation Error:", error);
      throw new Error("Failed to generate report");
    }
  }

  private static checkCompletion(
    projectDetails: Partial<ProjectDetails>
  ): boolean {
    return !!(
      projectDetails.bigIdea &&
      projectDetails.features &&
      projectDetails.timeline &&
      projectDetails.budget &&
      projectDetails.techPreferences
    );
  }

  private static getNextQuestion(
    projectDetails: Partial<ProjectDetails>
  ): string {
    if (!projectDetails.bigIdea)
      return "What is the main idea or concept for your project?";
    if (!projectDetails.features)
      return "What are the key features you want to include?";
    if (!projectDetails.timeline)
      return "What is your expected timeline for this project?";
    if (!projectDetails.budget)
      return "What is your budget range for this project?";
    if (!projectDetails.techPreferences)
      return "Do you have any technology preferences or requirements?";
    return "";
  }

  private static parseReport(reportText: string): ReportData {
    // Simple parsing - in production, you might want more sophisticated parsing
    const lines = reportText.split("\n");
    let currentSection = "";
    const sections: Record<string, string> = {};

    for (const line of lines) {
      if (line.includes("**Summary**")) currentSection = "summary";
      else if (line.includes("**Feasibility Assessment**"))
        currentSection = "feasibility";
      else if (line.includes("**Recommended Tech Stack**"))
        currentSection = "techStack";
      else if (line.includes("**Recommendations**"))
        currentSection = "recommendations";
      else if (line.includes("**Risk Factors**"))
        currentSection = "riskFactors";
      else if (line.includes("**Estimated Cost**"))
        currentSection = "estimatedCost";
      else if (line.includes("**Estimated Timeline**"))
        currentSection = "estimatedTimeline";
      else if (currentSection && line.trim()) {
        sections[currentSection] =
          (sections[currentSection] || "") + line.trim() + " ";
      }
    }

    return {
      summary: sections.summary || "Project summary not available",
      feasibility:
        sections.feasibility || "Feasibility assessment not available",
      techStack:
        sections.techStack || "Tech stack recommendations not available",
      recommendations:
        sections.recommendations || "Recommendations not available",
      riskFactors: sections.riskFactors || "Risk factors not available",
      estimatedCost: sections.estimatedCost || undefined,
      estimatedTimeline: sections.estimatedTimeline || undefined,
    };
  }
}
