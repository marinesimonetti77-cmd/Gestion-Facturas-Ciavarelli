import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Plus,
  Edit3,
  Trash2,
  Building2,
  Receipt,
  Eye,
  FileCheck,
  CreditCard,
  Paperclip,
  FileText
} from 'lucide-react';
import { Invoice, InvoiceStatus, SurgicalCase, AttachedDocument } from '../types/surgical';
import { formatCurrency, CurrencyCode } from '../lib/currency';
import { getInvoiceUrgency, getDaysDifference, FinancialMetrics } from '../lib/surgicalLogic';

interface InvoicesListProps {
  invoices: Invoice[];
  cases: SurgicalCase[];
  currency: CurrencyCode;
  metrics: FinancialMetrics;
  onEditInvoice: (inv: Invoice) => void;
  onNewInvoice: () => void;
  onDeleteInvoice: (id: string) => void;
  onUpdateStatus: (id: string, status: InvoiceStatus) => void;
  onUpdateExpectedDate: (id: string, date: string) => void;
  onUpdateTotalAmount: (id: string, amount: number) => void;
  onViewCase: (caseId: string) => void;
  onViewDocument?: (doc: AttachedDocument, c?: SurgicalCase, inv?: Invoice) => void;
}

export const InvoicesList: React.FC<InvoicesListProps> = ({
  invoices,
  cases,
  currency,
  metrics,
  onEditInvoice,
  onNewInvoice,
  onDeleteInvoice,
  onUpdateStatus,
  onUpdateExpectedDate,
  onUpdateTotalAmount,
  onViewCase,
  onViewDocument,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedInsurance, setSelectedInsurance] = useState<string>('ALL');

  const insurancesList = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach(i => {
      if (i.insuranceProvider) set.add(i.insuranceProvider);
    });
    return Array.from(set);
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (selectedStatus !== 'ALL' && inv.status !== selectedStatus) {
        return false;
      }
      if (selectedInsurance !== 'ALL' && inv.insuranceProvider !== selectedInsurance) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesNum = inv.invoiceNumber.toLowerCase().includes(query);
        const matchesPatient = inv.patientName.toLowerCase().includes(query);
        const matchesHC = inv.patientMedicalRecordNumber?.toLowerCase().includes(query);
        const matchesIns = inv.insuranceProvider.toLowerCase().includes(query);
        const matchesClinic = inv.clinic.toLowerCase().includes(query);
        const matchesRef = inv.paymentReference?.toLowerCase().includes(query);
        if (!matchesNum && !matchesPatient && !matchesHC && !matchesIns && !matchesClinic && !matchesRef) {
          return false;
        }
      }
      return true;
    });
  }, [invoices, selectedStatus, selectedInsurance, searchTerm]);

  const handleExportCSV = () => {
    const headers = [
      'N° Factura',
      'Paciente',
      'N° Historia Clinica',
      'Obra Social / Entidad',
      'Clinica',
      'Honorarios Medicos',
      'Materiales / Gastos',
      'IVA / Impuesto %',
      'Monto Total',
      'Fecha Emision',
      'Fecha Estimada Cobro',
      'Fecha Real Cobro',
      'Estado',
      'Referencia Pago',
      'Observaciones Auditoria',
    ];

    const rows = filteredInvoices.map(inv => [
      `"${inv.invoiceNumber}"`,
      `"${inv.patientName}"`,
      `"${inv.patientMedicalRecordNumber || ''}"`,
      `"${inv.insuranceProvider}"`,
      `"${inv.clinic}"`,
      inv.surgeonFee,
      inv.materialsCost,
      inv.taxRate,
      inv.totalAmount,
      `"${inv.issueDate}"`,
      `"${inv.expectedCollectionDate}"`,
      `"${inv.actualCollectionDate || ''}"`,
      `"${inv.status}"`,
      `"${inv.paymentReference || ''}"`,
      `"${(inv.auditNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `facturacion_cobranzas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeClass = (status: InvoiceStatus) => {
    switch (status) {
      case 'COBRADA':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'VENCIDA':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/40 font-bold';
      case 'OBSERVADA':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-bold';
      case 'EN_AUDITORIA':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'EMITIDA':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'PENDIENTE':
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Facturado</span>
            <Receipt className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-white mt-1">
            {formatCurrency(metrics.totalBilled, currency)}
          </p>
          <span className="text-[10px] text-slate-500">
            {metrics.invoicesCount} facturas emitidas
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-semibold">Total Cobrado</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-emerald-300 mt-1">
            {formatCurrency(metrics.totalCollected, currency)}
          </p>
          <span className="text-[10px] text-emerald-500 font-medium">
            Tasa de cobranza: {metrics.collectionRate}%
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-cyan-400">Pendiente de Cobro</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-cyan-300 mt-1">
            {formatCurrency(metrics.totalPending, currency)}
          </p>
          <span className="text-[10px] text-slate-400">
            A liquidar según fecha estimada
          </span>
        </div>

        <div className={`border rounded-xl p-4 shadow-sm ${
          metrics.overdueCount > 0
            ? 'bg-rose-950/20 border-rose-800/80'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-400 font-semibold">Vencido / En Reclamo</span>
            <AlertTriangle className={`w-4 h-4 ${metrics.overdueCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
          </div>
          <p className="text-lg sm:text-xl font-bold text-rose-300 mt-1">
            {formatCurrency(metrics.totalOverdue, currency)}
          </p>
          <span className="text-[10px] text-rose-400/90">
            {metrics.overdueCount} {metrics.overdueCount === 1 ? 'factura con atraso' : 'facturas con atraso'}
          </span>
        </div>
      </div>

      {/* Control bar: Search, Filters, CSV & Create */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por N° factura, paciente, HC, obra social o clínica..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
              title="Descargar liquidaciones a CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar Facturas</span>
            </button>

            <button
              onClick={onNewInvoice}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-cyan-600/30 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Factura</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar liquidaciones:</span>
          </div>

          {/* Filter by Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">Todos los Estados ({invoices.length})</option>
              <option value="EMITIDA">Emitidas</option>
              <option value="EN_AUDITORIA">En Auditoría Médica</option>
              <option value="OBSERVADA">Observadas / Reclamadas</option>
              <option value="COBRADA">Cobradas</option>
              <option value="VENCIDA">Vencidas</option>
              <option value="PENDIENTE">Pendientes de emitir</option>
            </select>
          </div>

          {/* Filter by Insurance */}
          <div>
            <select
              value={selectedInsurance}
              onChange={e => setSelectedInsurance(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">Todas las Obras Sociales / Prepagas</option>
              {insurancesList.map(ins => (
                <option key={ins} value={ins}>{ins}</option>
              ))}
            </select>
          </div>

          {(selectedStatus !== 'ALL' || selectedInsurance !== 'ALL' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedStatus('ALL');
                setSelectedInsurance('ALL');
                setSearchTerm('');
              }}
              className="text-cyan-400 hover:underline ml-auto"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Invoices Table with Direct In-Line Edits */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No se encontraron facturas</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No hay liquidaciones que coincidan con los filtros aplicados.
          </p>
          <button
            onClick={onNewInvoice}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Factura</span>
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Factura & Paciente</th>
                  <th className="py-3 px-4">Obra Social & Clínica</th>
                  <th className="py-3 px-4">Monto Total (Editable)</th>
                  <th className="py-3 px-4">Fecha Emisión</th>
                  <th className="py-3 px-4">
                    <span className="text-cyan-400 font-bold">Fecha Estimada Cobro (Editable)</span>
                  </th>
                  <th className="py-3 px-4">Estado (Editable)</th>
                  <th className="py-3 px-4">Comprobante ARCA / PDF</th>
                  <th className="py-3 px-4">Referencia / Pago</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredInvoices.map(inv => {
                  const urgency = getInvoiceUrgency(inv.expectedCollectionDate, inv.status);
                  const daysDiff = getDaysDifference(inv.expectedCollectionDate);

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        urgency === 'overdue' && inv.status !== 'COBRADA'
                          ? 'bg-rose-950/15'
                          : urgency === 'due-soon' && inv.status !== 'COBRADA'
                          ? 'bg-amber-950/10'
                          : ''
                      }`}
                    >
                      {/* Factura & Paciente */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold text-cyan-400">
                            {inv.invoiceNumber}
                          </span>
                          <span className="font-semibold text-white text-sm">
                            {inv.patientName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {inv.patientMedicalRecordNumber || 'Sin HC'}
                          </span>
                        </div>
                      </td>

                      {/* Insurance & Clinic */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-emerald-400 block">
                          {inv.insuranceProvider}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {inv.clinic}
                        </span>
                      </td>

                      {/* Total Amount (INLINE EDITABLE INPUT) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400">$</span>
                          <input
                            type="number"
                            value={inv.totalAmount}
                            onChange={e => onUpdateTotalAmount(inv.id, parseFloat(e.target.value) || 0)}
                            className="w-32 bg-slate-950 border border-slate-700 hover:border-cyan-500 rounded-lg px-2 py-1 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-right"
                            title="Haga clic para editar el monto total"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5 text-right">
                          Honorarios: {formatCurrency(inv.surgeonFee, currency)}
                        </span>
                      </td>

                      {/* Issue Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono">
                        {inv.issueDate}
                      </td>

                      {/* EXPECTED COLLECTION DATE (INLINE EDITABLE DATE PICKER) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <input
                            type="date"
                            value={inv.expectedCollectionDate}
                            onChange={e => onUpdateExpectedDate(inv.id, e.target.value)}
                            className={`border rounded-lg px-2 py-1 text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                              urgency === 'overdue' && inv.status !== 'COBRADA'
                                ? 'bg-rose-950/70 border-rose-600 text-rose-300'
                                : urgency === 'due-soon' && inv.status !== 'COBRADA'
                                ? 'bg-amber-950/70 border-amber-600 text-amber-300'
                                : 'bg-slate-950 border-slate-700 text-slate-200 hover:border-cyan-500'
                            }`}
                            title="Haga clic para cambiar la fecha estimada de cobro"
                          />
                          {inv.status === 'COBRADA' ? (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Cobrado el {inv.actualCollectionDate || 'fecha pactada'}</span>
                            </span>
                          ) : urgency === 'overdue' ? (
                            <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Vencida hace {Math.abs(daysDiff)} días</span>
                            </span>
                          ) : urgency === 'due-soon' ? (
                            <span className="text-[10px] font-semibold text-amber-300 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Vence en {daysDiff} días</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              En plazo ({daysDiff} días)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status (INLINE EDITABLE DROPDOWN) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={inv.status}
                          onChange={e => onUpdateStatus(inv.id, e.target.value as InvoiceStatus)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer ${getStatusBadgeClass(inv.status)}`}
                          title="Haga clic para cambiar el estado de la liquidación"
                        >
                          <option value="PENDIENTE">PENDIENTE</option>
                          <option value="EMITIDA">EMITIDA</option>
                          <option value="EN_AUDITORIA">EN AUDITORÍA</option>
                          <option value="OBSERVADA">OBSERVADA</option>
                          <option value="COBRADA">COBRADA</option>
                          <option value="VENCIDA">VENCIDA</option>
                        </select>
                      </td>

                      {/* ARCA Comprobante & Liquidación PDF */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {inv.attachedDocuments && inv.attachedDocuments.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {inv.attachedDocuments.map(doc => (
                              <button
                                key={doc.id}
                                type="button"
                                onClick={() => onViewDocument ? onViewDocument(doc, undefined, inv) : onEditInvoice(inv)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs transition border ${
                                  doc.fileType === 'liquidacion'
                                    ? 'bg-amber-950/70 hover:bg-amber-900 border-amber-600/80 text-amber-300'
                                    : 'bg-emerald-950/70 hover:bg-emerald-900 border-emerald-600/80 text-emerald-300'
                                }`}
                                title={`Ver ${doc.title} en formato oficial`}
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                                <span>
                                  {doc.fileType === 'liquidacion'
                                    ? doc.fileName.replace('.pdf', '')
                                    : 'Factura A'}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => onEditInvoice(inv)}
                            className="text-[11px] text-slate-500 hover:text-cyan-400 flex items-center gap-1"
                            title="Adjuntar comprobante"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>+ Adjuntar</span>
                          </button>
                        )}
                      </td>

                      {/* Payment Reference */}
                      <td className="py-3 px-4">
                        {inv.paymentReference ? (
                          <span className="font-mono text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
                            {inv.paymentReference}
                          </span>
                        ) : inv.auditNotes ? (
                          <span className="text-[11px] text-slate-400 line-clamp-1 italic" title={inv.auditNotes}>
                            {inv.auditNotes}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.caseId && (
                            <button
                              onClick={() => onViewCase(inv.caseId!)}
                              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/40 rounded-lg transition"
                              title="Ver caso quirúrgico"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onEditInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-950/40 rounded-lg transition"
                            title="Editar factura completa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar la factura ${inv.invoiceNumber}?`)) {
                                onDeleteInvoice(inv.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                            title="Eliminar factura"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
