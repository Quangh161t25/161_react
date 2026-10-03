import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Bell,
  BellRing,
  Download,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Calendar,
  CheckSquare,
  Share,
  X,
  Sparkles,
  Info,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { pwaService } from '../../services/pwaService';
import { notificationService, NotificationSettings } from '../../services/notificationService';

interface PWAInstallAndNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'install' | 'notification';
}

export const PWAInstallAndNotificationModal: React.FC<PWAInstallAndNotificationModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'install',
}) => {
  const [activeTab, setActiveTab] = useState<'install' | 'notification'>(initialTab);
  const [canPromptInstall, setCanPromptInstall] = useState(pwaService.canPromptInstall());
  const [isStandalone, setIsStandalone] = useState(pwaService.isStandalone());
  const [deviceInfo] = useState(pwaService.getDeviceInfo());
  
  const [permission, setPermission] = useState<NotificationPermission>(
    notificationService.getPermission()
  );
  const [settings, setSettings] = useState<NotificationSettings>(
    notificationService.getSettings()
  );
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setIsStandalone(pwaService.isStandalone());
      setPermission(notificationService.getPermission());
      setSettings(notificationService.getSettings());
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const unsubscribe = pwaService.subscribe((canInstall) => {
      setCanPromptInstall(canInstall);
      setIsStandalone(pwaService.isStandalone());
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  // Handle native install prompt
  const handleInstallClick = async () => {
    const success = await pwaService.promptInstall();
    if (success) {
      setIsStandalone(true);
    }
  };

  // Handle permission request
  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setPermission(notificationService.getPermission());
    if (granted) {
      // Trigger a test notification immediately so user sees it work
      await notificationService.sendTestNotification();
    }
  };

  // Handle test notification
  const handleSendTestNotification = async () => {
    setTestStatus('sending');
    const success = await notificationService.sendTestNotification();
    setTestStatus(success ? 'success' : 'failed');
    setTimeout(() => setTestStatus('idle'), 3500);
  };

  // Update setting
  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    notificationService.saveSettings({ [key]: value });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              {activeTab === 'install' ? (
                <Smartphone className="w-5 h-5 stroke-[2.2px]" />
              ) : (
                <BellRing className="w-5 h-5 stroke-[2.2px]" />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {activeTab === 'install'
                  ? 'Cài đặt Ứng dụng Điện thoại'
                  : 'Cài đặt Thông báo Thiết bị'}
              </h3>
              <p className="text-xs text-muted-foreground">
                PWA cài đặt trực tiếp, chạy toàn màn hình và nhận thông báo tức thì
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border bg-muted/10 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('install')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'install'
                ? 'bg-card text-primary shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Cài đặt App ({deviceInfo.isIOS ? 'iPhone / iPad' : deviceInfo.isAndroid ? 'Android' : 'Điện thoại & PC'})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notification')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'notification'
                ? 'bg-card text-primary shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Bell className="w-4 h-4" />
            Thông báo & Chuông
            {permission === 'granted' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: CÀI ĐẶT APP */}
          {activeTab === 'install' && (
            <div className="space-y-4">
              {/* Standalone status badge if already installed */}
              {isStandalone ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      Ứng dụng đã được cài đặt!
                    </h4>
                    <p className="text-xs text-emerald-700/90 dark:text-emerald-400 mt-1">
                      Bạn đang chạy hệ thống dưới dạng ứng dụng độc lập (PWA). Mọi tính năng hoạt động toàn màn hình và nhận thông báo chuông đầy đủ.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Install guide for Android / Chrome / Edge */}
              {(!deviceInfo.isIOS || canPromptInstall) && !isStandalone && (
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Cài đặt nhanh (Android / Chrome)
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Tải biểu tượng app trực tiếp về màn hình chính điện thoại
                        </p>
                      </div>
                    </div>
                  </div>

                  {canPromptInstall ? (
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Cài đặt ứng dụng vào điện thoại ngay
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-1.5">
                      <p className="font-medium text-foreground">
                        Cách cài đặt trên trình duyệt Chrome/Cốc Cốc Android:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 pl-1">
                        <li>Nhấn vào biểu tượng <strong>3 dấu chấm (⋮)</strong> ở góc trên bên phải trình duyệt.</li>
                        <li>Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.</li>
                        <li>Xác nhận <strong>"Cài đặt"</strong> để tạo biểu tượng app ngoài màn hình.</li>
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* Install guide for iOS / iPhone / iPad */}
              {deviceInfo.isIOS && (
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Share className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        Hướng dẫn cài đặt trên iPhone / iPad (Safari)
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Chỉ mất 5 giây với Safari trên iOS 16.4+
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/60">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        1
                      </span>
                      <div className="text-xs">
                        <span className="font-semibold text-foreground">Mở Safari:</span> Truy cập hệ thống này bằng trình duyệt Safari mặc định trên iPhone.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/60">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        2
                      </span>
                      <div className="text-xs">
                        <span className="font-semibold text-foreground">Nhấn nút Chia sẻ:</span> Chạm vào biểu tượng <strong>Chia sẻ (Share 📤)</strong> ở thanh dưới cùng của Safari.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/60">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        3
                      </span>
                      <div className="text-xs">
                        <span className="font-semibold text-foreground">Thêm vào Màn hình chính:</span> Cuộn menu xuống và chọn <strong>"Thêm vào MH chính" (Add to Home Screen ➕)</strong>.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/60">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        4
                      </span>
                      <div className="text-xs">
                        <span className="font-semibold text-foreground">Hoàn tất:</span> Nhấn nút <strong>"Thêm" (Add)</strong> ở góc trên bên phải. Biểu tượng ứng dụng ERP sẽ xuất hiện trên màn hình điện thoại của bạn!
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lợi ích của PWA App */}
              <div className="rounded-2xl border border-border/80 bg-muted/15 p-4 space-y-2.5">
                <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Ưu điểm khi cài đặt App trên điện thoại
                </h5>
                <ul className="text-xs text-muted-foreground space-y-1.5 pl-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Mở app toàn màn hình không có thanh URL của trình duyệt</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Nhận thông báo công việc, hạn deadline và chuông rung như app tải từ Store</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Tốc độ tải cực nhanh, lưu trữ dữ liệu offline mượt mà</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Tự động cập nhật tính năng mới mà không cần cài đặt lại</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: THÔNG BÁO & CHUÔNG */}
          {activeTab === 'notification' && (
            <div className="space-y-4">
              {/* Permission Banner */}
              <div
                className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  permission === 'granted'
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : permission === 'denied'
                    ? 'border-rose-500/30 bg-rose-500/10'
                    : 'border-amber-500/30 bg-amber-500/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      permission === 'granted'
                        ? 'bg-emerald-500/20 text-emerald-600'
                        : permission === 'denied'
                        ? 'bg-rose-500/20 text-rose-600'
                        : 'bg-amber-500/20 text-amber-600'
                    }`}
                  >
                    {permission === 'granted' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : permission === 'denied' ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <BellRing className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Trạng thái: {permission === 'granted' ? 'Đã cho phép thông báo' : permission === 'denied' ? 'Bị chặn quyền thông báo' : 'Chưa cấp quyền thông báo'}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {permission === 'granted'
                        ? 'Hệ thống có thể gửi thông báo công việc và âm thanh tới điện thoại của bạn.'
                        : permission === 'denied'
                        ? 'Vui lòng nhấn biểu tượng ổ khóa / cài đặt trình duyệt để cho phép Thông báo.'
                        : 'Hãy nhấn nút bên dưới để cấp quyền nhận thông báo.'}
                    </p>
                  </div>
                </div>

                {permission !== 'granted' && (
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    className="shrink-0 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    Bật thông báo ngay
                  </button>
                )}
              </div>

              {/* iOS Note about Home Screen */}
              {deviceInfo.isIOS && !isStandalone && (
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Lưu ý cho iPhone (iOS):</span> Apple yêu cầu bạn <strong>Thêm ứng dụng vào Màn hình chính</strong> trước thì mới kích hoạt được thông báo Web Push. Hãy chuyển sang tab "Cài đặt App" để thêm trước nhé.
                  </div>
                </div>
              )}

              {/* Test Notification Button */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card">
                <div>
                  <h5 className="text-xs font-semibold text-foreground">Kiểm tra thông báo thử nghiệm</h5>
                  <p className="text-[11px] text-muted-foreground">
                    Gửi ngay một thông báo mẫu kèm chuông rung để kiểm tra thiết bị
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSendTestNotification}
                  disabled={testStatus === 'sending'}
                  className="px-3 py-2 rounded-lg border border-border bg-muted/50 hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60"
                >
                  <Send className="w-3 h-3 text-primary" />
                  {testStatus === 'sending' ? 'Đang gửi...' : testStatus === 'success' ? 'Đã gửi!' : 'Gửi thử ngay'}
                </button>
              </div>

              {/* Detailed Notification Settings */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  Cấu hình loại nhắc nhở
                </h4>

                <div className="divide-y divide-border/60">
                  {/* Công việc đến hạn */}
                  <label className="py-3 flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block">
                          Nhắc nhở Công việc đến hạn & quá hạn
                        </span>
                        <span className="text-[11px] text-muted-foreground block">
                          Tự động thông báo khi có công việc cần hoàn thành trong ngày
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.taskDueReminders}
                      onChange={(e) => updateSetting('taskDueReminders', e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                    />
                  </label>

                  {/* Lịch họp & sự kiện */}
                  <label className="py-3 flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block">
                          Nhắc nhở Lịch họp & Sự kiện
                        </span>
                        <span className="text-[11px] text-muted-foreground block">
                          Thông báo lịch biểu, sự kiện diễn ra hôm nay
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.calendarReminders}
                      onChange={(e) => updateSetting('calendarReminders', e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                    />
                  </label>

                  {/* Âm thanh thông báo */}
                  <label className="py-3 flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                        {settings.sound ? (
                          <Volume2 className="w-4 h-4" />
                        ) : (
                          <VolumeX className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block">
                          Âm thanh chuông báo
                        </span>
                        <span className="text-[11px] text-muted-foreground block">
                          Phát âm thanh chuông báo khi có thông báo mới
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.sound}
                      onChange={(e) => updateSetting('sound', e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/80 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-primary" />
            Hỗ trợ Android, iPhone (iOS 16.4+), Windows, macOS
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-card border border-border font-medium text-foreground hover:bg-muted transition-colors active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
