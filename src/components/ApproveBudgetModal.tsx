import React, { useState } from 'react';
import { Calendar, Clock, Building2, CheckCircle2, X, AlertCircle, DollarSign, User, ShieldCheck } from 'lucide-react';
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
  const [surgeryDate, setSurgeryDate] = useState('');
  const [surgeryTime, setSurgeryTime] = useState('08:00');
  const [operatingRoom, setOperatingRoom] = useState('Quirófano Central');
  const [clinic, setClinic] = useState(caseItem?.estimatedSurgeryClinic || 'Corporación Médica de Gral San Martín SA');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !caseItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surgeryDate) {
      setError('Por favor indique la fecha de cirugía otorgada por el sanatorio.');
      return;
    }

    onApprove(caseItem.id, {
      surgeryDate,
      surgeryTime,
      operatingRoom,
      clinic: clinic || caseItem.estimatedSurgeryClinic,
      notes: approvalNotes || 'Aprobado por auditoría médica sanatorial.',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Aprobar Presupuesto Quirúrgico
              </h3>
              <p className="text-xs text-slate-400">
                Asignación de fecha y pase a Cirugías Programadas
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Patient and Budget Summary Tile */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wide bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60 font-semibold">
                  {caseItem.insuranceProvider} · {caseItem.insurancePlan || 'Plan'}
                </span>
                <h4 className="text-sm font-bold text-white mt-1">
                  {caseItem.patientName}
                </h4>
                <p className="text-xs text-slate-400">
                  Afiliado: {caseItem.insuranceAffiliateNumber || caseItem.patientMedicalRecordNumber}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Honorarios Presupuestados</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {caseItem.budgetAmount
                    ? formatCurrency(caseItem.budgetAmount, currency)
                    : caseItem.estimatedSettlementAmount
                    ? formatCurrency(caseItem.estimatedSettlementAmount, currency)
                    : formatCurrency(0, currency)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
              <p className="font-medium text-slate-200">{caseItem.procedureName}</p>
              <div className="flex items-center gap-4 text-slate-400 mt-1">
                <span>⏱ Duración aprox: {caseItem.estimatedDurationHours || 5} hs</span>
                <span>🏥 UCI: {caseItem.icuDaysEstimated || 3} días</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-rose-950/60 border border-rose-500/80 rounded-xl p-3 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Date & Time Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fecha de Cirugía Asignada *</span>
              </label>
              <input
                type="date"
                required
                value={surgeryDate}
                onChange={e => {
                  setSurgeryDate(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Fecha aprobada por el sanatorio</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Horario Estimado</span>
              </label>
              <input
                type="time"
                value={surgeryTime}
                onChange={e => setSurgeryTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                Quirófano Asignado
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
              Observaciones de la Autorización Sanatorial
            </label>
            <textarea
              rows={2}
              value={approvalNotes}
              onChange={e => setApprovalNotes(e.target.value)}
              placeholder="Ej: Aprobado por Auditoría Médica Plan 606. Turno asignado en quirófano central."
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
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Aprobar Presupuesto & Asignar Fecha</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
