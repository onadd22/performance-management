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
    parentId: "obj_corp_2",
    targetQuarter: "Q1 2026",
    status: "pending",
    currentApprovalStep: 1
  },
  {
    id: "obj_mkt_draft_1",
    title: "Ekspansi Kampanye Marketing Regional",
    level: "circle",
    circleId: "circle_mkt",
    parentId: "obj_corp_1",
    targetQuarter: "Q1 2026",
    status: "pending",
    currentApprovalStep: 1
  },
  {
    id: "obj_hr_1",
    title: "Meningkatkan Kualitas SDM dan Budaya Kerja",
    level: "circle",
    circleId: "circle_hr",
    parentId: "obj_corp_2",
    targetQuarter: "Q1 2026",
    status: "approved",
    currentApprovalStep: 2
  },
  {
    id: "obj_prod_1",
    title: "Optimalisasi Efisiensi Produksi",
    level: "circle",
    circleId: "circle_prod",
    parentId: "obj_corp_2",
    targetQuarter: "Q1 2026",
    status: "approved",
    currentApprovalStep: 2
  },
  {
    id: "obj_mkt_1",
    title: "Ekspansi Pangsa Pasar Domestik",
    level: "circle",
    circleId: "circle_mkt",
    parentId: "obj_corp_1",
    targetQuarter: "Q1 2026",
    status: "approved",
    currentApprovalStep: 2
  },
  {
    id: "obj_fin_1",
    title: "Optimalisasi Arus Kas Perusahaan",
    level: "circle",
    circleId: "circle_fin",
    parentId: "obj_corp_1",
    targetQuarter: "Q1 2026",
    status: "approved",
    currentApprovalStep: 2
  }
];

export const initialKeyResults: KeyResult[] = [
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
