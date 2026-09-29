# Agentic City Lab — website package

Static HTML/CSS/JS. No build step or framework is needed to host it.

```
index.html                  Agentic City Lab (site root)
nicholas/index.html         Personal site of Chengbo (Nicholas) Zhang
cv/ZhangChengbo_CV.pdf      CV linked from the personal site
assets/fonts/               Self-hosted fonts (Archivo, Instrument Sans, IBM Plex Mono, Source Serif 4; SIL OFL)
assets/favicon.svg          The stencil A on a dark rounded square
assets/data.js              All content: publications, projects, talks, awards, news, international network
assets/base.css, gfx.js     Shared styles, the Stencil ACL mark, glyphs, project wall
assets/sim.js               Live human–AI interaction city shown on both sites
assets/worldmap.js          International network map; worldmask.js holds its dot-matrix land data
assets/figures/             Figures from the papers, prepared for the dark theme (<id>.jpg square tile, <id>-full.jpg)
assets/img/                 portrait.jpg (4:5, personal site) and portrait-sq.jpg (square, lab People)
```

## Preview locally

```
cd website
python3 -m http.server 8000
# open http://localhost:8000
```

## Publish on GitHub Pages (free)

1. Create a repository named `<account>.github.io` (here: `agenticcitylab.github.io` under the agenticcitylab organization).
2. Upload the contents of this folder (not the folder itself) to the repository root.
3. In the repository: Settings → Pages → Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
4. On https://agenticcitylab.github.io/ the lab is at the root and the personal site at `/nicholas/`.

## Custom domains

- Add a `CNAME` file containing the domain (e.g. `agenticcity.org`) and point the domain's DNS to GitHub Pages.

## Editing content

All publications, projects, talks, awards, news and the international network (`network`: co-author institutions with coordinates; talks carry `geo`) live in one file, `assets/data.js`, shared by both sites.
Edit the entries there; lists, filters and counts on every page update automatically.
`assets/base.css` holds the shared colour and type tokens; `assets/gfx.js` draws the glyphs and project tiles.
The active logo is Stencil ACL (`ACL.MARK = 'aclStencil'` in `assets/gfx.js`); its proportions live in `ACL.STENCIL` in the same file.
To add a project figure, put `<id>.jpg` (1:1) and `<id>-full.jpg` in `assets/figures/`, add the caption to `figures`
in `data.js`, and set `fig: "<id>"` on the project.
To change the portrait, replace `assets/img/portrait.jpg` (4:5) and `assets/img/portrait-sq.jpg` (1:1) with files of the same names.
