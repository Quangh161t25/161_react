import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  Check,
} from 'lucide-react';
import { PasswordVaultSettings } from '../../types/password';
import { simpleHash, passwordService } from '../../services/passwordService';

interface MasterPinModalProps {
  isOpen: boolean;
  mode: 'unlock' | 'setup' | 'change';
  vaultSettings: PasswordVaultSettings;
  onClose: () => void;
  onSuccess: (updatedSettings: PasswordVaultSettings) => void;
}

export const MasterPinModal: React.FC<MasterPinModalProps> = ({
  isOpen,
  mode,
  vaultSettings,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setError('Vui lòng nhập mã PIN!');
      return;
    }

    if (vaultSettings.masterPinHash) {
      const hashed = simpleHash(pin);
      if (hashed !== vaultSettings.masterPinHash) {
        setError('Mã PIN không chính xác, vui lòng thử lại!');
        return;
      }
    }

    onSuccess({
      ...vaultSettings,
      lastUnlockedTime: Date.now(),
    });
    onClose();
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('Mã PIN phải có ít nhất 4 chữ số!');
      return;
    }
    if (pin !== confirmPin) {
      setError('Mã PIN xác nhận không trùng khớp!');
      return;
    }

    const newSettings: PasswordVaultSettings = {
      ...vaultSettings,
      isMasterPinEnabled: true,
      masterPinHash: simpleHash(pin),
      lastUnlockedTime: Date.now(),
    };

    passwordService.saveVaultSettings(newSettings);
    onSuccess(newSettings);
    onClose();
  };

  const handleChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (vaultSettings.masterPinHash) {
      if (simpleHash(currentPin) !== vaultSettings.masterPinHash) {
        setError('Mã PIN hiện tại không chính xác!');
        return;
      }
    }

    if (pin.length < 4) {
      setError('Mã PIN mới phải có ít nhất 4 chữ số!');
      return;
    }
    if (pin !== confirmPin) {
      setError('Mã PIN xác nhận không trùng khớp!');
      return;
    }

    const newSettings: PasswordVaultSettings = {
      ...vaultSettings,
      isMasterPinEnabled: true,
      masterPinHash: simpleHash(pin),
      lastUnlockedTime: Date.now(),
    };

    passwordService.saveVaultSettings(newSettings);
    onSuccess(newSettings);
    onClose();
  };

  const handleDisablePin = () => {
    const newSettings: PasswordVaultSettings = {
      ...vaultSettings,
      isMasterPinEnabled: false,
      masterPinHash: undefined,
    };
    passwordService.saveVaultSettings(newSettings);
    onSuccess(newSettings);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card w-full max-w-sm rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col space-y-4 p-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              {mode === 'unlock' ? <Lock className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {mode === 'unlock'
                  ? 'Mở khóa Két Mật khẩu (Vault)'
                  : mode === 'setup'
                  ? 'Thiết lập Mã PIN Bảo vệ'
                  : 'Đổi Mã PIN Master'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {mode === 'unlock'
                  ? 'Nhập mã PIN cá nhân để xem chi tiết mật khẩu'
                  : 'Bảo vệ an toàn kho dữ liệu tài khoản của bạn'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        {mode === 'unlock' && (
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Mã PIN Master:</label>
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(null);
                }}
                autoFocus
                placeholder="Nhập mã PIN của bạn..."
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-center text-lg tracking-widest font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-all shadow-xs active:scale-95"
            >
              <Unlock className="w-4 h-4" />
              <span>Mở khóa Vault</span>
            </button>
          </form>
        )}

        {(mode === 'setup' || mode === 'change') && (
          <form onSubmit={mode === 'setup' ? handleSetup : handleChange} className="space-y-3">
            {mode === 'change' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Mã PIN hiện tại:</label>
                <input
                  type="password"
                  maxLength={8}
                  value={currentPin}
                  onChange={(e) => {
                    setCurrentPin(e.target.value);
                    setError(null);
                  }}
                  placeholder="Nhập PIN cũ..."
                  className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Mã PIN mới (4-8 số):</label>
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(null);
                }}
                placeholder="Đặt mã PIN mới..."
                className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Xác nhận mã PIN mới:</label>
              <input
                type="password"
                maxLength={8}
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value);
                  setError(null);
                }}
                placeholder="Nhập lại mã PIN..."
                className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                className="w-full h-9 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-all shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Lưu cấu hình PIN</span>
              </button>

              {vaultSettings.isMasterPinEnabled && (
                <button
                  type="button"
                  onClick={handleDisablePin}
                  className="w-full h-8 rounded-xl border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 font-semibold text-xs transition-colors"
                >
                  Tắt mã PIN bảo vệ
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
