# Boston's Culture, Mapped.

A public map of Boston's cultural spaces — studios, galleries, music venues,
theaters, and the gathering places, shops, schools and restaurants where arts
and culture happen. Anyone can add a space, confirm one that is already on
the map, or suggest a correction.

It is part of the **2026 Boston Cultural Space Inventory**, run by the City of
Boston's **Mayor's Office of Arts and Culture** as part of *Space for Public
Culture* — a plan to hardwire culture into the fabric of Boston.

## Take part

Open the map, then:

- **Add a space** — search for it by name or address, or tap its spot on the map.
- **Confirm the City's data so far** — open a pin and confirm its details, or
  suggest a correction.
- **Tell us more** — if you run, work in or volunteer at a space, answer the
  cultural space deep-dive questions linked from its pin.

## Contact

- About the Mayor's Office of Arts and Culture and this project:
  Raisa Saniat, Director of Cultural Planning — raisa.saniat@boston.gov
- About this map, or to report a technical problem:
  info@bostonculturemapped.com

## About this repository

This repository holds only the **published website files** — a static site
(HTML, CSS and plain JavaScript, no build step) using Google Maps. It is
exported from the project's working folder with `build-dist.ps1`, so **edit
the working copy, not these files**; changes made here are overwritten by the
next export.

The map's data is **not** stored here. Submissions are saved through a Google
Apps Script web app into a City-managed Google Sheet. Submitters' contact
details are kept separately and privately, and are never sent to this site.

To embed the map on another website, point an `<iframe>` at `embed.html` —
the same map without the side panel.
