import React from "react";
import { Database, Link, GitPullRequest, Settings, Terminal, Map, Key, RefreshCw } from "lucide-react";

export default function DevHub() {
  return (
    <div className="space-y-6" id="dev-hub-container">
      {/* Overview intro */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10">
          <Terminal className="size-48 text-emerald-300" />
        </div>
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-widest">
            <Database className="size-4" /> Direktori Arsitektur Sistem & Cetak Biru ERD
          </div>
          <h2 className="title-font font-bold text-2xl md:text-3xl text-white">Cetak Biru Relasional Modul Kinerja HRIS</h2>
          <p className="text-slate-405 text-xs md:text-sm">
            Tampilkan rancangan skema basis data relasional, batasan entitas, serta rute kontrak API backend yang melandasi mesin tata kelola Holakrasi Glassfrog.
          </p>
        </div>
      </div>

      {/* Relational Database ERD Schema Layout */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Map className="text-emerald-700 size-5" />
          <h3 className="title-font font-bold text-lg text-slate-800">1. Skema ERD Relasional Basis Data</h3>
        </div>
        <p className="text-slate-500 text-xs">
          Pemetaan ERD terpadu memungkinkan karyawan memegang beberapa peran sekaligus, menyelaraskan hierarki gabungan Circle organisasi, mendukung pembagian bobot kontribusi bersama pada Key Result, dan mengikat metrik kinerja otomatis ke siklus tertentu.
        </p>

        {/* ERD GRID MAP - High Visual Fidelity */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* Table 1: Users */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-slate-50">
            <div className="bg-slate-800 text-white px-3 py-2 font-mono text-xs flex justify-between items-center">
              <span>Tabel Pengguna (Users)</span>
              <span className="text-[10px] text-slate-400 font-sans">1 : M Peran</span>
            </div>
            <div className="p-3 divide-y divide-slate-150 text-[10.5px] font-mono whitespace-nowrap overflow-x-auto">
              <div className="py-1 flex justify-between"><span className="font-bold text-emerald-700">id (PK)</span> <span className="text-slate-400">VARCHAR</span></div>
              <div className="py-1 flex justify-between"><span>name</span> <span className="text-slate-450">VARCHAR</span></div>
              <div className="py-1 flex justify-between"><span>email (UNIQUE)</span> <span className="text-slate-450">VARCHAR</span></div>
              <div className="py-1 flex justify-between"><span>avatar</span> <span className="text-slate-450">TEXT</span></div>
              <div className="py-1 flex justify-between"><span>department</span> <span className="text-slate-450">VARCHAR</span></div>
            </div>
          </div>

          {/* Table 2: Circles */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-slate-50">
            <div className="bg-slate-800 text-white px-3 py-2 font-mono text-xs flex justify-between items-center">
              <span>Tabel Lingkaran (Circles)</span>
              <span className="text-[10px] text-slate-400 font-sans">Hierarki Bersarang</span>
            </div>
            <div className="p-3 divide-y divide-slate-150 text-[10.5px] font-mono whitespace-nowrap overflow-x-auto">
              <div className="py-1 flex justify-between"><span className="font-bold text-emerald-700">id (PK)</span> <span className="text-slate-400">VARCHAR</span></div>
              <div className="py-1 flex justify-between"><span>name</span> <span className="text-slate-450">VARCHAR</span></div>
              <div className="py-1 flex justify-between"><span>description</span> <span className="text-slate-450 font-sans">TEXT</span></div>
              <div className="py-1 flex justify-between"><span className="text-blue-600">subCircleOfId (FK)</span> <span className="text-slate-450">VARCHAR (Self-FK)</span></div>
              <div className="py-1 flex justify-between"><span className="text-blue-600">leadId (FK)</span> <span className="text-slate-450">VARCHAR</span></div>
            </div>
          </div>

          {/* Table 3: Roles */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-slate-50">
            <div className="bg-slate-800 text-white px-3 py-2 font-mono text-xs flex justify-between items-center">
              <span>Tabel Peran (Roles)</span>
              <span className="text-[10px] text-slate-400 font-sans">M : M Anggota</span>
            </div>
            <div className="p-3 divide-y divide-slate-150 text-[10.5px] font-mono whitespace-nowrap overflow-x-auto">
              <div className="py-1 flex justify-between"><span className="font-bold text-emerald-700">id (PK)</span> <span className="text-slate-400">VARCHAR</span></div>
              <div className="py-1 flex justify-between"><span>title</span> <span className="text-slate-450">VARCHAR</span></div>
              <div className="py-1 flex justify-between"><span className="text-blue-600">circleId (FK)</span> <span className="text-slate-450">VARCHAR</span></div>
              <div className="py-1 flex justify-between"><span>description</span> <span className="text-slate-450">TEXT</span></div>
              <div className="py-1 flex justify-between"><span>accountabilities</span> <span className="text-slate-450">VARCHAR[]</span></div>
            </div>
          </div>

          {/* Table 4: Key_Results */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-slate-50">
            <div className="bg-slate-800 text-white px-3 py-2 font-mono text-xs flex justify-between items-center">
              <span>Tabel Key_Results</span>
              <span className="text-[10px] text-slate-400 font-sans">Pelacak Metrik</span>
            </div>
            <div className="p-3 divide-y divide-slate-150 text-[10.5px] font-mono whitespace-nowrap overflow-x-auto">
              <div className="py-1 flex justify-between"><span className="font-bold text-emerald-700">id (PK)</span> <span className="text-slate-400">VARCHAR</span></div>
              <div className="py-1 flex justify-between"><span className="text-blue-600">objectiveId (FK)</span> <span className="text-slate-450">VARCHAR</span></div>
              <div className="py-1 flex justify-between"><span>title</span> <span className="text-slate-450">TEXT</span></div>
              <div className="py-1 flex justify-between"><span>targetValue</span> <span className="text-slate-450">DOUBLE</span></div>
              <div className="py-1 flex justify-between"><span>currentValue</span> <span className="text-slate-450">DOUBLE</span></div>
              <div className="py-1 flex justify-between"><span>unit</span> <span className="text-slate-450">VARCHAR</span></div>
              <div className="py-1 flex justify-between"><span>progress</span> <span className="text-slate-450">INT (0-100)</span></div>
              <div className="py-1 flex justify-between"><span>isShared</span> <span className="text-slate-450">BOOLEAN</span></div>
            </div>
          </div>

          {/* Table 5: Key_Result_Assignees Junction */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-slate-50">
            <div className="bg-slate-800 text-white px-3 py-2 font-mono text-xs flex justify-between items-center">
              <span>Jembatan Penugasan Key_Result</span>
              <span className="text-amber-405 font-extrabold text-[10.5px]">Bobot Kontribusi</span>
            </div>
            <div className="p-3 divide-y divide-slate-150 text-[10.5px] font-mono whitespace-nowrap overflow-x-auto">
              <div className="py-1 flex justify-between"><span className="font-bold text-emerald-700">id (PK)</span> <span className="text-slate-400">VARCHAR</span></div>
              <div className="py-1 flex justify-between"><span className="text-blue-600">keyResultId (FK)</span> <span className="text-slate-450">VARCHAR</span></div>
              <div className="py-1 flex justify-between"><span className="text-blue-600">circleId (FK)</span> <span className="text-slate-450">VARCHAR (NULL)</span></div>
              <div className="py-1 flex justify-between"><span className="text-blue-600">roleId (FK)</span> <span className="text-slate-450">VARCHAR (NULL)</span></div>
              <div className="py-1 flex justify-between"><span className="text-blue-600">weightPercentage</span> <span className="text-amber-750 font-bold">INT (Joint splits)</span></div>
              <div className="py-1 flex justify-between"><span>currentProgress</span> <span className="text-slate-450">INT (0-100)</span></div>
            </div>
          </div>

          {/* Table 6: Check_In_Logs */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-slate-50">
            <div className="bg-slate-800 text-white px-3 py-2 font-mono text-xs flex justify-between items-center">
              <span>Tabel Check_In_Logs</span>
              <span className="text-amber-400 text-[10px] font-sans">Linimasa Hambatan (Blockers)</span>
            </div>
            <div className="p-3 divide-y divide-slate-150 text-[10.5px] font-mono whitespace-nowrap overflow-x-auto">
              <div className="py-1 flex justify-between"><span className="font-bold text-emerald-700">id (PK)</span> <span className="text-slate-400">VARCHAR</span></div>
              <div className="py-1 flex justify-between"><span className="text-blue-600">keyResultId (FK)</span> <span className="text-slate-450">VARCHAR</span></div>
              <div className="py-1 flex justify-between"><span className="text-blue-600">assigneeId (FK)</span> <span className="text-slate-450">VARCHAR</span></div>
              <div className="py-1 flex justify-between"><span className="text-blue-600">roleId (FK)</span> <span className="text-slate-450">VARCHAR (NULL)</span></div>
              <div className="py-1 flex justify-between"><span>newValue</span> <span className="text-slate-450">DOUBLE</span></div>
              <div className="py-1 flex justify-between"><span>hasBlocker</span> <span className="text-indigo-650 font-bold">BOOLEAN</span></div>
              <div className="py-1 flex justify-between"><span className="text-blue-600">dependencyCircleId</span> <span className="text-slate-450">VARCHAR (NULL)</span></div>
              <div className="py-1 flex justify-between"><span className="text-blue-600">dependencyRoleId</span> <span className="text-slate-450">VARCHAR (NULL)</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Backend API Endpoints Contract Map */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <GitPullRequest className="text-slate-700 size-5" />
          <h3 className="title-font font-bold text-lg text-slate-800">2. Kontrak Arsitektur API RESTful Backend</h3>
        </div>
        <p className="text-slate-500 text-xs">
          Daftar rute katalog API lengkap yang melayani modul klien HRIS. Operasi pengisian check-in memicu perkembangan kemajuan secara otomatis.
        </p>

        {/* ENDPOINTS TABLE */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white font-mono uppercase text-[10px]">
                <th className="p-3">Metode HTTP</th>
                <th className="p-3">Alamat Endpoint REST API</th>
                <th className="p-3">Detil Aktivitas Utama</th>
                <th className="p-3">Parameter Payload Permintaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-bold text-emerald-700 font-mono">GET</td>
                <td className="p-3 font-mono text-slate-850 font-semibold">/api/circles</td>
                <td className="p-3 text-slate-500">Membaca daftar katalog lingkaran tata kelola Glassfrog.</td>
                <td className="p-3 text-slate-400 italic">Tidak ada</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-bold text-teal-650 font-mono">POST</td>
                <td className="p-3 font-mono text-slate-850 font-semibold">/api/circles</td>
                <td className="p-3 text-slate-500">Membentuk lingkaran organisasi baru di bawah perataan lingkaran induk.</td>
                <td className="p-3 font-mono text-[10.5px]">{"{ name, description, subCircleOfId, leadId }"}</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-bold text-teal-650 font-mono">POST</td>
                <td className="p-3 font-mono text-slate-850 font-semibold">/api/roles</td>
                <td className="p-3 text-slate-500">Mendefinisikan spesifikasi tanggung jawab peran di bawah ID lingkaran.</td>
                <td className="p-3 font-mono text-[10.5px]">{"{ title, circleId, accountabilities, userIds }"}</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-bold text-teal-650 font-mono">POST</td>
                <td className="p-3 font-mono text-slate-850 font-semibold">/api/key-results</td>
                <td className="p-3 text-slate-500">Menambahkan indikator kunci metrik atau target. Mendukung pembagian kontribusi bersama.</td>
                <td className="p-3 font-mono text-[10.5px]">{"{ objectiveId, title, targetValue, isShared, assignees }"}</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-bold text-teal-650 font-mono">POST</td>
                <td className="p-3 font-mono text-slate-850 font-semibold">/api/check-ins</td>
                <td className="p-3 text-slate-500">Mengirimkan log riwayat report baru. Mengevaluasi logika pembagian kontribusi dan ketergantungan.</td>
                <td className="p-3 font-mono text-[10.5px]">{"{ keyResultId, newValue, hasBlocker, dependencyCircleId, dependencyRoleId }"}</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-bold text-emerald-700 font-mono">GET</td>
                <td className="p-3 font-mono text-slate-850 font-semibold">/api/performance-reviews/calculate-score/:userId</td>
                <td className="p-3 text-slate-500">Algoritma sistem dinamis yang menyusun progres indikator berdasarkan bobot. Digunakan dalam lembar penilaian kerja.</td>
                <td className="p-3 text-slate-400 italic">Tidak ada</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Progression logic block diagram */}
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="text-emerald-700 size-5 animate-spin" style={{ animationDuration: '6s' }} />
          <h4 className="title-font font-bold text-slate-800">3. Formula Perkembangan Kemajuan Check-In Dinamis (Bobot Pembagian Jembatan)</h4>
        </div>

        <p className="text-slate-605 text-xs leading-relaxed">
          Ketika seorang karyawan mengirimkan check-in untuk Target Key Result Bersama (Shared KR), backend web menghitung bobot kemajuan secara otomatis:
        </p>

        <div className="bg-white p-4 rounded-xl border border-slate-150 font-mono text-xs text-slate-700 space-y-3">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block mb-1">1. Cocokkan konteks Kontributor Pengampu:</span>
            <span className="text-slate-800 font-semibold">Assignee.currentProgress = (newValue / KeyResult.targetValue) * 100</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block mb-1">2. Jumlah total pembagian Kontribusi Bersama:</span>
            <span className="text-emerald-800 font-bold">
              Total_Progress = ∑ (Assignee.currentProgress * Assignee.weightPercentage) / ∑ (Assignee.weightPercentage)
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block mb-1">3. Pembaruan Normalisasi Nilai:</span>
            <span>KeyResult.progress = Total_Progress</span><br />
            <span>KeyResult.currentValue = (Total_Progress / 100) * KeyResult.targetValue</span>
          </div>
        </div>

        <p className="text-slate-500 text-[11px] leading-relaxed italic">
          Arsitektur sistem ini mencegah pembaruan sepihak agar tidak menimpa departemen mitra secara langsung. Ini secara transparan memperlihatkan ketergantungan bagian yang menjadi komponen kunci dari lingkaran Holakrasi.
        </p>
      </div>
    </div>
  );
}
