export type UserRole = 'DOCTOR' | 'SECRETARY' | 'ADMIN';

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  roleLabel: string;
  avatarColor: string;
  email?: string;
  password: string; // Stored securely for standalone / offline / GitHub Pages access
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  requireAuth: boolean;
  users: AppUser[];
}
