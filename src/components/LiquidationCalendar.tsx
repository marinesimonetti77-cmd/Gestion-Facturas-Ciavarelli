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
  FileText,
  RefreshCw,
} from 'lucide-react';
import { MonthlyLiquidationSchedule, SurgicalCase, Invoice, InvoiceStatus, AttachedDocument } from '../types/surgical';
import { formatCurrency, CurrencyCode } from '../lib/currency';
import { getCaseLiquidationStatus } from '../lib/surgicalLogic';

interface LiquidationCalendarProps {
  schedules: MonthlyLiquidationSchedule[];
  cases: SurgicalCase[];
  invoices?: Invoice[];
  currency: CurrencyCode;
  onUpdateSchedule: (monthKey: string, updates: Partial<MonthlyLiquidationSchedule>) => void;
  onSelectCase: (c: SurgicalCase) => void;
  onViewDocument?: (doc: AttachedDocument, c?: SurgicalCase, inv?: Invoice) => void;
  onSyncInvoices?: () => void;
  onUpdateInvoiceStatus?: (id: string, status: InvoiceStatus) => void;
}

export const LiquidationCalendar: React.FC<LiquidationCalendarProps> = ({
  schedules,
  cases,
  invoices = [],
  currency,
  onUpdateSchedule,
  onSelectCase,
  onViewDocument,
  onSyncInvoices,
  onUpdateInvoiceStatus,
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

  // October specific calculation
  const octInvoices = invoices.filter(
    i =>
      i.expectedCollectionDate?.includes('2026-10') ||
      i.issueDate?.includes('2026-10') ||
      i.invoiceNumber?.includes('293') ||
      i.invoiceNumber?.includes('294') ||
      i.invoiceNumber?.includes('295') ||
      i.id === 'inv-afip-293' ||
      i.id === 'inv-afip-294' ||
      i.id === 'inv-afip-295'
  );
  const octPendingInvoices = octInvoices.filter(i => i.status !== 'COBRADA');
  const octPendingTotal = octPendingInvoices.reduce(
    (acc, i) => acc + (typeof i.pendingAmount === 'number' ? i.pendingAmount : Number(i.totalAmount) || 0),
    0
  );
  const octCollectedInvoices = octInvoices.filter(i => i.status === 'COBRADA');
  const octCollectedTotal = octCollectedInvoices.reduce(
    (acc, i) => acc + (Number(i.collectedAmount) || Number(i.totalAmount) || 0),
    0
  );

  const inv293 = invoices.find(i => i.id === 'inv-afip-293' || i.invoiceNumber?.includes('293'));
  const inv294 = invoices.find(i => i.id === 'inv-afip-294' || i.invoiceNumber?.includes('294'));
  const inv295 = invoices.find(i => i.id === 'inv-afip-295' || i.invoiceNumber?.includes('295'));

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
            {onSyncInvoices && (
              <button
                onClick={onSyncInvoices}
                className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-semibold flex items-center gap-1.5 transition"
                title="Sincronizar y recargar facturas oficiales ARCA y liquidaciones"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sincronizar Oficiales</span>
              </button>
            )}
          </div>
        </div>

        {/* Business Rule Callout */}
        <div className="bg-cyan-950/30 border border-cyan-800/60 rounded-xl p-4 flex items-start gap-3 text-cyan-200 text-xs leading-relaxed">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block mb-0.5">Regla de liquidación y cobro:</span>
            La factura cargada se considera pendiente hasta que registres el cobro. El pago esperado es el día 20 del mes de emisión de la factura; por ejemplo, las facturas emitidas el 06/10 se cobran este <strong>20 de Octubre (20/10)</strong>.
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
          <span className="text-[10px] text-emerald-500 mt-1 block">Julio, Agosto y Septiembre liquidados</span>
        </div>

        <div className={`rounded-xl p-4 shadow-md relative overflow-hidden border ${
          octPendingTotal === 0
            ? 'bg-gradient-to-b from-emerald-950/40 to-slate-900 border-emerald-500/70'
            : 'bg-gradient-to-b from-amber-950/30 to-slate-900 border-amber-500/70'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold block ${octPendingTotal === 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
              Pendiente de Cobro · Octubre
            </span>
            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded font-mono ${
              octPendingTotal === 0 ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
            }`}>
              {octPendingTotal === 0 ? 'AL DÍA ✓' : 'Vto 20/10'}
            </span>
          </div>
          <span className={`text-xl font-black font-mono mt-1 block ${octPendingTotal === 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
            {formatCurrency(octPendingTotal, currency)}
          </span>
          <span className={`text-[10px] mt-1 block font-medium ${octPendingTotal === 0 ? 'text-emerald-200/90' : 'text-amber-200/90'}`}>
            {octPendingTotal === 0
              ? `✓ Cobrado: ${formatCurrency(octCollectedTotal, currency)} (100% cobrado)`
              : `${octPendingInvoices.length} facturas pendientes de cobro`}
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

      {/* BANNER DESTACADO: Vencimiento de Cobro Día 20 de Octubre */}
      <div className={`border-2 rounded-2xl p-5 shadow-xl space-y-4 ${
        octPendingTotal === 0
          ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-emerald-500/80'
          : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border-amber-500/90'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-xl border shrink-0 shadow-sm ${
              octPendingTotal === 0
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
            }`}>
              {octPendingTotal === 0 ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              ) : (
                <Clock className="w-7 h-7 text-amber-400 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded font-mono ${
                  octPendingTotal === 0 ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                }`}>
                  {octPendingTotal === 0 ? '✓ AL DÍA · COBRANZA COMPLETA' : '🚨 COBRO PENDIENTE DÍA 20'}
                </span>
                <span className={`text-xs font-bold ${octPendingTotal === 0 ? 'text-emerald-200' : 'text-amber-200'}`}>
                  Mes en Curso: Octubre 2026 (20/10/2026)
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">
                {octPendingTotal === 0 ? (
                  <>
                    Todas las facturas de Octubre han sido cobradas:{' '}
                    <span className="text-emerald-400 font-mono text-xl font-black">
                      {formatCurrency(octCollectedTotal, currency)}
                    </span>
                  </>
                ) : (
                  <>
                    Pendiente de Cobro para este 20/10/2026:{' '}
                    <span className="text-amber-300 font-mono text-xl font-black">
                      {formatCurrency(octPendingTotal, currency)}
                    </span>
                  </>
                )}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Facturas A oficiales emitidas ante AFIP/ARCA vinculadas a prestaciones de Cirugía General y liquidaciones sanatoriales:
              </p>
            </div>
          </div>
        </div>

        {/* Detalle de las 3 Facturas de Octubre */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {/* Factura 293 - García Julio */}
          <div className={`border rounded-xl p-4 space-y-2.5 shadow-sm transition flex flex-col justify-between ${
            inv293?.status === 'COBRADA'
              ? 'bg-slate-950/90 border-emerald-500/50'
              : 'bg-slate-950/90 border-amber-500/60 hover:border-amber-400'
          }`}>
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-1.5">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                  Factura A N° 00003-00000293
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {inv293?.status === 'COBRADA' ? (
                    <span className="text-[10px] font-bold font-mono text-emerald-300 bg-emerald-950/90 border border-emerald-600 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>COBRADA</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold font-mono text-amber-300 bg-amber-950/90 border border-amber-600 px-2 py-0.5 rounded">
                      PENDIENTE
                    </span>
                  )}
                  <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-700/80 px-2 py-0.5 rounded">
                    {formatCurrency(311610.0, currency)}
                  </span>
                </div>
              </div>
              <h4 className="text-xs font-bold text-white mt-1 leading-snug">
                GARCIA JULIO GUILLERMO
              </h4>
              <span className="text-[11px] text-slate-400 block">
                OSDE BINARIO (Hernioplastia Bilateral) · Corp. Médica
              </span>
            </div>

            <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Neto Gravado:</span>
                <span className="font-mono text-white">$ 282.000,00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IVA 10,5%:</span>
                <span className="font-mono text-white">$ 29.610,00</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
                <span className={inv293?.status === 'COBRADA' ? 'text-emerald-400' : 'text-amber-300'}>
                  {inv293?.status === 'COBRADA' ? 'Cobrada:' : 'Vto. para el Cobro:'}
                </span>
                <span className={`font-mono ${inv293?.status === 'COBRADA' ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {inv293?.status === 'COBRADA' ? (inv293.actualCollectionDate || '20/10/2026') : '20/10/2026'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] flex-wrap gap-2">
              <span className="text-emerald-400 font-semibold text-[10px]">CAE: 86401928374619</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {onUpdateInvoiceStatus && inv293 && (
                  inv293.status === 'COBRADA' ? (
                    <button
                      onClick={() => onUpdateInvoiceStatus(inv293.id, 'PENDIENTE')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold border border-slate-700 transition"
                      title="Revertir estado a pendiente"
                    >
                      Deshacer
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateInvoiceStatus(inv293.id, 'COBRADA')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow-xs transition flex items-center gap-1"
                      title="Registrar cobro de esta factura"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Cobrada ✓</span>
                    </button>
                  )
                )}
                {onViewDocument && (
                  <button
                    onClick={() => {
                      if (inv293 && inv293.attachedDocuments?.[0]) {
                        onViewDocument(inv293.attachedDocuments[0], undefined, inv293);
                      }
                    }}
                    className="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-200 rounded text-[11px] font-semibold border border-cyan-700/70 transition"
                  >
                    Factura A
                  </button>
                )}
                {onViewDocument && (
                  <button
                    onClick={() => {
                      if (inv293 && inv293.attachedDocuments?.[1]) {
                        onViewDocument(inv293.attachedDocuments[1], undefined, inv293);
                      }
                    }}
                    className="px-2 py-0.5 bg-amber-950/80 hover:bg-amber-900 text-amber-200 rounded text-[11px] font-semibold border border-amber-700/70 transition"
                  >
                    Liquidación
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Factura 294 - Rodríguez Rocío */}
          <div className={`border rounded-xl p-4 space-y-2.5 shadow-sm transition flex flex-col justify-between ${
            inv294?.status === 'COBRADA'
              ? 'bg-slate-950/90 border-emerald-500/50'
              : 'bg-slate-950/90 border-amber-500/60 hover:border-amber-400'
          }`}>
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-1.5">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                  Factura A N° 00003-00000294
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {inv294?.status === 'COBRADA' ? (
                    <span className="text-[10px] font-bold font-mono text-emerald-300 bg-emerald-950/90 border border-emerald-600 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>COBRADA</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold font-mono text-amber-300 bg-amber-950/90 border border-amber-600 px-2 py-0.5 rounded">
                      PENDIENTE
                    </span>
                  )}
                  <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-700/80 px-2 py-0.5 rounded">
                    {formatCurrency(397800.0, currency)}
                  </span>
                </div>
              </div>
              <h4 className="text-xs font-bold text-white mt-1 leading-snug">
                RODRIGUEZ ROCIO BEATRIZ
              </h4>
              <span className="text-[11px] text-slate-400 block">
                C.A. Plan 606 (CIRLAP Colecistectomía) · Corp. Médica
              </span>
            </div>

            <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Neto Gravado:</span>
                <span className="font-mono text-white">$ 360.000,00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IVA 10,5%:</span>
                <span className="font-mono text-white">$ 37.800,00</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
                <span className={inv294?.status === 'COBRADA' ? 'text-emerald-400' : 'text-amber-300'}>
                  {inv294?.status === 'COBRADA' ? 'Cobrada:' : 'Vto. para el Cobro:'}
                </span>
                <span className={`font-mono ${inv294?.status === 'COBRADA' ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {inv294?.status === 'COBRADA' ? (inv294.actualCollectionDate || '20/10/2026') : '20/10/2026'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] flex-wrap gap-2">
              <span className="text-emerald-400 font-semibold text-[10px]">CAE: 86401928374620</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {onUpdateInvoiceStatus && inv294 && (
                  inv294.status === 'COBRADA' ? (
                    <button
                      onClick={() => onUpdateInvoiceStatus(inv294.id, 'PENDIENTE')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold border border-slate-700 transition"
                      title="Revertir estado a pendiente"
                    >
                      Deshacer
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateInvoiceStatus(inv294.id, 'COBRADA')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow-xs transition flex items-center gap-1"
                      title="Registrar cobro de esta factura"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Cobrada ✓</span>
                    </button>
                  )
                )}
                {onViewDocument && (
                  <button
                    onClick={() => {
                      if (inv294 && inv294.attachedDocuments?.[0]) {
                        onViewDocument(inv294.attachedDocuments[0], undefined, inv294);
                      }
                    }}
                    className="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-200 rounded text-[11px] font-semibold border border-cyan-700/70 transition"
                  >
                    Factura A
                  </button>
                )}
                {onViewDocument && (
                  <button
                    onClick={() => {
                      if (inv294 && inv294.attachedDocuments?.[1]) {
                        onViewDocument(inv294.attachedDocuments[1], undefined, inv294);
                      }
                    }}
                    className="px-2 py-0.5 bg-amber-950/80 hover:bg-amber-900 text-amber-200 rounded text-[11px] font-semibold border border-amber-700/70 transition"
                  >
                    Liquidación
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Factura 295 - Da Cunha María */}
          <div className={`border rounded-xl p-4 space-y-2.5 shadow-sm transition flex flex-col justify-between ${
            inv295?.status === 'COBRADA'
              ? 'bg-slate-950/90 border-emerald-500/50'
              : 'bg-slate-950/90 border-amber-500/60 hover:border-amber-400'
          }`}>
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-1.5">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                  Factura A N° 00003-00000295
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {inv295?.status === 'COBRADA' ? (
                    <span className="text-[10px] font-bold font-mono text-emerald-300 bg-emerald-950/90 border border-emerald-600 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>COBRADA</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold font-mono text-amber-300 bg-amber-950/90 border border-amber-600 px-2 py-0.5 rounded">
                      PENDIENTE
                    </span>
                  )}
                  <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-700/80 px-2 py-0.5 rounded shrink-0">
                    {formatCurrency(52800.0, currency)}
                  </span>
                </div>
              </div>
              <h4 className="text-xs font-bold text-white mt-1 leading-snug">
                DA CUNHA MENDEZ MARIA SOLEDAD
              </h4>
              <span className="text-[11px] text-slate-400 block">
                SAT S/I (3 Consultas externas) · Corp. Médica
              </span>
            </div>

            <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Concepto:</span>
                <span className="text-slate-200">Consultas C. General</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Importe Exento:</span>
                <span className="font-mono text-white">$ 52.800,00</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
                <span className={inv295?.status === 'COBRADA' ? 'text-emerald-400' : 'text-amber-300'}>
                  {inv295?.status === 'COBRADA' ? 'Cobrada:' : 'Vto. para el Cobro:'}
                </span>
                <span className={`font-mono ${inv295?.status === 'COBRADA' ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {inv295?.status === 'COBRADA' ? (inv295.actualCollectionDate || '20/10/2026') : '20/10/2026'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] flex-wrap gap-2">
              <span className="text-emerald-400 font-semibold text-[10px]">CAE: 86401929481723</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {onUpdateInvoiceStatus && inv295 && (
                  inv295.status === 'COBRADA' ? (
                    <button
                      onClick={() => onUpdateInvoiceStatus(inv295.id, 'PENDIENTE')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold border border-slate-700 transition"
                      title="Revertir estado a pendiente"
                    >
                      Deshacer
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateInvoiceStatus(inv295.id, 'COBRADA')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow-xs transition flex items-center gap-1"
                      title="Registrar cobro de esta factura"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Cobrada ✓</span>
                    </button>
                  )
                )}
                {onViewDocument && (
                  <button
                    onClick={() => {
                      if (inv295 && inv295.attachedDocuments?.[0]) {
                        onViewDocument(inv295.attachedDocuments[0], undefined, inv295);
                      }
                    }}
                    className="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-200 rounded text-[11px] font-semibold border border-cyan-700/70 transition"
                  >
                    Factura A
                  </button>
                )}
                {onViewDocument && (
                  <button
                    onClick={() => {
                      if (inv295 && inv295.attachedDocuments?.[1]) {
                        onViewDocument(inv295.attachedDocuments[1], undefined, inv295);
                      }
                    }}
                    className="px-2 py-0.5 bg-amber-950/80 hover:bg-amber-900 text-amber-200 rounded text-[11px] font-semibold border border-amber-700/70 transition"
                  >
                    Liquidación
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: Próximas liquidaciones estimadas · 3 meses después */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">
              Próximas liquidaciones estimadas · 3 meses después del Parte Qx
            </h3>
          </div>
          <span className="text-xs text-purple-300 bg-purple-950/60 border border-purple-800 px-2.5 py-1 rounded-full font-semibold">
            {estimatedCases.length} cirugías en seguimiento contable
          </span>
        </div>

        {/* Business rule callout for 3-month settlements */}
        <div className="bg-amber-950/40 border border-amber-600/60 rounded-xl p-3.5 flex items-start gap-3 text-amber-200 text-xs leading-relaxed">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <span className="font-bold text-white block mb-0.5">
              Regla de Facturación & Cobro tras Parte Quirúrgico:
            </span>
            Luego de un parte quirúrgico, el sanatorio / obra social demora aproximadamente <strong>3 meses</strong> en auditar y enviar la liquidación médica oficial. Una vez recibida, el Dr. Ciavarelli confecciona la <strong>Factura A</strong> ante ARCA/AFIP para posteriormente gestionar el cobro o reclamar (habitualmente el día 20 del mes).
            <div className="mt-1.5 text-rose-300 font-bold bg-rose-950/70 p-2 rounded-lg border border-rose-500/60">
              🚨 Casos en Alerta Importante: 4 cirugías de Julio (Quintana, Garcia, Da Cunha, Rodriguez) ya cumplieron los 3 meses de espera y quedaron a la espera de liquidación para poder facturar ($ 3.090.000,00 estimados). ¡Reclamar a los sanatorios!
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {estimatedCases.map(c => {
            const liqAlert = getCaseLiquidationStatus(c);
            const isDue = liqAlert.stage === 'DUE_FOR_BILLING';

            return (
              <div
                key={c.id}
                onClick={() => onSelectCase(c)}
                className={`rounded-xl p-4 transition cursor-pointer flex flex-col justify-between space-y-3 border ${
                  isDue
                    ? 'bg-gradient-to-b from-rose-950/30 to-slate-950 border-rose-500/80 shadow-md shadow-rose-950/30 hover:border-rose-400'
                    : 'bg-slate-950 border-slate-800 hover:border-purple-500/60'
                }`}
              >
                {/* 3-Month Status Badge Header */}
                {isDue ? (
                  <div className="bg-rose-950/90 border border-rose-500/80 rounded-lg px-2.5 py-1 text-xs text-rose-200 flex items-center justify-between font-bold animate-pulse">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>🚨 3 MESES CUMPLIDOS ({liqAlert.daysSinceSurgery} días)</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wide bg-rose-900/80 px-2 py-0.5 rounded text-white font-mono">
                      A la espera de liquidación
                    </span>
                  </div>
                ) : (
                  <div className="bg-purple-950/40 border border-purple-800/60 rounded-lg px-2.5 py-1 text-[11px] text-purple-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <span>En auditoría sanatorial ({liqAlert.daysSinceSurgery} días)</span>
                    </span>
                    <span className="text-[10px] font-mono text-purple-200">
                      Espera: {c.estimatedSettlementMonth}
                    </span>
                  </div>
                )}

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
                    <span className="text-[11px] text-slate-400 block font-mono">
                      Fecha Parte Qx: {c.surgeryDate}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded border ${
                      isDue ? 'text-rose-300 bg-rose-950/90 border-rose-700 font-bold' : 'text-purple-400 bg-purple-950/80 border-purple-800'
                    }`}>
                      {c.estimatedSettlementMonth}
                    </span>
                    <div className="mt-2 text-base font-bold font-mono text-emerald-400">
                      {formatCurrency(c.budgetApprovedAmount || c.estimatedSettlementAmount || c.budgetAmount || 0, currency)}
                    </div>
                    {c.budgetApprovedAmount !== undefined && c.budgetAmount && c.budgetApprovedAmount !== c.budgetAmount && (
                      <span className="text-[10px] text-amber-300 font-mono block mt-0.5">
                        Aprobado final (orig: {formatCurrency(c.budgetAmount, currency)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
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
                  <span className="text-cyan-400 font-semibold hover:underline">Ver expediente &gt;</span>
                </div>
              </div>
            );
          })}
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
            const isCurrentMonthOct = sched.monthKey === '2026-10';

            return (
              <div
                key={sched.monthKey}
                className={`border rounded-2xl p-5 shadow-sm transition flex flex-col justify-between space-y-4 ${
                  isCurrentMonthOct
                    ? 'border-2 border-amber-500/90 bg-gradient-to-b from-amber-950/40 to-slate-900 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40'
                    : hasActivity
                    ? 'border-slate-700 bg-slate-900/90'
                    : 'border-slate-800/80 bg-slate-900/40 opacity-80'
                }`}
              >
                {/* Month Card Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white capitalize">
                        {sched.monthLabel}
                      </h4>
                      {isCurrentMonthOct && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-mono shadow-xs">
                          MES ACTUAL · VTO 20/10
                        </span>
                      )}
                    </div>
                    {sched.notes && (
                      <span className={`text-[11px] font-medium block mt-0.5 ${isCurrentMonthOct ? 'text-amber-200' : 'text-purple-300'}`}>
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

                    <div className={`flex justify-between items-center ${isCurrentMonthOct ? 'bg-amber-950/40 p-2 rounded-lg border border-amber-500/40 -mx-1' : 'text-slate-300'}`}>
                      <span className={`${isCurrentMonthOct ? 'text-amber-300 font-bold' : 'text-slate-400 font-semibold'}`}>Pendiente de cobro:</span>
                      <span className={`font-mono font-black ${isCurrentMonthOct ? 'text-amber-300 text-sm' : sched.pendingCollection > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
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
