import { User, Circle, Role, RoleMember, Objective, KeyResult, KeyResultAssignee, CheckInLog, ReviewCycle, PerformanceReview } from "./types";

export const initialUsers: User[] = [
  {
    id: "usr_hr_1",
    name: "Ali Rahman",
    email: "ali@company.com",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    department: "HRD",
    systemRole: "direksi"
  },
  {
    id: "usr_hr_2",
    name: "Budi Santoso",
    email: "budi@company.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    department: "HRD",
    systemRole: "karyawan"
  },
  {
    id: "usr_prod_1",
    name: "Cici Utami",
    email: "cici@company.com",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    department: "Produksi",
    systemRole: "atasan_langsung"
  },
  {
    id: "usr_prod_2",
    name: "Dedi Setiawan",
    email: "dedi@company.com",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    department: "Produksi",
    systemRole: "karyawan"
  },
  {
    id: "usr_mkt_1",
    name: "Eko Prasetyo",
    email: "eko@company.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    department: "Marketing",
    systemRole: "atasan_langsung"
  },
  {
    id: "usr_mkt_2",
    name: "Fani Wijaya",
    email: "fani@company.com",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    department: "Marketing",
    systemRole: "karyawan"
  },
  {
    id: "usr_fin_1",
    name: "Gita Purnamasari",
    email: "gita@company.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    department: "Finance",
    systemRole: "atasan_langsung"
  },
  {
    id: "usr_fin_2",
    name: "Hendra Gunawan",
    email: "hendra@company.com",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150",
    department: "Finance",
    systemRole: "karyawan"
  }
];

export const initialCircles: Circle[] = [
  { id: "circle_hr", name: "Human Resources", description: "HR Department", subCircleOfId: null, leadId: "usr_hr_1", circleType: "department" },
  { id: "circle_prod", name: "Production", description: "Production Department", subCircleOfId: null, leadId: "usr_prod_1", circleType: "department" },
  { id: "circle_mkt", name: "Marketing & Sales", description: "Marketing Department", subCircleOfId: null, leadId: "usr_mkt_1", circleType: "department" },
  { id: "circle_fin", name: "Finance & Tax", description: "Finance Department", subCircleOfId: null, leadId: "usr_fin_1", circleType: "department" }
];

export const initialRoles: Role[] = [
  { id: "role_hr_lead", title: "VP of HR", circleId: "circle_hr", description: "Lead HR", accountabilities: [] },
  { id: "role_hr_staff", title: "HR Specialist", circleId: "circle_hr", description: "HR Staff", accountabilities: [] },
  { id: "role_prod_lead", title: "VP of Production", circleId: "circle_prod", description: "Lead Prod", accountabilities: [] },
  { id: "role_prod_staff", title: "Production Operator", circleId: "circle_prod", description: "Prod Staff", accountabilities: [] },
  { id: "role_mkt_lead", title: "VP of Marketing", circleId: "circle_mkt", description: "Lead Marketing", accountabilities: [] },
  { id: "role_mkt_staff", title: "Marketing Specialist", circleId: "circle_mkt", description: "Marketing Staff", accountabilities: [] },
  { id: "role_fin_lead", title: "VP of Finance", circleId: "circle_fin", description: "Lead Finance", accountabilities: [] },
  { id: "role_fin_staff", title: "Accountant", circleId: "circle_fin", description: "Finance Staff", accountabilities: [] }
];

export const initialRoleMembers: RoleMember[] = [
  { id: "rm_hr_1", roleId: "role_hr_lead", userId: "usr_hr_1" },
  { id: "rm_hr_2", roleId: "role_hr_staff", userId: "usr_hr_2" },
  { id: "rm_prod_1", roleId: "role_prod_lead", userId: "usr_prod_1" },
  { id: "rm_prod_2", roleId: "role_prod_staff", userId: "usr_prod_2" },
  { id: "rm_mkt_1", roleId: "role_mkt_lead", userId: "usr_mkt_1" },
  { id: "rm_mkt_2", roleId: "role_mkt_staff", userId: "usr_mkt_2" },
  { id: "rm_fin_1", roleId: "role_fin_lead", userId: "usr_fin_1" },
  { id: "rm_fin_2", roleId: "role_fin_staff", userId: "usr_fin_2" }
];

export const initialObjectives: Objective[] = [
  {
    id: "obj_corp_1",
    title: "Mencapai Pertumbuhan Pendapatan Berkelanjutan 2026",
    level: "company",
    circleId: null,
    parentId: null,
    targetQuarter: "Q1 2026",
    status: "approved",
    currentApprovalStep: 2
  },
  {
    id: "obj_corp_2",
    title: "Membangun Operational Excellence dan Budaya Inovasi",
    level: "company",
    circleId: null,
    parentId: null,
    targetQuarter: "Q1 2026",
    status: "approved",
    currentApprovalStep: 2
  },
  {
    id: "obj_hr_draft_1",
    title: "Membangun Program Leadership Berkelanjutan",
    level: "circle",
    circleId: "circle_hr",
    parentId: "kr_corp_2_2",
    targetQuarter: "Q1 2026",
    status: "pending",
    currentApprovalStep: 1
  },
  {
    id: "obj_mkt_draft_1",
    title: "Ekspansi Kampanye Marketing Regional",
    level: "circle",
    circleId: "circle_mkt",
    parentId: "kr_corp_1_1",
    targetQuarter: "Q1 2026",
    status: "pending",
    currentApprovalStep: 1
  },
  {
    id: "obj_hr_1",
    title: "Meningkatkan Kualitas SDM dan Budaya Kerja",
    level: "circle",
    circleId: "circle_hr",
    parentId: "kr_corp_2_1",
    targetQuarter: "Q1 2026",
    status: "approved",
    currentApprovalStep: 2
  },
  {
    id: "obj_prod_1",
    title: "Optimalisasi Efisiensi Produksi",
    level: "circle",
    circleId: "circle_prod",
    parentId: "kr_corp_2_2",
    targetQuarter: "Q1 2026",
    status: "approved",
    currentApprovalStep: 2
  },
  {
    id: "obj_mkt_1",
    title: "Ekspansi Pangsa Pasar Domestik",
    level: "circle",
    circleId: "circle_mkt",
    parentId: "kr_corp_1_1",
    targetQuarter: "Q1 2026",
    status: "approved",
    currentApprovalStep: 2
  },
  {
    id: "obj_fin_1",
    title: "Optimalisasi Arus Kas Perusahaan",
    level: "circle",
    circleId: "circle_fin",
    parentId: "kr_corp_1_1",
    targetQuarter: "Q1 2026",
    status: "approved",
    currentApprovalStep: 2
  }
];

export const initialKeyResults: KeyResult[] = [
  {
    id: "kr_corp_1_1",
    objectiveId: "obj_corp_1",
    title: "Meningkatkan pangsa pasar menjadi 35%",
    targetValue: 35,
    unit: "%",
    calcSystem: "maximize",
    weight: 50,
    currentValue: 20,
    progress: 57,
    isShared: false,
    okrType: "committed",
    status: "approved"
  },
  {
    id: "kr_corp_1_2",
    objectiveId: "obj_corp_1",
    title: "Mempertahankan margin EBITDA di 20%",
    targetValue: 20,
    unit: "%",
    calcSystem: "maximize",
    weight: 50,
    currentValue: 18,
    progress: 90,
    isShared: false,
    okrType: "committed",
    status: "approved"
  },
  {
    id: "kr_corp_2_1",
    objectiveId: "obj_corp_2",
    title: "Menurunkan turnover rate menjadi < 5%",
    targetValue: 5,
    unit: "%",
    calcSystem: "minimize",
    weight: 50,
    currentValue: 8,
    progress: 40,
    isShared: false,
    okrType: "committed",
    status: "approved"
  },
  {
    id: "kr_corp_2_2",
    objectiveId: "obj_corp_2",
    title: "Meningkatkan OEE (Overall Equipment Effectiveness) ke 85%",
    targetValue: 85,
    unit: "%",
    calcSystem: "maximize",
    weight: 50,
    currentValue: 70,
    progress: 82,
    isShared: false,
    okrType: "committed",
    status: "approved"
  },

  {
    id: "kr_hr_draft_1",
    objectiveId: "obj_hr_draft_1",
    title: "Mencetak 5 pemimpin baru dari jalur internal",
    targetValue: 5,
    unit: "Orang",
    calcSystem: "maximize",
    weight: 100,
    isShared: false,
    okrType: "aspirational",
    status: "pending",
    currentApprovalStep: 1,
    currentValue: 0,
    progress: 0
  },
  {
    id: "kr_mkt_draft_1",
    objectiveId: "obj_mkt_draft_1",
    title: "Meningkatkan ROI Kampanye menjadi 3.5",
    targetValue: 3.5,
    unit: "Ratio",
    calcSystem: "maximize",
    weight: 100,
    isShared: false,
    okrType: "committed",
    status: "pending",
    currentApprovalStep: 1,
    currentValue: 0,
    progress: 0
  },
  {
    id: "kr_hr_1",
    objectiveId: "obj_hr_1",
    title: "Mencapai nilai employee engagement 0.85",
    targetValue: 0.85,
    currentValue: 0.85,
    unit: "",
    progress: 100,
    weight: 30,
    isShared: false,
    okrType: "committed",
    status: "approved",
    currentApprovalStep: 2
  },
  {
    id: "kr_hr_2",
    objectiveId: "obj_hr_1",
    title: "Menyelenggarakan 5 program training kepemimpinan",
    targetValue: 5,
    currentValue: 4,
    unit: "Program",
    progress: 80,
    weight: 30,
    isShared: false,
    okrType: "committed",
    status: "approved",
    currentApprovalStep: 2
  },
  {
    id: "kr_hr_3",
    objectiveId: "obj_hr_1",
    title: "Meningkatkan retensi karyawan menjadi 95%",
    targetValue: 0.95,
    currentValue: 0.80,
    unit: "",
    progress: 84,
    weight: 40,
    isShared: false,
    okrType: "aspirational",
    status: "approved",
    currentApprovalStep: 2
  },
  {
    id: "kr_prod_1",
    objectiveId: "obj_prod_1",
    title: "Mengurangi defect rate menjadi di bawah 0.05",
    targetValue: 0.95, // Reverse metric to be positive? Let's say 1.00 is perfect
    currentValue: 0.80,
    unit: "",
    progress: 84,
    weight: 100,
    isShared: false,
    okrType: "committed",
    status: "approved",
    currentApprovalStep: 2
  },
  {
    id: "kr_mkt_1",
    objectiveId: "obj_mkt_1",
    title: "Mencapai 1000 lead kualifikasi (1.00 dari target)",
    targetValue: 1.00,
    currentValue: 0.65,
    unit: "",
    progress: 65,
    weight: 100,
    isShared: false,
    okrType: "committed",
    status: "approved",
    currentApprovalStep: 2
  },
  {
    id: "kr_fin_1",
    objectiveId: "obj_fin_1",
    title: "Menurunkan DSO (Days Sales Outstanding) sebesar 20%",
    targetValue: 1.00,
    currentValue: 0.40,
    unit: "",
    progress: 40,
    weight: 100,
    isShared: false,
    okrType: "committed",
    status: "approved",
    currentApprovalStep: 2
  }
];

export const initialKeyResultAssignees: KeyResultAssignee[] = [
  {
    id: "kra_hr_1",
    keyResultId: "kr_hr_1",
    circleId: "circle_hr",
    roleId: "role_hr_staff",
    weightPercentage: 100,
    currentProgress: 100
  },
  {
    id: "kra_hr_2",
    keyResultId: "kr_hr_2",
    circleId: "circle_hr",
    roleId: "role_hr_staff",
    weightPercentage: 100,
    currentProgress: 40
  },
  {
    id: "kra_hr_3",
    keyResultId: "kr_hr_3",
    circleId: "circle_hr",
    roleId: "role_hr_staff",
    weightPercentage: 100,
    currentProgress: 84
  },
  {
    id: "kra_prod_1",
    keyResultId: "kr_prod_1",
    circleId: "circle_prod",
    roleId: "role_prod_staff",
    weightPercentage: 100,
    currentProgress: 84
  },
  {
    id: "kra_mkt_1",
    keyResultId: "kr_mkt_1",
    circleId: "circle_mkt",
    roleId: "role_mkt_staff",
    weightPercentage: 100,
    currentProgress: 65
  },
  {
    id: "kra_fin_1",
    keyResultId: "kr_fin_1",
    circleId: "circle_fin",
    roleId: "role_fin_staff",
    weightPercentage: 100,
    currentProgress: 40
  }
];

export const initialCheckInLogs: CheckInLog[] = [
  {
    id: "cil_1",
    keyResultId: "kr_hr_2",
    assigneeId: "usr_hr_2",
    roleId: "role_1",
    previousValue: 0,
    newValue: 2,
    notes: "Telah menyelesaikan 2 program kepemimpinan untuk level manajer bulan ini.",
    blockerNotes: null,
    hasBlocker: false,
    dependencyCircleId: null,
    dependencyRoleId: null,
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: "approved",
    approverId: "usr_hr_1",
    approverNotes: "Kerja bagus, terus lanjutkan progresnya.",
    approverIds: ["usr_hr_1"],
    updateFrequency: "weekly",
    attachmentName: "laporan_training_batch1.pdf"
  },
  {
    id: "cil_2",
    keyResultId: "kr_hr_2",
    assigneeId: "usr_hr_2",
    roleId: "role_1",
    previousValue: 2,
    newValue: 4,
    notes: "Persiapan program 3 dan 4 sudah matang, namun menunggu finalisasi materi dari vendor eksternal.",
    blockerNotes: "Vendor eksternal terlambat mengirimkan modul training.",
    hasBlocker: true,
    dependencyCircleId: "circle_1",
    dependencyRoleId: null,
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: "pending",
    approverId: null,
    approverNotes: null,
    approverIds: ["usr_hr_1"],
    updateFrequency: "weekly",
    attachmentName: "draft_modul_vendor.docx"
  },
  {
    id: "cil_3",
    keyResultId: "kr_hr_2",
    assigneeId: "usr_hr_2",
    roleId: "role_1",
    previousValue: 4,
    newValue: 4,
    notes: "Laporan kemajuan minggu ini ditolak karena data tidak valid.",
    blockerNotes: null,
    hasBlocker: false,
    dependencyCircleId: null,
    dependencyRoleId: null,
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: "rejected",
    approverId: "usr_hr_1",
    approverNotes: "Tolong lengkapi dengan data partisipan yang hadir.",
    approverIds: ["usr_hr_1"],
    updateFrequency: "weekly"
  },
  {
    id: "cil_4",
    keyResultId: "kr_prod_1",
    assigneeId: "usr_prod_2",
    roleId: "role_2",
    previousValue: 0,
    newValue: 1,
    notes: "Rilis MVP tertunda karena ada issue major pada database migration.",
    blockerNotes: null,
    hasBlocker: false,
    dependencyCircleId: null,
    dependencyRoleId: null,
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: "rejected",
    approverId: "usr_prod_1",
    approverNotes: "Harap perbaiki issue critical terlebih dahulu sebelum melaporkan progres rilis.",
    approverIds: ["usr_prod_1"],
    updateFrequency: "weekly",
    attachmentName: "error_log_migration.txt"
  }
];

export const initialReviewCycles: ReviewCycle[] = [
  {
    id: "cycle_1",
    name: "Q1 2026 Performance Review",
    startDate: "2026-03-15",
    endDate: "2026-03-31",
    status: "active"
  }
];

export const initialPerformanceReviews: PerformanceReview[] = [
  {
    id: "rev_finished_1",
    cycleId: "cycle_1",
    userId: "usr_hr_2",
    evaluatedBy: "usr_hr_1",
    okrScore: 85,
    qualitativeScore: 4.5,
    managerFeedback: "Kerja bagus, OKR tercapai dengan sangat baik.",
    selfAssessment: "Saya merasa telah berkontribusi maksimal pada kuartal ini.",
    growthPlan: "Ingin mengambil sertifikasi HR lanjutan.",
    status: "submitted",
    updatedAt: "2026-03-20T10:00:00Z",
    reviewMethod: "okr"
  },
  {
    id: "rev_draft_1",
    cycleId: "cycle_1",
    userId: "usr_prod_1",
    evaluatedBy: "usr_hr_1",
    okrScore: 70,
    qualitativeScore: 3.5,
    managerFeedback: "Masih banyak ruang untuk perbaikan di efisiensi produksi.",
    selfAssessment: "Ada kendala bahan baku di awal bulan.",
    growthPlan: "",
    status: "draft",
    updatedAt: "2026-03-25T14:30:00Z",
    reviewMethod: "okr"
  }
];

export const initialEval360Submissions: any[] = [
  {
    id: "sub360_finished_1",
    templateId: "template_1",
    evaluateeId: "usr_hr_1",
    evaluatorId: "usr_hr_2",
    groupId: "subordinate",
    answers: [{ questionId: "q1", score: 4 }, { questionId: "q2", score: 5 }],
    totalScore: 90,
    status: "submitted",
    submittedAt: "2026-03-21T09:15:00Z",
    notes: "Kepemimpinan sangat suportif."
  },
  {
    id: "sub360_draft_1",
    templateId: "template_1",
    evaluateeId: "usr_prod_1",
    evaluatorId: "usr_prod_2",
    groupId: "peer",
    answers: [{ questionId: "q1", score: 3 }],
    totalScore: 60,
    status: "draft",
    notes: "Kerjasama tim perlu ditingkatkan."
  }
];

export const initialTalent9BoxConfigs = [
  { id: "box_1", boxNumber: 1, name: "Underperformer", description: "Low Performance, Low Potential", color: "bg-red-500", priority: "Low", recommendations: ["Performance Improvement Plan", "Reassignment"], minPerf: 0, maxPerf: 33, minPot: 0, maxPot: 33 },
  { id: "box_2", boxNumber: 2, name: "Inconsistent", description: "Low Performance, Medium Potential", color: "bg-orange-400", priority: "Low", recommendations: ["Coaching", "Role Realignment"], minPerf: 0, maxPerf: 33, minPot: 34, maxPot: 66 },
  { id: "box_3", boxNumber: 3, name: "Rough Diamond", description: "Low Performance, High Potential", color: "bg-amber-400", priority: "Medium", recommendations: ["Mentoring", "New Challenge"], minPerf: 0, maxPerf: 33, minPot: 67, maxPot: 100 },
  { id: "box_4", boxNumber: 4, name: "Solid Contributor", description: "Medium Performance, Low Potential", color: "bg-orange-400", priority: "Medium", recommendations: ["Keep Motivated", "Reward"], minPerf: 34, maxPerf: 66, minPot: 0, maxPot: 33 },
  { id: "box_5", boxNumber: 5, name: "Core Employee", description: "Medium Performance, Medium Potential", color: "bg-yellow-400", priority: "Medium", recommendations: ["Develop Skills", "Stretch Assignment"], minPerf: 34, maxPerf: 66, minPot: 34, maxPot: 66 },
  { id: "box_6", boxNumber: 6, name: "High Potential", description: "Medium Performance, High Potential", color: "bg-lime-500", priority: "High", recommendations: ["Leadership Program", "Fast Track"], minPerf: 34, maxPerf: 66, minPot: 67, maxPot: 100 },
  { id: "box_7", boxNumber: 7, name: "Trusted Expert", description: "High Performance, Low Potential", color: "bg-emerald-400", priority: "Medium", recommendations: ["Recognize", "Subject Matter Expert Role"], minPerf: 67, maxPerf: 100, minPot: 0, maxPot: 33 },
  { id: "box_8", boxNumber: 8, name: "High Performer", description: "High Performance, Medium Potential", color: "bg-emerald-500", priority: "High", recommendations: ["Prepare for Promotion", "Key Projects"], minPerf: 67, maxPerf: 100, minPot: 34, maxPot: 66 },
  { id: "box_9", boxNumber: 9, name: "Future Leader", description: "High Performance, High Potential", color: "bg-emerald-600", priority: "High", recommendations: ["Promote", "Executive Mentoring"], minPerf: 67, maxPerf: 100, minPot: 67, maxPot: 100 },
];

export const generateDummyEmployees = (count: number = 100) => {
  const departments = ["Finance", "Sales", "HR", "Engineering", "Marketing", "Operation", "Product"];
  const locations = ["Jakarta", "Bandung", "Surabaya", "Bali", "Singapore", "Kuala Lumpur"];
  const firstNames = ["Budi", "Andi", "Siti", "Dewi", "Rudi", "Anton", "Rina", "Nina", "Dimas", "Ayu", "Kevin", "Sarah", "John", "Jane", "David", "Linda", "Putri", "Reza", "Fahmi", "Nadia"];
  const lastNames = ["Santoso", "Wijaya", "Kusuma", "Setiawan", "Pratama", "Saputra", "Nugroho", "Siregar", "Hidayat", "Lestari", "Wahyudi", "Pangestu", "Sari"];
  
  const employees: any[] = [];
  
  for (let i = 0; i < count; i++) {
    const perf = Math.floor(Math.random() * 100);
    const pot = Math.floor(Math.random() * 100);
    
    // Determine Box ID based on 33/66 thresholds
    let boxId = "";
    if (perf <= 33 && pot <= 33) boxId = "box_1";
    else if (perf <= 33 && pot <= 66) boxId = "box_2";
    else if (perf <= 33 && pot <= 100) boxId = "box_3";
    else if (perf <= 66 && pot <= 33) boxId = "box_4";
    else if (perf <= 66 && pot <= 66) boxId = "box_5";
    else if (perf <= 66 && pot <= 100) boxId = "box_6";
    else if (perf <= 100 && pot <= 33) boxId = "box_7";
    else if (perf <= 100 && pot <= 66) boxId = "box_8";
    else boxId = "box_9";

    const isMale = Math.random() > 0.5;
    const badges = [];
    if (boxId === "box_9") badges.push("Future Leader");
    if (["box_8", "box_9"].includes(boxId)) badges.push("Ready Now");
    if (perf > 80) badges.push("High Performer");
    if (pot > 80) badges.push("High Potential");
    if (Math.random() > 0.9) badges.push("Critical Talent");
    if (perf < 30 || pot < 30) badges.push("Retention Risk");

    employees.push({
      id: `emp_${i + 1}`,
      name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      gender: isMale ? "Male" : "Female",
      age: 22 + Math.floor(Math.random() * 40),
      department: departments[Math.floor(Math.random() * departments.length)],
      position: `Staff ${i}`,
      division: "Core",
      location: locations[Math.floor(Math.random() * locations.length)],
      joinDate: new Date(Date.now() - Math.random() * 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tenureYears: Math.floor(Math.random() * 10),
      performanceScore: perf,
      potentialScore: pot,
      boxId,
      badges,
      riskLevel: Math.random() > 0.8 ? "High" : Math.random() > 0.5 ? "Medium" : "Low",
      readinessLevel: Math.random() > 0.7 ? "Ready Now" : Math.random() > 0.4 ? "1-2 Years" : "3-5 Years",
      leadershipScore: Math.floor(Math.random() * 100),
      status: Math.random() > 0.95 ? "Resigned" : "Active",
      avatar: `https://i.pravatar.cc/150?u=${i}`
    });
  }
  return employees;
};

export const initialTalentEmployees = generateDummyEmployees(100);

