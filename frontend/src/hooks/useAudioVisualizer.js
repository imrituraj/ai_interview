import { useState, useEffect, useRef } from 'react';

// For demonstration, we'll mock the volume if no real stream is provided
export const useAudioVisualizer = (mock = true) => {
  const [volume, setVolume] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!mock) return;

    // Mock an audio visualizer driving the volume up and down randomly when "speaking"
    const mockAudioTick = () => {
      if (isSpeaking) {
        // Generate a random volume between 0.1 and 0.5
        setVolume(Math.random() * 0.4 + 0.1);
      } else {
        // Smoothly decay volume to 0
        setVolume((v) => Math.max(0, v - 0.05));
      }
      animationRef.current = requestAnimationFrame(mockAudioTick);
    };

    animationRef.current = requestAnimationFrame(mockAudioTick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mock, isSpeaking]);

  const toggleSpeaking = () => setIsSpeaking((prev) => !prev);

  return { volume, isSpeaking, toggleSpeaking };
};
