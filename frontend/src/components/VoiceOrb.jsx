import { motion } from 'framer-motion';

export const VoiceOrb = ({ isSpeaking, volume }) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Glow Ring */}
      <motion.div
        animate={{
          scale: isSpeaking ? [1, 1.2 + volume, 1] : 1,
          opacity: isSpeaking ? [0.3, 0.6, 0.3] : 0.2,
        }}
        transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
        className="absolute w-64 h-64 rounded-full border border-cyan-500/30 bg-cyan-500/10 blur-xl"
      />
      
      {/* The Glassmorphism Sphere */}
      <motion.div
        animate={{
          scale: isSpeaking ? [1, 1.1 + volume * 0.5, 1] : 1,
          boxShadow: isSpeaking 
            ? `0px 0px ${20 + volume * 100}px rgba(6, 182, 212, 0.8)` 
            : "0px 0px 10px rgba(6, 182, 212, 0.2)",
        }}
        transition={{ repeat: Infinity, duration: 0.15, ease: "linear" }}
        className="relative z-10 w-48 h-48 rounded-full bg-gradient-to-tr from-cyan-900 to-cyan-400 backdrop-blur-md flex items-center justify-center border border-white/20"
      >
        {/* Inner core */}
        <div className="w-full h-full rounded-full bg-gradient-to-b from-transparent to-black/40 absolute inset-0 mix-blend-overlay"></div>
      </motion.div>
    </div>
  );
};
