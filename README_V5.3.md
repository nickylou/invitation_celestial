# Celestial Invitation V5.3

## Admin settings
Edit `config.js` to change wedding dates, RSVP deadline, Google Apps Script endpoint, music volume, livestream link, and guest photo-upload link.

To enable a livestream, set `livestream.enabled` to `true` and provide its URL.
To enable guest photo uploads, set `photoUpload.enabled` to `true`, provide the upload URL, and optionally add `assets/photo-upload-qr.png`.

## Gallery
The gallery uses `assets/gallery/gallery.json`, thumbnail files in `assets/gallery/thumbs/`, and full images in `assets/gallery/full/`. Only thumbnails load in the grid. Full images load on demand in the lightbox.

The site must be served over HTTP/HTTPS (for example GitHub Pages). Opening `index.html` directly through `file://` will prevent `fetch()` from reading `gallery.json`.
