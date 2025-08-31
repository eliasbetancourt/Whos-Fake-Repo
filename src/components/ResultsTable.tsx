import React from "react";

interface ResultsTableProps {
  results: any;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => (
            <div style={{ marginTop: '3vw' }}>
              <h3>Analysis Results</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2vw', marginBottom: '2vw' }}>
                <div style={{ textAlign: 'center', padding: '2vw', background: '#f8fafc', borderRadius: 12 }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{results.summary.unfollowers}</div>
                  <div style={{ color: '#666' }}>Unfollowers</div>
                </div>
                <div style={{ textAlign: 'center', padding: '2vw', background: '#f8fafc', borderRadius: 12 }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{results.summary.newFollowers}</div>
                  <div style={{ color: '#666' }}>New Followers</div>
                </div>
                <div style={{ textAlign: 'center', padding: '2vw', background: '#f8fafc', borderRadius: 12 }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>{results.summary.totalFollowers}</div>
                  <div style={{ color: '#666' }}>Total Followers</div>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2vw', background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <thead>
                  <tr>
                    <th style={{ padding: 15, textAlign: 'left', background: '#f8fafc', fontWeight: 600, color: '#374151' }}>Username</th>
                    <th style={{ padding: 15, textAlign: 'left', background: '#f8fafc', fontWeight: 600, color: '#374151' }}>Display Name</th>
                    <th style={{ padding: 15, textAlign: 'left', background: '#f8fafc', fontWeight: 600, color: '#374151' }}>Status</th>
                    <th style={{ padding: 15, textAlign: 'left', background: '#f8fafc', fontWeight: 600, color: '#374151' }}>Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {results.unfollowers.map((user: any) => (
                    <tr key={user.username}>
                      <td style={{ padding: 15, borderBottom: '1px solid #e5e7eb' }}>@{user.username}</td>
                      <td style={{ padding: 15, borderBottom: '1px solid #e5e7eb' }}>{user.displayName}</td>
                      <td style={{ padding: 15, borderBottom: '1px solid #e5e7eb', color: '#ef4444', fontWeight: 600 }}>{user.status}</td>
                      <td style={{ padding: 15, borderBottom: '1px solid #e5e7eb' }}>{user.lastSeen}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
);

export default ResultsTable;
