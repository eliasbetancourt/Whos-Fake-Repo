
import React, { useEffect, useRef, useState } from "react";

interface ProgressBarProps {
  totalFollowers: number;
  totalFollowing: number;
  progressText: string;
}

const getDuration = (followers: number, following: number) => {
  const total = followers + following;
  // Linear scale: 2s min, 14s max (for 1,000,000+)
  if (total < 500) return 2000;
  if (total > 1000000) return 14000;
  // Scale between 2s and 14s
  return 2000 + ((Math.min(total, 1000000) - 500) / 999500) * 12000;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ totalFollowers, totalFollowing, progressText }) => {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState(progressText);
  const duration = getDuration(totalFollowers, totalFollowing);
  const spottyTimes = useRef<number[]>([]);

  useEffect(() => {
    // Generate 2-3 random 'spotty' jump times
    const jumps = Math.floor(Math.random() * 2) + 2;
    const times: number[] = [];
    for (let i = 0; i < jumps; i++) {
      times.push(Math.random() * duration);
    }
    spottyTimes.current = times.sort((a, b) => a - b);
  }, [duration]);

  useEffect(() => {
    let start: number | null = null;
    let raf: number;
    let spottyIdx = 0;

    // Progress text stages
    const stages = [
      "Extracting followers...",
      "Extracting following...",
      "Finding who's fake...",
      "Finalizing analysis..."
    ];

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      let percent = Math.min((elapsed / duration) * 100, 100);

      // Spotty jumps: if at a spotty time, jump progress forward
      if (spottyIdx < spottyTimes.current.length && elapsed > spottyTimes.current[spottyIdx]) {
        percent += Math.random() * 10; // jump forward by up to 10%
        spottyIdx++;
      }
      percent = Math.min(percent, 100);
      setProgress(percent);

      // Update progress text based on percent
      if (percent < 25) setCurrentText(stages[0]);
      else if (percent < 50) setCurrentText(stages[1]);
      else if (percent < 80) setCurrentText(stages[2]);
      else setCurrentText(stages[3]);

      if (elapsed < duration) {
        raf = requestAnimationFrame(animate);
      } else {
        setProgress(100);
        setCurrentText("Analysis complete!");
        setTimeout(() => {
          // Optionally, you can trigger a callback here if needed
        }, 75);
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  return (
    <div style={{ margin: '2vw 0' }}>
      <div style={{ background: '#e5e7eb', borderRadius: 10, height: 8, overflow: 'hidden' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            height: '100%',
            width: `${progress}%`,
            transition: 'width 0.3s',
          }}
        />
      </div>
      <div style={{ textAlign: 'center', marginTop: '1vw', color: '#666', fontSize: '0.95rem' }}>{currentText}</div>
    </div>
  );
};

export default ProgressBar;
