import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const cases = sqliteTable("consultations", {
  id: text("id").primaryKey(), owner: text("owner").notNull(),
  title: text("title").notNull(), kind: text("kind").notNull(),
  status: text("status").notNull(), body: text("body").notNull(), summary: text("summary").notNull(),
  revision: integer("revision").notNull(), token: text("token").notNull(),
  created: text("created").notNull(), updated: text("updated").notNull(),
}, t => [index("consultations_owner_updated").on(t.owner,t.updated)]);
export const events = sqliteTable("review_events", {
  id: text("id").primaryKey(), caseId: text("case_id").notNull(),
  owner: text("owner").notNull(), revision: integer("revision").notNull(),
  type: text("type").notNull(), data: text("data").notNull(), created: text("created").notNull(),
}, t => [index("review_events_owner_case").on(t.owner,t.caseId)]);
