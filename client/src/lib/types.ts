// Type definitions for frontend use

export interface User {
  id: number;
  username: string;
  email: string;
  password?: string; // Incluido para compatibilidad, pero no debería usarse en el frontend
  fullName: string;
  phone: string;
  address: string | null;
  userType: string; // Usar string en lugar de UserType para mayor compatibilidad
  description: string | null;
  profileImage: string | null;
  isActive: boolean | null;
  isProfessional: boolean | null;
  subscriptionType: string | null;
  subscriptionExpiry: Date | string | null;
  // Campos para Stripe Connect
  stripeAccountId?: string | null;
  stripeAccountVerified?: boolean | null;
  stripeAccountCreated?: boolean | null;
  // Campos para información fiscal y bancaria
  taxId?: string | null;
  businessName?: string | null;
  businessAddress?: string | null;
  accountNumber?: string | null;
}

// Record type labels para los tipos de registros médicos y servicios
export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  medical: "Médico",
  dental: "Dental",
  farrier: "Herraje",
  training: "Entrenamiento",
  cleaning: "Limpieza",
  transport: "Transporte",
  vaccines: "Vacunas",
  checkup: "Revisión",
  other: "Otro"
};

export type RecordType = 
  | "medical"
  | "dental"
  | "farrier"
  | "training"
  | "cleaning"
  | "transport"
  | "vaccines"
  | "checkup"
  | "other";

export interface Horse {
  id: number;
  ownerId: number;
  name: string;
  breed: string;
  age: number;
  color: string;
  gender: 'male' | 'female';
  location: string;
  description?: string;
  profileImage?: string;
}

export interface Connection {
  id: number;
  clientId: number;
  professionalId: number;
  status: ConnectionStatus;
  requestDate: string;
  responseDate?: string;
  otherUser?: User;
}

export interface Appointment {
  id: number;
  horseId: number;
  clientId: number;
  professionalId: number;
  serviceType: ServiceType;
  title: string;
  date: string;
  duration: number;
  location: string;
  status: AppointmentStatus;
  notes?: string;
  createdBy: 'client' | 'professional';
  isPeriodic?: boolean;
  frequency?: 'weekly' | 'biweekly' | 'monthly';
  endDate?: string;
  price?: number;
  paymentStatus?: 'pending' | 'paid_advance' | 'paid_complete';
  paymentMethod?: 'card' | 'google_pay' | 'apple_pay' | 'samsung_pay';
  paymentId?: string;
  commission?: number;
  invoiceUrl?: string;
  hasAlternative?: boolean;
  alternativeDate?: string;
  horseNames?: string[];
  horse?: Horse;
  professional?: User;
  client?: User;
  otherUser?: User;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface MessagePreview {
  otherUser: User;
  latestMessage: Message;
  unreadCount: number;
}

export interface MedicalRecord {
  id: number;
  horseId: number;
  professionalId: number;
  title: string;
  date: string;
  description: string;
  recordType: RecordType;
  attachments?: string[];
  professional?: User;
}

export interface ServiceRecord {
  id: number;
  horseId: number;
  professionalId: number;
  serviceType: string;
  date: string;
  description: string;
  cost?: number;
  professional?: User;
}

export interface Review {
  id: number;
  clientId: number;
  professionalId: number;
  appointmentId?: number;
  rating: number;
  comment?: string;
  date: string;
  client?: {
    id: number;
    fullName: string;
    profileImage?: string;
  };
}

export type UserType = 'client' | 'vet' | 'farrier' | 'physio' | 'dentist' | 'trainer' | 'cleaner' | 'food' | 'events';
export type SubscriptionType = null | 'basic' | 'premium';
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type ServiceType = 'vet_visit' | 'farrier' | 'dental' | 'physio' | 'training' | 'cleaning';
// Tipo de registro ya definido arriba

export const USER_TYPE_LABELS: Record<string, string> = {
  client: 'Cliente',
  vet: 'Veterinario',
  farrier: 'Herrador',
  physio: 'Fisioterapeuta',
  dentist: 'Dentista Equino',
  trainer: 'Entrenador',
  cleaner: 'Limpieza de Vehículos',
  food: 'Alimentación',
  events: 'Organización de Eventos'
};

export const USER_TYPE_ICONS: Record<UserType, string> = {
  client: 'user',
  vet: 'stethoscope',
  farrier: 'hammer',
  physio: 'activity',
  dentist: 'scissors',
  trainer: 'dumbbell',
  cleaner: 'spray-can',
  food: 'utensils',
  events: 'calendar-days'
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  vet_visit: 'Visita Veterinaria',
  farrier: 'Herrado',
  dental: 'Revisión Dental',
  physio: 'Fisioterapia',
  training: 'Entrenamiento',
  cleaning: 'Limpieza'
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada'
};

// Etiquetas de tipo de registro ya definidas arriba
