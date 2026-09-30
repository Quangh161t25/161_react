import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Star,
  ExternalLink,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { PasswordItem, PasswordCategory } from '../../types/password';
import { PASSWORD_CATEGORIES } from '../../data/passwords';
import { calculatePasswordScore } from '../../services/passwordService';
import { PasswordGeneratorModal } from './PasswordGeneratorModal';

interface PasswordFormDrawerProps {
  mode: 'create' | 'edit';
  passwordItem?: PasswordItem | null;
  allPasswords?: PasswordItem[];
  onClose: () => void;
  onSave: (item: PasswordItem) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';

export const PasswordFormDrawer: React.FC<PasswordFormDrawerProps> = ({
  mode,
  passwordItem,
  allPasswords = [],
  onClose,
  onSave,
}) => {
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('normal');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('normal');

  // Form Fields
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PasswordCategory>('web');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pinOr2FA, setPinOr2FA] = useState('');
  const [note, setNote] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  // Generator modal inside drawer
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === 'edit' && passwordItem) {
      setCode(passwordItem.code || '');
      setTitle(passwordItem.title || '');
      setCategory(passwordItem.category || 'web');
      setUrl(passwordItem.url || '');
      setUsername(passwordItem.username || '');
      setPassword(passwordItem.password || '');
      setPinOr2FA(passwordItem.pinOr2FA || '');
      setNote(passwordItem.note || '');
      setTags(passwordItem.tags || []);
      setIsFavorite(!!passwordItem.isFavorite);
    } else {
      // Auto-generate code
      const nextNum = allPasswords.length + 1;
      setCode(`MK-${String(nextNum).padStart(3, '0')}`);
      setTitle('');
      setCategory('web');
      setUrl('');
      setUsername('');
      setPassword('');
      setPinOr2FA('');
      setNote('');
      setTags(['Công việc']);
      setIsFavorite(false);
    }
  }, [mode, passwordItem, allPasswords]);

  const toggleFullscreen = () => {
    if (widthMode === 'fullscreen') {
      setWidthMode(prevWidthMode);
    } else {
      setPrevWidthMode(widthMode);
      setWidthMode('fullscreen');
    }
  };

  const widthClasses: Record<DrawerWidthMode, string> = {
    narrow: 'w-full md:max-w-md',
    normal: 'w-full md:max-w-xl',
    wide: 'w-full md:max-w-3xl',
    fullscreen: 'w-full max-w-full',
  };

  const handleAddTag = (t: string) => {
    const trimmed = t.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Vui lòng nhập tên dịch vụ / website';
    if (!username.trim()) errs.username = 'Vui lòng nhập tên đăng nhập hoặc email';
    if (!password) errs.password = 'Vui lòng nhập mật khẩu';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const score = calculatePasswordScore(password);

    const payload: PasswordItem = {
      id: passwordItem?.id || 'pw_' + Date.now(),
      code: code.trim(),
      title: title.trim(),
      category,
      url: url.trim(),
      username: username.trim(),
      password,
      pinOr2FA: pinOr2FA.trim(),
      note: note.trim(),
      tags,
      isFavorite,
      securityScore: score,
      lastChangedDate: nowStr.split(' ')[0],
      createdAt: passwordItem?.createdAt || nowStr,
      updatedAt: nowStr,
    };

    onSave(payload);
  };

  const passwordScore = calculatePasswordScore(password);

  return (
    <>
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 md:pl-10">
          <div
            className={`${widthClasses[widthMode]} flex flex-col bg-card border-l border-border shadow-2xl transition-all duration-300 ease-in-out`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground leading-tight">
                    {mode === 'create' ? 'Thêm Tài khoản & Mật khẩu mới' : `Cập nhật Tài khoản: ${code}`}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Lưu trữ an toàn, mã hóa và tự động đồng bộ tiện ích trình duyệt
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Width Controls */}
                <div className="hidden md:flex items-center border border-border rounded-lg bg-background p-0.5 mr-1">
                  <button
                    type="button"
                    title="Gọn"
                    onClick={() => setWidthMode('narrow')}
                    className={`p-1 rounded text-xs transition-colors ${
                      widthMode === 'narrow' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <PanelRightClose className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Vừa"
                    onClick={() => setWidthMode('normal')}
                    className={`p-1 rounded text-xs transition-colors ${
                      widthMode === 'normal' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <PanelRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Rộng"
                    onClick={() => setWidthMode('wide')}
                    className={`p-1 rounded text-xs transition-colors ${
                      widthMode === 'wide' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <PanelRightOpen className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title={widthMode === 'fullscreen' ? 'Thu nhỏ' : 'Toàn màn hình'}
                    onClick={toggleFullscreen}
                    className={`p-1 rounded text-xs transition-colors ${
                      widthMode === 'fullscreen' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {widthMode === 'fullscreen' ? (
                      <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
              {/* Code & Favorite */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Mã tài khoản:
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-8 px-3 rounded-xl border border-border bg-background text-xs font-mono font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between pt-5">
                  <button
                    type="button"
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      isFavorite
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-600'
                        : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
                    <span>{isFavorite ? 'Đã ghim Yêu thích' : 'Đánh dấu Yêu thích'}</span>
                  </button>
                </div>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Tên dịch vụ / Ứng dụng <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Google Workspace, Facebook Fanpage, Server VPS HCM..."
                    className={`w-full h-8 px-3 rounded-xl border bg-background text-xs focus:outline-none focus:ring-1 ${
                      errors.title ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border focus:ring-primary'
                    }`}
                  />
                  {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Phân loại danh mục:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PasswordCategory)}
                    className="w-full h-8 px-3 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {PASSWORD_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Địa chỉ Website / Link đăng nhập:
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full h-8 pl-3 pr-8 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                        title="Mở liên kết"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Username & Password */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Tên đăng nhập / Email / SĐT <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="VD: admin@domain.com hoặc username"
                    className={`w-full h-8 px-3 rounded-xl border bg-background text-xs focus:outline-none focus:ring-1 ${
                      errors.username ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border focus:ring-primary'
                    }`}
                  />
                  {errors.username && <p className="text-[11px] text-rose-500 mt-1">{errors.username}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-foreground">
                      Mật khẩu <span className="text-rose-500">*</span>:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsGeneratorOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Tạo mật khẩu ngẫu nhiên</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className={`w-full h-8 pl-3 pr-10 rounded-xl border bg-background font-mono text-xs focus:outline-none focus:ring-1 ${
                        errors.password ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border focus:ring-primary'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[11px] text-rose-500 mt-1">{errors.password}</p>}

                  {/* Password strength visual */}
                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Độ mạnh mật khẩu:</span>
                        <span className={passwordScore >= 80 ? 'text-emerald-600 font-bold' : passwordScore >= 60 ? 'text-amber-600 font-bold' : 'text-rose-600 font-bold'}>
                          {passwordScore >= 80 ? 'Rất mạnh' : passwordScore >= 60 ? 'Trung bình' : 'Yếu'} ({passwordScore}/100)
                        </span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            passwordScore >= 80 ? 'bg-emerald-500' : passwordScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${passwordScore}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Mã PIN / Khóa bảo mật 2FA / Khóa phụ:
                  </label>
                  <input
                    type="text"
                    value={pinOr2FA}
                    onChange={(e) => setPinOr2FA(e.target.value)}
                    placeholder="VD: PIN: 123456, hoặc 2FA Authenticator, YubiKey..."
                    className="w-full h-8 px-3 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nhãn phân loại (Tags):
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-border bg-background min-h-[36px]">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-medium"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-rose-500"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag(tagInput);
                      }
                    }}
                    placeholder="Nhập tag và nhấn Enter..."
                    className="flex-1 bg-transparent text-xs focus:outline-none min-w-[120px]"
                  />
                </div>
                {/* Suggestions */}
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-muted-foreground">
                  <span>Gợi ý:</span>
                  {['Công việc', 'Cá nhân', 'Khẩn cấp', 'Quản trị', 'Ngân hàng'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddTag(sug)}
                      className="hover:text-primary underline cursor-pointer"
                    >
                      +{sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Ghi chú bổ sung:
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú quy trình đăng nhập, cổng kết nối, người nắm giữ..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary custom-scrollbar resize-none"
                />
              </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-muted/40">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-sm transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{mode === 'create' ? 'Lưu tài khoản mới' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Generator Modal */}
      <PasswordGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onSelectPassword={(newPass) => {
          setPassword(newPass);
          setShowPassword(true);
        }}
      />
    </>
  );
};
