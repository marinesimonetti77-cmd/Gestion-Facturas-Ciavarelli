import React, { useState } from 'react';
import {
  Calendar,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  User,
  Stethoscope,
  Edit3,
  Save,
  Plus,
  Info,
  Paperclip,
  FileText
} from 'lucide-react';
import { MonthlyLiquidationSchedule, SurgicalCase, Invoice, AttachedDocument } from '../types/surgical';
import { formatCurrency, CurrencyCode } from '../lib/currency';

interface LiquidationCalendarProps {
  schedules: MonthlyLiquidationSchedule[];
  cases: SurgicalCase[];
  invoices?: Invoice[];
  currency: CurrencyCode;
  onUpdateSchedule: (monthKey: string, updates: Partial<MonthlyLiquidationSchedule>) => void;
  onSelectCase: (c: SurgicalCase) => void;
  onViewDocument?: (doc: AttachedDocument, c?: SurgicalCase, inv?: Invoice) => void;
}

export const LiquidationCalendar: React.FC<LiquidationCalendarProps> = ({
  schedules,
  cases,
  invoices = [],
  currency,
  onUpdateSchedule,
  onSelectCase,
  onViewDocument,
}) => {
  const [editingMonthKey, setEditingMonthKey] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<MonthlyLiquidationSchedule>>({});

  const handleStartEdit = (sched: MonthlyLiquidationSchedule) => {
    setEditingMonthKey(sched.monthKey);
    setEditFormData({ ...sched });
  };

  const handleSaveEdit = (monthKey: string) => {
    onUpdateSchedule(monthKey, editFormData);
    setEditingMonthKey(null);
  };

  // Find upcoming estimated settlements
  const estimatedCases = cases.filter(c => c.estimatedSettlementMonth);

  // Totals calculation
  const totalExpectedPayment = schedules.reduce((acc, s) => acc + s.expectedPaymentDay20, 0);
  const totalWithdrawnCollected = schedules.reduce((acc, s) => acc + s.withdrawnCollected, 0);
  const totalPendingCollection = schedules.reduce((acc, s) => acc + s.pendingCollection, 0);
  const totalRegisteredCollections = schedules.reduce((acc, s) => acc + s.registeredCollections, 0);
  const totalEstimatedLiquidations = schedules.reduce((acc, s) => acc + s.estimatedLiquidationsAmount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Rule Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Calendario claro de liquidaciones y cobros
              </h2>
              <p className="text-xs text-slate-400">
                Dr. Ciavarelli · Control financiero mensual, proyección a 3 meses y registro de cobranzas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono">
              Período: Abril 2026 - Diciembre 2026
            </span>
          </div>
        </div>

        {/* Business Rule Callout */}
        <div className="bg-cyan-950/30 border border-cyan-800/60 rounded-xl p-4 flex items-start gap-3 text-cyan-200 text-xs leading-relaxed">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block mb-0.5">Regla de liquidación y cobro:</span>
            La factura cargada se considera pendiente hasta que registres el cobro. El pago esperado es el día 20 del mes de emisión de la factura; por ejemplo, una factura del 06/09 se cobra el 20/09.
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-400 block">Total Pagos Retirados / Cobrados</span>
          <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">
            {formatCurrency(totalWithdrawnCollected, currency)}
          </span>
          <span className="text-[10px] text-emerald-500 mt-1 block">Julio y Agosto liquidados</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-400 block">Pendiente de Cobro (Septiembre)</span>
          <span className="text-xl font-bold text-amber-400 font-mono mt-1 block">
            {formatCurrency(totalPendingCollection, currency)}
          </span>
          <span className="text-[10px] text-amber-300 mt-1 block">
            Cobros reg.: {formatCurrency(totalRegisteredCollections, currency)}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-400 block">Liquidaciones Estimadas Futuras</span>
          <span className="text-xl font-bold text-cyan-300 font-mono mt-1 block">
            {formatCurrency(totalEstimatedLiquidations, currency)}
          </span>
          <span className="text-[10px] text-cyan-400 mt-1 block">Octubre y Diciembre 2026</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-400 block">Facturación Total Emitida</span>
          <span className="text-xl font-bold text-white font-mono mt-1 block">
            {formatCurrency(totalExpectedPayment, currency)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Suma de pagos esperados día 20</span>
        </div>
      </div>

      {/* SECTION: Próximas liquidaciones estimadas · 3 meses después */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">
              Próximas liquidaciones estimadas · 3 meses después
            </h3>
          </div>
          <span className="text-xs text-purple-300 bg-purple-950/60 border border-purple-800 px-2.5 py-1 rounded-full font-semibold">
            {estimatedCases.length} pacientes en seguimiento
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {estimatedCases.map(c => (
            <div
              key={c.id}
              onClick={() => onSelectCase(c)}
              className="bg-slate-950 border border-slate-800 hover:border-purple-500/60 rounded-xl p-4 transition cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-sm">{c.patientName}</span>
                  </div>
                  <div className="text-xs text-purple-300 flex items-center gap-1.5 font-medium">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>{c.procedureName}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Cirujano: {c.surgeonName} · {c.estimatedSurgeryClinic}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold uppercase text-purple-400 bg-purple-950/80 border border-purple-800 px-2 py-0.5 rounded">
                    {c.estimatedSettlementMonth}
                  </span>
                  <div className="mt-2 text-base font-bold font-mono text-white">
                    {c.estimatedSettlementAmount ? formatCurrency(c.estimatedSettlementAmount, currency) : '$ 0,00'}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-850 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>{c.notes}</span>
                  {c.attachedDocuments && c.attachedDocuments.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDocument?.(c.attachedDocuments![0], c);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 text-[10px] font-semibold transition"
                      title="Abrir documento o protocolo adjunto"
                    >
                      <Paperclip className="w-3 h-3" />
                      <span>{c.attachedDocuments[0].title}</span>
                    </button>
                  )}
                </div>
                <span className="text-cyan-400 font-semibold hover:underline">Ver caso &gt;</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: Cronograma Mensual Completo (Abril a Diciembre 2026) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <span>Detalle Mensual de Liquidaciones y Cobros</span>
          </h3>
          <span className="text-xs text-slate-400">
            Haga clic en el lápiz para editar cualquier mes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map(sched => {
            const isEditing = editingMonthKey === sched.monthKey;
            const hasActivity = sched.expectedPaymentDay20 > 0 || sched.pendingCollection > 0 || sched.withdrawnCollected > 0 || sched.estimatedLiquidationsCount > 0;

            return (
              <div
                key={sched.monthKey}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-sm transition flex flex-col justify-between space-y-4 ${
                  hasActivity ? 'border-slate-700 bg-slate-900/90' : 'border-slate-800/80 bg-slate-900/40 opacity-80'
                }`}
              >
                {/* Month Card Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-white capitalize">
                      {sched.monthLabel}
                    </h4>
                    {sched.notes && (
                      <span className="text-[11px] text-purple-300 font-medium block mt-0.5">
                        {sched.notes}
                      </span>
                    )}
                  </div>

                  {!isEditing ? (
                    <button
                      onClick={() => handleStartEdit(sched)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                      title="Editar valores del mes"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSaveEdit(sched.monthKey)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar</span>
                    </button>
                  )}
                </div>

                {/* Values List */}
                {!isEditing ? (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400">Pago esperado día 20:</span>
                      <span className={`font-mono font-bold ${sched.expectedPaymentDay20 > 0 ? 'text-white' : 'text-slate-500'}`}>
                        {formatCurrency(sched.expectedPaymentDay20, currency)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400">Liquidaciones pendientes:</span>
                      <span className={`font-mono font-bold ${sched.pendingLiquidations > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                        {formatCurrency(sched.pendingLiquidations, currency)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400">Pagos retirados / cobrados:</span>
                      <span className={`font-mono font-bold ${sched.withdrawnCollected > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {formatCurrency(sched.withdrawnCollected, currency)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400">Cobros registrados:</span>
                      <span className={`font-mono font-bold ${sched.registeredCollections > 0 ? 'text-cyan-300' : 'text-slate-500'}`}>
                        {formatCurrency(sched.registeredCollections, currency)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400 font-semibold">Pendiente de cobro:</span>
                      <span className={`font-mono font-bold ${sched.pendingCollection > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                        {formatCurrency(sched.pendingCollection, currency)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">Liquidaciones estimadas:</span>
                      <span className={`font-mono font-bold ${sched.estimatedLiquidationsCount > 0 ? 'text-purple-300' : 'text-slate-500'}`}>
                        {sched.estimatedLiquidationsCount} · {formatCurrency(sched.estimatedLiquidationsAmount, currency)}
                      </span>
                    </div>

                    {/* Month Invoices matching the Day 20 collection rule */}
                    {(() => {
                      const monthInvoices = invoices.filter(inv =>
                        inv.expectedCollectionDate.startsWith(sched.monthKey) || inv.issueDate.startsWith(sched.monthKey)
                      );
                      if (monthInvoices.length === 0) return null;
                      return (
                        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                            Facturas ARCA & Liquidaciones (Vto día 20):
                          </span>
                          <div className="space-y-1.5">
                            {monthInvoices.map(inv => (
                              <div
                                key={inv.id}
                                className="p-1.5 rounded-lg bg-slate-950 border border-slate-750 space-y-1"
                              >
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-mono font-bold text-slate-200">
                                    Fac. {inv.compNumber || inv.invoiceNumber}
                                  </span>
                                  <span className="font-mono text-emerald-400 text-[10px] font-semibold">
                                    {formatCurrency(inv.totalAmount, currency)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {inv.attachedDocuments?.map(doc => (
                                    <button
                                      key={doc.id}
                                      type="button"
                                      onClick={() => onViewDocument?.(doc, undefined, inv)}
                                      className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-0.5 px-1.5 rounded border transition font-medium ${
                                        doc.fileType === 'liquidacion'
                                          ? 'bg-amber-950/60 hover:bg-amber-900/80 border-amber-700/60 text-amber-300'
                                          : 'bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-700/60 text-emerald-300'
                                      }`}
                                      title={`Ver ${doc.title}`}
                                    >
                                      <Paperclip className="w-2.5 h-2.5 shrink-0" />
                                      <span className="truncate">
                                        {doc.fileType === 'liquidacion'
                                          ? doc.fileName.replace('.pdf', '')
                                          : 'Factura A'}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* Editable Inputs */
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Pago esperado día 20 ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.expectedPaymentDay20 ?? sched.expectedPaymentDay20}
                        onChange={e => setEditFormData(prev => ({ ...prev, expectedPaymentDay20: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Liquidaciones pendientes ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.pendingLiquidations ?? sched.pendingLiquidations}
                        onChange={e => setEditFormData(prev => ({ ...prev, pendingLiquidations: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Pagos retirados / cobrados ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.withdrawnCollected ?? sched.withdrawnCollected}
                        onChange={e => setEditFormData(prev => ({ ...prev, withdrawnCollected: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Cobros registrados ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.registeredCollections ?? sched.registeredCollections}
                        onChange={e => setEditFormData(prev => ({ ...prev, registeredCollections: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Pendiente de cobro ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.pendingCollection ?? sched.pendingCollection}
                        onChange={e => setEditFormData(prev => ({ ...prev, pendingCollection: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Cant. Estimadas</label>
                        <input
                          type="number"
                          value={editFormData.estimatedLiquidationsCount ?? sched.estimatedLiquidationsCount}
                          onChange={e => setEditFormData(prev => ({ ...prev, estimatedLiquidationsCount: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Monto Estimado ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editFormData.estimatedLiquidationsAmount ?? sched.estimatedLiquidationsAmount}
                          onChange={e => setEditFormData(prev => ({ ...prev, estimatedLiquidationsAmount: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
