# MMMS — Data Model (NoSQL) & Schema Design

Hot Strip Mill (HSM) Shift Checklist — paper → digital.

## 1. Why cell-anchored schemas

The 13 sheets are **not** flat checklists. They are multi-section inspection grids
with merged cells, repeated column blocks (F1–F7, RM1/RM2, DC1/DC2/DC3), and
pre-printed "NA"/"-" cells. The only trait every sheet shares:

> **Text cells = printed labels. Blank bordered cells = data-entry points.
> "NA"/"-"/"_" cells = locked (not applicable).**

So instead of hand-authoring 13 different form schemas, we treat the **original
Excel workbook as the template** and auto-derive, per sheet, the list of editable
cells anchored by their cell address (`D6`, `E6`, …). This gives us three things
for free:

1. **Perfect Excel round-trip** — every value already knows which cell to be stamped into.
2. **Faithful grid viewer** — we keep the merged-cell geometry, so the on-screen
   grid is the paper form.
3. **No schema drift** — re-run the extractor if the template changes.

Generated artifacts live in [`/schemas`](../schemas): one `sheetN.layout.json`
per sheet + an `index.json` summary. Total: **~8,700 input fields across 13 sheets.**

### `sheetN.layout.json` shape
```jsonc
{
  "sheetId": 2,
  "name": "Sheet2",
  "title": "FM ENTRY (CBX & CSH) FIELD DEVICE CHECK LIST",
  "description": "FM Entry Area Field Device",
  "maxRow": 50, "maxCol": 10,
  "merges": [[3,1,5,1], [3,2,5,2], ...],          // [r1,c1,r2,c2] 1-based
  "colWidths": { "A": 4.5, "B": 32.0, ... },
  "fieldCount": 321,
  "cells": [                                       // full render model, row-major
    { "r":6,"c":2,"coord":"B6","rs":1,"cs":1,"t":"HMD 1A","k":"label","b":false },
    { "r":6,"c":4,"coord":"D6","rs":1,"cs":1,"k":"input","id":"S2_D6" },
    { "r":6,"c":3,"coord":"C6","rs":11,"cs":1,"t":"HMD/Light Curtain","k":"label" }
  ],
  "fields": [                                      // input cells only (for form + DB)
    { "id":"S2_D6","cell":"D6","row":6,"col":4,
      "rowLabel":"HMD/Light Curtain","colLabel":["Mounting","WHAT TI CHECK..."] }
  ]
}
```
`cells[].k` (kind): `label` (static text) · `input` (editable) · `locked` (NA/-) · `empty` (spacer).
`rs`/`cs` = row/col span (for rendering merges).

## 2. NoSQL document structure (MongoDB)

One document = **one sheet for one (date, shift)**. The composite key
`(date, shift, sheetId)` is unique. Values are stored keyed by **cell address**,
which is the stable contract between form, DB, and Excel.

### Collection: `submissions`
```jsonc
{
  "_id": "ObjectId(...)",

  // ---- identity / unique key ----
  "date": "2026-06-18",          // ISO date (string, indexed)
  "shift": "A",                  // "A" | "B" | "C"
  "sheetId": 3,                  // 1..13

  // ---- metadata captured on the form header ----
  "meta": {
    "checkedBy": "R. Kumar",
    "shiftEngineer": "",
    "shiftManager": "",
    "areaInCharge": "",
    "sign": "",
    "remarks": "Pump #3 body temp high"
  },

  // ---- the actual readings: cellAddress -> value ----
  "values": {
    "D6": "OK",
    "E6": "NOK",
    "F6": "OK",
    "H8": "62"            // a temperature reading, free text
  },

  // ---- audit ----
  "status": "submitted",         // "draft" | "submitted"
  "createdBy": "8qnbnwd97z@...",
  "createdAt": "2026-06-18T05:12:00Z",
  "updatedAt": "2026-06-18T05:40:00Z",
  "schemaVersion": 1
}
```

### Indexes
```js
db.submissions.createIndex({ date: 1, shift: 1, sheetId: 1 }, { unique: true })
db.submissions.createIndex({ sheetId: 1, date: -1 })          // dashboard lists
db.submissions.createIndex({ "meta.checkedBy": 1 })           // optional
```

### Why an object (`values: { "D6": ... }`) and not an array?
- **O(1) lookup / patch** by cell when rendering or autosaving a single field.
- **Sparse by nature** — only filled cells are stored; a half-done shift is a valid draft.
- Trivial to stamp into Excel: `for (cell,val) of values → ws[cell] = val`.
- If you prefer an array (e.g. for richer per-reading audit), use:
  `results: [{ cell, value, rowLabel, colLabel, ts }]` — same data, more verbose.
  The object form is recommended for v1.

### Collection: `sheets` (optional, read-only catalog)
The 13 `layout.json` files can be loaded into a `sheets` collection (or just
served as static JSON from the API). They are reference data, not user data.

## 3. JSON Schema (validation) per submission

Per-sheet validation is generated from the field list. Example for Sheet 2:
```jsonc
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Submission/Sheet2",
  "type": "object",
  "required": ["date", "shift", "sheetId", "values"],
  "properties": {
    "date":   { "type": "string", "format": "date" },
    "shift":  { "type": "string", "enum": ["A", "B", "C"] },
    "sheetId":{ "const": 2 },
    "meta":   { "type": "object" },
    "values": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "D6": { "type": "string" },   // ... one per field id/cell
        "E6": { "type": "string" }
      }
    }
  }
}
```
For v1 every value is a free-text `string` (engineers write `OK`/`NOK`, a number,
or a short note — exactly like paper). Tightening to enums/numbers per column is a
phase-2 refinement and can be driven off `colLabel` heuristics.
