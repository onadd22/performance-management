import React, { useState, useEffect } from "react";
import { BoxConfig, SystemConfig } from "../../types";
import { Settings2, Save, RotateCcw, Database, Brain, Award, Info } from "lucide-react";
import { TooltipWrapper } from "../TooltipContext";

export default function ConfigTab({ configs, onUpdateConfigs, systemConfig, onUpdateSystemConfig }: { configs: BoxConfig[], onUpdateConfigs: (c: BoxConfig[]) => void, systemConfig?: SystemConfig, onUpdateSystemConfig?: (updates: Partial<SystemConfig>) => void }) {
  const [localConfigs, setLocalConfigs] = useState<BoxConfig[]>(configs);
  const [localSystemConfig, setLocalSystemConfig] = useState<Partial<SystemConfig>>(systemConfig || {});
  const methodTerm = localSystemConfig?.defaultReviewMethod === "kpi" ? "KPI" : localSystemConfig?.defaultReviewMethod === "bsc360" ? "BSC" : "OKR";

  useEffect(() => {
    setLocalConfigs(configs);
    if (systemConfig) {
      setLocalSystemConfig(systemConfig);
    }
  }, [configs, systemConfig]);

  const handleUpdate = (id: string, field: keyof BoxConfig, value: any) => {
    setLocalConfigs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSave = () => {
    onUpdateConfigs(localConfigs);
    if (onUpdateSystemConfig) {
      onUpdateSystemConfig(localSystemConfig);
    }
    alert("Configuration saved successfully!");
  };

  const handleReset = () => {
    setLocalConfigs(configs);
    if (systemConfig) {
      setLocalSystemConfig(systemConfig);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Settings2 className="size-5 text-indigo-600" /> System Configuration
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1 mb-2">Customize labels, colors, and recommendations for each box.</p>
          <div className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 inline-flex items-center gap-2">
             <span className="shrink-0 bg-amber-200 rounded-full px-1.5 py-0.5 text-amber-800 text-[9px] uppercase">INFO</span>
             Konfigurasi di tab ini <strong>KHUSUS</strong> untuk kriteria kelayakan Succession Pool & 9-Box Grid. 
             Untuk bobot utama {methodTerm} & Penilaian Kerja, harap gunakan menu <span className="underline">Konfig Performance</span>.
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
            <RotateCcw className="size-4" /> Reset
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2">
            <Save className="size-4" /> Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* POTENTIAL CLASSIFICATION */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Brain className="size-5 text-purple-600" />
              Klasifikasi Potensi (Potential Classification)
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Skor Potensi diperoleh secara objektif dari data multi-rater 360-degree feedback yang diisi oleh rekan kerja, bawahan, atasan, dan diri sendiri.
            </p>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">RUMUS PERHITUNGAN</span>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-center font-black text-sm text-indigo-600">
                Skor Potensi = Rata-Rata 360 Feedback × 20
              </div>
              <ul className="text-slate-500 text-xs space-y-1.5 list-disc pl-4 pt-1">
                <li>Pertanyaan menggunakan skala Likert <span className="font-bold">1-5</span>.</li>
                <li>Rata-rata dari seluruh penilai dikalkulasikan (didukung bobot rater masing-masing).</li>
                <li>Pengali <span className="font-bold">20</span> menyamakan skala menjadi indeks <span className="font-bold">0-100</span>.</li>
                <li>Skor ini memetakan karyawan secara dinamis pada <span className="font-bold">Y-Axis</span> di Smart Talent 9-Box Grid.</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">PENGATURAN KLASIFIKASI</span>
                <TooltipWrapper content="Klasifikasi ini akan menentukan warna dan label pada grafik klasifikasi potensi.">
                  <Info className="size-4 text-slate-400" />
                </TooltipWrapper>
              </div>
              <div className="space-y-3">
                {(localSystemConfig?.potentialClassifications || []).map((cls, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <input 
                      type="text" 
                      value={cls.label}
                      onChange={(e) => {
                        const newArr = [...(localSystemConfig?.potentialClassifications || [])];
                        newArr[idx].label = e.target.value;
                        setLocalSystemConfig(prev => ({ ...prev, potentialClassifications: newArr }));
                      }}
                      className="flex-1 min-w-[120px] text-xs font-bold border border-slate-200 rounded p-1.5"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono">Min:</span>
                      <input 
                        type="number" 
                        value={cls.min}
                        onChange={(e) => {
                          const newArr = [...(localSystemConfig?.potentialClassifications || [])];
                          newArr[idx].min = Number(e.target.value);
                          setLocalSystemConfig(prev => ({ ...prev, potentialClassifications: newArr }));
                        }}
                        className="w-16 text-xs text-center font-mono border border-slate-200 rounded p-1.5"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono">Max:</span>
                      <input 
                        type="number" 
                        value={cls.max}
                        onChange={(e) => {
                          const newArr = [...(localSystemConfig?.potentialClassifications || [])];
                          newArr[idx].max = Number(e.target.value);
                          setLocalSystemConfig(prev => ({ ...prev, potentialClassifications: newArr }));
                        }}
                        className="w-16 text-xs text-center font-mono border border-slate-200 rounded p-1.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Integrasi Data</span>
            <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded font-black">Multi-Rater 360 &rarr; 9-Box Y-Axis</span>
          </div>
        </div>

        {/* SUCCESSION POOL METHODOLOGY */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Award className="size-5 text-emerald-600" />
              Metodologi Suksesi (Succession Pool)
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Succession Pool memetakan talenta terbaik untuk menjadi suksesor posisi kritikal perusahaan menggunakan Indeks Kesiapan Suksesi (SRI).
            </p>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">RUMUS SRI (SUCCESION READINESS INDEX)</span>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-xs text-center font-bold text-emerald-700 leading-normal">
                SRI = [ (Perf × W_perf) + (Pot × W_pot) + (Lead × W_lead) + (Tenure × W_tenure) + (Ready × W_ready) ] / Tot_Weight
              </div>
              <ul className="text-slate-500 text-xs space-y-1.5 list-disc pl-4 pt-1">
                <li><span className="font-bold">Perf & Pot</span>: Diambil dari OKR/KPI & 360 Feedback (skala 100).</li>
                <li><span className="font-bold">Lead</span>: Skor kompetensi kepemimpinan dari penilai/assessor.</li>
                <li><span className="font-bold">Tenure (Masa Kerja)</span>: Masa kerja dikonversi ke poin (5thn+=100, 3-5thn=90, 2thn=75, dst).</li>
                <li><span className="font-bold">Ready</span>: Kesiapan karir (Ready Now = 100, 1-2thn = 75, 3-5thn = 50).</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">PENGATURAN BOBOT (WEIGHTS)</span>
                <TooltipWrapper content="Bobot digunakan untuk menghitung Indeks Kesiapan Suksesi (SRI). Pastikan totalnya 100% jika ingin ekuivalen rasio.">
                  <Info className="size-4 text-slate-400" />
                </TooltipWrapper>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(localSystemConfig?.successionPoolConfig?.sriWeights || {}).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 capitalize block">{key}</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={val as number}
                        onChange={(e) => {
                          if (!localSystemConfig?.successionPoolConfig) return;
                          const newConfig = { 
                            ...localSystemConfig.successionPoolConfig,
                            sriWeights: { ...localSystemConfig.successionPoolConfig.sriWeights, [key]: Number(e.target.value) }
                          };
                          setLocalSystemConfig(prev => ({ ...prev, successionPoolConfig: newConfig }));
                        }}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs font-mono font-bold text-center"
                      />
                      <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
                    </div>
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Min SRI</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={localSystemConfig?.successionPoolConfig?.minSriThreshold || 75}
                      onChange={(e) => {
                        if (!localSystemConfig?.successionPoolConfig) return;
                        const newConfig = { 
                          ...localSystemConfig.successionPoolConfig,
                          minSriThreshold: Number(e.target.value)
                        };
                        setLocalSystemConfig(prev => ({ ...prev, successionPoolConfig: newConfig }));
                      }}
                      className="w-full border border-slate-200 rounded p-1.5 text-xs font-mono font-bold text-center text-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Kualifikasi Suksesor</span>
            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-black">SRI &ge; {localSystemConfig?.successionPoolConfig?.minSriThreshold || 75} &amp; Box {localSystemConfig?.successionPoolConfig?.eligible9BoxQuadrants?.join(", ")}</span>
          </div>
        </div>

      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Database className="size-5 text-blue-600" />
            9-Box Quadrant Labels & Configuration
          </h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Configure individual grid boxes and recommendations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {localConfigs.sort((a,b) => a.boxNumber - b.boxNumber).map(config => (
          <div key={config.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className={`px-5 py-3 \${config.color} text-white flex justify-between items-center`}>
              <span className="font-black tracking-widest text-[10px] uppercase">Box {config.boxNumber}</span>
              <select 
                value={config.color} 
                onChange={(e) => handleUpdate(config.id, 'color', e.target.value)}
                className="bg-black/20 border-none text-xs rounded-lg py-1 px-2 text-white font-bold focus:ring-0 cursor-pointer"
              >
                <option value="bg-red-500">Red</option>
                <option value="bg-orange-400">Orange</option>
                <option value="bg-amber-400">Amber</option>
                <option value="bg-yellow-400">Yellow</option>
                <option value="bg-lime-500">Lime</option>
                <option value="bg-emerald-400">Light Green</option>
                <option value="bg-emerald-500">Green</option>
                <option value="bg-emerald-600">Dark Green</option>
                <option value="bg-indigo-500">Indigo</option>
                <option value="bg-blue-500">Blue</option>
              </select>
            </div>
            
            <div className="p-5 flex-1 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title Label</label>
                <input 
                  type="text" 
                  value={config.name} 
                  onChange={(e) => handleUpdate(config.id, 'name', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <input 
                  type="text" 
                  value={config.description} 
                  onChange={(e) => handleUpdate(config.id, 'description', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Default Recommendations (Comma separated)</label>
                <textarea 
                  value={config.recommendations.join(', ')} 
                  onChange={(e) => handleUpdate(config.id, 'recommendations', e.target.value.split(',').map(s => s.trim()))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-none h-20"
                />
              </div>
              
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                 <span className="text-xs font-bold text-slate-500 uppercase">Priority</span>
                 <select 
                  value={config.priority} 
                  onChange={(e) => handleUpdate(config.id, 'priority', e.target.value)}
                  className="border border-slate-200 text-xs rounded-lg py-1 px-2 text-slate-700 font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Data Source & Integration Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
          <Database className="size-5 text-indigo-600" /> Sumber & Integrasi Data
        </h2>
        <p className="text-sm text-slate-500 mb-6">Peta sumber data untuk tiap komponen skor pada modul Succession Pool & Talent 9-Box.</p>
        
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-600">
                <th className="p-4">Komponen Bobot</th>
                <th className="p-4">Sumber Modul</th>
                <th className="p-4">Data yang Diambil</th>
                <th className="p-4">Frekuensi Update</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              <tr>
                <td className="p-4 font-bold text-slate-800">Kinerja Historis ({methodTerm})</td>
                <td className="p-4"><span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold border border-emerald-200">Penilaian Kerja</span></td>
                <td className="p-4">Skor akhir rata-rata progres {methodTerm} & konsistensi</td>
                <td className="p-4 text-slate-500">Per siklus penilaian</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-800">Skor Potensi (9-Box)</td>
                <td className="p-4"><span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold border border-indigo-200">9-Box Grid</span></td>
                <td className="p-4">Posisi kuadran karyawan (360 Review + Kognitif)</td>
                <td className="p-4 text-slate-500">Real-time</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-800">Kompetensi Kepemimpinan</td>
                <td className="p-4"><span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-xs font-bold border border-amber-200">Assessment 360</span></td>
                <td className="p-4">Rata-rata skor kompetensi multi-rater leadership</td>
                <td className="p-4 text-slate-500">Per siklus 360</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-800">Masa Kerja (Tenure)</td>
                <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-200">Data Induk (HRIS)</span></td>
                <td className="p-4">Lama bergabung di perusahaan</td>
                <td className="p-4 text-slate-500">Otomatis Harian</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-800">Kesiapan & Aspirasi Karir</td>
                <td className="p-4"><span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-bold border border-purple-200">Input Manual / Survey</span></td>
                <td className="p-4">Status kesiapan (Ready Now, 1-2 Yrs, dll)</td>
                <td className="p-4 text-slate-500">Manual / Per Review</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
