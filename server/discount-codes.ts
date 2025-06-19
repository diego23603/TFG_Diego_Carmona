import { storage } from './storage';

// Tipos de códigos de descuento disponibles
export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_MONTHS = 'free_months'
}

// Interfaz para los códigos de descuento
export interface DiscountCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number; // Porcentaje, cantidad fija o número de meses gratis
  maxUses: number; // Número máximo de usos (null para ilimitados)
  usedCount: number; // Número de veces que se ha usado
  expiryDate: Date | null; // Fecha de expiración (null para no expira)
  isActive: boolean;
  description: string;
  minimumPurchaseAmount?: number; // Monto mínimo de compra para aplicar el descuento
  userType?: 'client' | 'professional' | null; // Si el código es específico para un tipo de usuario
  referralProgram?: boolean; // Si es parte del programa de referidos
  userIdRestriction?: number | null; // Si es específico para un usuario
}

// Códigos de descuento predefinidos (en producción, estos vendrían de base de datos)
export const predefinedDiscountCodes: DiscountCode[] = [
  {
    id: 'welcome10',
    code: 'WELCOME10',
    type: DiscountType.PERCENTAGE,
    value: 10,
    maxUses: 1000,
    usedCount: 0,
    expiryDate: new Date('2026-12-31'),
    isActive: true,
    description: '10% de descuento en tu primera suscripción',
  },
  {
    id: 'freemonth',
    code: 'FREEMONTH',
    type: DiscountType.FREE_MONTHS,
    value: 1,
    maxUses: 100,
    usedCount: 0,
    expiryDate: new Date('2025-12-31'),
    isActive: true,
    description: '1 mes gratis al suscribirte',
  },
  {
    id: 'refer20',
    code: 'REFER20',
    type: DiscountType.PERCENTAGE,
    value: 20,
    maxUses: 9999,
    usedCount: 0,
    expiryDate: null,
    isActive: true,
    description: '20% de descuento por venir referido',
    referralProgram: true,
  },
  {
    id: 'premium50',
    code: 'PREMIUM50',
    type: DiscountType.PERCENTAGE,
    value: 50,
    maxUses: 50,
    usedCount: 0,
    expiryDate: new Date('2025-06-30'),
    isActive: true,
    description: '50% de descuento en suscripciones Premium',
    minimumPurchaseAmount: 4000, // 40€
  }
];

// Verificar si un código de descuento es válido
export function validateDiscountCode(
  code: string,
  amount: number,
  userType: 'client' | 'professional',
  userId: number
): DiscountCode | null {
  const discountCode = predefinedDiscountCodes.find(
    discount => discount.code === code.toUpperCase() && discount.isActive
  );

  if (!discountCode) {
    return null;
  }

  // Verificar si el código ha expirado
  if (discountCode.expiryDate && new Date() > discountCode.expiryDate) {
    return null;
  }

  // Verificar si se ha alcanzado el número máximo de usos
  if (discountCode.maxUses !== null && discountCode.usedCount >= discountCode.maxUses) {
    return null;
  }

  // Verificar si cumple con el monto mínimo de compra
  if (discountCode.minimumPurchaseAmount && amount < discountCode.minimumPurchaseAmount) {
    return null;
  }

  // Verificar si el código es específico para un tipo de usuario
  if (discountCode.userType && discountCode.userType !== userType) {
    return null;
  }

  // Verificar si el código es específico para un usuario
  if (discountCode.userIdRestriction && discountCode.userIdRestriction !== userId) {
    return null;
  }

  return discountCode;
}

// Aplicar el descuento al monto
export function applyDiscount(discountCode: DiscountCode, amount: number): number {
  switch (discountCode.type) {
    case DiscountType.PERCENTAGE:
      return Math.round(amount * (1 - discountCode.value / 100));
    
    case DiscountType.FIXED_AMOUNT:
      return Math.max(0, amount - discountCode.value);

    case DiscountType.FREE_MONTHS:
      // Para meses gratis, normalmente se aplicaría a nivel de suscripción
      // pero aquí aplicamos un descuento completo para el primer pago
      return 0;

    default:
      return amount;
  }
}

// Registrar el uso de un código de descuento
export function recordDiscountCodeUsage(codeId: string): void {
  const discountCode = predefinedDiscountCodes.find(discount => discount.id === codeId);
  
  if (discountCode) {
    discountCode.usedCount += 1;
    // En producción, esto actualizaría la base de datos
  }
}

// Generar un código de referido único para un usuario
export function generateReferralCode(userId: number): string {
  // Una forma simple de generar un código basado en el ID del usuario
  const baseCode = 'REF';
  const userPart = userId.toString().padStart(4, '0');
  const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${baseCode}${userPart}${randomPart}`;
}

// Crear un código de descuento personalizado (para usuarios que refieren)
export function createReferralDiscountCode(
  referrerId: number,
  expiryDays: number = 90
): DiscountCode {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  
  const referralCode: DiscountCode = {
    id: `ref_${referrerId}_${Date.now()}`,
    code: generateReferralCode(referrerId),
    type: DiscountType.PERCENTAGE,
    value: 15, // 15% de descuento por usar el código de referido
    maxUses: 10, // Cada código puede ser usado por 10 personas
    usedCount: 0,
    expiryDate,
    isActive: true,
    description: 'Descuento por referido',
    referralProgram: true,
    userIdRestriction: null, // No restringido a un usuario específico
  };
  
  // En producción, esto guardaría el código en la base de datos
  predefinedDiscountCodes.push(referralCode);
  
  return referralCode;
}