import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "USER"]);

export type UserRole = (typeof userRoleEnum.enumValues)[number];

export const memberStatusEnum = pgEnum("member_status", [
  "ACTIVE",
  "INACTIVE",
  "PENDING",
  "VITALICIO",
]);

export const enrollmentStatusEnum = pgEnum("enrollment_status", ["PENDING", "ACTIVE", "CANCELLED"]);

export const dueStatusEnum = pgEnum("due_status", ["PENDING", "PAID", "OVERDUE", "FROZEN"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("USER"),
  passwordHash: text("password_hash"),
  passwordOriginal: text("password_original"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const economicConfigs = pgTable(
  "economic_configs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    currencyCode: text("currency_code").notNull().default("ARS"),
    defaultMonthlyAmount: integer("default_monthly_amount").notNull(),
    dueDay: integer("due_day").notNull().default(10),
    lateFeePercentage: integer("late_fee_percentage").notNull().default(0),
    gracePeriodDays: integer("grace_period_days").notNull().default(5),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (config) => ({
    slugIndex: uniqueIndex("economic_configs_slug_idx").on(config.slug),
  })
);

export const monthlyRunLog = pgTable("monthly_run_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  executedAt: timestamp("executed_at", { withTimezone: true }).notNull().defaultNow(),
  createdDues: integer("created_dues").notNull().default(0),
  operator: text("operator").notNull().default("manual"),
  notes: text("notes"),
});

export const members = pgTable(
  "members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    documentNumber: text("document_number").notNull(),
    phone: text("phone"),
    address: text("address"),
    birthDate: date("birth_date"),
    status: memberStatusEnum("status").notNull().default("PENDING"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (member) => ({
    documentIndex: uniqueIndex("members_document_number_idx").on(member.documentNumber),
  })
);

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(),
    planName: text("plan_name"),
    monthlyAmount: integer("monthly_amount").notNull(),
    status: enrollmentStatusEnum("status").notNull().default("PENDING"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (enrollment) => ({
    memberUniqueIndex: uniqueIndex("enrollments_member_id_idx").on(enrollment.memberId),
  })
);

export const dues = pgTable("dues", {
  id: uuid("id").defaultRandom().primaryKey(),
  enrollmentId: uuid("enrollment_id")
    .notNull()
    .references(() => enrollments.id, { onDelete: "cascade" }),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  dueDate: date("due_date").notNull(),
  amount: integer("amount").notNull(),
  status: dueStatusEnum("status").notNull().default("PENDING"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  statusChangedAt: timestamp("status_changed_at", { withTimezone: true }),
  paidAmount: integer("paid_amount"),
  paymentMethod: text("payment_method"),
  paymentNotes: text("payment_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    dueId: uuid("due_id")
      .notNull()
      .references(() => dues.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    method: text("method").notNull(),
    reference: text("reference"),
    notes: text("notes"),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (payment) => ({
    dueUniqueIndex: uniqueIndex("payments_due_id_idx").on(payment.dueId),
    memberIndex: index("payments_member_id_idx").on(payment.memberId),
  })
);

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    providerIndex: index("accounts_provider_idx").on(account.provider),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").notNull().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (session) => ({
    userIndex: index("sessions_user_id_idx").on(session.userId),
  })
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (verificationToken) => ({
    compoundKey: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
);

export const userRelations = relations(users, ({ one }) => ({
  memberProfile: one(members, {
    fields: [users.id],
    references: [members.userId],
  }),
}));

export const memberRelations = relations(members, ({ one, many }) => ({
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
  enrollments: many(enrollments),
  payments: many(payments),
}));

export const enrollmentRelations = relations(enrollments, ({ one, many }) => ({
  member: one(members, {
    fields: [enrollments.memberId],
    references: [members.id],
  }),
  dues: many(dues),
}));

export const dueRelations = relations(dues, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [dues.enrollmentId],
    references: [enrollments.id],
  }),
  member: one(members, {
    fields: [dues.memberId],
    references: [members.id],
  }),
  payment: one(payments, {
    fields: [dues.id],
    references: [payments.dueId],
  }),
}));

export const paymentRelations = relations(payments, ({ one }) => ({
  member: one(members, {
    fields: [payments.memberId],
    references: [members.id],
  }),
  due: one(dues, {
    fields: [payments.dueId],
    references: [dues.id],
  }),
}));
