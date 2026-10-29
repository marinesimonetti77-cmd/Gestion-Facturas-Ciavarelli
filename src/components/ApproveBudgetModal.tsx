import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  X,
  AlertCircle,
  DollarSign,
  User,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Info,
  Check,
} from 'lucide-react';
import { SurgicalCase } from '../types/surgical';
import { formatCurrency, CurrencyCode } from '../lib/currency';

interface ApproveBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: SurgicalCase | null;
  currency: CurrencyCode;
  onApprove: (
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
}

export const ApproveBudgetModal: React.FC<ApproveBudgetModalProps> = ({
  isOpen,
  onClose,
  caseItem,
  currency,
  onApprove,
}) => {
  // Original budget amount from case
  const originalBudget = caseItem?.budgetAmount || caseItem?.estimatedSettlementAmount || 0;

  // Initialize with existing values or defaults
  const [approvedAmountStr, setApprovedAmountStr] = useState<string>(() => {
    if (caseItem?.budgetApprovedAmount !== undefined) return String(caseItem.budgetApprovedAmount);
    if (caseItem?.budgetAmount) return String(caseItem.budgetAmount);
    return '0';
  });

  const [hasCustomAmount, setHasCustomAmount] = useState<boolean>(() => {
    return Boolean(
      caseItem?.budgetApprovedAmount !== undefined &&
      caseItem.budgetApprovedAmount !== caseItem.budgetAmount
    );
  });

  const [adjustmentReason, setAdjustmentReason] = useState<string>(
    caseItem?.budgetAdjustmentReason || ''
  );

  const [isCompleted, setIsCompleted] = useState<boolean>(
    caseItem?.status === 'REALIZADA' || Boolean(caseItem?.isSurgeryCompleted)
  );

  const [surgeryDate, setSurgeryDate] = useState<string>(
    caseItem?.surgeryDate || (caseItem?.status === 'REALIZADA' ? '2026-10-28' : '2026-10-28')
  );

  const [surgeryTime, setSurgeryTime] = useState<string>(caseItem?.surgeryTime || '13:30');
  const [operatingRoom, setOperatingRoom] = useState<string>(caseItem?.operatingRoom || 'Quirófano Central');
  const [clinic, setClinic] = useState<string>(
    caseItem?.estimatedSurgeryClinic || 'Corporación Médica de Gral San Martín SA'
  );
  const [approvalNotes, setApprovalNotes] = useState<string>(caseItem?.notes || '');
  const [error, setError] = useState<string>('');

  if (!isOpen || !caseItem) return null;

  const currentApprovedNum = parseFloat(approvedAmountStr) || 0;
  const diffAmount = currentApprovedNum - originalBudget;
  const diffPercent = originalBudget > 0 ? ((diffAmount / originalBudget) * 100).toFixed(1) : '0';

  // Calculate 3-month (90 days) settlement estimated date
  const computeSettlementTarget = () => {
    if (!surgeryDate) return null;
    const target = new Date(surgeryDate + 'T12:00:00Z');
    target.setDate(target.getDate() + 90);
    const label = new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(target);
    return {
      dateStr: target.toISOString().split('T')[0],
      displayLabel: label,
    };
  };

  const settlementTarget = computeSettlementTarget();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surgeryDate) {
      setError(
        isCompleted
          ? 'Por favor indique la fecha en que se realizó la intervención.'
          : 'Por favor indique la fecha de cirugía otorgada por el sanatorio.'
      );
      return;
    }

    if (currentApprovedNum < 0) {
      setError('El monto aprobado debe ser mayor o igual a 0.');
      return;
    }

    onApprove(caseItem.id, {
      surgeryDate,
      surgeryTime,
      operatingRoom,
      clinic: clinic || caseItem.estimatedSurgeryClinic,
      budgetApprovedAmount: currentApprovedNum,
      budgetAdjustmentReason: adjustmentReason.trim() || undefined,
      isCompleted,
      notes:
        approvalNotes ||
        (isCompleted
          ? `Cirugía realizada el ${surgeryDate}. Monto aprobado: ${formatCurrency(currentApprovedNum, currency)}.`
          : `Aprobado por auditoría médica sanatorial por ${formatCurrency(currentApprovedNum, currency)}.`),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Aprobación & Ajuste de Presupuesto Quirúrgico
              </h3>
              <p className="text-xs text-slate-400">
                Registra el monto final autorizado y el inicio del plazo de liquidación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Patient and Budget Summary Tile */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wide bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60 font-semibold">
                  {caseItem.insuranceProvider} · {caseItem.insurancePlan || 'Plan'}
                </span>
                <h4 className="text-sm font-bold text-white mt-1">
                  {caseItem.patientName}
                </h4>
                <p className="text-xs text-slate-400">
                  HC: <span className="font-mono text-slate-300">{caseItem.patientMedicalRecordNumber}</span>
                  {caseItem.patientDni ? ` · DNI: ${caseItem.patientDni}` : ''}
                  {caseItem.insuranceAffiliateNumber ? ` · Afiliado: ${caseItem.insuranceAffiliateNumber}` : ''}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Presupuestado Inicial
                </span>
                <span className="font-mono font-bold text-slate-300 text-sm">
                  {formatCurrency(originalBudget, currency)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
              <p className="font-medium text-slate-200">{caseItem.procedureName}</p>
            </div>
          </div>

          {error && (
            <div className="bg-rose-950/60 border border-rose-500/80 rounded-xl p-3 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SECTION 1: VALUE ADJUSTMENT / MONTO APROBADO VS PRESUPUESTADO */}
          <div className="bg-slate-950 border border-purple-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Monto Aprobado por la Obra Social / Prepaga
                </span>
              </div>
              <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded font-mono">
                Control de Arancel
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Monto Real Autorizado ($) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">$</span>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={approvedAmountStr}
                    onChange={e => {
                      setApprovedAmountStr(e.target.value);
                      setError('');
                    }}
                    placeholder="900000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setApprovedAmountStr(String(originalBudget))}
                    className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Usar valor original ({formatCurrency(originalBudget, currency)})
                  </button>
                  {caseItem.id === 'case-ciav-papasidero' && (
                    <button
                      type="button"
                      onClick={() => {
                        setApprovedAmountStr('900000');
                        setAdjustmentReason('Presupuestado por $1.300.000. Corporación Médica Asistencial autorizó finalmente $900.000.');
                      }}
                      className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      $ 900.000 (Papasidero)
                    </button>
                  )}
                </div>
              </div>

              {/* Difference and Comparison Badge */}
              <div className="p-3 rounded-xl border bg-slate-900/90 flex flex-col justify-center min-h-[70px]">
                {diffAmount === 0 ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Aprobado por el 100% de lo presupuestado</span>
                  </div>
                ) : diffAmount < 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                      <TrendingDown className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>Aprobado por un valor menor:</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-sm font-black text-amber-300">
                        {formatCurrency(diffAmount, currency)}
                      </span>
                      <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800/80 px-1.5 py-0.2 rounded font-bold">
                        {diffPercent}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      <span>Incremento sobre el presupuesto:</span>
                    </div>
                    <span className="font-mono text-sm font-black text-emerald-400">
                      +{formatCurrency(diffAmount, currency)} (+{diffPercent}%)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Adjustment Reason */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Aclaración o Motivo del Cambio de Valor</span>
                {diffAmount !== 0 && (
                  <span className="text-[10px] text-amber-400 font-normal">
                    Recomendado para auditoría y reclamo
                  </span>
                )}
              </label>
              <input
                type="text"
                value={adjustmentReason}
                onChange={e => setAdjustmentReason(e.target.value)}
                placeholder="Ej: Estaba presupuestada por $1.300.000 y Corporación Médica solo aprobó $900.000 por tope arancelario."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* SECTION 2: SURGERY STATUS SELECTOR (PROGRAMADA VS REALIZADA) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Estado de la Intervención Quirúrgica
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsCompleted(false)}
                className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                  !isCompleted
                    ? 'bg-blue-950/60 border-blue-500/80 text-white ring-1 ring-blue-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    !isCompleted ? 'border-blue-400 bg-blue-500 text-white' : 'border-slate-600'
                  }`}
                >
                  {!isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <div className="text-xs font-bold">Cirugía Programada</div>
                  <div className="text-[10px] text-slate-400">Fecha de quirófano a futuro</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsCompleted(true)}
                className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-950/60 border-emerald-500/80 text-white ring-1 ring-emerald-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isCompleted ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-slate-600'
                  }`}
                >
                  {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center gap-1">
                    <span>Cirugía Ya Realizada</span>
                    <span className="text-[9px] bg-emerald-900 text-emerald-200 px-1 rounded">3 meses</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Inicia conteo de liquidación</div>
                </div>
              </button>
            </div>

            {/* 3-Month Countdown Notice if already operated */}
            {isCompleted && settlementTarget && (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>⏱ Conteo de 3 Meses para Liquidación Activado</span>
                </div>
                <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                  A partir de la fecha de cirugía (<strong>{surgeryDate}</strong>), comienza el plazo estándar de 90 días para la recepción de la liquidación sanatorial.
                  Fecha estimada de reclamo/liquidación:{' '}
                  <strong className="text-white underline">{settlementTarget.displayLabel}</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Date & Time Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isCompleted ? 'Fecha en que se Realizó la Cx *' : 'Fecha Asignada de Quirófano *'}
                </span>
              </label>
              <input
                type="date"
                required
                value={surgeryDate}
                onChange={e => {
                  setSurgeryDate(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {isCompleted ? 'Fecha de parte quirúrgico' : 'Fecha aprobada por el sanatorio'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Horario de Intervención</span>
              </label>
              <input
                type="time"
                value={surgeryTime}
                onChange={e => setSurgeryTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Clinic & Operating Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Sanatorio / Clínica</span>
              </label>
              <input
                type="text"
                value={clinic}
                onChange={e => setClinic(e.target.value)}
                placeholder="Corporación Médica de San Martín"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Quirófano
              </label>
              <input
                type="text"
                value={operatingRoom}
                onChange={e => setOperatingRoom(e.target.value)}
                placeholder="Quirófano Central / Quirófano 1"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Approval Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Observaciones de la Autorización Sanatorial / Parte Qx
            </label>
            <textarea
              rows={2}
              value={approvalNotes}
              onChange={e => setApprovalNotes(e.target.value)}
              placeholder="Ej: Aprobado por Auditoría Médica Plan 606. Cirugía realizada satisfactoriamente, protocolo adjunto."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isCompleted
                  ? 'Guardar Liquidación & Iniciar Conteo 3 Meses'
                  : 'Aprobar Presupuesto & Asignar Fecha'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
