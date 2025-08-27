import type { TabType } from "../types";
import { brand } from "../utils/brand";

interface ResultsTableProps {
  tab: TabType;
  unfollowers: string[];
  filtered: string[];
  query: string;
  account: string | null;
  onExportCSV: () => void;
  onQueryChange: (query: string) => void;
}

export function ResultsTable({ tab, unfollowers, filtered, query, account, onExportCSV, onQueryChange }: ResultsTableProps) {
  const list = query ? filtered : unfollowers;

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Results</h2>
          <p className="text-white/70 text-sm">
            Account: {account || "(from ZIP)"} 
            {tab === "unfollowers" && unfollowers.length > 0 && (
              <> • Showing {query ? filtered.length : unfollowers.length} unfollowers</>
            )}
          </p>
        </div>
        {tab === "unfollowers" && unfollowers.length > 0 && (
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search username…"
              className="px-3 py-2 rounded-xl bg-white text-slate-800 placeholder-slate-400 w-56"
            />
            <button 
              onClick={onExportCSV} 
              className="px-3 py-2 rounded-xl bg-white text-slate-800 font-medium hover:bg-slate-100"
            >
              Export CSV
            </button>
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
              {list.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-500">
                    {unfollowers.length === 0 ? "Upload a ZIP to see results." : "No matches for your search."}
                  </td>
                </tr>
              ) : (
                list.map((u, i) => {
                  const url = `https://instagram.com/${u}`;
                  return (
                    <tr key={u} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="py-3 pl-4 pr-2 text-slate-500">{i + 1}</td>
                      <td className="py-3 px-2 font-medium">{u}</td>
                      <td className="py-3 px-2">
                        <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          {url}
                        </a>
                      </td>
                      <td className="py-3 px-2">
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-block px-3 py-1.5 rounded-lg text-white" 
                          style={{ backgroundColor: brand.blue }}
                        >
                          Open profile
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          <div className="bg-white text-slate-800 p-8 text-center">
            <p className="text-slate-600">Pending Requests will appear here when parsed from your ZIP. (Coming soon)</p>
          </div>
        )}
      </div>
    </>
  );
}