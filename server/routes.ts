import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertSpaceSchema, insertFormSchema, insertResponseSchema } from "@shared/schema";
import { z } from "zod";

// Generate a random invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Space routes
  app.get("/api/spaces", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const spaces = await storage.getUserSpaces(userId);
      res.json(spaces);
    } catch (error) {
      console.error("Get spaces error:", error);
      res.status(500).json({ message: "Failed to get spaces" });
    }
  });

  app.post("/api/spaces", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("Creating space for user:", userId, "with data:", req.body);
      
      const spaceData = insertSpaceSchema.parse({
        ...req.body,
        ownerId: userId,
      });

      console.log("Parsed space data:", spaceData);

      const space = await storage.createSpace({
        ...spaceData,
        inviteCode: generateInviteCode(),
      });

      console.log("Created space:", space);
      res.json(space);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Create space error:", error);
        res.status(500).json({ message: "Failed to create space" });
      }
    }
  });

  app.get("/api/spaces/:id", isAuthenticated, async (req: any, res) => {
    try {
      const spaceId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const space = await storage.getSpace(spaceId);
      if (!space) {
        return res.status(404).json({ message: "Space not found" });
      }

      // Check if user is member
      const isMember = await storage.isSpaceMember(spaceId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this space" });
      }

      const members = await storage.getSpaceMembers(spaceId);
      const forms = await storage.getSpaceForms(spaceId);
      const userRole = await storage.getSpaceMemberRole(spaceId, userId);

      res.json({ space, members, forms, userRole });
    } catch (error) {
      console.error("Get space error:", error);
      res.status(500).json({ message: "Failed to get space" });
    }
  });

  app.get("/api/spaces/:id/role", isAuthenticated, async (req: any, res) => {
    try {
      const spaceId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const role = await storage.getSpaceMemberRole(spaceId, userId);
      if (!role) {
        return res.status(404).json({ message: "Not a member of this space" });
      }

      res.json(role);
    } catch (error) {
      console.error("Get user role error:", error);
      res.status(500).json({ message: "Failed to get user role" });
    }
  });

  app.post("/api/spaces/join", isAuthenticated, async (req: any, res) => {
    try {
      const { inviteCode } = req.body;
      const userId = req.user.claims.sub;

      const space = await storage.getSpaceByInviteCode(inviteCode);
      if (!space) {
        return res.status(404).json({ message: "Invalid invite code" });
      }

      // Check if already a member
      const isMember = await storage.isSpaceMember(space.id, userId);
      if (isMember) {
        return res.status(400).json({ message: "Already a member of this space" });
      }

      await storage.addSpaceMember({
        spaceId: space.id,
        userId: userId,
        role: "participant",
      });

      res.json({ message: "Successfully joined space", space });
    } catch (error) {
      console.error("Join space error:", error);
      res.status(500).json({ message: "Failed to join space" });
    }
  });

  // Form routes
  app.post("/api/forms", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const formData = insertFormSchema.parse({
        ...req.body,
        createdBy: userId,
      });

      // Check if user has admin access to the space
      const role = await storage.getSpaceMemberRole(formData.spaceId, userId);
      if (role !== "admin") {
        return res.status(403).json({ message: "Only admins can create forms" });
      }

      const form = await storage.createForm(formData);
      res.json(form);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Create form error:", error);
        res.status(500).json({ message: "Failed to create form" });
      }
    }
  });

  app.get("/api/forms/:id", isAuthenticated, async (req: any, res) => {
    try {
      const formId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      // Check if user is member of the space
      const isMember = await storage.isSpaceMember(form.spaceId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this space" });
      }

      res.json(form);
    } catch (error) {
      console.error("Get form error:", error);
      res.status(500).json({ message: "Failed to get form" });
    }
  });

  app.put("/api/forms/:id", isAuthenticated, async (req: any, res) => {
    try {
      const formId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      // Check if user has admin access
      const role = await storage.getSpaceMemberRole(form.spaceId, userId);
      if (role !== "admin") {
        return res.status(403).json({ message: "Only admins can edit forms" });
      }

      const updates = req.body;
      const updatedForm = await storage.updateForm(formId, updates);
      res.json(updatedForm);
    } catch (error) {
      console.error("Update form error:", error);
      res.status(500).json({ message: "Failed to update form" });
    }
  });

  // Response routes
  app.get("/api/forms/:id/responses", isAuthenticated, async (req: any, res) => {
    try {
      const formId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      // Check if user has admin access
      const role = await storage.getSpaceMemberRole(form.spaceId, userId);
      if (role !== "admin") {
        return res.status(403).json({ message: "Only admins can view responses" });
      }

      const responses = await storage.getFormResponses(formId);
      const stats = await storage.getFormResponseStats(formId);

      res.json({ responses, stats });
    } catch (error) {
      console.error("Get responses error:", error);
      res.status(500).json({ message: "Failed to get responses" });
    }
  });

  app.post("/api/responses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const responseData = insertResponseSchema.parse({
        ...req.body,
        userId: userId,
      });

      const form = await storage.getForm(responseData.formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      // Check if user is member
      const isMember = await storage.isSpaceMember(form.spaceId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this space" });
      }

      // Check if user already has a response for this form
      const existingResponse = await storage.getUserFormResponse(responseData.formId, userId);
      
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
        console.error("Create response error:", error);
        res.status(500).json({ message: "Failed to create response" });
      }
    }
  });

  app.get("/api/forms/:id/my-response", isAuthenticated, async (req: any, res) => {
    try {
      const formId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const response = await storage.getUserFormResponse(formId, userId);
      res.json(response);
    } catch (error) {
      console.error("Get my response error:", error);
      res.status(500).json({ message: "Failed to get response" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}