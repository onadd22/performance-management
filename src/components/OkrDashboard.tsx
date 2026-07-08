import React, { useState, useMemo } from "react";
import SearchableSelect from "./SearchableSelect";
import { TooltipWrapper } from "./TooltipContext";
import MetricsGlossary from "./MetricsGlossary";

// SAFELIST FOR DYNAMIC TAILWIND CLASSES
// bg-emerald-50 bg-emerald-100 bg-emerald-600 bg-emerald-700 bg-emerald-800 bg-emerald-900 bg-emerald-950
// text-emerald-700 text-emerald-800 text-emerald-900 text-white
// border-emerald-100 border-emerald-200 border-emerald-900 border-emerald-950
// focus:ring-emerald-500 hover:bg-emerald-100 hover:bg-emerald-800 hover:bg-emerald-900 hover:bg-emerald-950
// bg-indigo-50 bg-indigo-100 bg-indigo-600 bg-indigo-700 bg-indigo-800 bg-indigo-900 bg-indigo-950
// text-indigo-700 text-indigo-800 text-indigo-900
// border-indigo-100 border-indigo-200 border-indigo-900 border-indigo-950
// focus:ring-indigo-500 hover:bg-indigo-100 hover:bg-indigo-800 hover:bg-indigo-900 hover:bg-indigo-950

import {
  Objective,
  KeyResult,
  KeyResultAssignee,
  Circle,
  Role,
  User,
  RoleMember,
  CheckInLog,
  SystemConfig,
} from "../types";
import {
  Target,
  TrendingUp,
  Handshake,
  PlusCircle,
  Layers,
  Link,
  Shield,
  Users,
  Edit,
  Trash2,
  Settings,
  AlertTriangle,
  Award,
  HelpCircle,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  UserCheck,
  CheckSquare,
  MessageSquare,
  Plus,
  Info,
  Layout,
  Sparkles,
  Search,
  GitMerge,
  Crosshair,
  Percent,
  Zap,
  ClipboardCheck,
  Filter,

} from "lucide-react";
import { calculateOkrOverallSummary, getKrClassification, calculateKeyResultRisk, OkrRiskDetail } from "../utils/okrCalc";
import OkrEvaluationEngineView from "./OkrEvaluationEngineView";
import { OkrAlignmentMap } from "./OkrAlignmentMap";
import { OkrProgressTracker } from "./OkrProgressTracker";

interface OkrDashboardProps {
  lang: "ID" | "EN";
  circles: Circle[];
  roles: Role[];
  objectives: Objective[];
  keyResults: KeyResult[];
  keyResultAssignees: KeyResultAssignee[];
  onObjectiveAdded: (newObj: Objective) => void;
  onKeyResultAdded: (newKRData: any) => void;
  onObjectiveUpdated?: (id: string, updatedData: Partial<Objective>) => void;
  onObjectiveDeleted?: (id: string) => void;
  onKeyResultUpdated?: (id: string, updatedData: Partial<KeyResult>) => void;
  onKeyResultDeleted?: (id: string) => void;
  systemConfig?: SystemConfig;
  onConfigUpdated?: (config: any) => void;
  // Dynamic links for Employee Sandbox View & Fast Check-Ins
  users?: User[];
  roleMembers?: RoleMember[];
  checkInLogs?: CheckInLog[];
  onCheckInSubmitted?: (payload: any) => void;
  onReviewCheckIn?: (
    id: string,
    payload: {
      approverId: string;
      status: "approved" | "rejected";
      approverNotes: string | null;
    },
  ) => void;
  onDeleteCheckIn?: (id: string) => void;
  currentLoginUserId?: string;
}

const AlignmentTree = ({
  objectiveId,
  objectives,
  keyResults,
  circles,
}: {
  key?: string;
  objectiveId: string;
  objectives: Objective[];
  keyResults: KeyResult[];
  circles: Circle[];
}) => {
  const obj = objectives.find((o) => o.id === objectiveId);
  if (!obj) return null;

  const childObjectives = objectives.filter((o) => o.parentId === objectiveId);
  const childKRs = keyResults.filter((kr) => kr.objectiveId === objectiveId);
  const circleName = obj.circleId
    ? circles.find((c) => c.id === obj.circleId)?.name || "Unknown Circle"
    : "Corporate";

  return (
    <div className="relative pl-6 py-2">
      {/* Vertical line connecting to parent */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200"></div>

      {/* Horizontal connector to this node */}
      <div className="absolute left-0 top-6 w-5 h-px bg-slate-200"></div>

      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-emerald-300 transition-colors">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                obj.level === "company"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-teal-100 text-teal-800"
              }`}
            >
              {obj.level === "company" ? "🏢 TOP GOAL" : "👥 SEKTOR GOAL"}
            </span>
            <span className="text-[10px] text-slate-500 font-medium px-1.5 bg-slate-100 rounded">
              {circleName}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 border border-slate-200 px-1 rounded">
            {obj.targetQuarter}
          </span>
        </div>
        <h4 className="font-bold text-slate-700 text-sm">{obj.title}</h4>
      </div>

      {/* Children list */}
      {(childKRs.length > 0 || childObjectives.length > 0) && (
        <div className="mt-2 pl-4">
          {childKRs.map((kr) => (
            <div key={kr.id} className="relative pl-6 py-1.5">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200"></div>
              <div className="absolute left-0 top-1/2 w-5 h-px bg-slate-200"></div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center gap-2">
                <Target className="size-3.5 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">
                  {kr.title}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${kr.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {Math.round(kr.progress)}%
                  </span>
                </div>
              </div>
            </div>
          ))}

          {childObjectives.map((childObj) => (
            <AlignmentTree
              key={childObj.id}
              objectiveId={childObj.id}
              objectives={objectives}
              keyResults={keyResults}
              circles={circles}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function OkrDashboard({
  lang,
  circles,
  roles,
  objectives,
  keyResults,
  keyResultAssignees,
  onObjectiveAdded,
  onKeyResultAdded,
  onObjectiveUpdated,
  onObjectiveDeleted,
  onKeyResultUpdated,
  onKeyResultDeleted,
  systemConfig,
  onConfigUpdated,
  users = [],
  roleMembers = [],
  checkInLogs = [],
  onCheckInSubmitted,
  onReviewCheckIn,
  onDeleteCheckIn,
  currentLoginUserId,
}: OkrDashboardProps) {
  const activeMethod = systemConfig?.defaultReviewMethod || "okr";
  const methodTermLabel = activeMethod === "bsc360" ? "BSC" : activeMethod.toUpperCase();

  const handleMethodSwitch = (method: "okr" | "kpi" | "bsc360") => {
    if (onConfigUpdated) {
      onConfigUpdated({
        defaultReviewMethod: method,
      });
    }
  };

  const getObjectiveProgress = React.useCallback(
    (objId: string): number => {
      const childKRs = keyResults.filter((kr) => kr.objectiveId === objId);
      const childObjs = objectives.filter((o) => o.parentId === objId);

      if (childKRs.length === 0 && childObjs.length === 0) return 0;

      if (activeMethod === "kpi") {
        const totalWeight = childKRs.reduce((sum, kr) => sum + (kr.weight || 100), 0) || 100;
        const weightedSum = childKRs.reduce((sum, kr) => sum + (kr.progress * ((kr.weight || 100) / totalWeight)), 0);
        return Math.round(weightedSum);
      } else {
        // Average of child KRs + child Objectives
        const krsProgressSum = childKRs.reduce((sum, kr) => sum + kr.progress, 0);
        
        let childObjsProgressSum = 0;
        if (childObjs.length > 0) {
           childObjsProgressSum = childObjs.reduce((sum, child) => sum + getObjectiveProgress(child.id), 0);
        }

        const totalItems = childKRs.length + childObjs.length;
        if (totalItems === 0) return 0;

        return Math.round((krsProgressSum + childObjsProgressSum) / totalItems);
      }
    },
    [keyResults, objectives, activeMethod],
  );

  const methodTerms = React.useMemo(() => {
    const terms = {
      okr: {
        title: lang === "ID" ? "Dashboard OKR Transparan" : "Transparent OKR Dashboard",
        objectiveLabel: lang === "ID" ? "Objective" : "Objective",
        objectiveLabelPlural: lang === "ID" ? "Objectives" : "Objectives",
        objectiveLevelCompany: lang === "ID" ? "🏢 TOP MANAGEMENT GOAL" : "🏢 TOP MANAGEMENT GOAL",
        objectiveLevelCircle: lang === "ID" ? "👥 LEAD OBJECTIVE" : "👥 LEAD OBJECTIVE",
        keyResultLabel: lang === "ID" ? "Key Result" : "Key Result",
        addObjectiveBtn: lang === "ID" ? "Tambah Objective" : "Create Objective",
        addKeyResultBtn: lang === "ID" ? "Tambah Key Result" : "Create Key Result",
        progressLabel: lang === "ID" ? "Kemajuan OKR" : "OKR Progress",
        formulaTip: lang === "ID" ? "Rata-rata sederhana dari seluruh pencapaian Key Results." : "Simple average of all Key Results progress.",
        colorClass: "emerald",
        primaryColorHex: "#10b981", // Emerald
        objectiveTitleLabel: lang === "ID" ? "Judul Objective *" : "Objective Title *",
        objectiveTitlePlaceholder: lang === "ID" ? "Contoh: Mengoptimalkan infrastruktur data Cloud & efisiensi operasional harian" : "e.g., Optimize cloud data architecture and operational efficiency",
        objectiveTitleTooltip: lang === "ID" ? "Pernyataan kualitatif dan inspirasional tentang apa yang ingin Anda capai." : "A qualitative, inspirational statement of what you want to achieve.",
        keyResultTitleLabel: lang === "ID" ? "Judul / Indikator Key Result *" : "Key Result Title / Indicator *",
        keyResultTitlePlaceholder: lang === "ID" ? "Contoh: Meningkatkan retensi pelanggan mingguan hingga 85%" : "e.g., Increase weekly customer retention up to 85%",
        keyResultTitleTooltip: lang === "ID" ? "Metrik atau indikator terukur yang mendefinisikan kesuksesan Objective." : "A measurable metric or indicator that defines the success of the Objective.",
        keyResultParentLabel: lang === "ID" ? "Gantungkan ke Sasaran Objective *" : "Attach to Objective *",
        keyResultParentTooltip: lang === "ID" ? "Pilih Objective induk tempat Key Result ini bernaung." : "Select the parent Objective for this Key Result.",
      },
      kpi: {
        title: lang === "ID" ? "Dashboard KPI Terbobot & Terukur" : "Weighted KPI Dashboard",
        objectiveLabel: lang === "ID" ? "Kategori KPI" : "KPI Category",
        objectiveLabelPlural: lang === "ID" ? "Kategori KPI" : "KPI Categories",
        objectiveLevelCompany: lang === "ID" ? "🏢 KATEGORI KPI KORPORAT" : "🏢 CORPORATE KPI CATEGORY",
        objectiveLevelCircle: lang === "ID" ? "👥 KATEGORI KPI DEPARTEMEN" : "👥 DEPT KPI CATEGORY",
        keyResultLabel: lang === "ID" ? "Indikator KPI" : "KPI Indicator",
        addObjectiveBtn: lang === "ID" ? "Tambah Kategori KPI" : "Create KPI Category",
        addKeyResultBtn: lang === "ID" ? "Tambah Indikator KPI" : "Create KPI Indicator",
        progressLabel: lang === "ID" ? "Pencapaian KPI Terbobot" : "Weighted KPI Progress",
        formulaTip: lang === "ID" ? "Kalkulasi berbasis bobot (Weight %) dikali nilai pencapaian masing-masing KPI." : "Calculation based on weights (Weight %) multiplied by achievement of each KPI.",
        colorClass: "indigo",
        primaryColorHex: "#6366f1", // Indigo
        objectiveTitleLabel: lang === "ID" ? "Nama Kategori KPI *" : "KPI Category Name *",
        objectiveTitlePlaceholder: lang === "ID" ? "Contoh: Kinerja Keuangan & Pertumbuhan" : "e.g., Financial Performance & Growth",
        objectiveTitleTooltip: lang === "ID" ? "Grup atau Kategori utama untuk metrik KPI di dalamnya." : "The main group or category for the KPI metrics within it.",
        keyResultTitleLabel: lang === "ID" ? "Nama Indikator KPI *" : "KPI Indicator Name *",
        keyResultTitlePlaceholder: lang === "ID" ? "Contoh: Pertumbuhan Pendapatan YoY" : "e.g., YoY Revenue Growth",
        keyResultTitleTooltip: lang === "ID" ? "Indikator spesifik yang diukur secara kuantitatif." : "Specific indicator that is measured quantitatively.",
        keyResultParentLabel: lang === "ID" ? "Gantungkan ke Kategori KPI *" : "Attach to KPI Category *",
        keyResultParentTooltip: lang === "ID" ? "Pilih Kategori KPI tempat indikator ini bernaung." : "Select the parent KPI Category for this indicator.",
      },
      bsc360: {
        title: lang === "ID" ? "Dashboard Balanced Scorecard" : "Balanced Scorecard Dashboard",
        objectiveLabel: lang === "ID" ? "Perspektif BSC" : "BSC Perspective",
        objectiveLabelPlural: lang === "ID" ? "Perspektif BSC" : "BSC Perspectives",
        objectiveLevelCompany: lang === "ID" ? "📊 SASARAN STRATEGIS UTAMA" : "📊 MAIN STRATEGIC GOAL",
        objectiveLevelCircle: lang === "ID" ? "👥 SASARAN DEPARTEMEN" : "👥 DEPT STRATEGIC GOAL",
        keyResultLabel: lang === "ID" ? "Indikator BSC" : "BSC Indicator",
        addObjectiveBtn: lang === "ID" ? "Tambah Sasaran Perspektif" : "Create Perspective Goal",
        addKeyResultBtn: lang === "ID" ? "Tambah Indikator BSC" : "Create BSC Indicator",
        progressLabel: lang === "ID" ? "Pencapaian Perspektif BSC" : "BSC Perspective Progress",
        formulaTip: lang === "ID" ? "Mengukur keselarasan 4 perspektif utama perusahaan (Financial, Customer, Internal Process, Learning)." : "Measures alignment across 4 main perspective categories (Financial, Customer, Internal Process, Learning).",
        colorClass: "purple",
        primaryColorHex: "#a855f7", // Purple
        objectiveTitleLabel: lang === "ID" ? "Sasaran Strategis Perspektif *" : "Perspective Strategic Goal *",
        objectiveTitlePlaceholder: lang === "ID" ? "Contoh: Meningkatkan Profitabilitas Berkelanjutan (Financial)" : "e.g., Increase Sustainable Profitability (Financial)",
        objectiveTitleTooltip: lang === "ID" ? "Sasaran strategis utama dalam perspektif BSC (Finance, Customer, Internal, Learning)." : "Main strategic goal within a BSC perspective (Finance, Customer, Internal, Learning).",
        keyResultTitleLabel: lang === "ID" ? "Indikator Kinerja Strategis *" : "Strategic Performance Indicator *",
        keyResultTitlePlaceholder: lang === "ID" ? "Contoh: Net Profit Margin (%)" : "e.g., Net Profit Margin (%)",
        keyResultTitleTooltip: lang === "ID" ? "Metrik tolak ukur dari sasaran strategis terkait." : "The benchmark metric for the related strategic goal.",
        keyResultParentLabel: lang === "ID" ? "Gantungkan ke Sasaran Strategis *" : "Attach to Strategic Goal *",
        keyResultParentTooltip: lang === "ID" ? "Pilih Sasaran Strategis tempat indikator BSC ini bernaung." : "Select the parent Strategic Goal for this BSC indicator.",
      }
    };
    return terms[activeMethod];
  }, [activeMethod, lang]);

  // Navigation role switcher: Karyawan vs Manajemen
  const [okrViewMode, setOkrViewMode] = useState<
    "karyawan" | "manajemen" | "bantuan" | "approval" | "alignment_map" | "tracking_progress"
  >("karyawan");

  const isCreationLocked = () => {
    if (!systemConfig?.startDate) return false;
    const start = new Date(systemConfig.startDate);
    const now = new Date();
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return now >= start;
  };

  const isQuarterLocked = () => {
    if (!systemConfig?.endDate) return false;
    const end = new Date(systemConfig.endDate);
    const now = new Date();
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return now > end;
  };

  const getActualDaysRemaining = () => {
    if (!systemConfig?.endDate) return null;
    const end = new Date(systemConfig.endDate);
    const now = new Date();
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const hasEnded = isQuarterLocked();
  const isLocked = false;
  const actualDaysRemaining = getActualDaysRemaining();

  // Check current user role permissions
  const currentUser = users.find((u) => u.id === currentLoginUserId);
  const currentRolePerm =
    systemConfig?.rolePermissions?.find(
      (rp) => rp.id === currentUser?.systemRole,
    ) || systemConfig?.rolePermissions?.find((rp) => rp.id === "karyawan");

  const canViewAll = currentRolePerm?.canViewAllReports ?? false;

  // Selection state for Karyawan mode
  // If cannot view all, only allow selecting themselves
  const allowedUsers = canViewAll
    ? users
    : users.filter((u) => u.id === currentLoginUserId);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    allowedUsers.length > 0
      ? (canViewAll ? users[0]?.id : currentLoginUserId) || ""
      : "",
  );

  React.useEffect(() => {
    if (!canViewAll && currentLoginUserId) {
      setSelectedEmpId(currentLoginUserId);
    }
  }, [currentLoginUserId, canViewAll]);

  // Level selector for management dashboard view
  const [selectedLevel, setSelectedLevel] = useState<
    "all" | "company" | "circle"
  >("all");
  const [managementSearchQuery, setManagementSearchQuery] = useState("");
  const [managementStatusFilter,
  setManagementStatusFilter] = useState<
    "all" | "on_track" | "at_risk" | "off_track"
  >("all");
  const [managementOwnerFilter,
  setManagementOwnerFilter] = useState<
    "all" | string
  >("all");

  const [expandedTreeObjId, setExpandedTreeObjId] = useState<string | null>(
    null,
  );

  // Filter selector for Karyawan mode
  const [karyawanOkrFilter,
  setKaryawanOkrFilter] = useState<
    "personal" | "department" | "company" | "all"
  >("all");

  // Modal open states
  const [showAddObjective, setShowAddObjective] = useState(false);
  const [showAddKeyResult, setShowAddKeyResult] = useState(false);
  const [expandedKrs, setExpandedKrs] = useState<string[]>([]);
  const [showAlignmentInfo, setShowAlignmentInfo] = useState(false);

  // Form states for creating Objective
  const [objTitle, setObjTitle] = useState("");
  const [objLevel, setObjLevel] = useState<"company" | "circle">("circle");
  const [objCircleId, setObjCircleId] = useState("");
  const [objParentId, setObjParentId] = useState("");
  const [objQuarter, setObjQuarter] = useState(
    systemConfig?.currentQuarter || "Q1 2026",
  );
  const [objApproverId, setObjApproverId] = useState("");

  // Form states for creating Key Result
  const [krObjectiveId, setKrObjectiveId] = useState("");
  const [krTitle, setKrTitle] = useState("");
  const [krTargetValue, setKrTargetValue] = useState("");
  const [krCurrentValue, setKrCurrentValue] = useState("0");
  const [krUnit, setKrUnit] = useState("");
  const [krWeight, setKrWeight] = useState("100");
  const [krIsShared, setKrIsShared] = useState(false);
  const [krAlignmentType, setKrAlignmentType] = useState<"standard" | "shared" | "dependency">("standard");
  const [krDependencyKrId, setKrDependencyKrId] = useState("");
  const [krType, setKrType] = useState<"committed" | "aspirational">("committed");
  const [krCalcSystem, setKrCalcSystem] = useState<"maximize" | "minimize" | "min_to_zero">("maximize");
  const [krPenaltyFactor, setKrPenaltyFactor] = useState("20");
  const [krAnswers, setKrAnswers] = useState<Record<string, boolean>>({});

  // Assignees for shared splits
  const [krAssignees, setKrAssignees] = useState<
    Array<{
      circleId: string;
      roleId: string;
      weightPercentage: number;
      currentProgress: number;
    }>
  >([{ circleId: "", roleId: "", weightPercentage: 100, currentProgress: 0 }]);

  const [krTasks, setKrTasks] = useState<{ description: string; status: "pending" | "completed" }[]>([]);
  const [newDraftTaskDesc, setNewDraftTaskDesc] = useState("");

  const [editKrTasks, setEditKrTasks] = useState<{ id: string; description: string; status: "pending" | "completed" }[]>([]);
  const [newEditDraftTaskDesc, setNewEditDraftTaskDesc] = useState("");

  // Edit Objective states
  const [showEditObjective, setShowEditObjective] = useState(false);
  const [editObjId, setEditObjId] = useState("");
  const [editObjTitle, setEditObjTitle] = useState("");
  const [editObjLevel, setEditObjLevel] = useState<"company" | "circle">(
    "circle",
  );
  const [editObjCircleId, setEditObjCircleId] = useState("");
  const [editObjParentId, setEditObjParentId] = useState("");
  const [editObjQuarter, setEditObjQuarter] = useState("");
  const [editObjApproverId, setEditObjApproverId] = useState("");

  // Edit Key Result states
  const [showEditKeyResult, setShowEditKeyResult] = useState(false);
  const [editKrId, setEditKrId] = useState("");
  const [editKrObjectiveId, setEditKrObjectiveId] = useState("");
  const [editKrTitle, setEditKrTitle] = useState("");
  const [editKrTargetValue, setEditKrTargetValue] = useState("");
  const [editKrCurrentValue, setEditKrCurrentValue] = useState("");
  const [editKrUnit, setEditKrUnit] = useState("");
  const [editKrIsShared, setEditKrIsShared] = useState(false);
  const [editKrAlignmentType, setEditKrAlignmentType] = useState<"standard" | "shared" | "dependency">("standard");
  const [editKrDependencyKrId, setEditKrDependencyKrId] = useState("");
  const [editKrType, setEditKrType] = useState<"committed" | "aspirational">("committed");
  const [editKrCalcSystem, setEditKrCalcSystem] = useState<"maximize" | "minimize" | "min_to_zero">("maximize");
  const [editKrPenaltyFactor, setEditKrPenaltyFactor] = useState("20");

  // Instant Check-in state variables
  const [showQuickCheckIn, setShowQuickCheckIn] = useState(false);
  const [activeCheckInKR, setActiveCheckInKR] = useState<KeyResult | null>(
    null,
  );
  const [quickNewValue, setQuickNewValue] = useState<string>("");
  const [quickCheckInNotes, setQuickCheckInNotes] = useState<string>("");
  const [quickAttachmentName, setQuickAttachmentName] = useState<string>("");
  const [quickHasBlocker, setQuickHasBlocker] = useState<boolean>(false);
  const [quickBlockerNotes, setQuickBlockerNotes] = useState<string>("");
  const [quickDepCircleId, setQuickDepCircleId] = useState<string>("");
  const [quickDepRoleId, setQuickDepRoleId] = useState<string>("");
  const [checkInError, setCheckInError] = useState<string>("");

  // Interactive historical timeline period selection
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Q1 2026");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Get active employee user details
  const currentEmployee =
    users.find((u) => u.id === (selectedEmpId || users[0]?.id)) || users[0];

  const currentEmployeeRolesWithCircles = useMemo(() => {
    if (!currentEmployee) return [];
    const userRoleMemberships =
      roleMembers?.filter((rm) => rm.userId === currentEmployee.id) || [];
    return userRoleMemberships
      .map((rm) => {
        const role = roles.find((r) => r.id === rm.roleId);
        if (!role) return null;
        const circle = circles.find((c) => c.id === role.circleId);
        return { role, circle };
      })
      .filter(Boolean);
  }, [currentEmployee, roleMembers, roles, circles]);

  // Helper to discover direct supervisors of evaluated employee
  const getEmployeeSupervisors = (userId: string) => {
    const userRoleIds = roleMembers
      .filter((rm) => rm.userId === userId)
      .map((rm) => rm.roleId);
    const userCircleIds = roles
      .filter((r) => userRoleIds.includes(r.id))
      .map((r) => r.circleId);

    const supervisorIds: string[] = [];
    userCircleIds.forEach((cId) => {
      const circle = circles.find((c) => c.id === cId);
      if (circle && circle.leadId && circle.leadId !== userId) {
        if (!supervisorIds.includes(circle.leadId)) {
          supervisorIds.push(circle.leadId);
        }
      }
    });

    if (supervisorIds.length === 0) {
      userCircleIds.forEach((cId) => {
        let currentCircle = circles.find((c) => c.id === cId);
        while (currentCircle && currentCircle.subCircleOfId) {
          const parentCircle = circles.find(
            (c) => c.id === currentCircle.subCircleOfId,
          );
          if (
            parentCircle &&
            parentCircle.leadId &&
            parentCircle.leadId !== userId
          ) {
            if (!supervisorIds.includes(parentCircle.leadId)) {
              supervisorIds.push(parentCircle.leadId);
            }
            break;
          }
          currentCircle = parentCircle;
        }
      });
    }

    return supervisorIds
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean) as User[];
  };

  // Helper: Find OKRs belonging specifically to a target employee based on role allocations & split weights
  const getEmployeeKeyResults = React.useCallback(
    (userId: string) => {
      if (!userId) return [];

      // Find the roles held by this employee
      const employeeRoles = roleMembers
        .filter((rm) => rm.userId === userId)
        .map((rm) => rm.roleId);
      // Find the circles these roles reside in
      const employeeCircles = roles
        .filter((r) => employeeRoles.includes(r.id))
        .map((r) => r.circleId);
      // Find the circles where the user is the leader
      const ledCircles = circles.filter((c) => c.leadId === userId).map((c) => c.id);

      return keyResults.filter((kr) => {
        const parentObj = objectives.find((obj) => obj.id === kr.objectiveId);
        if (!parentObj) return false;

        // Determine ownership types
        const assignees = keyResultAssignees.filter(
          (ksa) => ksa.keyResultId === kr.id,
        );

        const isPersonalMatch =
          assignees.length > 0
            ? assignees.some(
                (asg) => 
                  (asg.roleId && employeeRoles.includes(asg.roleId)) ||
                  (asg.circleId && ledCircles.includes(asg.circleId))
              )
            : !!(parentObj.circleId && ledCircles.includes(parentObj.circleId));

        const isDepartmentMatch =
          assignees.length > 0
            ? assignees.some(
                (asg) => asg.circleId && employeeCircles.includes(asg.circleId),
              )
            : parentObj.circleId &&
              employeeCircles.includes(parentObj.circleId);

        const isCompanyMatch = parentObj.level === "company";

        // Apply Filter
        let match = false;
        if (karyawanOkrFilter === "personal") {
          match = isPersonalMatch;
        } else if (karyawanOkrFilter === "department") {
          match = !!isDepartmentMatch;
        } else if (karyawanOkrFilter === "company") {
          match = isCompanyMatch;
        } else {
          // "all"
          match = isPersonalMatch || !!isDepartmentMatch || isCompanyMatch;
        }

        if (!match) return false;

        // Filter by period
        if (selectedPeriod !== "all") {
          if (parentObj.targetQuarter !== selectedPeriod) return false;
        }

        // Filter by update month if selected
        if (selectedMonth !== "all") {
          const hasCheckInInMonth = checkInLogs.some((log) => {
            if (log.keyResultId !== kr.id) return false;
            if (!log.timestamp) return false;
            const logDate = new Date(log.timestamp);
            if (isNaN(logDate.getTime())) return false;
            return logDate.getMonth().toString() === selectedMonth;
          });
          if (!hasCheckInInMonth) return false;
        }

        return true;
      });
    },
    [
      roleMembers,
      roles,
      keyResults,
      objectives,
      keyResultAssignees,
      karyawanOkrFilter,

      selectedPeriod,
      selectedMonth,
      checkInLogs,
    ],
  );

  const currentEmployeeKeyResults = useMemo(() => {
    return currentEmployee ? getEmployeeKeyResults(currentEmployee.id) : [];
  }, [currentEmployee, getEmployeeKeyResults]);

  // Helper: Find child Key Results for any objective
  const getObjectiveKeyResults = React.useCallback(
    (objectiveId: string) => {
      return keyResults.filter((kr) => kr.objectiveId === objectiveId);
    },
    [keyResults],
  );

  // Filters objectives list for management based on both level and selectedPeriod
  const filteredObjectives = useMemo(() => {
    return objectives.filter((obj) => {
      const matchesLevel =
        selectedLevel === "all" || obj.level === selectedLevel;
      const matchesPeriod =
        selectedPeriod === "all" || obj.targetQuarter === selectedPeriod;
      if (!matchesLevel || !matchesPeriod) return false;

      if (selectedMonth !== "all") {
        const childKRs = keyResults.filter((kr) => kr.objectiveId === obj.id);
        const hasUpdatesInMonth = childKRs.some((kr) => {
          return checkInLogs.some((log) => {
            if (log.keyResultId !== kr.id) return false;
            if (!log.timestamp) return false;
            const logDate = new Date(log.timestamp);
            if (isNaN(logDate.getTime())) return false;
            return logDate.getMonth().toString() === selectedMonth;
          });
        });
        if (!hasUpdatesInMonth) return false;
      }

      if (
        managementSearchQuery &&
        !obj.title.toLowerCase().includes(managementSearchQuery.toLowerCase())
      ) {
        return false;
      }

      if (
        managementOwnerFilter !== "all" &&
        obj.circleId !== managementOwnerFilter
      ) {
        return false;
      }

      if (managementStatusFilter !== "all") {
        const progress = getObjectiveProgress(obj.id);

        let status = "off_track";
        if (progress >= 70) status = "on_track";
        else if (progress >= 40) status = "at_risk";

        if (status !== managementStatusFilter) return false;
      }

      return true;
    });
  }, [
    objectives,
    selectedLevel,
    selectedPeriod,
    selectedMonth,
    keyResults,
    checkInLogs,
    managementSearchQuery,
    managementOwnerFilter,

    managementStatusFilter,

    systemConfig,
    getObjectiveProgress,
  ]);

  // Helper: Get assignee splits for any key result
  const getKeyResultAssigneeSplits = (krId: string) => {
    return keyResultAssignees.filter((a) => a.keyResultId === krId);
  };

  // Helper: Find parent objective title
  const getParentObjectiveTitle = (parentId: string | null) => {
    if (!parentId) return null;
    const parent = objectives.find((o) => o.id === parentId);
    return parent ? parent.title : null;
  };

  // Helper: Find Circle name
  const getCircleName = (circleId: string | null) => {
    if (!circleId) return "";
    const p = circles.find((c) => c.id === circleId);
    return p ? p.name : "";
  };

  // Helper: Find Role title
  const getRoleTitle = (roleId: string | null) => {
    if (!roleId) return "";
    const r = roles.find((item) => item.id === roleId);
    return r ? r.title : "";
  };

  // Handle Objective submission
  const handleCreateObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!objTitle.trim()) return;

    // if (isCreationLocked() && objQuarter === systemConfig?.currentQuarter) {
    //   alert(
    //     lang === "ID"
    //       ? "Pembuatan Objective ditutup untuk kuartal berjalan."
    //       : "Objective creation is locked for the current quarter.",
    //   );
    //   return;
    // }

    const newObj: Objective = {
      id: `obj_${Date.now()}`,
      title: objTitle.trim(),
      level: objLevel,
      circleId: objLevel === "company" ? null : objCircleId || null,
      parentId: objParentId || null,
      targetQuarter: objQuarter,
      approverId:
        objLevel === "company" ? undefined : objApproverId || undefined,
      status: "pending",
      currentApprovalStep: 0,
    };

    onObjectiveAdded(newObj);
    setObjTitle("");
    setObjCircleId("");
    setObjParentId("");
    setObjApproverId("");
    setShowAddObjective(false);
  };

  const handleUpdateObjectiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editObjTitle.trim() || !onObjectiveUpdated) return;

    onObjectiveUpdated(editObjId, {
      title: editObjTitle.trim(),
      level: editObjLevel,
      circleId: editObjLevel === "company" ? null : editObjCircleId || null,
      parentId: editObjParentId || null,
      targetQuarter: editObjQuarter,
      approverId:
        editObjLevel === "company" ? undefined : editObjApproverId || undefined,
    });
    setShowEditObjective(false);
  };

  const handleDeleteObjectiveClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!onObjectiveDeleted) return;
    if (
      window.confirm(
        lang === "ID"
          ? `Apakah Anda yakin ingin menghapus ${methodTerms.objectiveLabel} ini beserta seluruh ${methodTerms.keyResultLabel} di dalamnya?`
          : `Are you sure you want to delete this ${methodTerms.objectiveLabel} and all its ${methodTerms.keyResultLabel}?`
      )
    ) {
      onObjectiveDeleted(id);
    }
  };

  const handleUpdateKeyResultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editKrTitle.trim() || !onKeyResultUpdated) return;

    onKeyResultUpdated(editKrId, {
      title: editKrTitle.trim(),
      targetValue: Number(editKrTargetValue),
      currentValue: Number(editKrCurrentValue),
      unit: editKrUnit,
      isShared: editKrAlignmentType === "shared",
      alignmentType: editKrAlignmentType,
      dependencyKrId: editKrAlignmentType === "dependency" ? editKrDependencyKrId : undefined,
      okrType: editKrType,
      calcSystem: editKrCalcSystem,
      penaltyFactor: Number(editKrPenaltyFactor) || 0,
      tasks: editKrTasks
    });
    setShowEditKeyResult(false);
  };

  const handleDeleteKeyResultClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!onKeyResultDeleted) return;
    if (
      window.confirm(
        lang === "ID"
          ? `Apakah Anda yakin ingin menghapus ${methodTerms.keyResultLabel} ini?`
          : `Are you sure you want to delete this ${methodTerms.keyResultLabel}?`
      )
    ) {
      onKeyResultDeleted(id);
    }
  };

  // Add assignee row in form
  const addAssigneeRow = () => {
    const currentCount = krAssignees.length + 1;
    const splitWeight = Math.floor(100 / currentCount);
    const splitRows = [
      ...krAssignees,
      {
        circleId: "",
        roleId: "",
        weightPercentage: splitWeight,
        currentProgress: 0,
      },
    ];

    let totalAdjust = 0;
    splitRows.forEach((row, idx) => {
      if (idx === splitRows.length - 1) {
        row.weightPercentage = 100 - totalAdjust;
      } else {
        row.weightPercentage = splitWeight;
        totalAdjust += splitWeight;
      }
    });

    setKrAssignees(splitRows);
  };

  const removeAssigneeRow = (index: number) => {
    const updated = krAssignees.filter((_, idx) => idx !== index);
    if (updated.length > 0) {
      const splitWeight = Math.floor(100 / updated.length);
      let totalAdjust = 0;
      updated.forEach((row, idx) => {
        if (idx === updated.length - 1) {
          row.weightPercentage = 100 - totalAdjust;
        } else {
          row.weightPercentage = splitWeight;
          totalAdjust += splitWeight;
        }
      });
    }
    setKrAssignees(updated);
  };

  // Handle Key Result submission
  const handleCreateKeyResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!krObjectiveId || !krTitle.trim()) return;

    const targetVal = Number(krTargetValue);
    const currentVal = Number(krCurrentValue);

    if (
      isNaN(targetVal) ||
      isNaN(currentVal)
    ) {
      alert("Masukkan angka yang valid!");
      return;
    }

    const targetObj = objectives.find((o) => o.id === krObjectiveId);
    if (
      targetObj &&
      isCreationLocked() &&
      targetObj.targetQuarter === systemConfig?.currentQuarter
    ) {
      alert(
        lang === "ID"
          ? "Pembuatan Key Result ditutup untuk kuartal berjalan."
          : "Key Result creation is locked for the current quarter.",
      );
      return;
    }

    const primCircleId = currentEmployeeRolesWithCircles[0]?.circle?.id || targetObj?.circleId || null;
    const primRoleId = currentEmployeeRolesWithCircles[0]?.role?.id || roles.find(r => r.circleId === primCircleId)?.id || null;

    const krPayload = {
      objectiveId: krObjectiveId,
      title: krTitle.trim(),
      targetValue: targetVal,
      currentValue: currentVal,
      unit: krUnit,
      weight: Number(krWeight),
      isShared: krAlignmentType === "shared",
      alignmentType: krAlignmentType,
      dependencyKrId: krAlignmentType === "dependency" ? krDependencyKrId : undefined,
      okrType: krType,
      calcSystem: krCalcSystem,
      penaltyFactor: Number(krPenaltyFactor) || 0,
      status: "pending",
      currentApprovalStep: 0,
      assignees: krAlignmentType === "shared"
        ? krAssignees.map((a) => ({
            circleId: a.circleId || null,
            roleId: a.roleId || null,
            weightPercentage: Number(a.weightPercentage) || 0,
            currentProgress: Number(a.currentProgress) || 0,
          }))
        : primCircleId || primRoleId
          ? [
              {
                circleId: primCircleId,
                roleId: primRoleId,
                weightPercentage: 100,
                currentProgress: Math.min(100, Math.max(0, Math.round((currentVal / targetVal) * 100))) || 0,
              },
            ]
          : [],
      tasks: krTasks.map((t, index) => ({
        id: `task_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 4)}`,
        description: t.description,
        status: t.status
      })),
    };

    onKeyResultAdded(krPayload);
    setKrTitle("");
    setKrObjectiveId("");
    setKrTargetValue("");
    setKrCurrentValue("0");
    setKrUnit("%");
    setKrIsShared(false);
    setKrAlignmentType("standard");
    setKrDependencyKrId("");
    setKrType("committed");
    setKrAssignees([
      { circleId: "", roleId: "", weightPercentage: 100, currentProgress: 0 },
    ]);
    setKrTasks([]);
    setNewDraftTaskDesc("");
    setShowAddKeyResult(false);
  };

  // Initiate Quick Check-In Modal
  const startQuickCheckIn = (kr: KeyResult) => {
    setActiveCheckInKR(kr);
    setQuickNewValue(kr.currentValue.toString());
    setQuickCheckInNotes("");
    setQuickHasBlocker(false);
    setQuickBlockerNotes("");
    setQuickDepCircleId("");
    setQuickDepRoleId("");
    setCheckInError("");
    setShowQuickCheckIn(true);
  };

  // Submit Quick Check-In
  const handleQuickCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCheckInKR) return;

    if (quickNewValue.trim() === "" || isNaN(Number(quickNewValue))) {
      setCheckInError("Masukkan angka realisasi aktual yang valid!");
      return;
    }
    const valNum = Number(quickNewValue);

    // Call onCheckInSubmitted if provided, which calculates correct scores on express db
    if (onCheckInSubmitted) {
      // Find representative role for current staff to tag accountability
      const employeeRoles = roleMembers.filter(
        (rm) => rm.userId === currentEmployee.id,
      );
      const activeRoleId = employeeRoles[0]?.roleId || null;

      onCheckInSubmitted({
        keyResultId: activeCheckInKR.id,
        assigneeId: currentEmployee.id,
        roleId: activeRoleId,
        newValue: valNum,
        notes:
          quickCheckInNotes || `Check-in aktual oleh ${currentEmployee.name}`,
        hasBlocker: quickHasBlocker,
        blockerNotes: quickHasBlocker ? quickBlockerNotes : null,
        dependencyCircleId: quickHasBlocker ? quickDepCircleId || null : null,
        dependencyRoleId: quickHasBlocker ? quickDepRoleId || null : null,
        attachmentName: quickAttachmentName || undefined,
      });
    } else if (onKeyResultUpdated) {
      // Client-only edit fallback
      onKeyResultUpdated(activeCheckInKR.id, {
        currentValue: valNum,
      });
    }

    setShowQuickCheckIn(false);
    setActiveCheckInKR(null);
    setQuickAttachmentName("");
  };

  // Calculate OKR summary metrics for corporate management dashboard
  const totalObjectivesCount = objectives.length;
  const companyLevelCount = objectives.filter(
    (o) => o.level === "company",
  ).length;
  const leadLevelCount = objectives.filter((o) => o.level === "circle").length;
  
  const okrOverallSummary = React.useMemo(() => {
    return calculateOkrOverallSummary(keyResults);
  }, [keyResults]);

  const averageProgress =
    keyResults.length > 0
      ? Math.round(
          keyResults.reduce((acc, kr) => acc + kr.progress, 0) /
            keyResults.length,
        )
      : 0;

  return (
    <div className="space-y-6" id="okr-dashboard-outer">
      {/* 🔮 HUB METHODOLOGY SELECTOR WIZARD */}
      <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xxs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono font-black text-emerald-800 uppercase tracking-widest bg-emerald-100/50 border border-emerald-200/50 px-2.5 py-1 rounded-full w-fit">
              <Sparkles className="size-3.5" />
              <span>{lang === "ID" ? "Sistem Tatakelola Kinerja Utama" : "Performance Methodology Configuration"}</span>
            </div>
            <h2 className="title-font font-black text-xl text-slate-800 mt-1.5 tracking-tight">
              {lang === "ID" ? "Pilih Metode Pengukuran di Awal" : "Select Measurement Methodology"}
            </h2>
            <p className="text-slate-500 text-xs font-medium max-w-xl">
              {lang === "ID"
                ? "Tentukan metode penilaian kinerja sebelum memulai pemrosesan target. Label, bobot, dan logika dashboard di bawah akan otomatis menyesuaikan."
                : "Choose the performance appraisal method before beginning target processing. Dashboard labels, weights, and logic below adapt instantly."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="bg-slate-200/80 p-1 rounded-2xl border border-slate-300/60 flex flex-wrap gap-1 w-fit shadow-inner">
              <button
                onClick={() => handleMethodSwitch("okr")}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeMethod === "okr"
                    ? "bg-emerald-800 text-white shadow-sm border border-emerald-950 scale-[1.02]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Target className="size-3.5" />
                OKR
              </button>
              <button
                onClick={() => handleMethodSwitch("kpi")}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeMethod === "kpi"
                    ? "bg-indigo-805 bg-indigo-800 text-white shadow-sm border border-indigo-950 scale-[1.02]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Percent className="size-3.5" />
                KPI Terbobot
              </button>
              <button
                onClick={() => handleMethodSwitch("bsc360")}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeMethod === "bsc360"
                    ? "bg-purple-800 text-white shadow-sm border border-purple-950 scale-[1.02]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="size-3.5" />
                Balanced Scorecard
              </button>
            </div>
            <MetricsGlossary lang={lang} />
          </div>
        </div>

        {/* Informative Guidance on Active Method Treatment & Process */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => handleMethodSwitch("okr")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activeMethod === "okr"
                ? "bg-white border-emerald-500 ring-4 ring-emerald-500/10 shadow-sm"
                : "bg-white/40 hover:bg-white border-slate-200/80 opacity-70"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${activeMethod === "okr" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                  <Target className="size-4" />
                </span>
                <strong className="text-xs font-extrabold text-slate-800 uppercase">
                  Metode OKR
                </strong>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                {lang === "ID"
                  ? "Menggunakan formulasi sederhana (Rata-rata kumulatif % Key Results). Menyelaraskan ambisi (Objectives) dengan Key Results secara transparan dan dinamis."
                  : "Uses a simple cumulative formula (% of key results). Vertically aligns company aspirations (Objectives) and measurable targets."}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${activeMethod === "okr" ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-500"}`}>
                {activeMethod === "okr" ? "● Aktif & Digunakan" : "Klik untuk Pilih"}
              </span>
              <ChevronRight className="size-3 text-slate-400" />
            </div>
          </div>

          <div
            onClick={() => handleMethodSwitch("kpi")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activeMethod === "kpi"
                ? "bg-white border-indigo-500 ring-4 ring-indigo-500/10 shadow-sm"
                : "bg-white/40 hover:bg-white border-slate-200/80 opacity-70"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${activeMethod === "kpi" ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-500"}`}>
                  <Percent className="size-4" />
                </span>
                <strong className="text-xs font-extrabold text-slate-800 uppercase">
                  Metode KPI Terbobot
                </strong>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                {lang === "ID"
                  ? "Setiap indikator memiliki Bobot (%) kontribusi tersendiri. Logika pencapaian dihitung menggunakan weighted average untuk kalkulasi target vs realisasi presisi."
                  : "Each indicator has its own custom Weight (%) contribution. Achievement is calculated using weighted averages for precise target vs realization."}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${activeMethod === "kpi" ? "bg-indigo-100 text-indigo-900" : "bg-slate-100 text-slate-500"}`}>
                {activeMethod === "kpi" ? "● Aktif & Digunakan" : "Klik untuk Pilih"}
              </span>
              <ChevronRight className="size-3 text-slate-400" />
            </div>
          </div>

          <div
            onClick={() => handleMethodSwitch("bsc360")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activeMethod === "bsc360"
                ? "bg-white border-purple-500 ring-4 ring-purple-500/10 shadow-sm"
                : "bg-white/40 hover:bg-white border-slate-200/80 opacity-70"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${activeMethod === "bsc360" ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-500"}`}>
                  <Layers className="size-4" />
                </span>
                <strong className="text-xs font-extrabold text-slate-800 uppercase">
                  Balanced Scorecard (BSC)
                </strong>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                {lang === "ID"
                  ? "Membagi sasaran strategis secara berimbang ke dalam 4 perspektif utama perusahaan (Financial, Customer, Internal Business, Growth & Learning)."
                  : "Divides strategic goals in a balanced manner across 4 key perspectives (Financial, Customer, Internal Business, Growth & Learning)."}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${activeMethod === "bsc360" ? "bg-purple-100 text-purple-900" : "bg-slate-100 text-slate-500"}`}>
                {activeMethod === "bsc360" ? "● Aktif & Digunakan" : "Klik untuk Pilih"}
              </span>
              <ChevronRight className="size-3 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 📘 MATEMATIKA & RUMUS DETAIL METODOLOGI (FOR EVERYONE UNDERSTANDING) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xxs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Info className="size-5 text-indigo-600 shrink-0" />
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
              {lang === "ID" ? "🧮 Rumus & Panduan Matematika Penilaian Kinerja" : "🧮 Performance Metrics & Formulas Guide"}
            </h3>
            <p className="text-[10px] text-slate-400">
              {lang === "ID" ? "Panduan transparan agar seluruh karyawan paham asal-usul nilai tanpa latar belakang HRD" : "Transparent guide to help all employees trace performance origins without HR background"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* OKR Formula Card */}
          <div className={`p-4 rounded-xl border space-y-2.5 transition-all ${activeMethod === "okr" ? "bg-emerald-50/50 border-emerald-250 ring-2 ring-emerald-50" : "bg-slate-50/40 border-slate-150"}`}>
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
              <Target className="size-4 text-emerald-600" />
              <span>1. Formula OKR (Objectives & Key Results)</span>
            </div>
            <p className="text-[10.5px] text-slate-500 leading-relaxed">
              {lang === "ID"
                ? "Sistem ini menghitung pencapaian target berdasarkan rata-rata kumulatif progres dari seluruh Key Results (Tujuan Terukur)."
                : "Under this methodology, the objective progress is calculated as the simple arithmetic mean of all associated key results."}
            </p>
            <div className="bg-white p-2.5 rounded-lg border border-slate-150 font-mono text-[9px] text-slate-650 space-y-1">
              <span className="font-extrabold text-slate-700">Progres Objective =</span>
              <span className="block text-emerald-700">∑(Progres KR) ÷ Jumlah KR</span>
              <span className="block text-slate-400 mt-1 italic border-t border-slate-100 pt-1">
                {lang === "ID" ? "Contoh: 3 KR dengan progres 100%, 50%, dan 0%. Rata-rata = (100+50+0)/3 = 50%." : "Example: 3 KRs at 100%, 50%, 0%. Average = (100+50+0)/3 = 50%."}
              </span>
            </div>
          </div>

          {/* KPI Formula Card */}
          <div className={`p-4 rounded-xl border space-y-2.5 transition-all ${activeMethod === "kpi" ? "bg-indigo-50/50 border-indigo-250 ring-2 ring-indigo-50" : "bg-slate-50/40 border-slate-150"}`}>
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
              <Percent className="size-4 text-indigo-600" />
              <span>2. Formula KPI Terbobot (Weighted KPI)</span>
            </div>
            <p className="text-[10.5px] text-slate-500 leading-relaxed">
              {lang === "ID"
                ? "Setiap indikator KPI memiliki bobot kontribusi (%) tersendiri terhadap nilai keseluruhan. Nilai dihitung proporsional sesuai bobot."
                : "Each KPI indicator contributes a custom percentage weight (%) to the total score. The final result is the weighted average."}
            </p>
            <div className="bg-white p-2.5 rounded-lg border border-slate-150 font-mono text-[9px] text-slate-650 space-y-1">
              <span className="font-extrabold text-slate-700">Skor KPI Terbobot =</span>
              <span className="block text-indigo-700">∑(Aktual/Target × Bobot %)</span>
              <span className="block text-slate-400 mt-1 italic border-t border-slate-100 pt-1">
                {lang === "ID" ? "Contoh: KPI A (Bobot 60%, capai 100%), KPI B (Bobot 40%, capai 50%). Total = (100%*0.6) + (50%*0.4) = 80%." : "Example: KPI A (Weight 60%, achieved 100%), KPI B (Weight 40%, achieved 50%). Total = (100%*0.6) + (50%*0.4) = 80%."}
              </span>
            </div>
          </div>

          {/* BSC Formula Card */}
          <div className={`p-4 rounded-xl border space-y-2.5 transition-all ${activeMethod === "bsc360" ? "bg-purple-50/50 border-purple-250 ring-2 ring-purple-50" : "bg-slate-50/40 border-slate-150"}`}>
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
              <Layers className="size-4 text-purple-650" />
              <span>3. Balanced Scorecard (4 Perspektif)</span>
            </div>
            <p className="text-[10.5px] text-slate-500 leading-relaxed">
              {lang === "ID"
                ? "Menjamin sasaran bisnis seimbang dengan membagi sasaran ke dalam Perspektif Keuangan, Pelanggan, Bisnis Internal, dan Pertumbuhan."
                : "Ensures balanced business execution by splitting strategic goals across Financial, Customer, Internal Process, and Growth perspectives."}
            </p>
            <div className="bg-white p-2.5 rounded-lg border border-slate-150 font-mono text-[9px] text-slate-650 space-y-1">
              <span className="font-extrabold text-slate-700">Skor Perspektif =</span>
              <span className="block text-purple-700">∑(Progres Sasaran dalam Perspektif) ÷ Total Perspektif</span>
              <span className="block text-slate-400 mt-1 italic border-t border-slate-100 pt-1">
                {lang === "ID" ? "Membantu melacak kesehatan bisnis secara menyeluruh dari aspek komersil & pembelajaran." : "Helps assess multi-dimensional health including commercial execution and talent growth."}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 POJOK KONSULTASI TRAINING OKR JOHN DOERR (HUMBLE EXTRANEOUS DESIGN) */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-950 text-white rounded-2xl p-6 border border-emerald-800 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-2 translate-y-6 select-none pointer-events-none">
          <Target className="size-56" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-yellow-400/20 text-yellow-300 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full border border-yellow-405/30 uppercase tracking-widest">
              <Award className="size-3.5" />{" "}
              {lang === "ID" ? "Klinik Edukasi {methodTermLabel}" : "{methodTermLabel} Trainer Clinic"}
            </div>
            <h2 className="title-font font-extrabold text-xl md:text-2xl tracking-tight">
              {lang === "ID"
                ? "Klinik Edukasi & Panduan Praktis {methodTermLabel}"
                : "{methodTermLabel} Education Clinic & Practical Guide"}
            </h2>
            <p className="text-teal-150 text-xs md:text-sm leading-relaxed font-medium">
              {lang === "ID"
                ? "Mari buat sistem {methodTermLabel} yang sederhana, transparan, dan terfokus untuk membantu tim koordinasi mencapai target dengan lebih selaras, efektif, dan menyenangkan tanpa kebingungan!"
                : "Let us build a simple, transparent, and focused {methodTermLabel} system to help coordination teams target milestones elegantly and effectively without feeling overwhelmed!"}
            </p>
          </div>
          <div className="flex gap-2 bg-black/20 p-2 rounded-xl border border-white/10 shrink-0 self-start md:self-center">
            <HelpCircle className="size-9 text-yellow-300 shrink-0" />
            <div className="text-[11px]">
              <div className="font-bold text-white uppercase">
                {lang === "ID" ? "💡 Tips Formula {methodTermLabel}:" : "💡 Formula Tips:"}
              </div>
              <div className="text-slate-300 italic">
                {lang === "ID" 
                  ? `"Saya akan mencapai [${methodTerms.objectiveLabel}] yang diukur dengan [${methodTerms.keyResultLabel}]."`
                  : `"I will achieve [${methodTerms.objectiveLabel}] as measured by [${methodTerms.keyResultLabel}]."`}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Trainer Bullets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-teal-800 text-[11px] text-teal-100">
          <div className="flex items-start gap-2 bg-white/5 p-2 rounded-lg">
            <span className="font-mono bg-yellow-400 text-teal-950 font-black rounded-full size-4 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              O
            </span>
            <div>
              <span className="font-bold text-yellow-300">
                {lang === "ID"
                  ? `${methodTerms.objectiveLabel} (Apa yang dicapai):`
                  : `${methodTerms.objectiveLabel} (What we achieve):`}
              </span>
              <p className="opacity-90">
                {lang === "ID"
                  ? "Tujuan kualitatif yang menginspirasi, konkrit, dan berorientasi pada tindakan nyata."
                  : "Inspirational, concrete, and action-oriented qualitative direction."}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-white/5 p-2 rounded-lg">
            <span className="font-mono bg-yellow-400 text-teal-950 font-black rounded-full size-4 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              KR
            </span>
            <div>
              <span className="font-bold text-yellow-300">
                {lang === "ID"
                  ? `${methodTerms.keyResultLabel} (Bagaimana melacaknya):`
                  : `${methodTerms.keyResultLabel} (How we measure it):`}
              </span>
              <p className="opacity-90">
                {lang === "ID"
                  ? "Indikator kuantitatif terukur dengan target angka konkrit & target kuartal sekarang."
                  : "Measurable numeric target and current progress verification milestones."}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-white/5 p-2 rounded-lg">
            <span className="font-mono bg-yellow-400 text-teal-950 font-black rounded-full size-4 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              👥
            </span>
            <div>
              <span className="font-bold text-yellow-300">
                {lang === "ID" ? "Peran Transparan:" : "Transparent Role:"}
              </span>
              <p className="opacity-90">
                {lang === "ID"
                  ? "Setiap karyawan bertanggung jawab mengupdate realisasi/aktual sekarang secara disiplin."
                  : "Each employee is accountable for updating progress values regularly in a disciplined way."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Period Expiry Lock Banner */}
      {hasEnded && (
        <div
          className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-amber-800 space-y-1 animate-pulse"
          id="okr-lockout-banner"
        >
          <div className="flex items-center gap-1.5 font-bold text-amber-900 text-sm">
            <AlertTriangle className="size-5 text-amber-600 shrink-0" />
            <span>
              {lang === "ID"
                ? "KUARTAL TELAH JATUH TEMPO"
                : "QUARTER DEADLINE PASSED"}
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed text-xs">
            {lang === "ID"
              ? `Masa kuartal berjalan telah melewati batas akhir tanggal jatuh tempo (${systemConfig?.endDate || "jatuh tempo"}). Harap segera selesaikan seluruh sisa pencapaian, pengeditan progress ${methodTerms.keyResultLabel}, atau persetujuan yang tertunda.`
              : `The active schedule period has exceeded its configure deadline (${systemConfig?.endDate || "deadline"}). Please finalize any remaining ${methodTerms.objectiveLabel} records, progress updates, or pending approvals immediately.`}
          </p>
        </div>
      )}

      {/* Dynamic Reminder Alert Banner */}
      {!hasEnded &&
        systemConfig?.remindersEnabled &&
        actualDaysRemaining !== null &&
        actualDaysRemaining <= systemConfig.daysRemaining &&
        actualDaysRemaining >= 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-xs text-amber-805 space-y-1 animate-pulse">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 text-sm">
              <AlertTriangle className="size-5 text-amber-600 shrink-0" />
              <span>
                {lang === "ID"
                  ? "Peringatan: Akhir Kuartal Dekat!"
                  : "Alert: Quarter End Approaching!"}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed text-xs">
              {lang === "ID"
                ? `Kuartal ${systemConfig.currentQuarter} akan ditutup dalam ${actualDaysRemaining} hari! Item {methodTermLabel} yang belum mencapai ambang pencapaian (target Komitmen: ${systemConfig.committedThreshold}% / Aspirasional: ${systemConfig.aspirationalThreshold}%) membutuhkan perhatian khusus dari tim.`
                : `Quarter ${systemConfig.currentQuarter} will close in ${actualDaysRemaining} days! {methodTermLabel} items not meeting the threshold (Committed: ${systemConfig.committedThreshold}% / Aspirational: ${systemConfig.aspirationalThreshold}%) need immediate attention.`}
            </p>
          </div>
        )}



      {/* 📑 DYNAMIC TAB SWITCHER (ROLE SELECTION RULES) */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap md:flex-nowrap border border-slate-200 flex-1 w-full gap-1.5">
          <button
            onClick={() => setOkrViewMode("karyawan")}
            className={`flex-1 min-w-[150px] py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
              okrViewMode === "karyawan"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div className="bg-emerald-100 text-emerald-850 p-1 rounded-lg">
              <Users className="size-3.5" />
            </div>
            <div className="text-left">
              <div className="block font-extrabold leading-none">
                🧑‍💻 Peran Karyawan
              </div>
              <span className="text-[9px] font-medium text-slate-400">
                Tabel {methodTermLabel} Pribadi & Update Realisasi Aktual
              </span>
            </div>
          </button>

          {currentRolePerm?.id !== "karyawan" && (
            <button
              onClick={() => setOkrViewMode("manajemen")}
              className={`flex-1 min-w-[150px] py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                okrViewMode === "manajemen"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className="bg-blue-100 text-blue-850 p-1 rounded-lg">
                <Layout className="size-3.5" />
              </div>
              <div className="text-left">
                <div className="block font-extrabold leading-none">
                  🏢 Peran Direksi & Manajemen
                </div>
                <span className="text-[9px] font-medium text-slate-400">
                  Dashboard Penyelarasan Transparan Korporat & Pimpinan
                </span>
              </div>
            </button>
          )}

          {currentRolePerm?.id !== "karyawan" && (
            <button
              onClick={() => setOkrViewMode("approval")}
              className={`flex-1 min-w-[150px] py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                okrViewMode === "approval"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className="bg-purple-100 text-purple-850 p-1 rounded-lg">
                <ClipboardCheck className="size-3.5 text-purple-700" />
              </div>
              <div className="text-left">
                <div className="block font-extrabold leading-none">
                  ✅ Riwayat Approval
                </div>
                <span className="text-[9px] font-medium text-slate-400">
                  Kelola & Setujui Pembaruan Key Result Anggota Tim
                </span>
              </div>
            </button>
          )}

          <button
            onClick={() => setOkrViewMode("alignment_map")}
            className={`flex-1 min-w-[150px] py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              okrViewMode === "alignment_map"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Crosshair className="size-4" />
            <span>Peta Keselarasan</span>
          </button>

          <button
            onClick={() => setOkrViewMode("tracking_progress")}
            className={`flex-1 min-w-[150px] py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              okrViewMode === "tracking_progress"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <TrendingUp className="size-4" />
            <span>{lang === "ID" ? "Pemantauan Progress" : "Progress Monitoring"}</span>
          </button>

          <button
            onClick={() => setOkrViewMode("bantuan")}
            className={`w-32 py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              okrViewMode === "bantuan"
                ? "bg-emerald-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <HelpCircle className="size-4 text-emerald-500" />
            <span>Edu {methodTermLabel}</span>
          </button>
        </div>
      </div>

      {(okrViewMode === "manajemen" || okrViewMode === "approval") && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-700">Filter Tampilan Data {methodTermLabel} & Riwayat:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-slate-450 uppercase">Kuartal:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-xs font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Kuartal</option>
                {Array.from(new Set(objectives.map((o) => o.targetQuarter))).filter(Boolean).map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-slate-450 uppercase">Bulan Update:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-xs font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Bulan</option>
                <option value="0">Januari</option>
                <option value="1">Februari</option>
                <option value="2">Maret</option>
                <option value="3">April</option>
                <option value="4">Mei</option>
                <option value="5">Juni</option>
                <option value="6">Juli</option>
                <option value="7">Agustus</option>
                <option value="8">September</option>
                <option value="9">Oktober</option>
                <option value="10">November</option>
                <option value="11">Desember</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/**********************************************************
       * VIEW 1: KARYAWAN VIEW - TABEL SUBMIT OKR JHO DOER STYLE
       **********************************************************/}
      {okrViewMode === "karyawan" && (
        <div className="space-y-6">
          {/* USER PICKER SECTION */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <UserCheck className="size-3 text-emerald-600" />
                <span>Pilih Profil Karyawan Pengampu {methodTermLabel}</span>
              </label>
              <h3 className="title-font font-extrabold text-sm text-slate-850">
                Melihat performa dan melakukan komitmen update aktual target:
              </h3>
            </div>

            <div className="w-full md:w-80 flex items-center gap-2 z-40 relative">
              <SearchableSelect
                value={selectedEmpId}
                onChange={(val) => setSelectedEmpId(val)}
                options={allowedUsers.map((u) => ({
                  id: u.id,
                  label: u.name,
                  description: u.department,
                }))}
                placeholder="Pilih Karyawan..."
                searchPlaceholder="Cari Karyawan..."
              />
            </div>
          </div>

          {/* ACTIVE EMPLOYEE CARD HIGHLIGHT */}
          {currentEmployee && (
            <div className="bg-white rounded-3xl border border-slate-150 shadow-xs overflow-hidden">
              <div className="bg-slate-50/70 p-5 border-b border-slate-150 flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={
                    currentEmployee.avatar ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                  }
                  alt={currentEmployee.name}
                  referrerPolicy="no-referrer"
                  className="size-14 rounded-full border-2 border-emerald-100 object-cover shrink-0 shadow-xs"
                />
                <div className="text-center sm:text-left space-y-2 flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="title-font font-black text-lg text-slate-900">
                      {currentEmployee.name}
                    </h2>
                    <span className={`text-[10px] font-mono font-extrabold uppercase bg-${methodTerms.colorClass}-100 text-${methodTerms.colorClass}-900 px-2 py-0.5 rounded-md border border-${methodTerms.colorClass}-200`}>
                      Aktif Mengampu {activeMethod.toUpperCase()}
                    </span>
                  </div>

                  {/* User Multi-role & Multi-circle badges */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded text-[10px] font-semibold text-slate-600">
                      <UserCheck className="size-3 text-slate-400" />
                      Basis Jabatan: {currentEmployee.department}
                    </div>

                    {currentEmployeeRolesWithCircles.map((rc, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-1 border px-2 py-1 rounded text-[10px] font-semibold ${
                          rc?.circle?.circleType === "cross_functional"
                            ? "bg-indigo-50 border-indigo-200 text-indigo-750"
                            : "bg-teal-50 border-teal-200 text-teal-750"
                        }`}
                      >
                        <Layers className="size-3 opacity-60" />
                        <span>
                          {rc?.role.title}{" "}
                          <span className="opacity-60 font-mono text-[9px] uppercase px-1">
                            di
                          </span>{" "}
                          {rc?.circle?.circleType === "cross_functional"
                            ? "🔄"
                            : "🏢"}{" "}
                          {rc?.circle?.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`bg-${methodTerms.colorClass}-50 px-4 py-3 rounded-2xl border border-${methodTerms.colorClass}-100 text-center shrink-0`}>
                  <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">
                    Siklus Kuartal
                  </span>
                  <strong className={`text-${methodTerms.colorClass}-900 text-xs font-bold font-mono`}>
                    {systemConfig?.currentQuarter || "Q1 2026"}
                  </strong>
                </div>
              </div>

              {/* PREMIUM OKR PERFORMANCE EVALUATION ENGINE HEADER CARD FOR EMPLOYEE */}
              {activeMethod === "okr" && (
                <div className="mx-5 mt-5 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-3xl border border-slate-850 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 bg-emerald-950/85 text-emerald-300 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-emerald-900/60">
                        <Award className="size-3.5 text-emerald-400" />
                        <span>🛡️ Clean Architecture Evaluation Engine</span>
                      </div>
                      <h3 className="text-base font-black tracking-tight leading-snug">
                        Ringkasan Kinerja & Evaluasi {methodTermLabel} {currentEmployee.name}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-xl">
                        Diadopsi secara ketat dari standar buku John Doerr. Klasifikasi dihitung secara real-time berdasarkan proporsi Key Results yang mencapai predikat <strong className="text-emerald-300 font-extrabold">High Performance</strong>.
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-450 block">
                        Status Kinerja Akumulatif
                      </span>
                      {(() => {
                        const summary = calculateOkrOverallSummary(currentEmployeeKeyResults);
                        const cls = summary.finalClassification;
                        let badgeStyle = "bg-rose-950/80 text-rose-300 border-rose-900";
                        if (cls === "High Performance") {
                          badgeStyle = "bg-emerald-950/80 text-emerald-300 border-emerald-900";
                        } else if (cls === "Performance / Target") {
                          badgeStyle = "bg-blue-950/80 text-blue-300 border-blue-900";
                        }
                        return (
                          <span className={`px-3 py-1 rounded-full border text-[11px] font-black uppercase mt-1 inline-block ${badgeStyle}`}>
                            ● {cls === "Performance / Target" ? (lang === "ID" ? "Kinerja Sesuai Target (Performance)" : "Performance") : cls}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* STATS GRID */}
                  {(() => {
                    const overallSummary = calculateOkrOverallSummary(currentEmployeeKeyResults);
                    const commKRs = currentEmployeeKeyResults.filter(kr => kr.okrType === "committed");
                    const aspKRs = currentEmployeeKeyResults.filter(kr => kr.okrType === "aspirational");
                    const commSummary = calculateOkrOverallSummary(commKRs);
                    const aspSummary = calculateOkrOverallSummary(aspKRs);

                    const renderStatCard = (title: string, summary: ReturnType<typeof calculateOkrOverallSummary>, type: string) => (
                      <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/80 mb-4 last:mb-0">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4 border-b border-slate-800/80 pb-2 flex justify-between items-center">
                          <span>{title}</span>
                          {type === "overall" && <span className="bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded text-[9px]">Summary</span>}
                          {type === "comm" && <span className="bg-sky-900/50 text-sky-400 px-2 py-0.5 rounded text-[9px]">Target ≥ 1.00</span>}
                          {type === "asp" && <span className="bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded text-[9px]">Target ≥ 0.70</span>}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <span className="text-[9px] uppercase font-mono font-bold text-slate-450 block">
                              Average {methodTermLabel} Score
                            </span>
                            <strong className="text-2xl font-black text-emerald-400 font-mono block">
                              {summary.averageScore.toFixed(2)}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-mono font-bold text-slate-450 block">
                              High Performance KR
                            </span>
                            <strong className="text-2xl font-black text-slate-200 font-mono block">
                              {summary.highPerformanceCount}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-mono font-bold text-slate-450 block">
                              Total KR
                            </span>
                            <strong className="text-2xl font-black text-slate-200 font-mono block">
                              {summary.totalKRs}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-mono font-bold text-slate-450 block">
                              Success Ratio
                            </span>
                            <strong className="text-2xl font-black text-slate-200 font-mono block">
                              {(summary.successRatio * 100).toFixed(0)}%
                            </strong>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-800/80">
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            <span className="font-bold text-slate-300">Rumus Average Score:</span> (Σ Score KR) / Total KR
                            <span className="mx-2 text-slate-600">|</span>
                            <span className="font-bold text-slate-300">Rumus Success Ratio:</span> High Performance KR / Total KR
                            <br />
                            <span className="text-slate-500 italic mt-0.5 inline-block">Sistem menghitung rasio secara proporsional dari jumlah Key Result (KR) aktif.</span>
                          </p>
                        </div>
                      </div>
                    );

                    return (
                      <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                        {renderStatCard("Overall Dashboard", overallSummary, "overall")}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {renderStatCard("Commitment", commSummary, "comm")}
                           {renderStatCard("Aspirational", aspSummary, "asp")}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TABEL OKR KARYAWAN (AS REQUESTED) */}
              <div className="p-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="size-4.5 text-slate-500" />
                    <span className="text-xs uppercase tracking-wider font-mono font-extrabold text-slate-500">
                      Daftar Target & Tracking Anda
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center justify-end">
                    <button
                      disabled={isLocked}
                      onClick={() => {
                        const primCircle = currentEmployeeRolesWithCircles[0]?.circle?.id || "";
                        setObjCircleId(primCircle);
                        setObjLevel("circle");
                        setObjQuarter(systemConfig?.currentQuarter || "Q1 2026");
                        setShowAddObjective(true);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                        isLocked
                          ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                          : `bg-${methodTerms.colorClass}-50 hover:bg-${methodTerms.colorClass}-100 text-${methodTerms.colorClass}-850 border border-${methodTerms.colorClass}-100`
                      }`}
                    >
                      <Plus className="size-3" /> {methodTerms.addObjectiveBtn}
                    </button>
                    <button
                      disabled={isLocked}
                      onClick={() => {
                        setKrObjectiveId("");
                        setKrIsShared(false);
                        setKrTargetValue("1.00");
                        setKrCurrentValue("0.00");
                        setShowAddKeyResult(true);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                        isLocked
                          ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                          : `bg-${methodTerms.colorClass}-900 hover:bg-${methodTerms.colorClass}-950 text-white shadow-xs border border-${methodTerms.colorClass}-950`
                      }`}
                    >
                      <Plus className="size-3" /> {methodTerms.addKeyResultBtn}
                    </button>
                    <button
                      onClick={() => setShowAlignmentInfo(true)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200"
                    >
                      <TrendingUp className="size-3 text-blue-600" />
                      {lang === "ID"
                        ? "💡 Panduan Alignment"
                        : "💡 Alignment Guide"}
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    {(
                      ["all", "personal", "department", "company"] as const
                    ).map((filterType) => (
                      <button
                        key={filterType}
                        onClick={() => setKaryawanOkrFilter(filterType)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                          karyawanOkrFilter === filterType
                            ? "bg-slate-800 text-white shadow-xs border border-slate-900"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {filterType === "all"
                          ? `Semua ${activeMethod.toUpperCase()}`
                          : filterType === "personal"
                            ? "Milik Saya"
                            : filterType === "department"
                              ? "Departemen"
                              : "Perusahaan"}
                      </button>
                    ))}
                  </div>
                </div>

                {currentEmployeeKeyResults.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
                    <Target className="mx-auto text-slate-300 size-10 mb-2" />
                    <p className="text-slate-500 font-bold text-sm">
                      Belum Ada {activeMethod.toUpperCase()} Pada Peran Ini
                    </p>
                    <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                      Gunakan tombol <strong>{methodTerms.addObjectiveBtn}</strong> atau{" "}
                      <strong>{methodTerms.addKeyResultBtn}</strong> di atas untuk membuat
                      target.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="p-3 text-center w-12">No</th>
                          <th className="p-3">
                            {activeMethod === "okr"
                              ? `Item ${methodTermLabel} (${methodTerms.keyResultLabel} & Induk ${methodTerms.objectiveLabel})`
                              : activeMethod === "kpi"
                                ? "Item KPI (KPI & Induk Kategori)"
                                : "Item BSC (Indikator & Induk Perspektif)"}
                          </th>
                          {activeMethod === "kpi" && (
                            <th className="p-3 text-center">
                              Bobot (%)
                            </th>
                          )}
                          {activeMethod === "okr" && (
                            <th className="p-3 text-center">
                              Tipe {methodTermLabel}
                            </th>
                          )}
                          <th className="p-3 text-center">
                            {activeMethod === "okr" ? "Target (Desimal)" : "Target Kuartal Sekarang"}
                          </th>
                          <th className="p-3 text-center">
                            {activeMethod === "okr" ? "Realisasi (Desimal)" : "Actual Kuartal Sekarang"}
                          </th>
                          <th className="p-3 text-center">
                            {activeMethod === "okr" ? "Skor & Evaluasi Kinerja" : "Pencapaian Progress"}
                          </th>
                          <th className="p-3 text-center w-36">Aksi Cepat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {currentEmployeeKeyResults.map((kr, index) => {
                          const parentObj = objectives.find(
                            (obj) => obj.id === kr.objectiveId,
                          );
                          
                          // Evaluation using our Clean Architecture helper
                          const evalDetail = getKrClassification(
                            kr.progress,
                            kr.okrType || "committed",
                            kr.weight || 100
                          );

                          const progressColor =
                            kr.progress >= 70
                              ? "bg-emerald-600"
                              : kr.progress >= 40
                                ? "bg-amber-500"
                                : "bg-blue-500";
                          const progressTextColor =
                            kr.progress >= 70
                              ? "text-emerald-700"
                              : kr.progress >= 40
                                ? "text-amber-700"
                                : "text-blue-700";

                          return (
                            <tr
                              key={kr.id}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              {/* No */}
                              <td className="p-3 text-center font-mono font-bold text-slate-400">
                                {index + 1}
                              </td>

                              {/* Item Description & parent objective linkage */}
                              <td className="p-3 space-y-1.5 max-w-sm">
                                <div className="font-bold text-slate-800 text-[13px] leading-snug">
                                  {kr.title}
                                </div>
                                <div className="flex gap-1.5 flex-wrap">
                                  {kr.alignmentType === "shared" && (
                                    <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold px-1.5 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                                      <Users className="size-2.5" /> SHARED OKR
                                    </span>
                                  )}
                                  {kr.alignmentType === "dependency" && (
                                    <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold px-1.5 py-0.5 rounded border bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1">
                                      <Link className="size-2.5" /> DEPENDS ON: {keyResults.find(k => k.id === kr.dependencyKrId)?.title || "Unknown"}
                                    </span>
                                  )}
                                </div>
                                {parentObj && (
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-150/40 px-2 py-0.5 rounded border border-slate-150/60 w-fit">
                                    <Link className="size-3 text-teal-600" />
                                    <span>Induk: </span>
                                    <strong className="text-slate-500 italic max-w-[200px] truncate">
                                      "{parentObj.title}"
                                    </strong>
                                  </div>
                                )}
                              </td>

                              {/* Weight % for KPI */}
                              {activeMethod === "kpi" && (
                                <td className="p-3 text-center font-mono font-extrabold text-slate-700 bg-indigo-50/10">
                                  <span className="bg-indigo-100 text-indigo-850 px-2 py-1 rounded-md border border-indigo-200">
                                    {kr.weight || 100}%
                                  </span>
                                </td>
                              )}

                              {/* OKR Type Badge */}
                              {activeMethod === "okr" && (
                                <td className="p-3 text-center">
                                  {kr.okrType === "aspirational" ? (
                                    <span className="bg-purple-50 text-purple-700 text-[10px] font-extrabold px-2 py-1 rounded-md border border-purple-200 uppercase tracking-wider inline-flex items-center gap-1">
                                      ✨ Aspirational
                                    </span>
                                  ) : (
                                    <span className="bg-rose-50 text-rose-700 text-[10px] font-extrabold px-2 py-1 rounded-md border border-rose-200 uppercase tracking-wider inline-flex items-center gap-1">
                                      🎯 Commitment
                                    </span>
                                  )}
                                </td>
                              )}

                              {/* Target current quarter */}
                              <td className="p-3 text-center font-mono font-extrabold text-slate-700 bg-slate-50/30">
                                <span className={`bg-${methodTerms.colorClass}-100 text-${methodTerms.colorClass}-800 px-2 py-1 rounded-md border border-${methodTerms.colorClass}-200`}>
                                  {kr.unit ? `${kr.targetValue} ${kr.unit}` : Number(kr.targetValue)}
                                </span>
                              </td>

                              {/* Actual current quarter */}
                              <td className="p-3 text-center font-mono font-extrabold text-slate-800 bg-slate-50/30">
                                <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-md border border-slate-200">
                                  {kr.unit ? `${kr.currentValue} ${kr.unit}` : Number(kr.currentValue)}
                                </span>
                              </td>

                              {/* Percentage Progress & Health badge status */}
                              <td className="p-3 text-center space-y-1">
                                {activeMethod === "okr" ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-1">
                                      <span className="font-mono font-black text-slate-800 text-[13px]">
                                        {evalDetail.decimalScore.toFixed(2)}
                                      </span>
                                      <span className="text-[10px] text-slate-400">({kr.progress}%)</span>
                                    </div>
                                    {(() => {
                                      let badgeStyle = "bg-rose-100 text-rose-800 border-rose-200";
                                      if (evalDetail.classification === "Sangat Baik") {
                                        badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-200";
                                      } else if (evalDetail.classification === "Baik") {
                                        badgeStyle = "bg-blue-100 text-blue-800 border-blue-200";
                                      }
                                      return (
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${badgeStyle}`}>
                                          {evalDetail.classification}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                ) : (
                                  <>
                                    <span
                                      className={`text-[10px] font-mono font-extrabold ${progressTextColor}`}
                                    >
                                      {kr.progress}% Tercapai
                                    </span>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                                      <div
                                        className={`h-full rounded-full ${progressColor}`}
                                        style={{ width: `${kr.progress}%` }}
                                        id={`employee-progress-${kr.id}`}
                                      />
                                    </div>
                                  </>
                                )}
                              </td>

                              {/* Action prompt button */}
                              <td className="p-3 text-center">
                                <div className="flex flex-col gap-1.5">
                                  <button
                                    onClick={() => startQuickCheckIn(kr)}
                                    className="w-full inline-flex items-center justify-center gap-1 text-[10px] font-extrabold uppercase bg-emerald-700 hover:bg-emerald-800 border border-emerald-900 text-white px-2 py-1.5 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden active:scale-95 transition-all shadow-xxs"
                                  >
                                    <CheckSquare className="size-3" /> Check-In
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/**********************************************************
       * VIEW 2: MANAJEMEN & LEAD VIEW - COMPREHENSIVE OVERVIEW
       **********************************************************/}
      {okrViewMode === "manajemen" && (
        <div className="space-y-6">
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs space-y-1">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">
                Total {methodTerms.objectiveLabel} Korporat
              </span>
              <div className="flex items-center justify-between">
                <strong className="text-2xl font-black text-slate-800">
                  {totalObjectivesCount}
                </strong>
                <Target className={`text-${methodTerms.colorClass}-700 size-6 bg-${methodTerms.colorClass}-50 p-1.5 rounded-lg border border-${methodTerms.colorClass}-100`} />
              </div>
              <span className="text-[10px] text-slate-450 block">
                Perusahaan & Tim Lingkaran Aliansi
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs space-y-1">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">
                {methodTerms.objectiveLevelCompany}
              </span>
              <div className="flex items-center justify-between">
                <strong className="text-2xl font-black text-slate-800">
                  {companyLevelCount}
                </strong>
                <Award className="text-yellow-600 size-6 bg-yellow-50 p-1.5 rounded-lg border border-yellow-100" />
              </div>
              <span className="text-[10px] text-slate-450 block">
                Target Kualitatif Level Korporat
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs space-y-1">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">
                {methodTerms.objectiveLevelCircle}
              </span>
              <div className="flex items-center justify-between">
                <strong className="text-2xl font-black text-slate-800">
                  {leadLevelCount}
                </strong>
                <Layers className={`text-${methodTerms.colorClass}-700 size-6 bg-${methodTerms.colorClass}-50 p-1.5 rounded-lg border border-${methodTerms.colorClass}-100`} />
              </div>
              <span className="text-[10px] text-slate-450 block">
                Diampu oleh Koordinator Lead
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs space-y-1">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">
                {activeMethod === "okr" ? "Skor Desimal {methodTermLabel} Akumulatif" : `Rata-rata Pencapaian ${activeMethod.toUpperCase()}`}
              </span>
              <div className="flex items-center justify-between">
                <strong className="text-2xl font-black text-slate-800">
                  {activeMethod === "okr" ? okrOverallSummary.averageScore.toFixed(2) : `${averageProgress}%`}
                </strong>
                <TrendingUp className="text-blue-700 size-6 bg-blue-50 p-1.5 rounded-lg border border-blue-100" />
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full"
                  style={{ width: `${activeMethod === "okr" ? Math.round(okrOverallSummary.averageScore * 100) : averageProgress}%` }}
                />
              </div>
              {activeMethod === "okr" && (
                <span className="text-[9.5px] text-emerald-700 font-extrabold uppercase mt-1 block">
                  ● {okrOverallSummary.finalClassification}
                </span>
              )}
            </div>
          </div>

          {/* ADMIN ACTION TOGGLE ROW */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-150 shadow-xs">
            <div className="flex gap-2">
              {(["all", "company", "circle"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    selectedLevel === lvl
                      ? `bg-${methodTerms.colorClass}-900 text-white shadow-xs border border-${methodTerms.colorClass}-950`
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {lvl === "all"
                    ? `Seluruh ${activeMethod.toUpperCase()} Tim`
                    : lvl === "company"
                      ? "🏢 Top Management"
                      : `👥 Lead ${methodTerms.objectiveLabelPlural}`}
                </button>
              ))}
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                id="open-add-obj-modal"
                disabled={isLocked}
                onClick={() => setShowAddObjective(true)}
                className={`flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg shrink-0 transition-all ${
                  isLocked
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    : `text-${methodTerms.colorClass}-850 bg-${methodTerms.colorClass}-50 border border-${methodTerms.colorClass}-100 hover:bg-${methodTerms.colorClass}-100 cursor-pointer`
                }`}
                title={
                  isLocked
                    ? lang === "ID"
                      ? "Pembuatan Terkunci"
                      : "Creation Locked"
                    : undefined
                }
              >
                <Plus className="size-4" />{" "}
                {methodTerms.addObjectiveBtn}
              </button>
              <button
                id="open-add-kr-modal"
                disabled={isLocked}
                onClick={() => {
                  if (objectives.length > 0) setKrObjectiveId(objectives[0].id);
                  setShowAddKeyResult(true);
                }}
                className={`flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg shrink-0 transition-all ${
                  isLocked
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    : "text-blue-800 bg-blue-50 border border-blue-100 hover:bg-blue-100 cursor-pointer"
                }`}
                title={
                  isLocked
                    ? lang === "ID"
                      ? "Pembuatan Terkunci"
                      : "Creation Locked"
                    : undefined
                }
              >
                <Plus className="size-4" />{" "}
                {methodTerms.addKeyResultBtn}
              </button>
            </div>
          </div>

          {/* SEARCH & FILTER BAR */}
          <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-150 shadow-xs">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="size-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder={
                  lang === "ID"
                    ? "Cari judul Objective..."
                    : "Search Objective title..."
                }
                value={managementSearchQuery}
                onChange={(e) => setManagementSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={managementOwnerFilter}
                onChange={(e) => setManagementOwnerFilter(e.target.value)}
                className="w-full md:w-auto px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">
                  {lang === "ID" ? "Semua Sektor" : "All Sectors"}
                </option>
                <option value="null">
                  {lang === "ID"
                    ? "Tanpa Sektor (Korporat)"
                    : "No Sector (Corporate)"}
                </option>
                {circles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={managementStatusFilter}
                onChange={(e) =>
                  setManagementStatusFilter(e.target.value as any)
                }
                className="w-full md:w-auto px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">
                  {lang === "ID" ? "Semua Status" : "All Status"}
                </option>
                <option value="on_track">
                  {lang === "ID" ? "Tercapai (>=70%)" : "On Track (>=70%)"}
                </option>
                <option value="at_risk">
                  {lang === "ID" ? "Berisiko (40-69%)" : "At Risk (40-69%)"}
                </option>
                <option value="off_track">
                  {lang === "ID" ? "Tertinggal (<40%)" : "Off Track (<40%)"}
                </option>
              </select>
            </div>
          </div>

          {/* RENDERING TRANSPARENT CASCADING OBJECTIVES TREE LIST */}
          {filteredObjectives.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-150">
              <Target className="mx-auto text-slate-300 size-10 mb-2" />
              <p className="text-slate-500 font-bold text-sm">
                Belum ada Objective yang terdaftar scopes ini.
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Gunakan tombol "Tambah Objective" untuk mendaftarkan target
                kualitatif baru.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredObjectives.map((obj) => {
                const keyResultsList = getObjectiveKeyResults(obj.id);
                return (
                  <div
                    key={obj.id}
                    className="bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden"
                  >
                    {/* Header of Objective */}
                    <div className="bg-slate-50/50 p-5 border-b border-slate-150 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] uppercase font-mono tracking-wider font-extrabold px-2.5 py-0.5 rounded-full ${
                              obj.level === "company"
                                ? "bg-amber-100 text-amber-805 border border-amber-200"
                                : "bg-teal-100 text-teal-800 border border-teal-200"
                            }`}
                          >
                            {obj.level === "company"
                              ? methodTerms.objectiveLevelCompany
                              : methodTerms.objectiveLevelCircle}
                          </span>
                          {obj.circleId && (
                            <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 bg-slate-200/60 px-2.5 py-0.5 rounded-md">
                              <Layers className="size-3 text-slate-400" />{" "}
                              {getCircleName(obj.circleId)}
                            </span>
                          )}
                          {obj.status === "pending" && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 flex items-center gap-1">
                              Waiting Approval
                            </span>
                          )}
                          {obj.status === "rejected" && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700 flex items-center gap-1">
                              Rejected
                            </span>
                          )}
                          {obj.approverId && (
                            <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md border border-indigo-100">
                              <UserCheck className="size-3" /> Approver:{" "}
                              {users?.find((u) => u.id === obj.approverId)
                                ?.name || "Unknown"}
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                          Target: {obj.targetQuarter}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="title-font font-black text-[16px] text-slate-850 leading-snug">
                            {obj.title}
                          </h3>
                          {obj.parentId && (
                            <div className="flex items-center gap-1.5 text-[10px] bg-indigo-50/50 px-2 py-1 rounded border border-indigo-100/60 w-fit">
                              <Target className="size-3 text-indigo-500" />
                              <span className="text-slate-500 font-semibold">Terselaras dengan (Top-Down): </span>
                              <strong className="text-indigo-700 italic max-w-[300px] truncate">
                                "{objectives.find(o => o.id === obj.parentId)?.title || 'Unknown Objective'}"
                              </strong>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shadow-xxs bg-white rounded-lg p-1 border">
                          <button
                            onClick={() => {
                              setEditObjId(obj.id);
                              setEditObjTitle(obj.title);
                              setEditObjLevel(obj.level);
                              setEditObjCircleId(obj.circleId || "");
                              setEditObjParentId(obj.parentId || "");
                              setEditObjQuarter(obj.targetQuarter);
                              setEditObjApproverId(obj.approverId || "");
                              setShowEditObjective(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md hover:bg-slate-50 transition-colors"
                            title="Edit Objective"
                          >
                            <Edit className="size-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteObjectiveClick(e, obj.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 rounded-md hover:bg-slate-50 transition-colors"
                            title="Hapus Objective"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>

                      {/* Cumulative Progress bar of Objective card */}
                      <div className="bg-white/80 border border-slate-100/80 rounded-2xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xxs">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                          <Percent className={`size-4 text-${methodTerms.colorClass}-700`} />
                          <span>{lang === "ID" ? "Kemajuan Akumulatif:" : "Accumulative Progress:"}</span>
                          <span className={`font-black text-${methodTerms.colorClass}-900 font-mono text-sm`}>
                            {getObjectiveProgress(obj.id)}%
                          </span>
                        </div>
                        <div className="flex-1 max-w-md w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/60 relative">
                          <div
                            className={`h-full rounded-full transition-all duration-500 bg-${methodTerms.colorClass}-600`}
                            style={{ width: `${getObjectiveProgress(obj.id)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mt-2 items-start">
                        {/* Cascade connection alignment tagger */}
                        {obj.parentId && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white/70 p-2.5 rounded-lg border border-slate-150 inline-flex">
                            <Link className="size-3.5 text-teal-600 shrink-0" />
                            <span className="font-mono text-[9px] uppercase font-bold text-teal-800">
                              Menyelaraskan Ke Target Perusahaan:
                            </span>
                            <span className="truncate max-w-[320px] font-bold text-slate-700">
                              "{getParentObjectiveTitle(obj.parentId)}"
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() =>
                            setExpandedTreeObjId(
                              expandedTreeObjId === obj.id ? null : obj.id,
                            )
                          }
                          className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg border border-blue-100 transition-colors"
                        >
                          <GitMerge className="size-3.5" />
                          {expandedTreeObjId === obj.id
                            ? "Sembunyikan Pohon Penyelarasan"
                            : "Lihat Pohon Penyelarasan"}
                        </button>
                      </div>
                    </div>

                    {/* Key Results inside Objective Card */}
                    <div className="p-5 divide-y divide-slate-100">
                      {keyResultsList.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-xs">
                          {lang === "ID" 
                            ? `Belum ada ${methodTerms.keyResultLabel} kuantitatif untuk ${methodTerms.objectiveLabel} ini. Gunakan tombol "${methodTerms.addKeyResultBtn}" di atas untuk menambahkan indikator terukur.`
                            : `No quantitative ${methodTerms.keyResultLabel} for this ${methodTerms.objectiveLabel} yet. Use the "${methodTerms.addKeyResultBtn}" button above to add measurable indicators.`}
                        </div>
                      ) : (
                        keyResultsList.map((kr) => {
                          const assignees = getKeyResultAssigneeSplits(kr.id);
                          const riskDetail = calculateKeyResultRisk(
                            kr,
                            keyResultAssignees,
                            checkInLogs || [],
                            "2026-07-01T00:18:22"
                          );
                          const isExpanded = expandedKrs.includes(kr.id);
                          const toggleExpand = () => setExpandedKrs(prev => prev.includes(kr.id) ? prev.filter(id => id !== kr.id) : [...prev, kr.id]);
                          return (
                            <div
                              key={kr.id}
                              className="py-4 first:pt-0 last:pb-0 space-y-4"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <button onClick={toggleExpand} className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0" title={isExpanded ? "Tutup Detail" : "Buka Detail / Preview"}>
                                    {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                  </button>
                                  <span onClick={toggleExpand} className="font-bold text-slate-800 text-[14px] cursor-pointer hover:text-blue-600 transition-colors">
                                    {kr.title}
                                  </span>
                                  <span
                                    className={`text-[9px] uppercase font-mono tracking-wider font-extrabold px-2 py-0.5 rounded border ${
                                      kr.okrType === "aspirational"
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    }`}
                                  >
                                    {kr.okrType === "aspirational"
                                      ? "✨ ASPIRATIONAL"
                                      : "🎯 COMMITTED"}
                                  </span>
                                  {kr.alignmentType === "shared" && (
                                    <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1" title="Shared OKR (Co-owners)">
                                      <Users className="size-2.5" /> SHARED OKR
                                    </span>
                                  )}
                                  {kr.alignmentType === "dependency" && (
                                    <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold px-2 py-0.5 rounded border bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1" title="Dependency OKR">
                                      <Link className="size-2.5" /> DEPENDS ON: {keyResults.find(k => k.id === kr.dependencyKrId)?.title || "Unknown"}
                                    </span>
                                  )}
                                  {riskDetail.isAtRisk && (
                                    <span
                                      className={`text-[9px] uppercase font-mono tracking-wider font-extrabold px-2 py-0.5 rounded border flex items-center gap-1 ${
                                        riskDetail.riskLevel === "critical"
                                          ? "bg-rose-50 text-rose-800 border-rose-200"
                                          : "bg-amber-50 text-amber-800 border-amber-200"
                                      }`}
                                      title={lang === "ID" ? "Key Result Berisiko Tinggi!" : "Key Result At High Risk!"}
                                    >
                                      <AlertTriangle className="size-3 text-amber-600 shrink-0" />
                                      {riskDetail.riskLevel === "critical"
                                        ? (lang === "ID" ? "🔥 RISIKO KRITIS" : "🔥 CRITICAL RISK")
                                        : (lang === "ID" ? "⚠️ RISIKO TINGGI" : "⚠️ HIGH RISK")}
                                    </span>
                                  )}
                                  {!riskDetail.isAtRisk && riskDetail.riskLevel === "medium" && (
                                    <span
                                      className="text-[9px] uppercase font-mono tracking-wider font-extrabold px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1"
                                    >
                                      <AlertTriangle className="size-3 text-amber-500 shrink-0" />
                                      {lang === "ID" ? "⏳ PERLU PERHATIAN" : "⏳ NEEDS ATTENTION"}
                                    </span>
                                  )}
                                  {kr.status === "pending" && (
                                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                      Waiting Approval
                                    </span>
                                  )}
                                  {kr.status === "rejected" && (
                                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                                      Rejected
                                    </span>
                                  )}
                                  <div className="flex items-center gap-1 bg-slate-50 border rounded-md p-0.5">
                                    <button
                                      onClick={() => {
                                        setEditKrId(kr.id);
                                        setEditKrObjectiveId(kr.objectiveId);
                                        setEditKrTitle(kr.title);
                                        setEditKrAlignmentType(kr.alignmentType || (kr.isShared ? "shared" : "standard"));
                                        setEditKrDependencyKrId(kr.dependencyKrId || "");
                                        setEditKrTargetValue(kr.targetValue);
                                        setEditKrCurrentValue(kr.currentValue);
                                        setEditKrUnit(kr.unit);
                                        setEditKrType(
                                          kr.okrType || "committed",
                                        );
                                        setEditKrCalcSystem(kr.calcSystem || "maximize");
                                        setEditKrPenaltyFactor(kr.penaltyFactor !== undefined ? String(kr.penaltyFactor) : "20");
                                        setEditKrTasks(kr.tasks || []);
                                        setNewEditDraftTaskDesc("");
                                        setShowEditKeyResult(true);
                                      }}
                                      className="p-1 text-slate-450 hover:text-blue-600 rounded-md transition-colors"
                                      title="Edit Key Result"
                                    >
                                      <Edit className="size-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) =>
                                        handleDeleteKeyResultClick(e, kr.id)
                                      }
                                      className="p-1 text-slate-450 hover:text-red-600 rounded-md transition-colors"
                                      title="Hapus Key Result"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                                    Target Quartal: {kr.unit ? `${kr.targetValue} ${kr.unit}` : Number(kr.targetValue)}
                                  </span>
                                  <span className="text-xs font-mono font-bold text-slate-705 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                                    Realisasi: {kr.unit ? `${kr.currentValue} ${kr.unit}` : Number(kr.currentValue)}
                                  </span>
                                  {kr.isShared && (
                                    <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold bg-blue-50 text-blue-800 border border-blue-105 px-2 py-1 rounded-md">
                                      <Handshake className="size-3" /> Berbagi
                                      Peran (Shared Goal)
                                    </span>
                                  )}
                                </div>
                              </div>

                              {!isExpanded && (
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-500 rounded-full" 
                                      style={{ width: `${Math.min(100, Math.max(0, kr.progress))}%` }} 
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500">{kr.progress}%</span>
                                </div>
                              )}

                              {isExpanded && (
                                <>
                                  {/* Progress bar visualizer */}
                                  <div className="space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
                                  <span className="font-semibold text-slate-500">
                                    {activeMethod === "okr" ? "Skor Desimal & Klasifikasi Kinerja:" : "Tingkat Ketercapaian Target Saat Ini:"}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    {activeMethod === "okr" ? (
                                      <>
                                        {(() => {
                                          const decimalScore = Math.min(1.00, Math.max(0.00, Number((kr.progress / 100).toFixed(2))));
                                          const okrType = kr.okrType || "committed";
                                          let classLabel = "";
                                          let descLabel = "";
                                          let multiplierLabel = "";
                                          let badgeStyle = "";

                                          if (okrType === "aspirational") {
                                            if (decimalScore >= 0.70) {
                                              classLabel = "Sangat Baik";
                                              descLabel = "High Performance";
                                              multiplierLabel = "Bobot x 1.43";
                                              badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
                                            } else if (decimalScore >= 0.40) {
                                              classLabel = "Baik";
                                              descLabel = "Target";
                                              multiplierLabel = "Bobot x 1";
                                              badgeStyle = "bg-purple-50 text-purple-800 border-purple-200";
                                            } else {
                                              classLabel = "Kurang";
                                              descLabel = "Under Performance";
                                              multiplierLabel = "Bobot x 1";
                                              badgeStyle = "bg-rose-50 text-rose-800 border-rose-200";
                                            }
                                          } else {
                                            if (decimalScore >= 1.00) {
                                              classLabel = "Sangat Baik";
                                              descLabel = "High Performance";
                                              multiplierLabel = "Bobot x 1";
                                              badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
                                            } else if (decimalScore >= 0.80) {
                                              classLabel = "Baik";
                                              descLabel = "Performance";
                                              multiplierLabel = "Bobot x 1";
                                              badgeStyle = "bg-indigo-50 text-indigo-800 border-indigo-200";
                                            } else {
                                              classLabel = "Kurang";
                                              descLabel = "Under Performance";
                                              multiplierLabel = "Bobot x 1";
                                              badgeStyle = "bg-rose-50 text-rose-800 border-rose-200";
                                            }
                                          }

                                          return (
                                            <div className="flex items-center gap-2">
                                              <span className="font-black text-slate-800 text-xs bg-slate-100 border px-1.5 py-0.5 rounded-md font-mono">
                                                {decimalScore.toFixed(2)}
                                              </span>
                                              <span className={`px-2 py-0.5 rounded border text-[9.5px] font-black uppercase tracking-wider ${badgeStyle}`}>
                                                {classLabel} ({descLabel})
                                              </span>
                                              <span className="text-[9px] font-mono font-bold bg-slate-50 text-slate-450 px-1 rounded border">
                                                {multiplierLabel}
                                              </span>
                                            </div>
                                          );
                                        })()}
                                      </>
                                    ) : (
                                      <span className="font-extrabold text-slate-800 text-xs">
                                        {kr.progress}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      kr.progress >= 70
                                        ? "bg-emerald-500"
                                        : kr.progress >= 40
                                          ? "bg-amber-500"
                                          : "bg-blue-500"
                                    }`}
                                    style={{ width: `${kr.progress}%` }}
                                  />
                                </div>
                              </div>

                              {/* Transparent Risk Assessment Panel */}
                              {riskDetail.riskLevel !== "low" && (
                                <div className={`p-3.5 rounded-xl border text-xs space-y-2 flex flex-col ${
                                  riskDetail.riskLevel === "critical"
                                    ? "bg-rose-50/60 border-rose-200 text-rose-900"
                                    : riskDetail.riskLevel === "high"
                                      ? "bg-amber-50/50 border-amber-200 text-amber-900"
                                      : "bg-blue-50/40 border-blue-150 text-blue-900"
                                }`}>
                                  <div className="flex items-center gap-1.5 font-extrabold uppercase tracking-wide text-[10px]">
                                    <AlertTriangle className={`size-4 shrink-0 ${
                                      riskDetail.riskLevel === "critical" ? "text-rose-600" : riskDetail.riskLevel === "high" ? "text-amber-600" : "text-blue-600"
                                    }`} />
                                    <span>
                                      {lang === "ID" ? "Pelacakan Risiko Transparan (Metrik & Log)" : "Transparent Risk Tracking (Metrics & Logs)"}
                                    </span>
                                    <span className="ml-auto font-mono text-[9px] px-1.5 py-0.2 bg-white/85 text-slate-800 rounded border font-bold">
                                      RISK SCORE: {riskDetail.riskScore}/100
                                    </span>
                                  </div>
                                  <div className="text-[11px] leading-relaxed space-y-1">
                                    <p className="font-semibold text-slate-700">
                                      {lang === "ID"
                                        ? "Penyebab Terdeteksi:"
                                        : "Detected Risk Factors:"}
                                    </p>
                                    <ul className="list-disc pl-4 space-y-1">
                                      {(lang === "ID" ? riskDetail.reasons : riskDetail.reasonsEn).map((reason, idx) => (
                                        <li key={idx}>{reason}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  {riskDetail.lastCheckInDays !== undefined && (
                                    <div className="text-[9.5px] font-mono text-slate-500 pt-1 border-t border-dashed border-slate-200 flex justify-between">
                                      <span>{lang === "ID" ? "Hari Sejak Check-In Terakhir:" : "Days Since Last Check-In:"}</span>
                                      <span className="font-extrabold text-slate-700">{riskDetail.lastCheckInDays} {lang === "ID" ? "hari lalu" : "days ago"}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Contributors allocation weights breakdown */}
                              {kr.isShared && assignees.length > 0 && (
                                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-2">
                                  <div className="flex items-center gap-1 text-[10px] uppercase font-mono font-bold text-slate-400">
                                    <Users className="size-3 text-slate-500" />
                                    <span>
                                      Porsi Kontribusi Kolaboratif Koordinator /
                                      Peran
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {assignees.map((asg) => (
                                      <div
                                        key={asg.id}
                                        className="bg-white p-3 rounded-lg border border-slate-200 shadow-xxs space-y-2"
                                      >
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold block w-fit mb-1">
                                              {getCircleName(asg.circleId)}
                                            </span>
                                            <span className="text-slate-600 text-xs font-semibold flex items-center gap-1">
                                              <Shield className="size-3 text-slate-400" />{" "}
                                              {getRoleTitle(asg.roleId)}
                                            </span>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-[9px] text-slate-400 font-mono block">
                                              BOBOT CONTRIB
                                            </span>
                                            <strong className="font-mono text-xs font-black text-slate-800">
                                              {asg.weightPercentage}%
                                            </strong>
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                                            <span>Progress Aktual Peran:</span>
                                            <span className="font-bold text-slate-700">
                                              {asg.currentProgress}%
                                            </span>
                                          </div>
                                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                            <div
                                              className="bg-blue-500 h-full"
                                              style={{
                                                width: `${asg.currentProgress}%`,
                                              }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Tasks Checklist Row Section */}
                              <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-150 space-y-2 mt-2">
                                <div className="flex items-center justify-between text-[10px] uppercase font-mono font-bold text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <ClipboardCheck className="size-3.5 text-slate-500" />
                                    {lang === "ID" ? "Daftar Tindakan / Task Karyawan" : "Action Checklist / Employee Tasks"}
                                  </span>
                                  {kr.tasks && kr.tasks.length > 0 && (
                                    <span className="text-slate-450 text-[9.5px]">
                                      {kr.tasks.filter(t => t.status === "completed").length} / {kr.tasks.length} {lang === "ID" ? "Selesai" : "Completed"}
                                    </span>
                                  )}
                                </div>

                                {(!kr.tasks || kr.tasks.length === 0) ? (
                                  <div className="text-[10px] text-slate-400 italic">
                                    {lang === "ID" ? "Belum ada task yang diinput untuk indikator ini." : "No tasks have been added for this indicator."}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditKrId(kr.id);
                                        setEditKrObjectiveId(kr.objectiveId);
                                        setEditKrTitle(kr.title);
                                        setEditKrAlignmentType(kr.alignmentType || (kr.isShared ? "shared" : "standard"));
                                        setEditKrDependencyKrId(kr.dependencyKrId || "");
                                        setEditKrTargetValue(kr.targetValue);
                                        setEditKrCurrentValue(kr.currentValue);
                                        setEditKrUnit(kr.unit);
                                        setEditKrType(kr.okrType || "committed");
                                        setEditKrCalcSystem(kr.calcSystem || "maximize");
                                        setEditKrPenaltyFactor(kr.penaltyFactor !== undefined ? String(kr.penaltyFactor) : "20");
                                        setEditKrTasks(kr.tasks || []);
                                        setNewEditDraftTaskDesc("");
                                        setShowEditKeyResult(true);
                                      }}
                                      className="text-emerald-800 font-bold ml-1 hover:underline"
                                    >
                                      + {lang === "ID" ? "Tambah Task" : "Add Task"}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                                    {kr.tasks.map((task, taskIdx) => (
                                      <div
                                        key={task.id || taskIdx}
                                        className="flex items-center justify-between gap-3 p-1.5 bg-white rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                                      >
                                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                                          <input
                                            type="checkbox"
                                            checked={task.status === "completed"}
                                            onChange={(e) => {
                                              const updatedTasks = (kr.tasks || []).map((t, idx) => {
                                                if (idx === taskIdx) {
                                                  return { ...t, status: e.target.checked ? "completed" as const : "pending" as const };
                                                }
                                                return t;
                                              });
                                              onKeyResultUpdated(kr.id, { tasks: updatedTasks });
                                            }}
                                            className="rounded border-slate-300 text-emerald-650 focus:ring-emerald-500 font-bold size-3.5 cursor-pointer"
                                          />
                                          <span className={`text-[11px] font-semibold text-slate-700 ${task.status === "completed" ? "line-through text-slate-400 font-normal" : ""}`}>
                                            {task.description}
                                          </span>
                                        </label>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                          task.status === "completed"
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                            : "bg-amber-50 text-amber-700 border border-amber-100"
                                        }`}>
                                          {task.status === "completed" ? (lang === "ID" ? "Selesai" : "Completed") : (lang === "ID" ? "Pending" : "Pending")}
                                        </span>
                                      </div>
                                    ))}
                                    
                                    <div className="flex justify-end pt-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditKrId(kr.id);
                                          setEditKrObjectiveId(kr.objectiveId);
                                          setEditKrTitle(kr.title);
                                        setEditKrAlignmentType(kr.alignmentType || (kr.isShared ? "shared" : "standard"));
                                        setEditKrDependencyKrId(kr.dependencyKrId || "");
                                          setEditKrTargetValue(kr.targetValue);
                                          setEditKrCurrentValue(kr.currentValue);
                                          setEditKrUnit(kr.unit);
                                          setEditKrType(kr.okrType || "committed");
                                          setEditKrCalcSystem(kr.calcSystem || "maximize");
                                          setEditKrPenaltyFactor(kr.penaltyFactor !== undefined ? String(kr.penaltyFactor) : "20");
                                          setEditKrTasks(kr.tasks || []);
                                          setNewEditDraftTaskDesc("");
                                          setShowEditKeyResult(true);
                                        }}
                                        className="text-[10px] font-extrabold text-slate-500 hover:text-emerald-800 flex items-center gap-1"
                                      >
                                        <Plus className="size-3" />
                                        {lang === "ID" ? "Kelola / Tambah Task" : "Manage / Add Tasks"}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                              </>
                              )}
                            </div>
                          );
                        })
                      )}

                      {/* Nested Tree Expansion */}
                      {expandedTreeObjId === obj.id && (
                        <div className="pt-6 border-t border-slate-150 bg-slate-50/30">
                          <h4 className="text-xs font-bold text-slate-700 mb-4 px-5">
                            Pohon Penyelarasan (Alignment Tree)
                          </h4>
                          <div className="px-2 pb-4 overflow-x-auto">
                            <AlignmentTree
                              objectiveId={obj.id}
                              objectives={objectives}
                              keyResults={keyResults}
                              circles={circles}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {okrViewMode === "alignment_map" && (
        <OkrAlignmentMap
          objectives={objectives}
          keyResults={keyResults}
          circles={circles}
          roles={roles}
          users={users}
          keyResultAssignees={keyResultAssignees}
          roleMembers={roleMembers}
          systemConfig={systemConfig}
          onDeleteObjective={onObjectiveDeleted}
          onDeleteKeyResult={onKeyResultDeleted}
          onEditObjective={(id) => {
            const obj = objectives.find(o => o.id === id);
            if(obj) {
              setEditObjId(obj.id);
              setEditObjTitle(obj.title);
              setEditObjLevel(obj.level);
              setEditObjCircleId(obj.circleId || "");
              setEditObjParentId(obj.parentId || "");
              setEditObjQuarter(obj.targetQuarter);
              setEditObjApproverId(obj.approverId || "");
              setShowEditObjective(true);
            }
          }}
          onEditKeyResult={(id) => {
            const kr = keyResults.find(k => k.id === id);
            if(kr) {
              setEditKrId(kr.id);
              setEditKrObjectiveId(kr.objectiveId);
              setEditKrTitle(kr.title);
              setEditKrAlignmentType(kr.alignmentType || (kr.isShared ? "shared" : "standard"));
              setEditKrDependencyKrId(kr.dependencyKrId || "");
              setEditKrTargetValue(kr.targetValue);
              setEditKrCurrentValue(kr.currentValue);
              setEditKrUnit(kr.unit);
              setEditKrType(kr.okrType || "committed");
              setEditKrCalcSystem(kr.calcSystem || "maximize");
              setEditKrPenaltyFactor(kr.penaltyFactor !== undefined ? String(kr.penaltyFactor) : "20");
              setEditKrTasks(kr.tasks || []);
              setNewEditDraftTaskDesc("");
              setShowEditKeyResult(true);
            }
          }}
          onObjectiveUpdated={onObjectiveUpdated}
          onKeyResultUpdated={onKeyResultUpdated}
          onAddObjectiveRequest={(level?: "company" | "circle") => {
            setObjTitle("");
            setObjLevel(level || "company");
            setObjCircleId("");
            setObjParentId("");
            setObjQuarter(systemConfig?.currentQuarter || "Q1 2026");
            setObjApproverId("");
            setShowAddObjective(true);
          }}
          onAddKeyResultRequest={(objectiveId) => {
            setKrObjectiveId(objectiveId || "");
            setKrTitle("");
            setKrTargetValue("");
            setKrCurrentValue("0");
            setKrUnit("");
            setKrWeight("100");
            setKrIsShared(false);
            setKrAlignmentType("standard");
            setKrType("committed");
            setKrCalcSystem("maximize");
            setKrPenaltyFactor("20");
            setKrTasks([]);
            setKrAssignees([]);
            setKrDependencyKrId("");
            setNewDraftTaskDesc("");
            setShowAddKeyResult(true);
          }}
        />
      )}

      {okrViewMode === "tracking_progress" && (
        <OkrProgressTracker
          objectives={objectives}
          keyResults={keyResults}
          keyResultAssignees={keyResultAssignees}
          roleMembers={roleMembers || []}
          roles={roles}
          circles={circles}
          users={users || []}
          checkInLogs={checkInLogs || []}
          lang={lang}
        />
      )}

      {/**********************************************************
       * VIEW 3: BANTUAN EDUKASI OKR JOHN DOERR
       **********************************************************/}
      {okrViewMode === "bantuan" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
            <div className="flex items-center gap-2 border-b border-rose-100 pb-3 text-emerald-850">
              <Award className="size-6 text-yellow-500" />
              <h3 className="title-font font-black text-lg">
                {lang === "ID"
                  ? "Panduan Praktis Belajar & Memahami {methodTermLabel}"
                  : "Practical Guide to Learning & Understanding {methodTermLabel}s"}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed">
              <div className="space-y-3">
                <strong className="text-slate-805 text-sm font-extrabold block">
                  1. Mengapa {methodTermLabel} Sangat Sukses di Perusahaan Teknologi?
                </strong>
                <p>
                  Perusahaan-perusahaan besar tumbuh masif karena menggunakan
                  **superpower {methodTermLabel}**:
                  <br />
                  • **Fokus**: Menentukan tujuan prioritas terpenting di kuartal
                  sekarang.
                  <br />
                  • **Alignment**: Semua tim tahu arah korporat dan bersinergi
                  harmonis.
                  <br />
                  • **Tracking**: Progress diukur dengan data realisasi bukan
                  opini/asumsi.
                  <br />• **Stretching**: Mendorong inovasi tanpa takut gagal.
                </p>

                <strong className="text-slate-805 text-sm font-extrabold block">
                  2. Cara Membedakan {methodTerms.objectiveLabel} vs {methodTerms.keyResultLabel}
                </strong>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-150 space-y-1">
                  <p className="font-bold text-emerald-900">
                    🎯 {methodTerms.objectiveLabel} = APA YANG INGIN DICAPAI
                  </p>
                  <p>
                    Harus kualitatif, menginspirasi, konkrit, memberi arah
                    tindakan jelas. Contoh: "Meningkatkan kepuasan pelanggan
                    secara radikal di Q1."
                  </p>
                  <p className="font-bold text-teal-900 mt-2">
                    📈 {methodTerms.keyResultLabel} = BAGAIMANA CARA MENGUKUR NYATA
                  </p>
                  <p>
                    Harus kuantitatif (berisi angka), terukur, dan tertarget
                    kuartal ini. Contoh: "Mencapai rata-rata rating review
                    bintang 4.8."
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <strong className="text-slate-805 text-sm font-extrabold block">
                  3. Menyelaraskan {methodTermLabel} Sesuai Penilaian
                </strong>
                <p>
                  Ada dua jenis {methodTermLabel} yang kami gunakan: <br />
                  • **Committed {methodTermLabel}s**: Target yang harus dicapai 100% (nilai
                  kelulusan penuh).
                  <br />• **Aspirational KRs**: Target ambisius (stretching
                  goals) di mana pencapaian 70% sudah dianggap kesuksesan luar
                  biasa!
                </p>

                <strong className="text-slate-805 text-sm font-extrabold block">
                  {lang === "ID"
                    ? "4. Tips Rahasia Memulai {methodTermLabel} untuk Pemula:"
                    : "4. Secret Tips for {methodTermLabel} Beginners:"}
                </strong>
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200/80 space-y-1 text-slate-800">
                  <span className="font-black text-yellow-805">
                    💡 Jangan Terlalu Kompleks!
                  </span>
                  <p className="italic">
                    "Bila Anda baru mulai belajar {methodTermLabel}, **ingat rumus emas**: 1
                    {methodTerms.objectiveLabel} Utama perusahaan, dan biarkan masing-masing
                    pengampu peran/karyawan menulis 1 hingga 2 {methodTerms.keyResultLabel}
                    sederhana. Lakukan pertemuan koordinasi report yang hangat.
                    Selesai! Pertumbuhan akan mengikuti!"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/**********************************************************
       * VIEW 4: RIWAYAT APPROVAL VIEW
       **********************************************************/}
      {okrViewMode === "approval" && currentRolePerm?.id !== "karyawan" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col space-y-6">
            <div>
              <h3 className="title-font font-black text-lg text-slate-800 flex items-center gap-2">
                <ClipboardCheck className="text-purple-700 size-6" /> 
                {lang === "ID" ? "Daftar Riwayat & Pengajuan Approval" : "Approval Requests & History List"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Gunakan tab ini untuk melihat, menguji, menyetujui, atau menolak pembaruan progres {methodTerms.keyResultLabel} dari tim Anda.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 text-xs text-slate-600 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <p className="font-bold text-slate-700">Aturan Approval Berdasarkan Role:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-500">
                  <li><strong>Direksi</strong> dan <strong>Atasan Tidak Langsung</strong> memiliki wewenang penuh untuk melakukan approval.</li>
                  <li><strong>Atasan Langsung</strong> dapat meng-approve check-in di mana mereka terdaftar sebagai <code>approverIds</code>.</li>
                  <li>Jika karyawan tidak memiliki atasan langsung, maka approval dilakukan oleh atasan tidak langsung atau direksi.</li>
                </ul>
              </div>
              <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center shrink-0">
                <span className="font-semibold text-slate-500">Total Log:</span>
                <span className="ml-1.5 font-bold text-slate-800 text-sm bg-slate-100 px-2.5 py-0.5 rounded-full">{checkInLogs?.length || 0}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-[10px] uppercase font-mono text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-4 w-32 font-bold text-slate-500">Tanggal & Jam</th>
                      <th className="p-4 font-bold text-slate-500">{methodTerms.objectiveLabel} & {methodTerms.keyResultLabel}</th>
                      <th className="p-4 font-bold text-slate-500">Karyawan</th>
                      <th className="p-4 text-center font-bold text-slate-500">Nilai Progres</th>
                      <th className="p-4 text-center font-bold text-slate-500">Lampiran</th>
                      <th className="p-4 text-center font-bold text-slate-500">Status</th>
                      <th className="p-4 text-center w-40 font-bold text-slate-500">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {checkInLogs && checkInLogs.length > 0 ? (
                      checkInLogs.filter(log => {
                        const logKr = keyResults.find(k => k.id === log.keyResultId);
                        const logObj = logKr ? objectives.find(o => o.id === logKr.objectiveId) : null;
                        
                        if (selectedPeriod !== "all" && logObj?.targetQuarter !== selectedPeriod) return false;
                        if (selectedMonth !== "all") {
                          const logDate = new Date(log.timestamp);
                          if (!isNaN(logDate.getTime()) && logDate.getMonth().toString() !== selectedMonth) return false;
                        }
                        return true;
                      }).map(log => {
                        const logKr = keyResults.find(k => k.id === log.keyResultId);
                        const logObj = logKr ? objectives.find(o => o.id === logKr.objectiveId) : null;
                        const employee = users.find(u => u.id === log.assigneeId);
                        
                        const canApprove = 
                          currentRolePerm?.id === "direksi" || 
                          currentRolePerm?.id === "atasan_tidak_langsung" || 
                          log.approverIds?.includes(currentLoginUserId || "") ||
                          (log.approverIds?.length === 0 && currentRolePerm?.id !== "karyawan");

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 align-top">
                              <div className="font-bold text-slate-700">
                                {new Date(log.timestamp).toLocaleDateString()}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </td>
                            <td className="p-4 align-top max-w-[280px]">
                              <div className="text-[10px] text-slate-400 mb-1 truncate font-medium" title={logObj?.title}>
                                Objective: {logObj?.title || "Unknown Objective"}
                              </div>
                              <div className="font-bold text-slate-800 leading-snug line-clamp-2" title={logKr?.title}>
                                KR: {logKr?.title || "Unknown KR"}
                              </div>
                              {log.notes && (
                                <div className="mt-2 text-[10px] text-slate-600 italic border-l-2 border-slate-200 pl-2 py-0.5 bg-slate-50/80 rounded-r-md">
                                  "{log.notes}"
                                </div>
                              )}
                              {log.hasBlocker && log.blockerNotes && (
                                <div className="mt-1.5 text-[10px] text-rose-700 font-medium border-l-2 border-rose-300 pl-2 py-0.5 bg-rose-50/50 rounded-r-md flex items-center gap-1">
                                  ⚠️ Blocker: "{log.blockerNotes}"
                                </div>
                              )}
                            </td>
                            <td className="p-4 align-top">
                              <div className="flex items-center gap-2">
                                <img
                                  referrerPolicy="no-referrer"
                                  src={employee?.avatar || undefined}
                                  alt={employee?.name || log.assigneeId}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                />
                                <div>
                                  <div className="font-bold text-slate-700">
                                    {employee?.name || log.assigneeId}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-medium">
                                    {employee?.department || "Operations"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 align-top text-center font-mono">
                              <div className="inline-flex items-center justify-center gap-1.5 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-150">
                                <span className="text-slate-500 font-medium">{log.previousValue}</span>
                                <ArrowRight className="size-3 text-slate-400" />
                                <span className="text-emerald-700 font-bold">{log.newValue}</span>
                              </div>
                            </td>
                            <td className="p-4 align-top text-center">
                              {log.attachmentName ? (
                                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium inline-flex items-center gap-1 border border-blue-100 max-w-[120px] truncate" title={log.attachmentName}>
                                  📎 {log.attachmentName}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="p-4 align-top text-center">
                              <span className={`text-[10px] font-extrabold uppercase font-mono px-2 py-1 rounded-md ${
                                log.status === "approved" ? "bg-emerald-100 text-emerald-800" :
                                log.status === "rejected" ? "bg-rose-100 text-rose-800" :
                                "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}>
                                {log.status || "pending"}
                              </span>
                            </td>
                            <td className="p-4 align-top">
                              <div className="flex flex-col gap-1.5">
                                {log.status === "pending" && canApprove && (
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => onReviewCheckIn && onReviewCheckIn(log.id, { approverId: currentLoginUserId || "", status: "approved", approverNotes: "" })}
                                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1 font-bold text-[10px] transition-colors"
                                      title="Approve"
                                    >
                                      <CheckCircle className="size-3.5" /> Setujui
                                    </button>
                                    <button
                                      onClick={() => {
                                        const reason = window.prompt("Alasan penolakan:");
                                        if (reason !== null) {
                                          onReviewCheckIn && onReviewCheckIn(log.id, { approverId: currentLoginUserId || "", status: "rejected", approverNotes: reason });
                                        }
                                      }}
                                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1 font-bold text-[10px] transition-colors"
                                      title="Reject"
                                    >
                                      ✕ Tolak
                                    </button>
                                  </div>
                                )}
                                <button
                                  onClick={() => {
                                    if (window.confirm("Hapus log check-in ini secara permanen?")) {
                                      onDeleteCheckIn && onDeleteCheckIn(log.id);
                                    }
                                  }}
                                  className="w-full bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 py-1.5 rounded-lg border border-slate-200 transition-colors flex justify-center items-center gap-1 text-[10px] font-bold"
                                >
                                  <Trash2 className="size-3" /> Hapus Log
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                          Belum ada riwayat update / check-in.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/**********************************************************
       * MODAL POPUP: KIRIM CEPAT CHECK-IN {methodTermLabel} (INDIVIDUAL)
       **********************************************************/}
      {showQuickCheckIn && activeCheckInKR && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-150 p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-100 text-emerald-850 p-1.5 rounded-lg">
                  <CheckSquare className="size-4 text-emerald-800" />
                </div>
                <div>
                  <h3 className="title-font font-extrabold text-sm text-slate-400 uppercase tracking-widest leading-none">
                    Kirim Cepat
                  </h3>
                  <h4 className="title-font font-black text-base text-slate-800">
                    Realisasi Aktual {methodTermLabel}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => setShowQuickCheckIn(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border space-y-1.5">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">
                Indikator Key Result
              </span>
              <p className="font-bold text-xs text-slate-800">
                {activeCheckInKR.title}
              </p>

              {checkInError && (
                <div className="bg-red-50 text-red-700 p-2.5 rounded-xl border border-red-200 text-[11px] font-extrabold font-mono mt-1">
                  ⚠️ {checkInError}
                </div>
              )}

              <div className="flex items-center gap-2 text-[10px] text-slate-450 font-mono mt-1">
                <span>Target saat ini:</span>
                <strong className="text-slate-700 bg-white px-1 py-0.5 rounded border">
                  {activeCheckInKR.targetValue} {activeCheckInKR.unit}
                </strong>
                <span>Aktual lama:</span>
                <strong className="text-slate-700 bg-white px-1 py-0.5 rounded border">
                  {activeCheckInKR.currentValue} {activeCheckInKR.unit}
                </strong>
              </div>
            </div>

            <form
              onSubmit={handleQuickCheckInSubmit}
              className="space-y-4 text-xs font-semibold text-slate-600"
            >
              {(() => {
                const supervisors = getEmployeeSupervisors(currentEmployee.id);
                if (supervisors.length > 0) {
                  return (
                    <div className="bg-amber-50 text-amber-805 p-3 rounded-xl border border-amber-200 leading-tight">
                      <span className="font-bold text-amber-950 block mb-0.5 text-[11px]">
                        ⚠️ Persetujuan Diperlukan
                      </span>
                      Pembaruan realisasi aktual ini memerlukan approval dari
                      atasan Anda:{" "}
                      <strong className="text-amber-950">
                        {supervisors.map((s) => s.name).join(", ")}
                      </strong>{" "}
                      sebelum masuk rekap akhir.
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-emerald-50 text-emerald-805 p-3 rounded-xl border border-emerald-150 leading-tight">
                      <span className="font-bold text-emerald-950 block mb-0.5 text-[11px]">
                        ✓ Auto-Approve Aktif
                      </span>
                      Anda tidak memiliki atasan langsung di circle Anda.
                      Pembaruan akan langsung terserap dan tersimpan di rekap
                      akhir.
                    </div>
                  );
                }
              })()}

              {/* FIXED DATE - CHECK-IN DATE */}
              <div>
                <label className="block text-slate-700 mb-1">
                  Tanggal Check-In Aktual
                </label>
                <input
                  type="date"
                  disabled
                  value={new Date().toISOString().split("T")[0]}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-500 bg-slate-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">
                  Masukan Nilai Aktual Sekarang ({activeCheckInKR.unit}) *
                </label>
                <input
                  type="number"
                  required
                  value={quickNewValue}
                  onChange={(e) => setQuickNewValue(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-800 bg-slate-50/50"
                  placeholder={`e.g. ${activeCheckInKR.targetValue}`}
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">
                  Lampirkan Bukti Dokumen (Opsional)
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setQuickAttachmentName(f.name);
                  }}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">
                  Komentar / Catatan Kemajuan *
                </label>
                <textarea
                  rows={2}
                  required
                  value={quickCheckInNotes}
                  onChange={(e) => setQuickCheckInNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-medium"
                  placeholder="Ceritakan singkat perkembangan atau tindakan nyata yang sudah dilakukan hari ini..."
                />
              </div>

              {/* Blocker tagging */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quickHasBlocker}
                    onChange={() => setQuickHasBlocker(!quickHasBlocker)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 font-bold size-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-700 block text-xs">
                      Ada Hambatan / Blockers?
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Centang jika ada kendala di departemen lain.
                    </span>
                  </div>
                </label>

                {quickHasBlocker && (
                  <div className="mt-2 text-[11px] space-y-2">
                    <textarea
                      rows={2}
                      required
                      value={quickBlockerNotes}
                      onChange={(e) => setQuickBlockerNotes(e.target.value)}
                      placeholder="Sebutkan kendala atau bantuan yang Anda butuhkan..."
                      className="w-full border border-slate-300 rounded-lg p-2 mt-1 font-medium bg-white"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">
                          Circle Terkait (Opsional)
                        </label>
                        <select
                          value={quickDepCircleId}
                          onChange={(e) => {
                            setQuickDepCircleId(e.target.value);
                            setQuickDepRoleId(""); // Reset role when circle changes
                          }}
                          className="w-full border border-slate-300 rounded-lg p-1.5 bg-white"
                        >
                          <option value="">-- Pilih Sektor / Circle --</option>
                          {circles.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {quickDepCircleId && (
                        <div>
                          <label className="block text-slate-500 font-bold mb-1">
                            Peran Terkait (Opsional)
                          </label>
                          <select
                            value={quickDepRoleId}
                            onChange={(e) => setQuickDepRoleId(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-1.5 bg-white"
                          >
                            <option value="">
                              -- Pilih Jabatan / Peran --
                            </option>
                            {roles
                              .filter((r) => r.circleId === quickDepCircleId)
                              .map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.title}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickCheckIn(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 text-slate-500 font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-900 border border-emerald-950 text-white rounded-xl font-bold text-xs active:scale-95 transition-all shadow-sm"
                >
                  Kirim Check-in Aktual
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/**********************************************************
       * MODAL: ADD OKR OBJECTIVE (MANAGEMENT)
       **********************************************************/}
      {showAddObjective && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-150 p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="title-font font-black text-lg text-slate-800 flex items-center gap-2">
                <Target className="text-emerald-700 size-5 shrink-0" />{" "}
                Deklarasikan {methodTerms.objectiveLabel}
              </h3>
              <button
                onClick={() => setShowAddObjective(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateObjective}
              className="space-y-4 text-xs font-semibold text-slate-600"
            >
              <div>
                <label className="block text-slate-705 mb-1 flex items-center gap-1.5">
                  Kuartal Target *
                  <TooltipWrapper
                    content={
                      lang === "ID"
                        ? "Periode berlakunya Objective ini. Secara otomatis diatur ke kuartal berjalan."
                        : "The period this Objective applies to. Automatically set to active quarter."
                    }
                  >
                    <Info className="size-3 text-slate-400" />
                  </TooltipWrapper>
                </label>
                <select
                  required
                  value={objQuarter}
                  onChange={(e) => setObjQuarter(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50"
                >
                  {(() => {
                    const year =
                      parseInt(
                        (systemConfig?.currentQuarter || "Q1 2026").split(
                          " ",
                        )[1],
                      ) || new Date().getFullYear();
                    const options = [];
                    for (let y = year - 1; y <= year + 1; y++) {
                      for (const q of ["Q1", "Q2", "Q3", "Q4"]) {
                        options.push(
                          <option key={`${q} ${y}`} value={`${q} ${y}`}>
                            {q} {y}
                          </option>,
                        );
                      }
                    }
                    return options;
                  })()}
                </select>
              </div>

              <div>
                <label className="block text-slate-705 mb-1 flex items-center gap-1.5">
                  {methodTerms.objectiveTitleLabel}
                  <TooltipWrapper
                    content={methodTerms.objectiveTitleTooltip}
                  >
                    <Info className="size-3 text-slate-400" />
                  </TooltipWrapper>
                </label>
                <textarea
                  required
                  rows={2}
                  value={objTitle}
                  onChange={(e) => setObjTitle(e.target.value)}
                  placeholder={methodTerms.objectiveTitlePlaceholder}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-705 mb-1">
                    Tingkat Sasaran
                  </label>
                  <select
                    value={objLevel}
                    onChange={(e) =>
                      setObjLevel(e.target.value as "company" | "circle")
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold text-slate-700"
                  >
                    <option value="company">🏢 Top Management</option>
                    <option value="circle">👥 Tim / Circle Lead</option>
                  </select>
                </div>

                {objLevel === "circle" && (
                  <>
                    <div>
                      <label className="block text-slate-700 mb-1">
                        Lingkaran Penanggung Jawab
                      </label>
                      <select
                        required
                        value={objCircleId}
                        onChange={(e) => setObjCircleId(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold text-slate-700"
                      >
                        <option value="">Pilih Circle...</option>
                        {circles.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.circleType === "cross_functional"
                              ? "🔄 "
                              : "🏢 "}
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1">
                        Approver {methodTermLabel} (Opsional)
                      </label>
                      <select
                        value={objApproverId}
                        onChange={(e) => setObjApproverId(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-600"
                      >
                        <option value="">Pilih Approver...</option>
                        {users?.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} - {u.department}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Pilih atasan jika Circle ini Lintas Fungsi atau beda
                        leader.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {objLevel === "circle" && (
                <div>
                  <label className="block text-slate-705 mb-1 flex items-center justify-between w-full">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="size-3.5 text-emerald-600" />
                      <span>Keselarasan Atas (Top-Down Alignment)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAlignmentInfo(true)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline flex items-center gap-0.5"
                    >
                      <Info className="size-3" />
                      {lang === "ID" ? "Apa ini?" : "What is this?"}
                    </button>
                  </label>
                  <select
                    value={objParentId}
                    onChange={(e) => setObjParentId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold text-slate-700 text-sm"
                  >
                    <option value="">Tidak ada (Standalone Objective)</option>
                    <optgroup label="🏢 Top Management (Company) Objectives">
                    {objectives
                      .filter((o) => o.level === "company")
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.title}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🎯 Top Management (Company) Key Results">
                    {keyResults
                      .filter((kr) => {
                        const obj = objectives.find(o => o.id === kr.objectiveId);
                        return obj && obj.level === "company";
                      })
                      .map((kr) => (
                        <option key={kr.id} value={kr.id}>
                          {kr.title} (KR)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="👥 Tim / Circle Objectives">
                    {objectives
                      .filter((o) => o.level === "circle")
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.title} (Circle: {circles.find(c => c.id === o.circleId)?.name || 'Unknown'})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🎯 Tim / Circle Key Results">
                    {keyResults
                      .filter((kr) => {
                        const obj = objectives.find(o => o.id === kr.objectiveId);
                        return obj && obj.level === "circle";
                      })
                      .map((kr) => {
                        const obj = objectives.find(o => o.id === kr.objectiveId);
                        return (
                          <option key={kr.id} value={kr.id}>
                            {kr.title} (Circle KR)
                          </option>
                        );
                      })}
                    </optgroup>
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddObjective(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 text-slate-500 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-900 border border-emerald-950 text-white rounded-xl font-bold"
                >
                  Simpan Objective
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/**********************************************************
       * MODAL: ADD KEY RESULT (MANAGEMENT)
       **********************************************************/}
      {showAddKeyResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-150 p-6 max-w-lg w-full shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="title-font font-black text-lg text-slate-800 flex items-center gap-2">
                <TrendingUp className="text-emerald-700 size-5" /> Daftarkan
                Target Key Result Baru
              </h3>
              <button
                onClick={() => setShowAddKeyResult(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateKeyResult}
              className="space-y-4 text-xs font-semibold text-slate-600"
            >
              <div>
                <label className="block text-slate-705 mb-1 flex items-center gap-1.5">
                  {methodTerms.keyResultParentLabel}
                  <TooltipWrapper
                    content={methodTerms.keyResultParentTooltip}
                  >
                    <Info className="size-3 text-slate-400" />
                  </TooltipWrapper>
                </label>
                <select
                  required
                  value={krObjectiveId}
                  onChange={(e) => setKrObjectiveId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-700 font-bold"
                >
                  <option value="">-- {lang === "ID" ? `Pilih ${methodTerms.objectiveLabel}` : `Select ${methodTerms.objectiveLabel}`} --</option>
                  {objectives.map((o) => (
                    <option key={o.id} value={o.id}>
                      [{o.level.toUpperCase()}] {o.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-750 mb-1 flex items-center gap-1.5">
                  {methodTerms.keyResultTitleLabel}
                  <TooltipWrapper
                    content={methodTerms.keyResultTitleTooltip}
                  >
                    <Info className="size-3 text-slate-400" />
                  </TooltipWrapper>
                </label>
                <textarea
                  required
                  rows={2}
                  value={krTitle}
                  onChange={(e) => setKrTitle(e.target.value)}
                  placeholder={methodTerms.keyResultTitlePlaceholder}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              {systemConfig?.questionnaires &&
                systemConfig.questionnaires.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-slate-705 mb-2 font-bold flex items-center gap-1">
                      <Sparkles className="size-3.5 text-purple-600" />
                      Smart Questionnaire Wizard (AI Classification)
                    </label>
                    <div className="space-y-3">
                      {systemConfig.questionnaires.map((q) => (
                        <div key={q.id} className="text-xs">
                          <p className="font-semibold text-slate-700 mb-1">
                            {q.question}
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setKrAnswers({ ...krAnswers, [q.id]: true })
                              }
                              className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                                krAnswers[q.id] === true
                                  ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                                  : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                              }`}
                            >
                              Ya
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setKrAnswers({ ...krAnswers, [q.id]: false })
                              }
                              className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                                krAnswers[q.id] === false
                                  ? "bg-rose-100 border-rose-300 text-rose-800"
                                  : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                              }`}
                            >
                              Tidak
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {(() => {
                      const answeredCount = Object.keys(krAnswers).length;
                      if (
                        answeredCount === systemConfig.questionnaires.length
                      ) {
                        let committedScore = 0;
                        let aspirationalScore = 0;
                        systemConfig.questionnaires.forEach((q) => {
                          const ans = krAnswers[q.id];
                          if (ans === true) {
                            if (q.yesCategory === "komitmen")
                              committedScore += q.yesScore;
                            else aspirationalScore += q.yesScore;
                          } else if (ans === false) {
                            if (q.noCategory === "komitmen")
                              committedScore += q.noScore;
                            else aspirationalScore += q.noScore;
                          }
                        });

                        const recommendedType =
                          aspirationalScore > committedScore
                            ? "aspirational"
                            : "committed";
                        const totalScore = committedScore + aspirationalScore;
                        const confidence =
                          totalScore > 0
                            ? Math.round(
                                (Math.max(committedScore, aspirationalScore) /
                                  totalScore) *
                                  100,
                              )
                            : 0;

                        return (
                          <div className="mt-4 bg-white border border-slate-150 rounded-lg p-3 text-xs leading-relaxed space-y-1.5 shadow-xxs">
                            <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded-sm">
                              <span className="font-bold text-slate-800">
                                Rekomendasi AI:{" "}
                                <span
                                  className={
                                    recommendedType === "aspirational"
                                      ? "text-purple-700 font-black"
                                      : "text-emerald-700 font-black"
                                  }
                                >
                                  {recommendedType === "aspirational"
                                    ? "✨ Aspirasional"
                                    : "🎯 Komitmen"}
                                </span>
                              </span>
                              <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-sm font-mono font-bold">
                                Confidence: {confidence}%
                              </span>
                            </div>
                            <p className="text-slate-650">
                              Komitmen Score:{" "}
                              <span className="font-bold">
                                {committedScore}
                              </span>{" "}
                              | Aspirasional Score:{" "}
                              <span className="font-bold">
                                {aspirationalScore}
                              </span>
                            </p>
                            <div className="flex justify-end mt-2">
                              <button
                                type="button"
                                onClick={() => setKrType(recommendedType)}
                                className="text-xs font-bold bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700"
                              >
                                Gunakan Rekomendasi
                              </button>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

              {activeMethod === "okr" ? (
                <div>
                  <label className="block text-slate-705 mb-1 flex items-center gap-1.5">
                    Tipe {methodTermLabel} (Keselarasan Governance) *
                    <TooltipWrapper
                      content={
                        lang === "ID"
                          ? "Tentukan apakah Key Result ini merupakan janji operasional mutlak (Commitment) atau target stretch inovatif yang menantang (Aspirational)."
                          : "Determine if this Key Result is an absolute operational promise (Commitment) or a challenging innovative stretch target (Aspirational)."
                      }
                    >
                      <Info className="size-3 text-slate-400" />
                    </TooltipWrapper>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setKrType("committed")}
                      className={`p-2.5 rounded-xl border font-bold text-center transition-all ${
                        krType === "committed"
                          ? "bg-emerald-900 border-emerald-950 text-white shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      🎯 Commitment
                    </button>
                    <button
                      type="button"
                      onClick={() => setKrType("aspirational")}
                      className={`p-2.5 rounded-xl border font-bold text-center transition-all ${
                        krType === "aspirational"
                          ? "bg-purple-900 border-purple-950 text-white shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      ✨ Aspirational
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-705 mb-1 flex items-center gap-1.5">
                      {lang === "ID" ? "Metode Kalkulasi *" : "Calculation Method *"}
                    </label>
                    <select
                      value={krCalcSystem}
                      onChange={(e) => setKrCalcSystem(e.target.value as "maximize" | "minimize" | "min_to_zero")}
                      className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-700"
                    >
                      <option value="maximize">Maximize (Lebih Tinggi Lebih Baik)</option>
                      <option value="minimize">Minimize (Lebih Rendah Lebih Baik)</option>
                      <option value="min_to_zero">Min to Zero (Target = 0)</option>
                    </select>
                  </div>
                  {krCalcSystem === "min_to_zero" && (
                    <div>
                      <label className="block text-slate-705 mb-1 flex items-center gap-1.5">
                        {lang === "ID" ? "Faktor Penalti (%) *" : "Penalty Factor (%) *"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={krPenaltyFactor}
                        onChange={(e) => setKrPenaltyFactor(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-705 mb-1 flex items-center gap-1.5">
                    Target Angka *
                    <TooltipWrapper
                      content={
                        lang === "ID"
                          ? "Nilai akhir yang harus dicapai agar Key Result dianggap tuntas."
                          : "The final value that must be reached for the Key Result to be complete."
                      }
                    >
                      <Info className="size-3 text-slate-400" />
                    </TooltipWrapper>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="85"
                    value={krTargetValue}
                    onChange={(e) => setKrTargetValue(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                  {krType === "aspirational" &&
                    Number(krTargetValue) >
                      (systemConfig?.notificationRules?.aspirational
                        ?.maxTargetRule || 0.7) && (
                      <div className="mt-1 text-[10px] text-amber-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="size-3" />{" "}
                        {systemConfig?.notificationRules?.aspirational
                          ?.maxTargetWarning || "Target belum ideal"}
                      </div>
                    )}
                </div>

                <div>
                  <label className="block text-slate-750 mb-1 flex items-center gap-1.5">
                    Mulai Aktual
                    <TooltipWrapper
                      content={
                        lang === "ID"
                          ? "Nilai awal sebelum Key Result dikerjakan (biasanya 0)."
                          : "Initial value before the Key Result is worked on (usually 0)."
                      }
                    >
                      <Info className="size-3 text-slate-400" />
                    </TooltipWrapper>
                  </label>
                  <input
                    type="number"
                    value={krCurrentValue}
                    onChange={(e) => setKrCurrentValue(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-slate-705 mb-1 flex items-center gap-1.5">
                    Satuan
                    <TooltipWrapper
                      content={
                        lang === "ID"
                          ? "Unit pengukuran, misalnya %, USD, Laporan, atau Rp."
                          : "Unit of measurement, e.g., %, USD, Reports, or Rp."
                      }
                    >
                      <Info className="size-3 text-slate-400" />
                    </TooltipWrapper>
                  </label>
                  <input
                    type="text"
                    placeholder="Biarkan kosong jika desimal"
                    value={krUnit}
                    onChange={(e) => setKrUnit(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-slate-705 mb-1 flex items-center gap-1.5">
                    Bobot (%) *
                    <TooltipWrapper
                      content={
                        lang === "ID"
                          ? "Seberapa besar dampak Key Result ini terhadap penyelesaian Objective induknya secara total."
                          : "How much impact this Key Result has on completing the parent Objective."
                      }
                    >
                      <Info className="size-3 text-slate-400" />
                    </TooltipWrapper>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    placeholder="100"
                    value={krWeight}
                    onChange={(e) => setKrWeight(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div>
                  <label className="block font-extrabold text-slate-800 text-xs mb-1 flex items-center gap-1.5">
                    Jenis Kepemilikan (Alignment Type)
                    <TooltipWrapper content="Memilih Shared OKR akan mengizinkan Anda menunjuk Co-Owners dengan porsi kontribusi. Dependency menandakan pencapaian KR ini bergantung pada hasil dari KR departemen/tim lain.">
                      <Info className="size-3 text-slate-400" />
                    </TooltipWrapper>
                  </label>
                  <p className="text-[10px] text-slate-450 mb-2">
                    Standard: Dikerjakan oleh 1 tim/individu. Shared: Target dipikul bersama (Co-owners). Dependency: Menunggu tim lain selesai (Estafet).
                  </p>
                  <select
                    value={krAlignmentType}
                    onChange={(e) => setKrAlignmentType(e.target.value as "standard" | "shared" | "dependency")}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-700"
                  >
                    <option value="standard">Standard (Dimiliki Satu Tim/Individu)</option>
                    <option value="shared">Shared OKR (Dimiliki Bersama / Co-owners)</option>
                    <option value="dependency">Dependency (Bergantung pada OKR Lain)</option>
                  </select>
                </div>

                {krAlignmentType === "dependency" && (
                  <div className="border-t pt-3">
                    <label className="block text-slate-705 mb-1 text-xs font-bold">Pilih OKR Induk (Dependency) *</label>
                    <select
                      value={krDependencyKrId}
                      onChange={(e) => setKrDependencyKrId(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-700 text-xs"
                    >
                      <option value="">-- Pilih OKR --</option>
                      {keyResults.filter(k => k.id !== krObjectiveId).map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.title} (Target: {k.targetValue} {k.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {krAlignmentType === "shared" && (
                  <div className="border-t pt-3 space-y-3 font-semibold">
                    <div className="flex justify-between items-center text-[10px] uppercase font-mono text-slate-500 font-bold">
                      <span>DAFTAR PORSI KONTRIBUSI KOORDINATOR</span>
                      <button
                        type="button"
                        onClick={addAssigneeRow}
                        className="text-emerald-800 hover:text-emerald-950 font-black"
                      >
                        + Tambah Peran
                      </button>
                    </div>

                    <div className="space-y-3">
                      {krAssignees.map((asg, idx) => (
                        <div
                          key={idx}
                          className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200"
                        >
                          <div className="flex-1 min-w-[120px]">
                            <label className="text-[9px] text-slate-400 font-mono uppercase block">
                              Circle
                            </label>
                            <select
                              required
                              value={asg.circleId}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...krAssignees];
                                updated[idx].circleId = val;
                                const circleRoles = roles.filter(
                                  (r) => r.circleId === val,
                                );
                                updated[idx].roleId = circleRoles[0]?.id || "";
                                setKrAssignees(updated);
                              }}
                              className="w-full border p-1 rounded text-xs bg-white text-slate-700"
                            >
                              <option value="">Pilih Circle...</option>
                              {circles.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex-1 min-w-[120px]">
                            <label className="text-[9px] text-slate-400 font-mono uppercase block">
                              Role
                            </label>
                            <select
                              required
                              value={asg.roleId}
                              onChange={(e) => {
                                const updated = [...krAssignees];
                                updated[idx].roleId = e.target.value;
                                setKrAssignees(updated);
                              }}
                              className="w-full border p-1 rounded text-xs bg-white text-slate-700"
                            >
                              <option value="">Pilih Peran...</option>
                              {roles
                                .filter((r) => r.circleId === asg.circleId)
                                .map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.title}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div className="w-[64px]">
                            <label className="text-[9px] text-slate-405 font-mono uppercase block">
                              Bobot %
                            </label>
                            <input
                              type="number"
                              required
                              max={100}
                              min={0}
                              value={asg.weightPercentage}
                              onChange={(e) => {
                                const updated = [...krAssignees];
                                updated[idx].weightPercentage = Number(
                                  e.target.value,
                                );
                                setKrAssignees(updated);
                              }}
                              className="w-full border p-1 rounded text-xs"
                            />
                          </div>

                          {krAssignees.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAssigneeRow(idx)}
                              className="text-red-500 hover:text-red-700 font-black text-xs pt-3"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] text-right text-slate-400 font-mono">
                      Akumulasi Bobot:{" "}
                      <strong
                        className={
                          krAssignees.reduce(
                            (acc, r) => acc + r.weightPercentage,
                            0,
                          ) === 100
                            ? "text-emerald-700"
                            : "text-rose-600"
                        }
                      >
                        {krAssignees.reduce(
                          (acc, r) => acc + r.weightPercentage,
                          0,
                        )}
                        %
                      </strong>{" "}
                      (Total wajib setara 100%)
                    </p>
                  </div>
                )}
              </div>

              {/* Task Row Inputs with fadd row (Add Task) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-slate-705 font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle className="size-3.5 text-emerald-700" />
                  {lang === "ID" ? `Daftar Task / Action Items ${methodTermLabel} Terkait` : `Associated Action Items / Tasks for this ${methodTermLabel}`}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDraftTaskDesc}
                    onChange={(e) => setNewDraftTaskDesc(e.target.value)}
                    placeholder={lang === "ID" ? "Tulis deskripsi task baru..." : "Write a new task description..."}
                    className="flex-1 border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newDraftTaskDesc.trim()) {
                          setKrTasks([...krTasks, { description: newDraftTaskDesc.trim(), status: "pending" }]);
                          setNewDraftTaskDesc("");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newDraftTaskDesc.trim()) {
                        setKrTasks([...krTasks, { description: newDraftTaskDesc.trim(), status: "pending" }]);
                        setNewDraftTaskDesc("");
                      }
                    }}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-black px-3 py-1.5 rounded-xl transition-all shrink-0"
                  >
                    {lang === "ID" ? "Tambah Task" : "Add Task"}
                  </button>
                </div>

                {krTasks.length > 0 && (
                  <div className="space-y-1.5 mt-2 bg-white p-2.5 rounded-xl border border-slate-100 max-h-[120px] overflow-y-auto shadow-inner">
                    {krTasks.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-slate-300" />
                          <span className="text-xs text-slate-700 font-medium">{t.description}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setKrTasks(krTasks.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-red-600 font-black text-[10px] p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddKeyResult(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 text-slate-500 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    krIsShared &&
                    krAssignees.reduce(
                      (acc, r) => acc + r.weightPercentage,
                      0,
                    ) !== 100
                  }
                  className="px-4 py-2 bg-emerald-900 border border-emerald-950 text-white rounded-xl font-bold disabled:bg-slate-350 disabled:text-slate-500"
                >
                  Terbitkan Key Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/**********************************************************
       * MODAL: EDIT OKR OBJECTIVE (MANAGEMENT ADM)
       **********************************************************/}
      {showEditObjective && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-150 p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="title-font font-black text-lg text-slate-800 flex items-center gap-2">
                <Target className="text-emerald-750 size-5" /> Ubah {methodTerms.objectiveLabel}
              </h3>
              <button
                onClick={() => setShowEditObjective(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleUpdateObjectiveSubmit}
              className="space-y-4 text-xs font-semibold text-slate-600"
            >
              <div>
                <label className="block text-slate-705 mb-1">
                  Kuartal Target *
                </label>
                <select
                  required
                  value={editObjQuarter}
                  onChange={(e) => setEditObjQuarter(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-sm"
                >
                  {(() => {
                    const year =
                      parseInt(
                        (systemConfig?.currentQuarter || "Q1 2026").split(
                          " ",
                        )[1],
                      ) || new Date().getFullYear();
                    const options = [];
                    for (let y = year - 1; y <= year + 1; y++) {
                      for (const q of ["Q1", "Q2", "Q3", "Q4"]) {
                        options.push(
                          <option key={`${q} ${y}`} value={`${q} ${y}`}>
                            {q} {y}
                          </option>,
                        );
                      }
                    }
                    return options;
                  })()}
                </select>
              </div>

              <div>
                <label className="block text-slate-705 mb-1">
                  {methodTerms.objectiveTitleLabel}
                </label>
                <textarea
                  required
                  rows={2}
                  value={editObjTitle}
                  onChange={(e) => setEditObjTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-705 mb-1">
                    Tingkat Sasaran
                  </label>
                  <select
                    value={editObjLevel}
                    onChange={(e) =>
                      setEditObjLevel(e.target.value as "company" | "circle")
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold text-slate-700"
                  >
                    <option value="company">🏢 Top Management</option>
                    <option value="circle">👥 Tim / Circle Lead</option>
                  </select>
                </div>

                {editObjLevel === "circle" && (
                  <>
                    <div>
                      <label className="block text-slate-705 mb-1">
                        Lingkaran Penanggung Jawab
                      </label>
                      <select
                        required
                        value={editObjCircleId}
                        onChange={(e) => setEditObjCircleId(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold text-slate-700"
                      >
                        <option value="">Pilih Circle...</option>
                        {circles.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.circleType === "cross_functional"
                              ? "🔄 "
                              : "🏢 "}
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-705 mb-1">
                        Approver {methodTermLabel} (Opsional)
                      </label>
                      <select
                        value={editObjApproverId}
                        onChange={(e) => setEditObjApproverId(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-600"
                      >
                        <option value="">Pilih Approver...</option>
                        {users?.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} - {u.department}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Pilih atasan jika Circle ini Lintas Fungsi atau beda
                        leader.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {editObjLevel === "circle" && (
                <div>
                  <label className="block text-slate-705 mb-1 flex items-center justify-between w-full">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="size-3.5 text-emerald-600" />
                      <span>Keselarasan Atas (Top-Down Alignment)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAlignmentInfo(true)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline flex items-center gap-0.5"
                    >
                      <Info className="size-3" />
                      {lang === "ID" ? "Apa ini?" : "What is this?"}
                    </button>
                  </label>
                  <select
                    value={editObjParentId}
                    onChange={(e) => setEditObjParentId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold text-slate-700 text-sm"
                  >
                    <option value="">Tidak ada (Standalone Objective)</option>
                    <optgroup label="🏢 Top Management (Company) Objectives">
                    {objectives
                      .filter((o) => o.level === "company" && o.id !== editObjId)
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.title}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🎯 Top Management (Company) Key Results">
                    {keyResults
                      .filter((kr) => {
                        const obj = objectives.find(o => o.id === kr.objectiveId);
                        return obj && obj.level === "company";
                      })
                      .map((kr) => (
                        <option key={kr.id} value={kr.id}>
                          {kr.title} (KR)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="👥 Tim / Circle Objectives">
                    {objectives
                      .filter((o) => o.level === "circle" && o.id !== editObjId)
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.title} (Circle: {circles.find(c => c.id === o.circleId)?.name || 'Unknown'})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🎯 Tim / Circle Key Results">
                    {keyResults
                      .filter((kr) => {
                        const obj = objectives.find(o => o.id === kr.objectiveId);
                        return obj && obj.level === "circle" && obj.id !== editObjId;
                      })
                      .map((kr) => {
                        const obj = objectives.find(o => o.id === kr.objectiveId);
                        return (
                          <option key={kr.id} value={kr.id}>
                            {kr.title} (Circle KR)
                          </option>
                        );
                      })}
                    </optgroup>
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditObjective(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 text-slate-500 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-900 border border-emerald-950 text-white rounded-xl font-bold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/**********************************************************
       * MODAL: EDIT KEY RESULT (MANAGEMENT ADM)
       **********************************************************/}
      {showEditKeyResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-150 p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="title-font font-black text-lg text-slate-800 flex items-center gap-2">
                <TrendingUp className="text-emerald-700 size-5" /> Ubah {methodTerms.keyResultLabel}
              </h3>
              <button
                onClick={() => setShowEditKeyResult(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleUpdateKeyResultSubmit}
              className="space-y-4 text-xs font-semibold text-slate-600"
            >
              <div>
                <label className="block text-slate-705 mb-1">
                  {methodTerms.keyResultTitleLabel}
                </label>
                <textarea
                  required
                  rows={2}
                  value={editKrTitle}
                  onChange={(e) => setEditKrTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              {activeMethod === "okr" ? (
                <div>
                  <label className="block text-slate-705 mb-1">
                    Tipe {methodTermLabel} (Keselarasan Governance) *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditKrType("committed")}
                      className={`p-2.5 rounded-xl border font-bold text-center transition-all ${
                        editKrType === "committed"
                          ? "bg-emerald-900 border-emerald-950 text-white shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      🎯 Commitment
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditKrType("aspirational")}
                      className={`p-2.5 rounded-xl border font-bold text-center transition-all ${
                        editKrType === "aspirational"
                          ? "bg-purple-900 border-purple-950 text-white shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      ✨ Aspirational
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-705 mb-1">
                      {lang === "ID" ? "Metode Kalkulasi *" : "Calculation Method *"}
                    </label>
                    <select
                      value={editKrCalcSystem}
                      onChange={(e) => setEditKrCalcSystem(e.target.value as "maximize" | "minimize" | "min_to_zero")}
                      className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-700"
                    >
                      <option value="maximize">Maximize (Lebih Tinggi Lebih Baik)</option>
                      <option value="minimize">Minimize (Lebih Rendah Lebih Baik)</option>
                      <option value="min_to_zero">Min to Zero (Target = 0)</option>
                    </select>
                  </div>
                  {editKrCalcSystem === "min_to_zero" && (
                    <div>
                      <label className="block text-slate-705 mb-1">
                        {lang === "ID" ? "Faktor Penalti (%) *" : "Penalty Factor (%) *"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={editKrPenaltyFactor}
                        onChange={(e) => setEditKrPenaltyFactor(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1">
                    Target Angka *
                  </label>
                  <input
                    type="number"
                    required
                    value={editKrTargetValue}
                    onChange={(e) => setEditKrTargetValue(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">
                    Realisasi Aktual *
                  </label>
                  <input
                    type="number"
                    required
                    value={editKrCurrentValue}
                    onChange={(e) => setEditKrCurrentValue(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    placeholder="Kosong = Desimal"
                    value={editKrUnit}
                    onChange={(e) => setEditKrUnit(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div>
                  <label className="block font-extrabold text-slate-800 text-xs mb-1 flex items-center gap-1.5">
                    Jenis Kepemilikan (Alignment Type)
                    <TooltipWrapper content="Memilih Shared OKR akan mengizinkan Anda menunjuk Co-Owners dengan porsi kontribusi. Dependency menandakan pencapaian KR ini bergantung pada hasil dari KR departemen/tim lain.">
                      <Info className="size-3 text-slate-400" />
                    </TooltipWrapper>
                  </label>
                  <p className="text-[10px] text-slate-450 mb-2">
                    Standard: Dikerjakan oleh 1 tim/individu. Shared: Target dipikul bersama (Co-owners). Dependency: Menunggu tim lain selesai (Estafet).
                  </p>
                  <select
                    value={editKrAlignmentType}
                    onChange={(e) => setEditKrAlignmentType(e.target.value as "standard" | "shared" | "dependency")}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-700"
                  >
                    <option value="standard">Standard (Dimiliki Satu Tim/Individu)</option>
                    <option value="shared">Shared OKR (Dimiliki Bersama / Co-owners)</option>
                    <option value="dependency">Dependency (Bergantung pada OKR Lain)</option>
                  </select>
                </div>

                {editKrAlignmentType === "dependency" && (
                  <div className="border-t pt-3">
                    <label className="block text-slate-705 mb-1 text-xs font-bold">Pilih OKR Induk (Dependency) *</label>
                    <select
                      value={editKrDependencyKrId}
                      onChange={(e) => setEditKrDependencyKrId(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-700 text-xs"
                    >
                      <option value="">-- Pilih OKR --</option>
                      {keyResults.filter(k => k.id !== editKrObjectiveId).map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.title} (Target: {k.targetValue} {k.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Edit Task Section with fadd row (Add Task) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-slate-705 font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle className="size-3.5 text-emerald-700" />
                  {lang === "ID" ? `Daftar Task / Action Items ${methodTermLabel} Terkait` : `Associated Action Items / Tasks for this ${methodTermLabel}`}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newEditDraftTaskDesc}
                    onChange={(e) => setNewEditDraftTaskDesc(e.target.value)}
                    placeholder={lang === "ID" ? "Tulis deskripsi task baru..." : "Write a new task description..."}
                    className="flex-1 border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newEditDraftTaskDesc.trim()) {
                          const newTaskObj = {
                            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                            description: newEditDraftTaskDesc.trim(),
                            status: "pending" as const
                          };
                          setEditKrTasks([...editKrTasks, newTaskObj]);
                          setNewEditDraftTaskDesc("");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newEditDraftTaskDesc.trim()) {
                        const newTaskObj = {
                          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                          description: newEditDraftTaskDesc.trim(),
                          status: "pending" as const
                        };
                        setEditKrTasks([...editKrTasks, newTaskObj]);
                        setNewEditDraftTaskDesc("");
                      }
                    }}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-black px-3 py-1.5 rounded-xl transition-all shrink-0"
                  >
                    {lang === "ID" ? "Tambah Task" : "Add Task"}
                  </button>
                </div>

                {editKrTasks.length > 0 && (
                  <div className="space-y-1.5 mt-2 bg-white p-2.5 rounded-xl border border-slate-100 max-h-[120px] overflow-y-auto shadow-inner">
                    {editKrTasks.map((t, idx) => (
                      <div key={t.id || idx} className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={t.status === "completed"}
                            onChange={(e) => {
                              const updated = [...editKrTasks];
                              updated[idx] = {
                                ...updated[idx],
                                status: e.target.checked ? "completed" as const : "pending" as const
                              };
                              setEditKrTasks(updated);
                            }}
                            className="rounded border-slate-300 text-emerald-650 focus:ring-emerald-500 font-bold size-3.5 cursor-pointer"
                          />
                          <span className={`text-xs text-slate-700 font-medium ${t.status === "completed" ? "line-through text-slate-400" : ""}`}>
                            {t.description}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditKrTasks(editKrTasks.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-red-600 font-black text-[10px] p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditKeyResult(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 text-slate-500 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-900 border border-emerald-950 text-white rounded-xl font-bold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TOP-DOWN ALIGNMENT METHODOLOGY GUIDE */}
      {showAlignmentInfo && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-150 p-6 max-w-2xl w-full shadow-2xl space-y-5 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-800">
                  <TrendingUp className="size-5 shrink-0" />
                </div>
                <h3 className="title-font font-black text-lg text-slate-800">
                  {lang === "ID"
                    ? "Metodologi Keselarasan Atas (Top-Down Alignment)"
                    : "Top-Down Alignment Methodology"}
                </h3>
              </div>
              <button
                onClick={() => setShowAlignmentInfo(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium text-slate-650 leading-relaxed">
              <p>
                {lang === "ID" ? (
                  <>
                    <strong>Keselarasan Atas (Top-Down Alignment)</strong>{" "}
                    adalah metode penyelarasan strategis yang memastikan semua
                    inisiatif, prioritas kerja, dan energi karyawan selaras
                    secara harmonis dari atas ke bawah. Pendekatan ini
                    menghubungkan target besar korporat langsung ke aktivitas
                    taktis harian tim fungsional dan kontributor individu.
                  </>
                ) : (
                  <>
                    <strong>Top-Down Alignment</strong> is a strategic alignment
                    methodology that ensures all initiatives, priorities, and
                    efforts flow harmoniously from the top corporate goals down
                    to team operations and individual contributors. This links
                    big-picture goals directly to day-to-day operations.
                  </>
                )}
              </p>

              {/* FLOW CHART SECTION */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-mono font-extrabold uppercase text-slate-400 block tracking-wider text-center">
                  {lang === "ID"
                    ? "STRUKTUR PROPAGASI TARGET"
                    : "TARGET PROPAGATION HIERARCHY"}
                </span>

                <div className="space-y-2">
                  {/* STEP 1: BOARD LEVEL */}
                  <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs flex items-center gap-3">
                    <div className="bg-indigo-100 text-indigo-700 p-2 rounded-lg shrink-0">
                      <Layers className="size-4.5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[9px] font-bold font-mono uppercase text-indigo-650 block">
                        Level 1: Board / Perusahaan
                      </span>
                      <strong className="text-slate-800 text-xs block">
                        Strategic Objectives (Kuartal Perusahaan)
                      </strong>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        {lang === "ID"
                          ? "Sasaran makro & peta jalan jangka panjang yang ditetapkan oleh manajemen tingkat atas."
                          : "Macro milestones and long-term roadmaps established by board-level executives."}
                      </p>
                    </div>
                  </div>

                  {/* ARROW */}
                  <div className="flex justify-center">
                    <ArrowRight className="size-4 text-slate-350 rotate-90 my-0.5" />
                  </div>

                  {/* STEP 2: CIRCLE LEVEL */}
                  <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs flex items-center gap-3">
                    <div className="bg-emerald-100 text-emerald-800 p-2 rounded-lg shrink-0">
                      <Target className="size-4.5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[9px] font-bold font-mono uppercase text-emerald-700 block">
                        Level 2: Team Circle / Departemen
                      </span>
                      <strong className="text-slate-800 text-xs block">
                        Tactical Objectives (Parent-Child Alignment)
                      </strong>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        {lang === "ID"
                          ? "Circle/tim menerjemahkan target makro menjadi sasaran taktis fungsional & menunjuk penanggung jawab."
                          : "Circles translate board-level targets into tactical department goals and assign accountability."}
                      </p>
                    </div>
                  </div>

                  {/* ARROW */}
                  <div className="flex justify-center">
                    <ArrowRight className="size-4 text-slate-350 rotate-90 my-0.5" />
                  </div>

                  {/* STEP 3: CONTRIBUTOR LEVEL */}
                  <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs flex items-center gap-3">
                    <div className="bg-amber-100 text-amber-800 p-2 rounded-lg shrink-0">
                      <Users className="size-4.5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[9px] font-bold font-mono uppercase text-amber-700 block">
                        Level 3: Kontributor Karyawan
                      </span>
                      <strong className="text-slate-800 text-xs block">
                        Key Results (Kuantitatif & Terukur)
                      </strong>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        {lang === "ID"
                          ? "Karyawan memegang kepemilikan Key Results spesifik untuk mengukur realisasi aktual target tim."
                          : "Individual contributors maintain measurable Key Results to track active performance in real-time."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* DETAILS AND DEFINITION OF OKR TYPES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-sky-50 border border-sky-150 rounded-2xl">
                  <div className="flex items-center gap-1.5 mb-1.5 text-sky-850">
                    <CheckCircle className="size-4 shrink-0" />
                    <strong className="text-xs font-bold font-mono uppercase">
                      Commitment {methodTermLabel}s
                    </strong>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    {lang === "ID"
                      ? "Komitmen operasional mutlak yang wajib dicapai 100%. Biasanya berupa pemeliharaan kualitas dasar, target minimum penjualan, atau SLA fungsional utama."
                      : "Absolute operational targets that must be achieved 100%. Usually covers essential core services, minimum baseline sales, or major SLA requirements."}
                  </p>
                </div>

                <div className="p-3.5 bg-purple-50 border border-purple-150 rounded-2xl">
                  <div className="flex items-center gap-1.5 mb-1.5 text-purple-850">
                    <Sparkles className="size-4 shrink-0" />
                    <strong className="text-xs font-bold font-mono uppercase">
                      Aspirational {methodTermLabel}s
                    </strong>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    {lang === "ID"
                      ? "Target stretch yang sangat menantang dan inovatif. Ambang batas keberhasilan diatur pada 70% pencapaian, mendorong kreativitas tanpa rasa takut akan kegagalan."
                      : "Highly ambitious, creative stretch targets. Success threshold is set at 70% completion, encouraging out-of-the-box thinking without fear of failure."}
                  </p>
                </div>
              </div>

              {/* PERBEDAAN ALIGNMENT TYPES */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 mt-4">
                <span className="text-[10px] font-mono font-extrabold uppercase text-slate-400 block tracking-wider text-center">
                  PERBEDAAN ISTILAH KESELARASAN
                </span>
                
                <div className="grid gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs">
                    <strong className="text-slate-800 text-xs flex items-center gap-1.5 mb-1">
                      <Target className="size-3.5 text-indigo-500" /> Keselarasan Atas (Top-Down Alignment)
                    </strong>
                    <p className="text-[10.5px] text-slate-600">
                      <strong>Level: Objective.</strong> Objective tim/individu mendukung Objective level di atasnya. Anda tetap membuat Objective Anda sendiri, tetapi secara hierarki berkontribusi ke atas. Progress Objective Induk akan mengambil rata-rata dari progress anak-anaknya.
                    </p>
                  </div>
                  
                  <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs">
                    <strong className="text-slate-800 text-xs flex items-center gap-1.5 mb-1">
                      <Users className="size-3.5 text-blue-500" /> Shared OKR (Co-owners)
                    </strong>
                    <p className="text-[10.5px] text-slate-600">
                      <strong>Level: Key Result.</strong> Satu Key Result dipikul dan dikerjakan bersama oleh 2 tim/individu atau lebih (Contoh: Tim Sales & Marketing). Saat di-update, progress otomatis berubah di semua dashboard tim terkait. (Analogi: Mengangkat satu meja bersama).
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs">
                    <strong className="text-slate-800 text-xs flex items-center gap-1.5 mb-1">
                      <Link className="size-3.5 text-orange-500" /> Dependency (Bergantung)
                    </strong>
                    <p className="text-[10.5px] text-slate-600">
                      <strong>Level: Key Result.</strong> Tim Anda harus menunggu output dari OKR tim lain. (Analogi: Lari estafet, menunggu tongkat dari pelari sebelumnya).
                    </p>
                  </div>
                </div>
              </div>

              {/* VALUE IN GOVERNMENT */}
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl flex gap-2">
                <Info className="size-4 text-emerald-800 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-0.5">
                    {lang === "ID"
                      ? "Mengapa Keselarasan Transparan Penting?"
                      : "Why Transparent Alignment Matters?"}
                  </h4>
                  <p className="text-[10.5px] text-slate-600">
                    {lang === "ID"
                      ? "Dalam tata kelola otonom Glassfrog, keterkaitan transparan ini mencegah silo departemen. Semua orang tahu persis mengapa mereka mengerjakan suatu tugas dan bagaimana tugas tersebut mendukung kemajuan perusahaan."
                      : "In Glassfrog autonomous governance, transparent linkages prevent department silos. Everyone knows exactly why they perform a task and how it drives company-wide milestones."}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAlignmentInfo(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all"
              >
                {lang === "ID"
                  ? "Mengerti, Terima Kasih!"
                  : "Understood, Thanks!"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
