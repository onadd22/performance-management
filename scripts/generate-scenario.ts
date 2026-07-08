import fs from "fs";
import path from "path";
import { 
  initialUsers, 
  initialCircles, 
  initialRoles, 
  initialRoleMembers,
  initialObjectives,
  initialKeyResults,
  initialKeyResultAssignees,
  initialCheckInLogs
} from "../src/mockData";

const DB_FILE = path.join(process.cwd(), "db.json");

const systemConfig = {
  currentQuarter: "Q4 2026",
  daysRemaining: 5,
  committedThreshold: 100,
  aspirationalThreshold: 70,
  remindersEnabled: true,
  collaborationFactor: 1.2,
  startDate: "2026-10-01",
  endDate: "2026-12-31",
  defaultReviewMethod: "bsc360",
  approvalWorkflow: ["atasan_langsung"],
  multiRater360Config: {
    enabled: true,
    evaluatorAssignments: [],
    questionTemplates: [
      { id: "q_360_1", category: "Kepatuhan", question: "Seberapa baik mematuhi standar prosedur?", weight: 50 },
      { id: "q_360_2", category: "Kerjasama", question: "Seberapa baik berkolaborasi dengan tim lain?", weight: 50 }
    ],
    weightSupervisor: 60,
    weightPeer: 20,
    weightSubordinate: 10,
    weightCrossDept: 10,
    weightSelf: 0
  },
  rolePermissions: [
    { id: "direksi", name: "Direksi", canViewAllReports: true, canEditAllReports: true, canManageOrgStructure: true },
    { id: "atasan_tidak_langsung", name: "Atasan Tidak Langsung", canViewAllReports: true, canEditAllReports: false, canManageOrgStructure: true },
    { id: "atasan_langsung", name: "Atasan Langsung", canViewAllReports: false, canEditAllReports: false, canManageOrgStructure: false },
    { id: "karyawan", name: "Karyawan", canViewAllReports: false, canEditAllReports: false, canManageOrgStructure: false }
  ],
  defaultBscPerspectives: [
    { id: "fin_1", name: "[FINANCIAL] Revenue Growth", weight: 25, target: 15, unit: "%", calcSystem: "maximize", score: 0 },
    { id: "cus_3", name: "[CUSTOMER] Customer Satisfaction Index (CSI)", weight: 25, target: 4.5, unit: "Skor", calcSystem: "maximize", score: 0 },
    { id: "int_5", name: "[INTERNAL BUSINESS PROCESS] Project Delivery On-Time", weight: 25, target: 95, unit: "%", calcSystem: "maximize", score: 0 },
    { id: "lrn_7", name: "[LEARNING & GROWTH] Employee Training Hours per FTE", weight: 25, target: 40, unit: "Jam", calcSystem: "maximize", score: 0 }
  ],
  performanceCategories: [
    { id: "cat_1", name: "High Performance", minScore: 110.01, maxScore: 9999, color: "text-purple-600 bg-purple-50 border-purple-200" },
    { id: "cat_2", name: "Performance", minScore: 100.01, maxScore: 110, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { id: "cat_3", name: "On Target", minScore: 100, maxScore: 100, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { id: "cat_4", name: "Par", minScore: 85, maxScore: 99.99, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { id: "cat_5", name: "Below Par", minScore: 0, maxScore: 84.99, color: "text-red-600 bg-red-50 border-red-200" }
  ]
};

// 1. Generate 10 extra users
const generatedUsers = [...initialUsers];
const names = ["Andi", "Bella", "Cahyo", "Dina", "Elang", "Fira", "Gilang", "Hana", "Iqbal", "Jihan"];
const depts = ["HRD", "Produksi", "Marketing", "Finance", "IT"];
for (let i = 0; i < 10; i++) {
  const uid = `usr_gen_${i+1}`;
  generatedUsers.push({
    id: uid,
    name: names[i] + " Tambahan",
    email: `${names[i].toLowerCase()}@company.com`,
    avatar: `https://i.pravatar.cc/150?u=${uid}`,
    department: depts[i % 5],
    systemRole: "karyawan"
  });
}

// Evaluatee list: anyone who is a karyawan or atasan_langsung
const evaluatees = generatedUsers.filter(u => u.systemRole !== "direksi");

// Generate assignments for 360
evaluatees.forEach((ee, i) => {
  const supervisors = generatedUsers.filter(u => u.systemRole === "atasan_langsung" && u.department === ee.department && u.id !== ee.id);
  const peers = generatedUsers.filter(u => u.id !== ee.id && u.department === ee.department && u.systemRole === "karyawan");
  const crosses = generatedUsers.filter(u => u.id !== ee.id && u.department !== ee.department);
  
  if (supervisors.length > 0) systemConfig.multiRater360Config.evaluatorAssignments.push({ evaluatorId: supervisors[0].id, evaluateeId: ee.id, groupId: "supervisor" });
  if (peers.length > 0) systemConfig.multiRater360Config.evaluatorAssignments.push({ evaluatorId: peers[0].id, evaluateeId: ee.id, groupId: "peer" });
  if (crosses.length > 0) systemConfig.multiRater360Config.evaluatorAssignments.push({ evaluatorId: crosses[0].id, evaluateeId: ee.id, groupId: "cross_department" });
});

const generatedObjectives = [...initialObjectives];
const generatedKeyResults = [...initialKeyResults];
const generatedKeyResultAssignees = [...initialKeyResultAssignees];
const generatedCheckInLogs = [...initialCheckInLogs];
const reviewCycles = [];
const eval360Submissions = [];
const performanceReviews = [];

const quarters = [
  { q: "Q1 2026", start: "2026-01-01", end: "2026-03-31" },
  { q: "Q2 2026", start: "2026-04-01", end: "2026-06-30" },
  { q: "Q3 2026", start: "2026-07-01", end: "2026-09-30" },
  { q: "Q4 2026", start: "2026-10-01", end: "2026-12-31" }
];

quarters.forEach((quarter, qIdx) => {
  const isCompleted = qIdx < 3; // Q1, Q2, Q3 completed, Q4 active
  const cycleId = `cycle_${quarter.q.replace(" ", "_").toLowerCase()}`;
  
  reviewCycles.push({
    id: cycleId,
    name: `Penilaian Kinerja ${quarter.q}`,
    status: isCompleted ? "completed" : "active",
    startDate: quarter.start,
    endDate: quarter.end
  });

  // Create objectives for each department
  depts.forEach((dept, dIdx) => {
    const objId = `obj_${dept}_${qIdx}`;
    generatedObjectives.push({
      id: objId,
      title: `Optimalisasi ${dept} di ${quarter.q}`,
      level: "circle",
      circleId: initialCircles.find(c => c.name.includes(dept))?.id || "circle_hr",
      parentId: null,
      targetQuarter: quarter.q,
      status: (!isCompleted && dIdx === 1) ? "pending" : "approved",
      currentApprovalStep: (!isCompleted && dIdx === 1) ? 0 : 2
    });

    // Create 5 Key Results per Objective
    for(let k=1; k<=5; k++) {
      const krId = `kr_${dept}_${qIdx}_${k}`;
      const target = 100 * k;
      const actual = isCompleted ? (target * (0.8 + (Math.random() * 0.4))) : (target * (Math.random() * 0.5)); // Random progress
      generatedKeyResults.push({
        id: krId,
        objectiveId: objId,
        title: `Indikator ${k} ${dept} ${quarter.q}`,
        targetValue: target,
        currentValue: Math.round(actual),
        unit: "Poin",
        progress: Math.min(100, Math.round((actual/target)*100)),
        weight: 20, // 5 * 20 = 100
        isShared: false,
        okrType: k === 5 ? "aspirational" : "committed",
        status: (!isCompleted && (k === 3 || k === 4)) ? "pending" : "approved",
        currentApprovalStep: (!isCompleted && (k === 3 || k === 4)) ? 0 : 2
      });
      
      const krAssigneeId = generatedUsers.find(u => u.department === dept && u.systemRole === "karyawan")?.id || "usr_hr_2";
      generatedKeyResultAssignees.push({
        id: `kra_${krId}`,
        keyResultId: krId,
        circleId: initialCircles.find(c => c.name.includes(dept))?.id || "circle_hr",
        roleId: null,
        weightPercentage: 100,
        currentProgress: Math.min(100, Math.round((actual/target)*100))
      });

      // Add a checkin log
      generatedCheckInLogs.push({
        id: `log_${krId}`,
        keyResultId: krId,
        assigneeId: krAssigneeId,
        roleId: null,
        previousValue: 0,
        newValue: Math.round(actual),
        notes: `Checkin ${quarter.q} for ${dept} Indicator ${k}`,
        blockerNotes: null,
        hasBlocker: false,
        dependencyCircleId: null,
        dependencyRoleId: null,
        timestamp: quarter.end + "T10:00:00Z",
        status: "approved"
      });
    }
  });

  // Generate submissions and performance reviews for evaluatees
  evaluatees.forEach(ee => {
    // 360 sub
    const assignemntsForEe = systemConfig.multiRater360Config.evaluatorAssignments.filter(a => a.evaluateeId === ee.id);
    assignemntsForEe.forEach((assignment, aIdx) => {
      eval360Submissions.push({
        id: `sub360_${cycleId}_${ee.id}_${aIdx}`,
        templateId: "default",
        evaluateeId: ee.id,
        evaluatorId: assignment.evaluatorId,
        groupId: assignment.groupId,
        answers: [
          { questionId: "q_360_1", score: 80 + Math.floor(Math.random() * 20) }, // 80-100
          { questionId: "q_360_2", score: 80 + Math.floor(Math.random() * 20) }
        ],
        status: "submitted",
        submittedAt: quarter.end + "T12:00:00Z",
        reviewCycleId: cycleId
      });
    });

    // Performance review
    performanceReviews.push({
      id: `pr_${ee.id}_${cycleId}`,
      userId: ee.id,
      reviewCycleId: cycleId,
      okrScore: 80 + Math.floor(Math.random() * 20),
      qualitativeScore: 4 + Math.random(),
      managerFeedback: "Kinerja yang sangat baik untuk kuartal ini.",
      selfAssessment: "Target sebagian besar tercapai.",
      growthPlan: "Perlu meningkatkan kepemimpinan.",
      status: isCompleted ? "approved" : "draft",
      updatedAt: quarter.end + "T14:00:00Z",
      reviewMethod: "bsc360",
      kpis: systemConfig.defaultBscPerspectives.map((bsc, i) => ({
        id: `pr_kpi_${ee.id}_${cycleId}_${i}`,
        title: bsc.name,
        target: bsc.target,
        actual: bsc.target * (0.9 + Math.random() * 0.2), // hit target mostly
        weight: bsc.weight,
        score: 95 + Math.random() * 10
      })),
      score360: 85 + Math.random() * 10
    });
  });
});

const dbData = {
  users: generatedUsers,
  circles: initialCircles,
  roles: initialRoles,
  roleMembers: initialRoleMembers,
  objectives: generatedObjectives,
  keyResults: generatedKeyResults,
  keyResultAssignees: generatedKeyResultAssignees,
  checkInLogs: generatedCheckInLogs,
  reviewCycles: reviewCycles,
  performanceReviews: performanceReviews,
  eval360Submissions: eval360Submissions,
  systemConfig: systemConfig
};

try {
  fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf-8");
  console.log("Successfully generated comprehensive dummy data scenario in db.json");
} catch (e) {
  console.error("Failed to generate dummy data:", e);
}

