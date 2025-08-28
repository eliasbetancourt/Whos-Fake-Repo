
import React, { useRef, useState } from "react";

// Utility for formatting file sizes
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const supportedTypes = ['.zip', '.json'];

export default function WhosFakeApp() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [warning, setWarning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [results, setResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File selection and drag/drop handlers
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    // Filter out .DS_Store files
    const newFiles = Array.from(files).filter(f => f.name !== '.DS_Store');
    setSelectedFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...newFiles.filter(f => !names.has(f.name))];
    });
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };
  // Recursively read directory entries (Chromium only)
  const getAllFilesFromDataTransferItems = async (items: DataTransferItemList): Promise<File[]> => {
    const files: File[] = [];
    const traverseFileTree = async (item: any, path = "") => {
      if (item.isFile) {
        await new Promise<void>(resolve => {
          item.file((file: File) => {
            // Attach relativePath for display if available
            if (path) Object.defineProperty(file, 'webkitRelativePath', { value: path + file.name });
            files.push(file);
            resolve();
          });
        });
      } else if (item.isDirectory) {
        const dirReader = item.createReader();
        await new Promise<void>((resolve, reject) => {
          const readEntries = () => {
            dirReader.readEntries(async (entries: any[]) => {
              if (!entries.length) {
                resolve();
                return;
              }
              for (const entry of entries) {
                await traverseFileTree(entry, path + item.name + "/");
              }
              readEntries();
            });
          };
          readEntries();
        });
      }
    };
    const entries: any[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
      if (entry) entries.push(entry);
    }
    for (const entry of entries) {
      await traverseFileTree(entry);
    }
    return files;
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // Prefer advanced folder support if available
    const items = e.dataTransfer.items;
    if (items && items.length && items[0].webkitGetAsEntry) {
      const allFiles = await getAllFilesFromDataTransferItems(items);
      handleFileSelect({ length: allFiles.length, ...allFiles } as FileList);
    } else {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Validation
  const hasUnsupported = selectedFiles.some(
    file => !supportedTypes.some(type => file.name.toLowerCase().endsWith(type))
  );

  // Processing simulation (replace with real logic)
  const handleProcess = async () => {
    setProcessing(true);
    setProgress(0);
    setProgressText('Reading files...');
    const steps = [
      { progress: 20, text: 'Reading files...' },
      { progress: 40, text: 'Parsing Instagram data...' },
      { progress: 60, text: 'Analyzing followers...' },
      { progress: 80, text: 'Detecting unfollowers...' },
      { progress: 100, text: 'Analysis complete!' }
    ];
    for (const step of steps) {
      await new Promise(res => setTimeout(res, 800));
      setProgress(step.progress);
      setProgressText(step.text);
    }
    // Mock results
    setTimeout(() => {
      setResults({
        summary: {
          totalFollowers: 847,
          totalFollowing: 923,
          unfollowers: 23,
          newFollowers: 12
        },
        unfollowers: [
          { username: 'john_doe_123', displayName: 'John Doe', status: 'Unfollowed', lastSeen: '2 days ago' },
          { username: 'jane_smith', displayName: 'Jane Smith', status: 'Unfollowed', lastSeen: '1 week ago' },
          { username: 'mike_wilson', displayName: 'Mike Wilson', status: 'Unfollowed', lastSeen: '3 days ago' }
        ]
      });
      setProcessing(false);
    }, 500);
  };

  // UI
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', color: '#333', width: '100vw', minWidth: 0 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2vw', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '4vw', paddingTop: '4vw' }}>
          <h1 style={{ color: 'white', fontSize: '3rem', fontWeight: 700, marginBottom: 10, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>WhosFake</h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.2rem', maxWidth: 600, margin: '0 auto' }}>
            Discover who unfollowed you on Instagram with complete privacy and security
          </p>
        </div>
  <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', padding: '4vw 2vw', margin: '4vw auto', maxWidth: 800, minWidth: 0, width: '100%', textAlign: 'center', boxSizing: 'border-box' }}>
          <div
            style={{ border: '3px dashed #e0e7ff', borderRadius: 16, padding: '4vw 2vw', margin: '2vw 0', background: dragOver ? '#e0e7ff' : '#f8faff', cursor: 'pointer', transition: 'all 0.3s', position: 'relative', minWidth: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ fontSize: '4rem', color: '#667eea', marginBottom: 20 }}>📁</div>
            <div>
              <h3 style={{ fontSize: '1.8rem', color: '#333', marginBottom: 10, fontWeight: 600 }}>Upload Your Instagram Data</h3>
              <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: 20 }}>Drag and drop your Instagram ZIP file here, or click to browse</p>
              <button className="choose-files-btn" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', padding: '16px 32px', borderRadius: 12, fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' }} onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>Choose Files</button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,.json"
                multiple
                style={{ display: 'none' }}
                // @ts-ignore
                webkitdirectory="true"
                directory="true"
                onChange={e => handleFileSelect(e.target.files)}
              />
            </div>
          </div>
          <div style={{ background: '#f0f9ff', border: '1px solid #e0f2fe', borderRadius: 12, padding: '2vw', margin: '2vw 0', display: 'flex', alignItems: 'center', gap: 15, flexWrap: 'wrap' }}>
            <div style={{ fontSize: '2rem', color: '#0ea5e9' }}>🔒</div>
            <div style={{ textAlign: 'left' }}>
              <h4 style={{ color: '#0c4a6e', marginBottom: 5, fontWeight: 600 }}>100% Private & Secure</h4>
              <p style={{ color: '#0369a1', fontSize: '0.95rem' }}>All processing happens on your device. No files are uploaded to our servers.</p>
            </div>
          </div>
          {selectedFiles.length > 0 && (
            <div style={{ margin: '2vw 0', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3>Selected Files</h3>
                <button
                  style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 16px', fontSize: '0.95rem', cursor: 'pointer', color: '#dc2626', borderColor: '#fecaca', fontWeight: 600 }}
                  onClick={() => setSelectedFiles([])}
                >Remove All</button>
              </div>
              {selectedFiles.map((file, idx) => {
                const isSupported = supportedTypes.some(type => file.name.toLowerCase().endsWith(type));
                return (
                  <div key={file.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1vw', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: '0.5vw', background: isSupported ? 'white' : '#fef2f2', borderColor: isSupported ? '#e5e7eb' : '#fecaca', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.2rem' }}>{isSupported ? '📄' : '❌'}</span>
                      <span>{file.name}</span>
                      <span style={{ color: '#666', fontSize: '0.85rem' }}>({formatFileSize(file.size)})</span>
                    </div>
                    <div>
                      <button style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => handleRemoveFile(idx)}>Remove</button>
                    </div>
                  </div>
                );
              })}
              <button
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', padding: '1.2vw 3vw', borderRadius: 12, fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', marginTop: '1vw', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)', opacity: hasUnsupported ? 0.5 : 1 }}
                disabled={hasUnsupported}
                onClick={handleProcess}
              >Continue Processing</button>
              {hasUnsupported && (
                <div style={{ background: '#fef3cd', border: '1px solid #fde68a', borderRadius: 8, padding: '1vw', margin: '1vw 0', color: '#92400e' }}>
                  <span style={{ marginRight: 10 }}>⚠️</span>Some files are not supported. Please remove them before continuing.
                </div>
              )}
            </div>
          )}
          {processing && (
            <div style={{ margin: '2vw 0' }}>
              <div style={{ background: '#e5e7eb', borderRadius: 10, height: 8, overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', height: '100%', width: `${progress}%`, transition: 'width 0.3s' }} />
              </div>
              <div style={{ textAlign: 'center', marginTop: '1vw', color: '#666', fontSize: '0.95rem' }}>{progressText}</div>
            </div>
          )}
          {results && (
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
          )}
        </div>
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
      </div>
    </div>
  );
}
