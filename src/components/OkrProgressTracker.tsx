import React, { useState, useMemo } from "react";
import { Objective, KeyResult, KeyResultAssignee, RoleMember, Role, Circle, User, CheckInLog } from "../types";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Building,
  ArrowRight,
  ClipboardList,
  Calendar,
  MessageSquare,
  FileCheck,
  CheckSquare,
  Sparkles,
  PieChart as PieIcon,
  ShieldAlert
} from "lucide-react";

interface OkrProgressTrackerProps {
  objectives: Objective[];
  keyResults: KeyResult[];
  keyResultAssignees: KeyResultAssignee[];
  roleMembers: RoleMember[];
  roles: Role[];
  circles: Circle[];
  users: User[];
  checkInLogs: CheckInLog[];
  lang: "ID" | "EN";
}

export const OkrProgressTracker: React.FC<OkrProgressTrackerProps> = ({
  objectives,
  keyResults,
  keyResultAssignees,
  roleMembers,
  roles,
  circles,
  users,
  checkInLogs,
  lang = "ID"
}) => {
  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "on_target" | "on_progress" | "belum_tercapai">("all");
  const [selectedLevel, setSelectedLevel] = useState<"all" | "company" | "circle">("all");
  const [expandedObjectives, setExpandedObjectives] = useState<string[]>([]);

  // Toggle detail cards
  const toggleObjectiveExpand = (id: string) => {
    setExpandedObjectives(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Helper: Get assignee users for a specific Key Result
  const getKRAssignees = useMemo(() => {
    return (krId: string) => {
      const splits = keyResultAssignees.filter(ksa => ksa.keyResultId === krId);
      const assignedUsers: { user: User; roleName: string; weight: number; progress: number }[] = [];

      splits.forEach(split => {
        if (split.roleId) {
          // Find members of this role
          const members = roleMembers.filter(rm => rm.roleId === split.roleId);
          const role = roles.find(r => r.id === split.roleId);
          const roleName = role ? role.title : "Role";

          members.forEach(m => {
            const user = users.find(u => u.id === m.userId);
            if (user) {
              assignedUsers.push({
                user,
                roleName,
                weight: split.weightPercentage,
                progress: split.currentProgress
              });
            }
          });
        } else if (split.circleId) {
          // Find circle lead
          const circle = circles.find(c => c.id === split.circleId);
          if (circle && circle.leadId) {
            const user = users.find(u => u.id === circle.leadId);
            if (user) {
              assignedUsers.push({
                user,
                roleName: `${circle.name} Lead`,
                weight: split.weightPercentage,
                progress: split.currentProgress
              });
            }
          }
        }
      });

      return assignedUsers;
    };
  }, [keyResultAssignees, roleMembers, roles, circles, users]);

  // Helper: check if a user is associated with an objective or key result
  const isUserAssignedToObjective = useMemo(() => {
    return (objectiveId: string, userId: string) => {
      if (userId === "all") return true;

      // Find KRs supporting this objective
      const krs = keyResults.filter(kr => kr.objectiveId === objectiveId);
      
      // Check if user is assigned to any supporting key result
      for (const kr of krs) {
        const assignees = getKRAssignees(kr.id);
        if (assignees.some(asg => asg.user.id === userId)) {
          return true;
        }
      }

      // Fallback: Check if objective is circle-level and user is circle lead/member
      const obj = objectives.find(o => o.id === objectiveId);
      if (obj && obj.circleId) {
        const circle = circles.find(c => c.id === obj.circleId);
        if (circle && circle.leadId === userId) return true;

        // Or if user's role is in this circle
        const userRoles = roleMembers.filter(rm => rm.userId === userId).map(rm => rm.roleId);
        const circleRoles = roles.filter(r => r.circleId === obj.circleId).map(r => r.id);
        if (userRoles.some(rId => circleRoles.includes(rId))) {
          return true;
        }
      }

      return false;
    };
  }, [keyResults, objectives, circles, roleMembers, roles, getKRAssignees]);

  // Derived Objective and Progress data
  const processedObjectives = useMemo(() => {
    return objectives.map(obj => {
      const krs = keyResults.filter(kr => kr.objectiveId === obj.id);
      
      // Calculate average progress based on key results (support multiple people's contributions)
      let calculatedProgress = 0;
      if (krs.length > 0) {
        // Weighted average if weights are defined, else simple average
        const totalWeight = krs.reduce((sum, kr) => sum + (kr.weight || 0), 0);
        if (totalWeight > 0) {
          calculatedProgress = krs.reduce((sum, kr) => sum + (kr.progress * (kr.weight || 0)) / totalWeight, 0);
        } else {
          calculatedProgress = krs.reduce((sum, kr) => sum + kr.progress, 0) / krs.length;
        }
      }

      const progress = Math.round(calculatedProgress);

      // Categorization rules requested by user: "on target", "on progress", "belum tercapai"
      let status: "on_target" | "on_progress" | "belum_tercapai" = "belum_tercapai";
      if (progress >= 70) {
        status = "on_target";
      } else if (progress >= 30) {
        status = "on_progress";
      } else {
        status = "belum_tercapai";
      }

      // Gather assignees list
      const allAssigneeUsers: User[] = [];
      krs.forEach(kr => {
        const asgs = getKRAssignees(kr.id);
        asgs.forEach(asg => {
          if (!allAssigneeUsers.some(u => u.id === asg.user.id)) {
            allAssigneeUsers.push(asg.user);
          }
        });
      });

      return {
        ...obj,
        progress,
        statusLabel: status,
        supportingKrs: krs,
        assigneeUsers: allAssigneeUsers
      };
    });
  }, [objectives, keyResults, getKRAssignees]);

  // Filters Applier
  const filteredObjectives = useMemo(() => {
    return processedObjectives.filter(obj => {
      // 1. Search Query
      const matchesSearch = searchQuery.trim() === "" || 
        obj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.supportingKrs.some(kr => kr.title.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Level Filter
      const matchesLevel = selectedLevel === "all" || obj.level === selectedLevel;

      // 3. User Filter (Employee Name)
      const matchesUser = selectedUser === "all" || isUserAssignedToObjective(obj.id, selectedUser);

      // 4. Status Categorization Filter
      const matchesStatus = statusFilter === "all" || obj.statusLabel === statusFilter;

      return matchesSearch && matchesLevel && matchesUser && matchesStatus;
    });
  }, [processedObjectives, searchQuery, selectedLevel, selectedUser, statusFilter, isUserAssignedToObjective]);

  // Stats Breakdown for Bento Grid
  const statsBreakdown = useMemo(() => {
    const total = processedObjectives.length;
    const onTarget = processedObjectives.filter(o => o.statusLabel === "on_target").length;
    const onProgress = processedObjectives.filter(o => o.statusLabel === "on_progress").length;
    const belumTercapai = processedObjectives.filter(o => o.statusLabel === "belum_tercapai").length;
    
    const averageProgress = total > 0 
      ? Math.round(processedObjectives.reduce((sum, o) => sum + o.progress, 0) / total)
      : 0;

    return {
      total,
      onTarget,
      onProgress,
      belumTercapai,
      averageProgress
    };
  }, [processedObjectives]);

  // Sort Check-In Logs for "Continuous Updates Feed"
  const recentUpdates = useMemo(() => {
    return [...checkInLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15); // Show top 15 updates for sustainability tracking
  }, [checkInLogs]);

  return (
    <div className="space-y-6">
      {/* 📊 BENTO GRID SUMMARY CARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Objectives */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xxs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === "ID" ? "Total Sasaran" : "Total Objectives"}
            </span>
            <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
              <ClipboardList className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-800">{statsBreakdown.total}</span>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">
              {lang === "ID" ? "Terdistribusi di semua level" : "Distributed across levels"}
            </p>
          </div>
        </div>

        {/* On Target Card */}
        <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-200/80 shadow-xxs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              ON TARGET (≥70%)
            </span>
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-850">{statsBreakdown.onTarget}</span>
              {statsBreakdown.total > 0 && (
                <span className="text-xs font-extrabold text-emerald-600">
                  ({Math.round((statsBreakdown.onTarget / statsBreakdown.total) * 100)}%)
                </span>
              )}
            </div>
            <p className="text-[10px] text-emerald-600 mt-1 font-semibold">
              {lang === "ID" ? "Kinerja sangat memuaskan" : "Excellent performance"}
            </p>
          </div>
        </div>

        {/* On Progress Card */}
        <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-200/80 shadow-xxs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              ON PROGRESS (30-69%)
            </span>
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-850">{statsBreakdown.onProgress}</span>
              {statsBreakdown.total > 0 && (
                <span className="text-xs font-extrabold text-amber-600">
                  ({Math.round((statsBreakdown.onProgress / statsBreakdown.total) * 100)}%)
                </span>
              )}
            </div>
            <p className="text-[10px] text-amber-600 mt-1 font-semibold">
              {lang === "ID" ? "Sedang berjalan lancar" : "Steady progress"}
            </p>
          </div>
        </div>

        {/* Belum Tercapai Card */}
        <div className="bg-rose-50/40 p-5 rounded-2xl border border-rose-200/80 shadow-xxs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
              {lang === "ID" ? "BELUM TERCAPAI (<30%)" : "OFF TRACK (<30%)"}
            </span>
            <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
              <AlertCircle className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-850">{statsBreakdown.belumTercapai}</span>
              {statsBreakdown.total > 0 && (
                <span className="text-xs font-extrabold text-rose-600">
                  ({Math.round((statsBreakdown.belumTercapai / statsBreakdown.total) * 100)}%)
                </span>
              )}
            </div>
            <p className="text-[10px] text-rose-600 mt-1 font-bold">
              {lang === "ID" ? "Butuh tindakan segera" : "Requires attention"}
            </p>
          </div>
        </div>

        {/* Avg Progress Gauge */}
        <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-200/80 shadow-xxs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
              {lang === "ID" ? "Rata-rata Progress" : "Avg Completion"}
            </span>
            <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-indigo-900">{statsBreakdown.averageProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${statsBreakdown.averageProgress}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* 🔍 FILTER SECTION & MONITORING GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: FILTERS & REAL-TIME UPDATES TIMELINE */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Controls Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Filter className="size-4 text-indigo-600" />
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                {lang === "ID" ? "Filter Pemantauan" : "Monitoring Filters"}
              </h3>
            </div>

            {/* Keyword Search */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {lang === "ID" ? "Cari Sasaran / KR" : "Search Objective / KR"}
              </label>
              <div className="relative">
                <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={lang === "ID" ? "Masukkan kata kunci..." : "Type keyword..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                />
              </div>
            </div>

            {/* Employee Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Users className="size-3 text-slate-400" />
                {lang === "ID" ? "Karyawan Kontributor" : "Employee Contributor"}
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 text-slate-700"
              >
                <option value="all">{lang === "ID" ? "Semua Karyawan" : "All Employees"}</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.department || "No Dept"})</option>
                ))}
              </select>
            </div>

            {/* OKR Level Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Level OKR
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedLevel("all")}
                  className={`py-1.5 text-[9.5px] font-extrabold rounded-lg transition-all ${selectedLevel === "all" ? "bg-white text-indigo-700 shadow-xxs" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLevel("company")}
                  className={`py-1.5 text-[9.5px] font-extrabold rounded-lg transition-all ${selectedLevel === "company" ? "bg-white text-indigo-700 shadow-xxs" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Korporat
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLevel("circle")}
                  className={`py-1.5 text-[9.5px] font-extrabold rounded-lg transition-all ${selectedLevel === "circle" ? "bg-white text-indigo-700 shadow-xxs" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Circle
                </button>
              </div>
            </div>

            {/* Status Categorization Selector */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {lang === "ID" ? "Kategori Ketercapaian" : "Target Achievement Category"}
              </label>
              <div className="space-y-1">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-between border transition-all ${statusFilter === "all" ? "bg-indigo-50/50 text-indigo-700 border-indigo-200" : "bg-white border-slate-150 text-slate-600 hover:bg-slate-50"}`}
                >
                  <span>Semua Kategori</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9.5px] font-black text-slate-500">
                    {processedObjectives.length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter("on_target")}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-between border transition-all ${statusFilter === "on_target" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white border-slate-150 text-slate-600 hover:bg-slate-50"}`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    On Target (≥ 70%)
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[9.5px] font-black">
                    {processedObjectives.filter(o => o.statusLabel === "on_target").length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter("on_progress")}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-between border transition-all ${statusFilter === "on_progress" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white border-slate-150 text-slate-600 hover:bg-slate-50"}`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-400" />
                    On Progress (30-69%)
                  </span>
                  <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9.5px] font-black">
                    {processedObjectives.filter(o => o.statusLabel === "on_progress").length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter("belum_tercapai")}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-between border transition-all ${statusFilter === "belum_tercapai" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-white border-slate-150 text-slate-600 hover:bg-slate-50"}`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-rose-500" />
                    Belum Tercapai (&lt; 30%)
                  </span>
                  <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[9.5px] font-black">
                    {processedObjectives.filter(o => o.statusLabel === "belum_tercapai").length}
                  </span>
                </button>
              </div>
            </div>

          </div>

          {/* 📈 REAL-TIME UPDATES / TIMELINE CHECK-IN (CONTINUOUS MONITORING FOR MANAGEMENT) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="size-4 text-emerald-600" />
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  {lang === "ID" ? "Aktivitas Check-In" : "Check-In Updates"}
                </h3>
              </div>
              <span className="text-[9.5px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                {recentUpdates.length}
              </span>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
              {recentUpdates.map((log) => {
                const user = users.find(u => u.id === log.assigneeId);
                const kr = keyResults.find(k => k.id === log.keyResultId);
                const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleDateString("id-ID", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                }) : "-";

                return (
                  <div key={log.id} className="relative pl-4 pb-1 border-l border-slate-200 last:pb-0">
                    {/* timeline node icon */}
                    <div className="absolute -left-1.5 top-1 size-2.5 rounded-full bg-emerald-500 border border-white shadow-xxs" />
                    
                    <div className="text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800 truncate max-w-[120px]" title={user?.name}>
                          {user?.name || "Karyawan"}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">{timeStr}</span>
                      </div>
                      
                      <p className="text-slate-500 font-bold leading-tight">
                        Update metrik realisasi ke <span className="text-emerald-700 font-extrabold">{log.newValue} {kr?.unit}</span>
                      </p>

                      {kr && (
                        <p className="text-[10px] text-slate-400 italic font-medium truncate" title={kr.title}>
                          KR: {kr.title}
                        </p>
                      )}

                      {log.notes && (
                        <p className="text-[10px] bg-slate-50 p-1.5 rounded-md border border-slate-100 text-slate-600 font-medium leading-relaxed">
                          "{log.notes}"
                        </p>
                      )}

                      {log.hasBlocker && (
                        <div className="flex items-center gap-1.5 text-[9px] bg-rose-50 text-rose-700 p-1 rounded font-bold">
                          <ShieldAlert className="size-3" />
                          <span>Blocker: {log.blockerNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {recentUpdates.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  Belum ada aktivitas check-in terdeteksi.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: MAIN OBJECTIVES & KEY RESULTS LIST (MONITOR MULTIPLE Assignees / contribution splits) */}
        <div className="lg:col-span-3 space-y-4">
          
          <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200/80 shadow-xxs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-800">
                {lang === "ID" ? "Pemantauan Progress Komprehensif" : "Comprehensive Progress Monitoring"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === "ID" 
                  ? `Menampilkan ${filteredObjectives.length} dari ${processedObjectives.length} Objective yang disesuaikan berdasarkan filter.`
                  : `Showing ${filteredObjectives.length} of ${processedObjectives.length} Objectives matching current filters.`}
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-150">
              <Sparkles className="size-3.5 text-indigo-500" />
              <span>Multi-Assignee Calculation</span>
            </div>
          </div>

          {/* Objectives Feed */}
          <div className="space-y-4">
            {filteredObjectives.map(obj => {
              const isExpanded = expandedObjectives.includes(obj.id);
              
              // Get status badge colors
              let statusBg = "bg-rose-50 text-rose-700 border-rose-200";
              let statusText = "Belum Tercapai";
              if (obj.statusLabel === "on_target") {
                statusBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
                statusText = "On Target";
              } else if (obj.statusLabel === "on_progress") {
                statusBg = "bg-amber-50 text-amber-850 border-amber-200";
                statusText = "On Progress";
              }

              return (
                <div 
                  key={obj.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded 
                      ? "border-indigo-200 shadow-md ring-1 ring-indigo-50/50" 
                      : "border-slate-150 hover:border-slate-300 shadow-xxs"
                  }`}
                >
                  {/* Header info */}
                  <div 
                    onClick={() => toggleObjectiveExpand(obj.id)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/40 select-none"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ${
                          obj.level === "company" 
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                            : "bg-teal-50 text-teal-700 border-teal-200"
                        }`}>
                          {obj.level === "company" ? "Level Perusahaan" : "Level Circle"}
                        </span>
                        
                        <span className="text-[10px] font-black text-slate-400 font-mono">
                          {obj.targetQuarter}
                        </span>

                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${statusBg}`}>
                          {statusText}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-slate-800 leading-snug">
                        {obj.title}
                      </h4>

                      {/* Display circular tags of all assigned people contributing to this objective */}
                      {obj.assigneeUsers.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold text-slate-400">Kontributor:</span>
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {obj.assigneeUsers.map(user => (
                              <img 
                                key={user.id}
                                src={user.avatar} 
                                alt={user.name} 
                                className="inline-block h-5 h-5 rounded-full ring-2 ring-white object-cover"
                                title={`${user.name} (${user.department})`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progress score & expansion indicator */}
                    <div className="flex items-center gap-4 md:self-center">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                          REALISASI
                        </span>
                        <span className="text-2xl font-black text-slate-800 font-mono">
                          {obj.progress}%
                        </span>
                      </div>

                      {/* Progress circle bar */}
                      <div className="relative size-10 shrink-0">
                        <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                          {/* Background Circle */}
                          <circle cx="18" cy="18" r="16" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                          {/* Progress Circle */}
                          <circle 
                            cx="18" cy="18" r="16" fill="none" 
                            stroke={obj.progress >= 70 ? "#10b981" : obj.progress >= 30 ? "#f59e0b" : "#ef4444"} 
                            strokeWidth="3.5" 
                            strokeDasharray="100"
                            strokeDashoffset={100 - obj.progress}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Target className="size-4 text-slate-300" />
                        </div>
                      </div>

                      {/* Chevron up/down */}
                      <div className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 border border-slate-200 transition-colors">
                        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Supporting Key Results Expanded section (Shows calculation from several people) */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50/35 space-y-4">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <span>Hasil Perhitungan Key Result ({obj.supportingKrs.length} Indikator)</span>
                        <span>Bobot Relatif</span>
                      </div>

                      <div className="space-y-3">
                        {obj.supportingKrs.map(kr => {
                          const assignees = getKRAssignees(kr.id);
                          
                          // Determine status for this KR
                          let krStatusColor = "bg-rose-500";
                          let krStatusText = "Belum Tercapai";
                          if (kr.progress >= 70) {
                            krStatusColor = "bg-emerald-500";
                            krStatusText = "On Target";
                          } else if (kr.progress >= 30) {
                            krStatusColor = "bg-amber-400";
                            krStatusText = "On Progress";
                          }

                          return (
                            <div 
                              key={kr.id}
                              className="p-4 rounded-xl border border-slate-200 bg-white shadow-xxs space-y-3"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase text-slate-400 font-mono">
                                      Key Result
                                    </span>
                                    <span className={`text-[8.5px] font-extrabold px-1.5 py-0.2 rounded border ${
                                      kr.progress >= 70 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                      kr.progress >= 30 ? "bg-amber-50 text-amber-700 border-amber-100" :
                                      "bg-rose-50 text-rose-700 border-rose-100"
                                    }`}>
                                      {krStatusText}
                                    </span>
                                    {kr.okrType === "aspirational" && (
                                      <span className="text-[8.5px] font-extrabold px-1.5 py-0.2 rounded border bg-purple-50 text-purple-700 border-purple-150">
                                        Aspirational
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="text-xs font-extrabold text-slate-700 leading-snug">
                                    {kr.title}
                                  </h5>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <span className="text-[9.5px] text-slate-400 font-bold block">REALISASI</span>
                                    <span className="text-xs font-black text-slate-800">
                                      {kr.currentValue} / {kr.targetValue} {kr.unit}
                                    </span>
                                  </div>
                                  <div className="bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-150 text-right">
                                    <span className="text-[9px] text-slate-400 font-bold block">BOBOT</span>
                                    <span className="text-xs font-black text-slate-700">{kr.weight || 100}%</span>
                                  </div>
                                </div>
                              </div>

                              {/* Progress bar of Key result */}
                              <div className="flex items-center gap-3 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${krStatusColor}`}
                                    style={{ width: `${kr.progress}%` }}
                                  />
                                </div>
                                <span className="text-xs font-black text-slate-700 font-mono">{kr.progress}%</span>
                              </div>

                              {/* Contributors assigned to this specific key result with split progress contribution */}
                              {assignees.length > 0 ? (
                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Kontributor Individu (Split progress contributor)
                                  </span>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {assignees.map((asg, idx) => (
                                      <div 
                                        key={idx} 
                                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-150"
                                      >
                                        <div className="flex items-center gap-2">
                                          <img 
                                            src={asg.user.avatar} 
                                            alt={asg.user.name} 
                                            className="w-6 h-6 rounded-full object-cover border border-slate-200" 
                                          />
                                          <div>
                                            <span className="text-[10.5px] font-extrabold text-slate-700 block leading-tight">
                                              {asg.user.name}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-medium">
                                              {asg.roleName}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="text-right">
                                          <span className="text-[9px] text-slate-400 font-extrabold block">
                                            KONTRIBUSI: {asg.weight}%
                                          </span>
                                          <span className="text-[10.5px] font-black text-slate-700">
                                            Progress: {asg.progress}%
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[9.5px] text-slate-400 italic">
                                  Belum ada kontributor individu spesifik. Menurunkan data progress dari value global.
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredObjectives.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
                <Target className="size-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-700">Tidak ada data yang sesuai</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Sesuaikan kata kunci, filter karyawan, atau kategori pencapaian Anda.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
