import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { 
  User, Circle, Role, RoleMember, Objective, KeyResult, 
  KeyResultAssignee, CheckInLog, ReviewCycle, PerformanceReview, SystemConfig
} from "./src/types";
import { 
  initialUsers, initialCircles, initialRoles, initialRoleMembers, 
  initialObjectives, initialKeyResults, initialKeyResultAssignees, 
  initialCheckInLogs, initialReviewCycles, initialPerformanceReviews,
  initialEval360Submissions, initialTalent9BoxConfigs, initialTalentEmployees
} from "./src/mockData";
import { isCreationLocked, calculateWeightedProgress } from "./src/lib/okr-logic";

// Define Database file path for persistence inside Cloud Run environment
const DB_FILE = path.join(process.cwd(), "db.json");

interface DatabaseSchema {
  users: User[];
  circles: Circle[];
  roles: Role[];
  roleMembers: RoleMember[];
  objectives: Objective[];
  keyResults: KeyResult[];
  keyResultAssignees: KeyResultAssignee[];
  checkInLogs: CheckInLog[];
  reviewCycles: ReviewCycle[];
  performanceReviews: PerformanceReview[];
  eval360Submissions: any[];
  talent9BoxConfigs: any[];
  talentEmployees: any[];
  systemConfig: SystemConfig;
}

const defaultSystemConfig: SystemConfig = {
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
  potentialClassifications: [
    { label: "High Potential", min: 76, max: 100, color: "bg-emerald-100 text-emerald-800", description: "Top tier future leaders." },
    { label: "Moderate Potential", min: 41, max: 75, color: "bg-amber-100 text-amber-800", description: "Steady contributors with room to grow." },
    { label: "Low Potential", min: 0, max: 40, color: "bg-rose-100 text-rose-800", description: "Needs significant improvement or realignment." }
  ],
  successionPoolConfig: {
    sriWeights: { performance: 30, potential: 30, leadership: 20, tenure: 10, readiness: 10 },
    minSriThreshold: 75,
    eligible9BoxQuadrants: ["6", "8", "9"]
  },
  approvalWorkflow: ["atasan_langsung", "direksi"],
  eval360Templates: [
    {
      id: "template_1",
      name: "Template Evaluasi 360 Derajat Q1 2026",
      description: "Evaluasi kompetensi kepemimpinan dan kerjasama tim",
      status: "active",
      evaluateeId: "",
      raterAssignments: [],
      questions: [
        { id: "q1", text: "Kemampuan memimpin tim dan memberikan arahan", category: "Leadership", weight: 50, type: "multiple_choice" },
        { id: "q2", text: "Komunikasi dan kerjasama antar departemen", category: "Teamwork", weight: 50, type: "multiple_choice" }
      ],
      raterWeights: [
        { groupId: "supervisor", name: "Atasan", weight: 40 },
        { groupId: "peer", name: "Rekan Kerja", weight: 30 },
        { groupId: "subordinate", name: "Bawahan", weight: 20 },
        { groupId: "self", name: "Diri Sendiri", weight: 10 }
      ],
      assignments: [
        { id: "assign_1", targetType: "all", targetId: null }
      ]
    }
  ],
  multiRater360Config: {
    enabled: true,
    evaluatorAssignments: [
      { evaluatorId: "usr_hr_2", evaluateeId: "usr_hr_1", groupId: "subordinate" },
      { evaluatorId: "usr_prod_2", evaluateeId: "usr_hr_1", groupId: "peer" },
      { evaluatorId: "usr_hr_1", evaluateeId: "usr_hr_1", groupId: "self" },
      { evaluatorId: "usr_prod_1", evaluateeId: "usr_prod_2", groupId: "supervisor" }
    ],
    questionTemplates: [
      { id: "q1", category: "Kepemimpinan", question: "Kemampuan memimpin tim dan memberikan arahan yang jelas", weight: 50 },
      { id: "q2", category: "Kerjasama", question: "Komunikasi dan kerjasama antar departemen", weight: 50 }
    ],
    weightSupervisor: 40,
    weightPeer: 30,
    weightSubordinate: 20,
    weightSelf: 10,
    weightCrossDept: 0
  },
  questionnaires: [
    { id: "q1", question: "Jika target tidak tercapai, apakah operasional inti langsung terganggu?", yesScore: 20, yesCategory: "komitmen", noScore: 0, noCategory: "aspirasional" },
    { id: "q2", question: "Apakah target ini menuntut metode baru, transformasi digital, atau pembuatan produk yang belum pernah ada?", yesScore: 25, yesCategory: "aspirasional", noScore: 0, noCategory: "komitmen" },
    { id: "q3", question: "Apakah tingkat ketidakpastian/risiko kegagalan target ini sangat tinggi?", yesScore: 20, yesCategory: "aspirasional", noScore: 0, noCategory: "komitmen" },
    { id: "q4", question: "Apakah target ini sengaja dibuat sangat tinggi (stretch goal) di mana pencapaian 60-70% saja sudah dianggap sebagai keberhasilan besar?", yesScore: 30, yesCategory: "aspirasional", noScore: 0, noCategory: "komitmen" }
  ],
  rolePermissions: [
    { id: "direksi", name: "Direksi", canViewAllReports: true, canEditAllReports: true, canManageOrgStructure: true },
    { id: "atasan_tidak_langsung", name: "Atasan Tidak Langsung", canViewAllReports: true, canEditAllReports: false, canManageOrgStructure: true },
    { id: "atasan_langsung", name: "Atasan Langsung", canViewAllReports: false, canEditAllReports: false, canManageOrgStructure: false },
    { id: "karyawan", name: "Karyawan", canViewAllReports: false, canEditAllReports: false, canManageOrgStructure: false }
  ],
  defaultBscPerspectives: [
    { id: "fin_1", name: "[FINANCIAL] Revenue Growth", weight: 25, target: 15, unit: "%", calcSystem: "maximize", score: 0 },
    { id: "fin_2", name: "[FINANCIAL] Cost Reduction Improvement", weight: 15, target: 100000000, unit: "IDR", calcSystem: "minimize", score: 0 },
    { id: "cus_3", name: "[CUSTOMER] Customer Satisfaction Index (CSI)", weight: 20, target: 4.5, unit: "Skor", calcSystem: "maximize", score: 0 },
    { id: "cus_4", name: "[CUSTOMER] Customer Churn Rate", weight: 10, target: 2, unit: "%", calcSystem: "minimize", score: 0 },
    { id: "int_5", name: "[INTERNAL BUSINESS PROCESS] Project Delivery On-Time", weight: 20, target: 95, unit: "%", calcSystem: "maximize", score: 0 },
    { id: "int_6", name: "[INTERNAL BUSINESS PROCESS] Total Production Defects / Waste", weight: 15, target: 0, unit: "Kejadian", calcSystem: "min_to_zero", penaltyFactor: 25, score: 0 },
    { id: "lrn_7", name: "[LEARNING & GROWTH] Employee Training Hours per FTE", weight: 15, target: 40, unit: "Jam", calcSystem: "maximize", score: 0 },
    { id: "lrn_8", name: "[LEARNING & GROWTH] Workplace Accident (Fatality)", weight: 30, target: 0, unit: "Kejadian", calcSystem: "min_to_zero", penaltyFactor: 100, score: 0 }
  ],
  performanceCategories: [
    { id: "cat_1", name: "High Performance", minScore: 110.01, maxScore: 9999, color: "text-purple-600 bg-purple-50 border-purple-200" },
    { id: "cat_2", name: "Performance", minScore: 100.01, maxScore: 110, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { id: "cat_3", name: "On Target", minScore: 100, maxScore: 100, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { id: "cat_4", name: "Par", minScore: 85, maxScore: 99.99, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { id: "cat_5", name: "Below Par", minScore: 0, maxScore: 84.99, color: "text-red-600 bg-red-50 border-red-200" }
  ]
};

// Check and load/initialize our JSON-based persistent database
function loadDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const db = JSON.parse(data) as DatabaseSchema;
      if (!db.systemConfig) {
        db.systemConfig = defaultSystemConfig;
      }
      
      // Self-healing database state upgrade
      let modified = false;
      if (!db.systemConfig.startDate || !db.systemConfig.endDate) {
        db.systemConfig.startDate = defaultSystemConfig.startDate;
        db.systemConfig.endDate = defaultSystemConfig.endDate;
        modified = true;
      }
      if (!db.systemConfig.rolePermissions) {
        db.systemConfig.rolePermissions = defaultSystemConfig.rolePermissions;
        modified = true;
      }
      if (!db.systemConfig.defaultBscPerspectives) {
        db.systemConfig.defaultBscPerspectives = defaultSystemConfig.defaultBscPerspectives;
        modified = true;
      }
      if (!db.systemConfig.performanceCategories) {
        db.systemConfig.performanceCategories = defaultSystemConfig.performanceCategories;
        modified = true;
      }
      if (!db.systemConfig.potentialClassifications) {
        db.systemConfig.potentialClassifications = defaultSystemConfig.potentialClassifications;
        modified = true;
      }
      if (!db.systemConfig.successionPoolConfig) {
        db.systemConfig.successionPoolConfig = defaultSystemConfig.successionPoolConfig;
        modified = true;
      }
      initialUsers.forEach(initUser => {
        if (!db.users.some(u => u.id === initUser.id)) {
          db.users.push(initUser);
          modified = true;
          console.log(`Self-healing database: added user ${initUser.name}`);
        } else {
          // Update department names and roles
          const existing = db.users.find(u => u.id === initUser.id);
          if (existing) {
            if (existing.department !== initUser.department) {
              existing.department = initUser.department;
              modified = true;
            }
            if (existing.systemRole !== initUser.systemRole) {
              existing.systemRole = initUser.systemRole;
              modified = true;
            }
          }
        }
      });
      initialCircles.forEach(initCirc => {
        if (!db.circles.some(c => c.id === initCirc.id)) {
          db.circles.push(initCirc);
          modified = true;
          console.log(`Self-healing database: added circle ${initCirc.name}`);
        } else {
          // Ensure circle names are sync'd
          const existing = db.circles.find(c => c.id === initCirc.id);
          if (existing && existing.name !== initCirc.name) {
            existing.name = initCirc.name;
            existing.description = initCirc.description;
            modified = true;
          }
        }
      });
      initialRoles.forEach(initRole => {
        if (!db.roles.some(r => r.id === initRole.id)) {
          db.roles.push(initRole);
          modified = true;
          console.log(`Self-healing database: added role ${initRole.title}`);
        }
      });
      initialRoleMembers.forEach(initMem => {
        if (!db.roleMembers.some(rm => rm.id === initMem.id)) {
          db.roleMembers.push(initMem);
          modified = true;
          console.log(`Self-healing database: added member link ${initMem.id}`);
        }
      });
      initialObjectives.forEach(initObj => {
        if (!db.objectives.some(o => o.id === initObj.id)) {
          db.objectives.push(initObj);
          modified = true;
          console.log(`Self-healing database: added objective ${initObj.id}`);
        }
      });
      initialKeyResults.forEach(initKr => {
        if (!db.keyResults.some(k => k.id === initKr.id)) {
          db.keyResults.push(initKr);
          modified = true;
          console.log(`Self-healing database: added key-result ${initKr.id}`);
        }
      });

      db.checkInLogs.forEach(c => {
        if (!c.status) {
          c.status = "approved";
          modified = true;
        }
      });

      if (!db.talent9BoxConfigs) {
        db.talent9BoxConfigs = initialTalent9BoxConfigs;
        modified = true;
      }

      if (!db.talentEmployees) {
        db.talentEmployees = initialTalentEmployees;
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
      }

      return db;
    } catch (e) {
      console.error("Error reading database file, resetting to mock data:", e);
    }
  }

  // Fallback and seed database if file does not exist
  const seedData: DatabaseSchema = {
    users: initialUsers,
    circles: initialCircles,
    roles: initialRoles,
    roleMembers: initialRoleMembers,
    objectives: initialObjectives,
    keyResults: initialKeyResults,
    keyResultAssignees: initialKeyResultAssignees,
    checkInLogs: initialCheckInLogs,
    reviewCycles: initialReviewCycles,
    performanceReviews: initialPerformanceReviews,
    eval360Submissions: initialEval360Submissions,
    talent9BoxConfigs: initialTalent9BoxConfigs,
    talentEmployees: initialTalentEmployees,
    systemConfig: defaultSystemConfig
  };
  saveDatabase(seedData);
  return seedData;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write to database file:", e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize data store
  let db_state = loadDatabase();

  // Helper macro to flush to file database
  const flush = () => saveDatabase(db_state);

  // -------------------------------------------------------------
  // RESTFUL API ENDPOINTS
  // -------------------------------------------------------------

  // --- 1. USERS HANDLERS ---
  app.get("/api/users", (req: Request, res: Response) => {
    res.json(db_state.users);
  });

  app.post("/api/admin/seed", (req: Request, res: Response) => {
    try {
      // 1. Add 25 users
      for (let i = 1; i <= 25; i++) {
        const userId = `user_${i}`;
        if (!db_state.users.some(u => u.id === userId)) {
          db_state.users.push({
            id: userId,
            name: `Employee ${i}`,
            email: `employee${i}@company.com`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Employee${i}`,
            department: i <= 8 ? "HR" : i <= 16 ? "Engineering" : "Finance",
            systemRole: i === 1 ? "direksi" : i % 5 === 0 ? "atasan_langsung" : "karyawan",
          });
        }
        
        // 2. Add to TalentEmployees
        if (!db_state.talentEmployees.some(e => e.id === userId)) {
          db_state.talentEmployees.push({
            id: userId,
            name: `Employee ${i}`,
            performanceScore: Math.floor(Math.random() * 50) + 50,
            potentialScore: Math.floor(Math.random() * 50) + 50,
            boxId: `box_${(i % 9) + 1}`,
            status: "Active",
          });
        }
      }

      // 3. Seed 360 Assignment for User 5 (as an example evaluatee)
      // Evaluators: User 1 (Supervisor), User 6 (Peer), User 20 (Subordinate)
      
      // Persist to JSON
      flush();
      res.json({ message: "Database seeded successfully" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to seed database" });
    }
  });

  // --- 2. CIRCLES & ROLES HANDLERS (Glassfrog-inspired) ---
  app.get("/api/circles", (req: Request, res: Response) => {
    res.json(db_state.circles);
  });

  app.post("/api/circles", (req: Request, res: Response) => {
    const { id, name, description, subCircleOfId, leadId, circleType } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Circle name is required" });
    }
    const newCircle: Circle = {
      id: id || `circ_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      name: name.trim(),
      description: description || "",
      subCircleOfId: subCircleOfId || null,
      leadId: leadId || null,
      circleType: circleType || "department"
    };
    db_state.circles.push(newCircle);
    flush();
    res.status(201).json(newCircle);
  });

  app.get("/api/roles", (req: Request, res: Response) => {
    res.json(db_state.roles);
  });

  app.post("/api/roles", (req: Request, res: Response) => {
    const { id, title, circleId, description, accountabilities, userIds } = req.body;
    if (!title || !circleId) {
      return res.status(400).json({ error: "Role title and Circle ID are required" });
    }
    const newRole: Role = {
      id: id || `role_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      title: title.trim(),
      circleId,
      description: description || "",
      accountabilities: Array.isArray(accountabilities) ? accountabilities.filter(Boolean) : []
    };
    db_state.roles.push(newRole);

    // Bind employees (many-to-many role assignments)
    if (Array.isArray(userIds)) {
      userIds.forEach(userId => {
        db_state.roleMembers.push({
          id: `rm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          userId,
          roleId: newRole.id
        });
      });
    }

    flush();
    res.status(201).json({ ...newRole, memberUserIds: userIds || [] });
  });

  app.get("/api/role-members", (req: Request, res: Response) => {
    res.json(db_state.roleMembers);
  });

  // --- 3. OKR & KPI HANDLERS with Dynamic Aligned Hierarchy ---
  app.get("/api/objectives", (req: Request, res: Response) => {
    res.json(db_state.objectives);
  });

  app.post("/api/objectives", (req: Request, res: Response) => {
    const { title, level, circleId, parentId, targetQuarter, okrType, approverId, status, currentApprovalStep } = req.body;
    if (!title || !level || !targetQuarter) {
      return res.status(400).json({ error: "Title, Level, and Target Quarter are required" });
    }

    if (isCreationLocked(db_state.systemConfig, targetQuarter.trim())) {
      return res.status(400).json({ error: "Objective creation is locked for the current quarter." });
    }

    const newObj: any = {
      id: `obj_${Date.now()}`,
      title: title.trim(),
      level,
      circleId: level === "company" ? null : (circleId || null),
      parentId: parentId || null,
      targetQuarter: targetQuarter.trim(),
      okrType: okrType || "committed",
      approverId: approverId || undefined,
      status: status || "pending",
      currentApprovalStep: currentApprovalStep || 0
    };
    db_state.objectives.push(newObj);
    flush();
    res.status(201).json(newObj);
  });

  app.get("/api/key-results", (req: Request, res: Response) => {
    res.json(db_state.keyResults);
  });

  app.get("/api/key-results-assignees", (req: Request, res: Response) => {
    res.json(db_state.keyResultAssignees);
  });

  app.post("/api/key-results", (req: Request, res: Response) => {
    const { objectiveId, title, targetValue, currentValue, unit, isShared, assignees, weight, okrType } = req.body;
    if (!objectiveId || !title || targetValue === undefined || currentValue === undefined) {
      return res.status(400).json({ error: "Missing Objective assignment or metrics fields" });
    }

    const targetObj = db_state.objectives.find(o => o.id === objectiveId);
    if (targetObj && isCreationLocked(db_state.systemConfig, targetObj.targetQuarter)) {
      return res.status(400).json({ error: "Key Result creation is locked for the current quarter." });
    }

    const keyResultId = `kr_${Date.now()}`;
    const targetValNum = Number(targetValue);
    const currentValNum = Number(currentValue);
    
    // Default progress percentage calculation
    let progress = Math.min(100, Math.max(0, Math.round((currentValNum / targetValNum) * 100)));

    const newKR: KeyResult = {
      id: keyResultId,
      objectiveId,
      title: title.trim(),
      targetValue: targetValNum,
      currentValue: currentValNum,
      unit: unit || "%",
      progress,
      isShared: !!isShared,
      weight: Number(weight) || 100,
      okrType: okrType || "committed",
      tasks: req.body.tasks || []
    };

    db_state.keyResults.push(newKR);

    // Save contribution assignees & split weights
    if (Array.isArray(assignees) && assignees.length > 0) {
      assignees.forEach((asg: { circleId?: string; roleId?: string; weightPercentage?: number; currentProgress?: number }) => {
        db_state.keyResultAssignees.push({
          id: `ksa_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          keyResultId,
          circleId: asg.circleId || null,
          roleId: asg.roleId || null,
          weightPercentage: Number(asg.weightPercentage) || 0,
          currentProgress: Number(asg.currentProgress) || 0
        });
      });

      // Recalculate based on contribution assignment
      const krAssignees = db_state.keyResultAssignees.filter(a => a.keyResultId === keyResultId);
      const totalWeight = krAssignees.reduce((sum, item) => sum + item.weightPercentage, 0);
      if (totalWeight > 0) {
        const weightedSum = krAssignees.reduce((sum, item) => sum + (item.currentProgress * item.weightPercentage), 0);
        newKR.progress = Math.min(100, Math.round(weightedSum / totalWeight));
        newKR.currentValue = Number(((newKR.progress / 100) * newKR.targetValue).toFixed(2));
      }
    }

    flush();
    res.status(201).json({ keyResult: newKR, assignees: db_state.keyResultAssignees.filter(a => a.keyResultId === keyResultId) });
  });

  // --- 4. WEEKLY CHECK-IN LOGS & PROGRESS / CONTRIBUTION TRACKING ---
  app.get("/api/check-ins", (req: Request, res: Response) => {
    res.json(db_state.checkInLogs);
  });

  // Reusable helper to apply check-in progress to Key Result
  const applyCheckInProgress = (keyResultId: string, roleId: string | null, newValNum: number, dependencyCircleId: string | null) => {
    const kr = db_state.keyResults.find(k => k.id === keyResultId);
    if (!kr) return null;

    const calcSystem = kr.calcSystem || "maximize";
    
    // Function to calculate progress score without bounds based on target logic
    const calculateRawProgress = (actual: number, target: number) => {
        let score = 0;
        if (calcSystem === "maximize") {
            score = target > 0 ? (actual / target) * 100 : 0;
        } else if (calcSystem === "minimize") {
            score = actual > 0 ? (target / actual) * 100 : (target === 0 ? 100 : 0);
        } else if (calcSystem === "min_to_zero") {
            const penalty = kr.penaltyFactor || db_state.systemConfig?.calcSystemConfig?.defaultPenaltyFactor || 20;
            score = 100 - (actual * penalty);
        }
        return score;
    };

    const maxScore = calcSystem === "minimize" || calcSystem === "min_to_zero" 
        ? (db_state.systemConfig?.calcSystemConfig?.minimizeMaxScore ?? 120)
        : (db_state.systemConfig?.calcSystemConfig?.maximizeMaxScore ?? 120);
    
    // Update individual progress and cap
    const calculateBoundedProgress = (actual: number, target: number) => {
         return Math.min(maxScore, Math.max(0, Math.round(calculateRawProgress(actual, target))));
    };

    const krAssignees = db_state.keyResultAssignees.filter(a => a.keyResultId === keyResultId);

    if (krAssignees.length > 0) {
      const assigneeMatch = krAssignees.find(
        asg => asg.roleId === roleId || (roleId === null && asg.circleId === dependencyCircleId)
      );
      
      const targetAsg = assigneeMatch || krAssignees[0];
      
      if (targetAsg) {
        targetAsg.currentProgress = calculateBoundedProgress(newValNum, kr.targetValue);
      }

      const totalWeight = krAssignees.reduce((sum, item) => sum + item.weightPercentage, 0);
      if (totalWeight > 0) {
        kr.progress = Math.min(maxScore, calculateWeightedProgress(krAssignees));
        // We cannot easily back-calculate current value for min_to_zero / minimize when weighted, so we store the sum or average
        // But for simplicity in this system we just add them or use newValNum if it's not well distributed
        kr.currentValue = newValNum; 
      } else {
        kr.currentValue = newValNum;
        kr.progress = calculateBoundedProgress(newValNum, kr.targetValue);
      }
    } else {
      kr.currentValue = newValNum;
      kr.progress = calculateBoundedProgress(newValNum, kr.targetValue);
    }
    return kr;
  };

  // Helper to determine eligible circle leads / superiors who must approve this check-in
  const getEligibleApprovers = (assigneeId: string, krId: string): string[] => {
    const userRoleIds = db_state.roleMembers.filter(rm => rm.userId === assigneeId).map(rm => rm.roleId);
    const userCircleIds = db_state.roles.filter(r => userRoleIds.includes(r.id)).map(r => r.circleId);
    
    const approverIds: string[] = [];
    userCircleIds.forEach(cId => {
      const circle = db_state.circles.find(c => c.id === cId);
      if (circle && circle.leadId && circle.leadId !== assigneeId) {
        if (!approverIds.includes(circle.leadId)) {
          approverIds.push(circle.leadId);
        }
      }
    });

    // Sub-circle hierarchy fallback
    if (approverIds.length === 0) {
      userCircleIds.forEach(cId => {
        let currentCircle = db_state.circles.find(c => c.id === cId);
        while (currentCircle && currentCircle.subCircleOfId) {
          const parentCircle = db_state.circles.find(c => c.id === currentCircle.subCircleOfId);
          if (parentCircle && parentCircle.leadId && parentCircle.leadId !== assigneeId) {
            if (!approverIds.includes(parentCircle.leadId)) {
              approverIds.push(parentCircle.leadId);
            }
            break;
          }
          currentCircle = parentCircle;
        }
      });
    }

    // Check objective's circle lead
    const kr = db_state.keyResults.find(k => k.id === krId);
    if (kr) {
      const parentObj = db_state.objectives.find(o => o.id === kr.objectiveId);
      if (parentObj && parentObj.circleId) {
        const objCircle = db_state.circles.find(c => c.id === parentObj.circleId);
        if (objCircle && objCircle.leadId && objCircle.leadId !== assigneeId) {
          if (!approverIds.includes(objCircle.leadId)) {
            approverIds.push(objCircle.leadId);
          }
        }
      }
    }

    return approverIds;
  };

  app.post("/api/check-ins", (req: Request, res: Response) => {
    const { 
      keyResultId, assigneeId, roleId, newValue, notes, 
      blockerNotes, hasBlocker, dependencyCircleId, dependencyRoleId,
      updateFrequency, attachmentName
    } = req.body;

    if (!keyResultId || !assigneeId || newValue === undefined) {
      return res.status(400).json({ error: "Missing required check-in fields" });
    }

    const kr = db_state.keyResults.find(k => k.id === keyResultId);
    if (!kr) {
      return res.status(404).json({ error: "Key Result not found" });
    }

    const prevValue = kr.currentValue;
    const newValNum = Number(newValue);

    // Determine if supervisor approval is required (if assignee is a direct member with a superior)
    const approverIds = getEligibleApprovers(assigneeId, keyResultId);
    const status = approverIds.length === 0 ? "approved" : "pending";

    // Calculate individual incremental update
    const checkIn: CheckInLog = {
      id: `cil_${Date.now()}`,
      keyResultId,
      assigneeId,
      roleId: roleId || null,
      previousValue: prevValue,
      newValue: newValNum,
      notes: notes || "Routine status check-in.",
      blockerNotes: hasBlocker ? (blockerNotes || "Blocker flagged.") : null,
      hasBlocker: !!hasBlocker,
      dependencyCircleId: hasBlocker ? (dependencyCircleId || null) : null,
      dependencyRoleId: hasBlocker ? (dependencyRoleId || null) : null,
      timestamp: new Date().toISOString(),
      status: status,
      approverId: null,
      approverNotes: null,
      approverIds: approverIds,
      updateFrequency: updateFrequency || "weekly",
      attachmentName: attachmentName || undefined
    };

    db_state.checkInLogs.unshift(checkIn);

    // Only apply the dynamic progress calculations to actual OKRs if auto-approved (e.g. no supervisor, or is circle leader)
    if (status === "approved") {
      applyCheckInProgress(keyResultId, roleId || null, newValNum, dependencyCircleId || null);
    }

    flush();
    res.status(201).json({ checkIn, updatedKeyResult: kr, assignees: db_state.keyResultAssignees.filter(a => a.keyResultId === keyResultId) });
  });

  // Approval review endpoint
  app.post("/api/check-ins/:id/review", (req: Request, res: Response) => {
    const { id } = req.params;
    const { approverId, status, approverNotes } = req.body; // status: "approved" | "rejected"
    
    if (!approverId || !status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Missing or invalid approval fields" });
    }

    const checkIn = db_state.checkInLogs.find(c => c.id === id);
    if (!checkIn) {
      return res.status(404).json({ error: "Check-in not found" });
    }

    if (checkIn.status !== "pending") {
      return res.status(400).json({ error: "Check-in is already processed" });
    }

    checkIn.status = status;
    checkIn.approverId = approverId;
    checkIn.approverNotes = approverNotes || null;

    let updatedKR = null;
    if (status === "approved") {
      updatedKR = applyCheckInProgress(checkIn.keyResultId, checkIn.roleId, checkIn.newValue, checkIn.dependencyCircleId);
    }

    flush();
    res.json({ checkIn, updatedKeyResult: updatedKR, assignees: db_state.keyResultAssignees.filter(a => a.keyResultId === checkIn.keyResultId) });
  });

  // Delete Check-in API
  app.delete("/api/check-ins/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    db_state.checkInLogs = db_state.checkInLogs.filter(c => c.id !== id);
    flush();
    res.json({ success: true, deletedId: id });
  });

  // --- 5. PERFORMANCE APPRAISAL REVIEW CYCLES ---
  app.get("/api/review-cycles", (req: Request, res: Response) => {
    res.json(db_state.reviewCycles);
  });

  app.get("/api/performance-reviews", (req: Request, res: Response) => {
    res.json(db_state.performanceReviews);
  });

  app.get("/api/eval360-submissions", (req: Request, res: Response) => {
    res.json(db_state.eval360Submissions || []);
  });

  app.post("/api/eval360-submissions", (req: Request, res: Response) => {
    const data = req.body;
    if (!db_state.eval360Submissions) db_state.eval360Submissions = [];
    
    // Check if updating or creating
    if (data.id) {
       const idx = db_state.eval360Submissions.findIndex(s => s.id === data.id);
       if (idx >= 0) {
           db_state.eval360Submissions[idx] = data;
       } else {
           db_state.eval360Submissions.push(data);
       }
    } else {
       data.id = `sub360_${Date.now()}`;
       db_state.eval360Submissions.push(data);
    }
    
    flush();
    res.json(data);
  });

  // Calculate dynamic OKR progress matches for user
  app.get("/api/performance-reviews/calculate-score/:userId", (req: Request, res: Response) => {
    const { userId } = req.params;
    
    // Find all roles held by user
    const userRoleIds = db_state.roleMembers
      .filter(rm => rm.userId === userId)
      .map(rm => rm.roleId);

    // Find circles matching any of these roles
    const circlesMatching = db_state.roles
      .filter(r => userRoleIds.includes(r.id))
      .map(r => r.circleId);

    // Find linked Key Result Progress averages
    // 1. Direct assignees' progress in shared goals
    const sharedAssigns = db_state.keyResultAssignees.filter(
      asg => asg.roleId && userRoleIds.includes(asg.roleId)
    );

    // 2. Direct Circle level objectives (if they are a circle lead!)
    const customerLeadCircles = db_state.circles
      .filter(c => c.leadId === userId)
      .map(c => c.id);

    const circleObjectives = db_state.objectives.filter(
      o => o.circleId && customerLeadCircles.includes(o.circleId)
    );
    const circleObjectiveIds = circleObjectives.map(o => o.id);
    const circleKRs = db_state.keyResults.filter(k => circleObjectiveIds.includes(k.objectiveId));

    let scores: number[] = [];
    sharedAssigns.forEach(a => scores.push(a.currentProgress));
    circleKRs.forEach(kr => scores.push(kr.progress));

    // Fallback company KRs if none found (e.g. general corporate contribution)
    if (scores.length === 0) {
      // Find any KPI matches, or default calculation based on all finished check-ins
      const userLogs = db_state.checkInLogs.filter(l => l.assigneeId === userId);
      if (userLogs.length > 0) {
        const logKRs = Array.from(new Set(userLogs.map(l => l.keyResultId)));
        db_state.keyResults.filter(k => logKRs.includes(k.id)).forEach(k => scores.push(k.progress));
      }
    }

    const calculatedScore = scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 70; // High-level fallback score

    res.json({ userId, okrScore: calculatedScore });
  });

  app.post("/api/performance-reviews", (req: Request, res: Response) => {
    const { 
      cycleId, userId, evaluatedBy, okrScore, qualitativeScore, 
      managerFeedback, selfAssessment, growthPlan, status,
      reviewMethod, kpis, bscPerspectives, raterGroups360, finalCalculatedScore,
      strength, developmentArea, promotionReadiness, recommendedActions,
      careerSuggestion, trainingSuggestion, risk, comment,
      managerRating, hrRating, calibrationRating, finalRating, auditTrail, approvalStatus
    } = req.body;

    if (!cycleId || !userId || !evaluatedBy) {
      return res.status(400).json({ error: "Cycle assignment, Employee, and Evaluator are required" });
    }

    // Check if review already exists to update it, or create a brand new one
    const existingIndex = db_state.performanceReviews.findIndex(
      rev => rev.cycleId === cycleId && rev.userId === userId
    );

    // Automatically calculate scores if not provided
    const user360s = db_state.eval360Submissions.filter((s: any) => s.evaluateeId === userId && s.status === "submitted");
    let potScore = 0;
    if (user360s.length > 0) {
      let total = 0, count = 0;
      user360s.forEach((sub: any) => sub.answers.forEach((ans: any) => { total += ans.score; count++; }));
      if (count > 0) potScore = Math.round((total / count) * 20);
    }

    const itemScore = okrScore !== undefined ? Number(okrScore) : 75;
    const finalScore = (itemScore + potScore) / 2;

    const reviewItem: any = {
      id: existingIndex >= 0 ? db_state.performanceReviews[existingIndex].id : `rev_${Date.now()}`,
      cycleId,
      userId,
      evaluatedBy,
      okrScore: itemScore,
      qualitativeScore: qualitativeScore !== undefined ? Number(qualitativeScore) : 4.0,
      potScore: potScore,
      managerFeedback: managerFeedback || "",
      selfAssessment: selfAssessment || "",
      growthPlan: growthPlan || "",
      status: status || "draft",
      updatedAt: new Date().toISOString(),
      reviewMethod: reviewMethod || "okr",
      kpis: kpis || [],
      bscPerspectives: bscPerspectives || [],
      raterGroups360: raterGroups360 || [],
      finalCalculatedScore: finalCalculatedScore !== undefined ? Number(finalCalculatedScore) : finalScore,
      
      // Dynamic talent/potential fields
      strength: strength || "",
      developmentArea: developmentArea || "",
      promotionReadiness: promotionReadiness || "Not Ready",
      recommendedActions: recommendedActions || [],
      careerSuggestion: careerSuggestion || "Maintain",
      trainingSuggestion: trainingSuggestion || "",
      risk: risk || "",
      comment: comment || "",
      managerRating: managerRating !== undefined ? Number(managerRating) : undefined,
      hrRating: hrRating !== undefined ? Number(hrRating) : undefined,
      calibrationRating: calibrationRating !== undefined ? Number(calibrationRating) : undefined,
      finalRating: finalRating !== undefined ? Number(finalRating) : undefined,
      auditTrail: auditTrail || [],
      approvalStatus: approvalStatus || "Draft"
    };

    if (existingIndex >= 0) {
      db_state.performanceReviews[existingIndex] = reviewItem;
    } else {
      db_state.performanceReviews.push(reviewItem);
    }

    flush();
    res.status(201).json(reviewItem);
  });

  app.delete("/api/performance-reviews/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const index = db_state.performanceReviews.findIndex((r: any) => r.id === id);
    if (index >= 0) {
      db_state.performanceReviews.splice(index, 1);
      flush();
      res.json({ success: true, id });
    } else {
      res.status(404).json({ error: "Review not found" });
    }
  });

  // --- 6. SYSTEM CONFIGURATION & EDITING HANDLERS ---
  app.get("/api/config", (req: Request, res: Response) => {
    res.json(db_state.systemConfig || defaultSystemConfig);
  });

  app.put("/api/config", (req: Request, res: Response) => {
    db_state.systemConfig = { ...(db_state.systemConfig || defaultSystemConfig), ...req.body };
    flush();
    res.json(db_state.systemConfig);
  });

  // Edit Circle API
  app.put("/api/circles/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const index = db_state.circles.findIndex(c => c.id === id);
    if (index >= 0) {
      db_state.circles[index] = { ...db_state.circles[index], ...req.body };
      flush();
      res.json(db_state.circles[index]);
    } else {
      res.status(404).json({ error: "Circle not found" });
    }
  });

  // Delete Circle API
  app.delete("/api/circles/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    db_state.circles = db_state.circles.filter(c => c.id !== id);
    db_state.roles = db_state.roles.filter(r => r.circleId !== id);
    flush();
    res.json({ success: true, deletedId: id });
  });

  // Edit Role API
  app.put("/api/roles/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const index = db_state.roles.findIndex(r => r.id === id);
    if (index >= 0) {
      const { title, description, circleId, accountabilities, userIds } = req.body;
      db_state.roles[index] = {
        ...db_state.roles[index],
        title: title !== undefined ? title.trim() : db_state.roles[index].title,
        description: description !== undefined ? description : db_state.roles[index].description,
        circleId: circleId !== undefined ? circleId : db_state.roles[index].circleId,
        accountabilities: Array.isArray(accountabilities) ? accountabilities.filter(Boolean) : db_state.roles[index].accountabilities
      };

      if (Array.isArray(userIds)) {
        // Purge old memberships and rebuild
        db_state.roleMembers = db_state.roleMembers.filter(rm => rm.roleId !== id);
        userIds.forEach(userId => {
          db_state.roleMembers.push({
            id: `rm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            userId,
            roleId: id
          });
        });
      }
      flush();
      res.json({ ...db_state.roles[index], memberUserIds: userIds || [] });
    } else {
      res.status(404).json({ error: "Role not found" });
    }
  });

  // Delete Role API
  app.delete("/api/roles/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    db_state.roles = db_state.roles.filter(r => r.id !== id);
    db_state.roleMembers = db_state.roleMembers.filter(rm => rm.roleId !== id);
    flush();
    res.json({ success: true, deletedId: id });
  });

  // Edit Objective API
  app.put("/api/objectives/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const index = db_state.objectives.findIndex(o => o.id === id);
    if (index >= 0) {
      db_state.objectives[index] = { ...db_state.objectives[index], ...req.body };
      flush();
      res.json(db_state.objectives[index]);
    } else {
      res.status(404).json({ error: "Objective not found" });
    }
  });

  // Delete Objective API
  app.delete("/api/objectives/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    db_state.objectives = db_state.objectives.filter(o => o.id !== id);
    const krsToDelete = db_state.keyResults.filter(k => k.objectiveId === id).map(k => k.id);
    db_state.keyResults = db_state.keyResults.filter(k => k.objectiveId !== id);
    db_state.keyResultAssignees = db_state.keyResultAssignees.filter(asg => !krsToDelete.includes(asg.keyResultId));
    flush();
    res.json({ success: true, deletedId: id });
  });

  // Edit Key Result API
  app.put("/api/key-results/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const index = db_state.keyResults.findIndex(k => k.id === id);
    if (index >= 0) {
      db_state.keyResults[index] = { ...db_state.keyResults[index], ...req.body };
      const kr = db_state.keyResults[index];
      
      // Sync progress calculations
      const krAssignees = db_state.keyResultAssignees.filter(a => a.keyResultId === id);
      
      if (req.body.currentValue !== undefined) {
          // If currentValue was explicitly updated via Live Update, we must update the first assignee's progress 
          // to ensure it matches the new current value, since progress relies on assignees.
          if (krAssignees.length > 0) {
              const contributionPercentage = Math.min(100, Math.max(0, Math.round((req.body.currentValue / kr.targetValue) * 100)));
              krAssignees[0].currentProgress = contributionPercentage;
          }
      }

      if (krAssignees.length > 0) {
        const totalWeight = krAssignees.reduce((sum, item) => sum + item.weightPercentage, 0);
        if (totalWeight > 0) {
          const weightedSum = krAssignees.reduce((sum, item) => sum + (item.currentProgress * item.weightPercentage), 0);
          kr.progress = Math.min(100, Math.round(weightedSum / totalWeight));
        }
      } else {
        kr.progress = Math.min(100, Math.max(0, Math.round((kr.currentValue / kr.targetValue) * 100)));
      }
      
      flush();
      res.json(kr);
    } else {
      res.status(404).json({ error: "Key Result not found" });
    }
  });

  // Delete Key Result API
  app.delete("/api/key-results/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    db_state.keyResults = db_state.keyResults.filter(k => k.id !== id);
    db_state.keyResultAssignees = db_state.keyResultAssignees.filter(asg => asg.keyResultId !== id);
    flush();
    res.json({ success: true, deletedId: id });
  });


  // ==========================================
  // CONFIG & ROLE SETTINGS ENDPOINTS
  // ==========================================
  
  app.put("/api/system-config/roles", (req: Request, res: Response) => {
    if (!req.body.rolePermissions) return res.status(400).json({ error: "Missing permissions array" });
    db_state.systemConfig.rolePermissions = req.body.rolePermissions;
    flush();
    res.json(db_state.systemConfig);
  });

  app.put("/api/users/:id/role", (req: Request, res: Response) => {
    const user = db_state.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!req.body.systemRole) return res.status(400).json({ error: "Missing systemRole" });
    
    user.systemRole = req.body.systemRole;
    flush();
    res.json(user);
  });

  app.put("/api/users/:id", (req: Request, res: Response) => {
    const user = db_state.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    if (req.body.systemRole !== undefined) user.systemRole = req.body.systemRole;
    if (req.body.managerId !== undefined) {
      user.managerId = req.body.managerId === "" || req.body.managerId === "none" ? undefined : req.body.managerId;
    }
    if (req.body.department !== undefined) user.department = req.body.department;
    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.email !== undefined) user.email = req.body.email;
    
    // Also sync to talentEmployees if exists
    const talentEmp = db_state.talentEmployees?.find(te => te.id === req.params.id);
    if (talentEmp) {
      if (req.body.name !== undefined) talentEmp.name = req.body.name;
      if (req.body.department !== undefined) talentEmp.department = req.body.department;
    }

    flush();
    res.json(user);
  });

  // ==========================================
  // TALENT 9 BOX ENDPOINTS
  // ==========================================

  app.get("/api/talent-9box/employees", (req: Request, res: Response) => {
    const employees = db_state.users.map(user => {
      let department = user.department || "Unknown";
      let position = "Staff";
      
      const userRoleMembers = db_state.roleMembers.filter(rm => rm.userId === user.id);
      if (userRoleMembers.length > 0) {
        const role = db_state.roles.find(r => r.id === userRoleMembers[0].roleId);
        if (role) {
          position = role.title;
          const circle = db_state.circles.find(c => c.id === role.circleId);
          if (circle) department = circle.name;
        }
      }

      let perf = 50;
      const userReviews = db_state.performanceReviews.filter(r => r.userId === user.id);
      if (userReviews.length > 0) {
         const latest = userReviews[userReviews.length - 1];
         perf = latest.calibrationRating !== undefined 
           ? latest.calibrationRating 
           : (latest.finalCalculatedScore !== undefined ? latest.finalCalculatedScore : latest.okrScore);
      }

      let pot = 50;
      const user360s = db_state.eval360Submissions.filter(s => s.evaluateeId === user.id && s.status === "submitted");
      if (user360s.length > 0) {
        let total = 0, count = 0;
        user360s.forEach(sub => sub.answers.forEach((ans: any) => { total += ans.score; count++; }));
        if (count > 0) pot = Math.round((total / count) * 20);
      }

      const configs = db_state.talent9BoxConfigs || [];
      let boxId = "box_5"; 
      for (const config of configs) {
         if (perf >= config.minPerf && perf <= config.maxPerf &&
             pot >= config.minPot && pot <= config.maxPot) {
             boxId = config.id;
             break;
         }
      }

      const badges = [];
      if (boxId === "box_9") badges.push("Future Leader");
      if (["box_8", "box_9"].includes(boxId)) badges.push("Ready Now");
      if (perf > 80) badges.push("High Performer");
      if (pot > 80) badges.push("High Potential");

      const userIdHash = user.id.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const computedTenure = (user as any).tenureYears !== undefined ? (user as any).tenureYears : (userIdHash % 8 + 1);
      const computedAge = 25 + (userIdHash % 20);
      const computedGender = userIdHash % 2 === 0 ? "Female" : "Male";
      const computedJoinYear = 2026 - computedTenure;
      const computedJoinDate = `${computedJoinYear}-02-15`;

      return {
        id: user.id,
        name: user.name,
        gender: computedGender, 
        age: computedAge, 
        department,
        position,
        division: "Core", 
        location: "Jakarta", 
        joinDate: computedJoinDate, 
        tenureYears: computedTenure, 
        performanceScore: perf,
        potentialScore: pot,
        boxId,
        badges,
        riskLevel: pot < 40 ? "High" : pot < 70 ? "Medium" : "Low",
        readinessLevel: pot > 80 ? "Ready Now" : "1-2 Years",
        leadershipScore: pot,
        status: "Active",
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`
      };
    });
    res.json(employees);
  });

  app.get("/api/talent-9box/configs", (req: Request, res: Response) => {
    res.json(db_state.talent9BoxConfigs || []);
  });

  app.put("/api/talent-9box/configs", (req: Request, res: Response) => {
    if (Array.isArray(req.body)) {
      db_state.talent9BoxConfigs = req.body;
      flush();
      res.json(db_state.talent9BoxConfigs);
    } else {
      res.status(400).json({ error: "Body must be an array of BoxConfig" });
    }
  });

  // -------------------------------------------------------------
  // VITE / STATIC CONTENT SERVING MIDDLEWARE COEXISTENCE
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
