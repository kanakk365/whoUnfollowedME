// Background service worker for the Chrome Extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Who Unfollowed Me extension installed');
});

// Handle messages from popup to content script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'getTwitterData') {
    // Get data from storage
    chrome.storage.local.get(['twitterData'], (result) => {
      sendResponse(result.twitterData || { followers: [], following: [], lastUpdated: 0 });
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'startDataCollection') {
    // Send message to active tab to start collection
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const tab = tabs[0];
        const url = new URL(tab.url || '');
        
        // Check if we're on a Twitter/X page
        if (url.hostname !== 'twitter.com' && url.hostname !== 'x.com') {
          sendResponse({ error: 'Please navigate to Twitter/X first' });
          return;
        }
        
        // Check if we're on a followers/following page
        if (!url.pathname.includes('/followers') && !url.pathname.includes('/following')) {
          sendResponse({ error: 'Please navigate to a followers or following page' });
          return;
        }
        
        // Try to send message to content script
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { action: 'startCollection' }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Content script not ready:', chrome.runtime.lastError);
              sendResponse({ error: 'Content script not ready. Please refresh the page and try again.' });
            } else if (response?.success) {
              sendResponse(response);
            } else {
              sendResponse({ error: 'Failed to start collection. Please refresh the page and try again.' });
            }
          });
        } else {
          sendResponse({ error: 'No active tab found' });
        }
      }
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === 'stopDataCollection' || request.action === 'forceStopAll') {
    // Send message to active tab to stop collection
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const tab = tabs[0];
        const url = new URL(tab.url || '');
        
        // Check if we're on a Twitter/X page
        if (url.hostname !== 'twitter.com' && url.hostname !== 'x.com') {
          sendResponse({ error: 'Not on Twitter/X page' });
          return;
        }
        
        // Try to send message to content script
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { action: request.action }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Content script not ready:', chrome.runtime.lastError);
              sendResponse({ error: 'Content script not ready' });
            } else if (response?.success) {
              sendResponse(response);
            } else {
              sendResponse({ error: 'Failed to stop collection' });
            }
          });
        } else {
          sendResponse({ error: 'No active tab found' });
        }
      } else {
        sendResponse({ error: 'No active tab found' });
      }
    });
    return true; // Keep message channel open for async response
  }
});

// Listen for tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url);
    if (url.hostname === 'twitter.com' || url.hostname === 'x.com') {
      // Content script will be automatically injected via manifest
      console.log('Twitter page loaded, content script should be active');
    }
  }
}); 