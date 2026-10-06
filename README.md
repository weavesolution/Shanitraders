# Shani Traders website

Static multipage site for GitHub Pages, with a Google Sheet + Apps Script backend for prices, stock, enquiries and email.

| Page | What it does |
|---|---|
| index.html | Home with live "Today's rates" board and categories |
| products.html | Full catalogue, search (Hindi names work too: sariya, eent, ret), category filter |
| product.html | Item page with quantity, add to enquiry list, ask on WhatsApp |
| enquiry.html | Enquiry list + form (saves to sheet, emails you, emails the customer a copy) |
| about.html, contact.html | Shop info, map |
| admin.html | Master control: add/edit items, change price, stock on/off, hide, enquiries |

## 1. Shop details
Edit `assets/js/config.js` only: WhatsApp number, phone, email, timings. Categories are listed there too.

## 2. Google Sheet + Apps Script (one time)
1. Create a new Google Sheet named "Shani Traders Website".
2. Extensions > Apps Script. Delete the sample code, paste `apps-script/Code.gs`, save.
3. Project Settings > Time zone: (GMT+05:30) India Standard Time.
4. Choose `setup` in the function dropdown and click Run. Allow permissions.
5. Open Executions log: copy the ADMIN KEY. Enquiry emails go to the Google account that ran it (change OWNER_EMAIL in Project Settings > Script properties if needed; the admin key can be changed there too).
6. Deploy > New deployment > type Web app. Execute as: Me. Who has access: Anyone. Deploy and copy the URL ending in `/exec`.
7. Paste that URL into `apiUrl` in `assets/js/config.js`.

After any later change to Code.gs: Deploy > Manage deployments > Edit > Version: New version > Deploy (the URL stays the same).

## 3. GitHub Pages
Upload all files (keep the folders) to a repository, then Settings > Pages > Deploy from branch > main / root.

## 4. First login
Open `yoursite/admin.html`, enter the admin key, click "Load starter items" and set your own prices.
Starter prices are samples only.

## Notes
- Price left empty shows "Ask for price" (good for sand and gitti that depend on distance).
- "In stock" off: item stays visible with "Out of stock", the add button is disabled.
- "Show on site" off: item disappears from the site but stays in the sheet.
- "Show on rate board": item appears on the home page board (up to 7).
- Photos: upload to `assets/img/products/` and write the path in the item's Photo link.
- Price changes reach visitors within about 5 minutes (browser cache, `cacheMinutes` in config).
- If you edit the Products sheet by hand, run `refreshSite` in Apps Script so the site picks it up at once.
- Without `apiUrl`, the site runs from `data/products.json` and the form sends the enquiry to WhatsApp.
