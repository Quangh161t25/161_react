import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Upload,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { PasswordItem } from '../../types/password';
import { passwordService } from '../../services/passwordService';

interface ExtensionSyncModalProps {
  isOpen: boolean;
  passwords: PasswordItem[];
  onClose: () => void;
  onImportSuccess?: (items: PasswordItem[]) => void;
}

export const ExtensionSyncModal: React.FC<ExtensionSyncModalProps> = ({
  isOpen,
  passwords,
  onClose,
  onImportSuccess,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'token' | 'guide'>('token');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const syncPayload = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    vaultName: 'H161 ERP Password Vault',
    itemCount: passwords.length,
    items: passwords,
  };

  const payloadString = JSON.stringify(syncPayload, null, 2);

  const handleCopyToken = () => {
    navigator.clipboard.writeText(payloadString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(payloadString);
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `erp_passwords_sync_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        const imported = passwordService.importFromExtensionPayload(parsed);
        if (onImportSuccess) {
          onImportSuccess(imported);
        }
        setImportStatus(`Đã nhập thành công ${imported.length} tài khoản!`);
        setTimeout(() => setImportStatus(null), 3000);
      } catch (err: any) {
        setImportStatus('Lỗi file JSON không đúng định dạng!');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col space-y-4 p-5 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Liên kết & Đồng bộ với Extension Trình duyệt</h2>
              <p className="text-[11px] text-muted-foreground">
                Tự động điền mật khẩu và tra cứu tức thì trên Google Chrome / Microsoft Edge
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

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('token')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'token'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Mã Sync Token & Tệp sao lưu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'guide'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Hướng dẫn cài Extension (30s)</span>
          </button>
        </div>

        {/* Tab 1: Token & Backup */}
        {activeTab === 'token' && (
          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
            {/* Sync Token Card */}
            <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground">Mã Sync Token (Đồng bộ tức thì)</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Sao chép mã này và dán vào tab <strong>Đồng bộ</strong> trên Extension ERP PassVault.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã chép Token' : 'Sao chép Token'}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={payloadString}
                className="w-full h-28 bg-background border border-border rounded-lg p-2.5 font-mono text-[11px] text-foreground focus:outline-none resize-none custom-scrollbar select-all"
              />
            </div>

            {/* Import / Export Files */}
            <div className="bg-muted/20 p-4 rounded-xl border border-border space-y-3">
              <h3 className="text-xs font-bold text-foreground">Nhập / Xuất tệp dữ liệu JSON</h3>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border text-foreground hover:bg-muted text-xs font-semibold transition-colors"
                >
                  <Download className="w-4 h-4 text-primary" />
                  <span>Tải tệp JSON sao lưu</span>
                </button>

                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border text-foreground hover:bg-muted text-xs font-semibold transition-colors cursor-pointer">
                  <Upload className="w-4 h-4 text-emerald-500" />
                  <span>Nhập tệp JSON vào Vault</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </label>
              </div>

              {importStatus && (
                <p className="text-xs font-semibold text-emerald-600 animate-in fade-in">
                  {importStatus}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1 text-xs">
            <div className="bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-xl text-blue-700 dark:text-blue-400 leading-relaxed">
              <strong>💡 Extension ERP PassVault</strong> được xây dựng sẵn trong thư mục dự án tại đường dẫn:
              <br />
              <code className="font-mono bg-background/80 px-2 py-0.5 rounded border border-border mt-1 inline-block text-foreground">
                d:\tải xuống 2\h161 react\chrome-extension
              </code>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3 bg-muted/30 p-3.5 rounded-xl border border-border">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </span>
                <div>
                  <h4 className="font-bold text-foreground">Mở trang Tiện ích (Extensions)</h4>
                  <p className="text-muted-foreground mt-0.5">
                    Trên Google Chrome, truy cập <code className="font-mono bg-muted px-1 rounded">chrome://extensions/</code> (hoặc <code className="font-mono bg-muted px-1 rounded">edge://extensions/</code> trên Microsoft Edge).
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-muted/30 p-3.5 rounded-xl border border-border">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </span>
                <div>
                  <h4 className="font-bold text-foreground">Bật Developer mode (Chế độ cho nhà phát triển)</h4>
                  <p className="text-muted-foreground mt-0.5">
                    Gạt nút bật <strong>Developer mode</strong> ở góc trên bên phải màn hình quản lý tiện ích.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-muted/30 p-3.5 rounded-xl border border-border">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </span>
                <div>
                  <h4 className="font-bold text-foreground">Nhấn 'Load unpacked' (Tải tiện ích đã giải nén)</h4>
                  <p className="text-muted-foreground mt-0.5">
                    Chọn thư mục <code className="font-mono bg-muted px-1 rounded font-bold">chrome-extension</code> trong thư mục dự án của bạn. Tiện ích <strong>ERP PassVault</strong> sẽ xuất hiện ngay lập tức!
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-muted/30 p-3.5 rounded-xl border border-border">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                  4
                </span>
                <div>
                  <h4 className="font-bold text-foreground">Ghim Extension và Trải nghiệm Tự động bắt Form & Auto-Fill</h4>
                  <p className="text-muted-foreground mt-0.5">
                    Ghim biểu tượng chiếc khóa lên thanh trình duyệt. Khi bạn duyệt bất kỳ trang web nào:
                  </p>
                  <ul className="list-disc list-inside mt-1.5 space-y-1 text-muted-foreground">
                    <li><strong className="text-foreground">Đăng nhập / Đăng ký web mới:</strong> Extension tự động hiện thanh thông báo <span className="text-primary font-semibold">"Lưu vào ERP PassVault?"</span> để bạn lưu tài khoản chỉ với 1 click.</li>
                    <li><strong className="text-foreground">Trợ lý Icon thông minh:</strong> Nhấp vào bất kỳ ô Mật khẩu nào để tạo mật khẩu mạnh ngẫu nhiên hoặc 1-chạm điền tài khoản đã lưu.</li>
                    <li><strong className="text-foreground">Xem & Quản lý mọi lúc:</strong> Bấm vào icon Extension trên thanh công cụ để tra cứu, copy user/pass, hoặc thêm mới tài khoản trực tiếp.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-[11px] text-muted-foreground">
            Tổng cộng: <strong className="text-foreground">{passwords.length}</strong> tài khoản sẵn sàng đồng bộ
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
