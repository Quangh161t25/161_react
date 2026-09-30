import { Task, Project, WorkflowTemplate } from '../types/task';

// --------------------------------------------------------------------
// STORAGE KEYS
// --------------------------------------------------------------------
const TASKS_STORAGE_KEY = 'erp_work_tasks_cache';
const PROJECTS_STORAGE_KEY = 'erp_work_projects_cache';
const WORKFLOWS_STORAGE_KEY = 'erp_work_workflows_cache';
const TASKS_LAST_SYNC_KEY = 'erp_work_tasks_last_sync';

// --------------------------------------------------------------------
// 1. TASK SERVICE
// --------------------------------------------------------------------
export const taskService = {
  getInitialTasks(): Task[] {
    try {
      const cached = localStorage.getItem(TASKS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          // Lọc bỏ các task mẫu cũ (id dạng task_01 .. task_05) nếu còn sót trong cache
          return parsed.filter((t: Task) => !/^task_0[1-5]$/.test(t.id));
        }
      }
    } catch (e) {
      console.warn('Could not read tasks from cache:', e);
    }
    return [];
  },

  saveToCache(tasks: Task[]): void {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
      localStorage.setItem(TASKS_LAST_SYNC_KEY, new Date().toISOString());
    } catch (e) {
      console.warn('Could not save tasks to cache:', e);
    }
  },

  getLastSyncTime(): string | null {
    return localStorage.getItem(TASKS_LAST_SYNC_KEY);
  },

  async fetchFromSheet(): Promise<Task[]> {
    try {
      const res = await fetch('/api/sheets/tasks');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        this.saveToCache(data.data);
        return data.data;
      }
      return this.getInitialTasks();
    } catch (err) {
      console.warn('Fallback to local tasks cache:', err);
      return this.getInitialTasks();
    }
  },

  async appendToSheet(task: Task): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/append-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to append task to Google Sheet:', err);
      return false;
    }
  },

  async updateInSheet(task: Task): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/update-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to update task in Google Sheet:', err);
      return false;
    }
  },

  async deleteFromSheet(codes: string[] | string): Promise<boolean> {
    const codeList = Array.isArray(codes) ? codes : [codes];
    if (codeList.length === 0) return true;
    try {
      const res = await fetch('/api/sheets/delete-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes: codeList }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to delete tasks from Google Sheet:', err);
      return false;
    }
  },

  async saveAllToSheet(tasks: Task[]): Promise<boolean> {
    this.saveToCache(tasks);
    try {
      const res = await fetch('/api/sheets/save-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      });
      const data = await res.json();
      return !!data.success;
    } catch {
      return true; // Local cache is saved
    }
  },
};

// --------------------------------------------------------------------
// 2. PROJECT SERVICE
// --------------------------------------------------------------------
export const projectService = {
  getInitialProjects(): Project[] {
    try {
      const cached = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          // Lọc bỏ dự án mẫu cũ (id dạng proj_01 .. proj_03) nếu còn sót trong cache
          return parsed.filter((p: Project) => !/^proj_0[1-3]$/.test(p.id));
        }
      }
    } catch (e) {
      console.warn('Could not read projects from cache:', e);
    }
    return [];
  },

  saveToCache(projects: Project[]): void {
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('Could not save projects to cache:', e);
    }
  },

  async fetchFromSheet(): Promise<Project[]> {
    try {
      const res = await fetch('/api/sheets/projects');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        this.saveToCache(data.data);
        return data.data;
      }
      return this.getInitialProjects();
    } catch (err) {
      console.warn('Fallback to local projects cache:', err);
      return this.getInitialProjects();
    }
  },

  async appendToSheet(project: Project): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/append-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to append project to Google Sheet:', err);
      return false;
    }
  },

  async updateInSheet(project: Project): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/update-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to update project in Google Sheet:', err);
      return false;
    }
  },

  async deleteFromSheet(codes: string[] | string): Promise<boolean> {
    const codeList = Array.isArray(codes) ? codes : [codes];
    if (codeList.length === 0) return true;
    try {
      const res = await fetch('/api/sheets/delete-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes: codeList }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to delete projects from Google Sheet:', err);
      return false;
    }
  },

  async saveAllToSheet(projects: Project[]): Promise<boolean> {
    this.saveToCache(projects);
    try {
      const res = await fetch('/api/sheets/save-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects }),
      });
      const data = await res.json();
      return !!data.success;
    } catch {
      return true;
    }
  },
};

// --------------------------------------------------------------------
// 3. WORKFLOW SERVICE
// --------------------------------------------------------------------
export const workflowService = {
  getInitialWorkflows(): WorkflowTemplate[] {
    try {
      const cached = localStorage.getItem(WORKFLOWS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          // Lọc bỏ quy trình mẫu cũ (id dạng wf_01 .. wf_02) nếu còn sót trong cache
          return parsed.filter((w: WorkflowTemplate) => !/^wf_0[1-2]$/.test(w.id));
        }
      }
    } catch (e) {
      console.warn('Could not read workflows from cache:', e);
    }
    return [];
  },

  saveToCache(workflows: WorkflowTemplate[]): void {
    try {
      localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(workflows));
    } catch (e) {
      console.warn('Could not save workflows to cache:', e);
    }
  },

  async fetchFromSheet(): Promise<WorkflowTemplate[]> {
    try {
      const res = await fetch('/api/sheets/workflows');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        this.saveToCache(data.data);
        return data.data;
      }
      return this.getInitialWorkflows();
    } catch (err) {
      console.warn('Fallback to local workflows cache:', err);
      return this.getInitialWorkflows();
    }
  },

  async appendToSheet(workflow: WorkflowTemplate): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/append-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to append workflow to Google Sheet:', err);
      return false;
    }
  },

  async updateInSheet(workflow: WorkflowTemplate): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/update-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to update workflow in Google Sheet:', err);
      return false;
    }
  },

  async deleteFromSheet(codes: string[] | string): Promise<boolean> {
    const codeList = Array.isArray(codes) ? codes : [codes];
    if (codeList.length === 0) return true;
    try {
      const res = await fetch('/api/sheets/delete-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes: codeList }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to delete workflows from Google Sheet:', err);
      return false;
    }
  },

  async saveAllToSheet(workflows: WorkflowTemplate[]): Promise<boolean> {
    this.saveToCache(workflows);
    try {
      const res = await fetch('/api/sheets/save-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflows }),
      });
      const data = await res.json();
      return !!data.success;
    } catch {
      return true;
    }
  },
};
