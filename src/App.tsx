import React, { useState, useMemo } from 'react';
import { useSurgicalStore } from './lib/useSurgicalStore';
import { calculateFinancialMetrics, calculateSurgeryMetrics } from './lib/surgicalLogic';
import { Header } from './components/Header';
import { SurgicalCasesList } from './components/SurgicalCasesList';
import { InvoicesList } from './components/InvoicesList';
import { AnalyticsView } from './components/AnalyticsView';
import { GoogleSheetsIntegration } from './components/GoogleSheetsIntegration';
import { ConfigPanel } from './components/ConfigPanel';
import { CaseEditModal } from './components/CaseEditModal';
import { InvoiceEditModal } from './components/InvoiceEditModal';
import { AIChatBox } from './components/AIChatBox';
import { SurgicalCase, Invoice } from './types/surgical';

export default function App() {
  const {
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
  } = useSurgicalStore();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'cases' | 'invoices' | 'analytics' | 'sheets' | 'config'>('cases');

  // Modal states
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState<SurgicalCase | null>(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);

  // AI Chat Assistant
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Live metrics
  const finMetrics = useMemo(() => calculateFinancialMetrics(invoices), [invoices]);
  const surgMetrics = useMemo(() => calculateSurgeryMetrics(cases), [cases]);

  // Case Modal Handlers
  const handleOpenNewCase = () => {
    setCaseToEdit(null);
    setIsCaseModalOpen(true);
  };

  const handleEditCase = (c: SurgicalCase) => {
    setCaseToEdit(c);
    setIsCaseModalOpen(true);
  };

  const handleSaveCase = (caseData: any) => {
    if (caseToEdit) {
      updateCase(caseToEdit.id, caseData);
      showToast(`Cirugía de ${caseData.patientName} actualizada correctamente.`);
    } else {
      addCase(caseData);
      showToast(`Nueva cirugía para ${caseData.patientName} registrada.`);
    }
  };

  // Invoice Modal Handlers
  const handleOpenNewInvoice = () => {
    setInvoiceToEdit(null);
    setIsInvoiceModalOpen(true);
  };

  const handleEditInvoice = (inv: Invoice) => {
    setInvoiceToEdit(inv);
    setIsInvoiceModalOpen(true);
  };

  const handleSaveInvoice = (invoiceData: any) => {
    if (invoiceToEdit) {
      updateInvoice(invoiceToEdit.id, invoiceData);
      showToast(`Factura ${invoiceData.invoiceNumber} actualizada.`);
    } else {
      addInvoice(invoiceData);
      showToast(`Factura ${invoiceData.invoiceNumber} creada con éxito.`);
    }
  };

  const handleQuickCreateInvoiceForCase = (c: SurgicalCase) => {
    const newInv = createInvoiceForCase(c);
    showToast(`Se generó la factura ${newInv.invoiceNumber} para ${c.patientName}.`);
    setActiveTab('invoices');
  };

  const handleViewInvoiceById = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (inv) {
      setInvoiceToEdit(inv);
      setIsInvoiceModalOpen(true);
    }
  };

  const handleViewCaseById = (caseId: string) => {
    const c = cases.find(item => item.id === caseId);
    if (c) {
      setCaseToEdit(c);
      setIsCaseModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header with Navigation & Live KPIs */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        finMetrics={finMetrics}
        surgMetrics={surgMetrics}
        currency={settings.defaultCurrency}
        onOpenNewCase={handleOpenNewCase}
        onOpenNewInvoice={handleOpenNewInvoice}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'cases' && (
          <SurgicalCasesList
            cases={cases}
            clinics={settings.clinics}
            surgeons={settings.surgeons}
            onEditCase={handleEditCase}
            onNewCase={handleOpenNewCase}
            onDeleteCase={id => {
              deleteCase(id);
              showToast('Cirugía eliminada.');
            }}
            onUpdateStatus={(id, status) => {
              updateCaseStatus(id, status);
              showToast(`Estado de cirugía actualizado a ${status}.`);
            }}
            onUpdateClinic={(id, clinic) => {
              updateCase(id, { estimatedSurgeryClinic: clinic });
              showToast(`Clínica actualizada a ${clinic}.`);
            }}
            onUpdateDate={(id, surgeryDate) => {
              updateCase(id, { surgeryDate });
              showToast(`Fecha de cirugía actualizada a ${surgeryDate}.`);
            }}
            onCreateInvoice={handleQuickCreateInvoiceForCase}
            onViewInvoice={handleViewInvoiceById}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesList
            invoices={invoices}
            cases={cases}
            currency={settings.defaultCurrency}
            metrics={finMetrics}
            onEditInvoice={handleEditInvoice}
            onNewInvoice={handleOpenNewInvoice}
            onDeleteInvoice={id => {
              deleteInvoice(id);
              showToast('Factura eliminada.');
            }}
            onUpdateStatus={(id, status) => {
              updateInvoiceStatus(id, status);
              showToast(`Estado de factura cambiado a ${status}.`);
            }}
            onUpdateExpectedDate={(id, expectedCollectionDate) => {
              updateInvoice(id, { expectedCollectionDate });
              showToast(`Fecha estimada de cobro cambiada a ${expectedCollectionDate}.`);
            }}
            onUpdateTotalAmount={(id, totalAmount) => {
              updateInvoice(id, { totalAmount });
              showToast(`Monto de factura actualizado.`);
            }}
            onViewCase={handleViewCaseById}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            cases={cases}
            invoices={invoices}
            finMetrics={finMetrics}
            surgMetrics={surgMetrics}
            currency={settings.defaultCurrency}
            onSelectCase={c => {
              setCaseToEdit(c);
              setIsCaseModalOpen(true);
            }}
            onSelectInvoice={inv => {
              setInvoiceToEdit(inv);
              setIsInvoiceModalOpen(true);
            }}
          />
        )}

        {activeTab === 'sheets' && (
          <GoogleSheetsIntegration
            cases={cases}
            invoices={invoices}
            googleSheetsEndpoint={settings.googleSheetsEndpoint}
            onUpdateEndpoint={url => {
              updateSettings({ googleSheetsEndpoint: url });
              showToast('URL de Google Apps Script actualizada.');
            }}
            onRestoreData={(newCases, newInvoices) => {
              // Replace store state
              newCases.forEach(c => updateCase(c.id, c));
              newInvoices.forEach(i => updateInvoice(i.id, i));
              showToast('Datos restaurados con éxito.');
            }}
          />
        )}

        {activeTab === 'config' && (
          <ConfigPanel
            settings={settings}
            onUpdateSettings={updateSettings}
            onAddCatalogItem={addCatalogItem}
            onRemoveCatalogItem={removeCatalogItem}
            onResetDemoData={() => {
              resetToDemoData();
              showToast('Datos restablecidos a la configuración de demostración.');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>
          Sistema de Gestión Quirúrgica & Facturación Médica · 100% Editable en tiempo real
        </p>
      </footer>

      {/* Case Edit Modal */}
      <CaseEditModal
        isOpen={isCaseModalOpen}
        onClose={() => setIsCaseModalOpen(false)}
        caseToEdit={caseToEdit}
        onSave={handleSaveCase}
        onDelete={id => {
          deleteCase(id);
          showToast('Cirugía eliminada.');
        }}
        clinics={settings.clinics}
        surgeons={settings.surgeons}
        insurances={settings.insurances}
        specialties={settings.specialties}
      />

      {/* Invoice Edit Modal */}
      <InvoiceEditModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoiceToEdit={invoiceToEdit}
        cases={cases}
        onSave={handleSaveInvoice}
        onDelete={id => {
          deleteInvoice(id);
          showToast('Factura eliminada.');
        }}
        currency={settings.defaultCurrency}
      />

      {/* AI Assistant Chat Box */}
      <AIChatBox
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        cases={cases}
        invoices={invoices}
        currency={settings.defaultCurrency}
      />
    </div>
  );
}
