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
}

export function printExamPaper(data: ExamPaperData) {
  const isTwoColumn = Boolean(data.isTwoColumn);
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
  // Group questions by section (preserving custom section names and subsections)
  const sectionGroups: { sectionName: string; subSection?: string; type: string; instruction: string; questions: any[] }[] = [];
  const hasCustomSectionNames = questions.some((q) => q.section_name);

  if (hasCustomSectionNames) {
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

          let detailsHtml = '';

          // 1. MCQ
          if (sec.type === 'mcq' && Array.isArray(q.options) && q.options.length > 0) {
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
          else if (sec.type === 'true_false') {
            detailsHtml = `
              <div class="tf-row">
                <span><span class="box"></span> (A) True</span>
                <span><span class="box"></span> (B) False</span>
              </div>
            `;
          }

          // 3. Match the Following
          else if (sec.type === 'match_the_following') {
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
          else if (sec.type === 'short_answer') {
             detailsHtml = '';
          }

          // 5. Long Answer Space
          else if (sec.type === 'long_answer') {
             detailsHtml = '';
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

          return `
            ${qSubSecHtml}
            <div class="question-block">
              <div class="q-head">
                <span class="q-num">${qNum}.</span>
                <span class="q-text">${renderLatex(qText)}</span>
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

      return `
        <div class="section-container">
          <div class="sec-title">${sec.sectionName}</div>
          ${subSecHtml}
          <div class="sec-inst">${sec.instruction}</div>
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
                <div class="paper-wrapper">
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
                      <td style="text-align: left;">Name of Candidate: ___________________________________</td>
                      <td style="text-align: right;">Roll No: _______________ &nbsp;&nbsp;&nbsp; Section: _______</td>
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
