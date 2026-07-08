import React, { useState } from "react";
import { 
  BookOpen, X, Search, Sliders, Activity, Award, Brain, 
  HelpCircle, ChevronRight, TrendingUp, ShieldAlert, 
  Layers, CheckSquare, Users, Info, Calculator
} from "lucide-react";
import { SystemConfig, MetricItem } from "../types";

export const METRICS_DATABASE_DEFAULT: MetricItem[] = [
  {
    id: "perf_score",
    nameID: "Performance Score (Skor Kinerja)",
    nameEN: "Performance Score",
    category: "performance",
    definitionID: "Metrik kuantitatif yang mengukur tingkat pencapaian sasaran kerja taktis karyawan terhadap target yang disepakati.",
    definitionEN: "A quantitative metric that measures the employee's tactical goal achievement level against agreed targets.",
    formulaID: "Performance Score = (Skor Target Objektif (OKR/KPI) × Bobot Objektif) + (Skor Kompetensi × Bobot Kompetensi)",
    formulaEN: "Performance Score = (Objective Target Score (OKR/KPI) × Objective Weight) + (Competency Score × Competency Weight)",
    sourceID: "Diambil secara langsung dari integrasi modul OKR/KPI dan asesmen kompetensi yang disimpan di database.",
    sourceEN: "Pulled directly from the integrated OKR/KPI module and competency assessments saved in the database.",
    exampleID: "Jika skor OKR = 80 dengan bobot 70%, dan skor kompetensi = 90 dengan bobot 30%, maka Skor Kinerja = (80 × 0.7) + (90 × 0.3) = 83.",
    exampleEN: "If OKR score = 80 with 70% weight, and competency score = 90 with 30% weight, then Performance Score = (80 × 0.7) + (90 × 0.3) = 83." ,
    iconName: "Activity"
  },
  {
    id: "360_weight",
    nameID: "360 Feedback & Behavioral Score",
    nameEN: "360 Feedback & Behavioral Score",
    category: "360",
    definitionID: "Skor kompetensi perilaku dan kepemimpinan yang dinilai dari perspektif multi-rater secara komprehensif.",
    definitionEN: "Behavioral and leadership competency score evaluated from a comprehensive multi-rater perspective.",
    formulaID: "360 Score = (Review Atasan × 40%) + (Review Rekan Sejawat × 30%) + (Review Bawahan × 20%) + (Evaluasi Mandiri × 10%)",
    formulaEN: "360 Score = (Manager Review × 40%) + (Peer Review × 30%) + (Direct Report Review × 20%) + (Self Evaluation × 10%)",
    sourceID: "Formulir kuesioner penilaian multi-rater 360 derajat yang diisi secara anonim oleh rekan tim di tab 'Assessment 360'.",
    sourceEN: "Anonymously filled multi-rater 360-degree feedback questionnaires managed in the '360 Assessment' tab.",
    exampleID: "Atasan memberikan 90, Rekan sejawat rata-rata 85, Bawahan memberikan 80, Mandiri 85. Skor Akhir = 36 + 25.5 + 16 + 8.5 = 86%.",
    exampleEN: "Manager rates 90, Peers average 85, Direct reports rate 80, Self-rates 85. Final Score = 36 + 25.5 + 16 + 8.5 = 86%." ,
    iconName: "Users"
  },
  {
    id: "potential_score",
    nameID: "Potential Score (Skor Potensi)",
    nameEN: "Potential Score",
    category: "succession",
    definitionID: "Metrik yang memproyeksikan kapasitas jangka panjang karyawan untuk memikul tanggung jawab kepemimpinan yang lebih tinggi.",
    definitionEN: "A metric projecting the employee's long-term capacity to shoulder higher leadership responsibilities.",
    formulaID: "Potential Score = (Skor Asesmen Kompetensi 360 × 60%) + (Nilai Tes Kognitif & Psikometris HRIS × 40%)",
    formulaEN: "Potential Score = (360 Competency Score × 60%) + (HRIS Cognitive & Psychometric Test Score × 40%)",
    sourceID: "Hasil rata-rata survei kompetensi 360 perilaku digabungkan dengan profil bakat/intelligence test di data induk kepegawaian.",
    sourceEN: "Routinely aggregated 360-degree behavioral competency scores blended with intelligence/aptitude records in the master database.",
    exampleID: "Skor 360 = 85%, Skor Tes Kognitif = 75%. Maka Skor Potensi = (85 × 0.6) + (75 × 0.4) = 81%.",
    exampleEN: "360 score = 85%, Cognitive test score = 75%. Potential Score = (85 × 0.6) + (75 × 0.4) = 81%." ,
    iconName: "Brain"
  },
  {
    id: "readiness_level",
    nameID: "Readiness Level (Tingkat Kesiapan)",
    nameEN: "Readiness Level",
    category: "succession",
    definitionID: "Kategori estimasi waktu yang diperlukan bagi seorang suksesor untuk siap menggantikan posisi kepemimpinan di atasnya.",
    definitionEN: "An estimated timeline categorization indicating when a successor is prepared to step into a higher leadership role.",
    formulaID: "Klasifikasi Kualitatif:\n- 'Ready Now': Siap promosi segera (< 6 bulan)\n- '1-2 Years': Butuh pengkondisian taktis 12-24 bulan\n- '3-5 Years': Memerlukan pengembangan strategis jangka panjang",
    formulaEN: "Qualitative Classification:\n- 'Ready Now': Immediate promotion readiness (< 6 months)\n- '1-2 Years': Requires tactical development for 12-24 months\n- '3-5 Years': Requires long-term strategic preparation",
    sourceID: "Dipetakan dari tinjauan berkala Komite Suksesi (Talent Committee) dan divalidasi silang berdasarkan kompetensi kepemimpinan saat ini.",
    sourceEN: "Mapped during the periodic Succession Committee review and cross-validated against current leadership score profiles.",
    exampleID: "Karyawan berkinerja tinggi dengan masa kerja >3 tahun dan leadership score >80 otomatis direkomendasikan 'Ready Now'.",
    exampleEN: "High-performing employees with >3 years tenure and leadership score >80 are systematically recommended as 'Ready Now'.",
    iconName: "Award"
  },
  {
    id: "sri_score",
    nameID: "Succession Readiness Index (SRI)",
    nameEN: "Succession Readiness Index (SRI)",
    category: "succession",
    definitionID: "Indeks angka komposit prediktif yang mengkalkulasi kesiapan total seorang karyawan untuk promosi ke peran kepemimpinan kritis.",
    definitionEN: "A predictive composite index score calculating an employee's total eligibility and readiness for critical leadership roles.",
    formulaID: "SRI = (Kinerja × W_perf) + (Potensi × W_pot) + (Leadership × W_lead) + (Faktor Tenure × W_tenure) + (Status Kesiapan × W_readiness)",
    formulaEN: "SRI = (Performance × W_perf) + (Potential × W_pot) + (Leadership × W_lead) + (Tenure Factor × W_tenure) + (Readiness Status × W_readiness)",
    sourceID: "Kalkulasi otomatis engine sistem suksesi dengan merujuk bobot dinamis pada menu Konfigurasi Kinerja.",
    sourceEN: "Auto-calculated dynamically by the succession engine based on active weight parameters in the Performance Configuration.",
    exampleID: "Karyawan berkinerja 90%, potensi 85%, leadership 80%, tenure 4 tahun (skor 9), status 'Ready Now' (skor 10). Jika bobot merata 20%, maka SRI = 84%.",
    exampleEN: "Employee with Performance 90%, Potential 85%, Leadership 80%, Tenure 4 years (score 9), status 'Ready Now' (score 10). If evenly weighted at 20%, SRI = 84%." ,
    iconName: "Sliders"
  },
  {
    id: "bell_curve",
    nameID: "Bell Curve Policy & Deviasi",
    nameEN: "Bell Curve Policy & Deviation",
    category: "performance",
    definitionID: "Prinsip distribusi normal untuk kuota persentase predikat kinerja karyawan guna mencegah bias subjektivitas penilai.",
    definitionEN: "A normal distribution standard for grading employee performance categories to avoid rating inflation and subjectivity bias.",
    formulaID: "Deviasi = Persentase Kepala Aktual - Target Kuota Kebijakan Perusahaan\nDeviasi ideal mendekati 0% demi keadilan sistem remunerasi.",
    formulaEN: "Deviation = Actual Headcount Percentage - Target Corporate Policy Allocation\nIdeal deviation approaches 0% for compensation fairness.",
    sourceID: "Kebijakan resmi SDM (Bell Curve Policy) yang ditetapkan korporat pada modul pengaturan.",
    sourceEN: "Official HR policies (Bell Curve quotas) set by corporate administrators in the master settings.",
    exampleID: "Kuota untuk predikat 'Sangat Baik' (A) ditetapkan 10%. Jika aktual hasil kalibrasi 12%, maka Deviasi = +2% (Melebihi batas toleransi).",
    exampleEN: "Quota for 'Excellent' (A) is 10%. If calibrated results show 12%, then Deviation = +2% (Slightly exceeding allocation)." ,
    iconName: "Layers"
  }
];

const iconMap: Record<string, React.ComponentType<any>> = {
  Activity, Users, Brain, Award, Sliders, Layers, Calculator
};

export default function MetricsGlossary({ lang = "ID", systemConfig }: { lang?: "ID" | "EN", systemConfig?: SystemConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "performance" | "360" | "succession">("all");
  const [expandedMetric, setExpandedMetric] = useState<string | null>("perf_score");

  const database = systemConfig?.metricsGlossary || METRICS_DATABASE_DEFAULT;

  const filteredMetrics = database.filter(metric => {
    const matchesCategory = activeCategory === "all" || metric.category === activeCategory;
    const name = lang === "ID" ? metric.nameID : metric.nameEN;
    const definition = lang === "ID" ? metric.definitionID : metric.definitionEN;
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          definition.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });


  return (
    <>
      {/* Floating Button Trigger with Premium Styling */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl shadow-md transition-all duration-300 text-xs font-bold shrink-0 hover:scale-[1.03] active:scale-[0.97]"
        id="btn-metrics-glossary"
      >
        <BookOpen className="size-4 animate-pulse" />
        <span>{lang === "ID" ? "Glosarium Metrik & Rumus" : "Metrics Glossary & Formulas"}</span>
      </button>

      {/* Main Drawer Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex justify-end transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        >
          {/* Slider Drawer Panel */}
          <div 
            className="w-full max-w-xl bg-slate-50 h-full shadow-2xl flex flex-col transform translate-x-0 transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <BookOpen className="size-5" />
                  </div>
                  <h3 className="text-base font-black tracking-tight">
                    {lang === "ID" ? "Glosarium Metrik Kinerja & Suksesi" : "Performance & Succession Metrics Glossary"}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-300/80 leading-relaxed">
                  {lang === "ID" 
                    ? "Transparansi formulasi rumus, definisi operasional, dan silsilah sumber data (data lineage) terintegrasi."
                    : "Transparency of active mathematical formulas, operational definitions, and integrated data lineage."}
                </p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Filter and Search Section */}
            <div className="p-4 bg-white border-b border-slate-200 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === "ID" ? "Cari nama metrik atau kata kunci..." : "Search metric names or keywords..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:bg-white transition-all text-slate-800"
                />
              </div>

              {/* Categorization Tabs */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {(["all", "performance", "360", "succession"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-1 text-[11px] py-1.5 font-bold rounded-lg transition-all capitalize ${
                      activeCategory === cat 
                        ? "bg-white text-indigo-600 shadow-xs" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {cat === "all" ? (lang === "ID" ? "Semua" : "All") : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics List Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {filteredMetrics.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {lang === "ID" ? "Tidak ada metrik yang cocok dengan kata kunci." : "No metrics match the current filters."}
                </div>
              ) : (
                filteredMetrics.map((metric) => {
                  const IconComponent = metric.iconName ? iconMap[metric.iconName] || Activity : Activity;
                  const isExpanded = expandedMetric === metric.id;
                  const name = lang === "ID" ? metric.nameID : metric.nameEN;
                  const definition = lang === "ID" ? metric.definitionID : metric.definitionEN;
                  const formula = lang === "ID" ? metric.formulaID : metric.formulaEN;
                  const source = lang === "ID" ? metric.sourceID : metric.sourceEN;
                  const example = lang === "ID" ? metric.exampleID : metric.exampleEN;

                  return (
                    <div 
                      key={metric.id}
                      className={`bg-white rounded-2xl border transition-all duration-300 ${
                        isExpanded ? "border-indigo-300 ring-1 ring-indigo-100 shadow-md" : "border-slate-200 hover:border-slate-300 shadow-3xs"
                      }`}
                    >
                      {/* Accordion Trigger */}
                      <button
                        onClick={() => setExpandedMetric(isExpanded ? null : metric.id)}
                        className="w-full p-4 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl shrink-0 ${
                            isExpanded ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"
                          }`}>
                            <IconComponent className="size-4" />
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-800 block leading-tight">{name}</span>
                            <span className="text-[9px] font-mono text-slate-400 capitalize">{metric.category} modules</span>
                          </div>
                        </div>
                        <ChevronRight className={`size-4 text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-90 text-indigo-600" : ""}`} />
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-slate-100 pt-3 text-xs text-slate-600 space-y-3 bg-slate-50/50 rounded-b-2xl">
                          {/* Definition */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Definisi Operasional:</span>
                            <p className="text-slate-600 leading-relaxed text-[11px]">{definition}</p>
                          </div>

                          {/* Formula Code block */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block flex items-center gap-1">
                              <Calculator className="size-3 text-indigo-500" /> Rumus Perhitungan Resmi:
                            </span>
                            <div className="bg-slate-900 text-indigo-200 p-2.5 rounded-xl font-mono text-[10px] leading-relaxed whitespace-pre-line border border-slate-800 shadow-inner">
                              {formula}
                            </div>
                          </div>

                          {/* Data Lineage Source */}
                          <div className="space-y-1 bg-white p-2.5 rounded-xl border border-slate-150">
                            <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider block">Silsilah Sumber Data (Data Lineage):</span>
                            <p className="text-slate-500 text-[10px] leading-normal">{source}</p>
                          </div>

                          {/* Example Simulation */}
                          <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-[10px] leading-relaxed text-emerald-800">
                            <strong className="text-emerald-900 block mb-0.5">💡 Simulasi Kasus Nyata:</strong>
                            {example}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 italic">
              <span>*Semua kalkulasi dilakukan secara real-time pada database HRIS Terpadu.</span>
              <span className="font-bold text-indigo-600">Remix HRIS v1.5</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
