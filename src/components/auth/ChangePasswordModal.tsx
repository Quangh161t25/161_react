import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setError(null);
    setSuccess(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword.trim()) {
      setError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (!newPassword.trim()) {
      setError('Vui lòng nhập mật khẩu mới.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setSuccess('Đổi mật khẩu thành công và đã đồng bộ lên hệ thống!');
        if (onSuccess) {
          onSuccess('Đổi mật khẩu thành công!');
        }
        setTimeout(() => {
          handleClose();
        }, 1200);
      } else {
        setError(res.error || 'Đổi mật khẩu thất bại. Vui lòng thử lại!');
      }
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="relative bg-card rounded-xl shadow-2xl border border-border/60 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ opacity: 1, transform: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-5">
          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 stroke-[2.2px]" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="change-password-title"
                className="text-lg font-bold text-foreground"
              >
                Đổi mật khẩu
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nhập mật khẩu hiện tại và mật khẩu mới để bảo mật tài khoản.
              </p>
            </div>
          </div>

          {/* Error / Success Alert */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Current Password */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Mật khẩu hiện tại
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
                  placeholder="••••••••"
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 pl-3 pr-10 placeholder:text-muted-foreground"
                  aria-required="true"
                  autoComplete="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  aria-label={showCurrentPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4 stroke-[2px]" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4 stroke-[2px]" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Mật khẩu mới
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
                  placeholder="••••••••"
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 pl-3 pr-10 placeholder:text-muted-foreground"
                  aria-required="true"
                  autoComplete="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4 stroke-[2px]" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4 stroke-[2px]" aria-hidden="true" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ít nhất 6 ký tự.</p>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Xác nhận mật khẩu mới
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
                  placeholder="••••••••"
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 pl-3 pr-10 placeholder:text-muted-foreground"
                  aria-required="true"
                  autoComplete="new-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 stroke-[2px]" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4 stroke-[2px]" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-border bg-background hover:bg-muted hover:text-foreground px-4 py-2 flex-1 rounded-lg h-10 text-xs font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 flex-1 rounded-lg h-10 text-xs font-semibold shadow-xs cursor-pointer gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Cập nhật mật khẩu'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
