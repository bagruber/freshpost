# Offene Punkte

*Notiert am 26.08.2026 fuer spaetere Sitzungen. Erledigte Punkte bitte streichen,
nicht abhaken — die Datei soll kurz bleiben.*


## Toolchain-Stand

Dieses Repo laeuft seit dem 26.08.2026 auf **pnpm** (nicht npm) und auf der
projektweiten Hausbasis. **Die Zielversionen stehen nicht hier**, sondern in
`hausbasis/baseline.json` — eine Quelle statt einer Tabelle je Repo. Abgleich:

```bash
node ../hausbasis/check.mjs --kurz
```

Der Sinn ist Deduplizierung: alle Repos teilen sich einen pnpm-Store, der genau so
weit dedupliziert, wie die Versionen uebereinstimmen. Gemessen kostet ein Repo mit
abweichenden Versionen ~158 MB, ein Versions-Zwilling ~8 MB. **Einzelne Pakete
also nicht im Alleingang hochziehen** — das faellt allen anderen Repos zur Last.

## `workbox-window` muss deklariert bleiben

Steht seit dem 26.08.2026 als direkte devDependency in der package.json, obwohl
der Code es nicht selbst importiert — `vite-plugin-pwa` erzeugt ein virtuelles
Modul, das es zur Build-Zeit braucht. Unter npm war es zufaellig ueber das flache
`node_modules` sichtbar; pnpm zeigt nur Deklariertes. Ohne den Eintrag bricht der
Build mit *"Rollup failed to resolve import workbox-window"*.

**Als vermeintlich unbenutzte Dependency also nicht entfernen.**

## `pnpm lint` ist defekt — und zwar in drei Repos

Seit dem Wechsel auf TypeScript 7 bricht `typescript-eslint` beim Start hart ab:
der Guard `versionMajor >= 7` wirft, in allen 8.x-Versionen bis mindestens
8.69. Betroffen sind die drei Repos, die `typescript-eslint` deklarieren —
**freshpost, freshdoc, sexdiary**.

Das faellt nicht auf, weil der Fehler nach kaputter Installation aussieht und
nicht nach Regelverstoss. Bis zur Loesung sind die Gates `npx tsc -b`,
`pnpm test` und `pnpm build`.

Loesung gehoert in die `hausbasis`, nicht in ein Repo allein. Drei Wege:
TypeScript 6 nur fuer den Linter aufloesen (kostet eine zweite TS-Version im
Store — genau das, was die hausbasis verhindern soll), typescript-eslint
fallen lassen (die Config nutzt nur `configs.recommended`, also gar keine
typgestuetzten Regeln — `tsc -b` deckt das ab), oder auf TS-7.1-Support warten.

## Deploy laeuft; `pnpm/action-setup@v4` ist deprecated

Der auf pnpm umgestellte Workflow ist seit dem 26.08.2026 aktiv und
funktioniert (zuletzt gruen am 04.09.2026). Der frueher hier stehende Hinweis
"nichts ist gepusht, der erste Push aktiviert das" ist damit erledigt.

Neu seit dem 04.09.2026: der Runner meldet bei jedem Lauf

> Node.js 20 is deprecated. The following actions target Node.js 20 but are
> being forced to run on Node.js 24: `pnpm/action-setup@v4`.

Noch kein Fehler, aber es betrifft **jedes Repo mit diesem Workflow**. Also
zusammen anheben, sobald pnpm/action-setup eine Node-24-Version hat — nicht
in einem Repo allein.

## Beim naechsten Paket-Update

Weder `pnpm install` noch `pnpm prune` raeumt die alte Version aus
`node_modules/.pnpm`. Nach einem Upgrade deshalb:

```bash
rm -rf node_modules && pnpm install
pnpm store prune
```

Ohne diesen Schritt bleibt der Speichergewinn auf dem Papier. In den beiden
Upgrade-Wellen am 26.08.2026 hat das zusammen ~1,2 GB freigegeben.
