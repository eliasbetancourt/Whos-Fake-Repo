/**
 * WhosFakeApp.tsx
 *
 * Top-level UI + client-side processing pipeline for an Instagram data export.
 *
 * Security model (NIST CSF):
 *   PR.AC-4 / PR.DS-5  All processing is local; the app never makes a network
 *                      request with user data (enforced by CSP `connect-src 'self'`).
 *   PR.IP-1            Strict whitelists for file extension, file size, ZIP
 *                      entry size and ZIP entry path prevent malformed or
 *                      hostile uploads from reaching the parser.
 *   DE.CM-4            Detected violations short-circuit processing and surface
 *                      a non-leaky error message to the user.
 */

import React, { useRef, useState } from "react";
import JSZip from "jszip";
import {
  analyzeFollowersAndFollowing,
  InvalidInstagramDataError,
} from "./analysis";
import HowToSteps from "./components/HowToSteps";
import FileList from "./components/FileList";
import Header from "./components/Header";
import ProgressBar from "./components/ProgressBar";
import ResultsTable from "./components/ResultsTable";
import VideoSection from "./components/VideoSection";

// ---------------------------------------------------------------------------
// File-level safety limits.  These are intentionally generous for real-world
// Instagram exports while preventing pathological inputs (zip bombs, multi-GB
// JSON blobs) from exhausting browser memory.
// ---------------------------------------------------------------------------

/** Largest ZIP archive we will open. */
const MAX_ZIP_BYTES = 200 * 1024 * 1024;        // 200 MB
/** Largest individual JSON file (loose upload or extracted from a ZIP). */
const MAX_JSON_BYTES = 64 * 1024 * 1024;        //  64 MB
/** Largest single file in any drag-and-drop selection. */
const MAX_FILE_BYTES = MAX_ZIP_BYTES;
/** Total bytes across the entire selection. */
const MAX_TOTAL_BYTES = 256 * 1024 * 1024;      // 256 MB
/** Hard cap on number of files in a selection (anti-DoS for the renderer). */
const MAX_FILE_COUNT = 5_000;
/** Allowed extensions; checked case-insensitively. */
const ALLOWED_EXTENSIONS = [".zip", ".json"] as const;
/**
 * MIME types we will accept for ZIP uploads.  Browsers vary; empty string is
 * allowed because Safari/Firefox often return "" for unknown types.
 */
const ALLOWED_ZIP_MIME = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
  "",
]);
const ALLOWED_JSON_MIME = new Set([
  "application/json",
  "text/json",
  "text/plain",
  "application/octet-stream",
  "",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const supportedTypes: string[] = [...ALLOWED_EXTENSIONS];

/** Lowercase the trailing extension (incl. the dot) of a file name. */
function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

/** True if a file's extension is on the allow-list. */
function hasAllowedExtension(name: string): boolean {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(fileExtension(name));
}

/**
 * Validate a single user-selected File.  Returns null on success or a short,
 * user-safe error string on failure.  We deliberately don't echo the raw file
 * name back to the user verbatim in case the export was tampered with.
 */
function validateFile(file: File): string | null {
  if (file.size === 0) return "File is empty.";
  if (file.size > MAX_FILE_BYTES) {
    return `File exceeds the ${Math.round(MAX_FILE_BYTES / (1024 * 1024))} MB limit.`;
  }
  const ext = fileExtension(file.name);
  if (!hasAllowedExtension(file.name)) {
    return "Unsupported file type — only .zip and .json are accepted.";
  }
  if (ext === ".zip" && !ALLOWED_ZIP_MIME.has(file.type)) {
    return "File does not appear to be a valid ZIP archive.";
  }
  if (ext === ".json" && !ALLOWED_JSON_MIME.has(file.type)) {
    return "File does not appear to be valid JSON.";
  }
  // Defensive: reject names containing path separators or NUL bytes.
  if (/[\/\\\x00]/.test(file.name)) return "Invalid file name.";
  return null;
}

/**
 * ZIP entries arrive with attacker-controlled paths.  Reject anything that
 * looks like path traversal, an absolute path, or an unreasonable length —
 * JSZip itself doesn't write to disk, but downstream consumers (and future
 * features) may, and the check is essentially free.
 */
function isSafeZipEntryName(name: string): boolean {
  if (!name || name.length > 1024) return false;
  if (name.includes("\x00")) return false;
  if (name.startsWith("/") || name.startsWith("\\")) return false;
  if (/(^|\/)\.\.(\/|$)/.test(name)) return false;
  // Reject Windows-style absolute paths e.g. "C:\foo".
  if (/^[a-zA-Z]:[\\/]/.test(name)) return false;
  return true;
}

// Utility for formatting file sizes in the UI.
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Validate that an account record (post-parse) is renderable.  Note: URL
 * validity is enforced again at render time by `toAbsoluteUrl` in
 * ResultsTable; this is just a coarse first pass.
 */
const isValidAccount = (user: { username?: string; profileUrl?: string }): boolean => {
  if (!user.username || user.username.trim() === "") return false;
  if (!user.profileUrl || !user.profileUrl.includes("instagram.com")) return false;
  const username = user.username.toLowerCase();
  if (username === "instagram user" || username === "unknown" || username === "deleted") return false;
  return true;
};

// Normalize Instagram profile links by removing the leading protocol/www and
// collapsing the `/_u/` redirect that some exports include.
const trimInstagramPrefix = (url: string): string => {
  return (url || "").replace(/^https?:\/\/www\./i, "").replace(/\/_u\//i, "/");
};

// ---------------------------------------------------------------------------
// Drag-and-drop directory walker (Chromium / Webkit).  Each File goes through
// the same validateFile() gate before being added to state.
// ---------------------------------------------------------------------------

async function getAllFilesFromDataTransferItems(items: DataTransferItemList): Promise<File[]> {
  const files: File[] = [];
  const traverseFileTree = async (item: any, path = "") => {
    if (item.isFile) {
      await new Promise<void>((resolve) => {
        item.file((file: File) => {
          if (path) Object.defineProperty(file, "webkitRelativePath", { value: path + file.name });
          files.push(file);
          resolve();
        });
      });
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      await new Promise<void>((resolve) => {
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

// ===========================================================================
// Component
// ===========================================================================

export default function WhosFakeApp() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Merge a batch of newly-selected files into `selectedFiles`, after running
   * each file through `validateFile`.  Anything that fails validation is
   * reported via `errorText` and not added.
   */
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    setErrorText(null);
    const incoming = Array.from(files).filter((f) => f.name !== ".DS_Store");
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const f of incoming) {
      const err = validateFile(f);
      if (err) {
        rejected.push(`${f.name}: ${err}`);
        continue;
      }
      accepted.push(f);
    }
    setSelectedFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      const merged = [
        ...prev,
        ...accepted.filter((f) => !names.has(f.name)),
      ].filter((f) => f.name !== ".DS_Store");
      // Cap the selection size to keep the UI / processor responsive.
      if (merged.length > MAX_FILE_COUNT) {
        rejected.push(`Too many files; truncated to ${MAX_FILE_COUNT}.`);
        return merged.slice(0, MAX_FILE_COUNT);
      }
      const total = merged.reduce((acc, f) => acc + f.size, 0);
      if (total > MAX_TOTAL_BYTES) {
        rejected.push("Selection exceeds total size limit.");
        return prev; // reject the whole new batch rather than partially apply
      }
      return merged;
    });
    if (rejected.length) setErrorText(rejected.join(" "));
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
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
    setErrorText(null);
    const items = e.dataTransfer.items;
    if (items && items.length && items[0].webkitGetAsEntry()) {
      const allFiles = await getAllFilesFromDataTransferItems(items);
      // Push through the same validating path as handleFileSelect.
      const dt = new DataTransfer();
      for (const f of allFiles) dt.items.add(f);
      handleFileSelect(dt.files);
    } else {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // -----------------------------------------------------------------------
  // Display + validation flags
  // -----------------------------------------------------------------------

  let displayFiles: File[] = [];
  let isTopLevelFolder = false;
  if (selectedFiles.some((f) => f.name.toLowerCase().endsWith(".zip"))) {
    const zip = selectedFiles.find((f) => f.name.toLowerCase().endsWith(".zip"));
    if (zip) displayFiles = [zip];
  } else if (selectedFiles.length > 0) {
    if ((selectedFiles[0] as any).webkitRelativePath) {
      displayFiles = selectedFiles;
      isTopLevelFolder = true;
    } else {
      displayFiles = selectedFiles;
    }
  }

  const hasUnsupported = displayFiles.some((file) => {
    if (isTopLevelFolder) return !file.name.toLowerCase().endsWith(".json");
    return !hasAllowedExtension(file.name);
  });

  // -----------------------------------------------------------------------
  // Main processing pipeline
  // -----------------------------------------------------------------------

  /** Read a JSZip file entry as a string with a hard byte cap. */
  async function readZipEntryString(
    entry: JSZip.JSZipObject,
    maxBytes: number
  ): Promise<string> {
    const bytes = await entry.async("uint8array");
    if (bytes.byteLength > maxBytes) {
      throw new InvalidInstagramDataError(
        `Embedded file ${entry.name} is larger than the ${maxBytes} byte limit.`
      );
    }
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }

  /** Read a loose File as text with a hard byte cap. */
  async function readFileString(file: File, maxBytes: number): Promise<string> {
    if (file.size > maxBytes) {
      throw new InvalidInstagramDataError(
        `${file.name} exceeds the ${maxBytes} byte limit.`
      );
    }
    return await file.text();
  }

  /**
   * Wrap JSON.parse to give us a clean error type and a length cap.
   */
  function safeJsonParse(text: string): unknown {
    if (text.length > MAX_JSON_BYTES) {
      throw new InvalidInstagramDataError("JSON file too large to process.");
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new InvalidInstagramDataError("File is not valid JSON.");
    }
  }

  const handleProcess = async () => {
    setProcessing(true);
    setProgress(0);
    setErrorText(null);
    setProgressText("Reading files...");
    try {
      // -----------------------------------------------------------------
      // ZIP path
      // -----------------------------------------------------------------
      const zipFile = selectedFiles.find((f) => f.name.toLowerCase().endsWith(".zip"));
      if (zipFile) {
        const fileErr = validateFile(zipFile);
        if (fileErr) throw new InvalidInstagramDataError(fileErr);
        if (zipFile.size > MAX_ZIP_BYTES) {
          throw new InvalidInstagramDataError("ZIP file exceeds the allowed size.");
        }

        setProgress(20);
        setProgressText("Unzipping...");
        const zip = await JSZip.loadAsync(zipFile);

        setProgress(40);
        setProgressText("Extracting followers and following...");

        // Filter and validate ZIP entries.  Reject path-traversal attempts.
        const zipFileKeys = Object.keys(zip.files).filter((k) => {
          if (k.includes(".DS_Store")) return false;
          if (!isSafeZipEntryName(k)) {
            console.warn("Rejected unsafe ZIP entry:", k);
            return false;
          }
          return true;
        });

        const followersPath = zipFileKeys.find((k) =>
          k.match(/followers_and_following\/followers_1\.json$/)
        );
        const followingPath = zipFileKeys.find((k) =>
          k.match(/followers_and_following\/following\.json$/)
        );
        if (!followersPath || !followingPath) {
          throw new InvalidInstagramDataError(
            "Could not find followers or following file in ZIP."
          );
        }

        const followersContent = await readZipEntryString(
          zip.files[followersPath],
          MAX_JSON_BYTES
        );
        const followingContent = await readZipEntryString(
          zip.files[followingPath],
          MAX_JSON_BYTES
        );

        setProgress(60);
        setProgressText("Analyzing...");
        const { followers, following, unfollowers: rawUnfollowers } =
          analyzeFollowersAndFollowing(
            safeJsonParse(followersContent),
            safeJsonParse(followingContent)
          );
        const unfollowers = rawUnfollowers
          .map((u) => ({ ...u, profileUrl: trimInstagramPrefix(u.profileUrl) }))
          .filter(isValidAccount);

        setProgress(100);
        setProgressText("Analysis complete!");
        setResults({
          summary: {
            totalFollowers: followers.length,
            totalFollowing: following.length,
            unfollowers: unfollowers.length,
          },
          unfollowers,
        });
        setProcessing(false);
        return;
      }

      // -----------------------------------------------------------------
      // Loose-folder path
      // -----------------------------------------------------------------
      const followersFile = selectedFiles.find(
        (f) =>
          (f as any).webkitRelativePath &&
          (f as any).webkitRelativePath.match(
            /followers_and_following\/followers_1\.json$/
          )
      );
      const followingFile = selectedFiles.find(
        (f) =>
          (f as any).webkitRelativePath &&
          (f as any).webkitRelativePath.match(
            /followers_and_following\/following\.json$/
          )
      );
      if (!followersFile || !followingFile) {
        throw new InvalidInstagramDataError(
          "Could not find followers or following file in folder."
        );
      }
      const followersErr = validateFile(followersFile);
      const followingErr = validateFile(followingFile);
      if (followersErr) throw new InvalidInstagramDataError(followersErr);
      if (followingErr) throw new InvalidInstagramDataError(followingErr);

      setProgress(40);
      setProgressText("Extracting followers and following...");
      const followersContent = await readFileString(followersFile, MAX_JSON_BYTES);
      const followingContent = await readFileString(followingFile, MAX_JSON_BYTES);

      setProgress(60);
      setProgressText("Analyzing...");
      const { followers, following, unfollowers: rawUnfollowers } =
        analyzeFollowersAndFollowing(
          safeJsonParse(followersContent),
          safeJsonParse(followingContent)
        );
      const unfollowers = rawUnfollowers
        .map((u) => ({ ...u, profileUrl: trimInstagramPrefix(u.profileUrl) }))
        .filter(isValidAccount);

      setProgress(100);
      setProgressText("Analysis complete!");
      setResults({
        summary: {
          totalFollowers: followers.length,
          totalFollowing: following.length,
          unfollowers: unfollowers.length,
        },
        unfollowers,
      });
    } catch (err) {
      // Surface a friendly message; log the raw error for the developer only.
      console.error("Processing error:", err);
      const msg =
        err instanceof InvalidInstagramDataError
          ? err.message
          : "Error processing file. Please check that you uploaded the correct Instagram export.";
      setProgressText(msg);
      setErrorText(msg);
      setResults(null);
    }
    setProcessing(false);
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        minHeight: "100vh",
        height: "auto",
        color: "#333",
        width: "100vw",
        minWidth: 0,
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "2vw",
          width: "100%",
          boxSizing: "border-box",
          minHeight: "100vh",
        }}
      >
        <Header />
        <div
          style={{
            background: "white",
            borderRadius: 24,
            boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
            padding: "4vw 2vw",
            margin: "4vw auto",
            maxWidth: 800,
            minWidth: 0,
            width: "100%",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              border: "3px dashed #e0e7ff",
              borderRadius: 16,
              padding: "4vw 2vw",
              margin: "2vw 0",
              background: dragOver ? "#e0e7ff" : "#f8faff",
              cursor: "pointer",
              transition: "all 0.3s",
              position: "relative",
              minWidth: 0,
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ fontSize: "4rem", color: "#667eea", marginBottom: 20 }}>📁</div>
            <div>
              <h3 style={{ fontSize: "1.8rem", color: "#333", marginBottom: 10, fontWeight: 600 }}>
                Upload Your Instagram Data
              </h3>
              <p style={{ color: "#666", fontSize: "1.1rem", marginBottom: 20 }}>
                Drag and drop your Instagram ZIP file here, or click to browse
              </p>
              <button
                className="choose-files-btn"
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  padding: "16px 32px",
                  borderRadius: 12,
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Choose Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,.json,application/zip,application/json"
                multiple
                style={{ display: "none" }}
                // @ts-ignore
                webkitdirectory="true"
                directory="true"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>
          </div>
          <div
            style={{
              background: "#f0f9ff",
              border: "1px solid #e0f2fe",
              borderRadius: 12,
              padding: "2vw",
              margin: "2vw 0",
              display: "flex",
              alignItems: "center",
              gap: 15,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: "2rem", color: "#0ea5e9" }}>🔒</div>
            <div style={{ textAlign: "left" }}>
              <h4 style={{ color: "#0c4a6e", marginBottom: 5, fontWeight: 600 }}>
                100% Private &amp; Secure
              </h4>
              <p style={{ color: "#0369a1", fontSize: "0.95rem" }}>
                All processing happens on your device. No files are uploaded to our servers.
              </p>
            </div>
          </div>
          {errorText && (
            <div
              role="alert"
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "1vw",
                margin: "1vw 0",
                color: "#991b1b",
                textAlign: "left",
              }}
            >
              {errorText}
            </div>
          )}
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
          {!results && !processing && (
            <div style={{ marginTop: '3vw', opacity: 0.6, pointerEvents: 'none', userSelect: 'none' }}>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <p style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', marginBottom: '1.5vw' }}>
                  This is a preview of the results table. Upload your Instagram data to see real results!
                  <br />
                  *Links in the table will take you directly to each user's Instagram profiles.
                </p>
                <span style={{ background: '#e0e7ff', color: '#4338ca', borderRadius: 8, padding: '4px 14px', fontSize: '0.8rem', fontWeight: 700, letterSpacing: 1 }}>PREVIEW — Upload your file to see real results</span>
              </div>
              <ResultsTable results={{
                summary: { totalFollowers: 69, totalFollowing: 42, unfollowers: 3 },
                unfollowers: [
                  { username: 'example.user1', profileUrl: 'instagram.com/example.user1', timestamp: 1700000000 },
                  { username: 'example.user2', profileUrl: 'instagram.com/example.user2', timestamp: 1710000000 },
                  { username: 'example.user3', profileUrl: 'instagram.com/example.user3', timestamp: 1720000000 },
                ]
              }} />
            </div>
          )}
        </div>
        <VideoSection />
        <HowToSteps />
      </div>
    </div>
  );
}
