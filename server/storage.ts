import { db } from "./db";
import {
  servers,
  type InsertServer,
  type Server,
  SERVER_STATUS
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getServers(): Promise<Server[]>;
  getServer(id: number): Promise<Server | undefined>;
  createServer(server: InsertServer): Promise<Server>;
  updateServerStatus(id: number, status: string): Promise<Server>;
  deleteServer(id: number): Promise<void>;
  updateServerStats(id: number, stats: { playersOnline?: number, cpuUsage?: number, ramUsage?: number }): Promise<Server>;
}

export class DatabaseStorage implements IStorage {
  async getServers(): Promise<Server[]> {
    return await db.select().from(servers);
  }

  async getServer(id: number): Promise<Server | undefined> {
    const [server] = await db.select().from(servers).where(eq(servers.id, id));
    return server;
  }

  async createServer(insertServer: InsertServer): Promise<Server> {
    const [server] = await db.insert(servers).values(insertServer).returning();
    return server;
  }

  async updateServerStatus(id: number, status: string): Promise<Server> {
    const [updated] = await db
      .update(servers)
      .set({ status })
      .where(eq(servers.id, id))
      .returning();
    return updated;
  }

  async updateServerStats(id: number, stats: { playersOnline?: number, cpuUsage?: number, ramUsage?: number }): Promise<Server> {
    const [updated] = await db
      .update(servers)
      .set(stats)
      .where(eq(servers.id, id))
      .returning();
    return updated;
  }

  async deleteServer(id: number): Promise<void> {
    await db.delete(servers).where(eq(servers.id, id));
  }
}

export const storage = new DatabaseStorage();
