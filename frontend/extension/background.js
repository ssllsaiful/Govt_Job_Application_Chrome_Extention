/**
 * background.js - Manifest V3 Background Service Worker
 * 
 * Handles extension installation, initialization of local storage defaults,
 * and background message routing. Zero remote tracking, zero network requests.
 */

importScripts('storage.js');

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Check if profile exists, otherwise populate clean initial template
    chrome.storage.local.get(['teletalk_user_profile'], (result) => {
      if (!result['teletalk_user_profile']) {
        const defaults = JobStorage.getDefaultProfile();
        chrome.storage.local.set({ teletalk_user_profile: defaults });
      }
    });
  }
});
