import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertSpaceSchema, insertFormSchema, insertResponseSchema } from "@shared/schema";
import { z } from "zod";

// Generate a random invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'));
    }
  }
});

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

  // User profile routes
  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName } = req.body;

      if (!firstName || !lastName) {
        return res.status(400).json({ message: "First name and last name are required" });
      }

      const updatedUser = await storage.updateUser(userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post('/api/user/upload-avatar', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Generate the URL for the uploaded file
      const avatarUrl = `/uploads/${req.file.filename}`;
      
      const updatedUser = await storage.updateUser(userId, {
        profileImageUrl: avatarUrl,
      });

      res.json({ profileImageUrl: avatarUrl, user: updatedUser });
    } catch (error) {
      console.error("Upload avatar error:", error);
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "File too large. Maximum size is 10MB." });
        }
      }
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });

  // Upload form images/documents
  app.post('/api/upload/form-image', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      console.log("Upload form image request received");
      console.log("Request body:", req.body);
      console.log("Request file:", req.file);
      console.log("Request files:", req.files);
      
      if (!req.file) {
        console.log("No file found in request");
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Generate the URL for the uploaded file
      const imageUrl = `/uploads/${req.file.filename}`;
      
      console.log("File uploaded successfully:", {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
      
      res.json({ 
        success: true, 
        imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });

    } catch (error) {
      console.error("Upload form image error:", error);
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "File too large. Maximum size is 10MB." });
        }
      }
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    const filePath = path.join(uploadsDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
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