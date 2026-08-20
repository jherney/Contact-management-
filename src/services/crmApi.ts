import { Task, Deal, Company, Reminder } from '../types';

interface ApiResult<T> {
  data: T | null;
  error: string | null;
}

async function csrfFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('_csrf='));
  const headers = new Headers(init.headers);
  if (token) {
    headers.set('X-CSRF-Token', decodeURIComponent(token.split('=')[1]));
  }
  return fetch(input, { ...init, headers, credentials: 'include' });
}

class TasksApi {
  async list(): Promise<Task[]> {
    const res = await csrfFetch('/api/tasks');
    if (!res.ok) throw new Error('Failed to fetch tasks');
    const data = await res.json();
    return data.tasks || [];
  }

  async create(task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const res = await csrfFetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    if (!res.ok) throw new Error('Failed to create task');
    const data = await res.json();
    return data.task;
  }

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const res = await csrfFetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update task');
    const data = await res.json();
    return data.task;
  }

  async delete(id: string): Promise<void> {
    await csrfFetch(`/api/tasks/${id}`, { method: 'DELETE' });
  }
}

class DealsApi {
  async list(): Promise<Deal[]> {
    const res = await csrfFetch('/api/deals');
    if (!res.ok) throw new Error('Failed to fetch deals');
    const data = await res.json();
    return data.deals || [];
  }

  async create(deal: Omit<Deal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Deal> {
    const res = await csrfFetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deal)
    });
    if (!res.ok) throw new Error('Failed to create deal');
    const data = await res.json();
    return data.deal;
  }

  async update(id: string, updates: Partial<Deal>): Promise<Deal> {
    const res = await csrfFetch(`/api/deals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update deal');
    const data = await res.json();
    return data.deal;
  }

  async delete(id: string): Promise<void> {
    await csrfFetch(`/api/deals/${id}`, { method: 'DELETE' });
  }
}

class CompaniesApi {
  async list(): Promise<Company[]> {
    const res = await csrfFetch('/api/companies');
    if (!res.ok) throw new Error('Failed to fetch companies');
    const data = await res.json();
    return data.companies || [];
  }

  async create(company: Omit<Company, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    const res = await csrfFetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company)
    });
    if (!res.ok) throw new Error('Failed to create company');
    const data = await res.json();
    return data.company;
  }

  async update(id: string, updates: Partial<Company>): Promise<Company> {
    const res = await csrfFetch(`/api/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update company');
    const data = await res.json();
    return data.company;
  }

  async delete(id: string): Promise<void> {
    await csrfFetch(`/api/companies/${id}`, { method: 'DELETE' });
  }
}

class RemindersApi {
  async list(): Promise<Reminder[]> {
    const res = await csrfFetch('/api/reminders');
    if (!res.ok) throw new Error('Failed to fetch reminders');
    const data = await res.json();
    return data.reminders || [];
  }

  async due(): Promise<Reminder[]> {
    const res = await csrfFetch('/api/reminders/due');
    if (!res.ok) throw new Error('Failed to fetch due reminders');
    const data = await res.json();
    return data.reminders || [];
  }

  async create(reminder: Omit<Reminder, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Reminder> {
    const res = await csrfFetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reminder)
    });
    if (!res.ok) throw new Error('Failed to create reminder');
    const data = await res.json();
    return data.reminder;
  }

  async update(id: string, updates: Partial<Reminder>): Promise<Reminder> {
    const res = await csrfFetch(`/api/reminders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update reminder');
    const data = await res.json();
    return data.reminder;
  }

  async delete(id: string): Promise<void> {
    await csrfFetch(`/api/reminders/${id}`, { method: 'DELETE' });
  }
}

export const tasksApi = new TasksApi();
export const dealsApi = new DealsApi();
export const companiesApi = new CompaniesApi();
export const remindersApi = new RemindersApi();
