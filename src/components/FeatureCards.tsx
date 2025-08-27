import { LockIcon } from "./Icons";

export function FeatureCards() {
  return (
    <section className="mt-12 grid md:grid-cols-3 gap-4">
      <div className="p-5 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition">
        <div className="flex items-center gap-2 mb-2">
          <LockIcon size={16} />
          <h3 className="font-semibold">100% Private</h3>
        </div>
        <p className="text-sm text-white/80">
          Your files never leave your device. All processing happens locally in your browser for complete privacy.
        </p>
      </div>
      <div className="p-5 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">⚡</span>
          <h3 className="font-semibold">Instant Results</h3>
        </div>
        <p className="text-sm text-white/80">
          Upload your Instagram data and get detailed insights immediately with our fast, client-side processing.
        </p>
      </div>
      <div className="p-5 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📊</span>
          <h3 className="font-semibold">Detailed Analytics</h3>
        </div>
        <p className="text-sm text-white/80">
          Get comprehensive follower insights, unfollower lists, and export data for further analysis.
        </p>
      </div>
    </section>
  );
}