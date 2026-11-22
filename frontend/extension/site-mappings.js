/**
 * site-mappings.js - Configurable Teletalk Portal Field Mappings & Aliases
 * 
 * Provides explicit field selectors, label patterns, dropdown aliases, and
 * dependent-dropdown workflows for Bangladesh government recruitment portals.
 * Subdomains like bcic.teletalk.com.bd, bcs.teletalk.com.bd, bogmc.teletalk.com.bd,
 * and generic Teletalk portals can be extended or tweaked here without touching
 * the autofill engine.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SiteMappings = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Normalizes strings for comparison: lowercase, collapses spaces,
   * strips punctuation and dashes.
   * @param {string} str
   * @returns {string}
   */
  function normalize(str) {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .replace(/[\s\.\-_,\(\)\[\]\/\:\'\"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Dropdown value and text aliases mapping canonical profile values to
   * possible option texts or values seen across different Teletalk forms.
   */
  const DROPDOWN_ALIASES = {
    // Yes / No options for document availability (NID, Birth Reg, Passport)
    yesNo: {
      yes: ['yes', 'y', '1', 'true', 'হ্যাঁ', 'আছে', 'applicable'],
      no: ['no', 'n', '0', 'false', 'না', 'নাই', 'not applicable']
    },

    // Nationality
    nationality: {
      bangladeshi: ['bangladeshi', 'bd', 'bangladesh', 'বাংলাদেশী', 'বাংলাদেশি']
    },

    // Religion
    religion: {
      islam: ['islam', 'muslim', 'ইসলাম'],
      hinduism: ['hinduism', 'hindu', 'সনাতন', 'হিন্দু'],
      buddhism: ['buddhism', 'buddhist', 'বৌদ্ধ'],
      christianity: ['christianity', 'christian', 'খ্রিস্টান', 'খ্রিষ্টান'],
      others: ['others', 'other', 'অন্যান্য']
    },

    // Gender
    gender: {
      male: ['male', 'm', 'পুরুষ', '1'],
      female: ['female', 'f', 'মহিলা', 'নারী', '2'],
      others: ['others', 'other', 'অন্যান্য', 'third gender', 'hijra', '3']
    },

    // Marital Status
    maritalStatus: {
      single: ['single', 'unmarried', 'অবিবাহিত', '1'],
      married: ['married', 'বিবাহিত', '2'],
      divorced: ['divorced', 'তালাকপ্রাপ্ত', '3'],
      widowed: ['widowed', 'widow', 'widower', 'বিধবা', 'বিপত্নীক', '4']
    },

    // Quota
    quota: {
      'not applicable': [
        'not applicable', 'non-quota', 'non quota', 'general', 'সাধারণ', 'none', 'no quota', 'নাই', '8', 'na', 'n/a'
      ],
      'child of freedom fighter': [
        'child of freedom fighter', 'freedom fighter', 'child/grandchild of ff', 'মুক্তিযোদ্ধার সন্তান', 'মুক্তিযোদ্ধা', '1'
      ],
      'child of martyred freedom fighter': [
        'child of martyred freedom fighter', 'martyred freedom fighter', 'শহীদ মুক্তিযোদ্ধার সন্তান', '2'
      ],
      'child of war heroine (birangana)': [
        'child of war heroine (birangana)', 'child of war heroine', 'birangana', 'বীরাঙ্গনার সন্তান', 'বীরাঙ্গনা', '3'
      ],
      'physically challenged': [
        'physically challenged', 'physically handicapped', 'disabled', 'প্রতিবন্ধী', '4'
      ],
      'ethnic minority': [
        'ethnic minority', 'tribal', 'ক্ষুদ্র নৃ-গোষ্ঠী', 'উপজাতি', '6'
      ],
      'third gender': [
        'third gender', 'hijra', 'তৃতীয় লিঙ্গ', 'হিজড়া', '7'
      ],
      'orphan': ['orphan', 'এতিম'],
      'female': ['female', 'নারী কোটা', 'মহিলা কোটা'],
      'ansar-vdp': ['ansar-vdp', 'ansar & vdp', 'ansar', 'আনসার ও ভিডিপি']
    },

    // Departmental Status
    departmentalStatus: {
      'none': ['none', 'not applicable', 'na', 'নাই', 'সাধারণ', 'open'],
      'govt. employee': ['govt. employee', 'government employee', 'সরকারি কর্মচারী', 'govt'],
      'semi-govt. employee': ['semi-govt. employee', 'semi govt', 'আধা-সরকারি'],
      'autonomous': ['autonomous', 'স্বায়ত্তশাসিত'],
      'departmental candidate': ['departmental candidate', 'departmental', 'বিভাগীয় প্রার্থী']
    },

    // Education Boards
    board: {
      dhaka: ['dhaka', 'ঢাকা'],
      rajshahi: ['rajshahi', 'রাজশাহী'],
      comilla: ['comilla', 'কুমিল্লা'],
      jessore: ['jessore', 'যশোর'],
      chittagong: ['chittagong', 'chattogram', 'চট্টগ্রাম'],
      barisal: ['barisal', 'বরিশাল'],
      sylhet: ['sylhet', 'সিলেট'],
      dinajpur: ['dinajpur', 'দিনাজপুর'],
      mymensingh: ['mymensingh', 'ময়মনসিংহ'],
      madrasah: ['madrasah', 'madrasa', 'মাদ্রাসা', 'bmeb'],
      technical: ['technical', 'কারিগরি', 'bteb'],
      cambridge: ['cambridge', 'igcse'],
      edexcel: ['edexcel'],
      others: ['others', 'other', 'অন্যান্য']
    },

    // Examination Groups / Disciplines / Diploma Technologies
    group: {
      science: ['science', 'বিজ্ঞান'],
      humanities: ['humanities', 'arts', 'মানবিক'],
      'business studies': ['business studies', 'commerce', 'ব্যবসায় শিক্ষা', 'ব্যবসা শিক্ষা', 'business management', 'bm'],
      vocational: ['vocational', 'ভোকেশনাল'],
      general: ['general', 'সাধারণ'],
      // BTEB Diploma in Engineering Technologies
      'computer technology': ['computer technology', 'computer', 'computer science', 'computer science & technology', 'computer science and technology', 'cst', 'computer science & engineering', 'cse'],
      'civil technology': ['civil technology', 'civil', 'civil engineering'],
      'electrical technology': ['electrical technology', 'electrical', 'electrical engineering', 'electrical & electronic engineering', 'eee'],
      'mechanical technology': ['mechanical technology', 'mechanical', 'mechanical engineering'],
      'electronics technology': ['electronics technology', 'electronics', 'electronic', 'ete'],
      'telecommunication technology': ['telecommunication technology', 'telecommunication', 'telecom', 'telecommunication engineering'],
      'power technology': ['power technology', 'power'],
      'architecture technology': ['architecture technology', 'architecture'],
      'automobile technology': ['automobile technology', 'automobile', 'auto'],
      'chemical technology': ['chemical technology', 'chemical'],
      'food technology': ['food technology', 'food'],
      'environmental technology': ['environmental technology', 'environmental'],
      'mechatronics technology': ['mechatronics technology', 'mechatronics'],
      'electro-medical technology': ['electro-medical technology', 'electro-medical', 'electromedical'],
      'graphic arts technology': ['graphic arts technology', 'graphic arts', 'graphics'],
      'surveying technology': ['surveying technology', 'survey', 'surveying'],
      'refrigeration and air conditioning': ['refrigeration and air conditioning', 'rac', 'refrigeration & air conditioning'],
      'textile engineering / technology': ['textile engineering / technology', 'textile technology', 'textile engineering', 'textile'],
      'marine technology': ['marine technology', 'marine'],
      'shipbuilding technology': ['shipbuilding technology', 'shipbuilding'],
      'construction technology': ['construction technology', 'construction'],
      others: ['others', 'other', 'অন্যান্য']
    },

    // Graduation & Postgraduate Degrees
    degree: {
      'b.sc engineering': [
        'b.sc engineering', 'b.sc. engineering', 'b.sc in engineering', 'b.sc (engg)', 'b.sc.(engg)',
        'b.sc in computer science & engineering', 'b.sc in computer science & engineering',
        'b.sc in computer science and engineering', 'bachelor of science in engineering',
        'bachelor of science in computer science and engineering', 'b.sc in cse', 'b.sc engineering / cse',
        'bsc engg', 'bsc engineering', 'b.sc in eee', 'b.sc in electrical & electronic engineering',
        'b.sc in civil engineering', 'b.sc in mechanical engineering', 'b.sc in textile engineering'
      ],
      'b.sc (honours)': [
        'b.sc (honours)', 'b.sc honours', 'b.sc. (honours)', 'bachelor of science (honours)',
        'b.sc (hons)', 'bsc hons', 'b.sc', 'b.sc.', 'bsc', 'bachelor of science'
      ],
      'b.sc (pass)': ['b.sc (pass)', 'b.sc pass', 'b.sc. (pass)', 'bachelor of science (pass)'],
      'b.a (honours)': [
        'b.a (honours)', 'b.a honours', 'b.a. (honours)', 'bachelor of arts (honours)',
        'b.a (hons)', 'ba hons', 'b.a', 'b.a.', 'ba', 'bachelor of arts'
      ],
      'b.a (pass)': ['b.a (pass)', 'b.a pass', 'b.a. (pass)', 'bachelor of arts (pass)'],
      'b.b.a': [
        'b.b.a', 'bba', 'b.b.a (honours)', 'b.b.a honours', 'bachelor of business administration',
        'bba (honours)', 'b.b.a (bachelor of business administration)'
      ],
      'b.com (honours)': [
        'b.com (honours)', 'b.com honours', 'b.com. (honours)', 'bachelor of commerce (honours)',
        'b.com', 'bcom', 'bachelor of commerce'
      ],
      'b.com (pass)': ['b.com (pass)', 'b.com pass', 'b.com. (pass)', 'bachelor of commerce (pass)'],
      'b.s.s (honours)': [
        'b.s.s (honours)', 'b.s.s honours', 'b.s.s. (honours)', 'bachelor of social science (honours)',
        'b.s.s', 'bss', 'bachelor of social science'
      ],
      'b.s.s (pass)': ['b.s.s (pass)', 'b.s.s pass', 'b.s.s. (pass)', 'bachelor of social science (pass)'],
      'll.b (honours)': ['ll.b (honours)', 'll.b honours', 'llb honours', 'll.b', 'llb', 'bachelor of laws'],
      'll.b (pass)': ['ll.b (pass)', 'll.b pass', 'llb pass'],
      'mbbs': ['mbbs', 'm.b.b.s', 'm.b.b.s.', 'bachelor of medicine & bachelor of surgery'],
      'bds': ['bds', 'b.d.s', 'bachelor of dental surgery'],
      'b.pharm': ['b.pharm', 'b.pharm (honours)', 'b.pharm honours', 'bachelor of pharmacy'],
      'b.arch': ['b.arch', 'b.arch (bachelor of architecture)', 'bachelor of architecture'],
      'fazil': ['fazil', 'fazil (honours)', 'fazil (pass)', 'fazil pass', 'fazil honours'],
      'others': ['others', 'other', 'equivalent', 'অন্যান্য']
    },

    // Graduation & Postgraduate Major Subjects
    subject: {
      'computer science & engineering': [
        'computer science & engineering', 'computer science and engineering', 'computer science & engineering',
        'computer science', 'computer science & tech', 'computer science & information technology', 'cse',
        'computing', 'software engineering', 'information & communication technology (ict)', 'information & communication technology',
        'information and communication technology', 'ict', 'computer engineering'
      ],
      'electrical & electronic engineering': [
        'electrical & electronic engineering', 'electrical and electronic engineering',
        'electrical & electronic engineering (eee)', 'electrical engineering', 'electronics engineering', 'eee'
      ],
      'civil engineering': ['civil engineering', 'civil', 'civil & environmental engineering'],
      'mechanical engineering': ['mechanical engineering', 'mechanical'],
      'textile engineering': ['textile engineering', 'textile technology', 'textile'],
      'business administration': [
        'business administration', 'marketing', 'finance', 'accounting', 'management',
        'human resource management', 'hrm', 'banking', 'international business', 'finance & banking',
        'accounting & information systems', 'ais'
      ],
      'english': ['english', 'english language', 'english literature', 'english language & literature'],
      'bangla': ['bangla', 'bengali', 'bangla language & literature'],
      'economics': ['economics'],
      'physics': ['physics', 'applied physics', 'applied physics & electronics'],
      'chemistry': ['chemistry', 'applied chemistry', 'applied chemistry & chemical engineering'],
      'mathematics': ['mathematics', 'applied mathematics', 'math'],
      'statistics': ['statistics'],
      'others': ['others', 'other', 'general', 'অন্যান্য']
    },

    // Result Types (Scale & Division)
    resultType: {
      'gpa(out of 5)': [
        'gpa(out of 5)', 'gpa (out of 5)', 'gpa out of 5', 'out of 5', 'gpa 5', 'scale 5',
        'gpa (out of 5.00)', 'gpa(out of 5.00)', '5.00', '5.0', '5'
      ],
      'gpa(out of 4)': [
        'gpa(out of 4)', 'gpa (out of 4)', 'gpa out of 4', 'out of 4', 'cgpa 4', 'scale 4',
        'gpa (out of 4.00)', 'gpa(out of 4.00)', 'gpa (out of 4.0)', 'cgpa (out of 4.00)', 'cgpa (out of 4)',
        'cgpa', 'grade', 'grade/cgpa', 'gpa/cgpa', '4.00', '4.0', '4'
      ],
      'first division': [
        'first division', '1st division', 'প্রথম বিভাগ', 'first class', '1st class',
        '1st class / division', '1st class/division', 'প্রথম শ্রেণী', '১ম শ্রেণী'
      ],
      'second division': [
        'second division', '2nd division', 'দ্বিতীয় বিভাগ', '2nd class', 'second class',
        '2nd class / division', '2nd class/division', 'দ্বিতীয় শ্রেণী', '২য় শ্রেণী'
      ],
      'third division': [
        'third division', '3rd division', 'তৃতীয় বিভাগ', '3rd class', 'third class',
        '3rd class / division', '3rd class/division', 'তৃতীয় শ্রেণী', '৩য় শ্রেণী'
      ],
      'passed': ['passed', 'pass', 'কৃতকার্য']
    },

    // Course Duration
    duration: {
      '1 year': ['1 year', '1', 'one year', '১ বছর'],
      '2 years': ['2 years', '2', 'two years', '২ বছর'],
      '3 years': ['3 years', '3', 'three years', '৩ বছর'],
      '4 years': ['4 years', '4', 'four years', '৪ বছর'],
      '5 years': ['5 years', '5', 'five years', '৫ বছর']
    },

    // Upazila / Thana variations and known portal misspellings (e.g. SABUJGHAG, SABUJBAGDH)
    upazila: {
      'sabujbagh': [
        'sabujbagh', 'sabujbag', 'sabujghag', 'sabujbagdh', 'sabujbhag', 'sobujbag', 'sobujbagh',
        'sabuj bagh', 'sabuj bag', 'sabujghag thana', 'sabujbag thana', 'সবুজবাগ'
      ],
      'motijheel': ['motijheel', 'motijhil', 'matijheel', 'matijhil', 'motijheel thana', 'মতিঝিল'],
      'shahbagh': ['shahbagh', 'shahbag', 'shah bagh', 'sahbag', 'shahbag thana', 'শাহবাগ'],
      'kotwali': ['kotwali', 'kotowali', 'kotwali/chawkbazar', 'chawkbazar', 'কোতোয়ালী'],
      'bimanbandar': ['bimanbandar', 'biman bandar', 'airport', 'bimanbandar/airport', 'বিমানবন্দর'],
      'uttarakhan': ['uttarakhan', 'uttara khan', 'উত্তরাখান'],
      'uttarbadda': ['uttarbadda', 'uttar badda', 'badda', 'বাড্ডা'],
      'dakkhinkhan': ['dakkhinkhan', 'dakkhin khan', 'dakshinkhan', 'dakshin khan', 'দক্ষিণখান'],
      'tejgaon': ['tejgaon', 'tejgaon ind area', 'tejgaon industrial area', 'tejgaon shilpanchal', 'তেজগাঁও'],
      'cantonment': ['cantonment', 'dhaka cantonment', 'cant', 'ক্যান্টনমেন্ট'],
      'kafrul': ['kafrul', 'kafrul thana', 'কাফরুল'],
      'darussalam': ['darussalam', 'darus salam', 'dar-us-salam', 'দারুসসালাম'],
      'bhasantek': ['bhasantek', 'bhashantek', 'ভাসানটেক'],
      'bhatara': ['bhatara', 'vatara', 'ভাটারা'],
      'kadamtali': ['kadamtali', 'kadomtoli', 'shampur/kadamtali', 'কদমতলী'],
      'shyampur': ['shyampur', 'shampur', 'শ্যামপুর'],
      'adabor': ['adabor', 'adabar', 'আদাবর'],
      'sher-e-bangla nagar': ['sher-e-bangla nagar', 'sherebanglanagar', 'sher-e-banglanagar', 'শেরেবাংলা নগর']
    }
  };

  /**
   * Generic Teletalk portal selector definitions and label aliases.
   * Serves as the primary baseline for any *.teletalk.com.bd site.
   */
  const GENERIC_TELETALK_MAPPING = {
    id: 'generic_teletalk',
    name: 'Generic Teletalk Application Portal',
    urlPattern: '.*\\.teletalk\\.com\\.bd.*',

    // Preferred selectors for fields. Will probe these before falling back to label heuristics.
    selectors: {
      // Personal
      fullName: [
        'input[name="name"]',
        'input[name="applicant_name"]',
        'input[name="txtApplicantName"]',
        '#name',
        '#applicant_name'
      ],
      fullNameBn: [
        'input[name="name_bn"]',
        'input[name="applicant_name_bn"]',
        'input[name="txtApplicantNameBn"]',
        'input[placeholder*="আবেদনকারীর নাম"]',
        '#name_bn',
        '#applicant_name_bn'
      ],
      fatherName: [
        'input[name="father_name"]',
        'input[name="father"]',
        'input[name="txtFatherName"]',
        '#father_name',
        '#father'
      ],
      fatherNameBn: [
        'input[name="father_name_bn"]',
        'input[name="father_bn"]',
        'input[name="txtFatherNameBn"]',
        'input[placeholder*="পিতার নাম"]',
        '#father_name_bn',
        '#father_bn'
      ],
      motherName: [
        'input[name="mother_name"]',
        'input[name="mother"]',
        'input[name="txtMotherName"]',
        '#mother_name',
        '#mother'
      ],
      motherNameBn: [
        'input[name="mother_name_bn"]',
        'input[name="mother_bn"]',
        'input[name="txtMotherNameBn"]',
        'input[placeholder*="মাতার নাম"]',
        '#mother_name_bn',
        '#mother_bn'
      ],
      dob: [
        'input[name="dob"]',
        'input[name="birth_date"]',
        'input[name="date_of_birth"]',
        'input[name="applicant_dob"]',
        'input[type="date"]',
        '#dob',
        '#birth_date',
        '#applicant_dob'
      ],
      dobDay: [
        'select[name="dob_day"]',
        '#dob_day',
        'select[name="day"]',
        '#day',
        'select[name="b_day"]',
        '#b_day',
        'select[name="birth_day"]',
        '#birth_day',
        'select[name="dob_d"]',
        '#dob_d'
      ],
      dobMonth: [
        'select[name="dob_month"]',
        '#dob_month',
        'select[name="month"]',
        '#month',
        'select[name="b_month"]',
        '#b_month',
        'select[name="birth_month"]',
        '#birth_month',
        'select[name="dob_m"]',
        '#dob_m'
      ],
      dobYear: [
        'select[name="dob_year"]',
        '#dob_year',
        'select[name="year"]',
        '#year',
        'select[name="b_year"]',
        '#b_year',
        'select[name="birth_year"]',
        '#birth_year',
        'select[name="dob_y"]',
        '#dob_y'
      ],
      nationality: ['select[name="nationality"]', '#nationality'],
      religion: ['select[name="religion"]', '#religion'],
      gender: ['select[name="gender"]', '#gender'],

      // Document Availability Selects
      nidAvailable: ['select[name="nid"]', 'select[name="nid_status"]', '#nid'],
      nidNumber: ['input[name="nid_no"]', 'input[name="nid_number"]', '#nid_no', '#nid_number'],
      birthRegAvailable: ['select[name="breg"]', 'select[name="birth_reg"]', '#breg'],
      birthRegNumber: ['input[name="breg_no"]', 'input[name="birth_reg_no"]', '#breg_no'],
      passportAvailable: ['select[name="passport"]', 'select[name="passport_status"]', '#passport'],
      passportNumber: ['input[name="passport_no"]', 'input[name="passport_number"]', '#passport_no'],

      maritalStatus: ['select[name="marital_status"]', '#marital_status'],
      spouseName: ['input[name="spouse_name"]', '#spouse_name'],
      mobile: ['input[name="mobile"]', 'input[name="phone"]', '#mobile', '#phone'],
      confirmMobile: ['input[name="confirm_mobile"]', 'input[name="mobile_confirm"]', '#confirm_mobile'],
      email: ['input[name="email"]', 'input[type="email"]', '#email'],
      quota: ['select[name="quota"]', '#quota'],
      departmentalStatus: ['select[name="dept_status"]', 'select[name="dep_status"]', '#dept_status', '#dep_status'],

      // Present Address
      presentCareOf: ['input[name="present_care"]', 'input[name="present_careof"]', '#present_care', '#present_careof'],
      presentVillage: ['input[name="present_village"]', 'input[name="present_address"]', '#present_village', '#present_address'],
      presentDistrict: ['select[name="present_district"]', '#present_district'],
      presentUpazila: [
        'select[name="present_upazila"]', 'select[name="present_thana"]', 'select[name="present_ps"]',
        '#present_upazila', '#present_thana', '#present_ps'
      ],
      presentPostOffice: ['input[name="present_post"]', '#present_post'],
      presentPostCode: ['input[name="present_pcode"]', 'input[name="present_postcode"]', '#present_pcode', '#present_postcode'],

      // Permanent Address
      sameAsPresentCheckbox: [
        'input[name="same_as_present"]',
        'input[name="same_address"]',
        '#same_as_present',
        '#same_address'
      ],
      permanentCareOf: ['input[name="permanent_care"]', 'input[name="permanent_careof"]', '#permanent_care', '#permanent_careof'],
      permanentVillage: ['input[name="permanent_village"]', 'input[name="permanent_address"]', '#permanent_village', '#permanent_address'],
      permanentDistrict: ['select[name="permanent_district"]', '#permanent_district'],
      permanentUpazila: [
        'select[name="permanent_upazila"]', 'select[name="permanent_thana"]', 'select[name="permanent_ps"]',
        '#permanent_upazila', '#permanent_thana', '#permanent_ps'
      ],
      permanentPostOffice: ['input[name="permanent_post"]', '#permanent_post'],
      permanentPostCode: ['input[name="permanent_pcode"]', 'input[name="permanent_postcode"]', '#permanent_pcode', '#permanent_postcode'],

      // SSC
      sscExam: ['select[name="ssc_exam"]', '#ssc_exam'],
      sscRoll: ['input[name="ssc_roll"]', '#ssc_roll'],
      sscGroup: ['select[name="ssc_group"]', '#ssc_group'],
      sscBoard: ['select[name="ssc_board"]', '#ssc_board'],
      sscResultType: ['select[name="ssc_result"]', 'select[name="ssc_result_type"]', '#ssc_result', '#ssc_result_type'],
      sscResultMarks: [
        'input[name="ssc_gpa"]', 'input[name="ssc_result_marks"]', 'input[name="ssc_result_gpa"]',
        'input[name="ssc_point"]', 'input[name="ssc_marks"]', 'input[name="txt_ssc_gpa"]',
        'input[name="txt_gpa_ssc"]', '#ssc_gpa', '#ssc_result_marks', '#ssc_result_gpa', '#ssc_point'
      ],
      sscPassingYear: ['select[name="ssc_year"]', '#ssc_year'],

      // HSC
      hscExam: ['select[name="hsc_exam"]', '#hsc_exam'],
      hscRoll: ['input[name="hsc_roll"]', '#hsc_roll'],
      hscGroup: ['select[name="hsc_group"]', '#hsc_group'],
      hscBoard: ['select[name="hsc_board"]', '#hsc_board'],
      hscResultType: ['select[name="hsc_result"]', 'select[name="hsc_result_type"]', '#hsc_result', '#hsc_result_type'],
      hscResultMarks: [
        'input[name="hsc_gpa"]', 'input[name="hsc_result_marks"]', 'input[name="hsc_result_gpa"]',
        'input[name="hsc_point"]', 'input[name="hsc_marks"]', 'input[name="txt_hsc_gpa"]',
        'input[name="txt_gpa_hsc"]', '#hsc_gpa', '#hsc_result_marks', '#hsc_result_gpa', '#hsc_point'
      ],
      hscPassingYear: ['select[name="hsc_year"]', '#hsc_year'],

      // Graduation
      graExam: ['select[name="gra_exam"]', 'select[name="gra_examination"]', 'select[name="graduation_exam"]', '#gra_exam', '#gra_examination'],
      graInstitute: ['select[name="gra_institute"]', 'input[name="gra_institute"]', '#gra_institute'],
      graPassingYear: ['select[name="gra_year"]', '#gra_year'],
      graSubject: [
        'select[name="gra_subject"]', 'input[name="gra_subject"]', 'select[name="gra_subject_name"]',
        'select[name="gra_discipline"]', 'input[name="gra_discipline"]', '#gra_subject', '#gra_discipline'
      ],
      graResultType: [
        'select[name="gra_result"]', 'select[name="gra_result_type"]', 'select[name="gra_res"]',
        'select[name="graduation_result"]', 'select[name="gra_class"]', '#gra_result', '#gra_result_type', '#gra_res'
      ],
      graResultMarks: [
        'input[name="gra_gpa"]', 'input[name="gra_cgpa"]', 'input[name="gra_result_marks"]',
        'input[name="gra_result_gpa"]', 'input[name="gra_point"]', 'input[name="gra_marks"]',
        'input[name="txt_gra_gpa"]', '#gra_gpa', '#gra_cgpa', '#gra_result_marks', '#gra_result_gpa', '#gra_point'
      ],
      graDuration: ['select[name="gra_duration"]', '#gra_duration'],

      // Masters (Optional)
      masApplicable: ['input[name="mas_applicable"]', 'input[name="master_applicable"]', '#mas_applicable'],
      masExam: ['select[name="mas_exam"]', 'select[name="mas_examination"]', '#mas_exam', '#mas_examination'],
      masInstitute: ['select[name="mas_institute"]', 'input[name="mas_institute"]', '#mas_institute'],
      masPassingYear: ['select[name="mas_year"]', '#mas_year'],
      masSubject: [
        'select[name="mas_subject"]', 'input[name="mas_subject"]', 'select[name="mas_discipline"]',
        'input[name="mas_discipline"]', '#mas_subject', '#mas_discipline'
      ],
      masResultType: [
        'select[name="mas_result"]', 'select[name="mas_result_type"]', 'select[name="mas_res"]',
        'select[name="masters_result"]', '#mas_result', '#mas_result_type'
      ],
      masResultMarks: [
        'input[name="mas_gpa"]', 'input[name="mas_cgpa"]', 'input[name="mas_result_marks"]',
        'input[name="mas_result_gpa"]', 'input[name="mas_point"]', '#mas_gpa', '#mas_cgpa', '#mas_result_marks'
      ],
      masDuration: ['select[name="mas_duration"]', '#mas_duration'],

      // Other Qualifications & Experience
      computerProficiency: [
        'select[name="computer_exp"]',
        'select[name="computer_proficiency"]',
        'select[name="computer"]',
        'select[name="exp_computer"]',
        'select[name="com_proficiency"]',
        'select[name="is_computer"]',
        'select[name="opt_computer"]',
        'select[name="computer_knowledge"]',
        'select[name*="computer"]',
        '#computer_exp',
        '#computer_proficiency',
        '#computer'
      ],
      computerTypingSpeed: [
        'select[name="typing_speed"]',
        'select[name="computer_typing"]',
        'select[name="typing_exp"]',
        'select[name="typing"]',
        'select[name*="typing"]',
        '#typing_speed',
        '#computer_typing'
      ],
      drivingLicense: [
        'select[name="driving_license"]',
        'select[name="driving"]',
        '#driving_license'
      ],

      // Photo, Signature & Final Declaration
      photoFile: [
        'input[type="file"][name="photo"]',
        'input[type="file"][name="picture"]',
        'input[type="file"][name="image"]',
        'input[type="file"][id*="photo"]',
        'input[type="file"][id*="picture"]',
        '#photo',
        '#photo_file'
      ],
      signatureFile: [
        'input[type="file"][name="signature"]',
        'input[type="file"][name="sign"]',
        'input[type="file"][id*="signature"]',
        'input[type="file"][id*="sign"]',
        '#signature',
        '#signature_file',
        '#sign'
      ],
      declarationCheckbox: [
        'input[type="checkbox"][name="declaration"]',
        'input[type="checkbox"][name="info_yes"]',
        'input[type="checkbox"][name="check_submit"]',
        'input[type="checkbox"][id*="declaration"]',
        'input[type="checkbox"]'
      ]
    },

    // Dependent dropdown triggers & workflows
    dependentRules: [
      {
        triggerField: 'presentDistrict',
        targetField: 'presentUpazila',
        delayMs: 600,
        description: 'Changing Present District triggers Ajax loading of Upazila options.'
      },
      {
        triggerField: 'permanentDistrict',
        targetField: 'permanentUpazila',
        delayMs: 600,
        description: 'Changing Permanent District triggers Ajax loading of Upazila options.'
      },
      {
        triggerField: 'hscExam',
        targetField: 'hscGroup',
        delayMs: 400,
        description: 'Changing HSC Exam (e.g. Diploma in Engineering) triggers dynamic updating of Group/Technology options.'
      },
      {
        triggerField: 'graExam',
        targetField: 'graSubject',
        delayMs: 400,
        description: 'Changing Graduation Exam triggers dynamic updating of Subject/Degree options.'
      },
      {
        triggerField: 'nidAvailable',
        targetField: 'nidNumber',
        conditionValue: 'Yes',
        delayMs: 200,
        description: 'Selecting National ID: Yes enables or reveals the NID Number field.'
      },
      {
        triggerField: 'birthRegAvailable',
        targetField: 'birthRegNumber',
        conditionValue: 'Yes',
        delayMs: 200,
        description: 'Selecting Birth Registration: Yes enables or reveals Birth Reg Number field.'
      },
      {
        triggerField: 'passportAvailable',
        targetField: 'passportNumber',
        conditionValue: 'Yes',
        delayMs: 200,
        description: 'Selecting Passport ID: Yes enables or reveals Passport Number field.'
      },
      {
        triggerField: 'sscResultType',
        targetField: 'sscResultMarks',
        conditionValue: 'gpa',
        delayMs: 200,
        description: 'Selecting GPA for SSC reveals the numeric GPA score input box.'
      },
      {
        triggerField: 'hscResultType',
        targetField: 'hscResultMarks',
        conditionValue: 'gpa',
        delayMs: 200,
        description: 'Selecting GPA for HSC reveals the numeric GPA score input box.'
      },
      {
        triggerField: 'graResultType',
        targetField: 'graResultMarks',
        conditionValue: 'gpa',
        delayMs: 200,
        description: 'Selecting GPA for Graduation reveals numeric CGPA input box.'
      }
    ]
  };

  /**
   * BCIC Specific Mapping
   * Tailored for http://bcic.teletalk.com.bd/{circular_id}/application.php
   */
  const BCIC_MAPPING = Object.assign({}, GENERIC_TELETALK_MAPPING, {
    id: 'bcic',
    name: 'BCIC Recruitment Portal (bcic.teletalk.com.bd)',
    urlPattern: '.*bcic\\.teletalk\\.com\\.bd.*'
  });

  /**
   * BCS Specific Mapping
   * Tailored for https://bcs.teletalk.com.bd/
   */
  const BCS_MAPPING = Object.assign({}, GENERIC_TELETALK_MAPPING, {
    id: 'bcs',
    name: 'BPSC / BCS Recruitment Portal (bcs.teletalk.com.bd)',
    urlPattern: '.*bcs\\.teletalk\\.com\\.bd.*'
  });

  /**
   * BOGMC Specific Mapping
   * Tailored for https://bogmc.teletalk.com.bd/
   */
  const BOGMC_MAPPING = Object.assign({}, GENERIC_TELETALK_MAPPING, {
    id: 'bogmc',
    name: 'BOGMC Recruitment Portal (bogmc.teletalk.com.bd)',
    urlPattern: '.*bogmc\\.teletalk\\.com\\.bd.*'
  });

  /**
   * CID Specific Mapping
   * Tailored for http://cid.teletalk.com.bd/
   */
  const CID_MAPPING = Object.assign({}, GENERIC_TELETALK_MAPPING, {
    id: 'cid',
    name: 'CID Recruitment Portal (cid.teletalk.com.bd)',
    urlPattern: '.*cid\\.teletalk\\.com\\.bd.*'
  });

  const ALL_MAPPINGS = [CID_MAPPING, BCIC_MAPPING, BCS_MAPPING, BOGMC_MAPPING, GENERIC_TELETALK_MAPPING];

  /**
   * Finds the best matching site configuration for a given URL.
   * @param {string} url
   * @returns {Object} Site mapping configuration
   */
  function getMappingForUrl(url) {
    if (!url) return GENERIC_TELETALK_MAPPING;
    for (const mapping of ALL_MAPPINGS) {
      if (mapping.urlPattern && new RegExp(mapping.urlPattern, 'i').test(url)) {
        return mapping;
      }
    }
    return GENERIC_TELETALK_MAPPING;
  }

  /**
   * Checks whether a given URL is a Teletalk portal.
   * @param {string} url
   * @returns {boolean}
   */
  function isTeletalkUrl(url) {
    if (!url) return false;
    return /teletalk\.com\.bd/i.test(url);
  }

  /**
   * Diagnostic Scanner: Inspects a live DOM and reports all inputs, selects,
   * textareas, their IDs, names, labels, and option values.
   * Enables rapid creation of new site mappings for newly released Teletalk circulars.
   * @param {Document} doc
   * @returns {Array<Object>}
   */
  function inspectPageFields(doc = document) {
    const results = [];
    const elements = doc.querySelectorAll('input, select, textarea');

    elements.forEach((el, index) => {
      // Exclude hidden tokens or system buttons
      if (el.type === 'hidden' && (el.name || '').includes('csrf')) return;

      const tag = el.tagName.toLowerCase();
      const type = el.type || tag;
      const id = el.id || '';
      const name = el.name || '';
      const placeholder = el.placeholder || '';

      // Locate surrounding or associated label
      let labelText = '';
      if (id) {
        const labelEl = doc.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (labelEl) labelText = labelEl.textContent.trim();
      }
      if (!labelText && el.closest('label')) {
        labelText = el.closest('label').textContent.trim();
      }
      if (!labelText) {
        // Check previous table cell or preceding sibling label
        const parentCell = el.closest('td');
        if (parentCell && parentCell.previousElementSibling) {
          labelText = parentCell.previousElementSibling.textContent.trim();
        }
      }

      // Collect options if select element
      let options = [];
      if (tag === 'select') {
        options = Array.from(el.options).map((opt) => ({
          value: opt.value,
          text: opt.textContent.trim()
        })).filter(o => o.value || o.text);
      }

      results.push({
        index,
        tag,
        type,
        id,
        name,
        placeholder,
        label: labelText.replace(/\s+/g, ' ').slice(0, 100),
        disabled: el.disabled,
        readOnly: el.readOnly,
        visible: el.offsetParent !== null,
        value: el.value || '',
        optionCount: options.length,
        sampleOptions: options.slice(0, 6)
      });
    });

    return results;
  }

  return {
    normalize,
    DROPDOWN_ALIASES,
    GENERIC_TELETALK_MAPPING,
    CID_MAPPING,
    BCIC_MAPPING,
    BCS_MAPPING,
    BOGMC_MAPPING,
    ALL_MAPPINGS,
    getMappingForUrl,
    isTeletalkUrl,
    inspectPageFields
  };
});
