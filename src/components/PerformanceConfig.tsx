import React, { useState, useEffect } from "react";
import { SystemConfig, User, Role, Circle, PerformanceReview as ReviewType, MetricItem } from "../types";
import { ClipboardCheck, Settings, Info, Percent, Compass, Trash2, Plus, Users, Brain, Award, Activity, BookOpen, ChevronDown, ChevronUp, Save, RotateCcw } from "lucide-react";
import { TooltipWrapper } from "./TooltipContext";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from "recharts";
import { METRICS_DATABASE_DEFAULT } from "./MetricsGlossary";

interface PerformanceConfigProps {
  systemConfig: SystemConfig;
  onUpdateSystemConfig: (config: Partial<SystemConfig>) => void;
  users: User[];
  roles: Role[];
  circles: Circle[];
  eval360Submissions?: any[];
  performanceReviews?: ReviewType[];
  lang?: "ID" | "EN";
}

export default function PerformanceConfig({ 
  systemConfig, 
  onUpdateSystemConfig,
  users,
  roles,
  circles,
  eval360Submissions = [],
  performanceReviews = [],
  lang = "ID"
}: PerformanceConfigProps) {

  const [localConfig, setLocalConfig] = useState<SystemConfig>(systemConfig);
  const [expandedMetricId, setExpandedMetricId] = useState<string | null>(null);

  useEffect(() => {
    setLocalConfig(systemConfig);
  }, [systemConfig]);

  const handleUpdateConfig = (updates: Partial<SystemConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    onUpdateSystemConfig(localConfig);
    alert("Konfigurasi kinerja berhasil disimpan!");
  };

  const handleReset = () => {
    setLocalConfig(systemConfig);
  };

  const handleUpdateCategory = (id: string, field: string, value: any) => {
    const currentList = localConfig.performanceCategories || [];
    const updatedList = currentList.map(item => item.id === id ? { ...item, [field]: value } : item);
    handleUpdateConfig({ performanceCategories: updatedList });
  };

  const activeMethod = localConfig.defaultReviewMethod || "okr";
  
  const currentMetrics = localConfig.metricsGlossary || METRICS_DATABASE_DEFAULT;

  const handleUpdateMetric = (id: string, field: keyof MetricItem, value: any) => {
    const updatedMetrics = currentMetrics.map(m => m.id === id ? { ...m, [field]: value } : m);
    handleUpdateConfig({ metricsGlossary: updatedMetrics });
  };

  const handleAddMetric = () => {
    const newMetric: MetricItem = {
      id: `custom_${Date.now()}`,
      nameID: "Metrik Baru",
      nameEN: "New Metric",
      category: "performance",
      definitionID: "Definisi metrik baru",
      definitionEN: "New metric definition",
      formulaID: "Rumus = X + Y",
      formulaEN: "Formula = X + Y",
      sourceID: "Sumber data metrik ini",
      sourceEN: "Data source for this metric",
      exampleID: "Contoh: 10 + 5 = 15",
      exampleEN: "Example: 10 + 5 = 15",
      iconName: "Activity"
    };
    handleUpdateConfig({ metricsGlossary: [...currentMetrics, newMetric] });
    setExpandedMetricId(newMetric.id);
  };

  const handleDeleteMetric = (id: string) => {
    handleUpdateConfig({ metricsGlossary: currentMetrics.filter(m => m.id !== id) });
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Settings className="size-6 text-emerald-600" />
            Konfigurasi Manajemen Kinerja
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Pengaturan ini dibuat sangat sederhana agar mudah digunakan oleh siapapun.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
            <RotateCcw className="size-4" /> Reset
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2">
            <Save className="size-4" /> Save Changes
          </button>
        </div>
      </div>

      {/* PILIH METODE */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <ClipboardCheck className="size-5 text-emerald-600" />
          Pilih Metode Penilaian Utama
        </h3>
        <p className="text-slate-500 text-sm">
          Pilih metode manajemen kinerja yang akan digunakan secara default di perusahaan Anda.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleUpdateConfig({ defaultReviewMethod: "okr" })}
            className={`p-4 rounded-xl border text-center transition-all ${
              activeMethod === "okr"
                ? "bg-emerald-600 border-emerald-700 text-white shadow-md font-bold"
                : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200 font-semibold"
            }`}
          >
            🎯 OKR & Kualitatif
          </button>
          <button
            type="button"
            onClick={() => handleUpdateConfig({ defaultReviewMethod: "kpi" })}
            className={`p-4 rounded-xl border text-center transition-all ${
              activeMethod === "kpi"
                ? "bg-indigo-600 border-indigo-700 text-white shadow-md font-bold"
                : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200 font-semibold"
            }`}
          >
            📈 KPI Berbobot
          </button>
          <button
            type="button"
            onClick={() => handleUpdateConfig({ defaultReviewMethod: "bsc360" })}
            className={`p-4 rounded-xl border text-center transition-all ${
              activeMethod === "bsc360"
                ? "bg-purple-600 border-purple-700 text-white shadow-md font-bold"
                : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200 font-semibold"
            }`}
          >
            🧩 BSC (Balance Score Card)
          </button>
        </div>
      </div>

      {/* CAKUPAN KEBIJAKAN */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Users className="size-5 text-indigo-600" />
          Cakupan Kebijakan (Pemberlakuan)
        </h3>
        <p className="text-slate-500 text-sm">
          Tentukan karyawan, jabatan, atau departemen mana saja yang akan diberlakukan kebijakan konfigurasi ini.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              const current = localConfig.assignments || [];
              const newAssg = {
                id: `cfg_assg_${Date.now()}`,
                targetType: "all" as const,
                targetId: null
              };
              handleUpdateConfig({ assignments: [...current, newAssg] });
            }}
            className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
          >
            <Plus className="size-4" /> Tambah Target Pemberlakuan
          </button>

          {(localConfig.assignments || []).length === 0 && (
            <div className="text-sm text-slate-500 text-center py-4 bg-white rounded-lg border border-slate-200 border-dashed">
              Belum ada target yang diatur. Kebijakan ini tidak akan aktif.
            </div>
          )}

          {(localConfig.assignments || []).map((assg) => (
            <div key={assg.id} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-white p-3 rounded-xl border border-slate-200">
              <select
                value={assg.targetType}
                onChange={(e) => {
                  const updated = (localConfig.assignments || []).map(a => 
                    a.id === assg.id ? { ...a, targetType: e.target.value as any, targetId: null } : a
                  );
                  handleUpdateConfig({ assignments: updated });
                }}
                className="border border-slate-300 rounded-lg p-2 bg-slate-50 text-sm font-bold w-full md:w-1/3"
              >
                <option value="all">Semua Karyawan (Global)</option>
                <option value="department">Departemen Tertentu</option>
                <option value="role">Jabatan Tertentu</option>
                <option value="employee">Karyawan Tertentu</option>
              </select>

              {assg.targetType === "department" && (
                <select
                  value={assg.targetId || ""}
                  onChange={(e) => {
                    const updated = (localConfig.assignments || []).map(a => 
                      a.id === assg.id ? { ...a, targetId: e.target.value } : a
                    );
                    handleUpdateConfig({ assignments: updated });
                  }}
                  className="border border-slate-300 rounded-lg p-2 bg-slate-50 text-sm font-semibold w-full md:w-1/2"
                >
                  <option value="" disabled>Pilih Departemen...</option>
                  {circles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}

              {assg.targetType === "role" && (
                <select
                  value={assg.targetId || ""}
                  onChange={(e) => {
                    const updated = (localConfig.assignments || []).map(a => 
                      a.id === assg.id ? { ...a, targetId: e.target.value } : a
                    );
                    handleUpdateConfig({ assignments: updated });
                  }}
                  className="border border-slate-300 rounded-lg p-2 bg-slate-50 text-sm font-semibold w-full md:w-1/2"
                >
                  <option value="" disabled>Pilih Jabatan...</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
              )}

              {assg.targetType === "employee" && (
                <select
                  value={assg.targetId || ""}
                  onChange={(e) => {
                    const updated = (localConfig.assignments || []).map(a => 
                      a.id === assg.id ? { ...a, targetId: e.target.value } : a
                    );
                    handleUpdateConfig({ assignments: updated });
                  }}
                  className="border border-slate-300 rounded-lg p-2 bg-slate-50 text-sm font-semibold w-full md:w-1/2"
                >
                  <option value="" disabled>Pilih Karyawan...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              )}

              {assg.targetType === "all" && (
                <div className="w-full md:w-1/2 flex items-center px-2 text-sm text-emerald-600 font-medium">
                  Berlaku untuk seluruh perusahaan
                </div>
              )}

              <button
                onClick={() => {
                  const updated = (localConfig.assignments || []).filter(a => a.id !== assg.id);
                  handleUpdateConfig({ assignments: updated });
                }}
                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors ml-auto shrink-0"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* TATA KELOLA KUARTAL */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Settings className="size-5 text-emerald-600" />
          {lang === "ID" ? "Tata Kelola Kuartal" : "Quarter Governance"}
        </h3>
        <p className="text-slate-500 text-sm">
          {lang === "ID" 
            ? "Konfigurasi siklus, batas waktu, dan ambang batas pencapaian target kuartal." 
            : "Configure cycle, deadlines, and target achievement thresholds for the active quarter."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <label className="block text-slate-705 mb-2 font-bold text-sm flex items-center gap-1.5">
              {lang === "ID" ? "Kuartal Berjalan" : "Active Quarter"}
              <TooltipWrapper content={lang === "ID" ? "Menentukan label periode aktif." : "Sets the active period label."}>
                <Info className="size-3 text-slate-400" />
              </TooltipWrapper>
            </label>
            <input
              type="text"
              value={localConfig.currentQuarter || "Q1 2026"}
              onChange={(e) => handleUpdateConfig({ currentQuarter: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-bold focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Q1 2026"
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <label className="block text-slate-705 mb-2 font-bold text-sm flex items-center gap-1.5">
              {lang === "ID" ? "Sisa Hari Kerja (Notifikasi)" : "Remaining Work Days"}
              <TooltipWrapper content={lang === "ID" ? "Ambang batas hari notifikasi." : "Notification threshold in days."}>
                <Info className="size-3 text-slate-400" />
              </TooltipWrapper>
            </label>
            <input
              type="number"
              value={localConfig.daysRemaining || 15}
              onChange={(e) => handleUpdateConfig({ daysRemaining: Number(e.target.value) })}
              className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-bold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <label className="block text-slate-705 mb-2 font-bold text-sm flex items-center gap-1.5">
              {lang === "ID" ? "Tanggal Mulai Kuartal" : "Quarter Start Date"}
              <TooltipWrapper content={lang === "ID" ? "Tanggal awal periode berjalan." : "Start date of active period."}>
                <Info className="size-3 text-slate-400" />
              </TooltipWrapper>
            </label>
            <input
              type="date"
              value={localConfig.startDate || "2026-01-01"}
              onChange={(e) => handleUpdateConfig({ startDate: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-bold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <label className="block text-slate-705 mb-2 font-bold text-sm flex items-center gap-1.5">
              {lang === "ID" ? "Tanggal Selesai Kuartal" : "Quarter End Date"}
              <TooltipWrapper content={lang === "ID" ? "Tanggal akhir periode berjalan." : "End date of active period."}>
                <Info className="size-3 text-slate-400" />
              </TooltipWrapper>
            </label>
            <input
              type="date"
              value={localConfig.endDate || "2026-03-31"}
              onChange={(e) => handleUpdateConfig({ endDate: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-bold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <label className="block text-slate-705 mb-2 font-bold text-sm flex items-center gap-1.5">
              {lang === "ID" ? "Target Komitmen %" : "Committed Target %"}
              <TooltipWrapper content={lang === "ID" ? "Ambang batas untuk target komitmen." : "Threshold for committed targets."}>
                <Info className="size-3 text-slate-400" />
              </TooltipWrapper>
            </label>
            <input
              type="number"
              value={localConfig.committedThreshold || 100}
              onChange={(e) => handleUpdateConfig({ committedThreshold: Number(e.target.value) })}
              className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-bold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <label className="block text-slate-705 mb-2 font-bold text-sm flex items-center gap-1.5">
              {lang === "ID" ? "Target Aspirasional %" : "Aspirational Target %"}
              <TooltipWrapper content={lang === "ID" ? "Ambang batas untuk target aspirasional." : "Threshold for aspirational targets."}>
                <Info className="size-3 text-slate-400" />
              </TooltipWrapper>
            </label>
            <input
              type="number"
              value={localConfig.aspirationalThreshold || 70}
              onChange={(e) => handleUpdateConfig({ aspirationalThreshold: Number(e.target.value) })}
              className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-bold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 md:col-span-2">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="notif-activation-chk"
                checked={localConfig.remindersEnabled ?? true}
                onChange={(e) => handleUpdateConfig({ remindersEnabled: e.target.checked })}
                className="rounded-sm text-emerald-600 focus:ring-emerald-500 mt-1"
              />
              <div>
                <label
                  htmlFor="notif-activation-chk"
                  className="cursor-pointer font-bold text-sm text-slate-700"
                >
                  {lang === "ID" ? "Aktifkan Warning Banner Pengingat Kuartal" : "Enable Quarter Deadline Banner"}
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === "ID" ? "Menampilkan notifikasi berwarna oranye/merah saat batas kuartal kritis terlewati." : "Shows alert banner when deadline approaches."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PENGATURAN UMUM SaaS HRIS */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Settings className="size-5 text-indigo-600" />
          Pengaturan Workflow & Siklus SaaS
        </h3>
        <p className="text-slate-500 text-sm">
          Konfigurasi standar operasional HRIS tingkat lanjut untuk perusahaan Anda.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Siklus Evaluasi */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <label className="block text-slate-705 mb-2 font-bold text-sm flex items-center gap-1.5">
              Siklus Evaluasi
              <TooltipWrapper content="Seberapa sering evaluasi kinerja formal dilakukan.">
                <Info className="size-3 text-slate-400" />
              </TooltipWrapper>
            </label>
            <select
              value={localConfig.evaluationFrequency || "quarterly"}
              onChange={(e) => handleUpdateConfig({ evaluationFrequency: e.target.value as any })}
              className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-bold"
            >
              <option value="monthly">Bulanan (Monthly)</option>
              <option value="quarterly">Kuartal (Quarterly)</option>
              <option value="semi_annually">Semester (Semi-Annually)</option>
              <option value="annually">Tahunan (Annually)</option>
            </select>
          </div>

          {/* Workflow Persetujuan */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <label className="block text-slate-705 mb-2 font-bold text-sm flex items-center gap-1.5">
              Workflow Persetujuan
              <TooltipWrapper content="Alur persetujuan berjenjang yang dibutuhkan untuk memvalidasi OKR, KPI, atau Review.">
                <Info className="size-3 text-slate-400" />
              </TooltipWrapper>
            </label>
            <div className="space-y-2">
              {(Array.isArray(localConfig.approvalWorkflow) ? localConfig.approvalWorkflow : ["atasan_langsung"]).map((roleId, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded text-xs">Level {idx + 1}</span>
                  <select
                    value={roleId}
                    onChange={(e) => {
                      const newWf = [...(Array.isArray(localConfig.approvalWorkflow) ? localConfig.approvalWorkflow : ["atasan_langsung"])];
                      newWf[idx] = e.target.value;
                      handleUpdateConfig({ approvalWorkflow: newWf });
                    }}
                    className="flex-1 border border-slate-300 rounded-lg p-2 bg-slate-50 text-sm font-semibold text-slate-700"
                  >
                    {(localConfig.rolePermissions || [
                      { id: "direksi", name: "Direksi" },
                      { id: "atasan_tidak_langsung", name: "Atasan Tidak Langsung" },
                      { id: "atasan_langsung", name: "Atasan Langsung" },
                      { id: "karyawan", name: "Karyawan" }
                    ]).map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const newWf = [...(Array.isArray(localConfig.approvalWorkflow) ? localConfig.approvalWorkflow : ["atasan_langsung"])];
                      newWf.splice(idx, 1);
                      handleUpdateConfig({ approvalWorkflow: newWf });
                    }}
                    className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newWf = [...(Array.isArray(localConfig.approvalWorkflow) ? localConfig.approvalWorkflow : ["atasan_langsung"])];
                  newWf.push("atasan_langsung");
                  handleUpdateConfig({ approvalWorkflow: newWf });
                }}
                className="text-xs bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-emerald-200 transition-colors mt-2"
              >
                <Plus className="size-3" /> Tambah Level Approval
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* CONFIG BERDASARKAN METODE */}
      {activeMethod === "okr" ? (
        <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Target Maksimal OKR</h3>
          <p className="text-slate-500 text-sm">
            Tentukan target nilai maksimal dari tipe penyelarasan OKR.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <label className="block text-slate-705 mb-1 font-bold text-sm flex items-center gap-1.5">
                Target Commitment (%)
                <TooltipWrapper content="Target standar yang harus dipenuhi 100%.">
                  <Info className="size-3 text-slate-400" />
                </TooltipWrapper>
              </label>
              <input
                type="number"
                value={localConfig.committedThreshold || 100}
                onChange={(e) => handleUpdateConfig({ committedThreshold: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-bold"
              />
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <label className="block text-slate-705 mb-1 font-bold text-sm flex items-center gap-1.5">
                Target Aspirational (%)
                <TooltipWrapper content="Target inovatif yang ambisius. Biasanya tercapai 70% sudah dianggap memuaskan.">
                  <Info className="size-3 text-slate-400" />
                </TooltipWrapper>
              </label>
              <input
                type="number"
                value={localConfig.aspirationalThreshold || 70}
                onChange={(e) => handleUpdateConfig({ aspirationalThreshold: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-bold"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Settings className="size-5 text-blue-600" />
            Pengaturan Sistem Kalkulasi Target ({activeMethod === "kpi" ? "KPI" : "BSC"})
          </h3>
          <p className="text-slate-500 text-sm">
            Konfigurasi batas maksimal skor untuk setiap jenis metode kalkulasi beserta nilai skor usaha minimalnya.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Maximize */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 border-b pb-2 mb-3">Maximize</h4>
              <div>
                <label className="block text-slate-705 mb-1 font-bold text-xs flex items-center gap-1.5">
                  Skor Maksimal
                  <TooltipWrapper content="Batas maksimal skor untuk perhitungan Maximize (Semakin tinggi semakin baik).">
                    <Info className="size-3 text-slate-400" />
                  </TooltipWrapper>
                </label>
                <input
                  type="number"
                  min="100"
                  max="200"
                  value={localConfig.calcSystemConfig?.maximizeMaxScore || 120}
                  onChange={(e) => handleUpdateConfig({
                    calcSystemConfig: { ...localConfig.calcSystemConfig, maximizeMaxScore: Number(e.target.value) }
                  })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-705 mb-1 font-bold text-xs flex items-center gap-1.5">
                  Skor Usaha Minimal (Base)
                  <TooltipWrapper content="Nilai minimal yang diberikan sebagai apresiasi usaha jika pencapaian aktual jauh dari target.">
                    <Info className="size-3 text-slate-400" />
                  </TooltipWrapper>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={localConfig.calcSystemConfig?.maximizeBaseScore ?? 20}
                  onChange={(e) => handleUpdateConfig({
                    calcSystemConfig: { ...localConfig.calcSystemConfig, maximizeBaseScore: Number(e.target.value) }
                  })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 font-bold text-sm"
                />
              </div>
            </div>

            {/* Minimize */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 border-b pb-2 mb-3">Minimize</h4>
              <div>
                <label className="block text-slate-705 mb-1 font-bold text-xs flex items-center gap-1.5">
                  Skor Maksimal
                  <TooltipWrapper content="Batas maksimal skor untuk perhitungan Minimize (Semakin rendah semakin baik).">
                    <Info className="size-3 text-slate-400" />
                  </TooltipWrapper>
                </label>
                <input
                  type="number"
                  min="100"
                  max="200"
                  value={localConfig.calcSystemConfig?.minimizeMaxScore || 120}
                  onChange={(e) => handleUpdateConfig({
                    calcSystemConfig: { ...localConfig.calcSystemConfig, minimizeMaxScore: Number(e.target.value) }
                  })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-705 mb-1 font-bold text-xs flex items-center gap-1.5">
                  Skor Usaha Minimal (Base)
                  <TooltipWrapper content="Nilai minimal yang diberikan sebagai apresiasi usaha jika pencapaian aktual jauh dari target.">
                    <Info className="size-3 text-slate-400" />
                  </TooltipWrapper>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={localConfig.calcSystemConfig?.minimizeBaseScore ?? 20}
                  onChange={(e) => handleUpdateConfig({
                    calcSystemConfig: { ...localConfig.calcSystemConfig, minimizeBaseScore: Number(e.target.value) }
                  })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 font-bold text-sm"
                />
              </div>
            </div>

            {/* Min to Zero */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 border-b pb-2 mb-3">Min to Zero</h4>
              <div>
                <label className="block text-slate-705 mb-1 font-bold text-xs flex items-center gap-1.5">
                  Penalti Default (%)
                  <TooltipWrapper content="Faktor penalti default dalam persentase untuk setiap unit nilai di atas nol.">
                    <Info className="size-3 text-slate-400" />
                  </TooltipWrapper>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={localConfig.calcSystemConfig?.defaultPenaltyFactor || 20}
                  onChange={(e) => handleUpdateConfig({
                    calcSystemConfig: { ...localConfig.calcSystemConfig, defaultPenaltyFactor: Number(e.target.value) }
                  })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-705 mb-1 font-bold text-xs flex items-center gap-1.5">
                  Skor Usaha Minimal (Base)
                  <TooltipWrapper content="Nilai minimal yang diberikan sebagai apresiasi usaha jika pencapaian aktual jauh dari target.">
                    <Info className="size-3 text-slate-400" />
                  </TooltipWrapper>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={localConfig.calcSystemConfig?.minToZeroBaseScore ?? 20}
                  onChange={(e) => handleUpdateConfig({
                    calcSystemConfig: { ...localConfig.calcSystemConfig, minToZeroBaseScore: Number(e.target.value) }
                  })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 font-bold text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-3 mt-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <strong className="text-slate-800 block mb-1">Catatan Skor Usaha Minimal:</strong>
              <p className="text-xs text-slate-500">
                Sistem akan membandingkan hasil perhitungan murni <strong>(Aktual/Target)</strong> dengan <strong>Skor Usaha Minimal</strong> dari setiap metode. 
                Jika hasil perhitungan lebih kecil dari skor usaha minimal, maka sistem akan menggunakan skor usaha minimal sebagai bentuk apresiasi karena karyawan telah melakukan usaha, alih-alih memberikan skor 0.
              </p>
            </div>
          </div>
        </div>
      )}


      {/* MANAJEMEN PERSPEKTIF (BSC) */}
      {activeMethod === "bsc360" && (
        <>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Compass className="size-5 text-indigo-600" />
                Manajemen Perspektif (BSC)
              </h3>
              <button
                type="button"
                onClick={() => {
                  const currentBsc = localConfig.defaultBscPerspectives || [
                    { id: "financial", name: "Keuangan", weight: 25, score: 0 },
                    { id: "customer", name: "Pelanggan", weight: 25, score: 0 },
                    { id: "internal_process", name: "Proses Internal", weight: 25, score: 0 },
                    { id: "learning_growth", name: "Pembelajaran & Pertumbuhan", weight: 25, score: 0 }
                  ];
                  const newPerspective = {
                    id: `bsc_${Date.now()}`,
                    name: "Perspektif Baru",
                    weight: 0,
                    score: 0
                  };
                  handleUpdateConfig({ defaultBscPerspectives: [...currentBsc, newPerspective] });
                }}
                className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
              >
                <Plus className="size-4" /> Tambah Perspektif
              </button>
            </div>
            <p className="text-slate-500 text-sm">
              Konfigurasi perspektif BSC (Nama, Bobot). Pastikan total bobot mencapai nilai yang diharapkan.
            </p>

            <div className="grid grid-cols-1 gap-3">
              {(() => {
                 const defaultBsc = localConfig.defaultBscPerspectives || [
                    { id: "financial", name: "Keuangan", weight: 25, score: 0 },
                    { id: "customer", name: "Pelanggan", weight: 25, score: 0 },
                    { id: "internal_process", name: "Proses Internal", weight: 25, score: 0 },
                    { id: "learning_growth", name: "Pembelajaran & Pertumbuhan", weight: 25, score: 0 }
                 ];

                 const updatePerspective = (id: string, key: string, value: any) => {
                   const updated = defaultBsc.map(p => p.id === id ? { ...p, [key]: value } : p);
                   handleUpdateConfig({ defaultBscPerspectives: updated });
                 };
                 
                 const deletePerspective = (id: string) => {
                   const updated = defaultBsc.filter(p => p.id !== id);
                   handleUpdateConfig({ defaultBscPerspectives: updated });
                 };

                 return defaultBsc.map(p => (
                   <div key={p.id} className="flex gap-4 items-center bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Nama Perspektif (Sasaran)</label>
                        <select
                          value={p.name}
                          onChange={(e) => updatePerspective(p.id, "name", e.target.value)}
                          className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm font-semibold bg-slate-50"
                        >
                          <option value="Keuangan">Keuangan</option>
                          <option value="Pelanggan">Pelanggan</option>
                          <option value="Proses Internal">Proses Internal</option>
                          <option value="Pembelajaran & Pertumbuhan">Pembelajaran & Pertumbuhan</option>
                        </select>
                      </div>
                      <div className="w-24 shrink-0">
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Bobot (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={p.weight}
                          onChange={(e) => updatePerspective(p.id, "weight", Number(e.target.value))}
                          className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm font-semibold"
                        />
                      </div>
                      <div className="flex items-end shrink-0 pt-5">
                        <button
                           onClick={() => deletePerspective(p.id)}
                           className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                         >
                           <Trash2 className="size-4" />
                         </button>
                      </div>
                   </div>
                 ));
              })()}
            </div>
          </div>
        </>
      )}

      {/* DEFINISI KATEGORI KINERJA (Selalu Ada) */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <ClipboardCheck className="size-5 text-emerald-600" />
          Kategori Range Kinerja
        </h3>
        <p className="text-slate-500 text-sm">
          Tentukan rentang skor pencapaian untuk masing-masing kategori penilaian akhir.
        </p>
        <div className="grid grid-cols-1 gap-2">
          {(localConfig.performanceCategories || []).map((cat) => (
            <div key={cat.id} className="flex gap-4 items-center bg-white p-3 rounded-lg border border-slate-200 text-xs">
              <span className={`font-bold flex-1 px-3 py-1.5 rounded-md ${cat.color} border`}>
                {cat.name}
              </span>
              
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono block text-center">Min Skor (%)</span>
                <input
                  type="number"
                  step="0.01"
                  value={cat.minScore}
                  onChange={(e) => handleUpdateCategory(cat.id, "minScore", Number(e.target.value))}
                  className="w-20 text-center border border-slate-200 rounded font-bold font-mono p-1.5 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono block text-center">Max Skor (%)</span>
                <input
                  type="number"
                  step="0.01"
                  value={cat.maxScore}
                  onChange={(e) => handleUpdateCategory(cat.id, "maxScore", Number(e.target.value))}
                  className="w-20 text-center border border-slate-200 rounded font-bold font-mono p-1.5 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KAMUS METRIK & GLOSARIUM */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="size-5 text-indigo-600" />
              Kamus Metrik &amp; Glosarium
            </h3>
            <p className="text-slate-500 text-sm">
              Kelola daftar definisi, rumus, dan parameter setiap metrik yang digunakan di perusahaan. 
              Data ini akan muncul di popup bantuan Glosarium (kapan pun user mengkliknya).
            </p>
          </div>
          <button 
            type="button"
            onClick={handleAddMetric}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="size-4" /> Tambah Metrik
          </button>
        </div>

        <div className="space-y-3">
          {currentMetrics.map(metric => {
            const isExpanded = expandedMetricId === metric.id;
            return (
              <div key={metric.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => setExpandedMetricId(isExpanded ? null : metric.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Activity className="size-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{lang === "ID" ? metric.nameID : metric.nameEN}</h4>
                      <p className="text-[10px] text-slate-400 capitalize">{metric.category} metric</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteMetric(metric.id); }}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                      title="Hapus Metrik"
                    >
                      <Trash2 className="size-4" />
                    </button>
                    {isExpanded ? <ChevronUp className="size-5 text-slate-400" /> : <ChevronDown className="size-5 text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50 space-y-4 text-sm mt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Metrik (ID)</label>
                        <input 
                          type="text" value={metric.nameID}
                          onChange={(e) => handleUpdateMetric(metric.id, "nameID", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Kategori</label>
                        <select 
                          value={metric.category}
                          onChange={(e) => handleUpdateMetric(metric.id, "category", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800"
                        >
                          <option value="performance">Performance</option>
                          <option value="360">360 Feedback</option>
                          <option value="succession">Succession</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Definisi Operasional (ID)</label>
                      <textarea 
                        value={metric.definitionID} rows={2}
                        onChange={(e) => handleUpdateMetric(metric.id, "definitionID", e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Rumus / Formula (ID)</label>
                      <textarea 
                        value={metric.formulaID} rows={2}
                        onChange={(e) => handleUpdateMetric(metric.id, "formulaID", e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 font-mono text-xs text-indigo-700"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Sumber Data (ID)</label>
                        <textarea 
                          value={metric.sourceID} rows={2}
                          onChange={(e) => handleUpdateMetric(metric.id, "sourceID", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Contoh Perhitungan (ID)</label>
                        <textarea 
                          value={metric.exampleID} rows={2}
                          onChange={(e) => handleUpdateMetric(metric.id, "exampleID", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 text-xs text-emerald-700 bg-emerald-50/30"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
