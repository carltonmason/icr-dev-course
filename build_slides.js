const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

// =============================================================================
// DESIGN TOKENS — echoing the timeline HTML aesthetic
// =============================================================================
const COLORS = {
  darkBg:    "1A1A1A",   // header/title backgrounds
  lightBg:   "F7F6F2",   // content slide backgrounds
  white:     "FFFFFF",
  gold:      "C8A951",   // accent color from timeline
  text:      "1A1A1A",   // primary text
  textLight: "555555",   // secondary text
  muted:     "888888",   // tertiary/caption text
  codeBg:    "2D2D2D",   // code block background
  codeText:  "E8E8E8",   // code text
  green:     "1D9E75",   // from abstraction theme
  blue:      "378ADD",   // from structure theme
  purple:    "7F77DD",   // from process theme
  amber:     "BA7517",   // from tooling theme
  cardBg:    "FFFFFF",
  cardBorder:"E0DDD5",
  verdictBg: "F0F4FB",
};

const FONTS = {
  heading: "Georgia",
  body:    "Calibri",
  code:    "Courier New",
};

// =============================================================================
// INLINE MARKDOWN PARSER
// =============================================================================
function parseInlineMarkdown(text, baseOptions = {}) {
  const INLINE_PATTERN = /(\*\*(.+?)\*\*|`([^`]+?)`)/g;
  const runs = [];
  let lastIndex = 0;
  let match;

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ text: text.slice(lastIndex, match.index), options: { ...baseOptions } });
    }
    if (match[0].startsWith('**')) {
      runs.push({ text: match[2], options: { ...baseOptions, bold: true } });
    } else {
      runs.push({ text: match[3], options: { ...baseOptions, fontFace: 'Courier New', fontSize: (baseOptions.fontSize || 14) - 1 } });
    }
    lastIndex = INLINE_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push({ text: text.slice(lastIndex), options: { ...baseOptions } });
  }

  return runs.length === 0 ? text : runs;
}

// =============================================================================
// MARKDOWN PARSER
// =============================================================================
function parseMarkdown(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const sections = raw.split(/^---$/m).filter(s => s.trim());

  return sections.map(section => {
    const slide = { id: "", title: "", subtitle: "", body: "", notes: "", table: null, codeBlocks: [], bullets: [], diagram: null };

    // Extract speaker notes
    const notesMatch = section.match(/<!--\s*NOTES\s*\n([\s\S]*?)-->/);
    if (notesMatch) {
      slide.notes = notesMatch[1].trim();
      section = section.replace(notesMatch[0], "");
    }

    // Extract slide ID
    const idMatch = section.match(/^##\s+(\S+)/m);
    if (idMatch) {
      slide.id = idMatch[1];
      section = section.replace(idMatch[0], "");
    }

    // Extract code blocks
    const codeRegex = /```(\w*)\n([\s\S]*?)```/g;
    let codeMatch;
    while ((codeMatch = codeRegex.exec(section)) !== null) {
      if (codeMatch[1] === "diagram") {
        slide.diagram = codeMatch[2].trim();
      } else {
        slide.codeBlocks.push({ lang: codeMatch[1] || "text", code: codeMatch[2].trimEnd() });
      }
    }
    section = section.replace(codeRegex, "");

    // Extract table
    const tableMatch = section.match(/(\|.+\|[\r\n]+\|[-| :]+\|[\r\n]+((\|.+\|[\r\n]*)+))/);
    if (tableMatch) {
      const rows = tableMatch[0].trim().split("\n").filter(r => !r.match(/^\|[-| :]+\|$/));
      slide.table = rows.map(r =>
        r.split("|").filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim())
      );
      section = section.replace(tableMatch[0], "");
    }

    // Extract title (# heading)
    const h1Match = section.match(/^#\s+(.+)$/m);
    if (h1Match) {
      slide.title = h1Match[1].trim();
      section = section.replace(h1Match[0], "");
    }

    // Extract subtitle (## heading after title extraction)
    const h2Match = section.match(/^##\s+(.+)$/m);
    if (h2Match) {
      slide.subtitle = h2Match[1].trim();
      section = section.replace(h2Match[0], "");
    }

    // Extract bullet points
    const bulletRegex = /^-\s+(.+)$/gm;
    let bulletMatch;
    while ((bulletMatch = bulletRegex.exec(section)) !== null) {
      slide.bullets.push(bulletMatch[1].trim());
    }
    section = section.replace(bulletRegex, "");

    // Remaining body text
    slide.body = section.replace(/\*\*(.+?)\*\*/g, "$1").trim()
      .split("\n").map(l => l.trim()).filter(l => l).join("\n");

    return slide;
  });
}

// =============================================================================
// SLIDE BUILDERS
// =============================================================================

function addTitleSlide(pres, slide) {
  const s = pres.addSlide();
  s.background = { color: COLORS.darkBg };

  // Gold accent line at top
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.04,
    fill: { color: COLORS.gold }
  });

  // Title
  s.addText(slide.title, {
    x: 0.8, y: 1.4, w: 8.4, h: 1.8,
    fontSize: 36, fontFace: FONTS.heading,
    color: COLORS.white, align: "left", valign: "middle",
    margin: 0
  });

  // Subtitle
  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.8, y: 3.2, w: 8.4, h: 0.6,
      fontSize: 16, fontFace: FONTS.heading,
      color: COLORS.gold, italic: true, align: "left",
      margin: 0
    });
  }

  // Bottom gold line
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 4.8, w: 2, h: 0.03,
    fill: { color: COLORS.gold }
  });

  if (slide.notes) s.addNotes(slide.notes);
  return s;
}

function addSectionTitleSlide(pres, slide) {
  const s = pres.addSlide();
  s.background = { color: COLORS.darkBg };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.04,
    fill: { color: COLORS.gold }
  });

  s.addText(slide.title, {
    x: 0.8, y: 1.6, w: 8.4, h: 1.4,
    fontSize: 32, fontFace: FONTS.heading,
    color: COLORS.white, align: "left", valign: "middle",
    margin: 0
  });

  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.8, y: 3.1, w: 8.4, h: 0.6,
      fontSize: 15, fontFace: FONTS.heading,
      color: COLORS.gold, italic: true, align: "left",
      margin: 0
    });
  }

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 4.8, w: 2, h: 0.03,
    fill: { color: COLORS.gold }
  });

  if (slide.notes) s.addNotes(slide.notes);
  return s;
}

function addTableSlide(pres, slide) {
  const s = pres.addSlide();
  s.background = { color: COLORS.lightBg };

  // Title
  s.addText(slide.title, {
    x: 0.6, y: 0.3, w: 8.8, h: 0.7,
    fontSize: 26, fontFace: FONTS.heading,
    color: COLORS.text, align: "left",
    margin: 0
  });

  // Gold accent under title
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.0, w: 1.5, h: 0.03,
    fill: { color: COLORS.gold }
  });

  if (slide.table) {
    const tableRows = slide.table.map((row, ri) => {
      return row.map(cell => ({
        text: cell,
        options: {
          fontSize: ri === 0 ? 11 : 10.5,
          fontFace: ri === 0 ? FONTS.heading : FONTS.body,
          bold: ri === 0,
          color: ri === 0 ? COLORS.white : COLORS.text,
          fill: { color: ri === 0 ? COLORS.darkBg : (ri % 2 === 1 ? COLORS.white : "EDECE8") },
          valign: "middle",
          paraSpaceBefore: 4,
          paraSpaceAfter: 4,
          margin: [4, 8, 4, 8],
        }
      }));
    });

    const numCols = slide.table[0].length;
    const colWidths = numCols === 3 ? [1.4, 3.5, 3.9] :
                      numCols === 5 ? [1.2, 2.0, 2.0, 2.0, 1.6] :
                      Array(numCols).fill(8.8 / numCols);

    s.addTable(tableRows, {
      x: 0.6, y: 1.2, w: 8.8,
      colW: colWidths,
      border: { pt: 0.5, color: COLORS.cardBorder },
      margin: 0,
    });
  }

  if (slide.notes) s.addNotes(slide.notes);
  return s;
}

function addCodeSlide(pres, slide) {
  const s = pres.addSlide();
  s.background = { color: COLORS.lightBg };

  // Title
  s.addText(slide.title, {
    x: 0.6, y: 0.3, w: 8.8, h: 0.6,
    fontSize: 26, fontFace: FONTS.heading,
    color: COLORS.text, align: "left",
    margin: 0
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 0.88, w: 1.5, h: 0.03,
    fill: { color: COLORS.gold }
  });

  let yPos = 1.1;

  // Interleave body text and code blocks from original markdown
  const rawFile = fs.readFileSync(process.argv[2], "utf8");
  const sections = rawFile.split(/^---$/m).filter(s => s.trim());
  const thisSection = sections.find(sec => sec.includes("## " + slide.id));

  if (thisSection) {
    // Parse content in order: text and code blocks interleaved
    const notesStripped = thisSection.replace(/<!--\s*NOTES\s*\n[\s\S]*?-->/, "")
      .replace(/^##\s+\S+/m, "").replace(/^#\s+.+$/m, "");

    const parts = notesStripped.split(/(```\w*\n[\s\S]*?```)/);
    let codeIdx = 0;

    for (const part of parts) {
      if (part.match(/^```/)) {
        // Code block
        const code = part.replace(/```\w*\n/, "").replace(/```$/, "").trimEnd();
        const lines = code.split("\n");
        const blockH = Math.max(0.6, lines.length * 0.19 + 0.2);

        // Dark code background
        s.addShape(pres.shapes.RECTANGLE, {
          x: 0.6, y: yPos, w: 8.8, h: blockH,
          fill: { color: COLORS.codeBg },
          shadow: { type: "outer", blur: 4, offset: 2, angle: 135, color: "000000", opacity: 0.1 }
        });

        s.addText(code, {
          x: 0.8, y: yPos + 0.08, w: 8.4, h: blockH - 0.16,
          fontSize: 9.5, fontFace: FONTS.code,
          color: COLORS.codeText, align: "left", valign: "top",
          paraSpaceAfter: 1,
          margin: 0,
        });

        yPos += blockH + 0.15;
        codeIdx++;
      } else {
        // Text — extract meaningful lines
        const textLines = part.split("\n")
          .map(l => l.trim())
          .filter(l => l && !l.startsWith("##") && !l.startsWith("Subtitle:"));

        for (const line of textLines) {
          if (line.startsWith("**") && line.endsWith("**")) {
            // Bold heading
            const textOpts = { x: 0.6, y: yPos, w: 8.8, h: 0.3, fontSize: 13, fontFace: FONTS.body, color: COLORS.text, bold: true, align: "left", margin: 0 };
            s.addText(parseInlineMarkdown(line, textOpts), textOpts);
            yPos += 0.32;
          } else if (line.startsWith("- ") || line.startsWith("* ")) {
            // Bullet
            s.addText([{
              text: line.replace(/^[-*]\s+/, "").replace(/\*\*(.+?)\*\*/g, "$1"),
              options: { bullet: true }
            }], {
              x: 0.6, y: yPos, w: 8.8, h: 0.25,
              fontSize: 12, fontFace: FONTS.body,
              color: COLORS.textLight, align: "left",
              margin: 0,
            });
            yPos += 0.27;
          } else if (line) {
            const textOpts = { x: 0.6, y: yPos, w: 8.8, h: 0.25, fontSize: 12, fontFace: FONTS.body, color: COLORS.textLight, align: "left", margin: 0 };
            s.addText(parseInlineMarkdown(line, textOpts), textOpts);
            yPos += 0.27;
          }
        }
      }
    }
  }

  if (slide.notes) s.addNotes(slide.notes);
  return s;
}

function addContentSlide(pres, slide) {
  const s = pres.addSlide();
  s.background = { color: COLORS.lightBg };

  // Title
  s.addText(slide.title, {
    x: 0.6, y: 0.3, w: 8.8, h: 0.6,
    fontSize: 26, fontFace: FONTS.heading,
    color: COLORS.text, align: "left",
    margin: 0
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 0.88, w: 1.5, h: 0.03,
    fill: { color: COLORS.gold }
  });

  let yPos = 1.15;

  // Body text with bold sections and bullets
  const bodyLines = slide.body.split("\n").filter(l => l.trim());

  for (const line of bodyLines) {
    if (line.startsWith("**") || (line.includes(":**") && line.includes("**"))) {
      // Bold label line
      const textOpts = { x: 0.6, y: yPos, w: 8.8, h: 0.32, fontSize: 14, fontFace: FONTS.body, color: COLORS.text, bold: true, align: "left", margin: 0 };
      s.addText(parseInlineMarkdown(line, textOpts), textOpts);
      yPos += 0.36;
    } else {
      const textOpts = { x: 0.6, y: yPos, w: 8.8, h: 0.28, fontSize: 12.5, fontFace: FONTS.body, color: COLORS.textLight, align: "left", margin: 0 };
      s.addText(parseInlineMarkdown(line, textOpts), textOpts);
      yPos += 0.3;
    }
  }

  // Bullets below body
  if (slide.bullets.length > 0) {
    const baseRunOpts = { fontSize: 12.5, fontFace: FONTS.body, color: COLORS.textLight };
    const bulletItems = slide.bullets.flatMap((b, i) => {
      const parsed = parseInlineMarkdown(b, baseRunOpts);
      const runs = typeof parsed === 'string'
        ? [{ text: parsed, options: { ...baseRunOpts } }]
        : parsed;
      runs[0].options.bullet = true;
      if (i < slide.bullets.length - 1) runs[runs.length - 1].options.breakLine = true;
      return runs;
    });

    s.addText(bulletItems, {
      x: 0.6, y: yPos, w: 8.8, h: slide.bullets.length * 0.35,
      fontSize: 12.5, fontFace: FONTS.body,
      color: COLORS.textLight, align: "left",
      paraSpaceAfter: 6,
      margin: 0,
    });
    yPos += slide.bullets.length * 0.35;
  }

  // Code blocks
  for (const cb of slide.codeBlocks) {
    const lines = cb.code.split("\n");
    const blockH = Math.max(0.6, lines.length * 0.19 + 0.2);

    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: yPos, w: 8.8, h: blockH,
      fill: { color: COLORS.codeBg },
      shadow: { type: "outer", blur: 4, offset: 2, angle: 135, color: "000000", opacity: 0.1 }
    });

    s.addText(cb.code, {
      x: 0.8, y: yPos + 0.08, w: 8.4, h: blockH - 0.16,
      fontSize: 9.5, fontFace: FONTS.code,
      color: COLORS.codeText, align: "left", valign: "top",
      paraSpaceAfter: 1,
      margin: 0,
    });

    yPos += blockH + 0.15;
  }

  if (slide.notes) s.addNotes(slide.notes);
  return s;
}

function addDiagramSlide(pres, slide) {
  const s = pres.addSlide();
  s.background = { color: COLORS.lightBg };

  s.addText(slide.title, {
    x: 0.6, y: 0.3, w: 8.8, h: 0.6,
    fontSize: 26, fontFace: FONTS.heading,
    color: COLORS.text, align: "left",
    margin: 0
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 0.88, w: 1.5, h: 0.03,
    fill: { color: COLORS.gold }
  });

  // Parse the diagram: [Step] → [Step] → ...
  const steps = slide.diagram.match(/\[([^\]]+)\]/g).map(s => s.slice(1, -1));
  const stepColors = [COLORS.purple, COLORS.green, COLORS.blue, COLORS.amber, COLORS.purple, COLORS.green];

  const boxW = 1.25;
  const boxH = 0.65;
  const gap = 0.22;
  const arrowW = 0.18;
  const totalW = steps.length * boxW + (steps.length - 1) * (gap + arrowW);
  const startX = (10 - totalW) / 2;
  const yCenter = 2.8;

  steps.forEach((step, i) => {
    const x = startX + i * (boxW + gap + arrowW);

    // Box
    s.addShape(pres.shapes.RECTANGLE, {
      x: x, y: yCenter, w: boxW, h: boxH,
      fill: { color: stepColors[i % stepColors.length] },
      shadow: { type: "outer", blur: 3, offset: 1, angle: 135, color: "000000", opacity: 0.12 }
    });

    // Step number
    s.addText(String(i + 1), {
      x: x, y: yCenter - 0.3, w: boxW, h: 0.25,
      fontSize: 11, fontFace: FONTS.code,
      color: COLORS.muted, align: "center",
      margin: 0
    });

    // Step label
    s.addText(step, {
      x: x, y: yCenter, w: boxW, h: boxH,
      fontSize: 9.5, fontFace: FONTS.body,
      color: COLORS.white, align: "center", valign: "middle",
      bold: true,
      margin: 0
    });

    // Arrow (except after last)
    if (i < steps.length - 1) {
      const arrowX = x + boxW + gap / 2;
      s.addText("→", {
        x: arrowX, y: yCenter, w: arrowW + gap, h: boxH,
        fontSize: 18, fontFace: FONTS.body,
        color: COLORS.muted, align: "center", valign: "middle",
        margin: 0
      });
    }
  });

  // Subtitle text below
  const bodyLines = slide.body.split("\n").filter(l => l.trim() && !l.startsWith("Subtitle:"));
  const subtitleLine = slide.body.split("\n").find(l => l.startsWith("Subtitle:"));
  if (subtitleLine) {
    s.addText(subtitleLine.replace("Subtitle: ", ""), {
      x: 0.6, y: 4.0, w: 8.8, h: 0.4,
      fontSize: 13, fontFace: FONTS.heading,
      color: COLORS.textLight, italic: true, align: "center",
      margin: 0
    });
  }

  if (slide.notes) s.addNotes(slide.notes);
  return s;
}

function addRecapSlide(pres, slide) {
  const s = pres.addSlide();
  s.background = { color: COLORS.lightBg };

  s.addText(slide.title, {
    x: 0.6, y: 0.3, w: 8.8, h: 0.6,
    fontSize: 26, fontFace: FONTS.heading,
    color: COLORS.text, align: "left",
    margin: 0
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 0.88, w: 1.5, h: 0.03,
    fill: { color: COLORS.gold }
  });

  // Parse numbered items from body
  const bodyText = slide.body + "\n" + slide.bullets.map(b => "- " + b).join("\n");
  const numberedItems = bodyText.match(/^\d+\.\s+.+$/gm) || [];
  const habitColors = [COLORS.green, COLORS.blue, COLORS.purple, COLORS.amber, COLORS.green];

  let yPos = 1.2;
  numberedItems.forEach((item, i) => {
    const clean = item.replace(/^\d+\.\s+/, "").replace(/\*\*(.+?)\*\*/g, "$1");
    const parts = clean.split("—");
    const habitName = parts[0].trim();
    const habitDesc = parts.length > 1 ? " — " + parts.slice(1).join("—").trim() : "";

    // Colored number circle
    s.addShape(pres.shapes.OVAL, {
      x: 0.6, y: yPos + 0.03, w: 0.4, h: 0.4,
      fill: { color: habitColors[i % habitColors.length] },
    });

    s.addText(String(i + 1), {
      x: 0.6, y: yPos + 0.03, w: 0.4, h: 0.4,
      fontSize: 14, fontFace: FONTS.body,
      color: COLORS.white, align: "center", valign: "middle",
      bold: true, margin: 0
    });

    // Habit text
    s.addText([
      { text: habitName, options: { bold: true, color: COLORS.text, fontSize: 14 } },
      { text: habitDesc, options: { color: COLORS.textLight, fontSize: 12 } }
    ], {
      x: 1.15, y: yPos, w: 8.25, h: 0.46,
      fontFace: FONTS.body, align: "left", valign: "middle",
      margin: 0
    });

    yPos += 0.58;
  });

  // Closing line
  const closingLine = slide.body.split("\n").filter(l => l.trim() && !l.match(/^\d+\./)).pop();
  if (closingLine) {
    const textOpts = { x: 0.6, y: yPos + 0.2, w: 8.8, h: 0.35, fontSize: 13, fontFace: FONTS.heading, color: COLORS.gold, italic: true, align: "left", margin: 0 };
    s.addText(parseInlineMarkdown(closingLine, textOpts), textOpts);
  }

  if (slide.notes) s.addNotes(slide.notes);
  return s;
}

function addClosingSlide(pres, slide) {
  const s = pres.addSlide();
  s.background = { color: COLORS.darkBg };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.04,
    fill: { color: COLORS.gold }
  });

  s.addText(slide.title, {
    x: 0.8, y: 1.4, w: 8.4, h: 1.2,
    fontSize: 28, fontFace: FONTS.heading,
    color: COLORS.white, align: "left",
    margin: 0
  });

  // Body lines
  const bodyLines = slide.body.split("\n").filter(l => l.trim());
  let yPos = 3.0;
  for (const line of bodyLines) {
    const textOpts = {
      x: 0.8, y: yPos, w: 8.4, h: 0.35,
      fontSize: 13, fontFace: line.includes("Download") ? FONTS.code : FONTS.heading,
      color: line.includes("Download") ? COLORS.muted : COLORS.gold,
      italic: !line.includes("Download"),
      align: "left",
      margin: 0
    };
    s.addText(parseInlineMarkdown(line, textOpts), textOpts);
    yPos += 0.45;
  }

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 4.8, w: 2, h: 0.03,
    fill: { color: COLORS.gold }
  });

  if (slide.notes) s.addNotes(slide.notes);
  return s;
}

// =============================================================================
// ROUTING — map slide IDs to builders
// =============================================================================
const TITLE_SLIDES = ["title_slide"];
const SECTION_TITLES = ["habit1_title", "habit2_title", "habit3_title", "habit4_title", "habit5_title"];
const TABLE_SLIDES = ["programmer_vs_developer"];
const DIAGRAM_SLIDES = ["progression_diagram"];
const CODE_SLIDES = [
  "count_the_sins", "habit1_before_after", "habit2_function_example",
  "habit3_example", "habit3_real_test", "habit3_running_tests",
  "habit2_structure", "habit5_key_points"
];
const RECAP_SLIDES = ["recap"];
const CLOSING_SLIDES = ["closing"];

function buildPresentation(mdPath, outputPath) {
  const slides = parseMarkdown(mdPath);
  const pres = new pptxgen();

  pres.layout = "LAYOUT_16x9";
  pres.author = "Carlos";
  pres.title = slides[0]?.title || "Lecture Slides";

  for (const slide of slides) {
    if (TITLE_SLIDES.includes(slide.id)) {
      addTitleSlide(pres, slide);
    } else if (SECTION_TITLES.includes(slide.id)) {
      addSectionTitleSlide(pres, slide);
    } else if (TABLE_SLIDES.includes(slide.id)) {
      addTableSlide(pres, slide);
    } else if (DIAGRAM_SLIDES.includes(slide.id)) {
      addDiagramSlide(pres, slide);
    } else if (CODE_SLIDES.includes(slide.id)) {
      addCodeSlide(pres, slide);
    } else if (RECAP_SLIDES.includes(slide.id)) {
      addRecapSlide(pres, slide);
    } else if (CLOSING_SLIDES.includes(slide.id)) {
      addClosingSlide(pres, slide);
    } else {
      // Default: content slide with bullets/text
      addContentSlide(pres, slide);
    }
  }

  pres.writeFile({ fileName: outputPath }).then(() => {
    console.log(`Created: ${outputPath} (${slides.length} slides)`);
  });
}

// =============================================================================
// MAIN
// =============================================================================
const mdPath = process.argv[2] || "slides/02_five_habits.md";
const outPath = process.argv[3] || "output/02_five_habits.pptx";

// Ensure output dir exists
const outDir = path.dirname(outPath);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

buildPresentation(mdPath, outPath);
