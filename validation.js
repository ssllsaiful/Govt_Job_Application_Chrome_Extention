/**
 * validation.js - Bangladesh Govt Job Application Field Validators
 * 
 * Provides robust validation and formatting helpers for Bangladeshi
 * government application forms (Mobile, Postcode, Passing Year, GPA, DOB, etc.).
 * Designed to be non-blocking: warns the user about anomalies while still
 * allowing saving and editing partial profiles.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JobFormValidator = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Normalizes Bangladeshi mobile numbers.
   * Strips spaces, dashes, parentheses, and leading '+88' or '88'.
   * @param {string} mobile
   * @returns {string} Clean 11-digit number or original trimmed string
   */
  function normalizeMobile(mobile) {
    if (!mobile) return '';
    let clean = String(mobile).replace(/[\s\-\(\)]/g, '').trim();
    if (clean.startsWith('+88')) {
      clean = clean.slice(3);
    } else if (clean.startsWith('880')) {
      clean = clean.slice(2);
    }
    return clean;
  }

  /**
   * Validates Bangladeshi mobile number.
   * Valid operators: 013, 014, 015, 016, 017, 018, 019 followed by 8 digits.
   * @param {string} mobile
   * @returns {{ valid: boolean, normalized: string, message: string }}
   */
  function validateMobile(mobile) {
    if (!mobile) {
      return { valid: true, normalized: '', message: '' };
    }
    const normalized = normalizeMobile(mobile);
    const regex = /^01[3-9]\d{8}$/;
    if (!regex.test(normalized)) {
      return {
        valid: false,
        normalized,
        message: 'Must be an 11-digit Bangladeshi mobile number (e.g. 01712345678).'
      };
    }
    return { valid: true, normalized, message: '' };
  }

  /**
   * Validates standard email address format.
   * @param {string} email
   * @returns {{ valid: boolean, message: string }}
   */
  function validateEmail(email) {
    if (!email) {
      return { valid: true, message: '' };
    }
    const clean = String(email).trim();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(clean)) {
      return { valid: false, message: 'Please enter a valid email address.' };
    }
    return { valid: true, message: '' };
  }

  /**
   * Helper to parse date strings in various formats (YYYY-MM-DD, DD-MM-YYYY, DD-Mon-YYYY, etc.)
   * @param {string} str
   * @returns {Date|null}
   */
  function parseFlexibleDate(str) {
    if (!str) return null;
    const s = String(str).trim();

    // DD-MON-YYYY or DD Mon YYYY (e.g. 03-MAR-1998)
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monMatch = s.match(/^(\d{1,2})[-/\s]([A-Za-z]{3,9})[-/\s](\d{4})$/);
    if (monMatch) {
      const d = parseInt(monMatch[1], 10);
      const mIdx = monthNames.indexOf(monMatch[2].substring(0, 3).toUpperCase());
      const y = parseInt(monMatch[3], 10);
      if (mIdx !== -1) return new Date(y, mIdx, d);
    }

    // YYYY-MM-DD or YYYY/MM/DD
    const ymdMatch = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (ymdMatch) {
      return new Date(parseInt(ymdMatch[1], 10), parseInt(ymdMatch[2], 10) - 1, parseInt(ymdMatch[3], 10));
    }

    // DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dmyMatch) {
      return new Date(parseInt(dmyMatch[3], 10), parseInt(dmyMatch[2], 10) - 1, parseInt(dmyMatch[1], 10));
    }

    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  /**
   * Validates Date of Birth format and age sanity.
   * Expects 'YYYY-MM-DD' or comparable date string.
   * @param {string} dobStr
   * @returns {{ valid: boolean, age: number|null, isoDate: string, message: string }}
   */
  function validateDateOfBirth(dobStr) {
    if (!dobStr) {
      return { valid: true, age: null, isoDate: '', message: '' };
    }
    const date = parseFlexibleDate(dobStr);
    if (!date) {
      return { valid: false, age: null, isoDate: '', message: 'Invalid date format (expected YYYY-MM-DD or DD-MM-YYYY).' };
    }
    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const now = new Date();
    let age = now.getFullYear() - date.getFullYear();
    const monthDiff = now.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
      age--;
    }
    if (age < 15 || age > 65) {
      return {
        valid: false,
        age,
        isoDate,
        message: `Applicant age (${age} years) seems out of the typical 18-60 range.`
      };
    }
    return { valid: true, age, isoDate, message: '' };
  }

  /**
   * Validates 4-digit Bangladeshi post code.
   * @param {string|number} postCode
   * @returns {{ valid: boolean, message: string }}
   */
  function validatePostCode(postCode) {
    if (!postCode) {
      return { valid: true, message: '' };
    }
    const clean = String(postCode).trim();
    if (!/^\d{4}$/.test(clean)) {
      return { valid: false, message: 'Post code should be 4 digits (e.g. 1205).' };
    }
    return { valid: true, message: '' };
  }

  /**
   * Validates academic passing year.
   * @param {string|number} year
   * @returns {{ valid: boolean, message: string }}
   */
  function validatePassingYear(year) {
    if (!year) {
      return { valid: true, message: '' };
    }
    const num = parseInt(year, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(num) || num < 1970 || num > currentYear + 2) {
      return {
        valid: false,
        message: `Passing year should be 4 digits between 1970 and ${currentYear + 2}.`
      };
    }
    return { valid: true, message: '' };
  }

  /**
   * Validates GPA or CGPA result marks against expected scale.
   * @param {string|number} marks
   * @param {string|number} [scale=5.0]
   * @returns {{ valid: boolean, message: string }}
   */
  function validateResultMarks(marks, scale) {
    if (!marks) {
      return { valid: true, message: '' };
    }
    const num = parseFloat(marks);
    const max = parseFloat(scale) || 5.0;
    if (isNaN(num) || num < 1.0 || num > max) {
      return {
        valid: false,
        message: `Result score (${marks}) should be a number between 1.00 and ${max.toFixed(2)}.`
      };
    }
    return { valid: true, message: '' };
  }

  /**
  /**
   * Validates that an input contains only English/Latin characters, spaces, and valid name punctuation.
   * Strictly flags any Bengali or foreign script characters.
   * @param {string} text
   * @param {string} [fieldName='Field']
   * @returns {{ valid: boolean, message: string }}
   */
  function validateEnglishOnly(text, fieldName = 'Field') {
    if (!text) return { valid: true, message: '' };
    const str = String(text).trim();
    if (!str) return { valid: true, message: '' };

    // Check for Bengali Unicode range
    if (/[\u0980-\u09FF]/.test(str)) {
      return {
        valid: false,
        message: `${fieldName} must be in English only. Bengali characters are not allowed.`
      };
    }

    // Only allow English letters, spaces, dots, hyphens, colons, commas, apostrophes, and parentheses
    if (!/^[A-Za-z\s.\-',:()/]+$/.test(str)) {
      return {
        valid: false,
        message: `${fieldName} contains invalid characters. Only English letters (A-Z, a-z) are supported.`
      };
    }

    return { valid: true, message: '' };
  }

  /**
   * Validates that an input contains only Bengali characters, spaces, and standard Bengali punctuation.
   * Strictly flags English/Latin characters.
   * @param {string} text
   * @param {string} [fieldName='ক্ষেত্রটি']
   * @returns {{ valid: boolean, message: string }}
   */
  function validateBanglaOnly(text, fieldName = 'ক্ষেত্রটি') {
    if (!text) return { valid: true, message: '' };
    const str = String(text).trim();
    if (!str) return { valid: true, message: '' };

    // Check for English characters
    if (/[A-Za-z]/.test(str)) {
      return {
        valid: false,
        message: `${fieldName} শুধুমাত্র বাংলায় পূরণ করুন। ইংরেজি অক্ষর গ্রহণ করা হবে না।`
      };
    }

    // Check for valid Bengali characters, spaces, Bengali danda/dari, dots, dashes, colons, commas, parentheses
    if (!/^[\u0980-\u09FF\s.\-',:()/\u0964\u0965]+$/.test(str)) {
      return {
        valid: false,
        message: `${fieldName} শুধুমাত্র বাংলা অক্ষরে লিখুন (Avro/Bijoy)।`
      };
    }

    return { valid: true, message: '' };
  }

  /**
   * Runs non-blocking validation over an entire profile.
   * Returns list of warnings that can be displayed to user.
   * @param {Object} profile
   * @returns {{ warnings: Array<{ field: string, message: string }> }}
   */
  function validateProfile(profile) {
    const warnings = [];
    if (!profile) return { warnings };

    const p = profile.personal || {};

    // English Name checks
    if (p.fullName) {
      const enRes = validateEnglishOnly(p.fullName, "Applicant's Name (English)");
      if (!enRes.valid) warnings.push({ field: 'personal.fullName', message: enRes.message });
    }
    if (p.fatherName) {
      const enRes = validateEnglishOnly(p.fatherName, "Father's Name (English)");
      if (!enRes.valid) warnings.push({ field: 'personal.fatherName', message: enRes.message });
    }
    if (p.motherName) {
      const enRes = validateEnglishOnly(p.motherName, "Mother's Name (English)");
      if (!enRes.valid) warnings.push({ field: 'personal.motherName', message: enRes.message });
    }
    if (p.spouseName) {
      const enRes = validateEnglishOnly(p.spouseName, "Spouse Name (English)");
      if (!enRes.valid) warnings.push({ field: 'personal.spouseName', message: enRes.message });
    }

    // Bangla Name checks
    if (p.fullNameBn) {
      const bnRes = validateBanglaOnly(p.fullNameBn, "আবেদনকারীর নাম (বাংলায়)");
      if (!bnRes.valid) warnings.push({ field: 'personal.fullNameBn', message: bnRes.message });
    }
    if (p.fatherNameBn) {
      const bnRes = validateBanglaOnly(p.fatherNameBn, "পিতার নাম (বাংলায়)");
      if (!bnRes.valid) warnings.push({ field: 'personal.fatherNameBn', message: bnRes.message });
    }
    if (p.motherNameBn) {
      const bnRes = validateBanglaOnly(p.motherNameBn, "মাতার নাম (বাংলায়)");
      if (!bnRes.valid) warnings.push({ field: 'personal.motherNameBn', message: bnRes.message });
    }

    if (p.mobile) {
      const mobRes = validateMobile(p.mobile);
      if (!mobRes.valid) warnings.push({ field: 'personal.mobile', message: mobRes.message });
    }
    if (p.mobile && p.confirmMobile && normalizeMobile(p.mobile) !== normalizeMobile(p.confirmMobile)) {
      warnings.push({
        field: 'personal.confirmMobile',
        message: 'Mobile Number and Confirm Mobile Number do not match.'
      });
    }
    if (p.email) {
      const emailRes = validateEmail(p.email);
      if (!emailRes.valid) warnings.push({ field: 'personal.email', message: emailRes.message });
    }
    if (p.dob) {
      const dobRes = validateDateOfBirth(p.dob);
      if (!dobRes.valid) warnings.push({ field: 'personal.dob', message: dobRes.message });
    }

    const pra = profile.presentAddress || {};
    if (pra.postCode) {
      const pcRes = validatePostCode(pra.postCode);
      if (!pcRes.valid) warnings.push({ field: 'presentAddress.postCode', message: pcRes.message });
    }

    const pma = profile.permanentAddress || {};
    if (!pma.sameAsPresent && pma.postCode) {
      const pcRes = validatePostCode(pma.postCode);
      if (!pcRes.valid) warnings.push({ field: 'permanentAddress.postCode', message: pcRes.message });
    }

    const ssc = profile.ssc || {};
    if (ssc.passingYear) {
      const sscYear = validatePassingYear(ssc.passingYear);
      if (!sscYear.valid) warnings.push({ field: 'ssc.passingYear', message: sscYear.message });
    }

    const hsc = profile.hsc || {};
    if (hsc.passingYear) {
      const hscYear = validatePassingYear(hsc.passingYear);
      if (!hscYear.valid) warnings.push({ field: 'hsc.passingYear', message: hscYear.message });
    }

    const gra = profile.graduation || {};
    if (gra.passingYear) {
      const graYear = validatePassingYear(gra.passingYear);
      if (!graYear.valid) warnings.push({ field: 'graduation.passingYear', message: graYear.message });
    }

    return { warnings };
  }

  return {
    normalizeMobile,
    validateMobile,
    validateEmail,
    validateDateOfBirth,
    validatePostCode,
    validatePassingYear,
    validateResultMarks,
    validateEnglishOnly,
    validateBanglaOnly,
    validateProfile
  };
});
