#!/bin/sh
# Laptop-Variante: Code.gs hochladen und die bestehende Bereitstellung aktualisieren (gleiche /exec-Adresse).
# Einmalig vorher: "npx @google/clasp@2.4.2 login" und in adminpanel/.clasp.json {"scriptId":"…","rootDir":"."}.
set -e
cd "$(dirname "$0")"
DEPLOYMENT_ID=$(sed -n 's#.*/macros/s/\([^/]*\)/exec.*#\1#p' ../docs/config.js)
npx -y @google/clasp@2.4.2 push --force
npx -y @google/clasp@2.4.2 deploy -i "$DEPLOYMENT_ID" -d "Laptop $(date +%F_%H:%M)"
