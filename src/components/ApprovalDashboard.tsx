import React, { useState } from "react";
import { User, Objective, KeyResult, SystemConfig } from "../types";
import { CheckCircle, XCircle, Target, Activity, ChevronDown, ChevronUp, ClipboardCheck } from "lucide-react";

interface ApprovalDashboardProps {
  users: User[];
  currentUserId: string;
  systemConfig: SystemConfig;
  objectives: Objective[];
  keyResults: KeyResult[];
  performanceReviews: any[];
  lang: "ID" | "EN";
  onUpdateObjective: (id: string, updates: Partial<Objective>) => void;
  onUpdateKeyResult: (id: string, updates: Partial<KeyResult>) => void;
  onUpdatePerformanceReview: (id: string, updates: any) => void;
}

export default function ApprovalDashboard({
  users,
  currentUserId,
  systemConfig,
  objectives,
  keyResults,
  performanceReviews,
  lang,
  onUpdateObjective,
  onUpdateKeyResult,
  onUpdatePerformanceReview,
}: ApprovalDashboardProps) {
  const activeMethod = systemConfig?.defaultReviewMethod || "okr";
  const [expandedObjId, setExpandedObjId] = useState<string | null>(null);
  
  const methodTerms = React.useMemo(() => {
    const terms = {
      okr: {
        objectiveLabelPlural: lang === "ID" ? "Objectives & Key Results" : "Objectives & Key Results",
        approvalDesc: lang === "ID"
          ? "Daftar pengajuan Objective dan Key Result yang menunggu persetujuan Anda."
          : "List of Objective and Key Result submissions waiting for your approval.",
        noObjDesc: lang === "ID" ? "Tidak ada pengajuan yang menunggu." : "No pending submissions.",
      },
      kpi: {
        objectiveLabelPlural: lang === "ID" ? "Kategori & Indikator KPI" : "KPI Categories & Indicators",
        approvalDesc: lang === "ID"
          ? "Daftar pengajuan Kategori dan Indikator KPI yang menunggu persetujuan Anda."
          : "List of KPI Category and Indicator submissions waiting for your approval.",
        noObjDesc: lang === "ID" ? "Tidak ada pengajuan KPI yang menunggu." : "No pending KPI submissions.",
      },
      bsc360: {
        objectiveLabelPlural: lang === "ID" ? "Perspektif & Indikator BSC" : "BSC Perspectives & Indicators",
        approvalDesc: lang === "ID"
          ? "Daftar pengajuan Perspektif dan Indikator BSC yang menunggu persetujuan Anda."
          : "List of BSC Perspective and Indicator submissions waiting for your approval.",
        noObjDesc: lang === "ID" ? "Tidak ada pengajuan BSC yang menunggu." : "No pending BSC submissions.",
      }
    };
    return terms[activeMethod as keyof typeof terms] || terms.okr;
  }, [lang, activeMethod]);

  const currentUser = users.find((u) => u.id === currentUserId);
  const workflow = Array.isArray(systemConfig.approvalWorkflow) 
    ? systemConfig.approvalWorkflow 
    : ["atasan_langsung"];

  const canApprove = (currentStep: number = 0) => {
    if (!currentUser || !currentUser.systemRole) return false;
    const requiredRole = workflow[currentStep];
    return currentUser.systemRole === requiredRole;
  };

  const pendingObjectivesList = objectives.filter((o) => {
    const isObjPending = o.status === "pending" && canApprove(o.currentApprovalStep);
    const hasPendingKr = keyResults.some(
      (kr) => kr.objectiveId === o.id && kr.status === "pending" && canApprove(kr.currentApprovalStep)
    );
    return isObjPending || hasPendingKr;
  });

  const pendingPerformanceReviews = performanceReviews.filter(pr => pr.status === "pending");


  const handleApproveGroup = (obj: Objective) => {
    const isObjPending = obj.status === "pending" && canApprove(obj.currentApprovalStep);
    if (isObjPending) {
      const step = obj.currentApprovalStep || 0;
      if (step + 1 >= workflow.length) {
        onUpdateObjective(obj.id, { status: "approved" });
      } else {
        onUpdateObjective(obj.id, { currentApprovalStep: step + 1 });
      }
    }

    const relatedPendingKrs = keyResults.filter(
      (kr) => kr.objectiveId === obj.id && kr.status === "pending" && canApprove(kr.currentApprovalStep)
    );

    relatedPendingKrs.forEach((kr) => {
      const step = kr.currentApprovalStep || 0;
      if (step + 1 >= workflow.length) {
        onUpdateKeyResult(kr.id, { status: "approved" });
      } else {
        onUpdateKeyResult(kr.id, { currentApprovalStep: step + 1 });
      }
    });
  };

  const handleRejectGroup = (obj: Objective) => {
    const isObjPending = obj.status === "pending" && canApprove(obj.currentApprovalStep);
    if (isObjPending) {
      onUpdateObjective(obj.id, { status: "rejected" });
    }

    const relatedPendingKrs = keyResults.filter(
      (kr) => kr.objectiveId === obj.id && kr.status === "pending" && canApprove(kr.currentApprovalStep)
    );

    relatedPendingKrs.forEach((kr) => {
      onUpdateKeyResult(kr.id, { status: "rejected" });
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <CheckCircle className="text-emerald-600 size-6" />
          {lang === "ID" ? "List Approval" : "Approval List"}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {methodTerms.approvalDesc}
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
              <Target className="size-5 text-indigo-500" />
              {methodTerms.objectiveLabelPlural} ({pendingObjectivesList.length})
            </h3>
            {pendingObjectivesList.length === 0 ? (
              <div className="bg-slate-50 p-4 rounded-xl text-center text-sm text-slate-500">
                {methodTerms.noObjDesc}
              </div>
            ) : (
              <div className="space-y-4">
                {pendingObjectivesList.map((o) => {
                  const relatedKrs = keyResults.filter((kr) => kr.objectiveId === o.id);
                  const isExpanded = expandedObjId === o.id;

                  return (
                    <div key={o.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                        <div className="flex-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Level {o.level} • {o.targetQuarter}
                            {o.status === "pending" ? (
                              <span className="ml-2 text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-sm">Menunggu Objective</span>
                            ) : null}
                          </div>
                          <div className="font-bold text-slate-800 text-sm">{o.title}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setExpandedObjId(isExpanded ? null : o.id)}
                            className="px-3 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="size-4" />
                                {lang === "ID" ? "Tutup Detail" : "Hide Details"}
                              </>
                            ) : (
                              <>
                                <ChevronDown className="size-4" />
                                {lang === "ID" ? "Lihat Detail" : "View Details"}
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectGroup(o)}
                            className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                            title={lang === "ID" ? "Tolak Semua" : "Reject All"}
                          >
                            <XCircle className="size-4" />
                            {lang === "ID" ? "Tolak" : "Reject"}
                          </button>
                          <button
                            onClick={() => handleApproveGroup(o)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 text-xs"
                          >
                            <CheckCircle className="size-4" />
                            {lang === "ID" ? "Setujui" : "Approve"}
                          </button>
                        </div>
                      </div>

                      {/* Detail Section */}
                      {isExpanded && (
                        <div className="p-4 border-t border-slate-100 bg-white">
                          <h4 className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1.5">
                            <Activity className="size-4 text-orange-500" />
                            {activeMethod === "okr" ? "Key Results" : "Indicators"} ({relatedKrs.length})
                          </h4>
                          {relatedKrs.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">
                              {lang === "ID" ? "Belum ada indikator terlampir." : "No indicators attached."}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {relatedKrs.map((kr) => (
                                <div key={kr.id} className="p-3 bg-slate-50 rounded-lg border border-slate-150 flex items-center justify-between gap-3">
                                  <div>
                                    <div className="font-semibold text-slate-700 text-xs">{kr.title}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">
                                      Target: {kr.targetValue} {kr.unit} • Bobot: {kr.weight}%
                                    </div>
                                  </div>
                                  <div>
                                    {kr.status === "pending" ? (
                                      <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-md uppercase">
                                        Pending
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md uppercase">
                                        {kr.status}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Performance Review Approvals */}
          <div>
            <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
              <ClipboardCheck className="size-5 text-emerald-500" />
              {lang === "ID" ? "Penilaian Kinerja" : "Performance Reviews"} ({pendingPerformanceReviews.length})
            </h3>
            {pendingPerformanceReviews.length === 0 ? (
              <div className="bg-slate-50 p-4 rounded-xl text-center text-sm text-slate-500">
                {lang === "ID" ? "Tidak ada penilaian kinerja menunggu." : "No pending performance reviews."}
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPerformanceReviews.map(pr => (
                  <div key={pr.id} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-xs">
                    <div>
                      <div className="font-bold text-sm text-slate-800">Review for User {pr.userId}</div>
                      <div className="text-xs text-slate-500">Final Score: {pr.finalCalculatedScore}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onUpdatePerformanceReview(pr.id, { status: "approved" })} className="px-3 py-1 bg-emerald-600 text-white text-xs rounded-lg font-bold">Approve</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
