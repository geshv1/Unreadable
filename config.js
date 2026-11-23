/* ===== SITE SETTINGS: the only file you need to edit =====
   Both pages (the book page and the quiz) read these lines. */

// Gumroad product link, e.g. "https://geshv1.gumroad.com/l/completefighter".
// When filled in, every "Get the book" button opens the checkout in a pop-up on the page.
window.GUMROAD_URL = "";

// Beacons checkout link: used only while GUMROAD_URL is empty
window.BUY_URL = "https://shop.beacons.ai/geshv1/cf9f8f01-9fad-461e-a346-1a0034c07603";

// Umami analytics (free): paste your Website ID from cloud.umami.is. Empty = analytics off.
window.UMAMI_ID = "";

// Kit email list (free): paste your form ID from kit.com. Empty = the email box on the quiz result stays hidden.
window.KIT_FORM_ID = "";

/* ========================================================== */

// Load analytics only once an ID is filled in
(function(){
  if (!window.UMAMI_ID) return;
  var s = document.createElement("script");
  s.defer = true;
  s.src = "https://cloud.umami.is/script.js";
  s.setAttribute("data-website-id", window.UMAMI_ID);
  document.head.appendChild(s);
})();

// Record a funnel step (quiz started, quiz finished, email added...). Safe to call when analytics is off.
window.track = function(name, data){
  try { if (window.umami) window.umami.track(name, data); } catch (e) {}
};
