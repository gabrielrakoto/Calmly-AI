import { type ContactForm, type Group, type GroupMember, type Task, type ChatMessage, createGroupSchema, type MessageAnalysis } from "@shared/schema";
import { randomUUID } from "crypto";
import { z } from "zod";
import { MessageAnalysisModel, GroupModel, isDatabaseAvailable } from "./mongodb";

export interface ContactSubmission extends ContactForm {
  id: string;
  submittedAt: string;
}

export interface IStorage {
  createContactSubmission(contact: ContactForm): Promise<ContactSubmission>;
  getAllContactSubmissions(): Promise<ContactSubmission[]>;
  createGroup(groupData: z.infer<typeof createGroupSchema>, clientUserId: string): Promise<Group>;
  getGroup(id: string): Promise<Group | undefined>;
  getGroupByInviteToken(token: string): Promise<Group | undefined>;
  addMemberToGroup(groupId: string, memberName: string, email?: string): Promise<{ group: Group, memberId: string }>;
  removeMemberFromGroup(groupId: string, memberId: string): Promise<Group>;
  updateMemberRole(groupId: string, memberId: string, newRole: "owner" | "admin" | "member"): Promise<Group>;
  getGroupsForUser(userId: string, clientUserId: string): Promise<Group[]>;
  addTaskToGroup(groupId: string, task: Task): Promise<Group>;
  deleteTaskFromGroup(groupId: string, taskId: string): Promise<Group>;
  addMessageToGroup(groupId: string, message: ChatMessage): Promise<Group>;
  markMessageAsRead(groupId: string, messageId: string, userId: string): Promise<Group>;
  deleteGroup(id: string): Promise<boolean>;
  setTypingStatus(groupId: string, userId: string, isTyping: boolean): Promise<void>;
  createMessageAnalysis(analysis: MessageAnalysis): Promise<MessageAnalysis>;
  getMessageAnalysisHistory(clientUserId: string): Promise<MessageAnalysis[]>;
  deleteMessageAnalysis(id: string): Promise<boolean>;
  clearMessageAnalysisHistory(clientUserId: string): Promise<void>;
  resetAllDataForClientUser(clientUserId: string): Promise<void>;
}

export class MongoStorage implements IStorage {
  private typingStatus: Map<string, Map<string, number>>; // groupId -> userId -> timestamp
  private contactSubmissions: Map<string, ContactSubmission>; // In-memory for contact forms (not user-specific)
  private groups: Map<string, Group>;
  private messageAnalyses: Map<string, MessageAnalysis & { clientUserId?: string }>;

  constructor() {
    this.typingStatus = new Map();
    this.contactSubmissions = new Map();
    this.groups = new Map();
    this.messageAnalyses = new Map();
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

  async createGroup(groupData: z.infer<typeof createGroupSchema>, clientUserId: string): Promise<Group> {
    const id = "group-" + randomUUID();
    const ownerId = groupData.ownerId || "user-" + randomUUID();
    const inviteToken = randomUUID();

    const group: Group = {
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
    };

    if (!isDatabaseAvailable()) {
      this.groups.set(id, { ...group, activeTypers: [] });
      return this.cloneGroup(this.groups.get(id)!);
    }

    const newGroup = await GroupModel.create({
      ...group,
      clientUserId, // Link this group to the browser client
    });

    return newGroup.toObject() as unknown as Group;
  }

  async getGroup(id: string): Promise<Group | undefined> {
    if (!isDatabaseAvailable()) {
      const group = this.groups.get(id);
      return group ? this.cloneGroup(group) : undefined;
    }
    const group = await GroupModel.findOne({ id }).lean();
    return group ? (group as unknown as Group) : undefined;
  }

  async getGroupByInviteToken(token: string): Promise<Group | undefined> {
    if (!isDatabaseAvailable()) {
      const group = Array.from(this.groups.values()).find((entry) => entry.inviteToken === token);
      return group ? this.cloneGroup(group) : undefined;
    }
    const group = await GroupModel.findOne({ inviteToken: token }).lean();
    return group ? (group as unknown as Group) : undefined;
  }

  async addMemberToGroup(groupId: string, memberName: string, email?: string): Promise<{ group: Group, memberId: string }> {
    const group = await this.getGroup(groupId);
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

    if (!isDatabaseAvailable()) {
      group.members.push(newMember);
      this.groups.set(groupId, group);
      return { group: this.cloneGroup(group), memberId };
    }

    const updatedGroup = await GroupModel.findOneAndUpdate(
      { id: groupId },
      { $push: { members: newMember } },
      { new: true }
    ).lean();

    return { group: updatedGroup as unknown as Group, memberId };
  }

  async removeMemberFromGroup(groupId: string, memberId: string): Promise<Group> {
    if (!isDatabaseAvailable()) {
      const group = await this.getGroup(groupId);
      if (!group) throw new Error("Group not found");
      group.members = group.members.filter((member) => member.id !== memberId);
      this.groups.set(groupId, group);
      return this.cloneGroup(group);
    }

    const updatedGroup = await GroupModel.findOneAndUpdate(
      { id: groupId },
      { $pull: { members: { id: memberId } } },
      { new: true }
    ).lean();
    if (!updatedGroup) throw new Error("Group not found");
    return updatedGroup as unknown as Group;
  }

  async updateMemberRole(groupId: string, memberId: string, newRole: "owner" | "admin" | "member"): Promise<Group> {
    const group = await this.getGroup(groupId);
    if (!group) throw new Error("Group not found");

    if (!isDatabaseAvailable()) {
      const member = group.members.find((entry) => entry.id === memberId);
      if (!member) throw new Error("Member or Group not found");
      member.role = newRole;
      if (newRole === "owner") {
        group.owner = memberId;
      }
      this.groups.set(groupId, group);
      return this.cloneGroup(group);
    }

    const update: any = { $set: { "members.$[elem].role": newRole } };
    if (newRole === "owner") {
      update.$set.owner = memberId;
    }

    const updatedGroup = await GroupModel.findOneAndUpdate(
      { id: groupId },
      update,
      {
        arrayFilters: [{ "elem.id": memberId }],
        new: true
      }
    ).lean();

    if (!updatedGroup) throw new Error("Member or Group not found");
    return updatedGroup as unknown as Group;
  }

  async getGroupsForUser(userId: string, clientUserId: string): Promise<Group[]> {
    const now = Date.now();
    if (!isDatabaseAvailable()) {
      return Array.from(this.groups.values())
        .filter((group) => group.owner === userId || group.members.some((member) => member.id === userId))
        .map((group) => this.attachActiveTypers(group, userId, now));
    }

    // Return groups that either:
    // 1. Were created by this clientUserId (the user's own groups)
    // 2. The user is a member of (for groups they joined via invite)
    const groups = await GroupModel.find({
      $or: [
        { clientUserId: clientUserId },
        { "members.id": userId }
      ]
    }).lean();

    return groups.map((g: any) => {
      const group = g as unknown as Group;
      const groupTyping = this.typingStatus.get(group.id);
      let activeTypers: string[] = [];

      if (groupTyping) {
        activeTypers = Array.from(groupTyping.entries())
          .filter(([uid, timestamp]) => uid !== userId && now - timestamp < 6000)
          .map(([uid]) => {
            const member = group.members.find((m: GroupMember) => m.id === uid);
            return member ? member.name : "Unknown User";
          });
      }

      return { ...group, activeTypers };
    });
  }

  async addTaskToGroup(groupId: string, task: Task): Promise<Group> {
    if (!isDatabaseAvailable()) {
      const group = await this.getGroup(groupId);
      if (!group) throw new Error("Group not found");
      group.tasks.push(task);
      this.groups.set(groupId, group);
      return this.cloneGroup(group);
    }

    const group = await GroupModel.findOneAndUpdate(
      { id: groupId },
      { $push: { tasks: task } },
      { new: true }
    ).lean();
    if (!group) throw new Error("Group not found");
    return group as unknown as Group;
  }

  async deleteTaskFromGroup(groupId: string, taskId: string): Promise<Group> {
    if (!isDatabaseAvailable()) {
      const group = await this.getGroup(groupId);
      if (!group) throw new Error("Group not found");
      group.tasks = group.tasks.filter((task) => task.id !== taskId);
      this.groups.set(groupId, group);
      return this.cloneGroup(group);
    }

    const group = await GroupModel.findOneAndUpdate(
      { id: groupId },
      { $pull: { tasks: { id: taskId } } },
      { new: true }
    ).lean();
    if (!group) throw new Error("Group not found");
    return group as unknown as Group;
  }

  async addMessageToGroup(groupId: string, message: ChatMessage): Promise<Group> {
    if (!isDatabaseAvailable()) {
      const group = await this.getGroup(groupId);
      if (!group) throw new Error("Group not found");
      group.chat.push(message);
      this.groups.set(groupId, group);
      return this.cloneGroup(group);
    }

    const group = await GroupModel.findOneAndUpdate(
      { id: groupId },
      { $push: { chat: message } },
      { new: true }
    ).lean();
    if (!group) throw new Error("Group not found");
    return group as unknown as Group;
  }

  async markMessageAsRead(groupId: string, messageId: string, userId: string): Promise<Group> {
    if (!isDatabaseAvailable()) {
      const group = await this.getGroup(groupId);
      if (!group) throw new Error("Group not found");
      const message = group.chat.find((entry) => entry.id === messageId);
      if (message && !message.readBy.includes(userId)) {
        message.readBy.push(userId);
      }
      this.groups.set(groupId, group);
      return this.cloneGroup(group);
    }

    const group = await GroupModel.findOneAndUpdate(
      { id: groupId, "chat.id": messageId },
      { $addToSet: { "chat.$.readBy": userId } },
      { new: true }
    ).lean();
    if (!group) {
      return (await this.getGroup(groupId))!;
    }
    return group as unknown as Group;
  }

  async deleteGroup(id: string): Promise<boolean> {
    if (!isDatabaseAvailable()) {
      return this.groups.delete(id);
    }

    const result = await GroupModel.deleteOne({ id });
    return result.deletedCount > 0;
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

  async createMessageAnalysis(analysis: MessageAnalysis & { clientUserId?: string }): Promise<MessageAnalysis> {
    if (!isDatabaseAvailable()) {
      const id = randomUUID();
      const saved = {
        ...analysis,
        _id: id,
        timestamp: analysis.timestamp || new Date().toISOString(),
        clientUserId: analysis.clientUserId || '',
      };
      this.messageAnalyses.set(id, saved);
      return this.cloneAnalysis(saved);
    }

    const savedDoc = await MessageAnalysisModel.create({
      ...analysis,
      timestamp: analysis.timestamp || new Date(),
      clientUserId: analysis.clientUserId || ''
    });
    return {
      ...analysis,
      _id: savedDoc._id.toString()
    };
  }

  async getMessageAnalysisHistory(clientUserId: string): Promise<MessageAnalysis[]> {
    if (!isDatabaseAvailable()) {
      return Array.from(this.messageAnalyses.values())
        .filter((entry) => (entry.clientUserId || '') === clientUserId)
        .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
        .slice(0, 50)
        .map((entry) => this.cloneAnalysis(entry));
    }

    // Filter by clientUserId to ensure each user sees only their own analysis history
    const docs = await MessageAnalysisModel.find({ clientUserId }).sort({ timestamp: -1 }).limit(50).lean();
    return docs.map((d: any) => ({
      ...d,
      _id: d._id.toString(),
      timestamp: d.timestamp ? d.timestamp.toISOString() : undefined
    }));
  }

  async deleteMessageAnalysis(id: string): Promise<boolean> {
    if (!isDatabaseAvailable()) {
      return this.messageAnalyses.delete(id);
    }

    const result = await MessageAnalysisModel.findByIdAndDelete(id);
    return !!result;
  }

  async clearMessageAnalysisHistory(clientUserId: string): Promise<void> {
    if (!isDatabaseAvailable()) {
      for (const [id, analysis] of Array.from(this.messageAnalyses.entries())) {
        if ((analysis.clientUserId || '') === clientUserId) {
          this.messageAnalyses.delete(id);
        }
      }
      return;
    }

    // Clear only the history for this specific clientUserId
    await MessageAnalysisModel.deleteMany({ clientUserId });
  }

  async resetAllDataForClientUser(clientUserId: string): Promise<void> {
    if (!isDatabaseAvailable()) {
      for (const [id, group] of Array.from(this.groups.entries())) {
        if (group.owner === clientUserId || group.members.some((member: GroupMember) => member.id === clientUserId)) {
          this.groups.delete(id);
        }
      }

      for (const [id, analysis] of Array.from(this.messageAnalyses.entries())) {
        if ((analysis.clientUserId || '') === clientUserId) {
          this.messageAnalyses.delete(id);
        }
      }
      return;
    }

    // Delete all groups associated with this client user
    await GroupModel.deleteMany({ clientUserId });
    // Also delete all message analysis history for this client user
    await MessageAnalysisModel.deleteMany({ clientUserId });
  }

  private attachActiveTypers(group: Group, userId: string, now: number): Group {
    const groupTyping = this.typingStatus.get(group.id);
    let activeTypers: string[] = [];

    if (groupTyping) {
      activeTypers = Array.from(groupTyping.entries())
        .filter(([uid, timestamp]) => uid !== userId && now - timestamp < 6000)
        .map(([uid]) => {
          const member = group.members.find((m: GroupMember) => m.id === uid);
          return member ? member.name : "Unknown User";
        });
    }

    return { ...this.cloneGroup(group), activeTypers };
  }

  private cloneGroup(group: Group): Group {
    return JSON.parse(JSON.stringify(group)) as Group;
  }

  private cloneAnalysis(analysis: MessageAnalysis): MessageAnalysis {
    return JSON.parse(JSON.stringify(analysis)) as MessageAnalysis;
  }
}

export const storage = new MongoStorage();
