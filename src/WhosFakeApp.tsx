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
import JSZip from 'jszip';
import { analyzeFollowersAndFollowing } from './backend/analysis';
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
      // Always filter out .DS_Store from the combined list
      return [...prev, ...newFiles.filter(f => !names.has(f.name))].filter(f => f.name !== '.DS_Store');
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
      // Add only new files, filter out duplicates and .DS_Store
      setSelectedFiles(prev => {
        const names = new Set(prev.map(f => f.name));
        return [...prev, ...allFiles.filter(f => !names.has(f.name))].filter(f => f.name !== '.DS_Store');
      });
    } else {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Only show the parent ZIP file (or parent folder if not zipped) in the file list
  let displayFiles: File[] = [];
  let isTopLevelFolder = false;
  if (selectedFiles.some(f => f.name.toLowerCase().endsWith('.zip'))) {
    // Show only the first ZIP file
    const zip = selectedFiles.find(f => f.name.toLowerCase().endsWith('.zip'));
    if (zip) displayFiles = [zip];
  } else if (selectedFiles.length > 0) {
    // If not zipped, show only the top-level folder (simulate by showing the first file's root folder if available)
    const first = selectedFiles[0];
    if ((first as any).webkitRelativePath) {
      const root = (first as any).webkitRelativePath.split('/')[0];
      // Simulate a folder File object for display only
      displayFiles = [new File([first], root)];
      isTopLevelFolder = true;
    } else {
      displayFiles = [first];
    }
  }
  // Validation
  const hasUnsupported = displayFiles.some((file, idx) => {
    // If we're showing a simulated top-level folder, always allow it
    if (isTopLevelFolder && idx === 0) return false;
    return !supportedTypes.some(type => file.name.toLowerCase().endsWith(type));
  });

  // Real file processing logic
  const handleProcess = async () => {
    setProcessing(true);
    setProgress(0);
    setProgressText('Reading files...');
    try {
      // Find the ZIP file
      const zipFile = selectedFiles.find(f => f.name.endsWith('.zip'));
      if (!zipFile) {
        setProgressText('No ZIP file selected.');
        setProcessing(false);
        return;
      }
      setProgress(20);
      setProgressText('Unzipping...');
      const zip = await JSZip.loadAsync(zipFile);
      setProgress(40);
      setProgressText('Extracting followers and following...');
      // Find the relevant files in the zip
      // Ignore .DS_Store files
      const zipFileKeys = Object.keys(zip.files).filter(k => !k.includes('.DS_Store'));
      const followersPath = zipFileKeys.find(k => k.match(/followers_and_following\/followers_1\.json$/));
      const followingPath = zipFileKeys.find(k => k.match(/followers_and_following\/following\.json$/));
      if (!followersPath || !followingPath) {
        setProgressText('Could not find followers or following file in ZIP.');
        setProcessing(false);
        return;
      }
      const followersContent = await zip.files[followersPath].async('string');
      const followingContent = await zip.files[followingPath].async('string');
      setProgress(60);
      setProgressText('Analyzing...');
      // Use backend logic (adapted for browser)
      const followersArr = JSON.parse(followersContent).flatMap((entry: any) =>
        (entry.string_list_data || []).map((s: any) => ({
          username: s.value,
          profileUrl: s.href,
          timestamp: s.timestamp
        }))
      );
      const followingArr = JSON.parse(followingContent).relationships_following.flatMap((entry: any) =>
        (entry.string_list_data || []).map((s: any) => ({
          username: s.value,
          profileUrl: s.href,
          timestamp: s.timestamp
        }))
      );
      const followerUsernames = new Set(followersArr.map(f => f.username));
      const unfollowers = followingArr.filter(f => !followerUsernames.has(f.username));
      setProgress(100);
      setProgressText('Analysis complete!');
      setResults({
        summary: {
          totalFollowers: followersArr.length,
          totalFollowing: followingArr.length,
          unfollowers: unfollowers.length
        },
        unfollowers
      });
    } catch (err) {
      setProgressText('Error processing file.');
      setResults(null);
    }
    setProcessing(false);
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
            selectedFiles={displayFiles}
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