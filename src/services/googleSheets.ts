/**
 * Google Sheets Service & Types for ERP 161
 */

export interface SheetConfig {
  spreadsheetId: string;
  sheetName: string;
}

export interface SheetProposalRow {
  code: string;
  proposalDate: string;
  dueDate: string;
  proposer: string;
  department: string;
  title: string;
  reason: string;
  amount: number;
  account: string;
  beneficiary: string;
  isOverBudget: boolean;
  overBudgetReason?: string;
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected';
}

export const DEFAULT_SPREADSHEET_ID = '1Cx_84szeCGKoLhCSqumeCzKLCErXg1YStQeI_Lrq4nw';
