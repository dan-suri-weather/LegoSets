LEGO TRACKER
============

A small web app for tracking which Lego sets Sarah, Dan and Rufus have, and which ones Sarah and Dan want.
It runs in any browser (iPhone, Android, laptop) and can be added to the Home Screen so it opens like an app.
The has / wants marks are shared through a Google Sheet once it's set up (see SETUP-SHARING.txt);
until then they're saved on each device only.


FILES
-----

index.html                          The whole app
sets.json                           The set list (number, name, year, theme, sub-theme, pieces, picture)
sw.js, manifest.webmanifest,        Let it work offline and install to the Home Screen
icon-180.png, icon-192.png,
icon-512.png
scripts/update_sets.py and          Rebuild sets.json every day from Rebrickable's downloads
.github/workflows/update-sets.yml   (sets.csv.zip and themes.csv.zip)
google-sheet/Code.gs and            The script that lets the Google Sheet hold the shared marks
SETUP-SHARING.txt                   and how to set it up


WHICH SETS ARE INCLUDED
-----------------------

Everything on Rebrickable from 1977 onwards (about 18,000 sets), except:
- the Gear theme (bags, clocks, video games, etc.) and the Books theme
- entries with 0 pieces, which are mostly bundles of other sets
To change this, edit FIRST_YEAR and SKIP_THEMES near the top of scripts/update_sets.py.

The Theme column shows Rebrickable's top-level theme (e.g. Star Wars), with the sub-theme
(e.g. Ultimate Collector Series) underneath in grey.

Pictures are loaded from Rebrickable as you scroll, so they need an internet connection.


PUTTING IT ONLINE
-----------------

Same as the Persephone tracker:
1. Upload everything in this folder to dan-suri-weather/LegoSets, including the .github folder.
2. Make it public, then Settings > Pages > Deploy from a branch > main, / (root) > Save.
3. Settings > Actions > General > Workflow permissions > "Read and write permissions" > Save.
   This lets the daily update job save the new set list.
The app is then at https://dan-suri-weather.github.io/LegoSets/
The repo is public, but it holds only the set list and the app. The family's marks live in
your Google Sheet, protected by the family code, which isn't in the repo.

To try it on the PC first, run this in the lego-tracker folder and open http://localhost:8765
   python -m http.server 8765


INSTALLING ON A PHONE
---------------------

iPhone: open the web address in Safari, then tap Share > Add to Home Screen > Add.
Android: open it in Chrome, then tap the ⋮ menu > Add to Home screen (or Install app).
Then open it from the Home Screen icon, and enter the family code the first time.


USING IT
--------

- Tap a box to mark it: Sarah has = orange, Dan has = red, Rufus has = green,
  Sarah wants = pink, Dan wants = blue. Tap again to clear it.
- Tap Name, Set no., Year or Theme at the top to sort. Tap again to reverse the order.
  On a phone these are all in the Name column heading.
- Tap a picture to see it full size, or a set name to open its Rebrickable page.
- Search finds any part of a name, theme or sub-theme, or the start of a set number (e.g. 7519).
- "Theme & decade" picks one theme and/or one decade.
- "Has / wants" picks any of the five marks. "Match any" shows sets with at least one of
  the ticked marks, "all" needs every ticked mark, and "none" hides sets with any of them
  (e.g. tick Sarah has, Dan has and Rufus has, then "none", to see sets nobody owns).
  The number on each filter button shows how many of its filters are switched on.
- Export to .csv saves every set that has at least one mark. On a phone it opens the
  share sheet, where you can save to Files, email it, and so on.
- Restore from .csv replaces all the marks (for everyone, once sharing is set up) with the
  ones in an export. Export now and then as a backup.


HOW THE SET LIST UPDATES
------------------------

Rebrickable updates its downloads daily. The GitHub Action runs every morning at 06:00 UTC,
rebuilds sets.json, and saves it only if a set changed. The app picks up the new list
next time it's opened with an internet connection. Marks are kept by set number, so they're
never affected. To update straight away, open the repo's Actions tab, pick "Update set list",
and click "Run workflow".
