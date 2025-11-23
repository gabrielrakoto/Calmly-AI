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
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignedTo: string;
  dueDate: string;
  status: "completed" | "pending" | "overdue";
}

export interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  members: GroupMember[];
  tasks: Task[];
  isPremium: boolean;
}

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
  original: string;
  rewritten: string;
  riskyPhrases: RiskyPhrase[];
}
