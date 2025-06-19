import { pgTable, text, serial, integer, boolean, timestamp, json, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// User model - base table for all user types
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  userType: text("user_type").notNull(), // client, vet, farrier, physio, dentist, trainer, cleaner
  description: text("description"),
  profileImage: text("profile_image"),
  isActive: boolean("is_active").default(true),
  isProfessional: boolean("is_professional").default(false),
  subscriptionType: text("subscription_type"), // null, basic, premium
  subscriptionExpiry: timestamp("subscription_expiry"),
  stripeCustomerId: text("stripe_customer_id"),  // ID de cliente en Stripe (para clientes)
  stripeAccountId: text("stripe_account_id"),    // ID de cuenta conectada en Stripe (para profesionales)
  stripeAccountVerified: boolean("stripe_account_verified").default(false), // Si la cuenta Stripe Connect está verificada
  stripeAccountCreated: boolean("stripe_account_created").default(false),   // Si la cuenta Stripe Connect ha sido creada
  accountNumber: text("account_number"),  // Número de cuenta bancaria
});

// Horse model
export const horses = pgTable("horses", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  breed: text("breed").notNull(),
  age: integer("age").notNull(),
  color: text("color").notNull(),
  gender: text("gender").notNull(), // male, female
  location: text("location").notNull(),
  description: text("description"),
  profileImage: text("profile_image"),
});

// Connection model
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => users.id),
  professionalId: integer("professional_id").notNull().references(() => users.id),
  status: text("status").notNull(), // pending, accepted, rejected
  requestDate: timestamp("request_date").notNull().defaultNow(),
  responseDate: timestamp("response_date"),
});

// Appointment model - Sistema completo de citas
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  horseId: integer("horse_id").notNull().references(() => horses.id), // Campo obligatorio en BD actual
  horseIds: json("horse_ids").$type<number[]>().default([]), // Array de caballos (compatibilidad)
  clientId: integer("client_id").notNull().references(() => users.id),
  professionalId: integer("professional_id").notNull().references(() => users.id),
  serviceType: text("service_type").notNull(), // vet_visit, farrier, dental, physio, training
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(), // in minutes
  location: text("location").notNull(),
  status: text("status").notNull(), // requested, confirmed, rejected, alternative_proposed, cancelled, completed
  price: integer("price"), // CORREGIDO: Precio como entero en centavos
  paymentStatus: text("payment_status").default("pending"), // pending, paid_advance, paid_complete, unpaid
  paymentMethod: text("payment_method"), // card, google_pay, apple_pay, samsung_pay
  paymentId: text("payment_id"), // ID de transacción en Stripe
  isPeriodic: boolean("is_periodic").default(false),
  frequency: text("frequency"), // null, weekly, biweekly, monthly
  endDate: timestamp("end_date"), // Para citas periódicas
  notes: text("notes"),
  reminderSent: boolean("reminder_sent").default(false),
  reportSent: boolean("report_sent").default(false),
  commission: integer("commission").default(99), // Nuestra comisión fija en céntimos (0.99€)
  feeCollected: boolean("fee_collected").default(false), // Si la comisión ha sido cobrada
  createdBy: text("created_by").default("client"), // 'client' o 'professional'
  hasAlternative: boolean("has_alternative").default(false), // Si existe una propuesta alternativa
  originalAppointmentId: integer("original_appointment_id").references(() => appointments.id), // Para propuestas alternativas
  invoiceUrl: text("invoice_url"), // URL para descargar la factura
  transferredToProfessional: boolean("transferred_to_professional").default(false), // Si el pago se ha transferido al profesional
});

// Message model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  isRead: boolean("is_read").default(false),
});

// Horse medical record model
export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  horseId: integer("horse_id").notNull().references(() => horses.id),
  professionalId: integer("professional_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  recordType: text("record_type").notNull(), // medical, dental, farrier, training
  attachments: json("attachments").$type<string[]>(),
});

// Service record model (non-medical services)
export const serviceRecords = pgTable("service_records", {
  id: serial("id").primaryKey(),
  horseId: integer("horse_id").notNull().references(() => horses.id),
  professionalId: integer("professional_id").notNull().references(() => users.id),
  serviceType: text("service_type").notNull(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  cost: integer("cost"),
});

// Reviews model
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => users.id),
  professionalId: integer("professional_id").notNull().references(() => users.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  date: timestamp("date").notNull().defaultNow(),
});

// Zod insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertHorseSchema = createInsertSchema(horses).omit({ id: true });
export const insertConnectionSchema = createInsertSchema(connections).omit({ id: true, requestDate: true, responseDate: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, timestamp: true, isRead: true });
export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({ id: true });
export const insertServiceRecordSchema = createInsertSchema(serviceRecords).omit({ id: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, date: true });

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedHorses: many(horses),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  professionalConnections: many(connections, { relationName: "professional" }),
  clientConnections: many(connections, { relationName: "client" }),
  professionalAppointments: many(appointments, { relationName: "professional" }),
  clientAppointments: many(appointments, { relationName: "client" }),
  medicalRecords: many(medicalRecords),
  serviceRecords: many(serviceRecords),
  clientReviews: many(reviews, { relationName: "client" }),
  professionalReviews: many(reviews, { relationName: "professional" }),
}));

export const horsesRelations = relations(horses, ({ one, many }) => ({
  owner: one(users, {
    fields: [horses.ownerId],
    references: [users.id]
  }),
  // No hay relación directa con appointments porque ahora usamos horseIds como JSON array
  medicalRecords: many(medicalRecords),
  serviceRecords: many(serviceRecords),
}));

export const connectionsRelations = relations(connections, ({ one }) => ({
  client: one(users, {
    fields: [connections.clientId],
    references: [users.id],
    relationName: "client"
  }),
  professional: one(users, {
    fields: [connections.professionalId],
    references: [users.id],
    relationName: "professional"
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  // Nota: horseIds ahora es un array JSON, por lo que no hay relación directa 
  // Se pueden obtener los caballos por ID en el código
  client: one(users, {
    fields: [appointments.clientId],
    references: [users.id],
    relationName: "client"
  }),
  professional: one(users, {
    fields: [appointments.professionalId],
    references: [users.id],
    relationName: "professional"
  }),
  reviews: many(reviews),
  // Relación para propuestas alternativas
  originalAppointment: one(appointments, {
    fields: [appointments.originalAppointmentId],
    references: [appointments.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender"
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver"
  }),
}));

export const medicalRecordsRelations = relations(medicalRecords, ({ one }) => ({
  horse: one(horses, {
    fields: [medicalRecords.horseId],
    references: [horses.id]
  }),
  professional: one(users, {
    fields: [medicalRecords.professionalId],
    references: [users.id]
  }),
}));

export const serviceRecordsRelations = relations(serviceRecords, ({ one }) => ({
  horse: one(horses, {
    fields: [serviceRecords.horseId],
    references: [horses.id]
  }),
  professional: one(users, {
    fields: [serviceRecords.professionalId],
    references: [users.id]
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  client: one(users, {
    fields: [reviews.clientId],
    references: [users.id],
    relationName: "client"
  }),
  professional: one(users, {
    fields: [reviews.professionalId],
    references: [users.id],
    relationName: "professional"
  }),
  appointment: one(appointments, {
    fields: [reviews.appointmentId],
    references: [appointments.id]
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Horse = typeof horses.$inferSelect;
export type InsertHorse = z.infer<typeof insertHorseSchema>;

export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;

export type ServiceRecord = typeof serviceRecords.$inferSelect;
export type InsertServiceRecord = z.infer<typeof insertServiceRecordSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
