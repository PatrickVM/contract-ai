"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
  Avatar,
} from "@chatscope/chat-ui-kit-react";
import { v4 as uuidv4 } from "uuid";
import { chatAPI, ChatMessage, Conversation } from "@/lib/api";
import { Send, Bot, User, FileText, Phone } from "lucide-react";

interface ChatInterfaceProps {
  sessionId?: string;
}

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(
    sessionId || uuidv4()
  );
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize conversation
  useEffect(() => {
    const initConversation = async () => {
      try {
        setIsLoading(true);
        let conv: Conversation;

        if (sessionId) {
          // Try to get existing conversation
          try {
            conv = await chatAPI.getConversation(sessionId);
          } catch (error) {
            // Create new conversation if not found
            conv = await chatAPI.createConversation(sessionId);
          }
        } else {
          // Create new conversation
          conv = await chatAPI.createConversation(currentSessionId);
        }

        setConversation(conv);
        setMessages(conv.messages.filter((msg) => msg.role !== "SYSTEM"));
      } catch (error) {
        console.error("Failed to initialize conversation:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initConversation();
  }, [sessionId, currentSessionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "USER",
      content: message,
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Send message to API
      const response = await chatAPI.sendMessage(currentSessionId, message);

      // Add AI response
      setMessages((prev) => [...prev, response.message]);
      setConversation(response.conversation);

      // Show report generation option if conversation is complete
      if (response.isComplete) {
        setShowReport(true);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: "ASSISTANT",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!conversation) return;

    try {
      setIsLoading(true);
      const reportData = await chatAPI.generateReport(currentSessionId);
      setReport(reportData);
      setShowReport(false);
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br />");
  };

  if (isLoading && !conversation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="loading-dots mb-4">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="text-gray-600">Initializing chat...</p>
        </div>
      </div>
    );
  }

  if (report) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Project Report</h1>
            <button
              onClick={() => setReport(null)}
              className="text-primary-600 hover:text-primary-700"
            >
              ← Back to Chat
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Summary
              </h2>
              <p className="text-gray-700">{report.summary}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Feasibility Assessment
              </h2>
              <p className="text-gray-700">{report.feasibility}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Recommended Tech Stack
              </h2>
              <p className="text-gray-700">{report.techStack}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Recommendations
              </h2>
              <p className="text-gray-700">{report.recommendations}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Risk Factors
              </h2>
              <p className="text-gray-700">{report.riskFactors}</p>
            </div>

            {report.estimatedCost && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Estimated Cost
                </h2>
                <p className="text-gray-700">{report.estimatedCost}</p>
              </div>
            )}

            {report.estimatedTimeline && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Estimated Timeline
                </h2>
                <p className="text-gray-700">{report.estimatedTimeline}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // NEW: Fallback if conversation is null and not loading
  if (!conversation && !isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">
            Unable to load chat. Please check your backend connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Contract AI
              </h1>
              <p className="text-sm text-gray-500">Project Intake Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">Voice calls available</span>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-hidden">
        <MainContainer responsive>
          <ChatContainer>
            <MessageList
              typingIndicator={
                isTyping ? <TypingIndicator content="AI is typing..." /> : null
              }
            >
              {messages.map((msg) => (
                <Message
                  key={msg.id}
                  model={{
                    message: msg.content,
                    sentTime: new Date(msg.timestamp).toLocaleTimeString(),
                    sender: msg.role === "USER" ? "user" : "assistant",
                    direction: msg.role === "USER" ? "outgoing" : "incoming",
                    position: "single",
                  }}
                >
                  <Message.Header
                    sender={msg.role === "USER" ? "You" : "AI Assistant"}
                    sentTime={new Date(msg.timestamp).toLocaleTimeString()}
                  />
                  <Message.CustomContent>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: formatMessage(msg.content),
                      }}
                      className="prose prose-sm max-w-none"
                    />
                  </Message.CustomContent>
                  <Avatar
                    src={msg.role === "USER" ? undefined : undefined}
                    name={msg.role === "USER" ? "You" : "AI"}
                    size="md"
                  />
                </Message>
              ))}
              <div ref={messagesEndRef} />
            </MessageList>

            {/* Report Generation Prompt */}
            {showReport && (
              <div className="bg-blue-50 border-t border-blue-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Ready to generate your project report?
                      </p>
                      <p className="text-sm text-blue-700">
                        I have all the information needed to create a
                        comprehensive assessment.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateReport}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Generating..." : "Generate Report"}
                  </button>
                </div>
              </div>
            )}

            {/* GUARD: Only render MessageInput if conversation exists */}
            {conversation && !isLoading && (
              <MessageInput
                placeholder="Type your message here..."
                onSend={handleSendMessage}
                attachButton={false}
                disabled={isLoading}
              />
            )}
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
}
