## Objective
Convert the 10 specified archives into cleaned, human‑readable .txt files and place them in `Archives/Text File/`, preserving full content and adding a short metadata header (original file, system, flags, velocity, 5D).

## Files To Convert (exact targets)
1. GPT 4.0/OAuth token log analysis.html
2. SYMBI/Symbi 4.0 - Account Breach Support.mhtml
3. SYMBI/Symbi 4.0  - Account Breach Support Gold+.mhtml
4. Claude/Claude - Becoming a new instrument for ethical reflection.mhtml
5. SYMBI/Symbi 5.1 - Hosted agent setup guide.mhtml
6. Claude/AI Interaction Case Study Review - Claude.mhtml
7. SYMBI/Symbi 5.1 - Emergent Communication and SYMBI.mhtml
8. SYMBI/Symbi 5.0 - SYMBI Trust Protocol Plan.mhtml
9. Wolfram/Wolfram 4.0 - Nutrition Report Analysis.mhtml
10. SYMBI/Symbi 5.1 - Fix device activity block.mhtml

## Output
- Destination folder: `c:\Users\Stephen\yseeku-platform\Archives\Text File\`
- Naming convention (to avoid collisions): `<System> - <Original Base Name>.txt`
  - Examples: `GPT 4.0 - OAuth token log analysis.txt`, `SYMBI - Symbi 4.0 - Account Breach Support.txt`
- Each .txt file begins with a metadata header:
  - Original path
  - System
  - Flag/priority (RED/HIGH etc.)
  - Velocity behaviour (if applicable)
  - 5D signature (avg)
  - Processed timestamp
- Followed by the full cleaned text extracted from the archive.

## Cleaning & Extraction Method
- Strip CSS/JS/binary sections; remove MHTML boundaries; decode quoted‑printable artifacts (e.g., `=e2=80=94` → `—`); normalize whitespace.
- Preserve the order of content blocks; include all textual material.
- For narrative pages, include entire text; for structured JSON (none in this list), extract message bodies.

## Steps
1. Verify all 10 source files exist; create `Archives/Text File/` if missing.
2. For each file, parse and clean as above; build the metadata header from existing report data (flags, velocity, 5D averages).
3. Write the .txt file using the naming convention; verify byte length and readability.
4. Confirm completion and provide the list of written files.

## After Conversion
- On your signal, I will re‑run the manual report including references to these .txt sources for calibration.
