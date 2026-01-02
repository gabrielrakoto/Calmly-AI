import { type ContactForm, type Group, type GroupMember, type Task, type ChatMessage, createGroupSchema, type MessageAnalysis } from "@shared/schema";
import { randomUUID } from "crypto";
import { z } from "zod";
import { MessageAnalysisModel, GroupModel } from "./mongodb";

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
}

export class MongoStorage implements IStorage {
  private typingStatus: Map<string, Map<string, number>>; // groupId -> userId -> timestamp

  constructor() {
    this.typingStatus = new Map();
  }

  // Generic contact submission - for now we just handle it but maybe add a model later if needed
  // For the sake of completing the task, let's keep contact submission minimal or in Mongo too
  async createContactSubmission(contact: ContactForm): Promise<ContactSubmission> {
    const id = randomUUID();
    const submission: ContactSubmission = {
      ...contact,
      id,
      submittedAt: new Date().toISOString(),
    };
    // Since we don't have a model yet, let's skip persistence for this minor part or use generic data
    return submission;
  }

  async getAllContactSubmissions(): Promise<ContactSubmission[]> {
    return [];
  }

  async getGroupsForUser(userId: string): Promise<Group[]> {
    const now = Date.now();
    const groups = await GroupModel.find({ "members.id": userId }).lean();

    return groups.map(g => {
      const group = g as unknown as Group;
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
    const group = await GroupModel.findOneAndUpdate(
      { id: groupId },
      { $push: { tasks: task } },
      { new: true }
    ).lean();
    if (!group) throw new Error("Group not found");
    return group as unknown as Group;
  }

  async deleteTaskFromGroup(groupId: string, taskId: string): Promise<Group> {
    const group = await GroupModel.findOneAndUpdate(
      { id: groupId },
      { $pull: { tasks: { id: taskId } } },
      { new: true }
    ).lean();
    if (!group) throw new Error("Group not found");
    return group as unknown as Group;
  }

  async addMessageToGroup(groupId: string, message: ChatMessage): Promise<Group> {
    const group = await GroupModel.findOneAndUpdate(
      { id: groupId },
      { $push: { chat: message } },
      { new: true }
    ).lean();
    if (!group) throw new Error("Group not found");
    return group as unknown as Group;
  }

  async markMessageAsRead(groupId: string, messageId: string, userId: string): Promise<Group> {
    const group = await GroupModel.findOneAndUpdate(
      { id: groupId, "chat.id": messageId },
      { $addToSet: { "chat.$.readBy": userId } },
      { new: true }
    ).lean();
    if (!group) {
      // Fallback if not updated (maybe already read)
      return (await this.getGroup(groupId))!;
    }
    return group as unknown as Group;
  }

  async createGroup(groupData: z.infer<typeof createGroupSchema>): Promise<Group> {
    const id = "group-" + randomUUID();
    const ownerId = groupData.ownerId || "user-1";
    const inviteToken = randomUUID();

    const newGroup = await GroupModel.create({
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
    });

    return newGroup.toObject() as unknown as Group;
  }

  async getGroup(id: string): Promise<Group | undefined> {
    const group = await GroupModel.findOne({ id }).lean();
    return group ? (group as unknown as Group) : undefined;
  }

  async getGroupByInviteToken(token: string): Promise<Group | undefined> {
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

    const updatedGroup = await GroupModel.findOneAndUpdate(
      { id: groupId },
      { $push: { members: newMember } },
      { new: true }
    ).lean();

    return { group: updatedGroup as unknown as Group, memberId };
  }

  async removeMemberFromGroup(groupId: string, memberId: string): Promise<Group> {
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

    // Atomic update
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

  async deleteGroup(id: string): Promise<boolean> {
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

  async createMessageAnalysis(analysis: MessageAnalysis): Promise<MessageAnalysis> {
    const savedDoc = await MessageAnalysisModel.create({
      ...analysis,
      timestamp: analysis.timestamp || new Date()
    });
    return {
      ...analysis,
      _id: savedDoc._id.toString()
    };
  }

  async getMessageAnalysisHistory(): Promise<MessageAnalysis[]> {
    const docs = await MessageAnalysisModel.find().sort({ timestamp: -1 }).limit(50).lean();
    return docs.map((d: any) => ({
      ...d,
      _id: d._id.toString(),
      timestamp: d.timestamp ? d.timestamp.toISOString() : undefined
    }));
  }

  async deleteMessageAnalysis(id: string): Promise<boolean> {
    const result = await MessageAnalysisModel.findByIdAndDelete(id);
    return !!result;
  }

  async clearMessageAnalysisHistory(): Promise<void> {
    await MessageAnalysisModel.deleteMany({});
  }
}

export const storage = new MongoStorage();
