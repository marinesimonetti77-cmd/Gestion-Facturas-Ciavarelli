import React, { useState, useEffect } from 'react';
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
  Receipt
} from 'lucide-react';
import { Invoice, InvoiceStatus, SurgicalCase } from '../types/surgical';
import { formatCurrency, CurrencyCode } from '../lib/currency';
import { validateInvoice } from '../lib/surgicalLogic';

interface InvoiceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceToEdit?: Invoice | null;
  cases: SurgicalCase[];
  onSave: (invoiceData: any) => void;
  onDelete?: (id: string) => void;
  currency: CurrencyCode;
}

export const InvoiceEditModal: React.FC<InvoiceEditModalProps> = ({
  isOpen,
  onClose,
  invoiceToEdit,
  cases,
  onSave,
  onDelete,
  currency,
}) => {
  const [formData, setFormData] = useState<Partial<Invoice>>({
    invoiceNumber: '',
    caseId: '',
    patientName: '',
    patientMedicalRecordNumber: '',
    insuranceProvider: 'OSDE 310 / 410',
    clinic: 'Sanatorio Los Arcos',
    surgeonFee: 850000,
    materialsCost: 200000,
    taxRate: 21,
    totalAmount: 1270500,
    currency,
    issueDate: new Date().toISOString().split('T')[0],
    expectedCollectionDate: '',
    actualCollectionDate: '',
    status: 'EMITIDA',
    auditNotes: '',
    paymentReference: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (invoiceToEdit) {
      setFormData(invoiceToEdit);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const expected = new Date();
      expected.setDate(expected.getDate() + 30);

      setFormData({
        invoiceNumber: `FAC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        caseId: cases[0]?.id || '',
        patientName: cases[0]?.patientName || '',
        patientMedicalRecordNumber: cases[0]?.patientMedicalRecordNumber || '',
        insuranceProvider: cases[0]?.insuranceProvider || 'OSDE 310 / 410',
        clinic: cases[0]?.estimatedSurgeryClinic || 'Sanatorio Los Arcos',
        surgeonFee: 850000,
        materialsCost: 250000,
        taxRate: 21,
        totalAmount: 1331000,
        currency,
        issueDate: today,
        expectedCollectionDate: expected.toISOString().split('T')[0],
        actualCollectionDate: '',
        status: 'EMITIDA',
        auditNotes: '',
        paymentReference: '',
      });
    }
    setErrors({});
  }, [invoiceToEdit, isOpen, cases, currency]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Invoice, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Auto recalculate total when fee, materials or tax changes
      if (field === 'surgeonFee' || field === 'materialsCost' || field === 'taxRate') {
        const fee = field === 'surgeonFee' ? parseFloat(value) || 0 : (prev.surgeonFee || 0);
        const mats = field === 'materialsCost' ? parseFloat(value) || 0 : (prev.materialsCost || 0);
        const tax = field === 'taxRate' ? parseFloat(value) || 0 : (prev.taxRate || 0);
        const base = fee + mats;
        updated.totalAmount = Math.round(base * (1 + tax / 100));
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

  const handleSelectCase = (caseId: string) => {
    const selectedCase = cases.find(c => c.id === caseId);
    if (!selectedCase) return;

    const materialsSum = (selectedCase.materials || []).reduce((acc, m) => acc + (m.cost * m.quantity), 0);
    const fee = formData.surgeonFee || 850000;
    const tax = formData.taxRate || 21;
    const base = fee + materialsSum;

    setFormData(prev => ({
      ...prev,
      caseId: selectedCase.id,
      patientName: selectedCase.patientName,
      patientMedicalRecordNumber: selectedCase.patientMedicalRecordNumber,
      insuranceProvider: selectedCase.insuranceProvider,
      clinic: selectedCase.estimatedSurgeryClinic,
      materialsCost: materialsSum,
      totalAmount: Math.round(base * (1 + tax / 100)),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateInvoice(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {invoiceToEdit ? 'Editar Factura / Liquidación' : 'Nueva Factura / Cobranza'}
              </h2>
              <p className="text-xs text-slate-400">
                Gestión de montos, honorarios médicos, fecha de cobro y auditoría
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Associated Case Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Caso Quirúrgico Asociado (Opcional)
            </label>
            <select
              value={formData.caseId || ''}
              onChange={e => handleSelectCase(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">-- Sin vincular / Factura libre --</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>
                  {c.patientMedicalRecordNumber} · {c.patientName} ({c.procedureName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                N° de Factura / Comprobante *
              </label>
              <input
                type="text"
                value={formData.invoiceNumber || ''}
                onChange={e => handleChange('invoiceNumber', e.target.value)}
                placeholder="Ej. FAC-2026-0045"
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
                Paciente Asociado *
              </label>
              <input
                type="text"
                value={formData.patientName || ''}
                onChange={e => handleChange('patientName', e.target.value)}
                placeholder="Nombre del paciente"
                className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  errors.patientName ? 'border-rose-500' : 'border-slate-700'
                }`}
              />
              {errors.patientName && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.patientName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Obra Social / Prepaga / Entidad
              </label>
              <input
                type="text"
                value={formData.insuranceProvider || ''}
                onChange={e => handleChange('insuranceProvider', e.target.value)}
                placeholder="OSDE, Swiss Medical, Particular..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Clínica / Sanatorio
              </label>
              <input
                type="text"
                value={formData.clinic || ''}
                onChange={e => handleChange('clinic', e.target.value)}
                placeholder="Sanatorio Los Arcos..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Amounts & Fees breakdown */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              <span>Desglose de Montos y Honorarios</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Honorarios Médicos ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.surgeonFee || 0}
                  onChange={e => handleChange('surgeonFee', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Insumos y Materiales ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.materialsCost || 0}
                  onChange={e => handleChange('materialsCost', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">IVA / Impuesto (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.taxRate || 0}
                  onChange={e => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200">Total Liquidación Facturada:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.totalAmount || 0}
                  onChange={e => handleChange('totalAmount', parseFloat(e.target.value) || 0)}
                  className="w-44 bg-slate-950 border border-cyan-500 rounded-lg px-3 py-1.5 text-base font-bold text-cyan-300 font-mono text-right"
                />
              </div>
            </div>
          </div>

          {/* Dates & Expected Collection Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Fecha de Emisión de Factura
              </label>
              <input
                type="date"
                value={formData.issueDate || ''}
                onChange={e => handleChange('issueDate', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="p-3 bg-cyan-950/20 border border-cyan-700/50 rounded-xl">
              <label className="block text-xs font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Fecha Estimada de Cobro *</span>
              </label>
              <input
                type="date"
                value={formData.expectedCollectionDate || ''}
                onChange={e => handleChange('expectedCollectionDate', e.target.value)}
                className={`w-full bg-slate-950 border rounded-lg px-3 py-1.5 text-sm text-cyan-200 font-medium ${
                  errors.expectedCollectionDate ? 'border-rose-500' : 'border-cyan-600'
                }`}
              />
              {errors.expectedCollectionDate && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.expectedCollectionDate}</p>
              )}
            </div>
          </div>

          {/* Status & Actual Collection Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Estado de Factura / Cobranza
              </label>
              <select
                value={formData.status || 'EMITIDA'}
                onChange={e => {
                  const newStatus = e.target.value as InvoiceStatus;
                  const todayStr = new Date().toISOString().split('T')[0];
                  handleChange('status', newStatus);
                  if (newStatus === 'COBRADA' && !formData.actualCollectionDate) {
                    handleChange('actualCollectionDate', todayStr);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-semibold"
              >
                <option value="PENDIENTE">PENDIENTE DE EMITIR</option>
                <option value="EMITIDA">EMITIDA (EN ESPERA)</option>
                <option value="EN_AUDITORIA">EN AUDITORÍA MÉDICA</option>
                <option value="OBSERVADA">OBSERVADA / RECLAMADA</option>
                <option value="COBRADA">COBRADA / LIQUIDADA</option>
                <option value="VENCIDA">VENCIDA / EN MORA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Fecha Real de Cobro (Si fue cobrada)
              </label>
              <input
                type="date"
                value={formData.actualCollectionDate || ''}
                onChange={e => handleChange('actualCollectionDate', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Referencia de Pago / N° Liquidación / Cheque / Transferencia
            </label>
            <input
              type="text"
              value={formData.paymentReference || ''}
              onChange={e => handleChange('paymentReference', e.target.value)}
              placeholder="Ej. LIQ-OSDE-9921 o TRANSF-BCO-GALICIA-84192"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Observaciones de Auditoría Médica & Seguimiento
            </label>
            <textarea
              rows={3}
              value={formData.auditNotes || ''}
              onChange={e => handleChange('auditNotes', e.target.value)}
              placeholder="Motivo de observación, número de reclamo telefónico, trámite en portal..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white"
            />
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
