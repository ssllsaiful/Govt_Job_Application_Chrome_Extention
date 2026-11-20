/**
 * autofill-engine.js - Core Form Filling Engine for Teletalk Portals
 * 
 * Accurately detects and fills form fields across Bangladesh government recruitment
 * websites. Handles dependent dropdowns (District -> Upazila), document availability
 * toggles, dual English/Bangla names, GPA scales, and strict post-fill verification.
 * Never auto-submits, never bypasses CAPTCHA, and never overwrites existing values
 * unless explicitly requested.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./site-mappings'));
  } else {
    root.JobAutofillEngine = factory(root.SiteMappings);
  }
})(typeof self !== 'undefined' ? self : this, function (SiteMappings) {
  'use strict';

  /**
   * Helper delay utility.
   * @param {number} ms
   * @returns {Promise<void>}
   */
  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Normalizes strings for resilient label and option matching.
   * @param {string} str
   * @returns {string}
   */
  function norm(str) {
    if (!str) return '';
    return SiteMappings ? SiteMappings.normalize(str) : String(str).toLowerCase().trim();
  }

  /**
   * Robust date parser that handles:
   * - YYYY-MM-DD, YYYY/MM/DD
   * - DD-MM-YYYY, DD/MM/YYYY
   * - DD-MON-YYYY, DD Mon YYYY (e.g. 03-MAR-1998)
   * - Date objects and standard timestamp strings
   * @param {string|Date} rawDate
   * @returns {{ year: string, month: number, month2: string, day: number, day2: string, iso: string, dmyDash: string, dmySlash: string, dMonY: string }|null}
   */
  function parseDateComponents(rawDate) {
    if (!rawDate) return null;
    const s = String(rawDate).trim();
    if (!s) return null;

    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    let year = 0, month = 0, day = 0;

    // 1. Check DD-MON-YYYY or DD Mon YYYY (e.g. 03-MAR-1998)
    const monMatch = s.match(/^(\d{1,2})[-/\s]([A-Za-z]{3,9})[-/\s](\d{4})$/);
    if (monMatch) {
      day = parseInt(monMatch[1], 10);
      const monStr = monMatch[2].substring(0, 3).toUpperCase();
      const mIdx = monthNames.indexOf(monStr);
      if (mIdx !== -1) month = mIdx + 1;
      year = parseInt(monMatch[3], 10);
    }

    // 2. Check YYYY-MM-DD or YYYY/MM/DD
    if (!year) {
      const ymdMatch = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
      if (ymdMatch) {
        year = parseInt(ymdMatch[1], 10);
        month = parseInt(ymdMatch[2], 10);
        day = parseInt(ymdMatch[3], 10);
      }
    }

    // 3. Check DD-MM-YYYY or DD/MM/YYYY
    if (!year) {
      const dmyMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
      if (dmyMatch) {
        day = parseInt(dmyMatch[1], 10);
        month = parseInt(dmyMatch[2], 10);
        year = parseInt(dmyMatch[3], 10);
      }
    }

    // 4. Fallback: standard Date parsing
    if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        year = d.getFullYear();
        month = d.getMonth() + 1;
        day = d.getDate();
      }
    }

    if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) {
      return null;
    }

    const yStr = String(year);
    const m2 = String(month).padStart(2, '0');
    const d2 = String(day).padStart(2, '0');
    const monStr = monthNames[month - 1];

    return {
      year: yStr,
      month: month,
      month2: m2,
      day: day,
      day2: d2,
      iso: `${yStr}-${m2}-${d2}`,
      dmyDash: `${d2}-${m2}-${yStr}`,
      dmySlash: `${d2}/${m2}/${yStr}`,
      dMonY: `${d2}-${monStr}-${yStr}`
    };
  }

  /**
   * Sets Date of Birth safely on an HTML input element:
   * - Suppresses inline `this.showPicker()` onfocus handlers so the calendar overlay doesn't block the screen
   * - Correctly detects `<input type="date">` (requires YYYY-MM-DD) vs `<input type="text">` (e.g. DD-MON-YYYY or DD-MM-YYYY)
   * - Syncs jQuery UI / Bootstrap datepickers if active
   * - Syncs hidden helper fields like `#dob_value`
   * - Closes any accidental open datepicker popups
   * @param {HTMLInputElement} element
   * @param {string} rawDob
   * @returns {{ success: boolean, value: string }}
   */
  function setNativeDateValue(element, rawDob) {
    if (!element || !rawDob) return { success: false, value: '' };

    const parsed = parseDateComponents(rawDob);
    const isDateInput = element.type === 'date';

    let targetValue = parsed ? (isDateInput ? parsed.iso : parsed.dMonY) : String(rawDob);

    if (parsed && !isDateInput) {
      const pat = (typeof element.getAttribute === 'function' ? element.getAttribute('pattern') : '') || '';
      const ph = ((element.placeholder || '') + ' ' + pat).toLowerCase();
      if (ph.includes('yyyy-mm-dd') || ph.includes('yyyy/mm/dd')) {
        targetValue = parsed.iso;
      } else if (ph.includes('mon') || ph.includes('mmm') || ph.includes('dd-mon-yyyy')) {
        targetValue = parsed.dMonY;
      } else if (ph.includes('/')) {
        targetValue = parsed.dmySlash;
      } else if (ph.includes('dd-mm-yyyy') || ph.includes('dd--') || ph.includes('dd-') || ph.includes('dd-yy') || ph.includes('dd-mm')) {
        targetValue = parsed.dmyDash;
      } else {
        targetValue = parsed.dMonY;
      }
    }

    // 1. Temporarily suppress inline onfocus handlers (like onfocus="this.showPicker()")
    const savedOnfocus = element.onfocus;
    const savedOnfocusAttr = element.getAttribute('onfocus');
    try {
      element.onfocus = null;
      element.removeAttribute('onfocus');
    } catch (e) { }

    // 2. Set value using native prototype descriptor
    const proto = typeof HTMLInputElement !== 'undefined'
      ? HTMLInputElement.prototype
      : (element && Object.getPrototypeOf(element));
    const desc = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;

    if (desc && desc.set) {
      desc.set.call(element, targetValue);
    } else {
      element.value = targetValue;
    }

    // 3. Fallback for date input if targetValue wasn't accepted
    if (isDateInput && !element.value && parsed) {
      if (desc && desc.set) {
        desc.set.call(element, parsed.iso);
      } else {
        element.value = parsed.iso;
      }
    }

    // 4. If text input and jQuery UI / Bootstrap datepicker is attached
    if (!isDateInput && typeof window !== 'undefined' && typeof window.$ === 'function') {
      try {
        const $el = window.$(element);
        if (typeof $el.datepicker === 'function' && parsed) {
          $el.datepicker('setDate', new Date(parsed.year, parsed.month - 1, parsed.day));
          $el.datepicker('hide');
        }
      } catch (e) { }
    }

    // 5. Dispatch input and change events
    if (typeof Event !== 'undefined') {
      element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    }

    // 6. In jQuery environments, also trigger jQuery events
    if (typeof window !== 'undefined' && typeof window.$ === 'function') {
      try {
        window.$(element).trigger('input').trigger('change');
      } catch (e) { }
    }

    // 7. Sync hidden helper fields common on Teletalk (e.g. #dob_value)
    if (parsed && typeof document !== 'undefined') {
      try {
        const hiddenDob = document.getElementById('dob_value') || document.querySelector('input[name="dob_value"]');
        if (hiddenDob) {
          hiddenDob.value = parsed.iso;
          if (typeof Event !== 'undefined') {
            hiddenDob.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      } catch (e) { }
    }

    // 8. Restore onfocus handler after delay so manual user clicks still work
    setTimeout(() => {
      try {
        if (savedOnfocus) element.onfocus = savedOnfocus;
        else if (savedOnfocusAttr) element.setAttribute('onfocus', savedOnfocusAttr);
      } catch (e) { }
    }, 500);

    // 9. Explicitly blur and dismiss any datepicker overlays
    try {
      element.blur();
      if (typeof document !== 'undefined') {
        const uiPicker = document.getElementById('ui-datepicker-div');
        if (uiPicker) uiPicker.style.display = 'none';
      }
    } catch (e) { }

    const finalVal = element.value || targetValue;
    return {
      success: Boolean(finalVal),
      value: finalVal
    };
  }

  /**
   * Sets value on input or textarea elements using prototype setter
   * to ensure JavaScript event listeners detect the change.
   * @param {HTMLInputElement|HTMLTextAreaElement} element
   * @param {string} value
   */
  function setNativeInputValue(element, value) {
    if (!element) return;
    const cleanValue = value === undefined || value === null ? '' : String(value);

    // Use native prototype descriptor if available
    let proto = null;
    if (typeof HTMLTextAreaElement !== 'undefined' && element instanceof HTMLTextAreaElement) {
      proto = HTMLTextAreaElement.prototype;
    } else if (typeof HTMLInputElement !== 'undefined' && element instanceof HTMLInputElement) {
      proto = HTMLInputElement.prototype;
    } else if (element) {
      proto = Object.getPrototypeOf(element);
    }
    const desc = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;

    // CRITICAL: Do NOT focus date inputs or elements with showPicker onfocus,
    // as focusing them triggers browser/jQuery datepicker overlays to pop open.
    const hasPickerOnFocus = element.getAttribute && (
      (element.getAttribute('onfocus') || '').includes('showPicker') ||
      element.type === 'date'
    );

    if (!hasPickerOnFocus) {
      try { element.focus(); } catch (e) { }
    }

    if (desc && desc.set) {
      desc.set.call(element, cleanValue);
    } else {
      element.value = cleanValue;
    }

    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));
  }

  /**
   * Selects an option inside a <select> dropdown by matching value, text,
   * or known domain aliases (e.g. Religion, Gender, Quota, Board).
   * @param {HTMLSelectElement} selectEl
   * @param {string} targetValue
   * @param {string} [aliasCategory]
   * @param {string|number} [numericHint]
   * @returns {{ success: boolean, text: string, val: string }}
   */
  /**
   * Cleans an upazila name by removing administrative designations
   * like 'thana', 'upazila', 'p.s.', 'sadar' and normalizes portal typos (e.g. SABUJGHAG, SABUJBAGDH).
   * @param {string} str
   * @returns {string}
   */
  function cleanUpazilaName(str) {
    if (!str) return '';
    let s = norm(str)
      .replace(/\b(thana|upazila|upazilla|p\s*s|ps|sadar|\(sadar\))\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Map common portal typos / spelling variations
    // Notice: Teletalk government database has typos like SABUJGHAG, SABUJBAGDH, SABUJBHAG, SABUJBAG
    if (s.startsWith('sabuj') || s.startsWith('sobuj') || s.includes('ghag') || (s.includes('bhag') && s.includes('sab'))) {
      return 'sabujbag';
    }
    if (s.startsWith('shahbag') || s.startsWith('sahbag')) {
      return 'shahbag';
    }
    if (s.startsWith('motijh') || s.startsWith('matijh')) {
      return 'motijheel';
    }
    return s.replace(/h$/, ''); // strip trailing h
  }

  /**
   * Tokenizes and normalizes degrees/subjects for flexible overlap matching.
   * Strips parenthesized acronyms like (CSE), (EEE), (Honours), (Pass).
   * @param {string} str
   * @returns {string[]}
   */
  function tokenizeAcademic(str) {
    if (!str) return [];
    return norm(str)
      .replace(/\([^\)]*\)/g, ' ') // remove (cse), (eee), etc.
      .replace(/\band\b/g, '&')
      .replace(/[\/\-_,\.]/g, ' ')
      .split(/\s+/)
      .filter(t => t && t !== 'in' && t !== 'of' && t !== '&' && t !== 'and');
  }

  /**
   * Selects an option inside a <select> dropdown by matching value, text,
   * or known domain aliases (e.g. Religion, Gender, Quota, Board, Degree, Subject).
   * @param {HTMLSelectElement} selectEl
   * @param {string} targetValue
   * @param {string} [aliasCategory]
   * @param {string|number} [numericHint]
   * @returns {{ success: boolean, text: string, val: string }}
   */
  function setNativeSelectValue(selectEl, targetValue, aliasCategory, numericHint) {
    if (!selectEl || !targetValue) return { success: false, text: '', val: '' };
    const targetNorm = norm(targetValue);
    const options = Array.from(selectEl.options);
    if (!options.length) return { success: false, text: '', val: '' };

    // 1. Direct exact match on text or value
    for (const opt of options) {
      if (norm(opt.textContent) === targetNorm || norm(opt.value) === targetNorm) {
        return applySelectOption(selectEl, opt);
      }
    }

    // 2. Domain alias lookup
    if (aliasCategory && SiteMappings && SiteMappings.DROPDOWN_ALIASES[aliasCategory]) {
      const aliasDict = SiteMappings.DROPDOWN_ALIASES[aliasCategory];
      // Find the canonical key matching our target
      let matchedCanonicalKey = null;
      for (const [canonKey, aliasList] of Object.entries(aliasDict)) {
        if (norm(canonKey) === targetNorm || aliasList.some(a => norm(a) === targetNorm)) {
          matchedCanonicalKey = canonKey;
          break;
        }
      }

      // If no direct canonical match, try finding by token overlap in aliases
      if (!matchedCanonicalKey && (aliasCategory === 'degree' || aliasCategory === 'subject' || aliasCategory === 'group')) {
        const targetTokens = tokenizeAcademic(targetValue);
        for (const [canonKey, aliasList] of Object.entries(aliasDict)) {
          const canonTokens = tokenizeAcademic(canonKey);
          if (targetTokens.length >= 2 && canonTokens.length >= 2) {
            const matchesAll = canonTokens.every(ct => targetTokens.includes(ct));
            if (matchesAll) {
              matchedCanonicalKey = canonKey;
              break;
            }
          }
        }
      }

      if (matchedCanonicalKey) {
        const allowedAliases = [matchedCanonicalKey, ...(aliasDict[matchedCanonicalKey] || [])].map(norm);
        // Look for an option that matches any allowed alias
        for (const opt of options) {
          const optText = norm(opt.textContent);
          const optVal = norm(opt.value);
          if (allowedAliases.includes(optText) || allowedAliases.includes(optVal)) {
            return applySelectOption(selectEl, opt);
          }
        }
      }
    }

    // 3. Special handling: Upazila / Police Station normalized matching
    const isUpazilaSelect = aliasCategory === 'upazila' || selectEl.name?.includes('upazila') || selectEl.name?.includes('thana') || selectEl.name?.includes('ps') || selectEl.id?.includes('upazila') || selectEl.id?.includes('thana');
    if (isUpazilaSelect) {
      const targetClean = cleanUpazilaName(targetValue);
      // Try exact clean match
      for (const opt of options) {
        const optClean = cleanUpazilaName(opt.textContent);
        if (optClean && (optClean === targetClean || optClean.includes(targetClean) || targetClean.includes(optClean))) {
          return applySelectOption(selectEl, opt);
        }
      }
      // If starts with same 5 characters (e.g. 'sabuj' matching 'sabujghag' or 'sabujbagdh')
      if (targetClean.length >= 5) {
        const prefix5 = targetClean.slice(0, 5);
        for (const opt of options) {
          const optClean = cleanUpazilaName(opt.textContent);
          if (optClean && optClean.startsWith(prefix5)) {
            return applySelectOption(selectEl, opt);
          }
        }
      }
      // Airport <=> Bimanbandar variation
      if (targetClean.includes('airport') || targetClean.includes('biman')) {
        const airOpt = options.find(o => norm(o.textContent).includes('airport') || norm(o.textContent).includes('biman'));
        if (airOpt) return applySelectOption(selectEl, airOpt);
      }
    }

    // 4. Special handling: GPA scale disambiguation (e.g. "GPA(out of 5)" vs "GPA(out of 4)" vs "CGPA")
    if (targetNorm.includes('gpa') || targetNorm.includes('cgpa') || targetNorm.includes('scale') || targetNorm.includes('out of')) {
      const gpaCandidates = options.filter(opt => {
        const t = norm(opt.textContent);
        return t.includes('gpa') || t.includes('cgpa') || t.includes('grade');
      });

      if (gpaCandidates.length > 0) {
        const wants5 = targetNorm.includes('5') || (numericHint && parseFloat(numericHint) > 4.0);
        const preferred = gpaCandidates.find(opt => {
          const t = norm(opt.textContent);
          return wants5 ? (t.includes('5') || t.includes('scale 5')) : (t.includes('4') || t.includes('cgpa'));
        });
        if (preferred) {
          return applySelectOption(selectEl, preferred);
        }
        return applySelectOption(selectEl, gpaCandidates[0]);
      }
    }

    // 5. Academic Degree & Subject token-overlap matching
    const isAcademic = aliasCategory === 'degree' || aliasCategory === 'subject' || aliasCategory === 'group' || selectEl.name?.includes('exam') || selectEl.name?.includes('subject');
    if (isAcademic) {
      const targetTokens = tokenizeAcademic(targetValue);
      if (targetTokens.length > 0) {
        let bestOpt = null;
        let maxOverlap = 0;
        for (const opt of options) {
          const optText = norm(opt.textContent);
          if (optText === 'select' || optText === 'choose' || !opt.value) continue;
          const optTokens = tokenizeAcademic(opt.textContent);
          const overlap = optTokens.filter(t => targetTokens.includes(t)).length;
          if (overlap > maxOverlap && overlap >= 2) {
            maxOverlap = overlap;
            bestOpt = opt;
          }
        }
        if (bestOpt) {
          return applySelectOption(selectEl, bestOpt);
        }
      }
    }

    // 6. Substring / partial match fallback (excluding generic placeholders like "Select" or "Choose")
    for (const opt of options) {
      const optText = norm(opt.textContent);
      if (optText === 'select' || optText === 'choose' || optText === 'select one' || !opt.value) continue;
      if (optText.includes(targetNorm) || targetNorm.includes(optText)) {
        return applySelectOption(selectEl, opt);
      }
    }

    return { success: false, text: '', val: '' };
  }

  function applySelectOption(selectEl, option) {
    selectEl.value = option.value;
    try {
      Array.from(selectEl.options).forEach(o => { o.selected = (o === option); });
      option.selected = true;
    } catch (e) { }

    selectEl.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    selectEl.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

    // Safely invoke inline onchange if defined on element
    if (typeof selectEl.onchange === 'function') {
      try { selectEl.onchange(); } catch (e) { }
    }

    // In jQuery environments, also trigger jQuery events
    if (typeof window !== 'undefined' && typeof window.$ === 'function') {
      try {
        window.$(selectEl).trigger('input').trigger('change');
      } catch (e) { }
    }

    return { success: true, text: option.textContent.trim(), val: option.value };
  }

  /**
   * Sets checkbox checked state and dispatches change event.
   * @param {HTMLInputElement} checkboxEl
   * @param {boolean} checked
   * @returns {boolean}
   */
  function setNativeCheckboxValue(checkboxEl, checked) {
    if (!checkboxEl || checkboxEl.type !== 'checkbox') return false;
    if (checkboxEl.checked !== checked) {
      checkboxEl.checked = checked;
      checkboxEl.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      checkboxEl.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      checkboxEl.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
    }
    return true;
  }

  /**
   * Label keywords mapping for resilient DOM discovery when explicit IDs or names vary.
   */
  const LABEL_KEYWORD_MAP = {
    fullName: ["applicant's name", "applicant name", "name of applicant"],
    fullNameBn: ["আবেদনকারীর নাম (বাংলায়)", "নাম (বাংলায়)", "আবেদনকারীর নাম", "applicant name (bangla)"],
    fatherName: ["father's name", "father name", "পিতার নাম (ইংরেজি)"],
    fatherNameBn: ["পিতার নাম (বাংলায়)", "পিতার নাম"],
    motherName: ["mother's name", "mother name", "মাতার নাম (ইংরেজি)"],
    motherNameBn: ["মাতার নাম (বাংলায়)", "মাতার নাম"],
    dob: ["date of birth", "জন্ম তারিখ", "birth date", "dob"],
    dobDay: ["day", "দিন", "birth day"],
    dobMonth: ["month", "মাস", "birth month"],
    dobYear: ["year", "বছর", "birth year"],
    nationality: ["nationality", "জাতীয়তা"],
    religion: ["religion", "ধর্ম"],
    gender: ["gender", "লিঙ্গ", "sex"],
    nidAvailable: ["national id", "জাতীয় পরিচয়পত্র"],
    nidNumber: ["national id no", "nid no", "national id number", "nid number", "জাতীয় পরিচয়পত্র নম্বর"],
    birthRegAvailable: ["birth registration", "জন্ম নিবন্ধন"],
    birthRegNumber: ["birth registration no", "birth reg no", "breg no", "জন্ম নিবন্ধন নম্বর"],
    passportAvailable: ["passport id", "passport", "পাসপোর্ট"],
    passportNumber: ["passport no", "passport number", "পাসপোর্ট নম্বর"],
    maritalStatus: ["marital status", "বৈবাহিক অবস্থা"],
    spouseName: ["spouse name", "স্বামী/স্ত্রীর নাম"],
    mobile: ["mobile number", "mobile", "মোবাইল নম্বর"],
    confirmMobile: ["confirm mobile", "মোবাইল নম্বর নিশ্চিত"],
    email: ["email", "e-mail", "ইমেইল"],
    quota: ["quota", "কোটা"],
    departmentalStatus: ["departmental status", "বিভাগীয় প্রার্থী"],
    presentCareOf: ["care of", "প্রযন্তে"],
    presentVillage: ["village/ road/ house/ flat", "village", "গ্রাম/রাস্তা/বাসা/হোল্ডিং"],
    presentDistrict: ["district", "জেলা"],
    presentUpazila: ["upazila/p.s.", "upazila", "thana", "উপজেলা", "থানা"],
    presentPostOffice: ["post office", "ডাকঘর"],
    presentPostCode: ["post code", "পোস্ট কোড"],
    sameAsPresentCheckbox: ["same as present", "বর্তমান ঠিকানার অনুরূপ"],
    permanentCareOf: ["care of", "প্রযন্তে"],
    permanentVillage: ["village/ road/ house/ flat", "village", "গ্রাম/রাস্তা/বাসা/হোল্ডিং"],
    permanentDistrict: ["district", "জেলা"],
    permanentUpazila: ["upazila/p.s.", "upazila", "thana", "উপজেলা", "থানা"],
    permanentPostOffice: ["post office", "ডাকঘর"],
    permanentPostCode: ["post code", "পোস্ট কোড"],
    computerProficiency: [
      "computer proficiency",
      "computer literacy",
      "computer knowledge",
      "do you have computer proficiency",
      "do you have computer",
      "computer operation",
      "কম্পিউটার দক্ষতা",
      "কম্পিউটার"
    ],
    computerTypingSpeed: [
      "computer typing",
      "typing speed",
      "typing",
      "টাইপিং"
    ],
    drivingLicense: [
      "driving license",
      "driving licence",
      "ড্রাইভিং লাইসেন্স"
    ]
  };

  /**
   * Finds a form element on the page using explicit site selectors,
   * name/id fallbacks, and associated label heuristics.
   * @param {string} fieldKey
   * @param {Object} mapping
   * @param {Document|HTMLElement} [rootNode=document]
   * @returns {HTMLElement|null}
   */
  function findElement(fieldKey, mapping, rootNode = document) {
    const selectors = (mapping && mapping.selectors && mapping.selectors[fieldKey]) || [];

    // 1. Try explicit selectors first
    for (const sel of selectors) {
      try {
        const found = rootNode.querySelector(sel);
        if (found) return found;
      } catch (e) {
        // Ignore invalid selector syntax
      }
    }

    // 2. Name or ID variations
    const camelToSnake = fieldKey.replace(/([A-Z])/g, '_$1').toLowerCase();
    const commonPatterns = [
      `[name="${fieldKey}"]`,
      `[id="${fieldKey}"]`,
      `[name="${camelToSnake}"]`,
      `[id="${camelToSnake}"]`
    ];

    for (const pat of commonPatterns) {
      try {
        const el = rootNode.querySelector(pat);
        if (el) return el;
      } catch (e) { }
    }

    // 3. Label-based heuristic matching via table rows or label tags
    const keywords = LABEL_KEYWORD_MAP[fieldKey];
    if (keywords && keywords.length && rootNode.querySelectorAll) {
      const isBnField = fieldKey.endsWith('Bn');
      const isPermField = fieldKey.startsWith('permanent');
      const isPresField = fieldKey.startsWith('present');

      const rows = rootNode.querySelectorAll('tr');
      for (const row of rows) {
        // Enforce Present vs Permanent table row scoping
        const isPermTable = Boolean(row.closest('#table-permanent') || row.closest('[id*="permanent"]'));
        if (isPermField && !isPermTable) continue;
        if (isPresField && isPermTable) continue;

        const cells = row.querySelectorAll('td, th');
        if (cells.length < 2) continue;

        const labelText = norm(cells[0].textContent);
        const hasBanglaWord = labelText.includes('bangla') || labelText.includes('বাংলা') || labelText.includes('বাংলায়');

        if (isBnField && !hasBanglaWord) continue;
        if (!isBnField && (fieldKey === 'fullName' || fieldKey === 'fatherName' || fieldKey === 'motherName') && hasBanglaWord) continue;

        const matchesKeyword = keywords.some(kw => labelText.includes(norm(kw)));
        if (matchesKeyword) {
          const target = row.querySelector('input:not([type="hidden"]), select, textarea');
          if (target) return target;
        }
      }
    }

    // 4. Result marks sibling / parent cell fallback (for GPA/CGPA inputs positioned next to Result dropdowns)
    if (fieldKey.includes('ResultMarks')) {
      const typeKey = fieldKey.replace('Marks', 'Type');
      const typeEl = findElement(typeKey, mapping, rootNode);
      if (typeEl) {
        const container = typeEl.closest('td') || typeEl.parentElement;
        if (container) {
          const input = container.querySelector('input:not([type="hidden"])');
          if (input) return input;
        }
      }
    }

    // 5. Heuristic for Other Qualifications / Experience questions like "Do you have Computer proficiency?"
    if (fieldKey === 'computerProficiency') {
      const selects = Array.from(rootNode.querySelectorAll ? rootNode.querySelectorAll('select') : []);
      for (const sel of selects) {
        // Direct name / id check
        const sName = norm(sel.name || '');
        const sId = norm(sel.id || '');
        if (sName.includes('computer') || sId.includes('computer') || sName.includes('comp') || sId.includes('comp')) {
          return sel;
        }

        // Check if options are Yes/No
        const optTexts = Array.from(sel.options || []).map(o => norm(o.textContent || o.value || ''));
        const hasYes = optTexts.some(t => t === 'yes' || t === 'y' || t === '1' || t === 'applicable');
        const hasNo = optTexts.some(t => t === 'no' || t === 'n' || t === '0' || t === '2');
        if (!hasYes || !hasNo) continue;

        // Traverse surrounding context (parent elements, previous siblings, table rows)
        let curr = sel;
        for (let level = 0; level < 4; level++) {
          if (!curr || curr === rootNode) break;
          const prevText = norm(curr.previousElementSibling ? curr.previousElementSibling.textContent : '');
          const currText = norm(curr.textContent || '');
          const parentText = norm(curr.parentElement ? curr.parentElement.textContent : '');
          if (
            prevText.includes('computer') ||
            currText.includes('computer') ||
            parentText.includes('computer')
          ) {
            return sel;
          }
          curr = curr.parentElement;
        }
      }

      // Also scan text elements for "Computer proficiency"
      const allEls = Array.from(rootNode.querySelectorAll ? rootNode.querySelectorAll('td, th, label, div, p, span, legend, b, strong') : []);
      for (const tEl of allEls) {
        const txt = norm(tEl.textContent || '');
        if (txt.includes('computer') && (txt.includes('proficiency') || txt.includes('literacy') || txt.includes('knowledge') || txt.includes('experience') || txt.includes('operation'))) {
          const rowOrContainer = (tEl.closest && (tEl.closest('tr') || tEl.closest('.form-group') || tEl.closest('fieldset'))) || tEl.parentElement;
          if (rowOrContainer) {
            const foundSel = rowOrContainer.querySelector('select');
            if (foundSel) return foundSel;
          }
          if (tEl.nextElementSibling) {
            const siblingSel = tEl.nextElementSibling.tagName === 'SELECT' ? tEl.nextElementSibling : tEl.nextElementSibling.querySelector('select');
            if (siblingSel) return siblingSel;
          }
        }
      }
    }

    return null;
  }

  /**
   * Waits for dependent dropdown options to populate (e.g. Upazila list after District change).
   * Supports targetHint to exit immediately as soon as the desired option is ready.
   * @param {HTMLSelectElement} selectEl
   * @param {number} maxWaitMs
   * @param {string} [targetHint]
   * @returns {Promise<boolean>}
   */
  async function waitForDropdownOptions(selectEl, maxWaitMs = 3500, targetHint = '') {
    if (!selectEl) return false;
    const start = Date.now();
    const initialCount = selectEl.options.length;
    const targetNorm = targetHint ? norm(targetHint) : '';

    while (Date.now() - start < maxWaitMs) {
      await wait(100);
      const currentCount = selectEl.options.length;
      if (currentCount > 1) {
        // If we have a target hint, check if it or any meaningful option is present
        if (targetNorm) {
          const cleanTarget = cleanUpazilaName(targetHint);
          const hasTarget = Array.from(selectEl.options).some(opt => {
            const t = norm(opt.textContent);
            const v = norm(opt.value);
            const cleanOpt = cleanUpazilaName(opt.textContent);
            return (
              (t && t !== 'select' && (t.includes(targetNorm) || targetNorm.includes(t) || v === targetNorm)) ||
              (cleanTarget && cleanOpt && cleanTarget === cleanOpt)
            );
          });
          if (hasTarget) return true;
        }
        // If option count changed from initial (e.g. was 1, now populated with options)
        if (currentCount !== initialCount) {
          await wait(150);
          return true;
        }
      }
    }
    return selectEl.options.length > 1;
  }

  /**
   * Scans the active DOM for the question:
   * "Do you have Computer proficiency?" (and variants like "computer proficiency", "কম্পিউটার দক্ষতা")
   * If detected on the page, sets the dropdown to desired value (default "Yes").
   * @param {Document|HTMLElement} [rootNode=document]
   * @param {string} [desiredValue='Yes']
   * @returns {{ success: boolean, value?: string, element?: HTMLElement }}
   */
  function autoFillComputerProficiency(rootNode = (typeof document !== 'undefined' ? document : null), desiredValue = 'Yes') {
    if (!rootNode || !rootNode.querySelectorAll) return { success: false };

    // 1. Check direct candidates and all selects
    const directCandidates = Array.from(rootNode.querySelectorAll(
      '#otherExpSection select, select.exp_value, select[name*="other_exp"], select[name*="computer"], #computer_exp, #computer_proficiency, #computer'
    ));
    const allSelects = Array.from(rootNode.querySelectorAll('select'));
    const selects = Array.from(new Set([...directCandidates, ...allSelects]));

    const targetNorm = norm(desiredValue || 'Yes');
    const isTargetYes = targetNorm === 'yes' || targetNorm === 'y' || targetNorm === '1' || targetNorm === 'হ্যাঁ';

    for (const sel of selects) {
      let container = sel;
      let contextText = (sel.name || '') + ' ' + (sel.id || '');
      for (let i = 0; i < 5; i++) {
        if (!container || container === rootNode) break;
        contextText += ' ' + (container.textContent || '');
        if (container.previousElementSibling) {
          contextText += ' ' + (container.previousElementSibling.textContent || '');
        }
        container = container.parentElement;
      }

      const normContext = norm(contextText);
      const isComputerQuestion = (
        normContext.includes('computer proficiency') ||
        (normContext.includes('computer') && (normContext.includes('proficiency') || normContext.includes('literacy') || normContext.includes('knowledge') || normContext.includes('experience') || normContext.includes('operation'))) ||
        normContext.includes('কম্পিউটার দক্ষতা') ||
        normContext.includes('কম্পিউটার')
      );

      if (isComputerQuestion) {
        const options = Array.from(sel.options);
        const matchOpt = options.find(opt => {
          const t = norm(opt.textContent);
          const v = norm(opt.value);
          if (isTargetYes) {
            return t === 'yes' || t === 'y' || t === '1' || t === 'হ্যাঁ' || v === 'yes' || v === 'y' || v === '1';
          } else {
            return t === 'no' || t === 'n' || t === '0' || t === 'না' || v === 'no' || v === 'n' || v === '0';
          }
        }) || options.find(opt => norm(opt.textContent) === 'yes' || norm(opt.value) === 'yes');

        if (matchOpt) {
          applySelectOption(sel, matchOpt);
          return { success: true, element: sel, value: matchOpt.textContent.trim() };
        }
      }
    }

    // 2. Also check if answered via radio buttons (e.g. <input type="radio" value="Yes">)
    const radios = Array.from(rootNode.querySelectorAll('input[type="radio"]'));
    for (const r of radios) {
      const parentRow = (r.closest && r.closest('tr')) || r.parentElement;
      const context = norm(parentRow ? parentRow.textContent : '');
      if (context.includes('computer') && (context.includes('proficiency') || context.includes('literacy'))) {
        const val = norm(r.value);
        if (isTargetYes && (val === 'yes' || val === 'y' || val === '1')) {
          r.checked = true;
          r.dispatchEvent(new Event('input', { bubbles: true }));
          r.dispatchEvent(new Event('change', { bubbles: true }));
          r.dispatchEvent(new Event('click', { bubbles: true }));
          return { success: true, element: r, value: 'Yes' };
        } else if (!isTargetYes && (val === 'no' || val === 'n' || val === '0')) {
          r.checked = true;
          r.dispatchEvent(new Event('input', { bubbles: true }));
          r.dispatchEvent(new Event('change', { bubbles: true }));
          r.dispatchEvent(new Event('click', { bubbles: true }));
          return { success: true, element: r, value: 'No' };
        }
      }
    }

    return { success: false };
  }

  /**
   * Converts a base64 DataURL string into an HTML5 File object for file input injection.
   * @param {string} dataUrl
   * @param {string} filename
   * @returns {File|null}
   */
  function dataURLtoFile(dataUrl, filename) {
    if (!dataUrl || typeof dataUrl !== 'string') return null;
    try {
      const parts = dataUrl.split(',');
      if (parts.length < 2) return null;
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const binaryStr = atob(parts[1]);
      const len = binaryStr.length;
      const u8arr = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        u8arr[i] = binaryStr.charCodeAt(i);
      }
      return new File([u8arr], filename, { type: mime, lastModified: Date.now() });
    } catch (err) {
      console.warn('dataURLtoFile failed:', err);
      return null;
    }
  }

  /**
   * Attaches an HTML5 File object to an <input type="file"> element using DataTransfer
   * and triggers the required DOM events for Teletalk validation.
   * @param {HTMLInputElement} fileInput
   * @param {File} file
   * @returns {boolean}
   */
  function attachFileToInput(fileInput, file) {
    if (!fileInput || !file) return false;
    try {
      if (typeof DataTransfer !== 'undefined') {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
      }

      fileInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      fileInput.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

      if (typeof fileInput.onchange === 'function') {
        try { fileInput.onchange(); } catch (e) { }
      }

      if (typeof window !== 'undefined' && typeof window.$ === 'function') {
        try {
          window.$(fileInput).trigger('input').trigger('change');
        } catch (e) { }
      }
      return true;
    } catch (err) {
      console.warn('attachFileToInput error:', err);
      return false;
    }
  }

  /**
   * Scans the document for photo and signature file inputs.
   * Teletalk typically labels them "Upload/Change Photo" and "Upload/Change Signature",
   * or has inputs named photo/picture and signature/sign.
   * @param {Document|HTMLElement} [rootNode=document]
   * @returns {{ photoInput: HTMLInputElement|null, signatureInput: HTMLInputElement|null }}
   */
  function findPhotoAndSignatureInputs(rootNode = (typeof document !== 'undefined' ? document : null)) {
    if (!rootNode || !rootNode.querySelectorAll) return { photoInput: null, signatureInput: null };

    const fileInputs = Array.from(rootNode.querySelectorAll('input[type="file"]'));
    let photoInput = null;
    let signatureInput = null;

    for (const input of fileInputs) {
      const id = (input.id || '').toLowerCase();
      const name = (input.name || '').toLowerCase();
      const parentRow = input.closest('tr, .form-group, div') || input.parentElement;
      const contextText = (parentRow ? parentRow.textContent : '').toLowerCase();

      const isPhoto = (
        id.includes('photo') || id.includes('picture') || id.includes('image') ||
        name.includes('photo') || name.includes('picture') || name.includes('image') ||
        contextText.includes('photo') || contextText.includes('ছবি')
      );

      const isSign = (
        id.includes('sign') || name.includes('sign') ||
        contextText.includes('signature') || contextText.includes('sign') || contextText.includes('স্বাক্ষর')
      );

      if (isPhoto && !photoInput) {
        photoInput = input;
      } else if (isSign && !signatureInput) {
        signatureInput = input;
      }
    }

    // Positional fallback: 1st file input is photo, 2nd is signature
    if (!photoInput && fileInputs.length > 0) {
      photoInput = fileInputs[0];
    }
    if (!signatureInput && fileInputs.length > 1) {
      signatureInput = fileInputs[1];
    }

    return { photoInput, signatureInput };
  }

  /**
   * Updates preview <img> tags on Teletalk preview.php so the candidate
   * immediately sees their uploaded 300x300 photo and 300x80 signature.
   * @param {Document|HTMLElement} [rootNode=document]
   * @param {string} [photoUrl]
   * @param {string} [sigUrl]
   */
  function updatePreviewImages(rootNode = (typeof document !== 'undefined' ? document : null), photoUrl = '', sigUrl = '') {
    if (!rootNode || !rootNode.querySelectorAll) return;
    const images = Array.from(rootNode.querySelectorAll('img'));
    for (const img of images) {
      const alt = (img.alt || '').toLowerCase();
      const id = (img.id || '').toLowerCase();
      const name = (img.name || '').toLowerCase();
      const src = (img.src || '').toLowerCase();
      const parentText = (img.parentElement ? img.parentElement.textContent : '').toLowerCase();

      if (photoUrl && (alt.includes('photo') || id.includes('photo') || name.includes('photo') || parentText.includes('photo') || src.includes('photo') || src.includes('blank'))) {
        try {
          img.src = photoUrl;
          img.style.display = 'inline-block';
        } catch (e) { }
      }
      if (sigUrl && (alt.includes('sign') || id.includes('sign') || name.includes('sign') || parentText.includes('sign') || src.includes('sign'))) {
        try {
          img.src = sigUrl;
          img.style.display = 'inline-block';
        } catch (e) { }
      }
    }
  }

  /**
   * Toggles the declaration checkbox on the final preview page.
   * E.g. "I declare that the information provided in this form are correct, true and complete..."
   * @param {Document|HTMLElement} [rootNode=document]
   * @returns {boolean}
   */
  function autoCheckDeclaration(rootNode = (typeof document !== 'undefined' ? document : null)) {
    if (!rootNode || !rootNode.querySelectorAll) return false;
    const checkboxes = Array.from(rootNode.querySelectorAll('input[type="checkbox"]'));
    for (const cb of checkboxes) {
      const parentRow = cb.closest('tr, .form-group, div') || cb.parentElement;
      const text = (parentRow ? parentRow.textContent : '').toLowerCase();
      if (
        text.includes('declare') ||
        text.includes('declaration') ||
        text.includes('information provided') ||
        text.includes('knowledge and belief') ||
        text.includes('সঠিক') ||
        cb.name === 'info_yes' ||
        cb.id === 'declaration' ||
        cb.name === 'declaration'
      ) {
        if (!cb.checked) {
          cb.checked = true;
          cb.dispatchEvent(new Event('input', { bubbles: true }));
          cb.dispatchEvent(new Event('change', { bubbles: true }));
          cb.dispatchEvent(new Event('click', { bubbles: true }));
        }
        return true;
      }
    }
    if (checkboxes.length === 1 && !checkboxes[0].checked) {
      checkboxes[0].checked = true;
      checkboxes[0].dispatchEvent(new Event('input', { bubbles: true }));
      checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));
      checkboxes[0].dispatchEvent(new Event('click', { bubbles: true }));
      return true;
    }
    return false;
  }

  /**
   * Executes the full autofill routine on the active page.
   * @param {Object} profile Full user profile object
   * @param {Object} [customSettings] Optional settings overrides
   * @returns {Promise<{ success: boolean, filled: Array, skipped: Array, review: Array }>}
   */
  async function runAutofill(profile, customSettings = {}) {
    const report = {
      filled: [],
      skipped: [],
      review: []
    };

    if (!profile) {
      report.review.push({ field: 'profile', reason: 'No profile data provided.' });
      return { success: false, ...report };
    }

    const settings = Object.assign(
      { overwriteExisting: false, dependentDropdownDelayMs: 450, enableAutofill: true },
      profile.settings || {},
      customSettings
    );

    if (!settings.enableAutofill) {
      report.review.push({ field: 'settings', reason: 'Autofill is disabled in settings.' });
      return { success: false, ...report };
    }

    const currentUrl = window.location.href;
    const mapping = SiteMappings ? SiteMappings.getMappingForUrl(currentUrl) : null;
    const delayMs = settings.dependentDropdownDelayMs || 450;

    /**
     * Internal helper to process a single text/date/select field.
     * Evaluates whether the active form requires this field.
     */
    async function processField({
      key,
      label,
      value,
      type = 'text',
      aliasCategory = null,
      numericHint = null,
      allowEmpty = false
    }) {
      const el = findElement(key, mapping);
      if (!el) {
        // Active form does NOT have this field (e.g. form for Office Sohayok has no Graduation/Masters).
        // It is not required for this circular. Skip cleanly with zero review warnings!
        return;
      }

      // If this is a ResultMarks / GPA field, ensure it is enabled and unhidden in case the portal's script toggled it
      if (key.includes('ResultMarks')) {
        if (el.disabled) el.disabled = false;
        if (el.readOnly) el.readOnly = false;
        if (el.style.display === 'none') el.style.display = 'inline-block';
        if (el.hidden) el.hidden = false;
        const parentBox = el.closest('div');
        if (parentBox && parentBox.style && parentBox.style.display === 'none') {
          parentBox.style.display = 'block';
        }
      }

      if (el.disabled || el.readOnly) {
        report.skipped.push({ field: key, label, reason: 'Field is disabled or read-only on this form.' });
        return;
      }

      // Check if field is present on form but missing from profile
      const hasValue = value !== undefined && value !== null && String(value).trim() !== '';
      if (!hasValue && !allowEmpty) {
        report.review.push({
          field: key,
          label,
          reason: 'This field is on the form, but empty in your saved profile.'
        });
        return;
      }

      // Check if element already has a value and overwriteExisting is false
      const currentValue = (el.value || '').trim();
      const currentOptText = norm(el.options && el.selectedIndex >= 0 ? el.options[el.selectedIndex]?.textContent : '');
      const isSelectPlaceholder = el.tagName === 'SELECT' && (
        !currentValue ||
        currentValue === '0' ||
        currentValue === '-1' ||
        currentValue.toLowerCase() === 'select' ||
        currentValue.toLowerCase() === 'none' ||
        currentOptText.includes('select') ||
        currentOptText.includes('choose') ||
        currentOptText === ''
      );

      if (currentValue && !isSelectPlaceholder && !settings.overwriteExisting) {
        report.skipped.push({
          field: key,
          label,
          currentValue,
          reason: 'Field already populated (overwrite disabled).'
        });
        return;
      }

      if (el.tagName === 'SELECT') {
        const res = setNativeSelectValue(el, value, aliasCategory, numericHint);
        if (res.success) {
          report.filled.push({ field: key, label, value: res.text || res.val });
        } else {
          report.review.push({
            field: key,
            label,
            desiredValue: value,
            reason: `Could not match "${value}" among dropdown options.`
          });
        }
      } else if (el.type === 'checkbox') {
        setNativeCheckboxValue(el, Boolean(value));
        report.filled.push({ field: key, label, value: Boolean(value) });
      } else {
        setNativeInputValue(el, value);
        // Post-verification check
        if (el.value === String(value)) {
          report.filled.push({ field: key, label, value: el.value });
        } else {
          report.review.push({
            field: key,
            label,
            reason: 'Value verification mismatch after setting input.'
          });
        }
      }
    }

    /* -------------------------------------------------------------
       STEP 1: DOCUMENT AVAILABILITY TOGGLES
       ------------------------------------------------------------- */
    const p = profile.personal || {};

    // National ID status dropdown
    await processField({
      key: 'nidAvailable',
      label: 'National ID Availability',
      value: p.nidAvailable,
      type: 'select',
      aliasCategory: 'yesNo'
    });

    // Birth Registration status dropdown
    await processField({
      key: 'birthRegAvailable',
      label: 'Birth Registration Availability',
      value: p.birthRegAvailable,
      type: 'select',
      aliasCategory: 'yesNo'
    });

    // Passport status dropdown
    await processField({
      key: 'passportAvailable',
      label: 'Passport Availability',
      value: p.passportAvailable,
      type: 'select',
      aliasCategory: 'yesNo'
    });

    // Wait short interval for revealed fields
    await wait(250);

    /* -------------------------------------------------------------
       STEP 2: PERSONAL INFORMATION
       ------------------------------------------------------------- */
    await processField({ key: 'fullName', label: "Applicant's Name (English)", value: p.fullName });
    await processField({ key: 'fullNameBn', label: "Applicant's Name (Bangla)", value: p.fullNameBn });
    await processField({ key: 'fatherName', label: "Father's Name (English)", value: p.fatherName });
    await processField({ key: 'fatherNameBn', label: "Father's Name (Bangla)", value: p.fatherNameBn });
    await processField({ key: 'motherName', label: "Mother's Name (English)", value: p.motherName });
    await processField({ key: 'motherNameBn', label: "Mother's Name (Bangla)", value: p.motherNameBn });

    // Date of Birth: support single date input AND split selects (Day / Month / Year)
    const dobSingle = findElement('dob', mapping);
    const dayEl = findElement('dobDay', mapping);
    const monthEl = findElement('dobMonth', mapping);
    const yearEl = findElement('dobYear', mapping);
    const hasDobOnForm = Boolean(dobSingle || dayEl || monthEl || yearEl);

    if (hasDobOnForm) {
      if (!p.dob) {
        report.review.push({ field: 'dob', label: 'Date of Birth', reason: 'This field is on the form, but empty in your saved profile.' });
      } else {
        const parsedDob = parseDateComponents(p.dob);
        if (dobSingle) {
          if (dobSingle.disabled || dobSingle.readOnly) {
            report.skipped.push({ field: 'dob', label: 'Date of Birth', reason: 'Field is disabled or read-only.' });
          } else {
            const res = setNativeDateValue(dobSingle, p.dob);
            if (res.success) {
              report.filled.push({ field: 'dob', label: 'Date of Birth', value: res.value });
            } else {
              report.review.push({ field: 'dob', label: 'Date of Birth', reason: 'Failed to set date of birth on single input.' });
            }
          }
        }

        // Check for split dropdowns (Day / Month / Year) whether single input existed or not
        if (parsedDob && (dayEl || monthEl || yearEl)) {
          if (dayEl && (!dobSingle || dayEl.offsetParent !== null)) {
            let resDay = setNativeSelectValue(dayEl, parsedDob.day2);
            if (!resDay.success) resDay = setNativeSelectValue(dayEl, String(parsedDob.day));
            if (resDay.success) report.filled.push({ field: 'dobDay', label: 'DOB Day', value: resDay.text || resDay.val });
          }
          if (monthEl && (!dobSingle || monthEl.offsetParent !== null)) {
            let resMonth = setNativeSelectValue(monthEl, parsedDob.month2);
            if (!resMonth.success) resMonth = setNativeSelectValue(monthEl, String(parsedDob.month));
            if (!resMonth.success) resMonth = setNativeSelectValue(monthEl, parsedDob.dMonY.split('-')[1]);
            if (resMonth.success) report.filled.push({ field: 'dobMonth', label: 'DOB Month', value: resMonth.text || resMonth.val });
          }
          if (yearEl && (!dobSingle || yearEl.offsetParent !== null)) {
            let resYear = setNativeSelectValue(yearEl, parsedDob.year);
            if (resYear.success) report.filled.push({ field: 'dobYear', label: 'DOB Year', value: resYear.text || resYear.val });
          }
        }
      }
    }

    await processField({ key: 'nationality', label: 'Nationality', value: p.nationality || 'Bangladeshi', aliasCategory: 'nationality' });
    await processField({ key: 'religion', label: 'Religion', value: p.religion, aliasCategory: 'religion' });
    await processField({ key: 'gender', label: 'Gender', value: p.gender, aliasCategory: 'gender' });

    // Document numbers (only if availability was Yes / not No)
    if (p.nidAvailable !== 'No' && p.nidNumber) {
      await processField({ key: 'nidNumber', label: 'National ID Number', value: p.nidNumber });
    }
    if (p.birthRegAvailable !== 'No' && p.birthRegNumber) {
      await processField({ key: 'birthRegNumber', label: 'Birth Registration Number', value: p.birthRegNumber });
    }
    if (p.passportAvailable !== 'No' && p.passportNumber) {
      await processField({ key: 'passportNumber', label: 'Passport Number', value: p.passportNumber });
    }

    await processField({ key: 'maritalStatus', label: 'Marital Status', value: p.maritalStatus, aliasCategory: 'maritalStatus' });
    if (p.maritalStatus === 'Married' && p.spouseName) {
      await processField({ key: 'spouseName', label: 'Spouse Name', value: p.spouseName });
    }

    await processField({ key: 'mobile', label: 'Mobile Number', value: p.mobile });
    await processField({ key: 'confirmMobile', label: 'Confirm Mobile Number', value: p.confirmMobile || p.mobile });
    await processField({ key: 'email', label: 'Email Address', value: p.email });
    await processField({ key: 'quota', label: 'Quota', value: p.quota || 'Not Applicable', aliasCategory: 'quota' });
    await processField({ key: 'departmentalStatus', label: 'Departmental Status', value: p.departmentalStatus || 'None', aliasCategory: 'departmentalStatus' });

    /* -------------------------------------------------------------
       STEP 3: PRESENT ADDRESS
       ------------------------------------------------------------- */
    const pra = profile.presentAddress || {};
    await processField({ key: 'presentCareOf', label: 'Present Address: Care Of', value: pra.careOf });
    await processField({ key: 'presentVillage', label: 'Present Address: Village/Road', value: pra.village });

    // District selection
    if (pra.district) {
      await processField({
        key: 'presentDistrict',
        label: 'Present Address: District',
        value: pra.district,
        type: 'select'
      });

      // Wait for dependent Upazila dropdown to populate via Ajax (up to 3.5s)
      const upazilaEl = findElement('presentUpazila', mapping);
      if (upazilaEl) {
        await waitForDropdownOptions(upazilaEl, 3500, pra.upazila);
      } else {
        await wait(delayMs);
      }
    }

    if (pra.upazila) {
      await processField({
        key: 'presentUpazila',
        label: 'Present Address: Upazila/P.S.',
        value: pra.upazila,
        type: 'select',
        aliasCategory: 'upazila'
      });
    }

    await processField({ key: 'presentPostOffice', label: 'Present Address: Post Office', value: pra.postOffice });
    await processField({ key: 'presentPostCode', label: 'Present Address: Post Code', value: pra.postCode });

    /* -------------------------------------------------------------
       STEP 4: PERMANENT ADDRESS
       ------------------------------------------------------------- */
    const pma = profile.permanentAddress || {};
    const sameCheckbox = findElement('sameAsPresentCheckbox', mapping);

    if (pma.sameAsPresent && sameCheckbox) {
      setNativeCheckboxValue(sameCheckbox, true);
      report.filled.push({ field: 'sameAsPresentCheckbox', label: 'Same as Present Address', value: true });
      await wait(300);
    } else {
      const permCare = pma.sameAsPresent ? pra.careOf : pma.careOf;
      const permVill = pma.sameAsPresent ? pra.village : pma.village;
      const permDist = pma.sameAsPresent ? pra.district : pma.district;
      const permUpz = pma.sameAsPresent ? pra.upazila : pma.upazila;
      const permPost = pma.sameAsPresent ? pra.postOffice : pma.postOffice;
      const permCode = pma.sameAsPresent ? pra.postCode : pma.postCode;

      await processField({ key: 'permanentCareOf', label: 'Permanent Address: Care Of', value: permCare });
      await processField({ key: 'permanentVillage', label: 'Permanent Address: Village/Road', value: permVill });

      if (permDist) {
        await processField({
          key: 'permanentDistrict',
          label: 'Permanent Address: District',
          value: permDist,
          type: 'select'
        });

        const permUpazilaEl = findElement('permanentUpazila', mapping);
        if (permUpazilaEl) {
          await waitForDropdownOptions(permUpazilaEl, 3500, permUpz);
        } else {
          await wait(delayMs);
        }
      }

      if (permUpz) {
        await processField({
          key: 'permanentUpazila',
          label: 'Permanent Address: Upazila/P.S.',
          value: permUpz,
          type: 'select',
          aliasCategory: 'upazila'
        });
      }

      await processField({ key: 'permanentPostOffice', label: 'Permanent Address: Post Office', value: permPost });
      await processField({ key: 'permanentPostCode', label: 'Permanent Address: Post Code', value: permCode });
    }

    /* -------------------------------------------------------------
       STEP 5: SSC / EQUIVALENT LEVEL (ONLY IF PRESENT ON FORM)
       ------------------------------------------------------------- */
    const ssc = profile.ssc || {};
    const hasSsc = Boolean(
      findElement('sscExam', mapping) || findElement('sscRoll', mapping) || (typeof document !== 'undefined' && document.getElementById('ssc_exam'))
    );
    if (hasSsc) {
      await processField({ key: 'sscExam', label: 'SSC: Examination', value: ssc.examination, type: 'select' });
      await processField({ key: 'sscRoll', label: 'SSC: Roll Number', value: ssc.rollNumber });
      await processField({ key: 'sscGroup', label: 'SSC: Group/Subject', value: ssc.groupSubject, type: 'select', aliasCategory: 'group' });
      await processField({ key: 'sscBoard', label: 'SSC: Board', value: ssc.board, type: 'select', aliasCategory: 'board' });

      if (ssc.resultType) {
        await processField({
          key: 'sscResultType',
          label: 'SSC: Result Type',
          value: ssc.resultType,
          type: 'select',
          aliasCategory: 'resultType',
          numericHint: ssc.resultMarks
        });
        await wait(300);
      }
      if (ssc.resultMarks) {
        await processField({ key: 'sscResultMarks', label: 'SSC: Result GPA/Marks', value: ssc.resultMarks });
      }
      await processField({ key: 'sscPassingYear', label: 'SSC: Passing Year', value: ssc.passingYear, type: 'select' });
    }

    /* -------------------------------------------------------------
       STEP 6: HSC / EQUIVALENT LEVEL (ONLY IF PRESENT ON FORM)
       ------------------------------------------------------------- */
    const hsc = profile.hsc || {};
    const hasHsc = Boolean(
      findElement('hscExam', mapping) || findElement('hscRoll', mapping) || (typeof document !== 'undefined' && document.getElementById('hsc_exam'))
    );
    if (hasHsc) {
      await processField({ key: 'hscExam', label: 'HSC: Examination', value: hsc.examination, type: 'select' });
      await processField({ key: 'hscRoll', label: 'HSC: Roll Number', value: hsc.rollNumber });

      // Wait for dependent HSC Group dropdown to update if exam changed (e.g. Diploma, Alim, Vocational)
      const hscGroupEl = findElement('hscGroup', mapping);
      if (hscGroupEl) {
        await waitForDropdownOptions(hscGroupEl, 3000, hsc.groupSubject);
      }
      await processField({ key: 'hscGroup', label: 'HSC: Group/Subject', value: hsc.groupSubject, type: 'select', aliasCategory: 'group' });
      await processField({ key: 'hscBoard', label: 'HSC: Board', value: hsc.board, type: 'select', aliasCategory: 'board' });

      if (hsc.resultType) {
        await processField({
          key: 'hscResultType',
          label: 'HSC: Result Type',
          value: hsc.resultType,
          type: 'select',
          aliasCategory: 'resultType',
          numericHint: hsc.resultMarks
        });
        await wait(300);
      }
      if (hsc.resultMarks) {
        await processField({ key: 'hscResultMarks', label: 'HSC: Result GPA/Marks', value: hsc.resultMarks });
      }
      await processField({ key: 'hscPassingYear', label: 'HSC: Passing Year', value: hsc.passingYear, type: 'select' });
    }

    /* -------------------------------------------------------------
       STEP 7: GRADUATION / EQUIVALENT (ONLY IF PRESENT ON FORM)
       ------------------------------------------------------------- */
    const gra = profile.graduation || {};
    const hasGraduation = Boolean(
      findElement('graExam', mapping) || findElement('graInstitute', mapping) || (typeof document !== 'undefined' && document.getElementById('gra_exam'))
    );
    if (hasGraduation) {
      await processField({ key: 'graExam', label: 'Graduation: Examination', value: gra.examination, type: 'select', aliasCategory: 'degree' });
      await processField({ key: 'graInstitute', label: 'Graduation: University/Institute', value: gra.institute });
      await processField({ key: 'graPassingYear', label: 'Graduation: Passing Year', value: gra.passingYear, type: 'select' });

      // Wait for dependent Subject dropdown to populate if select
      const graSubEl = findElement('graSubject', mapping);
      if (graSubEl && graSubEl.tagName === 'SELECT') {
        await waitForDropdownOptions(graSubEl, 2500, gra.subject);
      }
      await processField({
        key: 'graSubject',
        label: 'Graduation: Subject/Degree',
        value: gra.subject,
        type: graSubEl && graSubEl.tagName === 'SELECT' ? 'select' : 'text',
        aliasCategory: 'subject'
      });

      if (gra.resultType) {
        await processField({
          key: 'graResultType',
          label: 'Graduation: Result Type',
          value: gra.resultType,
          type: 'select',
          aliasCategory: 'resultType',
          numericHint: gra.resultMarks
        });
        await wait(300);
      }
      if (gra.resultMarks) {
        await processField({ key: 'graResultMarks', label: 'Graduation: CGPA/Marks', value: gra.resultMarks });
      }
      await processField({ key: 'graDuration', label: 'Graduation: Course Duration', value: gra.courseDuration, type: 'select', aliasCategory: 'duration' });
    }

    /* -------------------------------------------------------------
       STEP 8: MASTERS / EQUIVALENT (ONLY IF PRESENT ON FORM)
       ------------------------------------------------------------- */
    const mas = profile.masters || {};
    const hasMasters = Boolean(
      findElement('masExam', mapping) || findElement('masInstitute', mapping) || (typeof document !== 'undefined' && (document.getElementById('mas_exam') || document.getElementById('mas_applicable')))
    );
    if (hasMasters && mas.applicable) {
      const masCheck = findElement('masApplicable', mapping);
      if (masCheck) {
        setNativeCheckboxValue(masCheck, true);
        await wait(250);
      }

      await processField({ key: 'masExam', label: 'Masters: Examination', value: mas.examination, type: 'select', aliasCategory: 'degree' });
      await processField({ key: 'masInstitute', label: 'Masters: University/Institute', value: mas.institute });
      await processField({ key: 'masPassingYear', label: 'Masters: Passing Year', value: mas.passingYear, type: 'select' });

      const masSubEl = findElement('masSubject', mapping);
      if (masSubEl && masSubEl.tagName === 'SELECT') {
        await waitForDropdownOptions(masSubEl, 2500, mas.subject);
      }
      await processField({
        key: 'masSubject',
        label: 'Masters: Subject/Degree',
        value: mas.subject,
        type: masSubEl && masSubEl.tagName === 'SELECT' ? 'select' : 'text',
        aliasCategory: 'subject'
      });

      if (mas.resultType) {
        await processField({
          key: 'masResultType',
          label: 'Masters: Result Type',
          value: mas.resultType,
          type: 'select',
          aliasCategory: 'resultType',
          numericHint: mas.resultMarks
        });
        await wait(300);
      }
      if (mas.resultMarks) {
        await processField({ key: 'masResultMarks', label: 'Masters: Result CGPA', value: mas.resultMarks });
      }
      await processField({ key: 'masDuration', label: 'Masters: Course Duration', value: mas.courseDuration, type: 'select', aliasCategory: 'duration' });
    }

    /* -------------------------------------------------------------
       STEP 9: OTHER QUALIFICATIONS & EXPERIENCES
       ------------------------------------------------------------- */
    const oq = profile.otherQualifications || {};
    const compVal = oq.computerProficiency || oq['Do you have Computer proficiency?'] || 'Yes';
    const typingVal = oq.computerTypingSpeed || oq['Computer Typing Speed'] || 'Yes';

    // 1. Direct matcher: scan for "Do you have Computer proficiency?" and immediately select value
    const compScan = autoFillComputerProficiency(typeof document !== 'undefined' ? document : null, compVal);
    if (compScan && compScan.success) {
      report.filled.push({
        field: 'computerProficiency',
        label: 'Do you have Computer proficiency?',
        value: compScan.value || compVal
      });
    } else {
      await processField({
        key: 'computerProficiency',
        label: 'Other Qualifications: Computer Proficiency',
        value: compVal,
        type: 'select',
        aliasCategory: 'yesNo'
      });
    }

    if (typingVal) {
      await processField({
        key: 'computerTypingSpeed',
        label: 'Other Qualifications: Computer Typing Speed',
        value: typingVal,
        type: 'select',
        aliasCategory: 'yesNo'
      });
    }

    /* -------------------------------------------------------------
       STEP 10: PHOTO, SIGNATURE & DECLARATION (PREVIEW / 2ND PART)
       ------------------------------------------------------------- */
    const doc = typeof document !== 'undefined' ? document : null;
    if (doc) {
      const { photoInput, signatureInput } = findPhotoAndSignatureInputs(doc);
      if (photoInput || signatureInput) {
        let media = (customSettings && customSettings.media) || (profile && profile.media) || {};

        // If media was not passed in customSettings, try fetching from chrome.storage.local
        if (!media.photo && !media.signature && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          try {
            const rawStorage = await new Promise(r => chrome.storage.local.get([
              'teletalk_active_profile_id', 'teletalk_saved_photo', 'teletalk_saved_signature'
            ], r));
            const activeId = rawStorage['teletalk_active_profile_id'];
            const pKey = activeId ? `teletalk_saved_photo_${activeId}` : 'teletalk_saved_photo';
            const sKey = activeId ? `teletalk_saved_signature_${activeId}` : 'teletalk_saved_signature';
            const mediaStorage = await new Promise(r => chrome.storage.local.get([pKey, sKey], r));
            const pObj = mediaStorage[pKey] || rawStorage['teletalk_saved_photo'];
            const sObj = mediaStorage[sKey] || rawStorage['teletalk_saved_signature'];
            media = {
              photo: pObj ? (pObj.dataUrl || pObj) : null,
              signature: sObj ? (sObj.dataUrl || sObj) : null
            };
          } catch (e) { }
        }

        if (photoInput && media.photo) {
          const photoFile = dataURLtoFile(media.photo, 'passport_photo_300x300.jpg');
          if (photoFile && attachFileToInput(photoInput, photoFile)) {
            report.filled.push({ field: 'photo', label: 'Passport Photo (300 × 300 px)', value: 'Attached' });
          } else {
            report.review.push({ field: 'photo', label: 'Passport Photo', reason: 'Failed to attach photo file to input.' });
          }
        } else if (photoInput && !media.photo) {
          report.review.push({ field: 'photo', label: 'Passport Photo (300 × 300 px)', reason: 'No saved photo found in extension storage. Please save photo in Photo & Sign tab.' });
        }

        if (signatureInput && media.signature) {
          const sigFile = dataURLtoFile(media.signature, 'signature_300x80.jpg');
          if (sigFile && attachFileToInput(signatureInput, sigFile)) {
            report.filled.push({ field: 'signature', label: 'Signature (300 × 80 px)', value: 'Attached' });
          } else {
            report.review.push({ field: 'signature', label: 'Signature', reason: 'Failed to attach signature file to input.' });
          }
        } else if (signatureInput && !media.signature) {
          report.review.push({ field: 'signature', label: 'Signature (300 × 80 px)', reason: 'No saved signature found in extension storage. Please save signature in Photo & Sign tab.' });
        }

        // Visually update the preview images on the page
        updatePreviewImages(doc, media.photo, media.signature);

        // Check the declaration checkbox
        const declared = autoCheckDeclaration(doc);
        if (declared) {
          report.filled.push({ field: 'declaration', label: 'Declaration Checkbox', value: true });
        }
      }
    }

    return {
      success: report.review.length === 0,
      filledCount: report.filled.length,
      skippedCount: report.skipped.length,
      reviewCount: report.review.length,
      ...report
    };
  }

  return {
    runAutofill,
    autoFillComputerProficiency,
    dataURLtoFile,
    attachFileToInput,
    findPhotoAndSignatureInputs,
    updatePreviewImages,
    autoCheckDeclaration,
    setNativeInputValue,
    setNativeSelectValue,
    setNativeCheckboxValue,
    setNativeDateValue,
    parseDateComponents,
    findElement,
    waitForDropdownOptions
  };
});
