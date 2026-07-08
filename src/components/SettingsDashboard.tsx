import React, { useState } from "react";
import { User, SystemConfig, RolePermission } from "../types";
import { ShieldCheck, UserCheck, Plus, Check, ClipboardCheck, TrendingUp, Percent, Users } from "lucide-react";

interface SettingsDashboardProps {
  users: User[];
  systemConfig: SystemConfig;
  onUpdateUserRole: (userId: string, roleId: string) => void;
  onUpdateRolePermissions: (permissions: RolePermission[]) => void;
  onUpdateSystemConfig: (config: Partial<SystemConfig>) => void;
}

export default function SettingsDashboard({ 
  users, 
  systemConfig, 
  onUpdateUserRole, 
  onUpdateRolePermissions,
  onUpdateSystemConfig 
}: SettingsDashboardProps) {
  const defaultRoles: RolePermission[] = [
    { id: "direksi", name: "Direksi", canViewAllReports: true, canEditAllReports: true, canManageOrgStructure: true },
    { id: "atasan_tidak_langsung", name: "Atasan Tidak Langsung", canViewAllReports: true, canEditAllReports: false, canManageOrgStructure: true },
    { id: "atasan_langsung", name: "Atasan Langsung", canViewAllReports: false, canEditAllReports: false, canManageOrgStructure: false },
    { id: "karyawan", name: "Karyawan", canViewAllReports: false, canEditAllReports: false, canManageOrgStructure: false }
  ];

  const roles = systemConfig.rolePermissions || defaultRoles;
  
  const [editingRoles, setEditingRoles] = useState<RolePermission[]>(roles);
  
  const handlePermissionChange = (roleId: string, field: keyof RolePermission, value: boolean | string) => {
    const updated = editingRoles.map(r => r.id === roleId ? { ...r, [field]: value } : r);
    setEditingRoles(updated);
  };
  
  const saveRoles = () => {
    onUpdateRolePermissions(editingRoles);
    alert("Role permissions updated successfully!");
  };

    const [orgTerms, setOrgTerms] = useState(systemConfig.orgStructureTerms || { circle: "Circle", role: "Role" });

  const saveOrgTerms = () => {
    onUpdateSystemConfig({ orgStructureTerms: orgTerms });
    alert("Konfigurasi Istilah Struktur berhasil disimpan!");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Konfigurasi Istilah Struktur */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Users className="size-6 text-indigo-600" />
            Konfigurasi Istilah Struktur (Circle)
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Ubah istilah yang digunakan di dalam sistem jika perusahaan Anda tidak menggunakan istilah Holacracy "Circle" dan "Role".
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Istilah untuk Circle (Sektor/Divisi)</label>
            <input 
              type="text" 
              value={orgTerms.circle}
              onChange={e => setOrgTerms(prev => ({ ...prev, circle: e.target.value }))}
              placeholder="Contoh: Department, Divisi, Sektor"
              className="w-full border border-slate-300 rounded-lg p-2.5 font-semibold bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Istilah untuk Role (Peran/Jabatan)</label>
            <input 
              type="text" 
              value={orgTerms.role}
              onChange={e => setOrgTerms(prev => ({ ...prev, role: e.target.value }))}
              placeholder="Contoh: Position, Jabatan, Peran"
              className="w-full border border-slate-300 rounded-lg p-2.5 font-semibold bg-slate-50"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={saveOrgTerms}
            className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Check className="size-4" /> Simpan Istilah
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <ShieldCheck className="size-6 text-emerald-600" />
            Konfigurasi Role & Hak Akses
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Atur peran sistem (karyawan, atasan, direksi) dan hak akses mereka terhadap laporan dan struktur organisasi.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-3 font-bold">Nama Role (Akses)</th>
                <th className="p-3 font-bold text-center">
                  Bisa Lihat Semua Report
                  <p className="font-normal text-[10px] text-slate-500 leading-tight mt-0.5">Memungkinkan user melihat indikator kinerja dan progress seluruh karyawan di sistem.</p>
                </th>
                <th className="p-3 font-bold text-center">
                  Bisa Edit Semua Report
                  <p className="font-normal text-[10px] text-slate-500 leading-tight mt-0.5">Memungkinkan user menyetujui, menolak, atau mengubah laporan siapapun.</p>
                </th>
                <th className="p-3 font-bold text-center">
                  Manage Struktur Org
                  <p className="font-normal text-[10px] text-slate-500 leading-tight mt-0.5">Akses ke portal Org Structure & Settings untuk atur konfigurasi sistem.</p>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {editingRoles.map((role) => (
                <tr key={role.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold">
                    <input 
                      type="text" 
                      value={role.name} 
                      onChange={(e) => handlePermissionChange(role.id, "name", e.target.value)}
                      className="border border-slate-200 p-1.5 rounded w-full"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input 
                      type="checkbox" 
                      checked={role.canViewAllReports}
                      onChange={(e) => handlePermissionChange(role.id, "canViewAllReports", e.target.checked)}
                      className="w-5 h-5 rounded text-emerald-600 border-slate-300"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input 
                      type="checkbox" 
                      checked={role.canEditAllReports}
                      onChange={(e) => handlePermissionChange(role.id, "canEditAllReports", e.target.checked)}
                      className="w-5 h-5 rounded text-emerald-600 border-slate-300"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input 
                      type="checkbox" 
                      checked={role.canManageOrgStructure}
                      onChange={(e) => handlePermissionChange(role.id, "canManageOrgStructure", e.target.checked)}
                      className="w-5 h-5 rounded text-emerald-600 border-slate-300"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-end">
          <button 
            onClick={saveRoles}
            className="bg-emerald-900 text-white font-bold py-2 px-6 rounded-xl hover:bg-emerald-950 transition flex items-center gap-2"
          >
            <Check className="size-4" /> Simpan Konfigurasi Role
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <UserCheck className="size-6 text-blue-600" />
            Pemetaan Karyawan ke Role Sistem
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Tentukan level akses masing-masing karyawan untuk menggunakan aplikasi ini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(u => (
            <div key={u.id} className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <img src={u.avatar || undefined} className="w-10 h-10 rounded-full border border-slate-200" alt={u.name} />
                <div>
                  <div className="font-bold text-sm text-slate-800">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.department}</div>
                </div>
              </div>
              <select 
                value={u.systemRole || "karyawan"}
                onChange={(e) => onUpdateUserRole(u.id, e.target.value)}
                className="text-xs font-bold p-1.5 rounded border border-slate-300 bg-white"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
