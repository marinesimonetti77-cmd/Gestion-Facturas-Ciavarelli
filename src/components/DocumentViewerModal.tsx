import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  Building2,
  Calendar,
  User,
  Shield,
  Stethoscope,
  CheckCircle2,
  Paperclip,
  QrCode,
  ExternalLink
} from 'lucide-react';
import { AttachedDocument, SurgicalCase, Invoice } from '../types/surgical';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: AttachedDocument | null;
  associatedCase?: SurgicalCase | null;
  associatedInvoice?: Invoice | null;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  associatedCase,
  associatedInvoice,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !doc) return null;

  const handlePrint = () => {
    window.print();
  };

  const isLiquidation = doc.fileType === 'liquidacion' || doc.fileName.toLowerCase().includes('liquidacion');
  const isInvoice = !isLiquidation && (doc.fileType === 'factura' || doc.fileType === 'comprobante' || (!associatedCase && !!associatedInvoice));
  const inv = associatedInvoice;

  const handleDownload = () => {
    if (doc.fileDataUrl) {
      const a = window.document.createElement('a');
      a.href = doc.fileDataUrl;
      a.download = doc.fileName || `${doc.title}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      return;
    }

    const content = `
================================================================================
${isLiquidation ? 'LIQUIDACIÓN SANATORIAL - DETALLE DE PRESTACIONES MÉDICAS' : isInvoice ? 'ARCA / AFIP - FACTURA A (ORIGINAL)' : doc.institution.toUpperCase()}
${doc.title.toUpperCase()}
================================================================================
Fecha: ${doc.date}
Archivo: ${doc.fileName}
Tipo de Documento: ${doc.fileType.toUpperCase()}

${isLiquidation ? `
INSTITUCIÓN EMISORA: ${doc.institution}
MÉDICO PRESTADOR: Dr. Miguel Angel Ciavarelli (MN 70212 | MP 440703 | CUIT: 20-14778362-1)
FACTURA ARCA ASOCIADA: ${inv?.invoiceNumber || '-'} (CAE: ${inv?.caeNumber || '-'})
VTO. COBRO (DÍA 20): ${inv?.expectedCollectionDate || 'Día 20 del mes'}
PERÍODO: ${inv?.periodFrom || '01/06/2026'} hasta ${inv?.periodTo || '30/06/2026'}

DESCRIPCIÓN:
${doc.description}

RESUMEN:
${doc.summaryText}

TOTAL LIQUIDADO: $ ${(inv?.totalAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
COBRADO / RETIRADO: $ ${(inv?.collectedAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
PENDIENTE DE COBRO: $ ${(inv?.pendingAmount ?? (inv?.totalAmount || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}

DETALLE TÉCNICO:
${doc.technicalDescription || 'Conformado para liquidación según cronograma día 20.'}
` : isInvoice ? `
EMISOR:
Razón Social: CIAVARELLI MIGUEL ANGEL
CUIT: 20-14778362-1
Ingresos Brutos: 901-078560-9
Domicilio Comercial: Unidad Funcional 2 S/N 0 - San Martín De Los Andes, Neuquén
Condición frente al IVA: IVA Responsable Inscripto

COMPROBANTE:
Punto de Venta: ${inv?.pointOfSale || '00003'}   Comp. Nro: ${inv?.compNumber || '00000289'}
Fecha de Emisión: ${inv?.issueDate || doc.date}
Fecha de Vto. para el pago: ${inv?.expectedCollectionDate || 'Día 20 del mes'}
Período Facturado: ${inv?.periodFrom || '01/06/2026'} hasta ${inv?.periodTo || '30/06/2026'}

RECEPTOR:
Razón Social: ${inv?.recipientName || doc.institution}
CUIT: ${inv?.recipientCuit || '30-54584075-4'}
Condición IVA: IVA Responsable Inscripto
Condición de Venta: ${inv?.recipientName?.includes('ASISTENCIAL') ? 'Cuenta Corriente' : 'Cheque'}

DETALLE DE PRESTACIONES:
${inv?.conceptDescription || doc.description}
Importe Exento: $ ${(inv?.netExemptAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
Importe Neto Gravado: $ ${(inv?.netTaxableAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
IVA (10.5%): $ ${(inv?.ivaAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
IMPORTE TOTAL: $ ${(inv?.totalAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}

AUTORIZACIÓN ARCA:
CAE N°: ${inv?.caeNumber || '86361826146027'}
Fecha de Vto. de CAE: ${inv?.caeDueDate || '17/09/2026'}
` : `
PACIENTE:
Nombre: ${associatedCase?.patientName || 'Expediente Quirúrgico'}
N° Historia Clínica: ${associatedCase?.patientMedicalRecordNumber || '-'}
DNI: ${associatedCase?.patientDni || '-'}
Obra Social / Cobertura: ${associatedCase?.insuranceProvider || '-'}
N° Afiliado: ${associatedCase?.insuranceAffiliateNumber || '-'}

EQUIPO QUIRÚRGICO:
Cirujano: ${doc.signee} (${doc.registrationNumber})
${associatedCase?.assistantName ? `1er Ayudante: ${associatedCase.assistantName}\n` : ''}
${associatedCase?.anesthesiologist ? `Anestesiólogo: ${associatedCase.anesthesiologist}\n` : ''}

DESCRIPCIÓN GENERAL:
${doc.description}

RESUMEN CLÍNICO:
${doc.summaryText}

${doc.technicalDescription ? `DESCRIPCIÓN TÉCNICA DETALLADA:\n${doc.technicalDescription}\n` : ''}
`}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${doc.fileName.replace('.pdf', '') || 'documento'}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case 'protocolo':
        return 'bg-blue-900/60 text-blue-300 border-blue-700';
      case 'presupuesto':
        return 'bg-purple-900/60 text-purple-300 border-purple-700';
      case 'factura':
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-700';
      case 'liquidacion':
        return 'bg-amber-900/60 text-amber-300 border-amber-700';
      case 'comprobante':
        return 'bg-indigo-900/60 text-indigo-300 border-indigo-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const patient = associatedCase;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden print:border-none print:shadow-none print:max-h-none print:bg-white print:text-black">
        {/* Modal Toolbar - Hidden during print */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 print:hidden">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isLiquidation
                ? 'bg-amber-600/20 text-amber-400 border-amber-500/30'
                : isInvoice
                ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                : 'bg-cyan-600/20 text-cyan-400 border-cyan-500/30'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white truncate max-w-[320px] sm:max-w-md">
                  {doc.title}
                </h2>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getDocTypeBadge(doc.fileType)}`}>
                  {doc.fileType}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{doc.fileName}</span>
                <span>•</span>
                <span>{doc.institution}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Imprimir comprobante o guardar como PDF"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition"
              title="Descargar archivo"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-8 bg-slate-950/60 print:p-0 print:bg-white">
          {/* Printable Document Paper */}
          <div
            ref={printAreaRef}
            className="bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-10 max-w-3xl mx-auto border border-slate-300 print:shadow-none print:border-none print:p-6 print:max-w-full"
          >
            {/* If uploaded custom image file exists, show preview */}
            {doc.fileDataUrl && doc.fileDataUrl.startsWith('data:image/') && (
              <div className="mb-6 border border-slate-300 rounded-lg overflow-hidden bg-slate-100 p-2 text-center">
                <img
                  src={doc.fileDataUrl}
                  alt={doc.title}
                  className="max-h-96 mx-auto rounded object-contain"
                />
              </div>
            )}

            {/* BRANCH 0: OFFICIAL SANATORIAL LIQUIDATION / RESUMEN DE LIQUIDACIÓN MÉDICA */}
            {isLiquidation ? (
              <div className="border-2 border-slate-800 p-4 sm:p-6 text-slate-900 font-sans text-xs space-y-5">
                {/* Sanatorio Header */}
                <div className="border-b-2 border-slate-800 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-amber-600 shrink-0" />
                        <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-tight">
                          {doc.institution}
                        </h3>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mt-1">
                        Departamento de Liquidaciones Médicas & Auditoría Contable Sanatorial
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {inv?.recipientAddress || 'Matheu 4023 - Gral. San Martín, Provincia de Buenos Aires'} · CUIT: {inv?.recipientCuit || '30-54584075-4'}
                      </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                        Comprobante de Liquidación
                      </span>
                      <span className="font-mono text-sm font-black text-slate-900 block mt-0.5">
                        {doc.fileName.replace('.pdf', '').toUpperCase()}
                      </span>
                      <span className="text-[11px] text-slate-600 block mt-0.5">
                        Fecha: <strong>{doc.date}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Professional and ARCA Invoicing Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Médico Prestador */}
                  <div className="bg-slate-50 border border-slate-300 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                      <User className="w-4 h-4 text-slate-700" />
                      <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                        Médico Cirujano Prestador
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-700">
                      <p>
                        <strong className="text-slate-900 font-semibold">Profesional:</strong> Dr. Miguel Angel Ciavarelli
                      </p>
                      <p>
                        <strong className="text-slate-900 font-semibold">Matrículas:</strong> MN 70212 | MP 440703
                      </p>
                      <p>
                        <strong className="text-slate-900 font-semibold">CUIT:</strong> 20-14778362-1 (IVA Responsable Inscripto)
                      </p>
                      <p>
                        <strong className="text-slate-900 font-semibold">Especialidad:</strong> Cirugía General y Digestiva - Cirugía HBP
                      </p>
                    </div>
                  </div>

                  {/* Right: Factura ARCA Asociada y Pago Día 20 */}
                  <div className="bg-slate-50 border border-slate-300 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                      <Calendar className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                        Factura AFIP/ARCA & Criterio Día 20
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-700">
                      <p>
                        <strong className="text-slate-900 font-semibold">Factura A Emitida:</strong>{' '}
                        <span className="font-mono font-bold text-slate-900">{inv?.invoiceNumber || 'Factura A vinculada'}</span>
                      </p>
                      <p>
                        <strong className="text-slate-900 font-semibold">CAE Autorizado:</strong>{' '}
                        <span className="font-mono">{inv?.caeNumber || '86361828935982'}</span> (Vto: {inv?.caeDueDate || '17/09/2026'})
                      </p>
                      <p>
                        <strong className="text-slate-900 font-semibold">Fecha Esperada de Cobro:</strong>{' '}
                        <span className="font-mono font-bold text-emerald-700">
                          {inv?.expectedCollectionDate || 'Día 20 del mes'}
                        </span>
                      </p>
                      <p>
                        <strong className="text-slate-900 font-semibold">Período de Prestaciones:</strong>{' '}
                        <span>{inv?.periodFrom || '01/06/2026'} al {inv?.periodTo || '30/06/2026'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Economic Summary Tiles */}
                <div className="bg-amber-50/70 border-2 border-amber-300/80 rounded-xl p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900 mb-3 flex items-center justify-between">
                    <span>Resumen de Liquidación de Honorarios & Cobros</span>
                    <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">
                      {inv?.status === 'COBRADA' ? 'COBRADA / RETIRADA' : 'PENDIENTE DE COBRO'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-xs">
                      <span className="text-[10px] text-slate-500 font-medium block">Importe Exento</span>
                      <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm">
                        $ {(inv?.netExemptAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-xs">
                      <span className="text-[10px] text-slate-500 font-medium block">Neto Gravado (10,5%)</span>
                      <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm">
                        $ {(inv?.netTaxableAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-xs">
                      <span className="text-[10px] text-slate-500 font-medium block">IVA (10,5%)</span>
                      <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm">
                        $ {(inv?.ivaAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="bg-amber-600 text-white p-2.5 rounded-lg shadow-xs">
                      <span className="text-[10px] text-amber-100 font-semibold block">Total Liquidado</span>
                      <span className="font-mono font-black text-white text-sm sm:text-base">
                        $ {(inv?.totalAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Registered Collections vs Pending */}
                  <div className="mt-3 pt-3 border-t border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between items-center bg-white/80 px-3 py-1.5 rounded border border-amber-200">
                      <span className="text-slate-600 font-medium">Cobros Retirados / Registrados:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        $ {(inv?.collectedAmount || (inv?.status === 'COBRADA' ? inv.totalAmount : 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white/80 px-3 py-1.5 rounded border border-amber-200">
                      <span className="text-slate-600 font-medium">Saldo Pendiente de Cobro:</span>
                      <span className="font-mono font-bold text-amber-800">
                        $ {((inv?.pendingAmount !== undefined ? inv.pendingAmount : (inv?.status === 'COBRADA' ? 0 : inv?.totalAmount)) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Concept and Breakdown Narrative */}
                <div className="space-y-3">
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1">
                      Concepto & Objeto de la Liquidación
                    </h5>
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                      {doc.description}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1">
                      Resumen Oficial de Prestaciones
                    </h5>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 font-mono text-xs whitespace-pre-line leading-relaxed">
                      {doc.summaryText}
                    </div>
                  </div>

                  {doc.technicalDescription && (
                    <div>
                      <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1">
                        Detalle Técnico y Parámetros Contables
                      </h5>
                      <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 text-slate-800 font-mono text-[11px] whitespace-pre-line leading-relaxed">
                        {doc.technicalDescription}
                      </div>
                    </div>
                  )}
                </div>

                {/* Audit & Legal Footer */}
                <div className="pt-6 border-t-2 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <p className="font-semibold text-slate-700">Comprobante de Liquidación Médica Sanatorial Oficial</p>
                    <p>Liquidado bajo el régimen de pago día 20 del mes de emisión de factura.</p>
                  </div>

                  <div className="text-center min-w-[200px] border-t border-slate-400 pt-1">
                    <p className="font-bold text-xs text-slate-900 uppercase">
                      {doc.signee || 'Dpto. Liquidaciones Médicas'}
                    </p>
                    <p className="text-[11px] text-slate-600 font-mono">
                      {doc.registrationNumber || 'Auditoría Médica Contable'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Firma Digital Registrada
                    </p>
                  </div>
                </div>
              </div>
            ) : isInvoice ? (
              <div className="border-2 border-slate-800 p-4 sm:p-6 text-slate-900 font-sans text-xs space-y-4">
                {/* Header with ORIGINAL and A code 01 box */}
                <div className="text-center font-bold tracking-widest text-sm uppercase mb-1">
                  ORIGINAL
                </div>

                <div className="border border-slate-800 rounded relative pt-2 pb-3 px-3">
                  {/* Central Letter 'A' Box */}
                  <div className="absolute left-1/2 -top-3 -translate-x-1/2 bg-white border-2 border-slate-800 px-3 py-1 text-center shadow-xs">
                    <span className="block text-2xl font-black leading-none">A</span>
                    <span className="block text-[9px] font-bold tracking-tight text-slate-700">COD. 01</span>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-3">
                    {/* Left: Emisor */}
                    <div className="space-y-1 pr-4 border-r border-slate-300">
                      <h3 className="text-base font-extrabold uppercase text-slate-900 tracking-tight">
                        CIAVARELLI MIGUEL ANGEL
                      </h3>
                      <div className="text-[11px] text-slate-700 space-y-0.5">
                        <p><strong className="font-semibold text-slate-900">Razón Social:</strong> CIAVARELLI MIGUEL ANGEL</p>
                        <p><strong className="font-semibold text-slate-900">Domicilio Comercial:</strong> Unidad Funcional 2 S/N 0 - San Martín De Los Andes, Neuquén</p>
                        <p><strong className="font-semibold text-slate-900">Condición frente al IVA:</strong> IVA Responsable Inscripto</p>
                      </div>
                    </div>

                    {/* Right: Factura & Identificadores */}
                    <div className="space-y-1 pl-4 text-right">
                      <h3 className="text-xl font-black uppercase text-slate-900 tracking-wider">
                        FACTURA
                      </h3>
                      <div className="text-[11px] text-slate-700 font-mono space-y-0.5">
                        <p>
                          <strong className="font-sans font-semibold text-slate-900">Punto de Venta:</strong> {inv?.pointOfSale || '00003'}{' '}
                          <strong className="font-sans font-semibold text-slate-900 ml-2">Comp. Nro:</strong> {inv?.compNumber || '00000289'}
                        </p>
                        <p><strong className="font-sans font-semibold text-slate-900">Fecha de Emisión:</strong> {inv?.issueDate || doc.date}</p>
                        <p><strong className="font-sans font-semibold text-slate-900">CUIT:</strong> 20147783621</p>
                        <p><strong className="font-sans font-semibold text-slate-900">Ingresos Brutos:</strong> 901-078560-9</p>
                        <p><strong className="font-sans font-semibold text-slate-900">Fecha de Inicio de Actividades:</strong> 01/07/2004</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-box: Período y Vto de Pago */}
                <div className="border border-slate-800 rounded p-2.5 text-[11px] grid grid-cols-2 gap-2 bg-slate-50/70">
                  <div>
                    <span className="font-semibold">Período Facturado Desde:</span>{' '}
                    <span className="font-mono">{inv?.periodFrom || '01/06/2026'}</span>{' '}
                    <span className="font-semibold ml-2">Hasta:</span>{' '}
                    <span className="font-mono">{inv?.periodTo || '30/06/2026'}</span>
                  </div>
                  <div className="text-right font-bold text-slate-900">
                    <span>Fecha de Vto. para el pago:</span>{' '}
                    <span className="font-mono text-cyan-900 bg-cyan-100/70 px-2 py-0.5 rounded border border-cyan-300">
                      {inv?.expectedCollectionDate || '20/09/2026'}
                    </span>
                  </div>
                </div>

                {/* Receptor Box */}
                <div className="border border-slate-800 rounded p-3 text-[11px] space-y-1.5">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <strong className="block text-[10px] text-slate-500 uppercase">CUIT</strong>
                      <span className="font-mono font-bold text-slate-900">{inv?.recipientCuit || '30545840754'}</span>
                    </div>
                    <div className="col-span-2">
                      <strong className="block text-[10px] text-slate-500 uppercase">Apellido y Nombre / Razón Social</strong>
                      <span className="font-bold text-slate-900 uppercase">
                        {inv?.recipientName || doc.institution || 'CORPORACION MEDICA DE GRAL SAN MARTIN S A'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200">
                    <div>
                      <strong className="block text-[10px] text-slate-500 uppercase">Condición frente al IVA</strong>
                      <span className="font-medium text-slate-900">IVA Responsable Inscripto</span>
                    </div>
                    <div>
                      <strong className="block text-[10px] text-slate-500 uppercase">Domicilio Comercial</strong>
                      <span className="text-slate-800">{inv?.recipientAddress || 'Matheu 4023 - San Martín, Buenos Aires'}</span>
                    </div>
                    <div className="text-right">
                      <strong className="block text-[10px] text-slate-500 uppercase">Condición de Venta</strong>
                      <span className="font-medium text-slate-900">
                        {inv?.recipientName?.includes('ASISTENCIAL') ? 'Cuenta Corriente' : 'Cheque'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-slate-800 rounded overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-700">
                      <tr>
                        <th className="py-2 px-2.5">Código</th>
                        <th className="py-2 px-2.5">Producto / Servicio</th>
                        <th className="py-2 px-2 text-right">Cantidad</th>
                        <th className="py-2 px-2">U. medida</th>
                        <th className="py-2 px-2 text-right">Precio Unit.</th>
                        <th className="py-2 px-1 text-center">% Bonif</th>
                        <th className="py-2 px-2 text-right">Subtotal</th>
                        <th className="py-2 px-2 text-center">Alícuota IVA</th>
                        <th className="py-2 px-2.5 text-right">Subtotal c/IVA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {/* Main Service Line */}
                      <tr>
                        <td className="py-2 px-2.5 font-mono text-slate-500">-</td>
                        <td className="py-2 px-2.5 font-medium text-slate-900 leading-snug">
                          {inv?.conceptDescription || doc.description || doc.summaryText}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">1,00</td>
                        <td className="py-2 px-2 text-slate-600">unidades</td>
                        <td className="py-2 px-2 text-right font-mono">
                          {((inv?.netExemptAmount || 0) + (inv?.netTaxableAmount || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-1 text-center font-mono">0,00</td>
                        <td className="py-2 px-2 text-right font-mono">
                          {((inv?.netExemptAmount || 0) + (inv?.netTaxableAmount || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-2 text-center font-semibold text-slate-800">
                          {inv?.netExemptAmount && !inv?.netTaxableAmount ? 'Exento' : '10,5%'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                          {(inv?.totalAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Breakdown & Totals */}
                <div className="flex justify-between items-start pt-2">
                  <div className="text-[11px] text-slate-500 max-w-xs space-y-1">
                    <p>Criterio de liquidación y cobro:</p>
                    <p className="font-semibold text-slate-800">
                      El pago esperado se efectiviza el día 20 del mes de emisión de la factura ({inv?.expectedCollectionDate || 'Día 20'}).
                    </p>
                  </div>

                  <div className="w-64 border border-slate-800 rounded p-2.5 space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>Importe Otros Tributos: $</span>
                      <span>0,00</span>
                    </div>
                    {inv?.netExemptAmount ? (
                      <div className="flex justify-between text-slate-800">
                        <span>Importe Exento: $</span>
                        <span>{inv.netExemptAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ) : null}
                    {inv?.netTaxableAmount ? (
                      <div className="flex justify-between text-slate-800">
                        <span>Importe Neto Gravado: $</span>
                        <span>{inv.netTaxableAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ) : null}
                    {inv?.ivaAmount ? (
                      <div className="flex justify-between text-slate-800">
                        <span>IVA 10.5%: $</span>
                        <span>{inv.ivaAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ) : null}
                    <div className="pt-1.5 mt-1 border-t-2 border-slate-900 flex justify-between font-black text-sm text-slate-950">
                      <span>Importe Total: $</span>
                      <span>{(inv?.totalAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* ARCA Bottom Verification Box */}
                <div className="border border-slate-800 rounded p-3 flex items-center justify-between gap-4 mt-4">
                  <div className="flex items-center gap-3">
                    {/* Visual QR Code Representation */}
                    <div className="w-14 h-14 bg-slate-900 text-white p-1 rounded flex items-center justify-center shrink-0">
                      <QrCode className="w-11 h-11" />
                    </div>
                    <div>
                      <span className="text-lg font-black tracking-widest text-slate-900 block leading-tight">
                        ARCA
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 block">
                        Comprobante Autorizado
                      </span>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        Esta Agencia no se responsabiliza por los datos ingresados en el detalle de la operación
                      </p>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-slate-500 font-mono">
                    Pág. 1/1
                  </div>

                  <div className="text-right text-xs font-mono">
                    <p className="font-bold text-slate-900">
                      CAE N°: {inv?.caeNumber || '86361826146027'}
                    </p>
                    <p className="text-[11px] text-slate-700">
                      Fecha de Vto. de CAE: {inv?.caeDueDate || '17/09/2026'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* BRANCH 2: OFFICIAL CLINICAL SURGICAL PROTOCOL LAYOUT */
              <div className="font-serif text-slate-900 space-y-6">
                {/* Institution Header */}
                <div className="border-b-2 border-slate-900 pb-4 mb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-sans uppercase">
                        {doc.institution}
                      </h3>
                      <p className="text-xs text-slate-600 font-sans mt-0.5">
                        Servicio de Cirugía General, Digestiva y Hepatobiliopancreática (HBP)
                      </p>
                      <p className="text-[11px] text-slate-500 font-sans">
                        Provincia de Buenos Aires · República Argentina
                      </p>
                    </div>
                    <div className="text-right font-sans">
                      <span className="inline-block bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded">
                        {doc.fileType.toUpperCase()}
                      </span>
                      <div className="text-xs text-slate-600 mt-1 font-mono">
                        Fecha: {doc.date}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Ref: {doc.fileName}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 text-center">
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide">
                      {doc.title}
                    </h4>
                  </div>
                </div>

                {/* Patient & Case Data Grid */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 font-sans text-xs space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Paciente</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {patient?.patientName || 'Expediente Quirúrgico'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">N° Historia Clínica</span>
                      <span className="font-mono font-bold text-slate-900">
                        {patient?.patientMedicalRecordNumber || 'S/D'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">DNI / Documento</span>
                      <span className="font-bold text-slate-900">
                        {patient?.patientDni || 'S/D'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Nacimiento / Edad</span>
                      <span className="text-slate-800">
                        {patient?.patientBirthDate ? `${patient.patientBirthDate}` : 'S/D'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Obra Social / Cobertura</span>
                      <span className="font-semibold text-slate-900">
                        {patient?.insuranceProvider || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">N° Afiliado / Plan</span>
                      <span className="font-mono text-slate-800">
                        {patient?.insuranceAffiliateNumber || '-'} {patient?.insurancePlan ? `(${patient.insurancePlan})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Domicilio / Teléfono</span>
                      <span className="text-slate-700">
                        {patient?.patientAddress ? `${patient.patientAddress} · ` : ''}{patient?.patientPhone || '-'}
                      </span>
                    </div>
                  </div>

                  {patient && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-semibold">Cirujano Principal</span>
                        <span className="font-bold text-slate-900">{patient.surgeonName}</span>
                        <span className="text-[10px] text-slate-600 block">{patient.surgeonRegistration || 'MP 440703'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-semibold">Ayudante / Equipo</span>
                        <span className="text-slate-800">{patient.assistantName || 'Dr. Angelo Delpiano'}</span>
                        {patient.secondAssistantName && <span className="text-[10px] text-slate-600 block">{patient.secondAssistantName}</span>}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-semibold">Anestesiólogo / Quirófano</span>
                        <span className="text-slate-800">{patient.anesthesiologist || '-'}</span>
                        <span className="text-[10px] text-slate-600 block">{patient.operatingRoom || 'Quirófano'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Document Content Sections */}
                <div className="space-y-6 text-sm text-slate-800 leading-relaxed">
                  {patient?.preoperativeDiagnosis && (
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-3 text-xs font-sans">
                      <span className="font-bold text-amber-900 block mb-1">Diagnóstico Preoperatorio:</span>
                      <p className="text-amber-950 font-medium">{patient.preoperativeDiagnosis}</p>
                      {patient.operativeDiagnosis && (
                        <div className="mt-2 pt-2 border-t border-amber-200/60">
                          <span className="font-bold text-amber-900 block mb-0.5">Diagnóstico Operatorio / Postoperatorio:</span>
                          <p className="text-amber-950 font-medium">{patient.operativeDiagnosis}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 mb-1 border-b border-slate-300 pb-1">
                      Indicación & Resumen del Documento
                    </h5>
                    <p className="text-slate-700 whitespace-pre-line text-xs sm:text-sm">
                      {doc.description}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 mb-1 border-b border-slate-300 pb-1">
                      Resumen de Hallazgos y Protocolo
                    </h5>
                    <p className="text-slate-700 whitespace-pre-line text-xs sm:text-sm leading-relaxed">
                      {doc.summaryText}
                    </p>
                  </div>

                  {doc.technicalDescription && (
                    <div>
                      <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 mb-1 border-b border-slate-300 pb-1">
                        Descripción Técnica de la Operación (Protocolo Quirúrgico)
                      </h5>
                      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                        {doc.technicalDescription}
                      </div>
                    </div>
                  )}

                  {patient?.materials && patient.materials.length > 0 && (
                    <div>
                      <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 mb-1 border-b border-slate-300 pb-1">
                        Material Protésico & Implantes Quirúrgicos Utilizados
                      </h5>
                      <ul className="list-disc pl-5 space-y-1 text-xs font-sans">
                        {patient.materials.map(m => (
                          <li key={m.id}>
                            <span className="font-semibold">{m.description}</span> — Cantidad: {m.quantity} · Estado: {m.status} ({m.supplier})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {patient?.estimatedSettlementMonth && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs font-sans">
                      <span className="font-bold text-purple-900 block mb-0.5">Liquidación y Honorarios Quirúrgicos:</span>
                      <p className="text-purple-950">
                        Próxima liquidación estimada: <strong className="capitalize">{patient.estimatedSettlementMonth}</strong>.
                        {patient.estimatedSettlementAmount ? ` Presupuesto / Estimado: $ ${patient.estimatedSettlementAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : ''}
                      </p>
                    </div>
                  )}
                </div>

                {/* Signature & Stamp Section */}
                <div className="mt-12 pt-6 border-t-2 border-slate-800 flex justify-between items-end font-sans">
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <p>Documento médico con valor de protocolo legal y asistencial.</p>
                    <p>Emisión digital certificada en sistema de gestión quirúrgica.</p>
                  </div>

                  <div className="text-center min-w-[220px]">
                    <div className="border-b border-dashed border-slate-900 pb-1 mb-1">
                      <div className="font-serif italic text-base text-slate-900 font-bold">
                        {doc.signee}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {doc.signee}
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono">
                      {doc.registrationNumber}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Médico Cirujano
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/90 text-xs text-slate-400 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Documento oficial verificado disponible para descarga o impresión directa.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
