/* =========================================================
   SHANI TRADERS APP — SETTINGS
   Edit only this file to change shop details.
   ========================================================= */
window.SHOP = {
  name: "Shani Traders",
  nameHi: "शनि ट्रेडर्स",
  tagline: "Building material, Saraipali",
  taglineHi: "बिल्डिंग मटेरियल, सरायपाली",

  // WhatsApp number with country code, digits only (91 + 10-digit mobile)
  whatsapp: "919399893129",
  phone: "+91 93998 93129",
  email: "shanitraders52@gmail.com",

  address: "Main Road, Patsendri, Saraipali, Dist. Mahasamund, Chhattisgarh",
  addressHi: "मेन रोड, पटसेंद्री, सरायपाली, ज़िला महासमुंद, छत्तीसगढ़",
  gstin: "22HEPPP0273E1ZH",
  hours: "Monday to Saturday, 8 am to 8 pm",
  hoursHi: "सोमवार से शनिवार, सुबह 8 से रात 8 बजे",

  // Language for a first-time user: "en", "hi", or "auto" (Hindi if the phone is set to Hindi)
  defaultLang: "auto",
  mapQuery: "Patsendri, Saraipali, Mahasamund, Chhattisgarh",

  // Paste the Google Apps Script Web App URL here (ends with /exec).
  apiUrl: "https://script.google.com/macros/s/AKfycbx4-LLOOYhSBMiqe9-MOBjXp53IfkUG_TDUmvLQx3cfq1deY-WeYXCpOHnQtZO5Z7-C/exec",

  // How often the app re-checks prices in the background (minutes)
  cacheMinutes: 3,

  credit: { name: "Weave Solutions", url: "https://weavesolution.com" }
};

/* Categories, in the order shown in the app.
   "id" is what goes in the Category column of the Products sheet.
   "icon" is the drawing used when the category has no product photo yet. */
window.CATEGORIES = [
  { id: "cement",     icon: "cement",     name: "Cement & sand",        nameHi: "सीमेंट और रेत" },
  { id: "steel",      icon: "steel",      name: "Sariya & steel",       nameHi: "सरिया और स्टील" },
  { id: "bricks",     icon: "bricks",     name: "Bricks",               nameHi: "ईंट" },
  { id: "plumbing",   icon: "plumbing",   name: "Pipes & fittings",     nameHi: "पाइप और फ़िटिंग" },
  { id: "electrical", icon: "electrical", name: "Electrical",           nameHi: "बिजली का सामान" },
  { id: "hardware",   icon: "hardware",   name: "Door hardware",        nameHi: "दरवाज़े का सामान" },
  { id: "curtain",    icon: "curtain",    name: "Curtain fittings",     nameHi: "पर्दे की फ़िटिंग" },
  { id: "tools",      icon: "tools",      name: "Hand tools",           nameHi: "हाथ के औज़ार" },
  { id: "power",      icon: "power",      name: "Power tools",          nameHi: "मशीन और बिट" },
  { id: "tapes",      icon: "tapes",      name: "Tapes & adhesives",    nameHi: "टेप और गोंद" },
  { id: "fasteners",  icon: "fasteners",  name: "Screws & fasteners",   nameHi: "स्क्रू और कील" },
  { id: "paints",     icon: "paints",     name: "Paint & finishing",    nameHi: "पेंट और घिसाई" },
  { id: "tiles",      icon: "tiles",      name: "Tiles",                nameHi: "टाइल्स" },
  { id: "safety",     icon: "safety",     name: "Rope & safety",        nameHi: "रस्सी और सुरक्षा" }
];
