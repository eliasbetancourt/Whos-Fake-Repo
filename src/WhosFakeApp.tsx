import React, { useCallback, useMemo, useState } from "react";
import type { TabType } from "./types";
import { parseFollowersFollowingFromZip, extractUsernames, downloadCSV } from "./utils/instagram";
import { brand } from "./utils/brand";
import "./utils/selfTests"; // Run self-tests on import

// Components
import { Header } from "./components/Header";
import { TabsSection } from "./components/TabsSection";
import { InstructionsSection } from "./components/InstructionsSection";
import { FileUploadSection } from "./components/FileUploadSection";
import { UploadedFilesSection } from "./components/UploadedFilesSection";
import { SummaryCards } from "./components/SummaryCards";
import { ResultsTable } from "./components/ResultsTable";
import { FeatureCards } from "./components/FeatureCards";
import { Footer } from "./components/Footer";

export default function WhosFakeApp() {
  // State management
  const [status, setStatus] = useState<string>("");
  const [processingStep, setProcessingStep] = useState<string>("");
  const [account, setAccount] = useState<string | null>(null);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabType>("unfollowers");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // File handling logic
  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setError("");
    setFollowers([]); 
    setFollowing([]);
    setProcessingStep("📁 Reading file...");
    setStatus("Processing your Instagram data (100% local)");
    setUploadedFiles([file]);

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
        if (followers.length === 0 && following.length === 0) {
          setError("Could not find followers/following data in this ZIP. Make sure you requested 'Followers and Following' in JSON.");
        }
      } else if (isJson) {
        setProcessingStep("📄 Parsing JSON file...");
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
        const text = await file.text();
        // Very basic HTML parsing: look for Instagram profile links
        const usernames = Array.from(text.matchAll(/instagram\.com\/(?!accounts|explore|direct|about|developer|legal|privacy|terms|p|stories|reel|tv|[\w-]+\?)([a-zA-Z0-9._]{2,30})/g))
          .map(m => m[1]?.toLowerCase())
          .filter(Boolean);
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

  // Event handlers
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); 
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

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

  // Computed values
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
    const rows = [["username", "profile_url"]].concat(
      filtered.map(u => [u, `https://instagram.com/${u}`])
    );
    downloadCSV(`whosfake_unfollowers_${account || "account"}.csv`, rows);
  };

  return (
    <div className={`${brand.bg} min-h-screen text-white`}>
      <Header />
      
      <main className="mx-auto max-w-4xl px-4 pb-24">
        <h1 className="text-center text-4xl md:text-5xl font-bold">Upload your Instagram ZIP</h1>
        <p className="text-center text-white/80 mt-3">Convert your ZIP into insights — safely on your device.</p>

        <TabsSection tab={tab} setTab={setTab} />
        <InstructionsSection />
        
        <FileUploadSection
          onFileSelect={handleFiles}
          onFileDrop={onDrop}
          status={status}
          processingStep={processingStep}
          error={error}
        />

        <UploadedFilesSection 
          uploadedFiles={uploadedFiles} 
          onRemoveFile={removeFile} 
        />

        <section className="mt-10">
          <SummaryCards 
            followers={followers} 
            following={following} 
            unfollowers={unfollowers} 
          />

          <ResultsTable
            tab={tab}
            unfollowers={unfollowers}
            filtered={filtered}
            query={query}
            account={account}
            onExportCSV={handleCSV}
            onQueryChange={setQuery}
          />
        </section>

        <FeatureCards />
        <Footer />
      </main>
    </div>
  );
}