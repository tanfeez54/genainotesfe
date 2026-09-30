'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  BookOpen,
  Edit3,
  FileCheck,
  History,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Printer,
  Copy,
  Check,
  ChevronRight,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  GraduationCap,
  Scale,
  ListOrdered,
  Clock,
  Layers,
  Award,
  BookMarked,
  Share2,
  Flame,
  ArrowRight,
  ArrowLeft,
  Upload,
  Camera,
  Image as ImageIcon,
  CheckCircle,
  FolderOpen,
  FileText,
  Plus,
  Eye,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Download,
  ChevronLeft,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ClassItem {
  id: string;
  name: string;
}

interface SubjectItem {
  id: string;
  name: string;
  class_id?: string;
}

interface ChapterItem {
  id: string;
  title: string;
  subject_id?: string;
}

interface ScannedDocItem {
  id: string;
  image_url: string;
  doc_type: string;
  status: 'pending' | 'processing' | 'ocr_completed' | 'failed';
  raw_ocr_text?: string;
  raw_ocr_json?: {
    summary?: string;
    key_topics?: string[];
    word_count?: number;
  };
  created_at: string;
}

interface LessonSuiteData {
  metadata: {
    className: string;
    subjectName: string;
    chapterTitle: string;
    board: string;
    language: string;
    generatedAt: string;
    scansUsedCount?: number;
    chapter_executive_summary?: string;
    source_grounding_analysis?: {
      sources_used?: string[];
      scanned_concepts_extracted?: string[];
      grounding_faithfulness_score?: string;
    };
  };
  teaching_plan: {
    total_periods_recommended: number;
    timeline_summary: string;
    sequence_rationale: string;
    periods: Array<{
      period_number: number;
      day_title: string;
      topics_covered: string;
      duration_minutes: number;
      prerequisites: string;
      pedagogy_focus: string;
    }>;
  };
  teaching_guide: {
    topics: Array<{
      topic_name: string;
      source_reference?: string;
      what_to_teach: string;
      how_to_explain: string;
      intuitive_analogy: string;
      real_world_examples: string[];
      common_mistakes_and_fixes: Array<{ mistake: string; correction: string }>;
      teacher_delivery_tips: string;
    }>;
  };
  mandatory_notes: {
    heading: string;
    instructions_for_students: string;
    definitions: Array<{ term: string; exact_definition: string; source_citation?: string; importance: string }>;
    formulas_and_rules: Array<{ title: string; formula: string; derivation_steps?: string | string[]; explanation: string }>;
    theorems_and_postulates: Array<{ name: string; statement: string; key_proof_steps: string }>;
    important_diagrams: Array<{ title: string; description: string; must_label_parts: string[] }>;
    high_yield_exam_points: string[];
  };
  classwork_homework: {
    classwork_practice: Array<{
      q_no: number;
      question: string;
      marks: number;
      solution_hints: string;
    }>;
    homework_assignment: Array<{
      level: 'Basic' | 'Standard' | 'Brain-Teaser (HOTS)';
      question: string;
      marks: number;
      guided_clue: string;
    }>;
    estimated_homework_time_mins: number;
  };
  pyq_legacy_analysis: {
    board_name: string;
    overall_chapter_weightage: string;
    topic_priority_breakdown: Array<{
      topic: string;
      priority: 'High Yield (🔴)' | 'Medium Yield (🟡)' | 'Foundational (🟢)';
      frequency_tags: string[];
      recurring_question_types: string;
      marks_trend: string;
      examiner_favorite_traps: string;
    }>;
  };
  quick_assessment: {
    topic_checks: Array<{
      question_number: number;
      topic: string;
      question: string;
      type: string;
      options?: string[];
      answer: string;
      gap_identified_if_wrong: string;
    }>;
    remedial_suggestions: string[];
  };
  revision_test_plan: {
    revision_schedule: Array<{
      phase: string;
      timing: string;
      strategy: string;
    }>;
    top_10_must_solve_questions: Array<{
      q_no: number;
      question: string;
      marks: number;
      why_important: string;
    }>;
    chapter_test_blueprint: {
      test_title: string;
      total_marks: number;
      time_minutes: number;
      sections_overview: string;
    };
    rapid_cheat_sheet_bullets: string[];
  };
}

// Built-in starter sample
const SAMPLE_LESSON_SUITE: LessonSuiteData = {
  metadata: {
    className: 'Class 10',
    subjectName: 'Science',
    chapterTitle: 'Chemical Reactions and Equations',
    board: 'CBSE',
    language: 'English',
    generatedAt: new Date().toISOString(),
    scansUsedCount: 3,
    chapter_executive_summary: 'Chapter 1 of Class 10 Science, "Chemical Reactions and Equations", establishes the foundational grammar of chemical transformations. It bridges observable macroscopic phenomena (color shifts, precipitate deposition, temperature variations, effervescence) with microscopic mass-conserving symbolic equations. The chapter guides learners through writing, balancing via the atom conservation method, classifying fundamental reaction mechanisms (combination, thermal/photolytic/electrolytic decomposition, displacement, double displacement precipitation), and concluding with electron/oxygen transfer redox mechanics and practical everyday degradation (corrosion and rancidity).',
    source_grounding_analysis: {
      sources_used: [
        'Scanned Textbook Page 1: Chemical Change Indicators & Magnesium Ribbon Activity',
        'Scanned Textbook Page 2: Law of Conservation of Mass & Table Balancing Algorithm',
        'Scanned Textbook Page 3: Classification of Reactions & Precipitation Reactions'
      ],
      scanned_concepts_extracted: [
        'Activity 1.1: Burning of Magnesium ribbon in air (2Mg + O2 -> 2MgO)',
        'Law of Conservation of Mass: Mass of reactants = Mass of products',
        'Quicklime (CaO) reaction with water to produce Slaked lime (Ca(OH)2)',
        'Thermal decomposition of Ferrous Sulphate crystals (green to reddish-brown)',
        'Double displacement precipitation of Barium Sulphate (BaSO4 white solid)'
      ],
      grounding_faithfulness_score: '99% Verbatim Aligned with Physical Textbook Scans'
    },
  },
  teaching_plan: {
    total_periods_recommended: 8,
    timeline_summary: 'Comprehensive 8-period teaching schedule progressing from basic physical vs chemical changes to balanced ionic equations, oxidation-reduction, and everyday corrosion prevention.',
    sequence_rationale: 'Students first observe tangible chemical changes (gas release, color change) before learning abstract symbolic equations, followed by systematic balancing and finally mechanistic reaction classifications.',
    periods: [
      {
        period_number: 1,
        day_title: 'Observations & Characteristics of Chemical Reactions',
        topics_covered: 'Definition of chemical change, 4 key indicators (change in state, color, temperature, gas evolution). Magnesium ribbon demonstration.',
        duration_minutes: 45,
        prerequisites: 'Basic atomic symbols and valency from Class 9.',
        pedagogy_focus: 'Live lab demo / teacher demonstration with safety glasses.'
      },
      {
        period_number: 2,
        day_title: 'Writing & Balancing Chemical Equations (Hit & Trial Method)',
        topics_covered: 'Word equations vs chemical equations. Law of Conservation of Mass. Step-by-step balancing algorithm with table method.',
        duration_minutes: 45,
        prerequisites: 'Forming chemical formulas using criss-cross method.',
        pedagogy_focus: 'Blackboard problem-solving with participatory student turns.'
      },
      {
        period_number: 3,
        day_title: 'Combination & Decomposition Reactions',
        topics_covered: 'Combination reactions (formation of slaked lime, exothermic nature). Decomposition reactions: Thermal (FeSO4, CaCO3, Pb(NO3)2), Electrolytic (Water electrolysis), and Photolytic (AgCl in sunlight).',
        duration_minutes: 45,
        prerequisites: 'Distinction between reactants and products.',
        pedagogy_focus: 'Comparative chart analysis on board + test tube color changes.'
      },
      {
        period_number: 4,
        day_title: 'Displacement & Double Displacement Reactions',
        topics_covered: 'Reactivity series correlation. Fe in CuSO4 solution. Double displacement and precipitation reactions (Na2SO4 + BaCl2).',
        duration_minutes: 45,
        prerequisites: 'Reactivity series of metals.',
        pedagogy_focus: 'Precipitation formation visual cues and ionic exchange concept.'
      },
      {
        period_number: 5,
        day_title: 'Oxidation, Reduction & Redox Mechanics',
        topics_covered: 'Definition in terms of gain/loss of oxygen and hydrogen. Identifying oxidizing agents and reducing agents in given equations.',
        duration_minutes: 45,
        prerequisites: 'Chemical equation balancing.',
        pedagogy_focus: 'Color-coded arrow diagrams mapping oxygen transfers.'
      },
      {
        period_number: 6,
        day_title: 'Effects of Oxidation in Daily Life: Corrosion & Rancidity',
        topics_covered: 'Rusting of iron conditions, tarnishing of silver, green coating on copper. Rancidity of fats and oils; prevention using antioxidants and nitrogen flushing.',
        duration_minutes: 45,
        prerequisites: 'Redox basics.',
        pedagogy_focus: 'Real-life packaging examples (potato chip bags, galvanized nails).'
      },
      {
        period_number: 7,
        day_title: 'Doubt Clearing & Previous Year Board Questions (PYQs)',
        topics_covered: 'In-depth solution of 2020-2024 board questions, multi-step word equation conversions, and identification of unknown compounds (X, Y, Z).',
        duration_minutes: 45,
        prerequisites: 'Full chapter completion.',
        pedagogy_focus: 'Competitive exam style problem solving and marking scheme tips.'
      },
      {
        period_number: 8,
        day_title: 'Diagnostic Mastery Test & Formative Assessment',
        topics_covered: '25-minute test paper followed by peer checking and immediate remediation on balancing errors.',
        duration_minutes: 45,
        prerequisites: 'Revision of mandatory notebook notes.',
        pedagogy_focus: 'Formative evaluation and individual error analysis.'
      }
    ]
  },
  teaching_guide: {
    topics: [
      {
        topic_name: 'Balancing Chemical Equations by Hit & Trial',
        what_to_teach: 'Subscripts cannot be changed; only stoichiometric coefficients can be placed before compounds. Mass of each element must remain invariant.',
        how_to_explain: 'Draw a seesaw balance on the board. Put reactants on the left pan and products on the right pan. First balance metals, then non-metals, then hydrogen, and save oxygen for the final check.',
        intuitive_analogy: 'Baking a sandwich: If 2 slices of bread + 1 cheese slice = 1 sandwich, you cannot alter the recipe to have 3 slices without changing the whole batch coefficient.',
        real_world_examples: ['Burning of cooking gas (methane + oxygen -> carbon dioxide + water)', 'Respiration in humans (glucose oxidation)'],
        common_mistakes_and_fixes: [
          {
            mistake: 'Students write H2 + O2 -> H2O2 instead of 2H2 + O2 -> 2H2O to balance oxygen.',
            correction: 'Emphasize that changing subscripts creates a totally different chemical! (H2O is drinkable water; H2O2 is toxic hydrogen peroxide).'
          },
          {
            mistake: 'Multiplying coefficients only to the first element instead of the whole molecule.',
            correction: 'Use parentheses visually on blackboard: 2(Fe2O3) means 4 Iron and 6 Oxygen.'
          }
        ],
        teacher_delivery_tips: 'Always make students construct a 3-column table (Element | LHS Count | RHS Count) before attempting balancing.'
      },
      {
        topic_name: 'Thermal Decomposition of Lead Nitrate [Pb(NO3)2]',
        what_to_teach: 'Observation of pungent brown gas (NO2 nitrogen dioxide) and yellow residue of Lead Oxide (PbO). Crackling sound during heating.',
        how_to_explain: 'Break down the name: "De-composition" means breaking down one big compound into smaller ones using heat (endothermic). Write the balanced equation on the board with color indicators.',
        intuitive_analogy: 'Popping popcorn: A single white kernel absorbs heat until it cracks and releases steam and leaves transformed corn.',
        real_world_examples: ['Decomposition of limestone (CaCO3) in industrial cement manufacturing kilns.'],
        common_mistakes_and_fixes: [
          {
            mistake: 'Confusing brown fumes of NO2 with oxygen gas.',
            correction: 'Brown fumes are always Nitrogen Dioxide; Oxygen is colorless and supports re-ignition of glowing splint.'
          }
        ],
        teacher_delivery_tips: 'This reaction is tested almost every 2 years in CBSE boards as an unknown compound "X" question.'
      }
    ]
  },
  mandatory_notes: {
    heading: 'Compulsory Classroom Notebook Notes — Board Standard',
    instructions_for_students: 'Every student must copy these exact definitions, balanced equations, and observation tables in their fair science notebook.',
    definitions: [
      {
        term: 'Chemical Reaction',
        exact_definition: 'A process in which one or more substances (reactants) transform into new substances (products) with entirely different chemical properties and identities.',
        importance: 'Board Standard Definition (1 Mark)'
      },
      {
        term: 'Exothermic Reaction',
        exact_definition: 'Reactions in which heat energy is released into the surroundings along with the formation of products (e.g., respiration, burning of natural gas).',
        importance: 'Frequently asked with examples (2 Marks)'
      },
      {
        term: 'Redox Reaction',
        exact_definition: 'A chemical reaction in which oxidation and reduction take place simultaneously; one reactant gets oxidized while the other gets reduced.',
        importance: 'Core High-Yield Concept (3 Marks)'
      }
    ],
    formulas_and_rules: [
      {
        title: 'Law of Conservation of Mass in Equations',
        formula: 'Total mass of reactants = Total mass of products',
        explanation: 'Number of atoms of each element remains identical on both sides of a balanced equation.'
      },
      {
        title: 'Slaking of Lime (Exothermic)',
        formula: 'CaO(s) + H2O(l) -> Ca(OH)2(aq) + Heat',
        explanation: 'Quick lime reacts vigorously with water to produce slaked lime (calcium hydroxide) releasing enormous heat.'
      },
      {
        title: 'White Washing Wall Reaction (Slow Carbonation)',
        formula: 'Ca(OH)2(aq) + CO2(g) -> CaCO3(s) + H2O(l)',
        explanation: 'Slaked lime reacts with atmospheric carbon dioxide over 2-3 days to form shiny white calcium carbonate layer.'
      }
    ],
    theorems_and_postulates: [
      {
        name: 'Electrolysis of Water (Volume Ratio Rule)',
        statement: 'On passing electric current through acidified water, water decomposes into hydrogen and oxygen gas in a 2:1 volume ratio.',
        key_proof_steps: 'Cathode collects Hydrogen gas (2 volumes); Anode collects Oxygen gas (1 volume) because chemical formula is H2O.'
      }
    ],
    important_diagrams: [
      {
        title: 'Electrolysis of Water Experimental Setup',
        description: 'Inverted test tubes over carbon electrodes connected to a 6V battery in an acidified plastic mug.',
        must_label_parts: ['Cathode (-)', 'Anode (+)', 'Hydrogen gas (larger volume)', 'Oxygen gas (smaller volume)', '6V Battery']
      },
      {
        title: 'Heating of Ferrous Sulphate Crystals in a Boiling Tube',
        description: 'Demonstrating wafting gas gently towards the nose and not pointing tube mouth at neighbor.',
        must_label_parts: ['Boiling tube', 'Burner', 'Ferrous sulphate crystals (green to brown)', 'Gases: SO2 + SO3 (smell of burning sulfur)']
      }
    ],
    high_yield_exam_points: [
      'Keywords to write: "Evolution of gas", "Precipitate formation", "Oxidizing agent", "Endothermic"',
      'Always specify physical state symbols in balanced equations: (s), (l), (g), (aq)',
      'Potato chips packets are flushed with unreactive Nitrogen gas to prevent oxidative rancidity',
      'Silver chloride turns grey in sunlight due to photolytic decomposition: 2AgCl -> 2Ag + Cl2'
    ]
  },
  classwork_homework: {
    classwork_practice: [
      {
        q_no: 1,
        question: 'Balance the following equation: Fe + H2O -> Fe3O4 + H2',
        marks: 2,
        solution_hints: 'First balance Fe (3 on right -> put 3 on left). Then Oxygen (4 on right -> 4H2O). Finally Hydrogen (4H2).'
      },
      {
        q_no: 2,
        question: 'Identify the substance oxidized and reduced in: CuO + H2 -> Cu + H2O',
        marks: 2,
        solution_hints: 'CuO loses oxygen -> reduced. H2 gains oxygen -> oxidized.'
      }
    ],
    homework_assignment: [
      {
        level: 'Basic',
        question: 'Why is respiration considered an exothermic reaction? Write the word and balanced chemical equation for it.',
        marks: 2,
        guided_clue: 'Think of glucose breakdown in presence of oxygen releasing cellular energy in form of ATP.'
      },
      {
        level: 'Standard',
        question: 'A shiny brown-colored element "X" on heating in air becomes black in color. Name the element "X" and the black colored compound formed. Write the balanced chemical reaction.',
        marks: 3,
        guided_clue: 'Element X is Copper (Cu); black compound is Copper(II) Oxide (CuO).'
      },
      {
        level: 'Brain-Teaser (HOTS)',
        question: 'A solution of substance "X" is used for white-washing. (i) Name substance X and write its formula. (ii) Write the reaction of substance X with water. (iii) Why does a wall become shiny white 2 days after white-washing?',
        marks: 5,
        guided_clue: 'Relate quicklime (CaO), slaked lime [Ca(OH)2], and atmospheric carbon dioxide forming CaCO3.'
      }
    ],
    estimated_homework_time_mins: 35
  },
  pyq_legacy_analysis: {
    board_name: 'CBSE Class 10 Board Examinations',
    overall_chapter_weightage: '6 to 8 Marks (Guaranteed Question Every Year)',
    topic_priority_breakdown: [
      {
        topic: 'Identification of Unknown Compounds (X, Y, Z Type Questions)',
        priority: 'High Yield (🔴)',
        frequency_tags: ['Asked in 2024 (Set 1 & 3)', 'Asked in 2023', 'Asked in 2020', 'Sample Paper 2024'],
        recurring_question_types: 'A compound X is heated... produces gas Y with rotten egg smell or brown fumes...',
        marks_trend: 'Consistently asked as 3-mark or 4-mark Case-Based Question.',
        examiner_favorite_traps: 'Students forget to mention the color of the precipitate or write incorrect chemical formula for lead nitrate.'
      },
      {
        topic: 'Decomposition Reactions (Thermal & Photolytic)',
        priority: 'High Yield (🔴)',
        frequency_tags: ['Asked in 2023', 'Asked in 2022', 'Asked in 2019'],
        recurring_question_types: 'Differentiate between thermal and photolytic decomposition with balanced equations.',
        marks_trend: 'Asked as 2-mark or 3-mark direct question.',
        examiner_favorite_traps: 'Students omit (s) or (g) state symbols when state symbols are explicitly demanded.'
      },
      {
        topic: 'Corrosion vs Rancidity',
        priority: 'Medium Yield (🟡)',
        frequency_tags: ['Asked in 2020', 'Asked in 2018'],
        recurring_question_types: 'Short definition + 2 methods of prevention.',
        marks_trend: '1-mark or 2-mark short questions.',
        examiner_favorite_traps: 'Confusing galvanization (zinc coating) with electroplating of tin.'
      }
    ]
  },
  quick_assessment: {
    topic_checks: [
      {
        question_number: 1,
        topic: 'Chemical Reaction Indicators',
        question: 'Which of the following is NOT a characteristic of a chemical change?',
        type: 'mcq',
        options: ['Change in color', 'Evolution of gas', 'Change in total mass of system', 'Change in temperature'],
        answer: 'Change in total mass of system (Mass is strictly conserved by Law of Conservation of Mass)',
        gap_identified_if_wrong: 'Student has not understood that mass can neither be created nor destroyed in a chemical reaction.'
      },
      {
        question_number: 2,
        topic: 'Thermal Decomposition',
        question: 'When lead nitrate crystals are heated in a dry boiling tube, the brown fumes evolved are of:',
        type: 'mcq',
        options: ['Lead oxide', 'Nitrogen dioxide (NO2)', 'Nitrous oxide', 'Oxygen gas'],
        answer: 'Nitrogen dioxide (NO2)',
        gap_identified_if_wrong: 'Student has memorized the reaction without associating the color brown with NO2 gas.'
      },
      {
        question_number: 3,
        topic: 'Redox Concepts',
        question: 'In the reaction: MnO2 + 4HCl -> MnCl2 + 2H2O + Cl2, the substance reduced is ______.',
        type: 'fill_blank',
        answer: 'MnO2 (Manganese dioxide loses oxygen, so it undergoes reduction)',
        gap_identified_if_wrong: 'Student is confusing the substance being reduced with the oxidizing agent.'
      }
    ],
    remedial_suggestions: [
      'If students fail Q1: Re-emphasize Antoine Lavoisier Law of Conservation of Mass on blackboard.',
      'If students fail Q2: Demonstrate or show a color slide of nitrogen dioxide brown fumes.',
      'If students fail Q3: Have students draw arrows explicitly showing who lost oxygen and who gained hydrogen.'
    ]
  },
  revision_test_plan: {
    revision_schedule: [
      {
        phase: 'Immediate Day+2 Recall',
        timing: '2 days after chapter completion',
        strategy: '10-minute speed-drill: Have students balance 3 equations on paper without looking at notebook.'
      },
      {
        phase: 'Mid-Term Weekend Deep Dive',
        timing: '7 days post completion',
        strategy: 'Solve 5 previous board examination questions (X, Y, Z unknown compound type).'
      },
      {
        phase: 'Pre-Exam 48-Hour Rapid Polish',
        timing: '2 days before unit test / terminal exam',
        strategy: 'Review the rapid cheat sheet below and verbally quiz color changes of precipitates.'
      }
    ],
    top_10_must_solve_questions: [
      {
        q_no: 1,
        question: 'Why do we store silver chloride in dark-colored bottles? Write the balanced chemical equation.',
        marks: 2,
        why_important: 'Tests photolytic decomposition and practical storage logic (Asked in 2023).'
      },
      {
        q_no: 2,
        question: 'A copper coin is kept in silver nitrate solution for a few hours. What changes do you observe in the solution and on the coin?',
        marks: 3,
        why_important: 'Tests reactivity series and displacement reaction visualization.'
      },
      {
        q_no: 3,
        question: 'Define redox reaction. In the reaction ZnO + C -> Zn + CO, identify: (a) Oxidized substance, (b) Reduced substance, (c) Oxidizing agent, (d) Reducing agent.',
        marks: 4,
        why_important: 'Mastery question covering complete mechanics of oxidation and reduction.'
      }
    ],
    chapter_test_blueprint: {
      test_title: 'Chapter Mastery Test: Chemical Reactions & Equations',
      total_marks: 25,
      time_minutes: 45,
      sections_overview: 'Section A: 5 MCQs (5M), Section B: 3 Short Qs (6M), Section C: 3 Long Qs (9M), Section D: 1 Case-Based Question on Lime Water (5M)'
    },
    rapid_cheat_sheet_bullets: [
      'Oxidation = Gain of O2 OR Loss of H2 | Reduction = Gain of H2 OR Loss of O2',
      'Precipitate of Barium Sulphate (BaSO4) is insoluble white solid',
      'FeSO4 crystals (green) -> Fe2O3 (reddish-brown) + SO2(g) + SO3(g)',
      'Rancidity prevention: Nitrogen gas flushing, vacuum packing, airtight containers, BHA/BHT'
    ]
  }
};

export default function LessonSuitePage() {
  const [suiteData, setSuiteData] = useState<LessonSuiteData>(SAMPLE_LESSON_SUITE);
  const [mainTab, setMainTab] = useState<'scan' | 'generate' | 'view'>('scan');
  const [activeModuleTab, setActiveModuleTab] = useState<string>('plan');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Authentication Token
  const [token, setToken] = useState('');

  // Dropdown states for Classes, Subjects, and Chapters
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>([]);
  const [chaptersList, setChaptersList] = useState<ChapterItem[]>([]);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');

  // Custom / fallback names
  const [className, setClassName] = useState('Class 10');
  const [subjectName, setSubjectName] = useState('Science');
  const [chapterTitle, setChapterTitle] = useState('Chemical Reactions and Equations');
  const [isCustomChapter, setIsCustomChapter] = useState(false);

  const [board, setBoard] = useState('CBSE');
  const [language, setLanguage] = useState('English');
  const [customInstructions, setCustomInstructions] = useState('');

  // Scanning & OCR state for the chapter
  const [chapterScans, setChapterScans] = useState<ScannedDocItem[]>([]);
  const [isLoadingScans, setIsLoadingScans] = useState(false);
  const [useScannedTextbook, setUseScannedTextbook] = useState(true);

  // File & Camera upload state for inline scanning
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingScan, setIsUploadingScan] = useState(false);
  const [selectedScanForPreview, setSelectedScanForPreview] = useState<ScannedDocItem | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  const currentPreviewIndex = selectedScanForPreview
    ? chapterScans.findIndex((s) => s.id === selectedScanForPreview.id)
    : -1;

  const handlePrevPreviewScan = () => {
    if (currentPreviewIndex > 0) {
      setSelectedScanForPreview(chapterScans[currentPreviewIndex - 1]);
      setPreviewZoom(100);
    }
  };

  const handleNextPreviewScan = () => {
    if (currentPreviewIndex >= 0 && currentPreviewIndex < chapterScans.length - 1) {
      setSelectedScanForPreview(chapterScans[currentPreviewIndex + 1]);
      setPreviewZoom(100);
    }
  };

  const handleCopyOCRText = (text: string) => {
    if (!text) {
      toast.info('No OCR text available to copy');
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success('Verbatim OCR text copied to clipboard!');
  };

  const handleDownloadOCRText = (text: string, pageNum: number) => {
    if (!text) {
      toast.info('No OCR text available to download');
      return;
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chapterTitle || 'Chapter'}_Page_${pageNum}_OCR.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded OCR text for Page ${pageNum}`);
  };

  const handleDeleteScan = async (scanId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/scans/${scanId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Scanned page deleted from syllabus');
        setChapterScans((prev) => prev.filter((s) => s.id !== scanId));
        if (selectedScanForPreview?.id === scanId) {
          setSelectedScanForPreview(null);
        }
      } else {
        toast.error('Failed to delete scan');
      }
    } catch (e) {
      toast.error('Error deleting scan');
    }
  };

  useEffect(() => {
    const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
    const tokenStr = tokenMatch ? tokenMatch[2] : '';
    if (tokenStr) {
      setToken(tokenStr);
      loadClasses(tokenStr);
    }

    // Try to load any previously saved lesson plan from localStorage
    try {
      const saved = localStorage.getItem('active_teacher_lesson_suite');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.metadata && parsed.teaching_plan) {
          setSuiteData(parsed);
          setClassName(parsed.metadata.className || 'Class 10');
          setSubjectName(parsed.metadata.subjectName || 'Science');
          setChapterTitle(parsed.metadata.chapterTitle || 'Chemical Reactions and Equations');
          setActiveModuleTab('plan');
        }
      }
    } catch (e) {
      console.error('Error loading saved lesson plan', e);
    }
  }, []);

  // Fetch classes from backend
  async function loadClasses(authToken: string) {
    try {
      const res = await fetch(`${API_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        setClassesList(data.data);
        const firstClass = data.data[0];
        setSelectedClassId(firstClass.id);
        setClassName(firstClass.name);
        loadSubjects(firstClass.id, authToken);
      }
    } catch (e) {
      console.error('Error fetching classes:', e);
    }
  }

  // Fetch subjects for chosen class
  async function loadSubjects(classId: string, authToken = token) {
    try {
      const res = await fetch(`${API_URL}/api/subjects?class_id=${classId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setSubjectsList(data.data);
        if (data.data.length > 0) {
          const firstSub = data.data[0];
          setSelectedSubjectId(firstSub.id);
          setSubjectName(firstSub.name);
          loadChapters(firstSub.id, authToken);
        } else {
          setSelectedSubjectId('');
          setChaptersList([]);
          setSelectedChapterId('');
        }
      }
    } catch (e) {
      console.error('Error fetching subjects:', e);
    }
  }

  // Fetch chapters for chosen subject
  async function loadChapters(subjectId: string, authToken = token) {
    try {
      const res = await fetch(`${API_URL}/api/chapters?subject_id=${subjectId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setChaptersList(data.data);
        if (data.data.length > 0) {
          const firstChap = data.data[0];
          setSelectedChapterId(firstChap.id);
          setChapterTitle(firstChap.title);
          loadChapterScans(firstChap.id, authToken);
        } else {
          setSelectedChapterId('');
          setChapterScans([]);
        }
      }
    } catch (e) {
      console.error('Error fetching chapters:', e);
    }
  }

  // Fetch scanned textbook pages for selected chapter
  async function loadChapterScans(chapterId: string, authToken = token) {
    if (!chapterId) {
      setChapterScans([]);
      return;
    }
    setIsLoadingScans(true);
    try {
      const res = await fetch(`${API_URL}/api/scans?chapter_id=${chapterId}&doc_type=chapter_page`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setChapterScans(data.data);
      } else {
        setChapterScans([]);
      }
    } catch (e) {
      console.error('Error fetching scans:', e);
    } finally {
      setIsLoadingScans(false);
    }
  }

  // Handle Class Change
  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    const cls = classesList.find((c) => c.id === newClassId);
    if (cls) setClassName(cls.name);
    loadSubjects(newClassId);
  };

  // Handle Subject Change
  const handleSubjectChange = (newSubId: string) => {
    setSelectedSubjectId(newSubId);
    const sub = subjectsList.find((s) => s.id === newSubId);
    if (sub) setSubjectName(sub.name);
    loadChapters(newSubId);
  };

  // Handle Chapter Change
  const handleChapterChange = (newChapId: string) => {
    if (newChapId === '__custom__') {
      setIsCustomChapter(true);
      setSelectedChapterId('');
      setChapterScans([]);
      return;
    }
    setIsCustomChapter(false);
    setSelectedChapterId(newChapId);
    const chap = chaptersList.find((c) => c.id === newChapId);
    if (chap) {
      setChapterTitle(chap.title);
      loadChapterScans(newChapId);
    }
  };

  // Direct Inline Scan Upload & OCR
  const handleScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Class, Subject, and Chapter are strictly mandatory for scanning
    if (!selectedClassId && !className.trim()) {
      toast.error('Class selection is MANDATORY before scanning. Please select a Class.');
      return;
    }
    if (!selectedSubjectId && !subjectName.trim()) {
      toast.error('Subject selection is MANDATORY before scanning. Please select a Subject.');
      return;
    }
    if (!selectedChapterId && !chapterTitle.trim()) {
      toast.error('Chapter selection is MANDATORY before scanning. Please select a Chapter.');
      return;
    }

    setIsUploadingScan(true);
    toast.info(`Uploading and running AI OCR on textbook page: ${file.name}...`);

    try {
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // 1. Create scan entry
      const createRes = await fetch(`${API_URL}/api/scans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image_url: base64Data,
          doc_type: 'chapter_page',
          class_id: selectedClassId || undefined,
          subject_id: selectedSubjectId || undefined,
          chapter_id: selectedChapterId,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Failed to upload scan');

      const scanId = createData.data?.id;

      // 2. Run OCR processing
      if (scanId) {
        const ocrRes = await fetch(`${API_URL}/api/scans/${scanId}/ocr-process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const ocrData = await ocrRes.json();
        if (ocrRes.ok && ocrData.data) {
          toast.success(`Syllabus page scanned & saved to chapter! (Click 'Generate' below whenever ready)`);
          loadChapterScans(selectedChapterId);
        } else {
          toast.success('Syllabus page saved. Refreshing scans...');
          loadChapterScans(selectedChapterId);
        }
      }
    } catch (err: any) {
      console.error('Scan Upload Error:', err);
      toast.error(err.message || 'Failed to upload and scan textbook page');
    } finally {
      setIsUploadingScan(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    const finalClass = className.trim();
    const finalSubject = subjectName.trim();
    const finalChapter = chapterTitle.trim();

    if (!finalClass || !finalSubject || !finalChapter) {
      toast.error('Please select or enter Class, Subject, and Chapter name');
      return;
    }

    setIsGenerating(true);
    const scanCount = useScannedTextbook ? chapterScans.length : 0;
    toast.info(
      `Generating complete 7-Core Teacher Lesson Suite for "${finalChapter}"${
        scanCount > 0 ? ` (Grounded in ${scanCount} scanned textbook pages)` : ''
      }...`
    );

    try {
      const res = await fetch(`${API_URL}/api/notes/generate-lesson-suite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          class_id: selectedClassId || undefined,
          subject_id: selectedSubjectId || undefined,
          chapter_id: selectedChapterId || undefined,
          className: finalClass,
          subjectName: finalSubject,
          chapterTitle: finalChapter,
          board,
          language,
          customInstructions: customInstructions.trim() || undefined,
          scan_ids: useScannedTextbook && chapterScans.length > 0 ? chapterScans.map((s) => s.id) : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to generate lesson suite');
      }

      if (json.data && json.data.teaching_plan) {
        const fullData: LessonSuiteData = {
          ...json.data,
          metadata: {
            ...json.data.metadata,
            scansUsedCount: scanCount,
          },
        };
        setSuiteData(fullData);
        localStorage.setItem('active_teacher_lesson_suite', JSON.stringify(fullData));
        setMainTab('view'); // Automatically switch to View tab!
        setActiveModuleTab('plan');
        toast.success(
          `7-Core Teacher Lesson Suite ready for "${finalChapter}"!${
            scanCount > 0 ? ` (Grounded in ${scanCount} textbook scans)` : ''
          }`
        );
      } else {
        throw new Error('Invalid format returned by AI');
      }
    } catch (err: any) {
      console.error('Lesson Suite Error:', err);
      toast.error(err.message || 'Error occurred while contacting AI generator');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard! Ready to share with students.');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 select-none print:p-0">
      {/* Hidden file input for textbook scanning */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleScanUpload}
        accept="image/*,application/pdf"
        className="hidden"
      />
      {/* Hidden camera input for live physical textbook photo capture */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleScanUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Top Header & 2-Step View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-heading font-black text-foreground tracking-tight">
                  Teacher Lesson &amp; Academic Suite
                </h1>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold px-2 py-0.5">
                  7 Core Modules
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Complete classroom planning, teaching pedagogy, notebook notes, homework sets, board PYQs, diagnostic checks &amp; test blueprints.
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions: Print / PDF */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs font-semibold cursor-pointer h-9 shadow-2xs"
          >
            <Printer className="w-4 h-4 text-primary" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3 DISTINCT WORKFLOW TABS: 1. SETUP & SCAN | 2. GENERATE | 3. VIEW SUITE     */}
      {/* ========================================================================= */}
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as any)} className="w-full space-y-5">
        {/* Top-Level Master 3 Tabs */}
        <TabsList className="grid grid-cols-3 h-12 p-1 bg-muted/80 rounded-2xl border border-border shadow-2xs max-w-2xl mx-auto print:hidden">
          {/* Tab 1: Scan & Save */}
          <TabsTrigger
            value="scan"
            className="text-xs sm:text-sm font-bold flex items-center justify-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-xl cursor-pointer transition-all"
          >
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>1. Scan &amp; Save</span>
            {chapterScans.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold ml-1">
                {chapterScans.length}
              </Badge>
            )}
          </TabsTrigger>

          {/* Tab 2: Generate */}
          <TabsTrigger
            value="generate"
            className="text-xs sm:text-sm font-bold flex items-center justify-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-xl cursor-pointer transition-all"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span>2. Generate</span>
          </TabsTrigger>

          {/* Tab 3: View Notes Suite */}
          <TabsTrigger
            value="view"
            className="text-xs sm:text-sm font-bold flex items-center justify-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-xl cursor-pointer transition-all"
          >
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>3. View Notes</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* TAB 1: SCAN & SAVE (SCANNING & SAVING ONLY - STRICTLY SEPARATE)          */}
        {/* ========================================================================= */}
        <TabsContent value="scan" className="space-y-4 pt-1">
          <Card className="border-border shadow-sm animate-fade-in print:hidden">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    1. Scan &amp; Save Chapter Syllabus
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Select Class, Subject, and Chapter, then scan physical textbook pages. Everything is saved directly to your chapter's syllabus repository (Scanning &amp; Saving Only).
                  </CardDescription>
                </div>

                {chapterScans.length > 0 && (
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold px-2.5 py-1 self-start sm:self-auto">
                    ✓ {chapterScans.length} Scanned Pages Attached
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
              {/* ------------------------------------------------------------------- */}
              {/* STEP 1: MANDATORY CURRICULUM SELECTION (Class, Subject, Chapter)    */}
              {/* ------------------------------------------------------------------- */}
              <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-primary" />
                      Step 1: Choose Class, Subject &amp; Chapter (Mandatory)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Select which curriculum chapter these scanned textbook pages belong to.
                    </p>
                  </div>

                  {/* Mandatory status pill */}
                  <div className="flex items-center gap-1.5">
                    {className.trim() && subjectName.trim() && (selectedChapterId || chapterTitle.trim()) ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold px-2.5 py-1">
                        ✓ All 3 Mandatory Fields Selected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs font-bold px-2.5 py-1">
                        ⚠ Selection Required
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* 1. Class Dropdown */}
                  <div>
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-primary" /> Class / Grade *
                    </Label>
                    {classesList.length > 0 ? (
                      <select
                        value={selectedClassId}
                        onChange={(e) => handleClassChange(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                      >
                        {classesList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        placeholder="e.g. Class 10"
                        className="h-10 text-xs font-medium rounded-xl"
                      />
                    )}
                  </div>

                  {/* 2. Subject Dropdown */}
                  <div>
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-primary" /> Subject *
                    </Label>
                    {subjectsList.length > 0 ? (
                      <select
                        value={selectedSubjectId}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                      >
                        {subjectsList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                        placeholder="e.g. Science"
                        className="h-10 text-xs font-medium rounded-xl"
                      />
                    )}
                  </div>

                  {/* 3. Chapter Dropdown */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-primary" /> Chapter / Unit *
                      </Label>
                      {chaptersList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsCustomChapter(!isCustomChapter)}
                          className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          {isCustomChapter ? 'Select from list' : '+ Custom title'}
                        </button>
                      )}
                    </div>

                    {!isCustomChapter && chaptersList.length > 0 ? (
                      <select
                        value={selectedChapterId}
                        onChange={(e) => handleChapterChange(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer truncate"
                      >
                        {chaptersList.map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            {ch.title}
                          </option>
                        ))}
                        <option value="__custom__">+ Enter Custom Chapter Name...</option>
                      </select>
                    ) : (
                      <Input
                        value={chapterTitle}
                        onChange={(e) => setChapterTitle(e.target.value)}
                        placeholder="e.g. Chemical Reactions and Equations"
                        className="h-10 text-xs font-semibold rounded-xl"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------------- */}
              {/* STEP 2: COMPLETE CHAPTER TEXTBOOK & SYLLABUS SCANNER                */}
              {/* ------------------------------------------------------------------- */}
              <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Camera className="w-4 h-4 text-emerald-600" />
                        Step 2: Scan &amp; Save Complete Physical Textbook Pages
                      </h3>
                      <Badge variant="secondary" className="text-[10px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20 font-bold">
                        Isolated from Question Papers
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Target Mapping: <strong className="text-foreground">{className || 'No Class'} &gt; {subjectName || 'No Subject'} &gt; {chapterTitle || 'No Chapter'}</strong>
                    </p>
                  </div>

                  {/* Upload & Camera Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingScan || !className.trim() || !subjectName.trim() || (!selectedChapterId && !chapterTitle.trim())}
                      onClick={() => {
                        if (!className.trim() || !subjectName.trim() || (!selectedChapterId && !chapterTitle.trim())) {
                          toast.error('Mandatory Requirement: Please select Class, Subject, and Chapter first!');
                          return;
                        }
                        cameraInputRef.current?.click();
                      }}
                      className="h-9 px-3.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Camera className="w-3.5 h-3.5 mr-1.5" />
                      Take Photo with Camera
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingScan || !className.trim() || !subjectName.trim() || (!selectedChapterId && !chapterTitle.trim())}
                      onClick={() => {
                        if (!className.trim() || !subjectName.trim() || (!selectedChapterId && !chapterTitle.trim())) {
                          toast.error('Mandatory Requirement: Please select Class, Subject, and Chapter first!');
                          return;
                        }
                        fileInputRef.current?.click();
                      }}
                      className="h-9 px-3.5 text-xs font-bold text-primary border-primary/30 hover:bg-primary/5 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploadingScan ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {isUploadingScan ? 'Extracting Verbatim OCR...' : '+ Upload Textbook Images'}
                    </Button>
                  </div>
                </div>

                {/* Clarification banner: Scanning does NOT auto-generate */}
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
                  <Lightbulb className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Isolated Syllabus Storage:</strong> Scans uploaded here are saved strictly as <strong>Chapter Syllabus Notes</strong> (completely separated from Question Paper scans).
                    <br />
                    <span className="text-muted-foreground">Uploading a scan does <u>not</u> generate the plan automatically. You can scan and save multiple pages here. When you are ready, click <strong>"Proceed to Generate Plan"</strong> below.</span>
                  </div>
                </div>

                {/* Warning banner if any mandatory field is missing */}
                {(!className.trim() || !subjectName.trim() || (!selectedChapterId && !chapterTitle.trim())) && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Mandatory Requirement:</strong> Class, Subject, and Chapter must be selected in Step 1 above before uploading or scanning textbook pages.
                    </span>
                  </div>
                )}

                {/* Scanned Pages Gallery Grid */}
                {chapterScans.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                        Scanned Textbook Pages ({chapterScans.length} Saved to Chapter)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                      {chapterScans.map((scan, idx) => (
                        <div
                          key={scan.id}
                          className="p-3.5 rounded-2xl border border-border bg-card space-y-2.5 shadow-2xs hover:border-primary/50 hover:shadow-xs transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            {/* Card Header: Page Num, OCR Status, Delete Button */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-foreground flex items-center gap-1">
                                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                                  Page {idx + 1}
                                </span>
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                                  OCR Ready ✓
                                </Badge>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteScan(scan.id)}
                                title="Delete this page"
                                className="p-1 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Clickable Thumbnail with Hover Overlay */}
                            <div
                              onClick={() => {
                                setSelectedScanForPreview(scan);
                                setPreviewZoom(100);
                              }}
                              className="w-full h-32 rounded-xl overflow-hidden border border-border bg-muted/40 relative cursor-pointer group/thumb"
                              title="Click to view high-resolution document and full OCR"
                            >
                              {scan.image_url ? (
                                <img
                                  src={scan.image_url}
                                  alt={`Page ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-200"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                  Scanned Page {idx + 1}
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-bold backdrop-blur-[1px]">
                                <Eye className="w-4 h-4" /> View Document
                              </div>
                            </div>

                            {/* AI Page Summary & Key Topics Preview */}
                            {scan.raw_ocr_json?.summary ? (
                              <div className="p-2 rounded-lg bg-primary/5 border border-primary/10 space-y-1">
                                <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> Page Summary:
                                </span>
                                <p className="text-[11px] text-foreground/80 line-clamp-2 leading-relaxed">
                                  {scan.raw_ocr_json.summary}
                                </p>
                              </div>
                            ) : scan.raw_ocr_text ? (
                              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                {scan.raw_ocr_text.slice(0, 110)}...
                              </p>
                            ) : null}

                            {/* Key concept chips */}
                            {scan.raw_ocr_json?.key_topics && scan.raw_ocr_json.key_topics.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {scan.raw_ocr_json.key_topics.slice(0, 2).map((topic, tIdx) => (
                                  <Badge key={tIdx} variant="secondary" className="text-[9px] px-1.5 py-0 bg-muted text-muted-foreground truncate max-w-[130px]">
                                    {topic}
                                  </Badge>
                                ))}
                                {scan.raw_ocr_json.key_topics.length > 2 && (
                                  <span className="text-[9px] text-muted-foreground self-center">
                                    +{scan.raw_ocr_json.key_topics.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Dedicated Document & OCR Viewer Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedScanForPreview(scan);
                              setPreviewZoom(100);
                            }}
                            className="w-full h-8 text-xs font-bold text-primary border-primary/30 hover:bg-primary/5 cursor-pointer gap-1.5 mt-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Document &amp; OCR
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      if (!className.trim() || !subjectName.trim() || (!selectedChapterId && !chapterTitle.trim())) {
                        toast.error('Mandatory Requirement: Please select Class, Subject, and Chapter in Step 1 first!');
                        return;
                      }
                      fileInputRef.current?.click();
                    }}
                    className="p-8 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-2">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      Click to Scan or Upload Complete Chapter Pages
                    </span>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md">
                      Take photos of textbook pages or upload images. The AI will extract verbatim text and save everything to this chapter's syllabus. No plan is generated until you request it.
                    </p>
                  </div>
                )}
              </div>

              {/* Tab 1 Status Bar: Confirmation that pages are saved to the chapter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-foreground">
                      {chapterScans.length > 0 ? `${chapterScans.length} Pages Saved to ${chapterTitle || 'Chapter'}` : 'Syllabus Scanner Ready'}
                    </h4>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      {chapterScans.length > 0
                        ? 'All OCR transcriptions have been saved to your chapter repository. Everything is stored and ready.'
                        : 'Select your Class, Subject, and Chapter, then scan or upload textbook pages.'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border-none text-xs">
                    Auto-Saved to DB ✓
                  </Badge>
                </div>
              </div>
            </CardContent>
        </Card>
      </TabsContent>

      {/* ========================================================================= */}
      {/* TAB 2: GENERATE (STANDALONE CURRICULUM SELECTION & LESSON GENERATION)    */}
      {/* ========================================================================= */}
      <TabsContent value="generate" className="space-y-4 pt-1">
        <Card className="border-border shadow-sm animate-fade-in print:hidden">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  2. Generate 7-Core Teacher Lesson Suite
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Select Class, Subject &amp; Chapter, configure pedagogical preferences, and generate.
                </CardDescription>
              </div>

              {chapterScans.length > 0 && (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold px-2.5 py-1 self-start sm:self-auto">
                  ✓ {chapterScans.length} Scanned Pages Attached
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-4">
            {/* Step 1: Curriculum Target Selection directly in Generate Tab */}
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-primary" />
                    Target Curriculum Selection
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose the Class, Subject, and Chapter for which you want to generate the 7-Core Suite.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Class Dropdown */}
                <div>
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-primary" /> Class / Grade
                  </Label>
                  {classesList.length > 0 ? (
                    <select
                      value={selectedClassId}
                      onChange={(e) => handleClassChange(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                    >
                      {classesList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="e.g. Class 10"
                      className="h-10 text-xs font-medium rounded-xl"
                    />
                  )}
                </div>

                {/* 2. Subject Dropdown */}
                <div>
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-primary" /> Subject
                  </Label>
                  {subjectsList.length > 0 ? (
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                    >
                      {subjectsList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      placeholder="e.g. Science"
                      className="h-10 text-xs font-medium rounded-xl"
                    />
                  )}
                </div>

                {/* 3. Chapter Dropdown */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" /> Chapter / Unit
                    </Label>
                    {chaptersList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsCustomChapter(!isCustomChapter)}
                        className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        {isCustomChapter ? 'Select from list' : '+ Custom title'}
                      </button>
                    )}
                  </div>

                  {!isCustomChapter && chaptersList.length > 0 ? (
                    <select
                      value={selectedChapterId}
                      onChange={(e) => handleChapterChange(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer truncate"
                    >
                      {chaptersList.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.title}
                        </option>
                      ))}
                      <option value="__custom__">+ Enter Custom Chapter Name...</option>
                    </select>
                  ) : (
                    <Input
                      value={chapterTitle}
                      onChange={(e) => setChapterTitle(e.target.value)}
                      placeholder="e.g. Chemical Reactions and Equations"
                      className="h-10 text-xs font-semibold rounded-xl"
                    />
                  )}
                </div>
              </div>

              {/* Scans Grounding Status Card */}
              {chapterScans.length > 0 ? (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                    <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Found <strong>{chapterScans.length} scanned textbook pages</strong> saved in repository for <strong>"{chapterTitle}"</strong>.
                    </span>
                  </div>
                  <label className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={useScannedTextbook}
                      onChange={(e) => setUseScannedTextbook(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                    />
                    <span>Ground AI generation in these {chapterScans.length} scans</span>
                  </label>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    No physical scans attached for this chapter. AI will generate standard NCERT / Board-aligned curriculum content.
                  </span>
                </div>
              )}
            </div>

            {/* Curriculum Preferences: Board & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1.5 block">Board / Curriculum</Label>
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="CBSE">CBSE (NCERT Aligned)</option>
                  <option value="ICSE">ICSE / CISCE</option>
                  <option value="State Board">State Board</option>
                  <option value="Cambridge">Cambridge / IGCSE</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground mb-1.5 block">Teaching Medium / Language</Label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Hinglish">Hinglish (Recommended for Indian Classrooms)</option>
                  <option value="Hindi">Hindi (शुद्ध हिंदी)</option>
                </select>
              </div>
            </div>

            {/* Custom Instructions */}
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                Additional Teacher Preferences (Optional)
              </Label>
              <Input
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Focus on balancing equations, 6 periods max, include board exam traps"
                className="h-10 text-xs font-medium rounded-xl"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs border-t border-border/80">
              <span className="text-[11px] font-semibold text-muted-foreground mr-1">Quick Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setClassName('Class 10');
                  setSubjectName('Science');
                  setChapterTitle('Chemical Reactions and Equations');
                  setBoard('CBSE');
                  setIsCustomChapter(true);
                }}
                className="px-2.5 py-1 rounded-full bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary text-[11px] font-medium transition-colors cursor-pointer border border-border"
              >
                🧪 Class 10 Science: Chemical Reactions
              </button>
              <button
                type="button"
                onClick={() => {
                  setClassName('Class 10');
                  setSubjectName('Mathematics');
                  setChapterTitle('Quadratic Equations');
                  setBoard('CBSE');
                  setIsCustomChapter(true);
                }}
                className="px-2.5 py-1 rounded-full bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary text-[11px] font-medium transition-colors cursor-pointer border border-border"
              >
                📐 Class 10 Math: Quadratic Equations
              </button>
              <button
                type="button"
                onClick={() => {
                  setClassName('Class 9');
                  setSubjectName('Physics');
                  setChapterTitle('Motion and Laws of Motion');
                  setBoard('CBSE');
                  setIsCustomChapter(true);
                }}
                className="px-2.5 py-1 rounded-full bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary text-[11px] font-medium transition-colors cursor-pointer border border-border"
              >
                ⚡ Class 9 Physics: Laws of Motion
              </button>
            </div>

            {/* Main Generate Button */}
            <div className="pt-2">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full h-12 gradient-brand text-white font-bold text-sm shadow-md hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Comprehensive 7-Core Academic Suite with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate 7-Core Teacher Lesson Suite for "{chapterTitle}"
                    {useScannedTextbook && chapterScans.length > 0 && ` (${chapterScans.length} Scanned Pages Active)`}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ========================================================================= */}
      {/* TAB 3: VIEW 7-CORE LESSON SUITE (ALL 7 MODULE SUB-TABS)                    */}
      {/* ========================================================================= */}
      <TabsContent value="view" className="space-y-4 pt-1">
        {/* Chapter Context Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-card border border-border shadow-xs print:hidden animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
              {suiteData.metadata.className}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  {suiteData.metadata.chapterTitle}
                </h2>
                <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30">
                  {suiteData.metadata.subjectName}
                </Badge>
                {suiteData.metadata.scansUsedCount && suiteData.metadata.scansUsedCount > 0 && (
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                    Grounded in {suiteData.metadata.scansUsedCount} Scans ✓
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Target Curriculum: {suiteData.metadata.board} • {suiteData.teaching_plan.total_periods_recommended} Recommended Classroom Periods
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMainTab('scan')}
              className="h-8 text-xs font-semibold cursor-pointer gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              Scan More Pages
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMainTab('generate')}
              className="h-8 text-xs font-semibold cursor-pointer gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Re-Generate Plan
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs font-bold gradient-brand text-white shadow-xs cursor-pointer gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Executive Chapter Summary & Scanned Textbook Grounding Section */}
        {(suiteData.metadata.chapter_executive_summary || suiteData.metadata.source_grounding_analysis) && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 via-card to-emerald-500/5 border border-border shadow-xs space-y-4 print:p-2 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/80 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">
                    Chapter Executive Summary &amp; Scanned Grounding Analysis
                  </h3>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">
                    Curriculum Grounded
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  In-depth academic synthesis derived from physical textbook scans and curriculum standard guidelines.
                </p>
              </div>

              {suiteData.metadata.source_grounding_analysis?.grounding_faithfulness_score && (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold self-start md:self-auto px-3 py-1">
                  ✓ {suiteData.metadata.source_grounding_analysis.grounding_faithfulness_score} Faithfulness Score
                </Badge>
              )}
            </div>

            {/* Executive Summary Paragraphs */}
            {suiteData.metadata.chapter_executive_summary && (
              <div className="p-4 rounded-xl bg-card border border-border/80 text-xs sm:text-sm text-foreground/90 leading-relaxed space-y-2 whitespace-pre-line">
                {suiteData.metadata.chapter_executive_summary}
              </div>
            )}

            {/* Source Grounding Badges & Scanned Document Access */}
            {suiteData.metadata.source_grounding_analysis && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Sources Used with Direct Document View Button */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    Primary Textbook Sources Verified:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suiteData.metadata.source_grounding_analysis.sources_used?.map((source, sIdx) => {
                      const matchedScan = chapterScans[sIdx] || chapterScans[0];
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            if (matchedScan) {
                              setSelectedScanForPreview(matchedScan);
                              setPreviewZoom(100);
                            } else {
                              toast.info(`Source reference: ${source}`);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold text-xs border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Click to view original scanned document page"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{source}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Extracted Core Concepts */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Core Concepts Synthesized from Scans:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suiteData.metadata.source_grounding_analysis.scanned_concepts_extracted?.map((concept, cIdx) => (
                      <Badge key={cIdx} variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20 font-medium">
                        • {concept}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7-Core Module Sub-Tabs (Teaching Plan, Guide, Notes, CW+HW, PYQ, Quick Check, Revision) */}
        <Tabs value={activeModuleTab} onValueChange={setActiveModuleTab} className="w-full space-y-4">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto p-1.5 bg-muted/80 rounded-2xl gap-1 border border-border shadow-2xs print:hidden">
            <TabsTrigger
              value="plan"
              className="text-xs py-2 font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs flex items-center justify-center gap-1.5 cursor-pointer rounded-xl"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>1. Teaching Plan</span>
            </TabsTrigger>

            <TabsTrigger
              value="guide"
              className="text-xs py-2 font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs flex items-center justify-center gap-1.5 cursor-pointer rounded-xl"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>2. Teaching Guide</span>
            </TabsTrigger>

            <TabsTrigger
              value="notes"
              className="text-xs py-2 font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs flex items-center justify-center gap-1.5 cursor-pointer rounded-xl"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>3. Mandatory Notes</span>
            </TabsTrigger>

            <TabsTrigger
              value="practice"
              className="text-xs py-2 font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs flex items-center justify-center gap-1.5 cursor-pointer rounded-xl"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>4. CW + HW</span>
            </TabsTrigger>

            <TabsTrigger
              value="pyq"
              className="text-xs py-2 font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs flex items-center justify-center gap-1.5 cursor-pointer rounded-xl"
            >
              <History className="w-3.5 h-3.5" />
              <span>5. PYQ Analysis</span>
            </TabsTrigger>

            <TabsTrigger
              value="assessment"
              className="text-xs py-2 font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs flex items-center justify-center gap-1.5 cursor-pointer rounded-xl"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>6. Quick Check</span>
            </TabsTrigger>

            <TabsTrigger
              value="revision"
              className="text-xs py-2 font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs flex items-center justify-center gap-1.5 cursor-pointer rounded-xl"
            >
              <Award className="w-3.5 h-3.5" />
              <span>7. Revision &amp; Test</span>
            </TabsTrigger>
          </TabsList>

          {/* ========================================================================= */}
          {/* MODULE 1: 🗓️ Chapter Teaching Plan */}
          {/* ========================================================================= */}
          <TabsContent value="plan" className="space-y-4">
            <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Module 1: Chapter Teaching Plan &amp; Period Allocation
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Kab kya padhana hai • Kitne periods lagenge • Pedagogical topic sequence
                      </CardDescription>
                    </div>
                    <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-bold text-xs self-start sm:self-auto px-3 py-1">
                      {suiteData.teaching_plan.total_periods_recommended} Classroom Periods Total
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Sequence Rationale Banner */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 text-xs">
                    <span className="font-bold text-indigo-900 dark:text-indigo-300 block mb-1">
                      Pedagogical Progression Rationale:
                    </span>
                    <p className="text-indigo-800 dark:text-indigo-400 leading-relaxed">
                      {suiteData.teaching_plan.sequence_rationale}
                    </p>
                  </div>

                  {/* Period-by-Period Timeline */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5" /> Period-by-Period Delivery Breakdown
                    </h3>

                    <div className="grid grid-cols-1 gap-3">
                      {suiteData.teaching_plan.periods.map((p) => (
                        <div
                          key={p.period_number}
                          className="p-4 rounded-xl border border-border bg-card/60 hover:bg-card transition-colors flex flex-col md:flex-row md:items-start justify-between gap-3 shadow-2xs"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
                                P{p.period_number}
                              </span>
                              <span className="text-sm font-bold text-foreground">
                                {p.day_title}
                              </span>
                              <Badge variant="outline" className="text-[10px] py-0 px-2">
                                {p.duration_minutes} Mins
                              </Badge>
                            </div>

                            <p className="text-xs text-foreground/90 pl-9 leading-relaxed">
                              <strong>Topics:</strong> {p.topics_covered}
                            </p>

                            {p.prerequisites && (
                              <p className="text-[11px] text-muted-foreground pl-9">
                                <span className="font-semibold text-slate-600 dark:text-slate-400">Prerequisites:</span> {p.prerequisites}
                              </p>
                            )}
                          </div>

                          {p.pedagogy_focus && (
                            <div className="md:w-64 shrink-0 p-2.5 rounded-lg bg-muted/50 border border-border text-[11px] text-muted-foreground">
                              <span className="font-bold text-foreground block mb-0.5">Pedagogy Style:</span>
                              {p.pedagogy_focus}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ========================================================================= */}
            {/* MODULE 2: 📖 Topic-wise Teaching Guide */}
            {/* ========================================================================= */}
            <TabsContent value="guide" className="space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Module 2: Topic-wise Teaching Guide
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Kya padhana hai • Kaise samjhana hai • Real-world examples • Common student mistakes &amp; corrections
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {suiteData.teaching_guide.topics.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-2xs"
                    >
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold text-xs">
                            Topic {idx + 1}
                          </span>
                          <h3 className="text-base font-bold text-foreground">
                            {t.topic_name}
                          </h3>
                        </div>
                        {t.source_reference && (
                          <Badge variant="outline" className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-emerald-600" />
                            {t.source_reference}
                          </Badge>
                        )}
                      </div>

                      {/* What to teach & How to explain */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> What to Teach (Core Content)
                          </span>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {t.what_to_teach}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-1">
                          <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                            <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" /> How to Explain in Class
                          </span>
                          <p className="text-xs text-blue-800 dark:text-blue-400 leading-relaxed">
                            {t.how_to_explain}
                          </p>
                        </div>
                      </div>

                      {/* Intuitive Analogy */}
                      {t.intuitive_analogy && (
                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div className="text-xs text-amber-900 dark:text-amber-300">
                            <strong className="block font-bold">Memorable Everyday Analogy:</strong>
                            <span>{t.intuitive_analogy}</span>
                          </div>
                        </div>
                      )}

                      {/* Real world examples */}
                      {t.real_world_examples && t.real_world_examples.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Real-World Application Examples
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {t.real_world_examples.map((ex, exIdx) => (
                              <span
                                key={exIdx}
                                className="px-3 py-1 rounded-lg bg-muted text-xs text-foreground font-medium border border-border"
                              >
                                • {ex}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Common Student Mistakes vs Teacher Correction */}
                      {t.common_mistakes_and_fixes && t.common_mistakes_and_fixes.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border/80">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Common Student Mistakes &amp; How to Correct Them
                          </span>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {t.common_mistakes_and_fixes.map((m, mIdx) => (
                              <div
                                key={mIdx}
                                className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-xs space-y-1.5"
                              >
                                <div className="flex items-start gap-1.5 text-rose-800 dark:text-rose-300 font-semibold">
                                  <span className="text-rose-600 font-bold shrink-0">❌ Mistake:</span>
                                  <span>{m.mistake}</span>
                                </div>
                                <div className="flex items-start gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold pt-1 border-t border-rose-200/60 dark:border-rose-900/30">
                                  <span className="text-emerald-600 font-bold shrink-0">✓ Teacher Fix:</span>
                                  <span>{m.correction}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pro delivery tip */}
                      {t.teacher_delivery_tips && (
                        <div className="p-2.5 rounded-lg bg-muted/60 text-[11px] text-muted-foreground italic flex items-center gap-2">
                          <span className="font-bold text-foreground not-italic shrink-0">💡 Blackboard Tip:</span>
                          <span>{t.teacher_delivery_tips}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ========================================================================= */}
            {/* MODULE 3: ✍️ Mandatory Notes (Notebook Compulsory) */}
            {/* ========================================================================= */}
            <TabsContent value="notes" className="space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        Module 3: Mandatory Classroom Notes (Compulsory Notebook Record)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Kya notebook me compulsory likhwana hai • Definitions • Formulas/Rules • Theorems • Diagrams • Exam points
                      </CardDescription>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const text = `COMPULSORY NOTEBOOK NOTES: ${suiteData.metadata.chapterTitle}\n\nDEFINITIONS:\n${suiteData.mandatory_notes.definitions.map(d => `• ${d.term}: ${d.exact_definition}`).join('\n')}\n\nFORMULAS & LAWS:\n${suiteData.mandatory_notes.formulas_and_rules.map(f => `• ${f.title}: ${f.formula} (${f.explanation})`).join('\n')}\n\nHIGH-YIELD EXAM POINTS:\n${suiteData.mandatory_notes.high_yield_exam_points.map(p => `• ${p}`).join('\n')}`;
                        copyToClipboard(text, 'notes');
                      }}
                      className="gap-1.5 text-xs font-semibold self-start sm:self-auto cursor-pointer"
                    >
                      {copiedKey === 'notes' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy All Notes
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Mandatory Banner */}
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <strong className="block font-bold">{suiteData.mandatory_notes.heading}</strong>
                      <span>{suiteData.mandatory_notes.instructions_for_students}</span>
                    </div>
                  </div>

                  {/* 1. Definitions */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <BookMarked className="w-3.5 h-3.5 text-emerald-500" /> 1. Exact Board-Approved Definitions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {suiteData.mandatory_notes.definitions.map((def, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-border bg-card space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-foreground">{def.term}</span>
                            <div className="flex items-center gap-1.5">
                              {def.source_citation && (
                                <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                  {def.source_citation}
                                </span>
                              )}
                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                {def.importance}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-primary pl-2.5">
                            "{def.exact_definition}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Formulas and Rules */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-blue-500" /> 2. Core Formulas, Laws &amp; Balanced Equations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {suiteData.mandatory_notes.formulas_and_rules.map((f, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-2xs">
                          <span className="font-bold text-xs text-foreground block">{f.title}</span>
                          <div className="p-2.5 rounded-lg bg-muted font-mono text-xs font-bold text-foreground">
                            {f.formula}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {f.explanation}
                          </p>
                          {f.derivation_steps && (
                            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 space-y-1">
                              <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                                <ListOrdered className="w-3 h-3" /> Step-by-Step Derivation &amp; Mechanics:
                              </span>
                              {Array.isArray(f.derivation_steps) ? (
                                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-foreground/85">
                                  {f.derivation_steps.map((step, sIdx) => (
                                    <li key={sIdx}>{step}</li>
                                  ))}
                                </ol>
                              ) : (
                                <p className="text-[11px] text-foreground/85 whitespace-pre-line leading-relaxed">
                                  {f.derivation_steps}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Important Diagrams */}
                  {suiteData.mandatory_notes.important_diagrams && suiteData.mandatory_notes.important_diagrams.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-500" /> 3. Compulsory Diagrams &amp; Label Checklist
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {suiteData.mandatory_notes.important_diagrams.map((diag, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-border bg-card space-y-2">
                            <span className="font-bold text-xs text-foreground block">🎨 {diag.title}</span>
                            <p className="text-xs text-muted-foreground">{diag.description}</p>
                            <div className="pt-1.5 border-t border-border">
                              <span className="text-[11px] font-semibold text-foreground block mb-1">
                                Mandatory Labels (Zero marks lost if all labeled):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {diag.must_label_parts.map((l, lIdx) => (
                                  <Badge key={lIdx} variant="outline" className="text-[10px] bg-muted/60">
                                    ✓ {l}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. High-Yield Exam Points */}
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-600" /> High-Yield Exam Points &amp; Answer Keywords
                    </span>
                    <ul className="space-y-1.5 text-xs text-foreground/90">
                      {suiteData.mandatory_notes.high_yield_exam_points.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2">
                          <span className="text-primary font-bold">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ========================================================================= */}
            {/* MODULE 4: 📝 Classwork + Homework */}
            {/* ========================================================================= */}
            <TabsContent value="practice" className="space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Module 4: Classwork &amp; Tiered Homework Assignments
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Topic ke baad classroom practice • Automatically generated tiered homework (Basic, Standard, HOTS)
                      </CardDescription>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const text = `HOMEWORK ASSIGNMENT: ${suiteData.metadata.chapterTitle}\nEstimated Time: ${suiteData.classwork_homework.estimated_homework_time_mins} Mins\n\n${suiteData.classwork_homework.homework_assignment.map((h, i) => `Q${i+1} [${h.level}] (${h.marks} Marks):\n${h.question}\n(Hint: ${h.guided_clue})\n`).join('\n')}`;
                        copyToClipboard(text, 'hw');
                      }}
                      className="gap-1.5 text-xs font-semibold self-start sm:self-auto cursor-pointer"
                    >
                      {copiedKey === 'hw' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Homework
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* 1. Classwork Practice */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" /> In-Class Guided Practice (Immediate Reinforcement)
                      </h3>
                      <Badge variant="outline" className="text-[10px] text-purple-700 bg-purple-50 border-purple-200">
                        Solve in Class
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {suiteData.classwork_homework.classwork_practice.map((cw, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-border bg-card space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-foreground">Classwork Q{cw.q_no}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted">
                              {cw.marks} Marks
                            </span>
                          </div>
                          <p className="text-xs font-medium text-foreground">{cw.question}</p>
                          <div className="p-2 rounded-lg bg-muted/60 text-[11px] text-muted-foreground">
                            <span className="font-bold text-foreground">Teacher Blackboard Hint:</span> {cw.solution_hints}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Tiered Homework */}
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-indigo-500" /> Tiered Homework Assignment Set
                      </h3>
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-primary" /> Est. Time: {suiteData.classwork_homework.estimated_homework_time_mins} Mins
                      </span>
                    </div>

                    <div className="space-y-3">
                      {suiteData.classwork_homework.homework_assignment.map((hw, idx) => {
                        const badgeColor =
                          hw.level === 'Basic'
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                            : hw.level === 'Standard'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';

                        return (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-foreground">HW Q{idx + 1}</span>
                                <Badge className={`text-[10px] font-bold px-2 py-0 border ${badgeColor}`}>
                                  {hw.level}
                                </Badge>
                              </div>
                              <span className="text-xs font-bold text-muted-foreground">
                                {hw.marks} Marks
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-foreground leading-relaxed">
                              {hw.question}
                            </p>

                            <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-[11px] text-muted-foreground flex items-start gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>
                                <strong className="text-foreground">Student Clue:</strong> {hw.guided_clue}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ========================================================================= */}
            {/* MODULE 5: 📄 PYQ / Board Exam Analysis */}
            {/* ========================================================================= */}
            <TabsContent value="pyq" className="space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <History className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        Module 5: PYQ &amp; Past Board Exam Frequency Analysis
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Topic se previous years me kya poocha gaya • Repeated concepts • Topic priority ranking
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs font-bold text-amber-700 bg-amber-50 border-amber-300 self-start sm:self-auto">
                      {suiteData.pyq_legacy_analysis.overall_chapter_weightage}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {suiteData.pyq_legacy_analysis.topic_priority_breakdown.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{t.topic}</span>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-muted border border-border">
                              {t.priority}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {t.frequency_tags.map((tag, tagIdx) => (
                              <Badge key={tagIdx} variant="secondary" className="text-[10px] font-semibold">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                            <span className="font-bold text-foreground block">Recurring Question Style:</span>
                            <p className="text-muted-foreground">{t.recurring_question_types}</p>
                          </div>

                          <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                            <span className="font-bold text-foreground block">Marks Distribution Trend:</span>
                            <p className="text-muted-foreground">{t.marks_trend}</p>
                          </div>

                          <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-1">
                            <span className="font-bold text-rose-900 dark:text-rose-300 block flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-500" /> Examiner Traps:
                            </span>
                            <p className="text-rose-800 dark:text-rose-400">{t.examiner_favorite_traps}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ========================================================================= */}
            {/* MODULE 6: 🧪 Quick Assessment */}
            {/* ========================================================================= */}
            <TabsContent value="assessment" className="space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    Module 6: Quick Diagnostic Check &amp; Learning Gap Analysis
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Har topic ke baad 3–5 rapid diagnostic questions • Student understanding check • Weak area identification
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    {suiteData.quick_assessment.topic_checks.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground">
                            Diagnostic Check #{q.question_number} • {q.topic}
                          </span>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {q.type}
                          </Badge>
                        </div>

                        <p className="text-xs font-semibold text-foreground leading-relaxed">
                          {q.question}
                        </p>

                        {/* Options if MCQ */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className="p-2 rounded-lg bg-muted/60 text-xs font-medium text-foreground border border-border/80"
                              >
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Answer & Learning Gap Identification */}
                        <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs space-y-1.5">
                          <div className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                            <span className="text-teal-950 dark:text-teal-200">
                              <strong>Correct Answer:</strong> {q.answer}
                            </span>
                          </div>

                          <div className="flex items-start gap-1.5 text-teal-900/80 dark:text-teal-300 pt-1 border-t border-teal-500/20">
                            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <span>
                              <strong>Learning Gap Identified if Answered Incorrectly:</strong> {q.gap_identified_if_wrong}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Remedial Suggestions */}
                  {suiteData.quick_assessment.remedial_suggestions && suiteData.quick_assessment.remedial_suggestions.length > 0 && (
                    <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground block">
                        Teacher Remediation Action Plan:
                      </span>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {suiteData.quick_assessment.remedial_suggestions.map((rem, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-2">
                            <span className="text-primary font-bold">•</span>
                            <span>{rem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ========================================================================= */}
            {/* MODULE 7: 🔄 Revision + Test Plan */}
            {/* ========================================================================= */}
            <TabsContent value="revision" className="space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Award className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    Module 7: Chapter Revision Strategy &amp; Mastery Test Plan
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Chapter revision schedule • Top 10 must-solve questions • Chapter test blueprint • Rapid pre-exam cheat sheet
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* 1. Revision Timeline Schedule */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary" /> 1. Multi-Stage Revision Timeline
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {suiteData.revision_test_plan.revision_schedule.map((rev, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-foreground">{rev.phase}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                              {rev.timing}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {rev.strategy}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Top Must-Solve Questions */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-500" /> 2. Top Must-Solve Board Examination Questions
                    </h3>

                    <div className="space-y-2.5">
                      {suiteData.revision_test_plan.top_10_must_solve_questions.map((mq, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-foreground">Priority Q{mq.q_no}</span>
                            <span className="text-[11px] font-bold text-primary">{mq.marks} Marks</span>
                          </div>
                          <p className="text-xs font-semibold text-foreground">{mq.question}</p>
                          <p className="text-[11px] text-muted-foreground italic">
                            Why Important: {mq.why_important}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Chapter Test Blueprint */}
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs uppercase tracking-wider text-primary">
                        3. Formal Chapter Test Blueprint
                      </span>
                      <Badge variant="outline" className="text-xs font-bold text-primary border-primary/30">
                        {suiteData.revision_test_plan.chapter_test_blueprint.total_marks} Marks ({suiteData.revision_test_plan.chapter_test_blueprint.time_minutes} Mins)
                      </Badge>
                    </div>

                    <h4 className="text-sm font-bold text-foreground">
                      {suiteData.revision_test_plan.chapter_test_blueprint.test_title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {suiteData.revision_test_plan.chapter_test_blueprint.sections_overview}
                    </p>
                  </div>

                  {/* 4. Rapid 5-Min Pre-Exam Cheat Sheet */}
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Rapid 5-Minute Pre-Exam Cheat Sheet Bullets
                    </span>
                    <ul className="space-y-1.5 text-xs text-foreground/90">
                      {suiteData.revision_test_plan.rapid_cheat_sheet_bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* DOCUMENT & AI OCR VIEWER MODAL DIALOG                                     */}
      {/* ========================================================================= */}
      {selectedScanForPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in print:hidden"
          onClick={() => setSelectedScanForPreview(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-foreground animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      Document &amp; AI OCR Viewer
                    </h3>
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold">
                      Page {currentPreviewIndex >= 0 ? currentPreviewIndex + 1 : 1} of {chapterScans.length}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30">
                      {className} • {subjectName}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Original scanned physical textbook page alongside verbatim AI-extracted transcription and chapter summary.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Previous / Next Page Navigation */}
                {chapterScans.length > 1 && (
                  <div className="flex items-center gap-1 mr-2 border-r border-border pr-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPreviewScan}
                      disabled={currentPreviewIndex <= 0}
                      className="h-8 w-8 p-0 cursor-pointer disabled:opacity-40"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs font-semibold text-muted-foreground px-1">
                      {currentPreviewIndex + 1} / {chapterScans.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPreviewScan}
                      disabled={currentPreviewIndex >= chapterScans.length - 1}
                      className="h-8 w-8 p-0 cursor-pointer disabled:opacity-40"
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedScanForPreview(null)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Modal Body: Two-Column Split (Left: High-Res Image, Right: AI Summary & OCR) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border">
              {/* Left Column: High-Res Scanned Document Image with Zoom Controls */}
              <div className="flex flex-col h-full bg-slate-950/5 dark:bg-slate-950/50 overflow-hidden">
                {/* Image Toolbar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/60 text-xs shrink-0">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    Original Scanned Textbook
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewZoom((z) => Math.max(z - 25, 50))}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      title="Zoom Out (-25%)"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-mono font-bold w-12 text-center text-foreground">
                      {previewZoom}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom((z) => Math.min(z + 25, 300))}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      title="Zoom In (+25%)"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(100)}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer ml-1 transition-colors"
                      title="Reset Zoom to 100%"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    {selectedScanForPreview.image_url && (
                      <a
                        href={selectedScanForPreview.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer ml-1 transition-colors"
                        title="Open Original in New Tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Scrollable / Zoomable Container */}
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[260px] max-h-[60vh] lg:max-h-none">
                  {selectedScanForPreview.image_url ? (
                    <img
                      src={selectedScanForPreview.image_url}
                      alt="Scanned Document Page"
                      style={{ width: `${previewZoom}%`, maxWidth: 'none', transition: 'width 0.15s ease' }}
                      className="rounded-lg shadow-lg object-contain select-none"
                    />
                  ) : (
                    <div className="text-center p-8 text-muted-foreground text-sm">
                      No image data available for this page.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: AI Page Summary & Verbatim OCR Text */}
              <div className="flex flex-col h-full overflow-hidden bg-card">
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* 1. AI Educational Page Summary Card */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-primary" />
                        AI Educational Page Summary
                      </span>
                      {selectedScanForPreview.raw_ocr_json?.word_count && (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          ~{selectedScanForPreview.raw_ocr_json.word_count} words
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                      {selectedScanForPreview.raw_ocr_json?.summary ||
                        'Verbatim content from this textbook page has been digitized. Read the full transcription below.'}
                    </p>
                  </div>

                  {/* 2. Key Topics Extracted from Page */}
                  {selectedScanForPreview.raw_ocr_json?.key_topics &&
                    selectedScanForPreview.raw_ocr_json.key_topics.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <BookMarked className="w-3.5 h-3.5 text-emerald-600" />
                          Key Concepts Covered on this Page:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedScanForPreview.raw_ocr_json.key_topics.map((topic, tIdx) => (
                            <Badge
                              key={tIdx}
                              className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20 text-xs font-medium"
                            >
                              ✓ {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* 3. Verbatim Extracted OCR Text Box */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        Full Verbatim OCR Transcription ({selectedScanForPreview.raw_ocr_text?.length || 0} chars)
                      </span>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyOCRText(selectedScanForPreview.raw_ocr_text || '')}
                          className="h-7 text-xs font-semibold gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          Copy Text
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownloadOCRText(
                              selectedScanForPreview.raw_ocr_text || '',
                              currentPreviewIndex >= 0 ? currentPreviewIndex + 1 : 1
                            )
                          }
                          className="h-7 text-xs font-semibold gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          Download .txt
                        </Button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-muted/30 border border-border font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto select-text">
                      {selectedScanForPreview.raw_ocr_text || (
                        <span className="text-muted-foreground italic font-sans">
                          No text extracted yet for this page.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-between shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const idToDelete = selectedScanForPreview.id;
                      handleDeleteScan(idToDelete);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete This Page
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setSelectedScanForPreview(null)}
                    className="text-xs font-bold px-4 cursor-pointer"
                  >
                    Done / Close Viewer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
