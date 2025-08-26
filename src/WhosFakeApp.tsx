import React, { useCallback, useMemo, useRef, useState } from "react";
import JSZip from "jszip";

// --- Brand ---
const brand = {
  blue: "#2563eb", // blue-600
  blueLight: "#60a5fa",
  bg: "bg-[#0b1220]",
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

const isLikelyUsername = (s: string) => /^[a-z0-9._]{2,30}$/i.test(s || "");

function extractUsernames(json: any): string[] {
  const found = new Set<string>();
  const handleStringListItem = (item: any) => {
    if (!item) return;
    const sld = item.string_list_data || item?.["string_list_data"];
    if (Array.isArray(sld)) {
      for (const sub of sld) {
        const v = sub?.value || sub?.username || (sub?.href ? ("" + sub.href).split("/")[3] : undefined);
        if (typeof v === "string" && isLikelyUsername(v)) found.add(v.toLowerCase());
      }
    }
    if (typeof item.username === "string" && isLikelyUsername(item.username)) found.add(item.username.toLowerCase());
    if (typeof item.title === "string" && isLikelyUsername(item.title)) found.add(item.title.toLowerCase());
  };
  const traverse = (node: any) => {
    if (!node) return;
    if (Array.isArray(node)) return node.forEach(traverse);
    if (typeof node === "object") {
      if (node.string_list_data || typeof node.username === "string" || typeof node.title === "string") handleStringListItem(node);
      for (const k of Object.keys(node)) traverse(node[k]);
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

  const profileEntry = entries.find((f: any) => /profile(_|\.)json$/i.test(f.name) || /personal_information\/profile\.json$/i.test(f.name));
  if (profileEntry) {
    try {
      const text = await (profileEntry as any).async("text");
      const j = JSON.parse(text);
      const u = j?.username || j?.string_list_data?.[0]?.value;
      if (typeof u === "string" && isLikelyUsername(u)) accountId = u.toLowerCase();
    } catch { }
  }

  const handle = async (f: any, target: Set<string>) => {
    try {
      const txt = await f.async("text");
      const json = JSON.parse(txt);
      for (const u of extractUsernames(json)) target.add(u);
    } catch { }
  };

  const followerFiles = entries.filter((f: any) => /followers.*\.json$/i.test(f.name) || /connections\/followers.*\.json$/i.test(f.name));
  const followingFiles = entries.filter((f: any) => /following.*\.json$/i.test(f.name) || /connections\/following.*\.json$/i.test(f.name) || /relationships_following.*\.json$/i.test(f.name));
  const genericConn = entries.filter((f: any) => /followers_and_following\/.+\.json$/i.test(f.name));

  for (const f of followerFiles) await handle(f, followers);
  for (const f of followingFiles) await handle(f, following);
  if (followers.size === 0 && following.size === 0) for (const f of genericConn) await handle(f, following);
  if (followers.size === 0 && following.size === 0) {
    const allJsons = entries.filter((f: any) => /\.json$/i.test(f.name));
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
  const [account, setAccount] = useState<string | null>(null);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [query, setQuery] = useState(""); 
  const [tab, setTab] = useState<"unfollowers" | "pending">("unfollowers");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setError("");
    setFollowers([]); setFollowing([]);
    setStatus("Parsing file… (all in your browser)");

  const isZip = file.name.toLowerCase().endsWith('.zip');
  const isJson = file.name.toLowerCase().endsWith('.json');
  const isHtml = file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm');

    try {
  if (isZip) {
        const { followers, following, accountId } = await parseFollowersFollowingFromZip(file);
        setFollowers(followers);
        setFollowing(following);
        setAccount(accountId);
        setStatus("");
        if (followers.length === 0 && following.length === 0) setError("Could not find followers/following data in this ZIP. Make sure you requested 'Followers and Following' in JSON.");
  } else if (isJson) {
        // Try to parse a single JSON file
        const text = await file.text();
        let json: any;
        try {
          json = JSON.parse(text);
        } catch (err) {
          setError("Could not parse JSON file.");
          setStatus("");
          return;
        }
        // Try to extract usernames from the JSON
        const followers = extractUsernames(json);
        setFollowers(followers);
        setFollowing([]);
        setAccount(null);
        setStatus("");
        if (followers.length === 0) setError("No usernames found in this JSON file.");
      } else if (isHtml) {
        // Try to parse usernames from an HTML file
        const text = await file.text();
        // Very basic HTML parsing: look for Instagram profile links
        const usernames = Array.from(text.matchAll(/instagram\.com\/(?!accounts|explore|direct|about|developer|legal|privacy|terms|p|stories|reel|tv|[\w-]+\?)([a-zA-Z0-9._]{2,30})/g)).map(m => m[1]?.toLowerCase()).filter(Boolean);
        setFollowers(usernames);
        setFollowing([]);
        setAccount(null);
        setStatus("");
        if (usernames.length === 0) setError("No Instagram usernames found in this HTML file.");
      } else {
        setError("Unsupported file type. Please upload a ZIP, JSON, or HTML file.");
        setStatus("");
      }
    } catch (e: any) {
      console.error(e);
      setError("Failed to read file. Is it the original Instagram download (ZIP or JSON format)?");
      setStatus("");
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

  return (
    <div className={`${brand.bg} min-h-screen text-white`}>
      {/* Top bar */}
      <header className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between">
        <MagnifierLogo />
        <div className="text-xs opacity-80">Private • Local‑only • No sign‑in</div>
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
            {status && <div className="mt-3 text-sm text-white/70">{status}</div>}
            {error && <div className="mt-3 text-sm text-red-300">{error}</div>}
          </div>
          <div className="text-center text-xs text-white/60 mt-3">Max file size depends on your browser. Everything stays local.</div>
        </section>

        {/* Results area */}
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold">Results</h2>
              <p className="text-white/70 text-sm">Account: {account || "(from ZIP)"} • Followers: {followers.length} • Following: {following.length} {tab === "unfollowers" && <>• Not following back: {unfollowers.length}</>}</p>
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
          <div className="p-5 rounded-2xl bg-white/10 border border-white/10">
            <h3 className="font-semibold">Local‑only</h3>
            <p className="text-sm text-white/80 mt-1">Your ZIP never leaves your device. Parsing and results are computed in your browser.</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/10 border border-white/10">
            <h3 className="font-semibold">Simple like FreeConvert</h3>
            <p className="text-sm text-white/80 mt-1">Clean central card, big button, easy drag‑and‑drop.</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/10 border border-white/10">
            <h3 className="font-semibold">Future‑ready</h3>
            <p className="text-sm text-white/80 mt-1">Built to add history, engagement scores, and multi‑account later.</p>
          </div>
        </section>

        <footer className="mt-16 text-center text-white/60 text-sm">© {new Date().getFullYear()} WhosFake • Built for privacy</footer>
      </main>
    </div>
  );
}
