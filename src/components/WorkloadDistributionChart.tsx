import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { User, Role, RoleMember, Objective, KeyResult, KeyResultAssignee, Circle } from '../types';

interface WorkloadChartProps {
  users: User[];
  roles: Role[];
  roleMembers: RoleMember[];
  objectives: Objective[];
  keyResults: KeyResult[];
  keyResultAssignees: KeyResultAssignee[];
  circles: Circle[];
  selectedCircleId?: string;
}

export default function WorkloadDistributionChart({
  users, roles, roleMembers, objectives, keyResults, keyResultAssignees, circles, selectedCircleId
}: WorkloadChartProps) {
  
  const chartData = useMemo(() => {
    // Sort quarters based on Year and Q string. Assumes format like "Q1 2026"
    const parseQuarter = (q: string) => {
        const match = q.match(/Q([1-4])\s+(\d{4})/);
        if (match) return parseInt(match[2]) * 10 + parseInt(match[1]);
        return 0;
    };
    
    const quarters = Array.from(new Set(objectives.map(o => o.targetQuarter))).sort((a, b) => {
       return parseQuarter(a) - parseQuarter(b);
    });

    let relevantRoles = roles;
    if (selectedCircleId) {
      const getSubCircles = (parentId: string): string[] => {
        const subs = circles.filter(c => c.subCircleOfId === parentId).map(c => c.id);
        let allSubs = [...subs];
        subs.forEach(s => {
          allSubs = [...allSubs, ...getSubCircles(s)];
        });
        return allSubs;
      };
      const circleIds = [selectedCircleId, ...getSubCircles(selectedCircleId)];
      relevantRoles = roles.filter(r => circleIds.includes(r.circleId));
    }
    const relevantRoleIds = relevantRoles.map(r => r.id);
    
    const relevantUserIds = Array.from(new Set(roleMembers.filter(rm => relevantRoleIds.includes(rm.roleId)).map(rm => rm.userId)));
    const relevantUsers = users.filter(u => relevantUserIds.includes(u.id));

    const data = quarters.map(q => {
      const objIdsInQuarter = objectives.filter(o => o.targetQuarter === q).map(o => o.id);
      const krInQuarter = keyResults.filter(kr => objIdsInQuarter.includes(kr.objectiveId)).map(kr => kr.id);
      
      const qData: any = { name: q };
      
      relevantUsers.forEach(u => {
        const uRoleIds = roleMembers.filter(rm => rm.userId === u.id && relevantRoleIds.includes(rm.roleId)).map(rm => rm.roleId);
        let totalWeight = 0;
        
        krInQuarter.forEach(krId => {
          const assignees = keyResultAssignees.filter(a => a.keyResultId === krId);
          assignees.forEach(a => {
            if (a.roleId && uRoleIds.includes(a.roleId)) {
              totalWeight += a.weightPercentage || 0;
            } else if (a.circleId && relevantRoles.some(r => r.circleId === a.circleId)) {
               const userInCircle = uRoleIds.some(rid => roles.find(r => r.id === rid)?.circleId === a.circleId);
               if (userInCircle) {
                  // Distribute evenly among members in that circle?
                  // To keep it simple, we just add the weight directly to the user's workload score
                  totalWeight += a.weightPercentage || 0;
               }
            }
          });
        });
        
        qData[u.name] = totalWeight;
      });
      
      return qData;
    });

    return { data, users: relevantUsers };
  }, [users, roles, roleMembers, objectives, keyResults, keyResultAssignees, circles, selectedCircleId]);

  const colors = [
    "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", 
    "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"
  ];

  return (
    <div className="w-full h-80">
      {chartData.data.length === 0 ? (
        <div className="flex items-center justify-center h-full text-sm text-slate-500">
          Tidak ada data untuk divisualisasikan.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData.data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            {chartData.users.map((u, i) => (
              <Bar key={u.id} dataKey={u.name} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
