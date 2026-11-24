/* ===== SITE SETTINGS: the only file you need to edit =====
   Both pages (the book page and the quiz) read these lines. */

// Gumroad product link, e.g. "https://geshv1.gumroad.com/l/unreadable".
// When filled in, every "Get the book" button opens the checkout in a pop-up on the page.
window.GUMROAD_URL = "";

// Checkout link: every "Get the book" button goes here (used while GUMROAD_URL is empty).
// Payhip product page for Unreadable.
window.BUY_URL = "https://payhip.com/b/fPu7S";

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
