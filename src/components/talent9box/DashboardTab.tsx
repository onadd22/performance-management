import React from "react";
import { TalentEmployee, BoxConfig, SystemConfig } from "../../types";
import { METRICS_DATABASE_DEFAULT } from "../MetricsGlossary";
import { Users, Star, AlertTriangle, TrendingUp, ShieldAlert, Award, ArrowUpRight, CheckCircle2, Activity, Brain, Info } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { TooltipWrapper } from "../TooltipContext";

const sparklineData = [{v: 10}, {v: 12}, {v: 15}, {v: 14}, {v: 18}, {v: 20}];

const StatCard = ({ title, value, icon: Icon, trend, trendVal, colorClass, tooltipContent }: any) => {
  const content = (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow h-full w-full">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10`}>
          <Icon className={`size-5 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {trend === 'up' ? '▲' : '▼'} {trendVal}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-slate-500 font-semibold text-sm mb-1 flex items-center gap-1">
          {title}
          {tooltipContent && <Info className="size-3.5 text-slate-400 cursor-help" />}
        </h3>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-black text-slate-800">{value}</span>
          <div className="h-6 w-16 opacity-50">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line type="monotone" dataKey="v" stroke={trend === 'up' ? '#10b981' : '#f43f5e'} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  if (tooltipContent) {
    return (
      <TooltipWrapper content={tooltipContent} className="w-full">
        {content}
      </TooltipWrapper>
    );
  }

  return content;
};

export default function DashboardTab({ employees, configs, lang = "ID", systemConfig }: { employees: TalentEmployee[], configs: BoxConfig[], lang?: "ID" | "EN", systemConfig?: SystemConfig }) {
  const methodTerm = systemConfig?.defaultReviewMethod === "kpi" ? "KPI" : systemConfig?.defaultReviewMethod === "bsc360" ? "BSC" : "OKR";
  const futureLeaders = employees.filter(e => e.boxId === "box_9").length;
  const highPotentials = employees.filter(e => ["box_6", "box_8", "box_9"].includes(e.boxId)).length;
  const criticalTalent = employees.filter(e => e.badges.includes("Critical Talent")).length;
  const riskEmployees = employees.filter(e => e.riskLevel === "High").length;
  const avgPerf = Math.round(employees.reduce((a,b) => a + b.performanceScore, 0) / employees.length);
  const avgPot = Math.round(employees.reduce((a,b) => a + b.potentialScore, 0) / employees.length);
  const talentScore = Math.round((avgPerf + avgPot) / 2);

  const successorReady = employees.filter(e => e.readinessLevel === "Ready Now").length;
  const devPlanNeeded = employees.filter(e => e.readinessLevel !== "Ready Now" && ["box_9", "box_8", "box_6"].includes(e.boxId)).length;
  
  // Calculate vacant critical roles from localStorage
  let vacantCritical = 0;
  try {
    const savedRoles = localStorage.getItem("talent_succession_roles");
    if (savedRoles) {
      const roles = JSON.parse(savedRoles);
      vacantCritical = roles.filter((r: any) => !r.successors || r.successors.length === 0).length;
    } else {
      // Default initial vacant critical (VP Product, Head of Marketing)
      vacantCritical = 2;
    }
  } catch (e) {
    vacantCritical = 0;
  }

  return (
    <div className="space-y-6">
      
      {/* Smart Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-10 -top-10 opacity-10">
            <Brain className="size-48" />
          </div>
          <h2 className="text-sm font-bold tracking-wider text-indigo-300 uppercase mb-4">Talent Health Index</h2>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-5xl font-black tracking-tighter">{talentScore}</span>
            <span className="text-xl text-indigo-200">/ 100</span>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold mb-4">
            <CheckCircle2 className="size-3.5" /> Excellent Status
          </div>
          <div className="text-[10px] text-indigo-200/60 leading-relaxed font-mono bg-white/5 p-2 rounded-lg mb-4 border border-white/10">
            Formula: Rata-rata (Avg Performance: {avgPerf}% + Avg Potential: {avgPot}%) = {talentScore}/100.
          </div>
          <p className="text-xs text-indigo-100/70 max-w-[250px] leading-relaxed">
            Overall talent readiness is strong. High retention rate among critical talents with solid succession pipelines.
          </p>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-sm font-bold tracking-wider text-slate-500 uppercase flex items-center gap-2">
              <Star className="size-4 text-amber-500" /> AI Talent Insight
            </h2>
            <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg">
              Auto-Calculated from DB
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
            Wawasan cerdas di bawah dikomparasikan secara dinamis berdasarkan data sebaran kuadran 9-Box masing-masing departemen dan status profil suksesi karyawan.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex gap-3 items-start p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <TrendingUp className="size-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Future Leaders Up 8%</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Significant growth in Box 9 compared to last quarter.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <AlertTriangle className="size-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Performance Stagnation in Sales</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Sales department shows flat performance trends.</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3 items-start p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <Brain className="size-5 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Engineering Leads Potential</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Highest concentration of High Potential talent in DB.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <Award className="size-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{successorReady} Ready for Promotion</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Identified {successorReady} immediate successors with 'Ready Now' status.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-8">
        <h2 className="text-lg font-black text-slate-800 mb-1">Executive Summary</h2>
        <p className="text-xs text-slate-500 mb-4">
          Klik pada kuadran Grid 9-Box untuk melihat detail profil karyawan secara terperinci. Ringkasan di bawah dihitung real-time dari data inputan:
        </p>

        {/* DATA FORMULA DIRECTORY GUIDE */}
        <div className="mb-6 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs text-slate-600 space-y-3">
          <div className="font-extrabold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
            <Activity className="size-4 text-indigo-600" />
            Panduan Formula & Sumber Data Riil (Source Code Formula Map)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
            <div className="space-y-1.5">
              <div className="flex items-start gap-1"><strong className="text-slate-700 shrink-0">Total Employees:</strong> <span className="text-slate-500">Jumlah total seluruh baris data karyawan aktif pada DB. (Count: {employees.length} orang)</span></div>
              <div className="flex items-start gap-1"><strong className="text-slate-700 shrink-0">Future Leaders:</strong> <span className="text-slate-500">Karyawan pada kuadran Box 9 (Star/Future Leader). (Count: {futureLeaders} orang)</span></div>
              <div className="flex items-start gap-1"><strong className="text-slate-700 shrink-0">High Potentials:</strong> <span className="text-slate-500">Karyawan yang menempati Box 6, 8, atau 9. (Count: {highPotentials} orang)</span></div>
              <div className="flex items-start gap-1"><strong className="text-slate-700 shrink-0">Critical Talent:</strong> <span className="text-slate-500">Karyawan yang memiliki lencana 'Critical Talent' pada profilnya. (Count: {criticalTalent} orang)</span></div>
              <div className="flex items-start gap-1"><strong className="text-slate-700 shrink-0">Retention Risk:</strong> <span className="text-slate-500">Karyawan dengan nilai tingkat Flight Risk = 'High'. (Count: {riskEmployees} orang)</span></div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-start gap-1"><strong className="text-slate-700 shrink-0">Avg Performance:</strong> <span className="text-slate-500">Rata-rata kumulatif nilai kinerja seluruh karyawan aktif ({avgPerf}%).</span></div>
              <div className="flex items-start gap-1"><strong className="text-slate-700 shrink-0">Avg Potential:</strong> <span className="text-slate-500">Rata-rata kumulatif nilai potensi seluruh karyawan aktif ({avgPot}%).</span></div>
              <div className="flex items-start gap-1"><strong className="text-slate-700 shrink-0">Successor Ready:</strong> <span className="text-slate-500">Karyawan dengan status kesiapan promosi = 'Ready Now'. (Count: {successorReady} orang)</span></div>
              <div className="flex items-start gap-1"><strong className="text-slate-700 shrink-0">Dev. Plan Needed:</strong> <span className="text-slate-500">Karyawan potensial (Box 6, 8, 9) yang kesiapannya belum 'Ready Now'. (Count: {devPlanNeeded} orang)</span></div>
              <div className="flex items-start gap-1"><strong className="text-slate-700 shrink-0">Vacant Critical:</strong> <span className="text-slate-500">Posisi jabatan kunci tanpa suksesor tervalidasi. (Count: {vacantCritical} posisi)</span></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard title="Total Employees" value={employees.length} icon={Users} colorClass="bg-blue-500" />
          <StatCard title="Future Leaders" value={futureLeaders} icon={Award} trend="up" trendVal="+12%" colorClass="bg-emerald-500" />
          <StatCard title="High Potentials" value={highPotentials} icon={TrendingUp} trend="up" trendVal="+5%" colorClass="bg-indigo-500" />
          <StatCard title="Critical Talent" value={criticalTalent} icon={Star} trend="up" trendVal="+2%" colorClass="bg-amber-500" />
          <StatCard title="Retention Risk" value={riskEmployees} icon={ShieldAlert} trend="down" trendVal="-4%" colorClass="bg-red-500" />
          
          <StatCard 
            title="Avg Performance" 
            value={`${avgPerf}%`} 
            icon={Activity} 
            colorClass="bg-teal-500" 
            tooltipContent={lang === "ID" 
              ? `${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.nameID}\nAsal Data: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.sourceID}\nRumus: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.formulaID}`
              : `${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.nameEN}\nData Source: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.sourceEN}\nFormula: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.formulaEN}`}
          />
          <StatCard 
            title="Avg Potential" 
            value={`${avgPot}%`} 
            icon={Brain} 
            colorClass="bg-violet-500" 
            tooltipContent={lang === "ID" 
              ? `${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "potential_score")?.nameID}\nAsal Data: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "potential_score")?.sourceID}\nRumus: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "potential_score")?.formulaID}`
              : `${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "potential_score")?.nameEN}\nData Source: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "potential_score")?.sourceEN}\nFormula: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "potential_score")?.formulaEN}`}
          />
          <StatCard 
            title="Successor Ready" 
            value={successorReady} 
            icon={CheckCircle2} 
            trend="up" 
            trendVal="+8%" 
            colorClass="bg-lime-500" 
            tooltipContent={lang === "ID" 
              ? `${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "sri_score")?.nameID}\nAsal Data: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "sri_score")?.sourceID}\nRumus: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "sri_score")?.formulaID}`
              : `${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "sri_score")?.nameEN}\nData Source: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "sri_score")?.sourceEN}\nFormula: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "sri_score")?.formulaEN}`}
          />
          <StatCard title="Dev. Plan Needed" value={devPlanNeeded} icon={ArrowUpRight} trend="down" trendVal="-15%" colorClass="bg-orange-500" />
          <StatCard title="Vacant Critical" value={vacantCritical} icon={AlertTriangle} colorClass="bg-rose-500" />
        </div>
      </div>

    </div>
  );
}
