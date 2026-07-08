import React, { useState } from "react";
import { User, Circle, Role, RoleMember, Objective, KeyResult, KeyResultAssignee, SystemConfig } from "../types";
import { 
  Users, Shield, ArrowRight, Sparkles, Search, ChevronRight, ChevronDown, 
  FolderTree, Kanban, UserCheck, AlertCircle, Save, CheckCircle,
  Award, Target, HelpCircle, ArrowUpRight, TrendingUp, Clock, AlertTriangle, Info, Brain, CheckSquare, Star
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { HRIS_API } from "../api";

interface EmployeeStructureProps {
  lang: "ID" | "EN";
  users: User[];
  circles: Circle[];
  roles: Role[];
  roleMembers: RoleMember[];
  objectives: Objective[];
  keyResults: KeyResult[];
  keyResultAssignees: KeyResultAssignee[];
  performanceReviews?: any[];
  eval360Submissions?: any[];
  systemConfig?: SystemConfig;
  onSyncData?: () => Promise<void>;
}

export default function EmployeeStructure({
  lang,
  users,
  circles,
  roles,
  roleMembers,
  objectives,
  keyResults,
  keyResultAssignees,
  performanceReviews = [],
  eval360Submissions = [],
  systemConfig,
  onSyncData
}: EmployeeStructureProps) {
  const [layoutMode, setLayoutMode] = useState<"tree" | "list">("tree");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [collapsedEmployeeIds, setCollapsedEmployeeIds] = useState<string[]>([]);
  const [isSavingManager, setIsSavingManager] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState<"structure" | "performance" | "eval360" | "talent9box">("structure");

  // Helper: Calculate Performance & Potential metrics for 9-Box mapping & integration
  const getEmployeeMetrics = (userId: string) => {
    const savedReview = performanceReviews.find(r => r.userId === userId);
    
    // Calculate raw OKR progress as performance
    const progress = calculateEmployeeProgress(userId) || 0;
    const hasPerfData = progress > 0;
    
    // Potential Score from Assessment 360
    const user360s = eval360Submissions.filter(s => s.evaluateeId === userId && s.status === "submitted");
    let calculatedPotScore = 70; // baseline
    let hasPotData = false;
    if (user360s.length > 0) {
      let totalScore = 0;
      let count = 0;
      user360s.forEach(sub => {
        if (sub.answers && Array.isArray(sub.answers)) {
          sub.answers.forEach((ans: any) => {
            totalScore += ans.score || 0;
            count++;
          });
        }
      });
      if (count > 0) {
        calculatedPotScore = Math.round((totalScore / count) * 20); // convert 1-5 to 0-100 scale
        hasPotData = true;
      }
    } else {
      const userObj = users.find(u => u.id === userId);
      const name = userObj ? userObj.name : "";
      const charSum = name.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
      calculatedPotScore = 55 + (charSum % 36); // baseline hash-based fallback (55 - 91 range)
    }

    // Determine performance tier (Low, Med, High)
    const perfTier = progress < 70 ? "Low" : progress < 85 ? "Medium" : "High";
    const potTier = calculatedPotScore < 70 ? "Low" : calculatedPotScore < 85 ? "Medium" : "High";

    // 9-Box mapping
    let boxNumber = 1;
    let boxName = lang === "ID" ? "Risk / Underperformer" : "Risk / Underperformer";
    let boxDesc = "";

    if (potTier === "Low") {
      if (perfTier === "Low") {
        boxNumber = 1;
        boxName = lang === "ID" ? "Risk / Underperformer" : "Risk / Underperformer";
        boxDesc = lang === "ID" ? "Kinerja dan potensi rendah. Butuh pembinaan intensif atau program peningkatan kinerja (PIP)." : "Low performance and potential. Requires coaching or a Performance Improvement Plan (PIP).";
      } else if (perfTier === "Medium") {
        boxNumber = 4;
        boxName = lang === "ID" ? "Solid Performer" : "Solid Performer";
        boxDesc = lang === "ID" ? "Kinerja cukup baik namun ruang pertumbuhan potensial terbatas. Jaga motivasi agar tetap stabil." : "Good performance but limited potential growth. Maintain stable motivation.";
      } else {
        boxNumber = 7;
        boxName = lang === "ID" ? "High Performer / Workhorse" : "High Performer / Workhorse";
        boxDesc = lang === "ID" ? "Karyawan andalan yang bekerja sangat luar biasa namun potensi rotasi kepemimpinan terbatas." : "Reliable worker with outstanding performance but limited leadership rotation potential.";
      }
    } else if (potTier === "Medium") {
      if (perfTier === "Low") {
        boxNumber = 2;
        boxName = lang === "ID" ? "Dilemma / Up or Out" : "Dilemma / Up or Out";
        boxDesc = lang === "ID" ? "Punya potensi untuk berkembang tetapi produktivitas kinerja saat ini belum optimal." : "Has potential to grow but current performance is suboptimal.";
      } else if (perfTier === "Medium") {
        boxNumber = 5;
        boxName = lang === "ID" ? "Key Player / Core Performer" : "Key Player / Core Performer";
        boxDesc = lang === "ID" ? "Karyawan inti organisasi dengan kontribusi hasil kerja dan potensi yang stabil." : "Core organization employee with stable performance and development potential.";
      } else {
        boxNumber = 8;
        boxName = lang === "ID" ? "High Performer / High Achiever" : "High Performer / High Achiever";
        boxDesc = lang === "ID" ? "Hasil kerja luar biasa konsisten dengan kesiapan adaptasi peran kepemimpinan masa depan." : "Outstanding performance with high readiness for future leadership adaptation.";
      }
    } else {
      if (perfTier === "Low") {
        boxNumber = 3;
        boxName = lang === "ID" ? "Enigma / High Potential Underperformer" : "Enigma / High Potential Underperformer";
        boxDesc = lang === "ID" ? "Memiliki kapasitas kognitif & kepemimpinan tinggi, namun hasil kinerjanya belum terlihat nyata." : "High cognitive & leadership potential but current work outputs are not yet visible.";
      } else if (perfTier === "Medium") {
        boxNumber = 6;
        boxName = lang === "ID" ? "High Potential / Growth Player" : "High Potential / Growth Player";
        boxDesc = lang === "ID" ? "Menunjukkan kemampuan kepemimpinan dan adaptabilitas kuat dengan hasil kerja stabil." : "Shows strong leadership and adaptability with stable, solid deliverables.";
      } else {
        boxNumber = 9;
        boxName = lang === "ID" ? "Star Player / High Flyer" : "Star Player / High Flyer";
        boxDesc = lang === "ID" ? "Karyawan bintang dengan kinerja tertinggi serta potensi suksesi kepemimpinan paling siap." : "Star player with top-tier performance and ready for immediate leadership succession.";
      }
    }

    return {
      progress,
      hasPerfData,
      calculatedPotScore,
      hasPotData,
      boxNumber,
      boxName,
      boxDesc,
      perfTier,
      potTier,
      savedReview
    };
  };

  // Helper: Find all roles/positions held by a user
  const getUserRoles = (userId: string): Role[] => {
    const userRms = roleMembers.filter(rm => rm.userId === userId);
    return userRms.map(rm => roles.find(r => r.id === rm.roleId)).filter(Boolean) as Role[];
  };

  // Helper: Determine reporting line supervisor (manager)
  const getEmployeeManager = (employee: User): User | null => {
    if (employee.managerId) {
      const direct = users.find(u => u.id === employee.managerId);
      if (direct) return direct;
    }

    // Holacracy fallback based on role & circle leads
    const userRoles = getUserRoles(employee.id);
    for (const r of userRoles) {
      const circle = circles.find(c => c.id === r.circleId);
      if (circle) {
        if (circle.leadId && circle.leadId !== employee.id) {
          const lead = users.find(u => u.id === circle.leadId);
          if (lead) return lead;
        }
        if (circle.subCircleOfId) {
          const parentCircle = circles.find(c => c.id === circle.subCircleOfId);
          if (parentCircle && parentCircle.leadId && parentCircle.leadId !== employee.id) {
            const parentLead = users.find(u => u.id === parentCircle.leadId);
            if (parentLead) return parentLead;
          }
        }
      }
    }

    // Top-level fallback for non-directors
    if (employee.systemRole !== "direksi") {
      const direksiUser = users.find(u => u.systemRole === "direksi");
      if (direksiUser && direksiUser.id !== employee.id) {
        return direksiUser;
      }
    }

    return null;
  };

  // Helper: Calculate average OKR progress of roles held by user
  const calculateEmployeeProgress = (userId: string): number | null => {
    const userRoles = getUserRoles(userId);
    const roleIds = userRoles.map(r => r.id);
    const assignees = keyResultAssignees.filter(kra => kra.roleId && roleIds.includes(kra.roleId));
    if (assignees.length === 0) return null;
    const total = assignees.reduce((sum, a) => sum + a.currentProgress, 0);
    return Math.round(total / assignees.length);
  };

  // Prevent circular reporting lines
  const getPotentialManagers = (user: User): User[] => {
    const isSubordinate = (potentialId: string, currentId: string): boolean => {
      const potential = users.find(u => u.id === potentialId);
      if (!potential) return false;
      const mgr = getEmployeeManager(potential);
      if (!mgr) return false;
      if (mgr.id === currentId) return true;
      return isSubordinate(mgr.id, currentId);
    };

    return users.filter(u => u.id !== user.id && !isSubordinate(u.id, user.id));
  };

  const handleUpdateManager = async (employeeId: string, newManagerId: string) => {
    try {
      setIsSavingManager(true);
      setSaveSuccess(false);
      await HRIS_API.updateUser(employeeId, { 
        managerId: newManagerId === "none" ? "none" : newManagerId 
      });
      if (onSyncData) {
        await onSyncData();
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      
      // Update local state if needed
      if (selectedEmployee && selectedEmployee.id === employeeId) {
        setSelectedEmployee({
          ...selectedEmployee,
          managerId: newManagerId === "none" ? undefined : newManagerId
        });
      }
    } catch (err) {
      console.error("Gagal mengubah atasan langsung", err);
      alert(lang === "ID" ? "Gagal memperbarui atasan langsung." : "Failed to update supervisor.");
    } finally {
      setIsSavingManager(false);
    }
  };

  const toggleEmployeeCollapse = (employeeId: string) => {
    if (collapsedEmployeeIds.includes(employeeId)) {
      setCollapsedEmployeeIds(collapsedEmployeeIds.filter(id => id !== employeeId));
    } else {
      setCollapsedEmployeeIds([...collapsedEmployeeIds, employeeId]);
    }
  };

  // Build recursive representation for tree layout
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchesUser = user.name.toLowerCase().includes(q) || 
                        user.email.toLowerCase().includes(q) || 
                        user.department.toLowerCase().includes(q);
    const matchesRole = getUserRoles(user.id).some(r => r.title.toLowerCase().includes(q));
    return matchesUser || matchesRole;
  });

  // Root employees have no manager, or their manager is not in the filtered/active user list, or they are directors
  const rootEmployees = users.filter(u => {
    const mgr = getEmployeeManager(u);
    // If we have a search query, show matched items as list/flat nodes or roots
    if (searchQuery) {
      return filteredUsers.some(fu => fu.id === u.id);
    }
    return !mgr || !users.some(item => item.id === mgr.id);
  });

  // Recursive Tree Node Renderer
  const renderEmployeeNode = (employee: User, depth: number = 0) => {
    const subordinates = users.filter(u => {
      const mgr = getEmployeeManager(u);
      return mgr?.id === employee.id;
    });

    const isCollapsed = collapsedEmployeeIds.includes(employee.id);
    const employeeRoles = getUserRoles(employee.id);
    const progress = calculateEmployeeProgress(employee.id);
    const isMatched = filteredUsers.some(fu => fu.id === employee.id);

    if (searchQuery && !isMatched) return null;

    return (
      <div key={employee.id} className="relative pl-5 sm:pl-7 my-3 border-l-2 border-dashed border-slate-150/90 last:border-transparent">
        {/* Branch connector visual line */}
        <div className="absolute top-7 left-0 w-5 sm:w-7 border-t-2 border-dashed border-slate-150/90"></div>
        
        {/* Card wrapper */}
        <motion.div 
          layout
          onClick={() => setSelectedEmployee(employee)}
          className={`relative bg-white hover:bg-slate-50 border rounded-2xl p-4 shadow-xxs cursor-pointer transition-all duration-200 max-w-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            selectedEmployee?.id === employee.id
              ? "border-emerald-600 ring-4 ring-emerald-50/70"
              : "border-slate-100 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <img
                referrerPolicy="no-referrer"
                src={employee.avatar}
                alt={employee.name}
                className="size-12 rounded-full object-cover border border-slate-200 shadow-xxs"
              />
              <span className={`absolute -bottom-1 -right-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border border-white text-white shadow-xxs ${
                employee.systemRole === "direksi"
                  ? "bg-purple-600"
                  : employee.systemRole === "atasan_langsung"
                  ? "bg-blue-600"
                  : "bg-slate-500"
              }`}>
                {employee.systemRole === "direksi" ? "Dir" : employee.systemRole === "atasan_langsung" ? "Lead" : "Staff"}
              </span>
            </div>
            
            <div className="min-w-0">
              <div className="font-extrabold text-slate-800 text-sm flex items-center gap-2 flex-wrap">
                <span className="truncate">{employee.name}</span>
                {subordinates.length > 0 && !searchQuery && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEmployeeCollapse(employee.id);
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-lg text-[9px] flex items-center gap-1 transition-colors font-black border border-emerald-100"
                    title={isCollapsed ? "Expand team" : "Collapse team"}
                  >
                    {isCollapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
                    <span>{subordinates.length} {lang === "ID" ? "Bawahan" : "Reports"}</span>
                  </button>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="font-bold text-slate-500">{employee.department}</span>
                <span>•</span>
                <span className="truncate">{employee.email}</span>
              </div>
              
              {/* List of multiple positions held */}
              <div className="flex flex-wrap gap-1 mt-2.5">
                {employeeRoles.length === 0 ? (
                  <span className="text-[9px] text-slate-400 italic font-medium">
                    {lang === "ID" ? "Belum Memegang Peran" : "No Roles Assigned"}
                  </span>
                ) : (
                  employeeRoles.map(role => {
                    const circle = circles.find(c => c.id === role.circleId);
                    return (
                      <span 
                        key={role.id} 
                        className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-150/70 inline-flex items-center gap-1 shrink-0"
                        title={role.description}
                      >
                        🛡️ {role.title} <span className="text-[8px] text-teal-600/80 font-bold">@{circle?.name || "Circle"}</span>
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* KPI/Progress indicator card */}
          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
            {progress !== null ? (
              <div className="text-right">
                <span className="text-[8.5px] uppercase font-mono text-slate-400 font-black block leading-none">RATA OKR</span>
                <span className={`text-sm font-black block mt-0.5 ${
                  progress >= 85 ? "text-emerald-600" : progress >= 70 ? "text-blue-600" : "text-amber-600"
                }`}>{progress}%</span>
              </div>
            ) : (
              <div className="text-right">
                <span className="text-[8.5px] uppercase font-mono text-slate-400 font-black block leading-none">RATA OKR</span>
                <span className="text-xs font-semibold text-slate-400 block mt-0.5">-</span>
              </div>
            )}
            <ChevronRight className="size-4 text-slate-400 shrink-0" />
          </div>
        </motion.div>

        {/* Nested subordinate nodes */}
        {subordinates.length > 0 && !isCollapsed && !searchQuery && (
          <div className="relative pl-1">
            {subordinates.map(sub => renderEmployeeNode(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="employee-structure-parent">
      {/* Sidebar Employee Directory Navigator */}
      <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <FolderTree className="text-teal-600 size-5" />
            <h3 className="title-font font-bold text-base text-slate-800">
              {lang === "ID" ? "Hierarki Pelaporan Karyawan" : "Employee Reporting Hierarchy"}
            </h3>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg self-stretch sm:self-auto justify-center">
            <button
              onClick={() => setLayoutMode("tree")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                layoutMode === "tree"
                  ? "bg-white text-emerald-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <FolderTree className="size-3.5" />
              {lang === "ID" ? "Tampilan Pohon (Tree)" : "Tree View"}
            </button>
            <button
              onClick={() => setLayoutMode("list")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                layoutMode === "list"
                  ? "bg-white text-emerald-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <Kanban className="size-3.5" />
              {lang === "ID" ? "Tampilan Kartu (Grid)" : "Grid View"}
            </button>
          </div>
        </div>

        {/* Global filter query */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="size-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder={lang === "ID" ? "Cari nama karyawan, email, departemen atau jabatan..." : "Search employee name, email, department or role title..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-700"
          />
        </div>

        {/* Informative educational callout */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 text-xs text-slate-600 space-y-4 shadow-3xs">
          <div className="flex items-start gap-3">
            <Sparkles className="size-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-1">
                {lang === "ID" ? "Panduan Tata Kelola & Perhitungan Peran Ganda" : "Governance Guide & Multi-Role Calculation"}
              </h4>
              <p className="leading-relaxed">
                {lang === "ID"
                  ? "Sistem ini mendukung fungsionalitas struktur organisasi modern seperti di GlassFrog (Holakrasi). Setiap karyawan tidak terikat pada satu jabatan kaku, melainkan dapat menjabat beberapa peran (Roles) sekaligus di dalam satu atau beberapa Sektor (Circles) yang berbeda sesuai kebutuhan taktis operasional perusahaan."
                  : "This system supports modern organizational structures similar to GlassFrog (Holacracy). Employees are not locked into a single rigid job title, but can hold multiple Roles across different Circles based on operational needs."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200/60 text-[11px] leading-relaxed text-slate-500">
            <div className="space-y-1.5">
              <span className="font-extrabold text-slate-700 block">
                {lang === "ID" ? "🔗 Jalur Pelaporan (Atasan langsung)" : "🔗 Reporting Lines (Direct Supervisors)"}
              </span>
              <ul className="list-disc pl-4 space-y-1">
                {lang === "ID" ? (
                  <>
                    <li><strong>Sistem Otomatis (Default):</strong> Ditentukan oleh <strong>Sektor Lead Link (VP/Manager)</strong> dari Circle tempat fungsional peran Anda berada.</li>
                    <li><strong>Manual Override:</strong> Admin/HRD dapat menentukan atasan khusus secara manual melalui panel sebelah kanan untuk menyesuaikan dengan garis komando taktis di luar organisasi holakrasi.</li>
                  </>
                ) : (
                  <>
                    <li><strong>Auto-System (Default):</strong> Mapped based on the <strong>Sektor Lead Link (VP/Manager)</strong> of the circle in which your functional roles reside.</li>
                    <li><strong>Manual Override:</strong> Admin or HR can manually assign a specific supervisor using the inspector panel on the right to match tactical command needs.</li>
                  </>
                )}
              </ul>
            </div>

            <div className="space-y-1.5">
              <span className="font-extrabold text-slate-700 block">
                {lang === "ID" ? "🧮 Rumus Rata-rata Progres OKR Peran Ganda" : "🧮 Multi-Role OKR Progress Formula"}
              </span>
              <div className="bg-white p-2.5 rounded-lg border border-slate-150 font-mono text-[10px] text-slate-650 space-y-1">
                <span className="font-bold text-teal-700 block">Rata-rata OKR Karyawan = </span>
                <span className="block text-slate-700">∑(Progres OKR Peran yang Dipegang) ÷ Jumlah Peran Aktif</span>
                <p className="text-[9px] text-slate-400 font-sans italic mt-1 leading-normal">
                  {lang === "ID"
                    ? "Contoh: Jika Anda memegang Peran A (OKR 80%) dan Peran B (OKR 60%), nilai progres agregat Anda adalah (80 + 60) / 2 = 70%."
                    : "Example: If you hold Role A (OKR 80%) and Role B (OKR 60%), your aggregated progress is (80 + 60) / 2 = 70%."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Employee rendering content container */}
        <div className="max-h-[650px] overflow-y-auto pr-1">
          {layoutMode === "tree" ? (
            <div className="space-y-4">
              {rootEmployees.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
                  <Users className="mx-auto text-slate-300 mb-2 size-10" />
                  <p className="text-slate-400 text-xs font-semibold">
                    {lang === "ID" ? "Tidak ditemukan data karyawan." : "No employees found."}
                  </p>
                </div>
              ) : (
                rootEmployees.map(root => renderEmployeeNode(root))
              )}
            </div>
          ) : (
            /* Flat grid lists */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUsers.length === 0 ? (
                <div className="col-span-2 text-center py-12 border border-dashed border-slate-200 rounded-xl">
                  <Users className="mx-auto text-slate-300 mb-2 size-10" />
                  <p className="text-slate-400 text-xs font-semibold">
                    {lang === "ID" ? "Tidak ada kecocokan data." : "No matches found."}
                  </p>
                </div>
              ) : (
                filteredUsers.map(user => {
                  const manager = getEmployeeManager(user);
                  const userRoles = getUserRoles(user.id);
                  const progress = calculateEmployeeProgress(user.id);

                  return (
                    <div
                      key={user.id}
                      onClick={() => setSelectedEmployee(user)}
                      className={`bg-white hover:bg-slate-50 border rounded-xl p-4 shadow-xxs cursor-pointer transition-all duration-200 flex flex-col justify-between gap-4 ${
                        selectedEmployee?.id === user.id
                          ? "border-teal-600 ring-4 ring-teal-50"
                          : "border-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          referrerPolicy="no-referrer"
                          src={user.avatar}
                          alt={user.name}
                          className="size-11 rounded-full object-cover border border-slate-200"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{user.name}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-mono font-bold mt-1 inline-block">
                            {user.department}
                          </span>
                          
                          {/* Role Pills */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {userRoles.slice(0, 3).map(role => (
                              <span 
                                key={role.id} 
                                className="text-[8.5px] font-extrabold bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded-sm border border-teal-100 shrink-0"
                              >
                                {role.title}
                              </span>
                            ))}
                            {userRoles.length > 3 && (
                              <span className="text-[8.5px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-sm">
                                +{userRoles.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Manager link info */}
                      <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-500">
                        <div>
                          <span className="block text-[8.5px] uppercase font-mono text-slate-400">Atasan</span>
                          <span className="font-bold text-slate-700 truncate block max-w-[120px]">
                            {manager ? manager.name : (lang === "ID" ? "Tanpa Atasan" : "None")}
                          </span>
                        </div>
                        {progress !== null && (
                          <div className="text-right">
                            <span className="block text-[8.5px] uppercase font-mono text-slate-400">Prog. OKR</span>
                            <span className="font-extrabold text-teal-700">{progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Detailed Slide-over/Interactive Inspector Card */}
      <div className="lg:col-span-4 font-sans">
        {selectedEmployee ? (() => {
          const metrics = getEmployeeMetrics(selectedEmployee.id);
          const userRoles = getUserRoles(selectedEmployee.id);
          const manager = getEmployeeManager(selectedEmployee);

          // Get Objectives & Key Results for this employee's roles
          const roleIds = userRoles.map(r => r.id);
          const userKrsAssigned = keyResultAssignees.filter(kra => kra.roleId && roleIds.includes(kra.roleId));
          const employeeKrs = userKrsAssigned.map(kra => {
            const kr = keyResults.find(k => k.id === kra.keyResultId);
            return kr ? { ...kr, assigneeProgress: kra.currentProgress, assigneeWeight: kra.weightPercentage } : null;
          }).filter(Boolean);

          const objectiveIds = Array.from(new Set(employeeKrs.map(kr => kr?.objectiveId).filter(Boolean)));
          const employeeObjectives = objectives.filter(obj => objectiveIds.includes(obj.id));

          // Pending Approvals check for this employee's own OKRs
          const hasOwnPendingApprovals = employeeObjectives.some(o => o.status === "pending" || o.status === "draft") || 
            employeeKrs.some(kr => kr?.status === "pending" || kr?.status === "draft");

          // Pending Approvals that this employee has to review (if they are a circle lead)
          const leadCircles = circles.filter(c => c.leadId === selectedEmployee.id);
          const leadCircleIds = leadCircles.map(c => c.id);
          const approvalsWaitingForMe = objectives.filter(o => o.status === "pending" && o.circleId && leadCircleIds.includes(o.circleId));

          // 360 submissions count
          const sub360 = eval360Submissions.filter(s => s.evaluateeId === selectedEmployee.id);
          const completed360Count = sub360.filter(s => s.status === "submitted").length;
          const pending360Count = sub360.filter(s => s.status !== "submitted").length;

          return (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-5 sticky top-6">
              {/* Header profile */}
              <div className="text-center pb-3 border-b border-slate-100">
                <div className="relative inline-block">
                  <img
                    referrerPolicy="no-referrer"
                    src={selectedEmployee.avatar}
                    alt={selectedEmployee.name}
                    className="size-20 rounded-full mx-auto object-cover border-2 border-teal-600 shadow-sm"
                  />
                  <span className="absolute bottom-1 right-1 bg-teal-500 text-white p-1 rounded-full border-2 border-white">
                    <UserCheck className="size-3.5" />
                  </span>
                </div>
                <h3 className="title-font font-extrabold text-base text-slate-800 mt-2">{selectedEmployee.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedEmployee.email}</p>
                
                <div className="flex justify-center items-center gap-1.5 mt-2">
                  <span className="inline-block px-2.5 py-0.5 bg-teal-50 border border-teal-100 rounded-md text-[10px] font-extrabold text-teal-800">
                    {selectedEmployee.department}
                  </span>
                  <span className="inline-block px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 font-mono">
                    BOX {metrics.boxNumber}
                  </span>
                </div>
              </div>

              {/* High-Fidelity Tab Switcher with helper counters */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setActiveInspectorTab("structure")}
                  className={`py-1.5 px-1 text-center rounded-lg text-[10px] font-extrabold transition-all ${
                    activeInspectorTab === "structure"
                      ? "bg-white text-slate-800 shadow-xxs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title={lang === "ID" ? "Struktur Peran & Pelaporan" : "Roles & Supervisor Structure"}
                >
                  {lang === "ID" ? "Peran" : "Roles"}
                </button>
                
                <button
                  onClick={() => setActiveInspectorTab("performance")}
                  className={`py-1.5 px-1 text-center rounded-lg text-[10px] font-extrabold transition-all relative ${
                    activeInspectorTab === "performance"
                      ? "bg-white text-slate-800 shadow-xxs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title={lang === "ID" ? "Metrik OKR & Persetujuan" : "OKR Metrics & Approvals"}
                >
                  <span>{lang === "ID" ? "Kinerja" : "Perf"}</span>
                  {(hasOwnPendingApprovals || approvalsWaitingForMe.length > 0) && (
                    <span className="absolute top-1 right-1 size-2 bg-rose-500 rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveInspectorTab("eval360")}
                  className={`py-1.5 px-1 text-center rounded-lg text-[10px] font-extrabold transition-all ${
                    activeInspectorTab === "eval360"
                      ? "bg-white text-slate-800 shadow-xxs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title={lang === "ID" ? "Penilaian Multi-Rater 360" : "Multi-Rater 360 Feedback"}
                >
                  {lang === "ID" ? "360 Feedback" : "360"}
                </button>

                <button
                  onClick={() => setActiveInspectorTab("talent9box")}
                  className={`py-1.5 px-1 text-center rounded-lg text-[10px] font-extrabold transition-all ${
                    activeInspectorTab === "talent9box"
                      ? "bg-white text-slate-800 shadow-xxs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title={lang === "ID" ? "Integrasi Matriks Talent 9-Box" : "Talent 9-Box Grid Mapping"}
                >
                  9-Box
                </button>
              </div>

              {/* Tab Contents */}
              <div className="space-y-4">
                
                {/* 1. STRUCTURE TAB */}
                {activeInspectorTab === "structure" && (
                  <div className="space-y-4 animate-fade-in text-left">
                    {/* Edit Atasan Form */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase tracking-wider">
                        <Shield className="size-4 text-teal-650" />
                        <span>{lang === "ID" ? "Edit Jalur Pelaporan" : "Edit Reporting Supervisor"}</span>
                        <div className="group relative ml-auto cursor-help text-slate-400 hover:text-slate-600">
                          <HelpCircle className="size-3.5" />
                          <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-slate-900 text-white text-[9px] leading-normal rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                            {lang === "ID"
                              ? "Menentukan siapa manager langsung karyawan ini untuk proses persetujuan dan kalibrasi penilaian."
                              : "Determines who is the direct manager of this employee for approval and calibration processes."}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-450 font-bold mb-1 uppercase tracking-wide">
                          {lang === "ID" ? "Pilih Atasan Langsung" : "Select Direct Supervisor"}
                        </label>
                        <select
                          disabled={isSavingManager}
                          value={selectedEmployee.managerId || "none"}
                          onChange={(e) => handleUpdateManager(selectedEmployee.id, e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-xs text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                        >
                          <option value="none">
                            {lang === "ID" ? "Sistem Otomatis (Berdasarkan Circle)" : "Auto System (Based on Sektor Lead)"}
                          </option>
                          {getPotentialManagers(selectedEmployee).map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.department})
                            </option>
                          ))}
                        </select>
                      </div>

                      {saveSuccess && (
                        <div className="bg-emerald-100 border border-emerald-200 rounded-lg p-2.5 text-[10.5px] text-emerald-800 flex items-center gap-2">
                          <CheckCircle className="size-4 shrink-0" />
                          <span>{lang === "ID" ? "Berhasil menyimpan atasan langsung!" : "Supervisor updated successfully!"}</span>
                        </div>
                      )}

                      {isSavingManager && (
                        <div className="text-[10px] text-slate-450 italic flex items-center gap-1.5">
                          <span className="size-3 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></span>
                          <span>{lang === "ID" ? "Sedang menyimpan jalur pelaporan..." : "Saving reporting line..."}</span>
                        </div>
                      )}
                    </div>

                    {/* List of ALL assigned roles */}
                    <div className="space-y-2.5">
                      <div className="font-extrabold text-[11px] text-slate-450 uppercase tracking-wider pb-1.5 border-b border-slate-50 flex justify-between items-center">
                        <span>{lang === "ID" ? "Peran Holacracy" : "Holacracy Roles"}</span>
                        <span className="text-[9.5px] bg-slate-100 px-1.5 py-0.2 rounded-full font-mono text-slate-600">
                          {userRoles.length} Peran
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {userRoles.length === 0 ? (
                          <p className="text-slate-400 italic text-[11px] text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-205">
                            {lang === "ID" ? "Belum memegang jabatan fungsional apa pun." : "No positions currently assigned."}
                          </p>
                        ) : (
                          userRoles.map(role => {
                            const circle = circles.find(c => c.id === role.circleId);
                            return (
                              <div key={role.id} className="bg-slate-50 border border-slate-150 rounded-xl p-3 space-y-1.5 text-left">
                                <div className="flex justify-between items-start">
                                  <span className="font-extrabold text-slate-800 text-xs">{role.title}</span>
                                  <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-150 px-1.5 py-0.2 rounded-md font-bold">
                                    {circle?.name || "Global"}
                                  </span>
                                </div>
                                {role.description && (
                                  <p className="text-[10px] text-slate-500 leading-relaxed">{role.description}</p>
                                )}
                                {role.accountabilities && role.accountabilities.length > 0 && (
                                  <div className="pt-2 border-t border-slate-200/60 space-y-1">
                                    <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Tanggung Jawab (Accountabilities):</span>
                                    {role.accountabilities.map((acc, key) => (
                                      <div key={key} className="flex gap-1 items-start text-[10px] text-slate-600">
                                        <ArrowRight className="size-2.5 mt-0.5 text-teal-650 shrink-0" />
                                        <span>{acc}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PERFORMANCE TAB */}
                {activeInspectorTab === "performance" && (
                  <div className="space-y-4 animate-fade-in text-left">
                    {/* Progress score */}
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <Award className="size-4 text-teal-600" />
                          <span className="font-extrabold text-[11px] uppercase text-slate-500 tracking-wider">
                            {lang === "ID" ? "Rata-rata Kinerja OKR" : "Average OKR Performance"}
                          </span>
                        </div>
                        <span className="font-black text-lg text-teal-700">{metrics.progress}%</span>
                      </div>
                      
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-teal-600 h-full transition-all duration-500" style={{ width: `${metrics.progress}%` }} />
                      </div>

                      <div className="bg-white p-2 rounded border border-slate-100 flex items-start gap-1.5 text-[9px] text-slate-500 leading-normal">
                        <Info className="size-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <p>
                          {lang === "ID"
                            ? "Dihitung dari ∑(Progres OKR Peran) ÷ Jumlah Peran Aktif. Angka ini mewakili sumbu X (Kinerja) pada matriks 9-Box."
                            : "Calculated from ∑(Role OKR Progress) ÷ Active Roles. This maps to the X-axis (Performance) on the 9-Box matrix."}
                        </p>
                      </div>
                    </div>

                    {/* Pending Approvals Actions */}
                    {(hasOwnPendingApprovals || approvalsWaitingForMe.length > 0) && (
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 space-y-2 text-rose-900">
                        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-tight">
                          <AlertTriangle className="size-4 text-rose-600 shrink-0" />
                          <span>{lang === "ID" ? "Status Persetujuan Tertunda" : "Pending Approvals Alert"}</span>
                        </div>
                        <ul className="text-[10px] space-y-1.5 list-disc pl-4 text-slate-750 leading-relaxed">
                          {hasOwnPendingApprovals && (
                            <li>
                              {lang === "ID"
                                ? "Karyawan ini memiliki draf sasaran/KR yang belum disetujui atasan."
                                : "This employee has draft Objectives or KRs awaiting supervisor approval."}
                            </li>
                          )}
                          {approvalsWaitingForMe.length > 0 && (
                            <li className="font-bold text-rose-800">
                              {lang === "ID"
                                ? `Sebagai Sektor Lead, Anda memiliki ${approvalsWaitingForMe.length} persetujuan menunggu tindakan Anda di tab 'List Approval'!`
                                : `As a Circle Lead, you have ${approvalsWaitingForMe.length} pending reviews waiting for your approval in the 'Approval List' tab!`}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Employee Objectives list */}
                    <div className="space-y-2.5">
                      <div className="font-extrabold text-[11px] text-slate-450 uppercase tracking-wider pb-1 border-b border-slate-100">
                        {lang === "ID" ? `Sasaran & Target Kerja (${employeeObjectives.length})` : `Objectives & Deliverables (${employeeObjectives.length})`}
                      </div>

                      {employeeObjectives.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                          {lang === "ID" ? "Tidak ada OKR aktif yang ditetapkan untuk peran karyawan ini." : "No active OKRs assigned to this employee's roles."}
                        </p>
                      ) : (
                        <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                          {employeeObjectives.map(obj => {
                            const relatedKrs = employeeKrs.filter(kr => kr?.objectiveId === obj.id);
                            return (
                              <div key={obj.id} className="bg-slate-50/50 p-3 rounded-xl border border-slate-150 space-y-2 text-left">
                                <div className="flex justify-between items-start gap-2">
                                  <div>
                                    <span className="text-[8.5px] uppercase font-mono bg-slate-200 text-slate-600 px-1 py-0.2 rounded font-bold">
                                      {obj.level === "company" ? (lang === "ID" ? "Perusahaan" : "Company") : (lang === "ID" ? "Sektor" : "Circle")}
                                    </span>
                                    <h4 className="font-bold text-slate-800 text-xs mt-1 leading-tight">{obj.title}</h4>
                                  </div>
                                  <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-sm ${
                                    obj.status === "approved" 
                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                                      : "bg-amber-50 text-amber-800 border border-amber-100 animate-pulse"
                                  }`}>
                                    {obj.status || "draft"}
                                  </span>
                                </div>

                                {/* KRs inside objective */}
                                <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                                  {relatedKrs.map(kr => {
                                    if (!kr) return null;
                                    return (
                                      <div key={kr.id} className="text-[10px] text-slate-600 flex justify-between items-center gap-3">
                                        <div className="truncate flex-1">
                                          <span className="font-medium">{kr.title}</span>
                                          <span className="text-[8px] uppercase font-mono text-slate-450 block">
                                            Bobot: {kr.assigneeWeight || 100}% | Tipe: {kr.okrType || "committed"}
                                          </span>
                                        </div>
                                        <span className="font-mono text-teal-700 font-extrabold bg-white border border-slate-100 px-1 py-0.2 rounded text-[9.5px]">
                                          {kr.assigneeProgress}%
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. EVAL 360 TAB */}
                {activeInspectorTab === "eval360" && (
                  <div className="space-y-4 animate-fade-in text-left">
                    {/* Score Overview */}
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <Brain className="size-4 text-indigo-600" />
                          <span className="font-extrabold text-[11px] uppercase text-slate-500 tracking-wider">
                            {lang === "ID" ? "Nilai Potensi (Asesmen 360)" : "Potential Score (360 Assessment)"}
                          </span>
                        </div>
                        <span className="font-black text-lg text-indigo-700">{metrics.calculatedPotScore}/100</span>
                      </div>

                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${metrics.calculatedPotScore}%` }} />
                      </div>

                      <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                        <span>{lang === "ID" ? "Kategori Potensi:" : "Potential Tier:"}</span>
                        <span className="font-extrabold text-indigo-800 uppercase bg-indigo-50 px-1 rounded">
                          {metrics.potTier === "High" ? (lang === "ID" ? "Tinggi" : "High") : metrics.potTier === "Medium" ? (lang === "ID" ? "Sedang" : "Medium") : (lang === "ID" ? "Rendah" : "Low")}
                        </span>
                      </div>
                    </div>

                    {/* Explanatory Guide Box */}
                    <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-xl space-y-1.5 text-[10px] text-amber-900 leading-normal">
                      <div className="flex items-center gap-1 font-bold uppercase tracking-wide text-[9.5px]">
                        <Info className="size-3.5 text-amber-600" />
                        <span>{lang === "ID" ? "📘 Bagaimana Nilai Diperoleh?" : "📘 How are these computed?"}</span>
                      </div>
                      <p>
                        {lang === "ID"
                          ? "Skor Potensi dihitung otomatis dari rata-rata hasil kuesioner Multi-Rater 360 dari rekan kerja, atasan, bawahan, serta penilaian mandiri yang dikonversikan ke skala 0-100. Angka ini mewakili sumbu Y pada matriks 9-Box."
                          : "Potential Score is computed automatically from Multi-Rater 360 peer, manager, subordinate, and self feedback template responses, converted to a 0-100 scale. This maps to the Y-axis on the 9-Box."}
                      </p>
                    </div>

                    {/* Rater completion progress indicator */}
                    <div className="space-y-2.5">
                      <div className="font-extrabold text-[11px] text-slate-450 uppercase tracking-wider pb-1 border-b border-slate-100 flex justify-between items-center">
                        <span>{lang === "ID" ? "Status Pengisian Responden" : "Respondent Submission Status"}</span>
                        <span className="text-[9.5px] bg-slate-100 px-1.5 py-0.2 rounded-full font-mono text-slate-600">
                          {completed360Count} / {completed360Count + pending360Count} Responden
                        </span>
                      </div>

                      {completed360Count + pending360Count === 0 ? (
                        <p className="text-[10px] text-slate-400 italic text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                          {lang === "ID" ? "Belum ada alokasi responden Multi-Rater untuk karyawan ini." : "No Multi-Rater respondents assigned to this employee."}
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                          {sub360.map((sub, i) => {
                            const raterUser = users.find(u => u.id === sub.evaluatorId);
                            return (
                              <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-150 text-[10px]">
                                <div className="flex items-center gap-1.5 truncate">
                                  <img src={raterUser?.avatar} alt="" className="size-5 rounded-full object-cover" />
                                  <span className="font-bold text-slate-700 truncate max-w-[120px]">{raterUser?.name || "Rekan Kerja"}</span>
                                  <span className="text-[8px] bg-slate-200 px-1 rounded-sm uppercase text-slate-500">{sub.groupId}</span>
                                </div>
                                <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded ${
                                  sub.status === "submitted" 
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                                    : "bg-slate-100 text-slate-650 border border-slate-200"
                                }`}>
                                  {sub.status === "submitted" ? (lang === "ID" ? "Selesai" : "Completed") : (lang === "ID" ? "Menunggu" : "Pending")}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. 9-BOX TAB */}
                {activeInspectorTab === "talent9box" && (
                  <div className="space-y-4 animate-fade-in text-left">
                    {/* Visual 9-box micro-matrix */}
                    <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-3.5 relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-3 translate-y-3">
                        <TrendingUp className="size-24 text-white" />
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-black uppercase tracking-wider text-teal-400">Positioning Grid Location</span>
                          <h4 className="text-sm font-extrabold text-white leading-tight">BOX {metrics.boxNumber}: {metrics.boxName}</h4>
                        </div>
                        <span className="text-xs font-black bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full">
                          {metrics.perfTier}-{metrics.potTier}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-300 leading-relaxed font-sans">{metrics.boxDesc}</p>

                      <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-800 text-[10px] leading-relaxed">
                        <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
                          <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">X-Axis (Performance):</span>
                          <span className="font-extrabold text-teal-300">{metrics.progress}% ({metrics.perfTier})</span>
                        </div>
                        <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
                          <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Y-Axis (Potential):</span>
                          <span className="font-extrabold text-indigo-300">{metrics.calculatedPotScore}% ({metrics.potTier})</span>
                        </div>
                      </div>
                    </div>

                    {/* Educational micro calibration formula */}
                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center gap-1 font-bold text-slate-800 uppercase text-[9.5px] tracking-wide pb-1.5 border-b border-slate-200/60">
                        <Info className="size-3.5 text-teal-650" />
                        <span>{lang === "ID" ? "📘 Formula Integrasi 9-Box" : "📘 9-Box Integration Formulas"}</span>
                      </div>
                      
                      <div className="space-y-2 text-[10px] leading-relaxed text-slate-650">
                        <p>
                          <strong>Kinerja (X-Axis):</strong> Berasal dari <strong>Kinerja OKR</strong> ({metrics.progress}%). Sektor Lead & Atasan menyusun OKR, pencapaian Key Results dikonversikan menjadi nilai akhir.
                        </p>
                        <p>
                          <strong>Potensi (Y-Axis):</strong> Berasal dari <strong>Hasil 360 Feedback</strong> ({metrics.calculatedPotScore}%). Rekan kerja & evaluator menilai aspek leadership, komitmen & visi adaptif.
                        </p>
                        <p className="text-[9px] text-slate-400 italic">
                          *Setelah dipetakan otomatis, komite kalibrasi HR dapat melakukan Agreed Score / Kalibrasi manual di tab 'Penilaian Kinerja'.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          );
        })() : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-6 text-slate-400 text-xs font-semibold sticky top-6">
            <Users className="mx-auto text-slate-300 mb-2 size-8" />
            {lang === "ID" 
              ? "Silahkan pilih karyawan di daftar sebelah kiri untuk melihat detail peran, akuntabilitas, kinerja OKR, 360, serta pemetaan 9-Box terintegrasi." 
              : "Please select an employee from the directory on the left to view unified roles, responsibilities, OKR, 360, and integrated 9-Box mapping details."}
          </div>
        )}
      </div>
    </div>
  );
}
