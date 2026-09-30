import { LucideIcon } from 'lucide-react';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled' | 'pending';

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
  assignee?: string;
  dueDate?: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size?: string;
  type?: string;
  uploadedAt?: string;
}

export interface TaskComment {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  code: string; // e.g., 'CV-001' (Primary Key / Col 1 ID)
  title: string;
  description: string;
  projectId?: string;
  projectCode?: string;
  projectName?: string;
  department: string;
  assignerId?: string;
  assignerCode?: string;
  assignerName: string; // Linked to Employee
  assigneeId?: string;
  assigneeCode?: string;
  assigneeName: string; // Linked to Employee
  collaborators?: string[]; // IDs/Codes/Names of collaborators
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  completedAt?: string;
  progress: number; // 0 - 100
  estimatedHours?: number;
  actualHours?: number;
  subtasks?: TaskSubtask[];
  tags?: string[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  kpiScore?: number; // 1 - 100
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
export type ProjectPriority = 'high' | 'medium' | 'low';

export interface Project {
  id: string;
  code: string; // e.g., 'DA-001'
  name: string;
  description: string;
  managerId?: string;
  managerCode?: string;
  managerName: string; // Linked to Employee
  memberIds?: string[]; // Linked to Employees
  memberNames?: string[];
  customerId?: string;
  customerCode?: string;
  customerName?: string; // Linked to Counterparty
  department: string;
  startDate: string;
  endDate: string;
  budget: number;
  spentAmount?: number;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number; // 0 - 100
  color?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  stepNumber: number;
  title: string;
  defaultAssigneeRole: string;
  estimatedDays: number;
  checklist?: string[];
  isRequired?: boolean;
}

export interface WorkflowTemplate {
  id: string;
  code: string; // e.g., 'QT-001'
  name: string;
  description: string;
  category: string;
  department: string;
  steps: WorkflowStep[];
  status: 'active' | 'inactive';
  usageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkSectionItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  badge?: string;
  badgeColor?: string;
  isPinned?: boolean;
}

export interface WorkSectionData {
  id: string;
  title: string;
  items: WorkSectionItem[];
}
