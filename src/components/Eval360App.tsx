import React, { useState } from "react";
import { User, Circle, Role, SystemConfig } from "../types";
import { Eval360SubmissionForm } from "./Eval360SubmissionForm";
import { MultiRater360Config } from "./MultiRater360Config";
import { ClipboardList, Settings } from "lucide-react";

interface Eval360AppProps {
  currentLoginUserId: string;
  systemConfig: SystemConfig;
  onUpdateSystemConfig: (updates: Partial<SystemConfig>) => void;
  users: User[];
  circles: Circle[];
  roles: Role[];
  eval360Submissions: any[];
  onSubmitEval360: (data: any) => Promise<void>;
  lang: "ID" | "EN";
}

export const Eval360App: React.FC<Eval360AppProps> = ({
  currentLoginUserId,
  systemConfig,
  onUpdateSystemConfig,
  users,
  circles,
  roles,
  eval360Submissions,
  onSubmitEval360,
  lang
}) => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "config">("dashboard");

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="flex justify-center md:justify-start">
        <div className="inline-flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeTab === "dashboard"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            }`}
          >
            <ClipboardList className="size-4" />
            {lang === "ID" ? "Pengisian 360" : "360 Form"}
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeTab === "config"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            }`}
          >
            <Settings className="size-4" />
            {lang === "ID" ? "Konfigurasi 360" : "360 Config"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "dashboard" && (
          <Eval360SubmissionForm
            currentLoginUserId={currentLoginUserId}
            systemConfig={systemConfig}
            onUpdateSystemConfig={onUpdateSystemConfig}
            users={users}
            circles={circles}
            roles={roles}
            eval360Submissions={eval360Submissions}
            onSubmitEval360={onSubmitEval360}
            lang={lang}
          />
        )}

        {activeTab === "config" && (
          <MultiRater360Config
            systemConfig={systemConfig}
            onUpdateSystemConfig={onUpdateSystemConfig}
            users={users}
            circles={circles}
            roles={roles}
            lang={lang}
            eval360Submissions={eval360Submissions}
          />
        )}
      </div>
    </div>
  );
};
