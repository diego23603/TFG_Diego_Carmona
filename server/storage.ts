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

export interface IStorage {
  // Para Express Session
  sessionStore: any;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getProfessionalsByType(type: string): Promise<User[]>;
  getAllProfessionals(): Promise<User[]>;
  
  // Horse operations
  getHorse(id: number): Promise<Horse | undefined>;
  getHorsesByOwner(ownerId: number): Promise<Horse[]>;
  createHorse(horse: InsertHorse): Promise<Horse>;
  updateHorse(id: number, horse: Partial<Horse>): Promise<Horse | undefined>;
  deleteHorse(id: number): Promise<boolean>;
  
  // Connection operations
  getConnection(id: number): Promise<Connection | undefined>;
  getConnectionsByClient(clientId: number): Promise<Connection[]>;
  getConnectionsByProfessional(professionalId: number): Promise<Connection[]>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnection(id: number, connection: Partial<Connection>): Promise<Connection | undefined>;
  deleteConnection(id: number): Promise<boolean>;
  getConnectionByClientAndProfessional(clientId: number, professionalId: number): Promise<Connection | undefined>;
  
  // Appointment operations
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentsByClient(clientId: number): Promise<Appointment[]>;
  getAppointmentsByProfessional(professionalId: number): Promise<Appointment[]>;
  getAppointmentsByHorse(horseId: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]>;
  getMessagesForUser(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  
  // Medical record operations
  getMedicalRecord(id: number): Promise<MedicalRecord | undefined>;
  getMedicalRecordsByHorse(horseId: number): Promise<MedicalRecord[]>;
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  updateMedicalRecord(id: number, record: Partial<MedicalRecord>): Promise<MedicalRecord | undefined>;
  
  // Service record operations
  getServiceRecord(id: number): Promise<ServiceRecord | undefined>;
  getServiceRecordsByHorse(horseId: number): Promise<ServiceRecord[]>;
  createServiceRecord(record: InsertServiceRecord): Promise<ServiceRecord>;
  updateServiceRecord(id: number, record: Partial<ServiceRecord>): Promise<ServiceRecord | undefined>;
  
  // Review operations
  getReview(id: number): Promise<Review | undefined>;
  getReviewsByProfessional(professionalId: number): Promise<Review[]>;
  getReviewsByClient(clientId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, review: Partial<Review>): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;
  getReviewByAppointment(appointmentId: number): Promise<Review | undefined>;
  
  // Admin statistics operations
  getAllAppointments(): Promise<Appointment[]>;
  getAllHorses(): Promise<Horse[]>;
  getAllClients(): Promise<User[]>;
}

import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  sessionStore: session.Store;
  
  private users: Map<number, User>;
  private horses: Map<number, Horse>;
  private connections: Map<number, Connection>;
  private appointments: Map<number, Appointment>;
  private messages: Map<number, Message>;
  private medicalRecords: Map<number, MedicalRecord>;
  private serviceRecords: Map<number, ServiceRecord>;
  private reviews: Map<number, Review>;
  
  private userIdCounter: number;
  private horseIdCounter: number;
  private connectionIdCounter: number;
  private appointmentIdCounter: number;
  private messageIdCounter: number;
  private medicalRecordIdCounter: number;
  private serviceRecordIdCounter: number;
  private reviewIdCounter: number;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Borrar sesiones expiradas después de 24 horas
    });
    
    this.users = new Map();
    this.horses = new Map();
    this.connections = new Map();
    this.appointments = new Map();
    this.messages = new Map();
    this.medicalRecords = new Map();
    this.serviceRecords = new Map();
    this.reviews = new Map();
    
    this.userIdCounter = 1;
    this.horseIdCounter = 1;
    this.connectionIdCounter = 1;
    this.appointmentIdCounter = 1;
    this.messageIdCounter = 1;
    this.medicalRecordIdCounter = 1;
    this.serviceRecordIdCounter = 1;
    this.reviewIdCounter = 1;

    // Add sample users
    this.createUser({
      username: "cliente1",
      password: "password123",
      email: "cliente1@example.com",
      fullName: "Ana García",
      phone: "600111222",
      address: "Calle Mayor 15, Madrid",
      userType: "client",
      description: "Dueña de dos caballos con pasión por la equitación",
      profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=250&q=80",
      isActive: true,
      isProfessional: false
    });

    this.createUser({
      username: "cliente2",
      password: "password123",
      email: "cliente2@example.com",
      fullName: "Carlos Rodríguez",
      phone: "600333444",
      address: "Avenida Diagonal 100, Barcelona",
      userType: "client",
      description: "Aficionado a la doma clásica y competidor amateur",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=250&q=80",
      isActive: true,
      isProfessional: false
    });

    this.createUser({
      username: "veterinario1",
      password: "password123",
      email: "vet1@example.com",
      fullName: "Dr. Martín López",
      phone: "600555666",
      address: "Paseo de la Castellana 200, Madrid",
      userType: "vet",
      description: "Veterinario especializado en équidos con 15 años de experiencia",
      profileImage: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-1.2.1&auto=format&fit=crop&w=250&q=80",
      isActive: true,
      isProfessional: true,
      subscriptionType: "premium",
      subscriptionExpiry: new Date(2025, 11, 31).toISOString()
    });

    this.createUser({
      username: "herrador1",
      password: "password123",
      email: "herrador1@example.com",
      fullName: "Javier Sánchez",
      phone: "600777888",
      address: "Camino del Prado 5, Sevilla",
      userType: "farrier",
      description: "Herrador profesional con formación internacional",
      profileImage: "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=250&q=80",
      isActive: true,
      isProfessional: true
    });

    this.createUser({
      username: "entrenadora1",
      password: "password123",
      email: "entrenadora1@example.com",
      fullName: "Laura Gómez",
      phone: "600999000",
      address: "Calle San Juan 10, Valencia",
      userType: "trainer",
      description: "Entrenadora de doma y salto, campeona nacional 2019",
      profileImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=250&q=80",
      isActive: true,
      isProfessional: true,
      subscriptionType: "basic",
      subscriptionExpiry: new Date(2025, 6, 15).toISOString()
    });

    // Add sample horses
    this.createHorse({
      ownerId: 1, // Ana García
      name: "Estrella",
      breed: "Pura Raza Española",
      age: 8,
      color: "Tordillo",
      gender: "female",
      location: "Madrid",
      description: "Yegua de doma con carácter noble y buena planta",
      profileImage: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    });

    this.createHorse({
      ownerId: 1, // Ana García
      name: "Relámpago",
      breed: "Lusitano",
      age: 10,
      color: "Castaño",
      gender: "male",
      location: "Madrid",
      description: "Semental para salto con gran potencia y agilidad",
      profileImage: "https://images.unsplash.com/photo-1553284965-99ba659f48c8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    });

    this.createHorse({
      ownerId: 2, // Carlos Rodríguez
      name: "Tornado",
      breed: "Andaluz",
      age: 6,
      color: "Negro",
      gender: "male",
      location: "Barcelona",
      description: "Caballo joven con gran potencial para doma clásica",
      profileImage: "https://images.unsplash.com/photo-1598974357809-112c788e7f76?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    });

    // Add sample connections
    this.createConnection({
      clientId: 1, // Ana García
      professionalId: 3, // Dr. Martín López (vet)
      status: "accepted",
      requestDate: new Date(2024, 3, 15).toISOString(),
      responseDate: new Date(2024, 3, 16).toISOString()
    });

    this.createConnection({
      clientId: 1, // Ana García
      professionalId: 4, // Javier Sánchez (farrier)
      status: "accepted",
      requestDate: new Date(2024, 3, 20).toISOString(),
      responseDate: new Date(2024, 3, 21).toISOString()
    });

    this.createConnection({
      clientId: 2, // Carlos Rodríguez
      professionalId: 5, // Laura Gómez (trainer)
      status: "pending",
      requestDate: new Date(2024, 4, 1).toISOString()
    });

    // Add sample appointments
    this.createAppointment({
      horseId: 1, // Estrella
      clientId: 1, // Ana García
      professionalId: 3, // Dr. Martín López (vet)
      serviceType: "vet_visit",
      title: "Revisión anual",
      date: new Date(2024, 4, 15, 10, 0).toISOString(),
      duration: 60,
      location: "Establo Real, Madrid",
      status: "confirmed",
      notes: "Revisión completa y vacunación anual"
    });

    this.createAppointment({
      horseId: 2, // Relámpago
      clientId: 1, // Ana García
      professionalId: 4, // Javier Sánchez (farrier)
      serviceType: "farrier",
      title: "Herrado trimestral",
      date: new Date(2024, 4, 20, 16, 0).toISOString(),
      duration: 45,
      location: "Establo Real, Madrid",
      status: "pending",
      notes: "Posible necesidad de herraje ortopédico"
    });

    this.createAppointment({
      horseId: 3, // Tornado
      clientId: 2, // Carlos Rodríguez
      professionalId: 5, // Laura Gómez (trainer)
      serviceType: "training",
      title: "Clase de doma",
      date: new Date(2024, 4, 10, 18, 0).toISOString(),
      duration: 90,
      location: "Centro Ecuestre Barcelona",
      status: "completed",
      notes: "Enfoque en piruetas y transiciones"
    });

    // Add sample messages
    this.createMessage({
      senderId: 1, // Ana García
      receiverId: 3, // Dr. Martín López (vet)
      content: "Hola Dr. López, ¿podría adelantar nuestra cita del viernes? Tengo que viajar por trabajo.",
      timestamp: new Date(2024, 4, 2, 9, 30).toISOString(),
      isRead: true
    });

    this.createMessage({
      senderId: 3, // Dr. Martín López (vet)
      receiverId: 1, // Ana García
      content: "Buenos días Ana, sin problema. Podemos cambiarla para el jueves a la misma hora. ¿Te viene bien?",
      timestamp: new Date(2024, 4, 2, 10, 15).toISOString(),
      isRead: true
    });

    this.createMessage({
      senderId: 1, // Ana García
      receiverId: 3, // Dr. Martín López (vet)
      content: "Perfecto, muchas gracias por la flexibilidad. Nos vemos el jueves entonces.",
      timestamp: new Date(2024, 4, 2, 10, 30).toISOString(),
      isRead: false
    });

    this.createMessage({
      senderId: 2, // Carlos Rodríguez
      receiverId: 5, // Laura Gómez (trainer)
      content: "Hola Laura, ¿podríamos programar una sesión especial para preparar el concurso del mes que viene?",
      timestamp: new Date(2024, 4, 3, 18, 45).toISOString(),
      isRead: false
    });

    // Add sample medical and service records
    this.createMedicalRecord({
      horseId: 1, // Estrella
      professionalId: 3, // Dr. Martín López (vet)
      title: "Revisión general",
      date: new Date(2024, 1, 15).toISOString(),
      description: "Examen completo. Estado general bueno. Vacunas actualizadas. Desparasitación realizada.",
      recordType: "medical"
    });

    this.createServiceRecord({
      horseId: 1, // Estrella
      professionalId: 4, // Javier Sánchez (farrier)
      serviceType: "farrier",
      date: new Date(2024, 3, 5).toISOString(),
      description: "Herrado completo. Se observa desgaste irregular en casco anterior derecho, se aplicó corrección.",
      cost: 85
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.stripeCustomerId === stripeCustomerId
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getProfessionalsByType(type: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.userType === type && user.isProfessional
    );
  }

  async getAllProfessionals(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.isProfessional
    );
  }

  // Horse operations
  async getHorse(id: number): Promise<Horse | undefined> {
    return this.horses.get(id);
  }

  async getHorsesByOwner(ownerId: number): Promise<Horse[]> {
    return Array.from(this.horses.values()).filter(
      (horse) => horse.ownerId === ownerId
    );
  }

  async createHorse(insertHorse: InsertHorse): Promise<Horse> {
    const id = this.horseIdCounter++;
    const horse: Horse = { ...insertHorse, id };
    this.horses.set(id, horse);
    return horse;
  }

  async updateHorse(id: number, horseData: Partial<Horse>): Promise<Horse | undefined> {
    const horse = this.horses.get(id);
    if (!horse) return undefined;
    
    const updatedHorse = { ...horse, ...horseData };
    this.horses.set(id, updatedHorse);
    return updatedHorse;
  }

  async deleteHorse(id: number): Promise<boolean> {
    return this.horses.delete(id);
  }

  // Connection operations
  async getConnection(id: number): Promise<Connection | undefined> {
    return this.connections.get(id);
  }

  async getConnectionsByClient(clientId: number): Promise<Connection[]> {
    return Array.from(this.connections.values()).filter(
      (connection) => connection.clientId === clientId
    );
  }

  async getConnectionsByProfessional(professionalId: number): Promise<Connection[]> {
    return Array.from(this.connections.values()).filter(
      (connection) => connection.professionalId === professionalId
    );
  }

  async createConnection(insertConnection: InsertConnection): Promise<Connection> {
    const id = this.connectionIdCounter++;
    const connection: Connection = { 
      ...insertConnection, 
      id, 
      requestDate: new Date(),
      responseDate: null
    };
    this.connections.set(id, connection);
    return connection;
  }

  async updateConnection(id: number, connectionData: Partial<Connection>): Promise<Connection | undefined> {
    const connection = this.connections.get(id);
    if (!connection) return undefined;
    
    const updatedConnection = { ...connection, ...connectionData };
    this.connections.set(id, updatedConnection);
    return updatedConnection;
  }

  async deleteConnection(id: number): Promise<boolean> {
    return this.connections.delete(id);
  }

  async getConnectionByClientAndProfessional(clientId: number, professionalId: number): Promise<Connection | undefined> {
    return Array.from(this.connections.values()).find(
      (connection) => connection.clientId === clientId && connection.professionalId === professionalId
    );
  }

  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAppointmentsByClient(clientId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.clientId === clientId
    );
  }

  async getAppointmentsByProfessional(professionalId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.professionalId === professionalId
    );
  }

  async getAppointmentsByHorse(horseId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.horseId === horseId
    );
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentIdCounter++;
    const appointment: Appointment = { ...insertAppointment, id };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { ...appointment, ...appointmentData };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => 
        (message.senderId === user1Id && message.receiverId === user2Id) ||
        (message.senderId === user2Id && message.receiverId === user1Id)
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getMessagesForUser(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.senderId === userId || message.receiverId === userId
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const message: Message = { 
      ...insertMessage, 
      id, 
      timestamp: new Date(),
      isRead: false
    };
    this.messages.set(id, message);
    return message;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, isRead: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Medical record operations
  async getMedicalRecord(id: number): Promise<MedicalRecord | undefined> {
    return this.medicalRecords.get(id);
  }

  async getMedicalRecordsByHorse(horseId: number): Promise<MedicalRecord[]> {
    return Array.from(this.medicalRecords.values()).filter(
      (record) => record.horseId === horseId
    ).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createMedicalRecord(insertRecord: InsertMedicalRecord): Promise<MedicalRecord> {
    const id = this.medicalRecordIdCounter++;
    const record: MedicalRecord = { ...insertRecord, id };
    this.medicalRecords.set(id, record);
    return record;
  }

  async updateMedicalRecord(id: number, recordData: Partial<MedicalRecord>): Promise<MedicalRecord | undefined> {
    const record = this.medicalRecords.get(id);
    if (!record) return undefined;
    
    const updatedRecord = { ...record, ...recordData };
    this.medicalRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  // Service record operations
  async getServiceRecord(id: number): Promise<ServiceRecord | undefined> {
    return this.serviceRecords.get(id);
  }

  async getServiceRecordsByHorse(horseId: number): Promise<ServiceRecord[]> {
    return Array.from(this.serviceRecords.values()).filter(
      (record) => record.horseId === horseId
    ).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createServiceRecord(insertRecord: InsertServiceRecord): Promise<ServiceRecord> {
    const id = this.serviceRecordIdCounter++;
    const record: ServiceRecord = { ...insertRecord, id };
    this.serviceRecords.set(id, record);
    return record;
  }

  async updateServiceRecord(id: number, recordData: Partial<ServiceRecord>): Promise<ServiceRecord | undefined> {
    const record = this.serviceRecords.get(id);
    if (!record) return undefined;
    
    const updatedRecord = { ...record, ...recordData };
    this.serviceRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  // Review operations
  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async getReviewsByProfessional(professionalId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.professionalId === professionalId
    ).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getReviewsByClient(clientId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.clientId === clientId
    ).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const review: Review = { 
      ...insertReview, 
      id, 
      date: new Date() 
    };
    this.reviews.set(id, review);
    return review;
  }

  async updateReview(id: number, reviewData: Partial<Review>): Promise<Review | undefined> {
    const review = this.reviews.get(id);
    if (!review) return undefined;
    
    const updatedReview = { ...review, ...reviewData };
    this.reviews.set(id, updatedReview);
    return updatedReview;
  }

  async deleteReview(id: number): Promise<boolean> {
    return this.reviews.delete(id);
  }

  async getReviewByAppointment(appointmentId: number): Promise<Review | undefined> {
    return Array.from(this.reviews.values()).find(
      (review) => review.appointmentId === appointmentId
    );
  }
  
  // Admin statistics operations
  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }
  
  async getAllHorses(): Promise<Horse[]> {
    return Array.from(this.horses.values());
  }
  
  async getAllClients(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => !user.isProfessional && user.userType === 'client'
    );
  }
}

// Para utilizar la base de datos PostgreSQL
import { DatabaseStorage } from "./dbStorage";

export const storage = new DatabaseStorage();

// Para utilizar almacenamiento en memoria, descomentar la siguiente línea
// y comentar las dos líneas anteriores:
// export const storage = new MemStorage();
