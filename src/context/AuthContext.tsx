import React, { createContext, useContext, useState, useCallback } from 'react';
import { employeeService } from '../services/employeeService';
import { Employee } from '../types/employee';

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
  avatarUrl: 'https://ui-avatars.com/api/?name=Le+Minh+Cong&background=0f172a&color=fff',
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
      const cleanUsername = (usernameInput || '').trim().toLowerCase();
      const cleanPassword = (passwordInput || '').trim();

      if (!cleanUsername) {
        return { success: false, error: 'Vui lòng nhập tên tài khoản!' };
      }

      // Fetch or get latest employee list (from Google Sheets or cache)
      let employees: Employee[] = [];
      try {
        employees = await employeeService.fetchFromSheet();
      } catch {
        employees = employeeService.getInitialEmployees();
      }

      if (!employees || employees.length === 0) {
        employees = employeeService.getInitialEmployees();
      }

      // 1. Special Admin Account match
      if (cleanUsername === 'admin') {
        if (cleanPassword && cleanPassword !== 'admin123' && cleanPassword !== '123456') {
          return { success: false, error: 'Mật khẩu cho tài khoản admin không chính xác!' };
        }
        const adminUser: AuthUser = {
          ...DEFAULT_USER,
          username: 'admin',
        };
        setCurrentUser(adminUser);
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
        return { success: true, user: adminUser };
      }

      // 2. Search against employee list
      const matchedEmp = employees.find((emp) => {
        const u = (emp.username || '').toLowerCase().trim();
        const code = (emp.code || '').toLowerCase().trim();
        const email = (emp.email || '').toLowerCase().trim();
        const name = (emp.name || '').toLowerCase().trim();
        return u === cleanUsername || code === cleanUsername || email === cleanUsername || name === cleanUsername;
      });

      if (!matchedEmp) {
        return {
          success: false,
          error: `Không tìm thấy tài khoản "${usernameInput}". Vui lòng kiểm tra lại tên đăng nhập hoặc mã nhân viên!`,
        };
      }

      // Check Password
      const expectedPassword = (matchedEmp.password || '123456').trim();
      if (cleanPassword && cleanPassword !== expectedPassword) {
        return {
          success: false,
          error: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại!',
        };
      }

      const authUser: AuthUser = {
        id: matchedEmp.id,
        name: matchedEmp.name,
        username: matchedEmp.username || cleanUsername,
        title: matchedEmp.role || 'Nhân viên',
        role: matchedEmp.role || 'Nhân viên',
        department: matchedEmp.department || 'Phòng Kỹ thuật',
        avatarUrl:
          matchedEmp.avatarUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedEmp.name)}&background=1d4ed8&color=fff`,
        isOnline: true,
        email: matchedEmp.email,
        phone: matchedEmp.phone,
        code: matchedEmp.code,
      };

      setCurrentUser(authUser);
      setIsAuthenticated(true);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      } catch (err) {
        console.warn('Failed to save auth user to storage:', err);
      }

      return { success: true, user: authUser };
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

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        logout,
        updateCurrentUser,
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
