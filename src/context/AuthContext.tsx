import React, { createContext, useContext, useState, useCallback } from 'react';
import { getInitialsAvatar, getSafeAvatarUrl } from '../utils/avatarUtils';

export interface AuthUser {
  id?: string;
  name: string;
  username: string;
  title: string;
  role: string;
  department: string;
  avatarUrl: string;
  isOnline: boolean;
  email?: string;
  phone?: string;
  code?: string;
}

export const DEFAULT_USER: AuthUser = {
  id: '1',
  name: 'Lê Minh Công',
  username: 'cong.lm',
  title: 'Tổng Giám Đốc',
  role: 'Ban Giám Đốc',
  department: 'Ban Giám Đốc',
  avatarUrl: getInitialsAvatar('Lê Minh Công', '#0f172a', '#ffffff'),
  isOnline: true,
  email: 'cong.le@company.vn',
  phone: '0901 234 567',
  code: 'emp-001',
};

interface AuthContextType {
  currentUser: AuthUser;
  isAuthenticated: boolean;
  login: (username: string, password?: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => void;
  updateCurrentUser: (partial: Partial<AuthUser>) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'erp_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load auth user from storage:', e);
    }
    return DEFAULT_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem(AUTH_STORAGE_KEY);
    } catch {
      return false;
    }
  });

  const login = useCallback(
    async (usernameInput: string, passwordInput?: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
      const cleanUsername = (usernameInput || '').trim();
      const cleanPassword = (passwordInput || '').trim();

      if (!cleanUsername) {
        return { success: false, error: 'Vui lòng nhập tên tài khoản!' };
      }

      try {
        const res = await fetch('/api/sheets/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: cleanUsername,
            password: cleanPassword,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return {
            success: false,
            error: data.error || 'Tên tài khoản hoặc mật khẩu không chính xác!',
          };
        }

        const matchedUser = data.user;
        const authUser: AuthUser = {
          id: matchedUser.id,
          name: matchedUser.name,
          username: matchedUser.username || cleanUsername,
          title: matchedUser.title || matchedUser.role || 'Nhân viên',
          role: matchedUser.role || 'Nhân viên',
          department: matchedUser.department || 'Phòng ban',
          avatarUrl: getSafeAvatarUrl(matchedUser.avatarUrl, matchedUser.name),
          isOnline: true,
          email: matchedUser.email,
          phone: matchedUser.phone,
          code: matchedUser.code,
        };

        setCurrentUser(authUser);
        setIsAuthenticated(true);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
        } catch (err) {
          console.warn('Failed to save auth user to storage:', err);
        }

        return { success: true, user: authUser };
      } catch (err: any) {
        console.error('Login request failed:', err);
        return {
          success: false,
          error: err?.message || 'Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau!',
        };
      }
    },
    []
  );

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear auth storage:', e);
    }
    setCurrentUser(DEFAULT_USER);
  }, []);

  const updateCurrentUser = useCallback((partial: Partial<AuthUser>) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist auth user:', e);
      }
      return updated;
    });
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
      if (!newPassword || !newPassword.trim()) {
        return { success: false, error: 'Mật khẩu mới không được để trống!' };
      }

      try {
        const res = await fetch('/api/sheets/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            userCode: currentUser.code,
            username: currentUser.username,
            currentPassword,
            newPassword,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return {
            success: false,
            error: data.error || 'Mật khẩu hiện tại không chính xác!',
          };
        }

        return { success: true };
      } catch (err: any) {
        console.error('Change password failed:', err);
        return {
          success: false,
          error: err?.message || 'Không thể kết nối đến máy chủ để đổi mật khẩu.',
        };
      }
    },
    [currentUser]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        logout,
        updateCurrentUser,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
