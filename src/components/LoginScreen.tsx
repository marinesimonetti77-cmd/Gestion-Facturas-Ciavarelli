import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Activity,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { INITIAL_USERS } from '../lib/useAuth';

interface LoginScreenProps {
  onLogin: (username: string, pass: string) => { success: boolean; message?: string };
  onBypass?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onBypass }) => {
  const [username, setUsername] = useState('ciavarelli');
  const [password, setPassword] = useState('ciavarelli2026');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const result = onLogin(username, password);
    if (!result.success) {
      setErrorMsg(result.message || 'Credenciales incorrectas');
    }
  };

  const handleSelectQuickUser = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-cyan-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-blue-600/15 to-purple-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* App Branding Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/20 ring-1 ring-white/20 mb-1">
            <Activity className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Dr. Ciavarelli
            </h1>
            <p className="text-xs sm:text-sm font-medium text-cyan-400">
              Cirugías & Control de Facturación
            </p>
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Portal seguro para gestión de partes quirúrgicos, liquidaciones sanatoriales y calendario de cobro.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Iniciar Sesión con Contraseña
              </span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
              Acceso Seguro
            </span>
          </div>

          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-500/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Usuario o Correo</span>
                <span className="text-[10px] text-slate-500 font-normal">Cualquier dispositivo</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Ej: ciavarelli, secretaria o tu email"
                  required
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Contraseña</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition font-medium font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                />
                <span>Recordar sesión en este equipo</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Ingresar al Sistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Pre-configured Profiles for Ease of Access */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Cuentas habilitadas:
              </span>
              <span className="text-[10px] text-slate-500">Clic para rellenar</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleSelectQuickUser('ciavarelli', 'ciavarelli2026')}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between text-xs cursor-pointer ${
                  username === 'ciavarelli'
                    ? 'bg-cyan-950/60 border-cyan-500/70 text-cyan-200'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold text-[10px]">
                    MC
                  </div>
                  <div>
                    <span className="font-bold text-white block text-xs">Dr. Miguel Ciavarelli</span>
                    <span className="text-[10px] text-slate-400">Usuario: <strong className="text-cyan-300 font-mono">ciavarelli</strong></span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">ciavarelli2026</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickUser('secretaria', 'admin2026')}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between text-xs cursor-pointer ${
                  username === 'secretaria'
                    ? 'bg-purple-950/60 border-purple-500/70 text-purple-200'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-[10px]">
                    AF
                  </div>
                  <div>
                    <span className="font-bold text-white block text-xs">Administración & Facturación</span>
                    <span className="text-[10px] text-slate-400">Usuario: <strong className="text-purple-300 font-mono">secretaria</strong></span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">admin2026</span>
              </button>
            </div>
          </div>
        </div>

        {/* Informative Note for Multiple Devices & Standalone Access */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
            <Info className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>Acceso sin restricción de cuenta Google</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Puedes abrir la aplicación desde tu teléfono, tablet, otra computadora o desde el link de <strong>GitHub Pages</strong> usando este usuario y contraseña, sin necesidad de tener abierta la cuenta de correo <em>somosconerix@gmail.com</em>.
          </p>
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80 flex items-center justify-between">
            <span>¿Quieres cambiar la contraseña?</span>
            <span className="text-cyan-400 font-medium">Podrás hacerlo dentro del menú Configuración</span>
          </div>
        </div>

        {onBypass && (
          <div className="text-center pt-1">
            <button
              onClick={onBypass}
              className="text-xs text-slate-500 hover:text-slate-300 underline transition cursor-pointer"
            >
              Ingresar en modo de solo lectura / omitir login por ahora
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
