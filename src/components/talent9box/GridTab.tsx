import React, { useState } from "react";
import { TalentEmployee, BoxConfig, SystemConfig } from "../../types";
import { Filter, Search, ArrowRight, UserSquare2, TrendingUp, AlertCircle, Building2, CalendarDays } from "lucide-react";
import TalentExplorer from "./TalentExplorer";
import { TooltipWrapper } from "../TooltipContext";

export default function GridTab({ employees, configs, lang = "ID", systemConfig }: { employees: TalentEmployee[], configs: BoxConfig[], lang?: "ID" | "EN", systemConfig?: SystemConfig }) {
  const [search, setSearch] = useState("");
  const [selectedBox, setSelectedBox] = useState<string | null>(null);

  const getEmployeesInBox = (boxId: string) => {
    return employees.filter(e => e.boxId === boxId);
  };

  const calculateAvg = (boxEmps: TalentEmployee[], key: 'performanceScore' | 'potentialScore') => {
    if (boxEmps.length === 0) return 0;
    return Math.round(boxEmps.reduce((sum, emp) => sum + emp[key], 0) / boxEmps.length);
  };

  return (
    <div className="space-y-6">
      
      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center sticky top-4 z-10">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
          <input
            type="text"
            placeholder="Search employees, department, position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm text-slate-800"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0">
            <Filter className="size-4" /> Department
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0">
            <Filter className="size-4" /> Risk Level
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0">
            Saved: High Performer Finance
          </button>
        </div>
      </div>

      {/* 9 Box Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Render bottom to top, left to right for standard 9 box (or top-left to bottom-right depending on preference). 
            Standard: 
            Y-axis = Potential (Low, Med, High)
            X-axis = Performance (Low, Med, High)
            Row 1 (Top): Box 3 (High Pot, Low Perf), Box 6 (High Pot, Med Perf), Box 9 (High Pot, High Perf)
            Row 2 (Mid): Box 2 (Med Pot, Low Perf), Box 5 (Med Pot, Med Perf), Box 8 (Med Pot, High Perf)
            Row 3 (Bot): Box 1 (Low Pot, Low Perf), Box 4 (Low Pot, Med Perf), Box 7 (Low Pot, High Perf)
        */}
        {[3, 6, 9, 2, 5, 8, 1, 4, 7].map(boxNum => {
          const config = configs.find(c => c.boxNumber === boxNum);
          if (!config) return null;
          
          const boxEmps = getEmployeesInBox(config.id);
          const avgPerf = calculateAvg(boxEmps, 'performanceScore');
          const avgPot = calculateAvg(boxEmps, 'potentialScore');
          
          // Determine top dept for hover
          const depts = boxEmps.map(e => e.department);
          const topDept = depts.sort((a,b) => depts.filter(v => v===a).length - depts.filter(v => v===b).length).pop() || 'N/A';

          return (
            <div 
              key={config.id} 
              onClick={() => setSelectedBox(config.id)}
              className={`group relative bg-white rounded-2xl border-2 border-transparent hover:border-\${config.color.replace('bg-', '')} shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden p-5 flex flex-col h-[220px]`}
            >
              <div className={`absolute top-0 left-0 w-1.5 h-full \${config.color}`}></div>
              
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">BOX {config.boxNumber}</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <TrendingUp className="size-3" /> +3
                </span>
              </div>
              
              <h3 className="text-lg font-black text-slate-800 leading-tight mb-4">{config.name}</h3>
              
              <div className="mt-auto grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-50 p-2 rounded-xl">
                  <TooltipWrapper content="Average Performance Score of employees in this box, calculated from individual performance reviews.">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Avg Perf</span>
                  </TooltipWrapper>
                  <span className="text-lg font-black text-slate-700">{avgPerf}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <TooltipWrapper content="Average Potential Score of employees in this box, based on assessment criteria.">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Avg Pot</span>
                  </TooltipWrapper>
                  <span className="text-lg font-black text-slate-700">{avgPot}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <div className="flex -space-x-2">
                  {boxEmps.slice(0, 3).map((emp, i) => (
                    <img key={i} src={emp.avatar} alt="" className="w-6 h-6 rounded-full border-2 border-white" />
                  ))}
                  {boxEmps.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-600">
                      +{boxEmps.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Explore <ArrowRight className="size-3" />
                </span>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-slate-900/95 text-white p-5 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center translate-y-2 group-hover:translate-y-0 duration-300">
                <h4 className="font-black text-sm mb-3 text-indigo-300">{config.name} Insights</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2"><Building2 className="size-3.5 opacity-70" /> Top Dept: <span className="font-bold">{topDept}</span></div>
                  <div className="flex items-center gap-2"><UserSquare2 className="size-3.5 opacity-70" /> Total: <span className="font-bold">{boxEmps.length} Employees</span></div>
                  <div className="flex items-center gap-2"><CalendarDays className="size-3.5 opacity-70" /> Avg Age: <span className="font-bold">{Math.round(boxEmps.reduce((a,b)=>a+b.age,0)/(boxEmps.length||1))}</span></div>
                  <div className="flex items-center gap-2"><AlertCircle className="size-3.5 opacity-70" /> High Risk: <span className="font-bold text-rose-400">{boxEmps.filter(e=>e.riskLevel==='High').length}</span></div>
                </div>
                <p className="mt-4 text-[10px] text-slate-400 text-center uppercase tracking-wider font-bold">Click to view details</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Talent Explorer Modal/Drawer */}
      {selectedBox && (
        <TalentExplorer 
          boxConfig={configs.find(c => c.id === selectedBox)!}
          employees={getEmployeesInBox(selectedBox)}
          onClose={() => setSelectedBox(null)}
          lang={lang}
          systemConfig={systemConfig}
        />
      )}
    </div>
  );
}
