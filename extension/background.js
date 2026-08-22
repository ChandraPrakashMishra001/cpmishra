// Amanai Voice Navigator — Background Service Worker

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handle = async () => {
    switch (message.type) {
      case 'navigate-url': {
        const url = message.url.startsWith('http') ? message.url : `https://${message.url}`;
        await chrome.tabs.create({ url });
        return { ok: true };
      }
      case 'search': {
        await chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(message.query)}` });
        return { ok: true };
      }
      case 'newtab': {
        await chrome.tabs.create({});
        return { ok: true };
      }
      case 'closetab': {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) await chrome.tabs.remove(tab.id);
        return { ok: true };
      }
      case 'back': {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) await chrome.tabs.goBack(tab.id).catch(() => {});
        return { ok: true };
      }
      case 'forward': {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) await chrome.tabs.goForward(tab.id).catch(() => {});
        return { ok: true };
      }
      case 'reload': {
        await chrome.tabs.reload();
        return { ok: true };
      }
      default:
        return { ok: false, error: 'Unknown message type' };
    }
  };
  handle().then(sendResponse).catch((e) => sendResponse({ ok: false, error: e.message }));
  return true; // keep channel open for async response
});
