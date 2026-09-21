---
name: icr-lecture-slides
description: >
  Build, extend, and maintain the ICR software development lecture slide pipeline.
  Use this skill whenever Carlos asks to: create or update lecture slides, convert
  markdown to PPTX, add a new topic deck, extend the build_slides.js pipeline,
  fix slide layout or styling, add a new slide type, or work with the course
  markdown source files. Also triggers for questions about the markdown format
  conventions, the folder structure, or slide builder behaviour. If the task
  involves any .md file in the course slides/ directory, or any mention of
  build_slides.js, trigger this skill.
---

# ICR Lecture Slides — Build Pipeline

## Purpose

This skill captures the complete pipeline for converting version-controlled
markdown lecture notes into styled PowerPoint decks for the ICR two-day course
on software development fundamentals for physics PhD candidates.

The pipeline is: **markdown source → build_slides.js → .pptx deliverable**.

---

## Project folder structure

```
ICR-DEV-COURSE/
├── .claude/
│   └── skills/
│       └── build-slides/
│           └── SKILL.md        ← this file
├── slides/                     ← version-controlled markdown source (one .md per topic)
│   ├── 01_history.md
│   ├── 02_five_habits.md
│   └── ...
├── images/                     ← .jpg exports of diagrams and VS Code screenshots
│   ├── progression_diagram.jpg
│   ├── count_the_sins_code.jpg
│   └── ...
├── output/                     ← generated .pptx files (not version-controlled)
└── build_slides.js             ← the pipeline script
```

**What is version-controlled:** `.claude/`, `slides/*.md`, `images/*.jpg`, `build_slides.js`.
**What is not:** `output/*.pptx` (generated artifacts).

---

## Running the pipeline

From the repo root (`ICR-DEV-COURSE/`):

```bash
node build_slides.js slides/02_five_habits.md output/02_five_habits.pptx
```

Requires `pptxgenjs`: `npm install pptxgenjs`

---

## Markdown format conventions

Each `.md` file is a sequence of slides separated by `---` on its own line.

### Slide anatomy

```markdown
## slide_id

# Slide Title
## Optional subtitle or tagline

Body content here (bullets, table, code blocks, images).

<!-- NOTES
Speaker notes go here. Supports multiple paragraphs.
These appear in the PowerPoint notes pane.
-->
```

### Slide ID

`## slide_id` is the first line of every slide. It serves two purposes:
1. Identifies the slide for routing to the correct builder function.
2. Provides a stable anchor for version control diffs.

IDs use `snake_case`. Examples: `title`, `section_habits`, `habit1_naming`,
`count_the_sins`, `closing`.

### Content types and their markdown syntax

| Content type | Markdown syntax | Notes |
|---|---|---|
| Title + subtitle | `# Title` then `## Subtitle` | Subtitle renders in italic below title |
| Bullet list | Standard `- item` | Supports one level of nesting |
| Bold emphasis | `**text**` | Used for key terms in bullets |
| Table | Standard GFM table | Auto-sized to content width |
| Python code block | ` ```python ... ``` ` | Dark bg, Courier New, soft syntax colouring |
| Image embed | ` ```image\nimages/filename.jpg\n``` ` | Centred below title, fills available space |
| Diagram (inline) | ` ```diagram\n[A] → [B] → [C]\n``` ` | Coloured boxes with arrows; use sparingly |

### Speaker notes

```markdown
<!-- NOTES
This is the speaker note for this slide.
Multiple paragraphs are fine.
-->
```

Notes are stripped from the rendered slide and placed in the PowerPoint notes pane.

---

## Visual design system

The aesthetic mirrors the `software_quality_timeline.html` interactive timeline.
All new slides must conform to these tokens — do not invent new colours or fonts.

### Colours

| Token | Hex | Usage |
|---|---|---|
| `darkBg` | `#1A1A1A` | Title slides, section dividers, code backgrounds |
| `lightBg` | `#F7F6F2` | Content slide backgrounds |
| `gold` | `#C8A951` | Accent: underlines, borders, pull-quote rules |
| `text` | `#1A1A1A` | Primary body text |
| `textLight` | `#555555` | Secondary / caption text |
| `muted` | `#888888` | Tertiary, attribution lines |
| `codeBg` | `#2D2D2D` | Code block backgrounds |
| `codeText` | `#E8E8E8` | Code block default text colour |
| `green` | `#1D9E75` | Abstraction theme accent |
| `blue` | `#378ADD` | Structure theme accent |
| `purple` | `#7F77DD` | Process theme accent |
| `amber` | `#BA7517` | Tooling theme accent |

### Fonts

| Role | Font | Notes |
|---|---|---|
| Headings | Georgia | Serif; titles, section headers, pull quotes |
| Body | Calibri | Sans-serif; bullets, tables, captions |
| Code | Courier New | Monospace; all code blocks |

### Slide types and their layouts

**Dark title slide** (`darkBg` background)
- Used for: deck title, section dividers
- Title: Georgia, 36pt, white, centred
- Subtitle: Georgia italic, 20pt, gold, centred
- Gold rule: 3pt horizontal line below title

**Light content slide** (`lightBg` background)
- Used for: all content slides
- Title: Georgia, 28pt, `#1A1A1A`, left-aligned
- Gold underline: 2pt rule beneath title
- Body area: below the rule, full width

**Code slide** (light bg, dark code panel)
- Title at top as normal
- Code block: `codeBg` rounded rectangle, `Courier New` 13pt, `codeText`
- Bad code: highlighted tokens in `#FFCCCC` (light red background on the run)
- Good code: no highlight override — clean on dark bg

**Table slide**
- Title at top
- Table: header row in `darkBg`/white, alternating rows `lightBg`/white
- Body font Calibri 13pt

**Image slide**
- Title at top
- Image: centred, scaled to fill available space below title, aspect ratio preserved

---

## Slide type routing

The script auto-detects slide type from content — no registration of slide IDs
required. Rules are checked in the order listed; first match wins:

| Detection rule | Builder used |
|---|---|
| Contains ` ```python ` or ` ```code ` | Code slide builder |
| Contains ` ```image ` | Image slide builder |
| Contains ` ```diagram ` | Diagram slide builder |
| Contains a GFM table (`\|---|`) | Table slide builder |
| ID is `title` | Dark title slide builder |
| ID starts with `section_` | Dark section divider builder |
| All other slides | Light content slide builder |

---

## Images: diagrams and code screenshots

**Diagrams** are built in PowerPoint, screenshotted on macOS (Preview → Export
as JPEG), and saved to `images/`. Reference in markdown:

```markdown
```image
images/progression_diagram.jpg
```
```

**Code examples** (for syntax-highlighted hero slides like "Count the Sins")
are screenshotted from VS Code and saved as JPEG. Same embedding pattern.

File naming convention: `snake_case`, descriptive, no version suffixes.
- Good: `count_the_sins_code.jpg`, `habit2_before_after.jpg`
- Bad: `diagram_v2_FINAL.jpg`

---

## Topic file naming and numbering

```
01_history.md          ← Historical timeline section
02_five_habits.md      ← Five habits section (programmer → developer pivot)
03_git.md              ← Git and version control (dedicated session)
04_testing.md          ← Unit testing and CI (dedicated session)
05_documentation.md    ← Documentation (dedicated session)
```

Each file maps 1:1 to a distinct lecture slot. The `build_slides.js` script
processes one file at a time. Additional topics will be added as the course
develops — continue the numbering sequence. No changes to the pipeline or
this skill are needed to accommodate new topic files.

---

## Course context (for slide content decisions)

**Audience:** Physics PhD candidates at ICR. Know Python/R basics, use Git
occasionally, familiar with ICR HPC resources (RDS, Alma). No formal SE training.

**Tone:** Authoritative but accessible. Medium-roast humour is welcome.
Cancer research domain examples throughout (tumor growth, patient cohorts,
dose-response, imaging).

**Out of scope for all slides:** Python/R syntax basics, software as a medical
device, ISO standards, commercialisation, AI ethics, Agile methodology,
commercial platforms (JIRA, Confluence).

**Git and documentation:** Each has a dedicated session. In other decks, treat
them as forward pointers only — "you'll see this properly in the Git session."

---

## Known issues and pending work

- **Diagram auto-detection:** The `diagram` code block builder is implemented
  but produces basic coloured boxes only. Complex multi-branch diagrams should
  use the image embedding approach instead.
- **Syntax highlighting:** Python code blocks receive lightweight keyword
  colouring (keywords purple, strings green, comments grey, numbers orange).
  For hero slides (e.g. count-the-sins), prefer VS Code screenshots via the
  image embed route for full fidelity.
- **Inline bold and code formatting not preserved (pending — handle in Claude Code):**
  `pptxgenjs` requires text with inline formatting to be passed as an array of
  run objects rather than a plain string. Currently `**bold**` and `` `code` ``
  markers in bullet text render as literal asterisks/backticks in the output
  `.pptx`. Fix by integrating the `parseInlineMarkdown()` helper function into
  `build_slides.js`. Steps: (1) paste the function after the constants block;
  (2) wrap every `slide.addText(bulletText, options)` call for bullet/body text
  as `slide.addText(parseInlineMarkdown(bulletText, options), options)`;
  (3) verify by running the pipeline against `slides/02_five_habits.md` and
  confirming `**bold**` labels render bold and `` `code` `` spans render in
  Courier New. The function is a safe drop-in — plain strings are returned
  unchanged. Full function definition is in `parseInlineMarkdown.js`.
- **Slide routing migration (pending — handle in Claude Code):**
  `build_slides.js` currently uses hardcoded ID lists (`CODE_SLIDES`,
  `DIAGRAM_SLIDES`, `TABLE_SLIDES`) to route slides to builder functions.
  Migrate to content-based auto-detection: inspect each slide's markdown
  content for fenced blocks (` ```python `, ` ```image `, ` ```diagram `) and
  GFM tables (`|---|`) instead of checking the slide ID against a list. IDs
  `title` and `section_*` continue to route to dark slide builders. First
  match wins. Preserve all existing builder functions — routing logic only.
  Verify by running the pipeline against `slides/02_five_habits.md` and
  confirming output matches the existing `output/02_five_habits.pptx`.

---

## Adding a new slide type

1. Add the detection rule to the routing table in `build_slides.js`
2. Write a builder function: `function buildXxxSlide(pptx, slide, data) { ... }`
3. Register it in the router
4. Test with a minimal markdown example before adding to a full deck
5. Update this skill file with the new type's detection rule and layout spec
