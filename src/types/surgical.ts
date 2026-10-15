import type { CurrencyCode } from '../lib/currency.ts';

export type SurgeryStatus = 'PROGRAMADA' | 'EN_CURSO' | 'REALIZADA' | 'CANCELADA' | 'REPROGRAMADA';
export type MaterialStatus = 'SOLICITADO' | 'EN_CLINICA' | 'UTILIZADO' | 'DEVUELTO';
export type InvoiceStatus = 'PENDIENTE' | 'EMITIDA' | 'EN_AUDITORIA' | 'OBSERVADA' | 'COBRADA' | 'VENCIDA';

export interface SurgicalMaterial {
  id: string;
  code: string;
  description: string;
  supplier: string;
  quantity: number;
  cost: number;
  status: MaterialStatus;
}

export interface SurgicalCase {
  id: string;
  patientMedicalRecordNumber: string; // N° Historia Clínica
  patientName: string;
  patientDni: string;
  patientBirthDate: string; // YYYY-MM-DD
  patientPhone: string;
  patientEmail?: string;
  insuranceProvider: string;
  insuranceAffiliateNumber: string;
  procedureName: string;
  specialty: string;
  preoperativeDiagnosis: string;
  surgeonName: string;
  assistantName?: string;
  anesthesiologist?: string;
  estimatedSurgeryClinic: string; // Clínica / Sanatorio
  operatingRoom: string;
  surgeryDate: string; // YYYY-MM-DD
  surgeryTime: string; // HH:mm
  estimatedDurationHours: number;
  status: SurgeryStatus;
  materials: SurgicalMaterial[];
  notes?: string;
  invoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  caseId: string;
  patientName: string;
  patientMedicalRecordNumber: string;
  insuranceProvider: string;
  clinic: string;
  surgeonFee: number;
  materialsCost: number;
  taxRate: number;
  totalAmount: number;
  currency: CurrencyCode;
  issueDate: string; // YYYY-MM-DD
  expectedCollectionDate: string; // YYYY-MM-DD (Fecha estimada de cobro)
  actualCollectionDate?: string; // YYYY-MM-DD
  status: InvoiceStatus;
  auditNotes?: string;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicOption {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
}

export interface AppSettings {
  defaultCurrency: CurrencyCode;
  defaultClinic: string;
  defaultTaxRate: number;
  googleSheetsEndpoint: string;
  clinics: string[];
  surgeons: string[];
  insurances: string[];
  specialties: string[];
}
