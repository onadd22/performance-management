import React, { useState } from "react";
import { User, SystemConfig, Eval360Submission, Circle, Role } from "../types";
import { Users, CheckCircle, ChevronRight, FileText, Activity, Settings2 } from "lucide-react";
import { MultiRater360Config, MultiRater360ResultsDashboard } from "./MultiRater360Config";

interface Eval360SubmissionFormProps {
  currentLoginUserId: string;
  systemConfig: SystemConfig;
  onUpdateSystemConfig?: (updates: Partial<SystemConfig>) => void;
  users: User[];
  circles?: Circle[];
  roles?: Role[];
  eval360Submissions: Eval360Submission[];
  onSubmitEval360: (data: any) => Promise<void>;
  lang: "ID" | "EN";
}

export function Eval360SubmissionForm({
  currentLoginUserId,
  systemConfig,
  onUpdateSystemConfig,
  users,
  circles = [],
  roles = [],
  eval360Submissions,
  onSubmitEval360,
  lang
}: Eval360SubmissionFormProps) {
  const [activeTab, setActiveTab] = useState<"fill" | "results" | "setup">("fill");
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [submitting, setSubmitting] = useState(false);

  const assignments = systemConfig?.multiRater360Config?.evaluatorAssignments || [];
  const questionTemplates = systemConfig?.multiRater360Config?.questionTemplates || [];

  // Filter assignments where the current logged in user is the evaluator
  const myAssignments = assignments.filter((a) => a.evaluatorId === currentLoginUserId);

  const handleSelectAssignment = (assignment: any) => {
    // Check if already submitted
    const existingSub = eval360Submissions.find(
      (sub) => sub.evaluateeId === assignment.evaluateeId && sub.evaluatorId === currentLoginUserId
    );
    
    if (existingSub) {
      alert(lang === "ID" ? "Anda sudah mengisi evaluasi ini." : "You have already filled this evaluation.");
      return;
    }

    setSelectedAssignment(assignment);
    const initialAnswers: { [key: string]: number } = {};
    questionTemplates.forEach((q) => {
      initialAnswers[q.id] = 85; // Default score
    });
    setAnswers(initialAnswers);
  };

  const handleScoreChange = (qId: string, val: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;
    try {
      setSubmitting(true);
      const payload = {
        templateId: "default",
        evaluateeId: selectedAssignment.evaluateeId,
        evaluatorId: currentLoginUserId,
        groupId: selectedAssignment.groupId,
        answers: Object.keys(answers).map((qId) => ({ questionId: qId, score: answers[qId] })),
        status: "submitted",
        reviewCycleId: systemConfig.currentQuarter
      };
      await onSubmitEval360(payload);
      setSelectedAssignment(null);
    } catch (e) {
      console.error(e);
      alert(lang === "ID" ? "Gagal mengirim evaluasi." : "Failed to submit evaluation.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentUser = users.find(u => u.id === currentLoginUserId);
  const currentRolePerm = systemConfig?.rolePermissions?.find(rp => rp.id === currentUser?.systemRole) || 
    systemConfig?.rolePermissions?.find(rp => rp.id === "karyawan");
  const canManageOrgStructure = currentRolePerm?.canManageOrgStructure ?? false;

  return (
    <div className="space-y-6">
      {canManageOrgStructure && (
        <div className="flex justify-center border-b border-slate-200 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("fill")}
              className={`pb-3 px-2 font-bold text-sm transition-all border-b-2 ${
                activeTab === "fill"
                  ? "border-purple-600 text-purple-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="size-4" />
                {lang === "ID" ? "Isi Assessment" : "Fill Assessment"}
              </div>
            </button>
            <button
              onClick={() => setActiveTab("setup")}
              className={`pb-3 px-2 font-bold text-sm transition-all border-b-2 ${
                activeTab === "setup"
                  ? "border-purple-600 text-purple-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings2 className="size-4" />
                {lang === "ID" ? "Setup Assessment" : "Setup Assessment"}
              </div>
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`pb-3 px-2 font-bold text-sm transition-all border-b-2 ${
                activeTab === "results"
                  ? "border-purple-600 text-purple-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="size-4" />
                {lang === "ID" ? "Dashboard Hasil" : "Results Dashboard"}
              </div>
            </button>
          </div>
        </div>
      )}

      {activeTab === "fill" && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-2">
            <FileText className="size-6 text-purple-600" />
            {lang === "ID" ? "Formulir Assessment 360" : "360 Assessment Form"}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {lang === "ID"
              ? "Pilih rekan kerja, atasan, atau bawahan yang ditugaskan kepada Anda untuk dinilai."
              : "Select the peers, managers, or subordinates assigned to you for evaluation."}
          </p>

          {!selectedAssignment ? (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
                <Users className="size-5 text-indigo-500" />
                {lang === "ID" ? "Tugas Evaluasi Anda" : "Your Evaluation Tasks"}
              </h3>
              
              {myAssignments.length === 0 ? (
                <div className="bg-slate-50 p-4 rounded-xl text-center text-sm text-slate-500">
                  {lang === "ID" ? "Tidak ada tugas evaluasi untuk saat ini." : "No evaluation tasks for now."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myAssignments.map((assignment, idx) => {
                    const evaluatee = users.find((u) => u.id === assignment.evaluateeId);
                    const isCompleted = eval360Submissions.some(
                      (sub) => sub.evaluateeId === assignment.evaluateeId && sub.evaluatorId === currentLoginUserId
                    );
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => !isCompleted && handleSelectAssignment(assignment)}
                        className={`border p-4 rounded-xl flex items-center justify-between transition-all ${
                          isCompleted 
                            ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                            : "bg-white border-slate-200 hover:border-purple-300 hover:shadow-md cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img src={evaluatee?.avatar} alt="" className="w-10 h-10 rounded-full bg-slate-200" />
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{evaluatee?.name || "Unknown User"}</div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">
                              {assignment.groupId}
                            </div>
                          </div>
                        </div>
                        <div>
                          {isCompleted ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                              <CheckCircle className="size-3" /> Selesai
                            </span>
                          ) : (
                            <ChevronRight className="size-4 text-slate-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 mb-4">
                <button 
                  onClick={() => setSelectedAssignment(null)}
                  className="text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-50 px-3 py-1.5 rounded-lg"
                >
                  &larr; {lang === "ID" ? "Kembali" : "Back"}
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                <img 
                  src={users.find(u => u.id === selectedAssignment.evaluateeId)?.avatar} 
                  alt="" 
                  className="w-12 h-12 rounded-full border-2 border-white shadow-sm" 
                />
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">
                    {lang === "ID" ? "Mengevaluasi" : "Evaluating"}
                  </div>
                  <div className="font-black text-slate-800 text-lg">
                    {users.find(u => u.id === selectedAssignment.evaluateeId)?.name}
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    {lang === "ID" ? "Sebagai" : "As"}: <span className="font-bold">{selectedAssignment.groupId}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {questionTemplates.map((q) => (
                  <div key={q.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wider block w-fit mb-1">
                          {q.category}
                        </span>
                        <p className="font-bold text-slate-800 text-sm">{q.question}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Skor</div>
                        <div className="font-black text-lg text-emerald-600">{answers[q.id]}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-400">0</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={answers[q.id]}
                        onChange={(e) => handleScoreChange(q.id, Number(e.target.value))}
                        className="flex-1 accent-emerald-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-400">100</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  {submitting ? (
                    <Activity className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle className="size-4" />
                  )}
                  {lang === "ID" ? "Kirim Penilaian" : "Submit Evaluation"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "setup" && onUpdateSystemConfig && (
        <MultiRater360Config
          systemConfig={systemConfig}
          onUpdateSystemConfig={onUpdateSystemConfig}
          users={users}
          circles={circles}
          roles={roles}
          lang={lang}
          eval360Submissions={eval360Submissions}
        />
      )}

      {activeTab === "results" && (
        <MultiRater360ResultsDashboard
          systemConfig={systemConfig}
          users={users}
          circles={circles}
          roles={roles}
          eval360Submissions={eval360Submissions}
        />
      )}
    </div>
  );
}
