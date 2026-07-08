import React, { useState } from "react";
import { TalentEmployee, BoxConfig, SystemConfig } from "../../types";
import { X, Users, BarChart2, Building, History, Search, ArrowRight, TrendingUp, AlertTriangle, Award, Info } from "lucide-react";
import EmployeeDrawer from "./EmployeeDrawer";
import { TooltipWrapper } from "../TooltipContext";
import { METRICS_DATABASE_DEFAULT } from "../MetricsGlossary";

export default function TalentExplorer({ boxConfig, employees, onClose, lang = "ID", systemConfig }: { boxConfig: BoxConfig, employees: TalentEmployee[], onClose: () => void, lang?: "ID" | "EN", systemConfig?: SystemConfig }) {
  const methodTerm = systemConfig?.defaultReviewMethod === "kpi" ? "KPI" : systemConfig?.defaultReviewMethod === "bsc360" ? "BSC" : "OKR";
  const [activeTab, setActiveTab] = useState<"employee" | "analytics" | "department" | "history">("employee");
  const [selectedEmp, setSelectedEmp] = useState<TalentEmployee | null>(null);
  const [search, setSearch] = useState("");

  const filteredEmps = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.department.toLowerCase().includes(search.toLowerCase()) ||
    e.position.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-5xl bg-slate-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300">
        
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-slate-200 flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`w-3 h-3 rounded-full \${boxConfig.color}`}></span>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">BOX {boxConfig.boxNumber} Explorer</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800">{boxConfig.name}</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">{boxConfig.description} • {employees.length} Employees</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="size-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 bg-white border-b border-slate-200 shrink-0">
          <div className="flex gap-6">
            {[
              { id: "employee", label: "Employees", icon: Users },
              { id: "analytics", label: "Analytics", icon: BarChart2 },
              { id: "department", label: "Departments", icon: Building },
              { id: "history", label: "History", icon: History },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors \${activeTab === tab.id ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              >
                <tab.icon className="size-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "employee" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                <input
                  type="text"
                  placeholder="Search in this box..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full max-w-md pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Score (Perf/Pot)</th>
                      <th className="px-4 py-3">Risk</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmps.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={emp.avatar} alt="" className="w-8 h-8 rounded-full bg-slate-200" />
                            <div>
                              <div className="font-bold text-slate-800 flex items-center gap-2">
                                {emp.name}
                                {/* Succession Readiness Flag for High Potential / Eligible boxes */}
                                {["box_6", "box_8", "box_9"].includes(emp.boxId) && (
                                  <TooltipWrapper
                                    content={lang === "ID" 
                                      ? `${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "sri_score")?.nameID}\nAsal Data: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "sri_score")?.sourceID}\nRumus: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "sri_score")?.formulaID}`
                                      : `${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "sri_score")?.nameEN}\nData Source: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "sri_score")?.sourceEN}\nFormula: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "sri_score")?.formulaEN}`}
                                  >
                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold shadow-sm cursor-help" title="High Potential - Succession Ready">
                                      <Award className="size-3" />
                                      SRI {Math.round((emp.performanceScore * 0.3) + (emp.potentialScore * 0.3) + ((emp.leadershipScore || 65) * 0.2) + (emp.tenureYears >= 5 ? 10 : emp.tenureYears >= 3 ? 9 : emp.tenureYears >= 2 ? 7.5 : 5.5) + (emp.readinessLevel === 'Ready Now' ? 10 : emp.readinessLevel === '1-2 Years' ? 7.5 : 5))}%
                                    </span>
                                  </TooltipWrapper>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">{emp.position}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600">{emp.department}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <TooltipWrapper
                              content={lang === "ID"
                                ? `${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.nameID}\nAsal Data: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.sourceID}\nRumus: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.formulaID}`
                                : `${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.nameEN}\nData Source: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.sourceEN}\nFormula: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.formulaEN}`}
                            >
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md cursor-help">{emp.performanceScore}</span>
                            </TooltipWrapper>
                            <span className="text-slate-300">/</span>
                            <TooltipWrapper
                              content={lang === "ID"
                                ? `${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "potential_score")?.nameID}\nAsal Data: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "potential_score")?.sourceID}\nRumus: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "potential_score")?.formulaID}`
                                : `${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "potential_score")?.nameEN}\nData Source: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "potential_score")?.sourceEN}\nFormula: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "potential_score")?.formulaEN}`}
                            >
                              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md cursor-help">{emp.potentialScore}</span>
                            </TooltipWrapper>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full \${emp.riskLevel === 'High' ? 'bg-red-50 text-red-600' : emp.riskLevel === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {emp.riskLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => setSelectedEmp(emp)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center justify-end gap-1 w-full"
                          >
                            Profile <ArrowRight className="size-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredEmps.length === 0 && (
                  <div className="p-8 text-center text-slate-500 font-medium">No employees found.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="grid grid-cols-2 gap-4">
               {/* Dummy Analytics Cards */}
               <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center h-48">
                 <h4 className="text-sm font-bold text-slate-500 mb-2">Gender Distribution</h4>
                 <div className="w-32 h-32 rounded-full border-8 border-indigo-100 flex items-center justify-center relative">
                   <div className="absolute inset-0 border-8 border-indigo-500 rounded-full" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 0 100%, 0 0)'}}></div>
                   <span className="font-black text-xl">55% M</span>
                 </div>
               </div>
               <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center h-48">
                 <h4 className="text-sm font-bold text-slate-500 mb-2">Avg Tenure</h4>
                 <div className="text-5xl font-black text-slate-800">4.2 <span className="text-xl text-slate-400">Yrs</span></div>
               </div>
            </div>
          )}

          {activeTab === "department" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Distribution by Department</h4>
              {['Engineering', 'Sales', 'Product', 'HR', 'Finance'].map(dept => {
                const count = employees.filter(e => e.department === dept).length;
                const max = Math.max(...['Engineering', 'Sales', 'Product', 'HR', 'Finance'].map(d => employees.filter(e => e.department === d).length)) || 1;
                return (
                  <div key={dept}>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>{dept}</span>
                      <span>{count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `\${(count/max)*100}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === "history" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
               <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-100 text-emerald-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <TrendingUp className="size-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-slate-800 text-sm">3 Employees entered this box</div>
                        <time className="font-mono text-xs text-slate-400">Oct 2023</time>
                      </div>
                      <div className="text-slate-500 text-xs">Moved from Solid Contributor</div>
                    </div>
                  </div>
                  
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-amber-100 text-amber-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <AlertTriangle className="size-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-slate-800 text-sm">1 Employee left this box</div>
                        <time className="font-mono text-xs text-slate-400">Sep 2023</time>
                      </div>
                      <div className="text-slate-500 text-xs">Risk level increased, moved to Box 2</div>
                    </div>
                  </div>
               </div>
            </div>
          )}

        </div>
      </div>

      {selectedEmp && (
        <EmployeeDrawer employee={selectedEmp} onClose={() => setSelectedEmp(null)} lang={lang} systemConfig={systemConfig} />
      )}
    </div>
  );
}
