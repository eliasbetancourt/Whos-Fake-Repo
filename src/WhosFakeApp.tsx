import React, { useCallback, useMemo, useRef, useState } from "react";
import JSZip from "jszip";

// --- Types ---
interface StringListItem {
  value?: string;
  username?: string;
  href?: string;
}

interface InstagramDataItem {
  string_list_data?: StringListItem[];
  username?: string;
  title?: string;
  [key: string]: unknown;
}

// --- Brand ---
const brand = {
  blue: "#2563eb", // blue-600
  blueLight: "#60a5fa",
  purple: "#9333ea", // purple-600
  purpleLight: "#a855f7", // purple-500
  bg: "bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900",
};

function MagnifierLogo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <defs>
          <linearGradient id="wfGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={brand.blueLight} />
            <stop offset="100%" stopColor={brand.blue} />
          </linearGradient>
        </defs>
        <g fill="url(#wfGrad)">
          <circle cx="28" cy="28" r="22" />
          <rect x="38" y="38" width="22" height="10" rx="5" transform="rotate(45 38 38)" />
        </g>
        {/* crack */}
        <g stroke="#ffffff" strokeWidth={2} strokeLinecap="round">
          <path d="M12 28 L28 28" />
          <path d="M28 12 L28 28" />
          <path d="M18 18 L28 28 L38 18" />
          <path d="M20 36 L28 28 L40 34" />
          <path d="M30 10 L34 22" />
        </g>
      </svg>
      <span className="font-semibold tracking-tight" style={{ color: brand.blue }}>WhosFake</span>
    </div>
  );
}

function LockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 10v-4a6 6 0 1 1 12 0v4h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1zm2 0h8v-4a4 4 0 1 0-8 0v4z"/>
    </svg>
  );
}

// Utility: download CSV in-browser
function downloadCSV(filename: string, rows: string[][]) {
  // Join cells by comma and rows by newline. Previously had an unterminated string; fixed to "\n".
  const csv = rows
    .map(r => r.map(v => '"' + (v ?? '').replace(/"/g, '""') + '"').join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); // explicit BOM
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// Utility: format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const isLikelyUsername = (s: string) => /^[a-z0-9._]{2,30}$/i.test(s || "");

function extractUsernames(json: unknown): string[] {
  const found = new Set<string>();
  const handleStringListItem = (item: InstagramDataItem) => {
    if (!item) return;
    const sld = item.string_list_data || (item as Record<string, unknown>)["string_list_data"];
    if (Array.isArray(sld)) {
      for (const sub of sld) {
        const v = sub?.value || sub?.username || (sub?.href ? ("" + sub.href).split("/")[3] : undefined);
        if (typeof v === "string" && isLikelyUsername(v)) found.add(v.toLowerCase());
      }
    }
    if (typeof item.username === "string" && isLikelyUsername(item.username)) found.add(item.username.toLowerCase());
    if (typeof item.title === "string" && isLikelyUsername(item.title)) found.add(item.title.toLowerCase());
  };
  const traverse = (node: unknown): void => {
    if (!node) return;
    if (Array.isArray(node)) return node.forEach(traverse);
    if (typeof node === "object") {
      const objNode = node as InstagramDataItem;
      if (objNode.string_list_data || typeof objNode.username === "string" || typeof objNode.title === "string") handleStringListItem(objNode);
      for (const k of Object.keys(objNode)) traverse(objNode[k]);
    }
  };
  traverse(json);
  return Array.from(found);
}

async function parseFollowersFollowingFromZip(file: File): Promise<{ followers: string[]; following: string[]; accountId: string | null; }> {
  const zip = await JSZip.loadAsync(file);
  const followers: Set<string> = new Set();
  const following: Set<string> = new Set();
  let accountId: string | null = null;
  const entries = Object.values(zip.files);

  const profileEntry = entries.find(f => /profile(_|\.)json$/i.test(f.name) || /personal_information\/profile\.json$/i.test(f.name));
  if (profileEntry) {
    try {
      const text = await profileEntry.async("text");
      const j = JSON.parse(text) as InstagramDataItem;
      const u = j?.username || j?.string_list_data?.[0]?.value;
      if (typeof u === "string" && isLikelyUsername(u)) accountId = u.toLowerCase();
    } catch { 
      // Ignore parsing errors for profile
    }
  }

  const handle = async (f: JSZip.JSZipObject, target: Set<string>) => {
    try {
      const txt = await f.async("text");
      const json = JSON.parse(txt);
      for (const u of extractUsernames(json)) target.add(u);
    } catch { 
      // Ignore parsing errors for individual files
    }
  };

  const followerFiles = entries.filter(f => /followers.*\.json$/i.test(f.name) || /connections\/followers.*\.json$/i.test(f.name));
  const followingFiles = entries.filter(f => /following.*\.json$/i.test(f.name) || /connections\/following.*\.json$/i.test(f.name) || /relationships_following.*\.json$/i.test(f.name));
  const genericConn = entries.filter(f => /followers_and_following\/.+\.json$/i.test(f.name));

  for (const f of followerFiles) await handle(f, followers);
  for (const f of followingFiles) await handle(f, following);
  if (followers.size === 0 && following.size === 0) for (const f of genericConn) await handle(f, following);
  if (followers.size === 0 && following.size === 0) {
    const allJsons = entries.filter(f => /\.json$/i.test(f.name));
    for (const f of allJsons) await handle(f, following);
  }
  return { followers: Array.from(followers), following: Array.from(following), accountId };
}

// ---------------- Self-tests (run once in the browser console) ----------------
(function runWhosFakeSelfTests() {
  try {
    const tests: Array<{ name: string; run: () => void }> = [];

    // Test: isLikelyUsername
    tests.push({
      name: "isLikelyUsername basics",
      run: () => {
        console.assert(isLikelyUsername("alice"));
        console.assert(isLikelyUsername("a.l_i.ce"));
        console.assert(!isLikelyUsername("A"));
        console.assert(!isLikelyUsername("bad space"));
      }
    });

    // Test: extractUsernames with common shapes
    tests.push({
      name: "extractUsernames from string_list_data + username/title",
      run: () => {
        const json = [
          { string_list_data: [{ value: "alice", href: "https://instagram.com/alice/" }] },
          { username: "Bob" },
          { title: "charlie" },
          { nested: { arr: [{ string_list_data: [{ value: "dora" }] }] } }
        ];
        const got = extractUsernames(json).sort();
        const want = ["alice", "bob", "charlie", "dora"].sort();
        console.assert(JSON.stringify(got) === JSON.stringify(want), `got ${got} want ${want}`);
      }
    });

    // Test: downloadCSV (structure only)
    tests.push({
      name: "downloadCSV encoding/joins",
      run: () => {
        const rows = [["a", "b"], ["c,d", 'e"f']];
        const csv = rows
          .map(r => r.map(v => '"' + (v ?? '').replace(/"/g, '""') + '"').join(","))
          .join("\n");
        // Should contain escaped quotes and commas preserved
        console.assert(csv.includes('"c,d"'));
        console.assert(csv.includes('"e""f"'));
        console.assert(csv.split("\n").length === 2);
      }
    });

    console.groupCollapsed("WhosFake self-tests");
    for (const t of tests) { t.run(); console.log("✓", t.name); }
    console.groupEnd();
  } catch (err) {
    console.warn("Self-tests failed:", err);
  }
})();
// ---------------------------------------------------------------------------

export default function WhosFakeApp() {
  const [status, setStatus] = useState<string>("");
  const [processingStep, setProcessingStep] = useState<string>("");
  const [account, setAccount] = useState<string | null>(null);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"unfollowers" | "pending">("unfollowers");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setError("");
    setFollowers([]); setFollowing([]);
    setProcessingStep("📁 Reading file...");
    setStatus("Processing your Instagram data (100% local)");
    setUploadedFiles([file]); // Track the uploaded file

  const isZip = file.name.toLowerCase().endsWith('.zip');
  const isJson = file.name.toLowerCase().endsWith('.json');
  const isHtml = file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm');

    try {
  if (isZip) {
        setProcessingStep("📦 Extracting ZIP archive...");
        const { followers, following, accountId } = await parseFollowersFollowingFromZip(file);
        setProcessingStep("👥 Analyzing followers and following...");
        setFollowers(followers);
        setFollowing(following);
        setAccount(accountId);
        setProcessingStep("✅ Analysis complete!");
        setStatus("");
        setTimeout(() => setProcessingStep(""), 2000);
        if (followers.length === 0 && following.length === 0) setError("Could not find followers/following data in this ZIP. Make sure you requested 'Followers and Following' in JSON.");
  } else if (isJson) {
        setProcessingStep("📄 Parsing JSON file...");
        // Try to parse a single JSON file
        const text = await file.text();
        let json: unknown;
        try {
          json = JSON.parse(text);
        } catch {
          setError("Could not parse JSON file.");
          setStatus("");
          setProcessingStep("");
          return;
        }
        setProcessingStep("🔍 Extracting usernames...");
        // Try to extract usernames from the JSON
        const followers = extractUsernames(json);
        setFollowers(followers);
        setFollowing([]);
        setAccount(null);
        setProcessingStep("✅ Parsing complete!");
        setStatus("");
        setTimeout(() => setProcessingStep(""), 2000);
        if (followers.length === 0) setError("No usernames found in this JSON file.");
      } else if (isHtml) {
        setProcessingStep("🌐 Parsing HTML file...");
        // Try to parse usernames from an HTML file
        const text = await file.text();
        // Very basic HTML parsing: look for Instagram profile links
        const usernames = Array.from(text.matchAll(/instagram\.com\/(?!accounts|explore|direct|about|developer|legal|privacy|terms|p|stories|reel|tv|[\w-]+\?)([a-zA-Z0-9._]{2,30})/g)).map(m => m[1]?.toLowerCase()).filter(Boolean);
        setFollowers(usernames);
        setFollowing([]);
        setAccount(null);
        setProcessingStep("✅ Parsing complete!");
        setStatus("");
        setTimeout(() => setProcessingStep(""), 2000);
        if (usernames.length === 0) setError("No Instagram usernames found in this HTML file.");
      } else {
        setError("Unsupported file type. Please upload a ZIP, JSON, or HTML file.");
        setStatus("");
        setProcessingStep("");
      }
    } catch (e: unknown) {
      console.error(e);
      setError("Failed to read file. Is it the original Instagram download (ZIP or JSON format)?");
      setStatus("");
      setProcessingStep("");
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }, [handleFiles]);
  const onSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { handleFiles(e.target.files); }, [handleFiles]);

  const unfollowers = useMemo(() => {
    const fset = new Set(followers);
    return following.filter(u => !fset.has(u));
  }, [followers, following]);

  const filtered = useMemo(() => {
    if (!query) return unfollowers;
    const q = query.toLowerCase();
    return unfollowers.filter(u => u.includes(q));
  }, [query, unfollowers]);

  const handleCSV = () => {
    const rows = [["username", "profile_url"]].concat(filtered.map(u => [u, `https://instagram.com/${u}`]));
    downloadCSV(`whosfake_unfollowers_${account || "account"}.csv`, rows);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    if (uploadedFiles.length === 1) {
      // If removing the last file, reset everything
      setFollowers([]);
      setFollowing([]);
      setAccount(null);
      setError("");
      setStatus("");
      setProcessingStep("");
    }
  };

  return (
    <div className={`${brand.bg} min-h-screen text-white`}>
      {/* Top bar */}
      <header className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between">
        <MagnifierLogo />
        <div className="text-xs opacity-80 flex items-center gap-1">
          <LockIcon size={12} />
          Private • Local‑only • No sign‑in
        </div>
      </header>

      {/* FreeConvert-like centered card */}
      <main className="mx-auto max-w-4xl px-4 pb-24">
        <h1 className="text-center text-4xl md:text-5xl font-bold">Upload your Instagram ZIP</h1>
        <p className="text-center text-white/80 mt-3">Convert your ZIP into insights — safely on your device.</p>

        {/* Tabs */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {(
            [
              { id: "unfollowers", label: "Unfollowers" },
              { id: "pending", label: "Pending Requests" },
            ] as const
          ).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${tab === t.id ? "bg-white text-slate-900" : "bg-white/10 border-white/20 text-white/90 hover:bg-white/20"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Instructions */}
        <section className="mt-8 rounded-2xl p-6 bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            📋 How to get your Instagram data
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">1</div>
              <div>
                <div className="font-medium text-white">Request your data</div>
                <div className="text-white/70 mt-1">Go to Instagram Settings → Security → Download data</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">2</div>
              <div>
                <div className="font-medium text-white">Select JSON format</div>
                <div className="text-white/70 mt-1">Choose "JSON" and include "Followers and following"</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">3</div>
              <div>
                <div className="font-medium text-white">Upload your ZIP</div>
                <div className="text-white/70 mt-1">Download the ZIP file and upload it below</div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="text-orange-200 text-sm">
              <strong>⚠️ Note:</strong> The data request can take up to 48 hours. Make sure to request "Followers and following" data in JSON format.
            </div>
          </div>
        </section>

        {/* Upload box */}
        <section className="mt-6 rounded-2xl p-8 shadow-2xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-center">
            <button
              onClick={() => inputRef.current?.click()}
              className="px-5 py-3 rounded-xl font-semibold text-white"
              style={{ backgroundColor: brand.blue }}
            >
              Choose Files
            </button>
            <input ref={inputRef} type="file" accept=".zip,.json,.html,.htm,application/zip,application/json,text/html" className="hidden" onChange={onSelect} />
          </div>
          <div
            onDrop={onDrop}
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

        {/* Uploaded files preview */}
        {uploadedFiles.length > 0 && (
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
                    onClick={() => removeFile(index)}
                    className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center text-red-300 hover:text-red-200 transition"
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Results area */}
        <section className="mt-10">
          {/* Summary cards */}
          {(followers.length > 0 || following.length > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-white/10 border border-white/20">
                <div className="text-2xl font-bold text-white">{followers.length}</div>
                <div className="text-sm text-white/70">Followers</div>
              </div>
              <div className="p-4 rounded-xl bg-white/10 border border-white/20">
                <div className="text-2xl font-bold text-white">{following.length}</div>
                <div className="text-sm text-white/70">Following</div>
              </div>
              <div className="p-4 rounded-xl bg-white/10 border border-white/20">
                <div className="text-2xl font-bold text-red-300">{unfollowers.length}</div>
                <div className="text-sm text-white/70">Not Following Back</div>
              </div>
              <div className="p-4 rounded-xl bg-white/10 border border-white/20">
                <div className="text-2xl font-bold text-green-300">
                  {following.length > 0 ? Math.round((followers.length / following.length) * 100) : 0}%
                </div>
                <div className="text-sm text-white/70">Follow Back Rate</div>
              </div>
            </div>
          )}

          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold">Results</h2>
              <p className="text-white/70 text-sm">Account: {account || "(from ZIP)"} {tab === "unfollowers" && unfollowers.length > 0 && <>• Showing {query ? filtered.length : unfollowers.length} unfollowers</>}</p>
            </div>
            {tab === "unfollowers" && unfollowers.length > 0 && (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search username…"
                  className="px-3 py-2 rounded-xl bg-white text-slate-800 placeholder-slate-400 w-56"
                />
                <button onClick={handleCSV} className="px-3 py-2 rounded-xl bg-white text-slate-800 font-medium hover:bg-slate-100">Export CSV</button>
              </div>
            )}
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl shadow-xl border border-white/10">
            {tab === "unfollowers" ? (
              <table className="w-full text-left bg-white">
                <thead>
                  <tr className="text-slate-600 text-sm">
                    <th className="py-3 pl-4 pr-2">#</th>
                    <th className="py-3 px-2">Username</th>
                    <th className="py-3 px-2">Profile</th>
                    <th className="py-3 px-2">Quick</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800">
                  {(() => {
                    const list = query ? filtered : unfollowers;
                    if (list.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="py-10 text-center text-slate-500">{unfollowers.length === 0 ? "Upload a ZIP to see results." : "No matches for your search."}</td>
                        </tr>
                      );
                    }
                    return list.map((u, i) => {
                      const url = `https://instagram.com/${u}`;
                      return (
                        <tr key={u} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="py-3 pl-4 pr-2 text-slate-500">{i + 1}</td>
                          <td className="py-3 px-2 font-medium">{u}</td>
                          <td className="py-3 px-2"><a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{url}</a></td>
                          <td className="py-3 px-2"><a href={url} target="_blank" rel="noreferrer" className="inline-block px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: brand.blue }}>Open profile</a></td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            ) : (
              <div className="bg-white text-slate-800 p-8 text-center">
                <p className="text-slate-600">Pending Requests will appear here when parsed from your ZIP. (Coming soon)</p>
              </div>
            )}
          </div>
        </section>

        {/* Feature cards */}
        <section className="mt-12 grid md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition">
            <div className="flex items-center gap-2 mb-2">
              <LockIcon size={16} />
              <h3 className="font-semibold">100% Private</h3>
            </div>
            <p className="text-sm text-white/80">Your files never leave your device. All processing happens locally in your browser for complete privacy.</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚡</span>
              <h3 className="font-semibold">Instant Results</h3>
            </div>
            <p className="text-sm text-white/80">Upload your Instagram data and get detailed insights immediately with our fast, client-side processing.</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📊</span>
              <h3 className="font-semibold">Detailed Analytics</h3>
            </div>
            <p className="text-sm text-white/80">Get comprehensive follower insights, unfollower lists, and export data for further analysis.</p>
          </div>
        </section>

        <footer className="mt-16 text-center text-white/60 text-sm">© {new Date().getFullYear()} WhosFake • Built for privacy</footer>
      </main>
    </div>
  );
}
