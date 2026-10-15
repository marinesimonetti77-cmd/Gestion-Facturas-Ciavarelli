import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Building2,
  User,
  Stethoscope,
  Layers,
  Edit3,
  Trash2,
  Plus,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  LayoutGrid,
  List,
  Paperclip
} from 'lucide-react';
import { SurgicalCase, SurgeryStatus, AttachedDocument } from '../types/surgical';
import { calculateAge } from '../lib/surgicalLogic';

interface SurgicalCasesListProps {
  cases: SurgicalCase[];
  clinics: string[];
  surgeons: string[];
  onEditCase: (c: SurgicalCase) => void;
  onNewCase: () => void;
  onDeleteCase: (id: string) => void;
  onUpdateStatus: (id: string, status: SurgeryStatus) => void;
  onUpdateClinic: (id: string, clinic: string) => void;
  onUpdateDate: (id: string, date: string) => void;
  onCreateInvoice: (c: SurgicalCase) => void;
  onViewInvoice: (invoiceId: string) => void;
  onViewDocument?: (doc: AttachedDocument, c?: SurgicalCase) => void;
}

export const SurgicalCasesList: React.FC<SurgicalCasesListProps> = ({
  cases,
  clinics,
  surgeons,
  onEditCase,
  onNewCase,
  onDeleteCase,
  onUpdateStatus,
  onUpdateClinic,
  onUpdateDate,
  onCreateInvoice,
  onViewInvoice,
  onViewDocument,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSurgeon, setSelectedSurgeon] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // Clinic filter
      if (selectedClinic !== 'ALL' && c.estimatedSurgeryClinic !== selectedClinic) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && c.status !== selectedStatus) {
        return false;
      }
      // Surgeon filter
      if (selectedSurgeon !== 'ALL' && c.surgeonName !== selectedSurgeon) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesPatient = c.patientName.toLowerCase().includes(query);
        const matchesHC = c.patientMedicalRecordNumber.toLowerCase().includes(query);
        const matchesDni = c.patientDni?.toLowerCase().includes(query);
        const matchesProc = c.procedureName.toLowerCase().includes(query);
        const matchesClinic = c.estimatedSurgeryClinic.toLowerCase().includes(query);
        const matchesSurgeon = c.surgeonName.toLowerCase().includes(query);
        if (!matchesPatient && !matchesHC && !matchesDni && !matchesProc && !matchesClinic && !matchesSurgeon) {
          return false;
        }
      }
      return true;
    });
  }, [cases, selectedClinic, selectedStatus, selectedSurgeon, searchTerm]);

  // Export filtered to CSV
  const handleExportCSV = () => {
    const headers = [
      'N° Historia Clinica',
      'Paciente',
      'DNI',
      'Fecha Nacimiento',
      'Edad',
      'Telefono',
      'Obra Social',
      'N° Afiliado',
      'Procedimiento',
      'Especialidad',
      'Cirujano',
      'Clinica Estimada',
      'Quirofano',
      'Fecha Cirugia',
      'Hora',
      'Estado',
      'Cant Materiales',
      'Notas',
    ];

    const rows = filteredCases.map(c => [
      `"${c.patientMedicalRecordNumber}"`,
      `"${c.patientName}"`,
      `"${c.patientDni || ''}"`,
      `"${c.patientBirthDate || ''}"`,
      calculateAge(c.patientBirthDate || ''),
      `"${c.patientPhone || ''}"`,
      `"${c.insuranceProvider || ''}"`,
      `"${c.insuranceAffiliateNumber || ''}"`,
      `"${c.procedureName}"`,
      `"${c.specialty}"`,
      `"${c.surgeonName}"`,
      `"${c.estimatedSurgeryClinic}"`,
      `"${c.operatingRoom || ''}"`,
      `"${c.surgeryDate}"`,
      `"${c.surgeryTime}"`,
      `"${c.status}"`,
      (c.materials || []).length,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `casos_quirurgicos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeClass = (status: SurgeryStatus) => {
    switch (status) {
      case 'PROGRAMADA':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'EN_CURSO':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse';
      case 'REALIZADA':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'REPROGRAMADA':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'CANCELADA':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Control bar: Search, Filters & View toggles */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por paciente, N° HC, DNI, procedimiento o clínica..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Quick buttons: Mode toggle + CSV export */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Vista de Tabla"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md transition ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Vista de Tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
              title="Descargar listado en formato Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={onNewCase}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/30 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Cirugía</span>
            </button>
          </div>
        </div>

        {/* Filter dropdowns row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar por:</span>
          </div>

          {/* Filter by Clinic */}
          <div className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClinic}
              onChange={e => setSelectedClinic(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Todas las Clínicas ({cases.length})</option>
              {clinics.map(c => (
                <option key={c} value={c}>
                  {c} ({cases.filter(x => x.estimatedSurgeryClinic === c).length})
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="PROGRAMADA">Programadas</option>
              <option value="EN_CURSO">En Curso</option>
              <option value="REALIZADA">Realizadas</option>
              <option value="REPROGRAMADA">Reprogramadas</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
          </div>

          {/* Filter by Surgeon */}
          <div>
            <select
              value={selectedSurgeon}
              onChange={e => setSelectedSurgeon(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Todos los Cirujanos</option>
              {surgeons.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {(selectedClinic !== 'ALL' || selectedStatus !== 'ALL' || selectedSurgeon !== 'ALL' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedClinic('ALL');
                setSelectedStatus('ALL');
                setSelectedSurgeon('ALL');
                setSearchTerm('');
              }}
              className="text-cyan-400 hover:underline ml-auto"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Table or Cards */}
      {filteredCases.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Stethoscope className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No se encontraron cirugías</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No hay casos que coincidan con los filtros seleccionados o la búsqueda realizada.
          </p>
          <button
            onClick={onNewCase}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nueva Cirugía</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Interactive Table with Inline Quick Edits */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">HC & Paciente</th>
                  <th className="py-3 px-4">Procedimiento Quirúrgico</th>
                  <th className="py-3 px-4">Clínica Estimada (Editable)</th>
                  <th className="py-3 px-4">Fecha & Hora</th>
                  <th className="py-3 px-4">Cirujano & Cobertura</th>
                  <th className="py-3 px-4">Estado (Editable)</th>
                  <th className="py-3 px-4">Materiales</th>
                  <th className="py-3 px-4">Adjuntos / Protocolos</th>
                  <th className="py-3 px-4">Facturación</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredCases.map(c => {
                  const age = calculateAge(c.patientBirthDate || '');
                  const materialsCount = (c.materials || []).length;
                  const materialsPending = (c.materials || []).filter(m => m.status === 'SOLICITADO').length;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* HC & Patient */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-[11px] font-bold text-cyan-400">
                            {c.patientMedicalRecordNumber}
                          </span>
                          <span className="font-semibold text-white text-sm">
                            {c.patientName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            DNI: {c.patientDni || 'S/D'} · {age > 0 ? `${age} años` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Procedure */}
                      <td className="py-3 px-4 max-w-[220px]">
                        <div className="font-medium text-slate-100 line-clamp-2" title={c.procedureName}>
                          {c.procedureName}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {c.specialty}
                        </span>
                      </td>

                      {/* Clinic (INLINE EDITABLE DROPDOWN) */}
                      <td className="py-3 px-4">
                        <select
                          value={c.estimatedSurgeryClinic}
                          onChange={e => onUpdateClinic(c.id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 hover:border-cyan-500 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
                          title="Haga clic para cambiar la clínica en el momento"
                        >
                          {clinics.map(clinic => (
                            <option key={clinic} value={clinic}>
                              {clinic}
                            </option>
                          ))}
                        </select>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {c.operatingRoom || 'Quirófano por asignar'}
                        </span>
                      </td>

                      {/* Date & Time (INLINE EDITABLE) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <input
                          type="date"
                          value={c.surgeryDate}
                          onChange={e => onUpdateDate(c.id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 hover:border-cyan-500 text-slate-200 rounded-md px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                          title="Haga clic para cambiar la fecha de cirugía"
                        />
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>{c.surgeryTime} ({c.estimatedDurationHours} hs)</span>
                        </div>
                      </td>

                      {/* Surgeon & Insurance */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-200 block">
                          {c.surgeonName}
                        </span>
                        <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 inline-block mt-0.5">
                          {c.insuranceProvider}
                        </span>
                      </td>

                      {/* Status (INLINE EDITABLE BADGE SELECTOR) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={c.status}
                          onChange={e => onUpdateStatus(c.id, e.target.value as SurgeryStatus)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${getStatusBadgeClass(c.status)}`}
                          title="Haga clic para cambiar el estado"
                        >
                          <option value="PROGRAMADA">PROGRAMADA</option>
                          <option value="EN_CURSO">EN CURSO</option>
                          <option value="REALIZADA">REALIZADA</option>
                          <option value="REPROGRAMADA">REPROGRAMADA</option>
                          <option value="CANCELADA">CANCELADA</option>
                        </select>
                      </td>

                      {/* Materials */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {materialsCount === 0 ? (
                          <span className="text-slate-500 text-[11px]">Sin prótesis</span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-300">
                              <Layers className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{materialsCount} {materialsCount === 1 ? 'ítem' : 'ítems'}</span>
                            </span>
                            {materialsPending > 0 ? (
                              <span className="block text-[10px] text-amber-400">
                                {materialsPending} pendientes
                              </span>
                            ) : (
                              <span className="block text-[10px] text-emerald-400">
                                Disponibles
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Documents / Protocols */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {c.attachedDocuments && c.attachedDocuments.length > 0 ? (
                          <button
                            onClick={() => onViewDocument ? onViewDocument(c.attachedDocuments![0], c) : onEditCase(c)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 hover:border-cyan-600 transition shadow-xs"
                            title={`Ver documento médico: ${c.attachedDocuments[0].title}`}
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>{c.attachedDocuments.length === 1 ? '1 Protocolo' : `${c.attachedDocuments.length} Adjuntos`}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onEditCase(c)}
                            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-cyan-400 transition"
                            title="Haga clic para adjuntar protocolo a este caso"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>+ Adjuntar</span>
                          </button>
                        )}
                      </td>

                      {/* Invoice Link / Create */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {c.invoiceId ? (
                          <button
                            onClick={() => onViewInvoice(c.invoiceId!)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/80 px-2.5 py-1 rounded-lg transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Ver Factura</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onCreateInvoice(c)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg transition"
                            title="Generar factura para este caso"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Generar Factura</span>
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditCase(c)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-950/40 rounded-lg transition"
                            title="Editar caso completo"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar la cirugía del paciente ${c.patientName}?`)) {
                                onDeleteCase(c.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                            title="Eliminar caso"
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
      ) : (
        /* Cards / Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCases.map(c => {
            const age = calculateAge(c.patientBirthDate || '');
            return (
              <div
                key={c.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded">
                        {c.patientMedicalRecordNumber}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1">
                        {c.patientName}
                      </h4>
                      <p className="text-xs text-slate-400">
                        DNI: {c.patientDni} {age > 0 ? `· ${age} años` : ''}
                      </p>
                    </div>

                    <select
                      value={c.status}
                      onChange={e => onUpdateStatus(c.id, e.target.value as SurgeryStatus)}
                      className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none ${getStatusBadgeClass(c.status)}`}
                    >
                      <option value="PROGRAMADA">PROGRAMADA</option>
                      <option value="EN_CURSO">EN CURSO</option>
                      <option value="REALIZADA">REALIZADA</option>
                      <option value="REPROGRAMADA">REPROGRAMADA</option>
                      <option value="CANCELADA">CANCELADA</option>
                    </select>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
                    <div className="font-semibold text-slate-200 text-xs">
                      {c.procedureName}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-blue-400" />
                      <span>{c.surgeonName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>{c.estimatedSurgeryClinic} ({c.operatingRoom || 'S/Q'})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{c.surgeryDate} · {c.surgeryTime} hs</span>
                    </div>
                  </div>

                  {c.materials && c.materials.length > 0 && (
                    <div className="text-[11px] text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
                      <span className="font-semibold text-cyan-300 block mb-1">
                        Prótesis / Insumos ({c.materials.length}):
                      </span>
                      <ul className="space-y-1">
                        {c.materials.map(m => (
                          <li key={m.id} className="text-slate-300 flex items-center justify-between">
                            <span className="truncate max-w-[180px]">{m.description}</span>
                            <span className="text-[10px] font-mono font-semibold px-1 rounded bg-slate-900 border border-slate-700">
                              {m.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {c.attachedDocuments && c.attachedDocuments.length > 0 && (
                    <div className="pt-2">
                      <button
                        onClick={() => onViewDocument ? onViewDocument(c.attachedDocuments![0], c) : onEditCase(c)}
                        className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/80 text-cyan-300 transition flex items-center justify-center gap-1.5"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="truncate">Ver {c.attachedDocuments[0].title}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  {c.invoiceId ? (
                    <button
                      onClick={() => onViewInvoice(c.invoiceId!)}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ver Factura</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onCreateInvoice(c)}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Facturar</span>
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditCase(c)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar la cirugía de ${c.patientName}?`)) {
                          onDeleteCase(c.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
