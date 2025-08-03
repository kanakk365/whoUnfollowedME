export interface TwitterUser {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
}

export interface ComparisonResult {
  unfollowers: TwitterUser[];
  followersCount: number;
  followingCount: number;
  unfollowersCount: number;
}

export function getUnfollowers(following: TwitterUser[], followers: TwitterUser[]): ComparisonResult {
  const followersSet = new Set(followers.map(user => user.id));
  const unfollowers = following.filter(user => !followersSet.has(user.id));
  
  return {
    unfollowers,
    followersCount: followers.length,
    followingCount: following.length,
    unfollowersCount: unfollowers.length
  };
}

export function parseTwitterUser(userData: any): TwitterUser {
  return {
    id: userData.id_str || userData.id,
    username: userData.screen_name || userData.username,
    displayName: userData.name || userData.display_name,
    profileImageUrl: userData.profile_image_url_https || userData.profile_image_url
  };
}

export function deduplicateUsers(users: TwitterUser[]): TwitterUser[] {
  const seen = new Set<string>();
  return users.filter(user => {
    if (seen.has(user.id)) {
      return false;
    }
    seen.add(user.id);
    return true;
  });
} 