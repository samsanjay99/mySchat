import { z } from "zod";

// Super AI specific types
export interface SuperAIData {
  chat: {
    id: number;
    user1: {
      id: number;
      fullName: string;
      email: string;
      schatId: string;
      profileImageUrl?: string;
      isOnline: boolean;
      isSuperAI?: boolean;
    };
    user2: {
      id: number;
      fullName: string;
      email: string;
      schatId: string;
      profileImageUrl?: string;
      isOnline: boolean;
      isSuperAI?: boolean;
    };
    messages: {
      id: number;
      content: string;
      createdAt: string;
      senderId: number;
      status: string;
    }[];
    updatedAt: string;
  };
  aiUser: {
    id: number;
    fullName: string;
    email: string;
    schatId: string;
    profileImageUrl?: string;
    isOnline: boolean;
    isSuperAI?: boolean;
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface SuperAIResponse {
  message: string;
  chatId: number;
  messageId: number;
}

// Zod schemas for validation
export const superAIMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

export const superAIChatResponseSchema = z.object({
  chat: z.object({
    id: z.number(),
    user1: z.object({
      id: z.number(),
      fullName: z.string(),
      email: z.string(),
      schatId: z.string(),
      profileImageUrl: z.string().optional(),
      isOnline: z.boolean(),
      isSuperAI: z.boolean().optional(),
    }),
    user2: z.object({
      id: z.number(),
      fullName: z.string(),
      email: z.string(),
      schatId: z.string(),
      profileImageUrl: z.string().optional(),
      isOnline: z.boolean(),
      isSuperAI: z.boolean().optional(),
    }),
    messages: z.array(z.object({
      id: z.number(),
      content: z.string(),
      createdAt: z.string(),
      senderId: z.number(),
      status: z.string(),
    })),
    updatedAt: z.string(),
  }),
  aiUser: z.object({
    id: z.number(),
    fullName: z.string(),
    email: z.string(),
    schatId: z.string(),
    profileImageUrl: z.string().optional(),
    isOnline: z.boolean(),
    isSuperAI: z.boolean().optional(),
  }),
}); 