import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  port: integer("port").notNull().default(19132),
  maxPlayers: integer("max_players").notNull().default(20),
  gameMode: text("game_mode").notNull().default("survival"), // survival, creative, adventure
  difficulty: text("difficulty").notNull().default("normal"), // peaceful, easy, normal, hard
  status: text("status").notNull().default("offline"), // online, offline, starting
  
  // Dummy stats for the dashboard
  playersOnline: integer("players_online").default(0),
  cpuUsage: integer("cpu_usage").default(0),
  ramUsage: integer("ram_usage").default(0),
});

export const insertServerSchema = createInsertSchema(servers).omit({ 
  id: true, 
  status: true,
  playersOnline: true,
  cpuUsage: true,
  ramUsage: true
});

export type Server = typeof servers.$inferSelect;
export type InsertServer = z.infer<typeof insertServerSchema>;

export const GAME_MODES = ["Survival", "Creative", "Adventure"] as const;
export const DIFFICULTIES = ["Peaceful", "Easy", "Normal", "Hard"] as const;
export const SERVER_STATUS = {
  ONLINE: "online",
  OFFLINE: "offline",
  STARTING: "starting"
} as const;
