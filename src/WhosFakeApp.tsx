// Recursively read directory entries (Chromium only)
async function getAllFilesFromDataTransferItems(items: DataTransferItemList): Promise<File[]> {
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
}
import React, { useRef, useState } from "react";
import HowToSteps from "./components/HowToSteps";
import FileList from "./components/FileList";
import Header from "./components/Header";
import ProgressBar from "./components/ProgressBar";
import ResultsTable from "./components/ResultsTable";

//modern
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // Prefer advanced folder support if available
    const items = e.dataTransfer.items;
    if (items && items.length && items[0].webkitGetAsEntry) {
      const allFiles = await getAllFilesFromDataTransferItems(items);
      // Add only new files, filter out duplicates
      setSelectedFiles(prev => {
        const names = new Set(prev.map(f => f.name));
        return [...prev, ...allFiles.filter(f => !names.has(f.name))];
      });
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
      <Header />
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
          <FileList
            selectedFiles={selectedFiles}
            supportedTypes={supportedTypes}
            formatFileSize={formatFileSize}
            handleRemoveFile={handleRemoveFile}
            setSelectedFiles={setSelectedFiles}
            hasUnsupported={hasUnsupported}
            handleProcess={handleProcess}
          />
         {processing && <ProgressBar progress={progress} progressText={progressText} />}
         {results && <ResultsTable results={results} />}
        </div>
        <HowToSteps />
        </div>
      </div>
  );
}