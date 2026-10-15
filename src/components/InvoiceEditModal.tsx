import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Trash2,
  DollarSign,
  Calendar,
  Building2,
  User,
  Shield,
  Clock,
  AlertTriangle,
  Receipt,
  Paperclip,
  FileText,
  Upload,
  Eye,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { Invoice, InvoiceStatus, SurgicalCase, AttachedDocument, DocumentType } from '../types/surgical';
import { formatCurrency, CurrencyCode } from '../lib/currency';
import { validateInvoice } from '../lib/surgicalLogic';

interface InvoiceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceToEdit?: Invoice | null;
  cases: SurgicalCase[];
  onSave: (invoiceData: any) => void;
  onDelete?: (id: string) => void;
  onViewDocument?: (doc: AttachedDocument, c?: SurgicalCase, inv?: Invoice) => void;
  currency: CurrencyCode;
}

export const InvoiceEditModal: React.FC<InvoiceEditModalProps> = ({
  isOpen,
  onClose,
  invoiceToEdit,
  cases,
  onSave,
  onDelete,
  onViewDocument,
  currency,
}) => {
  const [formData, setFormData] = useState<Partial<Invoice>>({
    invoiceNumber: '',
    pointOfSale: '00003',
    compNumber: '00000289',
    caseId: '',
    patientName: '',
    patientMedicalRecordNumber: '',
    insuranceProvider: 'CORPORACION MEDICA DE GRAL SAN MARTIN S A',
    clinic: 'Corporación Médica de Gral San Martín SA',
    surgeonFee: 417200,
    materialsCost: 0,
    taxRate: 10.5,
    netTaxableAmount: 417200,
    netExemptAmount: 0,
    ivaAmount: 43806,
    ivaRate: 10.5,
    totalAmount: 461006,
    currency,
    issueDate: new Date().toISOString().split('T')[0],
    expectedCollectionDate: '',
    actualCollectionDate: '',
    status: 'EMITIDA',
    auditNotes: '',
    paymentReference: '',
    caeNumber: '',
    caeDueDate: '',
    recipientCuit: '30545840754',
    recipientName: 'CORPORACION MEDICA DE GRAL SAN MARTIN S A',
    recipientAddress: 'Matheu 4023 - San Martín, Buenos Aires',
    conceptDescription: '',
    attachedDocuments: [],
  });

  const [attachedDocuments, setAttachedDocuments] = useState<AttachedDocument[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // New attachment upload state
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocFile, setNewDocFile] = useState<{ name: string; size: string; dataUrl?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (invoiceToEdit) {
      setFormData(invoiceToEdit);
      setAttachedDocuments(invoiceToEdit.attachedDocuments || []);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const todayObj = new Date();
      const expectedDay20 = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-20`;

      setFormData({
        invoiceNumber: `00003-00000${Math.floor(280 + Math.random() * 20)}`,
        pointOfSale: '00003',
        compNumber: `00000${Math.floor(280 + Math.random() * 20)}`,
        caseId: cases[0]?.id || '',
        patientName: 'Prestaciones Médicas · Corporación Médica',
        patientMedicalRecordNumber: 'LIQ-2026',
        insuranceProvider: 'Obras Sociales y Prepagos (Corporación Médica)',
        clinic: 'Corporación Médica de Gral San Martín SA',
        surgeonFee: 417200,
        materialsCost: 0,
        taxRate: 10.5,
        netTaxableAmount: 417200,
        netExemptAmount: 0,
        ivaAmount: 43806,
        ivaRate: 10.5,
        totalAmount: 461006,
        currency,
        issueDate: today,
        expectedCollectionDate: expectedDay20,
        actualCollectionDate: '',
        status: 'PENDIENTE',
        auditNotes: 'Pago esperado el día 20 del mes de emisión.',
        paymentReference: '',
        caeNumber: '',
        caeDueDate: '',
        recipientCuit: '30545840754',
        recipientName: 'CORPORACION MEDICA DE GRAL SAN MARTIN S A',
        recipientAddress: 'Matheu 4023 - San Martín, Buenos Aires',
        conceptDescription: 'Honorarios y Gastos por prestaciones facturadas a las obras sociales y prepagos a través de Corporación Médica',
        attachedDocuments: [],
      });
      setAttachedDocuments([]);
    }
    setErrors({});
    setNewDocTitle('');
    setNewDocFile(null);
  }, [invoiceToEdit, isOpen, cases, currency]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Invoice, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // When issue date changes, helper suggests day 20 of that month
      if (field === 'issueDate' && value) {
        const parts = value.split('-');
        if (parts.length === 3 && !prev.expectedCollectionDate) {
          updated.expectedCollectionDate = `${parts[0]}-${parts[1]}-20`;
        }
      }

      // Auto recalculate total when fee, taxable or exempt changes
      if (field === 'netTaxableAmount' || field === 'netExemptAmount' || field === 'ivaAmount') {
        const taxable = field === 'netTaxableAmount' ? parseFloat(value) || 0 : (prev.netTaxableAmount || 0);
        const exempt = field === 'netExemptAmount' ? parseFloat(value) || 0 : (prev.netExemptAmount || 0);
        const iva = field === 'ivaAmount' ? parseFloat(value) || 0 : (prev.ivaAmount || 0);
        updated.totalAmount = taxable + exempt + iva;
      }

      return updated;
    });

    if (errors[field]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const setExpectedToDay20 = () => {
    const baseDate = formData.issueDate ? new Date(formData.issueDate) : new Date();
    const y = baseDate.getFullYear();
    const m = String(baseDate.getMonth() + 1).padStart(2, '0');
    setFormData(prev => ({ ...prev, expectedCollectionDate: `${y}-${m}-20` }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeKb = (file.size / 1024).toFixed(1) + ' KB';
    const reader = new FileReader();
    reader.onload = () => {
      setNewDocFile({
        name: file.name,
        size: sizeKb,
        dataUrl: reader.result as string,
      });
      if (!newDocTitle) {
        setNewDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    const newDoc: AttachedDocument = {
      id: `doc-${Date.now()}`,
      title: newDocTitle.trim(),
      fileName: newDocFile?.name || `${newDocTitle.trim().replace(/\s+/g, '_')}.pdf`,
      fileType: 'factura',
      date: formData.issueDate || new Date().toISOString().split('T')[0],
      institution: formData.recipientName || 'Corporación Médica de Gral San Martín SA',
      description: `Comprobante de factura ${formData.invoiceNumber}`,
      summaryText: `Comprobante oficial de la factura ${formData.invoiceNumber}. Monto: ${formatCurrency(formData.totalAmount || 0, currency)}.`,
      signee: 'Dr. Miguel Angel Ciavarelli',
      registrationNumber: 'CUIT: 20-14778362-1 | MN 70212 | MP 440703',
      fileSize: newDocFile?.size || 'PDF',
      fileDataUrl: newDocFile?.dataUrl,
    };

    setAttachedDocuments(prev => [newDoc, ...prev]);
    setNewDocTitle('');
    setNewDocFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachedDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      attachedDocuments,
    };

    const validation = validateInvoice(payload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{invoiceToEdit ? 'Editar Factura A / Liquidación' : 'Nueva Factura A (ARCA)'}</span>
                <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-cyan-300 font-mono">
                  COD. 01
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Dr. Miguel Angel Ciavarelli (CUIT: 20147783621) · Día 20 fecha de cobro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Section 1: Identificación Factura A & Receptor */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                <span>Datos de Comprobante AFIP / ARCA</span>
              </div>
              <span className="font-mono text-slate-400 font-normal">Punto de Venta: 00003</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  N° Comprobante (Pto Vta - Nro) *
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber || ''}
                  onChange={e => handleChange('invoiceNumber', e.target.value)}
                  placeholder="00003-00000289"
                  className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    errors.invoiceNumber ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
                {errors.invoiceNumber && (
                  <p className="text-[11px] text-rose-400 mt-1">{errors.invoiceNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  CAE N° (ARCA Autorizado)
                </label>
                <input
                  type="text"
                  value={formData.caeNumber || ''}
                  onChange={e => handleChange('caeNumber', e.target.value)}
                  placeholder="86361826146027"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Fecha Vto. de CAE
                </label>
                <input
                  type="date"
                  value={formData.caeDueDate || ''}
                  onChange={e => handleChange('caeDueDate', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-750">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Razón Social Receptora *
                </label>
                <input
                  type="text"
                  value={formData.recipientName || formData.clinic || ''}
                  onChange={e => {
                    handleChange('recipientName', e.target.value);
                    handleChange('clinic', e.target.value);
                  }}
                  placeholder="CORPORACION MEDICA DE GRAL SAN MARTIN S A"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  CUIT Receptor
                </label>
                <input
                  type="text"
                  value={formData.recipientCuit || ''}
                  onChange={e => handleChange('recipientCuit', e.target.value)}
                  placeholder="30545840754"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Concepto / Detalle de Prestaciones
              </label>
              <textarea
                rows={2}
                value={formData.conceptDescription || ''}
                onChange={e => handleChange('conceptDescription', e.target.value)}
                placeholder="Honorarios y Gastos por prestaciones facturadas a las obras sociales y prepagos..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              />
            </div>
          </div>

          {/* Section 2: Fechas & Regla de Cobro (Día 20) */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Fechas & Criterio de Cobranza (Día 20)</span>
              </div>
              <button
                type="button"
                onClick={setExpectedToDay20}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 lowercase"
              >
                <span>Fijar día 20 del mes de emisión</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Fecha de Emisión *</label>
                <input
                  type="date"
                  value={formData.issueDate || ''}
                  onChange={e => handleChange('issueDate', e.target.value)}
                  className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    errors.issueDate ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
                {errors.issueDate && (
                  <p className="text-[11px] text-rose-400 mt-1">{errors.issueDate}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-cyan-300 mb-1">
                  Vto. para el Pago (Día 20) *
                </label>
                <input
                  type="date"
                  value={formData.expectedCollectionDate || ''}
                  onChange={e => handleChange('expectedCollectionDate', e.target.value)}
                  className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    errors.expectedCollectionDate ? 'border-rose-500' : 'border-cyan-700'
                  }`}
                />
                {errors.expectedCollectionDate && (
                  <p className="text-[11px] text-rose-400 mt-1">{errors.expectedCollectionDate}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Estado de Factura</label>
                <select
                  value={formData.status || 'PENDIENTE'}
                  onChange={e => handleChange('status', e.target.value as InvoiceStatus)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="PENDIENTE">PENDIENTE DE COBRO</option>
                  <option value="EMITIDA">EMITIDA</option>
                  <option value="EN_AUDITORIA">EN AUDITORÍA</option>
                  <option value="OBSERVADA">OBSERVADA</option>
                  <option value="COBRADA">COBRADA / RETIRADA</option>
                  <option value="VENCIDA">VENCIDA</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Desglose Impositivo & Total */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
              <DollarSign className="w-4 h-4" />
              <span>Desglose de Importes y Total Factura</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Importe Exento ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.netExemptAmount || 0}
                  onChange={e => handleChange('netExemptAmount', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Neto Gravado ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.netTaxableAmount || 0}
                  onChange={e => handleChange('netTaxableAmount', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">IVA 10.5% ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.ivaAmount || 0}
                  onChange={e => handleChange('ivaAmount', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-cyan-300 mb-1 font-bold">Total Factura ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalAmount || 0}
                  onChange={e => handleChange('totalAmount', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-cyan-600 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Documentos PDF y Comprobantes Adjuntos */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                <span>Comprobantes & Factura PDF Adjunta ({attachedDocuments.length})</span>
              </div>
            </div>

            {attachedDocuments.length > 0 ? (
              <div className="space-y-2">
                {attachedDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className="bg-slate-950/80 border border-slate-750 rounded-xl p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-xs text-white truncate block">
                          {doc.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {doc.fileName} · {doc.date}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onViewDocument && (
                        <button
                          type="button"
                          onClick={() => onViewDocument(doc, undefined, formData as Invoice)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-white text-xs font-semibold transition ${
                            doc.fileType === 'liquidacion'
                              ? 'bg-amber-600 hover:bg-amber-500'
                              : 'bg-cyan-600 hover:bg-cyan-500'
                          }`}
                          title={`Ver ${doc.title}`}
                        >
                          <Eye className="w-3 h-3" />
                          <span>
                            {doc.fileType === 'liquidacion'
                              ? 'Ver Liquidación'
                              : 'Ver Factura A'}
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(doc.id)}
                        className="p-1 rounded text-rose-400 hover:bg-rose-950/50"
                        title="Quitar comprobante"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                No hay archivos adjuntos en esta factura.
              </p>
            )}

            {/* Upload file section */}
            <div className="pt-2 border-t border-slate-750 flex flex-col sm:flex-row items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{newDocFile ? newDocFile.name : 'Seleccionar PDF o imagen'}</span>
              </button>

              <input
                type="text"
                value={newDocTitle}
                onChange={e => setNewDocTitle(e.target.value)}
                placeholder="Título del documento..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />

              <button
                type="button"
                onClick={handleAddAttachment}
                disabled={!newDocTitle.trim()}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition"
              >
                Adjuntar
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {invoiceToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Confirma eliminar la factura ${invoiceToEdit.invoiceNumber}?`)) {
                    onDelete(invoiceToEdit.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg text-xs font-semibold transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Factura</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 transition active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Factura</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
