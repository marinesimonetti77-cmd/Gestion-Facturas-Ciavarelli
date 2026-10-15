import React, { useState } from 'react';
import {
  Settings,
  Building2,
  User,
  Shield,
  DollarSign,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Save,
  HelpCircle
} from 'lucide-react';
import { AppSettings } from '../types/surgical';
import { CurrencyCode, CURRENCY_MAP } from '../lib/currency';

interface ConfigPanelProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onAddCatalogItem: (type: 'clinics' | 'surgeons' | 'insurances' | 'specialties', item: string) => void;
  onRemoveCatalogItem: (type: 'clinics' | 'surgeons' | 'insurances' | 'specialties', item: string) => void;
  onResetDemoData: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  settings,
  onUpdateSettings,
  onAddCatalogItem,
  onRemoveCatalogItem,
  onResetDemoData,
}) => {
  const [newClinic, setNewClinic] = useState('');
  const [newSurgeon, setNewSurgeon] = useState('');
  const [newInsurance, setNewInsurance] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleAddClinic = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClinic.trim()) {
      onAddCatalogItem('clinics', newClinic);
      setNewClinic('');
    }
  };

  const handleAddSurgeon = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSurgeon.trim()) {
      onAddCatalogItem('surgeons', newSurgeon);
      setNewSurgeon('');
    }
  };

  const handleAddInsurance = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInsurance.trim()) {
      onAddCatalogItem('insurances', newInsurance);
      setNewInsurance('');
    }
  };

  const handleAddSpecialty = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSpecialty.trim()) {
      onAddCatalogItem('specialties', newSpecialty);
      setNewSpecialty('');
    }
  };

  const handleSaveGeneral = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>Configuración de Catálogos & Parámetros</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Personalice clínicas, cirujanos, prepagas y monedas según la operación de su equipo
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('¿Restablecer todos los casos, facturas y catálogos a los datos de prueba iniciales?')) {
              onResetDemoData();
            }
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 rounded-lg text-xs font-semibold transition"
          title="Restablecer base de datos inicial"
        >
          <RotateCcw className="w-4 h-4 text-rose-400" />
          <span>Restablecer Datos de Demostración</span>
        </button>
      </div>

      {/* General Settings: Currency & Tax */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>Moneda & Parámetros Financieros</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Moneda Principal de la Aplicación
            </label>
            <select
              value={settings.defaultCurrency}
              onChange={e => onUpdateSettings({ defaultCurrency: e.target.value as CurrencyCode })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {Object.keys(CURRENCY_MAP).map(code => (
                <option key={code} value={code}>
                  {code} ({CURRENCY_MAP[code as CurrencyCode].symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tasa Impositiva por Defecto (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={settings.defaultTaxRate}
              onChange={e => onUpdateSettings({ defaultTaxRate: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSaveGeneral}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Parámetros</span>
            </button>
          </div>
        </div>

        {showSavedToast && (
          <p className="text-xs text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>Configuración financiera guardada exitosamente.</span>
          </p>
        )}
      </div>

      {/* Catalog Editors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clinics Catalog */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">
                Clínicas & Sanatorios ({settings.clinics.length})
              </h3>
            </div>
          </div>

          <form onSubmit={handleAddClinic} className="flex gap-2">
            <input
              type="text"
              value={newClinic}
              onChange={e => setNewClinic(e.target.value)}
              placeholder="Nueva clínica o sanatorio..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {settings.clinics.map(clinic => (
              <li
                key={clinic}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-200"
              >
                <span>{clinic}</span>
                {settings.clinics.length > 1 && (
                  <button
                    onClick={() => onRemoveCatalogItem('clinics', clinic)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Eliminar de la lista"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Surgeons Catalog */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">
                Cirujanos & Especialistas ({settings.surgeons.length})
              </h3>
            </div>
          </div>

          <form onSubmit={handleAddSurgeon} className="flex gap-2">
            <input
              type="text"
              value={newSurgeon}
              onChange={e => setNewSurgeon(e.target.value)}
              placeholder="Ej. Dr. Mario Santos (Cirugía General)..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {settings.surgeons.map(surgeon => (
              <li
                key={surgeon}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-200"
              >
                <span>{surgeon}</span>
                {settings.surgeons.length > 1 && (
                  <button
                    onClick={() => onRemoveCatalogItem('surgeons', surgeon)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Eliminar de la lista"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Insurances Catalog */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Obras Sociales & Prepagas ({settings.insurances.length})
              </h3>
            </div>
          </div>

          <form onSubmit={handleAddInsurance} className="flex gap-2">
            <input
              type="text"
              value={newInsurance}
              onChange={e => setNewInsurance(e.target.value)}
              placeholder="Ej. Medicus, IOMA, OSDE..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {settings.insurances.map(ins => (
              <li
                key={ins}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-200"
              >
                <span>{ins}</span>
                {settings.insurances.length > 1 && (
                  <button
                    onClick={() => onRemoveCatalogItem('insurances', ins)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Eliminar de la lista"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Specialties Catalog */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Especialidades Quirúrgicas ({settings.specialties.length})
              </h3>
            </div>
          </div>

          <form onSubmit={handleAddSpecialty} className="flex gap-2">
            <input
              type="text"
              value={newSpecialty}
              onChange={e => setNewSpecialty(e.target.value)}
              placeholder="Ej. Oftalmología, Cirugía Plástica..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {settings.specialties.map(spec => (
              <li
                key={spec}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-200"
              >
                <span>{spec}</span>
                {settings.specialties.length > 1 && (
                  <button
                    onClick={() => onRemoveCatalogItem('specialties', spec)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Eliminar de la lista"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
