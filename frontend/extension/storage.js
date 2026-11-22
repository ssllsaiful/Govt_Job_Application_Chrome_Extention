/**
 * storage.js - Local Storage Management & Encrypted Backups
 * 
 * Manages profile state using chrome.storage.local without any remote servers.
 * Implements Web Crypto API (PBKDF2 + AES-GCM 256-bit) for optional password-protected
 * exported backups. Passwords and keys are never stored in plain text.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JobStorage = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STORAGE_KEY_PROFILE = 'teletalk_user_profile';
  const STORAGE_KEY_SETTINGS = 'teletalk_user_settings';
  const STORAGE_KEY_PROFILES = 'teletalk_profiles';
  const STORAGE_KEY_ACTIVE_ID = 'teletalk_active_profile_id';

  /**
   * Helper to read from chrome.storage.local or localStorage.
   */
  function storageGet(keys) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(keys, (res) => resolve(res || {}));
      } else {
        const res = {};
        keys.forEach((k) => {
          const val = localStorage.getItem(k);
          if (val) {
            try {
              res[k] = JSON.parse(val);
            } catch (e) {
              res[k] = val;
            }
          }
        });
        resolve(res);
      }
    });
  }

  /**
   * Helper to write to chrome.storage.local or localStorage.
   */
  function storageSet(obj) {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set(obj, () => {
          if (chrome.runtime && chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(true);
          }
        });
      } else {
        for (const [k, v] of Object.entries(obj)) {
          localStorage.setItem(k, JSON.stringify(v));
        }
        resolve(true);
      }
    });
  }

  /**
   * Generates a complete blank default profile structure.
   * @param {string} [id]
   * @param {string} [name]
   * @returns {Object}
   */
  function getDefaultProfile(id = 'profile_default', name = 'Primary Profile') {
    return {
      id: id,
      name: name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      personal: {
        fullName: '',
        fullNameBn: '',
        fatherName: '',
        fatherNameBn: '',
        motherName: '',
        motherNameBn: '',
        dob: '', // YYYY-MM-DD
        nationality: 'Bangladeshi',
        religion: 'Islam',
        gender: 'Male',
        nidAvailable: 'Yes',
        nidNumber: '',
        birthRegAvailable: 'No',
        birthRegNumber: '',
        passportAvailable: 'No',
        passportNumber: '',
        maritalStatus: 'Single',
        spouseName: '',
        mobile: '',
        confirmMobile: '',
        email: '',
        quota: 'Not Applicable',
        departmentalStatus: 'None'
      },
      presentAddress: {
        careOf: '',
        village: '',
        district: '',
        upazila: '',
        postOffice: '',
        postCode: ''
      },
      permanentAddress: {
        sameAsPresent: false,
        careOf: '',
        village: '',
        district: '',
        upazila: '',
        postOffice: '',
        postCode: ''
      },
      ssc: {
        examination: 'S.S.C',
        rollNumber: '',
        groupSubject: 'Science',
        board: 'Dhaka',
        resultType: 'GPA(out of 5)',
        resultMarks: '',
        passingYear: ''
      },
      hsc: {
        examination: 'H.S.C',
        rollNumber: '',
        groupSubject: 'Science',
        board: 'Dhaka',
        resultType: 'GPA(out of 5)',
        resultMarks: '',
        passingYear: ''
      },
      graduation: {
        examination: 'B.Sc (Bachelor of Science)',
        institute: '',
        passingYear: '',
        subject: '',
        resultType: 'GPA(out of 4)',
        resultMarks: '',
        courseDuration: '4 Years'
      },
      masters: {
        applicable: false,
        examination: '',
        institute: '',
        passingYear: '',
        subject: '',
        resultType: 'GPA(out of 4)',
        resultMarks: '',
        courseDuration: '1 Year'
      },
      otherQualifications: {
        computerProficiency: 'Yes',
        computerTypingSpeed: 'Yes',
        'Do you have Computer proficiency?': 'Yes',
        'Computer Typing Speed': 'Yes'
      },
      settings: {
        enableAutofill: true,
        overwriteExisting: false,
        dependentDropdownDelayMs: 450,
        showFloatingPill: true
      }
    };
  }

  /**
   * Deep merges user profile onto the default template to guarantee
   * schema integrity even if new fields were added.
   * @param {Object} target
   * @param {Object} source
   * @returns {Object}
   */
  function deepMerge(target, source) {
    if (!source || typeof source !== 'object') return target;
    const output = Object.assign({}, target);
    for (const key of Object.keys(source)) {
      if (target[key] === undefined) {
        output[key] = source[key];
      }
    }
    for (const key of Object.keys(target)) {
      if (source[key] !== undefined) {
        if (typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
          output[key] = deepMerge(target[key], source[key]);
        } else {
          output[key] = source[key];
        }
      }
    }
    return output;
  }

  /**
   * Retrieves all saved profiles. Migrates legacy single-profile store if needed.
   * @returns {Promise<Array<Object>>}
   */
  async function getProfiles() {
    const data = await storageGet([STORAGE_KEY_PROFILES, STORAGE_KEY_PROFILE, STORAGE_KEY_ACTIVE_ID]);
    let profiles = data[STORAGE_KEY_PROFILES];

    if (Array.isArray(profiles) && profiles.length > 0) {
      // Ensure each profile conforms to schema
      return profiles.map((p) => deepMerge(getDefaultProfile(p.id, p.name), p));
    }

    // Migration / First-time init from legacy teletalk_user_profile
    const legacy = data[STORAGE_KEY_PROFILE];
    const initialName = (legacy && legacy.personal && (legacy.personal.fullName || legacy.personal.fullNameBn))
      ? (legacy.personal.fullName || legacy.personal.fullNameBn)
      : 'Primary Profile';

    const defaultProfile = deepMerge(getDefaultProfile('profile_default', initialName), legacy || {});
    defaultProfile.id = 'profile_default';
    defaultProfile.name = initialName;

    profiles = [defaultProfile];
    await storageSet({
      [STORAGE_KEY_PROFILES]: profiles,
      [STORAGE_KEY_ACTIVE_ID]: 'profile_default',
      [STORAGE_KEY_PROFILE]: defaultProfile
    });

    return profiles;
  }

  /**
   * Gets the ID of the currently active profile.
   * @returns {Promise<string>}
   */
  async function getActiveProfileId() {
    const data = await storageGet([STORAGE_KEY_ACTIVE_ID]);
    if (data[STORAGE_KEY_ACTIVE_ID]) {
      return data[STORAGE_KEY_ACTIVE_ID];
    }
    const profiles = await getProfiles();
    const activeId = profiles[0] ? profiles[0].id : 'profile_default';
    await storageSet({ [STORAGE_KEY_ACTIVE_ID]: activeId });
    return activeId;
  }

  /**
   * Sets the active profile by ID and synchronizes teletalk_user_profile.
   * @param {string} profileId
   * @returns {Promise<Object>} The active profile
   */
  async function setActiveProfileId(profileId) {
    const profiles = await getProfiles();
    const target = profiles.find((p) => p.id === profileId) || profiles[0];
    if (!target) {
      throw new Error('Profile not found.');
    }
    await storageSet({
      [STORAGE_KEY_ACTIVE_ID]: target.id,
      [STORAGE_KEY_PROFILE]: target
    });
    return target;
  }

  /**
   * Retrieves profile by ID, or the currently active profile if no ID is specified.
   * @param {string} [profileId]
   * @returns {Promise<Object>}
   */
  async function getProfile(profileId = null) {
    const profiles = await getProfiles();
    if (profileId) {
      const match = profiles.find((p) => p.id === profileId);
      if (match) return deepMerge(getDefaultProfile(match.id, match.name), match);
    }
    const activeId = await getActiveProfileId();
    const active = profiles.find((p) => p.id === activeId) || profiles[0] || getDefaultProfile();
    return deepMerge(getDefaultProfile(active.id, active.name), active);
  }

  /**
   * Saves profile to storage under its profile ID and syncs teletalk_user_profile if active.
   * @param {Object} profile
   * @param {string} [profileId]
   * @returns {Promise<boolean>}
   */
  async function saveProfile(profile, profileId = null) {
    const profiles = await getProfiles();
    const targetId = profileId || profile.id || (await getActiveProfileId());

    const cleanProfile = deepMerge(getDefaultProfile(targetId, profile.name), profile);
    cleanProfile.id = targetId;
    cleanProfile.updatedAt = new Date().toISOString();

    // Auto update display name if user typed full name and name is generic
    if (cleanProfile.personal && cleanProfile.personal.fullName &&
        (!cleanProfile.name || cleanProfile.name === 'Primary Profile' || cleanProfile.name === 'New Applicant')) {
      cleanProfile.name = cleanProfile.personal.fullName;
    }

    // Keep permanent address in sync when sameAsPresent is checked
    if (cleanProfile.permanentAddress && cleanProfile.permanentAddress.sameAsPresent) {
      const pr = cleanProfile.presentAddress;
      cleanProfile.permanentAddress.careOf = pr.careOf;
      cleanProfile.permanentAddress.village = pr.village;
      cleanProfile.permanentAddress.district = pr.district;
      cleanProfile.permanentAddress.upazila = pr.upazila;
      cleanProfile.permanentAddress.postOffice = pr.postOffice;
      cleanProfile.permanentAddress.postCode = pr.postCode;
    }

    const idx = profiles.findIndex((p) => p.id === targetId);
    if (idx !== -1) {
      profiles[idx] = cleanProfile;
    } else {
      profiles.push(cleanProfile);
    }

    const activeId = await getActiveProfileId();
    const toSave = { [STORAGE_KEY_PROFILES]: profiles };

    if (activeId === targetId || profiles.length === 1) {
      toSave[STORAGE_KEY_PROFILE] = cleanProfile;
      toSave[STORAGE_KEY_ACTIVE_ID] = targetId;
    }

    await storageSet(toSave);
    return true;
  }

  /**
   * Creates a new profile, adds it to saved profiles, and sets it active.
   * @param {string} [name]
   * @param {Object} [initialData]
   * @returns {Promise<Object>}
   */
  async function createProfile(name = 'New Applicant', initialData = null) {
    const id = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newProfile = deepMerge(getDefaultProfile(id, name), initialData || {});
    newProfile.id = id;
    newProfile.name = name;
    newProfile.createdAt = new Date().toISOString();
    newProfile.updatedAt = new Date().toISOString();

    const profiles = await getProfiles();
    profiles.push(newProfile);

    await storageSet({
      [STORAGE_KEY_PROFILES]: profiles,
      [STORAGE_KEY_ACTIVE_ID]: id,
      [STORAGE_KEY_PROFILE]: newProfile
    });

    return newProfile;
  }

  /**
   * Clones an existing profile into a new profile.
   * @param {string} profileId
   * @returns {Promise<Object>}
   */
  async function duplicateProfile(profileId) {
    const source = await getProfile(profileId);
    const newName = `Copy of ${source.name || 'Profile'}`;
    const cloneData = JSON.parse(JSON.stringify(source));
    return createProfile(newName, cloneData);
  }

  /**
   * Deletes a profile by ID. Prevents deleting the only profile.
   * @param {string} profileId
   * @returns {Promise<Object>} The currently active profile after deletion
   */
  async function deleteProfile(profileId) {
    const profiles = await getProfiles();
    if (profiles.length <= 1) {
      throw new Error('Cannot delete the only profile. You must have at least one profile.');
    }

    const filtered = profiles.filter((p) => p.id !== profileId);
    let activeId = await getActiveProfileId();

    if (activeId === profileId) {
      activeId = filtered[0].id;
    }

    const activeProfile = filtered.find((p) => p.id === activeId) || filtered[0];

    await storageSet({
      [STORAGE_KEY_PROFILES]: filtered,
      [STORAGE_KEY_ACTIVE_ID]: activeId,
      [STORAGE_KEY_PROFILE]: activeProfile
    });

    try {
      await removePhoto(profileId);
      await removeSignature(profileId);
    } catch (e) { }

    return activeProfile;
  }

  /**
   * Renames a profile.
   * @param {string} profileId
   * @param {string} newName
   * @returns {Promise<boolean>}
   */
  async function renameProfile(profileId, newName) {
    if (!newName || !newName.trim()) {
      throw new Error('Profile name cannot be empty.');
    }
    const profiles = await getProfiles();
    const target = profiles.find((p) => p.id === profileId);
    if (!target) throw new Error('Profile not found.');

    target.name = newName.trim();
    target.updatedAt = new Date().toISOString();

    const activeId = await getActiveProfileId();
    const toSave = { [STORAGE_KEY_PROFILES]: profiles };
    if (activeId === profileId) {
      toSave[STORAGE_KEY_PROFILE] = target;
    }

    await storageSet(toSave);
    return true;
  }

  /**
   * Resets active (or specified) profile to fresh defaults.
   * @param {string} [profileId]
   * @returns {Promise<Object>}
   */
  async function resetProfile(profileId = null) {
    const targetId = profileId || (await getActiveProfileId());
    const defaults = getDefaultProfile(targetId, 'Reset Profile');
    await saveProfile(defaults, targetId);
    return defaults;
  }

  /* -------------------------------------------------------------
     WEB CRYPTO API: ENCRYPTION & SECURE BACKUPS
     ------------------------------------------------------------- */

  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Derives an AES-GCM 256-bit key from a passphrase and salt using PBKDF2.
   * @param {string} passphrase
   * @param {Uint8Array} salt
   * @param {number} iterations
   * @returns {Promise<CryptoKey>}
   */
  async function deriveKeyFromPassphrase(passphrase, salt, iterations = 100000) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts profile data using AES-GCM and user passphrase.
   * @param {Object} profile
   * @param {string} passphrase
   * @returns {Promise<string>} JSON string of encrypted container
   */
  async function exportEncryptedProfile(profile, passphrase) {
    if (!passphrase || passphrase.length < 6) {
      throw new Error('Passphrase must be at least 6 characters long.');
    }
    const cleanProfile = deepMerge(getDefaultProfile(), profile);
    const profileJson = JSON.stringify(cleanProfile);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const iterations = 100000;

    const aesKey = await deriveKeyFromPassphrase(passphrase, salt, iterations);
    const enc = new TextEncoder();
    const encodedData = enc.encode(profileJson);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      aesKey,
      encodedData
    );

    const container = {
      format: 'teletalk-autofill-vault',
      version: 1,
      encrypted: true,
      kdf: 'PBKDF2-SHA256',
      iterations: iterations,
      salt: arrayBufferToBase64(salt),
      iv: arrayBufferToBase64(iv),
      ciphertext: arrayBufferToBase64(ciphertext),
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(container, null, 2);
  }

  /**
   * Decrypts an encrypted container using the user passphrase.
   * @param {string|Object} encryptedData
   * @param {string} passphrase
   * @returns {Promise<Object>} Decrypted profile object
   */
  async function importEncryptedProfile(encryptedData, passphrase) {
    if (!passphrase) {
      throw new Error('Please provide the passphrase for this encrypted backup.');
    }

    let container = encryptedData;
    if (typeof encryptedData === 'string') {
      try {
        container = JSON.parse(encryptedData);
      } catch (e) {
        throw new Error('Invalid JSON backup file.');
      }
    }

    if (!container || container.format !== 'teletalk-autofill-vault' || !container.encrypted) {
      throw new Error('The file is not a valid Teletalk Autofill encrypted vault.');
    }

    const salt = new Uint8Array(base64ToArrayBuffer(container.salt));
    const iv = new Uint8Array(base64ToArrayBuffer(container.iv));
    const ciphertext = base64ToArrayBuffer(container.ciphertext);
    const iterations = container.iterations || 100000;

    const aesKey = await deriveKeyFromPassphrase(passphrase, salt, iterations);

    let decryptedBuffer;
    try {
      decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        aesKey,
        ciphertext
      );
    } catch (err) {
      throw new Error('Decryption failed. Incorrect passphrase or corrupted file.');
    }

    const dec = new TextDecoder();
    const jsonStr = dec.decode(decryptedBuffer);
    const parsed = JSON.parse(jsonStr);
    return deepMerge(getDefaultProfile(), parsed);
  }

  /**
   * Plain (unencrypted) JSON export.
   * @param {Object} profile
   * @returns {string}
   */
  function exportPlainProfile(profile) {
    const cleanProfile = deepMerge(getDefaultProfile(), profile);
    const container = {
      format: 'teletalk-autofill-plain',
      version: 1,
      encrypted: false,
      exportedAt: new Date().toISOString(),
      profile: cleanProfile
    };
    return JSON.stringify(container, null, 2);
  }

  /**
   * Plain JSON import with validation.
   * @param {string|Object} rawData
   * @returns {Object}
   */
  function importPlainProfile(rawData) {
    let parsed = rawData;
    if (typeof rawData === 'string') {
      try {
        parsed = JSON.parse(rawData);
      } catch (e) {
        throw new Error('Selected file is not valid JSON.');
      }
    }

    if (parsed && parsed.encrypted) {
      throw new Error('This file is encrypted. Please use "Import Encrypted Backup" and enter your passphrase.');
    }

    const profileData = parsed.profile || parsed;
    if (!profileData || typeof profileData !== 'object') {
      throw new Error('Invalid profile schema. Missing profile data object.');
    }

    return deepMerge(getDefaultProfile(), profileData);
  }

  /* -------------------------------------------------------------
     PHOTO & SIGNATURE PERSISTENCE
     ------------------------------------------------------------- */
  const STORAGE_KEY_PHOTO = 'teletalk_saved_photo';
  const STORAGE_KEY_SIGNATURE = 'teletalk_saved_signature';

  function getPhotoKey(profileId) {
    return profileId ? `teletalk_saved_photo_${profileId}` : STORAGE_KEY_PHOTO;
  }

  function getSigKey(profileId) {
    return profileId ? `teletalk_saved_signature_${profileId}` : STORAGE_KEY_SIGNATURE;
  }

  async function savePhoto(dataUrl, metadata = {}, profileId = null) {
    const targetId = profileId || (await getActiveProfileId());
    const payload = {
      dataUrl,
      meta: Object.assign({ savedAt: new Date().toISOString() }, metadata)
    };
    const key = getPhotoKey(targetId);
    const toSave = { [key]: payload };

    // Only update legacy key if it is profile_default
    if (targetId === 'profile_default') {
      toSave[STORAGE_KEY_PHOTO] = payload;
    }

    await storageSet(toSave);
    return payload;
  }

  async function getPhoto(profileId = null) {
    const targetId = profileId || (await getActiveProfileId());
    const key = getPhotoKey(targetId);
    const data = await storageGet([key, STORAGE_KEY_PHOTO]);
    if (data[key] && data[key].dataUrl) {
      return data[key];
    }
    // Only fall back to legacy storage if this is the default profile
    if (targetId === 'profile_default' && data[STORAGE_KEY_PHOTO] && data[STORAGE_KEY_PHOTO].dataUrl) {
      return data[STORAGE_KEY_PHOTO];
    }
    return null;
  }

  async function removePhoto(profileId = null) {
    const targetId = profileId || (await getActiveProfileId());
    const key = getPhotoKey(targetId);
    const removeKeys = [key];
    if (targetId === 'profile_default') {
      removeKeys.push(STORAGE_KEY_PHOTO);
    }
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.remove(removeKeys, () => resolve(true));
      });
    } else {
      removeKeys.forEach((k) => localStorage.removeItem(k));
      return true;
    }
  }

  async function saveSignature(dataUrl, metadata = {}, profileId = null) {
    const targetId = profileId || (await getActiveProfileId());
    const payload = {
      dataUrl,
      meta: Object.assign({ savedAt: new Date().toISOString() }, metadata)
    };
    const key = getSigKey(targetId);
    const toSave = { [key]: payload };

    if (targetId === 'profile_default') {
      toSave[STORAGE_KEY_SIGNATURE] = payload;
    }

    await storageSet(toSave);
    return payload;
  }

  async function getSignature(profileId = null) {
    const targetId = profileId || (await getActiveProfileId());
    const key = getSigKey(targetId);
    const data = await storageGet([key, STORAGE_KEY_SIGNATURE]);
    if (data[key] && data[key].dataUrl) {
      return data[key];
    }
    if (targetId === 'profile_default' && data[STORAGE_KEY_SIGNATURE] && data[STORAGE_KEY_SIGNATURE].dataUrl) {
      return data[STORAGE_KEY_SIGNATURE];
    }
    return null;
  }

  async function removeSignature(profileId = null) {
    const targetId = profileId || (await getActiveProfileId());
    const key = getSigKey(targetId);
    const removeKeys = [key];
    if (targetId === 'profile_default') {
      removeKeys.push(STORAGE_KEY_SIGNATURE);
    }
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.remove(removeKeys, () => resolve(true));
      });
    } else {
      removeKeys.forEach((k) => localStorage.removeItem(k));
      return true;
    }
  }

  return {
    getDefaultProfile,
    getProfiles,
    getActiveProfileId,
    setActiveProfileId,
    getProfile,
    saveProfile,
    createProfile,
    duplicateProfile,
    deleteProfile,
    renameProfile,
    resetProfile,
    exportEncryptedProfile,
    importEncryptedProfile,
    exportPlainProfile,
    importPlainProfile,
    savePhoto,
    getPhoto,
    removePhoto,
    saveSignature,
    getSignature,
    removeSignature
  };
});
