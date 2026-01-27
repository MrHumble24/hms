import { baseApi as api } from "@/shared/api/base-api";

export const TaskStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const Priority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

export const RoomStatus = {
  CLEAN: "CLEAN",
  DIRTY: "DIRTY",
  INSPECTED: "INSPECTED",
  MAINTENANCE: "MAINTENANCE",
} as const;

export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export interface HousekeepingTask {
  id: string;
  roomId: string;
  room?: any; // Simple type
  assigneeId?: string;
  assignee?: any; // Simple user type
  status: TaskStatus;
  priority: Priority;
  notes?: string;
  completedAt?: string;
  completedById?: string;
  completedBy?: any;
  date: string;
}

export interface CreateHousekeepingTaskDto {
  roomId: string;
  assigneeId?: string;
  priority?: Priority;
  notes?: string;
}

export interface UpdateHousekeepingTaskDto {
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  notes?: string;
  completedById?: string;
}

export const housekeepingApi = {
  findAll: async (params?: {
    skip?: number;
    take?: number;
    search?: string;
    status?: string;
    priority?: string;
  }) => {
    const response = await api.get<{
      data: HousekeepingTask[];
      total: number;
    }>("/housekeeping", { params });
    return response as unknown as { data: HousekeepingTask[]; total: number };
  },

  create: async (data: CreateHousekeepingTaskDto) => {
    const response = await api.post<HousekeepingTask>("/housekeeping", data);
    return response;
  },

  update: async (id: string, data: UpdateHousekeepingTaskDto) => {
    const response = await api.patch<HousekeepingTask>(
      `/housekeeping/${id}`,
      data,
    );
    return response;
  },

  updateRoomStatus: async (
    roomId: string,
    status: RoomStatus,
    userId: string,
    notes?: string,
  ) => {
    const response = await api.post("/housekeeping/room-status", {
      roomId,
      status,
      userId,
      notes,
    });
    return response;
  },

  createTask: async (data: {
    roomId: string;
    assigneeId?: string;
    notes?: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  }) => {
    const response = await api.post("/housekeeping", data);
    return response;
  },
};
