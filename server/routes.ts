import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertSpaceSchema, insertFormSchema, insertResponseSchema, type Question } from "@shared/schema";
import { z } from "zod";

// Generate a random invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = req.body;
      
      // Check if user already exists
      let user = await storage.getUserByFirebaseUid(userData.firebaseUid);
      
      if (!user) {
        user = await storage.createUser(userData);
      }
      
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/me", async (req, res) => {
    try {
      const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
      if (!firebaseUid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Space routes
  app.get("/api/spaces", async (req, res) => {
    try {
      const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
      if (!firebaseUid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const spaces = await storage.getUserSpaces(user.id);
      res.json(spaces);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/spaces", async (req, res) => {
    try {
      const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
      if (!firebaseUid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const spaceData = insertSpaceSchema.parse({
        ...req.body,
        ownerId: user.id,
      });

      const space = await storage.createSpace({
        ...spaceData,
        inviteCode: generateInviteCode(),
      });

      res.json(space);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.get("/api/spaces/:id", async (req, res) => {
    try {
      const spaceId = parseInt(req.params.id);
      const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
      if (!firebaseUid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const space = await storage.getSpace(spaceId);
      if (!space) {
        return res.status(404).json({ error: "Space not found" });
      }

      // Check if user is member
      const isMember = await storage.isSpaceMember(spaceId, user.id);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this space" });
      }

      const members = await storage.getSpaceMembers(spaceId);
      const forms = await storage.getSpaceForms(spaceId);

      res.json({ space, members, forms });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/spaces/join", async (req, res) => {
    try {
      const { inviteCode } = req.body;
      const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
      if (!firebaseUid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const space = await storage.getSpaceByInviteCode(inviteCode);
      if (!space) {
        return res.status(404).json({ error: "Invalid invite code" });
      }

      // Check if already a member
      const isMember = await storage.isSpaceMember(space.id, user.id);
      if (isMember) {
        return res.status(400).json({ error: "Already a member of this space" });
      }

      await storage.addSpaceMember({
        spaceId: space.id,
        userId: user.id,
        role: "member",
      });

      res.json({ message: "Successfully joined space", space });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Form routes
  app.post("/api/forms", async (req, res) => {
    try {
      const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
      if (!firebaseUid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const formData = insertFormSchema.parse({
        ...req.body,
        createdBy: user.id,
      });

      // Check if user has admin access to the space
      const role = await storage.getSpaceMemberRole(formData.spaceId, user.id);
      if (role !== "admin") {
        return res.status(403).json({ error: "Only admins can create forms" });
      }

      const form = await storage.createForm(formData);
      res.json(form);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.get("/api/forms/:id", async (req, res) => {
    try {
      const formId = parseInt(req.params.id);
      const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
      if (!firebaseUid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ error: "Form not found" });
      }

      // Check if user is member of the space
      const isMember = await storage.isSpaceMember(form.spaceId, user.id);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this space" });
      }

      res.json(form);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/forms/:id", async (req, res) => {
    try {
      const formId = parseInt(req.params.id);
      const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
      if (!firebaseUid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ error: "Form not found" });
      }

      // Check if user has admin access
      const role = await storage.getSpaceMemberRole(form.spaceId, user.id);
      if (role !== "admin") {
        return res.status(403).json({ error: "Only admins can edit forms" });
      }

      const updates = req.body;
      const updatedForm = await storage.updateForm(formId, updates);
      res.json(updatedForm);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Response routes
  app.get("/api/forms/:id/responses", async (req, res) => {
    try {
      const formId = parseInt(req.params.id);
      const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
      if (!firebaseUid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ error: "Form not found" });
      }

      // Check if user has admin access
      const role = await storage.getSpaceMemberRole(form.spaceId, user.id);
      if (role !== "admin") {
        return res.status(403).json({ error: "Only admins can view responses" });
      }

      const responses = await storage.getFormResponses(formId);
      const stats = await storage.getFormResponseStats(formId);

      res.json({ responses, stats });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/responses", async (req, res) => {
    try {
      const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
      if (!firebaseUid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const responseData = insertResponseSchema.parse({
        ...req.body,
        userId: user.id,
      });

      const form = await storage.getForm(responseData.formId);
      if (!form) {
        return res.status(404).json({ error: "Form not found" });
      }

      // Check if user is member
      const isMember = await storage.isSpaceMember(form.spaceId, user.id);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this space" });
      }

      // Check if user already has a response for this form
      const existingResponse = await storage.getUserFormResponse(responseData.formId, user.id);
      
      let response;
      if (existingResponse) {
        response = await storage.updateResponse(existingResponse.id, responseData);
      } else {
        response = await storage.createResponse(responseData);
      }

      res.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.get("/api/forms/:id/my-response", async (req, res) => {
    try {
      const formId = parseInt(req.params.id);
      const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
      if (!firebaseUid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const response = await storage.getUserFormResponse(formId, user.id);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
