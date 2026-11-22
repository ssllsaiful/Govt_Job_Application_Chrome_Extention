# Comprehensive Testing Manual — Teletalk Job Autofill BD

This document provides a complete, step-by-step test matrix to verify all features, edge cases, security controls, and error-handling routines of the **Teletalk Job Application Autofill BD** extension.

---

## 🧪 Test Environment Setup

1. **Browser**: Google Chrome (version 100+), Brave, or Microsoft Edge.
2. **Directory**: `F:\github\jobapplication`
3. **Mock Test Form**: [`test_bcic_form.html`](file:///f:/github/jobapplication/test_bcic_form.html) (included in workspace).

---

## 📋 Test Matrix & Checklist

### 1. Installation & Manifest V3 Verification
- [ ] Open `chrome://extensions` in Google Chrome.
- [ ] Enable **Developer mode** (toggle in top-right corner).
- [ ] Click **Load unpacked** and choose `F:\github\jobapplication`.
- [ ] **Verification**:
  - The extension card appears with title **"Teletalk Job Application Autofill BD"** and version `1.0.0`.
  - Icon displays clearly (16px, 48px, 128px).
  - No red "Errors" badge appears on the extension card.
  - Inspect Background / Service Worker shows `background.js` running with zero runtime errors.

---

### 2. Candidate Profile Creation & Storage
- [ ] Click the extension icon in the toolbar, then click **✏️ Edit Profile** (or right-click -> Options).
- [ ] Complete the form with sample candidate data:
  - **Applicant's Name (English)**: `MD. TANVIR HOSSAIN`
  - **Applicant's Name (Bangla)**: `মো: তানভীর হোসেন`
  - **Father's Name (English)**: `MD. ALAM HOSSAIN`
  - **Father's Name (Bangla)**: `মো: আলম হোসেন`
  - **Mother's Name (English)**: `MST. NASIMA BEGUM`
  - **Mother's Name (Bangla)**: `মোছা: নাসিমা বেগম`
  - **Date of Birth**: `1998-05-15`
  - **Religion**: `Islam` | **Gender**: `Male` | **Nationality**: `Bangladeshi`
  - **National ID**: Available: `Yes`, Number: `19981234567890123`
  - **Birth Registration**: Available: `No`
  - **Passport**: Available: `No`
  - **Marital Status**: `Single`
  - **Mobile Number**: `01711223344`
  - **Confirm Mobile**: `01711223344`
  - **Email**: `tanvir.jobs@example.com`
  - **Present Address**:
    - Care Of: `MD. ALAM HOSSAIN`
    - Village/Road: `House 45, Road 2, Sector 11`
    - District: `Dhaka`
    - Upazila: `Uttara`
    - Post Office: `Uttara Model Town`
    - Post Code: `1230`
  - **Permanent Address**: Check `Same as Present Address`.
  - **SSC**: Exam: `S.S.C`, Roll: `112233`, Group: `Science`, Board: `Dhaka`, Result: `GPA(out of 5)`, GPA: `5.00`, Year: `2014`.
  - **HSC**: Exam: `H.S.C`, Roll: `445566`, Group: `Science`, Board: `Dhaka`, Result: `GPA(out of 5)`, GPA: `4.80`, Year: `2016`.
  - **Graduation**: Degree: `B.Sc in Chemistry`, University: `University of Dhaka`, Passing Year: `2021`, Result: `GPA(out of 4)`, CGPA: `3.65`, Duration: `4 Years`.
  - **Masters**: Unchecked.
- [ ] Click **💾 Save Profile**.
- [ ] **Verification**:
  - Green toast alert appears: *"Profile saved successfully! Ready to autofill."*
  - Reload the options page (`F5`) — confirm that every field correctly retains its saved value.

---

### 3. Testing Address Synchronization ("Same as Present Address")
- [ ] In the **Addresses** tab, ensure **"Same as Present Address"** is checked.
- [ ] Change `presentVillage` to `"House 99, Green Road"`.
- [ ] **Verification**:
  - `permanentVillage` immediately updates to `"House 99, Green Road"`.
  - Permanent address fields are dimmed to visually convey active synchronization.
- [ ] Uncheck **"Same as Present Address"**.
- [ ] Edit `permanentVillage` to `"Vill: Shibganj, Dist: Bogra"`.
- [ ] Save profile and reload to verify that independent permanent addresses are preserved.

---

### 4. BCIC Application Form Autofill (Live or Local Mock)
- [ ] Open [`test_bcic_form.html`](file:///f:/github/jobapplication/test_bcic_form.html) or a live circular (`http://bcic.teletalk.com.bd/.../application.php`).
- [ ] Click the extension action icon in the toolbar.
- [ ] **Verification Before Fill**:
  - Popup detects the page and indicates green: *"Teletalk Portal Detected"* / *"Application Form Ready"*.
  - Candidate's name is displayed in the active profile card.
  - The **⚡ Autofill Form** button is active.
- [ ] Click **⚡ Autofill Form**.
- [ ] **Verification After Fill**:
  - Applicant's Name (EN) filled: `MD. TANVIR HOSSAIN`
  - আবেদনকারীর নাম (বাংলায়) filled: `মো: তানভীর হোসেন`
  - Father's Name (EN & Bangla) filled.
  - Mother's Name (EN & Bangla) filled.
  - Date of Birth filled correctly without corrupting year/month order.
  - Nationality set to `Bangladeshi`.
  - Religion set to `Islam`.
  - Gender set to `Male`.
  - **National ID Dropdown**: set to `Yes`, and `nid_no` field is populated with `19981234567890123`.
  - **Birth Registration Dropdown**: set to `No`, and birth registration number is NOT filled into invalid inputs.
  - Present Address: Care of, Village, Post Office, and Post Code filled.
  - **Dependent Dropdown**: `present_district` selected -> Upazila options loaded -> `present_upazila` selected.
  - **Permanent Address**: Copied or checked as `Same as Present Address`.
  - **Academic Credentials**:
    - SSC: Exam, Roll, Group, Board, Result Type (`GPA(out of 5)`), GPA Score (`5.00`), Year (`2014`).
    - HSC: Exam, Roll, Group, Board, Result Type, GPA Score (`4.80`), Year (`2016`).
    - Graduation: Examination, University, Subject, Result, CGPA, and Duration.
  - Results panel in popup shows exact counts (e.g. `Filled: 28`, `Skipped: 0`, `Review: 0`).

---

### 5. Overwrite Protection Test
- [ ] Manually change the Applicant's Name on the form to `"MANUAL TEST USER"`.
- [ ] In the extension popup, leave **"Overwrite existing"** unchecked.
- [ ] Click **⚡ Autofill Form**.
- [ ] **Verification**:
  - The form input remains `"MANUAL TEST USER"`.
  - The results summary lists Applicant's Name under **Skipped** (`"Field already populated (overwrite disabled)"`).
- [ ] Check the **"Overwrite existing"** box in the popup and click **⚡ Autofill Form**.
- [ ] **Verification**:
  - The field is now updated to the candidate's saved name (`"MD. TANVIR HOSSAIN"`).

---

### 6. Verification of No Auto-Submission
- [ ] Look at the bottom of the form after autofill completes.
- [ ] **Verification**:
  - The page has NOT reloaded.
  - The form has NOT submitted automatically.
  - The CAPTCHA verification box is empty and untouched.
  - The submission button was never clicked by the extension.

---

### 7. Encrypted Backup Export & Import (Web Crypto API)
- [ ] In the extension options page, navigate to **🔐 Backup & Security**.
- [ ] Enter a test passphrase: `SecretPass123!`.
- [ ] Click **🔒 Export Encrypted Backup (.json)**.
- [ ] Open the downloaded `.json` file in a text editor.
- [ ] **Verification**:
  - The file contains `{ "format": "teletalk-autofill-vault", "encrypted": true, "kdf": "PBKDF2-SHA256", "iterations": 100000, "salt": "...", "iv": "...", "ciphertext": "..." }`.
  - **None** of the candidate's names, numbers, or addresses appear in plain text.
- [ ] Click **🗑️ Erase Stored Profile Data**, confirm with `"DELETE"`.
- [ ] Verify profile is blanked.
- [ ] Enter `SecretPass123!` in the passphrase box and click **🔓 Import Encrypted Backup**. Select the exported file.
- [ ] **Verification**:
  - Profile is restored to 100% of its original values.
- [ ] Test negative case: Enter an incorrect password like `WrongPassword` and attempt to import.
  - Verify error message: *"Decryption failed. Incorrect passphrase or corrupted file."*

---

### 8. Diagnostic Mode on Unknown / New Teletalk Pages
- [ ] Open any webpage or circular form.
- [ ] Open the extension popup and click **🔍 Inspect Fields**.
- [ ] **Verification**:
  - The diagnostics modal opens immediately.
  - Displays element index, tag (`<input>`, `<select>`), `id`, `name`, visible label text, and count of options.
  - Clicking **Copy JSON Report** copies the entire structured DOM dump to the clipboard.

---

### 9. Privacy & Network Security Inspection
- [ ] Open Chrome DevTools (`F12`), switch to the **Network** tab.
- [ ] Trigger an autofill operation, export a backup, and navigate through the options tabs.
- [ ] Filter by `Fetch/XHR`.
- [ ] **Verification**:
  - Zero network requests are initiated by the extension.
  - All operations run purely in-memory and in `chrome.storage.local`.

---

### 10. Passport Photo Editor (300 × 300 Pixels) Verification
- [ ] In the Options page, click on **🖼️ Photo & Sign** (now Tab 4 in the serial order) $\to$ **📸 Passport Photo Editor**.
- [ ] Upload a test portrait photograph (PNG, JPEG, or WebP) using the "Choose Photo" button or drag-and-drop.
- [ ] **Perspective Correction**:
  - Click **📐 Activate 4-Corner Pins**.
  - Drag the 4 corner pins (TL, TR, BR, BL) on a tilted photo. Notice the real-time magnifier loupe over each corner pin.
  - Click **✓ Straighten & Warping**: verify the perspective transform deskews the quadrilateral region into a straight rectangle.
- [ ] **Crop Tool**:
  - Click **✂️ Activate Crop Tool**.
  - Test aspect ratio presets: **1:1 Square (Passport)**, 3:4, 4:5, and Custom.
  - Resize and drag the crop rectangle. Click **✓ Apply Crop** and verify cropped canvas.
- [ ] **12 Color & Tone Adjustments**:
  - Click **✨ One-Click Auto-Enhance**: verify levels and clarity auto-balance.
  - Test sliders: Brightness, Contrast, Saturation, Exposure, Highlights, Shadows, Temperature (cool/warm), Tint, Gamma, Sharpness, Blur, Grayscale.
  - Click individual reset buttons (↺) and **Reset All**.
- [ ] **AI Background Removal & Replacement**:
  - Click **✨ AI Remove Background**: verify background separates and loading spinner appears.
  - Test background color chips: **White**, **BD Govt Light Blue (#d8ecf8)**, **Blue**, **Red**, **Light Gray**, and **Transparent**.
  - Test custom color picker and **Upload Custom BG Image**.
  - Test edge feathering, smoothing, and tolerance sliders.
  - Test **Erase BG** and **Restore FG** manual touch-up brushes on canvas.
- [ ] **Face Position & Passport Guidelines**:
  - Check **Show Passport Face Guidelines (ICAO / BD Standard)**: verify head oval, eye line, and chin line overlays appear on canvas.
  - Move crown margin and eye level sliders to test guidance alignment.
- [ ] **Export & Storage**:
  - Verify dimensions display: `300 × 300 px` and file size meter is under 100 KB.
  - Select JPEG/PNG/WebP and click **📥 Download Photo (300×300)**. Verify dimensions are exactly 300 × 300 px.
  - Click **💾 Save to Candidate Profile**: verify green toast confirms saving to local storage.

---

### 11. Signature Editor (300 × 80 Pixels) Verification
- [ ] Switch to **✍️ Signature Editor**.
- [ ] Upload a signature scan or angled phone photograph of a paper signature.
- [ ] **Perspective Correction**:
  - Click **📐 4-Corner Pins**. Drag corners around the tilted signature paper.
  - Click **✓ Straighten**: verify perspective distortion is corrected to a clean flat rectangle.
- [ ] **Crop Tool**:
  - Test crop with **300:80** ratio lock.
- [ ] **Ink Cleanup & Paper Filter**:
  - Toggle **Crisp B&W Paper Filter** on and adjust **Paper Threshold** and **Ink Density Boost**.
  - Test **Invert ink color** (if light signature on dark background).
- [ ] **Export & Storage**:
  - Verify target dimension badge and display show **300 × 80 px** (standard official format, max 60 KB).
  - Click **📥 Download Signature (300×80)**: verify exported image matches preview and file size is ≤ 60 KB.
  - Click **💾 Save to Candidate Profile**.

---

### 12. Saved Media Persistence & Management
- [ ] Switch to **📁 Saved Photos & Signatures**.
- [ ] **Verification**:
  - The Saved Photo card displays the 300 × 300 thumbnail with dimensions and file size.
  - The Saved Signature card displays the signature thumbnail.
  - Both cards show **Saved in Storage** status badges.
- [ ] Click **✏️ Edit in Photo Editor**:
  - Switches to Photo Editor subtab and re-renders the saved image.
- [ ] Close the options tab completely, then re-open it (`chrome-extension://.../options.html`).
- [ ] Navigate to **🖼️ Photo & Sign** $\to$ **Saved Photos & Signatures**:
  - Verify that both the photo and signature remain intact and ready for reuse across sessions.

