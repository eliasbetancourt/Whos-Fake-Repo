import { MagnifierLogo, LockIcon } from "./Icons";

export function Header() {
  return (
    <header className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between">
      <MagnifierLogo />
      <div className="text-xs opacity-80 flex items-center gap-1">
        <LockIcon size={12} />
        Private • Local‑only • No sign‑in
      </div>
    </header>
  );
}