/* ==========================================================================
   Perfect 32 Dental Clinic, Ambala — SINGLE SOURCE OF TRUTH
   Edit this file to change clinic details anywhere on the site.

   Sourced from the clinic's Google Business Profile and grexa.site listing
   on 26 Aug 2026. Items marked TODO still need confirming by the clinic.
   ========================================================================== */
window.CLINIC = {
  name: "Perfect 32 Dental Clinic",
  tagline: "Advanced dentistry in Ambala, backed by 24+ years.",

  /* ---- Contact ---------------------------------------------------------- */
  phonePrimary:   "+918222853707",
  phoneSecondary: "",                 // TODO: add a second line if you have one
  email:          "perfect32amb@gmail.com",

  /* WhatsApp number, international format, digits only, no "+".
     The Google listing and grexa site both use this number. */
  whatsapp: "918222853707",

  address: {
    line1:  "1179/7A, Opposite Ambala Club",
    line2:  "Kartar Nagar, Amrit Nagar, Model Town",
    city:   "Ambala",
    region: "Haryana",
    postal: "134003",
    country: "IN"
  },

  mapEmbed:  "https://www.google.com/maps?q=Perfect+32+Dental+Clinic+Model+Town+Ambala&output=embed",
  mapLink:   "https://maps.app.goo.gl/Xb3j6PkAcgHWRVyS7",
  reviewUrl: "",                      // TODO: Google "write a review" short link

  /* ---- Opening hours ---------------------------------------------------- *
   * 0 = Sunday ... 6 = Saturday.  null = closed.
   * Mon-Sat run TWO sessions; Sunday is mornings only.                     */
  hours: {
    0: [["11:00", "14:00"]],                          // Sunday
    1: [["10:00", "14:00"], ["17:00", "20:00"]],      // Monday
    2: [["10:00", "14:00"], ["17:00", "20:00"]],
    3: [["10:00", "14:00"], ["17:00", "20:00"]],
    4: [["10:00", "14:00"], ["17:00", "20:00"]],
    5: [["10:00", "14:00"], ["17:00", "20:00"]],
    6: [["10:00", "14:00"], ["17:00", "20:00"]]       // Saturday
  },
  slotMinutes: 30,
  bookAheadDays: 60,
  minNoticeHours: 2,

  closedDates: [],   // festivals / leave, format "2026-10-20"

  /* ---- Services --------------------------------------------------------- *
   * The grexa listing advertises 47 services. These are the ones patients
   * actually search for — keep this list short so the booking form stays
   * usable. Everything else lives on the treatments page.                  */
  services: [
    { id:"general",     name:"Check-up & Cleaning",  blurb:"Examination, scaling & polishing, fillings." },
    { id:"implants",    name:"Dental Implants",      blurb:"Straumann, Neodent and Dentsply Ankylos systems." },
    { id:"rct",         name:"Root Canal",           blurb:"Painless single-visit RCT where suitable." },
    { id:"crowns",      name:"Crowns & Fixed Teeth", blurb:"Crowns, bridges and full-mouth rehabilitation." },
    { id:"whitening",   name:"Laser Teeth Whitening",blurb:"In-clinic whitening and smile design." },
    { id:"ortho",       name:"Braces & Aligners",    blurb:"Clear aligners and ceramic braces." },
    { id:"pediatric",   name:"Children's Dentistry", blurb:"Gentle first visits, sealants, fluoride." },
    { id:"emergency",   name:"Dental Emergency",     blurb:"Pain, swelling, broken or knocked-out tooth." },
    { id:"other",       name:"Something else",       blurb:"Not sure? Tell us and we'll advise." }
  ],

  /* ---- Booking delivery ------------------------------------------------- */
  bookingMode: "whatsapp",
  bookingEndpoint: "",

  social: {
    facebook:  "",   // TODO
    instagram: "https://instagram.com/perfect32dentalamb",
    youtube:   ""    // TODO
  }
};
