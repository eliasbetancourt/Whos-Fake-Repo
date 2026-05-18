/**
 * analysis.ts
 *
 * Pure, browser-side parsing of an Instagram data export.  Every value entering
 * this module originates from a file the user dropped onto the page; we treat
 * it as fully untrusted.  Validation and sanitization here form the first line
 * of defense and feed into the XSS / URL hardening in ResultsTable.tsx.
 *
 * NIST CSF alignment:
 *   PR.DS-2 (Data-in-transit / at-rest)  — never leaves the browser.
 *   PR.IP-1 (Baseline config)            — strict input shapes.
 *   DE.CM-4 (Malicious code detection)   — reject obviously hostile payloads.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface User {
  username: string;
  profileUrl: string;
  timestamp?: number;
}

export interface AnalysisResult {
  followers: User[];
  following: User[];
  unfollowers: User[];
}

// ---------------------------------------------------------------------------
// Limits — defense against denial-of-service via maliciously large inputs.
// These caps are generous enough for any realistic Instagram export but
// prevent a hostile JSON from exhausting browser memory or CPU.
// ---------------------------------------------------------------------------

/** Maximum number of follower / following entries we will process. */
export const MAX_USER_ENTRIES = 500_000;
/** Maximum length of any single string field after trimming. */
export const MAX_FIELD_LENGTH = 2_048;
/** Earliest plausible Instagram timestamp (Oct 2010 launch, with slack). */
const MIN_TIMESTAMP_SECONDS = 1_262_304_000; // 2010-01-01
/** Latest plausible timestamp: 10 years into the future from now. */
const MAX_TIMESTAMP_SECONDS = Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 3600;

// ---------------------------------------------------------------------------
// Sanitizers
// ---------------------------------------------------------------------------

/**
 * Strip ASCII control characters (including NUL, BOM, bidi overrides) and
 * trim whitespace.  Caps the length to prevent layout / memory blowups.
 * React already escapes text nodes, but we additionally remove invisible
 * characters that could be used for homograph / spoofing attacks.
 */
export function sanitizeText(value: unknown, maxLen: number = MAX_FIELD_LENGTH): string {
  if (typeof value !== "string") return "";
  // Strip dangerous invisibles:
  //   \x00-\x1F  ASCII C0 controls (NUL, tab, newline, ...)
  //   \x7F        DEL
  //   \u200B-\u200F  zero-width space, LRM, RLM
  //   \u202A-\u202E  bidi override controls (Trojan-Source class of attacks)
  //   \u2066-\u2069  bidi isolate-format controls
  //   \uFEFF      BOM / zero-width no-break space
  // eslint-disable-next-line no-control-regex
  const stripped = value.replace(/[\x00-\x1F\x7F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "");
  const trimmed = stripped.trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

/**
 * Validate a numeric Unix timestamp (seconds).  Returns `undefined` for
 * anything missing, non-finite, or outside a plausible range, so the UI can
 * render "-" instead of an attacker-supplied date string.
 */
export function sanitizeTimestamp(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return undefined;
  if (n < MIN_TIMESTAMP_SECONDS || n > MAX_TIMESTAMP_SECONDS) return undefined;
  return Math.floor(n);
}

// ---------------------------------------------------------------------------
// Structural validators — reject payloads that don't look like Instagram data.
// ---------------------------------------------------------------------------

/** True if `v` is a non-null, non-array object literal. */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export class InvalidInstagramDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInstagramDataError";
  }
}

/**
 * Validate `followers_1.json`: expected to be an array of entries, each
 * containing a `string_list_data` array of {value, href, timestamp}.
 */
export function assertFollowersShape(json: unknown): asserts json is unknown[] {
  if (!Array.isArray(json)) {
    throw new InvalidInstagramDataError(
      "followers_1.json must be a JSON array."
    );
  }
  if (json.length > MAX_USER_ENTRIES) {
    throw new InvalidInstagramDataError(
      `followers_1.json contains too many entries (>${MAX_USER_ENTRIES}).`
    );
  }
}

/**
 * Validate `following.json`: expected to be an object with a
 * `relationships_following` array.
 */
export function assertFollowingShape(json: unknown): asserts json is { relationships_following: unknown[] } {
  if (!isPlainObject(json)) {
    throw new InvalidInstagramDataError(
      "following.json must be a JSON object."
    );
  }
  const list = (json as Record<string, unknown>).relationships_following;
  if (!Array.isArray(list)) {
    throw new InvalidInstagramDataError(
      "following.json is missing the 'relationships_following' array."
    );
  }
  if (list.length > MAX_USER_ENTRIES) {
    throw new InvalidInstagramDataError(
      `following.json contains too many entries (>${MAX_USER_ENTRIES}).`
    );
  }
}

// ---------------------------------------------------------------------------
// Parsing — all per-record values pass through sanitizers.
// ---------------------------------------------------------------------------

/**
 * Pull users out of a validated followers_1.json payload.  Each candidate
 * record is checked structurally; anything malformed is silently dropped.
 */
export function parseFollowersData(json: unknown[]): User[] {
  const users: User[] = [];
  for (const entry of json) {
    if (!isPlainObject(entry)) continue;
    const list = entry.string_list_data;
    if (!Array.isArray(list)) continue;
    const fallbackTitle = sanitizeText(entry.title);
    for (const s of list) {
      if (!isPlainObject(s)) continue;
      const username = sanitizeText(s.value) || fallbackTitle;
      const profileUrl = sanitizeText(s.href);
      const timestamp = sanitizeTimestamp(s.timestamp);
      if (!username) continue;
      users.push({ username, profileUrl, timestamp });
      if (users.length >= MAX_USER_ENTRIES) return users;
    }
  }
  return users;
}

/**
 * Pull users out of a validated following.json payload.
 */
export function parseFollowingData(json: { relationships_following: unknown[] }): User[] {
  const users: User[] = [];
  for (const entry of json.relationships_following) {
    if (!isPlainObject(entry)) continue;
    const list = entry.string_list_data;
    if (!Array.isArray(list)) continue;
    const fallbackTitle = sanitizeText(entry.title);
    for (const s of list) {
      if (!isPlainObject(s)) continue;
      const username = sanitizeText(s.value) || fallbackTitle;
      const profileUrl = sanitizeText(s.href);
      const timestamp = sanitizeTimestamp(s.timestamp);
      if (!username) continue;
      users.push({ username, profileUrl, timestamp });
      if (users.length >= MAX_USER_ENTRIES) return users;
    }
  }
  return users;
}

/**
 * Top-level entry point.  Validates shapes first, then diffs the two lists.
 * Throws `InvalidInstagramDataError` on malformed input so the UI can show a
 * friendly error rather than crashing on a TypeError.
 */
export function analyzeFollowersAndFollowing(
  followersJson: unknown,
  followingJson: unknown
): AnalysisResult {
  assertFollowersShape(followersJson);
  assertFollowingShape(followingJson);

  const followers = parseFollowersData(followersJson);
  const following = parseFollowingData(followingJson);
  const followerUsernames = new Set(
    followers.map((f) => f.username.toLowerCase().trim())
  );
  const unfollowers = following.filter(
    (f) => !followerUsernames.has(f.username.toLowerCase().trim())
  );
  return { followers, following, unfollowers };
}
