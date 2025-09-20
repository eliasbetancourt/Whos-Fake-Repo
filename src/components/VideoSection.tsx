import React, { useState } from "react";

export default function VideoSection() {
  const [mode, setMode] = useState<'browser' | 'mobile'>('browser');
  const browserVideoUrl = "https://www.youtube.com/embed/4eh8eJAUEdk";
  const mobileVideoUrl = "https://www.youtube.com/embed/EJGduqb2zx4";

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      margin: '40px 0',
      width: '100%',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 28,
        boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
        padding: '48px 40px 32px 40px',
        maxWidth: '720px',
        width: '98%',
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <h2 style={{ fontWeight: 700, fontSize: '2rem', marginBottom: 18 }}>
          {mode === 'browser'
            ? "Instagram Browser Tutorial Video"
            : "Instagram Mobile Tutorial Video"}
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <iframe
            width="600"
            height="340"
            src={mode === 'browser' ? browserVideoUrl : mobileVideoUrl}
            title="Tutorial Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
          />
        </div>
        {/* Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <button
            onClick={() => setMode('browser')}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: mode === 'browser' ? '2px solid #764ba2' : '2px solid #e0e7ff',
              background: mode === 'browser' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8faff',
              color: mode === 'browser' ? 'white' : '#333',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Browser
          </button>
          <button
            onClick={() => setMode('mobile')}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: mode === 'mobile' ? '2px solid #764ba2' : '2px solid #e0e7ff',
              background: mode === 'mobile' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8faff',
              color: mode === 'mobile' ? 'white' : '#333',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Mobile
          </button>
        </div>
      </div>
    </div>
  );
}