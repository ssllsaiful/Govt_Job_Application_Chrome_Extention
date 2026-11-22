/**
 * popup.js - Extension Popup Logic
 * 
 * Manages active tab status detection, form trigger execution,
 * diagnostics inspection modal, quick export/import, and profile completion tracking.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM References
  const statusIndicator = document.getElementById('status-indicator');
  const statusTitle = document.getElementById('status-title');
  const statusSubtitle = document.getElementById('status-subtitle');
  const popupProfileSelect = document.getElementById('popup-profile-select');
  const btnPopupNewProfile = document.getElementById('btn-popup-new-profile');
  const profileCompletion = document.getElementById('profile-completion');
  const btnAutofill = document.getElementById('btn-autofill');
  const autofillBtnText = document.getElementById('autofill-btn-text');
  const toggleEnableAutofill = document.getElementById('toggle-enable-autofill');
  const chkOverwriteExisting = document.getElementById('chk-overwrite-existing');
  const btnOpenOptions = document.getElementById('btn-open-options');
  const btnOpenOptionsHeader = document.getElementById('btn-open-options-header');
  const btnInspectPage = document.getElementById('btn-inspect-page');
  const btnExportQuick = document.getElementById('btn-export-quick');
  const btnImportQuick = document.getElementById('btn-import-quick');
  const fileImportInput = document.getElementById('file-import-input');
  const btnResetProfile = document.getElementById('btn-reset-profile');

  // Results Panel
  const resultsPanel = document.getElementById('results-panel');
  const resultsTime = document.getElementById('results-time');
  const countFilled = document.getElementById('count-filled');
  const countSkipped = document.getElementById('count-skipped');
  const countReview = document.getElementById('count-review');
  const btnToggleDetails = document.getElementById('btn-toggle-details');
  const resultsDetailsList = document.getElementById('results-details-list');

  // Diagnostics Modal
  const diagnosticsModal = document.getElementById('diagnostics-modal');
  const diagnosticsList = document.getElementById('diagnostics-list');
  const btnCloseDiagnostics = document.getElementById('btn-close-diagnostics');
  const btnCloseDiagnosticsFooter = document.getElementById('btn-close-diagnostics-footer');
  const btnCopyDiagnostics = document.getElementById('btn-copy-diagnostics');

  let activeTab = null;
  let currentProfile = null;
  let lastDiagnosticData = null;

  /* -------------------------------------------------------------
     INITIALIZATION & PROFILE LOADING
     ------------------------------------------------------------- */
  async function loadProfileState() {
    currentProfile = await JobStorage.getProfile();
    const p = currentProfile.personal || {};

    // Calculate completion score
    let score = 0;
    const checks = [
      p.fullName, p.fullNameBn, p.fatherName, p.motherName, p.dob,
      p.mobile, p.nidNumber || p.birthRegNumber,
      currentProfile.presentAddress?.district,
      currentProfile.presentAddress?.village,
      currentProfile.ssc?.rollNumber,
      currentProfile.ssc?.board,
      currentProfile.hsc?.rollNumber
    ];
    checks.forEach(c => { if (c && String(c).trim()) score++; });
    const percent = Math.round((score / checks.length) * 100);

    profileCompletion.textContent = `${percent}%`;

    // Populate profile selector
    const profiles = await JobStorage.getProfiles();
    const activeId = await JobStorage.getActiveProfileId();

    if (popupProfileSelect) {
      popupProfileSelect.innerHTML = '';
      profiles.forEach((prof) => {
        const opt = document.createElement('option');
        opt.value = prof.id;
        const displayName = prof.name || (prof.personal && prof.personal.fullName) || 'Candidate';
        opt.textContent = displayName;
        if (prof.id === activeId) opt.selected = true;
        popupProfileSelect.appendChild(opt);
      });
    }

    // Update settings controls
    const s = currentProfile.settings || {};
    toggleEnableAutofill.checked = s.enableAutofill !== false;
    chkOverwriteExisting.checked = s.overwriteExisting === true;
  }

  // Handle switching profile from dropdown
  if (popupProfileSelect) {
    popupProfileSelect.addEventListener('change', async (e) => {
      const selectedId = e.target.value;
      if (selectedId) {
        await JobStorage.setActiveProfileId(selectedId);
        await loadProfileState();
      }
    });
  }

  // Handle adding a new profile from popup
  if (btnPopupNewProfile) {
    btnPopupNewProfile.addEventListener('click', async () => {
      const name = prompt('Enter candidate name for the new profile:');
      if (name && name.trim()) {
        await JobStorage.createProfile(name.trim());
        await loadProfileState();
        if (chrome.runtime.openOptionsPage) {
          chrome.runtime.openOptionsPage();
        } else {
          window.open('options.html');
        }
      }
    });
  }

  /* -------------------------------------------------------------
     ACTIVE TAB STATUS INSPECTION
     ------------------------------------------------------------- */
  async function checkActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      activeTab = tab;

      if (!tab || !tab.url) {
        updateStatus(false, 'No active web page', 'Open a government job application page');
        return;
      }

      const url = tab.url;
      const isTeletalk = /teletalk\.com\.bd/i.test(url);

      if (!isTeletalk) {
        updateStatus(false, 'Unsupported Website', 'Works on *.teletalk.com.bd portals');
        btnAutofill.disabled = true;
        return;
      }

      // Query content script on active tab
      chrome.tabs.sendMessage(tab.id, { type: 'CHECK_PAGE_STATUS' }, (res) => {
        if (chrome.runtime.lastError || !res) {
          // Content script may not have injected yet or page is still loading
          updateStatus(true, 'Teletalk Portal Detected', 'Refresh page if form is ready');
          btnAutofill.disabled = false;
          return;
        }

        if (res.hasForm) {
          if (res.isPhotoPage) {
            updateStatus(true, 'Photo & Signature Ready', 'Upload candidate photo (300×300) and signature (300×80)');
            autofillBtnText.textContent = 'Upload Photo & Sign';
          } else {
            updateStatus(true, 'Application Form Ready', `${res.fieldsDetected || 'Multiple'} fields detected on page`);
            autofillBtnText.textContent = 'Autofill Form';
          }
          btnAutofill.disabled = !toggleEnableAutofill.checked;
        } else {
          updateStatus(true, 'Teletalk Portal', 'Navigate to circular application.php');
          btnAutofill.disabled = false;
        }
      });
    } catch (err) {
      updateStatus(false, 'Portal Check Failed', err.message);
    }
  }

  function updateStatus(isSupported, title, subtitle) {
    statusIndicator.className = `status-indicator ${isSupported ? 'supported' : 'unsupported'}`;
    statusTitle.textContent = title;
    statusSubtitle.textContent = subtitle;
  }

  /* -------------------------------------------------------------
     TRIGGER AUTOFILL
     ------------------------------------------------------------- */
  btnAutofill.addEventListener('click', async () => {
    if (!activeTab || !activeTab.id) return;

    btnAutofill.disabled = true;
    autofillBtnText.textContent = 'Processing...';

    // Synchronize latest toggles & load selected profile
    const activeId = await JobStorage.getActiveProfileId();
    currentProfile = await JobStorage.getProfile(activeId);
    currentProfile.settings = currentProfile.settings || {};
    currentProfile.settings.enableAutofill = toggleEnableAutofill.checked;
    currentProfile.settings.overwriteExisting = chkOverwriteExisting.checked;
    await JobStorage.saveProfile(currentProfile, activeId);

    // Fetch photo & signature for this exact candidate
    const photoObj = await JobStorage.getPhoto(activeId);
    const sigObj = await JobStorage.getSignature(activeId);

    chrome.tabs.sendMessage(
      activeTab.id,
      {
        type: 'TRIGGER_AUTOFILL',
        profile: currentProfile,
        media: {
          photo: photoObj ? (photoObj.dataUrl || photoObj) : null,
          signature: sigObj ? (sigObj.dataUrl || sigObj) : null
        },
        settings: {
          overwriteExisting: chkOverwriteExisting.checked
        }
      },
      (response) => {
        btnAutofill.disabled = false;
        autofillBtnText.textContent = 'Autofill Form';

        if (chrome.runtime.lastError) {
          if (confirm('Could not connect to the application page (the extension was updated or reloaded in developer mode).\n\nWould you like to reload this page now to reconnect?')) {
            chrome.tabs.reload(activeTab.id);
          }
          return;
        }

        if (response && response.ok) {
          displayResults(response.data);
        } else {
          alert(`Autofill encountered an issue: ${(response && response.error) || 'Unknown error'}`);
        }
      }
    );
  });

  /* -------------------------------------------------------------
     RENDER RESULTS SUMMARY
     ------------------------------------------------------------- */
  function displayResults(data) {
    resultsPanel.style.display = 'flex';
    resultsTime.textContent = new Date().toLocaleTimeString();

    countFilled.textContent = data.filledCount || 0;
    countSkipped.textContent = data.skippedCount || 0;
    countReview.textContent = data.reviewCount || 0;

    resultsDetailsList.innerHTML = '';

    (data.filled || []).forEach((item) => {
      const div = document.createElement('div');
      div.className = 'detail-item filled';
      div.innerHTML = `<span>✅ ${item.label || item.field}</span><strong>${String(item.value).slice(0, 20)}</strong>`;
      resultsDetailsList.appendChild(div);
    });

    (data.review || []).forEach((item) => {
      const div = document.createElement('div');
      div.className = 'detail-item review';
      div.innerHTML = `<span>⚠️ ${item.label || item.field}</span><em>${item.reason || 'Check manually'}</em>`;
      resultsDetailsList.appendChild(div);
    });

    (data.skipped || []).forEach((item) => {
      const div = document.createElement('div');
      div.className = 'detail-item skipped';
      div.innerHTML = `<span>⏭️ ${item.label || item.field}</span><em>${item.reason || 'Skipped'}</em>`;
      resultsDetailsList.appendChild(div);
    });
  }

  btnToggleDetails.addEventListener('click', () => {
    const isHidden = resultsDetailsList.style.display === 'none';
    resultsDetailsList.style.display = isHidden ? 'flex' : 'none';
    btnToggleDetails.textContent = isHidden ? 'Hide itemized details ▲' : 'Show itemized details ▼';
  });

  /* -------------------------------------------------------------
     SETTINGS TOGGLES
     ------------------------------------------------------------- */
  toggleEnableAutofill.addEventListener('change', async () => {
    currentProfile.settings = currentProfile.settings || {};
    currentProfile.settings.enableAutofill = toggleEnableAutofill.checked;
    await JobStorage.saveProfile(currentProfile);
    btnAutofill.disabled = !toggleEnableAutofill.checked;
  });

  chkOverwriteExisting.addEventListener('change', async () => {
    currentProfile.settings = currentProfile.settings || {};
    currentProfile.settings.overwriteExisting = chkOverwriteExisting.checked;
    await JobStorage.saveProfile(currentProfile);
  });

  /* -------------------------------------------------------------
     NAVIGATION & MODALS
     ------------------------------------------------------------- */
  function openOptions() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  }

  btnOpenOptions.addEventListener('click', openOptions);
  btnOpenOptionsHeader.addEventListener('click', openOptions);

  /* -------------------------------------------------------------
     DIAGNOSTICS INSPECTION
     ------------------------------------------------------------- */
  btnInspectPage.addEventListener('click', () => {
    if (!activeTab || !activeTab.id) {
      alert('No active page to inspect.');
      return;
    }

    chrome.tabs.sendMessage(activeTab.id, { type: 'RUN_DIAGNOSTICS' }, (res) => {
      if (chrome.runtime.lastError || !res || !res.ok) {
        alert('Could not inspect page. Please ensure you are on a Teletalk form page and refresh.');
        return;
      }

      lastDiagnosticData = res.data;
      renderDiagnostics(res.data);
      diagnosticsModal.style.display = 'flex';
    });
  });

  function renderDiagnostics(data) {
    diagnosticsList.innerHTML = '';
    const summary = document.createElement('div');
    summary.style.marginBottom = '6px';
    summary.style.fontWeight = 'bold';
    summary.textContent = `Found ${data.totalFields} form elements on "${data.pageTitle}":`;
    diagnosticsList.appendChild(summary);

    data.fields.forEach((f, i) => {
      const row = document.createElement('div');
      row.style.borderBottom = '1px solid #eee';
      row.style.padding = '3px 0';
      row.innerHTML = `<strong>#${i + 1} &lt;${f.tag}&gt;</strong> ${f.id ? `id="<b>${f.id}</b>"` : ''} ${f.name ? `name="<b>${f.name}</b>"` : ''} ${f.label ? `[Label: "${f.label}"]` : ''} ${f.optionCount ? `(${f.optionCount} options)` : ''}`;
      diagnosticsList.appendChild(row);
    });
  }

  btnCloseDiagnostics.addEventListener('click', () => { diagnosticsModal.style.display = 'none'; });
  btnCloseDiagnosticsFooter.addEventListener('click', () => { diagnosticsModal.style.display = 'none'; });

  btnCopyDiagnostics.addEventListener('click', () => {
    if (!lastDiagnosticData) return;
    navigator.clipboard.writeText(JSON.stringify(lastDiagnosticData, null, 2))
      .then(() => alert('Copied full JSON diagnostic report to clipboard!'))
      .catch(() => alert('Could not copy to clipboard.'));
  });

  /* -------------------------------------------------------------
     BACKUP EXPORT / IMPORT
     ------------------------------------------------------------- */
  btnExportQuick.addEventListener('click', async () => {
    const profile = await JobStorage.getProfile();
    const jsonStr = JobStorage.exportPlainProfile(profile);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teletalk_profile_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  btnImportQuick.addEventListener('click', () => {
    fileImportInput.click();
  });

  fileImportInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JobStorage.importPlainProfile(event.target.result);
        if (confirm('Import profile backup? This will replace your currently saved profile.')) {
          await JobStorage.saveProfile(imported);
          await loadProfileState();
          alert('Profile imported successfully!');
        }
      } catch (err) {
        alert(`Import Error: ${err.message}`);
      }
      fileImportInput.value = '';
    };
    reader.readAsText(file);
  });

  /* -------------------------------------------------------------
     RESET PROFILE
     ------------------------------------------------------------- */
  btnResetProfile.addEventListener('click', async () => {
    const confirmed = confirm(
      'Are you sure you want to reset your saved profile?\n\nAll personal and educational information stored in the extension will be cleared.'
    );
    if (confirmed) {
      await JobStorage.resetProfile();
      await loadProfileState();
      resultsPanel.style.display = 'none';
      alert('Profile data has been reset to defaults.');
    }
  });

  // Run initialization
  await loadProfileState();
  await checkActiveTab();
});
