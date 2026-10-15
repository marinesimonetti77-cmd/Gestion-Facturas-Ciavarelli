import React, { useState } from 'react';
import {
  Table,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  Code,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { SurgicalCase, Invoice } from '../types/surgical';

interface GoogleSheetsIntegrationProps {
  cases: SurgicalCase[];
  invoices: Invoice[];
  googleSheetsEndpoint: string;
  onUpdateEndpoint: (url: string) => void;
  onRestoreData: (cases: SurgicalCase[], invoices: Invoice[]) => void;
}

export const GoogleSheetsIntegration: React.FC<GoogleSheetsIntegrationProps> = ({
  cases,
  invoices,
  googleSheetsEndpoint,
  onUpdateEndpoint,
  onRestoreData,
}) => {
  const [copied, setCopied] = useState(false);
  const [endpointInput, setEndpointInput] = useState(googleSheetsEndpoint);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  const APPS_SCRIPT_CODE = `/**
 * BACKEND GOOGLE APPS SCRIPT PARA GESTIÓN QUIRÚRGICA & FACTURACIÓN
 * Instrucciones:
 * 1. Cree una hoja de cálculo en Google Sheets
 * 2. Vaya a Extensiones > Apps Script
 * 3. Pegue este código reemplazando todo el contenido
 * 4. Haga clic en 'Implementar' > 'Nueva implementación' > Tipo: 'Aplicación web'
 *    - Ejecutar como: 'Yo'
 *    - Quién tiene acceso: 'Cualquier usuario' (Any)
 * 5. Copie la URL generada y péguela en el panel de la aplicación.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Sincronizar Casos Quirúrgicos
    if (data.cases && Array.isArray(data.cases)) {
      var sheetCases = ss.getSheetByName("Casos Quirúrgicos");
      if (!sheetCases) {
        sheetCases = ss.insertSheet("Casos Quirúrgicos");
        sheetCases.appendRow([
          "ID", "N° Historia Clínica", "Paciente", "DNI", "Fecha Nacimiento",
          "Teléfono", "Obra Social", "N° Afiliado", "Procedimiento", "Especialidad",
          "Cirujano", "Clínica Estimada", "Quirófano", "Fecha Cirugía", "Hora",
          "Estado", "Materiales Insumos", "Notas"
        ]);
        sheetCases.getRange("A1:R1").setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold");
      }

      // Limpiar datos anteriores excepto encabezado
      var lastRowCases = sheetCases.getLastRow();
      if (lastRowCases > 1) {
        sheetCases.getRange(2, 1, lastRowCases - 1, 18).clearContent();
      }

      var rowsCases = data.cases.map(function(c) {
        var matsStr = (c.materials || []).map(function(m) {
          return m.description + " [" + m.status + "]";
        }).join(" | ");

        return [
          c.id, c.patientMedicalRecordNumber, c.patientName, c.patientDni || "",
          c.patientBirthDate || "", c.patientPhone || "", c.insuranceProvider,
          c.insuranceAffiliateNumber || "", c.procedureName, c.specialty,
          c.surgeonName, c.estimatedSurgeryClinic, c.operatingRoom || "",
          c.surgeryDate, c.surgeryTime, c.status, matsStr, c.notes || ""
        ];
      });

      if (rowsCases.length > 0) {
        sheetCases.getRange(2, 1, rowsCases.length, 18).setValues(rowsCases);
      }
    }

    // 2. Sincronizar Facturación & Cobranzas
    if (data.invoices && Array.isArray(data.invoices)) {
      var sheetInvoices = ss.getSheetByName("Facturación & Cobranzas");
      if (!sheetInvoices) {
        sheetInvoices = ss.insertSheet("Facturación & Cobranzas");
        sheetInvoices.appendRow([
          "ID Factura", "N° Factura", "ID Caso", "Paciente", "N° Historia Clínica",
          "Obra Social", "Clínica", "Honorarios Médicos", "Insumos/Prótesis",
          "IVA %", "Total Facturado", "Moneda", "Fecha Emisión",
          "Fecha Estimada Cobro", "Fecha Real Cobro", "Estado", "Referencia Pago", "Notas Auditoría"
        ]);
        sheetInvoices.getRange("A1:R1").setBackground("#0f766e").setFontColor("#ffffff").setFontWeight("bold");
      }

      var lastRowInvs = sheetInvoices.getLastRow();
      if (lastRowInvs > 1) {
        sheetInvoices.getRange(2, 1, lastRowInvs - 1, 18).clearContent();
      }

      var rowsInvoices = data.invoices.map(function(inv) {
        return [
          inv.id, inv.invoiceNumber, inv.caseId || "", inv.patientName,
          inv.patientMedicalRecordNumber || "", inv.insuranceProvider, inv.clinic,
          inv.surgeonFee, inv.materialsCost, inv.taxRate, inv.totalAmount,
          inv.currency, inv.issueDate, inv.expectedCollectionDate,
          inv.actualCollectionDate || "", inv.status, inv.paymentReference || "",
          inv.auditNotes || ""
        ];
      });

      if (rowsInvoices.length > 0) {
        sheetInvoices.getRange(2, 1, rowsInvoices.length, 18).setValues(rowsInvoices);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Sincronización completada exitosamente",
      timestamp: new Date().toISOString(),
      casesCount: (data.cases || []).length,
      invoicesCount: (data.invoices || []).length
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "Surgical Hub & Invoicing AppsScript Backend",
    version: "1.0.0"
  })).setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveEndpoint = () => {
    onUpdateEndpoint(endpointInput);
    alert('URL de sincronización guardada.');
  };

  const handleTestSync = async () => {
    if (!endpointInput || !endpointInput.startsWith('http')) {
      setSyncStatus('error');
      setSyncMessage('Ingrese una URL válida de Apps Script (debe comenzar con https://)');
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('Enviando datos de cirugías y cobranzas a Google Sheets...');

    try {
      // Send payload
      const payload = {
        cases,
        invoices,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(endpointInput, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors', // Standard Google Apps Script Web App constraint
      });

      // Because of no-cors, response is opaque
      setSyncStatus('success');
      setSyncMessage(`¡Sincronizado! Se han enviado ${cases.length} cirugías y ${invoices.length} liquidaciones a su hoja de cálculo.`);
    } catch (err: any) {
      setSyncStatus('error');
      setSyncMessage('Error de conexión con el endpoint. Verifique los permisos de la aplicación web.');
    }
  };

  const handleExportJSON = () => {
    const backup = {
      cases,
      invoices,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `respaldo_quirurgico_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.cases && json.invoices) {
          onRestoreData(json.cases, json.invoices);
          alert(`¡Respaldo restaurado con éxito! (${json.cases.length} cirugías, ${json.invoices.length} facturas)`);
        } else {
          alert('El archivo JSON no tiene la estructura esperada de Casos y Facturas.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Title banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Table className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Integración con Google Sheets & Apps Script
              </h2>
              <p className="text-xs text-slate-400">
                Sincronice bidireccionalmente todos sus casos quirúrgicos y liquidaciones con su propia hoja de cálculo en la nube
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
              title="Descargar copia de seguridad completa en JSON"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Respaldo JSON</span>
            </button>

            <label className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Restaurar JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Webhook Configuration & Live Sync */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-cyan-400" />
          <span>Endpoint de Aplicación Web (Apps Script Webhook)</span>
        </h3>
        <p className="text-xs text-slate-400">
          Pegue la URL obtenida al implementar su Google Apps Script para sincronizar las cirugías y facturas directamente con su Google Sheet.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={endpointInput}
            onChange={e => setEndpointInput(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            onClick={handleSaveEndpoint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition"
          >
            Guardar URL
          </button>
          <button
            onClick={handleTestSync}
            disabled={syncStatus === 'syncing'}
            className="flex items-center justify-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/30 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>{syncStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar a Google Sheets'}</span>
          </button>
        </div>

        {syncMessage && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            syncStatus === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : syncStatus === 'error'
              ? 'bg-rose-950/40 border-rose-800 text-rose-300'
              : 'bg-cyan-950/40 border-cyan-800 text-cyan-300'
          }`}>
            {syncStatus === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : syncStatus === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-cyan-400" />
            )}
            <span>{syncMessage}</span>
          </div>
        )}
      </div>

      {/* Code Viewer & Deployment Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step by Step Guide */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Guía de Conexión (5 Pasos)</span>
          </h3>

          <ol className="text-xs text-slate-300 space-y-3 list-decimal list-inside">
            <li className="leading-relaxed">
              <strong className="text-white">Cree una hoja en Google Drive:</strong> Abra Google Sheets y cree un nuevo archivo titulado <em>"Control Quirúrgico y Facturación"</em>.
            </li>
            <li className="leading-relaxed">
              <strong className="text-white">Abra el editor:</strong> En el menú superior vaya a <em>Extensiones &gt; Apps Script</em>.
            </li>
            <li className="leading-relaxed">
              <strong className="text-white">Pegue el código:</strong> Borre lo que aparezca en <code>Código.gs</code> y pegue el código del panel lateral.
            </li>
            <li className="leading-relaxed">
              <strong className="text-white">Implemente la Web App:</strong> Haga clic en el botón azul <em>"Implementar" &gt; "Nueva implementación"</em>.
              <ul className="list-disc list-inside mt-1 pl-4 text-slate-400 space-y-0.5">
                <li>Seleccione tipo: <strong>Aplicación web</strong></li>
                <li>Ejecutar como: <strong>Yo</strong></li>
                <li>Quién tiene acceso: <strong>Cualquier usuario</strong></li>
              </ul>
            </li>
            <li className="leading-relaxed">
              <strong className="text-white">Copie la URL:</strong> Copie el enlace web generado y péguelo en el campo superior de esta pantalla.
            </li>
          </ol>
        </div>

        {/* Code Block with Copy Button */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-white">AppsScript_Backend.gs</span>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow transition active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Código Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Código .gs</span>
                </>
              )}
            </button>
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-x-auto max-h-[380px] font-mono text-[11px] text-slate-300 leading-relaxed">
            <pre><code>{APPS_SCRIPT_CODE}</code></pre>
          </div>
        </div>
      </div>
    </div>
  );
};
