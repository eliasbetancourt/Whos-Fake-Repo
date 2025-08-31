import React from "react";

const Header: React.FC = () => (
        <div style={{ textAlign: 'center', marginBottom: '4vw', paddingTop: '4vw' }}>
          <h1 style={{ color: 'white', fontSize: '3rem', fontWeight: 700, marginBottom: 10, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>WhosFake</h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.2rem', maxWidth: 600, margin: '0 auto' }}>
            Discover who is not following you back on Instagram with complete privacy and security
          </p>
        </div>
);

export default Header;
