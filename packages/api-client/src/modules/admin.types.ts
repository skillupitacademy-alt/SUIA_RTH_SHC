// Admin API response types

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
  roles: string[];
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminQuestion {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  topicId: string;
  createdAt: string;
}

export interface AdminQuestionListResponse {
  questions: AdminQuestion[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminDashboardMetrics {
  totalUsers: number;
  totalExams: number;
  totalQuestions: number;
  activeUsers30d: number;
  averageScore: number;
}
