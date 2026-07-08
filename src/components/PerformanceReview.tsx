import React, { useState, useEffect, useMemo } from "react";
import { 
  ReviewCycle, 
  PerformanceReview as ReviewType, 
  User, 
  Circle, 
  KpiItem, 
  BscPerspective, 
  Rater360Group, 
  SystemConfig, 
  Objective, 
  KeyResult, 
  KeyResultAssignee, 
  Role, 
  RoleMember 
} from "../types";
import { 
  Award, 
  Star, 
  Edit3, 
  ClipboardCheck, 
  ArrowUpRight, 
  TrendingUp, 
  Compass, 
  Check, 
  BookOpen, 
  Plus, 
  Trash2, 
  Percent, 
  Users, 
  ShieldAlert, 
  CheckCircle, 
  Search, 
  Filter, 
  RefreshCw, 
  BarChart3, 
  TrendingDown, 
  ChevronRight, 
  CornerDownRight, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Building, 
  Info, 
  FileText,
  Briefcase,
  UserCheck,
  Zap,
  CheckCircle as ConfirmIcon,
  X,
  History,
  Lock,
  Unlock,
  ShieldCheck,
  Sliders,
  Maximize2,
  Grid3X3,
  Brain,
  Activity
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line
} from "recharts";
import { HRIS_API } from "../api";
import { TooltipWrapper } from "./TooltipContext";
import MetricsGlossary from "./MetricsGlossary";

interface PerformanceReviewProps {
  lang: "ID" | "EN";
  users: User[];
  circles: Circle[];
  reviewCycles: ReviewCycle[];
  performanceReviews: ReviewType[];
  systemConfig?: SystemConfig;
  onUpdateSystemConfig?: (config: Partial<SystemConfig>) => void;
  objectives?: Objective[];
  keyResults?: KeyResult[];
  keyResultAssignees?: KeyResultAssignee[];
  roles?: Role[];
  roleMembers?: RoleMember[];
  eval360Submissions?: any[];
  onReviewSubmitted: (reviewPayload: Partial<ReviewType>) => void;
  onDeleteReview?: (id: string) => void;
}

const RECOMMENDED_ACTIONS_LIST = [
  "Leadership Training",
  "Coaching",
  "Mentoring",
  "Job Rotation",
  "Stretch Assignment",
  "Certification",
  "Succession Pool"
];

const CAREER_SUGGESTIONS_LIST = [
  "Promote",
  "Maintain",
  "Lateral Move",
  "Job Enrichment",
  "Talent Pool",
  "Critical Talent",
  "Successor",
  "Fast Track",
  "Watch List"
];

export default function PerformanceReview({
  lang,
  users,
  circles,
  reviewCycles,
  performanceReviews,
  systemConfig,
  onUpdateSystemConfig,
  objectives = [],
  keyResults = [],
  keyResultAssignees = [],
  roles = [],
  roleMembers = [],
  eval360Submissions = [],
  onReviewSubmitted,
  onDeleteReview
}: PerformanceReviewProps) {
  // Acting role simulation
  const [actingRole, setActingRole] = useState<"HR" | "Manager" | "Director">("HR");
  
  // Weight configuration state (Performance vs Potential weights summing to 100)
  const [perfWeight, setPerfWeight] = useState<number>(60);
  const [potWeight, setPotWeight] = useState<number>(40);
  const [evaluationScheme, setEvaluationScheme] = useState<"combined" | "performance_only">("combined");
  // Dashboard & list views
  const [showDashboard, setShowDashboard] = useState<boolean>(true);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("cyc_1");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter States
  const [filterDept, setFilterDept] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Selected Employee Details Split-Screen state
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);

  // Form input states for the active employee's review
  const [strength, setStrength] = useState<string>("");
  const [developmentArea, setDevelopmentArea] = useState<string>("");
  const [promotionReadiness, setPromotionReadiness] = useState<"Ready Now" | "Ready < 1 Year" | "Ready 2 Years" | "Not Ready">("Not Ready");
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [careerSuggestion, setCareerSuggestion] = useState<string>("Maintain");
  const [trainingSuggestion, setTrainingSuggestion] = useState<string>("");
  const [risk, setRisk] = useState<string>("Medium");
  const [comment, setComment] = useState<string>("");
  
  // Calibration states
  const [managerRating, setManagerRating] = useState<number>(75);
  const [hrRating, setHrRating] = useState<number>(75);
  const [calibrationRating, setCalibrationRating] = useState<number>(75);
  const [calibrationReason, setCalibrationReason] = useState<string>("");
  const [calibrated9BoxCode, setCalibrated9BoxCode] = useState<string>("");

  const activeCycle = reviewCycles.find(cy => cy.id === selectedCycleId) || reviewCycles[0];

  // Map employee department, position, performance & potential score
  const employeesData = useMemo(() => {
    return users.map(user => {
      // Find role & circle
      const userRoleMember = roleMembers.find(rm => rm.userId === user.id);
      let position = "Staff";
      let department = user.department || "Operations";
      if (userRoleMember) {
        const role = roles.find(r => r.id === userRoleMember.roleId);
        if (role) {
          position = role.title;
          const circle = circles.find(c => c.id === role.circleId);
          if (circle) department = circle.name;
        }
      }

      // Calculate Performance Score dynamically from OKR/KPI/BSC
      // Let's find objectives of this user via roles
      const userRoles = roleMembers.filter(rm => rm.userId === user.id).map(rm => rm.roleId);
      const userKRIds = keyResultAssignees.filter(kra => kra.roleId && userRoles.includes(kra.roleId)).map(kra => kra.keyResultId);
      
      const userObjectives = objectives.filter(obj => {
        const hasKR = keyResults.some(kr => kr.objectiveId === obj.id && userKRIds.includes(kr.id));
        const hasCircle = obj.circleId && circles.some(c => c.id === obj.circleId && c.leadId === user.id);
        return hasKR || hasCircle;
      });

      let calculatedPerfScore = 75; // baseline
      let hasPerfData = false;
      if (userObjectives.length > 0) {
        let totalProgress = 0;
        let krCount = 0;
        userObjectives.forEach(obj => {
          const krs = keyResults.filter(kr => kr.objectiveId === obj.id);
          krs.forEach(kr => {
            totalProgress += kr.progress || 0;
            krCount++;
          });
        });
        if (krCount > 0) {
          calculatedPerfScore = Math.min(100, Math.max(30, Math.round(totalProgress / krCount)));
          hasPerfData = true;
        }
      } else {
        // Deterministic baseline for demo based on user ID character codes
        const charSum = user.name.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
        calculatedPerfScore = 65 + (charSum % 31); // 65 - 96 range
        hasPerfData = false;
      }

      // Check if there is already a saved performance review in db
      const savedReview = performanceReviews.find(r => r.cycleId === selectedCycleId && r.userId === user.id);
      
      // Potential Score from Assessment 360
      const user360s = eval360Submissions.filter(s => s.evaluateeId === user.id && s.status === "submitted");
      let calculatedPotScore = 70; // baseline
      let hasPotData = false;
      if (user360s.length > 0) {
        let totalScore = 0;
        let count = 0;
        user360s.forEach(sub => {
          if (sub.answers && Array.isArray(sub.answers)) {
            sub.answers.forEach((ans: any) => {
              totalScore += ans.score || 0;
              count++;
            });
          }
        });
        if (count > 0) {
          calculatedPotScore = Math.round((totalScore / count) * 20); // convert 1-5 to 0-100 scale
          hasPotData = true;
        }
      } else {
        const charSum = user.name.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
        calculatedPotScore = 55 + (charSum % 36); // 55 - 91 range
        hasPotData = false;
      }

      // Calculate dynamic weighted score from performance and potential with fallback for empty data
      let finalCalculatedScore = 0;
      if (evaluationScheme === "performance_only") {
        finalCalculatedScore = calculatedPerfScore;
      } else {
        if (hasPerfData && hasPotData) {
          finalCalculatedScore = Math.round((calculatedPerfScore * perfWeight / 100) + (calculatedPotScore * potWeight / 100));
        } else if (hasPerfData && !hasPotData) {
          // Only OKR performance is present, use it at 100% weight
          finalCalculatedScore = calculatedPerfScore;
        } else if (!hasPerfData && hasPotData) {
          // Only 360 potential is present, use it at 100% weight
          finalCalculatedScore = calculatedPotScore;
        } else {
          // Neither actually present, fallback to standard weighted average using baseline fallback scores
          finalCalculatedScore = Math.round((calculatedPerfScore * perfWeight / 100) + (calculatedPotScore * potWeight / 100));
        }
      }

      // The final score is strictly calculated from the weights
      const finalPerf = finalCalculatedScore;

      // Status
      const approvalStatus = savedReview?.approvalStatus || "Draft";

      return {
        ...user,
        department,
        position,
        performanceScore: finalPerf,
        potentialScore: calculatedPotScore,
        rawPerformanceScore: calculatedPerfScore,
        rawPotentialScore: calculatedPotScore,
        hasPerfData,
        hasPotData,
        finalCalculatedScore,
        approvalStatus,
        savedReview,
        calibrated9BoxCode: savedReview?.calibrated9BoxCode
      };
    });
  }, [users, roleMembers, roles, circles, objectives, keyResults, keyResultAssignees, performanceReviews, selectedCycleId, eval360Submissions, perfWeight, potWeight, evaluationScheme]);

  // Default bell curve policy if not defined
  const defaultPolicy = [
    { rating: "BELOW PAR", percentage: 5, minScore: 0, maxScore: 69.99, color: "#ef4444" },
    { rating: "PAR", percentage: 5, minScore: 70, maxScore: 84.99, color: "#f97316" },
    { rating: "QUALITY", percentage: 75, minScore: 85, maxScore: 99.99, color: "#10b981" },
    { rating: "OUTSTANDING", percentage: 10, minScore: 100, maxScore: 109.99, color: "#3b82f6" },
    { rating: "EXCEPTIONAL", percentage: 5, minScore: 110, maxScore: 999, color: "#8b5cf6" }
  ];

  const [localPolicyList, setLocalPolicyList] = useState(systemConfig?.bellCurvePolicy || defaultPolicy);

  useEffect(() => {
    setLocalPolicyList(systemConfig?.bellCurvePolicy || defaultPolicy);
  }, [systemConfig?.bellCurvePolicy]);

  const policyList = localPolicyList;

  const totalHeadcount = users.length;

  const employeeScores = useMemo(() => {
    return users.map(user => {
      // Find their review
      const userReviews = (performanceReviews || []).filter(r => r.userId === user.id);
      let initialScore = 50;
      let calibratedScore = 50;

      if (userReviews.length > 0) {
        const latest = userReviews[userReviews.length - 1];
        initialScore = latest.finalCalculatedScore !== undefined 
          ? latest.finalCalculatedScore 
          : (latest.okrScore !== undefined ? latest.okrScore : 50);
        
        calibratedScore = latest.calibrationRating !== undefined 
          ? latest.calibrationRating 
          : initialScore;
      } else {
        // Consistent hash-based spread fallback to make sure there's beautiful data even with blank DB
        const hash = user.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        initialScore = 75 + (hash % 40); // 75 - 115
        calibratedScore = initialScore + (hash % 3 === 0 ? 3 : (hash % 3 === 1 ? -2 : 0));
      }

      return {
        id: user.id,
        name: user.name,
        initialScore,
        calibratedScore
      };
    });
  }, [users, performanceReviews]);

  const chartBellCurveData = useMemo(() => {
    return policyList.map(p => {
      const formulaCount = employeeScores.filter(emp => emp.initialScore >= p.minScore && emp.initialScore <= p.maxScore).length;
      const agreedCount = employeeScores.filter(emp => emp.calibratedScore >= p.minScore && emp.calibratedScore <= p.maxScore).length;
      const recommendedCount = Math.round(totalHeadcount * (p.percentage / 100));

      // Convert to percentages for line heights on the curve
      const formulaPercent = totalHeadcount > 0 ? Math.round((formulaCount / totalHeadcount) * 100) : 0;
      const agreedPercent = totalHeadcount > 0 ? Math.round((agreedCount / totalHeadcount) * 100) : 0;
      const recommendedPercent = p.percentage;

      return {
        name: p.rating,
        "Standard (Policy)": recommendedPercent,
        "Rating Recommended": totalHeadcount > 0 ? Math.round((recommendedCount / totalHeadcount) * 100) : p.percentage,
        "Rating Agreed": agreedPercent,
        formulaCount,
        agreedCount,
        recommendedCount
      };
    });
  }, [policyList, employeeScores, totalHeadcount]);

  const totalPolicyPercent = policyList.reduce((sum, p) => sum + p.percentage, 0);
  const totalRecommendedHeadcount = chartBellCurveData.reduce((sum, d) => sum + d.recommendedCount, 0);
  const totalAgreedHeadcount = chartBellCurveData.reduce((sum, d) => sum + d.agreedCount, 0);

  const handleUpdatePolicyPercent = (rating: string, val: number) => {
    const updated = policyList.map(p => p.rating === rating ? { ...p, percentage: val } : p);
    setLocalPolicyList(updated);
  };

  const handleSavePolicy = () => {
    if (onUpdateSystemConfig) {
      onUpdateSystemConfig({ bellCurvePolicy: policyList });
      alert("Distribusi Kurva Lonceng berhasil disimpan!");
    }
  };

  // Handle employee selection & load form states
  useEffect(() => {
    if (activeEmployeeId) {
      const emp = employeesData.find(e => e.id === activeEmployeeId);
      if (emp && emp.savedReview) {
        const rev = emp.savedReview;
        setStrength(rev.strength || "");
        setDevelopmentArea(rev.developmentArea || "");
        setPromotionReadiness(rev.promotionReadiness || "Not Ready");
        setSelectedActions(rev.recommendedActions || []);
        setCareerSuggestion(rev.careerSuggestion || "Maintain");
        setTrainingSuggestion(rev.trainingSuggestion || "");
        setRisk(rev.risk || "Medium");
        setComment(rev.comment || "");
        setManagerRating(rev.managerRating !== undefined ? rev.managerRating : emp.rawPerformanceScore);
        setHrRating(rev.hrRating !== undefined ? rev.hrRating : emp.rawPerformanceScore);
        setCalibrationRating(rev.calibrationRating !== undefined ? rev.calibrationRating : emp.rawPerformanceScore);
        const computedBox = get9BoxPosition(emp.performanceScore, emp.potentialScore, rev.calibrated9BoxCode);
        setCalibrated9BoxCode(rev.calibrated9BoxCode || computedBox.code);
      } else if (emp) {
        setStrength("");
        setDevelopmentArea("");
        setPromotionReadiness("Not Ready");
        setSelectedActions([]);
        setCareerSuggestion("Maintain");
        setTrainingSuggestion("");
        setRisk("Medium");
        setComment("");
        setManagerRating(emp.rawPerformanceScore);
        setHrRating(emp.rawPerformanceScore);
        setCalibrationRating(emp.rawPerformanceScore);
        const computedBox = get9BoxPosition(emp.performanceScore, emp.potentialScore);
        setCalibrated9BoxCode(computedBox.code);
      }
      setCalibrationReason("");
    }
  }, [activeEmployeeId, selectedCycleId]);

  // Filter Employees
  const filteredEmployees = useMemo(() => {
    return employeesData.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            emp.position.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = filterDept === "all" || emp.department === filterDept;
      const matchesPosition = filterPosition === "all" || emp.position.includes(filterPosition);
      const matchesStatus = filterStatus === "all" || emp.approvalStatus === filterStatus;
      return matchesSearch && matchesDept && matchesPosition && matchesStatus;
    });
  }, [employeesData, searchQuery, filterDept, filterPosition, filterStatus]);

  // Get filter drop-down options
  const departments = useMemo(() => {
    const set = new Set<string>();
    employeesData.forEach(e => { if (e.department) set.add(e.department); });
    return Array.from(set);
  }, [employeesData]);

  const positions = useMemo(() => {
    const set = new Set<string>();
    employeesData.forEach(e => { if (e.position) set.add(e.position); });
    return Array.from(set);
  }, [employeesData]);

  // Dashboard Stats Calculations
  const stats = useMemo(() => {
    const total = employeesData.length;
    const drafted = employeesData.filter(e => e.approvalStatus === "Draft").length;
    const submitted = employeesData.filter(e => e.approvalStatus === "Submitted").length;
    const calibrated = employeesData.filter(e => e.approvalStatus === "Calibrated").length;
    const approved = employeesData.filter(e => e.approvalStatus === "Approved").length;
    const published = employeesData.filter(e => e.approvalStatus === "Published").length;
    const pendingReview = total - approved - published;

    return { total, drafted, submitted, calibrated, approved, published, pendingReview };
  }, [employeesData]);

  // Chart Data Calculations
  const chartPerformanceData = useMemo(() => {
    const dist = { Outstanding: 0, Exceed: 0, Meet: 0, Below: 0, Poor: 0 };
    employeesData.forEach(emp => {
      const score = emp.performanceScore;
      if (score >= 90) dist.Outstanding++;
      else if (score >= 80) dist.Exceed++;
      else if (score >= 70) dist.Meet++;
      else if (score >= 60) dist.Below++;
      else dist.Poor++;
    });
    return [
      { name: "Outstanding (90-100)", value: dist.Outstanding, fill: "#10b981" },
      { name: "Exceeds (80-89)", value: dist.Exceed, fill: "#3b82f6" },
      { name: "Meets Expectations (70-79)", value: dist.Meet, fill: "#f59e0b" },
      { name: "Below (60-69)", value: dist.Below, fill: "#ef4444" },
      { name: "Poor (<60)", value: dist.Poor, fill: "#7f1d1d" }
    ];
  }, [employeesData]);

  const chartPotentialData = useMemo(() => {
    const dist = {} as Record<string, number>;
    const classifications = systemConfig?.potentialClassifications || [
      { label: "High Potential", min: 76, max: 100, color: "bg-emerald-100 text-emerald-800", description: "" },
      { label: "Moderate Potential", min: 41, max: 75, color: "bg-amber-100 text-amber-800", description: "" },
      { label: "Low Potential", min: 0, max: 40, color: "bg-rose-100 text-rose-800", description: "" }
    ];

    classifications.forEach(c => {
      dist[c.label] = 0;
    });

    employeesData.forEach(emp => {
      const score = emp.potentialScore;
      const cls = classifications.find(c => score >= c.min && score <= c.max) || classifications[classifications.length - 1];
      if (cls) {
        dist[cls.label] = (dist[cls.label] || 0) + 1;
      }
    });

    const colors = ["#8b5cf6", "#06b6d4", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
    return classifications.map((cls, idx) => ({
      name: `${cls.label} (${cls.min}-${cls.max})`,
      value: dist[cls.label],
      fill: colors[idx % colors.length]
    }));
  }, [employeesData, systemConfig]);

  const chartPromotionData = useMemo(() => {
    const config = systemConfig?.successionPoolConfig || {
      sriWeights: { performance: 30, potential: 30, leadership: 20, tenure: 10, readiness: 10 },
      minSriThreshold: 75,
      eligible9BoxQuadrants: ["6", "8", "9"]
    };

    let eligible = 0;
    let notEligible = 0;

    employeesData.forEach(emp => {
      const perf = emp.performanceScore;
      const pot = emp.potentialScore;
      
      // Calculate mock leadership, tenure, and readiness if not available
      const charSum = emp.name.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
      const lead = 60 + (charSum % 40); // 60 - 100
      const tenure = 50 + (charSum % 50); // 50 - 100
      let ready = 50;
      if (emp.savedReview?.promotionReadiness === "Ready Now") ready = 100;
      else if (emp.savedReview?.promotionReadiness === "Ready < 1 Year") ready = 75;
      else if (emp.savedReview?.promotionReadiness === "Ready 2 Years") ready = 50;

      const w = config.sriWeights;
      const totalWeight = w.performance + w.potential + w.leadership + w.tenure + w.readiness || 100;
      
      const sri = (
        (perf * w.performance) + 
        (pot * w.potential) + 
        (lead * w.leadership) + 
        (tenure * w.tenure) + 
        (ready * w.readiness)
      ) / totalWeight;

      // Determine 9-box (rough estimation based on performance and potential)
      let boxCode = "B5";
      if (perf >= 85 && pot >= 76) boxCode = "B9";
      else if (perf >= 85 && pot >= 41) boxCode = "B8";
      else if (perf >= 85 && pot < 41) boxCode = "B7";
      else if (perf >= 70 && pot >= 76) boxCode = "B6";
      else if (perf >= 70 && pot >= 41) boxCode = "B5";
      else if (perf >= 70 && pot < 41) boxCode = "B4";
      else if (perf < 70 && pot >= 76) boxCode = "B3";
      else if (perf < 70 && pot >= 41) boxCode = "B2";
      else boxCode = "B1";

      const finalBox = emp.calibrated9BoxCode || boxCode;

      const isEligible = sri >= config.minSriThreshold && config.eligible9BoxQuadrants.includes(finalBox.replace("B", ""));
      
      if (isEligible) {
        eligible++;
      } else {
        notEligible++;
      }
    });

    return [
      { name: "Eligible for Succession", count: eligible, fill: "#10b981" },
      { name: "Not Eligible / Developing", count: notEligible, fill: "#64748b" }
    ];
  }, [employeesData, systemConfig]);

  // Determine 9 Box placement for a single employee
  const get9BoxPosition = (perf: number, pot: number, overrideCode?: string) => {
    if (overrideCode) {
      if (overrideCode === "B9") return { code: "B9", label: lang === "ID" ? "Star / Future Leader (B9)" : "Star / Future Leader (B9)", color: "bg-emerald-100 text-emerald-950 border-emerald-300 font-bold" };
      if (overrideCode === "B8") return { code: "B8", label: lang === "ID" ? "High Performer (B8)" : "High Performance, Medium Potential (B8)", color: "bg-teal-50/50 text-teal-900 border-teal-200" };
      if (overrideCode === "B7") return { code: "B7", label: lang === "ID" ? "Solid Professional (B7)" : "High Performance, Low Potential (B7)", color: "bg-blue-50/50 text-blue-900 border-blue-200" };
      if (overrideCode === "B6") return { code: "B6", label: lang === "ID" ? "High Potential (B6)" : "Medium Performance, High Potential (B6)", color: "bg-indigo-50/50 text-indigo-900 border-indigo-200" };
      if (overrideCode === "B5") return { code: "B5", label: lang === "ID" ? "Core Player (B5)" : "Medium Performance, Medium Potential (B5)", color: "bg-slate-50 text-slate-900 border-slate-200" };
      if (overrideCode === "B4") return { code: "B4", label: lang === "ID" ? "Effective Employee (B4)" : "Medium Performance, Low Potential (B4)", color: "bg-amber-50/50 text-amber-900 border-amber-200" };
      if (overrideCode === "B3") return { code: "B3", label: lang === "ID" ? "Enigma (B3)" : "Low Performance, High Potential (B3)", color: "bg-purple-50/50 text-purple-900 border-purple-200" };
      if (overrideCode === "B2") return { code: "B2", label: lang === "ID" ? "Dilemma / Inkonsisten (B2)" : "Low Performance, Medium Potential (B2)", color: "bg-orange-50/50 text-orange-900 border-orange-200" };
      if (overrideCode === "B1") return { code: "B1", label: lang === "ID" ? "Action Required (B1)" : "Low Performance, Low Potential (B1)", color: "bg-red-50/50 text-red-900 border-red-250" };
    }

    let perfLabel: "Low" | "Medium" | "High" = "Medium";
    if (perf >= 85) perfLabel = "High";
    else if (perf < 70) perfLabel = "Low";

    let potLabel: "Low" | "Medium" | "High" = "Medium";
    if (pot >= 80) potLabel = "High";
    else if (pot < 50) potLabel = "Low";

    if (perfLabel === "High" && potLabel === "High") return { code: "B9", label: lang === "ID" ? "Star / Future Leader (B9)" : "Star / Future Leader (B9)", color: "bg-emerald-100 text-emerald-950 border-emerald-300 font-bold" };
    if (perfLabel === "High" && potLabel === "Medium") return { code: "B8", label: lang === "ID" ? "High Performer (B8)" : "High Performance, Medium Potential (B8)", color: "bg-teal-50/50 text-teal-900 border-teal-200" };
    if (perfLabel === "High" && potLabel === "Low") return { code: "B7", label: lang === "ID" ? "Solid Professional (B7)" : "High Performance, Low Potential (B7)", color: "bg-blue-50/50 text-blue-900 border-blue-200" };
    
    if (perfLabel === "Medium" && potLabel === "High") return { code: "B6", label: lang === "ID" ? "High Potential (B6)" : "Medium Performance, High Potential (B6)", color: "bg-indigo-50/50 text-indigo-900 border-indigo-200" };
    if (perfLabel === "Medium" && potLabel === "Medium") return { code: "B5", label: lang === "ID" ? "Core Player (B5)" : "Medium Performance, Medium Potential (B5)", color: "bg-slate-50 text-slate-900 border-slate-200" };
    if (perfLabel === "Medium" && potLabel === "Low") return { code: "B4", label: lang === "ID" ? "Effective Employee (B4)" : "Medium Performance, Low Potential (B4)", color: "bg-amber-50/50 text-amber-900 border-amber-200" };
    
    if (perfLabel === "Low" && potLabel === "High") return { code: "B3", label: lang === "ID" ? "Enigma (B3)" : "Low Performance, High Potential (B3)", color: "bg-purple-50/50 text-purple-900 border-purple-200" };
    if (perfLabel === "Low" && potLabel === "Medium") return { code: "B2", label: lang === "ID" ? "Dilemma / Inkonsisten (B2)" : "Low Performance, Medium Potential (B2)", color: "bg-orange-50/50 text-orange-900 border-orange-200" };
    return { code: "B1", label: lang === "ID" ? "Action Required (B1)" : "Low Performance, Low Potential (B1)", color: "bg-red-50/50 text-red-900 border-red-250" };
  };

  // 9 Box Preview stats for Dashboard preview
  const chart9BoxPreviewData = useMemo(() => {
    const grid = { B9: 0, B8: 0, B7: 0, B6: 0, B5: 0, B4: 0, B3: 0, B2: 0, B1: 0 };
    employeesData.forEach(emp => {
      const box = get9BoxPosition(emp.performanceScore, emp.potentialScore, emp.calibrated9BoxCode);
      grid[box.code as keyof typeof grid]++;
    });
    return [
      { id: "B9", name: "Star (B9)", count: grid.B9, fill: "#10b981" },
      { id: "B8", name: "High Perf (B8)", count: grid.B8, fill: "#3b82f6" },
      { id: "B6", name: "High Pot (B6)", count: grid.B6, fill: "#8b5cf6" },
      { id: "B5", name: "Core (B5)", count: grid.B5, fill: "#64748b" },
      { id: "others", name: "Others", count: grid.B7 + grid.B4 + grid.B3 + grid.B2 + grid.B1, fill: "#94a3b8" }
    ];
  }, [employeesData]);

  // Handle Save / Submit Review
  const handleSaveAppraisal = async (newStatus: "Draft" | "Submitted" | "Reviewed" | "Calibrated" | "Approved" | "Published") => {
    if (!activeEmployeeId) return;
    
    const emp = employeesData.find(e => e.id === activeEmployeeId);
    if (!emp) return;

    const originalBox = get9BoxPosition(emp.performanceScore, emp.potentialScore, emp.savedReview?.calibrated9BoxCode);
    const is9BoxChanged = calibrated9BoxCode && calibrated9BoxCode !== originalBox.code;

    if (is9BoxChanged && !calibrationReason.trim()) {
      alert(lang === "ID" 
        ? "Wajib mengisi Alasan Kalibrasi (calibration justification) sebelum menyimpan perubahan 9-Box!" 
        : "Calibration justification is required before saving 9-Box quadrant modifications!"
      );
      return;
    }

    const newAuditTrail = emp.savedReview?.auditTrail ? [...emp.savedReview.auditTrail] : [];
    if (is9BoxChanged) {
      newAuditTrail.push({
        before: `9-Box: ${originalBox.code}`,
        after: `9-Box: ${calibrated9BoxCode}`,
        user: `${actingRole} Admin`,
        date: new Date().toISOString(),
        reason: calibrationReason.trim()
      });
    }

    const payload: Partial<ReviewType> = {
      cycleId: selectedCycleId,
      userId: activeEmployeeId,
      evaluatedBy: "usr_hr_1", // Default evaluator
      okrScore: emp.rawPerformanceScore,
      qualitativeScore: 4.0,
      managerFeedback: comment || "",
      selfAssessment: emp.savedReview?.selfAssessment || "",
      growthPlan: trainingSuggestion || "",
      status: ["Approved", "Published"].includes(newStatus) ? "approved" : "draft",
      
      // Extended fields
      strength,
      developmentArea,
      promotionReadiness,
      recommendedActions: selectedActions,
      careerSuggestion: careerSuggestion as any,
      trainingSuggestion,
      risk,
      comment,
      managerRating: emp.rawPerformanceScore,
      hrRating: emp.rawPerformanceScore,
      calibrationRating: emp.performanceScore,
      calibrated9BoxCode,
      auditTrail: newAuditTrail,
      approvalStatus: newStatus
    };

    onReviewSubmitted(payload);
    // Reload active panel settings
    setActiveEmployeeId(null);
  };

  const handleActionToggle = (action: string) => {
    setSelectedActions(prev => 
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  return (
    <div className="space-y-6" id="performance-review-view-root">
      {/* Dynamic Header & Acting Role Selector */}
      <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 p-2 rounded-xl">
              <ClipboardCheck className="size-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {lang === "ID" ? "Sistem Evaluasi Kinerja (Performance Review)" : "Performance Review Board"}
              </h2>
              <p className="text-slate-500 text-xs">
                {lang === "ID" 
                  ? "Sertifikasi kalibrasi, rekomendasi pengembangan karir, serta pemetaan bento matrix Workday." 
                  : "Calibration board, promotion readiness alignment, and succession metrics matching SAP standard."}
              </p>
            </div>
          </div>
        </div>

        {/* Acting Role Controls for Demo Capability */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center gap-1">
            <Sliders className="size-3" /> acting role:
          </span>
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex gap-1 text-xs font-bold">
            <button
              onClick={() => setActingRole("HR")}
              className={`px-3 py-1.5 rounded-lg transition-all ${actingRole === "HR" ? "bg-emerald-700 text-white shadow-xs" : "text-slate-600 hover:text-slate-950"}`}
            >
              HR Admin
            </button>
            <button
              onClick={() => setActingRole("Manager")}
              className={`px-3 py-1.5 rounded-lg transition-all ${actingRole === "Manager" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-950"}`}
            >
              Manager
            </button>
            <button
              onClick={() => setActingRole("Director")}
              className={`px-3 py-1.5 rounded-lg transition-all ${actingRole === "Director" ? "bg-purple-700 text-white shadow-xs" : "text-slate-600 hover:text-slate-950"}`}
            >
              Director
            </button>
          </div>
          <button
            onClick={() => setShowDashboard(!showDashboard)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            <BarChart3 className="size-4" />
            {showDashboard ? (lang === "ID" ? "Sembunyikan Analitik" : "Hide Analytics") : (lang === "ID" ? "Tampilkan Analitik" : "View Analytics")}
          </button>
          <MetricsGlossary lang={lang} />
        </div>
      </div>

      {/* DASHBOARD ANALYTICS SECTION */}
      {showDashboard && (
        <div className="space-y-6 animate-fade-in" id="performance-review-dashboard">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-3xs text-center">
              <span className="text-slate-400 text-[10px] font-mono uppercase font-bold block mb-1">Total Reviewed</span>
              <span className="text-3xl font-black text-slate-800">{stats.total}</span>
              <span className="text-[10px] text-slate-400 block mt-1">Employees assigned</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-3xs text-center">
              <span className="text-slate-400 text-[10px] font-mono uppercase font-bold block mb-1 text-amber-600">Pending Review</span>
              <span className="text-3xl font-black text-amber-600">{stats.pendingReview}</span>
              <span className="text-[10px] text-slate-400 block mt-1">Need action</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-3xs text-center">
              <span className="text-slate-400 text-[10px] font-mono uppercase font-bold block mb-1 text-indigo-600">Calibrated</span>
              <span className="text-3xl font-black text-indigo-600">{stats.calibrated}</span>
              <span className="text-[10px] text-slate-400 block mt-1">Ready for Approval</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-3xs text-center">
              <span className="text-slate-400 text-[10px] font-mono uppercase font-bold block mb-1 text-emerald-600">Approved</span>
              <span className="text-3xl font-black text-emerald-600">{stats.approved}</span>
              <span className="text-[10px] text-slate-400 block mt-1">Locked secure</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-3xs text-center">
              <span className="text-slate-400 text-[10px] font-mono uppercase font-bold block mb-1 text-blue-600">Published</span>
              <span className="text-3xl font-black text-blue-600">{stats.published}</span>
              <span className="text-[10px] text-slate-400 block mt-1">Visible to employees</span>
            </div>
          </div>

          {/* Interactive Recharts Data Viz Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Bell Curve (LineChart-based Policy Distribution) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-3xs">
              <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                <span>Performance Bell Curve (Policy vs Actual)</span>
                <span className="text-[9px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full">Kinerja</span>
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartBellCurveData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} unit="%" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "10px", color: "#fff", fontSize: "10px" }}
                      labelStyle={{ fontWeight: "black", color: "#38bdf8", marginBottom: "2px" }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "9px", fontWeight: "bold" }} />
                    <Line type="monotone" dataKey="Standard (Policy)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Rating Recommended" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Rating Agreed" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Succession Readiness & 9 Box placement */}
            <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-3xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span>Succession Pool Readiness</span>
                    <TooltipWrapper content={lang === "ID" ? "Kesiapan promosi berdasarkan nilai Indeks Kesiapan Suksesi (SRI). Threshold minimum SRI & syarat kuadran bisa diubah di Pengaturan." : "Promotion readiness based on Succession Readiness Index (SRI). Minimum SRI threshold and quadrant rules can be configured."}>
                      <Info className="size-3 text-slate-400" />
                    </TooltipWrapper>
                  </div>
                  <span className="text-[9px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full">Promosi</span>
                </h3>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartPromotionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} width={120} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {chartPromotionData.map((entry, index) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Formula & Weight Source Explanation */}
              {(() => {
                const config = systemConfig?.successionPoolConfig || {
                  sriWeights: { performance: 30, potential: 30, leadership: 20, tenure: 10, readiness: 10 },
                  minSriThreshold: 75,
                  eligible9BoxQuadrants: ["6", "8", "9"]
                };
                return (
                  <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] leading-relaxed text-slate-600 space-y-1.5">
                    <div className="font-extrabold text-slate-700 flex items-center gap-1.5 text-xs">
                      <Sliders className="size-3.5 text-blue-600" />
                      <span>{lang === "ID" ? "Sumber Data & Formula Kesiapan" : "Data Source & Readiness Formula"}</span>
                    </div>
                    <p className="text-slate-500">
                      {lang === "ID"
                        ? `Karyawan dikategorikan "Eligible for Succession" jika memenuhi 2 kriteria berikut:`
                        : `Employees are grouped as "Eligible for Succession" if they satisfy 2 conditions:`}
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-slate-500">
                      <li>
                        <span className="font-bold text-slate-700">
                          {lang === "ID" ? `Indeks Kesiapan Suksesi (SRI) ≥ ${config.minSriThreshold}%` : `Succession Readiness Index (SRI) ≥ ${config.minSriThreshold}%`}
                        </span>
                        <div className="pl-3.5 text-[10px] text-slate-500 font-mono">
                          SRI = (Perf × {config.sriWeights.performance}% + Pot × {config.sriWeights.potential}% + Lead × {config.sriWeights.leadership}% + Tenure × {config.sriWeights.tenure}% + Ready × {config.sriWeights.readiness}%)
                        </div>
                      </li>
                      <li>
                        <span className="font-bold text-slate-700">
                          {lang === "ID" ? `Kuadran 9-Box Aktif` : `Active 9-Box Quadrant`}
                        </span>
                        <span className="ml-1 text-slate-600">
                          {lang === "ID"
                            ? `Berada pada Box ${config.eligible9BoxQuadrants.join(", ")} (High Potential / Star / Future Leader).`
                            : `Belongs to Box ${config.eligible9BoxQuadrants.join(", ")}.`}
                        </span>
                      </li>
                    </ul>
                    <p className="text-[10px] text-slate-400 italic mt-1 border-t border-slate-200 pt-1">
                      {lang === "ID"
                        ? "*Pengaturan bobot & batas threshold di atas dapat disesuaikan secara real-time pada tab \"Konfigurasi Performance\"."
                        : "*Weight parameters and thresholds can be adjusted in real-time under the \"Performance Config\" tab."}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Detailed Policy Table & Calibration Details */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 mt-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="size-5 text-indigo-600" />
                  Kuota Kebijakan & Distribusi Realisasi Rating (Bell Curve)
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  Distribusi penilaian sesuai target tata kelola perusahaan untuk mencegah bias kemurahan (leniency bias). Edit persentase kebijakan di bawah untuk menyesuaikan target kuota organisasi secara langsung.
                </p>
              </div>
              <button
                onClick={handleSavePolicy}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shrink-0"
              >
                Simpan Konfigurasi
              </button>
            </div>

            {/* INPUT TABLE */}
            <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[10px]">
                    <th className="p-4">Performance Rating</th>
                    <th className="p-4 text-center">
                      <TooltipWrapper content="Jumlah karyawan murni dari skor OKR/KPI awal (Formula).">
                        Rating (Formula)
                      </TooltipWrapper>
                    </th>
                    <th className="p-4 text-center">
                      <TooltipWrapper content="Kebijakan alokasi kuota target perusahaan dalam persen (bisa diedit di bawah).">
                        % Rating (Policy)
                      </TooltipWrapper>
                    </th>
                    <th className="p-4 text-center">
                      <TooltipWrapper content="Rekomendasi jumlah headcount berdasarkan % Policy dikali Total Headcount (dibulatkan). Formula: Bulat(Total Karyawan × % Policy)">
                        Rating (Recommended)
                      </TooltipWrapper>
                    </th>
                    <th className="p-4 text-center">
                      <TooltipWrapper content="Persentase aktual rekomendasi terhadap total headcount. Aman dari error #DIV/0! jika jumlah karyawan nol.">
                        % Rating (Recommended)
                      </TooltipWrapper>
                    </th>
                    <th className="p-4 text-center">
                      <TooltipWrapper content="Jumlah karyawan aktual yang disepakati setelah proses rapat kalibrasi/persetujuan akhir.">
                        Rating (Agreed)
                      </TooltipWrapper>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {policyList.map((p, idx) => {
                    const itemData = chartBellCurveData[idx] || { formulaCount: 0, agreedCount: 0, recommendedCount: 0 };
                    const recommendedPercent = totalHeadcount > 0 
                      ? ((itemData.recommendedCount / totalHeadcount) * 100).toFixed(1) + "%"
                      : "0.0%"; // #DIV/0! Protection
                    const formulaPercentStr = totalHeadcount > 0 
                      ? ((itemData.formulaCount / totalHeadcount) * 100).toFixed(1) + "%"
                      : "0.0%";
                    const agreedPercentStr = totalHeadcount > 0 
                      ? ((itemData.agreedCount / totalHeadcount) * 100).toFixed(1) + "%"
                      : "0.0%";

                    return (
                      <tr key={p.rating} className="border-b border-slate-100 hover:bg-slate-50 font-medium text-slate-700 transition-colors">
                        <td className="p-4 font-black text-slate-800 flex items-center gap-2">
                          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                          {p.rating}
                        </td>
                        <td className="p-4 text-center font-bold">
                          <div>{itemData.formulaCount} <span className="text-[10px] text-slate-400">({formulaPercentStr})</span></div>
                          <div className="text-[9px] text-slate-400 font-mono">Skor {p.minScore} - {p.maxScore === 999 ? ">=110" : p.maxScore}</div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={p.percentage}
                              onChange={(e) => handleUpdatePolicyPercent(p.rating, Number(e.target.value))}
                              className="w-16 text-center border border-slate-200 rounded-lg p-1.5 font-bold text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                            <span className="font-bold text-slate-400">%</span>
                          </div>
                        </td>
                        <td className="p-4 text-center text-slate-800 font-extrabold text-sm">
                          {itemData.recommendedCount}
                        </td>
                        <td className="p-4 text-center text-emerald-600 font-bold">
                          {recommendedPercent}
                        </td>
                        <td className="p-4 text-center">
                          <div className="font-bold text-indigo-600">{itemData.agreedCount} <span className="text-[10px] text-indigo-400">({agreedPercentStr})</span></div>
                          <span className="text-[9px] text-indigo-400 uppercase font-bold tracking-widest">Post-Calibration</span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* TOTALS ROW */}
                  <tr className="bg-slate-50/50 font-black text-slate-800 border-t-2 border-slate-200">
                    <td className="p-4 uppercase tracking-wider text-[10px]">Total Headcount</td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-black">{totalHeadcount}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">100.0%</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-sm font-black px-2 py-0.5 rounded-lg ${totalPolicyPercent === 100 ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50 border border-rose-100"}`}>
                        {totalPolicyPercent}%
                      </span>
                      {totalPolicyPercent !== 100 && (
                        <span className="text-[9px] text-rose-500 block font-semibold mt-0.5">Harus 100%!</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-black">{totalRecommendedHeadcount}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-black text-emerald-600">
                        {totalHeadcount > 0 ? ((totalRecommendedHeadcount / totalHeadcount) * 100).toFixed(0) + "%" : "0%"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-black text-indigo-600">{totalAgreedHeadcount}</span>
                      <span className="text-[10px] text-indigo-400 block font-mono">
                        {totalHeadcount > 0 ? ((totalAgreedHeadcount / totalHeadcount) * 100).toFixed(1) + "%" : "0%"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* WEIGHT CONFIGURATION SECTION */}
      <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="size-4 text-indigo-600" />
            <h3 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-700">
              {lang === "ID" ? "Konfigurasi Bobot Nilai Akhir (Performance & Potential)" : "Final Score Weight Configuration"}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            {perfWeight + potWeight === 100 ? (
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                ✓ {lang === "ID" ? "Kalkulasi Valid (100%)" : "Formula Valid (100%)"}
              </span>
            ) : (
              <span className="bg-rose-50 text-rose-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                ⚠️ {lang === "ID" ? `Total Bobot Harus 100% (Saat ini: ${perfWeight + potWeight}%)` : `Total must sum to 100% (Current: ${perfWeight + potWeight}%)`}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 text-xs space-y-1">
            <p className="text-slate-500 leading-relaxed">
              {lang === "ID" 
                ? "Sesuaikan kontribusi persentase dari skor Kinerja (OKR/KPI) dan Potensi (Evaluasi 360) untuk menghitung Nilai Akhir Kinerja secara dinamis." 
                : "Adjust the weight percentage contribution of Performance (OKR/KPI) and Potential (360 Assessment) to dynamically calculate final grades."}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setPerfWeight(50); setPotWeight(50); }}
                className="bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 px-2.5 py-1 rounded-md transition-all cursor-pointer"
              >
                50:50
              </button>
              <button
                type="button"
                onClick={() => { setPerfWeight(60); setPotWeight(40); }}
                className="bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 px-2.5 py-1 rounded-md transition-all cursor-pointer"
              >
                60:40
              </button>
              <button
                type="button"
                onClick={() => { setPerfWeight(70); setPotWeight(30); }}
                className="bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 px-2.5 py-1 rounded-md transition-all cursor-pointer"
              >
                70:30
              </button>
            </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Performance Numeric Input */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>{lang === "ID" ? "Bobot Kinerja (Performance)" : "Performance Weight"}</span>
                <span className="text-sm font-mono text-indigo-600">{perfWeight}%</span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={perfWeight}
                onChange={(e) => {
                  const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                  setPerfWeight(val);
                  setPotWeight(100 - val); // auto balance
                }}
                className="w-full bg-white border border-slate-250 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-800"
              />
              <span className="text-[10px] text-slate-400 block">
                {lang === "ID" ? "Diambil dari pencapaian OKR dan target Key Results" : "Sourced from OKR alignments and objective progress"}
              </span>
            </div>

            {/* Potential Numeric Input */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>{lang === "ID" ? "Bobot Potensi (Potential)" : "Potential Weight"}</span>
                <span className="text-sm font-mono text-purple-600">{potWeight}%</span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={potWeight}
                onChange={(e) => {
                  const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                  setPotWeight(val);
                  setPerfWeight(100 - val); // auto balance
                }}
                className="w-full bg-white border border-slate-250 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-800"
              />
              <span className="text-[10px] text-slate-400 block">
                {lang === "ID" ? "Diambil dari hasil Evaluasi 360 Umpan Balik" : "Sourced from 360 peer feedback evaluation metrics"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR PANEL */}
      <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Filter className="size-4 text-emerald-700" />
          <h3 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-700">
            {lang === "ID" ? "Filter Data Karyawan" : "Filter Employee Catalog"}
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          {/* Cycle Selector */}
          <div>
            <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">Periode Evaluasi</label>
            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              {reviewCycles.map(cy => (
                <option key={cy.id} value={cy.id}>{cy.name}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">Departemen / Circle</label>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">{lang === "ID" ? "Semua Departemen" : "All Departments"}</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Position Filter */}
          <div>
            <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">Jabatan / Peran</label>
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">{lang === "ID" ? "Semua Jabatan" : "All Positions"}</option>
              {positions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>

          {/* Approval Status Filter */}
          <div>
            <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">Status Review</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">{lang === "ID" ? "Semua Status" : "All Status"}</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Calibrated">Calibrated</option>
              <option value="Approved">Approved</option>
              <option value="Published">Published</option>
            </select>
          </div>

          {/* Search input */}
          <div>
            <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">Cari Karyawan</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === "ID" ? "Ketik nama..." : "Type name..."}
                className="w-full border border-slate-200 rounded-xl p-2.5 pl-8 bg-slate-50 font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="size-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>
        </div>
      </div>

      {/* EMPLOYEE DIRECTORY DIRECT TABLE LIST */}
      <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden" id="employee-review-table-container">
        <div className="p-5 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-sm tracking-tight text-slate-900">
              {lang === "ID" ? "Daftar Penilaian Evaluasi Karyawan" : "Employee Calibration Matrix Directory"}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === "ID" ? "Tinjau skor kinerja dan potensial untuk kalibrasi tim" : "Calibrate team-level scores and establish final Workday indices"}
            </p>
          </div>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">
            {filteredEmployees.length} {lang === "ID" ? "Karyawan Ditemukan" : "Employees Found"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/50 border-b border-slate-150 text-[10px] uppercase font-mono font-bold text-slate-400">
                <th className="p-4">{lang === "ID" ? "Karyawan" : "Employee"}</th>
                <th className="p-4">{lang === "ID" ? "Jabatan & Departemen" : "Position & Circle"}</th>
                <th className="p-4 text-center">{lang === "ID" ? "Kinerja (OKR)" : "Performance (OKR)"}</th>
                <th className="p-4 text-center">{lang === "ID" ? "Potensi (360)" : "Potential (360)"}</th>
                <th className="p-4 text-center">{lang === "ID" ? "Nilai Akhir" : "Final Score"}</th>
                <th className="p-4">{lang === "ID" ? "Pemetaan 9-Box" : "9-Box Position"}</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map(emp => {
                const boxPos = get9BoxPosition(emp.performanceScore, emp.potentialScore, emp.calibrated9BoxCode);
                
                // Color mapping for status badge
                let statusColor = "bg-slate-50 text-slate-600 border-slate-200";
                if (emp.approvalStatus === "Submitted") statusColor = "bg-blue-50 text-blue-700 border-blue-200";
                else if (emp.approvalStatus === "Calibrated") statusColor = "bg-purple-50 text-purple-700 border-purple-200";
                else if (emp.approvalStatus === "Approved") statusColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
                else if (emp.approvalStatus === "Published") statusColor = "bg-cyan-50 text-cyan-800 border-cyan-200";

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* User profile info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          referrerPolicy="no-referrer"
                          src={emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`}
                          alt={emp.name}
                          className="size-9 rounded-full object-cover border border-slate-250 shrink-0 shadow-3xs"
                        />
                        <div>
                          <span className="font-extrabold text-slate-800 block">{emp.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">NIK: {emp.id.replace("usr_", "EMP-2026-")}</span>
                        </div>
                      </div>
                    </td>

                    {/* Department / Circle */}
                    <td className="p-4">
                      <span className="font-bold text-slate-700 block">{emp.position}</span>
                      <span className="text-slate-400 font-medium text-[10px] flex items-center gap-0.5">
                        <Building className="size-3" /> {emp.department}
                      </span>
                    </td>

                    {/* Performance Score (OKR) */}
                    <td className="p-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono font-extrabold text-sm text-slate-800">
                          {emp.rawPerformanceScore}%
                        </span>
                        <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
                          <div 
                            className="bg-emerald-500 h-full" 
                            style={{ width: `${emp.rawPerformanceScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Potential Score (360) */}
                    <td className="p-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono font-extrabold text-sm text-slate-800">
                          {emp.rawPotentialScore}%
                        </span>
                        <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
                          <div 
                            className="bg-purple-500 h-full" 
                            style={{ width: `${emp.rawPotentialScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Weighted Final Score */}
                    <td className="p-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono font-extrabold text-sm text-indigo-700">
                          {emp.performanceScore}%
                        </span>
                        <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
                          <div 
                            className="bg-indigo-600 h-full" 
                            style={{ width: `${emp.performanceScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* 9 Box Position Badge */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold inline-flex items-center gap-1 shadow-3xs ${boxPos.color}`}>
                        <Sparkles className="size-3" />
                        <span className="font-mono font-extrabold">{boxPos.code}</span> - {boxPos.label}
                      </span>
                    </td>

                    {/* Review Status */}
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold ${statusColor}`}>
                        {emp.approvalStatus}
                      </span>
                    </td>

                    {/* Open Details Action */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveEmployeeId(emp.id)}
                          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-2xs transition-all inline-flex items-center gap-1"
                        >
                          <Sliders className="size-3.5" />
                          <span>{lang === "ID" ? "Review & Kalibrasi" : "Review & Calibrate"}</span>
                        </button>

                        {emp.savedReview && onDeleteReview && (
                          <TooltipWrapper content={lang === "ID" ? "Hapus & Reset Evaluasi" : "Delete & Reset Appraisal"}>
                            <button
                              onClick={() => {
                                if (window.confirm(lang === "ID" 
                                  ? `Apakah Anda yakin ingin menghapus & mereset seluruh data evaluasi kinerja untuk ${emp.name}?` 
                                  : `Are you sure you want to delete and reset all performance appraisal data for ${emp.name}?`
                                )) {
                                  onDeleteReview(emp.savedReview!.id);
                                }
                              }}
                              className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all shrink-0"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </TooltipWrapper>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 font-bold">
                    {lang === "ID" ? "Tidak ada karyawan yang cocok dengan kriteria filter." : "No employees match the filter criteria."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SPLIT-SCREEN WORKDAY EXPANSION DRAWER PANEL */}
      {activeEmployeeId && (() => {
        const emp = employeesData.find(e => e.id === activeEmployeeId);
        if (!emp) return null;

        const boxPos = get9BoxPosition(emp.performanceScore, emp.potentialScore);
        const overallRating = emp.performanceScore >= 90 ? "Outstanding" : emp.performanceScore >= 80 ? "Exceeds Expectations" : emp.performanceScore >= 70 ? "Meets Expectations" : emp.performanceScore >= 60 ? "Below Expectations" : "Poor";

        // Filter OKR Objectives for this employee
        const empRoles = roleMembers.filter(rm => rm.userId === emp.id).map(rm => rm.roleId);
        const empKRIds = keyResultAssignees.filter(kra => kra.roleId && empRoles.includes(kra.roleId)).map(kra => kra.keyResultId);
        const empObjectives = objectives.filter(obj => {
          const hasKR = keyResults.some(kr => kr.objectiveId === obj.id && empKRIds.includes(kr.id));
          const hasCircle = obj.circleId && circles.some(c => c.id === obj.circleId && c.leadId === emp.id);
          return hasKR || hasCircle;
        });

        return (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex justify-end backdrop-blur-xs animate-fade-in" id="split-screen-review-drawer">
            <div className="bg-slate-50 w-full max-w-5xl h-full flex flex-col shadow-2xl overflow-hidden animate-slide-in relative">
              
              {/* Drawer Header */}
              <div className="bg-white p-5 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <img
                    referrerPolicy="no-referrer"
                    src={emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`}
                    alt={emp.name}
                    className="size-12 rounded-full object-cover border border-slate-300"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-800">{emp.name}</h3>
                      <span className="text-[9px] uppercase font-mono bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded font-bold">
                        {emp.position}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {lang === "ID" ? "Proses Kalibrasi & Rekomendasi Karir Terpadu" : "Comprehensive Calibration & Succession Workflow Portal"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1.5 rounded-full font-bold">
                    Status: {emp.approvalStatus}
                  </span>
                  <button
                    onClick={() => setActiveEmployeeId(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* 1. PROGRESS WORKFLOW BAR */}
                <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-3xs">
                  <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block mb-2 text-center">
                    {lang === "ID" ? "Alur Persetujuan & Kalibrasi" : "Approval Flow & Audit Trail Tracking"}
                  </span>
                  
                  <div className="flex items-center justify-between max-w-xl mx-auto text-[10px] font-bold">
                    {[
                      { key: "Draft", label: "Draft" },
                      { key: "Submitted", label: "Submitted" },
                      { key: "Reviewed", label: "Reviewed" },
                      { key: "Calibrated", label: "Calibrated" },
                      { key: "Approved", label: "Approved" },
                      { key: "Published", label: "Published" }
                    ].map((step, idx) => {
                      const isActive = emp.approvalStatus === step.key;
                      const isCompleted = ["Draft", "Submitted", "Reviewed", "Calibrated", "Approved", "Published"].indexOf(emp.approvalStatus) >= idx;
                      return (
                        <div key={step.key} className="flex flex-col items-center flex-1 relative">
                          <div className={`size-6 rounded-full flex items-center justify-center font-mono font-extrabold border transition-all ${
                            isActive ? "bg-emerald-700 text-white border-emerald-700 scale-110 shadow-xs" :
                            isCompleted ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-400 border-slate-200"
                          }`}>
                            {idx + 1}
                          </div>
                          <span className={`mt-1 font-mono tracking-tight ${isActive ? "text-emerald-900 font-extrabold" : "text-slate-400"}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. SPLIT LAYOUT PANEL (60/40) */}
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                  
                  {/* LEFT COLUMN: PERFORMANCE DATA (60%) */}
                  <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs space-y-5">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="size-4 text-emerald-600" />
                        {lang === "ID" ? "60% Aspek Performance (Kinerja)" : "60% Performance Metrics"}
                      </span>
                      <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full font-extrabold">
                        {lang === "ID" ? "Otomatis" : "Read-only"}
                      </span>
                    </div>

                    {/* Performance Summary Card */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-3 gap-3 text-center">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Overall Score</span>
                        <span className="text-xl font-black text-slate-800">{emp.performanceScore}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Final Rating</span>
                        <span className="text-xs font-bold text-emerald-700 block mt-0.5">{overallRating}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Percentile Rank</span>
                        <span className="text-xs font-bold text-slate-600 block mt-0.5">Top 15%</span>
                      </div>
                    </div>

                    {/* Dynamic Objectives/KPIs table */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                        {lang === "ID" ? "Rincian Sasaran Kinerja Utama (OKRs / KPIs)" : "Linked Strategic Objectives Breakdown"}
                      </span>

                      {empObjectives.length > 0 ? (
                        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                          {empObjectives.map(obj => (
                            <div key={obj.id} className="p-3 text-[11px] bg-slate-50/50">
                              <div className="flex justify-between items-center font-bold text-slate-800 mb-1">
                                <span>{obj.title}</span>
                                <span className="font-mono text-emerald-700">{obj.status}</span>
                              </div>
                              <p className="text-slate-500">Level: {obj.level} • Period: {obj.targetQuarter}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-xl p-4 text-center text-slate-400 font-medium">
                          {lang === "ID" 
                            ? "Sistem mendeteksi pencapaian OKR Kuartal bernilai solid (85% progress rata-rata)" 
                            : "System generated baseline OKR achievement parameters at 85% completion rate."}
                        </div>
                      )}
                    </div>

                    {/* Historical Trend Curve */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                        {lang === "ID" ? "Tren Kinerja Historis" : "Historical Performance Trend Curves"}
                      </span>
                      <div className="h-[120px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={[
                            { year: "2023", score: 72 },
                            { year: "2024", score: emp.performanceScore - 5 },
                            { year: "2025", score: emp.performanceScore }
                          ]}>
                            <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                            <Tooltip contentStyle={{ fontSize: '10px' }} />
                            <Area type="monotone" dataKey="score" stroke="#10b981" fill="#ecfdf5" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: POTENTIAL DATA (40%) */}
                  <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Star className="size-4 text-purple-600" />
                        {lang === "ID" ? "40% Aspek Potential (Potensi)" : "40% Potential Ratings"}
                      </span>
                      <span className="text-[10px] font-mono bg-purple-50 text-purple-800 px-2.5 py-0.5 rounded-full font-extrabold">
                        360 feedback
                      </span>
                    </div>

                    {/* Potential Rating Average Metric */}
                    <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 text-center">
                      <span className="text-[10px] font-mono text-purple-700 block uppercase font-bold">Overall Potential Rating</span>
                      <span className="text-2xl font-black text-purple-950 mt-1 block">{(emp.potentialScore / 20).toFixed(1)} / 5.0</span>
                      <span className="text-[10px] text-purple-500 font-bold uppercase tracking-wide block mt-1">
                        {emp.potentialScore >= 80 ? "High Potential" : emp.potentialScore >= 50 ? "Medium Potential" : "Low Potential"}
                      </span>
                    </div>

                    {/* Nine Essential Competencies progress blocks */}
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                        Competencies Score Matrix
                      </span>

                      {[
                        { label: "Leadership", score: Math.min(100, emp.potentialScore + 4) },
                        { label: "Learning Agility", score: Math.min(100, emp.potentialScore - 2) },
                        { label: "Strategic Thinking", score: Math.min(100, emp.potentialScore + 6) },
                        { label: "Communication", score: Math.min(100, emp.potentialScore + 2) },
                        { label: "Problem Solving", score: Math.min(100, emp.potentialScore - 5) }
                      ].map(comp => (
                        <div key={comp.label} className="space-y-1">
                          <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                            <span>{comp.label}</span>
                            <span className="font-mono">{(comp.score / 20).toFixed(1)}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-purple-600 h-full" 
                              style={{ width: `${comp.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. NINE-BOX INTERACTIVE PREVIEW PANEL */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-950 flex flex-col md:flex-row justify-between items-center gap-4 shadow-md">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-mono text-emerald-400 font-extrabold tracking-widest block">
                      9-Box Matrix Placement Indicator
                    </span>
                    <h4 className="font-bold text-base tracking-tight text-slate-100">
                      {lang === "ID" ? "Sinergi Hasil Performa & Potensi" : "Synergistic Bento Matrix Integration"}
                    </h4>
                    <p className="text-slate-400 text-xs max-w-xl leading-relaxed">
                      {lang === "ID"
                        ? "Matriks ini didapat dari integrasi otomatis antara pencapaian kuantitatif OKR (Kinerja) dengan penilaian kualitatif multi-rater 360 (Potensi)."
                        : "Automatically calculated mapping by pairing quantitative performance with multi-rater feedback scores."}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className={`px-4 py-2.5 rounded-xl border text-xs font-black uppercase shadow-sm ${boxPos.color}`}>
                      {boxPos.code} - {boxPos.label}
                    </div>
                  </div>
                </div>

                {/* 4. MANAGER REVIEW & RECOMMENDATIONS SECTION */}
                <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs space-y-5">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <Edit3 className="size-4 text-slate-600" />
                    <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                      {lang === "ID" ? "Rekomendasi Pimpinan & Manajer" : "Manager Review & Developmental Recommendations"}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Strengths */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        {lang === "ID" ? "Kekuatan Utama Karyawan (Strengths)" : "Key Strengths"}
                      </label>
                      <textarea
                        value={strength}
                        disabled={emp.approvalStatus === "Approved" || emp.approvalStatus === "Published"}
                        onChange={(e) => setStrength(e.target.value)}
                        placeholder="Ulas aspek pendorong produktivitas utama..."
                        className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                        rows={3}
                      />
                    </div>

                    {/* Development Areas */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        {lang === "ID" ? "Area Pengembangan Mandiri (Development Areas)" : "Development Opportunities"}
                      </label>
                      <textarea
                        value={developmentArea}
                        disabled={emp.approvalStatus === "Approved" || emp.approvalStatus === "Published"}
                        onChange={(e) => setDevelopmentArea(e.target.value)}
                        placeholder="Identifikasi kompetensi krusial yang memerlukan pelatihan tambahan..."
                        className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Promotion Readiness */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Promotion Readiness</label>
                      <select
                        value={promotionReadiness}
                        disabled={emp.approvalStatus === "Approved" || emp.approvalStatus === "Published"}
                        onChange={(e) => setPromotionReadiness(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                      >
                        <option value="Ready Now">Ready Now</option>
                        <option value="Ready < 1 Year">Ready &lt; 1 Year</option>
                        <option value="Ready 2 Years">Ready 2 Years</option>
                        <option value="Not Ready">Not Ready</option>
                      </select>
                    </div>

                    {/* Career Suggestion */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Career suggestion recommendation</label>
                      <select
                        value={careerSuggestion}
                        disabled={emp.approvalStatus === "Approved" || emp.approvalStatus === "Published"}
                        onChange={(e) => setCareerSuggestion(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                      >
                        {CAREER_SUGGESTIONS_LIST.map(item => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </div>

                    {/* Talent Loss Risk Level */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Talent risk level</label>
                      <select
                        value={risk}
                        disabled={emp.approvalStatus === "Approved" || emp.approvalStatus === "Published"}
                        onChange={(e) => setRisk(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                      >
                        <option value="High">High Risk</option>
                        <option value="Medium">Medium Risk</option>
                        <option value="Low">Low Risk</option>
                      </select>
                    </div>
                  </div>

                  {/* Multi-Select Action Items (Leadership Training, Mentoring, Coaching, etc.) */}
                  <div className="text-xs space-y-2">
                    <label className="block text-[11px] font-bold text-slate-600">
                      {lang === "ID" ? "Tindakan Pengembangan Direkomendasikan" : "Recommended Development Activities"}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {RECOMMENDED_ACTIONS_LIST.map(action => {
                        const selected = selectedActions.includes(action);
                        return (
                          <button
                            key={action}
                            type="button"
                            disabled={emp.approvalStatus === "Approved" || emp.approvalStatus === "Published"}
                            onClick={() => handleActionToggle(action)}
                            className={`px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all ${
                              selected ? "bg-emerald-700 text-white border-emerald-700 shadow-3xs" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {action}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="text-xs">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {lang === "ID" ? "Catatan Tambahan & Saran Karir" : "General Comments / Career Roadmap suggestions"}
                    </label>
                    <textarea
                      value={comment}
                      disabled={emp.approvalStatus === "Approved" || emp.approvalStatus === "Published"}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tuliskan kesimpulan rapat panel komite direksi..."
                      className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                      rows={2}
                    />
                  </div>
                </div>

                {/* 5. GOVERNANCE & Calibration Panel (Accessible to HR/Directors) */}
                {actingRole !== "Manager" && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs space-y-4">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <Sliders className="size-4 text-indigo-700" />
                      <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                        {lang === "ID" ? "Panel Kalibrasi HR (HR Calibration & Governance)" : "HR Calibration & Governance Control Panel"}
                      </h3>
                    </div>

                    <p className="text-slate-400 text-[10px]">
                      {lang === "ID" 
                        ? "HR dan Pimpinan berhak mengubah nilai akhir kinerja setelah melalui tinjauan komite eksekutif. Semua tindakan terdokumentasi di audit trail secara permanen." 
                        : "Authority to recalibrate performance score following executive panel review. Every adjustment requires a justification recorded in the secure logs."}
                    </p>

                    {/* Weight Configuration & Calculation (Replacing Formulas) */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="font-mono font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">
                          {lang === "ID" ? "Konfigurasi Bobot & Kalkulasi Nilai Akhir" : "Weight Configuration & Final Score Calculation"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {lang === "ID" ? "Berdasarkan nilai OKR & Evaluasi 360" : "Based on OKR & 360 Evaluation"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Performance Weight input */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-slate-600">
                            {lang === "ID" ? "Bobot Kinerja / Performance Weight (%)" : "Performance Weight (%)"}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={perfWeight}
                            disabled={emp.approvalStatus === "Approved" || emp.approvalStatus === "Published"}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                              setPerfWeight(val);
                              const otherVal = 100 - val;
                              setPotWeight(otherVal);
                              
                              let compScore = 0;
                              if (emp.hasPerfData && emp.hasPotData) {
                                compScore = Math.round((emp.rawPerformanceScore * val / 100) + (emp.rawPotentialScore * otherVal / 100));
                              } else if (emp.hasPerfData && !emp.hasPotData) {
                                compScore = emp.rawPerformanceScore;
                              } else if (!emp.hasPerfData && emp.hasPotData) {
                                compScore = emp.rawPotentialScore;
                              } else {
                                compScore = Math.round((emp.rawPerformanceScore * val / 100) + (emp.rawPotentialScore * otherVal / 100));
                              }
                              setCalibrationRating(compScore);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
                          />
                        </div>

                        {/* Potential Weight input */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-slate-600">
                            {lang === "ID" ? "Bobot Potensi / Potential Weight (%)" : "Potential Weight (%)"}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={potWeight}
                            disabled={emp.approvalStatus === "Approved" || emp.approvalStatus === "Published"}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                              setPotWeight(val);
                              const otherVal = 100 - val;
                              setPerfWeight(otherVal);
                              
                              let compScore = 0;
                              if (emp.hasPerfData && emp.hasPotData) {
                                compScore = Math.round((emp.rawPerformanceScore * otherVal / 100) + (emp.rawPotentialScore * val / 100));
                              } else if (emp.hasPerfData && !emp.hasPotData) {
                                compScore = emp.rawPerformanceScore;
                              } else if (!emp.hasPerfData && emp.hasPotData) {
                                compScore = emp.rawPotentialScore;
                              } else {
                                compScore = Math.round((emp.rawPerformanceScore * otherVal / 100) + (emp.rawPotentialScore * val / 100));
                              }
                              setCalibrationRating(compScore);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
                          />
                        </div>
                      </div>

                      {/* Formula display & result card */}
                      <div className="bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div className="space-y-1 text-slate-700 leading-normal flex-1">
                          <span className="font-mono font-bold text-[9px] uppercase text-indigo-600 tracking-wider block">
                            {lang === "ID" ? "Formula Perhitungan Kinerja Terbobot" : "Weighted Calculation Formula"}
                          </span>
                          
                          {emp.hasPerfData && emp.hasPotData ? (
                            <>
                              <p className="font-mono text-[11px]">
                                {lang === "ID" ? "Pencapaian Kinerja" : "Perf"}: <span className="font-bold text-slate-800">{emp.rawPerformanceScore}%</span> × <span className="font-bold text-indigo-700">{perfWeight}%</span>
                              </p>
                              <p className="font-mono text-[11px]">
                                {lang === "ID" ? "Pencapaian Potensi" : "Pot"}: <span className="font-bold text-slate-800">{emp.rawPotentialScore}%</span> × <span className="font-bold text-purple-700">{potWeight}%</span>
                              </p>
                            </>
                          ) : emp.hasPerfData && !emp.hasPotData ? (
                            <p className="font-mono text-[11px] text-amber-700 font-semibold">
                              ⚠️ {lang === "ID" 
                                ? "Evaluasi 360 kosong - Menggunakan bobot penuh dari Kinerja (100% OKR)" 
                                : "360 Assessment is empty - Utilizing full weight of Performance (100% OKR)"}
                            </p>
                          ) : !emp.hasPerfData && emp.hasPotData ? (
                            <p className="font-mono text-[11px] text-amber-700 font-semibold">
                              ⚠️ {lang === "ID" 
                                ? "Pencapaian OKR kosong - Menggunakan bobot penuh dari Potensi (100% Evaluasi 360)" 
                                : "OKR progress is empty - Utilizing full weight of Potential (100% 360 Assessment)"}
                            </p>
                          ) : (
                            <>
                              <p className="font-mono text-[11px] text-slate-500 italic">
                                {lang === "ID" ? "(Menggunakan nilai default baseline karena data ril belum terisi)" : "(Using baseline defaults as actual data is not filled)"}
                              </p>
                              <p className="font-mono text-[11px]">
                                {lang === "ID" ? "Pencapaian Kinerja" : "Perf"}: <span className="font-bold text-slate-800">{emp.rawPerformanceScore}%</span> × <span className="font-bold text-indigo-700">{perfWeight}%</span>
                              </p>
                              <p className="font-mono text-[11px]">
                                {lang === "ID" ? "Pencapaian Potensi" : "Pot"}: <span className="font-bold text-slate-800">{emp.rawPotentialScore}%</span> × <span className="font-bold text-purple-700">{potWeight}%</span>
                              </p>
                            </>
                          )}
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-150 shadow-4xs text-right shrink-0">
                          <span className="text-[9px] text-slate-400 block font-mono font-bold uppercase">
                            {lang === "ID" ? "Skor Hasil Bobot" : "Calculated Score"}
                          </span>
                          <span className="text-lg font-black text-indigo-950 block leading-tight">
                            {(() => {
                              if (emp.hasPerfData && emp.hasPotData) {
                                return Math.round((emp.rawPerformanceScore * perfWeight / 100) + (emp.rawPotentialScore * potWeight / 100));
                              } else if (emp.hasPerfData && !emp.hasPotData) {
                                return emp.rawPerformanceScore;
                              } else if (!emp.hasPerfData && emp.hasPotData) {
                                return emp.rawPotentialScore;
                              } else {
                                return Math.round((emp.rawPerformanceScore * perfWeight / 100) + (emp.rawPotentialScore * potWeight / 100));
                              }
                            })()}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="block text-[10px] font-mono text-slate-400 uppercase font-bold">
                            {lang === "ID" ? "Kuadran Rekomendasi Sistem (Kalkulasi)" : "System Calculated Quadrant"}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            {(() => {
                              const calcBox = get9BoxPosition(emp.performanceScore, emp.potentialScore);
                              return (
                                <>
                                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
                                    {calcBox.code}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-700">
                                    {calcBox.label}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        <div>
                          <span className="block text-[10px] font-mono text-purple-700 uppercase font-bold">
                            {lang === "ID" ? "Pemetaan 9-Box (Manual/Kalibrasi)" : "Manual 9-Box Calibration Override"}
                          </span>
                          <select
                            value={calibrated9BoxCode}
                            disabled={emp.approvalStatus === "Approved" || emp.approvalStatus === "Published"}
                            onChange={(e) => setCalibrated9BoxCode(e.target.value)}
                            className="mt-1 bg-white border border-purple-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-indigo-500 text-xs shadow-2xs"
                          >
                            <option value="B9">B9 - Star / Future Leader</option>
                            <option value="B8">B8 - High Performer</option>
                            <option value="B7">B7 - Solid Professional</option>
                            <option value="B6">B6 - High Potential</option>
                            <option value="B5">B5 - Core Player</option>
                            <option value="B4">B4 - Effective Employee</option>
                            <option value="B3">B3 - Enigma</option>
                            <option value="B2">B2 - Dilemma / Inconsistent</option>
                            <option value="B1">B1 - Action Required</option>
                          </select>
                        </div>
                      </div>

                      {/* Calibration Reason Input inside the same card */}
                      <div className="text-xs pt-3 border-t border-slate-200/60 space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-600">
                          {lang === "ID" ? "Alasan Kalibrasi (calibration justification)" : "Reason for Calibration change"}
                          {(() => {
                            const calcBox = get9BoxPosition(emp.performanceScore, emp.potentialScore);
                            if (calibrated9BoxCode && calibrated9BoxCode !== calcBox.code) {
                              return <span className="text-red-500 ml-1">* (Wajib diisi / Required)</span>;
                            }
                            return null;
                          })()}
                        </label>
                        <input
                          type="text"
                          value={calibrationReason}
                          disabled={emp.approvalStatus === "Approved" || emp.approvalStatus === "Published"}
                          onChange={(e) => setCalibrationReason(e.target.value)}
                          placeholder={lang === "ID" 
                            ? "Contoh: Diubah ke B9 berdasarkan hasil diskusi pleno komite kalibrasi nasional..." 
                            : "Example: Upgraded to B9 due to consensus in talent calibration committee..."
                          }
                          className={`w-full border rounded-xl p-2.5 bg-white font-semibold focus:ring-2 focus:ring-indigo-500 text-xs ${
                            (() => {
                              const calcBox = get9BoxPosition(emp.performanceScore, emp.potentialScore);
                              if (calibrated9BoxCode && calibrated9BoxCode !== calcBox.code && !calibrationReason.trim()) {
                                    return "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/10";
                              }
                              return "border-slate-200";
                            })()
                          }`}
                        />
                        {(() => {
                          const calcBox = get9BoxPosition(emp.performanceScore, emp.potentialScore);
                          if (calibrated9BoxCode && calibrated9BoxCode !== calcBox.code && !calibrationReason.trim()) {
                            return (
                              <p className="text-[10px] text-red-600 font-medium">
                                {lang === "ID" 
                                  ? "⚠️ Alasan wajib diisi karena hasil kalibrasi 9-Box berbeda dengan rekomendasi sistem." 
                                  : "⚠️ Calibration reason is required because the calibrated 9-Box differs from the system recommendation."
                                }
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    {/* Calibration Audit Trail History */}
                    {emp.savedReview?.auditTrail && emp.savedReview.auditTrail.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block flex items-center gap-1">
                          <History className="size-3" /> System Audit Trail Logs
                        </span>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] font-mono divide-y divide-slate-200 max-h-[120px] overflow-y-auto">
                          {emp.savedReview.auditTrail.map((log, lidx) => (
                            <div key={lidx} className="py-2 first:pt-0 last:pb-0 text-slate-600">
                              <div className="flex justify-between font-bold">
                                <span>Adjusted: {log.before} ➔ {log.after}</span>
                                <span>{new Date(log.date).toLocaleDateString()}</span>
                              </div>
                              <p className="text-slate-500 text-[10px] mt-0.5">By: {log.user} | Reason: {log.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* STICKY BOTTOM ACTIONS CONTROL BAR */}
              <div className="bg-white p-4 border-t border-slate-200 sticky bottom-0 flex justify-between items-center gap-2 z-10 shadow-lg">
                <button
                  onClick={() => setActiveEmployeeId(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-all shadow-3xs"
                >
                  {lang === "ID" ? "Tutup Panel" : "Close"}
                </button>

                <div className="flex items-center gap-2">
                  {emp.approvalStatus !== "Approved" && emp.approvalStatus !== "Published" ? (
                    <>
                      <button
                        onClick={() => handleSaveAppraisal("Draft")}
                        className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs transition-all shadow-3xs"
                      >
                        {lang === "ID" ? "Simpan Draf" : "Save Draft"}
                      </button>

                      <button
                        onClick={() => handleSaveAppraisal("Submitted")}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-3xs"
                      >
                        {lang === "ID" ? "Ajukan Evaluasi" : "Submit Review"}
                      </button>

                      {actingRole !== "Manager" && (
                        <button
                          onClick={() => handleSaveAppraisal("Calibrated")}
                          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition-all shadow-3xs"
                        >
                          {lang === "ID" ? "Tandai Terkalibrasi" : "Mark Calibrated"}
                        </button>
                      )}

                      {actingRole === "Director" && (
                        <button
                          onClick={() => handleSaveAppraisal("Approved")}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-all shadow-3xs flex items-center gap-1"
                        >
                          <ShieldCheck className="size-4" />
                          <span>{lang === "ID" ? "Setujui Komite" : "Approve & Lock"}</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      {emp.approvalStatus === "Approved" && actingRole === "Director" && (
                        <button
                          onClick={() => handleSaveAppraisal("Published")}
                          className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-xl text-xs transition-all shadow-3xs"
                        >
                          {lang === "ID" ? "Publikasikan Nilai" : "Publish Final Ratings"}
                        </button>
                      )}

                      <span className="text-slate-400 italic text-[11px] flex items-center gap-1 bg-slate-50 px-3 py-2 border border-slate-200 rounded-xl">
                        <Lock className="size-3.5" />
                        {lang === "ID" 
                          ? "Dokumen ini telah dikunci dan disetujui komite direksi." 
                          : "This calibration file has been locked and certified."}
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
