/**
 * content.js - Content Script for Teletalk Application Portals
 * 
 * Runs on matching Teletalk application pages.
 * Handles communication with popup/background, injects an optional
 * convenient in-page floating autofill pill, and delegates form operations
 * to autofill-engine.js.
 */

(function () {
  'use strict';

  // Prevent double injection
  if (window.__TELETALK_AUTOFILL_LOADED__) return;
  window.__TELETALK_AUTOFILL_LOADED__ = true;

  const isTeletalk = SiteMappings && SiteMappings.isTeletalkUrl(window.location.href);

  /**
   * Checks if current page is the 2nd part of application (Photo & Signature upload / preview page).
   * @returns {boolean}
   */
  function isPhotoSignaturePage() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    if (fileInputs.length >= 1) return true;
    const bodyText = (document.body ? document.body.textContent : '').toLowerCase();
    return (
      bodyText.includes('upload photo') ||
      bodyText.includes('photo preview') ||
      bodyText.includes('upload/change photo') ||
      /preview\.php/i.test(window.location.pathname) ||
      /upload\.php/i.test(window.location.pathname)
    );
  }

  /**
   * Checks if the current page has a government application form or photo/sign upload.
   * @returns {boolean}
   */
  function hasApplicationForm() {
    if (isPhotoSignaturePage()) return true;
    const inputs = document.querySelectorAll('input, select');
    // Typical Teletalk application forms have at least 10-15 fields
    return inputs.length >= 8 || /application\.php/i.test(window.location.pathname);
  }

  /**
   * Injects the convenient in-page floating action widget on supported application pages.
   * Includes a Candidate Profile Switcher so the user can easily select which candidate
   * to autofill (e.g. Saiful, Tareq, Millat) right from the web page.
   */
  function injectFloatingPill() {
    if (!hasApplicationForm() || document.getElementById('teletalk-autofill-widget')) return;

    chrome.storage.local.get([
      'teletalk_profiles',
      'teletalk_active_profile_id',
      'teletalk_user_profile'
    ], (result) => {
      const profiles = result['teletalk_profiles'] || [];
      const activeId = result['teletalk_active_profile_id'];
      const activeProfile = profiles.find(p => p.id === activeId) || result['teletalk_user_profile'] || profiles[0];

      if (activeProfile && activeProfile.settings && activeProfile.settings.showFloatingPill === false) {
        return;
      }

      const isPhotoPage = isPhotoSignaturePage();

      // Floating Widget Bar
      const widget = document.createElement('div');
      widget.id = 'teletalk-autofill-widget';
      widget.setAttribute('style', `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        background: #064E3B;
        border: 1.5px solid rgba(255, 255, 255, 0.3);
        border-radius: 9999px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
        padding: 4px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        user-select: none;
        gap: 6px;
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      `);

      // 1. Candidate Profile Selector Dropdown
      const profContainer = document.createElement('div');
      profContainer.setAttribute('style', `
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.15);
        padding: 6px 12px;
        border-radius: 9999px;
        color: #ffffff;
      `);

      const profIcon = document.createElement('span');
      profIcon.textContent = '👤';
      profIcon.style.fontSize = '14px';

      const profSelect = document.createElement('select');
      profSelect.id = 'teletalk-widget-profile-select';
      profSelect.title = 'Select Candidate to Autofill';
      profSelect.setAttribute('style', `
        background: transparent;
        border: none;
        color: #ffffff;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        outline: none;
        max-width: 160px;
        padding-right: 4px;
      `);

      function renderProfiles(list, curId) {
        profSelect.innerHTML = '';
        if (!list || list.length === 0) {
          const opt = document.createElement('option');
          opt.value = '';
          opt.textContent = 'Candidate Profile';
          opt.style.color = '#111827';
          profSelect.appendChild(opt);
          return;
        }
        list.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id;
          const name = p.name || (p.personal && p.personal.fullName) || 'Candidate';
          opt.textContent = name;
          opt.style.color = '#111827';
          if (p.id === curId) opt.selected = true;
          profSelect.appendChild(opt);
        });
      }

      renderProfiles(profiles, activeId || (profiles[0] && profiles[0].id));

      profSelect.addEventListener('change', async (e) => {
        const nextId = e.target.value;
        if (!nextId) return;

        chrome.storage.local.get(['teletalk_profiles'], (st) => {
          const allProfs = st['teletalk_profiles'] || profiles;
          const target = allProfs.find(p => p.id === nextId);
          if (target) {
            chrome.storage.local.set({
              'teletalk_active_profile_id': target.id,
              'teletalk_user_profile': target
            }, () => {
              const cName = target.name || (target.personal && target.personal.fullName) || 'Candidate';
              showToast(`👤 Active Candidate Switched: "${cName}"`, 'info');
            });
          }
        });
      });

      profContainer.appendChild(profIcon);
      profContainer.appendChild(profSelect);

      // 2. Autofill Action Button
      const actionBtn = document.createElement('button');
      actionBtn.id = 'teletalk-pill-btn';
      actionBtn.type = 'button';
      actionBtn.setAttribute('style', `
        display: flex;
        align-items: center;
        gap: 6px;
        background: #007A3D;
        color: #ffffff;
        border: none;
        font-size: 13px;
        font-weight: 700;
        padding: 8px 18px;
        border-radius: 9999px;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0, 122, 61, 0.4);
        transition: transform 0.15s, background 0.15s;
        outline: none;
      `);

      const pillIcon = isPhotoPage ? '📸' : '⚡';
      const pillText = isPhotoPage ? 'Upload Photo & Sign' : 'Autofill BD Job';

      actionBtn.innerHTML = `
        <span style="font-size: 15px;">${pillIcon}</span>
        <span id="teletalk-pill-label">${pillText}</span>
      `;

      actionBtn.onmouseenter = () => {
        actionBtn.style.transform = 'translateY(-1px) scale(1.02)';
        actionBtn.style.background = '#00944A';
      };
      actionBtn.onmouseleave = () => {
        actionBtn.style.transform = 'translateY(0) scale(1)';
        actionBtn.style.background = '#007A3D';
      };

      actionBtn.onclick = async () => {
        const label = document.getElementById('teletalk-pill-label');
        if (!isExtensionValid()) {
          showToast('⚠️ Extension was updated/reloaded. Please refresh this page.', 'warning', {
            text: 'Reload Page',
            onClick: () => window.location.reload()
          });
          return;
        }

        try {
          chrome.storage.local.get([
            'teletalk_profiles',
            'teletalk_active_profile_id',
            'teletalk_user_profile',
            'teletalk_saved_photo',
            'teletalk_saved_signature'
          ], async (res) => {
            if (chrome.runtime.lastError || !isExtensionValid()) {
              showToast('⚠️ Extension was reloaded. Please refresh this page.', 'warning', {
                text: 'Reload Page',
                onClick: () => window.location.reload()
              });
              return;
            }

            const allProfs = res['teletalk_profiles'] || [];
            const selectedId = profSelect.value || res['teletalk_active_profile_id'];
            const targetProfile = allProfs.find(p => p.id === selectedId) || res['teletalk_user_profile'] || allProfs[0];

            if (!targetProfile && !isPhotoPage) {
              showToast('⚠️ No saved profile found. Please click extension icon to set up.', 'warning');
              return;
            }

            const candidateName = targetProfile?.name || targetProfile?.personal?.fullName || 'Candidate';

            // Each candidate's photo and signature are keyed by their profile ID!
            const pId = targetProfile ? targetProfile.id : selectedId;
            const pKey = pId ? `teletalk_saved_photo_${pId}` : 'teletalk_saved_photo';
            const sKey = pId ? `teletalk_saved_signature_${pId}` : 'teletalk_saved_signature';

            chrome.storage.local.get([pKey, sKey], async (mediaRes) => {
              const photoObj = mediaRes && mediaRes[pKey];
              const sigObj = mediaRes && mediaRes[sKey];
              const photoUrl = photoObj ? (photoObj.dataUrl || photoObj) : (pId === 'profile_default' ? res['teletalk_saved_photo']?.dataUrl || res['teletalk_saved_photo'] : null);
              const sigUrl = sigObj ? (sigObj.dataUrl || sigObj) : (pId === 'profile_default' ? res['teletalk_saved_signature']?.dataUrl || res['teletalk_saved_signature'] : null);

              if (label) label.textContent = isPhotoPage ? 'Uploading Media...' : 'Filling Form...';
              actionBtn.style.opacity = '0.7';

              const outcome = await JobAutofillEngine.runAutofill(targetProfile || {}, {
                media: { photo: photoUrl, signature: sigUrl }
              });

              if (outcome.success) {
                const successMsg = isPhotoPage
                  ? `✅ Photo & Signature for "${candidateName}" Uploaded!`
                  : `✅ Filled ${outcome.filledCount} fields for "${candidateName}"!`;
                showToast(successMsg, 'success');
              } else {
                showToast(`⚠️ Autofill for "${candidateName}": ${outcome.reviewCount} items need attention.`, 'warning');
              }

              if (label) label.textContent = pillText;
              actionBtn.style.opacity = '1';
            });
          });
        } catch (err) {
          const isContextInvalidated = !isExtensionValid() || (err && err.message && err.message.includes('context invalidated'));
          if (isContextInvalidated) {
            showToast('⚠️ Extension was reloaded. Please refresh this page to reconnect.', 'warning', {
              text: 'Reload Page',
              onClick: () => window.location.reload()
            });
          } else {
            showToast(`❌ Error: ${err.message}`, 'error');
          }
          if (label) label.textContent = pillText;
          actionBtn.style.opacity = '1';
        }
      };

      widget.appendChild(profContainer);
      widget.appendChild(actionBtn);
      document.body.appendChild(widget);
    });
  }

  /**
   * Checks if extension context is valid.
   * @returns {boolean}
   */
  function isExtensionValid() {
    try {
      return Boolean(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }

  /**
   * Non-intrusive in-page toast notification with optional action button.
   */
  function showToast(message, type = 'info', action = null) {
    const existing = document.getElementById('teletalk-autofill-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'teletalk-autofill-toast';
    const bg = type === 'success' ? '#065F46' : type === 'warning' ? '#92400E' : '#B91C1C';
    toast.setAttribute('style', `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 2147483647;
      background: ${bg};
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
      animation: fadeInToast 0.3s ease;
      display: flex;
      align-items: center;
      gap: 12px;
    `);

    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    toast.appendChild(textSpan);

    if (action && action.text && action.onClick) {
      const btn = document.createElement('button');
      btn.textContent = action.text;
      btn.setAttribute('style', `
        background: #ffffff;
        color: ${bg};
        border: none;
        padding: 5px 12px;
        border-radius: 4px;
        font-weight: 700;
        cursor: pointer;
        font-size: 12px;
        white-space: nowrap;
        transition: opacity 0.2s;
      `);
      btn.onmouseenter = () => { btn.style.opacity = '0.9'; };
      btn.onmouseleave = () => { btn.style.opacity = '1.0'; };
      btn.onclick = action.onClick;
      toast.appendChild(btn);
    }

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, action ? 8000 : 4500);
  }

  // Inject floating pill on idle
  if (isTeletalk && hasApplicationForm()) {
    injectFloatingPill();
  }

  // Listen for messages from popup or background service worker
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CHECK_PAGE_STATUS') {
      const isPhotoPage = isPhotoSignaturePage();
      sendResponse({
        isTeletalk,
        hasForm: hasApplicationForm(),
        isPhotoPage,
        url: window.location.href,
        title: document.title,
        fieldsDetected: document.querySelectorAll('input, select, textarea').length
      });
      return true;
    }

    if (request.type === 'TRIGGER_AUTOFILL') {
      const profile = request.profile;
      const customSettings = Object.assign({}, request.settings || {});
      if (request.media) {
        customSettings.media = request.media;
      }

      JobAutofillEngine.runAutofill(profile, customSettings)
        .then((report) => {
          const isPhoto = isPhotoSignaturePage();
          const successMsg = isPhoto
            ? '✅ Photo & Signature Uploaded Successfully!'
            : `✅ Autofill Complete! ${report.filledCount} fields filled.`;
          showToast(successMsg, 'success');
          sendResponse({ ok: true, data: report });
        })
        .catch((err) => {
          showToast(`❌ Autofill Failed: ${err.message}`, 'error');
          sendResponse({ ok: false, error: err.message });
        });
      return true; // Keep message channel open for async response
    }

    if (request.type === 'RUN_DIAGNOSTICS') {
      try {
        const fields = SiteMappings.inspectPageFields(document);
        sendResponse({
          ok: true,
          data: {
            url: window.location.href,
            pageTitle: document.title,
            totalFields: fields.length,
            fields
          }
        });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
      return true;
    }
  });

  // Listen for storage changes so profile switches in Options/Popup sync instantly to the page!
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        const widgetSelect = document.getElementById('teletalk-widget-profile-select');
        if (widgetSelect && (changes['teletalk_profiles'] || changes['teletalk_active_profile_id'])) {
          chrome.storage.local.get(['teletalk_profiles', 'teletalk_active_profile_id'], (res) => {
            const profs = res['teletalk_profiles'] || [];
            const actId = res['teletalk_active_profile_id'];
            widgetSelect.innerHTML = '';
            profs.forEach(p => {
              const opt = document.createElement('option');
              opt.value = p.id;
              opt.textContent = p.name || (p.personal && p.personal.fullName) || 'Candidate';
              opt.style.color = '#111827';
              if (p.id === actId) opt.selected = true;
              widgetSelect.appendChild(opt);
            });
          });
        }
      }
    });
  }
})();
