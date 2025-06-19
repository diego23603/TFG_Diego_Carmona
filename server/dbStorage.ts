import { eq, and, desc, asc } from "drizzle-orm";
import { db } from "./db";
import { IStorage } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

import { 
  users, type User, type InsertUser, 
  horses, type Horse, type InsertHorse,
  connections, type Connection, type InsertConnection,
  appointments, type Appointment, type InsertAppointment,
  messages, type Message, type InsertMessage,
  medicalRecords, type MedicalRecord, type InsertMedicalRecord,
  serviceRecords, type ServiceRecord, type InsertServiceRecord,
  reviews, type Review, type InsertReview
} from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getProfessionalsByType(type: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(
        eq(users.userType, type),
        eq(users.isProfessional, true)
      ));
  }

  async getAllProfessionals(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isProfessional, true));
  }

  // Horse operations
  async getHorse(id: number): Promise<Horse | undefined> {
    const [horse] = await db
      .select()
      .from(horses)
      .where(eq(horses.id, id));
    return horse;
  }

  async getHorsesByOwner(ownerId: number): Promise<Horse[]> {
    return await db
      .select()
      .from(horses)
      .where(eq(horses.ownerId, ownerId));
  }

  async createHorse(horseData: InsertHorse): Promise<Horse> {
    const [horse] = await db
      .insert(horses)
      .values(horseData)
      .returning();
    return horse;
  }

  async updateHorse(id: number, horseData: Partial<Horse>): Promise<Horse | undefined> {
    const [updatedHorse] = await db
      .update(horses)
      .set(horseData)
      .where(eq(horses.id, id))
      .returning();
    return updatedHorse;
  }

  async deleteHorse(id: number): Promise<boolean> {
    const result = await db
      .delete(horses)
      .where(eq(horses.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Connection operations
  async getConnection(id: number): Promise<Connection | undefined> {
    const [connection] = await db
      .select()
      .from(connections)
      .where(eq(connections.id, id));
    return connection;
  }

  async getConnectionsByClient(clientId: number): Promise<Connection[]> {
    const result = await db
      .select()
      .from(connections)
      .where(eq(connections.clientId, clientId))
      .leftJoin(users, eq(connections.professionalId, users.id));
    
    // Format the result to include otherUser
    return result.map(({ connections: conn, users: professional }) => ({
      ...conn,
      otherUser: professional
    }));
  }

  async getConnectionsByProfessional(professionalId: number): Promise<Connection[]> {
    const result = await db
      .select()
      .from(connections)
      .where(eq(connections.professionalId, professionalId))
      .leftJoin(users, eq(connections.clientId, users.id));
    
    // Format the result to include otherUser
    return result.map(({ connections: conn, users: client }) => ({
      ...conn,
      otherUser: client
    }));
  }

  async createConnection(connectionData: InsertConnection): Promise<Connection> {
    const [connection] = await db
      .insert(connections)
      .values({
        ...connectionData,
        requestDate: new Date()
      })
      .returning();
    return connection;
  }

  async updateConnection(id: number, connectionData: Partial<Connection>): Promise<Connection | undefined> {
    let updateData = { ...connectionData };
    
    // If status is being updated, set responseDate
    if (connectionData.status && connectionData.status !== 'pending') {
      updateData = {
        ...updateData,
        responseDate: new Date()
      };
    }
    
    const [updatedConnection] = await db
      .update(connections)
      .set(updateData)
      .where(eq(connections.id, id))
      .returning();
    return updatedConnection;
  }

  async getConnectionByClientAndProfessional(clientId: number, professionalId: number): Promise<Connection | undefined> {
    const [connection] = await db
      .select()
      .from(connections)
      .where(and(
        eq(connections.clientId, clientId),
        eq(connections.professionalId, professionalId)
      ));
    return connection;
  }

  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));
    return appointment;
  }

  async getAppointmentsByClient(clientId: number): Promise<Appointment[]> {
    try {
      const results = await db
        .select()
        .from(appointments)
        .where(eq(appointments.clientId, clientId));
      
      return results;
    } catch (error) {
      console.error("Error en getAppointmentsByClient:", error);
      throw error;
    }
  }

  async getAppointmentsByProfessional(professionalId: number): Promise<Appointment[]> {
    try {
      const results = await db
        .select()
        .from(appointments)
        .where(eq(appointments.professionalId, professionalId));
      
      return results;
    } catch (error) {
      console.error("Error en getAppointmentsByProfessional:", error);
      throw error;
    }
  }

  async getAppointmentsByHorse(horseId: number): Promise<Appointment[]> {
    try {
      // Necesitamos buscar en el array JSON de horseIds
      const sql = `
        SELECT * FROM appointments 
        WHERE horse_ids @> $1
      `;
      
      const results = await db.execute(sql, [[horseId]]);
      return results as Appointment[];
    } catch (error) {
      console.error("Error en getAppointmentsByHorse:", error);
      throw error;
    }
  }

  async createAppointment(appointmentData: any): Promise<Appointment> {
    try {
      console.log("Creando cita con enfoque simplificado:", JSON.stringify(appointmentData, null, 2));
      
      // SOLUCIÓN ULTRAMINIMALISTA - SIMPLIFICAR AL MÁXIMO
      // Conectar con un cliente directo a la base de datos
      const client = await pool.connect();
      
      try {
        // Obtener el horseId (ya sea desde horseId o desde el primer elemento de horseIds)
        let horseId = appointmentData.horseId;
        if (!horseId && Array.isArray(appointmentData.horseIds) && appointmentData.horseIds.length > 0) {
          horseId = appointmentData.horseIds[0];
        }
        
        if (!horseId) {
          throw new Error("Se requiere especificar al menos un caballo");
        }
        
        // SOLUCIÓN DEFINITIVA: Incluir TODOS los campos en la consulta SQL
        const query = `
          INSERT INTO appointments (
            horse_id, client_id, professional_id, service_type, title, date, 
            duration, location, status, notes, horse_ids, price, payment_status,
            created_by, commission, is_periodic, reminder_sent, report_sent, has_alternative
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          RETURNING *;
        `;
        
        // Incluir todos los campos necesarios, especialmente el precio y created_by
        const values = [
          horseId,
          appointmentData.clientId,
          appointmentData.professionalId,
          appointmentData.serviceType,
          appointmentData.title,
          new Date(appointmentData.date),
          appointmentData.duration || 60,
          appointmentData.location || '',
          appointmentData.status || 'pending',
          appointmentData.notes || '',
          JSON.stringify(Array.isArray(appointmentData.horseIds) ? appointmentData.horseIds : [horseId]),
          appointmentData.price, // IMPORTANTE: Incluir el precio
          appointmentData.paymentStatus || 'pending',
          appointmentData.createdBy || 'client',
          appointmentData.commission || null,
          appointmentData.isPeriodic || false,
          appointmentData.reminderSent || false,
          appointmentData.reportSent || false,
          appointmentData.hasAlternative || false
        ];
        
        // Ejecutar la consulta
        const result = await client.query(query, values);
        
        if (result.rows && result.rows.length > 0) {
          // Asignar valores a una estructura de Appointment
          const row = result.rows[0];
          return {
            id: row.id,
            horseId: row.horse_id,
            clientId: row.client_id,
            professionalId: row.professional_id,
            serviceType: row.service_type,
            title: row.title,
            date: row.date,
            duration: row.duration,
            location: row.location,
            status: row.status,
            notes: row.notes,
            horseIds: row.horse_ids ? (typeof row.horse_ids === 'string' ? JSON.parse(row.horse_ids) : row.horse_ids) : null,
            price: row.price,
            paymentStatus: row.payment_status || 'pending',
            paymentMethod: row.payment_method,
            paymentId: row.payment_id,
            isPeriodic: row.is_periodic || false,
            frequency: row.frequency,
            endDate: row.end_date,
            reminderSent: row.reminder_sent || false,
            reportSent: row.report_sent || false,
            commission: row.commission || 0,
            createdBy: row.created_by || 'client',
            hasAlternative: row.has_alternative || false,
            originalAppointmentId: row.original_appointment_id,
            invoiceUrl: row.invoice_url
          };
        } else {
          throw new Error("No se pudo crear la cita - no se devolvieron filas");
        }
      } finally {
        // Liberar el cliente
        client.release();
      }
    } catch (error) {
      console.error("Error en createAppointment:", error);
      throw error;
    }
  }
  
  // Helper para mapear las columnas de la base de datos a propiedades camelCase
  private mapRowToAppointment(row: any): Appointment {
    return {
      id: row.id,
      horseId: row.horse_id,
      clientId: row.client_id,
      professionalId: row.professional_id,
      serviceType: row.service_type,
      title: row.title,
      date: row.date,
      duration: row.duration,
      location: row.location,
      status: row.status,
      notes: row.notes,
      horseIds: row.horse_ids ? (typeof row.horse_ids === 'string' ? JSON.parse(row.horse_ids) : row.horse_ids) : null,
      price: row.price,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
      paymentId: row.payment_id,
      isPeriodic: row.is_periodic,
      frequency: row.frequency,
      endDate: row.end_date,
      reminderSent: row.reminder_sent,
      reportSent: row.report_sent,
      commission: row.commission,
      createdBy: row.created_by,
      hasAlternative: row.has_alternative,
      originalAppointmentId: row.original_appointment_id,
      invoiceUrl: row.invoice_url
    };
  }

  async updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set(appointmentData)
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const result = await db
      .delete(appointments)
      .where(eq(appointments.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    return message;
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return await db.select().from(messages).where(
      and(
        eq(messages.senderId, user1Id),
        eq(messages.receiverId, user2Id)
      ))
      .union(
        db.select().from(messages).where(
          and(
            eq(messages.senderId, user2Id),
            eq(messages.receiverId, user1Id)
          )
        )
      )
      .orderBy(asc(messages.timestamp));
  }

  async getMessagesForUser(userId: number): Promise<Message[]> {
    return await db.select().from(messages).where(
      eq(messages.receiverId, userId))
      .union(
        db.select().from(messages).where(
          eq(messages.senderId, userId)
        )
      )
      .orderBy(desc(messages.timestamp));
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...messageData,
        timestamp: new Date(),
        isRead: false
      })
      .returning();
    return message;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }

  // Medical record operations
  async getMedicalRecord(id: number): Promise<MedicalRecord | undefined> {
    const [record] = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.id, id));
    return record;
  }

  async getMedicalRecordsByHorse(horseId: number): Promise<MedicalRecord[]> {
    const result = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.horseId, horseId))
      .leftJoin(users, eq(medicalRecords.professionalId, users.id))
      .orderBy(desc(medicalRecords.date));
    
    return result.map(({ medical_records: record, users: professional }) => ({
      ...record,
      professional
    }));
  }

  async createMedicalRecord(recordData: InsertMedicalRecord): Promise<MedicalRecord> {
    // Asegurarnos de que attachments sea un array o null
    const sanitizedData = {
      ...recordData,
      attachments: Array.isArray(recordData.attachments) ? recordData.attachments : null
    };
    
    const [record] = await db
      .insert(medicalRecords)
      .values(sanitizedData)
      .returning();
    return record;
  }

  async updateMedicalRecord(id: number, recordData: Partial<MedicalRecord>): Promise<MedicalRecord | undefined> {
    const [updatedRecord] = await db
      .update(medicalRecords)
      .set(recordData)
      .where(eq(medicalRecords.id, id))
      .returning();
    return updatedRecord;
  }

  // Service record operations
  async getServiceRecord(id: number): Promise<ServiceRecord | undefined> {
    const [record] = await db
      .select()
      .from(serviceRecords)
      .where(eq(serviceRecords.id, id));
    return record;
  }

  async getServiceRecordsByHorse(horseId: number): Promise<ServiceRecord[]> {
    const result = await db
      .select()
      .from(serviceRecords)
      .where(eq(serviceRecords.horseId, horseId))
      .leftJoin(users, eq(serviceRecords.professionalId, users.id))
      .orderBy(desc(serviceRecords.date));
    
    return result.map(({ service_records: record, users: professional }) => ({
      ...record,
      professional
    }));
  }

  async createServiceRecord(recordData: InsertServiceRecord): Promise<ServiceRecord> {
    const [record] = await db
      .insert(serviceRecords)
      .values(recordData)
      .returning();
    return record;
  }

  async updateServiceRecord(id: number, recordData: Partial<ServiceRecord>): Promise<ServiceRecord | undefined> {
    const [updatedRecord] = await db
      .update(serviceRecords)
      .set(recordData)
      .where(eq(serviceRecords.id, id))
      .returning();
    return updatedRecord;
  }

  // Review operations
  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id));
    return review;
  }

  async getReviewsByProfessional(professionalId: number): Promise<Review[]> {
    const result = await db
      .select()
      .from(reviews)
      .where(eq(reviews.professionalId, professionalId))
      .leftJoin(users, eq(reviews.clientId, users.id))
      .orderBy(desc(reviews.date));
    
    return result.map(({ reviews: review, users: client }) => ({
      ...review,
      client: client ? {
        id: client.id,
        fullName: client.fullName,
        profileImage: client.profileImage
      } : null
    }));
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values({
        ...reviewData,
        date: new Date()
      })
      .returning();
    return review;
  }
  
  // Admin statistics operations
  async getAllAppointments(): Promise<Appointment[]> {
    // Consulta para obtener todas las citas
    return await db.select().from(appointments);
  }
  
  async getAllHorses(): Promise<Horse[]> {
    // Consulta para obtener todos los caballos
    return await db.select().from(horses);
  }
  
  async getAllClients(): Promise<User[]> {
    // Consulta para obtener todos los clientes (usuarios que no son profesionales)
    const clients = await db.select()
      .from(users)
      .where(
        and(
          eq(users.isProfessional, false),
          eq(users.userType, 'client')
        )
      );
    return clients;
  }
}