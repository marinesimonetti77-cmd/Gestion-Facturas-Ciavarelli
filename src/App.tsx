import React, { useState, useMemo } from 'react';
import { useSurgicalStore } from './lib/useSurgicalStore';
import { calculateFinancialMetrics, calculateSurgeryMetrics } from './lib/surgicalLogic';
import { Header } from './components/Header';
import { LiquidationCalendar } from './components/LiquidationCalendar';
import { SurgicalCasesList } from './components/SurgicalCasesList';
import { InvoicesList } from './components/InvoicesList';
import { AnalyticsView } from './components/AnalyticsView';
import { GoogleSheetsIntegration } from './components/GoogleSheetsIntegration';
import { ConfigPanel } from './components/ConfigPanel';
import { CaseEditModal } from './components/CaseEditModal';
import { InvoiceEditModal } from './components/InvoiceEditModal';
import { AIChatBox } from './components/AIChatBox';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { SurgicalBudgetsView } from './components/SurgicalBudgetsView';
import { LoginScreen } from './components/LoginScreen';
import { useAuth } from './lib/useAuth';
import { SurgicalCase, Invoice, AttachedDocument } from './types/surgical';

export default function App() {
  const {
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
    approveBudget,
    rejectBudget,
    syncOfficialInvoices,
  } = useSurgicalStore();

  const {
    users,
    currentUser,
    isAuthenticated,
    requireAuth,
    setRequireAuth,
    login,
    logout,
    changePassword,
    addUser,
    deleteUser,
  } = useAuth();

  // Active navigation tab (default to the Calendario de Cobros requested by the user!)
  const [activeTab, setActiveTab] = useState<'calendar' | 'cases' | 'budgets' | 'invoices' | 'analytics' | 'sheets' | 'config'>('calendar');

  // Modal states
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState<SurgicalCase | null>(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);

  // Document & Medical Protocol Viewer Modal State
  const [viewingDocState, setViewingDocState] = useState<{
    doc: AttachedDocument;
    surgicalCase?: SurgicalCase;
    invoice?: Invoice;
  } | null>(null);

  const handleOpenDocument = (
    doc: AttachedDocument,
    c?: SurgicalCase,
    inv?: Invoice
  ) => {
    setViewingDocState({ doc, surgicalCase: c, invoice: inv });
  };

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
      showToast(`Expediente de ${caseData.patientName} actualizado correctamente.`);
    } else {
      addCase(caseData);
      showToast(`Nuevo expediente para ${caseData.patientName} registrado.`);
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
      showToast(`Liquidación ${invoiceData.invoiceNumber} actualizada.`);
    } else {
      addInvoice(invoiceData);
      showToast(`Liquidación ${invoiceData.invoiceNumber} creada con éxito.`);
    }
  };

  const handleQuickCreateInvoiceForCase = (c: SurgicalCase) => {
    const newInv = createInvoiceForCase(c);
    showToast(`Se generó liquidación ${newInv.invoiceNumber} para ${c.patientName}.`);
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

  // Security Gate: Check credentials if auth is required and no active session
  if (requireAuth && !isAuthenticated) {
    return (
      <LoginScreen
        onLogin={(usernameAttempt, passAttempt) => {
          const res = login(usernameAttempt, passAttempt);
          if (res.success) {
            showToast('Sesión iniciada correctamente.');
          }
          return res;
        }}
        onBypass={() => setRequireAuth(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-600 selection:text-white">
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
        currentUser={currentUser}
        onLogout={() => {
          logout();
          showToast('Sesión cerrada correctamente.');
        }}
        onSyncInvoices={() => {
          syncOfficialInvoices();
          showToast('Datos oficiales sincronizados: 3 facturas de Octubre ($ 762.210) y Presupuestos actualizados');
        }}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: Calendario claro de liquidaciones y cobros */}
        {activeTab === 'calendar' && (
          <LiquidationCalendar
            schedules={schedules}
            cases={cases}
            invoices={invoices}
            currency={settings.defaultCurrency}
            onUpdateSchedule={(monthKey, updates) => {
              updateSchedule(monthKey, updates);
              showToast('Mes del calendario actualizado.');
            }}
            onSelectCase={c => {
              setCaseToEdit(c);
              setIsCaseModalOpen(true);
            }}
            onViewDocument={handleOpenDocument}
            onSyncInvoices={() => {
              syncOfficialInvoices();
              showToast('Facturas oficiales y liquidaciones del 20/10 sincronizadas con éxito.');
            }}
          />
        )}

        {/* TAB 2: Casos & Expedientes Quirúrgicos */}
        {activeTab === 'cases' && (
          <SurgicalCasesList
            cases={cases}
            clinics={settings.clinics}
            surgeons={settings.surgeons}
            onEditCase={handleEditCase}
            onNewCase={handleOpenNewCase}
            onDeleteCase={id => {
              deleteCase(id);
              showToast('Expediente eliminado.');
            }}
            onUpdateStatus={(id, status) => {
              updateCaseStatus(id, status);
              showToast(`Estado actualizado a ${status}.`);
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
            onViewDocument={handleOpenDocument}
          />
        )}

        {/* TAB: Presupuestos Quirúrgicos a la espera de Aprobación */}
        {activeTab === 'budgets' && (
          <SurgicalBudgetsView
            cases={cases}
            currency={settings.defaultCurrency}
            onEditCase={handleEditCase}
            onNewBudget={handleOpenNewCase}
            onApproveBudget={(caseId, approvalData) => {
              approveBudget(caseId, approvalData);
              showToast(`Presupuesto aprobado. Fecha de cirugía asignada para el ${approvalData.surgeryDate}.`);
            }}
            onViewDocument={handleOpenDocument}
            onNavigateToCases={() => setActiveTab('cases')}
          />
        )}

        {/* TAB 3: Facturación & Liquidaciones */}
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
              showToast('Liquidación eliminada.');
            }}
            onUpdateStatus={(id, status) => {
              updateInvoiceStatus(id, status);
              showToast(`Estado cambiado a ${status}.`);
            }}
            onUpdateExpectedDate={(id, expectedCollectionDate) => {
              updateInvoice(id, { expectedCollectionDate });
              showToast(`Fecha estimada de cobro cambiada a ${expectedCollectionDate}.`);
            }}
            onUpdateTotalAmount={(id, totalAmount) => {
              updateInvoice(id, { totalAmount });
              showToast(`Monto actualizado.`);
            }}
            onViewCase={handleViewCaseById}
            onViewDocument={handleOpenDocument}
            onSyncInvoices={() => {
              syncOfficialInvoices();
              showToast('Facturas oficiales y liquidaciones del 20/10 sincronizadas con éxito.');
            }}
          />
        )}

        {/* TAB 4: Métricas */}
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

        {/* TAB 5: Google Sheets */}
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
              newCases.forEach(c => updateCase(c.id, c));
              newInvoices.forEach(i => updateInvoice(i.id, i));
              showToast('Datos restaurados con éxito.');
            }}
          />
        )}

        {/* TAB 6: Configuración */}
        {activeTab === 'config' && (
          <ConfigPanel
            settings={settings}
            onUpdateSettings={updateSettings}
            onAddCatalogItem={addCatalogItem}
            onRemoveCatalogItem={removeCatalogItem}
            onResetDemoData={() => {
              resetToDemoData();
              showToast('Datos restablecidos.');
            }}
            users={users}
            currentUser={currentUser}
            onUpdatePassword={(userId, newPass) => {
              const res = changePassword(userId, newPass);
              if (res.success) showToast(res.message || 'Contraseña actualizada');
              return res;
            }}
            onAddUser={data => {
              const res = addUser(data);
              if (res.success) showToast(res.message || 'Usuario agregado');
              return res;
            }}
            onDeleteUser={userId => {
              const res = deleteUser(userId);
              if (res.success) showToast(res.message || 'Usuario eliminado');
              return res;
            }}
            requireAuth={requireAuth}
            onToggleRequireAuth={val => {
              setRequireAuth(val);
              showToast(val ? 'Contraseña requerida al iniciar' : 'Ingreso directo habilitado');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>
          Dr. Ciavarelli · Gestión de Cirugías y Facturación · 100% Editable en tiempo real
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
          showToast('Expediente eliminado.');
        }}
        onViewDocument={handleOpenDocument}
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
          showToast('Liquidación eliminada.');
        }}
        onViewDocument={handleOpenDocument}
        currency={settings.defaultCurrency}
      />

      {/* Document & Medical Protocol Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!viewingDocState}
        onClose={() => setViewingDocState(null)}
        document={viewingDocState?.doc || null}
        associatedCase={viewingDocState?.surgicalCase}
        associatedInvoice={viewingDocState?.invoice}
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
