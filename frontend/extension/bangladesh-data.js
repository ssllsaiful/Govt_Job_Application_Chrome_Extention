/**
 * bangladesh-data.js - Comprehensive Data for Bangladesh Govt Job Applications
 * 
 * Contains:
 * 1. All 64 Districts of Bangladesh with their Upazilas / Thanas, Post Offices, and Post Codes.
 * 2. Diploma in Engineering technology / subject list (BTEB curriculum).
 * 3. Bangladesh Universities list (All Public & UGC-approved Private Universities).
 * 4. Graduation Degrees & Academic Subjects list.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BangladeshData = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // -------------------------------------------------------------
  // 1. BANGLADESH 64 DISTRICTS WITH UPAZILAS & POST OFFICES
  // -------------------------------------------------------------
  const DISTRICTS = [
    {
      name: 'Dhaka',
      nameBn: 'ঢাকা',
      division: 'Dhaka',
      upazilas: [
        'Adabor', 'Badda', 'Bangshal', 'Biman Bandar', 'Cantonment', 'Chawkbazar',
        'Dakshinkhan', 'Darus Salam', 'Demra', 'Dhamrai', 'Dhanmondi', 'Dohar',
        'Gendaria', 'Gulshan', 'Hazaribagh', 'Jatrabari', 'Kadamtali', 'Kafrul',
        'Kalabagan', 'Kamrangirchar', 'Keraniganj', 'Khilgaon', 'Khilkhet', 'Kotwali',
        'Lalbagh', 'Mirpur', 'Mohammadpur', 'Motijheel', 'Nawabganj', 'New Market',
        'Pallabi', 'Paltan', 'Ramna', 'Rampura', 'Sabujbagh', 'Savar', 'Shah Ali',
        'Shahbagh', 'Sher-e-Bangla Nagar', 'Shyampur', 'Sutrapur', 'Tejgaon',
        'Tejgaon Industrial Area', 'Turag', 'Uttar Khan', 'Uttara'
      ],
      postOffices: [
        { name: 'Dhaka GPO', postCode: '1000', upazila: 'Motijheel' },
        { name: 'Shantinagar', postCode: '1217', upazila: 'Paltan' },
        { name: 'Dhanmondi', postCode: '1209', upazila: 'Dhanmondi' },
        { name: 'Mohammadpur', postCode: '1207', upazila: 'Mohammadpur' },
        { name: 'Mirpur', postCode: '1216', upazila: 'Mirpur' },
        { name: 'Mirpur-14', postCode: '1206', upazila: 'Kafrul' },
        { name: 'Uttara Model Town', postCode: '1230', upazila: 'Uttara' },
        { name: 'Gulshan', postCode: '1212', upazila: 'Gulshan' },
        { name: 'Banani', postCode: '1213', upazila: 'Gulshan' },
        { name: 'Tejgaon', postCode: '1215', upazila: 'Tejgaon' },
        { name: 'Khilgaon', postCode: '1219', upazila: 'Khilgaon' },
        { name: 'Badda', postCode: '1214', upazila: 'Badda' },
        { name: 'Jatrabari', postCode: '1204', upazila: 'Jatrabari' },
        { name: 'Wari', postCode: '1203', upazila: 'Sutrapur' },
        { name: 'Lalbagh', postCode: '1211', upazila: 'Lalbagh' },
        { name: 'New Market', postCode: '1205', upazila: 'New Market' },
        { name: 'Savar', postCode: '1340', upazila: 'Savar' },
        { name: 'Savar Canttonment', postCode: '1344', upazila: 'Savar' },
        { name: 'Dhamrai', postCode: '1350', upazila: 'Dhamrai' },
        { name: 'Keraniganj', postCode: '1310', upazila: 'Keraniganj' },
        { name: 'Nawabganj', postCode: '1320', upazila: 'Nawabganj' },
        { name: 'Dohar', postCode: '1330', upazila: 'Dohar' }
      ]
    },
    {
      name: 'Gazipur',
      nameBn: 'গাজীপুর',
      division: 'Dhaka',
      upazilas: ['Gazipur Sadar', 'Kaliakair', 'Kaliganj', 'Kapasia', 'Sreepur', 'Tongi'],
      postOffices: [
        { name: 'Gazipur Sadar', postCode: '1700', upazila: 'Gazipur Sadar' },
        { name: 'BRRI', postCode: '1701', upazila: 'Gazipur Sadar' },
        { name: 'Chandona', postCode: '1702', upazila: 'Gazipur Sadar' },
        { name: 'Tongi', postCode: '1710', upazila: 'Tongi' },
        { name: 'Kaliakair', postCode: '1750', upazila: 'Kaliakair' },
        { name: 'Kaliganj', postCode: '1720', upazila: 'Kaliganj' },
        { name: 'Kapasia', postCode: '1730', upazila: 'Kapasia' },
        { name: 'Sreepur', postCode: '1740', upazila: 'Sreepur' }
      ]
    },
    {
      name: 'Narayanganj',
      nameBn: 'নারায়ণগঞ্জ',
      division: 'Dhaka',
      upazilas: ['Araihazar', 'Bandar', 'Narayanganj Sadar', 'Rupganj', 'Sonargaon', 'Fatullah', 'Siddhirganj'],
      postOffices: [
        { name: 'Narayanganj Head PO', postCode: '1400', upazila: 'Narayanganj Sadar' },
        { name: 'Fatullah', postCode: '1420', upazila: 'Fatullah' },
        { name: 'Siddhirganj', postCode: '1430', upazila: 'Siddhirganj' },
        { name: 'Bandar', postCode: '1410', upazila: 'Bandar' },
        { name: 'Araihazar', postCode: '1450', upazila: 'Araihazar' },
        { name: 'Rupganj', postCode: '1460', upazila: 'Rupganj' },
        { name: 'Sonargaon', postCode: '1440', upazila: 'Sonargaon' }
      ]
    },
    {
      name: 'Tangail',
      nameBn: 'টাঙ্গাইল',
      division: 'Dhaka',
      upazilas: ['Tangail Sadar', 'Basail', 'Bhuapur', 'Delduar', 'Ghatail', 'Gopalpur', 'Kalihati', 'Madhupur', 'Mirzapur', 'Nagarpur', 'Sakhipur', 'Dhanbari'],
      postOffices: [
        { name: 'Tangail Head PO', postCode: '1900', upazila: 'Tangail Sadar' },
        { name: 'Mirzapur', postCode: '1920', upazila: 'Mirzapur' },
        { name: 'Madhupur', postCode: '1996', upazila: 'Madhupur' },
        { name: 'Ghatail', postCode: '1980', upazila: 'Ghatail' },
        { name: 'Kalihati', postCode: '1970', upazila: 'Kalihati' },
        { name: 'Gopalpur', postCode: '1990', upazila: 'Gopalpur' },
        { name: 'Sakhipur', postCode: '1950', upazila: 'Sakhipur' }
      ]
    },
    {
      name: 'Narsingdi',
      nameBn: 'নরসিংদী',
      division: 'Dhaka',
      upazilas: ['Narsingdi Sadar', 'Belabo', 'Monohardi', 'Palash', 'Raipura', 'Shibpur'],
      postOffices: [
        { name: 'Narsingdi Head PO', postCode: '1600', upazila: 'Narsingdi Sadar' },
        { name: 'Palash', postCode: '1610', upazila: 'Palash' },
        { name: 'Shibpur', postCode: '1620', upazila: 'Shibpur' },
        { name: 'Raipura', postCode: '1630', upazila: 'Raipura' },
        { name: 'Monohardi', postCode: '1650', upazila: 'Monohardi' },
        { name: 'Belabo', postCode: '1640', upazila: 'Belabo' }
      ]
    },
    {
      name: 'Faridpur',
      nameBn: 'ফরিদপুর',
      division: 'Dhaka',
      upazilas: ['Faridpur Sadar', 'Alfadanga', 'Bhanga', 'Boalmari', 'Charbhadrasan', 'Madhukhali', 'Nagarkanda', 'Sadarpur', 'Saltha'],
      postOffices: [
        { name: 'Faridpur Head PO', postCode: '7800', upazila: 'Faridpur Sadar' },
        { name: 'Bhanga', postCode: '7830', upazila: 'Bhanga' },
        { name: 'Boalmari', postCode: '7860', upazila: 'Boalmari' },
        { name: 'Madhukhali', postCode: '7850', upazila: 'Madhukhali' },
        { name: 'Nagarkanda', postCode: '7840', upazila: 'Nagarkanda' }
      ]
    },
    {
      name: 'Manikganj',
      nameBn: 'মানিকগঞ্জ',
      division: 'Dhaka',
      upazilas: ['Manikganj Sadar', 'Daulatpur', 'Ghior', 'Harirampur', 'Saturia', 'Shivalaya', 'Singair'],
      postOffices: [
        { name: 'Manikganj Head PO', postCode: '1800', upazila: 'Manikganj Sadar' },
        { name: 'Singair', postCode: '1820', upazila: 'Singair' },
        { name: 'Shivalaya', postCode: '1850', upazila: 'Shivalaya' },
        { name: 'Ghior', postCode: '1840', upazila: 'Ghior' },
        { name: 'Saturia', postCode: '1810', upazila: 'Saturia' }
      ]
    },
    {
      name: 'Munshiganj',
      nameBn: 'মুন্সীগঞ্জ',
      division: 'Dhaka',
      upazilas: ['Munshiganj Sadar', 'Gazaria', 'Lohajang', 'Sirajdikhan', 'Sreenagar', 'Tongibari'],
      postOffices: [
        { name: 'Munshiganj Head PO', postCode: '1500', upazila: 'Munshiganj Sadar' },
        { name: 'Sreenagar', postCode: '1550', upazila: 'Sreenagar' },
        { name: 'Sirajdikhan', postCode: '1540', upazila: 'Sirajdikhan' },
        { name: 'Lohajang', postCode: '1530', upazila: 'Lohajang' },
        { name: 'Gazaria', postCode: '1510', upazila: 'Gazaria' }
      ]
    },
    {
      name: 'Gopalganj',
      nameBn: 'গোপালগঞ্জ',
      division: 'Dhaka',
      upazilas: ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara'],
      postOffices: [
        { name: 'Gopalganj Head PO', postCode: '8100', upazila: 'Gopalganj Sadar' },
        { name: 'Tungipara', postCode: '8120', upazila: 'Tungipara' },
        { name: 'Kashiani', postCode: '8130', upazila: 'Kashiani' },
        { name: 'Kotalipara', postCode: '8110', upazila: 'Kotalipara' },
        { name: 'Muksudpur', postCode: '8140', upazila: 'Muksudpur' }
      ]
    },
    {
      name: 'Madaripur',
      nameBn: 'মাদারীপুর',
      division: 'Dhaka',
      upazilas: ['Madaripur Sadar', 'Kalkini', 'Rajoir', 'Shibchar', 'Dasar'],
      postOffices: [
        { name: 'Madaripur Head PO', postCode: '7900', upazila: 'Madaripur Sadar' },
        { name: 'Shibchar', postCode: '7930', upazila: 'Shibchar' },
        { name: 'Kalkini', postCode: '7920', upazila: 'Kalkini' },
        { name: 'Rajoir', postCode: '7910', upazila: 'Rajoir' }
      ]
    },
    {
      name: 'Rajbari',
      nameBn: 'রাজবাড়ী',
      division: 'Dhaka',
      upazilas: ['Rajbari Sadar', 'Baliakandi', 'Goalandaghat', 'Pangsha', 'Kalukhali'],
      postOffices: [
        { name: 'Rajbari Head PO', postCode: '7700', upazila: 'Rajbari Sadar' },
        { name: 'Goalanda', postCode: '7710', upazila: 'Goalandaghat' },
        { name: 'Pangsha', postCode: '7720', upazila: 'Pangsha' },
        { name: 'Baliakandi', postCode: '7730', upazila: 'Baliakandi' }
      ]
    },
    {
      name: 'Shariatpur',
      nameBn: 'শরীয়তপুর',
      division: 'Dhaka',
      upazilas: ['Shariatpur Sadar', 'Bhedarganj', 'Damudya', 'Gosairhat', 'Naria', 'Zajira'],
      postOffices: [
        { name: 'Shariatpur Head PO', postCode: '8000', upazila: 'Shariatpur Sadar' },
        { name: 'Naria', postCode: '8010', upazila: 'Naria' },
        { name: 'Zajira', postCode: '8020', upazila: 'Zajira' },
        { name: 'Bhedarganj', postCode: '8030', upazila: 'Bhedarganj' },
        { name: 'Damudya', postCode: '8040', upazila: 'Damudya' }
      ]
    },
    {
      name: 'Kishoreganj',
      nameBn: 'কিশোরগঞ্জ',
      division: 'Dhaka',
      upazilas: ['Kishoreganj Sadar', 'Austagram', 'Bajitpur', 'Bhairab', 'Hossainpur', 'Itna', 'Karimganj', 'Katiadi', 'Kuliarchar', 'Mithamain', 'Nikli', 'Pakundia', 'Tarail'],
      postOffices: [
        { name: 'Kishoreganj Head PO', postCode: '2300', upazila: 'Kishoreganj Sadar' },
        { name: 'Bhairab', postCode: '2350', upazila: 'Bhairab' },
        { name: 'Bajitpur', postCode: '2336', upazila: 'Bajitpur' },
        { name: 'Katiadi', postCode: '2330', upazila: 'Katiadi' },
        { name: 'Karimganj', postCode: '2310', upazila: 'Karimganj' },
        { name: 'Pakundia', postCode: '2326', upazila: 'Pakundia' }
      ]
    },
    {
      name: 'Chattogram',
      altNames: ['Chittagong'],
      nameBn: 'চট্টগ্রাম',
      division: 'Chattogram',
      upazilas: [
        'Anwara', 'Banshkhali', 'Boalkhali', 'Chandanaish', 'Fatikchhari', 'Hathazari',
        'Karnaphuli', 'Lohagara', 'Mirsharai', 'Patiya', 'Rangunia', 'Raozan',
        'Sandwip', 'Satkania', 'Sitakunda', 'Bakalia', 'Bandar', 'Bayazid',
        'Chandgaon', 'Chawkbazar', 'Double Mooring', 'Halishahar', 'Khulshi',
        'Kotwali', 'Pahartali', 'Panchlaish', 'Patenga'
      ],
      postOffices: [
        { name: 'Chattogram GPO', postCode: '4000', upazila: 'Kotwali' },
        { name: 'Agrabad', postCode: '4100', upazila: 'Double Mooring' },
        { name: 'Nasirabad', postCode: '4209', upazila: 'Panchlaish' },
        { name: 'Halishahar', postCode: '4216', upazila: 'Halishahar' },
        { name: 'Chandgaon', postCode: '4212', upazila: 'Chandgaon' },
        { name: 'Patenga', postCode: '4204', upazila: 'Patenga' },
        { name: 'Hathazari', postCode: '4330', upazila: 'Hathazari' },
        { name: 'Sitakunda', postCode: '4310', upazila: 'Sitakunda' },
        { name: 'Mirsharai', postCode: '4320', upazila: 'Mirsharai' },
        { name: 'Patiya', postCode: '4370', upazila: 'Patiya' },
        { name: 'Raozan', postCode: '4340', upazila: 'Raozan' },
        { name: 'Rangunia', postCode: '4360', upazila: 'Rangunia' },
        { name: 'Boalkhali', postCode: '4366', upazila: 'Boalkhali' },
        { name: 'Anwara', postCode: '4376', upazila: 'Anwara' },
        { name: 'Satkania', postCode: '4386', upazila: 'Satkania' },
        { name: 'Banshkhali', postCode: '4390', upazila: 'Banshkhali' },
        { name: 'Fatikchhari', postCode: '4350', upazila: 'Fatikchhari' },
        { name: 'Sandwip', postCode: '4300', upazila: 'Sandwip' }
      ]
    },
    {
      name: 'Cox\'s Bazar',
      nameBn: 'কক্সবাজার',
      division: 'Chattogram',
      upazilas: ['Cox\'s Bazar Sadar', 'Chakaria', 'Kutubdia', 'Maheshkhali', 'Ramu', 'Teknaf', 'Ukhia', 'Pekua', 'Eidgaon'],
      postOffices: [
        { name: 'Cox\'s Bazar Head PO', postCode: '4700', upazila: 'Cox\'s Bazar Sadar' },
        { name: 'Chakaria', postCode: '4740', upazila: 'Chakaria' },
        { name: 'Teknaf', postCode: '4760', upazila: 'Teknaf' },
        { name: 'Ukhia', postCode: '4750', upazila: 'Ukhia' },
        { name: 'Ramu', postCode: '4730', upazila: 'Ramu' },
        { name: 'Maheshkhali', postCode: '4710', upazila: 'Maheshkhali' }
      ]
    },
    {
      name: 'Cumilla',
      altNames: ['Comilla'],
      nameBn: 'কুমিল্লা',
      division: 'Chattogram',
      upazilas: [
        'Cumilla Adarsha Sadar', 'Barura', 'Brahmanpara', 'Burichang', 'Chandina',
        'Chauddagram', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam', 'Lalmai',
        'Meghna', 'Monohargonj', 'Muradnagar', 'Nangalkot', 'Sadar Dakshin', 'Titas'
      ],
      postOffices: [
        { name: 'Cumilla Head PO', postCode: '3500', upazila: 'Cumilla Adarsha Sadar' },
        { name: 'Cumilla Cantonment', postCode: '3501', upazila: 'Cumilla Adarsha Sadar' },
        { name: 'Daudkandi', postCode: '3516', upazila: 'Daudkandi' },
        { name: 'Chandina', postCode: '3510', upazila: 'Chandina' },
        { name: 'Debidwar', postCode: '3530', upazila: 'Debidwar' },
        { name: 'Muradnagar', postCode: '3540', upazila: 'Muradnagar' },
        { name: 'Laksam', postCode: '3570', upazila: 'Laksam' },
        { name: 'Chauddagram', postCode: '3550', upazila: 'Chauddagram' },
        { name: 'Nangalkot', postCode: '3580', upazila: 'Nangalkot' },
        { name: 'Burichang', postCode: '3520', upazila: 'Burichang' }
      ]
    },
    {
      name: 'Brahmanbaria',
      nameBn: 'ব্রাহ্মণবাড়িয়া',
      division: 'Chattogram',
      upazilas: ['Brahmanbaria Sadar', 'Akhaura', 'Ashuganj', 'Bancharampur', 'Bijoynagar', 'Kasba', 'Nabinagar', 'Nasirnagar', 'Sarail'],
      postOffices: [
        { name: 'Brahmanbaria Head PO', postCode: '3400', upazila: 'Brahmanbaria Sadar' },
        { name: 'Ashuganj', postCode: '3402', upazila: 'Ashuganj' },
        { name: 'Akhaura', postCode: '3450', upazila: 'Akhaura' },
        { name: 'Kasba', postCode: '3460', upazila: 'Kasba' },
        { name: 'Nabinagar', postCode: '3410', upazila: 'Nabinagar' },
        { name: 'Sarail', postCode: '3430', upazila: 'Sarail' }
      ]
    },
    {
      name: 'Chandpur',
      nameBn: 'চাঁদপুর',
      division: 'Chattogram',
      upazilas: ['Chandpur Sadar', 'Faridganj', 'Haimchar', 'Haziganj', 'Kachua', 'Matlab North', 'Matlab South', 'Shahrasti'],
      postOffices: [
        { name: 'Chandpur Head PO', postCode: '3600', upazila: 'Chandpur Sadar' },
        { name: 'Haziganj', postCode: '3610', upazila: 'Haziganj' },
        { name: 'Faridganj', postCode: '3650', upazila: 'Faridganj' },
        { name: 'Kachua', postCode: '3630', upazila: 'Kachua' },
        { name: 'Shahrasti', postCode: '3620', upazila: 'Shahrasti' },
        { name: 'Matlab', postCode: '3640', upazila: 'Matlab South' }
      ]
    },
    {
      name: 'Noakhali',
      nameBn: 'নোয়াখালী',
      division: 'Chattogram',
      upazilas: ['Noakhali Sadar', 'Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya', 'Kabirhat', 'Senbagh', 'Sonaimuri', 'Subarnachar'],
      postOffices: [
        { name: 'Noakhali Head PO (Maijdee)', postCode: '3800', upazila: 'Noakhali Sadar' },
        { name: 'Chowmuhani', postCode: '3821', upazila: 'Begumganj' },
        { name: 'Chatkhil', postCode: '3870', upazila: 'Chatkhil' },
        { name: 'Senbagh', postCode: '3860', upazila: 'Senbagh' },
        { name: 'Sonaimuri', postCode: '3827', upazila: 'Sonaimuri' },
        { name: 'Companiganj', postCode: '3850', upazila: 'Companiganj' },
        { name: 'Hatiya', postCode: '3890', upazila: 'Hatiya' }
      ]
    },
    {
      name: 'Feni',
      nameBn: 'ফেনী',
      division: 'Chattogram',
      upazilas: ['Feni Sadar', 'Chhagalnaiya', 'Daganbhuiyan', 'Parshuram', 'Fulgazi', 'Sonagazi'],
      postOffices: [
        { name: 'Feni Head PO', postCode: '3900', upazila: 'Feni Sadar' },
        { name: 'Chhagalnaiya', postCode: '3910', upazila: 'Chhagalnaiya' },
        { name: 'Daganbhuiyan', postCode: '3920', upazila: 'Daganbhuiyan' },
        { name: 'Sonagazi', postCode: '3930', upazila: 'Sonagazi' },
        { name: 'Parshuram', postCode: '3940', upazila: 'Parshuram' }
      ]
    },
    {
      name: 'Lakshmipur',
      nameBn: 'লক্ষ্মীপুর',
      division: 'Chattogram',
      upazilas: ['Lakshmipur Sadar', 'Raipur', 'Ramganj', 'Ramgati', 'Kamalnagar'],
      postOffices: [
        { name: 'Lakshmipur Head PO', postCode: '3700', upazila: 'Lakshmipur Sadar' },
        { name: 'Ramganj', postCode: '3720', upazila: 'Ramganj' },
        { name: 'Raipur', postCode: '3710', upazila: 'Raipur' },
        { name: 'Ramgati', postCode: '3730', upazila: 'Ramgati' }
      ]
    },
    {
      name: 'Bandarban',
      nameBn: 'বান্দরবান',
      division: 'Chattogram',
      upazilas: ['Bandarban Sadar', 'Alikadam', 'Lama', 'Naikhongchhari', 'Rowangchhari', 'Ruma', 'Thanchi'],
      postOffices: [
        { name: 'Bandarban Head PO', postCode: '4600', upazila: 'Bandarban Sadar' },
        { name: 'Lama', postCode: '4641', upazila: 'Lama' },
        { name: 'Ruma', postCode: '4620', upazila: 'Ruma' }
      ]
    },
    {
      name: 'Khagrachhari',
      nameBn: 'খাগড়াছড়ি',
      division: 'Chattogram',
      upazilas: ['Khagrachhari Sadar', 'Dighinala', 'Lakshmichhari', 'Mahalchhari', 'Manikchhari', 'Matiranga', 'Panchhari', 'Ramgarh', 'Guimara'],
      postOffices: [
        { name: 'Khagrachhari Head PO', postCode: '4400', upazila: 'Khagrachhari Sadar' },
        { name: 'Ramgarh', postCode: '4440', upazila: 'Ramgarh' },
        { name: 'Matiranga', postCode: '4450', upazila: 'Matiranga' }
      ]
    },
    {
      name: 'Rangamati',
      nameBn: 'রাঙ্গামাটি',
      division: 'Chattogram',
      upazilas: ['Rangamati Sadar', 'Bagaichhari', 'Barkal', 'Belaichhari', 'Juraichhari', 'Kaptai', 'Kawkhali', 'Langadu', 'Naniarchar', 'Rajasthali'],
      postOffices: [
        { name: 'Rangamati Head PO', postCode: '4500', upazila: 'Rangamati Sadar' },
        { name: 'Kaptai', postCode: '4530', upazila: 'Kaptai' },
        { name: 'Chandraghona', postCode: '4531', upazila: 'Kaptai' }
      ]
    },
    {
      name: 'Rajshahi',
      nameBn: 'রাজশাহী',
      division: 'Rajshahi',
      upazilas: [
        'Bagha', 'Bagmara', 'Charghat', 'Durgapur', 'Godagari', 'Mohanpur',
        'Paba', 'Puthia', 'Tanore', 'Boalia', 'Matihar', 'Rajpara', 'Shah Makhdum'
      ],
      postOffices: [
        { name: 'Rajshahi GPO', postCode: '6000', upazila: 'Boalia' },
        { name: 'Rajshahi University', postCode: '6205', upazila: 'Matihar' },
        { name: 'RUET', postCode: '6204', upazila: 'Matihar' },
        { name: 'Godagari', postCode: '6290', upazila: 'Godagari' },
        { name: 'Puthia', postCode: '6260', upazila: 'Puthia' },
        { name: 'Charghat', postCode: '6270', upazila: 'Charghat' },
        { name: 'Bagha', postCode: '6280', upazila: 'Bagha' },
        { name: 'Tanore', postCode: '6240', upazila: 'Tanore' }
      ]
    },
    {
      name: 'Bogura',
      altNames: ['Bogra'],
      nameBn: 'বগুড়া',
      division: 'Rajshahi',
      upazilas: ['Bogura Sadar', 'Adamdighi', 'Dhunat', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Sonatola'],
      postOffices: [
        { name: 'Bogura Head PO', postCode: '5800', upazila: 'Bogura Sadar' },
        { name: 'Bogura Cantonment', postCode: '5801', upazila: 'Shajahanpur' },
        { name: 'Sherpur', postCode: '5840', upazila: 'Sherpur' },
        { name: 'Shibganj', postCode: '5810', upazila: 'Shibganj' },
        { name: 'Mokamtala', postCode: '5811', upazila: 'Shibganj' },
        { name: 'Gabtali', postCode: '5820', upazila: 'Gabtali' },
        { name: 'Kahaloo', postCode: '5870', upazila: 'Kahaloo' },
        { name: 'Santahar', postCode: '5891', upazila: 'Adamdighi' },
        { name: 'Sonatola', postCode: '5826', upazila: 'Sonatola' }
      ]
    },
    {
      name: 'Pabna',
      nameBn: 'পাবনা',
      division: 'Rajshahi',
      upazilas: ['Pabna Sadar', 'Atgharia', 'Bera', 'Bhangura', 'Chatmohar', 'Faridpur', 'Ishwardi', 'Santhia', 'Sujanagar'],
      postOffices: [
        { name: 'Pabna Head PO', postCode: '6600', upazila: 'Pabna Sadar' },
        { name: 'Ishwardi', postCode: '6620', upazila: 'Ishwardi' },
        { name: 'Paksey', postCode: '6622', upazila: 'Ishwardi' },
        { name: 'Chatmohar', postCode: '6630', upazila: 'Chatmohar' },
        { name: 'Bera', postCode: '6680', upazila: 'Bera' },
        { name: 'Sujanagar', postCode: '6660', upazila: 'Sujanagar' }
      ]
    },
    {
      name: 'Sirajganj',
      nameBn: 'সিরাজগঞ্জ',
      division: 'Rajshahi',
      upazilas: ['Sirajganj Sadar', 'Belkuchi', 'Chauhali', 'Kamarkhanda', 'Kazipur', 'Raiganj', 'Shahjadpur', 'Tarash', 'Ullahpara'],
      postOffices: [
        { name: 'Sirajganj Head PO', postCode: '6700', upazila: 'Sirajganj Sadar' },
        { name: 'Shahjadpur', postCode: '6770', upazila: 'Shahjadpur' },
        { name: 'Ullahpara', postCode: '6760', upazila: 'Ullahpara' },
        { name: 'Belkuchi', postCode: '6740', upazila: 'Belkuchi' },
        { name: 'Kazipur', postCode: '6710', upazila: 'Kazipur' }
      ]
    },
    {
      name: 'Naogaon',
      nameBn: 'নওগাঁ',
      division: 'Rajshahi',
      upazilas: ['Naogaon Sadar', 'Atrai', 'Badalgachhi', 'Dhamoirhat', 'Manda', 'Mohadevpur', 'Niamatpur', 'Patnitala', 'Porsha', 'Raninagar', 'Sapahar'],
      postOffices: [
        { name: 'Naogaon Head PO', postCode: '6500', upazila: 'Naogaon Sadar' },
        { name: 'Badalgachhi', postCode: '6570', upazila: 'Badalgachhi' },
        { name: 'Mohadevpur', postCode: '6530', upazila: 'Mohadevpur' },
        { name: 'Patnitala', postCode: '6540', upazila: 'Patnitala' },
        { name: 'Manda', postCode: '6520', upazila: 'Manda' }
      ]
    },
    {
      name: 'Natore',
      nameBn: 'নাটোর',
      division: 'Rajshahi',
      upazilas: ['Natore Sadar', 'Bagatipara', 'Baraigram', 'Gurudaspur', 'Lalpur', 'Singra', 'Naldanga'],
      postOffices: [
        { name: 'Natore Head PO', postCode: '6400', upazila: 'Natore Sadar' },
        { name: 'Singra', postCode: '6450', upazila: 'Singra' },
        { name: 'Gurudaspur', postCode: '6440', upazila: 'Gurudaspur' },
        { name: 'Baraigram', postCode: '6430', upazila: 'Baraigram' },
        { name: 'Lalpur', postCode: '6420', upazila: 'Lalpur' }
      ]
    },
    {
      name: 'Joypurhat',
      nameBn: 'জয়পুরহাট',
      division: 'Rajshahi',
      upazilas: ['Joypurhat Sadar', 'Akkelpur', 'Kalai', 'Khetlal', 'Panchbibi'],
      postOffices: [
        { name: 'Joypurhat Head PO', postCode: '5900', upazila: 'Joypurhat Sadar' },
        { name: 'Panchbibi', postCode: '5910', upazila: 'Panchbibi' },
        { name: 'Akkelpur', postCode: '5940', upazila: 'Akkelpur' },
        { name: 'Kalai', postCode: '5930', upazila: 'Kalai' }
      ]
    },
    {
      name: 'Chapainawabganj',
      nameBn: 'চাঁপাইনবাবগঞ্জ',
      division: 'Rajshahi',
      upazilas: ['Chapainawabganj Sadar', 'Bholahat', 'Gomastapur', 'Nachole', 'Shibganj'],
      postOffices: [
        { name: 'Chapainawabganj Head PO', postCode: '6300', upazila: 'Chapainawabganj Sadar' },
        { name: 'Shibganj', postCode: '6320', upazila: 'Shibganj' },
        { name: 'Rohanpur', postCode: '6310', upazila: 'Gomastapur' },
        { name: 'Nachole', postCode: '6330', upazila: 'Nachole' }
      ]
    },
    {
      name: 'Khulna',
      nameBn: 'খুলনা',
      division: 'Khulna',
      upazilas: [
        'Batiaghata', 'Dacope', 'Dighalia', 'Dumuria', 'Koyra', 'Paikgachha',
        'Phultala', 'Rupsha', 'Terokhada', 'Daulatpur', 'Khalishpur',
        'Khan Jahan Ali', 'Kotwali', 'Sonadanga', 'Harintana'
      ],
      postOffices: [
        { name: 'Khulna GPO', postCode: '9000', upazila: 'Kotwali' },
        { name: 'Daulatpur', postCode: '9202', upazila: 'Daulatpur' },
        { name: 'Khalishpur', postCode: '9000', upazila: 'Khalishpur' },
        { name: 'KUET', postCode: '9203', upazila: 'Khan Jahan Ali' },
        { name: 'Khulna University', postCode: '9208', upazila: 'Harintana' },
        { name: 'Phultala', postCode: '9210', upazila: 'Phultala' },
        { name: 'Rupsha', postCode: '9240', upazila: 'Rupsha' },
        { name: 'Dumuria', postCode: '9250', upazila: 'Dumuria' },
        { name: 'Paikgachha', postCode: '9280', upazila: 'Paikgachha' }
      ]
    },
    {
      name: 'Jashore',
      altNames: ['Jessore'],
      nameBn: 'যশোর',
      division: 'Khulna',
      upazilas: ['Jashore Sadar', 'Abhaynagar', 'Bagherpara', 'Chaugachha', 'Jhikargachha', 'Keshabpur', 'Manirampur', 'Sharsha'],
      postOffices: [
        { name: 'Jashore Head PO', postCode: '7400', upazila: 'Jashore Sadar' },
        { name: 'Jashore Cantonment', postCode: '7403', upazila: 'Jashore Sadar' },
        { name: 'Benapole', postCode: '7431', upazila: 'Sharsha' },
        { name: 'Noapara', postCode: '7460', upazila: 'Abhaynagar' },
        { name: 'Jhikargachha', postCode: '7420', upazila: 'Jhikargachha' },
        { name: 'Manirampur', postCode: '7440', upazila: 'Manirampur' },
        { name: 'Keshabpur', postCode: '7450', upazila: 'Keshabpur' }
      ]
    },
    {
      name: 'Kushtia',
      nameBn: 'কুষ্টিয়া',
      division: 'Khulna',
      upazilas: ['Kushtia Sadar', 'Bheramara', 'Daulatpur', 'Khoksa', 'Kumarkhali', 'Mirpur'],
      postOffices: [
        { name: 'Kushtia Head PO', postCode: '7000', upazila: 'Kushtia Sadar' },
        { name: 'Islamic University', postCode: '7003', upazila: 'Kushtia Sadar' },
        { name: 'Kumarkhali', postCode: '7010', upazila: 'Kumarkhali' },
        { name: 'Bheramara', postCode: '7040', upazila: 'Bheramara' },
        { name: 'Mirpur', postCode: '7030', upazila: 'Mirpur' },
        { name: 'Daulatpur', postCode: '7050', upazila: 'Daulatpur' }
      ]
    },
    {
      name: 'Jhenaidah',
      nameBn: 'ঝিনাইদহ',
      division: 'Khulna',
      upazilas: ['Jhenaidah Sadar', 'Harinakundu', 'Kaliganj', 'Kotchandpur', 'Maheshpur', 'Shailkupa'],
      postOffices: [
        { name: 'Jhenaidah Head PO', postCode: '7300', upazila: 'Jhenaidah Sadar' },
        { name: 'Kaliganj', postCode: '7350', upazila: 'Kaliganj' },
        { name: 'Kotchandpur', postCode: '7330', upazila: 'Kotchandpur' },
        { name: 'Shailkupa', postCode: '7320', upazila: 'Shailkupa' },
        { name: 'Maheshpur', postCode: '7340', upazila: 'Maheshpur' }
      ]
    },
    {
      name: 'Satkhira',
      nameBn: 'সাতক্ষীরা',
      division: 'Khulna',
      upazilas: ['Satkhira Sadar', 'Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Shyamnagar', 'Tala'],
      postOffices: [
        { name: 'Satkhira Head PO', postCode: '9400', upazila: 'Satkhira Sadar' },
        { name: 'Kalaroa', postCode: '9410', upazila: 'Kalaroa' },
        { name: 'Tala', postCode: '9420', upazila: 'Tala' },
        { name: 'Kaliganj', postCode: '9440', upazila: 'Kaliganj' },
        { name: 'Shyamnagar', postCode: '9450', upazila: 'Shyamnagar' }
      ]
    },
    {
      name: 'Bagerhat',
      nameBn: 'বাগেরহাট',
      division: 'Khulna',
      upazilas: ['Bagerhat Sadar', 'Chitalmari', 'Fakirhat', 'Kachua', 'Mollahat', 'Mongla', 'Morrelganj', 'Rampal', 'Sarankhola'],
      postOffices: [
        { name: 'Bagerhat Head PO', postCode: '9300', upazila: 'Bagerhat Sadar' },
        { name: 'Mongla Port', postCode: '9351', upazila: 'Mongla' },
        { name: 'Morrelganj', postCode: '9320', upazila: 'Morrelganj' },
        { name: 'Fakirhat', postCode: '9370', upazila: 'Fakirhat' },
        { name: 'Rampal', postCode: '9340', upazila: 'Rampal' }
      ]
    },
    {
      name: 'Chuadanga',
      nameBn: 'চুয়াডাঙ্গা',
      division: 'Khulna',
      upazilas: ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar'],
      postOffices: [
        { name: 'Chuadanga Head PO', postCode: '7200', upazila: 'Chuadanga Sadar' },
        { name: 'Alamdanga', postCode: '7210', upazila: 'Alamdanga' },
        { name: 'Damurhuda', postCode: '7220', upazila: 'Damurhuda' },
        { name: 'Darshana', postCode: '7221', upazila: 'Damurhuda' },
        { name: 'Jibannagar', postCode: '7230', upazila: 'Jibannagar' }
      ]
    },
    {
      name: 'Magura',
      nameBn: 'মাগুরা',
      division: 'Khulna',
      upazilas: ['Magura Sadar', 'Mohammadpur', 'Shalikha', 'Sreepur'],
      postOffices: [
        { name: 'Magura Head PO', postCode: '7600', upazila: 'Magura Sadar' },
        { name: 'Sreepur', postCode: '7610', upazila: 'Sreepur' },
        { name: 'Shalikha', postCode: '7620', upazila: 'Shalikha' },
        { name: 'Mohammadpur', postCode: '7630', upazila: 'Mohammadpur' }
      ]
    },
    {
      name: 'Meherpur',
      nameBn: 'মেহেরপুর',
      division: 'Khulna',
      upazilas: ['Meherpur Sadar', 'Gangni', 'Mujibnagar'],
      postOffices: [
        { name: 'Meherpur Head PO', postCode: '7100', upazila: 'Meherpur Sadar' },
        { name: 'Gangni', postCode: '7110', upazila: 'Gangni' },
        { name: 'Mujibnagar', postCode: '7102', upazila: 'Mujibnagar' }
      ]
    },
    {
      name: 'Narail',
      nameBn: 'নড়াইল',
      division: 'Khulna',
      upazilas: ['Narail Sadar', 'Kalia', 'Lohagara'],
      postOffices: [
        { name: 'Narail Head PO', postCode: '7500', upazila: 'Narail Sadar' },
        { name: 'Lohagara', postCode: '7510', upazila: 'Lohagara' },
        { name: 'Kalia', postCode: '7520', upazila: 'Kalia' }
      ]
    },
    {
      name: 'Barishal',
      altNames: ['Barisal'],
      nameBn: 'বরিশাল',
      division: 'Barishal',
      upazilas: ['Barishal Sadar', 'Agailjhara', 'Babuganj', 'Bakerganj', 'Banaripara', 'Gaurnadi', 'Hizla', 'Mehendiganj', 'Muladi', 'Wazirpur'],
      postOffices: [
        { name: 'Barishal Head PO', postCode: '8200', upazila: 'Barishal Sadar' },
        { name: 'Gaurnadi', postCode: '8230', upazila: 'Gaurnadi' },
        { name: 'Bakerganj', postCode: '8280', upazila: 'Bakerganj' },
        { name: 'Wazirpur', postCode: '8220', upazila: 'Wazirpur' },
        { name: 'Banaripara', postCode: '8250', upazila: 'Banaripara' },
        { name: 'Muladi', postCode: '8240', upazila: 'Muladi' }
      ]
    },
    {
      name: 'Patuakhali',
      nameBn: 'পটুয়াখালী',
      division: 'Barishal',
      upazilas: ['Patuakhali Sadar', 'Bauphal', 'Dashmina', 'Galachipa', 'Kalapara', 'Mirzaganj', 'Rangabali', 'Dumki'],
      postOffices: [
        { name: 'Patuakhali Head PO', postCode: '8600', upazila: 'Patuakhali Sadar' },
        { name: 'Kuakata', postCode: '8651', upazila: 'Kalapara' },
        { name: 'Kalapara', postCode: '8650', upazila: 'Kalapara' },
        { name: 'Bauphal', postCode: '8620', upazila: 'Bauphal' },
        { name: 'Galachipa', postCode: '8640', upazila: 'Galachipa' },
        { name: 'Dumki', postCode: '8602', upazila: 'Dumki' }
      ]
    },
    {
      name: 'Bhola',
      nameBn: 'ভোলা',
      division: 'Barishal',
      upazilas: ['Bhola Sadar', 'Burhanuddin', 'Char Fasson', 'Daulatkhan', 'Lalmohan', 'Manpura', 'Tazumuddin'],
      postOffices: [
        { name: 'Bhola Head PO', postCode: '8300', upazila: 'Bhola Sadar' },
        { name: 'Char Fasson', postCode: '8340', upazila: 'Char Fasson' },
        { name: 'Lalmohan', postCode: '8330', upazila: 'Lalmohan' },
        { name: 'Burhanuddin', postCode: '8320', upazila: 'Burhanuddin' },
        { name: 'Daulatkhan', postCode: '8310', upazila: 'Daulatkhan' }
      ]
    },
    {
      name: 'Pirojpur',
      nameBn: 'পিরোজপুর',
      division: 'Barishal',
      upazilas: ['Pirojpur Sadar', 'Bhandaria', 'Kawkhali', 'Mathbaria', 'Nazirpur', 'Nesarabad (Swarupkati)', 'Zianagar (Indurkani)'],
      postOffices: [
        { name: 'Pirojpur Head PO', postCode: '8500', upazila: 'Pirojpur Sadar' },
        { name: 'Mathbaria', postCode: '8560', upazila: 'Mathbaria' },
        { name: 'Bhandaria', postCode: '8550', upazila: 'Bhandaria' },
        { name: 'Swarupkati', postCode: '8520', upazila: 'Nesarabad (Swarupkati)' },
        { name: 'Nazirpur', postCode: '8540', upazila: 'Nazirpur' }
      ]
    },
    {
      name: 'Barguna',
      nameBn: 'বরগুনা',
      division: 'Barishal',
      upazilas: ['Barguna Sadar', 'Amtali', 'Bamna', 'Betagi', 'Patharghata', 'Taltali'],
      postOffices: [
        { name: 'Barguna Head PO', postCode: '8700', upazila: 'Barguna Sadar' },
        { name: 'Amtali', postCode: '8710', upazila: 'Amtali' },
        { name: 'Patharghata', postCode: '8720', upazila: 'Patharghata' },
        { name: 'Betagi', postCode: '8740', upazila: 'Betagi' }
      ]
    },
    {
      name: 'Jhalokathi',
      nameBn: 'ঝালকাঠি',
      division: 'Barishal',
      upazilas: ['Jhalokathi Sadar', 'Kathalia', 'Nalchity', 'Rajapur'],
      postOffices: [
        { name: 'Jhalokathi Head PO', postCode: '8400', upazila: 'Jhalokathi Sadar' },
        { name: 'Nalchity', postCode: '8420', upazila: 'Nalchity' },
        { name: 'Rajapur', postCode: '8410', upazila: 'Rajapur' },
        { name: 'Kathalia', postCode: '8430', upazila: 'Kathalia' }
      ]
    },
    {
      name: 'Sylhet',
      nameBn: 'সিলেট',
      division: 'Sylhet',
      upazilas: [
        'Balaganj', 'Beanibazar', 'Bishwanath', 'Companiganj', 'Fenchuganj',
        'Golapganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Osmani Nagar',
        'South Surma', 'Sylhet Sadar', 'Zakiganj'
      ],
      postOffices: [
        { name: 'Sylhet Head PO', postCode: '3100', upazila: 'Sylhet Sadar' },
        { name: 'SUST', postCode: '3114', upazila: 'Sylhet Sadar' },
        { name: 'Sylhet Airport', postCode: '3102', upazila: 'Sylhet Sadar' },
        { name: 'Golapganj', postCode: '3160', upazila: 'Golapganj' },
        { name: 'Beanibazar', postCode: '3170', upazila: 'Beanibazar' },
        { name: 'Bishwanath', postCode: '3130', upazila: 'Bishwanath' },
        { name: 'Fenchuganj', postCode: '3117', upazila: 'Fenchuganj' },
        { name: 'Zakiganj', postCode: '3190', upazila: 'Zakiganj' },
        { name: 'Jaintiapur', postCode: '3150', upazila: 'Jaintiapur' }
      ]
    },
    {
      name: 'Moulvibazar',
      nameBn: 'মৌলভীবাজার',
      division: 'Sylhet',
      upazilas: ['Moulvibazar Sadar', 'Barlekha', 'Juri', 'Kamalganj', 'Kulaura', 'Rajnagar', 'Sreemangal'],
      postOffices: [
        { name: 'Moulvibazar Head PO', postCode: '3200', upazila: 'Moulvibazar Sadar' },
        { name: 'Sreemangal', postCode: '3210', upazila: 'Sreemangal' },
        { name: 'Kulaura', postCode: '3230', upazila: 'Kulaura' },
        { name: 'Barlekha', postCode: '3250', upazila: 'Barlekha' },
        { name: 'Kamalganj', postCode: '3220', upazila: 'Kamalganj' }
      ]
    },
    {
      name: 'Habiganj',
      nameBn: 'হবিগঞ্জ',
      division: 'Sylhet',
      upazilas: ['Habiganj Sadar', 'Ajmiriganj', 'Bahubal', 'Baniachong', 'Chunarughat', 'Lakhai', 'Madhabpur', 'Nabiganj', 'Sayestaganj'],
      postOffices: [
        { name: 'Habiganj Head PO', postCode: '3300', upazila: 'Habiganj Sadar' },
        { name: 'Sayestaganj', postCode: '3310', upazila: 'Sayestaganj' },
        { name: 'Madhabpur', postCode: '3330', upazila: 'Madhabpur' },
        { name: 'Nabiganj', postCode: '3370', upazila: 'Nabiganj' },
        { name: 'Chunarughat', postCode: '3320', upazila: 'Chunarughat' },
        { name: 'Baniachong', postCode: '3350', upazila: 'Baniachong' }
      ]
    },
    {
      name: 'Sunamganj',
      nameBn: 'সুনামগঞ্জ',
      division: 'Sylhet',
      upazilas: ['Sunamganj Sadar', 'Bishwamvarpur', 'Chhatak', 'Derai', 'Dharampasha', 'Dowarabazar', 'Jagannathpur', 'Jamalganj', 'Shantiganj (South Sunamganj)', 'Sullah', 'Tahirpur', 'Madhyanagar'],
      postOffices: [
        { name: 'Sunamganj Head PO', postCode: '3000', upazila: 'Sunamganj Sadar' },
        { name: 'Chhatak', postCode: '3080', upazila: 'Chhatak' },
        { name: 'Chhatak Cement Factory', postCode: '3081', upazila: 'Chhatak' },
        { name: 'Jagannathpur', postCode: '3060', upazila: 'Jagannathpur' },
        { name: 'Derai', postCode: '3040', upazila: 'Derai' },
        { name: 'Tahirpur', postCode: '3030', upazila: 'Tahirpur' }
      ]
    },
    {
      name: 'Rangpur',
      nameBn: 'রংপুর',
      division: 'Rangpur',
      upazilas: ['Rangpur Sadar', 'Badarganj', 'Gangachhara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Taraganj'],
      postOffices: [
        { name: 'Rangpur Head PO', postCode: '5400', upazila: 'Rangpur Sadar' },
        { name: 'Rangpur Cadet College', postCode: '5404', upazila: 'Rangpur Sadar' },
        { name: 'Badarganj', postCode: '5420', upazila: 'Badarganj' },
        { name: 'Pirganj', postCode: '5470', upazila: 'Pirganj' },
        { name: 'Mithapukur', postCode: '5460', upazila: 'Mithapukur' },
        { name: 'Kaunia', postCode: '5440', upazila: 'Kaunia' },
        { name: 'Pirgachha', postCode: '5450', upazila: 'Pirgachha' }
      ]
    },
    {
      name: 'Dinajpur',
      nameBn: 'দিনাজপুর',
      division: 'Rangpur',
      upazilas: ['Dinajpur Sadar', 'Birampur', 'Birganj', 'Biral', 'Bochaganj', 'Chirirbandar', 'Phulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Nawabganj', 'Parbatipur'],
      postOffices: [
        { name: 'Dinajpur Head PO', postCode: '5200', upazila: 'Dinajpur Sadar' },
        { name: 'Parbatipur', postCode: '5250', upazila: 'Parbatipur' },
        { name: 'Phulbari', postCode: '5260', upazila: 'Phulbari' },
        { name: 'Birampur', postCode: '5266', upazila: 'Birampur' },
        { name: 'Setabganj', postCode: '5216', upazila: 'Bochaganj' },
        { name: 'Birganj', postCode: '5220', upazila: 'Birganj' },
        { name: 'Chirirbandar', postCode: '5240', upazila: 'Chirirbandar' }
      ]
    },
    {
      name: 'Gaibandha',
      nameBn: 'গাইবান্ধা',
      division: 'Rangpur',
      upazilas: ['Gaibandha Sadar', 'Fulchhari', 'Gobindaganj', 'Palashbari', 'Sadullapur', 'Saghata', 'Sundarganj'],
      postOffices: [
        { name: 'Gaibandha Head PO', postCode: '5700', upazila: 'Gaibandha Sadar' },
        { name: 'Gobindaganj', postCode: '5740', upazila: 'Gobindaganj' },
        { name: 'Palashbari', postCode: '5730', upazila: 'Palashbari' },
        { name: 'Sundarganj', postCode: '5710', upazila: 'Sundarganj' }
      ]
    },
    {
      name: 'Kurigram',
      nameBn: 'কুড়িগ্রাম',
      division: 'Rangpur',
      upazilas: ['Kurigram Sadar', 'Bhurungamari', 'Char Rajibpur', 'Chilmari', 'Phulbari', 'Nageshwari', 'Rajarhat', 'Raomari', 'Ulipur'],
      postOffices: [
        { name: 'Kurigram Head PO', postCode: '5600', upazila: 'Kurigram Sadar' },
        { name: 'Ulipur', postCode: '5620', upazila: 'Ulipur' },
        { name: 'Nageshwari', postCode: '5660', upazila: 'Nageshwari' },
        { name: 'Bhurungamari', postCode: '5670', upazila: 'Bhurungamari' },
        { name: 'Chilmari', postCode: '5630', upazila: 'Chilmari' }
      ]
    },
    {
      name: 'Lalmonirhat',
      nameBn: 'লালমনিরহাট',
      division: 'Rangpur',
      upazilas: ['Lalmonirhat Sadar', 'Aditmari', 'Hatibandha', 'Kaliganj', 'Patgram'],
      postOffices: [
        { name: 'Lalmonirhat Head PO', postCode: '5500', upazila: 'Lalmonirhat Sadar' },
        { name: 'Patgram', postCode: '5570', upazila: 'Patgram' },
        { name: 'Hatibandha', postCode: '5530', upazila: 'Hatibandha' },
        { name: 'Kaliganj', postCode: '5540', upazila: 'Kaliganj' }
      ]
    },
    {
      name: 'Nilphamari',
      nameBn: 'নীলফামারী',
      division: 'Rangpur',
      upazilas: ['Nilphamari Sadar', 'Dimla', 'Domar', 'Jaldhaka', 'Kishoreganj', 'Syedpur'],
      postOffices: [
        { name: 'Nilphamari Head PO', postCode: '5300', upazila: 'Nilphamari Sadar' },
        { name: 'Syedpur', postCode: '5310', upazila: 'Syedpur' },
        { name: 'Domar', postCode: '5320', upazila: 'Domar' },
        { name: 'Jaldhaka', postCode: '5330', upazila: 'Jaldhaka' },
        { name: 'Dimla', postCode: '5350', upazila: 'Dimla' }
      ]
    },
    {
      name: 'Panchagarh',
      nameBn: 'পঞ্চগড়',
      division: 'Rangpur',
      upazilas: ['Panchagarh Sadar', 'Atwari', 'Boda', 'Debiganj', 'Tetulia'],
      postOffices: [
        { name: 'Panchagarh Head PO', postCode: '5000', upazila: 'Panchagarh Sadar' },
        { name: 'Boda', postCode: '5010', upazila: 'Boda' },
        { name: 'Debiganj', postCode: '5020', upazila: 'Debiganj' },
        { name: 'Tetulia', postCode: '5030', upazila: 'Tetulia' }
      ]
    },
    {
      name: 'Thakurgaon',
      nameBn: 'ঠাকুরগাঁও',
      division: 'Rangpur',
      upazilas: ['Thakurgaon Sadar', 'Baliadangi', 'Haripur', 'Pirganj', 'Ranisankhail'],
      postOffices: [
        { name: 'Thakurgaon Head PO', postCode: '5100', upazila: 'Thakurgaon Sadar' },
        { name: 'Pirganj', postCode: '5110', upazila: 'Pirganj' },
        { name: 'Ranisankhail', postCode: '5120', upazila: 'Ranisankhail' },
        { name: 'Baliadangi', postCode: '5140', upazila: 'Baliadangi' }
      ]
    },
    {
      name: 'Mymensingh',
      nameBn: 'ময়মনসিংহ',
      division: 'Mymensingh',
      upazilas: ['Mymensingh Sadar', 'Bhaluka', 'Dhobaura', 'Fulbaria', 'Gaffargaon', 'Gauripur', 'Haluaghat', 'Ishwarganj', 'Muktagachha', 'Nandail', 'Phulpur', 'Tara Khanda', 'Trishal'],
      postOffices: [
        { name: 'Mymensingh Head PO', postCode: '2200', upazila: 'Mymensingh Sadar' },
        { name: 'BAU (Agricultural University)', postCode: '2202', upazila: 'Mymensingh Sadar' },
        { name: 'Trishal', postCode: '2220', upazila: 'Trishal' },
        { name: 'Muktagachha', postCode: '2210', upazila: 'Muktagachha' },
        { name: 'Bhaluka', postCode: '2240', upazila: 'Bhaluka' },
        { name: 'Gaffargaon', postCode: '2230', upazila: 'Gaffargaon' },
        { name: 'Fulbaria', postCode: '2216', upazila: 'Fulbaria' },
        { name: 'Ishwarganj', postCode: '2280', upazila: 'Ishwarganj' }
      ]
    },
    {
      name: 'Jamalpur',
      nameBn: 'জামালপুর',
      division: 'Mymensingh',
      upazilas: ['Jamalpur Sadar', 'Bakshiganj', 'Dewanganj', 'Islampur', 'Madarganj', 'Melandaha', 'Sarishabari'],
      postOffices: [
        { name: 'Jamalpur Head PO', postCode: '2000', upazila: 'Jamalpur Sadar' },
        { name: 'Sarishabari', postCode: '2050', upazila: 'Sarishabari' },
        { name: 'Islampur', postCode: '2020', upazila: 'Islampur' },
        { name: 'Melandaha', postCode: '2010', upazila: 'Melandaha' },
        { name: 'Dewanganj', postCode: '2030', upazila: 'Dewanganj' }
      ]
    },
    {
      name: 'Netrokona',
      nameBn: 'নেত্রকোণা',
      division: 'Mymensingh',
      upazilas: ['Netrokona Sadar', 'Atpara', 'Barhatta', 'Durgapur', 'Khaliajuri', 'Kalmakanda', 'Kendua', 'Madan', 'Mohanganj', 'Purbadhala'],
      postOffices: [
        { name: 'Netrokona Head PO', postCode: '2400', upazila: 'Netrokona Sadar' },
        { name: 'Mohanganj', postCode: '2440', upazila: 'Mohanganj' },
        { name: 'Durgapur', postCode: '2420', upazila: 'Durgapur' },
        { name: 'Kendua', postCode: '2480', upazila: 'Kendua' },
        { name: 'Purbadhala', postCode: '2410', upazila: 'Purbadhala' }
      ]
    },
    {
      name: 'Sherpur',
      nameBn: 'শেরপুর',
      division: 'Mymensingh',
      upazilas: ['Sherpur Sadar', 'Jhenaigati', 'Nakla', 'Nalitabari', 'Sreebardi'],
      postOffices: [
        { name: 'Sherpur Head PO', postCode: '2100', upazila: 'Sherpur Sadar' },
        { name: 'Nalitabari', postCode: '2110', upazila: 'Nalitabari' },
        { name: 'Nakla', postCode: '2150', upazila: 'Nakla' },
        { name: 'Sreebardi', postCode: '2130', upazila: 'Sreebardi' }
      ]
    }
  ];

  // -------------------------------------------------------------
  // 2. DIPLOMA IN ENGINEERING TECHNOLOGIES / SUBJECTS (BTEB)
  // -------------------------------------------------------------
  const DIPLOMA_TECHNOLOGIES = [
    'Civil Technology',
    'Computer Technology',
    'Computer Science & Technology',
    'Electrical Technology',
    'Electronics Technology',
    'Mechanical Technology',
    'Power Technology',
    'Telecommunication Technology',
    'Architecture Technology',
    'Automobile Technology',
    'Chemical Technology',
    'Food Technology',
    'Environmental Technology',
    'Mechatronics Technology',
    'Electro-Medical Technology',
    'Graphic Arts Technology',
    'Surveying Technology',
    'Refrigeration and Air Conditioning (RAC)',
    'Mining and Mine Survey Technology',
    'Glass and Ceramic Technology',
    'Textile Engineering / Technology',
    'Marine Technology',
    'Shipbuilding Technology',
    'Instrumentation and Process Control',
    'Construction Technology',
    'Data Telecommunication & Networking',
    'Aircraft Maintenance Technology (Aerospace)',
    'Aircraft Maintenance Technology (Avionics)',
    'Garments Design and Pattern Making (GDPM)',
    'Agriculture Technology',
    'Fisheries Technology',
    'Livestock Technology',
    'Forestry Technology',
    'Medical Technology (Laboratory)',
    'Medical Technology (Dental)',
    'Medical Technology (Pharmacy)',
    'Medical Technology (Radiology & Imaging)',
    'Others'
  ];

  // HSC standard group subjects
  const HSC_GROUPS = [
    'Science',
    'Humanities',
    'Business Studies',
    'General',
    'Islamic Studies',
    'Vocational',
    'Home Economics',
    'Music',
    'Others'
  ];

  // -------------------------------------------------------------
  // 3. BANGLADESH UNIVERSITIES (PUBLIC & UGC APPROVED PRIVATE)
  // -------------------------------------------------------------
  const UNIVERSITIES = [
    // Public Universities
    'University of Dhaka (DU)',
    'Bangladesh University of Engineering and Technology (BUET)',
    'University of Rajshahi (RU)',
    'University of Chittagong (CU)',
    'Jahangirnagar University (JU)',
    'Shahjalal University of Science and Technology (SUST)',
    'Khulna University (KU)',
    'Bangladesh Agricultural University (BAU)',
    'Dhaka University of Engineering & Technology (DUET)',
    'Rajshahi University of Engineering & Technology (RUET)',
    'Chittagong University of Engineering & Technology (CUET)',
    'Khulna University of Engineering & Technology (KUET)',
    'Bangladesh Textile University (BUTEX)',
    'National University (NU)',
    'Bangladesh Open University (BOU)',
    'Jagannath University (JnU)',
    'Comilla University (CoU)',
    'Jatiya Kabi Kazi Nazrul Islam University (JKKNIU)',
    'Begum Rokeya University, Rangpur (BRUR)',
    'Bangladesh University of Professionals (BUP)',
    'Bangabandhu Sheikh Mujibur Rahman Science and Technology University (BSMRSTU)',
    'Bangabandhu Sheikh Mujib Medical University (BSMMU)',
    'Sher-e-Bangla Agricultural University (SAU)',
    'Patuakhali Science and Technology University (PSTU)',
    'Hajee Mohammad Danesh Science and Technology University (HSTU)',
    'Mawlana Bhashani Science and Technology University (MBSTU)',
    'Noakhali Science and Technology University (NSTU)',
    'Pabna University of Science and Technology (PUST)',
    'Jessore University of Science and Technology (JUST)',
    'University of Barishal (BU)',
    'Islamic University, Kushtia (IU)',
    'Bangabandhu Sheikh Mujibur Rahman Agricultural University (BSMRAU)',
    'Bangabandhu Sheikh Mujibur Rahman Maritime University (BSMRMU)',
    'Bangabandhu Sheikh Mujibur Rahman Digital University (BDU)',
    'Bangamata Sheikh Fojilatunnesa Mujib Science and Technology University',
    'Sheikh Hasina University, Netrokona',
    'Khulna Agricultural University (KAU)',
    'Chandpur Science and Technology University',
    'Bangabandhu Sheikh Mujibur Rahman Science and Technology University, Pirojpur',
    'Sunamganj Science and Technology University',
    'Mujibnagar University, Meherpur',
    'Kurigram Agricultural University',

    // UGC Approved Private Universities
    'North South University (NSU)',
    'BRAC University',
    'Ahsanullah University of Science and Technology (AUST)',
    'American International University-Bangladesh (AIUB)',
    'Independent University, Bangladesh (IUB)',
    'United International University (UIU)',
    'East West University (EWU)',
    'Daffodil International University (DIU)',
    'University of Liberal Arts Bangladesh (ULAB)',
    'Southeast University (SEU)',
    'Stamford University Bangladesh',
    'Green University of Bangladesh (GUB)',
    'Eastern University',
    'State University of Bangladesh (SUB)',
    'University of Asia Pacific (UAP)',
    'Primeasia University',
    'Northern University Bangladesh',
    'City University',
    'Premier University, Chittagong',
    'International Islamic University Chittagong (IIUC)',
    'ASA University Bangladesh',
    'Asian University of Bangladesh',
    'Atish Dipankar University of Science and Technology',
    'BGC Trust University Bangladesh',
    'Canadian University of Bangladesh',
    'Central Women\'s University',
    'Dhaka International University (DIU)',
    'European University of Bangladesh',
    'Gono Bishwabidyalay',
    'Hamdard University Bangladesh',
    'Manarat International University',
    'Port City International University',
    'Presidency University',
    'Prime University',
    'Royal University of Dhaka',
    'Shanto-Mariam University of Creative Technology',
    'Sonargaon University',
    'University of Development Alternative (UODA)',
    'University of Information Technology and Sciences (UITS)',
    'University of South Asia',
    'Varendra University',
    'World University of Bangladesh (WUB)',
    'Z.H. Sikder University of Science & Technology',
    'BGMEA University of Fashion & Technology (BUFT)',
    'Notre Dame University Bangladesh',
    'Fareast International University',
    'Times University Bangladesh',
    'Ranada Prasad Shaha University',
    'German University Bangladesh',
    'Global University Bangladesh',
    'N.P.I. University of Bangladesh',
    'Northern University of Business & Technology Khulna',
    'Rabindra Maitree University, Kushtia',
    'Central University of Science and Technology',
    'Tagore University of Creative Arts',
    'University of Global Village',
    'Rupayan A.K.M. Shamsuzzoha University',
    'ZNRF University of Management Sciences',
    'Ahsania Mission University of Science and Technology',
    'Khwaja Yunus Ali University',
    'Feni University',
    'Britannia University',
    'Cox\'s Bazar International University',
    'First Capital University of Bangladesh',
    'Ishakha International University, Bangladesh',
    'Trust University, Barishal',
    'International University of Business Agriculture and Technology (IUBAT)',
    'Others / Foreign University'
  ];

  // -------------------------------------------------------------
  // 4. GRADUATION DEGREES / EXAMINATIONS
  // -------------------------------------------------------------
  const GRADUATION_DEGREES = [
    'B.Sc (Bachelor of Science)',
    'B.Sc Engineering',
    'B.B.A (Bachelor of Business Administration)',
    'B.A (Bachelor of Arts)',
    'B.S.S (Bachelor of Social Science)',
    'B.Com (Bachelor of Commerce)',
    'LL.B (Bachelor of Laws)',
    'LL.B (Honours)',
    'MBBS (Bachelor of Medicine & Bachelor of Surgery)',
    'BDS (Bachelor of Dental Surgery)',
    'B.Pharm (Bachelor of Pharmacy)',
    'B.Sc in Agriculture',
    'B.Sc in Nursing',
    'B.Sc in Textile Engineering',
    'B.Sc in Computer Science & Engineering',
    'B.Arch (Bachelor of Architecture)',
    'B.Ed (Bachelor of Education)',
    'Fazil (Honours / Pass)',
    'B.Sc (Pass)',
    'B.A (Pass)',
    'B.S.S (Pass)',
    'B.Com (Pass)',
    'Equivalent'
  ];

  // -------------------------------------------------------------
  // 5. ACADEMIC SUBJECTS / MAJORS (ALL BANGLADESH DISCIPLINES)
  // -------------------------------------------------------------
  const GRADUATION_SUBJECTS = [
    // Engineering & Technology
    'Computer Science & Engineering',
    'Electrical & Electronic Engineering (EEE)',
    'Civil Engineering',
    'Mechanical Engineering',
    'Information & Communication Technology (ICT)',
    'Software Engineering',
    'Chemical Engineering',
    'Textile Engineering',
    'Industrial & Production Engineering (IPE)',
    'Architecture',
    'Materials & Metallurgical Engineering',
    'Electronics & Telecommunication Engineering (ETE)',
    'Biomedical Engineering',
    'Aeronautical Engineering',
    'Naval Architecture & Marine Engineering',
    'Petroleum & Mining Engineering',
    'Water Resources Engineering',
    'Mechatronics Engineering',
    'Food Engineering & Technology',
    'Environmental Science & Disaster Management',

    // Sciences
    'Physics',
    'Applied Physics & Electronics',
    'Chemistry',
    'Applied Chemistry & Chemical Engineering',
    'Mathematics',
    'Applied Mathematics',
    'Statistics',
    'Biochemistry & Molecular Biology',
    'Microbiology',
    'Biotechnology & Genetic Engineering',
    'Pharmacy',
    'Botany',
    'Zoology',
    'Fisheries',
    'Agriculture / Agronomy',
    'Soil, Water & Environment',
    'Genetics & Plant Breeding',
    'Horticulture',
    'Geology',
    'Geography & Environment',
    'Oceanography',

    // Business & Management
    'Accounting / Accounting & Information Systems (AIS)',
    'Finance / Finance & Banking',
    'Marketing',
    'Management / Management Information Systems (MIS)',
    'Human Resource Management (HRM)',
    'International Business',
    'Banking & Insurance',
    'Tourism & Hospitality Management',
    'Supply Chain Management',

    // Arts, Humanities & Social Sciences
    'Economics',
    'English',
    'Bengali (Bangla)',
    'Political Science',
    'Public Administration',
    'International Relations (IR)',
    'Sociology',
    'Social Work',
    'Law / LL.B',
    'Mass Communication & Journalism',
    'History',
    'Islamic History & Culture',
    'Philosophy',
    'Islamic Studies',
    'Arabic',
    'Anthropology',
    'Archaeology',
    'Psychology',
    'Information Science & Library Management',
    'Education / B.Ed',
    'Fine Arts / Graphic Design / Drawing & Painting',
    'Music',
    'Theatre & Performance Studies',
    'Women & Gender Studies',
    'Development Studies',
    'Criminology & Police Science',
    'Peace & Conflict Studies',

    // Medical, Dental & Health
    'Medicine (MBBS)',
    'Dental Surgery (BDS)',
    'Nursing',
    'Physiotherapy',
    'Public Health',
    'Veterinary Medicine & Animal Science (DVM)',

    // Others
    'General / Pass Course',
    'Others'
  ];

  return {
    DISTRICTS,
    DIPLOMA_TECHNOLOGIES,
    HSC_GROUPS,
    UNIVERSITIES,
    GRADUATION_DEGREES,
    GRADUATION_SUBJECTS
  };
});
