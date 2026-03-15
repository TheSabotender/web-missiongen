# Paranormal Division Mission Generator

Files:
- `index.html`
- `styles.css`
- `app.js`
- `data/cities.js`
- `data/sites.js`
- `data/events.js`
- `data/tables.js`

How it works:
- The generator uses a seed from the URL, for example `?seed=123`.
- The same seed always produces the same mission.
- All random lists are kept in separate files for easy expansion.
- Event templates support tags like `{item:modern}`, `{item:fantasy}`, `{item:tech}`, `{item:weapon}`, `{creature}`, `{occupation}`, `{omen}`, and more.

To add content:
- Add more city objects to `data/cities.js`
- Add more site objects to `data/sites.js`
- Add more event objects to `data/events.js`
- Add or extend substitution tables in `data/tables.js`
