import type { SurgicalCase, Invoice, SurgeryStatus, InvoiceStatus } from '../types/surgical.ts';

/**
 * Calculates age in full years from an ISO birth date (YYYY-MM-DD)
 */
export function calculateAge(birthDateStr: string, currentDate: Date = new Date()): number {
  if (!birthDateStr) return 0;
  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) return 0;

  let age = currentDate.getFullYear() - birthDate.getFullYear();
  const m = currentDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && currentDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Returns difference in days between target date (YYYY-MM-DD) and current date.
 * Positive = future, Negative = past/overdue.
 */
export function getDaysDifference(dateStr: string, referenceDateStr?: string): number {
  if (!dateStr) return 0;
  const target = new Date(dateStr + 'T00:00:00');
  const ref = referenceDateStr ? new Date(referenceDateStr + 'T00:00:00') : new Date();
  ref.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - ref.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determines urgency of expected invoice collection
 */
export function getInvoiceUrgency(
  expectedCollectionDate: string,
  status: InvoiceStatus,
  referenceDateStr?: string
): 'collected' | 'overdue' | 'due-soon' | 'normal' {
  if (status === 'COBRADA') return 'collected';
  if (!expectedCollectionDate) return 'normal';

  const days = getDaysDifference(expectedCollectionDate, referenceDateStr);
  if (days < 0) return 'overdue';
  if (days <= 7) return 'due-soon';
  return 'normal';
}

export interface FinancialMetrics {
  totalBilled: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  invoicesCount: number;
  collectedCount: number;
  overdueCount: number;
  collectionRate: number; // percentage 0-100
}

/**
 * Aggregates financial totals from invoices list
 */
export function calculateFinancialMetrics(invoices: Invoice[]): FinancialMetrics {
  let totalBilled = 0;
  let totalCollected = 0;
  let totalPending = 0;
  let totalOverdue = 0;
  let collectedCount = 0;
  let overdueCount = 0;

  for (const inv of invoices) {
    const amount = Number(inv.totalAmount) || 0;
    totalBilled += amount;

    if (inv.status === 'COBRADA') {
      totalCollected += amount;
      collectedCount++;
    } else {
      totalPending += amount;
      const urgency = getInvoiceUrgency(inv.expectedCollectionDate, inv.status);
      if (urgency === 'overdue' || inv.status === 'VENCIDA') {
        totalOverdue += amount;
        overdueCount++;
      }
    }
  }

  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  return {
    totalBilled: Math.round(totalBilled * 100) / 100,
    totalCollected: Math.round(totalCollected * 100) / 100,
    totalPending: Math.round(totalPending * 100) / 100,
    totalOverdue: Math.round(totalOverdue * 100) / 100,
    invoicesCount: invoices.length,
    collectedCount,
    overdueCount,
    collectionRate,
  };
}

export interface SurgeryMetrics {
  totalCases: number;
  scheduledCount: number;
  inProgressCount: number;
  completedCount: number;
  cancelledCount: number;
  materialsPendingCount: number;
  pendingBudgetsCount: number;
}

/**
 * Aggregates surgery count metrics
 */
export function calculateSurgeryMetrics(cases: SurgicalCase[]): SurgeryMetrics {
  let scheduledCount = 0;
  let inProgressCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  let materialsPendingCount = 0;
  let pendingBudgetsCount = 0;

  for (const c of cases) {
    if (c.status === 'PROGRAMADA' || c.status === 'REPROGRAMADA') scheduledCount++;
    else if (c.status === 'EN_CURSO') inProgressCount++;
    else if (c.status === 'REALIZADA') completedCount++;
    else if (c.status === 'CANCELADA') cancelledCount++;

    if (
      c.status === 'PRESUPUESTADO' ||
      c.budgetStatus === 'PENDIENTE_APROBACION' ||
      (!c.surgeryDate && (c.budgetAmount || c.attachedDocuments?.some(d => d.fileType === 'presupuesto')))
    ) {
      pendingBudgetsCount++;
    }

    if (c.materials && c.materials.length > 0) {
      const hasPending = c.materials.some(m => m.status === 'SOLICITADO');
      if (hasPending) materialsPendingCount++;
    }
  }

  return {
    totalCases: cases.length,
    scheduledCount,
    inProgressCount,
    completedCount,
    cancelledCount,
    materialsPendingCount,
    pendingBudgetsCount,
  };
}

/**
 * Validates surgical case fields
 */
export function validateSurgicalCase(data: Partial<SurgicalCase>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.patientName || data.patientName.trim().length < 2) {
    errors.patientName = 'El nombre del paciente es requerido';
  }
  if (!data.patientMedicalRecordNumber || data.patientMedicalRecordNumber.trim().length === 0) {
    errors.patientMedicalRecordNumber = 'El N° de Historia Clínica es requerido';
  }
  if (!data.procedureName || data.procedureName.trim().length < 2) {
    errors.procedureName = 'El procedimiento quirúrgico es requerido';
  }
  if (!data.surgeonName || data.surgeonName.trim().length < 2) {
    errors.surgeonName = 'El cirujano principal es requerido';
  }
  if (!data.estimatedSurgeryClinic || data.estimatedSurgeryClinic.trim().length < 2) {
    errors.estimatedSurgeryClinic = 'La clínica / sanatorio es requerida';
  }
  if (!data.surgeryDate) {
    errors.surgeryDate = 'La fecha de cirugía es requerida';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates invoice fields
 */
export function validateInvoice(data: Partial<Invoice>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.invoiceNumber || data.invoiceNumber.trim().length === 0) {
    errors.invoiceNumber = 'El N° de Factura es requerido';
  }
  if (!data.patientName || data.patientName.trim().length === 0) {
    errors.patientName = 'El paciente asociado es requerido';
  }
  if (data.totalAmount === undefined || data.totalAmount < 0 || isNaN(data.totalAmount)) {
    errors.totalAmount = 'El monto total debe ser un número mayor o igual a 0';
  }
  if (!data.expectedCollectionDate) {
    errors.expectedCollectionDate = 'La fecha estimada de cobro es obligatoria';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface CaseLiquidationAlert {
  stage: 'DUE_FOR_BILLING' | 'IN_AUDIT' | 'BILLED';
  message: string;
  badgeClass: string;
  expectedMonth: string;
  daysSinceSurgery: number;
  monthsSinceSurgery: number;
  isUrgent: boolean;
  actionText: string;
  hasLiquidationDoc?: boolean;
}

/**
 * Tracks the 3-month postoperative window from surgery date to settlement and invoicing
 * Regla: Luego de un parte qx a los 3 meses se espera el envío de la liquidación para facturar
 */
export function getCaseLiquidationStatus(c: SurgicalCase, referenceDate = '2026-10-29'): CaseLiquidationAlert {
  if (c.invoiceId) {
    return {
      stage: 'BILLED',
      message: 'Liquidado y facturado',
      badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/80',
      expectedMonth: c.estimatedSettlementMonth || 'Facturado',
      daysSinceSurgery: 0,
      monthsSinceSurgery: 0,
      isUrgent: false,
      actionText: 'Ver Factura A',
      hasLiquidationDoc: true,
    };
  }

  if (c.status === 'PRESUPUESTADO' || !c.surgeryDate) {
    return {
      stage: 'IN_AUDIT',
      message: 'Presupuesto en espera de aprobación sanatorial',
      badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-600/70',
      expectedMonth: 'En aprobación',
      daysSinceSurgery: 0,
      monthsSinceSurgery: 0,
      isUrgent: false,
      actionText: 'Ver Presupuesto',
      hasLiquidationDoc: false,
    };
  }

  const surgeryTime = new Date(c.surgeryDate).getTime();
  const refTime = new Date(referenceDate).getTime();
  const rawDays = Math.floor((refTime - surgeryTime) / (1000 * 60 * 60 * 24));
  const daysSince = Math.max(1, rawDays);
  const monthsSince = Number((daysSince / 30.4).toFixed(1));

  const hasLiquidationDoc = Boolean(
    c.attachedDocuments && c.attachedDocuments.some(d => d.fileType === 'liquidacion' || d.fileName.toLowerCase().includes('liquidacion'))
  );

  // If the official liquidation was received from the sanatorio:
  if (hasLiquidationDoc) {
    return {
      stage: 'DUE_FOR_BILLING',
      message: `📄 Liquidación Sanatorial Recibida (${daysSince} días) · Lista para Factura A`,
      badgeClass: 'bg-amber-950/90 text-amber-200 border-amber-500 font-bold shadow-sm',
      expectedMonth: c.estimatedSettlementMonth || 'octubre de 2026',
      daysSinceSurgery: daysSince,
      monthsSinceSurgery: monthsSince,
      isUrgent: true,
      actionText: 'Emitir Factura A',
      hasLiquidationDoc: true,
    };
  }

  // The 3-month clinical settlement rule:
  // If >= 75 days or estimated month is October 2026 or earlier, it has reached or exceeded 3 months!
  const is3MonthsFulfilled = daysSince >= 75 || (c.estimatedSettlementMonth && c.estimatedSettlementMonth.toLowerCase().includes('octubre'));

  if (is3MonthsFulfilled) {
    return {
      stage: 'DUE_FOR_BILLING',
      message: `🚨 ¡3 MESES CUMPLIDOS! (${daysSince} días) · A LA ESPERA DE LIQUIDACIÓN`,
      badgeClass: 'bg-rose-950/90 text-rose-200 border-rose-500 font-bold animate-pulse shadow-sm',
      expectedMonth: c.estimatedSettlementMonth || 'octubre de 2026',
      daysSinceSurgery: daysSince,
      monthsSinceSurgery: monthsSince,
      isUrgent: true,
      actionText: 'Reclamar Liquidación',
      hasLiquidationDoc: false,
    };
  }

  return {
    stage: 'IN_AUDIT',
    message: `⏳ En auditoría sanatorial (${daysSince} días · Espera a 3 meses: ${c.estimatedSettlementMonth || '3 meses'})`,
    badgeClass: 'bg-purple-950/70 text-purple-200 border-purple-700/80',
    expectedMonth: c.estimatedSettlementMonth || 'Próximamente',
    daysSinceSurgery: daysSince,
    monthsSinceSurgery: monthsSince,
    isUrgent: false,
    actionText: 'En espera de liquidación',
    hasLiquidationDoc: false,
  };
}
