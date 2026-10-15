import React from 'react';
import {
  PieChart,
  BarChart3,
  TrendingUp,
  Building2,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  DollarSign,
  Layers,
  Clock,
  Shield
} from 'lucide-react';
import { SurgicalCase, Invoice } from '../types/surgical';
import { formatCurrency, CurrencyCode } from '../lib/currency';
import { FinancialMetrics, SurgeryMetrics, getInvoiceUrgency, getDaysDifference } from '../lib/surgicalLogic';

interface AnalyticsViewProps {
  cases: SurgicalCase[];
  invoices: Invoice[];
  finMetrics: FinancialMetrics;
  surgMetrics: SurgeryMetrics;
  currency: CurrencyCode;
  onSelectCase: (c: SurgicalCase) => void;
  onSelectInvoice: (inv: Invoice) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  cases,
  invoices,
  finMetrics,
  surgMetrics,
  currency,
  onSelectCase,
  onSelectInvoice,
}) => {
  // Surgeries by Clinic
  const surgeriesByClinic: Record<string, number> = {};
  cases.forEach(c => {
    const clinic = c.estimatedSurgeryClinic || 'Sin Asignar';
    surgeriesByClinic[clinic] = (surgeriesByClinic[clinic] || 0) + 1;
  });

  // Revenue by Insurance
  const revenueByInsurance: Record<string, { billed: number; collected: number }> = {};
  invoices.forEach(inv => {
    const ins = inv.insuranceProvider || 'Otros';
    if (!revenueByInsurance[ins]) {
      revenueByInsurance[ins] = { billed: 0, collected: 0 };
    }
    revenueByInsurance[ins].billed += inv.totalAmount;
    if (inv.status === 'COBRADA') {
      revenueByInsurance[ins].collected += inv.totalAmount;
    }
  });

  // Overdue Invoices
  const overdueInvoices = invoices.filter(
    inv => inv.status !== 'COBRADA' && (getInvoiceUrgency(inv.expectedCollectionDate, inv.status) === 'overdue' || inv.status === 'VENCIDA')
  );

  // Upcoming surgeries in next 7 days
  const upcomingCases = cases.filter(c => {
    if (c.status === 'CANCELADA' || c.status === 'REALIZADA') return false;
    const days = getDaysDifference(c.surgeryDate);
    return days >= 0 && days <= 7;
  });

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Efectividad de Cobranza</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{finMetrics.collectionRate}%</span>
            <span className="text-xs text-emerald-400">cobrado del total</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${finMetrics.collectionRate}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Cirugías Realizadas</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {surgMetrics.completedCount}
            </span>
            <span className="text-xs text-slate-400">de {surgMetrics.totalCases} programadas</span>
          </div>
          <p className="text-[11px] text-cyan-400 mt-2">
            {surgMetrics.scheduledCount} pendientes en cronograma
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Saldo en Auditoría / Mora</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-rose-300">
              {formatCurrency(finMetrics.totalOverdue, currency)}
            </span>
          </div>
          <p className="text-[11px] text-rose-400/80 mt-2">
            {finMetrics.overdueCount} facturas requieren gestión urgente
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Control de Prótesis</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white">
              {surgMetrics.materialsPendingCount}
            </span>
            <span className="text-xs text-amber-300 ml-1.5">cirugías con material solicitado</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Revisar entregas antes del ingreso a quirófano
          </p>
        </div>
      </div>

      {/* Main Charts & Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution by Clinic */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white">
                Casos Quirúrgicos por Clínica / Sanatorio
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {cases.length} casos totales
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(surgeriesByClinic)
              .sort((a, b) => b[1] - a[1])
              .map(([clinic, count]) => {
                const percentage = Math.round((count / (cases.length || 1)) * 100);
                return (
                  <div key={clinic} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200">{clinic}</span>
                      <span className="text-slate-400 font-mono">
                        {count} {count === 1 ? 'cirugía' : 'cirugías'} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Financial Distribution by Insurance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Facturación por Obra Social / Prepaga
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total: {formatCurrency(finMetrics.totalBilled, currency)}
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(revenueByInsurance)
              .sort((a, b) => b[1].billed - a[1].billed)
              .map(([ins, data]) => {
                const percentage = finMetrics.totalBilled > 0
                  ? Math.round((data.billed / finMetrics.totalBilled) * 100)
                  : 0;
                return (
                  <div key={ins} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200">{ins}</span>
                      <span className="text-cyan-300 font-mono font-medium">
                        {formatCurrency(data.billed, currency)} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Cobrado: {formatCurrency(data.collected, currency)}</span>
                      <span>Pendiente: {formatCurrency(data.billed - data.collected, currency)}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Critical Action Items: Overdue Invoices & Next Surgeries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Collections */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-bold text-white">
                Liquidaciones Vencidas o en Reclamo ({overdueInvoices.length})
              </h3>
            </div>
            <span className="text-xs text-rose-400 font-semibold">
              Requieren llamada o auditoría
            </span>
          </div>

          {overdueInvoices.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
              <p>¡Excelente! No hay facturas vencidas en este momento.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {overdueInvoices.map(inv => {
                const days = getDaysDifference(inv.expectedCollectionDate);
                return (
                  <div
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv)}
                    className="p-3 bg-rose-950/20 border border-rose-900/40 hover:border-rose-700/60 rounded-xl cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-300">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-xs text-slate-200 font-medium">
                          {inv.patientName}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {inv.insuranceProvider} · Venció hace {Math.abs(days)} días ({inv.expectedCollectionDate})
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-rose-300 block">
                        {formatCurrency(inv.totalAmount, currency)}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-rose-400">
                        {inv.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Surgeries next 7 days */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Cirugías Próximos 7 Días ({upcomingCases.length})
              </h3>
            </div>
            <span className="text-xs text-cyan-400 font-semibold">
              Cronograma inmediato
            </span>
          </div>

          {upcomingCases.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>No hay cirugías programadas para los próximos 7 días.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingCases.map(c => {
                const days = getDaysDifference(c.surgeryDate);
                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectCase(c)}
                    className="p-3 bg-slate-800/40 border border-slate-750 hover:border-cyan-500/50 rounded-xl cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-cyan-400">
                          {c.patientMedicalRecordNumber}
                        </span>
                        <span className="text-xs text-white font-semibold">
                          {c.patientName}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-300 block truncate max-w-xs mt-0.5">
                        {c.procedureName}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {c.estimatedSurgeryClinic} · {c.surgeryTime} hs
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-cyan-300 block font-mono">
                        {c.surgeryDate}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {days === 0 ? 'Hoy' : days === 1 ? 'Mañana' : `En ${days} días`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
