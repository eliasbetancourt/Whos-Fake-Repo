export function InstructionsSection() {
  return (
    <section className="mt-8 rounded-2xl p-6 bg-white/5 border border-white/10">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        📋 How to get your Instagram data
      </h3>
      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <div className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">1</div>
          <div>
            <div className="font-medium text-white">Request your data</div>
            <div className="text-white/70 mt-1">Go to Instagram Settings → Security → Download data</div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">2</div>
          <div>
            <div className="font-medium text-white">Select JSON format</div>
            <div className="text-white/70 mt-1">Choose "JSON" and include "Followers and following"</div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">3</div>
          <div>
            <div className="font-medium text-white">Upload your ZIP</div>
            <div className="text-white/70 mt-1">Download the ZIP file and upload it below</div>
          </div>
        </div>
      </div>
      <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
        <div className="text-orange-200 text-sm">
          <strong>⚠️ Note:</strong> The data request can take up to 48 hours. Make sure to request "Followers and following" data in JSON format.
        </div>
      </div>
    </section>
  );
}