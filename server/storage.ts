import { 
  users, spaces, spaceMembers, forms, responses,
  type User, type UpsertUser,
  type Space, type InsertSpace,
  type SpaceMember, type InsertSpaceMember,
  type Form, type InsertForm,
  type Response, type InsertResponse
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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
  createResponse(response: InsertResponse): Promise<Response>;
  updateResponse(id: number, updates: Partial<InsertResponse>): Promise<Response | undefined>;
  getFormResponseStats(formId: number): Promise<{
    totalResponses: number;
    completionRate: number;
    averageRating?: number;
  }>;
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

  async createResponse(response: InsertResponse): Promise<Response> {
    const [newResponse] = await db.insert(responses).values(response).returning();
    return newResponse;
  }

  async updateResponse(id: number, updates: Partial<InsertResponse>): Promise<Response | undefined> {
    const [response] = await db.update(responses).set(updates).where(eq(responses.id, id)).returning();
    return response || undefined;
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
}

export const storage = new DatabaseStorage();
