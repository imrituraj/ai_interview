import { useState, useCallback } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { LiveKitInterview } from './components/LiveKitInterview';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, BrainCircuit, Code2, Loader2 } from 'lucide-react';

// ─── Landing Screen ───────────────────────────────────────────────────────────
function LandingScreen({ onStart }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const username = name.trim() || 'candidate';
      const roomId = `interview-${Math.random().toString(36).substring(2, 9)}`;
      const res = await fetch(`/api/token?room=${roomId}&username=${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error(`Token server error: ${res.status}`);
      const data = await res.json();
      onStart(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      {/* Glow blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md px-8 py-12 rounded-3xl bg-slate-800/50 backdrop-blur-xl border border-slate-700 shadow-2xl text-center"
      >
        {/* Logo / Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.2)]">
            <BrainCircuit className="w-10 h-10 text-cyan-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Echo Interview AI</h1>
        <p className="text-slate-400 text-sm mb-8">
          Your 20-minute technical mock interview with <span className="text-cyan-400 font-medium">Ruth</span>, Senior Staff Engineer.
        </p>

        {/* Feature pills */}
        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          {[
            { icon: <Mic className="w-3 h-3" />, label: 'Voice-to-Voice' },
            { icon: <BrainCircuit className="w-3 h-3" />, label: 'Gemini AI' },
            { icon: <Code2 className="w-3 h-3" />, label: 'Live Code Exec' },
          ].map(({ icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700/60 border border-slate-600 text-slate-300 text-xs">
              {icon}{label}
            </span>
          ))}
        </div>

        {/* Name input */}
        <input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && handleStart()}
          className="w-full mb-4 px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/30 transition-all"
        />

        {error && (
          <p className="mb-4 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
            ⚠️ {error}
          </p>
        )}

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
          ) : (
            <><Mic className="w-4 h-4" /> Start Interview with Ruth</>
          )}
        </button>

        <p className="mt-4 text-slate-600 text-xs">
          Allow microphone access when prompted
        </p>
      </motion.div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null); // { token, url, room }

  const handleStart = useCallback((data) => setSession(data), []);
  const handleLeave = useCallback(() => setSession(null), []);

  return (
    <AnimatePresence mode="wait">
      {!session ? (
        <motion.div key="landing" exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.3 }}>
          <LandingScreen onStart={handleStart} />
        </motion.div>
      ) : (
        <motion.div key="interview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <LiveKitRoom
            token={session.token}
            serverUrl={session.url}
            connect={true}
            audio={true}
            video={false}
          >
            <LiveKitInterview onLeave={handleLeave} />
          </LiveKitRoom>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
