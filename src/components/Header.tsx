import React from 'react';
import {
  Activity,
  Calendar,
  FileText,
  PieChart,
  Table,
  Settings,
  Plus,
  Bot,
  AlertCircle,
  Building2,
  DollarSign,
  Clock,
  FileCheck,
  RefreshCw,
  LogOut,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';
import { FinancialMetrics, SurgeryMetrics } from '../lib/surgicalLogic';
import { formatCurrency, CurrencyCode } from '../lib/currency';
import { AppUser } from '../types/auth';

interface HeaderProps {
  activeTab: 'calendar' | 'cases' | 'budgets' | 'invoices' | 'analytics' | 'sheets' | 'config';
  setActiveTab: (tab: 'calendar' | 'cases' | 'budgets' | 'invoices' | 'analytics' | 'sheets' | 'config') => void;
  finMetrics: FinancialMetrics;
  surgMetrics: SurgeryMetrics;
  currency: CurrencyCode;
  onOpenNewCase: () => void;
  onOpenNewInvoice: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onSyncInvoices?: () => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  finMetrics,
  surgMetrics,
  currency,
  onOpenNewCase,
  onOpenNewInvoice,
  onToggleChat,
  isChatOpen,
  onSyncInvoices,
  currentUser,
  onLogout,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      {/* Top Banner with Branding and Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Dr. Ciavarelli · Cirugías & Facturación
                </h1>
                <span className="text-[11px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  100% Editable
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Control de expedientes quirúrgicos, liquidaciones mensuales y fecha estimada de cobro (Día 20)
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 md:pb-0 text-xs">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center gap-2 whitespace-nowrap">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-slate-400 block text-[10px]">Expedientes Activos</span>
                <span className="font-semibold text-cyan-300">{surgMetrics.totalCases} pacientes</span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center gap-2 whitespace-nowrap">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-slate-400 block text-[10px]">Total Cobrado / Retirado</span>
                <span className="font-semibold text-emerald-300 font-mono">
                  {formatCurrency(finMetrics.totalCollected, currency)}
                </span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center gap-2 whitespace-nowrap">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-slate-400 block text-[10px]">Pendiente de Cobro</span>
                <span className="font-semibold text-amber-300 font-mono">
                  {formatCurrency(finMetrics.totalPending, currency)}
                </span>
              </div>
            </div>

            {/* 3-month liquidation alert indicator */}
            <button
              onClick={() => setActiveTab('cases')}
              className="bg-rose-950/70 hover:bg-rose-900/80 border border-rose-500/80 rounded-lg px-3 py-1.5 flex items-center gap-2 whitespace-nowrap transition cursor-pointer text-left shadow-sm"
              title="4 cirugías de Julio cumplieron 3 meses de espera reglamentaria tras el Parte Qx. Clic para ver casos y reclamar liquidación."
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
              <div>
                <span className="text-rose-300 block text-[10px] font-bold uppercase tracking-wider">A la espera de liquidación</span>
                <span className="font-bold text-rose-100 font-mono">4 casos (3 meses cumplidos)</span>
              </div>
            </button>

            {/* AI Assistant toggle button */}
            <button
              onClick={onToggleChat}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium transition-all ${
                isChatOpen
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/30'
              }`}
              title="Abrir Asistente Quirúrgico IA"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Asistente</span>
            </button>

            {/* Current Logged User Profile & Logout */}
            {currentUser && (
              <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg p-1 pl-2 text-xs">
                <div
                  className={`w-6 h-6 rounded-md bg-gradient-to-tr ${
                    currentUser.avatarColor || 'from-cyan-500 to-blue-600'
                  } flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}
                  title={currentUser.roleLabel}
                >
                  {currentUser.fullName
                    .split(' ')
                    .map(n => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="hidden xl:block text-left mr-1">
                  <span className="text-[11px] font-bold text-white block leading-tight truncate max-w-[150px]">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[9px] text-cyan-400 block font-mono">
                    {currentUser.role === 'DOCTOR' ? 'Cirujano' : currentUser.role === 'SECRETARY' ? 'Administración' : 'Admin'}
                  </span>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 rounded-md transition cursor-pointer"
                    title="Cerrar sesión (requiere usuario y contraseña)"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs & Primary Actions */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <nav className="flex space-x-1.5 sm:space-x-2 overflow-x-auto pb-1.5 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
                activeTab === 'calendar'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4 text-cyan-300" />
              <span>Calendario de Cobros</span>
            </button>

            <button
              onClick={() => setActiveTab('cases')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                activeTab === 'cases'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Expedientes & Cirugías</span>
              <span className="text-xs bg-slate-900/60 px-1.5 py-0.5 rounded-full font-mono">
                {surgMetrics.totalCases}
              </span>
              <span className="text-[10px] bg-rose-500/90 text-white px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                4 🚨
              </span>
            </button>

            <button
              onClick={() => setActiveTab('budgets')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                activeTab === 'budgets'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileCheck className="w-4 h-4 text-purple-300" />
              <span>Presupuestos Qx</span>
              <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full animate-pulse shadow-sm">
                {surgMetrics.pendingBudgetsCount || 0} ⏳
              </span>
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                activeTab === 'invoices'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Facturación & Liquidaciones</span>
              <span className="text-xs bg-slate-900/60 px-1.5 py-0.5 rounded-full font-mono">
                {finMetrics.invoicesCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Métricas</span>
            </button>

            <button
              onClick={() => setActiveTab('sheets')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                activeTab === 'sheets'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Table className="w-4 h-4 text-emerald-400" />
              <span>Google Sheets & Backend</span>
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                activeTab === 'config'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Configuración</span>
            </button>
          </nav>

          {/* Quick Create Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onSyncInvoices && (
              <button
                onClick={onSyncInvoices}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                title="Sincronizar y recargar las 3 facturas de Octubre y presupuestos oficiales"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sincronizar 20/10</span>
              </button>
            )}

            <button
              onClick={onOpenNewCase}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Cirugía</span>
            </button>

            <button
              onClick={onOpenNewInvoice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Factura</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
