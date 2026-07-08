import React, { useState } from "react";
import { User, Circle, Role, SystemConfig, Eval360Template, Eval360Question, Eval360RaterWeight, Eval360Assignment, Eval360AssessmentSettings, RaterCategorySetting } from "../types";
import { Plus, Trash2, Edit2, Save, FileText, Users, Shield, Copy, CheckCircle2, BarChart3, Settings2, History, Eye, Calendar, Award, Check } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";

interface MultiRater360ConfigProps {
  systemConfig: SystemConfig;
  onUpdateSystemConfig: (updates: Partial<SystemConfig>) => void;
  users: User[];
  circles: Circle[];
  roles: Role[];
  lang: "ID" | "EN";
  eval360Submissions: any[];
}

export const MultiRater360Config: React.FC<MultiRater360ConfigProps> = ({
  systemConfig,
  onUpdateSystemConfig,
  users,
  circles,
  roles,
  lang,
  eval360Submissions = [],
}) => {
  const [newRater, setNewRater] = useState({ evaluateeId: "", evaluatorId: "", groupId: "peer", jobTitle: "", weight: 100 });


  const [localTemplates, setLocalTemplates] = useState<Eval360Template[]>(systemConfig.eval360Templates || []);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [draftTemplate, setDraftTemplate] = useState<Eval360Template | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Eval360Question | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "detail">("edit");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  React.useEffect(() => {
    setLocalTemplates(systemConfig.eval360Templates || []);
  }, [systemConfig.eval360Templates]);

  const activeTemplate = localTemplates.find((t) => t.id === activeTemplateId) || null;

  // Sync draftTemplate when activeTemplate changes
  React.useEffect(() => {
    if (activeTemplate) {
      setDraftTemplate({ ...activeTemplate, raterAssignments: activeTemplate.raterAssignments || [] });
    } else {
      setDraftTemplate(null);
    }
  }, [activeTemplateId, activeTemplate]);

  const handleUpdateDraft = (updates: Partial<Eval360Template>) => {
    if (draftTemplate) {
      setDraftTemplate({ ...draftTemplate, ...updates });
    }
  };

  const handleSaveAll = (updatedTemplates: Eval360Template[]) => {
    onUpdateSystemConfig({ eval360Templates: updatedTemplates });
    alert("Konfigurasi 360 berhasil disimpan!");
  };

  const handleSaveTemplate = () => {
    if (!draftTemplate) return;
    const updated = localTemplates.map((t) => (t.id === draftTemplate.id ? draftTemplate : t));
    setLocalTemplates(updated);
    handleSaveAll(updated);
  };

  const handleAddTemplate = () => {
    const newTemplate: Eval360Template = {
      id: `tpl360_${Date.now()}`,
      name: lang === "ID" ? "Template 360 Baru" : "New 360 Template",
      description: "",
      evaluateeId: "",
      status: "draft",
      questions: [
        { id: `q_${Date.now()}_1`, text: "Kemampuan Kepemimpinan", category: "Leadership", weight: 50, type: "multiple_choice" },
        { id: `q_${Date.now()}_2`, text: "Kerja Sama Tim", category: "Teamwork", weight: 50, type: "multiple_choice" },
      ],
      raterWeights: [
        { groupId: "supervisor", name: "Atasan (Supervisor)", weight: 40 },
        { groupId: "peer", name: "Rekan Kerja (Peer)", weight: 20 },
        { groupId: "cross_department", name: "Lintas Departemen (Cross-Dept)", weight: 20 },
        { groupId: "subordinate", name: "Bawahan (Subordinate)", weight: 10 },
        { groupId: "self", name: "Diri Sendiri (Self)", weight: 10 },
      ],
      assignments: [],
      raterAssignments: [],
    };
    
    const updated = [...localTemplates, newTemplate];
    setLocalTemplates(updated);
    setActiveTemplateId(newTemplate.id);
  };

  const totalQuestionWeight = draftTemplate?.questions.reduce((sum, q) => sum + (q.weight || 0), 0) || 0;
  const totalCategoryWeight = (draftTemplate?.assessmentSettings?.raterCategories || []).reduce((sum, cat) => sum + (cat.enabled ? cat.weight : 0), 0) || 0;

  const isTemplateValid = 
    draftTemplate &&
    draftTemplate.questions.length > 0 &&
    totalQuestionWeight === 100 &&
    totalCategoryWeight === 100;

  const handleActivateTemplate = () => {
    if (!draftTemplate) return;
    if (!isTemplateValid) {
      alert("Template tidak valid! Pastikan total bobot soal = 100% dan total bobot rater = 100%.");
      return;
    }
    const updated = localTemplates.map((t) => (t.id === draftTemplate.id ? { ...draftTemplate, status: "active" as const } : t));
    setLocalTemplates(updated);
    handleSaveAll(updated);
    setDraftTemplate({ ...draftTemplate, status: "active" });
    alert("Template berhasil diaktifkan!");
  };

  const handleUpdateTemplate = (id: string, updates: Partial<Eval360Template>) => {
    const updated = localTemplates.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setLocalTemplates(updated);
    handleSaveAll(updated);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm("Hapus template ini?")) {
      const updated = localTemplates.filter((t) => t.id !== id);
      setLocalTemplates(updated);
      handleSaveAll(updated);
      if (activeTemplateId === id) setActiveTemplateId(null);
    }
  };


  const handleAddQuestion = () => {
    if (!draftTemplate) return;
    const newQ: Eval360Question = {
      id: `q_${Date.now()}`,
      text: "Pertanyaan Baru",
      category: "Umum",
      weight: 10,
      type: "multiple_choice",
      options: [{ id: `opt_${Date.now()}_1`, text: "Sangat Baik", value: 5 }, { id: `opt_${Date.now()}_2`, text: "Kurang", value: 1 }]
    };
    handleUpdateDraft({ questions: [...draftTemplate.questions, newQ] });
  };

  const handleUpdateAssessmentSettings = (newSettings: Eval360AssessmentSettings) => {
    if (!draftTemplate) return;
    handleUpdateDraft({ assessmentSettings: newSettings });
  };

  const addRaterCategory = () => {
    if (!draftTemplate) return;
    const currentSettings = draftTemplate.assessmentSettings || {
      raterCategories: [],
      minPeer: 0,
      maxPeer: 0,
      anonymousFeedback: false,
      autoApprove: false,
      requireAllRaters: false
    };

    const newCategory: RaterCategorySetting = {
      id: `cat_${Date.now()}`,
      label: "Kategori Baru",
      enabled: true,
      targetType: "all",
      targetIds: [],
      weight: 0
    };

    handleUpdateAssessmentSettings({
      ...currentSettings,
      raterCategories: [...(currentSettings.raterCategories || []), newCategory]
    });
  };

  const updateRaterCategory = (id: string, updates: Partial<RaterCategorySetting>) => {
    if (!draftTemplate || !draftTemplate.assessmentSettings) return;
    const updatedCategories = (draftTemplate.assessmentSettings.raterCategories || []).map(cat => 
        cat.id === id ? { ...cat, ...updates } : cat
    );
    handleUpdateAssessmentSettings({ ...draftTemplate.assessmentSettings, raterCategories: updatedCategories });
  };

  const removeRaterCategory = (id: string) => {
    if (!draftTemplate || !draftTemplate.assessmentSettings) return;
    const updatedCategories = (draftTemplate.assessmentSettings.raterCategories || []).filter(cat => cat.id !== id);
    handleUpdateAssessmentSettings({ ...draftTemplate.assessmentSettings, raterCategories: updatedCategories });
  };

  const handleUpdateQuestion = (qId: string, field: keyof Eval360Question, val: any) => {
    if (!draftTemplate) return;
    const updated = draftTemplate.questions.map((q) => (q.id === qId ? { ...q, [field]: val } : q));
    handleUpdateDraft({ questions: updated });
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!draftTemplate) return;
    const updated = draftTemplate.questions.filter((q) => q.id !== qId);
    handleUpdateDraft({ questions: updated });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Settings2 className="size-6 text-indigo-600" />
            {lang === "ID" ? "Konfigurasi Penilaian 360 & Formulanya" : "360 Assessment Configuration & Formulas"}
          </h2>
          <p className="text-slate-500 mt-1 font-medium">
            {lang === "ID" 
              ? "Kelola template kuesioner, relasi penilai, serta formula bobot multi-rater feedback secara komprehensif."
              : "Manage questionnaire templates, rater relationships, and multi-rater feedback weight formulas comprehensively."}
          </p>
        </div>
      </div>

      {/* 📘 360-DEGREE FEEDBACK MATHEMATICAL FORMULAS */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <Award className="size-5 text-indigo-600 shrink-0" />
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
              {lang === "ID" ? "🧮 Bagaimana Skor Kompetensi 360 Dihitung?" : "🧮 How is the 360 Competency Score Calculated?"}
            </h3>
            <p className="text-[10px] text-slate-400">
              {lang === "ID" ? "Transparansi perhitungan Multi-Rater dari skala Likert 1-5 hingga dikonversi menjadi % pencapaian Potensi" : "Transparent multi-rater calculations from 1-5 Likert scale converted to Potential % score"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-600 leading-relaxed">
          {/* Likert Conversion */}
          <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2">
            <span className="font-extrabold text-slate-800 block">
              {lang === "ID" ? "1. Konversi Skala Likert ke %" : "1. Likert Scale to % Conversion"}
            </span>
            <p className="text-[11px] text-slate-500">
              {lang === "ID"
                ? "Setiap jawaban kuesioner dinilai dalam skala Likert 1-5. Skor ini diubah menjadi persentase untuk disetarakan dengan KPI/OKR."
                : "Each questionnaire response is scored on a 1-5 Likert scale. These are converted to percentages for standardized comparison with KPI/OKR."}
            </p>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[10px] text-slate-700">
              <span className="font-bold text-indigo-700">Skor % = ((Skor Likert - 1) ÷ 4) × 100%</span>
              <div className="text-[9px] text-slate-400 font-sans mt-1.5 space-y-0.5">
                <div>• Skala 5 = 100% (Sangat Baik)</div>
                <div>• Skala 4 = 75% (Baik)</div>
                <div>• Skala 3 = 50% (Cukup)</div>
                <div>• Skala 2 = 25% (Kurang)</div>
                <div>• Skala 1 = 0% (Sangat Kurang)</div>
              </div>
            </div>
          </div>

          {/* Category Weighting */}
          <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2">
            <span className="font-extrabold text-slate-800 block">
              {lang === "ID" ? "2. Pembobotan Kelompok Rater" : "2. Rater Group Weighting"}
            </span>
            <p className="text-[11px] text-slate-500">
              {lang === "ID"
                ? "Umpan balik dari berbagai sudut pandang diberikan bobot kepentingan berbeda untuk memastikan objektivitas maksimal."
                : "Feedback from different perspectives is assigned different weight percentages to ensure high objectivity and prevent bias."}
            </p>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[10.5px]">
              <div className="flex justify-between font-mono text-slate-700 font-bold border-b border-slate-200 pb-1">
                <span>Rater Group</span>
                <span>Weight</span>
              </div>
              <div className="font-mono text-[10px] text-slate-600 mt-1 space-y-1">
                <div className="flex justify-between"><span>👑 Atasan (Supervisor)</span> <span className="font-bold text-indigo-700">40%</span></div>
                <div className="flex justify-between"><span>👥 Rekan Kerja (Peer)</span> <span className="font-bold text-indigo-700">20%</span></div>
                <div className="flex justify-between"><span>💼 Lintas-Dept (Cross)</span> <span className="font-bold text-indigo-700">20%</span></div>
                <div className="flex justify-between"><span>🎯 Bawahan (Report)</span> <span className="font-bold text-indigo-700">10%</span></div>
                <div className="flex justify-between"><span>👤 Diri Sendiri (Self)</span> <span className="font-bold text-indigo-700">10%</span></div>
              </div>
            </div>
          </div>

          {/* Aggregation Formula */}
          <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2">
            <span className="font-extrabold text-slate-800 block">
              {lang === "ID" ? "3. Rumus Penggabungan Akhir" : "3. Final Aggregation Formula"}
            </span>
            <p className="text-[11px] text-slate-500">
              {lang === "ID"
                ? "Nilai rata-rata dari setiap kelompok rater dikalikan dengan bobot masing-masing kelompok, lalu dijumlahkan."
                : "The average score of each rater category is multiplied by its category weight, then summed up to produce the final Potential score."}
            </p>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[9.5px] text-slate-700 space-y-1">
              <span className="font-bold text-indigo-700 block">Nilai Potensi Akhir = </span>
              <span className="block text-slate-700 leading-normal">∑(Rata-rata Skor Kelompok Rater × Bobot Kelompok %)</span>
              <p className="text-[8.5px] text-slate-400 font-sans italic mt-1 leading-normal">
                {lang === "ID"
                  ? "Contoh: Jika nilai Atasan Anda 80% (bobot 40%) & Rekan Kerja 90% (bobot 20%), maka sumbangsihnya adalah (80%*0.4) + (90%*0.2) = 50% dari total 100% nilai potensi."
                  : "Example: If Supervisor rates 80% (weight 40%) & Peer rates 90% (weight 20%), they contribute (80%*0.4) + (90%*0.2) = 50% toward the total 100% potential score."}
              </p>
            </div>
          </div>
        </div>
      </div>

        <div className="flex justify-end">
            <button
              onClick={handleAddTemplate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="size-4" />
              Template Baru
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Templates List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Daftar Template</h3>
          {localTemplates.length === 0 ? (
            <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200 border-dashed">
              <p className="text-sm text-slate-500">Belum ada template</p>
            </div>
          ) : (
            localTemplates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => {
                  setActiveTemplateId(tpl.id);
                  setActiveTab("edit");
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all relative group ${
                  activeTemplateId === tpl.id
                    ? "bg-indigo-50 border-indigo-300 shadow-sm"
                    : "bg-white border-slate-200 hover:border-indigo-300"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="font-bold text-slate-800 break-words flex-1 pr-6">{tpl.name}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(tpl.id);
                    }}
                    className="absolute right-3 top-3 text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    title="Hapus Template"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                  <span>{tpl.questions.length} Soal</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    tpl.status === "active" 
                      ? "bg-emerald-100 text-emerald-800" 
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {tpl.status === "active" ? "Aktif" : "Draft"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Main Content: Template Editor / History Viewer */}
        <div className="lg:col-span-3 space-y-6">
          {draftTemplate ? (
            <div className="space-y-6">
              {/* Tab Selector & Header */}
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10 gap-4 flex-wrap">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab("edit")}
                    className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                      activeTab === "edit"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Edit2 className="size-4" />
                    Edit & Konfigurasi
                  </button>
                  <button
                    onClick={() => setActiveTab("detail")}
                    className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                      activeTab === "detail"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <History className="size-4" />
                    Detail & Riwayat Evaluasi
                  </button>
                </div>
                
                {activeTab === "edit" ? (
                  <div className="flex gap-2">
                    {draftTemplate.status === "draft" && (
                      <button
                        onClick={handleActivateTemplate}
                        disabled={!isTemplateValid}
                        className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                          isTemplateValid
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                        title={!isTemplateValid ? "Pastikan total bobot soal = 100% dan total bobot rater = 100%" : "Aktifkan Template"}
                      >
                        <CheckCircle2 className="size-4" />
                        Aktifkan Template
                      </button>
                    )}
                    <button
                      onClick={handleSaveTemplate}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm"
                    >
                      <Save className="size-4" /> Simpan Perubahan
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                      draftTemplate.status === "active" 
                        ? "bg-emerald-100 text-emerald-800" 
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      Status: {draftTemplate.status === "active" ? "Aktif" : "Draft"}
                    </span>
                  </div>
                )}
              </div>

              {activeTab === "edit" ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {draftTemplate.status === "active" && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold">
                      ℹ️ Template ini saat ini Aktif. Harap berhati-hati saat melakukan perubahan dan pastikan untuk menyimpannya kembali.
                    </div>
                  )}

                  {!isTemplateValid && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs space-y-1">
                      <span className="font-bold">⚠️ Persyaratan Aktivasi Template:</span>
                      <ul className="list-disc pl-4 space-y-0.5 font-medium">
                        <li className={draftTemplate.questions.length > 0 ? "text-emerald-700 font-bold" : "text-amber-800"}>
                          Memiliki minimal 1 pertanyaan (Saat ini: {draftTemplate.questions.length})
                        </li>
                        <li className={totalQuestionWeight === 100 ? "text-emerald-700 font-bold" : "text-amber-800"}>
                          Total bobot pertanyaan harus tepat 100% (Saat ini: {totalQuestionWeight}%)
                        </li>
                        <li className={totalCategoryWeight === 100 ? "text-emerald-700 font-bold" : "text-amber-800"}>
                          Total bobot kategori penilai harus tepat 100% (Saat ini: {totalCategoryWeight}%)
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* 1. Informasi Template */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="size-5 text-indigo-600" />
                        1. Informasi Template
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 text-sm font-bold mb-1">Nama Template</label>
                        <input
                          type="text"
                          value={draftTemplate.name}
                          onChange={(e) => handleUpdateDraft({ name: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg p-2.5 font-semibold bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-sm font-bold mb-1">Deskripsi</label>
                        <input
                          type="text"
                          value={draftTemplate.description}
                          onChange={(e) => handleUpdateDraft({ description: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50"
                          placeholder="Misal: Evaluasi Tahunan Manager"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-sm font-bold mb-1">Karyawan yang Dinilai</label>
                        <select
                          value={draftTemplate.evaluateeId}
                          onChange={(e) => handleUpdateDraft({ evaluateeId: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg p-2.5 font-semibold bg-slate-50"
                        >
                          <option value="">Pilih Karyawan</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 2. Pengaturan Penilaian */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Settings2 className="size-5 text-indigo-600" />
                        2. Pengaturan Penilaian & Rater Mapping
                    </h3>
                    <div className="space-y-4 text-sm font-semibold">
                        {(draftTemplate.assessmentSettings?.raterCategories || []).map((category) => (
                              <div key={category.id} className="p-3 border rounded-lg bg-slate-50 flex items-center gap-4">
                                <label className="flex items-center gap-2 w-48 shrink-0">
                                    <input type="checkbox" checked={category.enabled}
                                        onChange={(e) => updateRaterCategory(category.id, { enabled: e.target.checked })}
                                    />
                                    <select className="font-bold border-none bg-transparent w-full" value={category.label} onChange={(e) => updateRaterCategory(category.id, { label: e.target.value })}>
                                        <option value="">Pilih Level</option>
                                        {roles.map((r) => (
                                            <option key={r.id} value={r.title}>{r.title}</option>
                                        ))}
                                    </select>
                                </label>
                                <div className="flex items-center gap-1 w-24">
                                    <input type="number" className="text-xs p-2 rounded border w-16" value={category.weight} onChange={(e) => updateRaterCategory(category.id, { weight: Number(e.target.value) })} />
                                    <span className="text-xs">%</span>
                                </div>
                                {category.enabled && (
                                  <div className="flex gap-2 flex-grow">
                                    <select className="text-xs p-2 rounded border w-32" value={category.targetType} onChange={(e) => updateRaterCategory(category.id, { targetType: e.target.value as any })}>
                                        <option value="all">Semua</option>
                                        <option value="department">Departemen</option>
                                        <option value="employee">Karyawan</option>
                                    </select>
                                    {category.targetType !== "all" && (
                                        <div className="border border-slate-300 rounded-lg p-2 bg-white max-h-32 overflow-y-auto flex-grow text-xs space-y-1">
                                            {category.targetType === "department" && circles.map(c => (
                                                <label key={c.id} className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded cursor-pointer">
                                                    <input type="checkbox" checked={category.targetIds.includes(c.id)} onChange={(e) => {
                                                        const newIds = e.target.checked
                                                            ? [...category.targetIds, c.id]
                                                            : category.targetIds.filter(id => id !== c.id);
                                                        updateRaterCategory(category.id, { targetIds: newIds });
                                                    }} />
                                                    {c.name}
                                                </label>
                                            ))}
                                            {category.targetType === "employee" && users.map(u => (
                                                <label key={u.id} className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded cursor-pointer">
                                                    <input type="checkbox" checked={category.targetIds.includes(u.id)} onChange={(e) => {
                                                        const newIds = e.target.checked
                                                            ? [...category.targetIds, u.id]
                                                            : category.targetIds.filter(id => id !== u.id);
                                                        updateRaterCategory(category.id, { targetIds: newIds });
                                                    }} />
                                                    {u.name}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                  </div>
                                )}
                                <button onClick={() => removeRaterCategory(category.id)} className="text-red-500"><Trash2 className="size-4"/></button>
                              </div>
                        ))}
                        <div className="flex justify-between items-center">
                            <button onClick={addRaterCategory} className="text-indigo-600 font-bold">+ Tambah Kategori</button>
                            {(() => {
                                const total = (draftTemplate.assessmentSettings?.raterCategories || []).reduce((sum, cat) => sum + (cat.enabled ? cat.weight : 0), 0);
                                return (
                                    <div className={`text-sm font-bold flex items-center gap-2 ${total === 100 ? "text-emerald-600" : "text-amber-600"}`}>
                                        Total Bobot: {total}%
                                        {total === 100 && <CheckCircle2 className="size-4" />}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                  </div>
                  
                  {/* 6. Daftar Pertanyaan */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-800">6. Daftar Pertanyaan</h3>
                      <button
                        onClick={handleAddQuestion}
                        className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="size-4" /> Tambah Soal
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {draftTemplate.questions.map((q, idx) => (
                        <div key={q.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                          <div className="flex justify-between items-start">
                              <span className="font-bold text-slate-400">#{idx + 1}</span>
                              <div className="flex gap-2">
                                <button onClick={() => setEditingQuestion(q)} className="text-slate-500 hover:bg-slate-50 p-1 rounded-lg"><Edit2 className="size-4"/></button>
                                <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:bg-red-50 p-1 rounded-lg"><Trash2 className="size-4"/></button>
                              </div>
                          </div>
                          <p className="font-semibold text-slate-800">{q.text}</p>
                          <div className="flex gap-2 text-xs font-bold text-slate-500">
                            <span className="bg-slate-100 p-1 rounded">{q.category}</span>
                            <span className="bg-slate-100 p-1 rounded">{q.weight}%</span>
                            <span className="bg-slate-100 p-1 rounded">{q.type === "multiple_choice" ? "Pilihan Ganda" : "Free Text"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Template Overview Card */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{draftTemplate.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">{draftTemplate.description || "Tidak ada deskripsi."}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${
                        draftTemplate.status === "active" 
                          ? "bg-emerald-100 text-emerald-800" 
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {draftTemplate.status === "active" ? "Template Aktif" : "Template Draft"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="block text-xs font-bold text-slate-500 uppercase">Target Karyawan</span>
                        <span className="block font-bold text-slate-800 mt-1">
                          {users.find(u => u.id === draftTemplate.evaluateeId)?.name || "Semua Karyawan (Belum Diatur)"}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="block text-xs font-bold text-slate-500 uppercase">Total Soal Evaluasi</span>
                        <span className="block font-bold text-slate-800 mt-1">{draftTemplate.questions.length} Pertanyaan</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="block text-xs font-bold text-slate-500 uppercase">Kategori Penilai (Rater)</span>
                        <span className="block font-bold text-indigo-600 mt-1">
                          {(draftTemplate.assessmentSettings?.raterCategories || []).filter(c => c.enabled).length} Kategori Aktif
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rater Mapping Summary */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <Users className="size-5 text-indigo-600" />
                      Pembobotan & Aturan Rater
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(draftTemplate.assessmentSettings?.raterCategories || []).map((cat) => (
                        <div key={cat.id} className={`p-4 rounded-xl border ${cat.enabled ? "bg-indigo-50/50 border-indigo-100" : "bg-slate-50 border-slate-200 opacity-60"}`}>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800">{cat.label}</span>
                            <span className="font-black text-indigo-600">{cat.weight}%</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1.5 flex gap-2">
                            <span>Status: {cat.enabled ? "Aktif" : "Nonaktif"}</span>
                            <span>•</span>
                            <span>Target: {cat.targetType === "all" ? "Semua Karyawan" : cat.targetType === "department" ? "Departemen" : "Karyawan Tertentu"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submission History Table */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <History className="size-5 text-indigo-600" />
                        Riwayat & Progress Pengisian Evaluasi
                      </h4>
                      <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-bold">
                        {eval360Submissions.filter(s => s.templateId === draftTemplate.id).length} Total Responden
                      </span>
                    </div>

                    {(() => {
                      const subs = eval360Submissions.filter(s => s.templateId === draftTemplate.id);
                      if (subs.length === 0) {
                        return (
                          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <Calendar className="size-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">Belum ada responden atau penilai yang mengirimkan evaluasi untuk template ini.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 font-bold">
                              <tr>
                                <th className="p-3 rounded-l-xl">Nama Penilai</th>
                                <th className="p-3">Kategori</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Rata-Rata Skor</th>
                                <th className="p-3 rounded-r-xl">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {subs.map((sub) => {
                                const evaluator = users.find(u => u.id === sub.evaluatorId);
                                const avgScore = sub.answers.length > 0 
                                  ? Math.round(sub.answers.reduce((s: number, a: any) => s + a.score, 0) / sub.answers.length) 
                                  : 0;

                                return (
                                  <tr key={sub.id} className="hover:bg-slate-50/50">
                                    <td className="p-3">
                                      <div className="font-bold text-slate-800">{evaluator?.name || "Unknown"}</div>
                                      <div className="text-xs text-slate-400">{evaluator?.position || "-"}</div>
                                    </td>
                                    <td className="p-3">
                                      <span className="px-2.5 py-1 bg-slate-100 rounded-full text-xs font-semibold uppercase text-slate-600">
                                        {sub.groupId === "self" ? "Diri Sendiri" : sub.groupId === "supervisor" ? "Atasan" : sub.groupId === "peer" ? "Rekan" : sub.groupId === "subordinate" ? "Bawahan" : "Lintas Dept"}
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                        sub.status === "submitted" 
                                          ? "bg-emerald-100 text-emerald-800" 
                                          : "bg-amber-100 text-amber-800"
                                      }`}>
                                        {sub.status === "submitted" ? "Selesai" : "Draft"}
                                      </span>
                                    </td>
                                    <td className="p-3 font-bold text-indigo-600">
                                      {sub.status === "submitted" ? `${avgScore} / 100` : "-"}
                                    </td>
                                    <td className="p-3">
                                      <button
                                        onClick={() => setSelectedSubmissionId(sub.id)}
                                        className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1"
                                      >
                                        <Eye className="size-3.5" />
                                        Lihat Jawaban
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              {/* Question Edit Modal */}
              {editingQuestion && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-bold">Edit Pertanyaan</h3>
                    <input
                      value={editingQuestion.text}
                      onChange={(e) => setEditingQuestion({...editingQuestion, text: e.target.value})}
                      className="w-full font-semibold text-slate-800 border rounded-lg p-2"
                      placeholder="Pertanyaan..."
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <input value={editingQuestion.category} onChange={(e) => setEditingQuestion({...editingQuestion, category: e.target.value})} className="border rounded-lg p-2" placeholder="Kategori"/>
                        <input type="number" value={editingQuestion.weight} onChange={(e) => setEditingQuestion({...editingQuestion, weight: Number(e.target.value)})} className="border rounded-lg p-2" placeholder="Bobot"/>
                    </div>
                    <select value={editingQuestion.type} onChange={(e) => setEditingQuestion({...editingQuestion, type: e.target.value as any})} className="border rounded-lg p-2 w-full">
                        <option value="multiple_choice">Pilihan Ganda</option>
                        <option value="free_text">Free Text</option>
                    </select>

                    {editingQuestion.type === "multiple_choice" && editingQuestion.options && (
                        <div className="space-y-1">
                            {editingQuestion.options.map((opt, optIdx) => (
                                <div key={opt.id} className="flex gap-2">
                                    <input value={opt.text} onChange={(e) => {
                                        const newOptions = [...editingQuestion.options!];
                                        newOptions[optIdx].text = e.target.value;
                                        setEditingQuestion({...editingQuestion, options: newOptions});
                                    }} className="border rounded p-1 flex-1"/>
                                    <input type="number" value={opt.value} onChange={(e) => {
                                        const newOptions = [...editingQuestion.options!];
                                        newOptions[optIdx].value = Number(e.target.value);
                                        setEditingQuestion({...editingQuestion, options: newOptions});
                                    }} className="border rounded p-1 w-16"/>
                                    <button onClick={() => {
                                        const newOptions = editingQuestion.options!.filter((_, i) => i !== optIdx);
                                        setEditingQuestion({...editingQuestion, options: newOptions});
                                    }} className="text-red-500"><Trash2 className="size-4"/></button>
                                </div>
                            ))}
                            <button onClick={() => {
                                const newOptions = [...editingQuestion.options!, { id: `opt_${Date.now()}`, text: "Opsi Baru", value: 0 }];
                                setEditingQuestion({...editingQuestion, options: newOptions});
                            }} className="text-indigo-600 font-bold text-xs mt-1">+ Tambah Opsi</button>
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-2 pt-4">
                       <button onClick={() => setEditingQuestion(null)} className="px-4 py-2 rounded-lg font-bold text-slate-600">Batal</button>
                       <button onClick={() => {
                           if (!draftTemplate) return;
                           const updatedQuestions = draftTemplate.questions.map(q => q.id === editingQuestion.id ? editingQuestion : q);
                           handleUpdateDraft({ questions: updatedQuestions });
                           setEditingQuestion(null);
                       }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold">Simpan</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Submission Details Modal */}
              {selectedSubmissionId && (() => {
                const sub = eval360Submissions.find(s => s.id === selectedSubmissionId);
                const evaluatorName = users.find(u => u.id === sub?.evaluatorId)?.name || "Unknown";
                const evaluateeName = users.find(u => u.id === sub?.evaluateeId)?.name || "Unknown";
                
                return (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center border-b pb-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">Detail Jawaban Evaluasi 360</h3>
                          <p className="text-xs text-slate-500 mt-1">Oleh: <span className="font-bold text-indigo-600">{evaluatorName}</span> untuk <span className="font-bold">{evaluateeName}</span></p>
                        </div>
                        <button onClick={() => setSelectedSubmissionId(null)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">×</button>
                      </div>

                      {sub && sub.answers && sub.answers.length > 0 ? (
                        <div className="space-y-4 pt-2">
                          {sub.answers.map((ans: any, ansIdx: number) => {
                            const q = draftTemplate.questions.find(quest => quest.id === ans.questionId);
                            return (
                              <div key={ans.questionId} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                <div className="flex justify-between items-start gap-4">
                                  <span className="font-bold text-slate-400">#{ansIdx + 1}</span>
                                  <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-bold">{q?.category || "Kompetensi"}</span>
                                </div>
                                <p className="font-semibold text-slate-700">{q?.text || "Pertanyaan dihapus"}</p>
                                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                                  <span className="text-xs font-bold text-slate-500">Skor Diberikan:</span>
                                  <span className="text-sm font-black text-indigo-600">{ans.score} / 100</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm py-8 text-center">Tidak ada detail jawaban untuk evaluasi ini.</p>
                      )}

                      <div className="flex justify-end pt-2 border-t">
                        <button onClick={() => setSelectedSubmissionId(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm">
                          Tutup
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-200 flex flex-col items-center justify-center">
              <Shield className="size-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">Pilih atau Buat Template</h3>
              <p className="text-slate-500 text-sm mt-1">Konfigurasi pengaturan 360 degree feedback</p>
            </div>
          )}
        </div>
      </div>
    </div>
);
};

export const MultiRater360ResultsDashboard: React.FC<{
  systemConfig: SystemConfig;
  users: User[];
  circles: Circle[];
  roles: Role[];
  eval360Submissions: any[];
}> = ({ systemConfig, users, eval360Submissions = [] }) => {
  // Compute chart data for competency categories
  // Average score per category based on submitted evaluations
  const categoryStats: Record<string, { totalScore: number; count: number }> = {};
  
  eval360Submissions.filter(s => s.status === "submitted").forEach(sub => {
    const template = systemConfig.eval360Templates?.find(t => t.id === sub.templateId);
    if (template) {
      sub.answers.forEach((ans: any) => {
        const question = template.questions.find(q => q.id === ans.questionId);
        if (question) {
          if (!categoryStats[question.category]) {
            categoryStats[question.category] = { totalScore: 0, count: 0 };
          }
          categoryStats[question.category].totalScore += ans.score;
          categoryStats[question.category].count += 1;
        }
      });
    }
  });

  const chartData = Object.keys(categoryStats).map(cat => ({
    category: cat,
    average: Math.round(categoryStats[cat].totalScore / categoryStats[cat].count)
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1 md:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Rata-Rata Skor Kompetensi (Kategori)</h3>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="average" name="Rata-Rata Skor" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
               Belum ada data evaluasi yang disubmit.
             </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Ringkasan Evaluasi</h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
               <span className="text-sm font-semibold text-slate-600">Total Evaluasi Disubmit</span>
               <span className="text-xl font-black text-indigo-600">{eval360Submissions.filter(s => s.status === "submitted").length}</span>
             </div>
             <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
               <span className="text-sm font-semibold text-slate-600">Total Evaluasi Draft</span>
               <span className="text-xl font-black text-amber-600">{eval360Submissions.filter(s => s.status === "draft").length}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
         <h3 className="text-lg font-bold text-slate-800 mb-4">Daftar Evaluasi yang Disubmit</h3>
         {eval360Submissions.filter(s => s.status === "submitted").length === 0 ? (
           <p className="text-slate-500 text-sm text-center py-4 bg-slate-50 rounded-xl">Belum ada data evaluasi.</p>
         ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-slate-600">
               <thead className="bg-slate-50 text-slate-500 font-bold">
                 <tr>
                   <th className="p-3 rounded-tl-xl">Karyawan (Dinilai)</th>
                   <th className="p-3">Penilai (Evaluator)</th>
                   <th className="p-3">Kelompok Penilai</th>
                   <th className="p-3">Template</th>
                   <th className="p-3 rounded-tr-xl">Rata-Rata Skor</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {eval360Submissions.filter(s => s.status === "submitted").map(sub => {
                   const evaluatee = users.find(u => u.id === sub.evaluateeId)?.name || "Unknown";
                   const evaluator = users.find(u => u.id === sub.evaluatorId)?.name || "Unknown";
                   const tpl = systemConfig.eval360Templates?.find(t => t.id === sub.templateId)?.name || "Unknown";
                   const group = sub.groupId === "self" ? "Diri Sendiri" : sub.groupId === "supervisor" ? "Atasan" : sub.groupId === "peer" ? "Rekan" : sub.groupId === "subordinate" ? "Bawahan" : "Lintas Dept";
                   const avgScore = sub.answers.length > 0 ? sub.answers.reduce((s: number, a: any) => s + a.score, 0) / sub.answers.length : 0;
                   return (
                     <tr key={sub.id} className="hover:bg-slate-50/50">
                       <td className="p-3 font-semibold text-slate-800">{evaluatee}</td>
                       <td className="p-3">{evaluator}</td>
                       <td className="p-3"><span className="px-2 py-1 bg-slate-100 rounded-md text-xs font-bold">{group}</span></td>
                       <td className="p-3">{tpl}</td>
                       <td className="p-3 font-bold text-indigo-600">{Math.round(avgScore)}</td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
         )}
      </div>
    </div>
  );
};
