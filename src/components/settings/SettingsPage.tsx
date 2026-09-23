import React, { useState } from 'react';
import {
  ArrowLeft,
  Settings as SettingsIcon,
  RotateCcw,
  Palette,
  Check,
  Monitor,
  Sun,
  Moon,
  Type,
  CalendarClock,
  ChevronDown,
  Calculator,
  Table2,
  MousePointerClick,
  Bell,
  Database,
  LayoutTemplate,
  Sliders,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import {
  PrimaryColor,
  ColorScheme,
  FontFamily,
  FontSize,
  DateFormat,
  TimeFormat,
  NumberSeparator,
  CurrencyDisplay,
  TableDensity,
  COLOR_CONFIG,
  FONT_CONFIG,
} from '../../types/settings';

interface SettingsPageProps {
  onBack: () => void;
}

type SettingsTab = 'system' | 'notifications' | 'data-type' | 'view-type';

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const {
    settings,
    updateSettings,
    resetDefaults,
    formatCurrency,
    formatDate,
    formatDateTime,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<SettingsTab>('system');
  const [activeSubSection, setActiveSubSection] = useState<string>('sys-appearance');
  const [timezoneDropdownOpen, setTimezoneDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Timezone options
  const TIMEZONES = [
    { value: 'Asia/Ho_Chi_Minh', label: 'Hồ Chí Minh (GMT+7)' },
    { value: 'Asia/Bangkok', label: 'Bangkok (GMT+7)' },
    { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
    { value: 'Europe/London', label: 'London (GMT+0)' },
    { value: 'America/New_York', label: 'New York (GMT-5)' },
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc muốn khôi phục toàn bộ cài đặt về mặc định?')) {
      resetDefaults();
      showToast('Đã khôi phục cài đặt mặc định');
    }
  };

  const scrollToSection = (id: string) => {
    setActiveSubSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const now = new Date();

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col">
        {/* Sticky Header */}
        <div className="flex shrink-0 flex-col">
          <div className="sticky top-12 md:top-14 z-30 shrink-0 bg-card border-b border-border px-3 sm:px-4 py-2">
            {/* Mobile Header */}
            <div className="sm:hidden flex gap-2">
              <div className="flex items-center gap-1.5 w-full min-w-0">
                <button
                  type="button"
                  onClick={onBack}
                  aria-label="Quay lại"
                  className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground active:scale-95 transition-all"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2.5px]" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <SettingsIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="truncate text-sm font-semibold text-foreground">
                        Cài đặt
                      </h1>
                      <p className="hidden truncate text-xs text-muted-foreground sm:block">
                        Tuỳ chỉnh hiển thị cho riêng tài khoản này
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  aria-label="Khôi phục mặc định"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={onBack}
                className="shrink-0 h-8 px-2 -ml-1 flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5px]" />
                <span className="text-xs font-medium">Quay lại</span>
              </button>

              <div className="flex-1 min-w-0 max-w-[21rem]">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                    <SettingsIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate text-sm font-semibold text-foreground">
                      Cài đặt
                    </h1>
                    <p className="truncate text-xs text-muted-foreground">
                      Tuỳ chỉnh hiển thị cho riêng tài khoản này
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0 shrink" aria-hidden="true" />

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 cursor-pointer"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Khôi phục mặc định
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main 2-Column Settings Body */}
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 pb-10 pt-3 md:flex-row md:items-start md:gap-5 md:pt-4">
          {/* Left Navigation Aside */}
          <aside className="shrink-0 md:w-60 md:self-start md:sticky md:top-[6.75rem] md:max-h-[calc(100dvh-8rem)] md:overflow-y-auto no-scrollbar">
            <nav
              aria-label="Mục cài đặt"
              className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1.5 shadow-sm md:flex-col md:overflow-visible"
            >
              {/* Tab 1: Cài đặt hệ thống */}
              <div className="contents md:block">
                <button
                  type="button"
                  onClick={() => setActiveTab('system')}
                  aria-current={activeTab === 'system' ? 'page' : undefined}
                  className={`group relative flex shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors md:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    activeTab === 'system'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-1/2 hidden h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-opacity md:block ${
                      activeTab === 'system' ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                      activeTab === 'system'
                        ? 'border-primary/30 bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-muted/50 text-muted-foreground group-hover:text-foreground'
                    }`}
                  >
                    <SettingsIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block whitespace-nowrap text-sm font-semibold md:truncate">
                      Cài đặt hệ thống
                    </span>
                    <span className="hidden truncate text-[11px] leading-4 text-muted-foreground md:block">
                      Giao diện, ngày giờ, số, bảng
                    </span>
                  </span>
                </button>

                {activeTab === 'system' && (
                  <ul className="mb-1 ml-[1.4rem] hidden border-l border-border pl-2 md:block space-y-0.5">
                    {[
                      { id: 'sys-appearance', label: 'Giao diện' },
                      { id: 'sys-typography', label: 'Chữ' },
                      { id: 'sys-datetime', label: 'Ngày giờ' },
                      { id: 'sys-number', label: 'Số & tiền tệ' },
                      { id: 'sys-list', label: 'Danh sách & bảng' },
                      { id: 'sys-behavior', label: 'Hành vi' },
                    ].map((sub) => (
                      <li key={sub.id}>
                        <button
                          type="button"
                          onClick={() => scrollToSection(sub.id)}
                          className={`w-full truncate rounded-md px-2 py-1.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            activeSubSection === sub.id
                              ? 'text-primary font-semibold bg-primary/5'
                              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                          }`}
                        >
                          {sub.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Tab 2: Thông báo */}
              <div className="contents md:block">
                <button
                  type="button"
                  onClick={() => setActiveTab('notifications')}
                  aria-current={activeTab === 'notifications' ? 'page' : undefined}
                  className={`group relative flex shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors md:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    activeTab === 'notifications'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-1/2 hidden h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-opacity md:block ${
                      activeTab === 'notifications' ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                      activeTab === 'notifications'
                        ? 'border-primary/30 bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-muted/50 text-muted-foreground group-hover:text-foreground'
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block whitespace-nowrap text-sm font-semibold md:truncate">
                      Thông báo
                    </span>
                    <span className="hidden truncate text-[11px] leading-4 text-muted-foreground md:block">
                      Loại thông báo bạn muốn nhận
                    </span>
                  </span>
                </button>
              </div>

              {/* Tab 3: Review data type */}
              <div className="contents md:block">
                <button
                  type="button"
                  onClick={() => setActiveTab('data-type')}
                  aria-current={activeTab === 'data-type' ? 'page' : undefined}
                  className={`group relative flex shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors md:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    activeTab === 'data-type'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-1/2 hidden h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-opacity md:block ${
                      activeTab === 'data-type' ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                      activeTab === 'data-type'
                        ? 'border-primary/30 bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-muted/50 text-muted-foreground group-hover:text-foreground'
                    }`}
                  >
                    <Database className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block whitespace-nowrap text-sm font-semibold md:truncate">
                      Review data type
                    </span>
                    <span className="hidden truncate text-[11px] leading-4 text-muted-foreground md:block">
                      Toàn bộ kiểu trường, mẫu sống
                    </span>
                  </span>
                </button>
              </div>

              {/* Tab 4: Review view type */}
              <div className="contents md:block">
                <button
                  type="button"
                  onClick={() => setActiveTab('view-type')}
                  aria-current={activeTab === 'view-type' ? 'page' : undefined}
                  className={`group relative flex shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors md:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    activeTab === 'view-type'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-1/2 hidden h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-opacity md:block ${
                      activeTab === 'view-type' ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                      activeTab === 'view-type'
                        ? 'border-primary/30 bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-muted/50 text-muted-foreground group-hover:text-foreground'
                    }`}
                  >
                    <LayoutTemplate className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block whitespace-nowrap text-sm font-semibold md:truncate">
                      Review view type
                    </span>
                    <span className="hidden truncate text-[11px] leading-4 text-muted-foreground md:block">
                      Kiểu màn hình + mẫu trực quan
                    </span>
                  </span>
                </button>
              </div>
            </nav>
          </aside>

          {/* Right Content Area */}
          <div className="min-w-0 flex-1">
            {activeTab === 'system' && (
              <div className="space-y-5">
                {/* 1. sys-appearance: Giao diện */}
                <div
                  id="sys-appearance"
                  className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3 scroll-mt-24"
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                    <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                      <Palette className="h-4 w-4 text-primary" />
                      <span className="truncate">Giao diện</span>
                    </h4>
                  </div>

                  {/* Màu nhấn */}
                  <div className="grid gap-2 border-b border-border/50 py-3.5 last:border-0 last:pb-0 first:pt-0 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-6">
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        Màu
                      </span>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Màu nhấn cho nút, liên kết, biểu đồ và tiêu đề mục.
                      </p>
                    </div>
                    <div className="min-w-0">
                      <div
                        role="radiogroup"
                        aria-label="Màu"
                        className="flex flex-wrap gap-2"
                      >
                        {(
                          Object.keys(COLOR_CONFIG) as PrimaryColor[]
                        ).map((colorKey) => {
                          const item = COLOR_CONFIG[colorKey];
                          const isSelected = settings.primaryColor === colorKey;

                          return (
                            <button
                              key={colorKey}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              aria-label={item.name}
                              title={item.name}
                              onClick={() => {
                                updateSettings({ primaryColor: colorKey });
                                showToast(`Đã đổi màu chủ đạo: ${item.name}`);
                              }}
                              className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                                isSelected
                                  ? 'border-primary/50 bg-primary/5'
                                  : 'border-border hover:border-primary/30'
                              }`}
                            >
                              <span
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-black/5 shadow-sm dark:border-white/10"
                                style={{ backgroundColor: item.hex }}
                              >
                                {isSelected && (
                                  <Check className="w-[13px] h-[13px] text-white drop-shadow" />
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Sáng / Tối / Hệ thống */}
                  <div className="grid gap-2 border-b border-border/50 py-3.5 last:border-0 last:pb-0 first:pt-0 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-6">
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        Giao diện
                      </span>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Chọn "Hệ thống" để tự đổi sáng/tối theo cài đặt của máy.
                      </p>
                    </div>
                    <div className="min-w-0">
                      <div
                        role="radiogroup"
                        aria-label="Giao diện"
                        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                      >
                        {[
                          {
                            key: 'system' as ColorScheme,
                            label: 'Hệ thống',
                            icon: Monitor,
                          },
                          {
                            key: 'light' as ColorScheme,
                            label: 'Sáng',
                            icon: Sun,
                          },
                          {
                            key: 'dark' as ColorScheme,
                            label: 'Tối',
                            icon: Moon,
                          },
                        ].map((mode) => {
                          const isSelected = settings.colorScheme === mode.key;
                          const IconComp = mode.icon;

                          return (
                            <button
                              key={mode.key}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => {
                                updateSettings({ colorScheme: mode.key });
                                showToast(`Giao diện: ${mode.label}`);
                              }}
                              className={`group relative flex min-h-[44px] items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                                isSelected
                                  ? 'border-primary/40 bg-primary/5 text-primary'
                                  : 'border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/50'
                              }`}
                            >
                              <span className="shrink-0">
                                <IconComp className="w-4 h-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">
                                  {mode.label}
                                </span>
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. sys-typography: Chữ */}
                <div
                  id="sys-typography"
                  className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3 scroll-mt-24"
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                    <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                      <Type className="h-4 w-4 text-primary" />
                      <span className="truncate">Chữ</span>
                    </h4>
                  </div>

                  {/* Phông chữ */}
                  <div className="grid gap-2 border-b border-border/50 py-3.5 last:border-0 last:pb-0 first:pt-0 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-6">
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        Phông chữ
                      </span>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Áp dụng cho toàn bộ giao diện. Phông tải từ Google Fonts khi chọn lần đầu.
                      </p>
                    </div>
                    <div className="min-w-0">
                      <div
                        role="radiogroup"
                        aria-label="Phông chữ"
                        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                      >
                        {(Object.keys(FONT_CONFIG) as FontFamily[]).map((fontKey) => {
                          const item = FONT_CONFIG[fontKey];
                          const isSelected = settings.fontFamily === fontKey;

                          return (
                            <button
                              key={fontKey}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => {
                                updateSettings({ fontFamily: fontKey });
                                showToast(`Đã đổi phông chữ: ${fontKey}`);
                              }}
                              className={`group relative flex min-h-[44px] items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                                isSelected
                                  ? 'border-primary/40 bg-primary/5 text-primary'
                                  : 'border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/50'
                              }`}
                            >
                              <span className="min-w-0 flex-1">
                                <span
                                  className="block truncate text-sm font-medium"
                                  style={{ fontFamily: fontKey }}
                                >
                                  {item.name}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {item.desc}
                                </span>
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Cỡ chữ */}
                  <div className="grid gap-2 border-b border-border/50 py-3.5 last:border-0 last:pb-0 first:pt-0 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-6">
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        Cỡ chữ
                      </span>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Đổi cỡ chữ gốc — mọi thành phần co giãn theo.
                      </p>
                    </div>
                    <div className="min-w-0">
                      <div
                        role="radiogroup"
                        aria-label="Cỡ chữ"
                        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                      >
                        {[
                          { key: 'small' as FontSize, label: 'Nhỏ', px: '14px' },
                          { key: 'medium' as FontSize, label: 'Vừa', px: '16px' },
                          { key: 'large' as FontSize, label: 'Lớn', px: '18px' },
                        ].map((sizeItem) => {
                          const isSelected = settings.fontSize === sizeItem.key;

                          return (
                            <button
                              key={sizeItem.key}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => {
                                updateSettings({ fontSize: sizeItem.key });
                                showToast(`Cỡ chữ: ${sizeItem.label} (${sizeItem.px})`);
                              }}
                              className={`group relative flex min-h-[44px] items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                                isSelected
                                  ? 'border-primary/40 bg-primary/5 text-primary'
                                  : 'border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/50'
                              }`}
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">
                                  {sizeItem.label}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {sizeItem.px}
                                </span>
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. sys-datetime: Ngày giờ */}
                <div
                  id="sys-datetime"
                  className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3 scroll-mt-24"
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                    <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                      <CalendarClock className="h-4 w-4 text-primary" />
                      <span className="truncate">Ngày giờ</span>
                    </h4>
                  </div>

                  {/* Định dạng ngày */}
                  <div className="grid gap-2 border-b border-border/50 py-3.5 last:border-0 last:pb-0 first:pt-0 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-6">
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        Định dạng ngày
                      </span>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Áp dụng cho ngày hiển thị trên bảng, thẻ và bản xuất. Văn bản pháp lý
                        (hợp đồng, quyết định) vẫn in theo chuẩn Việt Nam.
                      </p>
                    </div>
                    <div className="min-w-0">
                      <div
                        role="radiogroup"
                        aria-label="Định dạng ngày"
                        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                      >
                        {[
                          { format: 'dd/mm/yyyy' as DateFormat, sample: '31/12/2025' },
                          { format: 'mm/dd/yyyy' as DateFormat, sample: '12/31/2025' },
                          { format: 'yyyy-mm-dd' as DateFormat, sample: '2025-12-31' },
                        ].map((item) => {
                          const isSelected = settings.dateFormat === item.format;
                          return (
                            <button
                              key={item.format}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => {
                                updateSettings({ dateFormat: item.format });
                                showToast(`Định dạng ngày: ${item.format}`);
                              }}
                              className={`group relative flex min-h-[44px] items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                                isSelected
                                  ? 'border-primary/40 bg-primary/5 text-primary'
                                  : 'border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/50'
                              }`}
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">
                                  {item.format}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {item.sample}
                                </span>
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Định dạng giờ */}
                  <div className="grid gap-2 border-b border-border/50 py-3.5 last:border-0 last:pb-0 first:pt-0 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-6">
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        Định dạng giờ
                      </span>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Áp dụng cho mọi mốc thời gian hiển thị kèm ngày.
                      </p>
                    </div>
                    <div className="min-w-0">
                      <div
                        role="radiogroup"
                        aria-label="Định dạng giờ"
                        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                      >
                        {[
                          { format: '24h' as TimeFormat, label: '24 giờ', sample: '14:30' },
                          {
                            format: '12h' as TimeFormat,
                            label: '12 giờ (SA/CH)',
                            sample: '02:30 CH',
                          },
                        ].map((item) => {
                          const isSelected = settings.timeFormat === item.format;
                          return (
                            <button
                              key={item.format}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => {
                                updateSettings({ timeFormat: item.format });
                                showToast(`Định dạng giờ: ${item.label}`);
                              }}
                              className={`group relative flex min-h-[44px] items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                                isSelected
                                  ? 'border-primary/40 bg-primary/5 text-primary'
                                  : 'border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/50'
                              }`}
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">
                                  {item.label}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {item.sample}
                                </span>
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Múi giờ */}
                  <div className="grid gap-2 border-b border-border/50 py-3.5 last:border-0 last:pb-0 first:pt-0 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-6">
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        Múi giờ
                      </span>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Dùng để quy đổi mốc thời gian lưu trong hệ thống về giờ địa phương.
                      </p>
                    </div>
                    <div className="min-w-0 relative">
                      <button
                        type="button"
                        aria-expanded={timezoneDropdownOpen}
                        onClick={() => setTimezoneDropdownOpen(!timezoneDropdownOpen)}
                        className="relative w-full h-10 rounded-lg border border-border bg-background py-2 px-3 text-xs text-foreground flex items-center justify-between cursor-pointer transition-all duration-200 text-left hover:border-border/80"
                      >
                        <span className="truncate flex-1 min-w-0">
                          {TIMEZONES.find((t) => t.value === settings.timeZone)?.label ||
                            settings.timeZone}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <ChevronDown
                            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                              timezoneDropdownOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {timezoneDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setTimezoneDropdownOpen(false)}
                          />
                          <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5">
                            {TIMEZONES.map((tz) => (
                              <button
                                key={tz.value}
                                type="button"
                                onClick={() => {
                                  updateSettings({ timeZone: tz.value });
                                  setTimezoneDropdownOpen(false);
                                  showToast(`Múi giờ: ${tz.label}`);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors cursor-pointer ${
                                  settings.timeZone === tz.value
                                    ? 'bg-primary/10 text-primary font-semibold'
                                    : 'text-foreground hover:bg-muted'
                                }`}
                              >
                                <span>{tz.label}</span>
                                {settings.timeZone === tz.value && (
                                  <Check className="w-3.5 h-3.5 text-primary" />
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Xem trước */}
                  <div className="grid gap-2 border-b border-border/50 py-3.5 last:border-0 last:pb-0 first:pt-0 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-6">
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        Xem trước
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm">
                        <div className="flex items-baseline justify-between gap-3 py-0.5">
                          <span className="text-xs text-muted-foreground">Ngày tạo</span>
                          <span className="font-medium tabular-nums text-foreground">
                            {formatDate(now)}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between gap-3 py-0.5">
                          <span className="text-xs text-muted-foreground">
                            Cập nhật lúc
                          </span>
                          <span className="font-medium tabular-nums text-foreground">
                            {formatDateTime(now)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. sys-number: Số & tiền tệ */}
                <div
                  id="sys-number"
                  className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3 scroll-mt-24"
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                    <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span className="truncate">Số & tiền tệ</span>
                    </h4>
                  </div>

                  {/* Dấu phân cách số */}
                  <div className="grid gap-2 border-b border-border/50 py-3.5 last:border-0 last:pb-0 first:pt-0 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-6">
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        Dấu phân cách số
                      </span>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Đổi cả cách hiển thị lẫn cách đọc số bạn gõ vào ô nhập.
                      </p>
                    </div>
                    <div className="min-w-0">
                      <div
                        role="radiogroup"
                        aria-label="Dấu phân cách số"
                        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                      >
                        {[
                          {
                            type: 'vi' as NumberSeparator,
                            label: 'Kiểu Việt Nam',
                            sample: '1.234.567,89',
                          },
                          {
                            type: 'intl' as NumberSeparator,
                            label: 'Kiểu quốc tế',
                            sample: '1,234,567.89',
                          },
                        ].map((item) => {
                          const isSelected = settings.numberSeparator === item.type;
                          return (
                            <button
                              key={item.type}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => {
                                updateSettings({ numberSeparator: item.type });
                                showToast(`Phân cách số: ${item.label}`);
                              }}
                              className={`group relative flex min-h-[44px] items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                                isSelected
                                  ? 'border-primary/40 bg-primary/5 text-primary'
                                  : 'border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/50'
                              }`}
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">
                                  {item.label}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {item.sample}
                                </span>
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Hiển thị tiền tệ */}
                  <div className="grid gap-2 border-b border-border/50 py-3.5 last:border-0 last:pb-0 first:pt-0 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-6">
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        Hiển thị tiền tệ
                      </span>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Cách gắn đơn vị vào số tiền.
                      </p>
                    </div>
                    <div className="min-w-0">
                      <div
                        role="radiogroup"
                        aria-label="Hiển thị tiền tệ"
                        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                      >
                        {[
                          {
                            disp: 'symbol' as CurrencyDisplay,
                            label: 'Ký hiệu ₫',
                            sample: '1.234.567 ₫',
                          },
                          {
                            disp: 'code' as CurrencyDisplay,
                            label: 'Mã VND',
                            sample: '1.234.567 VND',
                          },
                          {
                            disp: 'number_only' as CurrencyDisplay,
                            label: 'Chỉ số',
                            sample: '1.234.567',
                          },
                        ].map((item) => {
                          const isSelected = settings.currencyDisplay === item.disp;
                          return (
                            <button
                              key={item.disp}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => {
                                updateSettings({ currencyDisplay: item.disp });
                                showToast(`Hiển thị tiền tệ: ${item.label}`);
                              }}
                              className={`group relative flex min-h-[44px] items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                                isSelected
                                  ? 'border-primary/40 bg-primary/5 text-primary'
                                  : 'border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/50'
                              }`}
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">
                                  {item.label}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {item.sample}
                                </span>
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Xem trước */}
                  <div className="grid gap-2 border-b border-border/50 py-3.5 last:border-0 last:pb-0 first:pt-0 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-6">
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        Xem trước
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-xs text-muted-foreground">
                            Số & tiền tệ
                          </span>
                          <span className="font-medium tabular-nums text-foreground">
                            {formatCurrency(1234567)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. sys-list: Danh sách & bảng */}
                <div
                  id="sys-list"
                  className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3 scroll-mt-24"
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                    <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                      <Table2 className="h-4 w-4 text-primary" />
                      <span className="truncate">Danh sách & bảng</span>
                    </h4>
                  </div>

                  {/* Số dòng mỗi trang */}
                  <div className="grid gap-2 border-b border-border/50 py-3.5 last:border-0 last:pb-0 first:pt-0 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-6">
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        Số dòng mỗi trang
                      </span>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Áp dụng cho mọi danh sách. Đổi trong từng bảng chỉ có tác dụng ở lần xem
                        đó.
                      </p>
                    </div>
                    <div className="min-w-0">
                      <div
                        role="radiogroup"
                        aria-label="Số dòng mỗi trang"
                        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                      >
                        {[10, 20, 50, 100].map((rows) => {
                          const isSelected = settings.rowsPerPage === rows;
                          return (
                            <button
                              key={rows}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => {
                                updateSettings({ rowsPerPage: rows });
                                showToast(`Số dòng mỗi trang: ${rows} dòng`);
                              }}
                              className={`group relative flex min-h-[44px] items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                                isSelected
                                  ? 'border-primary/40 bg-primary/5 text-primary'
                                  : 'border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/50'
                              }`}
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">
                                  {rows} dòng
                                </span>
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Mật độ bảng */}
                  <div className="grid gap-2 border-b border-border/50 py-3.5 last:border-0 last:pb-0 first:pt-0 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-6">
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        Mật độ bảng
                      </span>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Chiều cao dòng. Gọn thì xem được nhiều bản ghi hơn trên một màn hình.
                      </p>
                    </div>
                    <div className="min-w-0">
                      <div
                        role="radiogroup"
                        aria-label="Mật độ bảng"
                        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                      >
                        {[
                          {
                            density: 'compact' as TableDensity,
                            label: 'Gọn',
                            height: '32px/dòng',
                          },
                          {
                            density: 'medium' as TableDensity,
                            label: 'Vừa',
                            height: '38px/dòng',
                          },
                          {
                            density: 'comfortable' as TableDensity,
                            label: 'Thoáng',
                            height: '48px/dòng',
                          },
                        ].map((item) => {
                          const isSelected = settings.tableDensity === item.density;
                          return (
                            <button
                              key={item.density}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => {
                                updateSettings({ tableDensity: item.density });
                                showToast(`Mật độ bảng: ${item.label} (${item.height})`);
                              }}
                              className={`group relative flex min-h-[44px] items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                                isSelected
                                  ? 'border-primary/40 bg-primary/5 text-primary'
                                  : 'border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/50'
                              }`}
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">
                                  {item.label}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {item.height}
                                </span>
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Nhớ bộ lọc lần trước */}
                  <div className="pt-3.5">
                    <label
                      onClick={() =>
                        updateSettings({ rememberFilters: !settings.rememberFilters })
                      }
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 transition-colors gap-4 hover:bg-muted cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Nhớ bộ lọc lần trước
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Giữ bộ lọc và sắp xếp của từng module giữa các lần vào trang. Ô tìm
                          kiếm luôn để trống khi mở lại.
                        </p>
                      </div>
                      <div
                        role="switch"
                        aria-checked={settings.rememberFilters}
                        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none ${
                          settings.rememberFilters ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}
                      >
                        <span
                          className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform ${
                            settings.rememberFilters ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </label>
                  </div>
                </div>

                {/* 6. sys-behavior: Hành vi */}
                <div
                  id="sys-behavior"
                  className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3 scroll-mt-24"
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                    <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                      <MousePointerClick className="h-4 w-4 text-primary" />
                      <span className="truncate">Hành vi</span>
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {/* Mở rộng thanh điều hướng */}
                    <label
                      onClick={() => updateSettings({ expandNav: !settings.expandNav })}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 transition-colors gap-4 hover:bg-muted cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Mở rộng thanh điều hướng
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Trạng thái này được nhớ, lần mở app sau vẫn giữ nguyên.
                        </p>
                      </div>
                      <div
                        role="switch"
                        aria-checked={settings.expandNav}
                        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                          settings.expandNav ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}
                      >
                        <span
                          className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform ${
                            settings.expandNav ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </label>

                    {/* Hỏi trước khi mở liên kết ngoài */}
                    <label
                      onClick={() =>
                        updateSettings({ confirmExternalLink: !settings.confirmExternalLink })
                      }
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 transition-colors gap-4 hover:bg-muted cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Hỏi trước khi mở liên kết ngoài
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Liên kết lưu trong bản ghi do người khác nhập. Hỏi lại cho thấy tên
                          miền trước khi rời app.
                        </p>
                      </div>
                      <div
                        role="switch"
                        aria-checked={settings.confirmExternalLink}
                        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                          settings.confirmExternalLink ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}
                      >
                        <span
                          className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform ${
                            settings.confirmExternalLink ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </label>
                  </div>
                </div>

                <p className="px-1 text-xs text-muted-foreground">
                  Cài đặt lưu trên trình duyệt này, không đồng bộ sang máy khác.
                </p>
              </div>
            )}

            {/* Tab: Thông báo */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="bg-card p-5 rounded-xl border border-border shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-border">
                    <Bell className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Cấu hình thông báo</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Chọn các sự kiện bạn muốn nhận thông báo tức thời trên chuông thông báo và email.
                  </p>
                  <div className="space-y-2">
                    {[
                      {
                        title: 'Đề xuất chi phí mới cần duyệt',
                        desc: 'Nhận thông báo khi có đề xuất mới được gửi đến bạn.',
                        enabled: true,
                      },
                      {
                        title: 'Trạng thái đề xuất thay đổi',
                        desc: 'Thông báo khi đề xuất của bạn được duyệt hoặc bị từ chối.',
                        enabled: true,
                      },
                      {
                        title: 'Bình luận & trao đổi',
                        desc: 'Khi có thành viên thảo luận trong phiếu đề xuất của bạn.',
                        enabled: true,
                      },
                      {
                        title: 'Báo cáo định kỳ tuần/tháng',
                        desc: 'Tóm tắt tình hình thu chi và đề xuất tài chính.',
                        enabled: false,
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-semibold text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary font-medium">
                          {item.enabled ? 'Bật' : 'Tắt'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Review data type */}
            {activeTab === 'data-type' && (
              <div className="space-y-4">
                <div className="bg-card p-5 rounded-xl border border-border shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-border">
                    <Database className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">
                      Review các kiểu dữ liệu hệ thống (Live Data Types)
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                      <span className="text-xs font-bold text-primary uppercase">Tiền tệ & Số</span>
                      <p className="text-lg font-bold text-foreground tabular-nums">
                        {formatCurrency(85000000)}
                      </p>
                      <p className="text-xs text-muted-foreground">Áp dụng phân cách: {settings.numberSeparator === 'vi' ? 'Dấu chấm (.)' : 'Dấu phẩy (,)'}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                      <span className="text-xs font-bold text-primary uppercase">Ngày & Thời gian</span>
                      <p className="text-base font-semibold text-foreground tabular-nums">
                        {formatDateTime(new Date())}
                      </p>
                      <p className="text-xs text-muted-foreground">Múi giờ: {settings.timeZone}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                      <span className="text-xs font-bold text-primary uppercase">Trạng thái duyệt</span>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          Đã duyệt
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          Chờ duyệt
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                          Từ chối
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                      <span className="text-xs font-bold text-primary uppercase">Phông chữ hiển thị</span>
                      <p className="text-base font-semibold text-foreground" style={{ fontFamily: settings.fontFamily }}>
                        {settings.fontFamily} — Tiếng Việt có dấu: "Hệ thống quản trị doanh nghiệp"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Review view type */}
            {activeTab === 'view-type' && (
              <div className="space-y-4">
                <div className="bg-card p-5 rounded-xl border border-border shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-border">
                    <LayoutTemplate className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">
                      Kiểu màn hình & Giao diện tương tác
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 text-center space-y-2">
                      <Table2 className="w-8 h-8 text-primary mx-auto" />
                      <h4 className="text-xs font-bold text-foreground">Table View</h4>
                      <p className="text-[11px] text-muted-foreground">Bảng dữ liệu đa cột với ghim cột, lọc nâng cao, phân trang.</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card text-center space-y-2">
                      <Layers className="w-8 h-8 text-muted-foreground mx-auto" />
                      <h4 className="text-xs font-bold text-foreground">Card / Grid View</h4>
                      <p className="text-[11px] text-muted-foreground">Chế độ thẻ trực quan, tối ưu cho thiết bị di động và tablet.</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card text-center space-y-2">
                      <Sliders className="w-8 h-8 text-muted-foreground mx-auto" />
                      <h4 className="text-xs font-bold text-foreground">Slide Drawer View</h4>
                      <p className="text-[11px] text-muted-foreground">Ngăn kéo trượt xem chi tiết và tạo mới 3 kích thước.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
