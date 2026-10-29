import type { CurrencyCode } from '../lib/currency.ts';

export type SurgeryStatus = 'PRESUPUESTADO' | 'PROGRAMADA' | 'EN_CURSO' | 'REALIZADA' | 'CANCELADA' | 'REPROGRAMADA';
export type BudgetStatus = 'PENDIENTE_APROBACION' | 'APROBADO' | 'RECHAZADO' | 'OBSERVADO';
export type MaterialStatus = 'SOLICITADO' | 'EN_CLINICA' | 'UTILIZADO' | 'DEVUELTO';
export type InvoiceStatus = 'PENDIENTE' | 'EMITIDA' | 'EN_AUDITORIA' | 'OBSERVADA' | 'COBRADA' | 'VENCIDA';

export type DocumentType = 'protocolo' | 'presupuesto' | 'historia_clinica' | 'factura' | 'comprobante' | 'liquidacion' | 'otro';

export interface AttachedDocument {
  id: string;
  title: string;
  fileName: string;
  fileType: DocumentType;
  date: string;
  institution: string;
  description: string;
  summaryText: string;
  technicalDescription?: string;
  signee: string;
  registrationNumber: string; // MN / MP
  fileSize?: string;
  fileDataUrl?: string; // data URL for preview/download of uploaded files
  fileUrl?: string; // direct path to public asset e.g. /assets/aistudio/...
}

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
  patientMedicalRecordNumber: string; // N° Historia Clínica (HC)
  patientName: string;
  patientDni?: string;
  patientBirthDate?: string; // YYYY-MM-DD
  patientPhone?: string;
  patientEmail?: string;
  patientAddress?: string;
  patientLocation?: string;
  insuranceProvider: string;
  insuranceAffiliateNumber?: string;
  insurancePlan?: string;
  procedureName: string;
  specialty: string;
  preoperativeDiagnosis?: string;
  operativeDiagnosis?: string;
  surgeonName: string;
  surgeonRegistration?: string; // MN / MP
  assistantName?: string;
  secondAssistantName?: string;
  anesthesiologist?: string;
  instrumenter?: string;
  estimatedSurgeryClinic: string; // Clínica / Sanatorio
  operatingRoom?: string;
  surgeryDate: string; // YYYY-MM-DD
  surgeryTime?: string; // HH:mm
  estimatedDurationHours?: number;
  icuDaysEstimated?: number; // Días estimados en UCI
  status: SurgeryStatus;
  budgetStatus?: BudgetStatus; // Seguimiento de presupuesto
  budgetSentDate?: string; // YYYY-MM-DD
  budgetAmount?: number; // Monto de honorarios presupuestados
  budgetApprovalDate?: string; // YYYY-MM-DD
  budgetApprovedAmount?: number; // Monto real aprobado por la obra social/sanatorio
  budgetDifference?: number; // Diferencia entre lo aprobado y lo presupuestado (aprobado - presupuestado)
  budgetAdjustmentReason?: string; // Aclaración o motivo de cambio en el valor (ej. autorizado por menor valor según convenio)
  liquidationDueDate?: string; // Fecha en que se cumplen los 3 meses (90 días) de espera para liquidación
  isSurgeryCompleted?: boolean; // Indica si la cirugía ya fue efectuada
  materials?: SurgicalMaterial[];
  notes?: string;
  invoiceId?: string;
  estimatedSettlementMonth?: string;
  estimatedSettlementAmount?: number;
  attachedDocuments?: AttachedDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  caseId?: string;
  patientName: string;
  patientMedicalRecordNumber?: string;
  insuranceProvider: string;
  clinic: string;
  surgeonFee: number;
  materialsCost: number;
  taxRate: number;
  totalAmount: number;
  currency: CurrencyCode;
  issueDate: string; // YYYY-MM-DD
  expectedCollectionDate: string; // YYYY-MM-DD (Día 20 del mes de emisión)
  actualCollectionDate?: string; // YYYY-MM-DD
  status: InvoiceStatus;
  auditNotes?: string;
  paymentReference?: string;
  collectedAmount?: number;
  pendingAmount?: number;
  // AFIP / ARCA Factura A details
  pointOfSale?: string; // '00003'
  compNumber?: string; // '00000275'
  caeNumber?: string; // e.g. 86272310055164
  caeDueDate?: string; // e.g. 2026-07-13
  recipientCuit?: string; // 30-54584075-4
  recipientName?: string; // CORPORACION MEDICA DE GRAL SAN MARTIN S A
  recipientAddress?: string;
  periodFrom?: string; // YYYY-MM-DD
  periodTo?: string; // YYYY-MM-DD
  conceptDescription?: string;
  netExemptAmount?: number;
  netTaxableAmount?: number;
  ivaAmount?: number;
  ivaRate?: number; // e.g. 10.5
  attachedDocuments?: AttachedDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyLiquidationSchedule {
  monthKey: string;
  monthLabel: string;
  expectedPaymentDay20: number;
  pendingLiquidations: number;
  withdrawnCollected: number;
  registeredCollections: number;
  pendingCollection: number;
  estimatedLiquidationsCount: number;
  estimatedLiquidationsAmount: number;
  notes?: string;
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

export type CertificateType =
  | 'RECETA_FARMACOLOGICA'
  | 'REPOSO_LABORAL'
  | 'APTITUD_QUIRURGICA'
  | 'INDICACION_QUIRURGICA'
  | 'ALTA_MEDICA'
  | 'CONSTANCIA_ATENCION';

export interface MedicalCertificate {
  id: string;
  certificateNumber?: string;
  type: CertificateType;
  issueDate: string; // YYYY-MM-DD
  validFromDate: string; // YYYY-MM-DD
  patientName: string;
  patientDni: string;
  patientBirthDate?: string;
  patientAge?: string;
  patientGender?: 'M' | 'F' | 'OTRO' | '';
  insuranceProvider: string;
  insuranceAffiliateNumber: string;
  diagnosis: string;
  rpText: string; // Contenido Rp./ (Lado izquierdo)
  indicationsText: string; // Contenido Indicaciones (Lado derecho)
  doctorName: string;
  doctorSpecialty: string;
  provincialLicense: string;
  nationalLicense: string;
  licenseType?: 'PROVINCIAL' | 'NACIONAL';
  institution: string; // CEMET
  includeSignature: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
