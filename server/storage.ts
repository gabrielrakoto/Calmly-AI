import { type ContactForm, type Group, type GroupMember, type Task, type ChatMessage, createGroupSchema, type MessageAnalysis } from "@shared/schema";
import { randomUUID } from "crypto";
import { z } from "zod";

export interface ContactSubmission extends ContactForm {
  id: string;
  submittedAt: string;
}

export interface IStorage {
  createContactSubmission(contact: ContactForm): Promise<ContactSubmission>;
  getAllContactSubmissions(): Promise<ContactSubmission[]>;
  createGroup(groupData: z.infer<typeof createGroupSchema>): Promise<Group>;
  getGroup(id: string): Promise<Group | undefined>;
  getGroupByInviteToken(token: string): Promise<Group | undefined>;
  addMemberToGroup(groupId: string, memberName: string, email?: string): Promise<{ group: Group, memberId: string }>;
  removeMemberFromGroup(groupId: string, memberId: string): Promise<Group>;
  updateMemberRole(groupId: string, memberId: string, newRole: "owner" | "admin" | "member"): Promise<Group>;
  getGroupsForUser(userId: string): Promise<Group[]>;
  addTaskToGroup(groupId: string, task: Task): Promise<Group>;
  deleteTaskFromGroup(groupId: string, taskId: string): Promise<Group>;
  addMessageToGroup(groupId: string, message: ChatMessage): Promise<Group>;
  markMessageAsRead(groupId: string, messageId: string, userId: string): Promise<Group>;
  deleteGroup(id: string): Promise<boolean>;
  setTypingStatus(groupId: string, userId: string, isTyping: boolean): Promise<void>;
  createMessageAnalysis(analysis: MessageAnalysis): Promise<MessageAnalysis>;
  getMessageAnalysisHistory(): Promise<MessageAnalysis[]>;
  deleteMessageAnalysis(id: string): Promise<boolean>;
  clearMessageAnalysisHistory(): Promise<void>;
  resetAllDataForUser(userId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private groups: Map<string, Group>;
  private contactSubmissions: Map<string, ContactSubmission>;
  private messageAnalysis: Map<string, MessageAnalysis>;
  private typingStatus: Map<string, Map<string, number>>; // groupId -> userId -> timestamp

  constructor() {
    this.groups = new Map();
    this.contactSubmissions = new Map();
    this.messageAnalysis = new Map();
    this.typingStatus = new Map();
  }

  async createContactSubmission(contact: ContactForm): Promise<ContactSubmission> {
    const id = randomUUID();
    const submission: ContactSubmission = {
      ...contact,
      id,
      submittedAt: new Date().toISOString(),
    };
    this.contactSubmissions.set(id, submission);
    return submission;
  }

  async getAllContactSubmissions(): Promise<ContactSubmission[]> {
    return Array.from(this.contactSubmissions.values());
  }

  async createGroup(groupData: z.infer<typeof createGroupSchema>): Promise<Group> {
    const id = "group-" + randomUUID();
    // Default ownerId to a random one if not provided, though it typically should be provided by the caller
    const ownerId = groupData.ownerId || "user-" + randomUUID();
    const inviteToken = randomUUID();

    const newGroup: Group = {
      id,
      name: groupData.name,
      description: groupData.description || "",
      owner: ownerId,
      members: [
        {
          id: ownerId,
          name: groupData.ownerName,
          role: "owner",
          email: groupData.ownerEmail,
        },
      ],
      tasks: [],
      chat: [],
      createdAt: new Date().toISOString(),
      inviteToken,
      maxMembers: groupData.maxMembers,
      permissions: {
        canAddTasks: "owner",
      },
      activeTypers: [] // Initialize for runtime use
    };

    this.groups.set(id, newGroup);
    return newGroup;
  }

  async getGroup(id: string): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async getGroupByInviteToken(token: string): Promise<Group | undefined> {
    return Array.from(this.groups.values()).find(g => g.inviteToken === token);
  }

  async addMemberToGroup(groupId: string, memberName: string, email?: string): Promise<{ group: Group, memberId: string }> {
    const group = this.groups.get(groupId);
    if (!group) throw new Error("Group not found");

    if (group.members.length >= group.maxMembers) {
      throw new Error(`This group has reached its maximum capacity of ${group.maxMembers} members`);
    }

    const memberId = "user-" + randomUUID();
    const newMember: GroupMember = {
      id: memberId,
      name: memberName,
      role: "member",
      email: email,
    };

    group.members.push(newMember);
    this.groups.set(groupId, group);

    return { group, memberId };
  }

  async removeMemberFromGroup(groupId: string, memberId: string): Promise<Group> {
    const group = this.groups.get(groupId);
    if (!group) throw new Error("Group not found");

    group.members = group.members.filter(m => m.id !== memberId);
    this.groups.set(groupId, group);

    return group;
  }

  async updateMemberRole(groupId: string, memberId: string, newRole: "owner" | "admin" | "member"): Promise<Group> {
    const group = this.groups.get(groupId);
    if (!group) throw new Error("Group not found");

    const member = group.members.find(m => m.id === memberId);
    if (!member) throw new Error("Member not found");

    member.role = newRole;
    if (newRole === "owner") {
      group.owner = memberId;
    }

    this.groups.set(groupId, group);
    return group;
  }

  async getGroupsForUser(userId: string): Promise<Group[]> {
    const now = Date.now();
    const groups = Array.from(this.groups.values()).filter(g =>
      g.members.some(m => m.id === userId)
    );

    // Attach transient typing status
    return groups.map(group => {
      const groupTyping = this.typingStatus.get(group.id);
      let activeTypers: string[] = [];

      if (groupTyping) {
        activeTypers = Array.from(groupTyping.entries())
          .filter(([uid, timestamp]) => uid !== userId && now - timestamp < 6000)
          .map(([uid]) => {
            const member = group.members.find(m => m.id === uid);
            return member ? member.name : "Unknown User";
          });
      }
      return { ...group, activeTypers };
    });
  }

  async addTaskToGroup(groupId: string, task: Task): Promise<Group> {
    const group = this.groups.get(groupId);
    if (!group) throw new Error("Group not found");

    if (!group.tasks) group.tasks = [];
    group.tasks.push(task);
    this.groups.set(groupId, group);
    return group;
  }

  async deleteTaskFromGroup(groupId: string, taskId: string): Promise<Group> {
    const group = this.groups.get(groupId);
    if (!group) throw new Error("Group not found");

    group.tasks = group.tasks.filter(t => t.id !== taskId);
    this.groups.set(groupId, group);
    return group;
  }

  async addMessageToGroup(groupId: string, message: ChatMessage): Promise<Group> {
    const group = this.groups.get(groupId);
    if (!group) throw new Error("Group not found");

    if (!group.chat) group.chat = [];
    group.chat.push(message);

    // User requested "messages not persisted server side, only linked to browser session or temporary memory".
    // This MemStorage satisfies that.

    this.groups.set(groupId, group);
    return group;
  }

  async markMessageAsRead(groupId: string, messageId: string, userId: string): Promise<Group> {
    const group = this.groups.get(groupId);
    if (!group) return (await this.getGroup(groupId))!;

    const msg = group.chat.find(c => c.id === messageId);
    if (msg) {
      if (!msg.readBy) msg.readBy = [];
      if (!msg.readBy.includes(userId)) {
        msg.readBy.push(userId);
      }
    }
    this.groups.set(groupId, group);
    return group;
  }

  async deleteGroup(id: string): Promise<boolean> {
    return this.groups.delete(id);
  }

  async setTypingStatus(groupId: string, userId: string, isTyping: boolean): Promise<void> {
    if (!this.typingStatus.has(groupId)) {
      this.typingStatus.set(groupId, new Map());
    }

    const groupStatus = this.typingStatus.get(groupId)!;

    if (isTyping) {
      groupStatus.set(userId, Date.now());
    } else {
      groupStatus.delete(userId);
    }
  }

  async createMessageAnalysis(analysis: MessageAnalysis): Promise<MessageAnalysis> {
    const id = "analysis-" + randomUUID();
    const newAnalysis: any = { ...analysis, _id: id, timestamp: analysis.timestamp || new Date() };
    this.messageAnalysis.set(id, newAnalysis);
    return newAnalysis as MessageAnalysis;
  }

  async getMessageAnalysisHistory(): Promise<MessageAnalysis[]> {
    return Array.from(this.messageAnalysis.values())
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);
  }

  async deleteMessageAnalysis(id: string): Promise<boolean> {
    return this.messageAnalysis.delete(id);
  }

  async clearMessageAnalysisHistory(): Promise<void> {
    this.messageAnalysis.clear();
  }

  async resetAllDataForUser(userId: string): Promise<void> {
    // 1. Find all groups owned by this user and delete them
    for (const [groupId, group] of Array.from(this.groups.entries())) {
      if (group.owner === userId) {
        this.groups.delete(groupId);
      } else {
        // 2. Remove user from other groups
        group.members = group.members.filter(m => m.id !== userId);
        // Also remove their typing status
        const groupTyping = this.typingStatus.get(groupId);
        if (groupTyping) groupTyping.delete(userId);
      }
    }
  }
}

export const storage = new MemStorage();
