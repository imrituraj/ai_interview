import { BrainCircuit, Clock } from 'lucide-react';

export const InterviewProgressCard = ({ agentState = 'connecting' }) => {
  const stageMap = {
    GREETING: 1, RESUME_SCAN: 2, CODING_TASK: 3, FEEDBACK: 4,
  };
  return (
    <div className="w-80 p-6 rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
      <h3 className="text-cyan-400 font-semibold tracking-widest text-xs mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" /> INTERVIEW PROGRESS (85%)
      </h3>
      <div className="space-y-2 text-sm text-slate-300">
        <p>Active Session: <span className="text-white">Round 3/4</span></p>
        <p>Question <span className="text-white">14 of 16</span></p>
        <p>Duration: <span className="text-white">24:18</span></p>
      </div>
      
      <div className="mt-6">
        <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-400 w-[85%] shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>Milestones</span>
          <span>High - 14/18</span>
        </div>
      </div>
    </div>
  );
};

export const ConfidenceScoreCard = () => {
  return (
    <div className="w-80 p-6 rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
      <h3 className="text-cyan-400 font-semibold tracking-widest text-xs mb-4 flex items-center gap-2">
        <BrainCircuit className="w-4 h-4" /> CONFIDENCE SCORE: 92%
      </h3>
      <p className="text-xs text-slate-400 mb-6">
        Real-time AI Analysis: Strong articulation, engaged, clear responses
      </p>

      {/* Circular Progress Mockup */}
      <div className="flex justify-center mb-6">
        <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-4 border-slate-700">
          <div className="absolute w-full h-full rounded-full border-4 border-cyan-400 border-t-transparent animate-[spin_3s_linear_infinite]"></div>
          <span className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">92%</span>
        </div>
      </div>

      <div className="space-y-3">
        <MetricBar label="CLARITY" value="95%" />
        <MetricBar label="TONE" value="88%" />
        <MetricBar label="ENGAGEMENT" value="92%" />
        <MetricBar label="EXPERTISE" value="90%" />
      </div>
    </div>
  );
};

const MetricBar = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between text-[10px] text-slate-400 tracking-wider">
      <span>{label}</span>
      <span>{value}</span>
    </div>
    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
      <div className="h-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]" style={{ width: value }}></div>
    </div>
  </div>
);
