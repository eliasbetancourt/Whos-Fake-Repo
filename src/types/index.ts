// --- Types ---
export interface StringListItem {
  value?: string;
  username?: string;
  href?: string;
}

export interface InstagramDataItem {
  string_list_data?: StringListItem[];
  username?: string;
  title?: string;
  [key: string]: unknown;
}

export type TabType = "unfollowers" | "pending";