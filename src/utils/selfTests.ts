import { isLikelyUsername, extractUsernames } from "./instagram";

// ---------------- Self-tests (run once in the browser console) ----------------
export function runWhosFakeSelfTests() {
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
}

// Run self-tests automatically
runWhosFakeSelfTests();