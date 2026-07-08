import React, { useState, useEffect } from "react";
import { LayoutDashboard, Grid3X3, BarChart3, Settings, Users, Brain, TrendingUp, AlertTriangle, Award } from "lucide-react";
import DashboardTab from "./DashboardTab";
import GridTab from "./GridTab";
import AnalyticsTab from "./AnalyticsTab";
import ConfigTab from "./ConfigTab";
import SuccessionTab from "./SuccessionTab";
import { TalentEmployee, BoxConfig, SystemConfig } from "../../types";
import MetricsGlossary from "../MetricsGlossary";

export default function Talent9BoxApp({ lang = "ID", systemConfig, onUpdateSystemConfig }: { lang?: "ID" | "EN", systemConfig?: SystemConfig, onUpdateSystemConfig?: (updates: Partial<SystemConfig>) => void }) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "grid" | "analytics" | "succession" | "config">("dashboard");
  const [employees, setEmployees] = useState<TalentEmployee[]>([]);
  const [configs, setConfigs] = useState<BoxConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, cfgRes] = await Promise.all([
          fetch("/api/talent-9box/employees"),
          fetch("/api/talent-9box/configs")
        ]);
        if (empRes.ok && cfgRes.ok) {
          setEmployees(await empRes.json());
          setConfigs(await cfgRes.json());
        }
      } catch (err) {
        console.error("Failed to fetch talent data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateConfigs = async (newConfigs: BoxConfig[]) => {
    setConfigs(newConfigs);
    try {
      await fetch("/api/talent-9box/configs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfigs)
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading talent intel...</div>;

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <Brain className="size-8 text-indigo-600" />
              Smart Talent 9 Box
            </h1>
            <p className="text-slate-500 font-medium mt-1">Enterprise Talent Intelligence & Succession Planning</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === "dashboard" ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <LayoutDashboard className="size-4" /> Summary
              </button>
              <button
                onClick={() => setActiveTab("grid")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === "grid" ? "bg-indigo-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <Grid3X3 className="size-4" /> 9 Box Grid
              </button>
              <button
                onClick={() => setActiveTab("succession")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === "succession" ? "bg-purple-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <Award className="size-4" /> Succession Pool
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === "analytics" ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <BarChart3 className="size-4" /> Analytics
              </button>
              <button
                onClick={() => setActiveTab("config")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === "config" ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <Settings className="size-4" /> Config
              </button>
            </div>
            <MetricsGlossary lang={lang} />
          </div>
        </div>

        {/* Content Area */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === "dashboard" && <DashboardTab employees={employees} configs={configs} lang={lang} systemConfig={systemConfig} />}
          {activeTab === "grid" && <GridTab employees={employees} configs={configs} lang={lang} systemConfig={systemConfig} />}
          {activeTab === "succession" && <SuccessionTab employees={employees} configs={configs} lang={lang} systemConfig={systemConfig} />}
          {activeTab === "analytics" && <AnalyticsTab employees={employees} configs={configs} systemConfig={systemConfig} />}
          {activeTab === "config" && <ConfigTab configs={configs} onUpdateConfigs={handleUpdateConfigs} systemConfig={systemConfig} onUpdateSystemConfig={onUpdateSystemConfig} />}
        </div>
      </div>
    </div>
  );
}
