import React, { useState } from "react";
import { Circle, Role, User, RoleMember, SystemConfig, Objective, KeyResult, KeyResultAssignee, CheckInLog } from "../types";
import { 
  Users, Shield, Plus, ChevronRight, ChevronUp, Layers, ArrowRight, 
  PlusCircle, Sparkles, Edit, Trash2, Settings, AlertTriangle, Info, Search, BarChart2,
  ZoomIn, ZoomOut, Upload, FileSpreadsheet, Check, Download
} from "lucide-react";
import WorkloadDistributionChart from "./WorkloadDistributionChart";
import { HRIS_API } from "../api";
import EmployeeStructure from "./EmployeeStructure";

interface OrgStructureProps {
  lang: "ID" | "EN";
  circles: Circle[];
  roles: Role[];
  roleMembers: RoleMember[];
  users: User[];
  objectives: Objective[];
  keyResults: KeyResult[];
  keyResultAssignees: KeyResultAssignee[];
  checkInLogs?: CheckInLog[];
  performanceReviews?: any[];
  eval360Submissions?: any[];
  onCircleAdded: (newCircle: Circle) => void;
  onRoleAdded: (newRole: any) => void;
  onCircleUpdated?: (id: string, data: Partial<Circle>) => void;
  onCircleDeleted?: (id: string) => void;
  onRoleUpdated?: (id: string, roleData: any) => void;
  onRoleDeleted?: (id: string) => void;
  onObjectiveUpdated?: (id: string, objData: Partial<Objective>) => void;
  onSyncData?: () => Promise<void>;
  systemConfig: SystemConfig;
  onConfigUpdated: (config: Partial<SystemConfig>) => void;
  currentLoginUserId?: string;
}

export default function OrgStructure({ 
  lang,
  circles, 
  roles, 
  roleMembers, 
  users, 
  objectives,
  keyResults,
  keyResultAssignees,
  checkInLogs = [],
  performanceReviews = [],
  eval360Submissions = [],
  onCircleAdded, 
  onRoleAdded,
  onCircleUpdated,
  onCircleDeleted,
  onRoleUpdated,
  onRoleDeleted,
  onObjectiveUpdated,
  onSyncData,
  systemConfig,
  onConfigUpdated,
  currentLoginUserId
}: OrgStructureProps) {
  const [selectedCircleId, setSelectedCircleId] = useState<string>(circles.length > 0 ? circles[0].id : "");
  const [structureView, setStructureView] = useState<"company" | "employee">("company");
  const [showAddCircle, setShowAddCircle] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomScale, setZoomScale] = useState(1);
  const [layoutMode, setLayoutMode] = useState<"glassfrog" | "galaxy">("glassfrog"); // Default to traditional nested view
  const [showHolacracyInfo, setShowHolacracyInfo] = useState(false);

  // Dependency mapping state
  const [dependencyViewMode, setDependencyViewMode] = useState<"none" | "strategic" | "operational">("none");
  const [hoveredDependency, setHoveredDependency] = useState<{
    type: "strategic" | "operational";
    title: string;
    details: string;
    x: number;
    y: number;
  } | null>(null);

  // Drag and Drop State
  const [dragOverCircleId, setDragOverCircleId] = useState<string | null>(null);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRawText, setImportRawText] = useState("");
  const [importParsedRows, setImportParsedRows] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [dragOverImport, setDragOverImport] = useState(false);

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFileContent(file);
  };

  const readFileContent = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportRawText(text);
        const parsed = parseImportText(text);
        setImportParsedRows(parsed);
      }
    };
    reader.readAsText(file);
  };

  // Circle form state
  const [circleName, setCircleName] = useState("");
  const [circleDesc, setCircleDesc] = useState("");
  const [circleParent, setCircleParent] = useState<string>("");
  const [circleLead, setCircleLead] = useState<string>("");
  const [circleType, setCircleType] = useState<"department" | "cross_functional" | "platform" | "supporting">("department");

  const currentUser = users.find(u => u.id === currentLoginUserId);
  const currentRolePerm = systemConfig?.rolePermissions?.find(rp => rp.id === currentUser?.systemRole) || 
    systemConfig?.rolePermissions?.find(rp => rp.id === "karyawan");
  const canManageOrgStructure = currentRolePerm?.canManageOrgStructure ?? false;

  // Role form state
  const [roleTitle, setRoleTitle] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [roleCircleId, setRoleCircleId] = useState<string>("");
  const [roleAccountabilities, setRoleAccountabilities] = useState<string[]>([""]);
  const [roleUserIds, setRoleUserIds] = useState<string[]>([]);

  // Edit Circle Modal state
  const [showEditCircle, setShowEditCircle] = useState(false);
  const [editCircleId, setEditCircleId] = useState("");
  const [editCircleName, setEditCircleName] = useState("");
  const [editCircleDesc, setEditCircleDesc] = useState("");
  const [editCircleParent, setEditCircleParent] = useState<string>("");
  const [editCircleLead, setEditCircleLead] = useState<string>("");
  const [editCircleType, setEditCircleType] = useState<"department" | "cross_functional" | "platform" | "supporting">("department");

  // Edit Role Modal state
  const [showEditRole, setShowEditRole] = useState(false);
  const [editRoleId, setEditRoleId] = useState("");
  const [editRoleTitle, setEditRoleTitle] = useState("");
  const [editRoleDesc, setEditRoleDesc] = useState("");
  const [editRoleCircleId, setEditRoleCircleId] = useState("");
  const [editRoleAccountabilities, setEditRoleAccountabilities] = useState<string[]>([""]);
  const [editRoleUserIds, setEditRoleUserIds] = useState<string[]>([]);

  const selectedCircle = circles.find(c => c.id === selectedCircleId) || circles[0];

  const isQuarterLocked = () => {
    if (!systemConfig?.endDate) return false;
    const end = new Date(systemConfig.endDate);
    const now = new Date();
    end.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    return now > end;
  };
  
  const getActualDaysRemaining = () => {
    if (!systemConfig?.endDate) return null;
    const end = new Date(systemConfig.endDate);
    const now = new Date();
    end.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const hasEnded = isQuarterLocked();
  const isLocked = false;
  const actualDaysRemaining = getActualDaysRemaining();

  // Helper: Find Lead Link user
  const getCircleLeadUser = (leadId: string | null) => {
    return users.find(u => u.id === leadId);
  };

  // Helper: Get roles belonging to circle
  const getCircleRoles = (circleId: string) => {
    return roles.filter(r => r.circleId === circleId);
  };

  // Helper: Get members assigned to a role
  const getRoleMembers = (roleId: string) => {
    const memberRel = roleMembers.filter(rm => rm.roleId === roleId);
    return memberRel.map(rm => users.find(u => u.id === rm.userId)).filter(Boolean) as User[];
  };

  // Sub-circles calculation
  const getSubCircles = (parentId: string) => {
    return circles.filter(c => c.subCircleOfId === parentId);
  };

  const matchesSearch = (circle: Circle) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    if (circle.name.toLowerCase().includes(query)) return true;
    
    const circleRoles = getCircleRoles(circle.id);
    for (const role of circleRoles) {
      if (role.title.toLowerCase().includes(query)) return true;
      const members = getRoleMembers(role.id);
      for (const member of members) {
        if (member.name.toLowerCase().includes(query)) return true;
      }
    }
    
    return false;
  };

  const isCircleVisible = (circle: Circle): boolean => {
    if (!searchQuery) return true;
    if (matchesSearch(circle)) return true;
    
    const subCircles = circles.filter(c => c.subCircleOfId === circle.id);
    return subCircles.some(sc => isCircleVisible(sc));
  };

  // Drag and Drop role relocation with automatic OKR alignment update
  const handleRoleDrop = async (roleId: string, targetCircleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;
    if (role.circleId === targetCircleId) return; // same circle, ignore

    const oldCircleId = role.circleId;
    const targetCircle = circles.find(c => c.id === targetCircleId);
    if (!targetCircle) return;

    try {
      // Find current members of this role
      const members = roleMembers.filter(rm => rm.roleId === roleId);
      const userIds = members.map(rm => rm.userId);

      // 1. Relocate the role using the prop handler
      if (onRoleUpdated) {
        await onRoleUpdated(roleId, {
          title: role.title,
          description: role.description,
          circleId: targetCircleId,
          accountabilities: role.accountabilities,
          userIds: userIds
        });
      }

      // 2. Automatically update OKR Approvers for objectives aligned to this role's members!
      const oldCircle = circles.find(c => c.id === oldCircleId);
      const oldLeadId = oldCircle?.leadId;
      const newLeadId = targetCircle.leadId;

      if (newLeadId && onObjectiveUpdated) {
        // Iterate through all objectives that are linked to affected users or are circle-level and have the old lead as the approver
        for (const obj of objectives) {
          const isUserObjective = userIds.includes(obj.approverId || "") || (obj.circleId === oldCircleId && obj.level === "circle");
          if (isUserObjective || obj.approverId === oldLeadId) {
            await onObjectiveUpdated(obj.id, {
              approverId: newLeadId
            });
          }
        }
      }

      if (onSyncData) {
        await onSyncData();
      }
    } catch (e) {
      console.error("Failed dragging and dropping role", e);
    }
  };

  // Download standard CSV template for Excel
  const handleDownloadTemplate = () => {
    const headers = "Tipe,Nama,Induk,Deskripsi,Lead / Pemegang,Akuntabilitas";
    const rows = [
      'circle,Direktorat Teknologi,,Fokus pada rekayasa perangkat lunak dan infrastruktur IT,Siti Rahma,',
      'circle,Divisi Front-End,Direktorat Teknologi,Mengembangkan antarmuka pengguna web dan mobile,Devi Lestari,',
      'role,Lead Front-End Engineer,Divisi Front-End,Memimpin koordinasi kode front-end dan arsitektur,Devi Lestari,"Code review; Sprint planning; UI consistency"',
      'role,Senior Product Designer,Divisi Front-End,"Merancang wireframe, user flow, dan aset visual",Budi Santoso,"UI prototyping; Figma guidelines"'
    ];
    // Include UTF-8 BOM so Excel opens with correct encoding on both Windows and Mac
    const csvContent = "\uFEFF" + [headers, ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", lang === "ID" ? "template_struktur_organisasi.csv" : "org_structure_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV/Excel text parsing function
  const parseImportText = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    // Clean BOM from the first line if present
    let firstLine = lines[0];
    if (firstLine.startsWith("\uFEFF")) {
      firstLine = firstLine.slice(1);
    }

    // Detect delimiter (tab for spreadsheet copy-paste, comma or semicolon for standard CSV)
    let delimiter = ",";
    if (firstLine.includes("\t")) {
      delimiter = "\t";
    } else if (firstLine.includes(";")) {
      delimiter = ";";
    }

    // Split headers and sanitize
    const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/["']/g, ""));
    
    const parsedRows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Robust character-by-character parsing to handle quotes and commas inside quotes
      const cols: string[] = [];
      let currentVal = "";
      let inQuotes = false;
      
      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          cols.push(currentVal.trim());
          currentVal = "";
        } else {
          currentVal += char;
        }
      }
      cols.push(currentVal.trim());

      // Clean outer double quotes
      const cleanedCols = cols.map(val => {
        let cleaned = val.trim();
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
          cleaned = cleaned.slice(1, -1);
        }
        return cleaned.replace(/""/g, '"');
      });

      if (cleanedCols.length === 0 || !cleanedCols.some(Boolean)) continue;

      const row: any = { id: `parsed_${Date.now()}_${i}` };
      headers.forEach((header, idx) => {
        const val = cleanedCols[idx] || "";
        if (header.includes("tipe") || header.includes("type")) {
          row.type = val.toLowerCase().includes("circle") || val.toLowerCase().includes("sektor") || val.toLowerCase().includes("lingkaran") ? "circle" : "role";
        } else if (header.includes("nama") || header.includes("name") || header.includes("title") || header.includes("judul")) {
          row.name = val;
        } else if (header.includes("induk") || header.includes("parent")) {
          row.parent = val;
        } else if (header.includes("deskripsi") || header.includes("description") || header.includes("desc")) {
          row.description = val;
        } else if (header.includes("lead") || header.includes("pemegang") || header.includes("holder") || header.includes("karyawan") || header.includes("user")) {
          row.leadOrMember = val;
        } else if (header.includes("akuntabilitas") || header.includes("accountabilit")) {
          row.accountabilities = val ? val.split(/[;,]/).map(a => a.trim()).filter(Boolean) : [];
        }
      });

      if (!row.type) {
        row.type = "role";
      }

      if (row.name) {
        parsedRows.push(row);
      }
    }
    return parsedRows;
  };

  // Handle batch import creation with parenting resolution
  const handleImportSubmit = async () => {
    if (importParsedRows.length === 0) return;

    try {
      setIsImporting(true);
      setImportProgress(lang === "ID" ? "Memulai proses impor..." : "Starting import process...");

      // Resolve Circle name -> Database ID
      const circleNameToIdMap: Record<string, string> = {};
      circles.forEach(c => {
        circleNameToIdMap[c.name.toLowerCase().trim()] = c.id;
      });

      const importedCircles = importParsedRows.filter(r => r.type === "circle");
      const importedRoles = importParsedRows.filter(r => r.type === "role");

      // Resolve nested circles in passes
      let unresolvedCircles = [...importedCircles];
      let passes = 0;
      
      while (unresolvedCircles.length > 0 && passes < 5) {
        passes++;
        const deferred: any[] = [];

        for (const row of unresolvedCircles) {
          const circleNameClean = row.name.trim();
          const parentName = row.parent ? row.parent.trim().toLowerCase() : "";
          
          let parentId: string | null = null;
          
          if (parentName) {
            const foundParentId = circleNameToIdMap[parentName];
            if (!foundParentId) {
              deferred.push(row);
              continue;
            }
            parentId = foundParentId;
          }

          let leadId: string | null = null;
          if (row.leadOrMember) {
            const userClean = row.leadOrMember.trim().toLowerCase();
            const foundUser = users.find(
              u => u.name.toLowerCase().includes(userClean) || u.email.toLowerCase().includes(userClean)
            );
            if (foundUser) {
              leadId = foundUser.id;
            }
          }

          const existingCircle = circles.find(
            c => c.name.toLowerCase().trim() === circleNameClean.toLowerCase()
          );

          if (existingCircle) {
            setImportProgress(
              lang === "ID" 
                ? `Memperbarui Circle: "${circleNameClean}"...` 
                : `Updating Circle: "${circleNameClean}"...`
            );
            await HRIS_API.updateCircle(existingCircle.id, {
              description: row.description || existingCircle.description,
              subCircleOfId: parentId,
              leadId: leadId
            });
            circleNameToIdMap[circleNameClean.toLowerCase()] = existingCircle.id;
          } else {
            setImportProgress(
              lang === "ID" 
                ? `Membuat Circle: "${circleNameClean}"...` 
                : `Creating Circle: "${circleNameClean}"...`
            );
            const payload: Circle = {
              id: `circ_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              name: circleNameClean,
              description: row.description || "",
              subCircleOfId: parentId,
              leadId: leadId,
              circleType: "department"
            };
            const created = await HRIS_API.createCircle(payload);
            circleNameToIdMap[circleNameClean.toLowerCase()] = created.id;
          }
        }

        unresolvedCircles = deferred;
      }

      // Handle standalone / unresolved
      if (unresolvedCircles.length > 0) {
        for (const row of unresolvedCircles) {
          const circleNameClean = row.name.trim();

          let leadId: string | null = null;
          if (row.leadOrMember) {
            const userClean = row.leadOrMember.trim().toLowerCase();
            const foundUser = users.find(
              u => u.name.toLowerCase().includes(userClean) || u.email.toLowerCase().includes(userClean)
            );
            if (foundUser) {
              leadId = foundUser.id;
            }
          }

          const existingCircle = circles.find(
            c => c.name.toLowerCase().trim() === circleNameClean.toLowerCase()
          );

          if (existingCircle) {
            setImportProgress(
              lang === "ID" 
                ? `Memperbarui Circle (Mandiri): "${circleNameClean}"...` 
                : `Updating Circle (Standalone): "${circleNameClean}"...`
            );
            await HRIS_API.updateCircle(existingCircle.id, {
              description: row.description || existingCircle.description,
              subCircleOfId: null,
              leadId: leadId
            });
            circleNameToIdMap[circleNameClean.toLowerCase()] = existingCircle.id;
          } else {
            setImportProgress(
              lang === "ID" 
                ? `Membuat Circle (Tanpa Induk): "${circleNameClean}"...` 
                : `Creating Circle (Standalone): "${circleNameClean}"...`
            );
            const payload: Circle = {
              id: `circ_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              name: circleNameClean,
              description: row.description || "",
              subCircleOfId: null,
              leadId: leadId,
              circleType: "department"
            };
            const created = await HRIS_API.createCircle(payload);
            circleNameToIdMap[circleNameClean.toLowerCase()] = created.id;
          }
        }
      }

      // Create or Update Roles
      for (let j = 0; j < importedRoles.length; j++) {
        const row = importedRoles[j];
        const roleNameClean = row.name.trim();
        const parentCircleName = row.parent ? row.parent.trim().toLowerCase() : "";
        
        let circleId = selectedCircleId || (circles[0]?.id || "");
        if (parentCircleName && circleNameToIdMap[parentCircleName]) {
          circleId = circleNameToIdMap[parentCircleName];
        }

        const memberUserIds: string[] = [];
        if (row.leadOrMember) {
          const names = row.leadOrMember.split(/[;,]/).map((n: string) => n.trim().toLowerCase()).filter(Boolean);
          names.forEach((nameOrEmail: string) => {
            const foundUser = users.find(
              u => u.name.toLowerCase().includes(nameOrEmail) || u.email.toLowerCase().includes(nameOrEmail)
            );
            if (foundUser && !memberUserIds.includes(foundUser.id)) {
              memberUserIds.push(foundUser.id);
            }
          });
        }

        const existingRole = roles.find(
          r => r.title.toLowerCase().trim() === roleNameClean.toLowerCase() && r.circleId === circleId
        );

        if (existingRole) {
          setImportProgress(
            lang === "ID" 
              ? `Memperbarui Jabatan (${j + 1}/${importedRoles.length}): "${roleNameClean}"...` 
              : `Updating Role (${j + 1}/${importedRoles.length}): "${roleNameClean}"...`
          );
          await HRIS_API.updateRole(existingRole.id, {
            title: roleNameClean,
            circleId: circleId,
            description: row.description || existingRole.description,
            accountabilities: Array.isArray(row.accountabilities) ? row.accountabilities : existingRole.accountabilities,
            userIds: memberUserIds
          });
        } else {
          setImportProgress(
            lang === "ID" 
              ? `Membuat Jabatan (${j + 1}/${importedRoles.length}): "${roleNameClean}"...` 
              : `Creating Role (${j + 1}/${importedRoles.length}): "${roleNameClean}"...`
          );
          await HRIS_API.createRole({
            title: roleNameClean,
            circleId: circleId,
            description: row.description || "",
            accountabilities: Array.isArray(row.accountabilities) ? row.accountabilities : [],
            userIds: memberUserIds
          });
        }
      }

      setImportProgress(lang === "ID" ? "Menyelaraskan struktur tata kelola..." : "Finalizing structure alignment...");
      
      if (onSyncData) {
        await onSyncData();
      }

      setShowImportModal(false);
      setImportRawText("");
      setImportParsedRows([]);
    } catch (error) {
      console.error("Batch import failed", error);
      alert(lang === "ID" ? "Gagal melakukan proses impor data." : "Failed to import structural data.");
    } finally {
      setIsImporting(false);
      setImportProgress("");
    }
  };

  const handleCreateCircle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!circleName.trim()) return;

    const newCircle: Circle = {
      id: `circ_${Date.now()}`,
      name: circleName.trim(),
      description: circleDesc,
      subCircleOfId: circleParent === "none" ? null : circleParent,
      leadId: circleLead || null,
      circleType: circleType
    };

    onCircleAdded(newCircle);
    setCircleName("");
    setCircleDesc("");
    setCircleType("department");
    setShowAddCircle(false);
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTitle.trim()) return;

    const roleData = {
      title: roleTitle.trim(),
      circleId: roleCircleId,
      description: roleDesc,
      accountabilities: roleAccountabilities.filter(a => a.trim() !== ""),
      userIds: roleUserIds
    };

    onRoleAdded(roleData);
    setRoleTitle("");
    setRoleDesc("");
    setRoleAccountabilities([""]);
    setRoleUserIds([]);
    setShowAddRole(false);
  };

  const handleUpdateCircleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCircleName.trim() || !onCircleUpdated) return;
    onCircleUpdated(editCircleId, {
      name: editCircleName.trim(),
      description: editCircleDesc,
      subCircleOfId: editCircleParent === "none" ? null : editCircleParent,
      leadId: editCircleLead || null,
      circleType: editCircleType
    });
    setShowEditCircle(false);
  };

  const handleDeleteCircleClick = (id: string) => {
    if (!onCircleDeleted) return;
    if (window.confirm("Apakah anda yakin ingin menghapus Circle ini? Semua sub-circle dan role di dalamnya akan ikut dihapus dari visualisasi.")) {
      onCircleDeleted(id);
      setSelectedCircleId("");
    }
  };

  const handleUpdateRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoleTitle.trim() || !onRoleUpdated) return;
    onRoleUpdated(editRoleId, {
      title: editRoleTitle.trim(),
      description: editRoleDesc,
      circleId: editRoleCircleId,
      accountabilities: editRoleAccountabilities.filter(a => a.trim() !== ""),
      userIds: editRoleUserIds
    });
    setShowEditRole(false);
  };

  const handleDeleteRoleClick = (id: string) => {
    if (!onRoleDeleted) return;
    if (window.confirm("Apakah anda yakin ingin menghapus Role Akuntabilitas ini?")) {
      onRoleDeleted(id);
    }
  };

  // Dynamic Concentric/Fractal Holacracy Layout structures
  interface UnifiedLayoutNode {
    type: "circle" | "role";
    id: string;
    name: string;
    circleType?: string;
    isSelected: boolean;
    x: number;
    y: number;
    r: number;
    depth: number;
    colorType?: "green" | "white";
    parentId: string | null;
    children: UnifiedLayoutNode[];
  }

  const getUnifiedLayout = (): { circles: UnifiedLayoutNode[]; roles: UnifiedLayoutNode[] } => {
    const rootCircles = circles.filter(c => c.subCircleOfId === null);
    if (rootCircles.length === 0) return { circles: [], roles: [] };

    // Determine role color type (green/white matching Glassfrog design)
    const getRoleColorType = (title: string, idx: number): "green" | "white" => {
      const titleLower = title.toLowerCase();
      if (titleLower.includes("lead") || titleLower.includes("infrastructure") || titleLower.includes("architect") || titleLower.includes("designer") || idx % 2 === 0) {
        return "green";
      }
      return "white";
    };

    const buildTree = (circle: Circle, depth: number): UnifiedLayoutNode => {
      const subCircles = circles.filter(c => c.subCircleOfId === circle.id);
      const circleRoles = roles.filter(r => r.circleId === circle.id);

      const circleChildren: UnifiedLayoutNode[] = subCircles.map(sc => buildTree(sc, depth + 1));
      const roleChildren: UnifiedLayoutNode[] = circleRoles.map((r, i) => ({
        type: "role",
        id: r.id,
        name: r.title,
        isSelected: false,
        x: 0,
        y: 0,
        r: 0,
        depth: depth + 1,
        colorType: getRoleColorType(r.title, i),
        parentId: circle.id,
        children: []
      }));

      // Directly include child circles and child roles inside parent circle
      const children = [...circleChildren, ...roleChildren];

      return {
        type: "circle",
        id: circle.id,
        name: circle.name,
        circleType: circle.circleType || "department",
        isSelected: selectedCircleId === circle.id,
        x: 0,
        y: 0,
        r: 0,
        depth,
        parentId: circle.subCircleOfId,
        children
      };
    };

    let rootNode: UnifiedLayoutNode;
    
    if (rootCircles.length === 1) {
      rootNode = buildTree(rootCircles[0], 0);
    } else {
      rootNode = {
        type: "circle",
        id: "virtual_root",
        name: "Anchor Circle (GCC)",
        circleType: "department",
        isSelected: false,
        x: 0, y: 0, r: 0,
        depth: 0,
        parentId: null,
        children: rootCircles.map(rc => buildTree(rc, 1))
      };
    }

    // Recursively layout nodes inside a circle of center (cx, cy) and radius r
    const layoutNode = (node: UnifiedLayoutNode, cx: number, cy: number, r: number) => {
      node.x = cx;
      node.y = cy;
      node.r = r;

      if (node.type === "role" || node.children.length === 0) return;

      const M = node.children.length;
      const isRoot = node.parentId === null;

      // Available inner packing area after padding
      const padding = r * (isRoot ? 0.16 : 0.12);
      const rInner = r - padding;

      // Put label at the top, shift the child packaging center slightly down
      const cyShift = cy + r * (isRoot ? 0.08 : 0.05);

      if (M === 1) {
        layoutNode(node.children[0], cx, cyShift, rInner * 0.72);
      } else if (M === 2) {
        const childR = rInner * 0.44;
        const dist = rInner * 0.45;
        layoutNode(node.children[0], cx - dist, cyShift, childR);
        layoutNode(node.children[1], cx + dist, cyShift, childR);
      } else {
        // Multi-member list packed along an orbital touching chain
        const halfAngle = Math.PI / M;
        const sinHalf = Math.sin(halfAngle);
        const scaleFactor = sinHalf / (1 + sinHalf);
        const childR = rInner * Math.min(0.42, scaleFactor * 0.94);
        const dist = rInner - childR - 2;

        const startAngle = -Math.PI / 2;
        node.children.forEach((child, i) => {
          const angle = startAngle + (i * 2 * Math.PI) / M;
          const childX = cx + dist * Math.cos(angle);
          const childY = cyShift + dist * Math.sin(angle);
          layoutNode(child, childX, childY, childR);
        });
      }
    };

    // Calculate layout inside 520x520 canvas size
    layoutNode(rootNode, 260, 260, 250);

    const flatCircles: UnifiedLayoutNode[] = [];
    const flatRoles: UnifiedLayoutNode[] = [];

    const traverse = (node: UnifiedLayoutNode) => {
      if (node.type === "circle") {
        flatCircles.push(node);
      } else {
        flatRoles.push(node);
      }
      node.children.forEach(traverse);
    };
    traverse(rootNode);

    // Sort parents first so they draw correctly behind children
    flatCircles.sort((a, b) => b.r - a.r);

    return { circles: flatCircles, roles: flatRoles };
  };

  const getGalaxyLayout = () => {
    // Locate center circle
    const activeCircle = circles.find(c => c.id === selectedCircleId) || circles[0];
    if (!activeCircle) return { center: null, satellites: [], orbitR: 175 };

    let centerCircle = activeCircle;
    let satelliteCircles = circles.filter(c => c.subCircleOfId === centerCircle.id);

    // If active circle has no sub-circles but is a sub-circle itself, center its parent
    // so we see peer satellites alongside active circle
    if (satelliteCircles.length === 0 && centerCircle.subCircleOfId) {
      const parent = circles.find(c => c.id === centerCircle.subCircleOfId);
      if (parent) {
        centerCircle = parent;
        satelliteCircles = circles.filter(c => c.subCircleOfId === centerCircle.id);
      }
    }

    const cx = 260;
    const cy = 260;
    const centerR = 80;
    const orbitR = 175;

    const satellites = satelliteCircles.map((sc, i) => {
      const M = satelliteCircles.length;
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / M;
      const x = cx + orbitR * Math.cos(angle);
      const y = cy + orbitR * Math.sin(angle);
      const r = Math.max(38, Math.min(58, 280 / (M + 3.5)));
      return {
        id: sc.id,
        name: sc.name,
        circleType: sc.circleType || "department",
        leadId: sc.leadId,
        x,
        y,
        r,
        isSelected: sc.id === selectedCircleId,
        angle
      };
    });

    return {
      center: {
        id: centerCircle.id,
        name: centerCircle.name,
        circleType: centerCircle.circleType || "platform",
        leadId: centerCircle.leadId,
        x: cx,
        y: cy,
        r: centerR,
        isSelected: centerCircle.id === selectedCircleId
      },
      satellites,
      orbitR
    };
  };

  return (
    <div className="space-y-6" id="org-structure-container">
      {/* Dynamic Tab Switcher for Org Structure Views */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="title-font font-black text-lg text-slate-800 flex items-center gap-2">
            <Sparkles className="text-teal-600 size-5" />
            {lang === "ID" ? "Struktur Organisasi & Tata Kelola" : "Organization Structure & Governance"}
          </h2>
          <p className="text-[11px] text-slate-500">
            {lang === "ID"
              ? "Kelola lingkaran fungsional (Holakrasi), peran akuntabilitas jabatan, serta visualisasi hierarki karyawan terintegrasi."
              : "Manage functional circles (Holacracy), role accountabilities, and integrated employee reporting hierarchies."}
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setStructureView("company")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              structureView === "company"
                ? "bg-white text-emerald-950 shadow-xs"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <Layers className="size-4" />
            {lang === "ID" ? "Struktur Holacracy" : "Holacracy Structure"}
          </button>
          <button
            onClick={() => setStructureView("employee")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              structureView === "employee"
                ? "bg-white text-emerald-950 shadow-xs"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <Users className="size-4" />
            {lang === "ID" ? "Hierarki" : "Hierarchy"}
          </button>
        </div>
      </div>

      {structureView === "employee" ? (
        <EmployeeStructure
          lang={lang}
          users={users}
          circles={circles}
          roles={roles}
          roleMembers={roleMembers}
          objectives={objectives}
          keyResults={keyResults}
          keyResultAssignees={keyResultAssignees}
          performanceReviews={performanceReviews}
          eval360Submissions={eval360Submissions}
          systemConfig={systemConfig}
          onSyncData={onSyncData}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Circle Catalog Sidebar-Nested Navigation */}
      <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Layers className="text-emerald-600 size-5" />
            <h3 className="title-font font-bold text-base text-slate-800">
              Sektor Organisasi (Circles)
            </h3>
          </div>
          <div className="flex gap-1.5">
            {canManageOrgStructure && (
              <>
                <button 
                  id="add-circle-btn"
                  disabled={isLocked}
                  onClick={() => {
                    setCircleParent(selectedCircleId);
                    setShowAddCircle(true);
                  }}
                  className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-colors ${
                    isLocked 
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                  title={isLocked ? "Terkunci: Kuartal telah berakhir" : undefined}
                >
                  <Plus className="size-3" /> Tambah Sektor
                </button>
                <button 
                  id="import-struct-btn"
                  onClick={() => {
                    setShowImportModal(true);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1.5 rounded-lg transition-colors"
                >
                  <Upload className="size-3" /> Impor Excel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Period Expiry Lock Banner */}
        {hasEnded && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1 animate-pulse">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertTriangle className="size-4 text-amber-600 shrink-0" />
              <span>KUARTAL TELAH JATUH TEMPO</span>
            </div>
            <p className="text-slate-600 leading-normal text-[11px]">
              Masa kuartal telah berakhir pada {systemConfig?.endDate || 'tanggal jatuh tempo'}. Anda masih dapat melakukan penyesuaian sektor/peran dan indikator kinerja, namun mohon untuk segera menyelesaikannya demi kepentingan rekapitulasi penilaian.
            </p>
          </div>
        )}

        {/* Dynamic Reminder Alert Banner */}
        {!hasEnded && systemConfig?.remindersEnabled && actualDaysRemaining !== null && actualDaysRemaining <= systemConfig.daysRemaining && actualDaysRemaining >= 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-805 space-y-1 animate-pulse">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertTriangle className="size-4 text-amber-600 shrink-0" />
              <span>Peringatan: Akhir Kuartal Dekat!</span>
            </div>
            <p className="text-slate-600 leading-normal text-[11px]">
              Kuartal {systemConfig.currentQuarter} akan ditutup dalam {actualDaysRemaining} hari! Item yang belum mencapai ambang pencapaian (target Komitmen: {systemConfig.committedThreshold}% / Aspirasional: {systemConfig.aspirationalThreshold}%) membutuhkan perhatian khusus dari tim.
            </p>
          </div>
        )}

        {/* INTERACTIVE GRAPHICAL CONCENTRIC / NESTED MAP */}
        <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/50 p-2.5 rounded-xl border border-slate-100 shadow-xxs">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-800">
                <Layers className="size-4 shrink-0" />
              </div>
              <div>
                <span className="text-[10.5px] uppercase font-mono font-extrabold text-emerald-800 tracking-wider block">
                  {lang === "ID" ? "Struktur Lingkaran Holakrasi (Nested Circles)" : "Holacracy Nested Circle Structure"}
                </span>
                <span className="text-[9.5px] text-slate-400 block mt-0.5">
                  {lang === "ID"
                    ? "Sistem tata kelola mandiri transparan di mana lingkaran/circle bersarang di dalam satu sama lain."
                    : "Transparent, self-governing structure where circles are nested inside one another."}
                </span>
              </div>
            </div>

            {/* Educational Info Trigger */}
            <button
              type="button"
              onClick={() => setShowHolacracyInfo(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-[10.5px] flex items-center gap-1 border border-emerald-250 transition-all shadow-xxs self-start sm:self-auto"
            >
              <Info className="size-3.5" />
              {lang === "ID" ? "Panduan Holakrasi" : "Holacracy Guide"}
            </button>
          </div>
          
          <div className="relative flex justify-center py-2 bg-radial from-slate-50 to-white rounded-xl border border-slate-150 overflow-hidden shadow-xs">
            {/* Hovered Dependency Floating Detail Card */}
            {hoveredDependency && (
              <div 
                className="absolute z-20 bg-slate-900 text-white p-2.5 rounded-lg text-[10px] shadow-lg border border-slate-700 max-w-[220px] pointer-events-none transition-all duration-200"
                style={{
                  top: `${Math.min(320, Math.max(10, hoveredDependency.y - 10))}px`,
                  left: `${Math.min(300, Math.max(10, hoveredDependency.x - 20))}px`
                }}
              >
                <div className="font-extrabold text-blue-400 mb-1 flex items-center gap-1">
                  {hoveredDependency.title}
                </div>
                <p className="text-[9.5px] leading-relaxed whitespace-pre-wrap text-slate-200">
                  {hoveredDependency.details}
                </p>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
              <button 
                onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 3))}
                className="bg-white/90 p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 shadow-xxs transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="size-4" />
              </button>
              <button 
                onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.5))}
                className="bg-white/90 p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 shadow-xxs transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="size-4" />
              </button>
            </div>

            <svg className="w-full h-[410px] cursor-pointer select-none transition-transform duration-300" style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }} viewBox="0 0 520 520" id="holacracy-svg-canvas">
              {/* Define Beautiful GKM Galaxy Gradients */}
              <defs>
                <radialGradient id="platformGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1e3a8a" />
                  <stop offset="100%" stopColor="#0f172a" />
                </radialGradient>
                <radialGradient id="functionalGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#b91c1c" />
                  <stop offset="100%" stopColor="#7f1d1d" />
                </radialGradient>
                <linearGradient id="supportingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fefbc3" />
                  <stop offset="100%" stopColor="#fef08a" />
                </linearGradient>
                <linearGradient id="dependencyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f5f3ff" />
                  <stop offset="100%" stopColor="#ddd6fe" />
                </linearGradient>
                <linearGradient id="spokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#991b1b" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.5" />
                </linearGradient>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 2 L 8 5 L 0 8 z" fill="#0284c7" />
                </marker>
                <marker id="blocker-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 2 L 8 5 L 0 8 z" fill="#dc2626" />
                </marker>
              </defs>

              {(() => {
                const layout = getUnifiedLayout();
                return (
                  <>
                    {/* 1. DRAW NESTED CIRCLES */}
                    {layout.circles.map((node) => {
                      const isSelected = node.isSelected;
                      const isRoot = node.parentId === null;
                      const isDept = node.circleType === "department";
                      const hasChildren = node.children.length > 0;

                      // Decide background and stroke colors matching the glassfrog image
                      let strokeColor = "#0f766e"; // teal for normal dept
                      let strokeWidth = "1.5";
                      let strokeDash = "none";
                      let fillColor = "rgba(204, 251, 241, 0.25)"; // very soft teal

                      if (isRoot) {
                        strokeColor = "#581c87"; // Purple root border
                        strokeWidth = "3.2";
                        fillColor = "rgba(243, 232, 255, 0.28)"; // soft purple highlight
                      } else if (!isDept) {
                        strokeColor = "#4338ca"; // indigo-700
                        strokeWidth = "2.5";
                        strokeDash = "6,4"; // Dashed line for cross-functional teams
                        fillColor = "rgba(238, 242, 255, 0.4)"; // soft indigo with more opacity
                      }

                      // Label position settings
                      let labelY = node.y + 4; // default centered for leaf departments
                      let showSubtitle = node.r >= 36;

                      if (hasChildren) {
                        // Place title near the top
                        labelY = node.y - node.r + (isRoot ? 35 : 18);
                      }

                      // Truncate naming neatly
                      let displayName = node.name;
                      if (node.r < 32) {
                        displayName = node.name.length > 7 ? node.name.slice(0, 6) + ".." : node.name;
                      } else if (node.r < 65) {
                        displayName = node.name.split(" ")[0]; // Just first word
                      }

                      return (
                        <g
                          key={`circle-g-${node.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCircleId(node.id);
                          }}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverCircleId(node.id); }}
                          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (dragOverCircleId === node.id) setDragOverCircleId(null); }}
                          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverCircleId(null); const roleId = e.dataTransfer.getData("text/plain"); handleRoleDrop(roleId, node.id); }}
                          className="group"
                        >
                          {/* Inner soft circular shadow ring */}
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={node.r}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDash}
                            className="transition-all duration-300 hover:brightness-95"
                          />

                          {/* Drag over glow feedback */}
                          {dragOverCircleId === node.id && (
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r={node.r + 5}
                              fill="rgba(16, 185, 129, 0.12)"
                              stroke="#10b981"
                              strokeWidth="4"
                              strokeDasharray="4,4"
                              className="animate-pulse"
                            />
                          )}

                          {/* Selected glowing outline ring */}
                          {isSelected && (
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r={node.r + 3}
                              fill="none"
                              stroke={isRoot ? "#d946ef" : isDept ? "#06b6d4" : "#6366f1"}
                              strokeWidth="3"
                              className="animate-pulse opacity-85"
                            />
                          )}

                          {/* Circle text labels */}
                          <text
                            x={node.x}
                            y={labelY}
                            textAnchor="middle"
                            className={`font-sans tracking-tight font-extrabold select-none pointer-events-none transition-colors duration-200 ${
                              isSelected
                                ? isRoot ? "fill-purple-950 font-black" : "fill-slate-900"
                                : "fill-slate-800"
                            }`}
                            style={{
                              fontSize: isRoot ? "14px" : node.r > 120 ? "11.5px" : node.r < 35 ? "7.5px" : "9.5px",
                              letterSpacing: isRoot ? "0.03em" : "normal"
                            }}
                          >
                            {displayName}
                          </text>

                          {showSubtitle && (
                            <text
                              x={node.x}
                              y={labelY + (node.r > 90 ? 11 : 9)}
                              textAnchor="middle"
                              className={`text-[7px] font-mono font-bold select-none pointer-events-none opacity-80 ${isRoot ? "fill-purple-600" : isDept ? "fill-teal-600" : "fill-indigo-600"}`}
                            >
                              {isRoot ? "SEKTOR UTAMA" : isDept ? "SEKTOR DEP" : "GUGUS TUGAS LINTAS FUNGSI"}
                            </text>
                          )}

                          <title>{node.name} ({isDept ? "Sektor Departemen" : "Gugus Tugas"})</title>
                        </g>
                      );
                    })}

                    {/* 2. DRAW ROLES ON TOP OF CIRCLES */}
                    {layout.roles.map((node) => {
                      const isGreen = node.colorType === "green";
                      const parentSelected = selectedCircleId === node.parentId;
                      
                      // Two words separation for outstanding layout inside role circles
                      const titleWords = node.name.split(" ");
                      const word1 = titleWords[0] || "";
                      let word2 = titleWords.slice(1).join(" ");
                      if (word2.length > 10) {
                        word2 = word2.slice(0, 8) + "..";
                      }

                      return (
                        <g
                          key={`role-g-${node.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (node.parentId) {
                              setSelectedCircleId(node.parentId);
                            }
                          }}
                          draggable={true}
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.setData("text/plain", node.id);
                          }}
                          className="group cursor-pointer active:scale-95 transition-transform"
                        >
                          {/* Role Outer Boundary Circle */}
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={node.r}
                            fill={isGreen ? "#16a34a" : "#ffffff"}
                            stroke={isGreen ? "#14532d" : "#94a3b8"}
                            strokeWidth={parentSelected ? "2" : "1.2"}
                            className="transition-all duration-300 hover:brightness-110 hover:stroke-slate-500"
                          />

                          {/* Highlight ring if parent circle of role is selected */}
                          {parentSelected && (
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r={node.r + 2}
                              fill="none"
                              stroke="#22c55e"
                              strokeWidth="1.5"
                              strokeDasharray="2,2"
                              className="opacity-75"
                            />
                          )}

                          {/* Words inside Role Badge */}
                          {node.r > 11 && (
                            <>
                              <text
                                x={node.x}
                                y={node.y + (word2 ? -3 : 2.5)}
                                textAnchor="middle"
                                className={`font-sans font-bold select-none pointer-events-none`}
                                style={{
                                  fontSize: node.r < 20 ? "6px" : "7.5px",
                                  fill: isGreen ? "#ffffff" : "#1e293b"
                                }}
                              >
                                {word1}
                              </text>
                              {word2 && (
                                <text
                                  x={node.x}
                                  y={node.y + (node.r < 20 ? 4 : 5.5)}
                                  textAnchor="middle"
                                  className={`font-sans font-medium select-none pointer-events-none opacity-90`}
                                  style={{
                                    fontSize: node.r < 20 ? "5px" : "6.5px",
                                    fill: isGreen ? "#f0fdf4" : "#475569"
                                  }}
                                >
                                  {word2}
                                </text>
                              )}
                            </>
                          )}

                          <title>{node.name} (Role Akuntabilitas)</title>
                        </g>
                      );
                    })}

                    {/* 3. DRAW STRATEGIC ALIGNMENTS */}
                    {dependencyViewMode === "strategic" && (() => {
                      const paths: React.ReactNode[] = [];
                      objectives.forEach((obj) => {
                        if (!obj.parentId || !obj.circleId) return;
                        const parentObj = objectives.find(o => o.id === obj.parentId);
                        if (!parentObj || !parentObj.circleId) return;

                        // Find layout coordinates for both circles
                        const c1 = layout.circles.find(c => c.id === obj.circleId);
                        const c2 = layout.circles.find(c => c.id === parentObj.circleId);

                        if (c1 && c2 && c1.id !== c2.id) {
                          const x1 = c1.x;
                          const y1 = c1.y;
                          const x2 = c2.x;
                          const y2 = c2.y;

                          const mx = (x1 + x2) / 2;
                          const my = (y1 + y2) / 2;
                          const dx = x2 - x1;
                          const dy = y2 - y1;
                          const len = Math.sqrt(dx * dx + dy * dy);

                          if (len > 0) {
                            const offset = Math.min(40, len * 0.18);
                            const px = -dy / len;
                            const py = dx / len;
                            const cx = mx + px * offset;
                            const cy = my + py * offset;

                            const pathData = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
                            paths.push(
                              <g key={`strat-path-${obj.id}`} className="group">
                                <path
                                  d={pathData}
                                  fill="none"
                                  stroke="transparent"
                                  strokeWidth="10"
                                  className="cursor-pointer"
                                  onMouseEnter={() => {
                                    setHoveredDependency({
                                      type: "strategic",
                                      title: lang === "ID" ? "🔗 Penyelarasan Strategi" : "🔗 Strategy Alignment",
                                      details: `${lang === "ID" ? "OKR" : "OKR"}: "${obj.title}"\n➔ ${lang === "ID" ? "Menyelaras ke Induk" : "Aligned to Parent"}: "${parentObj.title}"`,
                                      x: mx,
                                      y: my - 15
                                    });
                                  }}
                                  onMouseLeave={() => setHoveredDependency(null)}
                                />
                                <path
                                  d={pathData}
                                  fill="none"
                                  stroke="#3b82f6"
                                  strokeWidth="2.5"
                                  className="opacity-45 group-hover:opacity-100 group-hover:stroke-blue-500 transition-all duration-300"
                                  strokeDasharray="4,4"
                                  markerEnd="url(#arrow)"
                                />
                                <path
                                  d={pathData}
                                  fill="none"
                                  stroke="#1d4ed8"
                                  strokeWidth="1.2"
                                  className="opacity-70 group-hover:opacity-100 group-hover:stroke-blue-600 transition-all duration-300"
                                  markerEnd="url(#arrow)"
                                />
                              </g>
                            );
                          }
                        }
                      });
                      return paths;
                    })()}

                    {/* 4. DRAW OPERATIONAL BLOCKERS */}
                    {dependencyViewMode === "operational" && (() => {
                      const paths: React.ReactNode[] = [];
                      checkInLogs.forEach((log) => {
                        if (!log.hasBlocker) return;
                        if (!log.dependencyCircleId && !log.dependencyRoleId) return;

                        const kr = keyResults.find(k => k.id === log.keyResultId);
                        if (!kr) return;
                        const obj = objectives.find(o => o.id === kr.objectiveId);
                        if (!obj) return;

                        const sourceCircleId = obj.circleId;
                        const sourceRoleId = log.roleId;

                        let srcNode = null;
                        if (sourceRoleId) {
                          srcNode = layout.roles.find(r => r.id === sourceRoleId);
                        }
                        if (!srcNode && sourceCircleId) {
                          srcNode = layout.circles.find(c => c.id === sourceCircleId);
                        }

                        let tgtNode = null;
                        if (log.dependencyRoleId) {
                          tgtNode = layout.roles.find(r => r.id === log.dependencyRoleId);
                        }
                        if (!tgtNode && log.dependencyCircleId) {
                          tgtNode = layout.circles.find(c => c.id === log.dependencyCircleId);
                        }

                        if (srcNode && tgtNode && srcNode.id !== tgtNode.id) {
                          const x1 = srcNode.x;
                          const y1 = srcNode.y;
                          const x2 = tgtNode.x;
                          const y2 = tgtNode.y;

                          const mx = (x1 + x2) / 2;
                          const my = (y1 + y2) / 2;
                          const dx = x2 - x1;
                          const dy = y2 - y1;
                          const len = Math.sqrt(dx * dx + dy * dy);

                          if (len > 0) {
                            const offset = Math.min(45, len * 0.22);
                            const px = -dy / len;
                            const py = dx / len;
                            const cx = mx + px * offset;
                            const cy = my + py * offset;

                            const pathData = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
                            const notes = log.blockerNotes || (lang === "ID" ? "Terhambat oleh dependensi eksternal" : "Blocked by external dependency");

                            paths.push(
                              <g key={`blocker-path-${log.id}`} className="group">
                                <path
                                  d={pathData}
                                  fill="none"
                                  stroke="transparent"
                                  strokeWidth="12"
                                  className="cursor-pointer"
                                  onMouseEnter={() => {
                                    setHoveredDependency({
                                      type: "operational",
                                      title: lang === "ID" ? "⚠️ Hambatan Operasional (Blocker)" : "⚠️ Operational Blocker",
                                      details: `"${srcNode?.name}" ${lang === "ID" ? "TERHAMBAT OLEH" : "IS BLOCKED BY"} "${tgtNode?.name}"\n\n📌 Hambatan: "${notes}"`,
                                      x: mx,
                                      y: my - 20
                                    });
                                  }}
                                  onMouseLeave={() => setHoveredDependency(null)}
                                />
                                <path
                                  d={pathData}
                                  fill="none"
                                  stroke="#ef4444"
                                  strokeWidth="3"
                                  className="opacity-55 group-hover:opacity-100 group-hover:stroke-red-500 transition-all duration-300"
                                  strokeDasharray="5,3"
                                  markerEnd="url(#blocker-arrow)"
                                />
                                <path
                                  d={pathData}
                                  fill="none"
                                  stroke="#b91c1c"
                                  strokeWidth="1.5"
                                  className="opacity-80 group-hover:opacity-100 group-hover:stroke-red-600 transition-all duration-300"
                                  markerEnd="url(#blocker-arrow)"
                                />
                              </g>
                            );
                          }
                        }
                      });
                      return paths;
                    })()}
                  </>
                );
              })()}
            </svg>
          </div>

          {/* Legend and Controller section below Circle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {/* Legend indicators */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-150 text-[10px] font-semibold text-slate-755 shadow-xxs space-y-1.5">
              <div className="font-extrabold text-slate-800 uppercase tracking-wide text-[9px] border-b border-slate-100 pb-1 flex items-center gap-1">
                <span>💡 {lang === "ID" ? "Legenda Struktur" : "Structure Legend"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-100 border border-purple-850 shrink-0"></span>
                <span>{lang === "ID" ? "Anchor Circle (Sektor Utama)" : "Anchor Circle"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-50 border border-teal-750 shrink-0"></span>
                <span>{lang === "ID" ? "Sub-Circle (Departemen)" : "Sub-Circle (Department)"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-50 border border-indigo-750 border-dashed shrink-0"></span>
                <span>{lang === "ID" ? "Gugus Lintas Fungsi" : "Cross-Functional Circle"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-emerald-950 shrink-0"></span>
                <span>{lang === "ID" ? "Lead Link (Peran Hijau)" : "Lead Link (Green Badge)"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400 shrink-0"></span>
                <span>{lang === "ID" ? "Peran Akuntabilitas" : "Accountability Role"}</span>
              </div>
            </div>

            {/* Dependency & Blocker View Switcher */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-150 text-[10px] shadow-xxs flex flex-col gap-1.5">
              <span className="font-extrabold text-slate-800 uppercase tracking-wide text-[9px] flex items-center gap-1 border-b border-slate-100 pb-1">
                <Sparkles className="size-3 text-indigo-500 animate-pulse" />
                {lang === "ID" ? "Peta Hubungan & Hambatan" : "Dependency & Blocker Map"}
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDependencyViewMode("none")}
                  className={`px-2 py-1 rounded text-left transition-colors font-semibold text-[9.5px] ${
                    dependencyViewMode === "none"
                      ? "bg-slate-150 text-slate-800 font-extrabold"
                      : "text-slate-500 hover:bg-slate-50 border border-slate-100"
                  }`}
                >
                  🚫 {lang === "ID" ? "Sembunyikan" : "Hide Map"}
                </button>
                <button
                  type="button"
                  onClick={() => setDependencyViewMode("strategic")}
                  className={`px-2 py-1 rounded text-left transition-colors font-semibold text-[9.5px] flex items-center justify-between ${
                    dependencyViewMode === "strategic"
                      ? "bg-blue-50 text-blue-800 font-bold border border-blue-200"
                      : "text-slate-500 hover:bg-slate-50 border border-slate-100"
                  }`}
                  title="Tampilkan garis penyelarasan antar Sektor"
                >
                  <span>🔗 {lang === "ID" ? "Penyelarasan Strategi" : "Strategy Alignment"}</span>
                  <span className="bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-full text-[8.5px]">
                    {objectives.filter(o => o.parentId).length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDependencyViewMode("operational")}
                  className={`px-2 py-1 rounded text-left transition-colors font-semibold text-[9.5px] flex items-center justify-between ${
                    dependencyViewMode === "operational"
                      ? "bg-rose-50 text-rose-800 font-bold border border-rose-200"
                      : "text-slate-500 hover:bg-slate-50 border border-slate-100"
                  }`}
                  title="Tampilkan hambatan (blocker) antar Peran"
                >
                  <span>⚠️ {lang === "ID" ? "Hambatan (Blocker)" : "Blockers"}</span>
                  <span className="bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded-full text-[8.5px]">
                    {checkInLogs.filter(l => l.hasBlocker && (l.dependencyCircleId || l.dependencyRoleId)).length}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="size-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari Sektor, Jabatan, atau Anggota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <p className="text-slate-500 text-[11px] leading-relaxed mt-2">
          Struktur organisasi dijalankan melalui tim akuntabilitas yang saling selaras (nested). Pilih Sektor di bawah untuk melihat tujuan operasional dan peran jabatan:
        </p>

        {/* Dynamic Nested Tree Visual */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {circles.filter(c => c.subCircleOfId === null && isCircleVisible(c)).map(rootCircle => (
            <div key={rootCircle.id} className="space-y-1.5">
              <button
                id={`circle-nav-${rootCircle.id}`}
                onClick={() => setSelectedCircleId(rootCircle.id)}
                onDragOver={(e) => { e.preventDefault(); }}
                onDragEnter={() => setDragOverCircleId(rootCircle.id)}
                onDragLeave={() => setDragOverCircleId(null)}
                onDrop={(e) => { e.preventDefault(); setDragOverCircleId(null); const roleId = e.dataTransfer.getData("text/plain"); handleRoleDrop(roleId, rootCircle.id); }}
                className={`w-full flex items-center justify-between text-left p-3 rounded-lg border transition-all ${
                  selectedCircleId === rootCircle.id
                    ? "bg-emerald-950 border-emerald-900 text-white shadow-xs font-bold"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                } ${dragOverCircleId === rootCircle.id ? "ring-3 ring-emerald-500 scale-[1.02] border-emerald-500" : ""}`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] tracking-wider uppercase bg-emerald-850 text-emerald-200 px-1 rounded-xs">Utama</span>
                    <span className="text-[8px] font-mono text-slate-400">{(rootCircle.circleType || "department") === "department" ? "Departemen" : "Lintas Fungsi"}</span>
                  </div>
                  <span className="text-xs">{rootCircle.name}</span>
                </div>
                <ChevronRight className={`size-3.5 ${selectedCircleId === rootCircle.id ? "text-emerald-300" : "text-slate-405"}`} />
              </button>

              {/* Sub-circles */}
              <div className="pl-4 border-l-2 border-emerald-100 space-y-1.5">
                {getSubCircles(rootCircle.id).filter(sub => isCircleVisible(sub)).map(sub => (
                  <button
                    id={`circle-nav-${sub.id}`}
                    key={sub.id}
                    onClick={() => setSelectedCircleId(sub.id)}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDragEnter={() => setDragOverCircleId(sub.id)}
                    onDragLeave={() => setDragOverCircleId(null)}
                    onDrop={(e) => { e.preventDefault(); setDragOverCircleId(null); const roleId = e.dataTransfer.getData("text/plain"); handleRoleDrop(roleId, sub.id); }}
                    className={`w-full flex items-center justify-between text-left p-2.5 rounded-lg border transition-all ${
                      selectedCircleId === sub.id
                        ? "bg-emerald-700 border-emerald-800 text-white shadow-xs font-semibold"
                        : "bg-white hover:bg-slate-50 border-slate-150 text-slate-705"
                    } ${dragOverCircleId === sub.id ? "ring-3 ring-emerald-500 scale-[1.02] border-emerald-500" : ""}`}
                  >
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] tracking-wider uppercase px-1 rounded-xs bg-slate-100 text-slate-500">Sub</span>
                        <span className="text-[8px] font-mono text-slate-405">{(sub.circleType || "department") === "department" ? "Departemen" : "Lintas Fungsi"}</span>
                      </div>
                      <span className="text-xs">{sub.name}</span>
                    </div>
                    <ChevronRight className={`size-3 ${selectedCircleId === sub.id ? "text-emerald-100" : "text-slate-400"}`} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Focus Detail Circle Hub */}
      <div className="lg:col-span-8 space-y-6">
        {selectedCircle ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                    (selectedCircle.circleType || "department") === "department"
                      ? "bg-teal-50 text-teal-700 border border-teal-200"
                      : "bg-indigo-50 text-indigo-750 border border-indigo-200"
                  }`}>
                    {(selectedCircle.circleType || "department") === "department" ? "🏢 Sektor Departemen" : "🔄 Satgas Lintas Fungsi"}
                  </span>
                  <span className="text-slate-400 text-xs font-mono">• Active Sektor</span>
                </div>
                
                <div className="flex items-center gap-2.5">
                  <h2 className="title-font font-bold text-xl text-slate-800">{selectedCircle.name}</h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditCircleId(selectedCircle.id);
                        setEditCircleName(selectedCircle.name);
                        setEditCircleDesc(selectedCircle.description || "");
                        setEditCircleParent(selectedCircle.subCircleOfId || "none");
                        setEditCircleLead(selectedCircle.leadId || "");
                        setEditCircleType(selectedCircle.circleType || "department");
                        setShowEditCircle(true);
                      }}
                      className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-md"
                      title="Edit Circle parameters"
                    >
                      <Edit className="size-3.5" />
                    </button>
                    <button
                        onClick={() => handleDeleteCircleClick(selectedCircle.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-md"
                        title="Delete Circle"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                  </div>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">{selectedCircle.description}</p>
              </div>

              {/* Circle Lead Manager badge */}
              {getCircleLeadUser(selectedCircle.leadId) ? (
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 md:self-start shrink-0">
                  <img
                    referrerPolicy="no-referrer"
                    src={getCircleLeadUser(selectedCircle.leadId)?.avatar || undefined}
                    alt="Lead avatar"
                    className="size-9 rounded-full object-cover border border-slate-300"
                  />
                  <div>
                    <span className="text-[9px] text-slate-400 font-mono block">LEAD LINK (MANAGER)</span>
                    <span className="text-xs font-semibold text-slate-700">{getCircleLeadUser(selectedCircle.leadId)?.name}</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-xs bg-slate-50 p-2 rounded-lg border border-slate-150">
                  Belum Ada Lead Link
                </div>
              )}
            </div>

            {/* List of Accountable Roles in Circle */}
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <div className="flex items-center gap-1.5">
                  <Shield className="text-emerald-600 size-4" />
                  <h4 className="font-bold text-slate-750 text-xs uppercase tracking-wider">Jabatan & Peran Akuntabilitas ({getCircleRoles(selectedCircle.id).length})</h4>
                </div>
                {canManageOrgStructure && (
                  <button
                    id="add-role-btn"
                    onClick={() => {
                      setRoleCircleId(selectedCircle.id);
                      setShowAddRole(true);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <PlusCircle className="size-3.5" /> Tambah Jabatan / Role
                  </button>
                )}
              </div>

              {getCircleRoles(selectedCircle.id).length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                  <Users className="mx-auto text-slate-300 mb-2 size-8" />
                  <p className="text-slate-400 text-xs">Belum ada Jabatan / Role akuntabilitas terdaftar.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getCircleRoles(selectedCircle.id).map(role => {
                    const members = getRoleMembers(role.id);
                    return (
                      <div 
                        key={role.id} 
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", role.id);
                        }}
                        className="border border-slate-120 hover:border-slate-300 rounded-xl p-4 bg-slate-50/40 hover:bg-slate-50 transition-colors flex flex-col justify-between space-y-4 cursor-grab active:cursor-grabbing hover:shadow-xs"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-slate-800 text-sm">{role.title}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditRoleId(role.id);
                                  setEditRoleTitle(role.title);
                                  setEditRoleDesc(role.description);
                                  setEditRoleCircleId(role.circleId);
                                  setEditRoleAccountabilities(role.accountabilities.length > 0 ? role.accountabilities : [""]);
                                  setEditRoleUserIds(roleMembers.filter(rm => rm.roleId === role.id).map(rm => rm.userId));
                                  setShowEditRole(true);
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded-md"
                                title="Edit Role"
                              >
                                <Edit className="size-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRoleClick(role.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded-md"
                                title="Hapus Role"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-slate-500 text-xs leading-relaxed">{role.description}</p>
                          
                          {/* Accountabilities bullet points */}
                          {role.accountabilities && role.accountabilities.length > 0 && (
                            <div className="mt-3.5 space-y-1 bg-white p-2.5 rounded-lg border border-slate-100">
                              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Tanggung Jawab Pemegang Jabatan:</span>
                              {role.accountabilities.map((acc, keyIdx) => (
                                <div key={keyIdx} className="flex gap-2 items-start text-xs text-slate-600">
                                  <ArrowRight className="size-3 mt-0.5 text-emerald-500 shrink-0" />
                                  <span>{acc}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Mapped role members */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[9px] uppercase font-mono text-slate-400 font-bold">Pemegang Jabatan</span>
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {members.length === 0 ? (
                              <span className="text-[9px] text-slate-450 italic">Kosong</span>
                            ) : (
                              members.map(member => (
                                <img
                                  referrerPolicy="no-referrer"
                                  key={member.id}
                                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                                  src={member.avatar || undefined}
                                  alt={member.name}
                                  title={`${member.name} (${member.department})`}
                                />
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Workload Distribution Chart */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center gap-1.5 mb-4">
                <BarChart2 className="text-blue-600 size-4" />
                <h4 className="font-bold text-slate-750 text-xs uppercase tracking-wider">Distribusi Beban Kerja (Berdasarkan Kontribusi Target OKR)</h4>
              </div>
              <WorkloadDistributionChart
                users={users}
                roles={roles}
                roleMembers={roleMembers}
                objectives={objectives}
                keyResults={keyResults}
                keyResultAssignees={keyResultAssignees}
                circles={circles}
                selectedCircleId={selectedCircle.id}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 p-6 text-slate-400 text-sm">
            Silahkan pilih Circle Sektor terlebih dahulu.
          </div>
        )}
      </div>

      {/* MODAL: ADD CIRCLE FORM */}
      {showAddCircle && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="title-font font-bold text-base text-slate-800 flex items-center gap-2">
                <Layers className="text-emerald-600 size-5" /> Formulir Sektor Baru
              </h3>
              <button 
                onClick={() => setShowAddCircle(false)} 
                className="text-slate-450 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCircle} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nama Sektor (Circle) *</label>
                <input
                  id="circle-name-input"
                  type="text"
                  required
                  placeholder="misal: Optimasi Penjualan"
                  value={circleName}
                  onChange={(e) => setCircleName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm animate-fade-in"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tipe Sektor / Circle *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCircleType("department")}
                    className={`p-2.5 rounded-lg border font-semibold text-center transition-all ${
                      circleType === "department"
                        ? "bg-teal-900 border-teal-950 text-white"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    🏢 Departemen
                  </button>
                  <button
                    type="button"
                    onClick={() => setCircleType("cross_functional")}
                    className={`p-2.5 rounded-lg border font-semibold text-center transition-all ${
                      circleType === "cross_functional"
                        ? "bg-indigo-900 border-indigo-950 text-white"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    🔄 Lintas Fungsi
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tujuan Operasional Sektor</label>
                <textarea
                  id="circle-desc-input"
                  placeholder="Rangkum mandat dan batasan akuntabilitas sektor..."
                  value={circleDesc}
                  onChange={(e) => setCircleDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Induk Sektor (Circle)</label>
                  <select
                    id="circle-parent-select"
                    value={circleParent || "none"}
                    onChange={(e) => setCircleParent(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs text-slate-705"
                  >
                    <option value="none">Tidak ada (Utama/Anchor)</option>
                    {circles.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Pemimpin Sektor (Lead Link)</label>
                  <select
                    id="circle-lead-select"
                    value={circleLead}
                    onChange={(e) => setCircleLead(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs text-slate-705"
                  >
                    <option value="">Pilih Anggota...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddCircle(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  id="submit-circle-btn"
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold"
                >
                  Buat Sektor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CIRCLE FORM */}
      {showEditCircle && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="title-font font-bold text-base text-slate-800 flex items-center gap-2">
                <Layers className="text-emerald-600 size-5" /> Edit Sektor (Circle)
              </h3>
              <button 
                onClick={() => setShowEditCircle(false)} 
                className="text-slate-450 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCircleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nama Sektor (Circle) *</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Optimasi Penjualan"
                  value={editCircleName}
                  onChange={(e) => setEditCircleName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tipe Sektor / Circle *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditCircleType("department")}
                    className={`p-2.5 rounded-lg border font-semibold text-center transition-all ${
                      editCircleType === "department"
                        ? "bg-teal-900 border-teal-950 text-white"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    🏢 Departemen
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditCircleType("cross_functional")}
                    className={`p-2.5 rounded-lg border font-semibold text-center transition-all ${
                      editCircleType === "cross_functional"
                        ? "bg-indigo-900 border-indigo-950 text-white"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    🔄 Lintas Fungsi
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tujuan Operasional Sektor</label>
                <textarea
                  placeholder="Rangkum mandat dan batasan akuntabilitas sektor..."
                  value={editCircleDesc}
                  onChange={(e) => setEditCircleDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Induk Sektor (Circle)</label>
                  <select
                    value={editCircleParent}
                    onChange={(e) => setEditCircleParent(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs text-slate-705"
                  >
                    <option value="none">Tidak ada (Utama/Anchor)</option>
                    {circles.filter(c => c.id !== editCircleId).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Pemimpin Sektor (Lead Link)</label>
                  <select
                    value={editCircleLead}
                    onChange={(e) => setEditCircleLead(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs text-slate-705"
                  >
                    <option value="">Pilih Anggota...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditCircle(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD ROLE FORM */}
      {showAddRole && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 max-w-lg w-full shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="title-font font-bold text-base text-slate-800 flex items-center gap-2">
                <Shield className="text-emerald-600 size-5" /> Rancang Jabatan & Role Baru
              </h3>
              <button 
                onClick={() => setShowAddRole(false)} 
                className="text-slate-450 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Penempatan Sektor Organisasi</label>
                <select
                  id="role-circle-select"
                  value={roleCircleId}
                  onChange={(e) => setRoleCircleId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-xs text-slate-705"
                >
                  {circles.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nama Peran / Jabatan *</label>
                <input
                  id="role-title-input"
                  type="text"
                  required
                  placeholder="misal: SEO Content Designer, Systems Admin"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tujuan Utama Peran / Deskripsi Jabatan</label>
                <textarea
                  id="role-desc-input"
                  placeholder="Mengapa peran ini dibuat? Apa tujuan operasional atau kewenangan yang diembannya?"
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  rows={2}
                />
              </div>

              {/* Dynamic Accountabilities Bullet Points */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1.5 flex justify-between items-center">
                  <span>Daftar Tanggung Jawab Peran </span>
                  <button
                    type="button"
                    onClick={() => setRoleAccountabilities([...roleAccountabilities, ""])}
                    className="text-emerald-700 hover:text-emerald-950 text-[10px] font-bold"
                  >
                    + Tambah Tanggung Jawab
                  </button>
                </label>
                <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                  {roleAccountabilities.map((acc, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        id={`role-duty-input-${index}`}
                        type="text"
                        placeholder="misal: Melakukan optimalisasi rendering halaman"
                        value={acc}
                        onChange={(e) => {
                          const updated = [...roleAccountabilities];
                          updated[index] = e.target.value;
                          setRoleAccountabilities(updated);
                        }}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                      />
                      {roleAccountabilities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setRoleAccountabilities(roleAccountabilities.filter((_, idx) => idx !== index))}
                          className="text-red-500 hover:text-red-700 px-2 font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignment of employees */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1.5">Pilih Pemegang Jabatan (Bisa memegang multi-peran)</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-205 max-h-[110px] overflow-y-auto">
                  {users.map(u => {
                    const isChecked = roleUserIds.includes(u.id);
                    return (
                      <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setRoleUserIds(roleUserIds.filter(id => id !== u.id));
                            } else {
                              setRoleUserIds([...roleUserIds, u.id]);
                            }
                          }}
                          className="rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="truncate">{u.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddRole(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  id="submit-role-btn"
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold"
                >
                  Buat Jabatan / Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ROLE FORM */}
      {showEditRole && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 max-w-lg w-full shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="title-font font-bold text-base text-slate-800 flex items-center gap-2">
                <Shield className="text-emerald-600 size-5" /> Edit Jabatan & Peran
              </h3>
              <button 
                onClick={() => setShowEditRole(false)} 
                className="text-slate-450 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateRoleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Penempatan Sektor Organisasi</label>
                <select
                  value={editRoleCircleId}
                  onChange={(e) => setEditRoleCircleId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-xs text-slate-705"
                >
                  {circles.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nama Peran / Jabatan *</label>
                <input
                  type="text"
                  required
                  placeholder="misal: SEO Content Designer, Systems Admin"
                  value={editRoleTitle}
                  onChange={(e) => setEditRoleTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tujuan Utama Peran / Deskripsi Jabatan</label>
                <textarea
                  placeholder="Mengapa peran ini dibuat? Apa tujuan operasional atau kewenangan yang diembannya?"
                  value={editRoleDesc}
                  onChange={(e) => setEditRoleDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  rows={2}
                />
              </div>

              {/* Dynamic Accountabilities Bullet Points */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1.5 flex justify-between items-center">
                  <span>Daftar Tanggung Jawab Peran </span>
                  <button
                    type="button"
                    onClick={() => setEditRoleAccountabilities([...editRoleAccountabilities, ""])}
                    className="text-emerald-700 hover:text-emerald-950 text-[10px] font-bold"
                  >
                    + Tambah Tanggung Jawab
                  </button>
                </label>
                <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                  {editRoleAccountabilities.map((acc, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="misal: Melakukan optimalisasi rendering halaman"
                        value={acc}
                        onChange={(e) => {
                          const updated = [...editRoleAccountabilities];
                          updated[index] = e.target.value;
                          setEditRoleAccountabilities(updated);
                        }}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                      />
                      {editRoleAccountabilities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditRoleAccountabilities(editRoleAccountabilities.filter((_, idx) => idx !== index))}
                          className="text-red-500 hover:text-red-700 px-2 font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignment of employees */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1.5">Pilih Pemegang Jabatan (Bisa memegang multi-peran)</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-205 max-h-[110px] overflow-y-auto">
                  {users.map(u => {
                    const isChecked = editRoleUserIds.includes(u.id);
                    return (
                      <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded-sm text-slate-750">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setEditRoleUserIds(editRoleUserIds.filter(id => id !== u.id));
                            } else {
                              setEditRoleUserIds([...editRoleUserIds, u.id]);
                            }
                          }}
                          className="rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="truncate">{u.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditRole(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Educational Holacracy Modal */}
      {showHolacracyInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-950 text-white rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Layers className="size-5 text-emerald-300" />
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">
                    {lang === "ID" ? "Metode Lingkaran Holakrasi (Nested Circles)" : "Holacracy Nested Circles Method"}
                  </h3>
                  <p className="text-[10px] text-emerald-200">
                    {lang === "ID" ? "Panduan Tata Kelola Mandiri & Akuntabilitas Peran" : "Guide to Self-Governance & Role Accountabilities"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHolacracyInfo(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-650 leading-relaxed">
              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-teal-600 rounded-full inline-block"></span>
                  {lang === "ID" ? "Apa itu Lingkaran Bersarang (Nested Circles)?" : "What is Nested Circles?"}
                </h4>
                <p>
                  {lang === "ID" ? (
                    "Berbeda dengan struktur organisasi tradisional berbentuk piramida hierarkis komando, Holakrasi menggunakan konsep lingkaran bersarang (nested circles). Setiap lingkaran (Circle) mewakili fungsi atau tim mandiri yang memiliki tujuan operasional (purpose), wewenang, dan peran tersendiri. Lingkaran yang berada di dalam lingkaran lain (Sub-Circle) memiliki otonomi penuh atas operasionalnya, namun tetap selaras dengan tujuan lingkaran induk (Anchor Circle / General Company Circle)."
                  ) : (
                    "Unlike traditional hierarchical command pyramids, Holacracy uses a nested circle layout. Each Circle represents a self-organizing unit with a clear purpose, authority, and specialized roles. Sub-circles nested inside larger circles have full operational autonomy, while remaining aligned with the broader purpose of their parent circle."
                  )}
                </p>
              </section>

              <section className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-indigo-600 rounded-full inline-block"></span>
                  {lang === "ID" ? "Mekanisme Double Linking (Penghubung Dua Arah)" : "Double Linking Mechanism"}
                </h4>
                <p>
                  {lang === "ID" ? (
                    "Untuk memastikan koordinasi tanpa dominasi sepihak, Holakrasi menerapkan konsep Double Linking. Hubungan antar lingkaran dijembatani oleh dua peran penting yang aktif menghadiri rapat di lingkaran induk:"
                  ) : (
                    "To prevent top-down dominance and ensure clear information flow, Holacracy utilizes Double Linking. The connection between circles is maintained by two distinct roles that represent interests bidirectionally:"
                  )}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-150">
                    <span className="font-extrabold text-emerald-850 text-[11px] block">1. Lead Link (Penghubung Turun)</span>
                    <p className="text-[10.5px] text-slate-600 mt-1 leading-normal">
                      {lang === "ID" ? (
                        "Ditunjuk oleh lingkaran induk ke dalam lingkaran anak. Berfungsi menerjemahkan prioritas strategis, anggaran, dan metrik dari lingkaran induk agar dipahami serta dijalankan oleh lingkaran anak."
                      ) : (
                        "Assigned from the parent circle into the sub-circle. Responsible for bringing strategic priorities, budgets, and metrics from the parent to align the sub-circle's efforts."
                      )}
                    </p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-150">
                    <span className="font-extrabold text-indigo-850 text-[11px] block">2. Rep Link (Penghubung Naik)</span>
                    <p className="text-[10.5px] text-slate-600 mt-1 leading-normal">
                      {lang === "ID" ? (
                        "Dipilih secara demokratis oleh anggota lingkaran anak untuk mewakili mereka di lingkaran induk. Berfungsi menyuarakan ketegangan (tensions), kendala, dan aspirasi tim agar didengar di tingkat yang lebih tinggi."
                      ) : (
                        "Elected democratically by the sub-circle members to sit on the parent circle. Responsible for raising tensions, operational bottlenecks, and interests of the sub-circle upward."
                      )}
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-emerald-600 rounded-full inline-block"></span>
                  {lang === "ID" ? "4 Peran Inti Tata Kelola (Core Governance Roles)" : "4 Core Governance Roles"}
                </h4>
                <div className="space-y-2">
                  <div className="flex gap-2.5">
                    <span className="font-extrabold text-teal-800 min-w-[70px] uppercase font-mono tracking-wider">Lead Link:</span>
                    <span>{lang === "ID" ? "Membagi wilayah peran, mengalokasikan orang ke dalam peran, menentukan prioritas kerja, serta menetapkan metrik keberhasilan lingkaran." : "Defines role accountabilities, assigns members to roles, sets priorities, and measures circle metrics."}</span>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="font-extrabold text-indigo-800 min-w-[70px] uppercase font-mono tracking-wider">Rep Link:</span>
                    <span>{lang === "ID" ? "Membawa kendala operasional (tension) dari lingkaran anak ke lingkaran induk agar dicarikan resolusi kebijakan di tingkat atas." : "Bridges concerns (tensions) upward, securing support and policies from the parent circle."}</span>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="font-extrabold text-amber-800 min-w-[70px] uppercase font-mono tracking-wider">Facilitator:</span>
                    <span>{lang === "ID" ? "Memimpin rapat governance dan taktis mingguan secara independen agar mematuhi aturan konstitusi Holakrasi dan bebas dari bias subjektif." : "Independently facilitates circle meetings, ensuring adherence to the constitution and preventing subjective dominance."}</span>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="font-extrabold text-slate-800 min-w-[70px] uppercase font-mono tracking-wider">Secretary:</span>
                    <span>{lang === "ID" ? "Mencatat perubahan tata kelola (governance), mendokumentasikan kebijakan lingkaran, serta memelihara transparansi piagam lingkaran." : "Records governance updates, documents circle policies, and maintains transparent circle charts."}</span>
                  </div>
                </div>
              </section>

              <section className="space-y-2 p-4 bg-emerald-50 rounded-xl border border-emerald-150">
                <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-emerald-650 rounded-full inline-block"></span>
                  {lang === "ID" ? "Otonomi & Akuntabilitas Peran" : "Role-Based Autonomy"}
                </h4>
                <p className="text-[11px] text-emerald-900 leading-normal">
                  {lang === "ID" ? (
                    "Dalam Holakrasi, anggota organisasi tidak memiliki 'atasan langsung' dalam arti tradisional. Anggota bertindak sebagai pemilik peran (Role Owner). Pemilik peran memiliki wewenang mutlak untuk mengambil keputusan terbaik demi mencapai tujuan perannya, asalkan tidak melanggar aturan eksplisit yang tercantum dalam piagam tata kelola. Kebijakan ini menghilangkan kelambatan persetujuan birokratis dan menumbuhkan kepemilikan penuh (full ownership) atas hasil kerja."
                  ) : (
                    "In Holacracy, there are no traditional 'bosses'. Members act as sovereign Role Owners. Role owners have full authority to execute decisions and projects to fulfill their role's purpose, as long as they don't violate explicit circle policies. This eliminates traditional bureaucratic delay and builds full ownership of work."
                  )}
                </p>
              </section>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowHolacracyInfo(false)}
                className="px-5 py-2 bg-slate-850 hover:bg-slate-900 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
              >
                {lang === "ID" ? "Selesai Membaca" : "Close Guide"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BATCH IMPORT STRUCTURAL DATA */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 max-w-2xl w-full shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="title-font font-bold text-base text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="text-blue-600 size-5" />
                {lang === "ID" ? "Impor Struktur & Tata Kelola dari Excel / CSV" : "Import Structure & Governance from Excel / CSV"}
              </h3>
              <button 
                onClick={() => {
                  if (!isImporting) {
                    setShowImportModal(false);
                    setImportRawText("");
                    setImportParsedRows([]);
                  }
                }} 
                className="text-slate-450 hover:text-slate-700 font-bold text-sm"
                disabled={isImporting}
              >
                ✕
              </button>
            </div>

            {/* Template Downloader Panel */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-blue-50/40 border border-blue-100 rounded-xl p-3.5">
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-100 text-blue-700 p-2 rounded-lg shrink-0">
                  <FileSpreadsheet className="size-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-slate-750">
                    {lang === "ID" ? "Gunakan Template Excel Standard" : "Use Standard Excel Template"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {lang === "ID" ? "Unduh dan lengkapi file template ini untuk mengubah/memperbarui struktur organisasi." : "Download and fill this template to restructure or update circles and roles."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-xs transition-all active:scale-98 w-full sm:w-auto justify-center"
              >
                <Download className="size-3.5" />
                {lang === "ID" ? "Unduh Template" : "Download Template"}
              </button>
            </div>

            {/* Drag & Drop File Upload Zone */}
            <div 
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverImport(true);
              }}
              onDragLeave={() => {
                setDragOverImport(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverImport(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  readFileContent(file);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                dragOverImport 
                  ? "border-blue-500 bg-blue-50/50" 
                  : "border-slate-200 hover:border-blue-400 hover:bg-slate-50/30"
              }`}
            >
              <Upload className="mx-auto size-7 text-slate-400 mb-2 animate-bounce" />
              <p className="text-xs font-bold text-slate-700 mb-1">
                {lang === "ID" 
                  ? "Seret & Taruh File Excel/CSV Anda Di Sini" 
                  : "Drag & Drop Your Excel/CSV File Here"}
              </p>
              <p className="text-[10px] text-slate-400 mb-3">
                {lang === "ID" ? "Sistem akan membaca file Anda secara otomatis" : "System will parse and load your file automatically"}
              </p>
              <label className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs inline-block transition-colors">
                {lang === "ID" ? "Pilih File" : "Choose File"}
                <input 
                  type="file" 
                  accept=".csv,.txt" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                />
              </label>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                {lang === "ID" 
                  ? "Atau salin dan tempel baris data dari spreadsheet Anda ke kolom di bawah ini. Kolom header akan dideteksi secara otomatis."
                  : "Or copy and paste columns from spreadsheet below. Column headers are automatically detected."}
              </p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 font-mono text-[10.5px]">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[9px] mb-1">
                  {lang === "ID" ? "Format Judul Kolom (Header Template)" : "Column Headers Template"}
                </div>
                <div>Tipe | Nama | Induk | Deskripsi | Lead / Pemegang | Akuntabilitas</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-slate-700 font-bold text-xs">
                {lang === "ID" ? "Data Struktur Mentah (Raw CSV / Paste)" : "Raw Structure Data (Raw CSV / Paste)"}
              </label>
              <textarea
                rows={4}
                value={importRawText}
                disabled={isImporting}
                onChange={(e) => {
                  const val = e.target.value;
                  setImportRawText(val);
                  const parsed = parseImportText(val);
                  setImportParsedRows(parsed);
                }}
                placeholder={
                  lang === "ID"
                    ? "Tipe\tNama\tInduk\tDeskripsi\tLead / Pemegang\tAkuntabilitas\ncircle\tDivisi Sales\tAnchor Circle (GCC)\tMengurus pemasaran..."
                    : "Tipe\tNama\tInduk\tDeskripsi\tLead / Pemegang\tAkuntabilitas"
                }
                className="w-full font-mono text-[11px] p-3 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50 focus:bg-white transition-all resize-y"
              />
            </div>

            {/* Parsing Validation / Live Preview */}
            {importParsedRows.length > 0 && (
              <div className="space-y-2 max-h-[220px] overflow-y-auto border border-slate-150 rounded-xl p-3 bg-slate-50/30">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="font-extrabold text-xs text-slate-755 uppercase tracking-wide">
                    {lang === "ID" ? "Pratinjau Data Terdeteksi" : "Detected Data Preview"}
                  </span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {importParsedRows.length} {lang === "ID" ? "Baris" : "Rows"}
                  </span>
                </div>
                <div className="divide-y divide-slate-100 text-[11px]">
                  {importParsedRows.map((row, idx) => (
                    <div key={row.id || idx} className="py-2 flex items-start gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold shrink-0 ${
                        row.type === "circle" 
                          ? "bg-purple-100 text-purple-800" 
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {row.type === "circle" ? "Circle" : "Role"}
                      </span>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="font-bold text-slate-800 truncate">{row.name}</div>
                        <div className="text-slate-500 flex items-center gap-1.5 truncate">
                          {row.parent && (
                            <>
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1 rounded">
                                {lang === "ID" ? "Induk:" : "Parent:"} {row.parent}
                              </span>
                            </>
                          )}
                          {row.leadOrMember && (
                            <span className="font-mono text-[10px] bg-blue-50 text-blue-700 px-1 rounded truncate">
                              👤 {row.leadOrMember}
                            </span>
                          )}
                        </div>
                        {row.accountabilities && row.accountabilities.length > 0 && (
                          <div className="text-slate-450 text-[10px] truncate">
                            🎯 {row.accountabilities.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isImporting && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                <div className="size-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
                <div className="text-xs text-blue-800">
                  <span className="font-bold block">{lang === "ID" ? "Sedang Memproses Impor Data" : "Processing Structural Data Import"}</span>
                  <p className="text-[11px] text-blue-600 mt-0.5">{importProgress}</p>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isImporting}
                onClick={() => {
                  setShowImportModal(false);
                  setImportRawText("");
                  setImportParsedRows([]);
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-bold text-xs transition-colors"
              >
                {lang === "ID" ? "Batal" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={importParsedRows.length === 0 || isImporting}
                onClick={handleImportSubmit}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-bold text-xs text-white shadow-sm transition-colors ${
                  importParsedRows.length === 0 || isImporting
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 active:scale-98"
                }`}
              >
                <Check className="size-4" />
                {lang === "ID" ? "Impor Sekarang" : "Import Now"}
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}
