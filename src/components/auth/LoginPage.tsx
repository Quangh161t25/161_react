import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginPageProps {
  onLoginSuccess: (username: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Vui lòng nhập tên tài khoản');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        onLoginSuccess(result.user?.username || username);
      } else {
        setErrorMessage(result.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại!');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Có lỗi xảy ra trong quá trình đăng nhập.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSubmitted(true);
    setTimeout(() => {
      setForgotSubmitted(false);
      setForgotModalOpen(false);
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="flex min-h-screen w-full bg-background items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">
              Chào mừng trở lại
            </h2>
            <p className="text-muted-foreground mt-2">
              Nhập tên tài khoản và mật khẩu để truy cập.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Username Input */}
              <div>
                <div className="w-full">
                  <label
                    htmlFor="_r_5c_"
                    className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                  >
                    Tên tài khoản
                    <span
                      aria-hidden="true"
                      className="text-destructive ml-0.5 not-italic"
                      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                    >
                      *
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="_r_5c_"
                      aria-required="true"
                      className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground h-11 text-sm"
                      autoComplete="username"
                      placeholder="Điền tên đăng nhập"
                      type="text"
                      name="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium leading-none mb-2 block text-muted-foreground">
                    Mật khẩu
                    <span
                      className="text-red-500 ml-0.5 not-italic"
                      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                    >
                      *
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="text-xs font-medium text-primary hover:text-primary/80 hover:underline mb-2 cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <input
                    autoComplete="current-password"
                    className="flex h-11 w-full rounded-lg border bg-background pl-3 pr-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-border text-foreground"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-[18px] h-[18px]" aria-hidden="true" />
                    ) : (
                      <Eye className="w-[18px] h-[18px]" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                id="remember"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label
                htmlFor="remember"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Ghi nhớ đăng nhập
              </label>
            </div>

            {/* Submit Button */}
            <button
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 w-full h-11 text-base shadow-lg shadow-primary/20 cursor-pointer"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang đăng nhập...
                </span>
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 text-center text-xs text-muted-foreground w-full left-0 px-4">
          © 2024 Công ty. Bảo mật • Điều khoản sử dụng
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Quên mật khẩu</h3>
            {forgotSubmitted ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Nhập địa chỉ email liên kết với tài khoản của bạn để nhận liên kết khôi phục
                  mật khẩu.
                </p>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="email@congty.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-3 py-2 text-xs rounded-lg border border-border text-muted-foreground hover:bg-muted"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90"
                  >
                    Gửi liên kết
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
