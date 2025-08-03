import { useEffect, useState } from 'react';

interface TwitterUser {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  profileUrl?: string; // Add profile URL
  bio?: string;
  followsYou?: boolean;
}

interface TwitterData {
  followers: TwitterUser[];
  following: TwitterUser[];
  lastUpdated: number;
}

export default function Popup() {
  const [data, setData] = useState<TwitterData>({ followers: [], following: [], lastUpdated: 0 });
  const [unfollowers, setUnfollowers] = useState<TwitterUser[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectionInterval, setCollectionInterval] = useState<number | null>(null);
  const [collectionTimeout, setCollectionTimeout] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
    
    // Cleanup function to clear intervals and timeouts on unmount
    return () => {
      if (collectionInterval) {
        clearInterval(collectionInterval);
      }
      if (collectionTimeout) {
        clearTimeout(collectionTimeout);
      }
      // Force stop all content script activities when popup closes
      chrome.runtime.sendMessage({ action: 'forceStopAll' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Popup closed - content script not ready:', chrome.runtime.lastError);
        } else if (response?.error) {
          console.log('Popup closed - stop error:', response.error);
        } else {
          console.log('[WhoUnfollowedMe] Popup closed - all activities stopped');
        }
      });
    };
  }, []);

  const loadData = () => {
    chrome.runtime.sendMessage({ action: 'getTwitterData' }, (response) => {
      if (response) {
        setData(response);
        // Use the new data format where each user has followsYou property
        const unfollowersList = response.following?.filter((user: TwitterUser) => !user.followsYou) || [];
        setUnfollowers(unfollowersList);
      }
    });
  };

  const startCollection = () => {
    setIsCollecting(true);
    
    // First check if we're on a Twitter/X page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (!currentTab?.url) {
        setIsCollecting(false);
        alert('Failed to start data collection. No active tab found.');
        return;
      }
      
      const url = new URL(currentTab.url);
      if (url.hostname !== 'twitter.com' && url.hostname !== 'x.com') {
        setIsCollecting(false);
        alert('Failed to start data collection. Please navigate to Twitter/X first.');
        return;
      }
      
      // Now start the collection
      chrome.runtime.sendMessage({ action: 'startDataCollection' }, (response) => {
        if (response?.success) {
          // Poll for updates every 8 seconds (faster updates)
          const interval = setInterval(() => {
            loadData();
          }, 8000);
          setCollectionInterval(interval);

          // Stop polling after 5 minutes (increased for more data collection)
          const timeout = setTimeout(() => {
            clearInterval(interval);
            setIsCollecting(false);
            setCollectionInterval(null);
            setCollectionTimeout(null);
          }, 300000);
          setCollectionTimeout(timeout);
        } else {
          setIsCollecting(false);
          alert('Failed to start data collection. Make sure you are on a Twitter/X followers or following page.');
        }
      });
    });
  };

  const stopCollection = () => {
    // Clear intervals and timeouts
    if (collectionInterval) {
      clearInterval(collectionInterval);
      setCollectionInterval(null);
    }
    if (collectionTimeout) {
      clearTimeout(collectionTimeout);
      setCollectionTimeout(null);
    }
    
    // Force stop all content script activities
    chrome.runtime.sendMessage({ action: 'forceStopAll' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Content script not ready or page not loaded:', chrome.runtime.lastError);
        // Still stop the popup polling even if content script is not ready
      } else if (response?.error) {
        console.log('Stop collection error:', response.error);
      } else {
        console.log('Force stop response:', response);
      }
    });
    
    setIsCollecting(false);
    console.log('[WhoUnfollowedMe] Data collection stopped manually - all activities cleared');
  };

  const handleSyncButtonClick = () => {
    if (isCollecting) {
      stopCollection();
    } else {
      startCollection();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const openTwitterFollowing = () => {
    chrome.tabs.create({ url: 'https://x.com/following' });
  };

  // Filter unfollowers based on search query
  const filteredUnfollowers = unfollowers.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h1>🕵️ The Unfollow Detective</h1>
        <div className="warning-text">⚠️ Don't be too obvious about your stalking habits</div>
      </div>
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-number">{data.following.length}</div>
          <div className="stat-label">Your Victims</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-number">{unfollowers.length}</div>
          <div className="stat-label">Betrayers</div>
        </div>
      </div>

      <div className="unfollowers-section">
        <div className="section-header">
          <h3>💔 Hall of Shame</h3>
          {unfollowers.length > 0 && <span className="count-badge">{filteredUnfollowers.length} of {unfollowers.length} traitors</span>}
        </div>

        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search betrayers by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="unfollowers-list">
          {filteredUnfollowers.length > 0 ? (
            <>
              {filteredUnfollowers.map((user) => (
                <div key={user.id} className="unfollower-item">
                  <div className="user-info">
                    <div className="unfollower-username">{user.displayName}</div>
                    <a 
                      href={user.profileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="unfollower-handle"
                    >
                      @{user.username}
                    </a>
                  </div>
                  <div className="unfollower-indicator">🚪</div>
                </div>
              ))}
            </>
          ) : searchQuery ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p>No betrayers found for "{searchQuery}"</p>
              <p className="empty-subtitle">Try a different search term</p>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🤷‍♂️</div>
              <p>Nobody has ghosted you yet!</p>
              <p className="empty-subtitle">Either you're super likeable or we haven't started snooping</p>
            </div>
          )}
        </div>
      </div>

      <div className="actions-section">
        <button 
          className={`sync-button ${isCollecting ? "collecting" : ""}`} 
          onClick={handleSyncButtonClick}
        >
          {isCollecting && <span className="loading"></span>}
          {isCollecting ? "Stop the Stalking" : "🔍 Start Investigating"}
        </button>

        <button onClick={openTwitterFollowing} className="secondary-button">
          📋 See Who You're Bothering
        </button>
      </div>

      {data.lastUpdated > 0 && (
        <div className="last-updated">Last detective work: {formatDate(data.lastUpdated)}</div>
      )}

      <div className="disclaimer">⚠️ Use at your own risk. Twitter might not appreciate your detective skills.</div>
    </div>
  );
} 