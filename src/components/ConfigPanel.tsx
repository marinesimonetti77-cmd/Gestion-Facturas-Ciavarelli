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
  HelpCircle,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  ShieldCheck,
  Smartphone,
  Globe
} from 'lucide-react';
import { AppSettings } from '../types/surgical';
import { CurrencyCode, CURRENCY_MAP } from '../lib/currency';
import { AppUser, UserRole } from '../types/auth';

interface ConfigPanelProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onAddCatalogItem: (type: 'clinics' | 'surgeons' | 'insurances' | 'specialties', item: string) => void;
  onRemoveCatalogItem: (type: 'clinics' | 'surgeons' | 'insurances' | 'specialties', item: string) => void;
  onResetDemoData: () => void;
  users?: AppUser[];
  currentUser?: AppUser | null;
  onUpdatePassword?: (userId: string, newPass: string) => { success: boolean; message?: string };
  onAddUser?: (data: { username: string; fullName: string; role: UserRole; password: string; email?: string }) => { success: boolean; message?: string };
  onDeleteUser?: (userId: string) => { success: boolean; message?: string };
  requireAuth?: boolean;
  onToggleRequireAuth?: (val: boolean) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  settings,
  onUpdateSettings,
  onAddCatalogItem,
  onRemoveCatalogItem,
  onResetDemoData,
  users = [],
  currentUser,
  onUpdatePassword,
  onAddUser,
  onDeleteUser,
  requireAuth = true,
  onToggleRequireAuth,
}) => {
  const [newClinic, setNewClinic] = useState('');
  const [newSurgeon, setNewSurgeon] = useState('');
  const [newInsurance, setNewInsurance] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Password change state
  const [selectedUserToChangePass, setSelectedUserToChangePass] = useState<string>(currentUser?.id || (users[0]?.id || ''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordToast, setPasswordToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add User state
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('SECRETARY');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [addUserToast, setAddUserToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordToast(null);

    if (newPassword !== confirmPassword) {
      setPasswordToast({ type: 'error', message: 'Las contraseñas no coinciden.' });
      return;
    }

    if (newPassword.trim().length < 4) {
      setPasswordToast({ type: 'error', message: 'La contraseña debe contener al menos 4 caracteres.' });
      return;
    }

    if (onUpdatePassword) {
      const res = onUpdatePassword(selectedUserToChangePass, newPassword);
      if (res.success) {
        setPasswordToast({ type: 'success', message: res.message || 'Contraseña modificada correctamente.' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordToast({ type: 'error', message: res.message || 'Error al actualizar contraseña.' });
      }
    }
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserToast(null);

    if (!onAddUser) return;
    const res = onAddUser({
      username: newUsername,
      fullName: newFullName,
      role: newRole,
      password: newUserPass,
      email: newUserEmail,
    });

    if (res.success) {
      setAddUserToast({ type: 'success', message: res.message || 'Usuario creado exitosamente.' });
      setNewUsername('');
      setNewFullName('');
      setNewUserPass('');
      setNewUserEmail('');
      setIsAddingUser(false);
    } else {
      setAddUserToast({ type: 'error', message: res.message || 'Error al crear usuario.' });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>Configuración del Sistema & Seguridad</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestión de usuarios y contraseñas, clínicas, cirujanos, obras sociales y parámetros
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('¿Restablecer todos los casos, facturas y catálogos a los datos de prueba iniciales?')) {
              onResetDemoData();
            }
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          title="Restablecer base de datos inicial"
        >
          <RotateCcw className="w-4 h-4 text-rose-400" />
          <span>Restablecer Datos de Demostración</span>
        </button>
      </div>

      {/* SECTION 1: SEGURIDAD, USUARIOS Y CONTRASEÑAS */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/20 border-2 border-cyan-500/40 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Acceso con Usuario y Contraseña</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
                  Habilitado
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Permite ingresar desde cualquier celular, tablet o computadora sin requerir cuenta de Google.
              </p>
            </div>
          </div>

          {onToggleRequireAuth && (
            <label className="flex items-center gap-2 cursor-pointer bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 select-none hover:border-cyan-500/50 transition">
              <input
                type="checkbox"
                checked={requireAuth}
                onChange={e => onToggleRequireAuth(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
              <span>Exigir contraseña al abrir la app</span>
            </label>
          )}
        </div>

        {/* Informative Guidance Card for Multi-Device and GitHub Pages */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-cyan-300">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>¿Cómo ingresar desde otros dispositivos o fuera de Google?</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Puedes acceder directamente al sitio publicado en GitHub Pages (<strong className="text-slate-200">https://marinesimonetti77-cmd.github.io/Gestion-Facturas-Ciavarelli/</strong>) desde cualquier navegador privado, celular u oficina e ingresar con el usuario <strong className="text-cyan-300 font-mono">ciavarelli</strong> o <strong className="text-purple-300 font-mono">secretaria</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-[10px]">
              Día 20: Facturación & Cobros
            </span>
          </div>
        </div>

        {/* Sub-grid: Users List & Change Password Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Active Users */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Usuarios Habilitados ({users.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingUser(!isAddingUser)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isAddingUser ? 'Cerrar' : '+ Crear Usuario'}</span>
              </button>
            </div>

            {/* Add User Drawer / Form */}
            {isAddingUser && (
              <form onSubmit={handleCreateUserSubmit} className="p-3 bg-slate-900 border border-cyan-500/30 rounded-xl space-y-2.5 text-xs animate-fadeIn">
                <span className="font-bold text-white block">Nuevo Usuario de Acceso</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Usuario (Login)</label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      placeholder="ej: ayudante, auditor..."
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Nombre Completo</label>
                    <input
                      type="text"
                      value={newFullName}
                      onChange={e => setNewFullName(e.target.value)}
                      placeholder="Dr. / Lic. Nombre"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Rol / Perfil</label>
                    <select
                      value={newRole}
                      onChange={e => setNewRole(e.target.value as UserRole)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="DOCTOR">Cirujano</option>
                      <option value="SECRETARY">Administración / Secretaria</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Contraseña</label>
                    <input
                      type="password"
                      value={newUserPass}
                      onChange={e => setNewUserPass(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
                {addUserToast && (
                  <p className={`text-[11px] ${addUserToast.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {addUserToast.message}
                  </p>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingUser(false)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Guardar Usuario
                  </button>
                </div>
              </form>
            )}

            {/* List of users */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {users.map(u => (
                <div
                  key={u.id}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${u.avatarColor || 'from-cyan-500 to-blue-600'} flex items-center justify-center font-bold text-white text-[10px]`}>
                      {u.fullName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{u.fullName}</span>
                        {currentUser?.id === u.id && (
                          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono font-medium">
                            Tú
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Usuario: <strong className="text-cyan-300 font-mono">{u.username}</strong> · {u.roleLabel.split('(')[0].trim()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedUserToChangePass(u.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-medium transition cursor-pointer"
                    >
                      Cambiar Clave
                    </button>
                    {onDeleteUser && users.length > 1 && currentUser?.id !== u.id && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar al usuario ${u.username}?`)) {
                            onDeleteUser(u.id);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Change Password Form */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Lock className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Cambiar Contraseña
              </h4>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                  Usuario a modificar
                </label>
                <select
                  value={selectedUserToChangePass}
                  onChange={e => setSelectedUserToChangePass(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Mínimo 4 caracteres"
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repita la contraseña"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {passwordToast && (
                <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  passwordToast.type === 'success' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passwordToast.message}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer shadow-sm"
              >
                Actualizar Contraseña de Acceso
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* SECTION 2: General Settings: Currency & Tax */}
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
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
                Cirujanos & Profesionales ({settings.surgeons.length})
              </h3>
            </div>
          </div>

          <form onSubmit={handleAddSurgeon} className="flex gap-2">
            <input
              type="text"
              value={newSurgeon}
              onChange={e => setNewSurgeon(e.target.value)}
              placeholder="Nuevo cirujano..."
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

        {/* Insurance Catalog */}
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
              placeholder="Nueva cobertura médica..."
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
