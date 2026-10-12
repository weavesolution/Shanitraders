# Shani Traders customer app

Install page: `index.html` → the app: `app.html`. Master control is a separate repository (st-admin).

Files (main folder): index.html · app.html · app.css · app.js · i18n.js · config.js · sw.js · manifest.webmanifest · version.json · README.md
Folder `images`: logo, app icons and owner.jpg.

- `config.js`: shop details and `apiUrl` (the Apps Script /exec link). It must be the same link as in the st-admin repository.
- `i18n.js`: all wording in English and Hindi.
- New version: upload the changed files and raise the number in `version.json`; phones show "A new version is ready",
  and Account › Update to latest version loads it.
- Price changes from ST Admin reach phones within 10 minutes, or at once with Account › Refresh prices and photos.
