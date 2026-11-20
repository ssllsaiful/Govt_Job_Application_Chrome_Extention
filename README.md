# 🇧🇩 Govt Job Application Chrome Extension (Teletalk Autofill BD)

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension%20MV3-blue.svg?logo=googlechrome)](https://developer.chrome.com/docs/extensions/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Privacy: 100% Local](https://img.shields.io/badge/Privacy-100%25%20Offline%20Local-success.svg)](PRIVACY_POLICY.md)

An intelligent, privacy-first Google Chrome extension designed to eliminate repetitive typing on Bangladesh Government Job Recruitment portals (`*.teletalk.com.bd`). Fill complex multi-page government job applications in **1 click**, manage **multiple candidate profiles** directly on the webpage, and automatically upload resized **300×300 passport photos** and **300×80 signatures**!

---

## 🌟 Key Features

### ⚡ 1-Click Intelligent Form Filling
- **Complete Profile Coverage**: Fills English names, Bangla names (বাংলায়), father & mother names, Date of Birth, gender, religion, NID / Birth Reg / Passport, marital status, mobile, quota, and departmental status.
- **Address & Cascading Dropdowns**: Automatically selects **District**, waits for Ajax-loaded **Upazila/Thana** options, and selects the correct thana even with official database typos (e.g., `Sabujbhag` / `Sabujghag` / `Sabujbagdh`).
- **Educational History**: Autocompletes SSC, HSC, Diploma-in-Engineering, Graduation, and Masters details (Examination, Roll, Board, Group/Subject, Result GPA/CGPA, Passing Year, Course Duration).
- **Specialized Questions**: Detects and automatically answers questions such as *"Do you have Computer proficiency?"* with **Yes**.

### 👥 On-Page Multi-Candidate Profile Switcher
- Manage profiles for multiple candidates (e.g., family members, friends, clients).
- An interactive **floating widget** appears directly on the live application page:
  $$\text{[ 👤 miLLAT ▾ ]} \quad \text{[ ⚡ Autofill BD Job ]}$$
- Switch candidates directly on the application form with zero page reloads!

### 📸 Automatic Photo & Signature Upload (2nd Part / `preview.php`)
- Automatically injects candidate **Passport Photo (300×300 px)** and **Signature (300×80 px)** into HTML5 file inputs using browser `DataTransfer`.
- Displays instant live visual previews in the page's preview boxes.
- Automatically ticks the required declaration checkbox:  
  *“I declare that the information provided in this form are correct, true and complete...”*

### 🛠️ Built-in Photo & Signature Studio
- Built-in canvas editor tailored to official Teletalk recruitment requirements.
- Automatically crops, rotates, fine-tunes brightness/contrast, removes background, and exports strictly to **JPEG (.jpg)** within valid file sizes:
  - **Photo**: $300 \times 300\text{ px}$ (under $100\text{ KB}$, min $4\text{ KB}$)
  - **Signature**: $300 \times 80\text{ px}$ (under $60\text{ KB}$, min $3\text{ KB}$)

### 🔒 100% Private & Offline
- All candidate profiles, photos, and signatures are stored strictly on your local browser using `chrome.storage.local`.
- **Zero remote tracking, zero API keys, and zero third-party servers.**

---

## 🚀 How to Install in Chrome / Edge / Brave

You can install and use this extension immediately in Developer Mode:

### Step 1: Download or Clone this Repository
```bash
git clone https://github.com/ssllsaiful/Govt_Job_Application_Chrome_Extention.git
```
*(Or download the repository ZIP and extract it to a folder on your computer)*.

### Step 2: Open Extensions in Your Browser
- In **Google Chrome**, navigate to: `chrome://extensions`
- In **Microsoft Edge**, navigate to: `edge://extensions`
- In **Brave Browser**, navigate to: `brave://extensions`

### Step 3: Enable Developer Mode
Turn on the **Developer mode** toggle switch located in the top-right corner.

### Step 4: Load the Extension
1. Click the **Load unpacked** button in the top-left corner.
2. Select this project folder (`Govt_Job_Application_Chrome_Extention` / `f:\github\jobapplication`).
3. The extension **"Teletalk Job Application Autofill BD"** is now installed!
4. Click the puzzle icon in Chrome's top toolbar and **Pin (📌)** the extension.

---

## 📖 How to Use

### 1. Set Up Candidate Profiles
1. Click the extension icon in the toolbar and select **✏️ Edit Profile** (or right-click the icon and choose **Options**).
2. Fill in:
   - **Personal Info**: English Name, Bangla Name, Parents' names, DOB, Mobile, NID.
   - **Addresses**: Present & Permanent Address.
   - **Education**: SSC, HSC, Graduation, Masters.
   - **Other Qualifications**: Computer proficiency, typing speed.
   - **Photo & Sign**: Crop and save your $300 \times 300\text{ px}$ photo and $300 \times 80\text{ px}$ signature in JPEG format.
3. Click **💾 Save Profile**.
4. To add another person (e.g. Tareq or Millat), click **➕ New Profile** at the top.

### 2. Autofill Any Teletalk Job Form
1. Open any official Teletalk circular application form (e.g., `dmp.teletalk.com.bd`, `bcic.teletalk.com.bd`, `bcs.teletalk.com.bd`).
2. At the bottom-right corner of the page, you will see the floating widget:
   - Select your desired candidate from the dropdown (e.g., `miLLAT` or `MD. SAIFUL ISLAM`).
   - Click **⚡ Autofill BD Job**.
   - All fields will be populated accurately in seconds!
3. Review the data, solve the CAPTCHA, and click **Next / Submit**.
4. On the 2nd page (`preview.php`), click **📸 Upload Photo & Sign**:
   - Your official $300 \times 300$ photo and $300 \times 80$ signature will be attached automatically.
   - The declaration checkbox will be checked.
5. Click **Submit Application** to complete!

---

## 📂 Project Structure

```text
├── manifest.json              # Chrome Extension Manifest V3 configuration
├── background.js              # Background service worker
├── content.js                 # In-page floating widget & DOM communicator
├── autofill-engine.js         # Core autofill engine & cascading dropdown handler
├── site-mappings.js           # Portal selector mappings, regex & dropdown aliases
├── storage.js                 # Chrome local storage & AES-GCM vault manager
├── validation.js              # Bangladeshi phone, DOB, and language validators
├── bangladesh-data.js         # Bangladesh district and thana database
├── passport-photo-editor.js   # 300x300 & 300x80 canvas photo & signature editor
├── popup.html / .css / .js    # Quick action toolbar popup
├── options.html / .css / .js  # Master candidate profile manager dashboard
├── icons/                     # Extension branding icons (16, 48, 128 px)
├── PRIVACY_POLICY.md          # Chrome Web Store compliant privacy policy
└── README.md                  # Project documentation
```

---

## 🔒 Privacy Policy
We believe candidate privacy is non-negotiable. Please read our full [Privacy Policy](PRIVACY_POLICY.md). All candidate data remains 100% on your device.

---

## 👨‍💻 Author & Contributions
Developed with ❤️ for Bangladeshi job seekers.  
Contributions, bug reports, and pull requests are welcome!

- **GitHub:** [@ssllsaiful](https://github.com/ssllsaiful)
- **Repository:** [Govt_Job_Application_Chrome_Extention](https://github.com/ssllsaiful/Govt_Job_Application_Chrome_Extention)
