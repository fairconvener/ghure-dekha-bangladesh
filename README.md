# ঘুরে দেখা বাংলাদেশ

Live site: https://ghuredekhabangladesh.com (English: https://ghuredekhabangladesh.com/en)

Static site: pick the districts you have visited, add your name and photo, download a shareable map (PNG/JPG/PDF).

Map data: geoBoundaries (CC BY 4.0).

## Tracking (Meta Pixel)

Every page loads `/gd-meta.js` from `<head>`: `<script src="/gd-meta.js" defer></script>` (also the /m/ share page in `api/map.js`).
Keep this line in every new or regenerated page, otherwise those visitors are not counted in the Facebook ad audiences.

- Dataset: "Ghure Dekha Bangladesh" 1625497289119639 (Fair Convener business), used by the FC ad accounts for retargeting.
- Events: PageView on every page; custom MapStart, PhotoAdded, MapDownload, MapShare, GuideRead, Engaged30s. No names, photos or place lists are sent.
- New features can send their own event: `window.gdTrack('EventName', {key: 'value'})`.
- `index.html` also carries Meta's domain verification tag (`facebook-domain-verification`) - keep it.
- `/privacy` explains the pixel and lets a visitor switch it off (localStorage `gd-no-track`); gd-meta.js adds a link to it in every footer.
