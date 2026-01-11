// Background service worker for Chrome extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('OfficeMonkey extension installed');
});
