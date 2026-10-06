/* =========================================================
   SHANI TRADERS — SITE SETTINGS
   Edit only this file to change shop details.
   Product photos: images/<item code>.jpg (item code is shown in master control).
   ========================================================= */
window.SHOP = {
  name: "Shani Traders",
  tagline: "Building material, Saraipali",

  // WhatsApp number with country code, digits only (91 + 10-digit mobile)
  whatsapp: "919399893129",
  phone: "+91 93998 93129",
  email: "shanitraders52@gmail.com",

  address: "Main Road, Patsendri, Saraipali, Dist. Mahasamund, Chhattisgarh",
  gstin: "22HEPPP0273E1ZH",
  hours: "Monday to Saturday, 8 am to 8 pm",
  mapQuery: "Patsendri, Saraipali, Mahasamund, Chhattisgarh",

  // Paste the Google Apps Script Web App URL here (ends with /exec).
  apiUrl: "https://script.google.com/macros/s/AKfycbx4-LLOOYhSBMiqe9-MOBjXp53IfkUG_TDUmvLQx3cfq1deY-WeYXCpOHnQtZO5Z7-C/exec",

  // How long a visitor's browser keeps the price list before re-checking (minutes)
  cacheMinutes: 5,

  credit: { name: "Weave Solutions", url: "https://weavesolution.com" }
};

/* Categories, in the order a building goes up.
   "id" is what you type in the Category column of the sheet. */
window.CATEGORIES = [
  { id: "cement",     name: "Cement, sand & gitti",   stage: "Foundation", icon: "cement",     blurb: "Cement bags, river sand and stone aggregate." },
  { id: "steel",      name: "Sariya & steel",         stage: "Structure",  icon: "steel",      blurb: "TMT bars in every size and binding wire." },
  { id: "bricks",     name: "Bricks & blocks",        stage: "Walls",      icon: "bricks",     blurb: "Red clay bricks, fly ash bricks and AAC blocks." },
  { id: "plumbing",   name: "Plumbing & sanitary",    stage: "Services",   icon: "plumbing",   blurb: "Pipes, fittings, taps and water tanks." },
  { id: "electrical", name: "Electrical",             stage: "Services",   icon: "electrical", blurb: "House wire, switches and fittings." },
  { id: "tiles",      name: "Tiles & flooring",       stage: "Finishing",  icon: "tiles",      blurb: "Floor and wall tiles, tile adhesive." },
  { id: "paints",     name: "Paint & waterproofing",  stage: "Finishing",  icon: "paints",     blurb: "Emulsions, putty and waterproofing chemicals." },
  { id: "tools",      name: "Hardware & tools",       stage: "Every stage",icon: "tools",      blurb: "Tasla, phawda, line-dori and site tools." }
];
