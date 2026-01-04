import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { contactFormSchema, createGroupSchema, taskSchema, chatMessageSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import { analyzeAndRewrite, getCoachResponse } from "./ai";
import { GenericData } from "./mongodb";

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("Registering Application Routes...");

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Check MongoDB connection
      const dbStatus = await GenericData.findOne().limit(1).lean();
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        environment: process.env.NODE_ENV || "development"
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: "Database connection failed"
      });
    }
  });

  // Minimal MVP Routes for MongoDB
  app.post("/api/save", async (req, res) => {
    try {
      const newData = new GenericData({ data: req.body });
      await newData.save();
      res.status(201).json({ success: true, message: "Data saved successfully", id: newData._id });
    } catch (error) {
      console.error("Save error:", error);
      res.status(500).json({ success: false, error: "Failed to save data" });
    }
  });

  app.get("/api/get", async (req, res) => {
    try {
      const allData = await GenericData.find({}).sort({ createdAt: -1 });
      res.json(allData);
    } catch (error) {
      console.error("Get error:", error);
      res.status(500).json({ success: false, error: "Failed to retrieve data" });
    }
  });

  app.delete("/api/delete/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Backend: Attempting to delete document with ID: ${id}`);

      const result = await GenericData.findByIdAndDelete(id);

      if (!result) {
        console.log(`Backend: No document found with ID: ${id}`);
        return res.status(404).json({ success: false, error: "Data not found" });
      }

      console.log(`Backend: Successfully deleted document: ${id}`);
      res.json({ success: true, message: "Data deleted successfully" });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ success: false, error: "Failed to delete data" });
    }
  });

  // AI Routes
  // AI Routes
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { message, language } = req.body;
      const result = await analyzeAndRewrite(message, language);
      res.json(result);
    } catch (error) {
      console.error("AI Analysis error:", error);
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  // Feature: Message Safety History
  app.get("/api/features/safety-checks", async (req, res) => {
    try {
      const history = await storage.getMessageAnalysisHistory();
      res.json(history);
    } catch (error) {
      console.error("Error fetching safety checks:", error);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.post("/api/features/safety-checks", async (req, res) => {
    try {
      // Validate with schema if possible, or just pass through
      // Need to import messageAnalysisSchema from shared/schema first?
      // Let's trust generic validation or just pass it for now to avoid extensive import changes if unnecessary
      const analysis = req.body;
      const saved = await storage.createMessageAnalysis(analysis);
      res.status(201).json(saved);
    } catch (error) {
      console.error("Error saving safety check:", error);
      res.status(500).json({ error: "Failed to save history" });
    }
  });

  app.delete("/api/features/safety-checks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteMessageAnalysis(id);
      if (!success) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting safety check:", error);
      res.status(500).json({ error: "Failed to delete analysis" });
    }
  });

  app.delete("/api/features/safety-checks", async (req, res) => {
    try {
      await storage.clearMessageAnalysisHistory();
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing safety checks:", error);
      res.status(500).json({ error: "Failed to clear history" });
    }
  });

  app.post("/api/ai/coach", async (req, res) => {
    try {
      const { messages, language } = req.body; // Expect full history
      console.log("[Coach API] Received request with message count:", messages?.length);
      const response = await getCoachResponse(messages, language);
      console.log("[Coach API] Got response from AI.");

      res.json({
        choices: [
          { message: { content: response } }
        ]
      });
    } catch (error) {
      console.error("AI Coach error details:", error);
      res.status(500).json({ error: "Coach failed" });
    }
  });

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const result = contactFormSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: result.error.errors
        });
      }

      const submission = await storage.createContactSubmission(result.data);

      res.status(201).json({
        success: true,
        message: "Contact form submitted successfully",
        id: submission.id
      });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all contact submissions (for admin purposes)
  app.get("/api/contact", async (req, res) => {
    try {
      const submissions = await storage.getAllContactSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching contact submissions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create a new group
  app.post("/api/groups", async (req, res) => {
    try {
      console.log("Create group payload:", req.body);
      const result = createGroupSchema.safeParse(req.body);
      if (!result.success) {
        console.error("Group validation failed:", result.error.errors);
        return res.status(400).json({
          error: "Validation failed",
          details: result.error.errors,
          received: req.body
        });
      }
      const group = await storage.createGroup(result.data);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get groups for user
  app.get("/api/groups", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "UserId is required" });
      }

      // Prevent caching so typing indicators are real-time
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const groups = await storage.getGroupsForUser(userId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get group by ID
  app.get("/api/groups/:id", async (req, res) => {
    try {
      const group = await storage.getGroup(req.params.id);
      if (!group) return res.status(404).json({ error: "Group not found" });
      res.json(group);
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete group
  app.delete("/api/groups/:id", async (req, res) => {
    try {
      const success = await storage.deleteGroup(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Group not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get group by invite token
  app.get("/api/groups/invite/:token", async (req, res) => {
    try {
      const group = await storage.getGroupByInviteToken(req.params.token);
      if (!group) return res.status(404).json({ error: "Invalid invite token" });
      res.json(group);
    } catch (error) {
      console.error("Error fetching group invite:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Join group via token
  app.post("/api/groups/join", async (req, res) => {
    try {
      const { token, userName, email } = req.body;
      if (!token || !userName) {
        return res.status(400).json({ error: "Token and user name are required" });
      }

      const group = await storage.getGroupByInviteToken(token);
      if (!group) {
        return res.status(404).json({ error: "Group not found or invalid token" });
      }

      const result = await storage.addMemberToGroup(group.id, userName, email);
      res.json(result);
    } catch (error) {
      console.error("Error joining group:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete task from group
  app.delete("/api/groups/:id/tasks/:taskId", async (req, res) => {
    try {
      const { id: groupId, taskId } = req.params;
      const requesterId = req.query.requesterId as string;

      if (!requesterId) {
        return res.status(400).json({ error: "Requester ID is required" });
      }

      const group = await storage.getGroup(groupId);
      if (!group) return res.status(404).json({ error: "Group not found" });

      const task = group.tasks.find(t => t.id === taskId);
      if (!task) return res.status(404).json({ error: "Task not found" });

      const member = group.members.find(m => m.id === requesterId);
      const isAdmin = member?.role === "admin" || member?.role === "owner";
      const isCreator = task.createdBy === requesterId;

      if (!isAdmin && !isCreator) {
        return res.status(403).json({ error: "Permission denied. Only owners, admins, or the task creator can delete this task." });
      }

      const updatedGroup = await storage.deleteTaskFromGroup(groupId, taskId);
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add task to group
  app.post("/api/groups/:id/tasks", async (req, res) => {
    try {
      // We expect the body to be Omit<Task, "id">, but let's just validate what we can and fill in the rest
      // Simple validation: check if title exists. In real app, use z.omit schema.
      const { title, description, priority, urgent, dueDate, assignedTo, status, createdBy } = req.body;

      if (!title || !createdBy) {
        return res.status(400).json({ error: "Title and createdBy are required" });
      }

      const newTask = {
        id: "task-" + randomUUID(),
        title,
        description: description || "",
        priority: priority || "medium",
        urgent: !!urgent,
        dueDate: dueDate || "",
        assignedTo: assignedTo || "",
        status: status || "pending",
        createdBy
      };

      const updatedGroup = await storage.addTaskToGroup(req.params.id, newTask);
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error adding task:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add message to group
  app.post("/api/groups/:id/messages", async (req, res) => {
    try {
      const { sender, content, isAI, type } = req.body;

      if (!sender || !content) {
        return res.status(400).json({ error: "Sender and content are required" });
      }

      const newMessage = {
        id: "msg-" + randomUUID(),
        sender,
        content,
        timestamp: new Date().toISOString(),
        isAI: !!isAI,
        type: type || "message",
        readBy: []
      };

      const updatedGroup = await storage.addMessageToGroup(req.params.id, newMessage);
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error adding message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Mark message as read
  app.post("/api/groups/:id/messages/:messageId/read", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: "UserId is required" });

      const updatedGroup = await storage.markMessageAsRead(req.params.id, req.params.messageId, userId);
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Set typing status
  app.post("/api/groups/:id/typing", async (req, res) => {
    try {
      const { userId, isTyping } = req.body;
      const groupId = req.params.id;

      if (!userId) return res.status(400).json({ error: "UserId is required" });

      // console.log(`[Typing] Group ${groupId}: User ${userId} is ${isTyping ? 'typing' : 'stopped'}`);
      await storage.setTypingStatus(groupId, userId, !!isTyping);
      res.status(200).send();
    } catch (error) {
      console.error("Error setting typing status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Remove member from group (owner can kick, or member can leave)
  app.delete("/api/groups/:id/members/:memberId", async (req, res) => {
    try {
      const { id: groupId, memberId } = req.params;
      const requesterId = req.query.requesterId as string; // Get from query params

      console.log("Remove member request:", { groupId, memberId, requesterId });

      if (!requesterId) {
        return res.status(400).json({ error: "Requester ID is required" });
      }

      // Get the group to check permissions
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      console.log("Group owner:", group.owner, "Requester:", requesterId, "Match:", group.owner === requesterId);

      // Allow if:
      // 1. Requester is the owner (can kick anyone except themselves)
      // 2. Requester is removing themselves (leaving the group)
      const isOwner = group.owner === requesterId;
      const isSelfRemoval = memberId === requesterId;

      if (!isOwner && !isSelfRemoval) {
        return res.status(403).json({ error: "You can only remove yourself or, if you're the owner, remove other members" });
      }

      // Owner cannot remove themselves
      if (isOwner && isSelfRemoval) {
        return res.status(403).json({ error: "The owner cannot leave the group. Transfer ownership first or delete the group." });
      }

      const updatedGroup = await storage.removeMemberFromGroup(groupId, memberId);
      res.json(updatedGroup);
    } catch (error: any) {
      console.error("Error removing member:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Update member role (owner only)
  app.patch("/api/groups/:id/members/:memberId/role", async (req, res) => {
    try {
      const { id: groupId, memberId } = req.params;
      const { requesterId, newRole } = req.body;

      console.log("Update role request:", { groupId, memberId, requesterId, newRole });

      if (!newRole || !["owner", "admin", "member"].includes(newRole)) {
        return res.status(400).json({ error: "Valid role is required (owner, admin, or member)" });
      }

      // Get the group to check permissions
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      console.log("Group owner:", group.owner, "Requester:", requesterId, "Match:", group.owner === requesterId);

      // Check if requester is the owner
      if (group.owner !== requesterId) {
        return res.status(403).json({ error: "Only the group owner can change member roles" });
      }

      const updatedGroup = await storage.updateMemberRole(groupId, memberId, newRole);
      res.json(updatedGroup);
    } catch (error: any) {
      console.error("Error updating member role:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
