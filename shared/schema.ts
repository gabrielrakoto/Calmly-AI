import { z } from "zod";

// Contact Form Schema
export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  category: z.enum(["bug", "feature", "general"]).optional(),
});

export type ContactForm = z.infer<typeof contactFormSchema>;

// Group Task Management
// Task Schema
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  urgent: z.boolean(),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.enum(["pending", "completed"]),
  createdBy: z.string(),
});

export type Task = z.infer<typeof taskSchema>;

// Chat Message Schema
export const chatMessageSchema = z.object({
  id: z.string(),
  sender: z.string(),
  content: z.string(),
  timestamp: z.string(), // ISO string
  isAI: z.boolean().optional(),
  type: z.enum(["message", "suggestion", "tip"]).optional(),
  readBy: z.array(z.string()).default([]),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Group Member Schema
export const groupMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(["owner", "admin", "member"]),
  email: z.string().optional(),
  avatar: z.string().optional(),
});

export type GroupMember = z.infer<typeof groupMemberSchema>;

// Group Schema
export const groupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  owner: z.string(),
  members: z.array(groupMemberSchema),
  tasks: z.array(taskSchema),
  chat: z.array(chatMessageSchema),
  createdAt: z.string(), // ISO string
  inviteToken: z.string(), // Unique token for invite links
  maxMembers: z.coerce.number().min(1).max(500), // Maximum number of members allowed
  permissions: z.object({
    canAddTasks: z.enum(["owner", "admin", "everyone"]),
  }),
  activeTypers: z.array(z.string()).optional(), // Names of users currently typing
});

export type Group = z.infer<typeof groupSchema>;

// Create Group Schema (for API input)
export const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  ownerName: z.string(),
  ownerEmail: z.string().email("Valid email is required"),
  maxMembers: z.coerce.number().min(1).max(500),
  ownerId: z.string().optional(), // Optional for backward compatibility, but we will send it
});

// Join Group Schema
export const joinGroupSchema = z.object({
  userName: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal('')),
});

export interface ActivityItem {
  id: string;
  message: string;
  timestamp: string;
}

// Message Rewriting
export interface RiskyPhrase {
  text: string;
  startIndex: number;
  endIndex: number;
  suggestion: string;
}

export interface MessageAnalysis {
  _id?: string; // MongoDB ID for deletion
  original: string;
  rewritten: string;
  riskyPhrases: RiskyPhrase[];
  conflictRisk?: number; // Add conflictRisk
  timestamp?: string; // Add timestamp
}

export const messageAnalysisSchema = z.object({
  original: z.string(),
  rewritten: z.string(),
  riskyPhrases: z.array(z.object({
    text: z.string(),
    startIndex: z.number(),
    endIndex: z.number(),
    suggestion: z.string()
  })),
  conflictRisk: z.number().optional(),
  timestamp: z.string().optional()
});
