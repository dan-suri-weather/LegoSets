"""Rebuilds sets.json from Rebrickable's daily downloads (sets.csv.zip and themes.csv.zip).

Keeps sets from 1977 on, and leaves out Gear (merchandise), Books, and 0-piece entries
(which are mostly bundles of other sets). Run by .github/workflows/update-sets.yml,
or by hand: python scripts/update_sets.py
"""
import csv
import io
import json
import urllib.request
import zipfile
from datetime import date
from pathlib import Path

BASE = 'https://cdn.rebrickable.com/media/downloads/'
IMG = 'https://cdn.rebrickable.com/media/sets/'
FIRST_YEAR = 1977
SKIP_THEMES = {'Gear', 'Books'}
OUT = Path(__file__).resolve().parent.parent / 'sets.json'


def read_csv(name):
    req = urllib.request.Request(BASE + name + '.csv.zip', headers={'User-Agent': 'lego-tracker'})
    with urllib.request.urlopen(req, timeout=120) as r:
        z = zipfile.ZipFile(io.BytesIO(r.read()))
    with z.open(name + '.csv') as f:
        return list(csv.DictReader(io.TextIOWrapper(f, encoding='utf-8')))


themes = {t['id']: t for t in read_csv('themes')}


def theme_path(tid):
    """Returns (top-level theme, sub-theme or '')."""
    names = []
    while tid:
        names.append(themes[tid]['name'])
        tid = themes[tid]['parent_id']
    return names[-1], names[0] if len(names) > 1 else ''


sets = []
for s in read_csv('sets'):
    year, parts = int(s['year']), int(s['num_parts'])
    theme, sub = theme_path(s['theme_id'])
    if year < FIRST_YEAR or parts == 0 or theme in SKIP_THEMES:
        continue
    img = s['img_url']
    # Image is stored only when it isn't the usual <set_num>.jpg, to keep the file small.
    img = '' if img == IMG + s['set_num'] + '.jpg' else img.removeprefix(IMG)
    sets.append([s['set_num'], s['name'], year, theme, sub, parts, img])

if len(sets) < 10000:
    raise SystemExit(f'Only {len(sets)} sets - the Rebrickable download looks wrong')

sets.sort(key=lambda s: (s[2], s[0]))
# Leave the file (and its date) alone when nothing changed, so the daily job only commits real updates.
if OUT.exists() and json.loads(OUT.read_text(encoding='utf-8'))['sets'] == sets:
    print('No changes.')
    raise SystemExit(0)
OUT.write_text(json.dumps({'updated': date.today().isoformat(), 'sets': sets},
                          ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'Wrote {len(sets)} sets to {OUT}')
