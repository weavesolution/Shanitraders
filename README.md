# Shani Traders website

## Files in the GitHub repo
Upload these to the main (root) folder of the repo:

index.html, products.html, product.html, enquiry.html, about.html, contact.html, admin.html,
style.css, config.js, app.js, admin.js, starter-items.json, README.md

Create one folder named `images` and put favicon.svg and all product photos in it.

`Code.gs` does not go on GitHub. It lives only in Apps Script.

## Product photo names
Each item has an item code. The photo must be named exactly `item-code.jpg` and uploaded to the `images` folder.

- Use small letters and `.jpg` (GitHub treats `Tmt-8mm.JPG` and `tmt-8mm.jpg` as different files).
- Square photos around 800 x 800 px, under 300 KB, look best.
- No photo? The site shows a category drawing instead.
- For items you add later, master control shows the photo name under each item (Photo: xyz.jpg).

| Item | Photo file name |
|---|---|
| PPC cement, 50 kg bag | `ppc-cement.jpg` |
| OPC 53 grade cement, 50 kg bag | `opc-cement.jpg` |
| River sand (ret) | `river-sand.jpg` |
| Stone aggregate 20 mm (gitti) | `gitti-20mm.jpg` |
| Stone aggregate 10 mm (gitti) | `gitti-10mm.jpg` |
| TMT bar 8 mm | `tmt-8mm.jpg` |
| TMT bar 10 mm | `tmt-10mm.jpg` |
| TMT bar 12 mm | `tmt-12mm.jpg` |
| TMT bar 16 mm | `tmt-16mm.jpg` |
| Binding wire | `binding-wire.jpg` |
| Red clay brick | `red-brick.jpg` |
| Fly ash brick | `fly-ash-brick.jpg` |
| PVC pipe | `pvc-pipe.jpg` |
| CPVC pipe | `cpvc-pipe.jpg` |
| Water tank | `water-tank.jpg` |
| House wire | `house-wire.jpg` |
| Modular switches and sockets | `switches.jpg` |
| Floor tile | `floor-tile.jpg` |
| Wall tile | `wall-tile.jpg` |
| Wall putty | `wall-putty.jpg` |
| Paint | `paint.jpg` |
| Waterproofing chemical | `waterproofing.jpg` |
| Tasla (pan) | `tasla.jpg` |
| Phawda (shovel) | `phawda.jpg` |

Optional: `images/logo.png` is not used yet; send it if you want the logo in the header.

## Apps Script
After pasting a new version of Code.gs: Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy. The /exec URL stays the same.

Check it works: open the /exec URL in a browser. It should show text starting with {"ok":true,"products":[

## First login
Open yoursite/admin.html, enter the admin key from the setup() log, click "Load starter items" (or add your own), then fill in prices.
Items with no price show "Ask for price".

## Notes
- In stock off: shows "Out of stock", add button disabled.
- Show on site off: hidden from the website, kept in the sheet.
- Show on rate board: appears in "Today's rates" on the home page (up to 7).
- Price changes reach visitors within about 5 minutes.
- If you edit the Products sheet by hand, run `refreshSite` in Apps Script so the site updates at once.
