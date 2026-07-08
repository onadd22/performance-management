import { SeedDataButton } from "./components/SeedDataButton";
import React, { useState, useEffect } from "react";
import { TooltipProvider } from "./components/TooltipContext";
import { 
  Circle, Role, User, RoleMember, Objective, KeyResult, 
  KeyResultAssignee, CheckInLog, ReviewCycle, PerformanceReview as ReviewType, SystemConfig 
} from "./types";
import { HRIS_API } from "./api";
import OrgStructure from "./components/OrgStructure";
import OkrDashboard from "./components/OkrDashboard";
import PerformanceReview from "./components/PerformanceReview";
import DevHub from "./components/DevHub";
import SettingsDashboard from "./components/SettingsDashboard";
import PerformanceConfig from "./components/PerformanceConfig";
import { MultiRater360Config } from "./components/MultiRater360Config";
import { Eval360App } from "./components/Eval360App";
import ApprovalDashboard from "./components/ApprovalDashboard";
import Talent9BoxApp from "./components/talent9box";
import { 
  Layers, Target, Calendar, ClipboardCheck, Terminal, 
  Sparkles, RefreshCw, AlertTriangle, CheckCircle, Users, FileText, BellRing
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"circles" | "okrs" | "reviews" | "approvals" | "eval360" | "eval360Form" | "dev" | "settings" | "perfConfig" | "talent9box">("circles");
  const [lang, setLang] = useState<"ID" | "EN">("ID");
  const [currentLoginUserId, setCurrentLoginUserId] = useState<string>("usr_hr_1");
  
  // App data states
  const [users, setUsers] = useState<User[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleMembers, setRoleMembers] = useState<RoleMember[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [keyResultAssignees, setKeyResultAssignees] = useState<KeyResultAssignee[]>([]);
  const [checkInLogs, setCheckInLogs] = useState<CheckInLog[]>([]);
  const [reviewCycles, setReviewCycles] = useState<ReviewCycle[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<ReviewType[]>([]);
  const [eval360Submissions, setEval360Submissions] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
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
    approvalWorkflow: ["atasan_langsung", "direksi"],
    eval360Templates: [
      {
        id: "template_1",
        name: "Template Evaluasi 360 Derajat Q1 2026",
        description: "Evaluasi kompetensi kepemimpinan dan kerjasama tim",
        questions: [
          { id: "q1", text: "Kemampuan memimpin tim dan memberikan arahan", category: "Leadership", weight: 50 },
          { id: "q2", text: "Komunikasi dan kerjasama antar departemen", category: "Teamwork", weight: 50 }
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
    ]
  });

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ message: string; type: "success" | "info" | null }>({ message: "", type: null });

  // Self-disappearing notification loader
  const triggerNotice = (message: string, type: "success" | "info" = "success") => {
    setNotice({ message, type });
    setTimeout(() => {
      setNotice({ message: "", type: null });
    }, 4500);
  };

  // Fetch full data bundle from server/API on boot
  const reloadData = async () => {
    try {
      setLoading(true);
      const [
        resUsers, resCircles, resRoles, resMembers, 
        resObjectives, resKRs, resKRAssignees, resLogs, 
        resCycles, resReviews, resEval360, resConfig
      ] = await Promise.all([
        HRIS_API.getUsers(),
        HRIS_API.getCircles(),
        HRIS_API.getRoles(),
        HRIS_API.getRoleMembers(),
        HRIS_API.getObjectives(),
        HRIS_API.getKeyResults(),
        HRIS_API.getKeyResultsAssignees(),
        HRIS_API.getCheckInLogs(),
        HRIS_API.getReviewCycles(),
        HRIS_API.getPerformanceReviews(),
        HRIS_API.getEval360Submissions(),
        HRIS_API.getSystemConfig()
      ]);

      setUsers(resUsers);
      setCircles(resCircles);
      setRoles(resRoles);
      setRoleMembers(resMembers);
      setObjectives(resObjectives);
      setKeyResults(resKRs);
      setKeyResultAssignees(resKRAssignees);
      setCheckInLogs(resLogs);
      setReviewCycles(resCycles);
      setPerformanceReviews(resReviews);
      setEval360Submissions(resEval360);
      setSystemConfig(resConfig);
    } catch (e) {
      console.error("Failed synchronizing data state", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Handler: Circle created
  const handleCircleAdded = async (newCircle: Circle) => {
    try {
      const added = await HRIS_API.createCircle(newCircle);
      setCircles(prev => [...prev, added]);
      triggerNotice(`Successfully created Circle: "${added.name}"`);
    } catch (e) {
      console.error(e);
      triggerNotice("Error creating Circle", "info");
    }
  };

  // Handler: Role created
  const handleRoleAdded = async (roleData: any) => {
    try {
      const result = await HRIS_API.createRole(roleData);
      // Backend automatically adds role and creates role relations
      // Reload is safest to pull accurate many-to-many linkages
      await reloadData();
      triggerNotice(`Successfully formed Accountability Role: "${result.title || "Custom Role"}"`);
    } catch (e) {
      console.error(e);
      triggerNotice("Error designing Role", "info");
    }
  };

  // Handler: Objective declared
  const handleObjectiveAdded = async (newObj: Objective) => {
    try {
      const added = await HRIS_API.createObjective(newObj);
      setObjectives(prev => [...prev, added]);
      triggerNotice(`Declared Target Objective: "${added.title}"`);
    } catch (e) {
      console.error(e);
      triggerNotice("Error saving Objective", "info");
    }
  };

  // Handler: Key Result appended with weights splits
  const handleKeyResultAdded = async (krData: any) => {
    try {
      const res = await HRIS_API.createKeyResult(krData);
      await reloadData();
      triggerNotice(`Published Key Result: "${res.keyResult?.title || "New Metric"}"`);
    } catch (e) {
      console.error(e);
      triggerNotice("Error registering metric Key Result", "info");
    }
  };

  // Handler: Progress check-in submitted (Automated weight calculations verified on backend!)
  const handleCheckInSubmitted = async (payload: any) => {
    try {
      const res = await HRIS_API.submitCheckIn(payload);
      
      const isPending = res.checkIn?.status === "pending";
      
      if (!isPending && res.updatedKeyResult) {
         const kr = res.updatedKeyResult;
         const obj = objectives.find(o => o.id === kr.objectiveId);
         if (obj) {
             const progressDec = kr.progress / 100;
             if (obj.okrType === "aspirational") {
                 if (progressDec < (systemConfig.notificationRules?.aspirational.achievementFailThreshold || 0.7)) {
                     setTimeout(() => triggerNotice(`[Aspirational] ${systemConfig.notificationRules?.aspirational.achievementFailWarning || "Target tidak tercapai"}`, "info"), 1500);
                 } else {
                     setTimeout(() => triggerNotice("[Aspirational] Status: Berhasil/Exceptional", "success"), 1500);
                 }
             } else {
                 if (progressDec >= (systemConfig.notificationRules?.committed.idealTargetRule || 1.0)) {
                     setTimeout(() => triggerNotice(`[Committed] ${systemConfig.notificationRules?.committed.successMessage || "Target tercapai"}`, "success"), 1500);
                 } else {
                     setTimeout(() => triggerNotice(`[Committed] ${systemConfig.notificationRules?.committed.failMessage || "Target belum tercapai"}`, "info"), 1500);
                 }
             }
         }
      }

      await reloadData();

      if (payload.hasBlocker) {
        triggerNotice(isPending 
          ? "Check-In diajukan! Menunggu persetujuan atasan & blocker berhasil ditag."
          : "Check-In logged! Locked dependency blocker flagged successfully.", "info");
      } else {
        triggerNotice(isPending
          ? "Pembaruan diajukan! Menunggu persetujuan dari atasan."
          : "Pembaruan berhasil disimpan secara langsung!", "success");
      }
    } catch (e) {
      console.error(e);
      triggerNotice("Error submitting status progress updating", "info");
    }
  };

  // Handler: Review/Approve a pending check-in
  const handleCheckInReviewed = async (id: string, payload: any) => {
    try {
      await HRIS_API.reviewCheckIn(id, payload);
      await reloadData();
      triggerNotice(payload.status === "approved"
        ? "Check-In disetujui! Pembaruan realisasi aktual telah masuk ke rekap akhir."
        : "Check-In ditolak! Pengajuan dinonaktifkan.", "success");
    } catch (e) {
      console.error(e);
      triggerNotice("Format persetujuan gagal diproses oleh server.", "info");
    }
  };

  const handleDeleteCheckIn = async (id: string) => {
    try {
      await HRIS_API.deleteCheckIn(id);
      await reloadData();
      triggerNotice("Log aktivitas berhasil dihapus.", "success");
    } catch (e) {
      console.error(e);
      triggerNotice("Gagal menghapus log.", "info");
    }
  };

  const handlePerformanceReviewUpdated = async (id: string, updates: any) => {
    try {
      const review = performanceReviews.find(r => r.id === id);
      if (review) {
        await HRIS_API.submitPerformanceReview({ ...review, ...updates });
        await reloadData();
        triggerNotice("Review updated successfully", "success");
      }
    } catch (e) {
      console.error(e);
      triggerNotice("Error updating review", "info");
    }
  };

  // Handler: Formal Performance review submitted
  const handleReviewSubmitted = async (reviewPayload: Partial<ReviewType>) => {
    try {
      const res = await HRIS_API.submitPerformanceReview(reviewPayload);
      await reloadData();
      
      const empName = users.find(u => u.id === reviewPayload.userId)?.name || "Employee";
      if (reviewPayload.status === "approved") {
        triggerNotice(`Approved and officially locked appraisal file for ${empName}`, "success");
      } else {
        triggerNotice(`Saved appraisal review spreadsheet draft for ${empName}`, "success");
      }
    } catch (e) {
      console.error(e);
      triggerNotice("Error saving performance cycle file", "info");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await HRIS_API.deletePerformanceReview(reviewId);
      await reloadData();
      triggerNotice("Evaluasi kinerja berhasil dihapus & direset", "success");
    } catch (e) {
      console.error(e);
      triggerNotice("Gagal menghapus evaluasi kinerja", "info");
    }
  };

  const handleUpdateUserRole = async (userId: string, roleId: string) => {
    try {
      await HRIS_API.updateUserRole(userId, roleId);
      await reloadData();
      triggerNotice("Role karyawan berhasil diperbarui", "success");
    } catch (e) {
      console.error(e);
      triggerNotice("Gagal memperbarui role karyawan", "info");
    }
  };

  const handleUpdateRolePermissions = async (permissions: any[]) => {
    try {
      await HRIS_API.updateRolePermissions(permissions);
      await reloadData();
      triggerNotice("Konfigurasi akses role berhasil disimpan", "success");
    } catch (e) {
      console.error(e);
      triggerNotice("Gagal menyimpan konfigurasi role", "info");
    }
  };

  const handleCircleUpdated = async (id: string, data: Partial<Circle>) => {
    try {
      await HRIS_API.updateCircle(id, data);
      await reloadData();
      triggerNotice(`Successfully updated Circle parameters!`);
    } catch (e) {
      console.error(e);
      triggerNotice("Failed updating circle, please try again", "info");
    }
  };

  const handleCircleDeleted = async (id: string) => {
    try {
      await HRIS_API.deleteCircle(id);
      await reloadData();
      triggerNotice(`Purged Circle and removed associated organizational links.`);
    } catch (e) {
      console.error(e);
      triggerNotice("Failed purging circle", "info");
    }
  };

  const handleRoleUpdated = async (id: string, roleData: any) => {
    try {
      await HRIS_API.updateRole(id, roleData);
      await reloadData();
      triggerNotice(`Formed and updated Accountability Role structure!`);
    } catch (e) {
      console.error(e);
      triggerNotice("Error editing role", "info");
    }
  };

  const handleRoleDeleted = async (id: string) => {
    try {
      await HRIS_API.deleteRole(id);
      await reloadData();
      triggerNotice(`Dissolved target role accountability successfully.`);
    } catch (e) {
      console.error(e);
      triggerNotice("Error dissolving role", "info");
    }
  };

  const handleObjectiveUpdated = async (id: string, objData: Partial<Objective>) => {
    try {
      await HRIS_API.updateObjective(id, objData);
      await reloadData();
      triggerNotice(`Updated Target Objective details!`);
    } catch (e) {
      console.error(e);
      triggerNotice("Error editing objective", "info");
    }
  };

  const handleObjectiveDeleted = async (id: string) => {
    try {
      await HRIS_API.deleteObjective(id);
      await reloadData();
      triggerNotice(`Removed target Objective and recycled aligned key results.`);
    } catch (e) {
      console.error(e);
      triggerNotice("Error deleting objective", "info");
    }
  };

  const handleKeyResultUpdated = async (id: string, krData: Partial<KeyResult>) => {
    try {
      await HRIS_API.updateKeyResult(id, krData);
      await reloadData();
      triggerNotice(`Updated Key Result constraints & metrics.`);
    } catch (e) {
      console.error(e);
      triggerNotice("Error editing key result", "info");
    }
  };

  const handleKeyResultDeleted = async (id: string) => {
    try {
      await HRIS_API.deleteKeyResult(id);
      await reloadData();
      triggerNotice(`Purged target Key Result successfully.`);
    } catch (e) {
      console.error(e);
      triggerNotice("Error deleting key result", "info");
    }
  };

  const handleConfigUpdated = async (configData: Partial<SystemConfig>) => {
    try {
      const config = await HRIS_API.updateSystemConfig(configData);
      setSystemConfig(config);
      triggerNotice(`Applied new Governance Configuration values!`, "success");
    } catch (e) {
      console.error(e);
      triggerNotice("Error scaling core settings", "info");
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="app-viewport">
      {/* Dynamic persistent Header card */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side brand banner link */}
            <div className="flex items-center gap-3">
              <div className="bg-emerald-900 text-white rounded-xl p-2 shadow-sm shrink-0">
                <Sparkles className="size-5 text-emerald-300" />
              </div>
              <div>
                <h1 className="title-font font-bold text-base md:text-lg text-slate-800 leading-tight">
                  Performance Management
                </h1>
              </div>
            </div>

            {/* Right side reload synchronization indicator and Language Toggle */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 border-r border-slate-200 pr-4">
                <span className="text-xs font-bold text-slate-500">Login As:</span>
                <select 
                  value={currentLoginUserId}
                  onChange={(e) => setCurrentLoginUserId(e.target.value)}
                  className="text-xs font-bold p-1 bg-slate-50 border border-slate-200 rounded-md text-slate-700 outline-hidden"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.systemRole || 'karyawan'})</option>
                  ))}
                </select>
              </div>

              {/* Language Selector */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-xs">
                <button
                  id="lang-select-id"
                  onClick={() => setLang("ID")}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                    lang === "ID"
                      ? "bg-emerald-850 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-850"
                  }`}
                >
                  ID
                </button>
                <button
                  id="lang-select-en"
                  onClick={() => setLang("EN")}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                    lang === "EN"
                      ? "bg-emerald-850 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-850"
                  }`}
                >
                  EN
                </button>
              </div>

              <button
                id="manual-resync-btn"
                onClick={reloadData}
                disabled={loading}
                title="Sinkronkan status memori dengan basis data backend"
                className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
              >
                <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
                <span>{lang === "ID" ? "Ambil Ulang" : "Sync DB"}</span>
              </button>

              <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span className="text-[10px] uppercase font-mono font-bold text-emerald-800">
                  {lang === "ID" ? "Tatakelola Aktif" : "Governance Live"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-px">
          {(() => {
            const assignments = systemConfig?.multiRater360Config?.evaluatorAssignments || [];
            const myAssignments = assignments.filter((a) => a.evaluatorId === currentLoginUserId);
            const pendingAssignmentsCount = myAssignments.filter(
              (assignment) => !eval360Submissions.some(
                (sub) => sub.evaluateeId === assignment.evaluateeId && sub.evaluatorId === currentLoginUserId
              )
            ).length;

            return (
              <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-100 pt-1 overflow-x-auto">
                {[
                  { id: "circles", label: lang === "ID" ? "Struktur Circle & Peran" : "Circles & Roles", icon: Layers },
                  { id: "okrs", label: lang === "ID" ? "Performance" : "Performance", icon: Target },
                  { id: "approvals", label: lang === "ID" ? "List Approval" : "Approval List", icon: CheckCircle },
                  { id: "eval360Form", label: lang === "ID" ? "Assessment 360" : "360 Assessment", icon: FileText },
                  { id: "reviews", label: lang === "ID" ? "Penilaian Kinerja" : "Performance Review", icon: ClipboardCheck },
                  { id: "perfConfig", label: lang === "ID" ? "Konfig Performance" : "Performance Config", icon: ClipboardCheck },
                  { id: "talent9box", label: lang === "ID" ? "Smart 9 Box" : "Smart 9 Box", icon: Users },
                  { id: "settings", label: lang === "ID" ? "Pengaturan Role & Akses" : "Settings", icon: Sparkles },
                  { id: "dev", label: lang === "ID" ? "Spesifikasi ERD & API" : "ERD & API Specs", icon: Terminal }
                ].filter(tab => {
                  const currentUser = users.find(u => u.id === currentLoginUserId);
                  const currentRolePerm = systemConfig?.rolePermissions?.find(rp => rp.id === currentUser?.systemRole) || 
                    systemConfig?.rolePermissions?.find(rp => rp.id === "karyawan");
                  const canManageOrgStructure = currentRolePerm?.canManageOrgStructure ?? false;
                  
                  if (tab.id === "settings") return canManageOrgStructure;
                  return true;
                }).map(tab => {
                  const TabIcon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const showBadge = tab.id === "eval360Form" && pendingAssignmentsCount > 0;

                  return (
                    <button
                      id={`tab-select-${tab.id}`}
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-3 py-3 text-xs md:text-sm font-semibold border-b-2 whitespace-nowrap transition-all outline-hidden relative ${
                        isActive
                          ? "border-emerald-800 text-emerald-900 bg-emerald-50/30 font-bold"
                          : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-350"
                      }`}
                    >
                      <TabIcon className={`size-4 ${isActive ? "text-emerald-700" : "text-slate-400"}`} />
                      <span>{tab.label}</span>
                      {showBadge && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white animate-pulse shadow-xs">
                          {pendingAssignmentsCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            );
          })()}
        </div>
      </header>

      {/* Floating Notice Popover banner */}
      {notice.message && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`p-4 rounded-xl shadow-lg border flex items-center gap-2.5 max-w-sm font-bold text-xs ${
            notice.type === "success" 
              ? "bg-emerald-900 border-emerald-950 text-white" 
              : "bg-blue-900 border-blue-950 text-white"
          }`}>
            {notice.type === "success" ? <CheckCircle className="size-4 text-emerald-300 shrink-0" /> : <AlertTriangle className="size-4 text-yellow-300 shrink-0" />}
            <span>{notice.message}</span>
          </div>
        </div>
      )}

      {/* Main Body view container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {(() => {
          const assignments = systemConfig?.multiRater360Config?.evaluatorAssignments || [];
          const myAssignments = assignments.filter((a) => a.evaluatorId === currentLoginUserId);
          const pendingAssignmentsCount = myAssignments.filter(
            (assignment) => !eval360Submissions.some(
              (sub) => sub.evaluateeId === assignment.evaluateeId && sub.evaluatorId === currentLoginUserId
            )
          ).length;

          if (pendingAssignmentsCount > 0 && activeTab !== "eval360Form") {
            return (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-3xs animate-fade-in mb-4">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 text-amber-700 p-2 rounded-xl mt-0.5 sm:mt-0">
                    <BellRing className="size-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black">
                      {lang === "ID" ? "Notifikasi Tugas Penilai (Multi-Rater 360)" : "Rater Task Notification (Multi-Rater 360)"}
                    </h4>
                    <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                      {lang === "ID"
                        ? `Anda ditugaskan menilai ${pendingAssignmentsCount} rekan kerja di sistem. Sebagai penilai, Anda mendapatkan notifikasi ini secara langsung.`
                        : `You are assigned to evaluate ${pendingAssignmentsCount} colleague(s) in the system. As an assigned rater, you receive this notification directly.`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("eval360Form")}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black px-4 py-2 rounded-xl transition-all shadow-xs shrink-0 w-full sm:w-auto text-center"
                >
                  {lang === "ID" ? "Mulai Menilai &rarr;" : "Start Assessment &rarr;"}
                </button>
              </div>
            );
          }
          return null;
        })()}

        {loading && circles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse">
            <RefreshCw className="size-10 text-emerald-700 animate-spin mb-3" />
            <span className="text-sm font-medium text-slate-500">{lang === "ID" ? "Mensinkronkan basis data tata kelola..." : "Synchronizing database states..."}</span>
            <span className="text-[10.5px] text-slate-400 font-mono mt-1">Menerapkan batasan relasional tata kelola Glassfrog</span>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeTab === "circles" && (
              <OrgStructure
                lang={lang}
                circles={circles}
                roles={roles}
                roleMembers={roleMembers}
                users={users}
                objectives={objectives}
                keyResults={keyResults}
                keyResultAssignees={keyResultAssignees}
                checkInLogs={checkInLogs}
                performanceReviews={performanceReviews}
                eval360Submissions={eval360Submissions}
                onCircleAdded={handleCircleAdded}
                onRoleAdded={handleRoleAdded}
                onCircleUpdated={handleCircleUpdated}
                onCircleDeleted={handleCircleDeleted}
                onRoleUpdated={handleRoleUpdated}
                onRoleDeleted={handleRoleDeleted}
                onObjectiveUpdated={handleObjectiveUpdated}
                onSyncData={reloadData}
                systemConfig={systemConfig}
                onConfigUpdated={handleConfigUpdated}
                currentLoginUserId={currentLoginUserId}
              />
            )}

            {activeTab === "okrs" && (
              <OkrDashboard
                lang={lang}
                circles={circles}
                roles={roles}
                objectives={objectives}
                keyResults={keyResults}
                keyResultAssignees={keyResultAssignees}
                onObjectiveAdded={handleObjectiveAdded}
                onKeyResultAdded={handleKeyResultAdded}
                onObjectiveUpdated={handleObjectiveUpdated}
                onObjectiveDeleted={handleObjectiveDeleted}
                onKeyResultUpdated={handleKeyResultUpdated}
                onKeyResultDeleted={handleKeyResultDeleted}
                systemConfig={systemConfig}
                onConfigUpdated={handleConfigUpdated}
                users={users}
                roleMembers={roleMembers}
                checkInLogs={checkInLogs}
                onCheckInSubmitted={handleCheckInSubmitted}
                onReviewCheckIn={handleCheckInReviewed}
                onDeleteCheckIn={handleDeleteCheckIn}
                currentLoginUserId={currentLoginUserId}
              />
            )}

            {activeTab === "approvals" && (
              <ApprovalDashboard
                users={users}
                currentUserId={currentLoginUserId}
                systemConfig={systemConfig}
                objectives={objectives}
                keyResults={keyResults}
                performanceReviews={performanceReviews}
                lang={lang}
                onUpdateObjective={handleObjectiveUpdated}
                onUpdateKeyResult={handleKeyResultUpdated}
                onUpdatePerformanceReview={handlePerformanceReviewUpdated}
              />
            )}

            {activeTab === "reviews" && (
              <PerformanceReview
                lang={lang}
                users={users}
                circles={circles}
                reviewCycles={reviewCycles}
                performanceReviews={performanceReviews}
                systemConfig={systemConfig}
                onUpdateSystemConfig={handleConfigUpdated}
                objectives={objectives}
                keyResults={keyResults}
                keyResultAssignees={keyResultAssignees}
                roles={roles}
                roleMembers={roleMembers}
                eval360Submissions={eval360Submissions}
                onReviewSubmitted={handleReviewSubmitted}
                onDeleteReview={handleDeleteReview}
              />
            )}

            {activeTab === "perfConfig" && (
              <PerformanceConfig
                systemConfig={systemConfig}
                onUpdateSystemConfig={handleConfigUpdated}
                users={users}
                roles={roles}
                circles={circles}
                eval360Submissions={eval360Submissions}
                performanceReviews={performanceReviews}
                lang={lang}
              />
            )}

            {activeTab === "eval360Form" && (
              <Eval360App
                currentLoginUserId={currentLoginUserId}
                systemConfig={systemConfig}
                onUpdateSystemConfig={handleConfigUpdated}
                users={users}
                circles={circles}
                roles={roles}
                eval360Submissions={eval360Submissions}
                onSubmitEval360={async (data) => {
                  try {
                    const saved = await HRIS_API.submitEval360Submission(data);
                    setEval360Submissions(prev => [...prev, saved]);
                  } catch (e) {
                    console.error("Failed to submit eval 360", e);
                    throw e;
                  }
                }}
                lang={lang}
              />
            )}

            {activeTab === "dev" && <DevHub />}
            
            {activeTab === "talent9box" && <Talent9BoxApp lang={lang} systemConfig={systemConfig} onUpdateSystemConfig={handleConfigUpdated} />}

            {activeTab === "settings" && (
              <SettingsDashboard
                users={users}
                systemConfig={systemConfig}
                onUpdateUserRole={handleUpdateUserRole}
                onUpdateRolePermissions={handleUpdateRolePermissions}
                onUpdateSystemConfig={handleConfigUpdated}
              />
            )}
          </div>
        )}
      </main>

      {/* Humble Footer section */}
      <SeedDataButton />
      <footer className="bg-white border-t border-slate-150 py-5">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-1">
          <p className="text-slate-400 text-[10px] font-mono">
            Modul Manajemen Kinerja HRIS &copy; 2026 Operasional Perusahaan. Terinspirasi oleh prinsip-prinsip Holakrasi Glassfrog.
          </p>
          <p className="text-slate-300 text-[9px] font-mono">
            Teknologi: React 19 • Express 4 RESTful Services • Orkestrasi Pembagian Kontribusi Dinamis • db.json Terserialisasi
          </p>
        </div>
      </footer>
    </div>
    </TooltipProvider>
  );
}
