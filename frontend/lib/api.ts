import { User, Patient, Message, Notification, TimelineEvent } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    console.log('API Request:', { url, headers: config.headers });

    const response = await fetch(url, config);

    console.log('API Response:', { status: response.status, ok: response.ok });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      console.error('API Error:', error);
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async syncUser(data: {
    kindeUser: any;
    accessToken: string;
  }) {
    return this.request<{ success: boolean; data: { user: User; token: string } }>('/auth/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string) {
    const response = await this.request<{ success: boolean; data: { user: User; token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) {
    return this.request<{ success: boolean; data: { user: User; token: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getMe() {
    return this.request<{ success: boolean; data: User }>('/auth/me');
  }

  async updateProfile(updates: { name?: string; email?: string }) {
    return this.request<{ success: boolean; data: User }>('/auth/updatedetails', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updatePassword(passwords: { currentPassword: string; newPassword: string }) {
    return this.request<{ success: boolean; message: string }>('/auth/updatepassword', {
      method: 'PUT',
      body: JSON.stringify(passwords),
    });
  }

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return this.request('/auth/logout');
  }

  // Patient endpoints
  async getPatients(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request<{ success: boolean; data: Patient[]; pagination: any }>(
      `/patients${query ? `?${query}` : ''}`
    );
  }

  async getPatient(id: string) {
    return this.request<{ success: boolean; data: Patient }>(`/patients/${id}`);
  }

  async createPatient(patientData: Omit<Patient, 'id' | 'medicalRecordNumber' | 'admissionDate'>) {
    return this.request<{ success: boolean; data: Patient }>('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  async updatePatient(id: string, updates: Partial<Patient>) {
    return this.request<{ success: boolean; data: Patient }>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePatient(id: string) {
    return this.request<{ success: boolean; message: string }>(`/patients/${id}`, {
      method: 'DELETE',
    });
  }

  async addVital(patientId: string, vitalData: {
    type: string;
    value: string | number;
    unit: string;
    notes?: string;
  }) {
    return this.request<{ success: boolean; data: any }>(`/patients/${patientId}/vitals`, {
      method: 'POST',
      body: JSON.stringify(vitalData),
    });
  }

  async addMedication(patientId: string, medicationData: {
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    instructions?: string;
  }) {
    return this.request<{ success: boolean; data: any }>(`/patients/${patientId}/medications`, {
      method: 'POST',
      body: JSON.stringify(medicationData),
    });
  }

  async addReport(patientId: string, reportData: {
    type: string;
    title: string;
    content: string;
  }) {
    return this.request<{ success: boolean; data: any }>(`/patients/${patientId}/reports`, {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async getPatientStats(patientId: string) {
    return this.request<{ success: boolean; data: any }>(`/patients/${patientId}/stats`);
  }

  // Message endpoints
  async getMessages(patientId: string) {
    return this.request<{ success: boolean; data: Message[] }>(`/messages/${patientId}`);
  }

  async sendMessage(messageData: { patientId: string; content: string }) {
    return this.request<{ success: boolean; data: Message }>('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async markMessagesAsRead(patientId: string) {
    return this.request<{ success: boolean; message: string }>(`/messages/${patientId}/read`, {
      method: 'PUT',
    });
  }

  async getUnreadMessageCount() {
    return this.request<{ success: boolean; data: { unreadCount: number } }>('/messages/unread');
  }

  // Notification endpoints
  async getNotifications(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<{ success: boolean; data: Notification[]; pagination: any }>(
      `/notifications${query ? `?${query}` : ''}`
    );
  }

  async markNotificationAsRead(id: string) {
    return this.request<{ success: boolean; data: Notification }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<{ success: boolean; message: string }>('/notifications/read-all', {
      method: 'PUT',
    });
  }

  async deleteNotification(id: string) {
    return this.request<{ success: boolean; message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  async getUnreadNotificationCount() {
    return this.request<{ success: boolean; data: { unreadCount: number } }>(
      '/notifications/unread-count'
    );
  }

  async createNotification(notificationData: {
    recipientId: string;
    type: string;
    title: string;
    message: string;
    patientId?: string;
  }) {
    return this.request<{ success: boolean; data: Notification }>('/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }

  // Timeline endpoints
  async getTimeline(patientId: string, params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<{ success: boolean; data: TimelineEvent[]; pagination: any }>(
      `/timeline/${patientId}${query ? `?${query}` : ''}`
    );
  }

  async createTimelineEvent(eventData: {
    patientId: string;
    type: string;
    description: string;
    metadata?: any;
  }) {
    return this.request<{ success: boolean; data: TimelineEvent }>('/timeline', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async getTimelineByType(patientId: string, type: string) {
    return this.request<{ success: boolean; data: TimelineEvent[] }>(`/timeline/${patientId}/type/${type}`);
  }

  async getTimelineSummary(patientId: string) {
    return this.request<{ success: boolean; data: any }>(`/timeline/${patientId}/summary`);
  }
}

export const apiService = new ApiService();