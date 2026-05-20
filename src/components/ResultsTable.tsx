/**
 * ResultsTable.tsx
 *
 * Renders the table of "unfollowers".  Each row contains an `<a href>` that
 * sends the user to the offender's Instagram profile.  Because everything in
 * each row originates from the uploaded export, this file is the principal
 * XSS / open-redirect / phishing surface in the app.
 *
 * Mitigations (NIST CSF: PR.DS-5, PR.PT-3):
 *   1. URLs go through `toAbsoluteUrl`, which whitelists ONLY HTTPS instagram.com
 *      (and its subdomains).  `javascript:`, `data:`, `vbscript:`, `file:`,
 *      `blob:`, schema-relative URLs, and cross-origin links are all rejected
 *      and replaced with "#".
 *   2. Usernames are sanitized with `sanitizeDisplayName` (length-capped,
 *      controls/bidi stripped).  React's automatic text-node escaping still
 *      provides the primary XSS defense; this is layered.
 *   3. All anchors carry `rel="noopener noreferrer nofollow"` to prevent
 *      reverse-tabnabbing and reduce SEO juice donated to attacker pages.
 */

import React, { useState } from "react";
import { sanitizeText } from "../analysis";

// ---------------------------------------------------------------------------
// URL hardening
// ---------------------------------------------------------------------------

/** Schemes we will never produce, no matter what the input says. */
const DANGEROUS_SCHEMES = /^(javascript|data|vbscript|file|blob|about|ftp|ws|wss):/i;

/**
 * Convert an arbitrary user-supplied string into a safe Instagram profile URL.
 *
 * Returns "#" for anything we can't prove is safe.  Specifically we require:
 *   • Successful parse by the URL constructor.
 *   • https: protocol (never http:, never javascript:, etc.).
 *   • Hostname is exactly instagram.com OR ends with ".instagram.com".
 *
 * Inputs without a scheme (e.g. "instagram.com/foo") are tentatively prefixed
 * with "https://" and then re-validated; if the result still doesn't pass the
 * allow-list, "#" is returned.
 */
export function toAbsoluteUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== "string") return "#";
  // sanitizeText strips control chars / bidi overrides / NUL — these can
  // bypass naive scheme checks in some browsers.
  const cleaned = sanitizeText(rawUrl, 2048);
  if (!cleaned) return "#";

  // Reject obviously dangerous schemes BEFORE we hand anything to the URL
  // parser, because some old browsers tolerate things like "java\tscript:".
  if (DANGEROUS_SCHEMES.test(cleaned)) return "#";
  // Reject protocol-relative URLs ("//evil.com/...") — they inherit the
  // current scheme and become a phishing vector.
  if (cleaned.startsWith("//")) return "#";

  // If there's no explicit scheme yet, attempt to add https:// and re-check.
  const candidate = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return "#";
  }

  if (parsed.protocol !== "https:") return "#";

  const host = parsed.hostname.toLowerCase();
  const isInstagram = host === "instagram.com" || host.endsWith(".instagram.com");
  if (!isInstagram) return "#";

  // Re-serialize via the URL object — this normalizes encoding and drops
  // anything weird the attacker tried to smuggle in (e.g. userinfo segments).
  // Userinfo (`user:pass@host`) is dropped by clearing username/password.
  parsed.username = "";
  parsed.password = "";
  return parsed.toString();
}

// ---------------------------------------------------------------------------
// Display sanitization
// ---------------------------------------------------------------------------

/**
 * Sanitize an Instagram username for display.  Instagram usernames are
 * limited to [A-Za-z0-9._] and 1–30 chars, but the export is user-controlled
 * so we can't rely on that.  We strip invisibles via `sanitizeText`, then
 * cap to a generous 64 chars.  React's text-node escaping then prevents any
 * residual markup from being interpreted.
 */
function sanitizeDisplayName(value: unknown): string {
  return sanitizeText(value, 64);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ResultsTableProps {
  results: any;
  showNotice?: boolean;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, showNotice = false }) => {
  const [unfollowersList, setUnfollowersList] = useState(results.unfollowers);
  const [crackedRows, setCrackedRows] = useState<Set<number>>(new Set());

  const handleRemoveUser = (index: number) => {
    setUnfollowersList((prev: any[]) => prev.filter((_, i) => i !== index));
  };

  const handleCrack = (index: number) => {
    setCrackedRows(prev => new Set(prev).add(index));
  };

  return (
    <div style={{ marginTop: "3vw" }}>
      <p
        style={{
          textAlign: "center",
          color: "#888",
          fontSize: "0.85rem",
          marginBottom: "1.5vw",
        }}
      >
        {showNotice && <>
          ⚠️ Broken links point to hidden accounts that you follow that were likely deleted or deactivated.
          <br /> You can remove them from this list as they are not in your true following list.
        </>}
      </p>
      <h3>Analysis Results</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "2vw",
          marginBottom: "2vw",
        }}
      >
        <div style={{ textAlign: "center", padding: "2vw", background: "#f8fafc", borderRadius: 12 }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#6d64e8" }}>
            {results.summary.totalFollowers}
          </div>
          <div style={{ color: "#666" }}>Followers</div>
        </div>

        <div style={{ textAlign: "center", padding: "2vw", background: "#f8fafc", borderRadius: 12 }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#3b82f6" }}>
            {results.summary.totalFollowing -
              (results.summary.unfollowers - unfollowersList.length)}
          </div>
          <div style={{ color: "#666" }}>Following</div>
        </div>

        <div style={{ textAlign: "center", padding: "2vw", background: "#f8fafc", borderRadius: 12 }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#ef4444" }}>
            {unfollowersList.length}
          </div>
          <div style={{ color: "#666" }}>Unfollowers</div>
        </div>
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "2vw",
          background: "white",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                padding: 15,
                textAlign: "left",
                background: "#f8fafc",
                fontWeight: 600,
                color: "#374151",
                verticalAlign: "middle",
              }}
            >
              Username
            </th>
            <th
              style={{
                padding: 15,
                textAlign: "left",
                background: "#f8fafc",
                fontWeight: 600,
                color: "#374151",
                verticalAlign: "middle",
              }}
            >
              Following Since
            </th>
            <th
              style={{
                padding: 15,
                textAlign: "center",
                background: "#f8fafc",
                fontWeight: 600,
                color: "#374151",
                verticalAlign: "middle",
              }}
            >
              Unfollow
            </th>
            <th
              style={{
                padding: 15,
                textAlign: "center",
                background: "#f8fafc",
                fontWeight: 600,
                color: "#374151",
                verticalAlign: "middle",
              }}
            >
              Remove
            </th>
          </tr>
        </thead>
        <tbody>
          {unfollowersList.map((user: any, index: number) => {
            // Sanitize timestamp into a friendly string, or fall back to "-".
            let since = "-";
            if (typeof user.timestamp === "number" && Number.isFinite(user.timestamp)) {
              const ms = user.timestamp * 1000;
              const date = new Date(ms);
              if (!Number.isNaN(date.getTime())) {
                since = date.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
              }
            }

            // Sanitize username for display (React still escapes text nodes).
            const safeUsername = sanitizeDisplayName(user.username) || `Missing_${index}`;
            // Whitelist URL through Instagram-only allow-list.
            const profileHref = toAbsoluteUrl(user.profileUrl);
            const linkable = profileHref !== "#";

            return (
              <tr key={safeUsername + ":" + index}>
                <td
                  style={{
                    padding: 15,
                    borderBottom: "1px solid #e5e7eb",
                    background: "white",
                    color: "#3b82f6",
                    fontWeight: 600,
                    verticalAlign: "middle",
                    textAlign: "left",
                  }}
                >
                  {linkable ? (
                    <a
                      href={profileHref}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      referrerPolicy="no-referrer"
                      style={{ color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}
                    >
                      @{safeUsername}
                    </a>
                  ) : (
                    <span title="Profile link unavailable">@{safeUsername}</span>
                  )}
                </td>
                <td
                  style={{
                    padding: 15,
                    borderBottom: "1px solid #e5e7eb",
                    background: "white",
                    color: "#6b7280",
                    fontSize: "1rem",
                    verticalAlign: "middle",
                    textAlign: "left",
                  }}
                >
                  {since}
                </td>
                <td
                  style={{
                    padding: 15,
                    borderBottom: "1px solid #e5e7eb",
                    background: "white",
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  {linkable ? (
                    <a
                      href={profileHref}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      referrerPolicy="no-referrer"
                      style={{ display: "inline-block", position: "relative", height: 44, width: 80 }}
                      onClick={() => handleCrack(index)}
                    >
                      <img
                        src={crackedRows.has(index) ? "/crackedfollowingbutton.png" : "/folllowingbutton.png"}
                        alt="Unfollow"
                        style={{
                          height: 100,
                          width: "auto",
                          cursor: "pointer",
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                        }}
                      />
                    </a>
                  ) : (
                    <div style={{ display: "inline-block", position: "relative", height: 44, width: 80 }}>
                      <img
                        src="/folllowingbutton.png"
                        alt="Unfollow (link unavailable)"
                        style={{
                          height: 100,
                          width: "auto",
                          opacity: 0.4,
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                        }}
                      />
                    </div>
                  )}
                </td>
                <td
                  style={{
                    padding: 15,
                    borderBottom: "1px solid #e5e7eb",
                    background: "white",
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  <img
                    src="/removebutton.png"
                    alt="Remove"
                    onClick={() => handleRemoveUser(index)}
                    style={{
                      height: 44,
                      width: "auto",
                      cursor: "pointer",
                      display: "block",
                      margin: "0 auto",
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
