import React from "react";

interface ProgressBarProps {
  progress: number;
  progressText: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, progressText }) => (
            <div style={{ margin: '2vw 0' }}>
              <div style={{ background: '#e5e7eb', borderRadius: 10, height: 8, overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', height: '100%', width: `${progress}%`, transition: 'width 0.3s' }} />
              </div>
              <div style={{ textAlign: 'center', marginTop: '1vw', color: '#666', fontSize: '0.95rem' }}>{progressText}</div>
            </div>
        )

export default ProgressBar;
