import React, { useState, useMemo, useEffect } from "react";
import { TalentEmployee, BoxConfig, SystemConfig } from "../../types";
import { METRICS_DATABASE_DEFAULT } from "../MetricsGlossary";
import { 
  Users, 
  Award, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  TrendingUp, 
  HelpCircle, 
  ChevronRight, 
  Settings, 
  Briefcase, 
  Plus, 
  Trash2, 
  BookOpen, 
  Compass, 
  HeartHandshake, 
  Sparkles,
  Info
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { TooltipWrapper } from "../TooltipContext";

interface CriticalRole {
  id: string;
  title: string;
  department: string;
  currentHolder: string;
  criticality: "High" | "Critical" | "Medium";
  successors: {
    employeeId: string;
    readiness: "Ready Now" | "1-2 Years" | "3-5 Years";
    justification: string;
  }[];
}

interface SuccessionTabProps {
  employees: TalentEmployee[];
  configs: BoxConfig[];
  lang?: "ID" | "EN";
  systemConfig?: SystemConfig;
}

export default function SuccessionTab({ employees, configs, lang = "ID", systemConfig }: SuccessionTabProps) {
  const methodTerm = systemConfig?.defaultReviewMethod === "kpi" ? "KPI" : systemConfig?.defaultReviewMethod === "bsc360" ? "BSC" : "OKR";
  
  // Weights pulled from single source of truth (Performance Config)
  const sriWeights = systemConfig?.successionPoolConfig?.sriWeights || { performance: 30, potential: 30, leadership: 20, tenure: 10, readiness: 10 };
  const perfWeight = sriWeights.performance;
  const potWeight = sriWeights.potential;
  const leadWeight = sriWeights.leadership;
  const tenureWeight = sriWeights.tenure;
  const aspWeight = sriWeights.readiness;

  const [minTenure, setMinTenure] = useState<number>(2); // Min 2 years recommended
  const [minPerfScore, setMinPerfScore] = useState<number>(75);
  const [minPotScore, setMinPotScore] = useState<number>(75);
  
  // Eligible boxes for succession (Default: B9, B8, B6 - high potential and top performance)
  const [eligibleBoxes, setEligibleBoxes] = useState<string[]>(["box_9", "box_8", "box_6"]);
  
  // List of Critical Roles
  const [criticalRoles, setCriticalRoles] = useState<CriticalRole[]>(() => {
    const saved = localStorage.getItem("talent_succession_roles");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: "role_1",
        title: "Chief Technology Officer (CTO)",
        department: "Engineering",
        currentHolder: "Bambang Pamungkas",
        criticality: "Critical",
        successors: [
          { employeeId: "1", readiness: "Ready Now", justification: "Mendemonstrasikan kepemimpinan teknis yang luar biasa dan rekam jejak pengiriman arsitektur microservices." }
        ]
      },
      {
        id: "role_2",
        title: "VP of Product Management",
        department: "Product",
        currentHolder: "Clara Shinta",
        criticality: "High",
        successors: []
      },
      {
        id: "role_3",
        title: "Head of Marketing",
        department: "Marketing",
        currentHolder: "Dian Sastrowardoyo",
        criticality: "High",
        successors: []
      }
    ];
  });

  // State for adding a new critical position
  const [newRoleTitle, setNewRoleTitle] = useState("");
  const [newRoleDept, setNewRoleDept] = useState("");
  const [newRoleHolder, setNewRoleHolder] = useState("");
  const [newRoleCrit, setNewRoleCrit] = useState<"High" | "Critical" | "Medium">("High");
  const [showAddRoleForm, setShowAddRoleForm] = useState(false);

  // Nomination dialog state
  const [nominatingForRoleId, setNominatingForRoleId] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [selectedReadiness, setSelectedReadiness] = useState<"Ready Now" | "1-2 Years" | "3-5 Years">("Ready Now");
  const [nominationReason, setNominationReason] = useState("");

  // Search and filter for pool
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  // Save critical roles state to localstorage
  useEffect(() => {
    localStorage.setItem("talent_succession_roles", JSON.stringify(criticalRoles));
  }, [criticalRoles]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.department));
    return ["All", ...Array.from(depts)];
  }, [employees]);

  // Map 9Box Box configurations to their names
  const boxMap = useMemo(() => {
    const map: Record<string, string> = {};
    configs.forEach(c => {
      map[c.id] = c.name;
    });
    return map;
  }, [configs]);

  // Calculate succession index (Indeks Kesiapan Suksesi) for ALL employees
  const scoredEmployees = useMemo(() => {
    return employees.map(emp => {
      // 1. Performance rating (0-100)
      const pScore = emp.performanceScore;
      // 2. Potential rating (0-100)
      const poScore = emp.potentialScore;
      // 3. Leadership competency rating (0-100)
      const lScore = emp.leadershipScore || 65;
      
      // 4. Tenure score component mapping:
      // More service period = higher structural maturity score (max 100)
      let tScore = 30;
      if (emp.tenureYears >= 5) tScore = 100;
      else if (emp.tenureYears >= 3) tScore = 90;
      else if (emp.tenureYears >= 2) tScore = 75;
      else if (emp.tenureYears >= 1) tScore = 55;

      // 5. Readiness component mapping:
      // "Ready Now" = 100, "1-2 Years" = 75, "3-5 Years" = 50
      let rScore = 50;
      if (emp.readinessLevel === "Ready Now") rScore = 100;
      else if (emp.readinessLevel === "1-2 Years") rScore = 75;

      const totalWeightSum = perfWeight + potWeight + leadWeight + tenureWeight + aspWeight;
      const weightedSum = 
        (pScore * perfWeight) + 
        (poScore * potWeight) + 
        (lScore * leadWeight) + 
        (tScore * tenureWeight) + 
        (rScore * aspWeight);

      const sri = Math.round(weightedSum / (totalWeightSum || 1));

      // Determine qualification based on:
      // - Minimum SRI threshold (75)
      // - Minimum Tenure (e.g. 2 years)
      // - Minimum Individual Scores
      // - Eligible Box Quadrant
      const meetsTenure = emp.tenureYears >= minTenure;
      const meetsPerf = emp.performanceScore >= minPerfScore;
      const meetsPot = emp.potentialScore >= minPotScore;
      const meetsBox = eligibleBoxes.includes(emp.boxId);
      const isQualified = sri >= 75 && meetsTenure && meetsPerf && meetsPot && meetsBox;

      return {
        ...emp,
        sri,
        isQualified,
        leadershipRating: lScore,
        tenureScore: tScore,
        readinessScore: rScore
      };
    });
  }, [employees, perfWeight, potWeight, leadWeight, tenureWeight, aspWeight, minTenure, minPerfScore, minPotScore, eligibleBoxes]);

  // Filter and sort employees
  const filteredEmployees = useMemo(() => {
    return scoredEmployees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDept = deptFilter === "All" || emp.department === deptFilter;
      
      return matchesSearch && matchesDept;
    }).sort((a,b) => b.sri - a.sri); // Sort by highest succession readiness index
  }, [scoredEmployees, searchQuery, deptFilter]);

  // Segment candidates
  const successionPoolCandidates = useMemo(() => {
    return filteredEmployees.filter(e => e.isQualified);
  }, [filteredEmployees]);

  const highPotentialPipelines = useMemo(() => {
    return filteredEmployees.filter(e => !e.isQualified && (e.boxId === "box_9" || e.boxId === "box_8" || e.boxId === "box_6"));
  }, [filteredEmployees]);

  const otherEmployeesList = useMemo(() => {
    return filteredEmployees.filter(e => !e.isQualified && !(e.boxId === "box_9" || e.boxId === "box_8" || e.boxId === "box_6"));
  }, [filteredEmployees]);

  // Analytics helper data
  const readinessChartData = useMemo(() => {
    const counts = { "Ready Now": 0, "1-2 Years": 0, "3-5 Years": 0 };
    successionPoolCandidates.forEach(c => {
      if (c.readinessLevel in counts) {
        counts[c.readinessLevel as keyof typeof counts]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [successionPoolCandidates]);

  const riskChartData = useMemo(() => {
    const counts = { "Low": 0, "Medium": 0, "High": 0 };
    successionPoolCandidates.forEach(c => {
      if (c.riskLevel in counts) {
        counts[c.riskLevel as keyof typeof counts]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [successionPoolCandidates]);

  // Handle adding critical roles
  const handleAddCriticalRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleTitle.trim() || !newRoleDept.trim()) return;
    
    const newRole: CriticalRole = {
      id: "role_" + Date.now(),
      title: newRoleTitle.trim(),
      department: newRoleDept.trim(),
      currentHolder: newRoleHolder.trim() || "Vacant",
      criticality: newRoleCrit,
      successors: []
    };

    setCriticalRoles(prev => [...prev, newRole]);
    setNewRoleTitle("");
    setNewRoleDept("");
    setNewRoleHolder("");
    setNewRoleCrit("High");
    setShowAddRoleForm(false);
  };

  // Handle nominating successors
  const handleNominateSuccessor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominatingForRoleId || !selectedCandidateId) return;

    setCriticalRoles(prev => prev.map(role => {
      if (role.id === nominatingForRoleId) {
        // Avoid duplicate nomination
        if (role.successors.some(s => s.employeeId === selectedCandidateId)) {
          return role;
        }
        return {
          ...role,
          successors: [
            ...role.successors,
            {
              employeeId: selectedCandidateId,
              readiness: selectedReadiness,
              justification: nominationReason.trim() || "Memenuhi syarat indeks suksesi otomatis."
            }
          ]
        };
      }
      return role;
    }));

    // Reset fields
    setNominatingForRoleId(null);
    setSelectedCandidateId("");
    setSelectedReadiness("Ready Now");
    setNominationReason("");
  };

  const handleRemoveSuccessor = (roleId: string, empId: string) => {
    setCriticalRoles(prev => prev.map(role => {
      if (role.id === roleId) {
        return {
          ...role,
          successors: role.successors.filter(s => s.employeeId !== empId)
        };
      }
      return role;
    }));
  };

  const handleDeleteCriticalRole = (roleId: string) => {
    if (confirm(lang === "ID" ? "Apakah Anda yakin ingin menghapus posisi kritis ini?" : "Are you sure you want to delete this critical position?")) {
      setCriticalRoles(prev => prev.filter(r => r.id !== roleId));
    }
  };

  const toggleEligibleBox = (boxId: string) => {
    if (eligibleBoxes.includes(boxId)) {
      setEligibleBoxes(prev => prev.filter(b => b !== boxId));
    } else {
      setEligibleBoxes(prev => [...prev, boxId]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Educational Section - What defines a Succession Pool? */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 rounded-3xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-12 translate-x-12">
          <Award className="size-64" />
        </div>
        <div className="max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-200 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/30">
            <Info className="size-3.5" />
            <span>Succession Planning Methodology</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight leading-tight">
            {lang === "ID" 
              ? "Bagaimana Kriteria Kolam Suksesi (Succession Pool) Ditentukan?" 
              : "How is the Succession Pool Determined?"
            }
          </h2>
          <p className="text-sm text-indigo-100/80 leading-relaxed">
            {lang === "ID" 
              ? "Menentukan calon pemimpin masa depan tidak hanya membutuhkan satu dimensi. Kolam Suksesi dibangun dengan mengevaluasi kematangan struktural dan potensi adaptif karyawan secara multi-dimensi untuk memastikan kesiapan transisi kepemimpinan kritis." 
              : "Determining future leaders requires a multi-dimensional assessment. The Succession Pool evaluates both operational track records and future potential to ensure highly reliable pipelines for critical enterprise positions."
            }
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-1 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                <TrendingUp className="size-4" />
                <span>1. {lang === "ID" ? "Kinerja Konsisten" : "Past Performance"}</span>
              </div>
              <p className="text-[11px] text-indigo-100/60 leading-normal">
                {lang === "ID" ? `Rekam jejak evaluasi kinerja konsisten (${methodTerm}) melampaui target selama 2-3 tahun terakhir.` : "Proven track record of outstanding performance ratings over multiple evaluation cycles."}
              </p>
            </div>

            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-1 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                <Compass className="size-4" />
                <span>2. {lang === "ID" ? "Potensi & 9-Box" : "Potential & 9-Box"}</span>
              </div>
              <p className="text-[11px] text-indigo-100/60 leading-normal">
                {lang === "ID" ? "Kandidat berada di kuadran akselerasi tinggi (B9 - Star, B8 - High Performer, B6 - High Potential)." : "Focus on high-potential quadrants to find agile learning-agile future leaders."}
              </p>
            </div>

            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-1 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2 text-sky-300 font-bold text-xs">
                <BookOpen className="size-4" />
                <span>3. {lang === "ID" ? "Masa Kerja & Kematangan" : "Tenure & Experience"}</span>
              </div>
              <p className="text-[11px] text-indigo-100/60 leading-normal">
                {lang === "ID" ? "Masa kerja minimum (direkomendasikan ≥2 tahun) untuk memastikan kedalaman pemahaman bisnis organisasi." : "Sufficient service tenure to possess deep institutional knowledge and cultural alignment."}
              </p>
            </div>

            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-1 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <HeartHandshake className="size-4" />
                <span>4. {lang === "ID" ? "Kesiapan & Aspirasi" : "Readiness & Aspiration"}</span>
              </div>
              <p className="text-[11px] text-indigo-100/60 leading-normal">
                {lang === "ID" ? "Aspirasi karir kepemimpinan aktif didukung oleh skor kesiapan ('Ready Now' atau 'Ready 1-2 Years')." : "Active career interest for leadership and verified ready status by executive review."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Weighted Scoring Rule Configuration */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-wider">
                <Settings className="size-4 text-indigo-600" />
                {lang === "ID" ? "Bobot Pembobotan Suksesi" : "Succession Index Weights"}
              </h3>
              <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                Total: {perfWeight + potWeight + leadWeight + tenureWeight + aspWeight}%
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-normal mb-2">
              {lang === "ID" 
                ? "Sesuaikan bobot nilai untuk mengkalkulasi Indeks Kesiapan Suksesi (Indeks Kesiapan Suksesi) karyawan." 
                : "Adjust the values to compute the dynamic Succession Readiness Index (SRI) for each employee."
              }
            </p>
            
            <div className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 flex items-start gap-1.5">
               <Info className="size-3 shrink-0 mt-0.5 text-amber-500" />
               <p className="leading-tight">
                 {lang === "ID" ? "Bobot di bawah ini khusus untuk menghitung Indeks Kesiapan Suksesi (SRI). Untuk mengubah bobot utama metrik kinerja, gunakan menu Konfig Performance." : "These weights are specific to the Succession Readiness Index (SRI). Use Performance Config to change core metric weights."}
               </p>
            </div>

            {/* Sliders for weights */}
            <div className="space-y-4 opacity-75 pointer-events-none">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{lang === "ID" ? `Kinerja Historis (${methodTerm})` : "Performance Rating"}</span>
                  <span className="text-indigo-600">{perfWeight}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" step="5" value={perfWeight} disabled
                  className="w-full accent-slate-400 h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{lang === "ID" ? "Skor Potensi (9-Box)" : "Potential Score"}</span>
                  <span className="text-indigo-600">{potWeight}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" step="5" value={potWeight} disabled
                  className="w-full accent-slate-400 h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{lang === "ID" ? "Kompetensi Kepemimpinan" : "Leadership Competency"}</span>
                  <span className="text-indigo-600">{leadWeight}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" step="5" value={leadWeight} disabled
                  className="w-full accent-slate-400 h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{lang === "ID" ? "Masa Kerja (Tenure)" : "Tenure Years Weight"}</span>
                  <span className="text-indigo-600">{tenureWeight}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" step="5" value={tenureWeight} disabled
                  className="w-full accent-slate-400 h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{lang === "ID" ? "Kesiapan & Aspirasi Karir" : "Readiness & Career Aspiration"}</span>
                  <span className="text-indigo-600">{aspWeight}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" step="5" value={aspWeight} disabled
                  className="w-full accent-slate-400 h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>
            </div>
            
            <div className="mt-4 text-[10px] text-slate-400 italic flex items-center justify-center border-t border-slate-100 pt-3">
               {lang === "ID" ? "* Nilai di atas bersifat read-only dan ditarik dari Master Konfig Performance." : "* These values are read-only and inherited from the Master Performance Config."}
            </div>

            {/* Threshold Rules */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                {lang === "ID" ? "Parameter Batasan Kelayakan" : "Eligibility Filters"}
              </h4>

              <div className="space-y-3">
                {/* Min Tenure years */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600">
                    {lang === "ID" ? "Minimal Masa Kerja (Tahun):" : "Minimum Tenure (Years):"} <span className="font-bold text-indigo-600 font-mono">{minTenure} Thn</span>
                  </label>
                  <input 
                    type="number" min="0" max="10" value={minTenure}
                    onChange={(e) => setMinTenure(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2 font-mono text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Min Performance rating */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600">
                    {lang === "ID" ? `Minimal Nilai Kinerja ${methodTerm}:` : `Minimum ${methodTerm} Performance:`} <span className="font-bold text-indigo-600 font-mono">{minPerfScore}%</span>
                  </label>
                  <input 
                    type="number" min="0" max="100" value={minPerfScore}
                    onChange={(e) => setMinPerfScore(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2 font-mono text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Min Potential rating */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600">
                    {lang === "ID" ? "Minimal Nilai Potensial:" : "Minimum Potential Score:"} <span className="font-bold text-indigo-600 font-mono">{minPotScore}%</span>
                  </label>
                  <input 
                    type="number" min="0" max="100" value={minPotScore}
                    onChange={(e) => setMinPotScore(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2 font-mono text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Eligible 9-Box Quadrants Selection */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                {lang === "ID" ? "Kuadran 9-Box Layak Suksesi" : "Eligible 9-Box Quadrants"}
              </h4>
              <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                {lang === "ID" 
                  ? "Pilih kuadran yang berhak masuk ke Kolam Suksesi Utama." 
                  : "Select which 9-box quadrants qualify for the core succession pool."
                }
              </p>
              
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {configs.map(cfg => {
                  const isChecked = eligibleBoxes.includes(cfg.id);
                  return (
                    <label key={cfg.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer select-none border border-slate-100">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEligibleBox(cfg.id)}
                        className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 size-3.5"
                      />
                      <div className="flex-1">
                        <span className="font-extrabold text-slate-700 font-mono text-[11px] mr-1.5">B{cfg.boxNumber}</span>
                        <span className="font-semibold text-slate-600">{cfg.name}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Quick Pool Stats Analytics */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-wider pb-3 border-b border-slate-150">
              <Sparkles className="size-4 text-purple-600" />
              {lang === "ID" ? "Kompilasi Kandidat Kolam Suksesi" : "Succession Pool Analytics"}
            </h3>

            {successionPoolCandidates.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                {lang === "ID" ? "Tidak ada kandidat yang lolos filter di atas." : "No candidates fit current rule parameters."}
              </p>
            ) : (
              <div className="space-y-4 text-xs font-semibold text-slate-600">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100 text-center">
                    <span className="block text-[10px] text-purple-600 uppercase font-bold">Total Kandidat</span>
                    <span className="text-3xl font-black text-purple-900">{successionPoolCandidates.length}</span>
                  </div>
                  <TooltipWrapper
                    content={lang === "ID"
                      ? "Rata-rata Indeks Kesiapan Suksesi (SRI)\nAsal Data: Kalkulasi dinamis berdasarkan bobot Perf, Pot, Lead, Tenure & Readiness.\nRumus SRI = [ (Kinerja × W_perf) + (Potensi × W_pot) + (Lead × W_lead) + (Tenure × W_tenure) + (Kesiapan × W_ready) ] / Total Bobot"
                      : "Average Succession Readiness Index (SRI)\nData Source: Dynamic calculations based on Perf, Pot, Lead, Tenure & Readiness weights.\nFormula SRI = [ (Performance × W_perf) + (Potential × W_pot) + (Leadership × W_lead) + (Tenure × W_tenure) + (Readiness × W_ready) ] / Total Weight"}
                    className="w-full"
                  >
                    <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 text-center w-full h-full cursor-help">
                      <span className="text-[10px] text-indigo-600 uppercase font-bold flex items-center justify-center gap-1">
                        {lang === "ID" ? "Rata-rata Kesiapan" : "Avg Readiness"} <Info className="size-3 text-indigo-400" />
                      </span>
                      <span className="text-3xl font-black text-indigo-900 block mt-0.5">
                        {Math.round(successionPoolCandidates.reduce((sum, e) => sum + e.sri, 0) / successionPoolCandidates.length)}%
                      </span>
                    </div>
                  </TooltipWrapper>
                </div>

                {/* Pie chart/distribution of readiness */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{lang === "ID" ? "Sebaran Tingkat Kesiapan" : "Readiness Level Distribution"}</span>
                  <div className="h-28 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={readinessChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {readinessChartData.map((entry, index) => (
                            <Cell key={`cell-${entry.name}`} fill={index === 0 ? "#10b981" : index === 1 ? "#6366f1" : "#f59e0b"} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 text-[10px] font-mono">
                    <span className="flex items-center gap-1"><span className="size-2 bg-emerald-500 rounded-full"/> Ready Now</span>
                    <span className="flex items-center gap-1"><span className="size-2 bg-indigo-500 rounded-full"/> 1-2 Years</span>
                    <span className="flex items-center gap-1"><span className="size-2 bg-amber-500 rounded-full"/> 3-5 Years</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Candidates Pool and Target Roles Mapping */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Section: Critical Key Roles & Nominated Pipeline Mapping */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-wider">
                  <Briefcase className="size-4 text-purple-600" />
                  {lang === "ID" ? "Peran Kritis & Jalur Suksesi" : "Critical Positions Succession Pipeline"}
                </h3>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  {lang === "ID" ? "Daftar jabatan pimpinan penting dan kandidat talenta ter-nominasi." : "Critical business positions mapped with active succession candidate pipelines."}
                </p>
              </div>
              <button
                onClick={() => setShowAddRoleForm(!showAddRoleForm)}
                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3.5 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all"
              >
                <Plus className="size-4" />
                <span>{lang === "ID" ? "Tambah Posisi" : "Add Position"}</span>
              </button>
            </div>

            {/* Add Role Form popup inside component */}
            {showAddRoleForm && (
              <form onSubmit={handleAddCriticalRole} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 animate-fade-in text-xs font-bold">
                <div className="space-y-1 md:col-span-1">
                  <span className="text-slate-500">Nama Jabatan</span>
                  <input 
                    type="text" placeholder="e.g. VP Marketing" required
                    value={newRoleTitle} onChange={(e) => setNewRoleTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1 md:col-span-1">
                  <span className="text-slate-500">Circle / Departemen</span>
                  <input 
                    type="text" placeholder="e.g. Sales Circle" required
                    value={newRoleDept} onChange={(e) => setNewRoleDept(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1 md:col-span-1">
                  <span className="text-slate-500">Pejabat Saat Ini</span>
                  <input 
                    type="text" placeholder="e.g. John Doe (Opsional)"
                    value={newRoleHolder} onChange={(e) => setNewRoleHolder(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1 md:col-span-1 flex flex-col justify-between">
                  <span className="text-slate-500">Tingkat Kekritisan</span>
                  <div className="flex gap-2">
                    <select
                      value={newRoleCrit} onChange={(e) => setNewRoleCrit(e.target.value as any)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                    </select>
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-xl">
                      {lang === "ID" ? "Simpan" : "Save"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Nomination Action Overlay Form */}
            {nominatingForRoleId && (
              <form onSubmit={handleNominateSuccessor} className="bg-purple-50 border border-purple-100 p-5 rounded-2xl space-y-4 text-xs font-semibold animate-fade-in">
                <div className="flex justify-between items-center pb-2 border-b border-purple-100">
                  <span className="font-black text-purple-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Plus className="size-4" />
                    {lang === "ID" ? "Nominasikan Suksesor Baru" : "Nominate New Successor"}
                  </span>
                  <button 
                    type="button" onClick={() => setNominatingForRoleId(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Candidates Dropdown Selection */}
                  <div className="space-y-1.5">
                    <label className="text-slate-600">Pilih Kandidat Kolam Suksesi:</label>
                    <select
                      required value={selectedCandidateId}
                      onChange={(e) => {
                        const cId = e.target.value;
                        setSelectedCandidateId(cId);
                        const c = successionPoolCandidates.find(emp => emp.id === cId);
                        if (c && c.readinessLevel) {
                          setSelectedReadiness(c.readinessLevel as any);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                    >
                      <option value="">-- {lang === "ID" ? "Pilih Kandidat" : "Select Candidate"} --</option>
                      <optgroup label="Ready Now">
                        {successionPoolCandidates.filter(c => c.readinessLevel === 'Ready Now').map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.position} - SRI {c.sri}%)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="1-2 Years">
                        {successionPoolCandidates.filter(c => c.readinessLevel === '1-2 Years').map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.position} - SRI {c.sri}%)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="3-5 Years">
                        {successionPoolCandidates.filter(c => c.readinessLevel === '3-5 Years').map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.position} - SRI {c.sri}%)
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Readiness Status */}
                  <div className="space-y-1.5">
                    <label className="text-slate-600">Target Waktu Kesiapan Promosi:</label>
                    <select
                      value={selectedReadiness}
                      onChange={(e) => setSelectedReadiness(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                    >
                      <option value="Ready Now">Ready Now (Siap Sekarang)</option>
                      <option value="1-2 Years">1-2 Years (1-2 Tahun)</option>
                      <option value="3-5 Years">3-5 Years (3-5 Tahun)</option>
                    </select>
                  </div>

                  {/* Justification input */}
                  <div className="space-y-1.5">
                    <label className="text-slate-600">Justifikasi / Catatan Rekomendasi:</label>
                    <input 
                      type="text" required placeholder="Sebutkan alasan atau gap kompetensi..."
                      value={nominationReason} onChange={(e) => setNominationReason(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-5 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm">
                    {lang === "ID" ? "Konfirmasi Nominasi" : "Nominate Successor"}
                  </button>
                </div>
              </form>
            )}

            {/* Critical Positions Pipelines Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {criticalRoles.map(role => {
                const recommendedCandidate = successionPoolCandidates
                  .filter(c => c.department === role.department && !role.successors.some(s => s.employeeId === c.id))
                  .sort((a, b) => b.sri - a.sri)[0];

                return (
                <div key={role.id} className="bg-slate-50 hover:bg-slate-100/50 p-5 rounded-2xl border border-slate-150 flex flex-col justify-between hover:shadow-xs transition-all relative">
                  <div className="absolute right-4 top-4 flex items-center gap-1.5">
                    <span className={`text-[10px] uppercase font-mono font-black px-2 py-0.5 rounded-full ${
                      role.criticality === "Critical" ? "bg-red-50 text-red-600 border border-red-200" :
                      role.criticality === "High" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                      "bg-blue-50 text-blue-600 border border-blue-200"
                    }`}>
                      {role.criticality}
                    </span>
                    <button
                      onClick={() => handleDeleteCriticalRole(role.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      title={lang === "ID" ? "Hapus Posisi" : "Delete Position"}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1 mb-4">
                    <h4 className="font-extrabold text-slate-800 text-sm tracking-tight pr-14">{role.title}</h4>
                    <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase">{role.department}</span>
                    <span className="block text-xs font-semibold text-slate-600 pt-1.5">
                      {lang === "ID" ? "Pejabat Saat Ini:" : "Current Holder:"} <span className="font-bold text-slate-700">{role.currentHolder}</span>
                    </span>
                  </div>

                  {recommendedCandidate && (
                    <div className="mb-3 bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-start gap-2">
                      <Sparkles className="size-4 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] font-bold uppercase text-indigo-600 mb-0.5">
                          {lang === "ID" ? "Rekomendasi Suksesor Otomatis" : "Auto-Recommended Successor"}
                        </div>
                        <div className="text-xs font-medium text-slate-700">
                          <span className="font-bold">{recommendedCandidate.name}</span> — SRI {recommendedCandidate.sri}%
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {lang === "ID" ? "Kecocokan departemen & lolos filter kolam suksesi." : "Department match & passed succession pool filters."}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-200/60 pt-3 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <span>{lang === "ID" ? "Jalur Suksesor" : "Succession Pipeline"} ({role.successors.length})</span>
                      <button 
                        onClick={() => {
                          setNominatingForRoleId(role.id);
                          if (recommendedCandidate) {
                             setSelectedCandidateId(recommendedCandidate.id);
                             if (recommendedCandidate.readinessLevel) {
                               setSelectedReadiness(recommendedCandidate.readinessLevel as any);
                             }
                          } else {
                             setSelectedCandidateId("");
                          }
                        }}
                        className="text-indigo-600 hover:text-indigo-800 text-[10px] font-black uppercase flex items-center gap-1"
                      >
                        <Plus className="size-3" /> Nominate
                      </button>
                    </div>

                    {role.successors.length === 0 ? (
                      <div className="bg-amber-50 border border-dashed border-amber-200 p-3 rounded-xl flex items-center gap-2 text-[11px] text-amber-700 font-medium">
                        <AlertTriangle className="size-4 shrink-0" />
                        <span>{lang === "ID" ? "⚠️ Belum ada suksesor ternominasi! Posisi ini sangat rentan." : "⚠️ Vacant succession pipeline! High risk exposure."}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {role.successors.map(suc => {
                          const empInfo = scoredEmployees.find(e => e.id === suc.employeeId);
                          if (!empInfo) return null;
                          return (
                            <div key={suc.employeeId} className="bg-white p-2.5 rounded-xl border border-slate-150 flex justify-between items-start gap-2.5 group hover:shadow-xs transition-shadow">
                              <img src={empInfo.avatar} alt="" className="size-8 rounded-full bg-slate-100" />
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-extrabold text-slate-800 truncate">{empInfo.name}</span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    suc.readiness === "Ready Now" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                    suc.readiness === "1-2 Years" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                                    "bg-amber-50 text-amber-700 border border-amber-100"
                                  }`}>
                                    {suc.readiness}
                                  </span>
                                </div>
                                <span className="block text-[10px] text-slate-400 font-bold truncate">{empInfo.position} • SRI {empInfo.sri}%</span>
                                <p className="text-[10.5px] font-medium text-slate-500 italic mt-1 leading-snug">
                                  &ldquo;{suc.justification}&rdquo;
                                </p>
                              </div>
                              <button
                                onClick={() => handleRemoveSuccessor(role.id, suc.employeeId)}
                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                title={lang === "ID" ? "Batalkan Nominasi" : "Revoke Nomination"}
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>

          {/* Section: Succession Pool Candidates List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-wider">
                  <Users className="size-4 text-indigo-600" />
                  {lang === "ID" ? "Daftar Talenta & Pemetaan Indeks Kesiapan" : "Employee Talent & Succession Index Registry"}
                </h3>
                <p className="text-xs text-slate-400 font-semibold">
                  {lang === "ID" ? "Daftar seluruh talenta yang dievaluasi dengan Indeks Suksesi dinamis." : "All evaluated employee talent records scored by succession eligibility configurations."}
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold w-full md:w-auto">
                <div className="flex-1 md:flex-none">
                  <input
                    type="text" placeholder={lang === "ID" ? "Cari nama, jabatan..." : "Search name, role..."}
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <select
                    value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700"
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Sub-tabs within candidate list */}
            <div className="space-y-4">
              
              {/* Succession Pool Candidates (Highly Qualified) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="size-4" />
                    {lang === "ID" ? "Kandidat Kolam Suksesi Lolos Kualifikasi" : "Qualified Succession Pool Candidates"} 
                    <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-black">
                      {successionPoolCandidates.length}
                    </span>
                  </span>
                </div>

                {successionPoolCandidates.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                    <p className="mb-2">
                      {lang === "ID" 
                        ? "Belum ada kandidat yang lolos kualifikasi penuh." 
                        : "No candidates fit all mandatory qualification thresholds."}
                    </p>
                    {highPotentialPipelines.length > 0 && (
                      <div className="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200 text-slate-600 mt-2">
                        <span className="font-bold">{lang === "ID" ? "Kandidat Terdekat:" : "Closest Candidate:"}</span>
                        <span className="text-indigo-600 font-extrabold">{highPotentialPipelines[0].name} (SRI {highPotentialPipelines[0].sri}%)</span>
                        <span className="text-slate-400">—</span>
                        <span className="italic text-slate-500">
                          {(() => {
                            const emp = highPotentialPipelines[0];
                            const failsTenure = emp.tenureYears < minTenure;
                            const failsPerf = emp.performanceScore < minPerfScore;
                            const failsPot = emp.potentialScore < minPotScore;
                            
                            if (failsTenure) return lang === "ID" ? `Masa kerja baru ${emp.tenureYears} tahun (Butuh ≥${minTenure} tahun)` : `Tenure is only ${emp.tenureYears} yrs (Needs ≥${minTenure})`;
                            if (failsPerf) return lang === "ID" ? `Terhambat Kinerja ${methodTerm} (${emp.performanceScore}%, butuh ≥${minPerfScore}%)` : `Blocked by ${methodTerm} (${emp.performanceScore}%, needs ≥${minPerfScore}%)`;
                            if (failsPot) return lang === "ID" ? `Terhambat Potensial (${emp.potentialScore}%, butuh ≥${minPotScore}%)` : `Blocked by Potential (${emp.potentialScore}%, needs ≥${minPotScore}%)`;
                            return lang === "ID" ? "Skor Indeks Suksesi di bawah 75%" : "SRI score below 75%";
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-mono font-bold text-slate-400">
                          <th className="p-3">{lang === "ID" ? "Nama & Jabatan" : "Employee"}</th>
                          <th className="p-3 text-center">{lang === "ID" ? "Masa Kerja" : "Tenure"}</th>
                          <th className="p-3 text-center">
                            <TooltipWrapper
                              content={lang === "ID"
                                ? `${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.nameID}\nAsal Data: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.sourceID}\nRumus: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.formulaID}`
                                : `${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.nameEN}\nData Source: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.sourceEN}\nFormula: ${(systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT).find(m => m.id === "perf_score")?.formulaEN}`}
                            >
                              <span className="flex items-center justify-center gap-1 cursor-help">
                                {lang === "ID" ? `Kinerja (${methodTerm})` : "Performance"} <Info className="size-3 text-slate-450" />
                              </span>
                            </TooltipWrapper>
                          </th>
                          <th className="p-3 text-center">
                            <TooltipWrapper
                              content={lang === "ID"
                                ? "Skor Potensi\nAsal Data: Asesmen Multi-rater 360 (60%) & Tes Kognitif HRIS (40%).\nRumus: (Skor 360 × 60%) + (Nilai Tes Kognitif × 40%)"
                                : "Potential Score\nData Source: 360 Multi-rater Competency Assessment (60%) & HRIS Cognitive Test (40%).\nFormula: (360 Competency Score × 60%) + (Cognitive Score × 40%)"}
                            >
                              <span className="flex items-center justify-center gap-1 cursor-help">
                                {lang === "ID" ? "Potensial" : "Potential"} <Info className="size-3 text-slate-450" />
                              </span>
                            </TooltipWrapper>
                          </th>
                          <th className="p-3 text-center">{lang === "ID" ? "Kepemimpinan" : "Leadership"}</th>
                          <th className="p-3 text-center">{lang === "ID" ? "Pemetaan 9-Box" : "9-Box Box"}</th>
                          <th className="p-3 text-center">
                            <TooltipWrapper
                              content={lang === "ID"
                                ? "Indeks Kesiapan Suksesi (SRI)\nAsal Data: Kalkulasi otomatis engine suksesi berdasarkan data master profil karyawan.\nRumus: SRI = (Kinerja × W_perf) + (Potensi × W_pot) + (Leadership × W_lead) + (Faktor Masa Kerja × W_tenure) + (Kesiapan × W_ready)"
                                : "Succession Readiness Index (SRI)\nData Source: Succession engine calculations based on master employee profiles.\nFormula: SRI = (Performance × W_perf) + (Potential × W_pot) + (Leadership × W_lead) + (Tenure Factor × W_tenure) + (Readiness Status × W_ready)"}
                            >
                              <span className="flex items-center justify-center gap-1 cursor-help text-purple-700">
                                {lang === "ID" ? "Indeks Suksesi" : "SRI Score"} <Info className="size-3 text-purple-400" />
                              </span>
                            </TooltipWrapper>
                          </th>
                          <th className="p-3 text-center">{lang === "ID" ? "Risiko Keluar" : "Flight Risk"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {successionPoolCandidates.map(emp => (
                          <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors text-xs font-semibold text-slate-700">
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <img src={emp.avatar} alt="" className="size-8 rounded-full" />
                                <div>
                                  <span className="block font-extrabold text-slate-800 leading-tight">{emp.name}</span>
                                  <span className="block text-[10px] text-slate-400 font-bold">{emp.position} • {emp.department}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center font-mono font-bold">
                              {emp.tenureYears} Thn
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="font-extrabold text-slate-800">{emp.performanceScore}%</span>
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="font-extrabold text-slate-800">{emp.potentialScore}%</span>
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="font-extrabold text-slate-800">{emp.leadershipRating}%</span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {boxMap[emp.boxId] || emp.boxId}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="text-sm font-black text-purple-700 font-mono bg-purple-50 border border-purple-100 px-2 py-1 rounded-lg">
                                {emp.sri}%
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                emp.riskLevel === "High" ? "bg-red-50 text-red-700 border border-red-150" :
                                emp.riskLevel === "Medium" ? "bg-amber-50 text-amber-700 border border-amber-150" :
                                "bg-emerald-50 text-emerald-700 border border-emerald-150"
                              }`}>
                                <ShieldAlert className="size-3" />
                                {emp.riskLevel}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* High Potential Pipeline (Near Eligible) */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="size-4" />
                    {lang === "ID" ? "Talenta Potensi Tinggi (Pipeline / Pra-Suksesi)" : "High Potential Talent Pipelines (Pre-Succession)"}
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-black">
                      {highPotentialPipelines.length}
                    </span>
                  </span>
                </div>

                {highPotentialPipelines.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    {lang === "ID" ? "Tidak ada talenta berpotensi tinggi cadangan." : "No additional high-potential backup candidates."}
                  </div>
                ) : (
                  <div className="overflow-x-auto opacity-80">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] uppercase font-mono font-bold text-slate-400">
                          <th className="p-3">{lang === "ID" ? "Karyawan" : "Employee"}</th>
                          <th className="p-3 text-center">{lang === "ID" ? "Masa Kerja" : "Tenure"}</th>
                          <th className="p-3 text-center">{lang === "ID" ? "Indeks Suksesi" : "Succession Index"}</th>
                          <th className="p-3 text-center">{lang === "ID" ? "Hambatan Utama" : "Primary Constraint"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {highPotentialPipelines.map(emp => {
                          // Find out why they failed
                          const failsTenure = emp.tenureYears < minTenure;
                          const failsPerf = emp.performanceScore < minPerfScore;
                          const failsPot = emp.potentialScore < minPotScore;
                          
                          let blockReason = "";
                          if (failsTenure) blockReason = lang === "ID" ? `Masa kerja baru ${emp.tenureYears} tahun (Butuh ≥${minTenure} tahun)` : `Tenure is only ${emp.tenureYears} yrs (Needs ≥${minTenure})`;
                          else if (failsPerf) blockReason = lang === "ID" ? `Kinerja ${methodTerm} ${emp.performanceScore}% (Butuh ≥${minPerfScore}%)` : `${methodTerm} is ${emp.performanceScore}% (Needs ≥${minPerfScore}%)`;
                          else if (failsPot) blockReason = lang === "ID" ? `Potensial ${emp.potentialScore}% (Butuh ≥${minPotScore}%)` : `Potential is ${emp.potentialScore}% (Needs ≥${minPotScore}%)`;
                          else blockReason = lang === "ID" ? "Skor Indeks Suksesi di bawah 75%" : "SRI score below 75%";

                          return (
                            <tr key={emp.id} className="hover:bg-slate-50/30 text-xs font-semibold text-slate-600">
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <img src={emp.avatar} alt="" className="size-7 rounded-full" />
                                  <div>
                                    <span className="block font-bold text-slate-700 leading-tight">{emp.name}</span>
                                    <span className="block text-[10px] text-slate-400 font-bold">{emp.position} • {emp.department}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-center font-mono">
                                {emp.tenureYears} Thn
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-indigo-600">
                                {emp.sri}%
                              </td>
                              <td className="p-3 text-left">
                                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                                  <AlertTriangle className="size-3" />
                                  {blockReason}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
