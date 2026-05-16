import { useVoiceAssistant, RoomAudioRenderer, useRoomContext } from '@livekit/components-react';
import { useEffect, useRef, useState } from 'react';
import { VoiceOrb } from './VoiceOrb';
import { InterviewProgressCard, ConfidenceScoreCard } from './DashboardCards';
import { Mic, MicOff, PhoneOff, Activity } from 'lucide-react';
import { Track } from 'livekit-client';

// ─── Hook: extracts real-time volume from the agent's audio track ─────────────
function useAgentVolume(audioTrack) {
  const [volume, setVolume] = useState(0);
  const animRef = useRef(null);
  const ctxRef = useRef(null);

  useEffect(() => {
    const mediaStreamTrack = audioTrack?.publication?.track?.mediaStreamTrack;
    if (!mediaStreamTrack) {
      setVolume(0);
      return;
    }

    const audioCtx = new AudioContext();
    ctxRef.current = audioCtx;
    const stream = new MediaStream([mediaStreamTrack]);
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setVolume(avg / 255);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animRef.current);
      audioCtx.close();
    };
  }, [audioTrack]);

  return volume;
}

// ─── State Badge ──────────────────────────────────────────────────────────────
const STATE_STYLES = {
  connecting:   'bg-slate-700 text-slate-300',
  initializing: 'bg-yellow-500/20 text-yellow-400',
  listening:    'bg-emerald-500/20 text-emerald-400',
  thinking:     'bg-purple-500/20 text-purple-400',
  speaking:     'bg-cyan-500/20 text-cyan-400',
};

// ─── Main component (must be rendered inside <LiveKitRoom>) ───────────────────
export function LiveKitInterview({ onLeave }) {
  const { state: agentState, audioTrack } = useVoiceAssistant();
  const volume = useAgentVolume(audioTrack);
  const isSpeaking = agentState === 'speaking';
  const room = useRoomContext();

  const [micMuted, setMicMuted] = useState(false);

  const toggleMic = async () => {
    const localParticipant = room?.localParticipant;
    if (!localParticipant) return;
    const enabled = localParticipant.isMicrophoneEnabled;
    await localParticipant.setMicrophoneEnabled(!enabled);
    setMicMuted(enabled);
  };

  const handleLeave = async () => {
    await room?.disconnect();
    onLeave();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Render agent audio so the user can hear Ruth */}
      <RoomAudioRenderer />

      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Header */}
      <header className="relative z-10 w-full px-8 py-5 flex items-center justify-between border-b border-slate-800/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Activity className="text-cyan-400 w-5 h-5" />
          <h1 className="text-lg font-medium tracking-wide">Echo <span className="text-slate-400">Interview AI</span></h1>
          <span className="ml-3 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-semibold tracking-widest">
            LIVE
          </span>
        </div>

        {/* Agent state badge */}
        <div className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase transition-all duration-500 ${STATE_STYLES[agentState] || STATE_STYLES.connecting}`}>
          Ruth: {agentState}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMic}
            title={micMuted ? 'Unmute' : 'Mute'}
            className={`p-2.5 rounded-full border transition-all ${micMuted ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-cyan-500/50'}`}
          >
            {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={handleLeave}
            title="End interview"
            className="p-2.5 rounded-full border bg-rose-500/20 border-rose-500/50 text-rose-400 hover:bg-rose-500/30 transition-all"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex flex-col gap-6">
            <InterviewProgressCard agentState={agentState} />
            <div className="w-80 p-6 rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700">
              <h3 className="text-cyan-400 font-semibold tracking-widest text-xs mb-2">CANDIDATE</h3>
              <p className="text-white">You</p>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">INTERVIEWER:</p>
                <p className="text-white">Ruth · Senior Staff Engineer</p>
              </div>
            </div>
          </div>

          {/* Voice Orb center */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-slate-800/50 border-dashed animate-[spin_60s_linear_infinite]" />
              <VoiceOrb isSpeaking={isSpeaking} volume={volume} />
            </div>
            <p className="mt-8 text-slate-500 text-sm tracking-widest uppercase">
              {agentState === 'listening' ? '🎙 Listening to you...' :
               agentState === 'thinking'  ? '💭 Ruth is thinking...' :
               agentState === 'speaking'  ? '🔊 Ruth is speaking...' :
               'Initializing...'}
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <ConfidenceScoreCard />
          </div>
        </div>
      </main>
    </div>
  );
}
