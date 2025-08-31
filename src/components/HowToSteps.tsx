import React from "react";

const HowToSteps: React.FC = () => (
    <div style={{ background: 'white', borderRadius: 20, padding: '3vw', marginTop: '3vw', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#333', fontSize: '2rem', marginBottom: '2vw', textAlign: 'center' }}>How to Get Your Instagram Data</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2vw', marginTop: '2vw' }}>
            <div style={{ textAlign: 'center', padding: '1.5vw' }}>
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto 1vw' }}>1</div>
              <h3 style={{ color: '#333', marginBottom: 10, fontSize: '1.2rem' }}>Open Instagram</h3>
              <p style={{ color: '#666', fontSize: '0.95rem' }}>Go to Instagram.com and log into your account</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1.5vw' }}>
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto 1vw' }}>2</div>
              <h3 style={{ color: '#333', marginBottom: 10, fontSize: '1.2rem' }}>Access Settings</h3>
              <p style={{ color: '#666', fontSize: '0.95rem' }}>Click on your profile icon, then go to Settings → Privacy and Security</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1.5vw' }}>
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto 1vw' }}>3</div>
              <h3 style={{ color: '#333', marginBottom: 10, fontSize: '1.2rem' }}>Request Data</h3>
              <p style={{ color: '#666', fontSize: '0.95rem' }}>Select "Download Data" and choose JSON format</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1.5vw' }}>
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto 1vw' }}>4</div>
              <h3 style={{ color: '#333', marginBottom: 10, fontSize: '1.2rem' }}>Download & Upload</h3>
              <p style={{ color: '#666', fontSize: '0.95rem' }}>Download the ZIP file when ready and upload it here</p>
            </div>
          </div>
    </div>
);

export default HowToSteps;
