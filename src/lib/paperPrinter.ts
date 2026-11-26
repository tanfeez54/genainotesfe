/**
 * Professional Examination Paper Print & PDF Generation Engine
 * Generates pure, semantic, standards-compliant A4 print documents
 * with mathematical line alignment and zero page-boundary clipping.
 */

import katex from 'katex';
import 'katex/dist/katex.min.css';

export const autoFormatMath = (text: string) => {
  if (!text) return '';
  try {
    let str = String(text);

    // 0. Clean Devanagari / Hindi text from accidental LaTeX corruption or broken tags
    // Remove broken tags like \</i> or </i>
    str = str.replace(/\\?<\/?i>/gi, '');

    // Strip \text{...} or $\text{...}$ that encloses Devanagari characters (\u0900-\u097F)
    str = str.replace(/\$?\\\s*text\{([^}]*[\u0900-\u097F][^}]*)\}\$?(\s*)/g, '$1$2');

    // Clean stray backslashes inside Devanagari words
    str = str.replace(/([\u0900-\u097F])\s*\\\s*([\u0900-\u097F])/g, '$1$2');

    // Strip $...$ math delimiters around purely Devanagari words (no math operators or numbers)
    str = str.replace(/\$([^$]*[\u0900-\u097F][^$]*)\$/g, (match, inner) => {
      if (!/[0-9\+\-\=\^\/\\_<>\\times\\div\\pm\\leq\\geq]/.test(inner)) {
        return inner;
      }
      return match;
    });

    // Repair corrupted 'संख्या' fragments (e.g. 'सं \text{ख्\् याओं}', 'सं ख् याओं')
    str = str.replace(/सं\s*[\\]?\s*ख्[\\\/]?[्\s]*या(ओं|ओ|ऑ|एँ|एं)?/g, (_m, end) => {
      if (end === 'ओं' || end === 'ओ' || end === 'ऑ') return 'संख्याओं';
      if (end === 'एँ' || end === 'एं') return 'संख्याएँ';
      return 'संख्या';
    });
    str = str.replace(/(^|[^\u0900-\u097F])ख्[\\\/]?[्\s]*या(ओं|ओ|ऑ|एँ|एं)?/g, (_m, prefix, end) => {
      if (end === 'ओं' || end === 'ओ' || end === 'ऑ') return prefix + 'ख्याओं';
      if (end === 'एँ' || end === 'एं') return prefix + 'ख्याएँ';
      return prefix + 'ख्या';
    });

    // Normalize duplicate anusvara/chandrabindu
    str = str.replace(/[\u0902\u0901]{2,}/g, '\u0902');

    // Clean textbook/page/chapter references so questions read like authentic exam questions
    // e.g. 'अध्याय 3 (हमारे चारों ओर पैटर्न) के पृष्ठ 1 के चित्र को देखकर' -> 'दिए गए चित्र को देखकर'
    str = str.replace(/(?:अध्याय|पाठ)\s*\d*(?:\s*\([^)]*\))?\s*(?:के|पर)?\s*(?:पृष्ठ|पेज)\s*\d*\s*(?:पर|के)?\s*(?:दिए\s*गए\s*)?चित्र\s*को\s*देखकर/g, 'दिए गए चित्र को देखकर');
    str = str.replace(/चित्र\s*\d+(?:\.\d+)?\s*को\s*देखकर/g, 'दिए गए चित्र को देखकर');
    str = str.replace(/(?:अध्याय|पाठ)\s*\d*(?:\s*\([^)]*\))?\s*(?:के|पर)?\s*(?:पृष्ठ|पेज)\s*\d*\s*(?:पर|के|में)?/g, '');
    str = str.replace(/(?:in\s+)?(?:chapter|lesson|unit)\s*\d*(?:\s*\([^)]*\))?,?\s*(?:page|pg\.?)\s*\d*,?\s*look\s+at\s+the\s+(?:picture|figure|diagram)/gi, 'Look at the given picture below');
    str = str.replace(/(?:figure|fig\.?)\s*\d+(?:\.\d+)?/gi, 'the given figure');

    // 1. Decode literal unicode escapes (e.g. \u2018 -> ‘)
    str = str.replace(/\\u([0-9a-fA-F]{4})/g, (_, grp) => String.fromCharCode(parseInt(grp, 16)));

    // Fix standalone ext{ preceded by whitespace, =, $, or start of string
    str = str.replace(/(^|[\s\=\+\-\(\[\$])ext\{([^\}]+)\}/g, '$1\\text{$2}');

    // 3. Normalize quadruple or double backslashes in front of common LaTeX commands
    str = str.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

    // 4. Convert standalone degrees like "90°" outside $...$ to "$90^\circ$"
    str = str.replace(/(?<![\$\w])(\d+)\s*°/g, '$$$1^\\circ$$');

    // 5. Parity & unclosed math checks
    // If string has an odd number of $ delimiters, attempt intelligent repair
    const dollarMatches = str.match(/\$/g);
    let dollarCount = dollarMatches ? dollarMatches.length : 0;

    if (dollarCount % 2 !== 0) {
      // Pattern: starts with math command like \angle1 = 90^\circ$ but missing opening $
      if (/^\s*\\(?:angle|Delta|frac|sqrt|[a-zA-Z]+)[^\$]*\$/.test(str)) {
        str = '$' + str;
        dollarCount++;
      } else {
        // Pattern: sentence like "... 2. \angle3 + \angle1 = 90^\circ$"
        str = str.replace(/(^|[\.\n]\s*)(\\(?:angle|Delta|frac|sqrt)[^\$]*\$)/g, (match, p1, p2) => {
          return `${p1}$${p2}`;
        });
        const updatedMatches = str.match(/\$/g);
        if (updatedMatches && updatedMatches.length % 2 !== 0) {
          // If still odd, close unclosed dollar at the end
          str = str + '$';
        }
      }
    }

    // 6. Split into text mode (even indices) and math mode (odd indices)
    const parts = str.split('$');
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Text mode: Wrap standalone fractions like 3/4 or -1/2 in $\frac{1}{2}$
        parts[i] = parts[i].replace(/(?<![\w\.\/])([-+]?\d+)\/(\d+)(?![\w\.\/])/g, '$\\frac{$1}{$2}$');

        // Text mode: If there are unbracketed LaTeX commands left in text mode, wrap them in $...$
        // e.g. \angle 1, \Delta ABC, \cong, \text{...}
        parts[i] = parts[i].replace(/(\\(?:angle|Delta|cong|sim|perp|parallel|theta|pi|alpha|beta|gamma|lambda|mu|sigma|sqrt|frac|times|pm|leq|geq|neq|approx|circ)[a-zA-Z0-9_\^\+\-\=\s\{\}\\]*?)(?=[,\.\;\:\n]|$)/g, (m) => {
          const trimmed = m.trim();
          if (trimmed) return `$${trimmed}$`;
          return m;
        });
      } else {
        // Math mode: Convert slash fractions to \frac
        parts[i] = parts[i].replace(/(?<![\w\.\/])([-+]?\d+)\/(\d+)(?![\w\.\/])/g, '\\frac{$1}{$2}');
        // Normalize any double backslashes in math mode
        parts[i] = parts[i].replace(/\\\\([a-zA-Z]+)/g, '\\$1');
      }
    }

    let result = parts.join('$');
    // Clean up empty math blocks "$$$$" or "$ $"
    result = result.replace(/\$\s*\$/g, ' ');

    return result;
  } catch (e) {
    return text;
  }
};

const renderLatex = (str: string) => {
  if (!str) return '';
  try {
    const formatted = autoFormatMath(str);
    const parts = formatted.split('$');
    for (let i = 1; i < parts.length; i += 2) {
      parts[i] = katex.renderToString(parts[i], {
        throwOnError: false,
        displayMode: false
      });
    }
    return parts.join('');
  } catch (e) {
    return str;
  }
};

export interface ExamPaperData {
  schoolName?: string;
  schoolLogo?: string;
  schoolAddress?: string;
  title: string;
  className?: string;
  subjectName?: string;
  timeAllowed?: string;
  totalMarks?: number | string;
  instructions?: string;
  questions: any[];
  isTwoColumn?: boolean;
  highlightStyle?: 'blue' | 'yellow' | 'bold' | 'none';
  solveInsidePaper?: boolean;
  mathSpaceSize?: 'huge' | 'xlarge' | 'large' | 'medium';
  mathColumns?: number;
  isRawPaper?: boolean;
  fitSinglePage?: boolean;
}

export function printExamPaper(data: ExamPaperData) {
  const isTwoColumn = Boolean(data.isTwoColumn);
  const highlightStyle = data.highlightStyle || 'blue';
  const solveInsidePaper = Boolean(data.solveInsidePaper);
  const isRawPaper = Boolean(data.isRawPaper);
  const fitSinglePage = Boolean(data.fitSinglePage ?? (data.totalMarks ? Number(data.totalMarks) <= 25 : false));
  const mathSpaceSize = fitSinglePage ? (data.mathSpaceSize === 'huge' ? 'large' : 'medium') : (data.mathSpaceSize || 'xlarge');
  const mathColumns = data.mathColumns || 2;
  const schoolName = (data.schoolName || 'Modern Public School').trim();
  const schoolLogo = data.schoolLogo;
  const schoolAddress = data.schoolAddress;
  const examTitle = (data.title || 'Annual Examination - 2026').trim();
  const className = (data.className || 'N/A').trim();
  const subjectName = (data.subjectName || 'N/A').trim();
  const timeAllowed = (data.timeAllowed || '2.5 Hours').trim();
  const totalMarks = data.totalMarks || 50;
  const instructions = data.instructions || '1. Attempt all questions.\n2. Write answers clearly and neatly.\n3. Section A is compulsory.';
  const questions = data.questions || [];

  const cleanDocTitle = `${schoolName}_${examTitle}_${subjectName}`.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Group questions by section
  const sectionGroups: { sectionName: string; subSection?: string; type: string; instruction: string; questions: any[] }[] = [];
  const hasCustomSectionNames = questions.some((q) => q.section_name && q.section_name.trim() !== '' && !/^general/i.test(q.section_name) && !/^section\s*a$/i.test(q.section_name.trim()));

  if (isRawPaper || fitSinglePage || !hasCustomSectionNames) {
    sectionGroups.push({
      sectionName: '',
      type: 'raw',
      instruction: '',
      questions: questions,
    });
  } else if (hasCustomSectionNames) {
    questions.forEach((q) => {
      const secName = q.section_name || 'General Questions';
      let grp = sectionGroups.find((g) => g.sectionName.toLowerCase() === secName.toLowerCase());
      if (!grp) {
        let secInstruction = '';
        const t = q.type;
        if (t === 'mcq') secInstruction = 'Choose and write the correct option for each question:';
        else if (t === 'fill_blank') secInstruction = 'Fill in the blanks with suitable words / phrases:';
        else if (t === 'match_the_following') secInstruction = 'Match the items in Column A with Column B:';
        else if (t === 'true_false') secInstruction = 'State whether the following statements are True or False:';
        else if (t === 'picture_based') secInstruction = 'Observe the given pictures / diagrams carefully and answer the questions (चित्रों को देखकर उत्तर दीजिए):';
        else if (t === 'short_answer') secInstruction = 'Answer the following short answer questions:';
        else if (t === 'long_answer') secInstruction = 'Answer the following questions in detail:';
        else secInstruction = 'Answer the following questions:';

        grp = {
          sectionName: secName,
          subSection: q.sub_section,
          type: q.type,
          instruction: secInstruction,
          questions: [],
        };
        sectionGroups.push(grp);
      }
      grp.questions.push(q);
    });

    // Format sectionName with total marks
    sectionGroups.forEach((grp) => {
      const totalSecMarks = grp.questions.reduce((acc, q) => acc + (Number(q.marks) || 1), 0);
      grp.sectionName = `${grp.sectionName.toUpperCase()} (${totalSecMarks} MARKS)`;
    });
  } else {
    const sectionTypeOrder = ['mcq', 'fill_blank', 'match_the_following', 'true_false', 'picture_based', 'short_answer', 'long_answer'];

    sectionTypeOrder.forEach((t) => {
      const matched = questions.filter((q) => q.type === t);
      if (matched.length > 0) {
        let secTitle = '';
        let secInstruction = '';
        if (t === 'mcq') {
          secTitle = 'SECTION A: MULTIPLE CHOICE QUESTIONS';
          secInstruction = 'Choose and write the correct option for each question:';
        } else if (t === 'fill_blank') {
          secTitle = 'SECTION B: FILL IN THE BLANKS';
          secInstruction = 'Fill in the blanks with suitable words / phrases:';
        } else if (t === 'match_the_following') {
          secTitle = 'SECTION C: MATCH THE FOLLOWING';
          secInstruction = 'Match the items in Column A with Column B:';
        } else if (t === 'true_false') {
          secTitle = 'SECTION D: TRUE OR FALSE';
          secInstruction = 'State whether the following statements are True or False:';
        } else if (t === 'picture_based') {
          secTitle = 'SECTION E: PICTURE / DIAGRAM BASED QUESTIONS (चित्र आधारित प्रश्न)';
          secInstruction = 'Observe the given pictures / diagrams carefully and answer the questions (चित्रों को देखकर उत्तर दीजिए):';
        } else if (t === 'short_answer') {
          secTitle = 'SECTION F: SHORT ANSWER QUESTIONS';
          secInstruction = 'Answer the following short answer questions:';
        } else {
          secTitle = 'SECTION G: LONG ANSWER QUESTIONS';
          secInstruction = 'Answer the following questions in detail:';
        }

        const totalSecMarks = matched.reduce((acc, q) => acc + (Number(q.marks) || 1), 0);
        sectionGroups.push({
          sectionName: `${secTitle} (${totalSecMarks} MARKS)`,
          type: t,
          instruction: secInstruction,
          questions: matched,
        });
      }
    });

    // Any remaining custom question types
    const remaining = questions.filter((q) => !sectionTypeOrder.includes(q.type));
    if (remaining.length > 0) {
      const totalSecMarks = remaining.reduce((acc, q) => acc + (Number(q.marks) || 1), 0);
      sectionGroups.push({
        sectionName: `ADDITIONAL QUESTIONS (${totalSecMarks} MARKS)`,
        type: 'other',
        instruction: 'Answer the following questions:',
        questions: remaining,
      });
    }
  }

  // Parse match the following
  const parseMatchCols = (q: any) => {
    let colA: any[] = [];
    let colB: any[] = [];
    if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
      const rawA = q.options.column_a || q.options.columnA || [];
      const rawB = q.options.column_b || q.options.columnB || [];
      colA = rawA.map((item: any) => (typeof item === 'string' ? item : item.text || ''));
      colB = rawB.map((item: any) => (typeof item === 'string' ? item : item.text || ''));
    }
    return { colA, colB };
  };

  const toRoman = (num: number): string => {
    const lookup: any = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
    let roman = '';
    for (let i in lookup ) {
      while ( num >= lookup[i] ) {
        roman += i;
        num -= lookup[i];
      }
    }
    return roman;
  };

  const formatQuestionNumber = (secIdx: number, qIdx: number): string => {
    if (isRawPaper || fitSinglePage || !hasCustomSectionNames) {
      return `${qIdx + 1}`;
    }
    const n = qIdx + 1;
    const style = secIdx % 5;
    const alphaChar = String.fromCharCode(97 + ((n - 1) % 26));
    switch (style) {
      case 0: return `${n}`; // 1, 2, 3
      case 1: return alphaChar; // a, b, c
      case 2: return toRoman(n); // I, II, III
      case 3: return alphaChar.toUpperCase(); // A, B, C
      case 4: return toRoman(n).toLowerCase(); // i, ii, iii
      default: return `${n}`;
    }
  };

  // Build pure HTML
  const sectionsHtml = sectionGroups
    .map((sec, secIdx) => {
      const qHtml = sec.questions
        .map((q, qIdx) => {
          const qNum = formatQuestionNumber(secIdx, qIdx);
          const qText = q.question_text || q.text || '';
          const lines = qText.split('\n');
          const firstLine = lines[0] || '';
          const remainingLines = lines.slice(1).join('\n');
          const rawSubItems = remainingLines
            .split('\n')
            .map((l: string) => l.trim())
            .filter(Boolean);

          const isMathQuestion =
            /\b(divide|division|भाग|quotient|remainder|multiply|multiplication|गुणा|product|addition|subtraction|solve|calculate)\b/i.test(firstLine) ||
            /\d+\s*\)\s*\d+/.test(qText) ||
            /[÷×]/.test(firstLine);

          let detailsHtml = '';

          // 1. MCQ
          if ((q.type === 'mcq' || sec.type === 'mcq') && Array.isArray(q.options) && q.options.length > 0) {
            const maxOptLen = Math.max(0, ...q.options.map((o: any) => (typeof o === 'string' ? o : o.text || '').length));
            let cols = maxOptLen < 20 ? 4 : maxOptLen < 50 ? 2 : 1;
            if (isTwoColumn) {
              cols = maxOptLen < 8 ? 4 : maxOptLen < 25 ? 2 : 1;
            }

            const optItems = q.options
              .map((opt: any, oIdx: number) => {
                const label = String.fromCharCode(65 + oIdx);
                const text = typeof opt === 'string' ? opt : opt.text || '';
                return `<div class="mcq-col"><strong>(${label})</strong> ${renderLatex(text)}</div>`;
              })
              .join('');
            detailsHtml = `<div class="mcq-grid" style="grid-template-columns: repeat(${cols}, 1fr);">${optItems}</div>`;
          }

          // 2. True False
          else if (q.type === 'true_false' || sec.type === 'true_false') {
            detailsHtml = `
              <div class="tf-row">
                <span><span class="box"></span> (A) True</span>
                <span><span class="box"></span> (B) False</span>
              </div>
            `;
          }

          // 3. Match the Following
          else if (q.type === 'match_the_following' || sec.type === 'match_the_following') {
            const { colA, colB } = parseMatchCols(q);
            const maxRows = Math.max(colA.length, colB.length, 1);
            const rowsHtml = Array.from({ length: maxRows })
              .map((_, rIdx) => {
                const itemA = colA[rIdx];
                const itemB = colB[rIdx];
                const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
                const labelA = romanNumerals[rIdx] ? `(${romanNumerals[rIdx]})` : `${rIdx + 1}.`;
                const labelB = `(${String.fromCharCode(65 + rIdx)})`;
                const textA = typeof itemA === 'string' ? itemA : itemA?.text || '';
                const textB = typeof itemB === 'string' ? itemB : itemB?.text || '';
                return `
                  <tr>
                    <td class="match-left"><strong>${labelA}</strong> ${itemA ? renderLatex(textA) : ''}</td>
                    <td class="match-right"><strong>${labelB}</strong> ${itemB ? renderLatex(textB) : ''}</td>
                  </tr>
                `;
              })
              .join('');

            detailsHtml = `
              <table class="match-table">
                <thead>
                  <tr>
                    <th class="match-left">Column A</th>
                    <th class="match-right">Column B</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            `;
          }
          
          // 4. Short Answer Space
          else if (sec.type === 'short_answer' || q.type === 'short_answer') {
            if (!isMathQuestion && solveInsidePaper && !qText.includes('_______')) {
              const numLines = fitSinglePage ? 2 : Math.min(3, Math.max(2, Number(q.marks) || 2));
              const linesHtml = Array(numLines)
                .fill(0)
                .map((_, i) => `<div class="kid-ruled-line">${i === 0 ? '<span class="kid-ans-label">Ans:</span>' : ''}</div>`)
                .join('');
              detailsHtml = `<div class="kid-ruled-answer-area">${linesHtml}</div>`;
            } else {
              detailsHtml = '';
            }
          }

          // 5. Long Answer Space
          else if (sec.type === 'long_answer' || q.type === 'long_answer') {
            if (!isMathQuestion && solveInsidePaper && !qText.includes('_______')) {
              const numLines = fitSinglePage ? 3 : Math.min(5, Math.max(3, Number(q.marks) || 3));
              const linesHtml = Array(numLines)
                .fill(0)
                .map((_, i) => `<div class="kid-ruled-line">${i === 0 ? '<span class="kid-ans-label">Ans:</span>' : ''}</div>`)
                .join('');
              detailsHtml = `<div class="kid-ruled-answer-area">${linesHtml}</div>`;
            } else {
              detailsHtml = '';
            }
          }

          // Fallback for any question without blanks when solveInsidePaper is active
          if (!detailsHtml && !isMathQuestion && solveInsidePaper && !qText.includes('_______') && !q.options && sec.type !== 'mcq' && q.type !== 'mcq' && sec.type !== 'match_the_following' && q.type !== 'match_the_following') {
            const numLines = fitSinglePage ? 2 : Math.min(3, Math.max(2, Number(q.marks) || 2));
            const linesHtml = Array(numLines)
              .fill(0)
              .map((_, i) => `<div class="kid-ruled-line">${i === 0 ? '<span class="kid-ans-label">Ans:</span>' : ''}</div>`)
              .join('');
            detailsHtml = `<div class="kid-ruled-answer-area">${linesHtml}</div>`;
          }

          // Attached Diagram Image
          let imageHtml = '';
          if (q.image_url) {
            imageHtml = `
              <div class="figure-box">
                <img src="${q.image_url}" alt="Figure Q${qNum}" />
                <div class="fig-caption">[Fig. ${qNum}]</div>
              </div>
            `;
          }
          
          // Question marks if available
          const marksHtml = q.marks ? `<span class="q-marks">[${q.marks}]</span>` : '';

          // Question-level subsection header if it differs from section top-level subsection or previous question
          const qSubSecHtml =
            q.sub_section &&
            q.sub_section !== sec.subSection &&
            (qIdx === 0 || sec.questions[qIdx - 1]?.sub_section !== q.sub_section)
              ? `<div style="font-weight: bold; font-size: 11px; text-transform: uppercase; margin: 4px 0 2px 0; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px; color: #1e1b4b;">${q.sub_section}</div>`
              : '';

          // Format question instruction after question number with dark bold / highlight
          let qContentHtml = '';

          let mathGridHtml = '';
          const spaceSize = fitSinglePage ? (mathSpaceSize === 'huge' ? 'large' : 'medium') : (data.mathSpaceSize || 'xlarge');
          const defaultCols = rawSubItems.length === 1 ? 1 : (data.mathColumns || 2);
          const colsClass = `cols-${defaultCols}`;

          if (isMathQuestion && rawSubItems.length >= 1) {
            const cellsHtml = rawSubItems
              .map((item: string) => `
                <div class="math-calc-cell size-${spaceSize}">
                  <div class="math-calc-header">${renderLatex(item)}</div>
                  <div class="math-calc-body size-${spaceSize}"></div>
                </div>
              `)
              .join('');
            mathGridHtml = `<div class="math-calc-grid ${colsClass}">${cellsHtml}</div>`;
          }

          if (highlightStyle && highlightStyle !== 'none') {
            const stemHtml = `<span class="q-stem-highlight ${highlightStyle}">${renderLatex(firstLine)}</span>`;
            if (mathGridHtml) {
              qContentHtml = `
                <div class="q-text">
                  ${stemHtml}
                  ${mathGridHtml}
                </div>
              `;
            } else if (remainingLines.trim()) {
              qContentHtml = `
                <div class="q-text">
                  ${stemHtml}
                  <div class="q-body-lines">${renderLatex(remainingLines)}</div>
                </div>
              `;
            } else {
              qContentHtml = `
                <div class="q-text">
                  ${stemHtml}
                </div>
              `;
            }
          } else {
            if (mathGridHtml) {
              qContentHtml = `
                <div class="q-text">
                  <span class="q-stem-highlight bold">${renderLatex(firstLine)}</span>
                  ${mathGridHtml}
                </div>
              `;
            } else {
              qContentHtml = `<span class="q-text">${renderLatex(qText)}</span>`;
            }
          }

          return `
            ${qSubSecHtml}
            <div class="question-block">
              <div class="q-head">
                <span class="q-num">${qNum}.</span>
                ${qContentHtml}
                ${marksHtml}
              </div>
              ${imageHtml}
              ${detailsHtml}
            </div>
          `;
        })
        .join('');

      const subSecHtml = sec.subSection
        ? `<div style="font-weight: bold; font-size: 11.5px; text-transform: uppercase; margin: 2px 0 4px 0; color: #1e1b4b;">${sec.subSection}</div>`
        : '';

      const secTitleHtml = sec.sectionName ? `<div class="sec-title">${sec.sectionName}</div>` : '';
      const secInstHtml = sec.instruction ? `<div class="sec-inst">${sec.instruction}</div>` : '';

      return `
        <div class="section-container" style="${!sec.sectionName ? 'margin-top:0;margin-bottom:0;' : ''}">
          ${secTitleHtml}
          ${subSecHtml}
          ${secInstHtml}
          <div class="sec-questions">
            ${qHtml}
          </div>
        </div>
      `;
    })
    .join('');

  // Create isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title> </title>
        <link href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 0mm; /* Zero @page margin completely suppresses browser default date, time, title, and URL */
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: "Times New Roman", Times, "Cambria", serif;
            font-size: 10pt;
            line-height: 1.35;
          }

          /* Repeating Table Layout ensures clean top and bottom margins on EVERY page */
          .print-page-table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
            margin: 0;
            padding: 0;
            border: none;
          }

          .page-top-margin-cell {
            height: 10mm; /* Uniform 10mm top margin on Page 1, Page 2, Page 3... */
            padding: 0;
            margin: 0;
            border: none;
          }

          .page-bottom-margin-cell {
            height: 10mm; /* Uniform 10mm bottom margin on Page 1, Page 2, Page 3... */
            padding: 0;
            margin: 0;
            border: none;
          }

          .page-content-cell {
            padding: 0 10mm; /* Uniform 10mm left & right margins on all pages */
            border: none;
            vertical-align: top;
          }

          .paper-wrapper {
            width: 100%;
            margin: 0 auto;
          }

          /* Header Styling - Compact & Clean */
          .paper-header {
            border-bottom: 2px solid #000000;
            padding-bottom: 4px;
            margin-bottom: 6px;
            break-after: avoid;
            page-break-after: avoid;
          }

          .header-top {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            margin-bottom: 4px;
          }

          .logo-box {
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 65px;
            max-height: 65px;
            display: flex;
            align-items: center;
          }

          .logo-box img {
            max-width: 100%;
            max-height: 65px;
            object-fit: contain;
          }

          .header-titles {
            text-align: center;
            max-width: calc(100% - 150px);
            margin: 0 auto;
          }

          .school-name {
            font-size: 16pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 1px 0;
            line-height: 1.2;
          }

          .school-address {
            font-size: 8.5pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #333;
            margin: 0 0 2px 0;
          }

          .exam-title {
            font-size: 11.5pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0;
          }

          .meta-table {
            width: 100%;
            border-top: 1.2px solid #000;
            border-bottom: 1.2px solid #000;
            margin-top: 4px;
            padding: 2px 0;
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
          }

          .meta-table td {
            padding: 2px 4px;
          }

          /* Candidate Details */
          .candidate-row {
            width: 100%;
            margin-bottom: 6px;
            font-size: 9pt;
            font-weight: bold;
            break-after: avoid;
            page-break-after: avoid;
          }
          
          .candidate-row td {
            padding: 2px 0;
          }

          /* General Instructions Box - Compact */
          .instructions-box {
            padding: 5px 8px;
            border: 1px solid #444;
            background: #fff;
            font-size: 8.5pt;
            line-height: 1.3;
            margin-bottom: 8px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .instructions-box strong {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 8.5pt;
          }

          /* Section Container - ALLOWS SEAMLESS FLOW ACROSS PAGES */
          .section-container {
            margin-top: 8px;
            margin-bottom: 6px;
          }

          .sec-title {
            font-size: 10pt;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
            margin: 0 0 3px 0;
            break-after: avoid !important;
            page-break-after: avoid !important;
          }

          .sec-inst {
            font-size: 8.5pt;
            font-style: italic;
            color: #333;
            margin: 0 0 6px 0;
            break-after: avoid !important;
            page-break-after: avoid !important;
          }

          /* Multi-column layout for two-column setting */
          ${
            isTwoColumn
              ? `
          .sec-questions {
            column-count: 2;
            column-gap: 16px;
            column-fill: balance;
          }
          .mcq-grid {
            display: flex !important;
            flex-direction: column;
            gap: 2px !important;
          }
          `
              : ''
          }

          /* Individual Question Block - Only individual questions avoid break */
          .question-block {
            margin-bottom: 7px;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .q-head {
            display: flex;
            align-items: flex-start;
            font-weight: normal;
            font-size: 9.5pt;
            line-height: 1.35;
          }

          .q-num {
            font-weight: bold;
            min-width: 22px;
            flex-shrink: 0;
          }

          .q-body {
            flex-grow: 1;
          }

          .q-text {
            flex-grow: 1;
            white-space: pre-wrap;
            word-break: break-word;
          }

          .q-stem-highlight {
            font-weight: 800;
            color: #0f172a;
            line-height: 1.4;
          }

          .q-stem-highlight.blue {
            background-color: #dbeafe !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            padding: 1px 5px;
            border-radius: 3px;
            display: inline;
          }

          .q-stem-highlight.yellow {
            background-color: #fef08a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            padding: 1px 5px;
            border-radius: 3px;
            display: inline;
          }

          .q-stem-highlight.bold {
            font-weight: 800;
            color: #000;
            display: inline;
          }

          .q-body-lines {
            margin-top: 4px;
            white-space: pre-wrap;
            font-weight: normal;
            line-height: 1.5;
          }

          /* Solve-Inside-Paper (Question-cum-Answer Sheet for KG / Primary) */
          .solve-inside-active .question-block {
            margin-bottom: ${fitSinglePage ? '10px' : '22px'} !important;
            padding-bottom: ${fitSinglePage ? '2px' : '6px'};
          }

          .solve-inside-active .q-body-lines {
            line-height: ${fitSinglePage ? '1.7' : '2.2'} !important;
            font-size: 9.5pt;
            margin-top: 4px;
          }

          .solve-inside-active .q-head {
            font-size: 9.5pt;
            line-height: 1.35;
          }

          .kid-ruled-answer-area {
            margin-top: 8px;
            margin-left: 22px;
          }

          .kid-ruled-line {
            height: 28px;
            border-bottom: 1.2px dashed #94a3b8;
            width: 96%;
            display: flex;
            align-items: flex-end;
            margin-bottom: 6px;
          }

          .kid-ans-label {
            font-weight: 800;
            font-size: 9pt;
            color: #1e293b;
            padding-bottom: 2px;
            margin-right: 8px;
          }

          /* Math Problem Calculation Grid (Division, Multiplication, Arithmetic) */
          .math-calc-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
            margin-top: 10px;
            margin-bottom: 14px;
            width: 100%;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .math-calc-grid.cols-1 {
            grid-template-columns: 1fr !important;
          }

          .math-calc-grid.cols-2 {
            grid-template-columns: repeat(2, 1fr) !important;
          }

          .math-calc-grid.cols-3 {
            grid-template-columns: repeat(3, 1fr) !important;
          }

          .math-calc-cell {
            border: 1.5px dashed #475569;
            border-radius: 8px;
            padding: 10px 12px;
            background: #ffffff;
            min-height: 230px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-inside: avoid;
            break-inside: avoid;
            box-sizing: border-box;
          }

          .math-calc-cell.size-huge {
            min-height: 290px !important;
          }

          .math-calc-cell.size-xlarge {
            min-height: 230px !important;
          }

          .math-calc-cell.size-large {
            min-height: 180px !important;
          }

          .math-calc-cell.size-medium {
            min-height: 130px !important;
          }

          .math-calc-header {
            font-size: 12pt;
            font-weight: 800;
            color: #0f172a;
            border-bottom: 1.2px dotted #94a3b8;
            padding-bottom: 6px;
            font-family: 'Courier New', Courier, monospace, sans-serif;
            letter-spacing: 0.5px;
          }

          .math-calc-body {
            flex-grow: 1;
            min-height: 170px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .math-calc-body.size-huge {
            min-height: 230px !important;
          }

          .math-calc-body.size-xlarge {
            min-height: 170px !important;
          }

          .math-calc-body.size-large {
            min-height: 125px !important;
          }

          .math-calc-body.size-medium {
            min-height: 80px !important;
          }

          /* MCQ Options */
          .mcq-grid {
            display: grid;
            padding-left: 22px;
            margin-top: 3px;
            font-size: 9pt;
            gap: 2px 10px;
          }

          .mcq-col {
            width: auto;
          }

          /* True False */
          .tf-row {
            display: flex;
            gap: 30px;
            padding-left: 22px;
            margin-top: 3px;
            font-size: 9pt;
          }

          .box {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 1px solid #000;
            margin-right: 4px;
            vertical-align: text-bottom;
          }

          /* Match the Following 2-Column Table */
          .match-table {
            width: 90%;
            margin-left: 22px;
            margin-top: 4px;
            border-collapse: collapse;
            font-size: 9pt;
          }

          .match-table th {
            text-align: left;
            font-weight: bold;
            padding: 2px 4px;
            border-bottom: 1px solid #000;
          }

          .match-table td {
            vertical-align: top;
            padding: 3px 4px;
          }

          .match-left {
            width: 50%;
            padding-right: 10px;
          }

          .match-right {
            width: 50%;
            padding-left: 10px;
          }

          /* Answer Lines for subjective questions */
          .answer-lines {
            margin-top: 4px;
            margin-bottom: 3px;
          }

          .ans-line {
            border-bottom: 1px dashed #777;
            height: 18px;
            margin-bottom: 4px;
            width: 95%;
          }

          /* Question Marks */
          .q-marks {
            margin-left: auto;
            font-weight: bold;
            font-size: 9pt;
            padding-left: 10px;
          }

          /* Figure Images - COMPACT TO SAVE SPACE */
          .figure-box {
            text-align: center;
            margin: 4px auto;
          }

          .figure-box img {
            max-height: 100px;
            max-width: 80%;
            border: 1px solid #888;
            padding: 2px;
            display: inline-block;
            object-fit: contain;
          }

          .fig-caption {
            font-size: 8pt;
            font-style: italic;
            margin-top: 2px;
            color: #444;
          }

          /* Footer */
          .paper-footer {
            text-align: center;
            margin-top: 12px;
            font-size: 8pt;
            font-weight: bold;
            text-transform: uppercase;
            break-inside: avoid;
            page-break-inside: avoid;
            letter-spacing: 1px;
          }

          /* Single Page Fit Optimization (Ensures 20-mark tests fit completely on 1 single page) */
          ${
            fitSinglePage
              ? `
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          .page-top-margin-cell {
            height: 3mm !important;
          }
          .page-bottom-margin-cell {
            height: 3mm !important;
          }
          .page-content-cell {
            padding: 0 4mm !important;
          }
          .paper-header {
            margin-bottom: 3px !important;
            padding-bottom: 2px !important;
          }
          .logo-box {
            width: 44px !important;
            max-height: 44px !important;
          }
          .logo-box img {
            max-height: 44px !important;
          }
          .school-name {
            font-size: 13pt !important;
            margin-bottom: 1px !important;
            line-height: 1.1 !important;
          }
          .school-address {
            font-size: 8pt !important;
            margin-bottom: 1px !important;
          }
          .exam-title {
            font-size: 10pt !important;
          }
          .meta-table {
            font-size: 8pt !important;
            padding: 1px 0 !important;
            margin-top: 2px !important;
          }
          .candidate-row {
            font-size: 8pt !important;
            margin-bottom: 4px !important;
          }
          .instructions-box {
            padding: 3px 6px !important;
            margin-bottom: 4px !important;
            font-size: 7.5pt !important;
          }
          .question-block {
            margin-bottom: 7px !important;
            padding-bottom: 0px !important;
          }
          .q-head {
            font-size: 9pt !important;
            line-height: 1.35 !important;
          }
          .q-body-lines {
            margin-top: 2px !important;
            line-height: 1.6 !important;
            font-size: 9pt !important;
          }
          .math-calc-grid {
            gap: 10px !important;
            margin-top: 6px !important;
            margin-bottom: 6px !important;
          }
          .math-calc-cell {
            min-height: 125px !important;
            padding: 6px 8px !important;
          }
          .math-calc-body {
            min-height: 80px !important;
          }
          .math-calc-header {
            font-size: 10.5pt !important;
            padding-bottom: 3px !important;
          }
          .kid-ruled-line {
            height: 22px !important;
            margin-bottom: 4px !important;
          }
          .paper-footer {
            margin-top: 6px !important;
            font-size: 7.5pt !important;
          }
          `
              : ''
          }
        </style>
      </head>
      <body>
        <table class="print-page-table">
          <thead>
            <tr>
              <td class="page-top-margin-cell"></td>
            </tr>
          </thead>
          <tfoot>
            <tr>
              <td class="page-bottom-margin-cell"></td>
            </tr>
          </tfoot>
          <tbody>
            <tr>
              <td class="page-content-cell">
                <div class="paper-wrapper ${solveInsidePaper ? 'solve-inside-active' : ''}">
                  <!-- School Paper Header -->
                  <div class="paper-header">
                    <div class="header-top">
                      ${schoolLogo ? `<div class="logo-box"><img src="${schoolLogo}" alt="School Logo" /></div>` : ''}
                      <div class="header-titles">
                        <div class="school-name">${schoolName}</div>
                        ${schoolAddress ? `<div class="school-address">${schoolAddress}</div>` : ''}
                        <div class="exam-title">${examTitle}</div>
                      </div>
                    </div>
                    <table class="meta-table">
                      <tr>
                        <td style="text-align: left;">CLASS: ${className}</td>
                        <td style="text-align: center;">SUBJECT: ${subjectName}</td>
                        <td style="text-align: center;">TIME: ${timeAllowed}</td>
                        <td style="text-align: right;">MAX. MARKS: ${totalMarks}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Candidate Details -->
                  <table class="candidate-row">
                    <tr>
                      <td style="text-align: left;">Name: ___________________________________</td>
                      <td style="text-align: center;">Roll No: _________ &nbsp; Sec: _____</td>
                      ${
                        solveInsidePaper
                          ? `<td style="text-align: right; font-weight: bold; border: 1.5px solid #000; padding: 2px 8px; border-radius: 4px; background: #fafafa;">Marks: [ _______ / ${totalMarks} ]</td>`
                          : `<td style="text-align: right;">Roll No: _______________ &nbsp; Section: _______</td>`
                      }
                    </tr>
                  </table>

                  <!-- Invigilator & Examiner Signatures -->
                  <table class="candidate-row" style="margin-top: 2px;">
                    <tr>
                      <td style="text-align: left;">Invigilator's Signature: _________________________</td>
                      <td style="text-align: right;">Examiner's Signature: _________________________</td>
                    </tr>
                  </table>

                  <!-- Instructions -->
                  ${
                    instructions
                      ? `<div class="instructions-box"><strong>General Instructions:</strong><br/><br/>${instructions.replace(/\n/g, '<br/>')}</div>`
                      : ''
                  }

                  <!-- All Sections & Questions -->
                  ${sectionsHtml}

                  <!-- End of Paper -->
                  <div class="paper-footer">*** END OF PAPER ***</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `);
  doc.close();

  // Temporarily clear parent document.title so Chromium NEVER prints the site title
  const originalTitle = document.title;
  document.title = ' ';
  if (doc) {
    doc.title = ' ';
  }

  // Wait briefly for KaTeX CSS and images to load
  setTimeout(() => {
    if (!iframe.contentWindow) {
      document.title = originalTitle;
      return;
    }
    iframe.contentWindow.focus();
    
    // Restore title and clean up iframe only after printing is done or cancelled
    iframe.contentWindow.onafterprint = () => {
      document.title = originalTitle;
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };

    iframe.contentWindow.print();

    // Fallback cleanup and title restore just in case onafterprint doesn't fire
    setTimeout(() => {
      document.title = originalTitle;
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 60000); // 1 minute fallback
  }, 500);
}

/**
 * Prints the exact on-screen DOM preview (e.g. #printable-raw-paper) in strict A4 size.
 * Ensures 100% visual parity between preview and downloaded PDF, and naturally flows to Page 2+ if full.
 */
export function printRawPaperFromDom(elementId: string = 'printable-raw-paper') {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    window.print();
    return;
  }

  const clone = sourceEl.cloneNode(true) as HTMLElement;

  // Remove interactive/edit buttons marked with print:hidden
  clone.querySelectorAll('.print\\:hidden').forEach((node) => node.remove());

  // Clean outer wrapper styles for full A4 width inside @page margins
  clone.style.width = '100%';
  clone.style.maxWidth = '100%';
  clone.style.minWidth = '0';
  clone.style.margin = '0';
  clone.style.padding = '0';
  clone.style.border = 'none';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  clone.style.background = '#ffffff';

  // Collect all active stylesheets and inline styles from the current page (Tailwind + KaTeX)
  const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('\n');

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '794px';
  iframe.style.height = '1123px';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.border = 'none';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title> </title>
        ${headStyles}
        <style>
          @page {
            size: A4 portrait;
            margin: 0mm; /* Zero @page margin completely suppresses browser default date, time, title, and URL */
          }

          html, body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-page-table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
            margin: 0;
            padding: 0;
            border: none;
          }

          .page-top-margin-cell {
            height: 5mm;
            padding: 0;
            margin: 0;
            border: none;
          }

          .page-bottom-margin-cell {
            height: 6mm;
            padding: 0;
            margin: 0;
            border: none;
          }

          .page-content-cell {
            padding: 0 9mm;
            border: none;
            vertical-align: top;
          }

          @media print {
            @page {
              size: A4 portrait;
              margin: 0mm;
            }

            html, body {
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              font-size: 12px !important;
              line-height: 1.5 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body * {
              visibility: visible !important;
            }

            #${elementId} {
              position: static !important;
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: #ffffff !important;
              visibility: visible !important;
            }

            #${elementId} * {
              visibility: visible !important;
            }

            .math-calc-box {
              min-height: var(--box-min-h, 230px) !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            .raw-q-item {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            .raw-q-stem {
              break-after: avoid !important;
              page-break-after: avoid !important;
            }
          }
        </style>
      </head>
      <body>
        <table class="print-page-table">
          <thead>
            <tr>
              <td class="page-top-margin-cell"></td>
            </tr>
          </thead>
          <tfoot>
            <tr>
              <td class="page-bottom-margin-cell"></td>
            </tr>
          </tfoot>
          <tbody>
            <tr>
              <td class="page-content-cell">
                ${clone.outerHTML}
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `);
  doc.close();

  const originalTitle = document.title;
  document.title = ' ';
  if (doc) {
    doc.title = ' ';
  }

  setTimeout(() => {
    if (!iframe.contentWindow) {
      document.title = originalTitle;
      return;
    }
    iframe.contentWindow.focus();
    iframe.contentWindow.onafterprint = () => {
      document.title = originalTitle;
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };
    iframe.contentWindow.print();

    setTimeout(() => {
      document.title = originalTitle;
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 60000);
  }, 500);
}

/**
 * Directly generates and downloads an A4 PDF file from #printable-raw-paper
 * without opening the browser print dialog. Supports smart multi-page A4 flow
 * without cutting any question or math calculation box in half.
 */
export async function downloadRawPaperAsPdf(
  elementId: string = 'printable-raw-paper',
  filename: string = 'Exam_Paper.pdf'
) {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    throw new Error('Paper preview element not found');
  }

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ]);

  // Create off-screen A4-width host container (794px = 210mm at 96dpi)
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-12000px';
  host.style.top = '0';
  host.style.width = '794px';
  host.style.background = '#ffffff';
  host.style.zIndex = '-9999';
  host.style.pointerEvents = 'none';

  const clone = sourceEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.print\\:hidden').forEach((node) => node.remove());

  // Normalize clone styling for crisp A4 capture
  clone.style.width = '794px';
  clone.style.maxWidth = '794px';
  clone.style.minWidth = '794px';
  clone.style.margin = '0';
  clone.style.padding = '0px 32px 0px 32px';
  clone.style.border = 'none';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  clone.style.background = '#ffffff';

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    // Inline all external images (such as school logo on R2/Supabase) as base64 data URLs
    // so html2canvas NEVER drops them due to CORS or non-CORS browser cache
    const imgs = Array.from(clone.querySelectorAll('img')) as HTMLImageElement[];
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    await Promise.all(
      imgs.map(async (img) => {
        const src = img.getAttribute('src') || '';
        if (!src || src.startsWith('data:')) return;
        let dataUrl: string | null = null;
        try {
          const resp = await fetch(src, { mode: 'cors', cache: 'no-store' });
          if (resp.ok) {
            const blob = await resp.blob();
            dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          }
        } catch {
          // Ignore direct CORS failure, fall through to backend proxy
        }
        if (!dataUrl) {
          try {
            const proxyResp = await fetch(`${apiUrl}/api/schools/proxy-logo?url=${encodeURIComponent(src)}`);
            if (proxyResp.ok) {
              const blob = await proxyResp.blob();
              dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
            }
          } catch (e) {
            console.warn('Logo inline proxy fallback failed:', e);
          }
        }
        if (dataUrl) {
          img.src = dataUrl;
          await new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        }
      })
    );

    // Wait briefly for fonts/layout inside clone
    await new Promise((r) => setTimeout(r, 150));

    // A4 page usable height at 794px width with minimal 5mm top & 6mm bottom margins:
    // 297mm - 11mm = 286mm -> 286 * (794 / 210) ≈ 1081px per page
    const PAGE_CONTENT_HEIGHT_PX = 1080;
    const scale = 2;

    // Smart page-break adjustment: never orphan a question label on Page 1 while its sub-questions go to Page 2
    // Use paddingTop (NOT marginTop) on qBlock so CSS margin-collapse NEVER pulls the heading back onto the page cut!
    const qBlocks = Array.from(clone.querySelectorAll('.raw-q-block, .print-question')) as HTMLElement[];
    for (const qBlock of qBlocks) {
      const containerTop = clone.getBoundingClientRect().top;
      const mathBoxes = Array.from(qBlock.querySelectorAll('.math-calc-box')) as HTMLElement[];

      if (mathBoxes.length > 0) {
        // Group math boxes into rows by their Y coordinate (within 8px tolerance)
        const rows: HTMLElement[][] = [];
        for (const box of mathBoxes) {
          const boxTop = box.getBoundingClientRect().top;
          const existingRow = rows.find((r) => Math.abs(r[0].getBoundingClientRect().top - boxTop) < 8);
          if (existingRow) {
            existingRow.push(box);
          } else {
            rows.push([box]);
          }
        }

        // Check question label/stem + Row 1 together so heading is NEVER orphaned
        const firstRow = rows[0];
        if (firstRow && firstRow.length > 0) {
          const qRect = qBlock.getBoundingClientRect();
          const qTop = qRect.top - containerTop;
          const firstRowBottom = Math.max(...firstRow.map((b) => b.getBoundingClientRect().bottom)) - containerTop;

          const startPage = Math.floor(qTop / PAGE_CONTENT_HEIGHT_PX);
          const endPage = Math.floor((firstRowBottom - 2) / PAGE_CONTENT_HEIGHT_PX);

          if (endPage > startPage && (firstRowBottom - qTop) < PAGE_CONTENT_HEIGHT_PX - 40) {
            const pushDown = (startPage + 1) * PAGE_CONTENT_HEIGHT_PX - qTop + 4;
            const currentPaddingTop = parseFloat(window.getComputedStyle(qBlock).paddingTop || '0') || 0;
            qBlock.style.paddingTop = `${currentPaddingTop + pushDown}px`;
          }
        }

        // Check subsequent rows (Row 2, Row 3...) so each row moves together cleanly if crossing a page
        for (let rIdx = 1; rIdx < rows.length; rIdx++) {
          const row = rows[rIdx];
          const cTop = clone.getBoundingClientRect().top;
          const rowTop = Math.min(...row.map((b) => b.getBoundingClientRect().top)) - cTop;
          const rowBottom = Math.max(...row.map((b) => b.getBoundingClientRect().bottom)) - cTop;

          const startPage = Math.floor(rowTop / PAGE_CONTENT_HEIGHT_PX);
          const endPage = Math.floor((rowBottom - 2) / PAGE_CONTENT_HEIGHT_PX);

          if (endPage > startPage && (rowBottom - rowTop) < PAGE_CONTENT_HEIGHT_PX - 40) {
            const pushDown = (startPage + 1) * PAGE_CONTENT_HEIGHT_PX - rowTop + 4;
            for (const box of row) {
              const currentMarginTop = parseFloat(window.getComputedStyle(box).marginTop || '0') || 0;
              box.style.marginTop = `${currentMarginTop + pushDown}px`;
            }
          }
        }
      } else {
        const rect = qBlock.getBoundingClientRect();
        const top = rect.top - containerTop;
        const bottom = rect.bottom - containerTop;

        const startPage = Math.floor(top / PAGE_CONTENT_HEIGHT_PX);
        const endPage = Math.floor((bottom - 2) / PAGE_CONTENT_HEIGHT_PX);

        if (endPage > startPage && rect.height < PAGE_CONTENT_HEIGHT_PX - 40) {
          const pushDown = (startPage + 1) * PAGE_CONTENT_HEIGHT_PX - top + 4;
          const currentPaddingTop = parseFloat(window.getComputedStyle(qBlock).paddingTop || '0') || 0;
          qBlock.style.paddingTop = `${currentPaddingTop + pushDown}px`;
        }
      }
    }

    // Remove trailing margin/padding on last question block so it never triggers an empty extra page
    if (qBlocks.length > 0) {
      const lastQ = qBlocks[qBlocks.length - 1];
      lastQ.style.marginBottom = '0px';
      lastQ.style.paddingBottom = '0px';
    }

    // Measure actual bottom-most visible content to trim any empty trailing whitespace
    const cloneTopFinal = clone.getBoundingClientRect().top;
    const contentEls = Array.from(clone.querySelectorAll('.raw-q-block, .print-question, .math-calc-box')) as HTMLElement[];
    let maxContentBottomPx = 0;
    for (const el of contentEls) {
      const b = el.getBoundingClientRect().bottom - cloneTopFinal;
      if (b > maxContentBottomPx) maxContentBottomPx = b;
    }

    const canvas = await html2canvas(clone, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794,
      logging: false,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const sliceHeightPx = PAGE_CONTENT_HEIGHT_PX * scale;
    const effectiveCanvasHeight =
      maxContentBottomPx > 0
        ? Math.min(canvas.height, Math.ceil((maxContentBottomPx + 8) * scale))
        : canvas.height;
    const totalPages = Math.max(1, Math.ceil(effectiveCanvasHeight / sliceHeightPx));

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const srcY = pageIdx * sliceHeightPx;
      const remainingHeight = effectiveCanvasHeight - srcY;
      const currentSliceHeight = Math.min(sliceHeightPx, remainingHeight);

      if (currentSliceHeight <= 30 * scale) break;

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = currentSliceHeight;

      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          srcY,
          canvas.width,
          currentSliceHeight,
          0,
          0,
          canvas.width,
          currentSliceHeight
        );
      }

      const imgData = pageCanvas.toDataURL('image/png');
      const imgHeightMm = (currentSliceHeight / canvas.width) * 210;

      if (pageIdx > 0) {
        pdf.addPage('a4', 'portrait');
      }

      // Place at x=0, y=5mm (minimal 5mm top margin on every A4 page)
      pdf.addImage(imgData, 'PNG', 0, 5, 210, imgHeightMm, undefined, 'FAST');
    }

    const cleanFilename = filename.replace(/[^a-zA-Z0-9_\-. ]/g, '_');
    pdf.save(cleanFilename.endsWith('.pdf') ? cleanFilename : `${cleanFilename}.pdf`);
  } finally {
    if (document.body.contains(host)) {
      document.body.removeChild(host);
    }
  }
}
