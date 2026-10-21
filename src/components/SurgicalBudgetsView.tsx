import React, { useState, useMemo } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  User,
  Stethoscope,
  Plus,
  Eye,
  ShieldCheck,
  Search,
  Filter,
  DollarSign,
  ArrowRight,
  Printer,
  Sparkles,
} from 'lucide-react';
import { SurgicalCase, AttachedDocument } from '../types/surgical';
import { formatCurrency, CurrencyCode } from '../lib/currency';
import { ApproveBudgetModal } from './ApproveBudgetModal';

interface SurgicalBudgetsViewProps {
  cases: SurgicalCase[];
  currency: CurrencyCode;
  onEditCase: (c: SurgicalCase) => void;
  onNewBudget: () => void;
  onApproveBudget: (
    caseId: string,
    approvalData: {
      surgeryDate: string;
      surgeryTime?: string;
      operatingRoom?: string;
      clinic?: string;
      notes?: string;
    }
  ) => void;
  onViewDocument: (doc: AttachedDocument, c?: SurgicalCase) => void;
  onNavigateToCases: () => void;
}

export const SurgicalBudgetsView: React.FC<SurgicalBudgetsViewProps> = ({
  cases,
  currency,
  onEditCase,
  onNewBudget,
  onApproveBudget,
  onViewDocument,
  onNavigateToCases,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [caseToApprove, setCaseToApprove] = useState<SurgicalCase | null>(null);

  // Filter cases that are either PRESUPUESTADO or have budget information attached
  const budgetCases = useMemo(() => {
    return cases.filter(c => {
      const isBudgeted =
        c.status === 'PRESUPUESTADO' ||
        c.budgetStatus !== undefined ||
        (c.attachedDocuments && c.attachedDocuments.some(d => d.fileType === 'presupuesto'));
      return isBudgeted;
    });
  }, [cases]);

  const pendingBudgets = useMemo(() => {
    return budgetCases.filter(
      c => c.status === 'PRESUPUESTADO' || c.budgetStatus === 'PENDIENTE_APROBACION' || !c.surgeryDate
    );
  }, [budgetCases]);

  const approvedBudgets = useMemo(() => {
    return budgetCases.filter(
      c => c.budgetStatus === 'APROBADO' || (c.status !== 'PRESUPUESTADO' && !!c.surgeryDate)
    );
  }, [budgetCases]);

  const totalPendingAmount = useMemo(() => {
    return pendingBudgets.reduce((acc, c) => {
      const amount = c.budgetAmount || c.estimatedSettlementAmount || 0;
      return acc + amount;
    }, 0);
  }, [pendingBudgets]);

  const filteredList = useMemo(() => {
    return budgetCases.filter(c => {
      const isPending =
        c.status === 'PRESUPUESTADO' || c.budgetStatus === 'PENDIENTE_APROBACION' || !c.surgeryDate;

      if (filterStatus === 'PENDING' && !isPending) return false;
      if (filterStatus === 'APPROVED' && isPending) return false;

      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesName = c.patientName.toLowerCase().includes(query);
        const matchesProc = c.procedureName.toLowerCase().includes(query);
        const matchesIns = c.insuranceProvider.toLowerCase().includes(query);
        const matchesDni = (c.patientDni || '').toLowerCase().includes(query);
        if (!matchesName && !matchesProc && !matchesIns && !matchesDni) return false;
      }
      return true;
    });
  }, [budgetCases, filterStatus, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Presupuestos Quirúrgicos & Espera de Aprobación
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Control de presupuestos médicos emitidos a sanatorios y obras sociales (ej. Corporación Médica, Plan 606). Permite dar seguimiento al estado de auditoría y asignar fecha definitiva una vez confirmada la aprobación.
          </p>
        </div>

        <button
          onClick={onNewBudget}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/30 transition active:scale-95 shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Presupuesto</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Budgets */}
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
              En Espera de Aprobación
            </span>
            <span className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Clock className="w-4 h-4 animate-pulse" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono flex items-baseline gap-2">
              <span>{pendingBudgets.length}</span>
              <span className="text-xs font-normal text-amber-300">casos en auditoría</span>
            </div>
            <p className="text-[11px] text-amber-200/80 mt-1">
              Esperando autorización sanatorial
            </p>
          </div>
        </div>

        {/* Total Pending Amount */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Monto en Gestión
            </span>
            <span className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-white font-mono">
              {formatCurrency(totalPendingAmount, currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Honorarios de equipo a confirmar
            </p>
          </div>
        </div>

        {/* Approved Budgets */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Aprobados con Fecha
            </span>
            <span className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono">
              {approvedBudgets.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Pasan a Cirugías Programadas
            </p>
          </div>
        </div>

        {/* Total Tracked Budgets */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Presupuestos
            </span>
            <span className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono">
              {budgetCases.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Documentos emitidos CEMET / Ciavarelli
            </p>
          </div>
        </div>
      </div>

      {/* Workflow Explanatory Notice */}
      <div className="bg-amber-950/30 border border-amber-600/50 rounded-2xl p-4 text-xs text-amber-200 flex items-start gap-3 shadow-sm">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1">
          <span className="font-bold text-white block">
            Circuito de Presupuestos Sanatoriales (CEMET / Corporación Médica):
          </span>
          <p className="text-amber-200/90 leading-relaxed">
            Cuando se emite una indicación con presupuesto (como el caso de <strong>Daniel Alberto Papasidero</strong> para Corporación Médica Asistencial Plan 606), el expediente permanece en <em>Espera de Aprobación</em>. Cuando el sanatorio autoriza el presupuesto y otorga fecha de quirófano, utilice el botón <strong>"Aprobar y Fijar Fecha de Cx"</strong>. El caso se convertirá automáticamente en <strong>Cirugía Programada</strong> manteniendo el PDF oficial como respaldo clínico-legal.
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setFilterStatus('PENDING')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'PENDING'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>En Espera ({pendingBudgets.length})</span>
            </button>

            <button
              onClick={() => setFilterStatus('APPROVED')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'APPROVED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Aprobados ({approvedBudgets.length})</span>
            </button>

            <button
              onClick={() => setFilterStatus('ALL')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Todos ({budgetCases.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar paciente, DNI, procedimiento..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredList.map(c => {
          const isPending =
            c.status === 'PRESUPUESTADO' || c.budgetStatus === 'PENDIENTE_APROBACION' || !c.surgeryDate;
          const budgetDoc =
            c.attachedDocuments?.find(d => d.fileType === 'presupuesto') ||
            c.attachedDocuments?.[0];

          return (
            <div
              key={c.id}
              className={`bg-slate-900 rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-md ${
                isPending
                  ? 'border-amber-500/80 ring-1 ring-amber-500/30 bg-gradient-to-b from-amber-950/20 to-slate-900 hover:border-amber-400'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                {/* Status Alert Banner */}
                {isPending ? (
                  <div className="bg-amber-950/80 border border-amber-500/70 rounded-xl px-3 py-2 text-xs text-amber-200 flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                      <span>⏳ EN ESPERA DE APROBACIÓN SANATORIAL</span>
                    </span>
                    <span className="text-[10px] bg-amber-900/80 px-2 py-0.5 rounded text-white font-mono">
                      Emitido: {c.budgetSentDate || '16/10/2026'}
                    </span>
                  </div>
                ) : (
                  <div className="bg-emerald-950/50 border border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-emerald-200 flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>✅ PRESUPUESTO APROBADO</span>
                    </span>
                    <span className="text-[11px] font-mono text-emerald-300">
                      Fecha Cx: {c.surgeryDate}
                    </span>
                  </div>
                )}

                {/* Patient Information Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded">
                        {c.patientMedicalRecordNumber}
                      </span>
                      <span className="text-[10px] font-bold text-purple-300 bg-purple-950/60 border border-purple-800/50 px-2 py-0.5 rounded">
                        {c.insuranceProvider}{c.insurancePlan ? ` · ${c.insurancePlan}` : ''}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mt-1.5 flex items-center gap-2">
                      <User className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{c.patientName}</span>
                    </h3>

                    <p className="text-xs text-slate-400 mt-0.5">
                      {c.patientDni ? `DNI: ${c.patientDni} · ` : ''}
                      Afiliado: <strong className="text-slate-300">{c.insuranceAffiliateNumber || '-'}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Honorarios Equipo
                    </span>
                    <span className="text-base font-black font-mono text-emerald-400 block mt-0.5">
                      {c.budgetAmount
                        ? formatCurrency(c.budgetAmount, currency)
                        : c.estimatedSettlementAmount
                        ? formatCurrency(c.estimatedSettlementAmount, currency)
                        : formatCurrency(0, currency)}
                    </span>
                  </div>
                </div>

                {/* Medical Details Card */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Procedimiento Quirúrgico
                    </span>
                    <p className="font-semibold text-slate-200 mt-0.5 leading-snug">
                      {c.procedureName}
                    </p>
                  </div>

                  {c.preoperativeDiagnosis && (
                    <div className="pt-2 border-t border-slate-900">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                        Diagnóstico Oncológico / Preoperatorio
                      </span>
                      <p className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">
                        {c.preoperativeDiagnosis}
                      </p>
                    </div>
                  )}

                  {/* Team & Logistics Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">
                        Cirujano: <strong className="text-slate-200">{c.surgeonName}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">
                        Ayudantes: {c.assistantName} {c.secondAssistantName ? `, ${c.secondAssistantName}` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Duración: {c.estimatedDurationHours || 5} hs</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>UCI: {c.icuDaysEstimated || 3} días internación</span>
                    </div>
                  </div>
                </div>

                {/* Attached PDF Preview indicator */}
                {budgetDoc && (
                  <div className="bg-purple-950/20 border border-purple-800/40 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-purple-300">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <span className="font-semibold text-white truncate max-w-[220px]">
                        {budgetDoc.fileName}
                      </span>
                    </div>
                    <button
                      onClick={() => onViewDocument(budgetDoc, c)}
                      className="text-xs text-purple-300 hover:text-white flex items-center gap-1 font-semibold underline underline-offset-2 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Documento</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {budgetDoc && (
                    <button
                      onClick={() => onViewDocument(budgetDoc, c)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                      title="Ver presupuesto oficial PDF"
                    >
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                      <span>Ver PDF Oficial</span>
                    </button>
                  )}

                  <button
                    onClick={() => onEditCase(c)}
                    className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition"
                  >
                    Editar
                  </button>
                </div>

                {/* Primary Action Button */}
                {isPending ? (
                  <button
                    onClick={() => setCaseToApprove(c)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/50 transition active:scale-95"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Aprobar y Fijar Fecha de Cx</span>
                  </button>
                ) : (
                  <button
                    onClick={onNavigateToCases}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-semibold transition"
                  >
                    <span>Ver en Cirugías Programadas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="font-semibold text-white">No se encontraron presupuestos en esta categoría</p>
            <p className="text-xs text-slate-500 mt-1">
              Haga clic en "Nuevo Presupuesto" para registrar un presupuesto quirúrgico enviado a autorizar.
            </p>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {caseToApprove && (
        <ApproveBudgetModal
          isOpen={!!caseToApprove}
          onClose={() => setCaseToApprove(null)}
          caseItem={caseToApprove}
          currency={currency}
          onApprove={onApproveBudget}
        />
      )}
    </div>
  );
};
