import React, { useState, useRef, useEffect } from 'react';
import { Clock, Check, X } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface TimePickerInputProps {
  value?: string; // Standard 24h format 'HH:mm' or ''
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  showPresets?: boolean;
}

const PRESET_HOURS_24 = [
  '08:00',
  '09:00',
  '10:30',
  '12:00',
  '13:30',
  '14:00',
  '15:30',
  '17:00',
  '18:30',
  '20:00',
];

export const TimePickerInput: React.FC<TimePickerInputProps> = ({
  value = '',
  onChange,
  placeholder,
  disabled = false,
  className = '',
  id,
  name,
  showPresets = true,
}) => {
  const { settings } = useSettings();
  const is24h = settings.timeFormat === '24h';

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  // Parse current 24h value
  const parseValue = (timeStr: string) => {
    if (!timeStr) {
      const now = new Date();
      return {
        hour24: now.getHours(),
        minute: now.getMinutes(),
        isValid: false,
      };
    }
    const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      const h = Math.min(23, Math.max(0, parseInt(match[1], 10)));
      const m = Math.min(59, Math.max(0, parseInt(match[2], 10)));
      return { hour24: h, minute: m, isValid: true };
    }
    return { hour24: 12, minute: 0, isValid: false };
  };

  const parsed = parseValue(value);
  const currentHour24 = parsed.hour24;
  const currentMinute = parsed.minute;
  const hasValue = parsed.isValid;

  // 12h representation
  const isPM = currentHour24 >= 12;
  const currentHour12 = currentHour24 % 12 === 0 ? 12 : currentHour24 % 12;

  // Format display text in input box
  const getDisplayText = (): string => {
    if (!hasValue && !value) return '';
    if (is24h) {
      return `${String(currentHour24).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    } else {
      const ampm = isPM ? 'CH' : 'SA';
      return `${String(currentHour12).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')} ${ampm}`;
    }
  };

  const [inputValue, setInputValue] = useState(getDisplayText());

  // Sync internal input display when value or timeFormat changes
  useEffect(() => {
    setInputValue(getDisplayText());
  }, [value, settings.timeFormat]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Auto scroll selected items into view when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const activeHourEl = hourListRef.current?.querySelector('[data-selected="true"]');
        if (activeHourEl) {
          activeHourEl.scrollIntoView({ block: 'nearest' });
        }
        const activeMinEl = minuteListRef.current?.querySelector('[data-selected="true"]');
        if (activeMinEl) {
          activeMinEl.scrollIntoView({ block: 'nearest' });
        }
      }, 50);
    }
  }, [isOpen]);

  // Set time by 24h hour and minute
  const handleSelectTime = (hour: number, min: number) => {
    const formatted = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    onChange(formatted);
  };

  // Select "Now"
  const handleSelectNow = () => {
    const now = new Date();
    const formatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  // Clear value
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setInputValue('');
  };

  // Direct manual text input change
  const handleDirectInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);

    if (is24h) {
      // Look for HH:mm pattern
      const match = raw.match(/^(\d{1,2})[:hH](\d{0,2})$/);
      if (match) {
        const h = parseInt(match[1], 10);
        if (h >= 0 && h <= 23) {
          if (match[2].length === 2) {
            const m = parseInt(match[2], 10);
            if (m >= 0 && m <= 59) {
              onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
            }
          }
        }
      } else if (raw.length === 4 && /^\d{4}$/.test(raw)) {
        // e.g. 1430 -> 14:30
        const h = parseInt(raw.substring(0, 2), 10);
        const m = parseInt(raw.substring(2, 4), 10);
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
          const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          onChange(val);
          setInputValue(val);
        }
      }
    } else {
      // 12h typing parsing
      const match12 = raw.match(/^(\d{1,2})[:hH](\d{2})\s*(sa|ch|am|pm)?$/i);
      if (match12) {
        let h = parseInt(match12[1], 10);
        const m = parseInt(match12[2], 10);
        const period = (match12[3] || '').toUpperCase();
        if (h >= 1 && h <= 12 && m >= 0 && m <= 59) {
          if (period === 'CH' || period === 'PM') {
            h = h === 12 ? 12 : h + 12;
          } else if (period === 'SA' || period === 'AM') {
            h = h === 12 ? 0 : h;
          }
          onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }
      }
    }
  };

  // On blur, re-format to valid representation
  const handleInputBlur = () => {
    setInputValue(getDisplayText());
  };

  // Generate Hour options
  const hours24 = Array.from({ length: 24 }, (_, i) => i);
  const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {/* Input container */}
      <div
        className={`group flex items-center w-full rounded-xl border bg-background text-foreground transition-all ${
          isOpen
            ? 'border-primary ring-2 ring-primary/20 shadow-xs'
            : 'border-border hover:border-border/80'
        } ${disabled ? 'opacity-50 pointer-events-none bg-muted/40' : ''}`}
      >
        <button
          type="button"
          tabIndex={-1}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="pl-3 pr-2 py-2 text-muted-foreground group-hover:text-primary transition-colors flex items-center justify-center"
          title={is24h ? 'Mở bảng chọn giờ (24h)' : 'Mở bảng chọn giờ (12h SA/CH)'}
        >
          <Clock className="w-3.5 h-3.5" />
        </button>

        <input
          id={id}
          name={name}
          type="text"
          disabled={disabled}
          value={inputValue}
          placeholder={placeholder || (is24h ? 'HH:mm (vd: 14:30)' : 'hh:mm SA/CH')}
          onChange={handleDirectInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={handleInputBlur}
          className="w-full bg-transparent py-2 pr-2 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 outline-none"
        />

        {/* Clear button */}
        {hasValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 mr-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Xóa giờ"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 w-72 max-w-[95vw] rounded-2xl border border-border bg-card shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150"
          style={{ transformOrigin: 'top left' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/70">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-foreground">
                {is24h ? 'Chọn giờ (Định dạng 24h)' : 'Chọn giờ (12h SA/CH)'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSelectNow}
              className="text-[11px] font-semibold text-primary hover:bg-primary/10 px-2 py-0.5 rounded-md transition-colors"
            >
              Hiện tại
            </button>
          </div>

          {/* Preset Buttons */}
          {showPresets && is24h && (
            <div className="mb-2.5 pb-2 border-b border-border/50">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                Mốc giờ phổ biến:
              </div>
              <div className="grid grid-cols-5 gap-1">
                {PRESET_HOURS_24.map((preset) => {
                  const isSelected = value === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        onChange(preset);
                        setIsOpen(false);
                      }}
                      className={`text-[11px] py-1 px-1 rounded-lg border text-center transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                          : 'bg-muted/40 hover:bg-muted border-border/60 text-foreground'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Time Picker Columns */}
          {is24h ? (
            /* 24-Hour Picker */
            <div className="grid grid-cols-2 gap-2">
              {/* Hour Column */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center mb-1">
                  Giờ (00 - 23)
                </div>
                <div
                  ref={hourListRef}
                  className="h-44 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-1 space-y-0.5 scrollbar-thin scrollbar-thumb-muted-foreground/20"
                >
                  {hours24.map((h) => {
                    const isSelected = currentHour24 === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        data-selected={isSelected}
                        onClick={() => handleSelectTime(h, currentMinute)}
                        className={`w-full py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <span>{String(h).padStart(2, '0')} giờ</span>
                        {isSelected && <Check className="w-3 h-3 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minute Column */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center mb-1">
                  Phút (00 - 59)
                </div>
                <div
                  ref={minuteListRef}
                  className="h-44 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-1 space-y-0.5 scrollbar-thin scrollbar-thumb-muted-foreground/20"
                >
                  {minutes.map((m) => {
                    const isSelected = currentMinute === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        data-selected={isSelected}
                        onClick={() => handleSelectTime(currentHour24, m)}
                        className={`w-full py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <span>{String(m).padStart(2, '0')} phút</span>
                        {isSelected && <Check className="w-3 h-3 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* 12-Hour Picker with SA / CH */
            <div className="space-y-2">
              {/* SA / CH Toggle */}
              <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-muted rounded-xl border border-border/60">
                <button
                  type="button"
                  onClick={() => {
                    if (isPM) {
                      const newH = currentHour24 - 12;
                      handleSelectTime(newH, currentMinute);
                    }
                  }}
                  className={`py-1 rounded-lg text-xs font-bold transition-all ${
                    !isPM
                      ? 'bg-card text-primary shadow-xs border border-border/60'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  SA (Sáng / AM)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isPM) {
                      const newH = currentHour24 + 12;
                      handleSelectTime(newH, currentMinute);
                    }
                  }}
                  className={`py-1 rounded-lg text-xs font-bold transition-all ${
                    isPM
                      ? 'bg-card text-primary shadow-xs border border-border/60'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  CH (Chiều / PM)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* 12 Hour Column */}
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center mb-1">
                    Giờ (01 - 12)
                  </div>
                  <div className="h-40 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-1 space-y-0.5 scrollbar-thin">
                    {hours12.map((h12) => {
                      const isSelected = currentHour12 === h12;
                      return (
                        <button
                          key={h12}
                          type="button"
                          data-selected={isSelected}
                          onClick={() => {
                            let new24 = h12;
                            if (isPM) {
                              new24 = h12 === 12 ? 12 : h12 + 12;
                            } else {
                              new24 = h12 === 12 ? 0 : h12;
                            }
                            handleSelectTime(new24, currentMinute);
                          }}
                          className={`w-full py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground shadow-xs'
                              : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          <span>{String(h12).padStart(2, '0')} giờ</span>
                          {isSelected && <Check className="w-3 h-3 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Minute Column */}
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center mb-1">
                    Phút (00 - 59)
                  </div>
                  <div className="h-40 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-1 space-y-0.5 scrollbar-thin">
                    {minutes.map((m) => {
                      const isSelected = currentMinute === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          data-selected={isSelected}
                          onClick={() => handleSelectTime(currentHour24, m)}
                          className={`w-full py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground shadow-xs'
                              : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          <span>{String(m).padStart(2, '0')} phút</span>
                          {isSelected && <Check className="w-3 h-3 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              Đang chọn: <span className="font-bold text-foreground">{getDisplayText() || 'Chưa đặt'}</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
