chrome.runtime.onInstalled.addListener(() => {
  console.log("Who Unfollowed Me extension installed");
});

let isPopupOpen = false;
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    isPopupOpen = true;
    console.log("Popup opened");

    port.onDisconnect.addListener(() => {
      isPopupOpen = false;
      console.log("Popup closed - stopping all activities");

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: "forceStopAll" },
            (_response) => {
              if (chrome.runtime.lastError) {
                console.log(
                  "Content script not ready when popup closed:",
                  chrome.runtime.lastError
                );
              } else {
                console.log("All activities stopped due to popup close");
              }
            }
          );
        }
      });
    });
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "getTwitterData") {
    chrome.storage.local.get(["twitterData"], (result) => {
      sendResponse(
        result.twitterData || { followers: [], following: [], lastUpdated: 0 }
      );
    });
    return true;
  }

  if (request.action === "startDataCollection") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const tab = tabs[0];
        const url = new URL(tab.url || "");
        if (url.hostname !== "twitter.com" && url.hostname !== "x.com") {
          sendResponse({ error: "Please navigate to Twitter/X first" });
          return;
        }

        if (
          !url.pathname.includes("/followers") &&
          !url.pathname.includes("/following")
        ) {
          sendResponse({
            error: "Please navigate to a followers or following page",
          });
          return;
        }

        if (tab.id) {
          chrome.tabs.sendMessage(
            tab.id,
            { action: "startCollection" },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error(
                  "Content script not ready:",
                  chrome.runtime.lastError
                );
                sendResponse({
                  error:
                    "Content script not ready. Please refresh the page and try again.",
                });
              } else if (response?.success) {
                sendResponse(response);
              } else {
                sendResponse({
                  error:
                    "Failed to start collection. Please refresh the page and try again.",
                });
              }
            }
          );
        } else {
          sendResponse({ error: "No active tab found" });
        }
      }
    });
    return true;
  }

  if (
    request.action === "stopDataCollection" ||
    request.action === "forceStopAll"
  ) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const tab = tabs[0];
        const url = new URL(tab.url || "");

        if (url.hostname !== "twitter.com" && url.hostname !== "x.com") {
          sendResponse({ error: "Not on Twitter/X page" });
          return;
        }

        if (tab.id) {
          chrome.tabs.sendMessage(
            tab.id,
            { action: request.action },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error(
                  "Content script not ready:",
                  chrome.runtime.lastError
                );
                sendResponse({ error: "Content script not ready" });
              } else if (response?.success) {
                sendResponse(response);
              } else {
                sendResponse({ error: "Failed to stop collection" });
              }
            }
          );
        } else {
          sendResponse({ error: "No active tab found" });
        }
      } else {
        sendResponse({ error: "No active tab found" });
      }
    });
    return true;
  }
});
