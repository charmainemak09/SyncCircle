import { 
  users, spaces, spaceMembers, forms, responses, notifications,
  type User, type UpsertUser,
  type Space, type InsertSpace,
  type SpaceMember, type InsertSpaceMember,
  type Form, type InsertForm,
  type Response, type InsertResponse,
  type Notification, type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined>;

  // Spaces
  getSpace(id: number): Promise<Space | undefined>;
  getSpaceByInviteCode(inviteCode: string): Promise<Space | undefined>;
  getUserSpaces(userId: string): Promise<(Space & { memberCount: number; role: string })[]>;
  createSpace(space: InsertSpace & { inviteCode: string }): Promise<Space>;
  updateSpace(id: number, updates: Partial<InsertSpace>): Promise<Space | undefined>;

  // Space Members
  getSpaceMembers(spaceId: number): Promise<(SpaceMember & { user: User })[]>;
  isSpaceMember(spaceId: number, userId: string): Promise<boolean>;
  addSpaceMember(member: InsertSpaceMember): Promise<SpaceMember>;
  getSpaceMemberRole(spaceId: number, userId: string): Promise<string | undefined>;

  // Forms
  getForm(id: number): Promise<Form | undefined>;
  getSpaceForms(spaceId: number): Promise<Form[]>;
  createForm(form: InsertForm): Promise<Form>;
  updateForm(id: number, updates: Partial<InsertForm>): Promise<Form | undefined>;
  deleteForm(id: number): Promise<boolean>;

  // Responses
  getResponse(id: number): Promise<Response | undefined>;
  getFormResponses(formId: number): Promise<(Response & { user: User })[]>;
  getUserFormResponse(formId: number, userId: string): Promise<Response | undefined>;
  getUserFormDraft(formId: number, userId: string): Promise<Response | undefined>;
  getUserFormResponses(formId: number, userId: string): Promise<Response[]>;
  createResponse(response: InsertResponse): Promise<Response>;
  updateResponse(id: number, updates: Partial<InsertResponse>): Promise<Response | undefined>;
  deleteResponse(id: number): Promise<boolean>;
  getFormResponseStats(formId: number): Promise<{
    totalResponses: number;
    completionRate: number;
    averageRating?: number;
  }>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: string): Promise<boolean>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  deleteSpace(spaceId: number): Promise<boolean>;
  removeSpaceMember(spaceId: number, userId: string): Promise<boolean>;

  getOrCreateDefaultFeedbackSpace(): Promise<Space | undefined>;
  addUserToDefaultFeedbackSpace(userId: string): Promise<void>;
  createDefaultFeedbackForm(spaceId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getSpace(id: number): Promise<Space | undefined> {
    const [space] = await db.select().from(spaces).where(eq(spaces.id, id));
    return space || undefined;
  }

  async getSpaceByInviteCode(inviteCode: string): Promise<Space | undefined> {
    const [space] = await db.select().from(spaces).where(eq(spaces.inviteCode, inviteCode));
    return space || undefined;
  }

  async getUserSpaces(userId: string): Promise<(Space & { memberCount: number; role: string })[]> {
    // First get spaces the user is a member of
    const userSpacesQuery = await db
      .select({
        id: spaces.id,
        name: spaces.name,
        description: spaces.description,
        image: spaces.image,
        inviteCode: spaces.inviteCode,
        ownerId: spaces.ownerId,
        createdAt: spaces.createdAt,
        role: spaceMembers.role,
      })
      .from(spaces)
      .innerJoin(spaceMembers, eq(spaceMembers.spaceId, spaces.id))
      .where(eq(spaceMembers.userId, userId))
      .orderBy(desc(spaces.createdAt));

    // Get member counts for each space
    const result = [];
    for (const space of userSpacesQuery) {
      const [memberCountResult] = await db
        .select({ count: count() })
        .from(spaceMembers)
        .where(eq(spaceMembers.spaceId, space.id));

      result.push({
        ...space,
        memberCount: memberCountResult?.count || 0,
      });
    }

    return result;
  }

  async createSpace(space: InsertSpace & { inviteCode: string }): Promise<Space> {
    const [newSpace] = await db.insert(spaces).values(space).returning();

    // Add the owner as an admin
    await db.insert(spaceMembers).values({
      spaceId: newSpace.id,
      userId: space.ownerId,
      role: "admin",
    });

    return newSpace;
  }

  async updateSpace(id: number, updates: Partial<InsertSpace>): Promise<Space | undefined> {
    const [space] = await db.update(spaces).set(updates).where(eq(spaces.id, id)).returning();
    return space || undefined;
  }

  async getSpaceMembers(spaceId: number): Promise<(SpaceMember & { user: User })[]> {
    const result = await db
      .select({
        id: spaceMembers.id,
        spaceId: spaceMembers.spaceId,
        userId: spaceMembers.userId,
        role: spaceMembers.role,
        joinedAt: spaceMembers.joinedAt,
        user: users,
      })
      .from(spaceMembers)
      .innerJoin(users, eq(users.id, spaceMembers.userId))
      .where(eq(spaceMembers.spaceId, spaceId));

    return result;
  }

  async isSpaceMember(spaceId: number, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(spaceMembers)
      .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, userId)));

    return !!member;
  }

  async addSpaceMember(member: InsertSpaceMember): Promise<SpaceMember> {
    const [newMember] = await db.insert(spaceMembers).values(member).returning();
    return newMember;
  }

  async getSpaceMemberRole(spaceId: number, userId: string): Promise<string | undefined> {
    const [member] = await db
      .select({ role: spaceMembers.role })
      .from(spaceMembers)
      .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, userId)));

    return member?.role;
  }

  async getForm(id: number): Promise<Form | undefined> {
    const [form] = await db.select().from(forms).where(eq(forms.id, id));
    return form || undefined;
  }

  async getSpaceForms(spaceId: number): Promise<Form[]> {
    return await db.select().from(forms).where(eq(forms.spaceId, spaceId)).orderBy(desc(forms.createdAt));
  }

  async createForm(form: InsertForm): Promise<Form> {
    const [newForm] = await db.insert(forms).values(form).returning();
    return newForm;
  }

  async updateForm(id: number, updates: Partial<InsertForm>): Promise<Form | undefined> {
    const [form] = await db.update(forms).set(updates).where(eq(forms.id, id)).returning();
    return form || undefined;
  }

  async deleteForm(id: number): Promise<boolean> {
    const result = await db.delete(forms).where(eq(forms.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getResponse(id: number): Promise<Response | undefined> {
    const [response] = await db.select().from(responses).where(eq(responses.id, id));
    return response || undefined;
  }

  async getFormResponses(formId: number): Promise<(Response & { user: User })[]> {
    const result = await db
      .select({
        id: responses.id,
        formId: responses.formId,
        userId: responses.userId,
        answers: responses.answers,
        isDraft: responses.isDraft,
        submittedAt: responses.submittedAt,
        user: users,
      })
      .from(responses)
      .innerJoin(users, eq(users.id, responses.userId))
      .where(and(eq(responses.formId, formId), eq(responses.isDraft, false)))
      .orderBy(desc(responses.submittedAt));

    return result;
  }

  async getUserFormResponse(formId: number, userId: string): Promise<Response | undefined> {
    const [response] = await db
      .select()
      .from(responses)
      .where(and(eq(responses.formId, formId), eq(responses.userId, userId)))
      .orderBy(desc(responses.submittedAt));

    return response || undefined;
  }

  async getUserFormDraft(formId: number, userId: string): Promise<Response | undefined> {
    const [draft] = await db
      .select()
      .from(responses)
      .where(and(
        eq(responses.formId, formId), 
        eq(responses.userId, userId),
        eq(responses.isDraft, true)
      ))
      .orderBy(desc(responses.submittedAt));

    return draft || undefined;
  }

  async getUserFormResponses(formId: number, userId: string): Promise<Response[]> {
    const userResponses = await db
      .select()
      .from(responses)
      .where(and(
        eq(responses.formId, formId), 
        eq(responses.userId, userId),
        eq(responses.isDraft, false)
      ))
      .orderBy(desc(responses.submittedAt));

    return userResponses;
  }

  async createResponse(response: InsertResponse): Promise<Response> {
    const [newResponse] = await db.insert(responses).values(response).returning();
    return newResponse;
  }

  async updateResponse(id: number, updates: Partial<InsertResponse>): Promise<Response | undefined> {
    const [response] = await db.update(responses).set(updates).where(eq(responses.id, id)).returning();
    return response || undefined;
  }

  async deleteResponse(id: number): Promise<boolean> {
    const result = await db.delete(responses).where(eq(responses.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getFormResponseStats(formId: number): Promise<{
    totalResponses: number;
    completionRate: number;
    averageRating?: number;
  }> {
    // Get form and space member count
    const form = await this.getForm(formId);
    if (!form) {
      return { totalResponses: 0, completionRate: 0 };
    }

    const [memberCountResult] = await db
      .select({ count: count() })
      .from(spaceMembers)
      .where(eq(spaceMembers.spaceId, form.spaceId));

    const [responseCountResult] = await db
      .select({ count: count() })
      .from(responses)
      .where(and(eq(responses.formId, formId), eq(responses.isDraft, false)));

    const memberCount = memberCountResult?.count || 0;
    const responseCount = responseCountResult?.count || 0;
    const completionRate = memberCount > 0 ? Math.round((responseCount / memberCount) * 100) : 0;

    // Calculate average rating if there are rating questions
    const formResponses = await db
      .select({ answers: responses.answers })
      .from(responses)
      .where(and(eq(responses.formId, formId), eq(responses.isDraft, false)));

    let averageRating: number | undefined;
    const ratingValues: number[] = [];

    // Extract rating values from all responses
    formResponses.forEach(response => {
      const answers = response.answers as any;
      Object.values(answers).forEach((answer: any) => {
        if (typeof answer === 'number' && answer >= 1 && answer <= 10) {
          ratingValues.push(answer);
        }
      });
    });

    if (ratingValues.length > 0) {
      averageRating = Math.round((ratingValues.reduce((sum, val) => sum + val, 0) / ratingValues.length) * 10) / 10;
    }

    return {
      totalResponses: responseCount,
      completionRate,
      averageRating,
    };
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [createdNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return createdNotification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    return (result.rowCount || 0) > 0;
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return (result.rowCount || 0) > 0;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result?.count || 0;
  }





  async deleteSpace(spaceId: number): Promise<boolean> {
    try {
      // Delete related records first (foreign key constraints)
      await db.delete(notifications).where(eq(notifications.spaceId, spaceId));
      await db.delete(responses).where(
        inArray(responses.formId, 
          db.select({ id: forms.id }).from(forms).where(eq(forms.spaceId, spaceId))
        )
      );
      await db.delete(forms).where(eq(forms.spaceId, spaceId));
      await db.delete(spaceMembers).where(eq(spaceMembers.spaceId, spaceId));
      await db.delete(spaces).where(eq(spaces.id, spaceId));

      return true;
    } catch (error) {
      console.error("Error deleting space:", error);
      return false;
    }
  }

  async removeSpaceMember(spaceId: number, userId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(spaceMembers)
        .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, userId)))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error("Error removing space member:", error);
      return false;
    }
  }

  async getOrCreateDefaultFeedbackSpace(): Promise<Space | undefined> {
    try {
      // Try to find existing default feedback space
      const [existingSpace] = await db
        .select()
        .from(spaces)
        .where(eq(spaces.name, "Community Feedback"))
        .limit(1);

      if (existingSpace) {
        return existingSpace;
      }

      // Get the first user to use as the owner of the feedback space
      const [firstUser] = await db
        .select()
        .from(users)
        .limit(1);

      if (!firstUser) {
        console.log("No users found to create default feedback space");
        return undefined;
      }

      // Create default feedback space with first user as owner
      const [defaultSpace] = await db
        .insert(spaces)
        .values({
          name: "Community Feedback",
          description: "Share your feedback and suggestions to help us improve the platform",
          inviteCode: "FEEDBACK",
          ownerId: firstUser.id,
        })
        .returning();

      return defaultSpace;
    } catch (error) {
      console.error("Error getting or creating default feedback space:", error);
      return undefined;
    }
  }

  async addUserToDefaultFeedbackSpace(userId: string): Promise<void> {
    try {
      const feedbackSpace = await this.getOrCreateDefaultFeedbackSpace();
      if (!feedbackSpace) return;

      // Check if user is already a member
      const [existingMember] = await db
        .select()
        .from(spaceMembers)
        .where(and(
          eq(spaceMembers.spaceId, feedbackSpace.id),
          eq(spaceMembers.userId, userId)
        ))
        .limit(1);

      if (!existingMember) {
        await db
          .insert(spaceMembers)
          .values({
            spaceId: feedbackSpace.id,
            userId: userId,
            role: "participant",
          });
      }

      // Create default feedback form if it doesn't exist
      await this.createDefaultFeedbackForm(feedbackSpace.id);
    } catch (error) {
      console.error("Error adding user to default feedback space:", error);
    }
  }

  async createDefaultFeedbackForm(spaceId: number): Promise<void> {
    try {
      // Check if feedback form already exists
      const existingForms = await this.getSpaceForms(spaceId);
      const feedbackFormExists = existingForms.some(form => form.title === "Platform Feedback");

      if (feedbackFormExists) return;

      const defaultQuestions = [
        {
          id: "overall-satisfaction",
          type: "rating",
          title: "How satisfied are you with the platform overall?",
          required: true,
          maxRating: 5
        },
        {
          id: "most-useful-feature",
          type: "textarea",
          title: "What feature do you find most useful and why?",
          required: false
        },
        {
          id: "improvement-suggestions",
          type: "textarea",
          title: "What improvements would you like to see?",
          required: false
        },
        {
          id: "feature-requests",
          type: "textarea",
          title: "Are there any new features you'd like us to add?",
          required: false
        },
        {
          id: "recommendation",
          type: "rating",
          title: "How likely are you to recommend this platform to others?",
          required: true,
          maxRating: 10
        }
      ];

      // Get the first user to use as the form creator
      const [firstUser] = await db
        .select()
        .from(users)
        .limit(1);

      if (!firstUser) {
        console.log("No users found to create default feedback form");
        return;
      }

      await db
        .insert(forms)
        .values({
          title: "Platform Feedback",
          description: "Help us improve by sharing your thoughts and suggestions",
          spaceId: spaceId,
          createdBy: firstUser.id,
          questions: defaultQuestions,
          frequency: "monthly",
          sendTime: "09:00",
          startDate: new Date().toISOString().split('T')[0],
          deadlineDuration: 168, // 1 week
          isActive: true,
        })
                .returning();
    } catch (error) {
      console.error("Error creating default feedback form:", error);
    }
  }
}

export const storage = new DatabaseStorage();