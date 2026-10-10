# Host stylesheets

The viewer is drawn inside somebody else's page, under that page's stylesheet.
`test/browser/host_css.html` launches it under each of these and compares every
computed style with a launch in a clean page. They are fixtures: saved copies,
unmodified, refreshed deliberately and never to make a test pass.

| File | What it is | Source | Licence |
|---|---|---|---|
| `bvbrc-p3.css` | The stylesheet of the BV-BRC website, the viewer's original host. It contains Dojo's `claro` theme. | `https://alpha.bv-brc.org/js/3.60.4/p3/resources/p3.css`, fetched 2026-10-09. The version in the path follows the site: read the `<link>` of any page there. Repository: `BV-BRC/BV-BRC-Web`. | MIT |
| `bootstrap-3.4.1.css` | Bootstrap 3, still common on older sites, and opinionated about bare `label`, `legend` and `input`. | `https://cdn.jsdelivr.net/npm/bootstrap@3.4.1/dist/css/bootstrap.css` | MIT |
| `bootstrap-5.3.3.css` | Bootstrap 5. | `https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.css` | MIT |
| `tailwind-preflight-3.4.17.css` | The reset every Tailwind page starts from. | `https://cdn.jsdelivr.net/npm/tailwindcss@3.4.17/src/css/preflight.css` | MIT |
| `wild.css` | Ours: single rules of kinds found on real pages, each with its source in a comment. | this repository | as the repository |

The BV-BRC page wraps the viewer as
`body.claro.patric > .Phylogeny > div.size.archaeopteryxClass > #phylogram1`
(`p3/widget/Phylogeny.js`); the harness page has the same shape, because rules
such as `.Phylogeny svg` only apply inside it.
