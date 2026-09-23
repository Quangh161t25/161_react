export type ApprovalStatus = 'approved' | 'pending' | 'rejected' | 'draft';
export type ProposalStatus = 'active' | 'cancelled' | 'draft' | 'approved';

export interface ProposalLineItem {
  id?: string;
  name?: string;
  category?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total?: number;
  amount?: number;
  note?: string;
}

export interface CostProposal {
  id: string;
  code: string;
  proposalDate: string;
  dueDate: string;
  proposer: string;
  department: string;
  title: string;
  reason: string;
  amount: number;
  account: string;
  beneficiary?: string;
  isOverBudget: boolean;
  overBudgetReason?: string;
  note?: string;
  approvalSteps?: number;
  approvalStatus: ApprovalStatus;
  status: ProposalStatus;
  updatedAt: string;
  createdAt?: string;
  lineItems?: ProposalLineItem[];
}
