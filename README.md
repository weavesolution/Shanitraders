# Shani Traders app (installable phone app, PWA)

Customers install it from your GitHub Pages link, order from the app, and earn points they exchange for gifts.
No payment gateway: customers pay cash or UPI on delivery.

## Files for GitHub (all in the main folder)
index.html (install page with logo) · app.html (the app) · admin.html (master control)
app.css · admin.css · app.js · admin.js · i18n.js · config.js · sw.js · manifest.webmanifest · starter-items.json · README.md

One folder: `images` (logo, app icons, 60 product photos).

**Delete the old website files from GitHub:** products.html, product.html, enquiry.html, about.html, contact.html,
calculator.html, style.css, lang.js, calc.js. `Code.gs` never goes on GitHub.

The link you share with customers is the main site link (index.html). It shows the logo and an **Install the app** button.
On iPhone it shows the Safari steps (Share → Add to Home Screen).

## Google Sheet + Apps Script (do this once for this version)
1. Open the Sheet > Extensions > Apps Script. Delete all old code, paste the new `Code.gs`, save.
2. Select `setup` and click Run. Allow the permissions (Drive for photos, email for orders).
   If Google says "app isn't verified": Advanced > Go to project > Allow (it is your own script).
3. Open "Execution log": copy the **ADMIN KEY** (unchanged if you already had one).
4. Deploy > Manage deployments > pencil > Version: **New version** > Deploy. The URL stays the same, so config.js needs no change.

`setup` adds these tabs: Products, Customers, Orders, Ledger (every points change), Gifts, Redemptions (gift requests), Settings.
Your old tabs (Enquiries) are left as they are.

## First time in master control (admin.html)
1. Sign in with the admin key.
2. Items > **Add catalogue items with photos** (loads 84 items: your 60 photos + cement, sariya, bricks, etc.).
3. Fill in prices. Empty price shows "Ask price" and customers can still order; you confirm the rate on the call.
4. Gifts > switch on the gifts you want (4 samples are added switched off) and change their points.
5. Settings > points per ₹100 (default 1) and welcome points (default 50).

## How points work
- Each item can have its own **points per unit** (Items tab, "pts" box). Empty = Settings rate (1 point per ₹100).
- Points are added only when you set the order to **Delivered**. Change "Points to give" before saving if needed.
- If a delivered order is later cancelled, its points are taken back automatically.
- A gift request takes the points at once. **Reject and refund** gives them back; **Mark given** when handed over.
- Customers > Add / remove points for any manual bonus or correction. Every change is listed in the Ledger tab.

## Customer accounts
Mobile number + a 4-digit PIN the customer sets (no OTP, free). Forgot PIN: the customer taps "Forgot PIN?" which
WhatsApps you; in Customers press **Reset PIN**, and they set a new one at the next login. Points stay safe.

## Orders
New orders are emailed to you and appear in the Orders tab (checked every minute while it is open).
Set the status (Confirmed → Out for delivery → Delivered), the final bill amount, and press Save.
"WhatsApp status" sends the customer a ready message in Hindi and English.

## Photos
- Photos in the `images` folder are part of the app. New photos: Items > Edit > Upload photo (stored in your Google Drive)
  or Find photo online (free photos with credit).
- The app saves every photo on the customer's phone the first time, so later it opens fast and works with weak internet.

## Changing wording or shop details
- Shop name, phone, WhatsApp, address, timings, categories: `config.js`
- All app text in English and Hindi: `i18n.js`
- After changing files on GitHub, customers get the new version the next time they open the app.

## Material calculator
In the app (home page card and Account menu). Results go straight into the cart; items not in the app (sariya mix,
paint litres) are added to the order note.
