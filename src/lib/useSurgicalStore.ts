import { useState, useEffect } from 'react';
import { SurgicalCase, Invoice, AppSettings, SurgeryStatus, InvoiceStatus, MonthlyLiquidationSchedule, MedicalCertificate } from '../types/surgical';
import { INITIAL_CASES, INITIAL_INVOICES, INITIAL_SETTINGS, INITIAL_MONTHLY_SCHEDULES, INITIAL_CERTIFICATES } from './mockData';

// Storage keys versioned to v9 to ensure fresh migration of October invoices and budgets
const STORAGE_KEY_CASES = 'ciavarelli_hub_cases_v9';
const STORAGE_KEY_INVOICES = 'ciavarelli_hub_invoices_v9';
const STORAGE_KEY_SETTINGS = 'ciavarelli_hub_settings_v9';
const STORAGE_KEY_SCHEDULES = 'ciavarelli_hub_schedules_v9';
const STORAGE_KEY_CERTIFICATES = 'ciavarelli_hub_certificates_v1';

export function useSurgicalStore() {
  const [cases, setCases] = useState<SurgicalCase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CASES);
      if (!saved) return INITIAL_CASES;
      const parsed = JSON.parse(saved);
      // Ensure it contains real cases and Facundo's budget
      const hasRealCiavarelliCase = parsed.some((c: any) => c.patientName?.includes('Quintana') || c.patientName?.includes('GARCIA'));
      const hasFacundo = parsed.some((c: any) => c.patientName?.includes('Facundo') || c.procedureName?.includes('Hepatectomía'));
      if (Array.isArray(parsed) && hasRealCiavarelliCase && hasFacundo) {
        const hasPapasideroReal = parsed.some((c: any) => c.patientName?.includes('Papasidero') && c.budgetApprovedAmount === 900000);
        if (!hasPapasideroReal) {
          const papasideroFromInit = INITIAL_CASES.find(c => c.id === 'case-ciav-papasidero');
          if (papasideroFromInit) {
            return parsed.map((c: any) => c.id === 'case-ciav-papasidero' ? papasideroFromInit : c);
          }
        }
        return parsed;
      }
      return INITIAL_CASES;
    } catch {
      return INITIAL_CASES;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INVOICES);
      if (!saved) return INITIAL_INVOICES;
      const parsed: Invoice[] = JSON.parse(saved);
      const has293 = parsed.some(i => i.invoiceNumber?.includes('293') || i.id === 'inv-afip-293');
      const has294 = parsed.some(i => i.invoiceNumber?.includes('294') || i.id === 'inv-afip-294');
      const has295 = parsed.some(i => i.invoiceNumber?.includes('295') || i.id === 'inv-afip-295');
      const hasOctoberPending = parsed.some(
        i =>
          (i.expectedCollectionDate === '2026-10-20' ||
            i.issueDate === '2026-10-06' ||
            i.invoiceNumber?.includes('293') ||
            i.invoiceNumber?.includes('294') ||
            i.invoiceNumber?.includes('295')) &&
          i.status !== 'COBRADA'
      );
      return has293 && has294 && has295 && hasOctoberPending ? parsed : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [schedules, setSchedules] = useState<MonthlyLiquidationSchedule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCHEDULES);
      if (!saved) return INITIAL_MONTHLY_SCHEDULES;
      const parsed = JSON.parse(saved);
      const hasOct = parsed.some((s: any) => s.monthKey === '2026-10' && s.pendingCollection >= 762210);
      return hasOct ? parsed : INITIAL_MONTHLY_SCHEDULES;
    } catch {
      return INITIAL_MONTHLY_SCHEDULES;
    }
  });

  const [certificates, setCertificates] = useState<MedicalCertificate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CERTIFICATES);
      if (!saved) return INITIAL_CERTIFICATES;
      const parsed = JSON.parse(saved);
      const hasAlex = Array.isArray(parsed) && parsed.some((c: any) => c.patientName?.includes('Alex'));
      return hasAlex ? parsed : INITIAL_CERTIFICATES;
    } catch {
      return INITIAL_CERTIFICATES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CERTIFICATES, JSON.stringify(certificates));
    } catch (e) {
      console.error('Failed to save certificates', e);
    }
  }, [certificates]);

  // Self-healing synchronization: Always guarantee the 3 October invoices exist and reflect pending collection for 20/10
  useEffect(() => {
    const has293 = invoices.some(i => i.invoiceNumber?.includes('293') || i.id === 'inv-afip-293');
    const has294 = invoices.some(i => i.invoiceNumber?.includes('294') || i.id === 'inv-afip-294');
    const has295 = invoices.some(i => i.invoiceNumber?.includes('295') || i.id === 'inv-afip-295');
    const hasPendingOct = invoices.some(
      i =>
        (i.expectedCollectionDate === '2026-10-20' ||
          i.issueDate === '2026-10-06' ||
          i.invoiceNumber?.includes('293') ||
          i.invoiceNumber?.includes('294') ||
          i.invoiceNumber?.includes('295')) &&
        i.status !== 'COBRADA'
    );

    if (!has293 || !has294 || !has295 || !hasPendingOct) {
      setInvoices(INITIAL_INVOICES);
      try {
        localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(INITIAL_INVOICES));
      } catch (e) {
        console.error(e);
      }
    }
  }, [invoices]);

  // Clean up obsolete legacy cache keys from localStorage
  useEffect(() => {
    try {
      const oldKeys = [
        'ciavarelli_hub_cases_v6',
        'ciavarelli_hub_invoices_v6',
        'ciavarelli_hub_settings_v6',
        'ciavarelli_hub_schedules_v6',
        'ciavarelli_hub_cases_v7',
        'ciavarelli_hub_invoices_v7',
      ];
      oldKeys.forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(cases));
    } catch (e) {
      console.error('Failed to save cases to localStorage', e);
    }
  }, [cases]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));
    } catch (e) {
      console.error('Failed to save invoices to localStorage', e);
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(schedules));
    } catch (e) {
      console.error('Failed to save schedules to localStorage', e);
    }
  }, [schedules]);

  // Surgical Cases actions
  const addCase = (newCaseData: Omit<SurgicalCase, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `case-${Date.now()}`;
    const now = new Date().toISOString();
    const newCase: SurgicalCase = {
      ...newCaseData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    setCases(prev => [newCase, ...prev]);
    return newCase;
  };

  const updateCase = (id: string, updates: Partial<SurgicalCase>) => {
    setCases(prev =>
      prev.map(c => {
        if (c.id === id) {
          return { ...c, ...updates, updatedAt: new Date().toISOString() };
        }
        return c;
      })
    );
  };

  const updateCaseStatus = (id: string, status: SurgeryStatus) => {
    updateCase(id, { status });
  };

  const deleteCase = (id: string) => {
    setCases(prev => prev.filter(c => c.id !== id));
    setInvoices(prev => prev.filter(inv => inv.caseId !== id));
  };

  // Invoices actions
  const addInvoice = (newInvData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `inv-${Date.now()}`;
    const now = new Date().toISOString();
    const newInvoice: Invoice = {
      ...newInvData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    setInvoices(prev => [newInvoice, ...prev]);

    if (newInvData.caseId) {
      setCases(prev =>
        prev.map(c => (c.id === newInvData.caseId ? { ...c, invoiceId: id } : c))
      );
    }
    return newInvoice;
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices(prev =>
      prev.map(inv => (inv.id === id ? { ...inv, ...updates, updatedAt: new Date().toISOString() } : inv))
    );
  };

  const updateInvoiceStatus = (id: string, status: InvoiceStatus) => {
    const nowStr = new Date().toISOString().split('T')[0];
    const actualCollectionDate = status === 'COBRADA' ? nowStr : undefined;
    updateInvoice(id, {
      status,
      ...(actualCollectionDate ? { actualCollectionDate } : {}),
    });
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    setCases(prev =>
      prev.map(c => (c.invoiceId === id ? { ...c, invoiceId: undefined } : c))
    );
  };

  // Budget actions
  const approveBudget = (
    caseId: string,
    approvalData: {
      surgeryDate?: string;
      surgeryTime?: string;
      surgeryClinic?: string;
      operatingRoom?: string;
      notes?: string;
      budgetApprovedAmount?: number;
      budgetAdjustmentReason?: string;
      isCompleted?: boolean;
    }
  ) => {
    const existingCase = cases.find(c => c.id === caseId);
    const sDate = approvalData.surgeryDate || existingCase?.surgeryDate || new Date().toISOString().split('T')[0];
    const isCompleted = approvalData.isCompleted ?? false;

    // Calculate 3-month (90 days) settlement estimated date and month label
    const d = new Date(sDate + 'T12:00:00Z');
    d.setDate(d.getDate() + 90);
    const estimatedSettlementMonth = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(d);
    const liquidationDueDate = d.toISOString().split('T')[0];

    const approvedAmount =
      approvalData.budgetApprovedAmount !== undefined
        ? Number(approvalData.budgetApprovedAmount)
        : existingCase?.budgetAmount || 0;
    const originalAmount = existingCase?.budgetAmount || 0;
    const diff = approvedAmount - originalAmount;

    updateCase(caseId, {
      budgetStatus: 'APROBADO',
      status: isCompleted ? 'REALIZADA' : 'PROGRAMADA',
      isSurgeryCompleted: isCompleted,
      budgetApprovalDate: approvalData.surgeryDate || new Date().toISOString().split('T')[0],
      budgetApprovedAmount: approvedAmount,
      budgetDifference: diff,
      ...(approvalData.budgetAdjustmentReason ? { budgetAdjustmentReason: approvalData.budgetAdjustmentReason } : {}),
      estimatedSettlementAmount: approvedAmount,
      estimatedSettlementMonth,
      liquidationDueDate,
      ...(approvalData.surgeryDate ? { surgeryDate: approvalData.surgeryDate } : {}),
      ...(approvalData.surgeryTime ? { surgeryTime: approvalData.surgeryTime } : {}),
      ...(approvalData.surgeryClinic ? { estimatedSurgeryClinic: approvalData.surgeryClinic } : {}),
      ...(approvalData.operatingRoom ? { operatingRoom: approvalData.operatingRoom } : {}),
      ...(approvalData.notes ? { notes: approvalData.notes } : {}),
    });
  };

  const rejectBudget = (caseId: string, reason?: string) => {
    updateCase(caseId, {
      budgetStatus: 'RECHAZADO',
      notes: reason ? `Presupuesto rechazado: ${reason}` : undefined,
    });
  };

  // Schedules actions
  const updateSchedule = (monthKey: string, updates: Partial<MonthlyLiquidationSchedule>) => {
    setSchedules(prev =>
      prev.map(s => (s.monthKey === monthKey ? { ...s, ...updates } : s))
    );
  };

  // Settings actions
  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const addCatalogItem = (type: 'clinics' | 'surgeons' | 'insurances' | 'specialties', item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    setSettings(prev => {
      if (prev[type].includes(trimmed)) return prev;
      return {
        ...prev,
        [type]: [...prev[type], trimmed],
      };
    });
  };

  const removeCatalogItem = (type: 'clinics' | 'surgeons' | 'insurances' | 'specialties', item: string) => {
    setSettings(prev => ({
      ...prev,
      [type]: prev[type].filter(i => i !== item),
    }));
  };

  const addCertificate = (certData: Omit<MedicalCertificate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const count = certificates.length + 1;
    const certNumber = certData.certificateNumber || `CEMET-2026-${String(count).padStart(3, '0')}`;
    const newCert: MedicalCertificate = {
      ...certData,
      id: `cert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      certificateNumber: certNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCertificates(prev => [newCert, ...prev]);
    return newCert;
  };

  const updateCertificate = (id: string, updates: Partial<MedicalCertificate>) => {
    setCertificates(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    );
  };

  const deleteCertificate = (id: string) => {
    setCertificates(prev => prev.filter(c => c.id !== id));
  };

  // Official Invoices & Schedules Manual Synchronization
  const syncOfficialInvoices = () => {
    setCases(INITIAL_CASES);
    setInvoices(INITIAL_INVOICES);
    setSchedules(INITIAL_MONTHLY_SCHEDULES);
    setSettings(INITIAL_SETTINGS);
    setCertificates(INITIAL_CERTIFICATES);
    try {
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(INITIAL_CASES));
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(INITIAL_INVOICES));
      localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(INITIAL_MONTHLY_SCHEDULES));
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      localStorage.setItem(STORAGE_KEY_CERTIFICATES, JSON.stringify(INITIAL_CERTIFICATES));
    } catch (e) {
      console.error(e);
    }
  };

  const resetToDemoData = () => {
    syncOfficialInvoices();
  };

  const createInvoiceForCase = (c: SurgicalCase) => {
    const estimatedSurgeonFee = c.estimatedSettlementAmount || 500000;
    const todayStr = new Date().toISOString().split('T')[0];

    // Pago esperado el día 20 del mes de emisión
    const issueDateObj = new Date();
    const expectedYear = issueDateObj.getFullYear();
    const expectedMonth = String(issueDateObj.getMonth() + 1).padStart(2, '0');
    const expectedStr = `${expectedYear}-${expectedMonth}-20`;

    const count = invoices.length + 1;
    const invoiceNumber = `FAC-2026-${String(count).padStart(2, '0')}`;

    const newInv = addInvoice({
      invoiceNumber,
      caseId: c.id,
      patientName: c.patientName,
      patientMedicalRecordNumber: c.patientMedicalRecordNumber,
      insuranceProvider: c.insuranceProvider,
      clinic: c.estimatedSurgeryClinic,
      surgeonFee: estimatedSurgeonFee,
      materialsCost: 0,
      taxRate: 0,
      totalAmount: estimatedSurgeonFee,
      currency: settings.defaultCurrency,
      issueDate: todayStr,
      expectedCollectionDate: expectedStr,
      status: 'PENDIENTE',
      auditNotes: `Liquidación generada para ${c.patientName} (${c.procedureName}). Pago esperado el día 20.`,
    });

    return newInv;
  };

  return {
    cases,
    invoices,
    settings,
    schedules,
    certificates,
    addCase,
    updateCase,
    updateCaseStatus,
    deleteCase,
    addInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    approveBudget,
    rejectBudget,
    syncOfficialInvoices,
    updateSchedule,
    updateSettings,
    addCatalogItem,
    removeCatalogItem,
    resetToDemoData,
    createInvoiceForCase,
    addCertificate,
    updateCertificate,
    deleteCertificate,
  };
}
