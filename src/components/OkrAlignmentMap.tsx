import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Objective, KeyResult, Circle, Role, User, KeyResultAssignee, RoleMember } from "../types";
import { 
  Target, 
  Link as LinkIcon, 
  Crosshair, 
  Users, 
  Sparkles, 
  Settings, 
  CheckCircle,
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle,
  Layers
} from "lucide-react";
import { calculateOkrOverallSummary } from "../utils/okrCalc";

interface OkrAlignmentMapProps {
  objectives: Objective[];
  keyResults: KeyResult[];
  circles: Circle[];
  roles: Role[];
  users: User[];
  keyResultAssignees?: KeyResultAssignee[];
  roleMembers?: RoleMember[];
  systemConfig: any;
  onEditObjective?: (id: string) => void;
  onEditKeyResult?: (id: string) => void;
  onDeleteObjective?: (id: string) => void;
  onDeleteKeyResult?: (id: string) => void;
  onObjectiveUpdated?: (id: string, updatedData: Partial<Objective>) => void;
  onKeyResultUpdated?: (id: string, updatedData: Partial<KeyResult>) => void;
  onAddObjectiveRequest?: (level?: "company" | "circle") => void;
  onAddKeyResultRequest?: (objectiveId: string) => void;
}

export const OkrAlignmentMap: React.FC<OkrAlignmentMapProps> = ({
  objectives,
  keyResults,
  circles,
  roles,
  users,
  keyResultAssignees = [],
  roleMembers = [],
  systemConfig,
  onEditObjective,
  onEditKeyResult,
  onDeleteObjective,
  onDeleteKeyResult,
  onAddObjectiveRequest,
  onAddKeyResultRequest
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<{ id: string; d: string; color: string }[]>([]);

  // Split Objectives by level
  const companyObjectives = objectives.filter(o => o.level === "company");
  const circleObjectives = objectives.filter(o => o.level === "circle");

  // Recalculate lines
  useLayoutEffect(() => {
    const updateLines = () => {
      if (!canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const newConnections: { id: string; d: string; color: string }[] = [];

      // Draw lines for Circle Objectives to their parent (Objective or KR)
      circleObjectives.forEach((childObj, i) => {
        if (!childObj.parentId) return;
        // Try to find parent as either Objective or KeyResult
        let parentEl = document.getElementById(`okr-node-${childObj.parentId}`);
        if (!parentEl) {
           parentEl = document.getElementById(`okr-node-${childObj.parentId}`); // Also check KR id
        }
        
        const childEl = document.getElementById(`okr-node-${childObj.id}`);
        
        if (parentEl && childEl) {
          const pRect = parentEl.getBoundingClientRect();
          const cRect = childEl.getBoundingClientRect();
          
          const startX = pRect.right - canvasRect.left;
          const startY = pRect.top + pRect.height / 2 - canvasRect.top;
          
          const endX = cRect.left - canvasRect.left;
          const endY = cRect.top + cRect.height / 2 - canvasRect.top;
          
          const curveOffset = Math.abs(endX - startX) / 2;
          const d = `M ${startX} ${startY} C ${startX + curveOffset} ${startY}, ${endX - curveOffset} ${endY}, ${endX} ${endY}`;
          
          // Generate a varied color based on index to avoid confusion
          const colors = ["#818cf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#2dd4bf"];
          const color = colors[i % colors.length];
          
          newConnections.push({ id: `${childObj.parentId}-${childObj.id}`, d, color });
        }
      });
      setConnections(newConnections);
    };

    const timer = setTimeout(updateLines, 100);
    window.addEventListener("resize", updateLines);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateLines);
    };
  }, [objectives, keyResults]);

  const renderOkrCard = (obj: Objective) => {
    const objKrs = keyResults.filter(k => k.objectiveId === obj.id);
    const summary = calculateOkrOverallSummary(objKrs);
    const progress = Math.round((summary.averageScore || 0) * 100);
    const circle = circles.find(c => c.id === obj.circleId);
    
    // Determine the owner label for the Objective
    let objOwnerName = "";
    if (obj.level === "circle" && circle) {
      if (circle.leadId) {
        const leadUser = users.find(u => u.id === circle.leadId);
        objOwnerName = leadUser?.name || "Lead";
      } else {
        objOwnerName = circle.name;
      }
    } else if (obj.level === "company") {
      objOwnerName = "Top Management";
    }

    return (
      <div 
        key={obj.id} 
        id={`okr-node-${obj.id}`}
        className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative group"
      >
        {/* Card Header: Objective */}
        <div className="flex justify-between items-start mb-2 gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${obj.level === "company" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"}`}>
                {obj.level === "company" ? "Company" : (circle?.name || "Circle")}
              </span>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">
                {obj.targetQuarter}
              </span>
              {objOwnerName && (
                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Users className="size-2.5" />
                  {objOwnerName}
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm leading-snug">{obj.title}</h3>
          </div>
          
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {onEditObjective && (
              <button onClick={(e) => { e.stopPropagation(); onEditObjective(obj.id); }} className="p-1 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded" title="Edit Objective">
                <Sparkles className="size-3" />
              </button>
            )}
            {onDeleteObjective && (
              <button onClick={(e) => { e.stopPropagation(); if(window.confirm(`Hapus Objective: ${obj.title}?`)) onDeleteObjective(obj.id); }} className="p-1 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded" title="Delete Objective">
                <Crosshair className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* Objective Progress */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${progress >= 100 ? 'bg-emerald-500' : progress >= 70 ? 'bg-teal-500' : progress >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border shrink-0 ${progress >= 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : progress >= 70 ? 'bg-teal-50 text-teal-700 border-teal-200' : progress >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
            {progress}%
          </span>
        </div>

        {/* Key Results List */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1">
              <Target className="size-3" /> Key Results ({objKrs.length})
            </h4>
            {onAddKeyResultRequest && (
              <button onClick={(e) => { e.stopPropagation(); onAddKeyResultRequest(obj.id); }} className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 z-10 relative">
                + Add KR
              </button>
            )}
          </div>
          
          {objKrs.map(kr => {
            const assignees = keyResultAssignees.filter(a => a.keyResultId === kr.id);
            const assigneeNames = assignees.map(a => {
              if (a.roleId) {
                const role = roles.find(r => r.id === a.roleId);
                const rm = roleMembers.find(m => m.roleId === role?.id);
                const user = users.find(u => u.id === rm?.userId);
                return user?.name || role?.name || "Unassigned";
              }
              return "Unassigned";
            }).join(", ");

            return (
              <div key={kr.id} id={`okr-node-${kr.id}`} className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 relative group/kr">
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <div className="flex-1">
                    <h5 className="text-[11px] font-bold text-slate-700 leading-tight mb-1">{kr.title}</h5>
                    <div className="flex flex-wrap gap-1">
                      {assigneeNames && (
                        <span className="text-[8px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded truncate max-w-[120px]" title={assigneeNames}>
                          👤 {assigneeNames}
                        </span>
                      )}
                      {kr.alignmentType === "dependency" && (
                        <span className="text-[8px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-bold uppercase" title="Dependency KR">Dep</span>
                      )}
                      {kr.isShared && (
                        <span className="text-[8px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded font-bold uppercase" title="Shared KR">Shared</span>
                      )}
                      {!kr.isShared && kr.alignmentType !== "dependency" && (
                        <span className="text-[8px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-bold uppercase" title="Personal / Standard KR">Personal</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border shrink-0 ${kr.progress >= 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : kr.progress >= 70 ? 'bg-teal-50 text-teal-700 border-teal-200' : kr.progress >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                      {kr.progress}%
                    </span>
                  </div>
                </div>
                
                {/* KR Progress bar */}
                <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden mb-1">
                  <div className={`h-full ${kr.progress >= 100 ? 'bg-emerald-500' : kr.progress >= 70 ? 'bg-teal-500' : kr.progress >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(kr.progress, 100)}%` }} />
                </div>

                {/* Action buttons overlay for KR */}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/kr:opacity-100 transition-opacity z-10">
                  {onEditKeyResult && (
                    <button onClick={(e) => { e.stopPropagation(); onEditKeyResult(kr.id); }} className="p-0.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded" title="Edit KR">
                      <Sparkles className="size-2.5" />
                    </button>
                  )}
                  {onDeleteKeyResult && (
                    <button onClick={(e) => { e.stopPropagation(); if(window.confirm(`Hapus KR: ${kr.title}?`)) onDeleteKeyResult(kr.id); }} className="p-0.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded" title="Delete KR">
                      <Crosshair className="size-2.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Controls */}
      <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <Layers className="size-5 text-indigo-600" />
          <h2 className="text-lg font-extrabold text-slate-800">Peta Keselarasan (Alignment Map)</h2>
        </div>
        <div className="flex items-center gap-3">
          {onAddObjectiveRequest && (
            <>
              <button 
                onClick={() => onAddObjectiveRequest("company")}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors"
              >
                + Objective Korporat
              </button>
              <button 
                onClick={() => onAddObjectiveRequest("circle")}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
              >
                + Objective Dept
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div 
        ref={canvasRef}
        className="flex-1 relative border border-slate-200/80 bg-slate-50 rounded-2xl p-8 overflow-auto min-h-[600px] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]"
      >
        <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
          <defs>
            {connections.map((conn, idx) => (
              <marker
                key={`arrow-${conn.id}`}
                id={`arrow-${conn.id}`}
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill={conn.color} />
              </marker>
            ))}
          </defs>
          {connections.map((conn) => (
            <path
              key={conn.id}
              d={conn.d}
              fill="none"
              stroke={conn.color}
              strokeWidth="3"
              markerEnd={`url(#arrow-${conn.id})`}
              className="opacity-70"
            />
          ))}
        </svg>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10 min-w-[800px]">
          {/* Column 1: Company Objectives */}
          <div className="space-y-6">
            <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">
              Company OKRs
            </h2>
            {companyObjectives.length === 0 && (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-bold">
                Belum ada Objective Korporat.
              </div>
            )}
            {companyObjectives.map(renderOkrCard)}
          </div>

          {/* Column 2: Circle Objectives */}
          <div className="space-y-6">
            <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">
              Department / Circle OKRs
            </h2>
            {circleObjectives.length === 0 && (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-bold">
                Belum ada Objective Departemen.
              </div>
            )}
            {circleObjectives.map(renderOkrCard)}
          </div>
        </div>
      </div>
    </div>
  );
};
