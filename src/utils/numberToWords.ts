/**
 * numberToWords.ts - Chuyển đổi số tiền thành chữ Tiếng Việt (VNĐ)
 * Chuẩn định dạng chứng từ kế toán Việt Nam
 */

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function readTriple(triple: number, showZeroHundred: boolean): string {
  const hundreds = Math.floor(triple / 100);
  const remainder = triple % 100;
  const tens = Math.floor(remainder / 10);
  const units = remainder % 10;

  let result = '';

  if (hundreds > 0 || showZeroHundred) {
    result += `${DIGITS[hundreds]} trăm `;
  }

  if (tens > 1) {
    result += `${DIGITS[tens]} mươi `;
    if (units === 1) {
      result += 'mốt ';
    } else if (units === 5) {
      result += 'lăm ';
    } else if (units > 0) {
      result += `${DIGITS[units]} `;
    }
  } else if (tens === 1) {
    result += 'mười ';
    if (units === 5) {
      result += 'lăm ';
    } else if (units > 0) {
      result += `${DIGITS[units]} `;
    }
  } else if (hundreds > 0 || showZeroHundred) {
    if (units > 0) {
      result += `lẻ ${DIGITS[units]} `;
    }
  } else if (units > 0) {
    result += `${DIGITS[units]} `;
  }

  return result.trim();
}

export function vndNumberToWords(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) {
    return 'Không đồng chẵn';
  }

  let num = Math.abs(Math.round(amount));
  if (num === 0) return 'Không đồng chẵn';

  const scales = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const chunks: number[] = [];

  while (num > 0) {
    chunks.push(num % 1000);
    num = Math.floor(num / 1000);
  }

  let words = '';
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk > 0) {
      const showZero = i < chunks.length - 1;
      const chunkWords = readTriple(chunk, showZero);
      words += `${chunkWords} ${scales[i]} `;
    }
  }

  words = words.trim();
  // Capitalize first letter
  words = words.charAt(0).toUpperCase() + words.slice(1);
  return `${words} đồng chẵn`;
}
