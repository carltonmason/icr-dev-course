// =============================================================================
// parseInlineMarkdown — inline formatting helper for build_slides.js
// =============================================================================
//
// INTEGRATION INSTRUCTIONS FOR CLAUDE CODE
// -----------------------------------------
// 1. Paste the parseInlineMarkdown function below into build_slides.js,
//    immediately after the constants block at the top of the file.
//
// 2. Find every call in build_slides.js where bullet or body text is passed
//    as a plain string to slide.addText(), for example:
//
//      slide.addText(bulletText, textOptions);
//
//    Replace the plain string argument with a parseInlineMarkdown() call:
//
//      slide.addText(parseInlineMarkdown(bulletText, textOptions), textOptions);
//
// 3. The function is safe to call on any text — if no inline markers are
//    present it returns the original plain string unchanged, so pptxgenjs
//    behaviour is identical to before for unformatted lines.
//
// 4. Verify by running the pipeline against slides/02_five_habits.md and
//    checking that **bold** labels render as bold in the output .pptx, and
//    that `code spans` render in Courier New.
//
// WHAT IT HANDLES
// ---------------
//   **bold text**   → pptxgenjs bold run
//   `code span`     → Courier New, 1pt smaller than base font size
//   plain text      → unchanged, inherits baseOptions
//
// WHAT IT DOES NOT HANDLE (out of scope for this course)
// -------------------------------------------------------
//   *italic*  — not used in the slide markdown conventions
//   ***bold italic*** — not used
//   nested markers — not used
// =============================================================================

/**
 * Convert a markdown string with **bold** and `code` markers into a
 * pptxgenjs text-run array. Pass the return value directly to addText().
 *
 * @param {string}  text         - raw markdown line (e.g. a bullet string)
 * @param {object}  baseOptions  - pptxgenjs text options applied to all runs
 * @returns {string|Array}       - plain string if no markers found,
 *                                 [{text, options}, ...] array if markers found
 */
function parseInlineMarkdown(text, baseOptions = {}) {
  // Matches **bold** or `code` spans — non-greedy, no nesting
  const INLINE_PATTERN = /(\*\*(.+?)\*\*|`([^`]+?)`)/g;
  const runs = [];
  let lastIndex = 0;
  let match;

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    // Plain text segment before this match
    if (match.index > lastIndex) {
      runs.push({
        text: text.slice(lastIndex, match.index),
        options: { ...baseOptions },
      });
    }

    if (match[0].startsWith('**')) {
      // Bold run — preserves all other base options
      runs.push({
        text: match[2],
        options: { ...baseOptions, bold: true },
      });
    } else {
      // Monospace run — Courier New, 1pt smaller than base font size
      runs.push({
        text: match[3],
        options: {
          ...baseOptions,
          fontFace: 'Courier New',
          fontSize: (baseOptions.fontSize || 14) - 1,
        },
      });
    }

    lastIndex = INLINE_PATTERN.lastIndex;
  }

  // Any remaining plain text after the last match
  if (lastIndex < text.length) {
    runs.push({
      text: text.slice(lastIndex),
      options: { ...baseOptions },
    });
  }

  // Return plain string if no markers found — safe drop-in for any addText() call
  return runs.length === 0 ? text : runs;
}

// Export for use in build_slides.js if using CommonJS modules
// (remove if build_slides.js does not use module.exports)
// module.exports = { parseInlineMarkdown };
