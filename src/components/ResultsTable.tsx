import React from "react";

interface ResultsTableProps {
  results: any;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => (
            <div style={{ marginTop: '3vw' }}>
              <h3>Analysis Results</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2vw', marginBottom: '2vw' }}>
                <div style={{ textAlign: 'center', padding: '2vw', background: '#f8fafc', borderRadius: 12 }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{results.summary.totalFollowing}</div>
                  <div style={{ color: '#666' }}>Following</div>
                </div>
                <div style={{ textAlign: 'center', padding: '2vw', background: '#f8fafc', borderRadius: 12 }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6d64e8' }}>{results.summary.totalFollowers}</div>
                  <div style={{ color: '#666' }}>Followers</div>
                </div>
                <div style={{ textAlign: 'center', padding: '2vw', background: '#f8fafc', borderRadius: 12 }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{results.summary.unfollowers}</div>
                  <div style={{ color: '#666' }}>Unfollowers</div>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2vw', background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <thead>
                  <tr>
                    <th style={{ padding: 15, textAlign: 'left', background: '#f8fafc', fontWeight: 600, color: '#374151', verticalAlign: 'middle' }}>Username</th>
                    <th style={{ padding: 15, textAlign: 'left', background: '#f8fafc', fontWeight: 600, color: '#374151', verticalAlign: 'middle' }}>Following Since</th>
                    <th style={{ padding: 15, textAlign: 'center', background: '#f8fafc', fontWeight: 600, color: '#374151', verticalAlign: 'middle' }}>Unfollow?</th>
                  </tr>
                </thead>
                <tbody>
                  {results.unfollowers.map((user: any) => {
                    // Format timestamp if available
                    let since = '-';
                    if (user.timestamp) {
                      const date = new Date(user.timestamp * 1000);
                      since = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                    }
                    return (
                      <tr key={user.username}>
                        <td style={{ padding: 15, borderBottom: '1px solid #e5e7eb', background: 'white', color: '#3b82f6', fontWeight: 600, verticalAlign: 'middle', textAlign: 'left' }}>
                          <a href={user.profileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>@{user.username}</a>
                        </td>
                        <td style={{ padding: 15, borderBottom: '1px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: '1rem', verticalAlign: 'middle', textAlign: 'left' }}>
                          {since}
                        </td>
                        <td style={{ padding: 15, borderBottom: '1px solid #e5e7eb', background: 'white', textAlign: 'center', verticalAlign: 'middle' }}>
                          <a href={user.profileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                            <img src="/cracked_following_button.png" alt="Unfollow" style={{ height: 44, width: 'auto', verticalAlign: 'middle', cursor: 'pointer' }} />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
);

export default ResultsTable;
