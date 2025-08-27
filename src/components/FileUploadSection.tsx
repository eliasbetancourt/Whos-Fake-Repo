import React, { useRef } from "react";
import { brand } from "../utils/brand";

interface FileUploadSectionProps {
  onFileSelect: (files: FileList | null) => void;
  onFileDrop: (e: React.DragEvent) => void;
  status: string;
  processingStep: string;
  error: string;
}

export function FileUploadSection({ onFileSelect, onFileDrop, status, processingStep, error }: FileUploadSectionProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="mt-6 rounded-2xl p-8 shadow-2xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-center">
        <button
          onClick={() => inputRef.current?.click()}
          className="px-5 py-3 rounded-xl font-semibold text-white"
          style={{ backgroundColor: brand.blue }}
        >
          Choose Files
        </button>
        <input 
          ref={inputRef} 
          type="file" 
          accept=".zip,.json,.html,.htm,application/zip,application/json,text/html" 
          className="hidden" 
          onChange={(e) => onFileSelect(e.target.files)} 
        />
      </div>
      <div
        onDrop={onFileDrop}
        onDragOver={(e) => e.preventDefault()}
        className="mt-6 border-2 border-dashed border-white/20 rounded-2xl p-12 text-center bg-white/5 hover:bg-white/10 transition"
      >
        <div className="text-white/90">Or drag & drop your Instagram ZIP, JSON, or HTML here</div>
        {status && (
          <div className="mt-4 p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <div className="text-blue-200 font-medium">{status}</div>
            {processingStep && <div className="text-blue-200/80 text-sm mt-1">{processingStep}</div>}
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
            <div className="text-red-200 text-sm">{error}</div>
          </div>
        )}
      </div>
      <div className="text-center text-xs text-white/60 mt-3">Max file size depends on your browser. Everything stays local.</div>
    </section>
  );
}