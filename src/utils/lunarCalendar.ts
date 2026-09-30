/**
 * lunarCalendar.ts - Thư viện Âm Dương Lịch Việt Nam (Zero-dependency TypeScript)
 * Dựa trên thuật toán thiên văn học của TS. Hồ Ngọc Đức (Múi giờ chuẩn GMT+7)
 */

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  isLeap: boolean;
  text: string;
}

export interface CanChiYear {
  can: string;
  chi: string;
  fullName: string;
  conGiap: string;
}

export interface CanChiDay {
  can: string;
  chi: string;
  fullName: string;
}

export interface LunarFullInfo {
  lunar: LunarDate;
  canChiYear: CanChiYear;
  canChiDay: CanChiDay;
  tietKhi: string;
  gioHoangDao: string[];
  displayText: string; // e.g. "17/8" hoặc "1/8"
  isSpecialDay: boolean; // Mùng 1 hoặc Rằm 15
  specialDayLabel?: string; // "Mùng 1" hoặc "Rằm"
}

const TIMEZONE = 7; // GMT+7 Việt Nam

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
const CON_GIAP = ['Chuột', 'Trâu', 'Hổ', 'Mèo', 'Rồng', 'Rắn', 'Ngựa', 'Dê', 'Khỉ', 'Gà', 'Chó', 'Lợn'];
const TIET_KHI = [
  'Xuân Phân', 'Thanh Minh', 'Cốc Vũ', 'Lập Hạ', 'Tiểu Mãn', 'Mang Chủng',
  'Hạ Chí', 'Tiểu Thử', 'Đại Thử', 'Lập Thu', 'Xử Thử', 'Bạch Lộ',
  'Thu Phân', 'Hàn Lộ', 'Sương Giáng', 'Lập Đông', 'Tiểu Tuyết', 'Đại Tuyết',
  'Đông Chí', 'Tiểu Hàn', 'Đại Hàn', 'Lập Xuân', 'Vũ Thủy', 'Kinh Trập'
];

// 1. Chuyển ngày Dương lịch sang số ngày Julian (JDN)
export function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd =
    dd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

// 2. Chuyển số ngày Julian sang Dương lịch
export function jdToDate(jd: number): { day: number; month: number; year: number } {
  let a: number;
  if (jd > 2299160) {
    const alpha = Math.floor((jd - 1867216.25) / 36524.25);
    a = jd + 1 + alpha - Math.floor(alpha / 4);
  } else {
    a = jd;
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const day = b - d - Math.floor(30.6001 * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  return { day, month, year };
}

// 3. Tính điểm Sóc (New Moon) theo thuật toán Jean Meeus
export function getNewMoonDay(k: number, timeZone = TIMEZONE): number {
  const T = k / 1236.85;
  const T2 = T * T,
    T3 = T2 * T,
    T4 = T3 * T;
  const dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3 + 0.00000000073 * T4;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  const Om = 125.04452 - 1934.136261 * T + 0.0020708 * T2;

  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 -= 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 += 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 -= 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 -= 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 += 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (M + 2 * Mpr));
  C1 += 0.0005 * Math.sin(dr * (2 * Mpr - M)) - 0.0004 * Math.sin(dr * (2 * F - 2 * Mpr));
  C1 -= 0.0003 * Math.sin(dr * (2 * Mpr + M)) + 0.0003 * Math.sin(dr * (2 * F + 2 * M));
  C1 += 0.0003 * Math.sin(dr * (2 * F - 2 * M)) + 0.0002 * Math.sin(dr * (Mpr - M));
  C1 += 0.0002 * Math.sin(dr * 2 * Om);

  const deltat =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;

  const JdNew = Jd1 + C1 - deltat;
  return Math.floor(JdNew + 0.5 + timeZone / 24 + 0.005);
}

// 4. Tính Kinh độ Mặt Trời (Tiết khí)
export function getSunLongitude(jdn: number, timeZone = TIMEZONE): number {
  const T = (jdn - 2451545.0 + 0.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  const L = L0 + DL;
  const omega = 125.04 - 1934.136 * T;
  let lambda = L - 0.00569 - 0.00478 * Math.sin(omega * dr);
  lambda = lambda * dr;
  lambda = lambda - Math.PI * 2 * Math.floor(lambda / (Math.PI * 2));
  return Math.floor((lambda / Math.PI) * 6);
}

// 5. Xác định tháng 11 Âm lịch
export function getLunarMonth11(yy: number, timeZone = TIMEZONE): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) nm = getNewMoonDay(k - 1, timeZone);
  return nm;
}

// 6. Tính tháng nhuận
export function getLeapMonthOffset(a11: number, timeZone = TIMEZONE): number {
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  let last = 0;
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

// 7. Chuyển Dương lịch sang Âm lịch
export function solarToLunar(dd: number, mm: number, yy: number, timeZone = TIMEZONE): LunarDate {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, timeZone);
  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let lunarLeap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) lunarLeap = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;

  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    isLeap: lunarLeap,
    text: `${lunarDay}/${lunarMonth}${lunarLeap ? ' (Nhuận)' : ''}`,
  };
}

// 8. Chuyển Âm lịch sang Dương lịch
export function lunarToSolar(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  lunarLeap = false,
  timeZone = TIMEZONE
): { day: number; month: number; year: number } {
  let a11: number;
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1, timeZone);
  } else {
    a11 = getLunarMonth11(lunarYear, timeZone);
  }
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  const off = lunarMonth < 11 ? lunarMonth + 2 : lunarMonth - 10;
  const b11 = getLunarMonth11(lunarYear, timeZone);
  let actualOff = off;
  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, timeZone);
    if (lunarLeap) {
      actualOff = leapOff;
    } else if (off >= leapOff) {
      actualOff = off + 1;
    }
  }
  const monthStart = getNewMoonDay(k + actualOff, timeZone);
  return jdToDate(monthStart + lunarDay - 1);
}

// 9. Can Chi Năm (VD: Bính Ngọ, Giáp Thìn)
export function getCanChiYear(year: number): CanChiYear {
  const can = CAN[(year + 6) % 10];
  const chi = CHI[(year + 8) % 12];
  const conGiap = CON_GIAP[(year + 8) % 12];
  return { can, chi, fullName: `${can} ${chi}`, conGiap };
}

// 10. Can Chi Ngày
export function getCanChiDay(dd: number, mm: number, yy: number): CanChiDay {
  const jd = jdFromDate(dd, mm, yy);
  const can = CAN[(jd + 9) % 10];
  const chi = CHI[(jd + 1) % 12];
  return { can, chi, fullName: `${can} ${chi}` };
}

// 11. Tiết khí trong ngày
export function getTietKhi(dd: number, mm: number, yy: number): string {
  const jd = jdFromDate(dd, mm, yy);
  const sunLong = getSunLongitude(jd, TIMEZONE);
  return TIET_KHI[sunLong] || '';
}

// 12. Giờ Hoàng Đạo trong ngày
export function getGioHoangDao(dd: number, mm: number, yy: number): string[] {
  const jd = jdFromDate(dd, mm, yy);
  const chiIndex = (jd + 1) % 12;
  const HOANG_DAO_MAP = [
    [0, 1, 3, 6, 8, 9], // Tý: Tý, Sửu, Mão, Ngọ, Thân, Dậu
    [2, 3, 5, 8, 10, 11], // Sửu: Dần, Mão, Tỵ, Thân, Tuất, Hợi
    [0, 1, 4, 6, 7, 10], // Dần: Tý, Sửu, Thìn, Tỵ, Mùi, Tuất
    [0, 2, 5, 7, 8, 11], // Mão: Tý, Dần, Mão, Ngọ, Mùi, Dậu
    [1, 3, 4, 6, 9, 11], // Thìn: Dần, Thìn, Tỵ, Thân, Dậu, Hợi
    [2, 4, 5, 7, 10, 11], // Tỵ: Sửu, Thìn, Ngọ, Mùi, Tuất, Hợi
    [0, 1, 3, 6, 8, 9], // Ngọ
    [2, 3, 5, 8, 10, 11], // Mùi
    [0, 1, 4, 6, 7, 10], // Thân
    [0, 2, 5, 7, 8, 11], // Dậu
    [1, 3, 4, 6, 9, 11], // Tuất
    [2, 4, 5, 7, 10, 11], // Hợi
  ];
  const goodHours = HOANG_DAO_MAP[chiIndex] || [];
  return goodHours.map(
    (idx) => `${CHI[idx]} (${idx * 2 - 1 < 0 ? 23 : idx * 2 - 1}h-${idx * 2 + 1}h)`
  );
}

// 13. Tổng hợp thông tin Âm Lịch hoàn chỉnh từ YYYY-MM-DD hoặc Date
export function getLunarFullInfoFromDateStr(dateStr: string): LunarFullInfo | null {
  if (!dateStr) return null;
  let d = 1,
    m = 1,
    y = 2026;

  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const parts = dateStr.slice(0, 10).split('-');
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    d = parseInt(parts[2], 10);
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
    const parts = dateStr.split('/');
    d = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    y = parseInt(parts[2], 10);
  } else {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      y = parsed.getFullYear();
      m = parsed.getMonth() + 1;
      d = parsed.getDate();
    } else {
      return null;
    }
  }

  const lunar = solarToLunar(d, m, y);
  const canChiYear = getCanChiYear(lunar.year);
  const canChiDay = getCanChiDay(d, m, y);
  const tietKhi = getTietKhi(d, m, y);
  const gioHoangDao = getGioHoangDao(d, m, y);

  const isSpecialDay = lunar.day === 1 || lunar.day === 15;
  const specialDayLabel = lunar.day === 1 ? 'Mùng 1' : lunar.day === 15 ? 'Rằm' : undefined;

  // Display text: nếu ngày 1 thì hiển thị ngày/tháng (ví dụ "1/8" hoặc "1/8*"), nếu ngày thường thì hiển thị số ngày (ví dụ "17")
  const displayText =
    lunar.day === 1
      ? `1/${lunar.month}${lunar.isLeap ? '*' : ''}`
      : `${lunar.day}`;

  return {
    lunar,
    canChiYear,
    canChiDay,
    tietKhi,
    gioHoangDao,
    displayText,
    isSpecialDay,
    specialDayLabel,
  };
}

// 14. Tổng hợp thông tin Âm Lịch từ ngày, tháng, năm
export function getLunarFullInfo(dd: number, mm: number, yy: number): LunarFullInfo {
  const dateStr = `${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  return getLunarFullInfoFromDateStr(dateStr)!;
}

