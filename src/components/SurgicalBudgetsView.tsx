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
  TrendingDown,
  TrendingUp,
  Info,
  Edit3,
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
      budgetApprovedAmount?: number;
      budgetAdjustmentReason?: string;
      isCompleted?: boolean;
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
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'COMPLETED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [caseToApprove, setCaseToApprove] = useState<SurgicalCase | null>(null);

  // Filter cases that are either PRESUPUESTADO or have budget information attached
  const budgetCases = useMemo(() => {
    return cases.filter(c => {
      const isBudgeted =
        c.status === 'PRESUPUESTADO' ||
        c.budgetStatus !== undefined ||
        c.budgetAmount !== undefined ||
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
      c => (c.budgetStatus === 'APROBADO' || !!c.surgeryDate) && c.status !== 'REALIZADA'
    );
  }, [budgetCases]);

  const completedBudgets = useMemo(() => {
    return budgetCases.filter(c => c.status === 'REALIZADA' || Boolean(c.isSurgeryCompleted));
  }, [budgetCases]);

  const totalPendingAmount = useMemo(() => {
    return pendingBudgets.reduce((acc, c) => {
      const amount = c.budgetAmount || c.estimatedSettlementAmount || 0;
      return acc + amount;
    }, 0);
  }, [pendingBudgets]);

  const totalApprovedAmount = useMemo(() => {
    return [...approvedBudgets, ...completedBudgets].reduce((acc, c) => {
      const amount =
        c.budgetApprovedAmount !== undefined
          ? c.budgetApprovedAmount
          : c.budgetAmount || c.estimatedSettlementAmount || 0;
      return acc + amount;
    }, 0);
  }, [approvedBudgets, completedBudgets]);

  const filteredList = useMemo(() => {
    return budgetCases.filter(c => {
      const isPending =
        c.status === 'PRESUPUESTADO' || c.budgetStatus === 'PENDIENTE_APROBACION' || !c.surgeryDate;
      const isCompleted = c.status === 'REALIZADA' || Boolean(c.isSurgeryCompleted);

      if (filterStatus === 'PENDING' && !isPending) return false;
      if (filterStatus === 'APPROVED' && (isPending || isCompleted)) return false;
      if (filterStatus === 'COMPLETED' && !isCompleted) return false;

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
              Presupuestos Quirúrgicos, Aprobación & Liquidación
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Control de presupuestos médicos, registro de montos autorizados con o sin variación, fijación de fechas de intervención e inicio automático del cómputo de 3 meses para la liquidación sanatorial.
          </p>
        </div>

        <button
          onClick={onNewBudget}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/30 transition active:scale-95 shrink-0 self-start md:self-auto cursor-pointer"
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
              <span className="text-xs font-normal text-amber-300">en auditoría</span>
            </div>
            <p className="text-[11px] text-amber-200/80 mt-1">
              {formatCurrency(totalPendingAmount, currency)} a confirmar
            </p>
          </div>
        </div>

        {/* Operated / In 3-Month Countdown */}
        <div className="bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/40 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
              Cx Realizadas (Espera 3m)
            </span>
            <span className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Stethoscope className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono flex items-baseline gap-2">
              <span>{completedBudgets.length}</span>
              <span className="text-xs font-normal text-blue-300">con parte qx</span>
            </div>
            <p className="text-[11px] text-blue-200/80 mt-1">
              Conteo a 90 días en curso
            </p>
          </div>
        </div>

        {/* Approved Amount */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Monto Total Autorizado
            </span>
            <span className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-emerald-400 font-mono">
              {formatCurrency(totalApprovedAmount, currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Valores finales pactados con obras sociales
            </p>
          </div>
        </div>

        {/* Total Tracked Budgets */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Presupuestos
            </span>
            <span className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono">
              {budgetCases.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Expedientes registrados en el sistema
            </p>
          </div>
        </div>
      </div>

      {/* Case-in-point Banner (Papasidero) */}
      <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/40 rounded-2xl p-4 text-xs text-blue-200 flex items-start gap-3 shadow-sm">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white block">
            Caso Daniel Alberto Papasidero (Corporación Médica · Plan 606):
          </span>
          <p className="text-blue-200/90 leading-relaxed">
            Presupuestada originalmente por <strong>$1.300.000</strong>, autorizada finalmente por <strong>$900.000</strong> (-$400.000 de ajuste). La cirugía fue realizada el <strong>28/10/2026</strong> y cuenta con su protocolo quirúrgico oficial adjuntado. Ya se encuentra corriendo el plazo estándar de <strong>3 meses</strong> (90 días) para la liquidación sanatorial (fecha estimada de reclamo/cobro: <strong>enero de 2027</strong>).
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({budgetCases.length})
            </button>

            <button
              onClick={() => setFilterStatus('PENDING')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterStatus === 'PENDING'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>En Espera ({pendingBudgets.length})</span>
            </button>

            <button
              onClick={() => setFilterStatus('COMPLETED')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterStatus === 'COMPLETED'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-blue-400" />
              <span>Realizadas (3m) ({completedBudgets.length})</span>
            </button>

            <button
              onClick={() => setFilterStatus('APPROVED')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterStatus === 'APPROVED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Programadas ({approvedBudgets.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por paciente, DNI, obra social..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredList.map(c => {
          const isCompleted = c.status === 'REALIZADA' || Boolean(c.isSurgeryCompleted);
          const isPending =
            (c.status === 'PRESUPUESTADO' || c.budgetStatus === 'PENDIENTE_APROBACION' || !c.surgeryDate) &&
            !isCompleted;

          const budgetDoc = c.attachedDocuments?.find(d => d.fileType === 'presupuesto');
          const protocolDoc = c.attachedDocuments?.find(d => d.fileType === 'protocolo');

          // Days since surgery calculation for completed surgeries
          let daysSinceSurgery: number | null = null;
          if (c.surgeryDate) {
            const surgTime = new Date(c.surgeryDate + 'T12:00:00Z').getTime();
            const nowTime = new Date('2026-10-29T12:00:00Z').getTime();
            daysSinceSurgery = Math.floor((nowTime - surgTime) / (1000 * 60 * 60 * 24));
          }

          const hasDifferentApprovedAmount =
            c.budgetApprovedAmount !== undefined &&
            c.budgetAmount !== undefined &&
            c.budgetApprovedAmount !== c.budgetAmount;

          return (
            <div
              key={c.id}
              className={`bg-slate-900 rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-md ${
                isCompleted
                  ? 'border-blue-500/60 ring-1 ring-blue-500/20 bg-gradient-to-b from-blue-950/15 to-slate-900'
                  : isPending
                  ? 'border-amber-500/80 ring-1 ring-amber-500/30 bg-gradient-to-b from-amber-950/20 to-slate-900 hover:border-amber-400'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                {/* Status Alert Banner */}
                {isCompleted ? (
                  <div className="bg-gradient-to-r from-blue-950/90 via-slate-900 to-indigo-950/80 border border-blue-500/70 rounded-xl p-3 text-xs text-blue-200 space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-2 text-white">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>CIRUGÍA REALIZADA · {c.surgeryDate}</span>
                      </span>
                      <span className="text-[10px] bg-blue-900/80 text-blue-200 px-2 py-0.5 rounded font-mono border border-blue-700/60">
                        {c.surgeryTime ? `${c.surgeryTime} hs` : 'Parte Asentado'}
                      </span>
                    </div>

                    {/* 3-Month Countdown Progress */}
                    {daysSinceSurgery !== null && (
                      <div className="pt-1.5 border-t border-blue-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                        <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                          <Clock className="w-3.5 h-3.5 animate-pulse" />
                          <span>
                            Conteo de Liquidación: <strong>Día {Math.max(1, daysSinceSurgery)} de 90</strong> ({Math.max(0, 90 - daysSinceSurgery)} días restantes)
                          </span>
                        </span>
                        <span className="text-slate-300">
                          Liquidación estimada: <strong className="text-white underline">{c.estimatedSettlementMonth || 'enero de 2027'}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                ) : isPending ? (
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
                      <span>✅ PRESUPUESTO APROBADO (PROGRAMADA)</span>
                    </span>
                    <span className="text-[11px] font-mono text-emerald-300">
                      Fecha Cx: {c.surgeryDate}
                    </span>
                  </div>
                )}

                {/* Patient Information Header & Financial Totals */}
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

                  {/* Financial Comparison Box */}
                  <div className="text-right">
                    {hasDifferentApprovedAmount ? (
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Presupuestado: <span className="line-through text-slate-400 font-mono">{formatCurrency(c.budgetAmount || 0, currency)}</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
                          Aprobado Final
                        </span>
                        <span className="text-base font-black font-mono text-emerald-400 block">
                          {formatCurrency(c.budgetApprovedAmount!, currency)}
                        </span>
                        {c.budgetDifference !== undefined && (
                          <span
                            className={`inline-block text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                              c.budgetDifference < 0
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {c.budgetDifference < 0 ? '' : '+'}
                            {formatCurrency(c.budgetDifference, currency)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Honorarios {c.budgetStatus === 'APROBADO' ? 'Aprobados' : 'Presupuestados'}
                        </span>
                        <span className="text-base font-black font-mono text-emerald-400 block mt-0.5">
                          {formatCurrency(
                            c.budgetApprovedAmount !== undefined
                              ? c.budgetApprovedAmount
                              : c.budgetAmount || c.estimatedSettlementAmount || 0,
                            currency
                          )}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Explanation of Value Change (if any) */}
                {c.budgetAdjustmentReason && (
                  <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-amber-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300 block text-[11px]">
                        Aclaración de Variación en el Valor Aprobado:
                      </span>
                      <p className="text-[11px] text-amber-100/90 leading-relaxed mt-0.5">
                        {c.budgetAdjustmentReason}
                      </p>
                    </div>
                  </div>
                )}

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

                  {(c.operativeDiagnosis || c.preoperativeDiagnosis) && (
                    <div className="pt-2 border-t border-slate-900">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                        Diagnóstico {isCompleted ? 'Operatotorio (Confirmado)' : 'Preoperatorio'}
                      </span>
                      <p className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">
                        {c.operativeDiagnosis || c.preoperativeDiagnosis}
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
                      <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{c.estimatedSurgeryClinic}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        {isCompleted
                          ? `Realizada: ${c.surgeryDate}`
                          : c.surgeryDate
                          ? `Asignada: ${c.surgeryDate}`
                          : 'A asignar'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Attached Documents Quick Access */}
                <div className="space-y-1.5">
                  {/* Surgical Protocol if completed */}
                  {protocolDoc && (
                    <div className="bg-blue-950/30 border border-blue-700/40 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-blue-200">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="font-semibold text-white truncate max-w-[220px]">
                          {protocolDoc.title || 'Parte Quirúrgico Oficial (28/10/2026)'}
                        </span>
                      </div>
                      <button
                        onClick={() => onViewDocument(protocolDoc, c)}
                        className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 font-semibold underline underline-offset-2 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Protocolo</span>
                      </button>
                    </div>
                  )}

                  {/* Budget PDF Document */}
                  {budgetDoc && (
                    <div className="bg-purple-950/20 border border-purple-800/40 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-purple-300">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="font-semibold text-white truncate max-w-[220px]">
                          {budgetDoc.fileName}
                        </span>
                      </div>
                      <button
                        onClick={() => onViewDocument(budgetDoc, c)}
                        className="text-xs text-purple-300 hover:text-white flex items-center gap-1 font-semibold underline underline-offset-2 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Presupuesto</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditCase(c)}
                    className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Editar Caso</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Secondary/Edit Approval Button */}
                  <button
                    onClick={() => setCaseToApprove(c)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isCompleted || !isPending
                        ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-md shadow-emerald-950/50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {isCompleted
                        ? 'Ajustar Valor / Estado'
                        : !isPending
                        ? 'Modificar Aprobación'
                        : 'Aprobar y Registrar'}
                    </span>
                  </button>

                  {!isPending && (
                    <button
                      onClick={onNavigateToCases}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition cursor-pointer"
                      title="Ver en lista principal de cirugías"
                    >
                      <span>Ver Cirugías</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
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

      {/* Approval & Value Adjustment Modal */}
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
