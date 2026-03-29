/**
 * Shared API types. Keep in sync with API responses and Prisma models.
 */

export type StressMode = "DISCOVERY" | "EXECUTION" | "SURVIVAL";

export interface VentureSummary {
  id: string;
  name: string;
  description?: string | null;
  stage: number;
  stressLevel: number;
  stressMode: StressMode;
  cashRunwayMonths?: number | null;
  lastActivityAt?: string | null;
  createdAt: string;
}

export interface VentureDetail extends VentureSummary {
  monthlyBurn?: number | null;
  monthlyRevenue?: number | null;
  stages: { stageNumber: number; completed: boolean; data?: unknown; completedAt?: string | null }[];
}

export interface VentureSummaryResponse {
  venture: VentureDetail;
  stress: { stressLevel: number; mode: StressMode; factors: { runway: number | null; overdueTasks: number; daysSinceLogin: number } };
}

export interface Task {
  id: string;
  ventureId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  completed: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  ventureId: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  read: boolean;
  dismissed: boolean;
  createdAt: string;
}

export interface ApiError {
  error: string;
  code?: string;
}
