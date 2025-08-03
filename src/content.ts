// Safe HTML scraping approach - no network interception

interface StorageData {
  followers: any[];
  following: any[];
  lastUpdated: number;
}

interface TwitterUser {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  profileUrl?: string; // Add profile URL
  bio?: string;
  followsYou?: boolean;
}

class SafeTwitterDataCollector {
  private followers: TwitterUser[] = [];
  private following: TwitterUser[] = [];
  private isCollecting = false;
  private processedUsers = new Set<string>(); // Track processed users to avoid duplicates
  private scrollCount = 0;
  private maxScrolls = 80; // Increased from 50 to capture even more data
  private minDelay = 1500; // Reduced from 2000ms for faster collection
  private maxDelay = 4000; // Reduced from 6000ms for faster collection
  private pendingTimeouts: number[] = []; // Track all pending timeouts for cleanup

  constructor() {
    console.log('[WhoUnfollowedMe] Initializing Safe Twitter Data Collector');
    this.init();
  }

  private init() {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      console.log('[WhoUnfollowedMe] Received message:', request);
      if (request.action === 'getData') {
        sendResponse({
          followers: this.followers,
          following: this.following,
          lastUpdated: Date.now()
        });
      } else if (request.action === 'startCollection') {
        this.startCollection();
        sendResponse({ success: true });
      } else if (request.action === 'stopDataCollection') {
        this.stopCollection();
        sendResponse({ success: true });
      } else if (request.action === 'forceStopAll') {
        this.forceStopAll();
        sendResponse({ success: true });
      }
    });

    // Add page unload listener to clean up when user navigates away
    window.addEventListener('beforeunload', () => {
      this.forceStopAll();
    });

    // Add visibility change listener to stop when tab becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('[WhoUnfollowedMe] Tab hidden, stopping collection');
        this.forceStopAll();
      }
    });

    if (this.isProfilePage()) {
      console.log('[WhoUnfollowedMe] On profile page, will auto-start collection in 10s');
      const autoStartTimeout = setTimeout(() => {
        if (this.isProfilePage() && !this.isCollecting) {
          console.log('[WhoUnfollowedMe] Auto-starting collection after 10s');
          this.startCollection();
        }
      }, 10000);
      this.pendingTimeouts.push(autoStartTimeout);
    }
  }

  private isProfilePage(): boolean {
    const path = window.location.pathname;
    const isProfile = path.includes('/followers') || path.includes('/following');
    console.log('[WhoUnfollowedMe] isProfilePage:', isProfile, path);
    return isProfile;
  }

  private isMainListUserCell(element: Element): boolean {
    // Check if this UserCell is part of the main followers/following list
    // and not a suggestion box or other sidebar element
    
    // Check if we're in the main content area (not sidebar)
    const isInSidebar = element.closest('[data-testid="sidebarColumn"]') !== null;
    if (isInSidebar) {
      console.log('[WhoUnfollowedMe] Skipping sidebar element');
      return false;
    }
    
    // Check if we're in a suggestion box (like "Who to follow")
    const isInSuggestionBox = element.closest('[aria-label*="suggest"]') !== null ||
                              element.closest('[aria-label*="recommend"]') !== null ||
                              element.closest('[aria-label*="Who to follow"]') !== null ||
                              element.closest('[aria-label*="You might like"]') !== null;
    if (isInSuggestionBox) {
      console.log('[WhoUnfollowedMe] Skipping suggestion box element');
      return false;
    }
    
    // Check if the element is within the main timeline/list area
    const isInMainArea = element.closest('[data-testid="primaryColumn"]') !== null ||
                         element.closest('[role="main"]') !== null ||
                         element.closest('[data-testid="cellInnerDiv"]') !== null;
    
    // Additional check: make sure we're on a followers/following page
    const isOnCorrectPage = this.isProfilePage();
    
    return isInMainArea && isOnCorrectPage;
  }

  private extractUserFromElement(userElement: Element): TwitterUser | null {
    try {
      // Extract username from href attribute
      const usernameLink = userElement.querySelector('a[href^="/"]');
      if (!usernameLink) return null;
      
      const href = usernameLink.getAttribute('href');
      if (!href || href === '/') return null;
      
      const username = href.substring(1); // Remove leading slash
      const profileUrl = `https://x.com${href}`; // Full profile URL
      
      // Skip if already processed
      if (this.processedUsers.has(username)) return null;
      
      // Extract display name
      const displayNameElement = userElement.querySelector('[dir="ltr"] span');
      const displayName = displayNameElement?.textContent?.trim() || username;
      
      // Extract profile image
      const imgElement = userElement.querySelector('img[src*="profile_images"]');
      const profileImageUrl = imgElement?.getAttribute('src') || '';
      
      // Extract bio
      const bioElement = userElement.querySelector('[dir="auto"] span');
      const bio = bioElement?.textContent?.trim() || '';
      
      // Check if follows you - look for the "Follows you" indicator
      const followsYouElement = userElement.querySelector('[data-testid="userFollowIndicator"]');
      const followsYou = followsYouElement?.textContent?.includes('Follows you') || false;
      
      // Also check for follow button text to determine relationship
      const followButton = userElement.querySelector('button[data-testid*="follow"]');
      const followButtonText = followButton?.textContent?.trim() || '';
      
      // If button says "Follow" or "Follow back", they don't follow you
      const doesntFollowYou = followButtonText === 'Follow' || followButtonText === 'Follow back';
      
      // They follow you if they have the "Follows you" badge OR if they don't have a follow button
      const actuallyFollowsYou = followsYou || (!followButton && !doesntFollowYou);
      
      const user: TwitterUser = {
        id: username, // Use username as ID since we don't have numeric ID
        username,
        displayName,
        profileImageUrl,
        profileUrl, // Add profileUrl
        bio,
        followsYou: actuallyFollowsYou
      };
      
      console.log('[WhoUnfollowedMe] Extracted user:', {
        ...user,
        followButtonText,
        doesntFollowYou,
        hasFollowsYouBadge: followsYou,
        actuallyFollowsYou
      });
      
      // Add visual indicator for users who don't follow you
      if (!user.followsYou) {
        // Only highlight if this is part of the main list (not suggestion box)
        if (this.isMainListUserCell(userElement)) {
          this.highlightUnfollower(userElement, username);
        }
      }
      
      return user;
    } catch (error) {
      console.error('[WhoUnfollowedMe] Error extracting user from element:', error);
      return null;
    }
  }

  private highlightUnfollower(userElement: Element, username: string) {
    try {
      // Add a subtle red border to indicate they don't follow you
      const userCell = userElement.closest('[data-testid="UserCell"]') as HTMLElement;
      if (userCell) {
        userCell.setAttribute('data-unfollower', 'true');
        userCell.style.border = '2px solid #ff6b6b';
        userCell.style.borderRadius = '8px';
        userCell.style.margin = '2px';
        userCell.style.backgroundColor = 'rgba(255, 107, 107, 0.05)';
        
        // Add a small indicator
        const indicator = document.createElement('div');
        indicator.style.cssText = `
          position: absolute;
          top: 5px;
          right: 5px;
          background: #ff6b6b;
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: bold;
          z-index: 1000;
        `;
        indicator.textContent = '🚫';
        indicator.title = `@${username} doesn't follow you back`;
        
        userCell.style.position = 'relative';
        userCell.appendChild(indicator);
        
        console.log(`[WhoUnfollowedMe] Highlighted unfollower: @${username}`);
      }
    } catch (error) {
      console.error('[WhoUnfollowedMe] Error highlighting unfollower:', error);
    }
  }

  private collectVisibleUsers() {
    console.log('[WhoUnfollowedMe] Collecting visible users...');
    
    // Find all user cells
    const userElements = document.querySelectorAll('[data-testid="UserCell"]');
    console.log(`[WhoUnfollowedMe] Found ${userElements.length} total user elements`);
    
    let mainListElements = 0;
    let newUsers = 0;
    const isFollowersPage = window.location.pathname.includes('/followers');
    
    userElements.forEach((element) => {
      if (this.isMainListUserCell(element)) {
        mainListElements++;
        const user = this.extractUserFromElement(element);
        if (user && !this.processedUsers.has(user.username)) {
          this.processedUsers.add(user.username);
          
          if (isFollowersPage) {
            this.followers.push(user);
            console.log(`[WhoUnfollowedMe] Added follower: ${user.username}`);
          } else {
            this.following.push(user);
            console.log(`[WhoUnfollowedMe] Added following: ${user.username}`);
          }
          newUsers++;
        }
      }
    });
    
    console.log(`[WhoUnfollowedMe] Filtered: ${userElements.length - mainListElements} suggestion/sidebar elements, ${mainListElements} main list elements`);
    
    if (newUsers > 0) {
      console.log(`[WhoUnfollowedMe] Collected ${newUsers} new users`);
      this.saveToStorage();
    } else {
      console.log('[WhoUnfollowedMe] No new users found');
    }
  }

  private saveToStorage() {
    const data: StorageData = {
      followers: this.followers,
      following: this.following,
      lastUpdated: Date.now()
    };
    chrome.storage.local.set({ twitterData: data }, () => {
      console.log('[WhoUnfollowedMe] Data saved to storage:', {
        followers: this.followers.length,
        following: this.following.length
      });
    });
  }

  private startCollection() {
    if (this.isCollecting) {
      console.log('[WhoUnfollowedMe] Collection already in progress.');
      return;
    }
    
    this.isCollecting = true;
    this.scrollCount = 0;
    console.log('[WhoUnfollowedMe] Starting safe data collection...');
    
    // Collect initial visible users
    this.collectVisibleUsers();
    
    // Start scrolling
    this.safeScroll();
  }

  private safeScroll() {
    if (this.scrollCount >= this.maxScrolls || !this.isCollecting) {
      this.isCollecting = false;
      console.log('[WhoUnfollowedMe] Data collection completed safely');
      return;
    }
    
    // Random scroll amount (300-800 pixels) - increased for faster scrolling
    const scrollAmount = Math.floor(Math.random() * 500) + 300;
    window.scrollBy(0, scrollAmount);
    this.scrollCount++;
    
    console.log(`[WhoUnfollowedMe] Scrolled (${this.scrollCount}/${this.maxScrolls}), amount: ${scrollAmount}`);
    
    // Wait for content to load (reduced wait time)
    const contentLoadTimeout = setTimeout(() => {
      // Check if still collecting before proceeding
      if (!this.isCollecting) {
        console.log('[WhoUnfollowedMe] Collection stopped, skipping content collection');
        return;
      }
      
      this.collectVisibleUsers();
      
      // Check again before scheduling next scroll
      if (!this.isCollecting) {
        console.log('[WhoUnfollowedMe] Collection stopped, not scheduling next scroll');
        return;
      }
      
      // Random delay between scrolls (1.5-4 seconds) - faster collection
      const delay = Math.floor(Math.random() * (this.maxDelay - this.minDelay)) + this.minDelay;
      
      // Occasionally add extra pause for human-like behavior (reduced frequency)
      if (Math.random() < 0.2) {
        console.log('[WhoUnfollowedMe] Extra pause for human-like behavior');
        const extraPauseTimeout = setTimeout(() => {
          if (this.isCollecting) {
            this.safeScroll();
          }
        }, delay + 1500);
        this.pendingTimeouts.push(extraPauseTimeout);
      } else {
        const nextScrollTimeout = setTimeout(() => {
          if (this.isCollecting) {
            this.safeScroll();
          }
        }, delay);
        this.pendingTimeouts.push(nextScrollTimeout);
      }
    }, 800); // Wait 800ms for content to load (reduced from 1000ms)
    
    this.pendingTimeouts.push(contentLoadTimeout);
  }

  public collectData() {
    this.startCollection();
  }

  // Debug method to check current state
  public debug() {
    console.log('[WhoUnfollowedMe] Debug Info:');
    console.log('- Followers count:', this.followers.length);
    console.log('- Following count:', this.following.length);
    console.log('- Is collecting:', this.isCollecting);
    console.log('- Scroll count:', this.scrollCount);
    console.log('- Processed users:', this.processedUsers.size);
    console.log('- Current URL:', window.location.href);
    console.log('- Is profile page:', this.isProfilePage());
    
    // Get unfollowers
    const unfollowers = this.getUnfollowers();
    console.log('- Unfollowers count:', unfollowers.length);
    console.log('- Unfollowers:', unfollowers.map(u => `@${u.username} (${u.displayName})`));
    
    return {
      followers: this.followers,
      following: this.following,
      isCollecting: this.isCollecting,
      scrollCount: this.scrollCount,
      processedUsers: this.processedUsers.size,
      currentUrl: window.location.href,
      isProfilePage: this.isProfilePage(),
      unfollowers: unfollowers
    };
  }

  // Get all users who don't follow you back
  public getUnfollowers(): TwitterUser[] {
    return this.following.filter(user => !user.followsYou);
  }

  // Get all users who follow you back
  public getFollowersBack(): TwitterUser[] {
    return this.following.filter(user => user.followsYou);
  }

  // Get all unfollowers with profile links (for easy access)
  public getAllUnfollowersWithLinks(): { username: string; displayName: string; profileUrl: string }[] {
    return this.getUnfollowers().map(user => ({
      username: user.username,
      displayName: user.displayName,
      profileUrl: user.profileUrl || `https://x.com/${user.username}`
    }));
  }

  // Public method to stop collection
  public stopCollection() {
    this.isCollecting = false;
    console.log('[WhoUnfollowedMe] Data collection stopped manually');
    // Clear all pending timeouts to prevent any further scrolls
    const timeoutCount = this.pendingTimeouts.length;
    this.pendingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.pendingTimeouts = [];
    console.log(`[WhoUnfollowedMe] Cleared ${timeoutCount} pending timeouts`);
  }

  // Public method to check if collection is active
  public isCollectionActive(): boolean {
    return this.isCollecting;
  }

  // Force stop all activities and clear all data
  public forceStopAll() {
    console.log('[WhoUnfollowedMe] Force stopping all activities...');
    this.isCollecting = false;
    
    // Clear all pending timeouts
    const timeoutCount = this.pendingTimeouts.length;
    this.pendingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.pendingTimeouts = [];
    console.log(`[WhoUnfollowedMe] Cleared ${timeoutCount} pending timeouts`);
    
    // Reset all state
    this.scrollCount = 0;
    this.processedUsers.clear();
    this.followers = [];
    this.following = [];
    
    // Save empty data to storage
    this.saveToStorage();
    
    console.log('[WhoUnfollowedMe] All activities stopped and data cleared.');
  }
}

console.log('[WhoUnfollowedMe] Safe content script loaded');

const collector = new SafeTwitterDataCollector();

// Expose to window for debugging
(window as any).twitterCollector = collector;
(window as any).debugUnfollowers = () => collector.debug();
(window as any).getUnfollowers = () => collector.getUnfollowers();
(window as any).getFollowersBack = () => collector.getFollowersBack();
(window as any).getAllUnfollowersWithLinks = () => collector.getAllUnfollowersWithLinks();
(window as any).stopCollection = () => collector.stopCollection(); // Expose stopCollection
(window as any).isCollectionActive = () => collector.isCollectionActive(); // Expose isCollectionActive
(window as any).forceStopAll = () => collector.forceStopAll(); // Expose forceStopAll

console.log('[WhoUnfollowedMe] Debug functions available:');
console.log('- window.twitterCollector.debug() - Get debug info');
console.log('- window.debugUnfollowers() - Quick debug info');
console.log('- window.getUnfollowers() - Get list of users who don\'t follow you back');
console.log('- window.getFollowersBack() - Get list of users who follow you back');
console.log('- window.getAllUnfollowersWithLinks() - Get unfollowers with profile links');
console.log('- window.stopCollection() - Stop data collection manually');
console.log('- window.isCollectionActive() - Check if collection is currently active');
console.log('- window.forceStopAll() - Force stop all activities and clear data');

// Visual indicator
const indicator = document.createElement('div');
indicator.style.cssText = `
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(34, 197, 94, 0.9);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  z-index: 10000;
  pointer-events: none;
  opacity: 0.8;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
`;
indicator.textContent = '🛡️ Safe Mode Active';
document.body.appendChild(indicator);

// Fade out indicator after 5 seconds
setTimeout(() => {
  indicator.style.opacity = '0';
  setTimeout(() => indicator.remove(), 1000);
}, 5000); 