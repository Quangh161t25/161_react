import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  generateSecurePassword,
  PasswordGeneratorOptions,
  calculatePasswordScore,
} from '../../services/passwordService';

interface PasswordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPassword?: (password: string) => void;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSelectPassword,
}) => {
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: 16,
    useUpper: true,
    useLower: true,
    useNumbers: true,
    useSymbols: true,
    excludeAmbiguous: false,
  });

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const pwd = generateSecurePassword(options);
    setGeneratedPassword(pwd);
  };

  useEffect(() => {
    if (isOpen) {
      handleGenerate();
    }
  }, [isOpen, options]);

  const handleCopy = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const score = calculatePasswordScore(generatedPassword);
  const getScoreColor = () => {
    if (score >= 80) return 'bg-emerald-500 text-emerald-600';
    if (score >= 60) return 'bg-amber-500 text-amber-600';
    return 'bg-rose-500 text-rose-600';
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col space-y-4 p-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Trình tạo Mật khẩu Ngẫu nhiên An toàn</h2>
              <p className="text-[11px] text-muted-foreground">Tạo mật khẩu mã hóa cao, chuẩn bảo mật doanh nghiệp</p>
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

        {/* Output Box */}
        <div className="bg-muted/60 p-3.5 rounded-xl border border-border flex items-center justify-between gap-2">
          <span className="font-mono text-base font-bold text-primary tracking-wide break-all select-all">
            {generatedPassword}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleGenerate}
              className="p-2 rounded-lg bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors"
              title="Tạo mới"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              title="Sao chép"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Strength Meter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Độ an toàn mật khẩu:</span>
            <span className={getScoreColor().split(' ')[1]}>
              {score >= 80 ? 'Rất mạnh' : score >= 60 ? 'Trung bình' : 'Yếu'} ({score}/100)
            </span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getScoreColor().split(' ')[0]}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 bg-muted/30 p-3.5 rounded-xl border border-border text-xs">
          <div>
            <div className="flex justify-between font-semibold text-foreground mb-1.5">
              <span>Độ dài mật khẩu:</span>
              <span className="font-mono font-bold text-primary">{options.length} ký tự</span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              value={options.length}
              onChange={(e) => setOptions({ ...options, length: Number(e.target.value) })}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 font-medium">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.useUpper}
                onChange={(e) => setOptions({ ...options, useUpper: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
              />
              <span>Chữ hoa (A-Z)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.useLower}
                onChange={(e) => setOptions({ ...options, useLower: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
              />
              <span>Chữ thường (a-z)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.useNumbers}
                onChange={(e) => setOptions({ ...options, useNumbers: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
              />
              <span>Chữ số (0-9)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.useSymbols}
                onChange={(e) => setOptions({ ...options, useSymbols: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
              />
              <span>Ký tự đặc biệt (!@#$)</span>
            </label>
            <label className="col-span-2 flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.excludeAmbiguous}
                onChange={(e) => setOptions({ ...options, excludeAmbiguous: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
              />
              <span>Tránh ký tự dễ nhầm lẫn (0, O, l, 1, I)</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
          >
            Đóng
          </button>
          {onSelectPassword ? (
            <button
              type="button"
              onClick={() => {
                onSelectPassword(generatedPassword);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Sử dụng mật khẩu này</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-sm"
            >
              <Copy className="w-4 h-4" />
              <span>{copied ? 'Đã sao chép!' : 'Sao chép mật khẩu'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
