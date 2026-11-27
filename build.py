"""Baut alle Labore aus labs/ zu fertigen, eigenständigen HTML-Dateien.

    python3 build.py

Quelle (von Hand bearbeiten):
  labs/_shared/      gemeinsames Gerüst: page.html, base.css, core.js, trainer.js, profi.js, ohne-ueben.js, app.js, admin/
  labs/<id>/         ein Labor: lab.json (Steckbrief), tabs.html, style.css, lab.js

Ergebnis (nie von Hand bearbeiten, wird überschrieben):
  labore/<Titel>.html          eigenständig, ohne Anmeldung (Doppelklick genügt)
  adminpanel/<Id>.html         mit Anmeldung, für die Google-Web-App (kommt in den Drive-Ordner Adminpanel)
  docs/<id>/index.html         mit Anmeldung, für GitHub Pages
  docs/index.html              Startseite mit allen Laboren
  docs/admin/index.html        Lehrer-Oberfläche für GitHub Pages
  adminpanel/Labs.gs           Labor-Liste für Code.gs
"""
import html, json, os

ROOT = os.path.dirname(os.path.abspath(__file__))
LABS = os.path.join(ROOT, 'labs')
SHARED = os.path.join(LABS, '_shared')


def read(*p):
    with open(os.path.join(*p), encoding='utf-8') as f:
        return f.read()


def write(path, s):
    path = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(s)
    print(os.path.relpath(path, ROOT), len(s))


def fill(t, **kw):
    for k, v in kw.items():
        key = '{{' + k + '}}'
        assert key in t, key
        t = t.replace(key, v)
    assert '{{' not in t, t[t.index('{{'):][:40]
    return t


def all_tabs(lab):
    """Erkunden-Tabs aus dem Steckbrief, dann immer Rechentrainer und Profi (Gruppe Üben)."""
    tabs = [(t['id'], t['label'], 'Erkunden') for t in lab['tabs']]
    if lab.get('ueben', True):  # "ueben": false im Steckbrief = nur Erkunden, ohne Rechentrainer und Profi
        tabs += [('train', 'Rechentrainer', 'Üben'), ('pro', 'Profi ★', 'Üben')]
    return [(tid, f'{i + 1} {label}', grp) for i, (tid, label, grp) in enumerate(tabs)]


def page(d, lab, admin):
    tabs = all_tabs(lab)
    nav = ''
    for g in dict.fromkeys(grp for _, _, grp in tabs):
        nav += f'      <div class="tgrp" data-grp="{g}"><span class="gl">{g}</span><div class="seg">\n' + ''.join(
            f'        <button role="tab" data-tab="{tid}" aria-selected="{"true" if i == 0 else "false"}"'
            f'{" hidden" if tid == "pro" else ""}>{html.escape(label, quote=False)}</button>\n'
            for i, (tid, label, grp) in enumerate(tabs) if grp == g) + '      </div></div>\n'
    style = read(SHARED, 'base.css') + read(LABS, d, 'style.css')
    title = html.escape(lab['title'])
    h1 = f'<h1>{title}</h1>'
    js = ('const LAB = ' + json.dumps(lab, ensure_ascii=False) + ';\n'
          + read(SHARED, 'core.js') + '\n' + read(LABS, d, 'lab.js') + '\n'
          + (read(SHARED, 'trainer.js') + '\n' + read(SHARED, 'profi.js') if lab.get('ueben', True) else read(SHARED, 'ohne-ueben.js'))
          + '\n' + read(SHARED, 'app.js'))
    extra = ''
    if admin:
        style += read(SHARED, 'admin', 'gate.css')
        h1 = (f'<div><h1>{title}</h1><div class="who" id="who" hidden><span class="dot" id="whoDot"></span>'
              'Angemeldet als <b id="whoName"></b> · <button class="linkbtn" id="whoSwitch">abmelden</button></div></div>')
        extra = (read(SHARED, 'admin', 'gate.html').replace('__TITLE__', title) + '\n<script>\n'
                 + read(SHARED, 'admin', 'bridge.js').replace('__LAB__', lab['id']) + '</script>\n')
        # erst nach der Anmeldung starten
        js = 'window.__startLab = () => {\n"use strict";\n' + js + '};\n'
    else:
        js = '(() => {\n"use strict";\n' + js + '})();\n'
    return fill(read(SHARED, 'page.html'),
                ICON=lab['icon'].replace(' ', '%20'), TITLE=title, H1=h1, STYLE=style, NAV=nav,
                TABS=read(LABS, d, 'tabs.html'), N_TRAIN=str(len(tabs) - 1), N_PRO=str(len(tabs)),
                SKIZZE=lab.get('skizze', ''), WIN=lab.get('win', ''), ADMIN=extra, SCRIPT=js)


labs = []
for d in sorted(os.listdir(LABS)):
    if d.startswith('_') or not os.path.exists(os.path.join(LABS, d, 'lab.json')):
        continue
    lab = json.loads(read(LABS, d, 'lab.json'))
    assert lab['id'] == d, (d, lab['id'])
    labs.append(lab)
    lab['file'] = d.capitalize()
    write(f'labore/{lab["title"]}.html', page(d, lab, admin=False))
    a = page(d, lab, admin=True)
    write(f'adminpanel/{lab["file"]}.html', a)
    write(f'docs/{d}/index.html', a.replace('<head>\n', '<head>\n<script src="../config.js"></script>\n', 1))

# Labor-Liste für den Server
reg = {l['id']: {'title': l['title'], 'file': l['file'], 'klasse': l['klasse'], 'tabs': [list(t) for t in all_tabs(l)]} for l in labs}
js = lambda v: json.dumps(v, ensure_ascii=False)
write('adminpanel/Labs.gs', '// Erzeugt von build.py aus labs/*/lab.json. Nicht von Hand ändern.\nconst LABS = {\n' + ''.join(
    f'  {k}: {{\n    title: {js(v["title"])}, file: {js(v["file"])}, klasse: {js(v["klasse"])},\n    tabs: {js(v["tabs"])},\n  }},\n'
    for k, v in reg.items()) + '};\n')

# Startseite
cards = ''.join(f'''    <a class="lab" href="{l["id"]}/">
      <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 26H29M7 29V3" stroke="#93a5b6" stroke-width="2" fill="none" stroke-linecap="round"/><path d="{l["icon"]}" stroke="#6b9bff" stroke-width="3.2" stroke-linecap="round" fill="none"/></svg>
      <b>{html.escape(l["title"])}</b><span>{html.escape(l["thema"])}</span>
    </a>
''' for l in labs)
write('docs/index.html', fill(read(SHARED, 'start.html'), LABS=cards))

# Admin-Seite für GitHub Pages
s = read(ROOT, 'adminpanel', 'Admin.html')
assert s.count('<head>\n') == 1
write('docs/admin/index.html', s.replace('<head>\n', '<head>\n<script src="../config.js"></script>\n'))
