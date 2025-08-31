
interface FileListProps {
  selectedFiles: File[];
  supportedTypes: string[];
  handleRemoveFile: (index: number) => void;
  formatFileSize: (bytes: number) => string;
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  hasUnsupported: boolean;
  handleProcess: () => void;
}

const FileList: React.FC<FileListProps> = ({
  selectedFiles,
  supportedTypes,
  handleRemoveFile,
  formatFileSize,
  setSelectedFiles,
  hasUnsupported,
  handleProcess
}) => {
  if (selectedFiles.length === 0) return null;
  return (
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
  );
};

export default FileList;


