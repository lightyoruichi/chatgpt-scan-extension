// Background Service Worker for AI Search Revealer

// Handle Badge Updates
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "UPDATE_BADGE" && sender.tab?.id) {
        const count = message.count.toString();
        chrome.action.setBadgeText({
            text: count,
            tabId: sender.tab.id
        });
        chrome.action.setBadgeBackgroundColor({
            color: "#00f2fe",
            tabId: sender.tab.id
        });
    }
});

// Setup Context Menus
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "search-on-google",
        title: "Verify with Google Search",
        contexts: ["selection"]
    });

    chrome.contextMenus.create({
        id: "explain-with-chatgpt",
        title: "Explain with ChatGPT",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info) => {
    if (!info.selectionText) return;

    const encodedText = encodeURIComponent(info.selectionText);

    if (info.menuItemId === "search-on-google") {
        chrome.tabs.create({ url: `https://www.google.com/search?q=${encodedText}` });
    } else if (info.menuItemId === "explain-with-chatgpt") {
        chrome.tabs.create({ url: `https://chatgpt.com/?q=${encodedText}` });
    }
});

console.log("[AI Search Revealer] Background Script Loaded");
