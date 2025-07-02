import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertSpaceSchema, insertFormSchema, insertResponseSchema, type InsertNotification } from "@shared/schema";
import { z } from "zod";

// Generate a random invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Helper function to calculate next notification date based on frequency
function calculateNextNotificationDate(startDate: string, frequency: string, sendTime: string): Date | null {
  const start = new Date(startDate);
  const now = new Date();
  
  // Parse send time (HH:MM format)
  const [hours, minutes] = sendTime.split(':').map(Number);
  
  // Set the time for start date
  start.setHours(hours, minutes, 0, 0);
  
  // If start date is in the future, return it
  if (start > now) {
    return start;
  }
  
  // Calculate next occurrence based on frequency
  const current = new Date(start);
  
  while (current <= now) {
    switch (frequency) {
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'biweekly':
        current.setDate(current.getDate() + 14);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
      default:
        return null;
    }
  }
  
  return current;
}

// Helper function to create scheduled form notifications
async function createScheduledFormNotifications(formId: number): Promise<void> {
  try {
    const form = await storage.getForm(formId);
    if (!form || !form.isActive) return;

    // Skip notifications for Community Feedback space's Platform Feedback form
    const space = await storage.getSpace(form.spaceId);
    if (space && space.name === "Community Feedback" && form.title === "Platform Feedback") {
      return;
    }

    const spaceMembers = await storage.getSpaceMembers(form.spaceId);
    const deadlineHours = form.deadlineDuration || 24;
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + deadlineHours);

    const notifications: InsertNotification[] = spaceMembers.map(member => ({
      userId: member.userId,
      spaceId: form.spaceId,
      type: "form_reminder",
      title: `Scheduled Check-in: ${form.title}`,
      message: `Time for your ${form.frequency} check-in! Please submit your response to "${form.title}" before ${deadline.toLocaleDateString()} ${deadline.toLocaleTimeString()}.`,
      formId: form.id,
      isRead: false
    }));

    for (const notification of notifications) {
      await storage.createNotification(notification);
    }

    console.log(`Created ${notifications.length} scheduled notifications for form: ${form.title}`);
  } catch (error) {
    console.error("Error creating scheduled form notifications:", error);
  }
}

// Helper function to create form reminder notifications
async function createFormReminderNotifications(formId: number): Promise<void> {
  try {
    const form = await storage.getForm(formId);
    if (!form || !form.isActive) return;

    // Skip notifications for Community Feedback space's Platform Feedback form
    const space = await storage.getSpace(form.spaceId);
    if (space && space.name === "Community Feedback" && form.title === "Platform Feedback") {
      return;
    }

    const spaceMembers = await storage.getSpaceMembers(form.spaceId);
    const deadlineHours = form.deadlineDuration || 24;
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + deadlineHours);

    const notifications: InsertNotification[] = spaceMembers.map(member => ({
      userId: member.userId,
      spaceId: form.spaceId,
      type: "form_reminder",
      title: "New Check-in Form Available",
      message: `A new check-in form "${form.title}" has been posted. Submit your response before ${deadline.toLocaleDateString()} ${deadline.toLocaleTimeString()}.`,
      formId: form.id,
      isRead: false
    }));

    for (const notification of notifications) {
      await storage.createNotification(notification);
    }
  } catch (error) {
    console.error("Error creating form reminder notifications:", error);
  }
}

// Helper function to create new response notifications
async function createNewResponseNotifications(formId: number, submitterUserId: string): Promise<void> {
  try {
    const form = await storage.getForm(formId);
    if (!form) return;

    // Skip notifications for Community Feedback space's Platform Feedback form
    const space = await storage.getSpace(form.spaceId);
    if (space && space.name === "Community Feedback" && form.title === "Platform Feedback") {
      return;
    }

    const submitter = await storage.getUser(submitterUserId);
    if (!submitter) return;

    const spaceMembers = await storage.getSpaceMembers(form.spaceId);
    
    // Notify all members except the submitter
    const otherMembers = spaceMembers.filter(member => member.userId !== submitterUserId);
    
    const notifications: InsertNotification[] = otherMembers.map(member => ({
        userId: member.userId,
        spaceId: form.spaceId,
        type: "new_response",
        title: `${submitter.firstName} ${submitter.lastName} submitted a response`,
        message: `New response submitted to "${form.title}". Click to view all responses.`,
        formId: form.id,
        isRead: false
      }));
    
    for (const notification of notifications) {
      await storage.createNotification(notification);
    }
  } catch (error) {
    console.error("Error creating new response notifications:", error);
  }
}

// Scheduler function to check and send scheduled notifications
async function checkAndSendScheduledNotifications(): Promise<void> {
  try {
    console.log("Checking for scheduled notifications...");
    
    // Get all active forms
    const allSpaces = await storage.getAllSpaces();
    
    for (const space of allSpaces) {
      const forms = await storage.getSpaceForms(space.id);
      
      for (const form of forms) {
        if (!form.isActive) continue;
        
        const nextNotificationDate = calculateNextNotificationDate(
          form.startDate,
          form.frequency,
          form.sendTime
        );
        
        if (!nextNotificationDate) continue;
        
        const now = new Date();
        const timeDiff = Math.abs(nextNotificationDate.getTime() - now.getTime());
        
        // Send notification if we're within 5 minutes of the scheduled time
        if (timeDiff <= 5 * 60 * 1000) {
          console.log(`Sending scheduled notification for form: ${form.title} at ${now.toISOString()}`);
          await createScheduledFormNotifications(form.id);
        }
      }
    }
  } catch (error) {
    console.error("Error checking scheduled notifications:", error);
  }
}

// Start notification scheduler
function startNotificationScheduler(): void {
  console.log("Starting notification scheduler...");
  
  // Check for notifications every minute
  setInterval(checkAndSendScheduledNotifications, 60 * 1000);
  
  // Run initial check
  checkAndSendScheduledNotifications();
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
      const prefix = file.fieldname === 'file' ? 'file' : 'avatar';
      cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // For avatar uploads
    if (file.fieldname === 'image') {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG and PNG images are allowed'));
      }
    }
    // For file uploads
    else if (file.fieldname === 'file') {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, PNG images and PDF files are allowed'));
      }
    }
    else {
      cb(new Error('Invalid file field'));
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
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Generate the URL for the uploaded file
      const imageUrl = `/uploads/${req.file.filename}`;
      
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

  // Upload form files (supports multiple file types)
  app.post('/api/upload/form-file', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Generate the URL for the uploaded file
      const fileUrl = `/uploads/${req.file.filename}`;
      
      res.json({ 
        success: true, 
        fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

    } catch (error) {
      console.error("Upload form file error:", error);
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "File too large. Maximum size is 10MB." });
        }
      }
      res.status(500).json({ message: "Failed to upload file" });
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
      
      // Ensure user is added to default feedback space
      await storage.addUserToDefaultFeedbackSpace(userId);
      
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
      if (isNaN(spaceId)) {
        return res.status(400).json({ message: "Invalid space ID" });
      }
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
      if (isNaN(spaceId)) {
        return res.status(400).json({ message: "Invalid space ID" });
      }
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

  app.put("/api/spaces/:id", isAuthenticated, async (req: any, res) => {
    try {
      const spaceId = parseInt(req.params.id);
      if (isNaN(spaceId)) {
        return res.status(400).json({ message: "Invalid space ID" });
      }
      const userId = req.user.claims.sub;
      const { name, description } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Space name is required" });
      }

      const space = await storage.getSpace(spaceId);
      if (!space) {
        return res.status(404).json({ message: "Space not found" });
      }

      // Check if user is admin
      const role = await storage.getSpaceMemberRole(spaceId, userId);
      if (role !== "admin") {
        return res.status(403).json({ message: "Only admins can edit spaces" });
      }

      const updatedSpace = await storage.updateSpace(spaceId, {
        name: name.trim(),
        description: description?.trim() || space.description,
      });

      if (!updatedSpace) {
        return res.status(500).json({ message: "Failed to update space" });
      }

      res.json(updatedSpace);
    } catch (error) {
      console.error("Update space error:", error);
      res.status(500).json({ message: "Failed to update space" });
    }
  });

  app.delete("/api/spaces/:id", isAuthenticated, async (req: any, res) => {
    try {
      const spaceId = parseInt(req.params.id);
      if (isNaN(spaceId)) {
        return res.status(400).json({ message: "Invalid space ID" });
      }
      const userId = req.user.claims.sub;

      const space = await storage.getSpace(spaceId);
      if (!space) {
        return res.status(404).json({ message: "Space not found" });
      }

      // Check if user is admin
      const role = await storage.getSpaceMemberRole(spaceId, userId);
      if (role !== "admin") {
        return res.status(403).json({ message: "Only admins can delete spaces" });
      }

      const deleted = await storage.deleteSpace(spaceId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete space" });
      }

      res.json({ message: "Space deleted successfully" });
    } catch (error) {
      console.error("Delete space error:", error);
      res.status(500).json({ message: "Failed to delete space" });
    }
  });

  app.post("/api/spaces/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const spaceId = parseInt(req.params.id);
      if (isNaN(spaceId)) {
        return res.status(400).json({ message: "Invalid space ID" });
      }
      const userId = req.user.claims.sub;

      const space = await storage.getSpace(spaceId);
      if (!space) {
        return res.status(404).json({ message: "Space not found" });
      }

      // Check if user is member
      const role = await storage.getSpaceMemberRole(spaceId, userId);
      if (!role) {
        return res.status(404).json({ message: "Not a member of this space" });
      }

      // Don't allow space owner to leave if they're the only admin
      if (space.ownerId === userId) {
        const members = await storage.getSpaceMembers(spaceId);
        const adminCount = members.filter(member => member.role === "admin").length;
        if (adminCount === 1) {
          return res.status(400).json({ message: "Space owner cannot leave when they are the only admin. Transfer ownership or delete the space instead." });
        }
      }

      const removed = await storage.removeSpaceMember(spaceId, userId);
      if (!removed) {
        return res.status(500).json({ message: "Failed to leave space" });
      }

      res.json({ message: "Successfully left space" });
    } catch (error) {
      console.error("Leave space error:", error);
      res.status(500).json({ message: "Failed to leave space" });
    }
  });

  app.delete("/api/spaces/:id/members/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const spaceId = parseInt(req.params.id);
      const targetUserId = req.params.userId;
      if (isNaN(spaceId)) {
        return res.status(400).json({ message: "Invalid space ID" });
      }
      const adminUserId = req.user.claims.sub;

      const space = await storage.getSpace(spaceId);
      if (!space) {
        return res.status(404).json({ message: "Space not found" });
      }

      // Check if user is admin
      const adminRole = await storage.getSpaceMemberRole(spaceId, adminUserId);
      if (adminRole !== "admin") {
        return res.status(403).json({ message: "Only admins can remove members" });
      }

      // Check if target user is member
      const targetRole = await storage.getSpaceMemberRole(spaceId, targetUserId);
      if (!targetRole) {
        return res.status(404).json({ message: "Target user is not a member of this space" });
      }

      // Don't allow removing space owner
      if (space.ownerId === targetUserId) {
        return res.status(400).json({ message: "Cannot remove space owner" });
      }

      const removed = await storage.removeSpaceMember(spaceId, targetUserId);
      if (!removed) {
        return res.status(500).json({ message: "Failed to remove member" });
      }

      res.json({ message: "Member removed successfully" });
    } catch (error) {
      console.error("Remove member error:", error);
      res.status(500).json({ message: "Failed to remove member" });
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

      // Check if space already has 5 forms (maximum limit)
      const existingForms = await storage.getSpaceForms(formData.spaceId);
      if (existingForms.length >= 5) {
        return res.status(400).json({ 
          message: "Maximum limit reached. Each space can only have 5 check-in forms." 
        });
      }

      const form = await storage.createForm(formData);
      
      // If form is created as active, create form reminder notifications
      if (form.isActive) {
        await createFormReminderNotifications(form.id);
      }
      
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
      if (isNaN(formId)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }
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

  // PATCH endpoint for partial form updates (like status changes)
  app.patch("/api/forms/:id", isAuthenticated, async (req: any, res) => {
    try {
      const formId = parseInt(req.params.id);
      if (isNaN(formId)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }
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
      if (!updatedForm) {
        return res.status(500).json({ message: "Failed to update form" });
      }
      
      // If form was activated, create form reminder notifications
      if (updates.isActive === true && !form.isActive) {
        await createFormReminderNotifications(formId);
      }
      
      res.json(updatedForm);
    } catch (error) {
      console.error("Patch form error:", error);
      res.status(500).json({ message: "Failed to update form" });
    }
  });

  // Delete form
  app.delete("/api/forms/:id", isAuthenticated, async (req: any, res) => {
    try {
      const formId = parseInt(req.params.id);
      if (isNaN(formId)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }
      const userId = req.user.claims.sub;

      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      // Check if user has admin access
      const role = await storage.getSpaceMemberRole(form.spaceId, userId);
      if (role !== "admin") {
        return res.status(403).json({ message: "Only admins can delete forms" });
      }

      const deleted = await storage.deleteForm(formId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete form" });
      }

      res.json({ message: "Form deleted successfully" });
    } catch (error) {
      console.error("Delete form error:", error);
      res.status(500).json({ message: "Failed to delete form" });
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

      // Check if user is a space member (both admin and participant can view responses)
      const role = await storage.getSpaceMemberRole(form.spaceId, userId);
      if (!role) {
        return res.status(403).json({ message: "Not a member of this space" });
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

      let response;
      
      if (responseData.isDraft) {
        // SAVE MODE: Handle draft storage
        const existingDraft = await storage.getUserFormDraft(responseData.formId, userId);
        if (existingDraft) {
          // Update existing draft
          response = await storage.updateResponse(existingDraft.id, responseData);
        } else {
          // Create new draft
          response = await storage.createResponse(responseData);
        }
      } else {
        // SUBMIT MODE: Create new final submission
        // First, delete any existing draft since we're submitting
        const existingDraft = await storage.getUserFormDraft(responseData.formId, userId);
        if (existingDraft) {
          await storage.deleteResponse(existingDraft.id);
        }
        
        // Always create a new final submission
        response = await storage.createResponse(responseData);
        
        // Create notifications for new submission
        await createNewResponseNotifications(responseData.formId, userId);
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

      // For recurring responses, only return the latest draft (if any)
      const draft = await storage.getUserFormDraft(formId, userId);
      res.json(draft);
    } catch (error) {
      console.error("Get my response error:", error);
      res.status(500).json({ message: "Failed to get response" });
    }
  });

  // Get user's response history for a form
  app.get("/api/forms/:id/my-responses", isAuthenticated, async (req: any, res) => {
    try {
      const formId = parseInt(req.params.id);
      if (isNaN(formId)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }
      const userId = req.user.claims.sub;

      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      // Check if user is member
      const isMember = await storage.isSpaceMember(form.spaceId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this space" });
      }

      const responses = await storage.getUserFormResponses(formId, userId);
      res.json(responses);
    } catch (error) {
      console.error("Get my responses error:", error);
      res.status(500).json({ message: "Failed to get responses" });
    }
  });

  // Get specific response by ID (for editing)
  app.get("/api/responses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const responseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const response = await storage.getResponse(responseId);
      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }

      const form = await storage.getForm(response.formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      const role = await storage.getSpaceMemberRole(form.spaceId, userId);
      if (!role) {
        return res.status(403).json({ message: "Not a member of this space" });
      }

      // Check permissions: user can view their own response, or admin can view any response
      const canView = response.userId === userId || role === "admin";
      if (!canView) {
        return res.status(403).json({ message: "You can only view your own responses" });
      }

      res.json(response);
    } catch (error) {
      console.error("Get response error:", error);
      res.status(500).json({ message: "Failed to get response" });
    }
  });

  // Update response with permission checks
  app.put("/api/responses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const responseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const existingResponse = await storage.getResponse(responseId);
      if (!existingResponse) {
        return res.status(404).json({ message: "Response not found" });
      }

      const form = await storage.getForm(existingResponse.formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      const role = await storage.getSpaceMemberRole(form.spaceId, userId);
      if (!role) {
        return res.status(403).json({ message: "Not a member of this space" });
      }

      // Check permissions: user can edit their own response, or admin can edit any response
      const canEdit = existingResponse.userId === userId || role === "admin";
      if (!canEdit) {
        return res.status(403).json({ message: "You can only edit your own responses" });
      }

      const updateData = req.body;
      const updatedResponse = await storage.updateResponse(responseId, updateData);
      res.json(updatedResponse);
    } catch (error) {
      console.error("Update response error:", error);
      res.status(500).json({ message: "Failed to update response" });
    }
  });

  // Delete response with permission checks
  app.delete("/api/responses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const responseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const existingResponse = await storage.getResponse(responseId);
      if (!existingResponse) {
        return res.status(404).json({ message: "Response not found" });
      }

      const form = await storage.getForm(existingResponse.formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      const role = await storage.getSpaceMemberRole(form.spaceId, userId);
      if (!role) {
        return res.status(403).json({ message: "Not a member of this space" });
      }

      // Check permissions: user can delete their own response, or admin can delete any response
      const canDelete = existingResponse.userId === userId || role === "admin";
      if (!canDelete) {
        return res.status(403).json({ message: "You can only delete your own responses" });
      }

      const deleted = await storage.deleteResponse(responseId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete response" });
      }

      res.json({ message: "Response deleted successfully" });
    } catch (error) {
      console.error("Delete response error:", error);
      res.status(500).json({ message: "Failed to delete response" });
    }
  });

  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  app.post("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const success = await storage.markNotificationAsRead(notificationId);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await storage.markAllNotificationsAsRead(userId);
      res.json({ success });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}