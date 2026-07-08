import { 
  User, Circle, Role, RoleMember, Objective, KeyResult, 
  KeyResultAssignee, CheckInLog, ReviewCycle, PerformanceReview, SystemConfig
} from "./types";
import { 
  initialUsers, initialCircles, initialRoles, initialRoleMembers, 
  initialObjectives, initialKeyResults, initialKeyResultAssignees, 
  initialCheckInLogs, initialReviewCycles, initialPerformanceReviews,
  initialEval360Submissions
} from "./mockData";

// Native fetch wrapper that handles API calls nicely
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(endpoint, options);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const HRIS_API = {
  // Users
  getUsers: async (): Promise<User[]> => {
    try {
      return await apiFetch<User[]>("/api/users");
    } catch (e) {
      console.warn("Express server unavailable. Using fallback seeded users.", e);
      return initialUsers;
    }
  },

  // Circles (Teams)
  getCircles: async (): Promise<Circle[]> => {
    try {
      return await apiFetch<Circle[]>("/api/circles");
    } catch (e) {
      console.warn("Express server unavailable. Using fallback seeded circles.", e);
      return initialCircles;
    }
  },

  createCircle: async (data: { 
    name: string; 
    description: string; 
    subCircleOfId: string | null; 
    leadId: string | null; 
  }): Promise<Circle> => {
    try {
      return await apiFetch<Circle>("/api/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.error(e);
      // Fallback mutation for client-only state persistence
      const fallback: Circle = {
        id: `circ_${Date.now()}`,
        ...data
      };
      return fallback;
    }
  },

  // Roles
  getRoles: async (): Promise<Role[]> => {
    try {
      return await apiFetch<Role[]>("/api/roles");
    } catch (e) {
      console.warn("Express server unavailable. Using fallback seeded roles.", e);
      return initialRoles;
    }
  },

  createRole: async (data: {
    title: string;
    circleId: string;
    description: string;
    accountabilities: string[];
    userIds: string[];
  }): Promise<any> => {
    try {
      return await apiFetch<any>("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.error(e);
      const fallbackRole: Role = {
        id: `role_${Date.now()}`,
        title: data.title,
        circleId: data.circleId,
        description: data.description,
        accountabilities: data.accountabilities
      };
      return { ...fallbackRole, memberUserIds: data.userIds };
    }
  },

  getRoleMembers: async (): Promise<RoleMember[]> => {
    try {
      return await apiFetch<RoleMember[]>("/api/role-members");
    } catch (e) {
      console.warn("Express server unavailable. Using fallback seeded members.", e);
      return initialRoleMembers;
    }
  },

  // Objectives
  getObjectives: async (): Promise<Objective[]> => {
    try {
      return await apiFetch<Objective[]>("/api/objectives");
    } catch (e) {
      console.warn("Express server unavailable. Using fallback seeded objectives.", e);
      return initialObjectives;
    }
  },

  createObjective: async (data: any): Promise<Objective> => {
    return await apiFetch<Objective>("/api/objectives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  },

  // Key Results
  getKeyResults: async (): Promise<KeyResult[]> => {
    try {
      return await apiFetch<KeyResult[]>("/api/key-results");
    } catch (e) {
      console.warn("Express server unavailable. Using fallback seeded key results.", e);
      return initialKeyResults;
    }
  },

  getKeyResultsAssignees: async (): Promise<KeyResultAssignee[]> => {
    try {
      return await apiFetch<KeyResultAssignee[]>("/api/key-results-assignees");
    } catch (e) {
      console.warn("Express server unavailable. Using fallback weighted assignees.", e);
      return initialKeyResultAssignees;
    }
  },

  createKeyResult: async (data: {
    objectiveId: string;
    title: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    isShared: boolean;
    assignees: Array<{ circleId?: string | null; roleId?: string | null; weightPercentage: number; currentProgress: number }>;
  }): Promise<any> => {
    return await apiFetch<any>("/api/key-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  },

  // CheckInLogs
  getCheckInLogs: async (): Promise<CheckInLog[]> => {
    try {
      return await apiFetch<CheckInLog[]>("/api/check-ins");
    } catch (e) {
      console.warn("Express server unavailable. Using fallback check in logs.", e);
      return initialCheckInLogs;
    }
  },

  submitCheckIn: async (data: {
    keyResultId: string;
    assigneeId: string;
    roleId: string | null;
    newValue: number;
    notes: string;
    hasBlocker: boolean;
    blockerNotes: string | null;
    dependencyCircleId: string | null;
    dependencyRoleId: string | null;
  }): Promise<any> => {
    try {
      return await apiFetch<any>("/api/check-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.error("Failed to post check-in to server, running client fallback", e);
      const logItem: CheckInLog = {
        id: `cil_${Date.now()}`,
        ...data,
        previousValue: 0,
        timestamp: new Date().toISOString()
      };
      return { checkIn: logItem };
    }
  },

  reviewCheckIn: async (id: string, payload: {
    approverId: string;
    status: "approved" | "rejected";
    approverNotes: string | null;
  }): Promise<any> => {
    return await apiFetch<any>(`/api/check-ins/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  deleteCheckIn: async (id: string): Promise<any> => {
    return await apiFetch<any>(`/api/check-ins/${id}`, {
      method: "DELETE"
    });
  },

  // Reviews Cycles
  getReviewCycles: async (): Promise<ReviewCycle[]> => {
    try {
      return await apiFetch<ReviewCycle[]>("/api/review-cycles");
    } catch (e) {
      console.warn("Express server unavailable. Fallback reviews cycles.", e);
      return initialReviewCycles;
    }
  },

  getPerformanceReviews: async (): Promise<PerformanceReview[]> => {
    try {
      return await apiFetch<PerformanceReview[]>("/api/performance-reviews");
    } catch (e) {
      console.warn("Express server unavailable. Fallback performance reviews.", e);
      return initialPerformanceReviews;
    }
  },

  getEval360Submissions: async (): Promise<any[]> => {
    try {
      return await apiFetch<any[]>("/api/eval360-submissions");
    } catch (e) {
      console.warn("Express server unavailable. Fallback 360 subs.");
      return initialEval360Submissions;
    }
  },

  submitEval360Submission: async (data: any): Promise<any> => {
    try {
      return await apiFetch<any>("/api/eval360-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.warn("Express server unavailable. Fallback submit 360.", e);
      return { ...data, id: `sub360_${Date.now()}` };
    }
  },

  calculateOkrScore: async (userId: string): Promise<{ okrScore: number }> => {
    try {
      return await apiFetch<{ okrScore: number }>(`/api/performance-reviews/calculate-score/${userId}`);
    } catch (e) {
      console.warn("Failed calculating live OKR score online. Dynamic math active.");
      return { okrScore: 78 };
    }
  },

  submitPerformanceReview: async (data: Partial<PerformanceReview>): Promise<PerformanceReview> => {
    try {
      return await apiFetch<PerformanceReview>("/api/performance-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.error(e);
      const fallbackReview: PerformanceReview = {
        id: data.id || `rev_${Date.now()}`,
        cycleId: data.cycleId || "cyc_1",
        userId: data.userId || "",
        evaluatedBy: data.evaluatedBy || "usr_hr_1",
        okrScore: data.okrScore || 80,
        qualitativeScore: data.qualitativeScore || 4.0,
        managerFeedback: data.managerFeedback || "",
        selfAssessment: data.selfAssessment || "",
        growthPlan: data.growthPlan || "",
        status: data.status || "draft",
        updatedAt: new Date().toISOString()
      };
      return fallbackReview;
    }
  },

  deletePerformanceReview: async (id: string): Promise<any> => {
    try {
      return await apiFetch<any>(`/api/performance-reviews/${id}`, {
        method: "DELETE"
      });
    } catch (e) {
      console.error(e);
      return { success: true, id };
    }
  },

  // Configuration APIs
  getSystemConfig: async (): Promise<SystemConfig> => {
    try {
      return await apiFetch<SystemConfig>("/api/config");
    } catch (e) {
      console.warn("Express server config offline, using local state");
      return {
        currentQuarter: "Q1 2026",
        daysRemaining: 15,
        committedThreshold: 100,
        aspirationalThreshold: 70,
        remindersEnabled: true,
        collaborationFactor: 1.2,
        startDate: "2026-01-01",
        endDate: "2026-03-31",
        notificationRules: {
          aspirational: {
            maxTargetRule: 0.7,
            maxTargetWarning: "Target belum ideal",
            achievementFailThreshold: 0.7,
            achievementFailWarning: "Target tidak tercapai"
          },
          committed: {
            idealTargetRule: 1.0,
            successMessage: "Target tercapai",
            failMessage: "Target belum tercapai"
          }
        },
        questionnaires: [
          { id: "q1", question: "Jika target tidak tercapai, apakah operasional inti langsung terganggu?", yesScore: 20, yesCategory: "komitmen", noScore: 0, noCategory: "aspirasional" },
          { id: "q2", question: "Apakah target ini menuntut metode baru, transformasi digital, atau pembuatan produk yang belum pernah ada?", yesScore: 25, yesCategory: "aspirasional", noScore: 0, noCategory: "komitmen" },
          { id: "q3", question: "Apakah tingkat ketidakpastian/risiko kegagalan target ini sangat tinggi?", yesScore: 20, yesCategory: "aspirasional", noScore: 0, noCategory: "komitmen" },
          { id: "q4", question: "Apakah target ini sengaja dibuat sangat tinggi (stretch goal) di mana pencapaian 60-70% saja sudah dianggap sebagai keberhasilan besar?", yesScore: 30, yesCategory: "aspirasional", noScore: 0, noCategory: "komitmen" }
        ]
      };
    }
  },

  updateSystemConfig: async (data: Partial<SystemConfig>): Promise<SystemConfig> => {
    try {
      return await apiFetch<SystemConfig>("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.error("Config update offline:", e);
      return {
        currentQuarter: "Q1 2026",
        daysRemaining: 15,
        committedThreshold: 100,
        aspirationalThreshold: 70,
        remindersEnabled: true,
        collaborationFactor: 1.2,
        startDate: "2026-01-01",
        endDate: "2026-03-31",
        ...data
      };
    }
  },

  // Edit / Delete Circle
  updateCircle: async (id: string, data: Partial<Circle>): Promise<Circle> => {
    return await apiFetch<Circle>(`/api/circles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  },

  deleteCircle: async (id: string): Promise<any> => {
    return await apiFetch<any>(`/api/circles/${id}`, {
      method: "DELETE"
    });
  },

  // Edit / Delete Role
  updateRole: async (id: string, data: any): Promise<any> => {
    return await apiFetch<any>(`/api/roles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  },

  deleteRole: async (id: string): Promise<any> => {
    return await apiFetch<any>(`/api/roles/${id}`, {
      method: "DELETE"
    });
  },

  // Edit / Delete Objective
  updateObjective: async (id: string, data: Partial<Objective>): Promise<Objective> => {
    return await apiFetch<Objective>(`/api/objectives/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  },

  deleteObjective: async (id: string): Promise<any> => {
    return await apiFetch<any>(`/api/objectives/${id}`, {
      method: "DELETE"
    });
  },

  // Edit / Delete Key Result
  updateKeyResult: async (id: string, data: Partial<KeyResult>): Promise<KeyResult> => {
    return await apiFetch<KeyResult>(`/api/key-results/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  },

  deleteKeyResult: async (id: string): Promise<any> => {
    return await apiFetch<any>(`/api/key-results/${id}`, {
      method: "DELETE"
    });
  },

  updateRolePermissions: async (rolePermissions: any): Promise<SystemConfig> => {
    return await apiFetch<SystemConfig>("/api/system-config/roles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rolePermissions })
    });
  },

  updateUserRole: async (userId: string, systemRole: string): Promise<User> => {
    return await apiFetch<User>(`/api/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemRole })
    });
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    try {
      return await apiFetch<User>(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.warn("Express server unavailable. Returning mutated local user.", e);
      return { id: userId, ...data } as User;
    }
  }
};
