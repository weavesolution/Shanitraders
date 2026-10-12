# Shani Traders apps (v3)

Two installable phone apps on one GitHub Pages site, sharing one Google Sheet:

| App | Open | For |
|---|---|---|
| **Shani Traders** | `index.html` (install page) → `app.html` | Customers: browse, order, points, gifts |
| **ST Admin** | `admin.html` | Shop: orders, items, categories, customers, gifts, settings |

Both can be installed on the same phone; they open separately.

## Files for GitHub (main folder)
index.html · app.html · admin.html · version.json · app.css · admin.css · app.js · admin.js · i18n.js · config.js · sw.js ·
manifest.webmanifest · admin.webmanifest · starter-items.json · README.md
Folder `images`: logo and app icons only (including the new admin-*.png icons).
`Code.gs` never goes on GitHub. Product photos live in Google Drive.

## Update steps for this version
1. Upload all files above to GitHub (replace the old ones, add `admin.webmanifest` and the new `images/admin-*.png`).
2. Apps Script: paste the new `Code.gs`, save, run `setup` once (adds the Categories tab and new columns), then
   Deploy > Manage deployments > pencil > Version: New version > Deploy.
3. Open `admin.html` on your phone, sign in, tap **Install** at the top (Android Chrome) to get the ST Admin app.
4. Items > **Update catalogue**: adds 82 new items and moves all items into the 16 new categories with estimated prices.
   Prices you already typed are kept.
5. Unzip `product-photos-2.zip`. Items > **Upload many photos** > select all 171 files at once.

## Releasing a new version
1. Upload the changed files to GitHub.
2. Change the number in `version.json` (e.g. 3.1 → 3.2). Each new zip from me already has the right number.
3. Phones see "A new version of the app is ready" on the home page; Account > Update to latest version
   (ST Admin: Settings > Update to latest version) loads it at once. Photos, cart and login stay.

## Photo file names (for bulk upload or for putting straight into the Drive folder)
- `item-code.jpg` → the item's main photo
- `item-code--3.jpg` → the photo of option 3 of that item (designs, colours, sizes)
- `cat-category-code.jpg` → the category's own photo (optional)
Item and category codes are shown in ST Admin.

## Options and measured items
- An item can have options (sizes, designs, colours), each with its own price and photo. Edit item > Options.
- Items sold per metre, ft, kg or litre can be ordered in parts (12.5 metre). Items sold per sq ft show a
  Length × Height box so the customer gets the right quantity and price.

## Orders
Statuses: **Order placed**, **Delivered**, **Cancelled**. Tap an order in ST Admin to open it: call, WhatsApp status,
bill amount, points, status. Points are added on Delivered and taken back if it is later cancelled.
Order numbers count up per day (ST261012-001, -002 …) inside a lock, so two customers ordering at the same moment
never clash, and a repeated send (weak network) never creates a duplicate order.

## Keeping Google's free limits low
- Customer app: prices are re-checked every 10 minutes at most; if nothing changed, the server answers in a few bytes.
- ST Admin keeps everything on the phone and asks only for what changed (one call every 2 minutes while open).
- Photos are downloaded once and kept on each phone.
- Gmail sends about 100 emails a day from a free account. If you get more orders than that, set
  Settings > "Email every new order" to **no**; orders still appear in ST Admin.

## Points
Settings > points per ₹100 (default 1) applies to every item automatically. Type points on an item only to override it.
