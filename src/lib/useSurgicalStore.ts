import { useState, useEffect } from 'react';
import { SurgicalCase, Invoice, AppSettings, SurgeryStatus, InvoiceStatus } from '../types/surgical';
import { INITIAL_CASES, INITIAL_INVOICES, INITIAL_SETTINGS } from './mockData';

const STORAGE_KEY_CASES = 'surgical_hub_cases_v1';
const STORAGE_KEY_INVOICES = 'surgical_hub_invoices_v1';
const STORAGE_KEY_SETTINGS = 'surgical_hub_settings_v1';

export function useSurgicalStore() {
  const [cases, setCases] = useState<SurgicalCase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CASES);
      return saved ? JSON.parse(saved) : INITIAL_CASES;
    } catch {
      return INITIAL_CASES;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INVOICES);
      return saved ? JSON.parse(saved) : INITIAL_INVOICES;
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
          const updated = { ...c, ...updates, updatedAt: new Date().toISOString() };
          // If patient name or clinic changed, keep linked invoice in sync
          if (updates.patientName || updates.estimatedSurgeryClinic) {
            setInvoices(invs =>
              invs.map(inv =>
                inv.caseId === id
                  ? {
                      ...inv,
                      patientName: updates.patientName || inv.patientName,
                      clinic: updates.estimatedSurgeryClinic || inv.clinic,
                      updatedAt: new Date().toISOString(),
                    }
                  : inv
              )
            );
          }
          return updated;
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
    // Detach or delete associated invoice
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

    // Link back to case if specified
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
    localStorage.removeItem(STORAGE_KEY_CASES);
    localStorage.removeItem(STORAGE_KEY_INVOICES);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
  };

  // Quick case-to-invoice generator
  const createInvoiceForCase = (c: SurgicalCase) => {
    const materialsTotal = (c.materials || []).reduce((acc, m) => acc + (m.cost * m.quantity), 0);
    const estimatedSurgeonFee = 750000;
    const base = materialsTotal + estimatedSurgeonFee;
    const taxRate = settings.defaultTaxRate || 21;
    const totalAmount = Math.round(base * (1 + taxRate / 100));

    const todayStr = new Date().toISOString().split('T')[0];
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 30);
    const expectedStr = expectedDate.toISOString().split('T')[0];

    const count = invoices.length + 1;
    const invoiceNumber = `FAC-2026-${String(count).padStart(4, '0')}`;

    const newInv = addInvoice({
      invoiceNumber,
      caseId: c.id,
      patientName: c.patientName,
      patientMedicalRecordNumber: c.patientMedicalRecordNumber,
      insuranceProvider: c.insuranceProvider,
      clinic: c.estimatedSurgeryClinic,
      surgeonFee: estimatedSurgeonFee,
      materialsCost: materialsTotal,
      taxRate,
      totalAmount,
      currency: settings.defaultCurrency,
      issueDate: todayStr,
      expectedCollectionDate: expectedStr,
      status: 'EMITIDA',
      auditNotes: `Factura generada automáticamente para la cirugía ${c.procedureName}.`,
    });

    return newInv;
  };

  return {
    cases,
    invoices,
    settings,
    addCase,
    updateCase,
    updateCaseStatus,
    deleteCase,
    addInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    updateSettings,
    addCatalogItem,
    removeCatalogItem,
    resetToDemoData,
    createInvoiceForCase,
  };
}
