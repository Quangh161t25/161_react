export type PrimaryColor =
  | 'blue'
  | 'violet'
  | 'emerald'
  | 'rose'
  | 'amber'
  | 'orange'
  | 'cyan'
  | 'slate';

export type ColorScheme = 'system' | 'light' | 'dark';

export type FontFamily =
  | 'Inter'
  | 'Be Vietnam Pro'
  | 'Lexend'
  | 'Nunito'
  | 'Source Sans 3'
  | 'Merriweather';

export type FontSize = 'small' | 'medium' | 'large';

export type DateFormat = 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';

export type TimeFormat = '24h' | '12h';

export type NumberSeparator = 'vi' | 'intl';

export type CurrencyDisplay = 'symbol' | 'code' | 'number_only';

export type TableDensity = 'compact' | 'medium' | 'comfortable';

export interface UserSettings {
  primaryColor: PrimaryColor;
  colorScheme: ColorScheme;
  fontFamily: FontFamily;
  fontSize: FontSize;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  timeZone: string;
  numberSeparator: NumberSeparator;
  currencyDisplay: CurrencyDisplay;
  rowsPerPage: number;
  tableDensity: TableDensity;
  rememberFilters: boolean;
  expandNav: boolean;
  confirmExternalLink: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  primaryColor: 'blue',
  colorScheme: 'light',
  fontFamily: 'Inter',
  fontSize: 'medium',
  dateFormat: 'dd/mm/yyyy',
  timeFormat: '24h',
  timeZone: 'Asia/Ho_Chi_Minh',
  numberSeparator: 'vi',
  currencyDisplay: 'symbol',
  rowsPerPage: 50,
  tableDensity: 'medium',
  rememberFilters: false,
  expandNav: false,
  confirmExternalLink: true,
};

export const COLOR_CONFIG: Record<
  PrimaryColor,
  { name: string; hex: string; hsl: string }
> = {
  blue: { name: 'Xanh dương', hex: 'rgb(37, 99, 235)', hsl: '221.2 83.2% 53.3%' },
  violet: { name: 'Tím', hex: 'rgb(124, 58, 237)', hsl: '262.1 83.3% 57.8%' },
  emerald: { name: 'Xanh lá', hex: 'rgb(22, 163, 74)', hsl: '142.1 76.2% 36.3%' },
  rose: { name: 'Hồng', hex: 'rgb(225, 29, 72)', hsl: '346.8 77.2% 49.8%' },
  amber: { name: 'Cam vàng', hex: 'rgb(245, 158, 11)', hsl: '37.7 92.1% 50.2%' },
  orange: { name: 'Cam', hex: 'rgb(249, 115, 22)', hsl: '24.6 95% 53.1%' },
  cyan: { name: 'Xanh lơ', hex: 'rgb(6, 182, 212)', hsl: '188.7 94.5% 42.7%' },
  slate: { name: 'Xám', hex: 'rgb(100, 116, 139)', hsl: '215.4 16.3% 46.9%' },
};

export const FONT_CONFIG: Record<
  FontFamily,
  { name: string; desc: string; googleParam: string }
> = {
  Inter: { name: 'Inter', desc: 'Mặc định', googleParam: '' },
  'Be Vietnam Pro': {
    name: 'Be Vietnam Pro',
    desc: 'Tối ưu dấu tiếng Việt',
    googleParam: 'Be+Vietnam+Pro:wght@400;500;600;700',
  },
  Lexend: {
    name: 'Lexend',
    desc: 'Dễ đọc, chữ thoáng',
    googleParam: 'Lexend:wght@400;500;600;700',
  },
  Nunito: {
    name: 'Nunito',
    desc: 'Bo tròn, thân thiện',
    googleParam: 'Nunito:wght@400;600;700',
  },
  'Source Sans 3': {
    name: 'Source Sans 3',
    desc: 'Trung tính, gọn',
    googleParam: 'Source+Sans+3:wght@400;500;600;700',
  },
  Merriweather: {
    name: 'Merriweather',
    desc: 'Có chân, hợp bản in',
    googleParam: 'Merriweather:wght@400;700',
  },
};
