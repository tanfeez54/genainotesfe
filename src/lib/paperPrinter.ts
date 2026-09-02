/**
 * Professional Examination Paper Print & PDF Generation Engine
 * Generates pure, semantic, standards-compliant A4 print documents
 * with mathematical line alignment and zero page-boundary clipping.
 */

export interface ExamPaperData {
  schoolName?: string;
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
  const examTitle = (data.title || 'Annual Examination - 2026').trim();
  const className = (data.className || 'N/A').trim();
  const subjectName = (data.subjectName || 'N/A').trim();
  const timeAllowed = (data.timeAllowed || '2.5 Hours').trim();
  const totalMarks = data.totalMarks || 50;
  const instructions = data.instructions || '1. Attempt all questions.\n2. Write answers clearly and neatly.\n3. Section A is compulsory.';
  const questions = data.questions || [];

  const cleanDocTitle = `${schoolName}_${examTitle}_${subjectName}`.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Group questions by section
  const sectionGroups: { sectionName: string; type: string; instruction: string; questions: any[] }[] = [];
  const sectionTypeOrder = ['mcq', 'fill_blank', 'match_the_following', 'true_false', 'short_answer', 'long_answer'];

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
      } else if (t === 'short_answer') {
        secTitle = 'SECTION E: SHORT ANSWER QUESTIONS';
        secInstruction = 'Answer the following short answer questions:';
      } else {
        secTitle = 'SECTION F: LONG ANSWER QUESTIONS';
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

  // Parse match the following
  const parseMatchCols = (q: any) => {
    let colA: string[] = [];
    let colB: string[] = [];
    if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
      const rawA = q.options.column_a || q.options.columnA || [];
      const rawB = q.options.column_b || q.options.columnB || [];
      colA = rawA.map((item: any) => (typeof item === 'string' ? item : item.text || ''));
      colB = rawB.map((item: any) => (typeof item === 'string' ? item : item.text || ''));
    }
    return { colA, colB };
  };

  let globalQuestionCounter = 1;

  // Build pure HTML
  const sectionsHtml = sectionGroups
    .map((sec) => {
      const qHtml = sec.questions
        .map((q) => {
          const qNum = globalQuestionCounter++;
          const qText = q.question_text || q.text || '';

          let detailsHtml = '';

          // 1. MCQ
          if (sec.type === 'mcq' && Array.isArray(q.options) && q.options.length > 0) {
            const optItems = q.options
              .map((opt: any, oIdx: number) => {
                const label = String.fromCharCode(65 + oIdx);
                const text = typeof opt === 'string' ? opt : opt.text || '';
                return `<div class="mcq-col"><strong>(${label})</strong> ${text}</div>`;
              })
              .join('');
            detailsHtml = `<div class="mcq-grid">${optItems}</div>`;
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
                const textA = colA[rIdx] || '';
                const textB = colB[rIdx] || '';
                const labelA = `${rIdx + 1}.`;
                const labelB = `${String.fromCharCode(65 + rIdx)}.`;
                return `
                  <tr>
                    <td class="match-left"><strong>${labelA}</strong> ${textA}</td>
                    <td class="match-right"><strong>${labelB}</strong> ${textB}</td>
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

          // Attached Diagram Image
          let imageHtml = '';
          if (q.image_url) {
            imageHtml = `
              <div class="figure-box">
                <img src="${q.image_url}" alt="Figure Q${qNum}" />
                <div class="fig-caption">[Fig. Q${qNum}]</div>
              </div>
            `;
          }

          return `
            <div class="question-block">
              <div class="q-head">
                <span class="q-num">Q${qNum}.</span>
                <span class="q-body">${qText}</span>
              </div>
              ${imageHtml}
              ${detailsHtml}
            </div>
          `;
        })
        .join('');

      return `
        <div class="section-container">
          <div class="sec-title">${sec.sectionName}</div>
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
        <meta charset="utf-8" />
        <title>${cleanDocTitle}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 20mm 15mm; /* Professional A4 Margins */
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
            font-family: "Times New Roman", Times, serif; /* Classic Exam Font */
            font-size: 11pt; /* Optimal readability */
            line-height: 1.4;
          }

          .paper-wrapper {
            width: 100%;
            max-width: 210mm; /* A4 Width */
            margin: 0 auto;
          }

          /* Header Styling */
          .paper-header {
            text-align: center;
            border-bottom: 2px solid #000000;
            padding-bottom: 8px;
            margin-bottom: 12px;
            break-after: avoid;
            page-break-after: avoid;
          }

          .school-name {
            font-size: 20pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0 0 4px 0;
          }

          .exam-title {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0 0 8px 0;
          }

          .meta-table {
            width: 100%;
            border-top: 1.5px solid #000;
            border-bottom: 1.5px solid #000;
            margin-top: 8px;
            padding: 4px 0;
            font-size: 10.5pt;
            font-weight: bold;
            text-transform: uppercase;
          }

          .meta-table td {
            padding: 4px 8px;
          }

          /* Candidate Box */
          .candidate-row {
            width: 100%;
            margin-bottom: 15px;
            font-size: 11pt;
            font-weight: bold;
            break-after: avoid;
            page-break-after: avoid;
          }
          
          .candidate-row td {
            padding: 4px 0;
          }

          /* Instructions */
          .instructions-box {
            padding: 10px 14px;
            border: 1px solid #000;
            background: #fff;
            font-size: 10.5pt;
            margin-bottom: 20px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .instructions-box strong {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 11pt;
          }

          /* Section Container */
          .section-container {
            margin-top: 20px;
            margin-bottom: 15px;
          }

          .sec-title {
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
            margin: 0 0 6px 0;
            break-after: avoid !important;
            page-break-after: avoid !important;
          }

          .sec-inst {
            font-size: 11pt;
            font-style: italic;
            font-weight: bold;
            margin: 0 0 12px 0;
            break-after: avoid !important;
            page-break-after: avoid !important;
          }

          /* Multi-column layout for two-column setting */
          ${
            isTwoColumn
              ? \`
          .sec-questions {
            column-count: 2;
            column-gap: 25px;
            column-rule: 1px solid #ccc;
          }
          \`
              : ''
          }

          /* Individual Question Block */
          .question-block {
            margin-bottom: 14px;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .q-head {
            display: flex;
            align-items: flex-start;
            font-weight: normal;
            font-size: 11pt;
            line-height: 1.4;
          }

          .q-num {
            font-weight: bold;
            min-width: 28px;
            flex-shrink: 0;
          }

          .q-body {
            flex-grow: 1;
          }

          /* MCQ Options */
          .mcq-grid {
            display: flex;
            flex-wrap: wrap;
            padding-left: 28px;
            margin-top: 6px;
            font-size: 10.5pt;
          }

          .mcq-col {
            width: ${isTwoColumn ? '100%' : '50%'};
            margin-bottom: 6px;
            padding-right: 10px;
          }

          /* True False */
          .tf-row {
            display: flex;
            gap: 40px;
            padding-left: 28px;
            margin-top: 6px;
            font-size: 10.5pt;
          }

          .box {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 1px solid #000;
            margin-right: 6px;
            vertical-align: text-bottom;
          }

          /* Match the Following 2-Column Table */
          .match-table {
            width: 90%;
            margin-left: 28px;
            margin-top: 8px;
            border-collapse: collapse;
            font-size: 10.5pt;
          }

          .match-table th {
            text-align: left;
            font-weight: bold;
            padding: 4px;
            border-bottom: 1px solid #000;
          }

          .match-table td {
            vertical-align: top;
            padding: 6px 4px;
          }

          .match-left {
            width: 50%;
            padding-right: 15px;
          }

          .match-right {
            width: 50%;
            padding-left: 15px;
          }

          /* Figure Images */
          .figure-box {
            text-align: center;
            margin: 10px auto;
          }

          .figure-box img {
            max-height: 180px;
            max-width: 100%;
            border: 1px solid #000;
            padding: 2px;
            display: inline-block;
          }

          .fig-caption {
            font-size: 9pt;
            font-style: italic;
            margin-top: 4px;
          }

          /* Footer */
          .paper-footer {
            text-align: center;
            margin-top: 30px;
            font-size: 10pt;
            font-weight: bold;
            text-transform: uppercase;
            break-inside: avoid;
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div class="paper-wrapper">
          <!-- School Paper Header -->
          <div class="paper-header">
            <div class="school-name">${schoolName}</div>
            <div class="exam-title">${examTitle}</div>
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
              ? \`<div class="instructions-box"><strong>General Instructions:</strong><br/><br/>\${instructions.replace(/\\n/g, '<br/>')}</div>\`
              : ''
          }

          <!-- All Sections & Questions -->
          ${sectionsHtml}

          <!-- End of Paper -->
          <div class="paper-footer">*** END OF PAPER ***</div>
        </div>
      </body>
    </html>
  \`);
  doc.close();

  // Wait for images and render before triggering print
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  }, 300);
}
