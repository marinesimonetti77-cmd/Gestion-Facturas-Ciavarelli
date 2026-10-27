import React, { useState, useRef } from 'react';
import {
  FileSignature,
  Download,
  Printer,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  Search,
  User,
  Calendar,
  ShieldCheck,
  Clock,
  RotateCcw,
  CheckCircle2,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { MedicalCertificate, CertificateType, SurgicalCase } from '../types/surgical';

interface CertificatesViewProps {
  certificates: MedicalCertificate[];
  cases: SurgicalCase[];
  insurances: string[];
  onAddCertificate: (cert: Omit<MedicalCertificate, 'id' | 'createdAt' | 'updatedAt'>) => MedicalCertificate;
  onUpdateCertificate: (id: string, updates: Partial<MedicalCertificate>) => void;
  onDeleteCertificate: (id: string) => void;
  showToast?: (msg: string) => void;
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({
  certificates,
  cases,
  insurances,
  onAddCertificate,
  onUpdateCertificate,
  onDeleteCertificate,
  showToast,
}) => {
  const [selectedCertId, setSelectedCertId] = useState<string>(certificates[0]?.id || '');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // AI Prompt Assistant state
  const [isAiBoxOpen, setIsAiBoxOpen] = useState<boolean>(false);
  const [aiPromptInput, setAiPromptInput] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Form State for create/edit
  const initialFormState: Omit<MedicalCertificate, 'id' | 'createdAt' | 'updatedAt'> = {
    certificateNumber: `CEMET-2026-${String(certificates.length + 1).padStart(3, '0')}`,
    type: 'REPOSO_LABORAL',
    issueDate: new Date().toISOString().split('T')[0],
    validFromDate: new Date().toISOString().split('T')[0],
    patientName: '',
    patientDni: '',
    patientBirthDate: '',
    patientAge: '',
    patientGender: '',
    insuranceProvider: '',
    insuranceAffiliateNumber: '',
    diagnosis: '',
    rpText: '',
    indicationsText: '',
    doctorName: 'Dr. Miguel Angel Ciavarelli',
    doctorSpecialty: 'Cirugía Hepatobilio Pancreática',
    provincialLicense: '440703',
    nationalLicense: '70212',
    institution: 'CEMET - Centro de Metástasis Hepáticas',
    includeSignature: true,
    notes: '',
  };

  const [formData, setFormData] = useState<Omit<MedicalCertificate, 'id' | 'createdAt' | 'updatedAt'>>(initialFormState);

  // Ref to the printable certificate sheet
  const printSheetRef = useRef<HTMLDivElement>(null);

  const activeCert = certificates.find(c => c.id === selectedCertId) || certificates[0];

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch =
      cert.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.patientDni.includes(searchQuery) ||
      (cert.diagnosis && cert.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cert.certificateNumber && cert.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'ALL' || cert.type === filterType;
    return matchesSearch && matchesType;
  });

  // Handle selecting a case to prefill patient info
  const handleSelectCaseToPrefill = (caseId: string) => {
    const selectedCase = cases.find(c => c.id === caseId);
    if (!selectedCase) return;

    setFormData(prev => ({
      ...prev,
      patientName: selectedCase.patientName,
      patientDni: selectedCase.patientDni || '',
      patientBirthDate: selectedCase.patientBirthDate || '',
      insuranceProvider: selectedCase.insuranceProvider || prev.insuranceProvider,
      insuranceAffiliateNumber: selectedCase.insuranceAffiliateNumber || '',
      diagnosis: selectedCase.operativeDiagnosis || selectedCase.preoperativeDiagnosis || selectedCase.procedureName || '',
    }));
  };

  // Quick Clinical Templates
  const handleApplyTemplate = (templateType: 'REPOSO' | 'RECETA' | 'ALTA' | 'INDICACION' | 'APTO' | 'ROJAS_ASISTENCIA') => {
    const pName = formData.patientName || 'El paciente';
    const diag = formData.diagnosis || 'Post-operatorio de Cirugía Abdominal / Hepatobiliopancreática';

    switch (templateType) {
      case 'REPOSO':
        setFormData(prev => ({
          ...prev,
          type: 'REPOSO_LABORAL',
          diagnosis: prev.diagnosis || 'Post-operatorio de Colecistectomía Laparoscópica',
          rpText: `1. Ketorolac 10 mg comp.
   Tomar 1 comp. cada 8 horas si presenta dolor (máx. 5 días).

2. Paracetamol 1 g comp.
   Tomar 1 comp. cada 8 horas en caso de dolor leve o molestia.

3. Omeprazol 20 mg cápsulas
   Tomar 1 cápsula en ayunas por 14 días.

Certifico que ${pName} debe guardar REPOSO LABORAL Y FÍSICO por el término de 10 (diez) días a partir de la fecha.`,
          indicationsText: `• Reposo físico relativo en domicilio (no realizar esfuerzos ni levantar peso).
• Dieta hepatoprotectora baja en grasas y frituras. Abundante hidratación.
• Curación plana diaria de heridas quirúrgicas con gasa estéril y antiséptico.
• Retiro de puntos de sutura en 7 a 10 días en consultorio CEMET.
• Pautas de alarma: fiebre >38°C, dolor abdominal que no ceda, vómitos reiterados o ictericia.`,
        }));
        break;

      case 'ROJAS_ASISTENCIA':
        setFormData(prev => ({
          ...prev,
          type: 'REPOSO_LABORAL',
          doctorSpecialty: 'Cirugía Gral',
          licenseType: 'NACIONAL',
          rpText: `El portador de la presente fue asistido en el día de la fecha , debiendo continuar con reposo , tratamiento y estudios por un lapso de 15 días.`,
          indicationsText: `El portador de la presente fue asistido en el día de la fecha , debiendo continuar con reposo , tratamiento y estudios por un lapso de 15 días.`,
        }));
        break;

      case 'RECETA':
        setFormData(prev => ({
          ...prev,
          type: 'RECETA_FARMACOLOGICA',
          rpText: `1. Cefalexina 500 mg comp.
   Tomar 1 comprimido cada 6 horas por 7 días.

2. Ibuprofeno 600 mg comp.
   Tomar 1 comprimido cada 8 horas con las comidas por 5 días.

3. Pantoprazol 40 mg comp.
   Tomar 1 comprimido en ayunas.`,
          indicationsText: `• Cumplir el esquema antibiótico completo sin interrupciones.
• Tomar la medicación con abundante agua.
• Control evolutivo en consultorio al finalizar el tratamiento.`,
        }));
        break;

      case 'ALTA':
        setFormData(prev => ({
          ...prev,
          type: 'ALTA_MEDICA',
          rpText: `Certifico que ${pName} se encuentra en condiciones de ALTA MÉDICA QUIRÚRGICA por la intervención efectuada, encontrándose con heridas cicatrizadas y adecuada tolerancia digestiva.
Se autoriza la reincorporación a sus tareas habituales sin esfuerzos físicos extenuantes.`,
          indicationsText: `• Reincorporación progresiva a las actividades de la vida diaria.
• Actividad física de alto impacto restringida por 30 días más.
• Control anual de seguimiento con ecografía hepatobiliopancreática.`,
        }));
        break;

      case 'INDICACION':
        setFormData(prev => ({
          ...prev,
          type: 'INDICACION_QUIRURGICA',
          rpText: `Se solicita autorización de procedimiento quirúrgico:
COLECISTECTOMÍA LAPAROSCÓPICA + EVENTUAL COLANGIOGRAFÍA INTRAOPERATORIA.
Diagnóstico: Litiasis vesicular sintomática (K80.2).
Sanatorio: CEMET / Corporación Médica.`,
          indicationsText: `• Presentar orden autorizada en secretaría CEMET con 72 hs de anticipación.
• Ayuno estricto de sólidos y líquidos de 8 horas previas al procedimiento.
• Concurrir con estudios pre-quirúrgicos completos (ECG, laboratorio con coagulograma, ecografía).`,
        }));
        break;

      case 'APTO':
        setFormData(prev => ({
          ...prev,
          type: 'APTITUD_QUIRURGICA',
          rpText: `Certifico que el paciente ${pName} ha completado la evaluación clínica preoperatoria correspondiente, encontrándose APTO para someterse a procedimiento quirúrgico programado bajo anestesia general.`,
          indicationsText: `• Mantener medicación habitual según indicación médica hasta la víspera de la cirugía.
• Presentar consentimiento informado firmado al momento del ingreso sanatorial.`,
        }));
        break;
    }
  };

  // AI Prompt Parsing: "simplemente pasartelos a vos y me lo armes"
  const handleProcessAiPrompt = () => {
    if (!aiPromptInput.trim()) return;

    setIsAiThinking(true);

    setTimeout(() => {
      const text = aiPromptInput;
      const lower = text.toLowerCase();

      // Extract Patient Name
      let patient = '';
      const nameMatch = text.match(/(?:paciente|para|a nombre de|sr|sra|don|doña)[:\s]+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+?)(?:,|\.|\bcon\b|\bdni\b|\bde\b|\bosde\b|\bswiss\b|$)/i);
      if (nameMatch && nameMatch[1]) {
        patient = nameMatch[1].trim();
      }

      // Extract DNI
      let dni = '';
      const dniMatch = text.match(/(?:dni|documento|doc|nro)[:\s]*([0-9\.\-]+)/i);
      if (dniMatch && dniMatch[1]) {
        dni = dniMatch[1].trim();
      }

      // Extract Insurance
      let insurance = '';
      if (lower.includes('hominis')) insurance = 'Hominis Vita +';
      else if (lower.includes('swiss') || lower.includes('medical')) insurance = 'Swiss Medical';
      else if (lower.includes('galeno')) insurance = 'Galeno';
      else if (lower.includes('medife') || lower.includes('medifé')) insurance = 'Medifé';
      else if (lower.includes('pami')) insurance = 'PAMI';
      else if (lower.includes('ioma')) insurance = 'IOMA';
      else if (lower.includes('osde')) insurance = 'OSDE';
      else if (lower.includes('particular')) insurance = 'Particular';

      // Extract Affiliate
      let affiliate = '';
      const affMatch = text.match(/(?:afiliado|credencial|socio|n°|nro)[:\s]*([0-9\.\-\/]+)/i);
      if (affMatch && affMatch[1]) {
        affiliate = affMatch[1].trim();
      }

      // Extract Days of Rest
      let restDays = '15';
      const daysMatch = text.match(/([0-9]+)\s*(?:días|dias)/i);
      if (daysMatch && daysMatch[1]) {
        restDays = daysMatch[1];
      }

      // Extract Diagnosis
      let diag = '';
      if (lower.includes('vesicula') || lower.includes('colecist') || lower.includes('vesícula')) {
        diag = 'Colecistectomía Laparoscópica (Litiasis Vesicular)';
      } else if (lower.includes('hernia') || lower.includes('hernioplastia')) {
        diag = 'Hernioplastia inguinal con prótesis';
      } else if (lower.includes('higado') || lower.includes('hepát') || lower.includes('hepat')) {
        diag = 'Procedimiento Hepatobiliar / Resección hepática';
      } else if (lower.includes('pancreas') || lower.includes('pancr')) {
        diag = 'Procedimiento Pancreático';
      } else if (lower.includes('asistid') || lower.includes('atencion')) {
        diag = 'Asistencia médica en consultorio - Reposo y tratamiento';
      } else {
        diag = 'Post-operatorio mediato de Cirugía General & Digestiva';
      }

      // Determine Certificate Type
      let docType: CertificateType = 'REPOSO_LABORAL';
      if (lower.includes('receta') && !lower.includes('reposo')) docType = 'RECETA_FARMACOLOGICA';
      if (lower.includes('apto') || lower.includes('aptitud')) docType = 'APTITUD_QUIRURGICA';
      if (lower.includes('alta')) docType = 'ALTA_MEDICA';
      if (lower.includes('indicacion') || lower.includes('orden')) docType = 'INDICACION_QUIRURGICA';

      // Formulate Medical Rp Text
      const nameDisplay = patient || 'El paciente';
      let rp = '';
      let indications = '';
      let docSpecialty = 'Cirugía Gral';
      let docLicenseType: 'PROVINCIAL' | 'NACIONAL' = 'NACIONAL';

      if (lower.includes('asistid') || lower.includes('hominis') || lower.includes('alex') || (!lower.includes('colecist') && !lower.includes('hernia') && !lower.includes('hepát'))) {
        rp = `El portador de la presente fue asistido en el día de la fecha , debiendo continuar con reposo , tratamiento y estudios por un lapso de ${restDays} días.`;
        indications = `El portador de la presente fue asistido en el día de la fecha , debiendo continuar con reposo , tratamiento y estudios por un lapso de ${restDays} días.`;
        docSpecialty = 'Cirugía Gral';
        docLicenseType = 'NACIONAL';
      } else {
        rp = `1. Ketorolac 10 mg comp.
   Tomar 1 comp. cada 8 horas si presenta dolor (máximo 5 días).

2. Paracetamol 1 g comp.
   Tomar 1 comp. cada 8 horas como analgésico de rescate.

3. Omeprazol 20 mg cápsulas
   Tomar 1 cápsula en ayunas por 14 días.

Certifico que ${nameDisplay} se encuentra cursando postoperatorio de ${diag}, requiriendo REPOSO LABORAL Y FÍSICO por el término de ${restDays} (${restDays === '10' ? 'diez' : restDays === '7' ? 'siete' : restDays === '14' ? 'catorce' : restDays}) días a partir de la fecha.`;

        indications = `• Reposo domiciliario sin esfuerzo físico ni levantamiento de peso (>5 kg).
• Dieta blanda hepatoprotectora, fraccionada, baja en grasas y lácteos enteros.
• Curación plana diaria de incisiones con gasa estéril y antiséptico.
• Retiro de puntos y control post-quirúrgico el día asignado en consultorio CEMET.
• Pautas de alarma de consulta urgente: fiebre mayor a 38°C, dolor persistente, náuseas o vómitos incoercibles.`;
        docSpecialty = 'Cirugía Hepatobilio Pancreática';
        docLicenseType = 'PROVINCIAL';
      }

      setFormData(prev => ({
        ...prev,
        patientName: patient || prev.patientName,
        patientDni: dni || prev.patientDni,
        insuranceProvider: insurance,
        insuranceAffiliateNumber: affiliate || prev.insuranceAffiliateNumber,
        diagnosis: diag,
        type: docType,
        rpText: rp,
        indicationsText: indications,
        doctorSpecialty: docSpecialty,
        licenseType: docLicenseType,
      }));

      setIsEditing(true);
      setIsAiThinking(false);
      setIsAiBoxOpen(false);
      if (showToast) showToast('¡Plantilla armada con IA con éxito! Revisa los datos y descárgala en PDF.');
    }, 700);
  };

  // Start new empty certificate
  const handleStartNew = () => {
    setFormData({
      ...initialFormState,
      certificateNumber: `CEMET-2026-${String(certificates.length + 1).padStart(3, '0')}`,
      issueDate: new Date().toISOString().split('T')[0],
      validFromDate: new Date().toISOString().split('T')[0],
    });
    setIsEditing(true);
  };

  // Start editing existing certificate
  const handleStartEdit = (cert: MedicalCertificate) => {
    setFormData({
      certificateNumber: cert.certificateNumber || '',
      type: cert.type,
      issueDate: cert.issueDate,
      validFromDate: cert.validFromDate,
      patientName: cert.patientName,
      patientDni: cert.patientDni,
      patientBirthDate: cert.patientBirthDate || '',
      patientAge: cert.patientAge || '',
      patientGender: cert.patientGender || '',
      insuranceProvider: cert.insuranceProvider,
      insuranceAffiliateNumber: cert.insuranceAffiliateNumber,
      diagnosis: cert.diagnosis,
      rpText: cert.rpText,
      indicationsText: cert.indicationsText,
      doctorName: cert.doctorName,
      doctorSpecialty: cert.doctorSpecialty,
      provincialLicense: cert.provincialLicense,
      nationalLicense: cert.nationalLicense,
      licenseType: cert.licenseType || (cert.doctorSpecialty === 'Cirugía Gral' ? 'NACIONAL' : 'PROVINCIAL'),
      institution: cert.institution,
      includeSignature: cert.includeSignature,
      notes: cert.notes || '',
    });
    setSelectedCertId(cert.id);
    setIsEditing(true);
  };

  // Save certificate
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName.trim()) {
      alert('Por favor ingrese el nombre del paciente');
      return;
    }

    if (activeCert && isEditing && selectedCertId) {
      onUpdateCertificate(selectedCertId, formData);
      if (showToast) showToast('Certificado actualizado correctamente.');
    } else {
      const created = onAddCertificate(formData);
      setSelectedCertId(created.id);
      if (showToast) showToast('Nuevo certificado creado y guardado.');
    }
    setIsEditing(false);
  };

  // Direct PDF Download using toPng (html-to-image) & jsPDF in A4 Landscape
  const handleDownloadPdf = async () => {
    if (!printSheetRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const sheet = printSheetRef.current;
      const dataUrl = await toPng(sheet, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
      });

      // A4 Landscape is 297mm x 210mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      const targetPatient = (isEditing ? formData.patientName : activeCert?.patientName) || 'Paciente';
      const targetDate = (isEditing ? formData.issueDate : activeCert?.issueDate) || 'fecha';
      const cleanPatient = targetPatient.replace(/\s+/g, '_');
      const filename = `Receta_CEMET_${cleanPatient}_${targetDate}.pdf`;

      pdf.save(filename);
      if (showToast) showToast(`PDF generado y descargado: ${filename}`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Fallback to native print dialog
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Print using Browser Print Dialog
  const handlePrint = () => {
    window.print();
  };

  // Copy full certificate text to clipboard for WhatsApp
  const handleCopyText = () => {
    const cert = isEditing ? formData : activeCert;
    if (!cert) return;

    const fullText = `*DR. MIGUEL ÁNGEL CIAVARELLI*
Cirugía Hepatobilio Pancreática (MN 70212 | MP 440703)
CEMET - Centro de Metástasis Hepáticas
------------------------------------------------
*Paciente:* ${cert.patientName}
*DNI:* ${cert.patientDni} | *Obra Social:* ${cert.insuranceProvider} (N° ${cert.insuranceAffiliateNumber})
*Fecha:* ${cert.issueDate}
*Diagnóstico:* ${cert.diagnosis}

*Rp./ Prescripción:*
${cert.rpText}

*Indicaciones Médicas:*
${cert.indicationsText}
------------------------------------------------
Válido para presentación ante obra social, sanatorio o ámbito laboral.`;

    navigator.clipboard.writeText(fullText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
    if (showToast) showToast('Texto del certificado copiado al portapapeles para WhatsApp o Email.');
  };

  const currentDisplayCert = isEditing ? formData : activeCert;

  return (
    <div className="space-y-6">
      {/* HEADER SECTION: Title & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl text-white shadow-md shadow-cyan-500/20">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Certificados & Recetario Oficial CEMET</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono">
                  Dr. Ciavarelli
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Plantilla editable de doble talón (Rp./ e Indicaciones). Carga manual, asistencia IA y descarga inmediata en PDF.
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AI Free-text Assistant Button */}
          <button
            onClick={() => setIsAiBoxOpen(!isAiBoxOpen)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition cursor-pointer"
            title="Pásame los datos en texto libre o mensaje de WhatsApp y te armo el certificado automáticamente"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
            <span>Armar con Asistente IA</span>
          </button>

          {/* New Certificate Button */}
          <button
            onClick={handleStartNew}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Certificado</span>
          </button>
        </div>
      </div>

      {/* AI ASSISTANT BOX (Expandable) */}
      {isAiBoxOpen && (
        <div className="bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 border-2 border-purple-500/40 rounded-2xl p-5 shadow-xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Carga Asistida con Inteligencia Clínica: Pásame los datos en texto libre</span>
            </div>
            <button
              onClick={() => setIsAiBoxOpen(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5"
            >
              Cerrar ✕
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Escribe o pega aquí lo que te pidió el paciente o el doctor (incluso desordenado o copiado de un chat de WhatsApp).
            El asistente identificará al paciente, DNI, obra social, redactará el <b>Rp./</b> y las <b>Indicaciones</b> correspondientes.
          </p>

          <div className="space-y-2">
            <textarea
              value={aiPromptInput}
              onChange={e => setAiPromptInput(e.target.value)}
              placeholder="Ejemplo: 'Hacer reposo laboral de 10 días para Facundo Fernandez DNI 34.892.410 de OSDE por colecistectomía laparoscópica realizada hoy. Indicar ketorolac cada 8 horas, paracetamol y retiro de puntos en una semana en CEMET.'"
              className="w-full bg-slate-950 border border-purple-500/30 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500 h-24 resize-none font-sans"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                💡 Consejo: Si solo escribes el nombre y los días de reposo, el asistente formulará el esquema analgésico estándar.
              </span>
              <button
                onClick={handleProcessAiPrompt}
                disabled={isAiThinking || !aiPromptInput.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-md cursor-pointer"
              >
                {isAiThinking ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Armando plantilla...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Armar Certificado Ahora</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE: LEFT LIST & EDITOR / RIGHT OFFICIAL TEMPLATE PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: HISTORIAL / LIST & EDIT FORM (4 Cols on LG) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Certificate Selector / Historial */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Historial de Certificados ({certificates.length})</span>
              </h3>
              {isEditing && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                >
                  Ver Vista Previa
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por paciente, DNI o N°..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            {/* Certificate List */}
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {filteredCertificates.map(cert => {
                const isSelected = cert.id === selectedCertId && !isEditing;
                return (
                  <div
                    key={cert.id}
                    onClick={() => {
                      setSelectedCertId(cert.id);
                      setIsEditing(false);
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-xs ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-[13px] truncate max-w-[160px]">
                        {cert.patientName}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/40">
                        {cert.certificateNumber || cert.issueDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{cert.insuranceProvider} · DNI {cert.patientDni || 'S/D'}</span>
                      <span className="text-[10px] text-slate-500">{cert.issueDate}</span>
                    </div>

                    <div className="mt-1 text-[10px] text-slate-400 truncate">
                      {cert.type === 'REPOSO_LABORAL' ? '🩺 Reposo Laboral' : cert.type === 'RECETA_FARMACOLOGICA' ? '💊 Receta' : '📋 Certificado Médico'} · {cert.diagnosis || 'Consulta'}
                    </div>

                    {/* Actions on Item */}
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleStartEdit(cert);
                        }}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 p-1 hover:bg-slate-800 rounded"
                        title="Modificar datos del certificado"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm(`¿Eliminar certificado de ${cert.patientName}?`)) {
                            onDeleteCertificate(cert.id);
                            if (showToast) showToast('Certificado eliminado.');
                          }
                        }}
                        className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 p-1 hover:bg-rose-500/10 rounded"
                        title="Eliminar del historial"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredCertificates.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-500">
                  No se encontraron certificados coincidentes.
                </div>
              )}
            </div>
          </div>

          {/* EDIT FORM (Visible when editing or creating) */}
          {isEditing && (
            <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-4 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4" />
                  <span>Editor de Datos del Certificado</span>
                </h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕ Cancelar
                </button>
              </div>

              {/* Quick Patient Selector from existing Surgical Cases */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span>Autocompletar desde Paciente Registrado:</span>
                  <span className="text-[10px] text-cyan-400">1 Clic</span>
                </label>
                <select
                  onChange={e => handleSelectCaseToPrefill(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                  defaultValue=""
                >
                  <option value="" disabled>Seleccione un paciente de la lista de cirugías...</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.patientName} — {c.insuranceProvider} ({c.procedureName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Template Buttons */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Plantillas Rápidas Pre-redactadas:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('ROJAS_ASISTENCIA')}
                    className="col-span-2 p-1.5 text-left bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-200 border border-cyan-500/40 rounded-md text-[10px] font-semibold transition cursor-pointer flex items-center justify-between"
                  >
                    <span>📋 Modelo Asistencia y Reposo 15d (Alex Rojas)</span>
                    <span className="text-[9px] bg-cyan-800/60 px-1.5 py-0.5 rounded text-cyan-100 font-mono">MN 70212</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('REPOSO')}
                    className="p-1.5 text-left bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 rounded-md text-[10px] font-medium transition cursor-pointer"
                  >
                    🩺 Reposo 10 días
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('RECETA')}
                    className="p-1.5 text-left bg-slate-800 hover:bg-slate-750 text-purple-300 border border-slate-700 rounded-md text-[10px] font-medium transition cursor-pointer"
                  >
                    💊 Receta Analgesia
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('ALTA')}
                    className="p-1.5 text-left bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-slate-700 rounded-md text-[10px] font-medium transition cursor-pointer"
                  >
                    ✓ Alta Quirúrgica
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('INDICACION')}
                    className="p-1.5 text-left bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-700 rounded-md text-[10px] font-medium transition cursor-pointer"
                  >
                    📑 Orden Quirúrgica
                  </button>
                </div>
              </div>

              {/* FORM FIELDS */}
              <form onSubmit={handleSave} className="space-y-3 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Fecha de Emisión</label>
                    <input
                      type="date"
                      value={formData.issueDate}
                      onChange={e => setFormData({ ...formData, issueDate: e.target.value, validFromDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">N° Certificado / Folio</label>
                    <input
                      type="text"
                      value={formData.certificateNumber || ''}
                      onChange={e => setFormData({ ...formData, certificateNumber: e.target.value })}
                      placeholder="CEMET-2026-091"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Nombre Completo del Paciente *</label>
                  <input
                    type="text"
                    value={formData.patientName}
                    onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                    placeholder="Ej: Fernandez Facundo"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">DNI</label>
                    <input
                      type="text"
                      value={formData.patientDni}
                      onChange={e => setFormData({ ...formData, patientDni: e.target.value })}
                      placeholder="34.892.410"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">F. Nac. / Edad</label>
                    <input
                      type="text"
                      value={formData.patientAge || ''}
                      onChange={e => setFormData({ ...formData, patientAge: e.target.value })}
                      placeholder="37 años"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Sexo</label>
                    <select
                      value={formData.patientGender || ''}
                      onChange={e => setFormData({ ...formData, patientGender: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    >
                      <option value="">-</option>
                      <option value="M">M</option>
                      <option value="F">F</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Obra Social / Prepaga</label>
                    <input
                      type="text"
                      value={formData.insuranceProvider}
                      onChange={e => setFormData({ ...formData, insuranceProvider: e.target.value })}
                      placeholder="Ej: Swiss Medical, Particular..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Credencial N°</label>
                    <input
                      type="text"
                      value={formData.insuranceAffiliateNumber}
                      onChange={e => setFormData({ ...formData, insuranceAffiliateNumber: e.target.value })}
                      placeholder="2-4892410-01"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Diagnóstico / Motivo</label>
                  <input
                    type="text"
                    value={formData.diagnosis}
                    onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                    placeholder="Ej: Colelitiasis sintomática / Postoperatorio colecistectomía"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                  />
                </div>

                {/* RP TEXTAREA */}
                <div>
                  <label className="text-[11px] font-bold text-cyan-300 block mb-0.5">
                    Rp./ (Lado Izquierdo - Medicamentos o Texto de Certificado):
                  </label>
                  <textarea
                    value={formData.rpText}
                    onChange={e => setFormData({ ...formData, rpText: e.target.value })}
                    rows={6}
                    placeholder="1. Medicamentos y dosis...&#10;2. Certifico que..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-sans leading-relaxed focus:outline-hidden focus:border-cyan-500"
                  />
                </div>

                {/* INDICACIONES TEXTAREA */}
                <div>
                  <label className="text-[11px] font-bold text-cyan-300 block mb-0.5">
                    Indicaciones (Lado Derecho - Pautas, Cuidados y Controles):
                  </label>
                  <textarea
                    value={formData.indicationsText}
                    onChange={e => setFormData({ ...formData, indicationsText: e.target.value })}
                    rows={6}
                    placeholder="• Pautas de reposo y cuidados...&#10;• Fecha de retiro de puntos..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-sans leading-relaxed focus:outline-hidden focus:border-cyan-500"
                  />
                </div>

                {/* Doctor Header Configuration */}
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Encabezado Médico & Matrícula
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Especialidad</label>
                      <select
                        value={formData.doctorSpecialty}
                        onChange={e => setFormData({ ...formData, doctorSpecialty: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                      >
                        <option value="Cirugía Gral">Cirugía Gral</option>
                        <option value="Cirugía Hepatobilio Pancreática">Cirugía Hepatobilio Pancreática</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Matrícula en Encabezado</label>
                      <select
                        value={formData.licenseType || 'NACIONAL'}
                        onChange={e => setFormData({ ...formData, licenseType: e.target.value as 'PROVINCIAL' | 'NACIONAL' })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-medium"
                      >
                        <option value="NACIONAL">Matrícula Nac.: 70212</option>
                        <option value="PROVINCIAL">Matrícula Prov.: 440703</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Signature Toggle */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-300">Incluir Firma y Sello Digital del Dr. Ciavarelli</span>
                  <input
                    type="checkbox"
                    checked={formData.includeSignature}
                    onChange={e => setFormData({ ...formData, includeSignature: e.target.checked })}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>

                {/* Submit button */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-md transition cursor-pointer"
                  >
                    Guardar y Previsualizar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: OFFICIAL TEMPLATE PREVIEW & PDF DOWNLOAD BAR (8 Cols on LG) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Action Toolbar on Top of Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">
                Vista Previa Oficial (Formato A4 Apaisado / Doble Talón CEMET)
              </span>
              <span className="text-[10px] bg-slate-800 text-cyan-300 px-2 py-0.5 rounded-full font-mono border border-slate-700">
                {currentDisplayCert?.certificateNumber || 'Borrador'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Edit button */}
              {!isEditing && activeCert && (
                <button
                  onClick={() => handleStartEdit(activeCert)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modificar Datos</span>
                </button>
              )}

              {/* Copy text button */}
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                title="Copiar texto formateado para enviar por WhatsApp al paciente"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? '¡Copiado!' : 'Copiar WhatsApp'}</span>
              </button>

              {/* Native Print button */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                title="Imprimir directamente en hoja A4 apaisada"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>

              {/* Direct PDF Download button */}
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-md shadow-cyan-500/20 transition cursor-pointer active:scale-95"
                title="Descargar archivo PDF A4 listo para enviar o archivar"
              >
                {isGeneratingPdf ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generando PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* THE OFFICIAL TEMPLATE SHEET (RENDERED IN EXACT CEMET PROPORTIONS) */}
          <div className="overflow-x-auto bg-slate-950 p-2 sm:p-4 rounded-2xl border border-slate-800 shadow-inner">
            {/* The A4 Landscape Certificate Sheet */}
            <div
              ref={printSheetRef}
              id="cemet-certificate-sheet"
              style={{
                width: '100%',
                maxWidth: '920px',
                aspectRatio: '1.414 / 1', // A4 Landscape ratio
              }}
              className="mx-auto bg-white text-slate-900 p-6 sm:p-8 shadow-2xl relative grid grid-cols-2 divide-x-2 divide-slate-300 font-sans selection:bg-cyan-100 rounded-lg"
            >
              {/* LEFT HALF: TALÓN RP. / RECETA / CERTIFICADO */}
              <div className="pr-6 sm:pr-8 flex flex-col justify-between">
                <div>
                  {/* Header Left Half */}
                  <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                    <div className="flex items-center gap-2">
                      <img
                        src="/assets/cemet_logo.png"
                        alt="CEMET"
                        className="h-14 w-auto object-contain"
                      />
                    </div>
                    <div className="text-right text-[11px] leading-tight text-slate-800">
                      <div className="font-bold text-[12px] text-slate-900">
                        Médico: {currentDisplayCert?.doctorName || 'Dr. Miguel Angel Ciavarelli'}
                      </div>
                      <div>Especialidad: {currentDisplayCert?.doctorSpecialty || 'Cirugía Gral'}</div>
                      {currentDisplayCert?.licenseType === 'NACIONAL' ? (
                        <div>Matrícula Nac.: {currentDisplayCert?.nationalLicense || '70212'}</div>
                      ) : (
                        <div>Matrícula Prov.: {currentDisplayCert?.provincialLicense || '440703'}</div>
                      )}
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        Válida desde: {currentDisplayCert?.validFromDate || currentDisplayCert?.issueDate || '23/10/2026'}
                      </div>
                    </div>
                  </div>

                  {/* Patient Data Row Left */}
                  <div className="py-2.5 border-b border-slate-300 text-[11px] leading-relaxed text-slate-800">
                    <div className="font-bold text-[12px] text-slate-950">
                      Paciente: <span className="font-extrabold text-slate-900">{currentDisplayCert?.patientName || '__________________________'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-0.5">
                      <div>DNI: <span className="font-medium">{currentDisplayCert?.patientDni || '_______________'}</span></div>
                      <div>F. Nac.: <span className="font-medium">{currentDisplayCert?.patientAge || currentDisplayCert?.patientBirthDate || '__________'}</span></div>
                      <div>Sexo: <span className="font-medium">{currentDisplayCert?.patientGender || '___'}</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-0.5">
                      <div>Obra social: <span className="font-semibold">{currentDisplayCert?.insuranceProvider || '_______________'}</span></div>
                      <div>Credencial N° : <span className="font-medium font-mono">{currentDisplayCert?.insuranceAffiliateNumber || '_______________'}</span></div>
                    </div>
                    {currentDisplayCert?.diagnosis && (
                      <div className="mt-0.5 text-[10px] text-slate-600">
                        Diag.: <span className="italic">{currentDisplayCert.diagnosis}</span>
                      </div>
                    )}
                  </div>

                  {/* Rp Title */}
                  <div className="pt-3 pb-1">
                    <span className="text-sm font-black text-slate-900 tracking-wide font-serif">Rp./</span>
                  </div>

                  {/* Rp Body Content */}
                  <div className="text-[11.5px] leading-relaxed text-slate-900 whitespace-pre-line min-h-[220px] font-sans">
                    {currentDisplayCert?.rpText || (
                      <span className="text-slate-400 italic">
                        [Aquí se detallan los medicamentos recetados, posología o texto formal de certificación médica y reposo laboral]
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Left Half */}
                <div className="pt-4 border-t border-slate-200 flex items-end justify-between">
                  <div className="text-[11px] font-semibold text-slate-800">
                    Fecha: <span className="font-bold">{currentDisplayCert?.issueDate || '23/10/2026'}</span>
                  </div>

                  {/* Signature and Stamp */}
                  <div className="text-center w-52">
                    {currentDisplayCert?.includeSignature ? (
                      <div className="flex flex-col items-center">
                        <img
                          src="/assets/firma_sello_ciavarelli.png"
                          alt="Firma y Sello Dr. Ciavarelli"
                          className="h-16 w-auto object-contain mb-0.5"
                        />
                      </div>
                    ) : (
                      <div className="h-16 flex items-end justify-center pb-2">
                        <div className="w-40 border-b border-dashed border-slate-400" />
                      </div>
                    )}
                    <span className="text-[9px] uppercase tracking-wider text-slate-700 font-bold block">
                      FIRMA Y SELLO
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT HALF: TALÓN INDICACIONES (PACIENTE) */}
              <div className="pl-8 flex flex-col justify-between">
                <div>
                  {/* Header Right Half */}
                  <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                    <div className="flex items-center gap-2">
                      <img
                        src="/assets/cemet_logo.png"
                        alt="CEMET"
                        className="h-14 w-auto object-contain"
                      />
                    </div>
                    <div className="text-right text-[11px] leading-tight text-slate-800">
                      <div className="font-bold text-[12px] text-slate-900">
                        Médico: {currentDisplayCert?.doctorName || 'Dr. Miguel Angel Ciavarelli'}
                      </div>
                      <div>Especialidad: {currentDisplayCert?.doctorSpecialty || 'Cirugía Gral'}</div>
                      {currentDisplayCert?.licenseType === 'NACIONAL' ? (
                        <div>Matrícula Nac.: {currentDisplayCert?.nationalLicense || '70212'}</div>
                      ) : (
                        <div>Matrícula Prov.: {currentDisplayCert?.provincialLicense || '440703'}</div>
                      )}
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        Válida desde: {currentDisplayCert?.validFromDate || currentDisplayCert?.issueDate || '23/10/2026'}
                      </div>
                    </div>
                  </div>

                  {/* Patient Data Row Right */}
                  <div className="py-2.5 border-b border-slate-300 text-[11px] leading-relaxed text-slate-800">
                    <div className="font-bold text-[12px] text-slate-950">
                      Paciente: <span className="font-extrabold text-slate-900">{currentDisplayCert?.patientName || '__________________________'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-0.5">
                      <div>DNI: <span className="font-medium">{currentDisplayCert?.patientDni || '_______________'}</span></div>
                      <div>F. Nac.: <span className="font-medium">{currentDisplayCert?.patientAge || currentDisplayCert?.patientBirthDate || '__________'}</span></div>
                      <div>Sexo: <span className="font-medium">{currentDisplayCert?.patientGender || '___'}</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-0.5">
                      <div>Obra social: <span className="font-semibold">{currentDisplayCert?.insuranceProvider || '_______________'}</span></div>
                      <div>Credencial N° : <span className="font-medium font-mono">{currentDisplayCert?.insuranceAffiliateNumber || '_______________'}</span></div>
                    </div>
                    {currentDisplayCert?.diagnosis && (
                      <div className="mt-0.5 text-[10px] text-slate-600">
                        Diag.: <span className="italic">{currentDisplayCert.diagnosis}</span>
                      </div>
                    )}
                  </div>

                  {/* Indicaciones Title */}
                  <div className="pt-3 pb-1">
                    <span className="text-sm font-bold text-slate-900 tracking-wide">Indicaciones:</span>
                  </div>

                  {/* Indicaciones Body Content */}
                  <div className="text-[11.5px] leading-relaxed text-slate-900 whitespace-pre-line min-h-[220px] font-sans">
                    {currentDisplayCert?.indicationsText || (
                      <span className="text-slate-400 italic">
                        [Pautas postoperatorias, indicaciones de curaciones, signos de alarma y fecha del próximo control]
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Right Half */}
                <div className="pt-4 border-t border-slate-200 flex items-end justify-between">
                  <div className="text-[11px] font-semibold text-slate-800">
                    Fecha: <span className="font-bold">{currentDisplayCert?.issueDate || '23/10/2026'}</span>
                  </div>

                  {/* Signature and Stamp */}
                  <div className="text-center w-52">
                    {currentDisplayCert?.includeSignature ? (
                      <div className="flex flex-col items-center">
                        <img
                          src="/assets/firma_sello_ciavarelli.png"
                          alt="Firma y Sello Dr. Ciavarelli"
                          className="h-16 w-auto object-contain mb-0.5"
                        />
                      </div>
                    ) : (
                      <div className="h-16 flex items-end justify-center pb-2">
                        <div className="w-40 border-b border-dashed border-slate-400" />
                      </div>
                    )}
                    <span className="text-[9px] uppercase tracking-wider text-slate-700 font-bold block">
                      FIRMA Y SELLO
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
