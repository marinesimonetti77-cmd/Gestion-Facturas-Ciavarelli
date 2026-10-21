import { useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types/auth';

const STORAGE_KEY_AUTH_USERS = 'ciavarelli_users_v1';
const STORAGE_KEY_CURRENT_USER = 'ciavarelli_current_user_v1';
const STORAGE_KEY_REQUIRE_AUTH = 'ciavarelli_require_auth_v1';

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'user-ciavarelli',
    username: 'ciavarelli',
    fullName: 'Dr. Miguel Ángel Ciavarelli',
    role: 'DOCTOR',
    roleLabel: 'Cirujano Titular (MN 70212 | MP 440703)',
    avatarColor: 'from-blue-600 to-cyan-500',
    email: 'miguel.ciavarelli@cirugia.com.ar',
    password: 'ciavarelli2026',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-secretaria',
    username: 'secretaria',
    fullName: 'Administración & Facturación',
    role: 'SECRETARY',
    roleLabel: 'Gestión Contable & Obras Sociales',
    avatarColor: 'from-purple-600 to-pink-500',
    email: 'administracion@cirugia.com.ar',
    password: 'admin2026',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-marine',
    username: 'marine',
    fullName: 'Marine Simonetti',
    role: 'ADMIN',
    roleLabel: 'Coordinación & Dirección',
    avatarColor: 'from-emerald-600 to-teal-500',
    email: 'somosconerix@gmail.com',
    password: 'ciavarelli2026',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export function useAuth() {
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_USERS);
      if (!saved) return INITIAL_USERS;
      const parsed: AppUser[] = JSON.parse(saved);
      // Ensure default users always exist
      const hasCiavarelli = parsed.some(u => u.username.toLowerCase() === 'ciavarelli');
      return hasCiavarelli ? parsed : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (!saved) return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [requireAuth, setRequireAuthState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REQUIRE_AUTH);
      if (saved === null) return true; // Required by default
      return JSON.parse(saved);
    } catch {
      return true;
    }
  });

  // Sync users to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AUTH_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users', e);
    }
  }, [users]);

  // Sync current user session
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch (e) {
      console.error('Failed to save user session', e);
    }
  }, [currentUser]);

  // Sync requireAuth setting
  const setRequireAuth = (val: boolean) => {
    setRequireAuthState(val);
    try {
      localStorage.setItem(STORAGE_KEY_REQUIRE_AUTH, JSON.stringify(val));
    } catch (e) {
      console.error(e);
    }
  };

  const login = (usernameOrEmail: string, passwordAttempt: string): { success: boolean; message?: string } => {
    const cleanInput = usernameOrEmail.trim().toLowerCase();
    const cleanPass = passwordAttempt.trim();

    if (!cleanInput || !cleanPass) {
      return { success: false, message: 'Por favor complete el usuario y la contraseña.' };
    }

    const matchedUser = users.find(
      u => u.username.toLowerCase() === cleanInput || (u.email && u.email.toLowerCase() === cleanInput)
    );

    if (!matchedUser) {
      return { success: false, message: 'Usuario no encontrado. Verifique el nombre ingresado.' };
    }

    if (matchedUser.password !== cleanPass) {
      return { success: false, message: 'Contraseña incorrecta. Por favor intente nuevamente.' };
    }

    const updatedUser: AppUser = {
      ...matchedUser,
      lastLogin: new Date().toISOString(),
    };

    setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    } catch (e) {
      console.error(e);
    }
  };

  const changePassword = (userId: string, newPass: string): { success: boolean; message?: string } => {
    const clean = newPass.trim();
    if (clean.length < 4) {
      return { success: false, message: 'La contraseña debe tener al menos 4 caracteres.' };
    }

    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updated = { ...u, password: clean };
          if (currentUser?.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );

    return { success: true, message: 'Contraseña actualizada con éxito.' };
  };

  const addUser = (userData: {
    username: string;
    fullName: string;
    role: UserRole;
    password: string;
    email?: string;
  }): { success: boolean; message?: string } => {
    const cleanUsername = userData.username.trim().toLowerCase();
    if (!cleanUsername || !userData.fullName.trim() || !userData.password.trim()) {
      return { success: false, message: 'Todos los campos obligatorios deben completarse.' };
    }

    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: `El usuario '${cleanUsername}' ya existe.` };
    }

    const roleLabels: Record<UserRole, string> = {
      DOCTOR: 'Cirujano Titular',
      SECRETARY: 'Administración & Cobranzas',
      ADMIN: 'Administrador del Sistema',
    };

    const colors: Record<UserRole, string> = {
      DOCTOR: 'from-blue-600 to-cyan-500',
      SECRETARY: 'from-purple-600 to-pink-500',
      ADMIN: 'from-emerald-600 to-teal-500',
    };

    const newUser: AppUser = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      fullName: userData.fullName.trim(),
      role: userData.role,
      roleLabel: roleLabels[userData.role],
      avatarColor: colors[userData.role],
      email: userData.email?.trim(),
      password: userData.password.trim(),
      createdAt: new Date().toISOString(),
    };

    setUsers(prev => [...prev, newUser]);
    return { success: true, message: `Usuario ${newUser.username} creado correctamente.` };
  };

  const deleteUser = (userId: string): { success: boolean; message?: string } => {
    if (users.length <= 1) {
      return { success: false, message: 'No puede eliminar todos los usuarios del sistema.' };
    }
    if (currentUser?.id === userId) {
      return { success: false, message: 'No puede eliminar el usuario con el que tiene la sesión activa.' };
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    return { success: true, message: 'Usuario eliminado.' };
  };

  return {
    users,
    currentUser,
    isAuthenticated: requireAuth ? currentUser !== null : true,
    requireAuth,
    setRequireAuth,
    login,
    logout,
    changePassword,
    addUser,
    deleteUser,
  };
}
