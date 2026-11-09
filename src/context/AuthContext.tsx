import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSafeAvatarUrl } from '../utils/avatarUtils';
import { employeeService } from '../services/employeeService';

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

export const EMPTY_USER: AuthUser = {
  id: '',
  name: '',
  username: '',
  title: '',
  role: '',
  department: '',
  avatarUrl: '',
  isOnline: false,
};

// Deprecated fallback kept for compatibility; NEVER auto-authenticated!
export const DEFAULT_USER = EMPTY_USER;

interface AuthContextType {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  authError: string | null;
  clearAuthError: () => void;
  login: (username: string, password?: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => void;
  updateCurrentUser: (partial: Partial<AuthUser>) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  checkSessionWithDSNV: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'erp_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear auth storage:', e);
    }
  }, []);

  // Strict verification against Google Sheet / DSNV
  const verifySessionWithDSNV = useCallback(
    async (candidateUser?: AuthUser | null): Promise<boolean> => {
      const userToVerify = candidateUser || currentUser;
      if (!userToVerify || (!userToVerify.username && !userToVerify.code && !userToVerify.email && !userToVerify.id)) {
        logout();
        return false;
      }

      try {
        const res = await fetch('/api/sheets/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: userToVerify.id,
            code: userToVerify.code,
            username: userToVerify.username,
            name: userToVerify.name,
            email: userToVerify.email,
            phone: userToVerify.phone,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success && data.user) {
          const matchedUser = data.user;
          const verifiedUser: AuthUser = {
            id: matchedUser.id,
            name: matchedUser.name,
            username: matchedUser.username || userToVerify.username,
            title: matchedUser.title || matchedUser.role || 'Nhân viên',
            role: matchedUser.role || 'Nhân viên',
            department: matchedUser.department || 'Phòng ban',
            avatarUrl: getSafeAvatarUrl(matchedUser.avatarUrl, matchedUser.name),
            isOnline: true,
            email: matchedUser.email,
            phone: matchedUser.phone,
            code: matchedUser.code,
          };

          setCurrentUser(verifiedUser);
          setIsAuthenticated(true);
          setAuthError(null);

          // Update storage with verified user data
          try {
            if (localStorage.getItem(AUTH_STORAGE_KEY)) {
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(verifiedUser));
            } else if (sessionStorage.getItem(AUTH_STORAGE_KEY)) {
              sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(verifiedUser));
            }
          } catch {}

          return true;
        } else {
          console.warn('DSNV verification failed:', data.error);
          logout();
          setAuthError(data.error || 'Tài khoản không tồn tại trong Danh sách nhân viên (DSNV) hoặc đã nghỉ việc.');
          return false;
        }
      } catch (networkErr) {
        console.warn('Network error while verifying session, fallback to local DSNV cache:', networkErr);
        // Fallback: Check local DSNV cache
        const cachedEmployees = employeeService.getInitialEmployees();
        if (cachedEmployees.length > 0) {
          const targetCode = (userToVerify.code || '').toLowerCase().trim();
          const targetUsername = (userToVerify.username || '').toLowerCase().trim();
          const targetEmail = (userToVerify.email || '').toLowerCase().trim();
          const targetPhone = (userToVerify.phone || '').trim().replace(/[\s.-]/g, '');

          const match = cachedEmployees.find((e) => {
            const c = (e.code || '').toLowerCase().trim();
            const u = (e.username || '').toLowerCase().trim();
            const em = (e.email || '').toLowerCase().trim();
            const ph = (e.phone || '').trim().replace(/[\s.-]/g, '');
            return (
              (targetCode && c === targetCode) ||
              (targetUsername && u === targetUsername) ||
              (targetEmail && em === targetEmail) ||
              (targetPhone && ph === targetPhone)
            );
          });

          if (match && match.status !== 'resigned' && (match as any).isActiveAccount !== false) {
            setIsAuthenticated(true);
            setCurrentUser(userToVerify);
            setAuthError(null);
            return true;
          }
        }

        // Could not verify with DSNV
        logout();
        setAuthError('Không thể xác thực thông tin tài khoản với Danh sách nhân viên.');
        return false;
      }
    },
    [currentUser, logout]
  );

  // App initialization: check storage and verify against DSNV
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const rawUser =
          localStorage.getItem(AUTH_STORAGE_KEY) ||
          sessionStorage.getItem(AUTH_STORAGE_KEY);

        if (!rawUser) {
          if (isMounted) {
            setIsAuthenticated(false);
            setCurrentUser(null);
            setIsCheckingAuth(false);
          }
          return;
        }

        let parsed: AuthUser | null = null;
        try {
          parsed = JSON.parse(rawUser);
        } catch {
          parsed = null;
        }

        if (!parsed || (!parsed.username && !parsed.code && !parsed.email && !parsed.id)) {
          if (isMounted) {
            logout();
            setIsCheckingAuth(false);
          }
          return;
        }

        // Verify with DSNV before granting access
        await verifySessionWithDSNV(parsed);
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [logout, verifySessionWithDSNV]);

  const login = useCallback(
    async (
      usernameInput: string,
      passwordInput?: string,
      rememberMe: boolean = true
    ): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
      const cleanUsername = (usernameInput || '').trim();
      const cleanPassword = (passwordInput || '').trim();

      if (!cleanUsername) {
        return { success: false, error: 'Vui lòng nhập tên tài khoản!' };
      }

      setAuthError(null);

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
          const errMsg = data.error || 'Tên tài khoản hoặc mật khẩu không chính xác!';
          setAuthError(errMsg);
          return {
            success: false,
            error: errMsg,
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
        setAuthError(null);

        try {
          if (rememberMe) {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
            sessionStorage.removeItem(AUTH_STORAGE_KEY);
          } else {
            sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        } catch (err) {
          console.warn('Failed to save auth user to storage:', err);
        }

        return { success: true, user: authUser };
      } catch (err: any) {
        console.error('Login request failed:', err);
        const errMsg = err?.message || 'Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau!';
        setAuthError(errMsg);
        return {
          success: false,
          error: errMsg,
        };
      }
    },
    []
  );

  const updateCurrentUser = useCallback((partial: Partial<AuthUser>) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      try {
        if (localStorage.getItem(AUTH_STORAGE_KEY)) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
        } else if (sessionStorage.getItem(AUTH_STORAGE_KEY)) {
          sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
        }
      } catch (e) {
        console.warn('Failed to persist auth user:', e);
      }
      return updated;
    });
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
      if (!currentUser) {
        return { success: false, error: 'Chưa đăng nhập!' };
      }

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
        isCheckingAuth,
        authError,
        clearAuthError,
        login,
        logout,
        updateCurrentUser,
        changePassword,
        checkSessionWithDSNV: verifySessionWithDSNV,
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
