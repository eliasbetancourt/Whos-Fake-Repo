import { formatFileSize } from "../utils/instagram";

interface UploadedFilesSectionProps {
  uploadedFiles: File[];
  onRemoveFile: (index: number) => void;
}

export function UploadedFilesSection({ uploadedFiles, onRemoveFile }: UploadedFilesSectionProps) {
  if (uploadedFiles.length === 0) return null;

  return (
    <section className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Uploaded Files</h3>
      <div className="space-y-2">
        {uploadedFiles.map((file, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                📁
              </div>
              <div>
                <div className="font-medium text-white">{file.name}</div>
                <div className="text-sm text-white/70">{formatFileSize(file.size)}</div>
              </div>
            </div>
            <button
              onClick={() => onRemoveFile(index)}
              className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center text-red-300 hover:text-red-200 transition"
              title="Remove file"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}