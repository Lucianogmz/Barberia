// API client for communicating with the NestJS backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOpts } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOpts,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? `Error ${response.status}`);
  }

  return response.json();
}

// ============================================
// Public API (no auth required)
// ============================================

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMin: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface AppointmentResponse {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  priceAtBooking: number;
  googleEventId: string | null;
  notes: string | null;
  service: { name: string; durationMin: number };
  client: { name: string; email: string; phone: string };
  createdAt: string;
}

export interface CreateAppointmentData {
  serviceId: string;
  startTime: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes?: string;
}

/** Get active services (public) */
export const getServices = () => fetchAPI<Service[]>('/services');

/** Get available slots for a date and service (public) */
export const getAvailableSlots = (date: string, serviceId: string) =>
  fetchAPI<TimeSlot[]>(`/appointments/available-slots?date=${date}&serviceId=${serviceId}`);

/** Create a new appointment (public) */
export const createAppointment = (data: CreateAppointmentData) =>
  fetchAPI<AppointmentResponse>('/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// ============================================
// Protected API (barber JWT required)
// ============================================

export interface RevenueSummary {
  today: { revenue: number; completedCount: number; pendingCount: number };
  week: { revenue: number; completedCount: number };
  month: { revenue: number; completedCount: number };
}

export interface MonthlyRevenue {
  totalRevenue: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  pendingCount: number;
}

export interface ServiceBreakdown {
  serviceId: string;
  serviceName: string;
  count: number;
  revenue: number;
}

export interface ShiftRange {
  start: string;
  end: string;
}

export interface ScheduleDay {
  dayOfWeek: number;
  dayName: string;
  isActive: boolean;
  morning: ShiftRange;
  afternoon: ShiftRange | null;
}

/** Register Google tokens and get JWT */
export const registerTokens = (data: {
  email: string;
  name: string;
  image?: string;
  googleAccessToken: string;
  googleRefreshToken: string;
  googleTokenExpiry: string;
}) =>
  fetchAPI<{ user: any; accessToken: string }>('/auth/register-tokens', {
    method: 'POST',
    body: JSON.stringify(data),
  });

/** Get all services including inactive (protected) */
export const getAllServices = (token: string) =>
  fetchAPI<Service[]>('/services/all', { token });

/** Create a service (protected) */
export const createService = (token: string, data: Omit<Service, 'id'>) =>
  fetchAPI<Service>('/services', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });

/** Update a service (protected) */
export const updateService = (token: string, id: string, data: Partial<Service>) =>
  fetchAPI<Service>(`/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    token,
  });

/** Delete (deactivate) a service (protected) */
export const deleteService = (token: string, id: string) =>
  fetchAPI<Service>(`/services/${id}`, {
    method: 'DELETE',
    token,
  });

/** Get appointments (protected) */
export const getAppointments = (token: string, date?: string, status?: string) => {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (status) params.set('status', status);
  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchAPI<AppointmentResponse[]>(`/appointments${query}`, { token });
};

/** Update appointment status (protected) */
export const updateAppointmentStatus = (token: string, id: string, status: string) =>
  fetchAPI<AppointmentResponse>(`/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    token,
  });

/** Get dashboard summary (protected) */
export const getDashboardSummary = (token: string) =>
  fetchAPI<RevenueSummary>('/revenue/summary', { token });

/** Get monthly revenue (protected) */
export const getMonthlyRevenue = (token: string, year: number, month: number) =>
  fetchAPI<MonthlyRevenue>(`/revenue/monthly?year=${year}&month=${month}`, { token });

/** Get service breakdown (protected) */
export const getServiceBreakdown = (token: string, year: number, month: number) =>
  fetchAPI<ServiceBreakdown[]>(`/revenue/services?year=${year}&month=${month}`, { token });

/** Get work schedule (protected) */
export const getSchedule = (token: string) =>
  fetchAPI<ScheduleDay[]>('/schedule', { token });

/** Update work schedule (protected) */
export const updateSchedule = (token: string, schedule: Omit<ScheduleDay, 'dayName'>[]) =>
  fetchAPI<ScheduleDay[]>('/schedule', {
    method: 'PUT',
    body: JSON.stringify({ schedule }),
    token,
  });
