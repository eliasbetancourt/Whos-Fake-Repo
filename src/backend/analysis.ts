import fs from 'fs/promises';

export interface User {
  username: string;
  profileUrl: string;
  timestamp?: number;
}

export interface UnfollowerResult {
  username: string;
  profileUrl: string;
  timestamp?: number;
}

export interface AnalysisResult {
  totalFollowers: number;
  totalFollowing: number;
  unfollowers: UnfollowerResult[];
}

// Parse followers_1.json (array of objects with string_list_data)
async function parseFollowersFile(filePath: string): Promise<User[]> {
  const data = await fs.readFile(filePath, 'utf-8');
  const arr = JSON.parse(data);
  return arr.flatMap((entry: any) =>
    (entry.string_list_data || []).map((s: any) => ({
      username: s.value,
      profileUrl: s.href,
      timestamp: s.timestamp
    }))
  );
}

// Parse following.json (object with relationships_following array)
async function parseFollowingFile(filePath: string): Promise<User[]> {
  const data = await fs.readFile(filePath, 'utf-8');
  const json = JSON.parse(data);
  return (json.relationships_following || []).flatMap((entry: any) =>
    (entry.string_list_data || []).map((s: any) => ({
      username: s.value,
      profileUrl: s.href,
      timestamp: s.timestamp
    }))
  );
}

export async function analyzeFollowersAndFollowing(followersFile: string, followingFile: string): Promise<AnalysisResult> {
  const followers = await parseFollowersFile(followersFile);
  const following = await parseFollowingFile(followingFile);

  const followerUsernames = new Set(followers.map(f => f.username));
  const unfollowers = following.filter(f => !followerUsernames.has(f.username));

  return {
    totalFollowers: followers.length,
    totalFollowing: following.length,
    unfollowers: unfollowers.map(u => ({
      username: u.username,
      profileUrl: u.profileUrl,
      timestamp: u.timestamp
    }))
  };
}
