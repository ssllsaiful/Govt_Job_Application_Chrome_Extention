# Privacy Policy for Teletalk Job Application Autofill BD

**Effective Date:** November 20, 2026  
**Extension Name:** Teletalk Job Application Autofill BD  

---

## 1. Overview
"Teletalk Job Application Autofill BD" is an open-source productivity browser extension built to assist Bangladeshi job candidates in quickly filling official government recruitment application forms hosted on Teletalk portals (`*.teletalk.com.bd`).

Your privacy is our utmost priority. This extension is designed with a **100% offline-first, local-only architecture**. We do not collect, transmit, store, sell, or monitor any personal user data on external servers.

---

## 2. Information We Handle
To provide form autofill functionality, the extension allows users to voluntarily save candidate profile details on their own device:
- **Personal Information:** Name (English and Bangla), Parents' names, Date of Birth, Gender, Religion, National ID / Birth Registration / Passport number, Marital status, Contact number, Email.
- **Address Information:** Present and Permanent addresses (Care of, Village/Road, District, Upazila/Thana, Post Office, Post Code).
- **Educational Qualifications:** Examination name, Roll number, Board, Subject/Group, Result/GPA, Passing Year.
- **Candidate Media:** Resized passport photo (300×300 px) and signature (300×80 px).

### Where is this data stored?
All profile data, photos, and signatures are stored **exclusively within your local browser's storage** using the standard Chrome Storage API (`chrome.storage.local`). The data never leaves your computer and is never transmitted over the internet to any developer or third-party server.

---

## 3. Permissions Justification
The extension requests only the minimum permissions required to perform its functions:
- `storage`: To save and retrieve candidate profiles locally on your computer.
- `unlimitedStorage`: To enable saving candidate photos and signatures without hitting default storage size quotas.
- `activeTab` & `scripting`: To detect whether the currently active tab is an official Teletalk circular page and inject form values upon user command.
- Host permissions (`*://*.teletalk.com.bd/*`): Strictly limited to official Bangladesh government recruitment portals powered by Teletalk. The extension does not interact with any other websites.

---

## 4. Third-Party Sharing and Analytics
- **No Third-Party Analytics:** We do not use Google Analytics, tracking pixels, or any telemetry tools.
- **No Remote Servers:** We do not operate remote databases or APIs.
- **No Data Monetization:** We never sell, rent, trade, or monetize user data under any circumstances.

---

## 5. User Control and Data Deletion
- Users can view, edit, switch, or permanently delete candidate profiles at any time directly through the extension's **Options** dashboard.
- Clicking **"Reset Profile Data"** or uninstalling the extension immediately purges all saved data and images from your local device.

---

## 6. Contact
If you have any questions or feedback regarding this Privacy Policy, please open an issue on the official GitHub repository:
- **GitHub Repository:** https://github.com/
