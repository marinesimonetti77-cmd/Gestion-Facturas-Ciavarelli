import { useState, useEffect } from 'react';
import { SurgicalCase, Invoice, AppSettings, SurgeryStatus, InvoiceStatus, MonthlyLiquidationSchedule } from '../types/surgical';
import { INITIAL_CASES, INITIAL_INVOICES, INITIAL_SETTINGS, INITIAL_MONTHLY_SCHEDULES } from './mockData';

const STORAGE_KEY_CASES = 'ciavarelli_hub_cases_v5';
const STORAGE_KEY_INVOICES = 'ciavarelli_hub_invoices_v5';
const STORAGE_KEY_SETTINGS = 'ciavarelli_hub_settings_v5';
const STORAGE_KEY_SCHEDULES = 'ciavarelli_hub_schedules_v5';

export function useSurgicalStore() {
  const [cases, setCases] = useState<SurgicalCase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CASES);
      if (!saved) return INITIAL_CASES;
      const parsed = JSON.parse(saved);
      // Ensure it contains real cases and not legacy fake data
      const hasRealCiavarelliCase = parsed.some((c: any) => c.patientName?.includes('Quintana') || c.patientName?.includes('GARCIA'));
      return hasRealCiavarelliCase ? parsed : INITIAL_CASES;
    } catch {
      return INITIAL_CASES;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INVOICES);
      if (!saved) return INITIAL_INVOICES;
      const parsed = JSON.parse(saved);
      const hasRealAfipInvoices = parsed.some((i: any) => i.invoiceNumber?.includes('00003-00000275') || i.pointOfSale === '00003');
      const hasLiquidaciones = parsed.some((i: any) => i.attachedDocuments?.some((d: any) => d.fileType === 'liquidacion'));
      return hasRealAfipInvoices && hasLiquidaciones ? parsed : INITIAL_INVOICES;
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
      return saved ? JSON.parse(saved) : INITIAL_MONTHLY_SCHEDULES;
    } catch {
      return INITIAL_MONTHLY_SCHEDULES;
    }
  });

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

  const resetToDemoData = () => {
    setCases(INITIAL_CASES);
    setInvoices(INITIAL_INVOICES);
    setSettings(INITIAL_SETTINGS);
    setSchedules(INITIAL_MONTHLY_SCHEDULES);
    localStorage.removeItem(STORAGE_KEY_CASES);
    localStorage.removeItem(STORAGE_KEY_INVOICES);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    localStorage.removeItem(STORAGE_KEY_SCHEDULES);
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
    addCase,
    updateCase,
    updateCaseStatus,
    deleteCase,
    addInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    updateSchedule,
    updateSettings,
    addCatalogItem,
    removeCatalogItem,
    resetToDemoData,
    createInvoiceForCase,
  };
}
