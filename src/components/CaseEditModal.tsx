import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Trash2,
  Plus,
  Calendar,
  Clock,
  Building2,
  User,
  Shield,
  Stethoscope,
  Layers,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Paperclip,
  Upload,
  Eye,
  Download,
  CheckCircle2
} from 'lucide-react';
import { SurgicalCase, SurgicalMaterial, SurgeryStatus, MaterialStatus, AttachedDocument, DocumentType } from '../types/surgical';
import { calculateAge, validateSurgicalCase } from '../lib/surgicalLogic';

interface CaseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseToEdit?: SurgicalCase | null;
  onSave: (caseData: any) => void;
  onDelete?: (id: string) => void;
  onViewDocument?: (doc: AttachedDocument, c?: SurgicalCase) => void;
  clinics: string[];
  surgeons: string[];
  insurances: string[];
  specialties: string[];
}

export const CaseEditModal: React.FC<CaseEditModalProps> = ({
  isOpen,
  onClose,
  caseToEdit,
  onSave,
  onDelete,
  onViewDocument,
  clinics,
  surgeons,
  insurances,
  specialties,
}) => {
  const [formData, setFormData] = useState<Partial<SurgicalCase>>({
    patientName: '',
    patientMedicalRecordNumber: '',
    patientDni: '',
    patientBirthDate: '1985-06-15',
    patientPhone: '',
    patientEmail: '',
    insuranceProvider: insurances[0] || 'OSDE BINARIO (Plan 210)',
    insuranceAffiliateNumber: '',
    procedureName: '',
    specialty: specialties[0] || 'Cirugía General',
    preoperativeDiagnosis: '',
    surgeonName: surgeons[0] || 'Dr. Miguel Angel Ciavarelli',
    assistantName: '',
    anesthesiologist: '',
    estimatedSurgeryClinic: clinics[0] || 'Corporación Médica de Gral San Martín SA',
    operatingRoom: 'Quirófano Central',
    surgeryDate: new Date().toISOString().split('T')[0],
    surgeryTime: '08:30',
    estimatedDurationHours: 2.0,
    status: 'PROGRAMADA',
    notes: '',
    materials: [],
    attachedDocuments: [],
  });

  const [materials, setMaterials] = useState<SurgicalMaterial[]>([]);
  const [attachedDocuments, setAttachedDocuments] = useState<AttachedDocument[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'general' | 'materials' | 'notes' | 'documents'>('general');

  // New attachment form state
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState<DocumentType>('protocolo');
  const [newDocInstitution, setNewDocInstitution] = useState('');
  const [newDocDescription, setNewDocDescription] = useState('');
  const [newDocFile, setNewDocFile] = useState<{ name: string; size: string; dataUrl?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (caseToEdit) {
      setFormData(caseToEdit);
      setMaterials(caseToEdit.materials || []);
      setAttachedDocuments(caseToEdit.attachedDocuments || []);
      setNewDocInstitution(caseToEdit.estimatedSurgeryClinic || clinics[0] || 'Corporación Médica de Gral San Martín SA');
    } else {
      // Default new case
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        patientName: '',
        patientMedicalRecordNumber: `HC-${Math.floor(10000 + Math.random() * 90000)}`,
        patientDni: '',
        patientBirthDate: '1985-06-15',
        patientPhone: '',
        patientEmail: '',
        insuranceProvider: insurances[0] || 'OSDE BINARIO (Plan 210)',
        insuranceAffiliateNumber: '',
        procedureName: '',
        specialty: specialties[0] || 'Cirugía General',
        preoperativeDiagnosis: '',
        surgeonName: surgeons[0] || 'Dr. Miguel Angel Ciavarelli',
        assistantName: '',
        anesthesiologist: '',
        estimatedSurgeryClinic: clinics[0] || 'Corporación Médica de Gral San Martín SA',
        operatingRoom: 'Quirófano Central',
        surgeryDate: today,
        surgeryTime: '08:30',
        estimatedDurationHours: 2.0,
        status: 'PROGRAMADA',
        notes: '',
        materials: [],
        attachedDocuments: [],
      });
      setMaterials([]);
      setAttachedDocuments([]);
      setNewDocInstitution(clinics[0] || 'Corporación Médica de Gral San Martín SA');
    }
    setErrors({});
    setActiveTab('general');
    setNewDocTitle('');
    setNewDocDescription('');
    setNewDocFile(null);
  }, [caseToEdit, isOpen, clinics, surgeons, insurances, specialties]);

  if (!isOpen) return null;

  const handleChange = (field: keyof SurgicalCase, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleAddMaterial = () => {
    const newMat: SurgicalMaterial = {
      id: `mat-${Date.now()}`,
      code: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
      description: 'Nuevo implante o insumo quirúrgico',
      supplier: 'Ortopedia Biomédica S.A.',
      quantity: 1,
      cost: 150000,
      status: 'SOLICITADO',
    };
    setMaterials(prev => [...prev, newMat]);
  };

  const handleUpdateMaterial = (index: number, updates: Partial<SurgicalMaterial>) => {
    setMaterials(prev =>
      prev.map((m, i) => (i === index ? { ...m, ...updates } : m))
    );
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterials(prev => prev.filter((_, i) => i !== index));
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

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    const newDoc: AttachedDocument = {
      id: `doc-${Date.now()}`,
      title: newDocTitle.trim(),
      fileName: newDocFile?.name || `${newDocTitle.trim().replace(/\s+/g, '_')}.pdf`,
      fileType: newDocType,
      date: new Date().toISOString().split('T')[0],
      institution: newDocInstitution || formData.estimatedSurgeryClinic || 'Corporación Médica de Gral San Martín SA',
      description: newDocDescription || `Documento adjunto al expediente de ${formData.patientName}`,
      summaryText: newDocDescription || 'Documento adjuntado por el profesional médico.',
      signee: formData.surgeonName || 'Dr. Miguel Angel Ciavarelli',
      registrationNumber: formData.surgeonRegistration || 'MN 70212 | MP 440703',
      fileSize: newDocFile?.size || 'PDF',
      fileDataUrl: newDocFile?.dataUrl,
    };

    setAttachedDocuments(prev => [newDoc, ...prev]);
    setNewDocTitle('');
    setNewDocDescription('');
    setNewDocFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveDocument = (id: string) => {
    setAttachedDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      materials,
      attachedDocuments,
    };

    const validation = validateSurgicalCase(payload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setActiveTab('general');
      return;
    }

    onSave(payload);
    onClose();
  };

  const patientAge = calculateAge(formData.patientBirthDate || '');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {caseToEdit ? 'Editar Caso Quirúrgico' : 'Nueva Programación Quirúrgica'}
              </h2>
              <p className="text-xs text-slate-400">
                {caseToEdit
                  ? `HC: ${caseToEdit.patientMedicalRecordNumber} · ${caseToEdit.patientName}`
                  : 'Complete los datos del paciente, clínica estimada, equipo y prótesis'}
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

        {/* Navigation sub-tabs inside modal */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-slate-900 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Datos Generales & Cirugía</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'materials'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Materiales e Implantes ({materials.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Observaciones & Quirófano</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'border-cyan-500 text-cyan-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Adjuntos & Protocolos ({attachedDocuments.length})</span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Section 1: Paciente & Historia Clínica */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  <User className="w-4 h-4" />
                  <span>Identificación del Paciente</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nombre Completo del Paciente *
                    </label>
                    <input
                      type="text"
                      value={formData.patientName || ''}
                      onChange={e => handleChange('patientName', e.target.value)}
                      placeholder="Ej. Roberto Carlos Méndez"
                      className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.patientName ? 'border-rose-500' : 'border-slate-700'
                      }`}
                    />
                    {errors.patientName && (
                      <p className="text-[11px] text-rose-400 mt-1">{errors.patientName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      N° Historia Clínica (HC) *
                    </label>
                    <input
                      type="text"
                      value={formData.patientMedicalRecordNumber || ''}
                      onChange={e => handleChange('patientMedicalRecordNumber', e.target.value)}
                      placeholder="Ej. HC-84920"
                      className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.patientMedicalRecordNumber ? 'border-rose-500' : 'border-slate-700'
                      }`}
                    />
                    {errors.patientMedicalRecordNumber && (
                      <p className="text-[11px] text-rose-400 mt-1">{errors.patientMedicalRecordNumber}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">DNI / Documento</label>
                    <input
                      type="text"
                      value={formData.patientDni || ''}
                      onChange={e => handleChange('patientDni', e.target.value)}
                      placeholder="Ej. 28.491.832"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Fecha Nacimiento ({patientAge} años)
                    </label>
                    <input
                      type="date"
                      value={formData.patientBirthDate || ''}
                      onChange={e => handleChange('patientBirthDate', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono Contacto</label>
                    <input
                      type="text"
                      value={formData.patientPhone || ''}
                      onChange={e => handleChange('patientPhone', e.target.value)}
                      placeholder="+54 9 11 ..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.patientEmail || ''}
                      onChange={e => handleChange('patientEmail', e.target.value)}
                      placeholder="paciente@correo.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Cobertura / Prepaga */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  <Shield className="w-4 h-4" />
                  <span>Cobertura Médica & Obra Social</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Obra Social / Prepaga</label>
                    <select
                      value={formData.insuranceProvider || ''}
                      onChange={e => handleChange('insuranceProvider', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {insurances.map(ins => (
                        <option key={ins} value={ins}>{ins}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">N° de Afiliado</label>
                    <input
                      type="text"
                      value={formData.insuranceAffiliateNumber || ''}
                      onChange={e => handleChange('insuranceAffiliateNumber', e.target.value)}
                      placeholder="Ej. 1-28491832-01"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Procedimiento y Equipo */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  <Stethoscope className="w-4 h-4" />
                  <span>Detalles de Cirugía y Equipo Médico</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nombre del Procedimiento Quirúrgico *
                    </label>
                    <input
                      type="text"
                      value={formData.procedureName || ''}
                      onChange={e => handleChange('procedureName', e.target.value)}
                      placeholder="Ej. Artroplastia Total de Cadera Derecha"
                      className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.procedureName ? 'border-rose-500' : 'border-slate-700'
                      }`}
                    />
                    {errors.procedureName && (
                      <p className="text-[11px] text-rose-400 mt-1">{errors.procedureName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Especialidad</label>
                    <select
                      value={formData.specialty || ''}
                      onChange={e => handleChange('specialty', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {specialties.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Diagnóstico Preoperatorio</label>
                  <input
                    type="text"
                    value={formData.preoperativeDiagnosis || ''}
                    onChange={e => handleChange('preoperativeDiagnosis', e.target.value)}
                    placeholder="Ej. Coxartrosis severa derecha grado IV"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Cirujano Principal *</label>
                    <select
                      value={formData.surgeonName || ''}
                      onChange={e => handleChange('surgeonName', e.target.value)}
                      className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.surgeonName ? 'border-rose-500' : 'border-slate-700'
                      }`}
                    >
                      {surgeons.map(surg => (
                        <option key={surg} value={surg}>{surg}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Ayudante / Instrumentador</label>
                    <input
                      type="text"
                      value={formData.assistantName || ''}
                      onChange={e => handleChange('assistantName', e.target.value)}
                      placeholder="Dra. Camila Toledo"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Anestesiólogo</label>
                    <input
                      type="text"
                      value={formData.anesthesiologist || ''}
                      onChange={e => handleChange('anesthesiologist', e.target.value)}
                      placeholder="Dr. Fernando Varela"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Logística, Sanatorio y Fecha */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  <span>Clínica Estimada, Fecha & Quirófano</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Clínica / Sanatorio Estimado *
                    </label>
                    <select
                      value={formData.estimatedSurgeryClinic || ''}
                      onChange={e => handleChange('estimatedSurgeryClinic', e.target.value)}
                      className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.estimatedSurgeryClinic ? 'border-rose-500' : 'border-slate-700'
                      }`}
                    >
                      {clinics.map(clinic => (
                        <option key={clinic} value={clinic}>{clinic}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Quirófano Asignado</label>
                    <input
                      type="text"
                      value={formData.operatingRoom || ''}
                      onChange={e => handleChange('operatingRoom', e.target.value)}
                      placeholder="Quirófano 3"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Fecha de Cirugía *</label>
                    <input
                      type="date"
                      value={formData.surgeryDate || ''}
                      onChange={e => handleChange('surgeryDate', e.target.value)}
                      className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.surgeryDate ? 'border-rose-500' : 'border-slate-700'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Hora Programada</label>
                    <input
                      type="time"
                      value={formData.surgeryTime || '08:30'}
                      onChange={e => handleChange('surgeryTime', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Duración (hs)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="12"
                      value={formData.estimatedDurationHours || 2.0}
                      onChange={e => handleChange('estimatedDurationHours', parseFloat(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Estado de Cirugía</label>
                    <select
                      value={formData.status || 'PROGRAMADA'}
                      onChange={e => handleChange('status', e.target.value as SurgeryStatus)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PROGRAMADA">PROGRAMADA</option>
                      <option value="EN_CURSO">EN CURSO</option>
                      <option value="REALIZADA">REALIZADA</option>
                      <option value="REPROGRAMADA">REPROGRAMADA</option>
                      <option value="CANCELADA">CANCELADA</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Prótesis, Implantes y Materiales Especiales</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Registre los insumos quirúrgicos necesarios para coordinar con ortopedia y clínica
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Insumo</span>
                </button>
              </div>

              {materials.length === 0 ? (
                <div className="border border-dashed border-slate-700 rounded-xl p-8 text-center bg-slate-950/40">
                  <Layers className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-300 font-medium">No se han registrado materiales o prótesis</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Haga clic en "Agregar Insumo" para especificar cajas de instrumental, implantes o kits.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {materials.map((mat, idx) => (
                    <div
                      key={mat.id || idx}
                      className="bg-slate-800/60 border border-slate-750 rounded-xl p-3.5 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <select
                            value={mat.status}
                            onChange={e => handleUpdateMaterial(idx, { status: e.target.value as MaterialStatus })}
                            className={`text-xs px-2.5 py-1 rounded-md border font-semibold ${
                              mat.status === 'EN_CLINICA'
                                ? 'bg-cyan-950/70 border-cyan-700 text-cyan-300'
                                : mat.status === 'UTILIZADO'
                                ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                                : mat.status === 'SOLICITADO'
                                ? 'bg-amber-950/70 border-amber-700 text-amber-300'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                          >
                            <option value="SOLICITADO">SOLICITADO</option>
                            <option value="EN_CLINICA">EN CLÍNICA</option>
                            <option value="UTILIZADO">UTILIZADO</option>
                            <option value="DEVUELTO">DEVUELTO</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterial(idx)}
                            className="p-1 rounded text-rose-400 hover:bg-rose-950/50 hover:text-rose-300"
                            title="Eliminar insumo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-slate-400 mb-1">Descripción del Material / Implante</label>
                          <input
                            type="text"
                            value={mat.description}
                            onChange={e => handleUpdateMaterial(idx, { description: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Código / Referencia</label>
                          <input
                            type="text"
                            value={mat.code}
                            onChange={e => handleUpdateMaterial(idx, { code: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Proveedor / Ortopedia</label>
                          <input
                            type="text"
                            value={mat.supplier}
                            onChange={e => handleUpdateMaterial(idx, { supplier: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Cantidad</label>
                          <input
                            type="number"
                            min="1"
                            value={mat.quantity}
                            onChange={e => handleUpdateMaterial(idx, { quantity: parseInt(e.target.value) || 1 })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Costo Unitario Estimado ($)</label>
                          <input
                            type="number"
                            min="0"
                            value={mat.cost}
                            onChange={e => handleUpdateMaterial(idx, { cost: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Notas Clínicas, Requerimientos de Quirófano y Anestesia
                </label>
                <textarea
                  rows={6}
                  value={formData.notes || ''}
                  onChange={e => handleChange('notes', e.target.value)}
                  placeholder="Instrucciones prequirúrgicas, alergias, reserva de sangre, equipamiento especial (ej. arco en C, torre de laparoscopía, microscopio)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Sincronización Automática</span>
                </div>
                <p>
                  Cualquier modificación guardada en este caso se sincroniza inmediatamente en memoria local,
                  y quedará lista para sincronizarse con Google Sheets / Apps Script o exportarse a CSV.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-cyan-400" />
                    <span>Documentos, Protocolos & Archivos Adjuntos ({attachedDocuments.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Protocolos quirúrgicos institucionales, solicitudes de quirófano, presupuestos y comprobantes
                  </p>
                </div>
              </div>

              {/* Existing documents list */}
              {attachedDocuments.length === 0 ? (
                <div className="border border-dashed border-slate-700 rounded-xl p-8 text-center bg-slate-950/40">
                  <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-300 font-medium">No hay documentos adjuntos en este expediente</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Cargue el protocolo quirúrgico, solicitud médica o presupuesto utilizando el formulario inferior.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attachedDocuments.map(doc => (
                    <div
                      key={doc.id}
                      className="bg-slate-800/60 border border-slate-750 hover:border-slate-650 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-white text-sm">{doc.title}</span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-700">
                              {doc.fileType}
                            </span>
                            {doc.fileSize && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({doc.fileSize})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300">
                            {doc.institution} · <span className="text-slate-400">{doc.date}</span>
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {doc.description || doc.summaryText}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700/50">
                        {onViewDocument && (
                          <button
                            type="button"
                            onClick={() => onViewDocument(doc, formData as SurgicalCase)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition"
                            title="Ver e imprimir documento médico"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver / Imprimir</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(doc.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50 transition"
                          title="Quitar archivo adjunto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Form to attach new document */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  <Upload className="w-4 h-4" />
                  <span>Adjuntar Nuevo Documento / Protocolo</span>
                </div>

                {/* File picker button / dropzone */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-cyan-500/70 rounded-xl p-4 text-center cursor-pointer transition bg-slate-900/60 hover:bg-slate-900"
                  >
                    {newDocFile ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Archivo cargado: {newDocFile.name} ({newDocFile.size})</span>
                        <span className="text-slate-400 underline ml-2">Cambiar</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                        <p className="text-xs text-slate-300 font-medium">
                          Haga clic aquí para seleccionar un archivo (PDF, Imagen, Word o Texto)
                        </p>
                        <p className="text-[10px] text-slate-500">
                          El archivo se almacenará directamente en el expediente
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Título del Documento *</label>
                    <input
                      type="text"
                      value={newDocTitle}
                      onChange={e => setNewDocTitle(e.target.value)}
                      placeholder="Ej. Protocolo Quirúrgico N° 512569"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Tipo de Documento</label>
                    <select
                      value={newDocType}
                      onChange={e => setNewDocType(e.target.value as DocumentType)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="protocolo">Protocolo Quirúrgico</option>
                      <option value="presupuesto">Solicitud / Presupuesto</option>
                      <option value="historia_clinica">Historia Clínica</option>
                      <option value="factura">Factura / Liquidación</option>
                      <option value="comprobante">Comprobante de Pago</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Institución Sanatorial</label>
                    <input
                      type="text"
                      value={newDocInstitution}
                      onChange={e => setNewDocInstitution(e.target.value)}
                      placeholder="Ej. Corporación Médica de Gral San Martín SA"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Descripción / Resumen de Hallazgos</label>
                    <input
                      type="text"
                      value={newDocDescription}
                      onChange={e => setNewDocDescription(e.target.value)}
                      placeholder="Detalle operatorio o resumen..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddDocument}
                    disabled={!newDocTitle.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Documento al Expediente</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {caseToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Confirma eliminar la cirugía del paciente ${caseToEdit.patientName}?`)) {
                    onDelete(caseToEdit.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg text-xs font-semibold transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Cirugía</span>
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
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Caso Quirúrgico</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
