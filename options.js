/**
 * options.js - Profile Editor & Settings Page Controller
 * 
 * Manages candidate profile editing, dynamic address synchronization,
 * input validation, and password-protected encrypted backups (Web Crypto AES-GCM).
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Profile Management Elements
  const profileSelect = document.getElementById('profile-select');
  const btnCreateProfile = document.getElementById('btn-create-profile');
  const btnDuplicateProfile = document.getElementById('btn-duplicate-profile');
  const btnRenameProfile = document.getElementById('btn-rename-profile');
  const btnDeleteProfile = document.getElementById('btn-delete-profile');
  const optProfileCompletion = document.getElementById('opt-profile-completion');
  let currentActiveProfileId = null;

  // Navigation Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // Save Buttons
  const btnSaveTop = document.getElementById('btn-save-top');
  const btnSaveBottom = document.getElementById('btn-save-bottom');
  const toastMessage = document.getElementById('toast-message');

  // Conditional Sections
  const maritalStatus = document.getElementById('maritalStatus');
  const grpSpouseName = document.getElementById('grp-spouse-name');
  const sameAsPresent = document.getElementById('sameAsPresent');
  const permanentAddressFields = document.getElementById('permanent-address-fields');
  const masApplicable = document.getElementById('masApplicable');
  const mastersFields = document.getElementById('masters-fields');
  const dobInput = document.getElementById('dob');
  const dobAgeHint = document.getElementById('dob-age-hint');

  // Address Elements
  const presentDistrict = document.getElementById('presentDistrict');
  const presentUpazila = document.getElementById('presentUpazila');
  const presentUpazilaCustom = document.getElementById('presentUpazilaCustom');
  const presentPostOffice = document.getElementById('presentPostOffice');
  const presentPostOfficeCustom = document.getElementById('presentPostOfficeCustom');
  const presentPostCode = document.getElementById('presentPostCode');

  const permanentDistrict = document.getElementById('permanentDistrict');
  const permanentUpazila = document.getElementById('permanentUpazila');
  const permanentUpazilaCustom = document.getElementById('permanentUpazilaCustom');
  const permanentPostOffice = document.getElementById('permanentPostOffice');
  const permanentPostOfficeCustom = document.getElementById('permanentPostOfficeCustom');
  const permanentPostCode = document.getElementById('permanentPostCode');

  // Education Elements
  const hscExamination = document.getElementById('hscExamination');
  const hscGroupSubject = document.getElementById('hscGroupSubject');
  const hscGroupSubjectCustom = document.getElementById('hscGroupSubjectCustom');
  const hscGroupHint = document.getElementById('hsc-group-hint');

  // Backup & Import
  const btnExportPlain = document.getElementById('btn-export-plain');
  const btnImportPlainTrigger = document.getElementById('btn-import-plain-trigger');
  const btnExportEncrypted = document.getElementById('btn-export-encrypted');
  const btnImportEncryptedTrigger = document.getElementById('btn-import-encrypted-trigger');
  const exportPassphrase = document.getElementById('export-passphrase');
  const optionsFileInput = document.getElementById('options-file-input');
  const btnEraseAll = document.getElementById('btn-erase-all');

  let importMode = 'plain'; // 'plain' or 'encrypted'
  let refreshSavedMediaGallery = () => { };

  /* -------------------------------------------------------------
     TAB NAVIGATION
     ------------------------------------------------------------- */
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  /* -------------------------------------------------------------
     ACCORDION HEADERS EXPAND / COLLAPSE DELEGATION
     ------------------------------------------------------------- */
  document.addEventListener('click', (e) => {
    const header = e.target.closest('.editor-accordion-header');
    if (header) {
      const card = header.closest('.editor-accordion-card');
      if (card) {
        card.classList.toggle('open');
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const header = e.target.closest('.editor-accordion-header');
      if (header) {
        e.preventDefault();
        const card = header.closest('.editor-accordion-card');
        if (card) {
          card.classList.toggle('open');
        }
      }
    }
  });

  /* -------------------------------------------------------------
     1. PROFILE MANAGEMENT (MULTI-USER PROFILES)
     ------------------------------------------------------------- */
  async function refreshProfileSelector(targetId = null) {
    const profiles = await JobStorage.getProfiles();
    const activeId = targetId || (await JobStorage.getActiveProfileId());
    currentActiveProfileId = activeId;

    if (profileSelect) {
      profileSelect.innerHTML = '';
      profiles.forEach((p) => {
        const opt = document.createElement('option');
        opt.value = p.id;
        const name = p.name || (p.personal && p.personal.fullName) || 'Candidate Profile';
        opt.textContent = `${name}`;
        if (p.id === activeId) opt.selected = true;
        profileSelect.appendChild(opt);
      });
    }

    updateCompletionBadge();
  }

  function updateCompletionBadge() {
    if (!optProfileCompletion) return;
    const p = {
      fullName: getValue('fullName'),
      fullNameBn: getValue('fullNameBn'),
      fatherName: getValue('fatherName'),
      motherName: getValue('motherName'),
      dob: getValue('dob'),
      mobile: getValue('mobile'),
      nidNumber: getValue('nidNumber') || getValue('birthRegNumber'),
      district: getDistrictValue('present'),
      village: getValue('presentVillage'),
      sscRoll: getValue('sscRollNumber'),
      sscBoard: getValue('sscBoard'),
      hscRoll: getValue('hscRollNumber')
    };

    let count = 0;
    const checks = Object.values(p);
    checks.forEach((c) => { if (c && String(c).trim()) count++; });
    const percent = Math.round((count / checks.length) * 100);

    optProfileCompletion.textContent = `${percent}% Complete`;
    optProfileCompletion.style.background = percent >= 80 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.2)';
  }

  // Profile selector change handler
  if (profileSelect) {
    profileSelect.addEventListener('change', async (e) => {
      const nextId = e.target.value;
      if (!nextId || nextId === currentActiveProfileId) return;

      currentActiveProfileId = nextId;
      await JobStorage.setActiveProfileId(nextId);
      await loadProfileIntoForm(nextId);
      refreshSavedMediaGallery();
      showToast('Switched active profile.', 'success');
    });
  }

  // Add new profile
  if (btnCreateProfile) {
    btnCreateProfile.addEventListener('click', async () => {
      const name = prompt('Enter candidate name for the new profile (e.g. Md. Saiful Islam):');
      if (!name || !name.trim()) return;

      const newProf = await JobStorage.createProfile(name.trim());
      await refreshProfileSelector(newProf.id);
      await loadProfileIntoForm(newProf.id);
      refreshSavedMediaGallery();
      showToast(`Created new profile: "${name.trim()}"!`, 'success');
    });
  }

  // Duplicate profile
  if (btnDuplicateProfile) {
    btnDuplicateProfile.addEventListener('click', async () => {
      if (!currentActiveProfileId) return;
      const dup = await JobStorage.duplicateProfile(currentActiveProfileId);
      await refreshProfileSelector(dup.id);
      await loadProfileIntoForm(dup.id);
      refreshSavedMediaGallery();
      showToast(`Profile duplicated successfully as "${dup.name}"!`, 'success');
    });
  }

  // Rename profile
  if (btnRenameProfile) {
    btnRenameProfile.addEventListener('click', async () => {
      if (!currentActiveProfileId) return;
      const currentProf = await JobStorage.getProfile(currentActiveProfileId);
      const newName = prompt('Enter new profile name:', currentProf.name || '');
      if (!newName || !newName.trim()) return;

      await JobStorage.renameProfile(currentActiveProfileId, newName.trim());
      await refreshProfileSelector(currentActiveProfileId);
      showToast(`Profile renamed to "${newName.trim()}"!`, 'success');
    });
  }

  // Delete profile
  if (btnDeleteProfile) {
    btnDeleteProfile.addEventListener('click', async () => {
      if (!currentActiveProfileId) return;
      const currentProf = await JobStorage.getProfile(currentActiveProfileId);
      const confirmed = confirm(
        `Are you sure you want to permanently delete profile "${currentProf.name || 'this profile'}"?\n\nThis cannot be undone.`
      );
      if (!confirmed) return;

      try {
        const nextActive = await JobStorage.deleteProfile(currentActiveProfileId);
        await refreshProfileSelector(nextActive.id);
        await loadProfileIntoForm(nextActive.id);
        refreshSavedMediaGallery();
        showToast('Profile deleted.', 'warning');
      } catch (err) {
        alert(err.message);
      }
    });
  }

  /* -------------------------------------------------------------
     2. STRICT LANGUAGE VALIDATION (ENGLISH ONLY vs BANGLA ONLY)
     ------------------------------------------------------------- */
  function validateFieldLanguage(id, isBangla, label) {
    const el = document.getElementById(id);
    const err = document.getElementById('err-' + id);
    if (!el || !err) return true;

    const val = el.value.trim();
    if (!val) {
      err.style.display = 'none';
      el.classList.remove('input-error-lang');
      return true;
    }

    const res = isBangla
      ? JobFormValidator.validateBanglaOnly(val, label)
      : JobFormValidator.validateEnglishOnly(val, label);

    if (!res.valid) {
      err.textContent = res.message;
      err.style.display = 'block';
      el.classList.add('input-error-lang');
      return false;
    } else {
      err.style.display = 'none';
      el.classList.remove('input-error-lang');
      return true;
    }
  }

  function setupLanguageValidation() {
    const englishFields = [
      { id: 'fullName', label: "Applicant's Name (English)" },
      { id: 'fatherName', label: "Father's Name (English)" },
      { id: 'motherName', label: "Mother's Name (English)" },
      { id: 'spouseName', label: "Spouse Name (English)" }
    ];

    const banglaFields = [
      { id: 'fullNameBn', label: "আবেদনকারীর নাম (বাংলায়)" },
      { id: 'fatherNameBn', label: "পিতার নাম (বাংলায়)" },
      { id: 'motherNameBn', label: "মাতার নাম (বাংলায়)" }
    ];

    englishFields.forEach(({ id, label }) => {
      const el = document.getElementById(id);
      if (el) {
        ['input', 'blur'].forEach((ev) => {
          el.addEventListener(ev, () => validateFieldLanguage(id, false, label));
        });
      }
    });

    banglaFields.forEach(({ id, label }) => {
      const el = document.getElementById(id);
      if (el) {
        ['input', 'blur'].forEach((ev) => {
          el.addEventListener(ev, () => validateFieldLanguage(id, true, label));
        });
      }
    });
  }

  /* -------------------------------------------------------------
     3. 64 DISTRICTS, UPAZILAS & POST OFFICES (CASCADING DROPDOWNS)
     ------------------------------------------------------------- */
  function findDistrictData(name) {
    if (!name || !BangladeshData || !BangladeshData.DISTRICTS) return null;
    const q = String(name).trim().toLowerCase();
    return BangladeshData.DISTRICTS.find((d) => {
      if (d.name.toLowerCase() === q) return true;
      if (d.nameBn && d.nameBn === name.trim()) return true;
      if (d.altNames && d.altNames.some(alt => alt.toLowerCase() === q)) return true;
      return false;
    }) || null;
  }

  function initDistrictOptions() {
    if (!BangladeshData || !BangladeshData.DISTRICTS) return;

    // Sort districts alphabetically
    const sorted = [...BangladeshData.DISTRICTS].sort((a, b) => a.name.localeCompare(b.name));

    [presentDistrict, permanentDistrict].forEach((sel) => {
      if (!sel) return;
      sel.innerHTML = '<option value="">Select District</option>';
      sorted.forEach((d) => {
        const opt = document.createElement('option');
        opt.value = d.name;
        opt.textContent = `${d.name} (${d.nameBn})`;
        sel.appendChild(opt);
      });
    });
  }

  function updateUpazilas(prefix, districtName, targetValue = '') {
    const sel = document.getElementById(prefix + 'Upazila');
    const custom = document.getElementById(prefix + 'UpazilaCustom');
    if (!sel) return;

    sel.innerHTML = '';
    const dData = findDistrictData(districtName);

    if (!dData || !dData.upazilas || dData.upazilas.length === 0) {
      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = districtName ? '-- No Upazilas Found --' : '-- Select District First --';
      sel.appendChild(defaultOpt);
      if (custom) custom.style.display = 'none';
      return;
    }

    const promptOpt = document.createElement('option');
    promptOpt.value = '';
    promptOpt.textContent = '-- Select Upazila / Thana --';
    sel.appendChild(promptOpt);

    let matched = false;
    dData.upazilas.forEach((upz) => {
      const opt = document.createElement('option');
      opt.value = upz;
      opt.textContent = upz;
      if (targetValue && upz.toLowerCase() === targetValue.toLowerCase()) {
        opt.selected = true;
        matched = true;
      }
      sel.appendChild(opt);
    });

    const customOpt = document.createElement('option');
    customOpt.value = '__custom__';
    customOpt.textContent = '✏️ Other / Enter Manually...';
    sel.appendChild(customOpt);

    if (targetValue && !matched) {
      customOpt.selected = true;
      if (custom) {
        custom.style.display = 'block';
        custom.value = targetValue;
      }
    } else if (custom) {
      custom.style.display = 'none';
    }
  }

  function updatePostOffices(prefix, districtName, upazilaName, targetPo = '', targetCode = '') {
    const poInput = document.getElementById(prefix + 'PostOffice');
    const codeInput = document.getElementById(prefix + 'PostCode');
    if (targetPo && poInput) {
      poInput.value = targetPo;
    }
    if (targetCode && codeInput) {
      codeInput.value = targetCode;
    }
  }

  function getDistrictValue(prefix) {
    const el = document.getElementById(prefix + 'District');
    return el ? el.value.trim() : '';
  }

  function getUpazilaValue(prefix) {
    const sel = document.getElementById(prefix + 'Upazila');
    const custom = document.getElementById(prefix + 'UpazilaCustom');
    if (!sel) return '';
    if (sel.value === '__custom__') return custom ? custom.value.trim() : '';
    return sel.value;
  }

  function getPostOfficeValue(prefix) {
    const el = document.getElementById(prefix + 'PostOffice');
    return el ? el.value.trim() : '';
  }

  function setupAddressCascading() {
    initDistrictOptions();

    // Present District Change
    if (presentDistrict) {
      presentDistrict.addEventListener('change', () => {
        const dist = presentDistrict.value;
        updateUpazilas('present', dist);
        if (sameAsPresent.checked) syncAddresses();
      });
    }

    // Present Upazila Change
    if (presentUpazila) {
      presentUpazila.addEventListener('change', () => {
        if (presentUpazila.value === '__custom__') {
          presentUpazilaCustom.style.display = 'block';
          presentUpazilaCustom.focus();
        } else {
          presentUpazilaCustom.style.display = 'none';
        }
        if (sameAsPresent.checked) syncAddresses();
      });
    }

    // Permanent District Change
    if (permanentDistrict) {
      permanentDistrict.addEventListener('change', () => {
        const dist = permanentDistrict.value;
        updateUpazilas('permanent', dist);
      });
    }

    // Permanent Upazila Change
    if (permanentUpazila) {
      permanentUpazila.addEventListener('change', () => {
        if (permanentUpazila.value === '__custom__') {
          permanentUpazilaCustom.style.display = 'block';
          permanentUpazilaCustom.focus();
        } else {
          permanentUpazilaCustom.style.display = 'none';
        }
      });
    }
  }

  /* -------------------------------------------------------------
     4. EDUCATION DYNAMIC OPTIONS (DIPLOMA TECHNOLOGIES & DATALISTS)
     ------------------------------------------------------------- */
  function initEducationDynamicOptions() {
    if (!BangladeshData) return;

    // Populate Graduation Degrees datalist
    const gradDegreesList = document.getElementById('grad-degrees-list');
    if (gradDegreesList && BangladeshData.GRADUATION_DEGREES) {
      gradDegreesList.innerHTML = '';
      BangladeshData.GRADUATION_DEGREES.forEach((deg) => {
        const opt = document.createElement('option');
        opt.value = deg;
        gradDegreesList.appendChild(opt);
      });
    }

    // Populate UGC Universities datalist
    const universitiesList = document.getElementById('universities-list');
    if (universitiesList && BangladeshData.UNIVERSITIES) {
      universitiesList.innerHTML = '';
      BangladeshData.UNIVERSITIES.forEach((uni) => {
        const opt = document.createElement('option');
        opt.value = uni;
        universitiesList.appendChild(opt);
      });
    }

    // Populate Graduation Subjects datalist
    const gradSubjectsList = document.getElementById('grad-subjects-list');
    if (gradSubjectsList && BangladeshData.GRADUATION_SUBJECTS) {
      gradSubjectsList.innerHTML = '';
      BangladeshData.GRADUATION_SUBJECTS.forEach((sub) => {
        const opt = document.createElement('option');
        opt.value = sub;
        gradSubjectsList.appendChild(opt);
      });
    }

    // HSC Examination change handler
    if (hscExamination) {
      hscExamination.addEventListener('change', () => {
        updateHscGroupOptions(hscExamination.value, '');
        if (hscExamination.value === 'Diploma in Engineering') {
          const hscResultType = document.getElementById('hscResultType');
          if (hscResultType) hscResultType.value = 'GPA(out of 4)';
          const hscBoard = document.getElementById('hscBoard');
          if (hscBoard && hscBoard.value === 'Dhaka') hscBoard.value = 'Technical';
        }
      });
    }

    // HSC Group change handler for custom trade
    if (hscGroupSubject) {
      hscGroupSubject.addEventListener('change', () => {
        if (hscGroupSubject.value === '__custom__') {
          hscGroupSubjectCustom.style.display = 'block';
          hscGroupSubjectCustom.focus();
        } else {
          hscGroupSubjectCustom.style.display = 'none';
        }
      });
    }
  }

  function updateHscGroupOptions(examVal, selectedGroup = '') {
    if (!hscGroupSubject) return;
    hscGroupSubject.innerHTML = '';

    const isDiploma = examVal && examVal.toLowerCase().includes('diploma');
    const isAlim = examVal && examVal.toLowerCase() === 'alim';
    const isVocationalOrBm = examVal && (examVal.toLowerCase().includes('bm') || examVal.toLowerCase().includes('vocational'));

    let optionsList = [];

    if (isDiploma) {
      optionsList = BangladeshData.DIPLOMA_TECHNOLOGIES || [
        'Civil Technology', 'Computer Technology', 'Electrical Technology', 'Mechanical Technology'
      ];
      if (hscGroupHint) {
        hscGroupHint.textContent = 'Showing BTEB Diploma in Engineering disciplines (Civil, Computer, Electrical, etc.)';
      }
    } else if (isAlim) {
      optionsList = ['General', 'Quran & Hadith', 'Islamic Studies', 'Science', 'Muzabbid', 'Others'];
      if (hscGroupHint) hscGroupHint.textContent = 'Alim Madrasah Education Board groups';
    } else if (isVocationalOrBm) {
      optionsList = ['Accounting', 'Computer Operation', 'Secretarial Practices', 'Banking', 'Entrepreneurship', 'Vocational Trades', 'Others'];
      if (hscGroupHint) hscGroupHint.textContent = 'HSC (BM / Vocational) specialized branches';
    } else {
      optionsList = ['Science', 'Humanities', 'Business Studies', 'Vocational', 'Others'];
      if (hscGroupHint) hscGroupHint.textContent = 'Standard Higher Secondary Certificate groups';
    }

    let matched = false;
    optionsList.forEach((grp) => {
      const opt = document.createElement('option');
      opt.value = grp;
      opt.textContent = grp;
      if (selectedGroup && grp.toLowerCase() === selectedGroup.toLowerCase()) {
        opt.selected = true;
        matched = true;
      }
      hscGroupSubject.appendChild(opt);
    });

    const customOpt = document.createElement('option');
    customOpt.value = '__custom__';
    customOpt.textContent = '✏️ Other / Enter Custom Technology...';
    hscGroupSubject.appendChild(customOpt);

    if (selectedGroup && !matched) {
      customOpt.selected = true;
      if (hscGroupSubjectCustom) {
        hscGroupSubjectCustom.style.display = 'block';
        hscGroupSubjectCustom.value = selectedGroup;
      }
    } else if (hscGroupSubjectCustom) {
      hscGroupSubjectCustom.style.display = 'none';
    }
  }

  function getHscGroupValue() {
    if (!hscGroupSubject) return 'Science';
    if (hscGroupSubject.value === '__custom__') {
      return hscGroupSubjectCustom ? hscGroupSubjectCustom.value.trim() : '';
    }
    return hscGroupSubject.value;
  }

  /* -------------------------------------------------------------
     5. DYNAMIC UI INTERACTIONS & SYNCHRONIZATION
     ------------------------------------------------------------- */
  maritalStatus.addEventListener('change', () => {
    grpSpouseName.style.display = maritalStatus.value === 'Married' ? 'flex' : 'none';
  });

  masApplicable.addEventListener('change', () => {
    mastersFields.style.display = masApplicable.checked ? 'grid' : 'none';
  });

  sameAsPresent.addEventListener('change', () => {
    syncAddresses();
  });

  function syncAddresses() {
    if (sameAsPresent.checked) {
      document.getElementById('permanentCareOf').value = document.getElementById('presentCareOf').value;
      document.getElementById('permanentVillage').value = document.getElementById('presentVillage').value;

      const pDist = getDistrictValue('present');
      const pUpz = getUpazilaValue('present');
      const pPo = getPostOfficeValue('present');
      const pCode = presentPostCode.value;

      permanentDistrict.value = pDist;
      updateUpazilas('permanent', pDist, pUpz);
      updatePostOffices('permanent', pDist, pUpz, pPo, pCode);
      permanentPostCode.value = pCode;

      // Visually dim permanent fields to indicate automatic sync
      permanentAddressFields.style.opacity = '0.55';
      permanentAddressFields.style.pointerEvents = 'none';
    } else {
      permanentAddressFields.style.opacity = '1';
      permanentAddressFields.style.pointerEvents = 'auto';
    }
  }

  // Live copy when present address fields change and sameAsPresent is active
  ['presentCareOf', 'presentVillage', 'presentDistrict', 'presentUpazila', 'presentPostOffice', 'presentPostCode'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        if (sameAsPresent.checked) syncAddresses();
        updateCompletionBadge();
      });
      el.addEventListener('change', () => {
        if (sameAsPresent.checked) syncAddresses();
        updateCompletionBadge();
      });
    }
  });

  // Calculate age hint on DOB change
  dobInput.addEventListener('change', () => {
    if (!dobInput.value) {
      dobAgeHint.textContent = 'Format: YYYY-MM-DD';
      return;
    }
    const res = JobFormValidator.validateDateOfBirth(dobInput.value);
    if (res.age !== null) {
      dobAgeHint.textContent = `Calculated Age: ~${res.age} years old`;
    }
    updateCompletionBadge();
  });

  /* -------------------------------------------------------------
     6. POPULATE FORM FROM STORAGE
     ------------------------------------------------------------- */
  async function loadProfileIntoForm(profileId = null) {
    const profile = await JobStorage.getProfile(profileId);
    currentActiveProfileId = profile.id;
    const p = profile.personal || {};

    // Personal
    setValue('fullName', p.fullName);
    setValue('fullNameBn', p.fullNameBn);
    setValue('fatherName', p.fatherName);
    setValue('fatherNameBn', p.fatherNameBn);
    setValue('motherName', p.motherName);
    setValue('motherNameBn', p.motherNameBn);
    if (p.dob) {
      const dobRes = JobFormValidator.validateDateOfBirth(p.dob);
      setValue('dob', dobRes.isoDate || p.dob);
    } else {
      setValue('dob', '');
    }
    setValue('nationality', p.nationality || 'Bangladeshi');
    setValue('religion', p.religion || 'Islam');
    setValue('gender', p.gender || 'Male');
    setValue('maritalStatus', p.maritalStatus || 'Single');
    setValue('spouseName', p.spouseName);
    const rawQuota = p.quota || 'Not Applicable';
    setValue('quota', (rawQuota === 'Non-Quota' || rawQuota === 'None') ? 'Not Applicable' : rawQuota);
    setValue('departmentalStatus', p.departmentalStatus || 'None');

    setValue('nidAvailable', p.nidAvailable || 'Yes');
    setValue('nidNumber', p.nidNumber);
    setValue('birthRegAvailable', p.birthRegAvailable || 'No');
    setValue('birthRegNumber', p.birthRegNumber);
    setValue('passportAvailable', p.passportAvailable || 'No');
    setValue('passportNumber', p.passportNumber);

    setValue('mobile', p.mobile);
    setValue('confirmMobile', p.confirmMobile || p.mobile);
    setValue('email', p.email);

    // Present Address
    const pra = profile.presentAddress || {};
    setValue('presentCareOf', pra.careOf);
    setValue('presentVillage', pra.village);
    if (presentDistrict) presentDistrict.value = pra.district || '';
    updateUpazilas('present', pra.district || '', pra.upazila || '');
    setValue('presentPostOffice', pra.postOffice);
    setValue('presentPostCode', pra.postCode);

    // Permanent Address
    const pma = profile.permanentAddress || {};
    sameAsPresent.checked = pma.sameAsPresent === true;
    setValue('permanentCareOf', pma.careOf);
    setValue('permanentVillage', pma.village);
    if (permanentDistrict) permanentDistrict.value = pma.district || '';
    updateUpazilas('permanent', pma.district || '', pma.upazila || '');
    setValue('permanentPostOffice', pma.postOffice);
    setValue('permanentPostCode', pma.postCode);

    // SSC
    const ssc = profile.ssc || {};
    setValue('sscExamination', ssc.examination || 'S.S.C');
    setValue('sscRollNumber', ssc.rollNumber);
    setValue('sscGroupSubject', ssc.groupSubject || 'Science');
    setValue('sscBoard', ssc.board || 'Dhaka');
    setValue('sscResultType', ssc.resultType || 'GPA(out of 5)');
    setValue('sscResultMarks', ssc.resultMarks);
    setValue('sscPassingYear', ssc.passingYear);

    // HSC
    const hsc = profile.hsc || {};
    setValue('hscExamination', hsc.examination || 'H.S.C');
    setValue('hscRollNumber', hsc.rollNumber);
    updateHscGroupOptions(hsc.examination || 'H.S.C', hsc.groupSubject || 'Science');
    setValue('hscBoard', hsc.board || 'Dhaka');
    setValue('hscResultType', hsc.resultType || 'GPA(out of 5)');
    setValue('hscResultMarks', hsc.resultMarks);
    setValue('hscPassingYear', hsc.passingYear);

    // Graduation
    const gra = profile.graduation || {};
    setValue('graExamination', gra.examination);
    setValue('graInstitute', gra.institute);
    setValue('graSubject', gra.subject);
    setValue('graResultType', gra.resultType || 'GPA(out of 4)');
    setValue('graResultMarks', gra.resultMarks);
    setValue('graPassingYear', gra.passingYear);
    setValue('graDuration', gra.courseDuration || '4 Years');

    // Masters
    const mas = profile.masters || {};
    masApplicable.checked = mas.applicable === true;
    setValue('masExamination', mas.examination);
    setValue('masInstitute', mas.institute);
    setValue('masSubject', mas.subject);
    setValue('masResultType', mas.resultType || 'GPA(out of 4)');
    setValue('masResultMarks', mas.resultMarks);
    setValue('masPassingYear', mas.passingYear);
    setValue('masDuration', mas.courseDuration || '1 Year');

    // Other Qualifications & Experience
    const oq = profile.otherQualifications || {};
    setValue('computerProficiency', oq.computerProficiency || oq['Do you have Computer proficiency?'] || 'Yes');
    setValue('computerTypingSpeed', oq.computerTypingSpeed || oq['Computer Typing Speed'] || 'Yes');

    // Settings
    const s = profile.settings || {};
    document.getElementById('setting-enableAutofill').checked = s.enableAutofill !== false;
    document.getElementById('setting-overwriteExisting').checked = s.overwriteExisting === true;
    document.getElementById('setting-showFloatingPill').checked = s.showFloatingPill !== false;
    document.getElementById('setting-delayMs').value = s.dependentDropdownDelayMs || 450;

    // Trigger visual state updates
    grpSpouseName.style.display = p.maritalStatus === 'Married' ? 'flex' : 'none';
    mastersFields.style.display = mas.applicable ? 'grid' : 'none';
    syncAddresses();

    if (p.dob) {
      const res = JobFormValidator.validateDateOfBirth(p.dob);
      if (res.age !== null) dobAgeHint.textContent = `Calculated Age: ~${res.age} years old`;
    }

    updateCompletionBadge();
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val === undefined || val === null ? '' : val;
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  /* -------------------------------------------------------------
     7. GATHER AND SAVE PROFILE
     ------------------------------------------------------------- */
  async function gatherProfileFromForm() {
    const activeProf = await JobStorage.getProfile(currentActiveProfileId);

    const presDist = getDistrictValue('present');
    const presUpz = getUpazilaValue('present');
    const presPo = getPostOfficeValue('present');
    const presPc = getValue('presentPostCode');

    const permDist = sameAsPresent.checked ? presDist : getDistrictValue('permanent');
    const permUpz = sameAsPresent.checked ? presUpz : getUpazilaValue('permanent');
    const permPo = sameAsPresent.checked ? presPo : getPostOfficeValue('permanent');
    const permPc = sameAsPresent.checked ? presPc : getValue('permanentPostCode');

    return {
      id: currentActiveProfileId || activeProf.id,
      name: activeProf.name || getValue('fullName') || 'Candidate Profile',
      personal: {
        fullName: getValue('fullName').toUpperCase(),
        fullNameBn: getValue('fullNameBn'),
        fatherName: getValue('fatherName').toUpperCase(),
        fatherNameBn: getValue('fatherNameBn'),
        motherName: getValue('motherName').toUpperCase(),
        motherNameBn: getValue('motherNameBn'),
        dob: getValue('dob'),
        nationality: getValue('nationality') || 'Bangladeshi',
        religion: getValue('religion') || 'Islam',
        gender: getValue('gender') || 'Male',
        maritalStatus: getValue('maritalStatus') || 'Single',
        spouseName: getValue('spouseName'),
        quota: getValue('quota') || 'Non-Quota',
        departmentalStatus: getValue('departmentalStatus') || 'None',

        nidAvailable: getValue('nidAvailable') || 'Yes',
        nidNumber: getValue('nidNumber'),
        birthRegAvailable: getValue('birthRegAvailable') || 'No',
        birthRegNumber: getValue('birthRegNumber'),
        passportAvailable: getValue('passportAvailable') || 'No',
        passportNumber: getValue('passportNumber'),

        mobile: JobFormValidator.normalizeMobile(getValue('mobile')),
        confirmMobile: JobFormValidator.normalizeMobile(getValue('confirmMobile')),
        email: getValue('email')
      },
      presentAddress: {
        careOf: getValue('presentCareOf'),
        village: getValue('presentVillage'),
        district: presDist,
        upazila: presUpz,
        postOffice: presPo,
        postCode: presPc
      },
      permanentAddress: {
        sameAsPresent: sameAsPresent.checked,
        careOf: sameAsPresent.checked ? getValue('presentCareOf') : getValue('permanentCareOf'),
        village: sameAsPresent.checked ? getValue('presentVillage') : getValue('permanentVillage'),
        district: permDist,
        upazila: permUpz,
        postOffice: permPo,
        postCode: permPc
      },
      ssc: {
        examination: getValue('sscExamination') || 'S.S.C',
        rollNumber: getValue('sscRollNumber'),
        groupSubject: getValue('sscGroupSubject') || 'Science',
        board: getValue('sscBoard') || 'Dhaka',
        resultType: getValue('sscResultType') || 'GPA(out of 5)',
        resultMarks: getValue('sscResultMarks'),
        passingYear: getValue('sscPassingYear')
      },
      hsc: {
        examination: getValue('hscExamination') || 'H.S.C',
        rollNumber: getValue('hscRollNumber'),
        groupSubject: getHscGroupValue(),
        board: getValue('hscBoard') || 'Dhaka',
        resultType: getValue('hscResultType') || 'GPA(out of 5)',
        resultMarks: getValue('hscResultMarks'),
        passingYear: getValue('hscPassingYear')
      },
      graduation: {
        examination: getValue('graExamination'),
        institute: getValue('graInstitute'),
        subject: getValue('graSubject'),
        resultType: getValue('graResultType') || 'GPA(out of 4)',
        resultMarks: getValue('graResultMarks'),
        passingYear: getValue('graPassingYear'),
        courseDuration: getValue('graDuration') || '4 Years'
      },
      masters: {
        applicable: masApplicable.checked,
        examination: getValue('masExamination'),
        institute: getValue('masInstitute'),
        subject: getValue('masSubject'),
        resultType: getValue('masResultType') || 'GPA(out of 4)',
        resultMarks: getValue('masResultMarks'),
        passingYear: getValue('masPassingYear'),
        courseDuration: getValue('masDuration') || '1 Year'
      },
      otherQualifications: {
        computerProficiency: getValue('computerProficiency') || 'Yes',
        computerTypingSpeed: getValue('computerTypingSpeed') || 'Yes',
        'Do you have Computer proficiency?': getValue('computerProficiency') || 'Yes',
        'Computer Typing Speed': getValue('computerTypingSpeed') || 'Yes'
      },
      settings: {
        enableAutofill: document.getElementById('setting-enableAutofill').checked,
        overwriteExisting: document.getElementById('setting-overwriteExisting').checked,
        showFloatingPill: document.getElementById('setting-showFloatingPill').checked,
        dependentDropdownDelayMs: parseInt(document.getElementById('setting-delayMs').value, 10) || 450
      }
    };
  }

  async function handleSave() {
    // 1. Language validation checks
    const englishChecks = [
      { id: 'fullName', label: "Applicant's Name (English)" },
      { id: 'fatherName', label: "Father's Name (English)" },
      { id: 'motherName', label: "Mother's Name (English)" },
      { id: 'spouseName', label: "Spouse Name (English)" }
    ];

    for (const item of englishChecks) {
      if (!validateFieldLanguage(item.id, false, item.label)) {
        showToast(`Language Error: ${item.label} must only contain English letters.`, 'error');
        document.querySelector('.tab-btn[data-tab="tab-personal"]').click();
        document.getElementById(item.id).focus();
        return;
      }
    }

    const banglaChecks = [
      { id: 'fullNameBn', label: "আবেদনকারীর নাম (বাংলায়)" },
      { id: 'fatherNameBn', label: "পিতার নাম (বাংলায়)" },
      { id: 'motherNameBn', label: "মাতার নাম (বাংলায়)" }
    ];

    for (const item of banglaChecks) {
      if (!validateFieldLanguage(item.id, true, item.label)) {
        showToast(`Language Error: ${item.label} শুধুমাত্র বাংলা অক্ষরে লিখতে হবে।`, 'error');
        document.querySelector('.tab-btn[data-tab="tab-personal"]').click();
        document.getElementById(item.id).focus();
        return;
      }
    }

    const profile = await gatherProfileFromForm();

    // Check non-blocking warnings
    const { warnings } = JobFormValidator.validateProfile(profile);

    await JobStorage.saveProfile(profile, currentActiveProfileId);
    await refreshProfileSelector(currentActiveProfileId);

    if (warnings.length > 0) {
      showToast(`Saved! Note: ${warnings[0].message}`, 'warning');
    } else {
      showToast('Profile saved successfully! Ready to autofill.', 'success');
    }
  }

  btnSaveTop.addEventListener('click', (e) => {
    e.preventDefault();
    handleSave();
  });
  btnSaveBottom.addEventListener('click', (e) => {
    e.preventDefault();
    handleSave();
  });

  function showToast(text, type = 'success') {
    toastMessage.textContent = text;
    toastMessage.className = `toast ${type}`;
    toastMessage.style.display = 'block';
    setTimeout(() => {
      toastMessage.style.display = 'none';
    }, 4000);
  }

  /* -------------------------------------------------------------
     BACKUP EXPORTS & IMPORTS
     ------------------------------------------------------------- */
  // Plain JSON Export
  btnExportPlain.addEventListener('click', async () => {
    const profile = await gatherProfileFromForm();
    const jsonStr = JobStorage.exportPlainProfile(profile);
    downloadFile(jsonStr, `teletalk_profile_plain_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    showToast('Exported plain JSON backup.', 'success');
  });

  // Plain JSON Import Trigger
  btnImportPlainTrigger.addEventListener('click', () => {
    importMode = 'plain';
    optionsFileInput.click();
  });

  // Encrypted Vault Export (AES-GCM)
  btnExportEncrypted.addEventListener('click', async () => {
    const pass = exportPassphrase.value;
    if (!pass || pass.length < 6) {
      alert('Please enter a passphrase of at least 6 characters in the field above.');
      exportPassphrase.focus();
      return;
    }

    try {
      const profile = await gatherProfileFromForm();
      const encryptedJson = await JobStorage.exportEncryptedProfile(profile, pass);
      downloadFile(
        encryptedJson,
        `teletalk_vault_encrypted_${new Date().toISOString().slice(0, 10)}.json`,
        'application/json'
      );
      showToast('Encrypted backup created successfully!', 'success');
    } catch (err) {
      alert(`Encryption Error: ${err.message}`);
    }
  });

  // Encrypted Vault Import Trigger
  btnImportEncryptedTrigger.addEventListener('click', () => {
    const pass = exportPassphrase.value;
    if (!pass) {
      alert('Please enter the passphrase in the field above to decrypt the incoming backup file.');
      exportPassphrase.focus();
      return;
    }
    importMode = 'encrypted';
    optionsFileInput.click();
  });

  // File Input Handler
  optionsFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        let importedProfile = null;
        if (importMode === 'encrypted') {
          const pass = exportPassphrase.value;
          importedProfile = await JobStorage.importEncryptedProfile(event.target.result, pass);
        } else {
          importedProfile = JobStorage.importPlainProfile(event.target.result);
        }

        if (confirm('Import profile? This will overwrite your currently loaded profile in this window.')) {
          await JobStorage.saveProfile(importedProfile);
          await loadProfileIntoForm();
          showToast('Profile imported and applied successfully!', 'success');
        }
      } catch (err) {
        alert(`Import Failed: ${err.message}`);
      }
      optionsFileInput.value = '';
    };
    reader.readAsText(file);
  });

  function downloadFile(content, fileName, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* -------------------------------------------------------------
     DANGER ZONE: ERASE DATA
     ------------------------------------------------------------- */
  btnEraseAll.addEventListener('click', async () => {
    const firstCheck = confirm('⚠️ WARNING: Erase all stored profile data?\n\nThis will clear your personal and educational information from browser local storage.');
    if (!firstCheck) return;

    const secondCheck = prompt('Please type "DELETE" to permanently erase your profile:');
    if (secondCheck === 'DELETE') {
      await JobStorage.resetProfile();
      await loadProfileIntoForm();
      showToast('Profile erased and reset to fresh blank template.', 'warning');
    } else {
      alert('Action cancelled.');
    }
  });

  /* =============================================================
     TAB 4: PHOTO & SIGNATURE EDITORS CONTROLLER
     ============================================================= */
  let photoEditorInstance = null;
  let sigEditorInstance = null;

  function initPhotoAndSignatureEditors() {
    // Subtab switching
    const subtabButtons = document.querySelectorAll('.subtab-btn');
    const subtabPanes = document.querySelectorAll('.subtab-pane');

    subtabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        subtabButtons.forEach((b) => b.classList.remove('active'));
        subtabPanes.forEach((p) => p.classList.remove('active'));

        btn.classList.add('active');
        const target = document.getElementById(btn.dataset.subtab);
        if (target) target.classList.add('active');

        if (btn.dataset.subtab === 'subtab-saved-media') {
          refreshSavedMediaGallery();
        }
      });
    });

    // Initialize Advanced Passport Photo Editor
    photoEditorInstance = new PassportPhotoEditor({
      mode: 'photo',
      containerId: 'subtab-photo',
      canvasId: 'photo-canvas',
      overlayCanvasId: 'photo-overlay-canvas',
      dropZoneId: 'photo-drop-zone',
      fileInputId: 'photo-file-input',
      browseBtnId: 'btn-browse-photo',
      fileInfoId: 'photo-file-info',
      estSizeId: 'photo-est-size',
      targetWidth: 300,
      targetHeight: 300,
      maxFileSizeBytes: 100 * 1024,
      onSave: async (dataUrl, metadata) => {
        await JobStorage.savePhoto(dataUrl, metadata, currentActiveProfileId);
        refreshSavedMediaGallery();
      }
    });

    // Initialize Advanced Signature Editor
    sigEditorInstance = new PassportPhotoEditor({
      mode: 'signature',
      containerId: 'subtab-signature',
      canvasId: 'sig-canvas',
      overlayCanvasId: 'sig-overlay-canvas',
      dropZoneId: 'sig-drop-zone',
      fileInputId: 'sig-file-input',
      browseBtnId: 'btn-browse-sig',
      fileInfoId: 'sig-file-info',
      estSizeId: 'sig-est-size',
      targetWidth: 300,
      targetHeight: 80,
      maxFileSizeBytes: 60 * 1024,
      onSave: async (dataUrl, metadata) => {
        await JobStorage.saveSignature(dataUrl, metadata, currentActiveProfileId);
        refreshSavedMediaGallery();
      }
    });

    /* -----------------------------------------------------------
       3. SAVED MEDIA GALLERY CONTROLLER
       ----------------------------------------------------------- */
    const savedPhotoImg = document.getElementById('saved-photo-img');
    const savedPhotoEmpty = document.getElementById('saved-photo-empty');
    const savedPhotoStatus = document.getElementById('saved-photo-status');
    const savedPhotoMeta = document.getElementById('saved-photo-meta');
    const savedPhotoDim = document.getElementById('saved-photo-dim');
    const savedPhotoSize = document.getElementById('saved-photo-size');
    const savedPhotoTime = document.getElementById('saved-photo-time');
    const btnLoadSavedPhoto = document.getElementById('btn-load-saved-photo');
    const btnDownloadSavedPhoto = document.getElementById('btn-download-saved-photo');
    const btnDeleteSavedPhoto = document.getElementById('btn-delete-saved-photo');

    const savedSigImg = document.getElementById('saved-sig-img');
    const savedSigEmpty = document.getElementById('saved-sig-empty');
    const savedSigStatus = document.getElementById('saved-sig-status');
    const savedSigMeta = document.getElementById('saved-sig-meta');
    const savedSigDim = document.getElementById('saved-sig-dim');
    const savedSigSize = document.getElementById('saved-sig-size');
    const savedSigTime = document.getElementById('saved-sig-time');
    const btnLoadSavedSig = document.getElementById('btn-load-saved-sig');
    const btnDownloadSavedSig = document.getElementById('btn-download-saved-sig');
    const btnDeleteSavedSig = document.getElementById('btn-delete-saved-sig');

    let currentSavedPhoto = null;
    let currentSavedSig = null;

    refreshSavedMediaGallery = async function () {
      // 1. Photo
      currentSavedPhoto = await JobStorage.getPhoto(currentActiveProfileId);
      if (currentSavedPhoto && currentSavedPhoto.dataUrl) {
        if (savedPhotoImg) {
          savedPhotoImg.src = currentSavedPhoto.dataUrl;
          savedPhotoImg.style.display = 'block';
        }
        if (savedPhotoEmpty) savedPhotoEmpty.style.display = 'none';
        if (savedPhotoStatus) {
          savedPhotoStatus.className = 'status-pill saved';
          savedPhotoStatus.textContent = 'Saved in Storage';
        }
        if (savedPhotoMeta) savedPhotoMeta.style.display = 'flex';
        if (savedPhotoDim) savedPhotoDim.textContent = `${currentSavedPhoto.meta?.width || 300} × ${currentSavedPhoto.meta?.height || 300} px`;
        if (savedPhotoSize) savedPhotoSize.textContent = `${currentSavedPhoto.meta?.sizeKb || '~0'} KB`;
        if (savedPhotoTime) {
          savedPhotoTime.textContent = currentSavedPhoto.meta?.savedAt
            ? new Date(currentSavedPhoto.meta.savedAt).toLocaleDateString()
            : '';
        }

        if (btnLoadSavedPhoto) btnLoadSavedPhoto.disabled = false;
        if (btnDownloadSavedPhoto) btnDownloadSavedPhoto.disabled = false;
        if (btnDeleteSavedPhoto) btnDeleteSavedPhoto.disabled = false;
      } else {
        if (savedPhotoImg) savedPhotoImg.style.display = 'none';
        if (savedPhotoEmpty) savedPhotoEmpty.style.display = 'flex';
        if (savedPhotoStatus) {
          savedPhotoStatus.className = 'status-pill';
          savedPhotoStatus.textContent = 'Not Saved';
        }
        if (savedPhotoMeta) savedPhotoMeta.style.display = 'none';
        if (btnLoadSavedPhoto) btnLoadSavedPhoto.disabled = true;
        if (btnDownloadSavedPhoto) btnDownloadSavedPhoto.disabled = true;
        if (btnDeleteSavedPhoto) btnDeleteSavedPhoto.disabled = true;
      }

      // 2. Signature
      currentSavedSig = await JobStorage.getSignature(currentActiveProfileId);
      if (currentSavedSig && currentSavedSig.dataUrl) {
        if (savedSigImg) {
          savedSigImg.src = currentSavedSig.dataUrl;
          savedSigImg.style.display = 'block';
        }
        if (savedSigEmpty) savedSigEmpty.style.display = 'none';
        if (savedSigStatus) {
          savedSigStatus.className = 'status-pill saved';
          savedSigStatus.textContent = 'Saved in Storage';
        }
        if (savedSigMeta) savedSigMeta.style.display = 'flex';
        if (savedSigDim) savedSigDim.textContent = `${currentSavedSig.meta?.width || 300} × ${currentSavedSig.meta?.height || 80} px`;
        if (savedSigSize) savedSigSize.textContent = `${currentSavedSig.meta?.sizeKb || '~0'} KB`;
        if (savedSigTime) {
          savedSigTime.textContent = currentSavedSig.meta?.savedAt
            ? new Date(currentSavedSig.meta.savedAt).toLocaleDateString()
            : '';
        }

        if (btnLoadSavedSig) btnLoadSavedSig.disabled = false;
        if (btnDownloadSavedSig) btnDownloadSavedSig.disabled = false;
        if (btnDeleteSavedSig) btnDeleteSavedSig.disabled = false;
      } else {
        if (savedSigImg) savedSigImg.style.display = 'none';
        if (savedSigEmpty) savedSigEmpty.style.display = 'flex';
        if (savedSigStatus) {
          savedSigStatus.className = 'status-pill';
          savedSigStatus.textContent = 'Not Saved';
        }
        if (savedSigMeta) savedSigMeta.style.display = 'none';
        if (btnLoadSavedSig) btnLoadSavedSig.disabled = true;
        if (btnDownloadSavedSig) btnDownloadSavedSig.disabled = true;
        if (btnDeleteSavedSig) btnDeleteSavedSig.disabled = true;
      }
    };

    // Action buttons for Saved Photo
    if (btnLoadSavedPhoto) {
      btnLoadSavedPhoto.addEventListener('click', () => {
        if (!currentSavedPhoto || !currentSavedPhoto.dataUrl) return;
        photoEditorInstance.loadDataUrl(currentSavedPhoto.dataUrl, currentSavedPhoto.meta || {});
        document.querySelector('.subtab-btn[data-subtab="subtab-photo"]').click();
        showToast('Saved photo loaded into Photo Editor!', 'success');
      });
    }

    if (btnDownloadSavedPhoto) {
      btnDownloadSavedPhoto.addEventListener('click', () => {
        if (!currentSavedPhoto || !currentSavedPhoto.dataUrl) return;
        const a = document.createElement('a');
        a.href = currentSavedPhoto.dataUrl;
        const ext = (currentSavedPhoto.meta?.format || '').includes('png') ? 'png' : 'jpg';
        a.download = `candidate_photo_300x300.${ext}`;
        a.click();
      });
    }

    if (btnDeleteSavedPhoto) {
      btnDeleteSavedPhoto.addEventListener('click', async () => {
        if (confirm('Delete saved photo from local storage?')) {
          await JobStorage.removePhoto(currentActiveProfileId);
          showToast('Saved photo removed from local storage.', 'warning');
          refreshSavedMediaGallery();
        }
      });
    }

    // Action buttons for Saved Signature
    if (btnLoadSavedSig) {
      btnLoadSavedSig.addEventListener('click', () => {
        if (!currentSavedSig || !currentSavedSig.dataUrl) return;
        sigEditorInstance.loadDataUrl(currentSavedSig.dataUrl, currentSavedSig.meta || {});
        document.querySelector('.subtab-btn[data-subtab="subtab-signature"]').click();
        showToast('Saved signature loaded into Signature Editor!', 'success');
      });
    }

    if (btnDownloadSavedSig) {
      btnDownloadSavedSig.addEventListener('click', () => {
        if (!currentSavedSig || !currentSavedSig.dataUrl) return;
        const a = document.createElement('a');
        a.href = currentSavedSig.dataUrl;
        const ext = (currentSavedSig.meta?.format || '').includes('png') ? 'png' : 'jpg';
        a.download = `candidate_signature_300x80.${ext}`;
        a.click();
      });
    }

    if (btnDeleteSavedSig) {
      btnDeleteSavedSig.addEventListener('click', async () => {
        if (confirm('Delete saved signature from local storage?')) {
          await JobStorage.removeSignature(currentActiveProfileId);
          showToast('Saved signature removed from local storage.', 'warning');
          refreshSavedMediaGallery();
        }
      });
    }

    refreshSavedMediaGallery();
  }

  // Initialize form, address dropdowns, dynamic education, and editors
  setupAddressCascading();
  setupLanguageValidation();
  initEducationDynamicOptions();
  await refreshProfileSelector();
  await loadProfileIntoForm();
  initPhotoAndSignatureEditors();
});

