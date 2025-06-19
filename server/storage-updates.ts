import { eq, and, desc, asc } from "drizzle-orm";
import { db } from "./db";
import { 
  users, type User, 
  horses, type Horse,
  appointments, type Appointment, type InsertAppointment
} from "@shared/schema";

// Funciones de almacenamiento actualizadas para citas
export async function getAppointmentsByClient(clientId: number): Promise<Appointment[]> {
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

export async function getAppointmentsByProfessional(professionalId: number): Promise<Appointment[]> {
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

export async function getAppointmentsByHorse(horseId: number): Promise<Appointment[]> {
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

export async function getAppointment(id: number): Promise<Appointment | undefined> {
  try {
    const [result] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));
    
    return result;
  } catch (error) {
    console.error("Error en getAppointment:", error);
    throw error;
  }
}

export async function createAppointment(appointment: InsertAppointment): Promise<Appointment> {
  try {
    const [result] = await db
      .insert(appointments)
      .values(appointment)
      .returning();
    
    return result;
  } catch (error) {
    console.error("Error en createAppointment:", error);
    throw error;
  }
}

export async function updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment | undefined> {
  try {
    const [result] = await db
      .update(appointments)
      .set(appointment)
      .where(eq(appointments.id, id))
      .returning();
    
    return result;
  } catch (error) {
    console.error("Error en updateAppointment:", error);
    throw error;
  }
}

export async function deleteAppointment(id: number): Promise<boolean> {
  try {
    await db
      .delete(appointments)
      .where(eq(appointments.id, id));
    
    return true;
  } catch (error) {
    console.error("Error en deleteAppointment:", error);
    throw error;
  }
}

export async function getAllAppointments(): Promise<Appointment[]> {
  try {
    const results = await db
      .select()
      .from(appointments);
    
    return results;
  } catch (error) {
    console.error("Error en getAllAppointments:", error);
    throw error;
  }
}