import type { TabType } from "../types";

interface TabsSectionProps {
  tab: TabType;
  setTab: (tab: TabType) => void;
}

export function TabsSection({ tab, setTab }: TabsSectionProps) {
  const tabs = [
    { id: "unfollowers" as const, label: "Unfollowers" },
    { id: "pending" as const, label: "Pending Requests" },
  ];

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
            tab === t.id 
              ? "bg-white text-slate-900" 
              : "bg-white/10 border-white/20 text-white/90 hover:bg-white/20"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}