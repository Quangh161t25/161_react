import fs from 'fs';
import path from 'path';
import { saveAllTransactionsToSheet, fetchTransactionsFromSheet } from '../server/sheetsService.mjs';

function vndNumberToWords(amount) {
  if (amount === 0) return 'Không đồng chẵn';
  const num = Math.abs(Math.round(amount));
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

  function readThreeDigits(n, isLastGroup) {
    let result = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    if (h > 0 || !isLastGroup) {
      result += digits[h] + ' trăm ';
    }
    if (t > 1) {
      result += digits[t] + ' mươi ';
      if (u === 1) result += 'mốt ';
      else if (u === 5) result += 'lăm ';
      else if (u > 0) result += digits[u] + ' ';
    } else if (t === 1) {
      result += 'mười ';
      if (u === 5) result += 'lăm ';
      else if (u > 0) result += digits[u] + ' ';
    } else if (t === 0 && u > 0) {
      if (h > 0 || !isLastGroup) result += 'lẻ ' + digits[u] + ' ';
      else result += digits[u] + ' ';
    }
    return result.trim();
  }

  const strNum = String(num);
  const groups = [];
  for (let i = strNum.length; i > 0; i -= 3) {
    groups.unshift(Number(strNum.substring(Math.max(0, i - 3), i)));
  }

  let words = '';
  for (let i = 0; i < groups.length; i++) {
    const groupVal = groups[i];
    const unitIdx = groups.length - 1 - i;
    if (groupVal > 0) {
      const isLastGroup = i === 0;
      const groupText = readThreeDigits(groupVal, isLastGroup);
      words += `${groupText} ${units[unitIdx]} `;
    }
  }

  words = words.trim();
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return `${capitalized} đồng chẵn.`;
}

async function main() {
  const tsPath = path.resolve(process.cwd(), 'src/data/cashTransactions.ts');
  const tsCode = fs.readFileSync(tsPath, 'utf8');

  const match = tsCode.match(/export const MOCK_TRANSACTIONS:\s*CashTransaction\[\]\s*=\s*(\[[\s\S]*?\]);\s*export const/);
  if (!match) {
    throw new Error('Could not find MOCK_TRANSACTIONS array in src/data/cashTransactions.ts');
  }

  const transactions = new Function('vndNumberToWords', `return ${match[1]}`)(vndNumberToWords);
  console.log(`Parsed ${transactions.length} transactions from src/data/cashTransactions.ts`);

  console.log('Pushing transactions to Google Sheets tab "ThuChi"...');
  const saveRes = await saveAllTransactionsToSheet(transactions);
  console.log('Save result:', saveRes);

  console.log('Verifying by fetching transactions back from Google Sheets...');
  const fetched = await fetchTransactionsFromSheet();
  console.log(`Fetched ${fetched.length} cash transactions from Google Sheets!`);
  if (fetched.length >= 30) {
    console.log('SUCCESS: All 30 cash transactions are now live in Google Sheets tab "ThuChi"!');
  }
}

main().catch((err) => {
  console.error('Sync failed with error:', err);
  process.exit(1);
});
