export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
}

export interface Family {
  id: string;
  name: string;
  created_at: string;
}

export interface Member {
  id: string;
  family_id: string;
  user_id: string;
  display_name: string;
  avatar_url: string;
  role: 'parent' | 'child';
  task_list_id: string;
  joined_at: string;
}

export interface FamilyResponse {
  family: Family;
  members: Member[];
}

export interface InviteMemberRequest {
  email: string;
  role: 'parent' | 'child';
}

export interface Task {
  id: string;
  task_list_id: string;
  title: string;
  description: string;
  assigned_to: string | null;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'done';
}

export interface TaskList {
  id: string;
  title: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  task_list_id?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  task_list_id?: string;
}

export interface Quote {
  id: string;
  family_id: string;
  added_by: string;
  text: string;
  author: string | null;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  family_id: string;
  google_event_id: string;
  calendar_id: string;
  title: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  description: string | null;
  location: string | null;
  synced_at: string;
}

export interface DashboardData {
  upcoming_events: CalendarEvent[];
  pending_tasks: Task[];
  quote: Quote | null;
}
