

import { howToSteps, howToStepsMobile } from './howToStepsData';
import React, { useState, useEffect } from 'react';

const HowToSteps: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    function updateColumns() {
      const width = window.innerWidth;
      if (width < 600) setColumns(1);
      else if (width < 900) setColumns(2);
      else if (width < 1200) setColumns(3);
      else setColumns(4);
    }
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const steps = isMobile ? howToStepsMobile : howToSteps;

  // Calculate grid rows and center last row
  const rows = [];
  for (let i = 0; i < steps.length; i += columns) {
    rows.push(steps.slice(i, i + columns));
  }

  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '3vw', marginTop: '3vw', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#333', fontSize: '2rem', marginBottom: '2vw', textAlign: 'center' }}>How to Get Your Instagram Data</h2>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2vw' }}>
        <button
          style={{
            background: isMobile ? '#764ba2' : '#e0e7ff',
            color: isMobile ? 'white' : '#333',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontWeight: 600,
            marginRight: 10,
            cursor: 'pointer',
            boxShadow: isMobile ? '0 2px 8px rgba(102,126,234,0.08)' : undefined
          }}
          onClick={() => setIsMobile(true)}
        >Mobile</button>
        <button
          style={{
            background: !isMobile ? '#764ba2' : '#e0e7ff',
            color: !isMobile ? 'white' : '#333',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: !isMobile ? '0 2px 8px rgba(102,126,234,0.08)' : undefined
          }}
          onClick={() => setIsMobile(false)}
        >Browser</button>
      </div>
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${row.length}, 1fr)`,
            gap: '2vw',
            justifyContent: 'center',
            marginBottom: '2vw',
          }}
        >
          {row.map((step, idx) => (
            <div key={idx} style={{ textAlign: 'center', padding: '1.5vw' }}>
              <div style={{ margin: '0 auto 1vw', width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '50%', fontSize: rowIdx * columns + idx === steps.length - 1 ? '2rem' : '1.5rem', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(102,126,234,0.08)' }}>
                {rowIdx * columns + idx === steps.length - 1 ? '⚡️' : rowIdx * columns + idx + 1}
              </div>
              <h3 style={{ color: '#333', marginBottom: 10, fontSize: '1.2rem' }}>{step.title}</h3>
              <p style={{ color: '#666', fontSize: '0.95rem' }}>{step.text}</p>
            </div>
          ))}
        </div>
      ))}
      {/* Video section (future): YouTube video with optional ad */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2vw' }}>
        {/* TODO: In the future, embed a 15s ad video here, then show the YouTube video below */}
        {/* Example placeholder: */}
        {/* <div style={{ marginBottom: 16, color: '#888' }}>[Ad will play here before the main video]</div> */}
        {/* <iframe width="400" height="225" src="https://www.youtube.com/embed/YOUR_VIDEO_ID" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe> */}
        {/* <a href="https://youtu.be/your-video-link" target="_blank" rel="noopener noreferrer">Watch video instructions on YouTube</a> */}
      </div>
    </div>
  );
};

export default HowToSteps;
