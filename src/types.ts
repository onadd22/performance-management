export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  department: string;
  systemRole?:
    | "karyawan"
    | "atasan_langsung"
    | "atasan_tidak_langsung"
    | "direksi"; // Access role
  managerId?: string; // Optional custom supervisor ID for employee reporting structure
}

export interface Circle {
  id: string;
  name: string;
  description: string;
  subCircleOfId: string | null; // Null for root circle, otherwise points to parent circle
  leadId: string | null; // Circle Lead (Manager)
  circleType?: "department" | "cross_functional" | "platform" | "supporting"; // GKM Modular Sektor types
}

export interface Role {
  id: string;
  title: string;
  circleId: string;
  description: string;
  accountabilities: string[]; // List of duties/purposes
}

export interface RoleMember {
  id: string;
  userId: string;
  roleId: string;
}

export type ObjectiveLevel = "company" | "circle";

export interface Objective {
  id: string;
  title: string;
  level: ObjectiveLevel;
  circleId: string | null; // Null if Company-level Objective, else linked to Circle
  parentId: string | null; // For alignment with Parent Objective
  targetQuarter: string; // e.g. "Q1 2026", "Mid-Year 2026"
  approverId?: string; // User ID of the person who approves this OKR (useful for cross-functional projects)
  status?: "draft" | "pending" | "approved" | "rejected";
  currentApprovalStep?: number; // Index of the approvalWorkflow
}

export interface KeyResultTask {
  id: string;
  description: string;
  status: "pending" | "completed";
}

export interface KeyResult {
  id: string;
  objectiveId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string; // "%", "Leads", "USD", etc.
  progress: number; // Combined progress percentage (0 - 100)
  isShared: boolean; // True if shared across multiple Roles/Circles
  alignmentType?: "standard" | "shared" | "dependency";
  dependencyKrId?: string;
  weight: number; // Weight of this KR within the Objective (0 - 100)
  okrType?: "committed" | "aspirational"; // Committed vs Aspirational OKR
  calcSystem?: "maximize" | "minimize" | "min_to_zero"; // For BSC/KPI method
  penaltyFactor?: number; // percentage penalty for min_to_zero (e.g., 20 means 20%)
  status?: "draft" | "pending" | "approved" | "rejected";
  currentApprovalStep?: number;
  tasks?: KeyResultTask[];
}

export interface KeyResultAssignee {
  id: string;
  keyResultId: string;
  circleId: string | null;
  roleId: string | null;
  weightPercentage: number; // Split contribution weight (e.g. 70 means 70% weight)
  currentProgress: number; // Assignee's specific progress (0 to 100 scale)
}

export interface CheckInLog {
  id: string;
  keyResultId: string;
  assigneeId: string; // User who checked-in
  roleId: string | null; // Role from which check-in is made
  previousValue: number;
  newValue: number;
  notes: string;
  blockerNotes: string | null;
  hasBlocker: boolean;
  dependencyCircleId: string | null; // Blocker dependency tag
  dependencyRoleId: string | null;
  timestamp: string; // ISO Date string
  status?: "pending" | "approved" | "rejected"; // Approval status
  approverId?: string | null; // User who approved/rejected
  approverNotes?: string | null; // Feedback from reviewer
  approverIds?: string[]; // Circle lead User IDs who can approve this
  updateFrequency?: "weekly" | "monthly";
  attachmentName?: string;
}

export interface ReviewCycle {
  id: string;
  name: string;
  status: "active" | "completed";
  startDate: string;
  endDate: string;
}

export interface KpiItem {
  id: string;
  name: string;
  weight: number; // weight in percentage (0 - 100)
  target: number;
  actual: number;
  unit: string;
  score: number; // score based on achievement
  calcSystem?: "maximize" | "minimize" | "min_to_zero";
  penaltyFactor?: number;
  tasks?: KeyResultTask[];
}

export interface BscPerspective {
  id: string;
  name: string;
  weight: number; // weight in percentage (0 - 100)
  target?: number;
  actual?: number;
  unit?: string;
  calcSystem?: "maximize" | "minimize" | "min_to_zero";
  penaltyFactor?: number; // percentage penalty for min_to_zero (e.g., 20 means 20%)
  score: number; // score (0 - 100)
  tasks?: KeyResultTask[];
}

export interface Rater360Group {
  id: "self" | "manager" | "peer" | "subordinate";
  name: string;
  weight: number; // weight in percentage (0 - 100)
  score: number; // score (0 - 100)
}

export interface PerformanceReview {
  id: string;
  cycleId: string;
  userId: string;
  evaluatedBy: string; // Manager/Lead User ID
  okrScore: number; // Calculated automatically (0 - 100)
  qualitativeScore: number; // Evaluator score (1 - 5 stars)
  managerFeedback: string;
  selfAssessment: string;
  growthPlan: string;
  status: "draft" | "submitted" | "approved";
  updatedAt: string;
  
  // Custom KPI & BSC 360 properties
  reviewMethod?: "okr" | "kpi" | "bsc360";
  kpis?: KpiItem[];
  bscPerspectives?: BscPerspective[];
  raterGroups360?: Rater360Group[];
  finalCalculatedScore?: number; // combined score

  // Advanced Performance Review Integration fields
  strength?: string;
  developmentArea?: string;
  promotionReadiness?: "Ready Now" | "Ready < 1 Year" | "Ready 2 Years" | "Not Ready";
  recommendedActions?: string[]; // Leadership Training, etc.
  careerSuggestion?: "Promote" | "Maintain" | "Lateral Move" | "Job Enrichment" | "Talent Pool" | "Critical Talent" | "Successor" | "Fast Track" | "Watch List";
  trainingSuggestion?: string;
  risk?: string;
  comment?: string;
  managerRating?: number;
  hrRating?: number;
  calibrationRating?: number;
  finalRating?: number;
  auditTrail?: { before: string; after: string; user: string; date: string; reason: string }[];
  approvalStatus?: "Draft" | "Submitted" | "Reviewed" | "Calibrated" | "Approved" | "Published";
  calibrated9BoxCode?: string;
}

export interface QuestionnaireItem {
  id: string;
  question: string;
  yesScore: number;
  yesCategory: "komitmen" | "aspirasional";
  noScore: number;
  noCategory: "komitmen" | "aspirasional";
}

export interface NotificationRules {
  aspirational: {
    maxTargetRule: number;
    maxTargetWarning: string;
    achievementFailThreshold: number;
    achievementFailWarning: string;
  };
  committed: {
    idealTargetRule: number;
    successMessage: string;
    failMessage: string;
  };
}

export interface RolePermission {
  id: string; // 'karyawan', 'direksi', 'atasan_langsung', etc.
  name: string;
  canViewAllReports: boolean;
  canEditAllReports: boolean;
  canManageOrgStructure: boolean;
}

export interface PerformanceCategory {
  id: string;
  name: string;
  minScore: number;
  maxScore: number;
  color: string;
}

export interface MetricItem {
  id: string;
  nameID: string;
  nameEN: string;
  category: "performance" | "360" | "succession";
  definitionID: string;
  definitionEN: string;
  formulaID: string;
  formulaEN: string;
  sourceID: string;
  sourceEN: string;
  exampleID: string;
  exampleEN: string;
  iconName?: string;
}

export interface SystemConfig {
  currentQuarter: string;
  daysRemaining: number;
  committedThreshold: number;
  aspirationalThreshold: number;
  remindersEnabled: boolean;
  collaborationFactor: number;
  startDate?: string; // e.g. "2026-01-01"
  endDate?: string; // e.g. "2026-03-31"
  selectedStructure?: "holacracy" | "hierarchy";
  orgStructureTerms?: {
    circle: string; // e.g. "Circle" or "Department"
    role: string; // e.g. "Role" or "Position"
  };
  notificationRules?: NotificationRules;
  questionnaires?: QuestionnaireItem[];
  rolePermissions?: RolePermission[];
  defaultReviewMethod?: "okr" | "kpi" | "bsc360";
  defaultKpis?: KpiItem[];
  defaultBscPerspectives?: BscPerspective[];
  defaultRaterGroups360?: Rater360Group[];
  performanceCategories?: PerformanceCategory[];
  potentialClassifications?: { label: string; min: number; max: number; color: string; description: string }[];
  successionPoolConfig?: {
    sriWeights: { performance: number; potential: number; leadership: number; tenure: number; readiness: number };
    minSriThreshold: number;
    eligible9BoxQuadrants: string[];
  };
  evaluationFrequency?: "monthly" | "quarterly" | "semi_annually" | "annually";
  finalScoreWeights?: {
    objective: number;
    competency: number;
  };
  metricsGlossary?: MetricItem[];
  approvalWorkflow?: string[]; // Array of role IDs for approval sequence

  anonymous360?: boolean;
  calcSystemConfig?: {
    maximizeMaxScore?: number;
    minimizeMaxScore?: number;
    defaultPenaltyFactor?: number;
    baseEffortScore?: number; // legacy
    maximizeBaseScore?: number;
    minimizeBaseScore?: number;
    minToZeroBaseScore?: number;
  };
  maxTotalWeightConfig?: {
    okrMaxWeight?: number;
    kpiMaxWeight?: number;
    bscMaxWeight?: number;
  };
  eval360Templates?: Eval360Template[];
  assignments?: {
    id: string;
    targetType: "all" | "department" | "role" | "employee";
    targetId: string | string[] | null;
  }[];
  multiRater360Config?: {
    enabled: boolean;
    evaluatorAssignments: { evaluatorId: string; evaluateeId: string; groupId: string; jobTitle?: string }[];
    questionTemplates: { id: string; category: string; question: string; weight: number }[];
    weightSupervisor: number;
    weightPeer: number;
    weightSubordinate: number;
    weightSelf: number;
    weightCrossDept: number;
  };
  bellCurvePolicy?: {
    rating: string;
    percentage: number;
    minScore: number;
    maxScore: number;
    color: string;
  }[];
}

export type QuestionType = "multiple_choice" | "free_text";

export interface QuestionOption {
  id: string;
  text: string;
  value: number;
}

export interface Eval360Question {
  id: string;
  text: string;
  category: string;
  weight: number;
  type: QuestionType;
  options?: QuestionOption[];
}

export interface Eval360RaterWeight {
  groupId: string;
  name: string;
  weight: number;
}

export interface Eval360Assignment {
  id: string;
  targetType: "user" | "role" | "circle" | "all";
  targetId: string | string[] | null;
}

export interface RoleSetting {
  enabled: boolean;
  targetType: "all" | "department" | "employee";
  targetIds: string[];
}

export interface RaterCategorySetting extends RoleSetting {
  id: string;
  label: string;
  weight: number;
}

export interface Eval360AssessmentSettings {
  raterCategories: RaterCategorySetting[];
  minPeer: number;
  maxPeer: number;
  anonymousFeedback: boolean;
  autoApprove: boolean;
  requireAllRaters: boolean;
}

export interface Eval360Template {
  id: string;
  name: string;
  description: string;
  evaluateeId: string;
  startDate?: string;
  endDate?: string;
  questions: Eval360Question[];
  raterWeights: Eval360RaterWeight[];
  assignments: Eval360Assignment[];
  raterAssignments: { 
    id: string; 
    evaluateeId: string; 
    evaluatorId: string; 
    groupId: string; 
    jobTitle: string; 
    weight: number 
  }[];
  assessmentSettings?: Eval360AssessmentSettings;
  status: "draft" | "active" | "archived";
}

export interface Eval360Submission {
  id: string;
  templateId: string;
  evaluateeId: string; // The person being evaluated
  evaluatorId: string; // The person giving the evaluation
  groupId: string; // "supervisor" | "peer" | "subordinate" | "cross_department" | "self"
  answers: { questionId: string; score: number }[]; // score mapping usually 1-5 or 1-100
  status: "draft" | "submitted";
  submittedAt?: string;
  reviewCycleId?: string; // Optional linkage to cycle
}

export interface TalentEmployee {
  id: string;
  name: string;
  gender: "Male" | "Female";
  age: number;
  department: string;
  position: string;
  division: string;
  location: string;
  joinDate: string;
  tenureYears: number;
  performanceScore: number;
  potentialScore: number;
  boxId: string;
  badges: string[];
  riskLevel: "Low" | "Medium" | "High";
  readinessLevel: "Ready Now" | "1-2 Years" | "3-5 Years";
  leadershipScore: number;
  status: "Active" | "Leave" | "Resigned";
  avatar: string;
}

export interface BoxConfig {
  id: string;
  boxNumber: number;
  name: string;
  description: string;
  color: string;
  priority: "High" | "Medium" | "Low";
  recommendations: string[];
  minPerf: number;
  maxPerf: number;
  minPot: number;
  maxPot: number;
}

