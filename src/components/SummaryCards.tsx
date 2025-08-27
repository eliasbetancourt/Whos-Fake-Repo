interface SummaryCardsProps {
  followers: string[];
  following: string[];
  unfollowers: string[];
}

export function SummaryCards({ followers, following, unfollowers }: SummaryCardsProps) {
  if (followers.length === 0 && following.length === 0) return null;

  const followBackRate = following.length > 0 ? Math.round((followers.length / following.length) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="p-4 rounded-xl bg-white/10 border border-white/20">
        <div className="text-2xl font-bold text-white">{followers.length}</div>
        <div className="text-sm text-white/70">Followers</div>
      </div>
      <div className="p-4 rounded-xl bg-white/10 border border-white/20">
        <div className="text-2xl font-bold text-white">{following.length}</div>
        <div className="text-sm text-white/70">Following</div>
      </div>
      <div className="p-4 rounded-xl bg-white/10 border border-white/20">
        <div className="text-2xl font-bold text-red-300">{unfollowers.length}</div>
        <div className="text-sm text-white/70">Not Following Back</div>
      </div>
      <div className="p-4 rounded-xl bg-white/10 border border-white/20">
        <div className="text-2xl font-bold text-green-300">{followBackRate}%</div>
        <div className="text-sm text-white/70">Follow Back Rate</div>
      </div>
    </div>
  );
}