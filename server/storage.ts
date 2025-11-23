import { type ContactForm } from "@shared/schema";
import { randomUUID } from "crypto";

export interface ContactSubmission extends ContactForm {
  id: string;
  submittedAt: string;
}

export interface IStorage {
  createContactSubmission(contact: ContactForm): Promise<ContactSubmission>;
  getAllContactSubmissions(): Promise<ContactSubmission[]>;
}

export class MemStorage implements IStorage {
  private contacts: Map<string, ContactSubmission>;

  constructor() {
    this.contacts = new Map();
  }

  async createContactSubmission(contact: ContactForm): Promise<ContactSubmission> {
    const id = randomUUID();
    const submission: ContactSubmission = {
      ...contact,
      id,
      submittedAt: new Date().toISOString(),
    };
    this.contacts.set(id, submission);
    return submission;
  }

  async getAllContactSubmissions(): Promise<ContactSubmission[]> {
    return Array.from(this.contacts.values());
  }
}

export const storage = new MemStorage();
