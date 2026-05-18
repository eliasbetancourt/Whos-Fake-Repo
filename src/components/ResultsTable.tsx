import React, { useState } from "react";

interface ResultsTableProps {
  results: any;
}

const toAbsoluteUrl = (url: string): string => {
  if (!url) return '#';
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
};

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const [unfollowersList, setUnfollowersList] = useState(results.unfollowers);

  const handleRemoveUser = (index: number) => {
    setUnfollowersList((prev: any[]) => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{ marginTop: '3vw' }}>
      <p style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', marginBottom: '1.5vw' }}>
        ⚠️ Broken links may be due to a changed username or a deactivated/deleted account.
      </p>
      <h3>Analysis Results</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2vw', marginBottom: '2vw' }}>
        <div style={{ textAlign: 'center', padding: '2vw', background: '#f8fafc', borderRadius: 12 }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{results.summary.totalFollowing - (results.summary.unfollowers - unfollowersList.length)}</div>
          <div style={{ color: '#666' }}>Following</div>
        </div>
        <div style={{ textAlign: 'center', padding: '2vw', background: '#f8fafc', borderRadius: 12 }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6d64e8' }}>{results.summary.totalFollowers}</div>
          <div style={{ color: '#666' }}>Followers</div>
        </div>
        <div style={{ textAlign: 'center', padding: '2vw', background: '#f8fafc', borderRadius: 12 }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{unfollowersList.length}</div>
          <div style={{ color: '#666' }}>Unfollowers</div>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2vw', background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr>
            <th style={{ padding: 15, textAlign: 'left', background: '#f8fafc', fontWeight: 600, color: '#374151', verticalAlign: 'middle' }}>Username</th>
            <th style={{ padding: 15, textAlign: 'left', background: '#f8fafc', fontWeight: 600, color: '#374151', verticalAlign: 'middle' }}>Following Since</th>
            <th style={{ padding: 15, textAlign: 'center', background: '#f8fafc', fontWeight: 600, color: '#374151', verticalAlign: 'middle' }}>Unfollow?</th>
            <th style={{ padding: 15, textAlign: 'center', background: '#f8fafc', fontWeight: 600, color: '#374151', verticalAlign: 'middle' }}>Remove</th>
          </tr>
        </thead>
        <tbody>
          {unfollowersList.map((user: any, index: number) => {
            // Format timestamp if available
            let since = '-';
            if (user.timestamp) {
              const date = new Date(user.timestamp * 1000);
              since = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            }

            // Use the username directly - it should always exist if data is processed correctly
            const displayUsername = user.username || `Missing_${index}`;
            const profileHref = toAbsoluteUrl(user.profileUrl);

            return (
              <tr key={user.username || index}>
                <td style={{ padding: 15, borderBottom: '1px solid #e5e7eb', background: 'white', color: '#3b82f6', fontWeight: 600, verticalAlign: 'middle', textAlign: 'left' }}>
                  <a href={profileHref} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>@{displayUsername}</a>
                </td>
                <td style={{ padding: 15, borderBottom: '1px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: '1rem', verticalAlign: 'middle', textAlign: 'left' }}>
                  {since}
                </td>
                <td style={{ padding: 15, borderBottom: '1px solid #e5e7eb', background: 'white', textAlign: 'center', verticalAlign: 'middle' }}>
                  <a href={profileHref} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                    <img src="/cracked_following_button.png" alt="Unfollow" style={{ height: 44, width: 'auto', verticalAlign: 'middle', cursor: 'pointer' }} />
                  </a>
                </td>
                <td style={{ padding: 15, borderBottom: '1px solid #e5e7eb', background: 'white', textAlign: 'center', verticalAlign: 'middle' }}>
                  <img
                    src="/remove_button2.png"
                    alt="Remove"
                    onClick={() => handleRemoveUser(index)}
                    style={{ height: 44, width: 'auto', verticalAlign: 'middle', cursor: 'pointer', backgroundColor: 'transparent', mixBlendMode: 'multiply' }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
