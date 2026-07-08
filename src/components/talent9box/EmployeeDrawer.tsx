import React from "react";
import { TalentEmployee, SystemConfig } from "../../types";
import { METRICS_DATABASE_DEFAULT } from "../MetricsGlossary";
import { X, MapPin, Briefcase, CalendarDays, Award, GraduationCap, ShieldAlert, HeartHandshake, TrendingUp, ChevronRight, Info } from "lucide-react";
import { TooltipWrapper } from "../TooltipContext";

export default function EmployeeDrawer({ employee, onClose, lang = "ID", systemConfig }: { employee: TalentEmployee, onClose: () => void, lang?: "ID" | "EN", systemConfig?: SystemConfig }) {
  const methodTerm = systemConfig?.defaultReviewMethod === "kpi" ? "KPI" : systemConfig?.defaultReviewMethod === "bsc360" ? "BSC" : "OKR";
  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-800">Talent Profile</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col md:flex-row h-full">
            
            {/* Left Sidebar - Profile Info */}
            <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-100 p-8 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <img src={employee.avatar} alt={employee.name} className="w-32 h-32 rounded-full border-4 border-white shadow-md" />
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-slate-900">{employee.name}</h3>
              <p className="text-sm font-bold text-indigo-600 mb-1">{employee.position}</p>
              <p className="text-xs font-medium text-slate-500 mb-4">{employee.department}</p>
              
              {/* Succession Readiness Flag for High Potential / Eligible boxes */}
              {["box_6", "box_8", "box_9"].includes(employee.boxId) && (
                <div className="mb-6 w-full flex justify-center">
                  <TooltipWrapper
                    content={lang === "ID"
                      ? "Indeks Kesiapan Suksesi (SRI)\nAsal Data: Kalkulasi otomatis berdasarkan data master profil karyawan.\nRumus: SRI = (Kinerja × W_perf) + (Potensi × W_pot) + (Leadership × W_lead) + (Tenure × W_tenure) + (Kesiapan × W_ready)"
                      : "Succession Readiness Index (SRI)\nData Source: Succession engine calculations based on master employee profiles.\nFormula: SRI = (Performance × W_perf) + (Potential × W_pot) + (Leadership × W_lead) + (Tenure Factor × W_tenure) + (Readiness Status × W_ready)"}
                    className="w-full"
                  >
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm cursor-help w-full justify-center">
                      <Award className="size-5 text-amber-600 shrink-0" />
                      <div className="text-left leading-tight">
                        <div className="text-[10px] uppercase font-black tracking-wider text-amber-600/80 flex items-center gap-1">
                          {lang === "ID" ? "Kesiapan Suksesi" : "Succession Ready"} <Info className="size-2.5 text-amber-400" />
                        </div>
                        <div className="text-sm font-black">SRI {Math.round((employee.performanceScore * 0.3) + (employee.potentialScore * 0.3) + ((employee.leadershipScore || 65) * 0.2) + (employee.tenureYears >= 5 ? 10 : employee.tenureYears >= 3 ? 9 : employee.tenureYears >= 2 ? 7.5 : 5.5) + (employee.readinessLevel === 'Ready Now' ? 10 : employee.readinessLevel === '1-2 Years' ? 7.5 : 5))}%</div>
                      </div>
                    </div>
                  </TooltipWrapper>
                </div>
              )}
              
              <div className="w-full space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <MapPin className="size-4 text-slate-400" /> {employee.location}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <Briefcase className="size-4 text-slate-400" /> {employee.division} Division
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <CalendarDays className="size-4 text-slate-400" /> Joined {employee.joinDate} ({employee.tenureYears} yrs)
                </div>
              </div>

              <div className="mt-8 w-full text-left">
                <h4 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-wider">Talent Badges</h4>
                <div className="flex flex-wrap gap-2">
                  {employee.badges.map(badge => (
                    <span key={badge} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 flex items-center gap-1.5">
                      <Award className="size-3" /> {badge}
                    </span>
                  ))}
                  {employee.badges.length === 0 && <span className="text-xs text-slate-400">No active badges</span>}
                </div>
              </div>
            </div>

            {/* Right Content - Analytics & Scores */}
            <div className="w-full md:w-2/3 p-8 space-y-8 bg-white">
              
              {/* Current Status Box */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest block mb-1">Current Placement</span>
                  <h3 className="text-2xl font-black">{employee.boxId.replace('_', ' ').toUpperCase()}</h3>
                  <p className="text-sm text-slate-400 mt-1">Based on latest performance and potential review.</p>
                </div>
                <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                  <TrendingUp className="size-8 text-emerald-400" />
                </div>
              </div>

              {/* Core Metrics */}
              <div>
                <h4 className="text-sm font-black uppercase text-slate-800 mb-4 tracking-wider flex items-center gap-2">
                  <BarChart2 className="size-4 text-indigo-600" /> Core Assessment
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <TooltipWrapper
                    content={lang === "ID"
                      ? `${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.nameID}\nAsal Data: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.sourceID}\nRumus: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.formulaID}`
                      : `${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.nameEN}\nData Source: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.sourceEN}\nFormula: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.formulaEN}`}
                    className="w-full"
                  >
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 cursor-help w-full">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                          Performance <Info className="size-3 text-slate-400" />
                        </span>
                        <span className="text-lg font-black text-slate-800">{employee.performanceScore}/100</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-4 overflow-hidden">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${employee.performanceScore}%` }}></div>
                      </div>
                    </div>
                  </TooltipWrapper>

                  <TooltipWrapper
                    content={lang === "ID"
                      ? `${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "potential_score")?.nameID}\nAsal Data: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "potential_score")?.sourceID}\nRumus: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "potential_score")?.formulaID}`
                      : `${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "potential_score")?.nameEN}\nData Source: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "potential_score")?.sourceEN}\nFormula: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "potential_score")?.formulaEN}`}
                    className="w-full"
                  >
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 cursor-help w-full">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                          Potential <Info className="size-3 text-slate-400" />
                        </span>
                        <span className="text-lg font-black text-slate-800">{employee.potentialScore}/100</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-4 overflow-hidden">
                        <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${employee.potentialScore}%` }}></div>
                      </div>
                    </div>
                  </TooltipWrapper>
                </div>
              </div>

              {/* Readiness & Risk */}
              <div>
                <h4 className="text-sm font-black uppercase text-slate-800 mb-2 tracking-wider flex items-center gap-2">
                  <GraduationCap className="size-4 text-indigo-600" /> Readiness & Risk
                </h4>
                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  ⚠️ <strong className="text-slate-700">Sumber Data:</strong> Indikator di bawah ditarik langsung secara terpusat dari database profil karyawan (<code className="bg-slate-200 px-1 rounded text-slate-600">readinessLevel</code>, <code className="bg-slate-200 px-1 rounded text-slate-600">riskLevel</code>, dan <code className="bg-slate-200 px-1 rounded text-slate-600">leadershipScore</code>) hasil integrasi tinjauan HR, status retensi, dan Asesmen Kepemimpinan 360°.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><TrendingUp className="size-4" /></div>
                        <span className="text-xs font-bold text-slate-500">Promotion</span>
                      </div>
                      <div className="text-sm font-black text-slate-800">{employee.readinessLevel}</div>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-2 border-t pt-1 border-slate-100">Kesiapan waktu promosi berdasarkan review divisi</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 bg-red-100 text-red-600 rounded-lg"><ShieldAlert className="size-4" /></div>
                        <span className="text-xs font-bold text-slate-500">Flight Risk</span>
                      </div>
                      <div className={`text-sm font-black ${employee.riskLevel === 'High' ? 'text-red-600' : 'text-slate-800'}`}>{employee.riskLevel}</div>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-2 border-t pt-1 border-slate-100">Potensi risiko hengkang dari survei retensi/tenure</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><HeartHandshake className="size-4" /></div>
                        <span className="text-xs font-bold text-slate-500">Leadership</span>
                      </div>
                      <div className="text-sm font-black text-slate-800">{employee.leadershipScore}/100</div>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-2 border-t pt-1 border-slate-100">Hasil Asesmen Manajerial & Skor Kompetensi</div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="text-sm font-black uppercase text-slate-800 mb-2 tracking-wider flex items-center gap-2">
                  <Award className="size-4 text-indigo-600" /> Smart Recommended Actions
                </h4>
                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  💡 <strong className="text-slate-700">Sumber Formulasi:</strong> Tindakan taktis ini direkomendasikan secara dinamis berdasarkan kuadran 9-Box aktif karyawan (<strong className="text-indigo-600">{employee.boxId.replace('_', ' ').toUpperCase()}</strong>) yang dikonfigurasikan pada sistem suksesi.
                </p>
                <div className="space-y-2">
                  {[
                    "Assign to cross-functional strategic project",
                    "Enroll in Executive Leadership Mentoring program",
                    "Prepare succession plan documentation"
                  ].map((rec, i) => (
                    <button key={i} className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 flex justify-between items-center transition-colors">
                      {rec}
                      <ChevronRight className="size-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ensure icons are imported
import { BarChart2 } from "lucide-react";
