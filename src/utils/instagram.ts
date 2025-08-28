import JSZip from "jszip";
import type { InstagramDataItem } from "../types";

export const isLikelyUsername = (s: string) => /^[a-z0-9._]{2,30}$/i.test(s || "");

export function extractUsernames(json: unknown): string[] {
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

export async function parseFollowersFollowingFromZip(file: File): Promise<{ followers: string[]; following: string[]; accountId: string | null; }> {
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

// Utility: download CSV in-browser
export function downloadCSV(filename: string, rows: string[][]) {
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
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}