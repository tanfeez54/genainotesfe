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
  Target,
  Presentation,
  MessageSquare,
  Quote,
  Users,
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
  has_pdf?: boolean;
  pdf_url?: string | null;
  documents_count?: number;
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
      learning_objective?: string;
      topics_covered: string;
      duration_minutes: number;
      prerequisites?: string;
      pedagogy_focus?: string;
      time_breakdown?: Array<{
        phase: string;
        minutes: number;
        activity: string;
      }>;
      blackboard_plan?: string[];
      intuitive_hook?: string;
      daily_task?: string;
    }>;
  };
  teaching_guide: {
    chapter_handling_strategy?: {
      teacher_mindset?: string;
      handling_weak_students?: string;
      pacing_and_classroom_control?: string;
    };
    topics: Array<{
      topic_name: string;
      source_reference?: string;
      what_to_teach: string;
      how_to_explain?: string;
      verbatim_teacher_script?: string;
      how_to_explain_step_by_step?: string[];
      blackboard_layout?: {
        left_side?: string;
        center?: string;
        right_side?: string;
      };
      intuitive_analogy: string;
      real_world_examples: string[];
      in_class_check_questions?: Array<{ question: string; expected_answer: string }>;
      weak_student_remedy?: string;
      common_mistakes_and_fixes: Array<{ mistake: string; correction: string }>;
      teacher_delivery_tips: string;
    }>;
  };
  mandatory_notes: {
    heading: string;
    instructions_for_students: string;
    unmissable_important_notes_and_facts?: Array<string | {
      fact: string;
      why_unmissable?: string;
      exam_weightage?: string;
      memory_anchor?: string;
    }>;
    words_meanings_and_daily_usage?: Array<{
      word: string;
      meaning: string;
      contextual_meaning?: string;
      daily_life_usage_example?: string;
      synonyms?: string[];
    }>;
    definitions: Array<{ term: string; exact_definition: string; source_citation?: string; importance: string }>;
    formulas_and_rules: Array<{ title: string; formula: string; derivation_steps?: string | string[]; explanation: string }>;
    theorems_and_postulates: Array<{ name: string; statement: string; key_proof_steps: string }>;
    important_diagrams: Array<{ title: string; description: string; must_label_parts: string[] }>;
    high_yield_exam_points: string[];
  };
  classwork_homework: {
    day_wise_assignments?: Array<{
      day_number: number;
      day_title: string;
      topic_focus?: string;
      classwork: Array<{
        q_no: number;
        question: string;
        marks: number;
        solution_hints: string;
      }>;
      homework: Array<{
        level: 'Basic' | 'Standard' | 'Brain-Teaser (HOTS)';
        question: string;
        marks: number;
        guided_clue: string;
      }>;
      estimated_time_mins: number;
    }>;
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
  quick_assessment?: {
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
    detailed_chapter_analysis_summary?: string;
    comprehensive_chapter_qa?: Array<{
      q_no?: number;
      question_number?: number;
      type?: string;
      marks_category?: string;
      question: string;
      answer?: string;
      detailed_model_answer?: string;
      marks: number;
      key_points_for_full_marks?: string[];
      marking_scheme_breakdown?: string[];
      common_pitfall_warning?: string;
    }>;
    detailed_important_notes?: Array<string | {
      category?: string;
      note_title?: string;
      key_principles?: string[];
      board_special_highlight?: string;
    }>;
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
    total_periods_recommended: 7,
    timeline_summary: 'Comprehensive 7-day chapter teaching roadmap progressing logically from physical indicators to balanced equations, reaction mechanisms, redox transfer, and real-world corrosion prevention.',
    sequence_rationale: 'Day 1 establishes tangible sensory observations before introducing symbolic representations on Day 2. Days 3-5 group and contrast reaction types, Day 6 unpacks electron/oxygen mechanics, and Day 7 consolidates real-world degradation and board PYQs.',
    periods: [
      {
        period_number: 1,
        day_title: 'Day 1: Physical vs Chemical Changes & Chemical Reaction Indicators',
        learning_objective: 'Differentiate physical from chemical change and identify the 4 observable signs that confirm a chemical reaction has occurred.',
        topics_covered: 'Definition of chemical change vs physical change. 4 key indicators: change in state, color change, evolution of gas, change in temperature. Activity 1.1: Burning magnesium ribbon in air (dazzling white flame, white powder MgO). Safety protocol: cleaning ribbon with sandpaper.',
        duration_minutes: 45,
        prerequisites: 'Basic concepts of atoms, elements, and physical changes from Class 9.',
        pedagogy_focus: 'Inquiry-based live demonstration with student observation logging.',
        time_breakdown: [
          { phase: 'Warm-up & Hook', minutes: 5, activity: 'Ask: "Why does milk left at room temperature in summer spoil, but water just evaporates?"' },
          { phase: 'Core Concept Delivery', minutes: 20, activity: 'Explain 4 indicators on blackboard; write word equations: Magnesium + Oxygen -> Magnesium oxide.' },
          { phase: 'Guided Demo & Discussion', minutes: 15, activity: 'Safety rules for burning Mg ribbon + test tube reaction of Zinc granules with dilute H2SO4 (gas evolution & warmth).' },
          { phase: 'Wrap-up & Daily Task', minutes: 5, activity: 'Check key takeaways and assign Day 1 classwork & homework questions.' }
        ],
        blackboard_plan: [
          '4 Indicators: Change in State | Color | Gas Evolution (H2) | Temperature (Exo/Endo)',
          'Word Equation: Magnesium + Oxygen ➔ Magnesium Oxide (White powder)',
          'Key Board Point: Always clean Mg ribbon with sandpaper to remove protective oxide layer'
        ],
        intuitive_hook: 'Baking a cake vs melting an ice cube: Melted ice can be refrozen (physical), but a baked cake can never be un-baked into flour and eggs (chemical change)!',
        daily_task: 'CW: List 2 observable changes when zinc granules react with dilute sulphuric acid. HW: Why should a magnesium ribbon be cleaned before burning in air?'
      },
      {
        period_number: 2,
        day_title: 'Day 2: Writing & Balancing Chemical Equations (Hit & Trial Method)',
        learning_objective: 'Master the step-by-step atom balancing algorithm based strictly on the Law of Conservation of Mass.',
        topics_covered: 'Word equations vs chemical equations. Skeletal equations. Law of Conservation of Mass (Lavoisier: mass cannot be created or destroyed). Golden rule: Never touch subscripts/formulas, only add coefficients. Step-by-step table method to balance Fe + H2O -> Fe3O4 + H2. State symbols: (s), (l), (g), (aq).',
        duration_minutes: 45,
        prerequisites: 'Writing chemical formulas using valencies (Class 9 criss-cross rule).',
        pedagogy_focus: 'Interactive blackboard problem-solving with participatory student turns.',
        time_breakdown: [
          { phase: 'Warm-up & Hook', minutes: 5, activity: 'Show a seesaw balance scale illustration on the board: reactants pan vs products pan.' },
          { phase: 'Core Concept Delivery', minutes: 20, activity: 'Explain Law of Conservation of Mass; demonstrate 4-step table method on H2 + O2 -> H2O and N2 + H2 -> NH3.' },
          { phase: 'Guided Practice on Board', minutes: 15, activity: 'Call students to solve Fe + H2O -> Fe3O4 + H2 step-by-step; add state symbols (s, l, g, aq).' },
          { phase: 'Wrap-up & Daily Task', minutes: 5, activity: 'Quick speed-check question and assign Day 2 practice equations.' }
        ],
        blackboard_plan: [
          'Law: Total mass of reactants = Total mass of products (Atoms must balance on both sides)',
          'Golden Rule: You can ONLY change coefficients (e.g. 2H2O), NEVER change formulas (H2O2)',
          'Balancing Table: Elements | Reactant Atoms (LHS) | Product Atoms (RHS)'
        ],
        intuitive_hook: 'A bicycle factory: If 1 frame + 2 wheels = 1 bicycle, you cannot assemble a bike with 1 wheel or change the parts without throwing off inventory counts!',
        daily_task: 'CW: Balance: Al + CuCl2 ➔ AlCl3 + Cu. HW: Balance with state symbols: Iron reacts with steam to form iron(II,III) oxide and hydrogen gas.'
      },
      {
        period_number: 3,
        day_title: 'Day 3: Types of Reactions — Combination & Exothermic Reactions',
        learning_objective: 'Identify combination reactions and explain how bond formation releases thermal energy in exothermic reactions.',
        topics_covered: 'Definition and general formula of combination reaction (A + B -> AB). Activity: Quicklime (CaO) reacting vigorously with water to form slaked lime (Ca(OH)2) + heat. Whitewashing chemistry: Ca(OH)2 reacting with atmospheric CO2 to form shiny CaCO3 layer after 2-3 days. Exothermic vs Endothermic reactions. Respiration as an exothermic process.',
        duration_minutes: 45,
        prerequisites: 'Concept of reactants, products, and balanced equations.',
        pedagogy_focus: 'Comparative analysis, chemical equations chart, and real-world domestic applications.',
        time_breakdown: [
          { phase: 'Warm-up & Hook', minutes: 5, activity: 'Touch an imaginary beaker: "Why does adding water to white chuna (quicklime) make water boil without a stove?"' },
          { phase: 'Core Concept Delivery', minutes: 20, activity: 'Explain Combination (CaO + H2O -> Ca(OH)2 + Heat); explain Whitewashing reaction and shiny layer formation.' },
          { phase: 'Guided Practice & Case Study', minutes: 15, activity: 'Discuss why Respiration is exothermic (glucose oxidation) and combustion of natural gas (methane).' },
          { phase: 'Wrap-up & Daily Task', minutes: 5, activity: '3-minute quick check on chemical formulas of quicklime vs slaked lime.' }
        ],
        blackboard_plan: [
          'Combination: A + B ➔ AB (Two or more substances combine to form a single product)',
          'Slaked Lime: CaO(s) [Quicklime] + H2O(l) ➔ Ca(OH)2(aq) [Slaked lime] + Heat (Exothermic)',
          'Wall Whitewash: Ca(OH)2(aq) + CO2(g) ➔ CaCO3(s) [Shiny Calcium Carbonate] + H2O(l)'
        ],
        intuitive_hook: 'Instant hand warmers: Two separate harmless chemicals mix inside a pouch and instantly emit comforting warmth without any fire!',
        daily_task: 'CW: Why does a whitewashed wall start shining after 2-3 days? HW: Write the balanced chemical equation for respiration and explain why it is exothermic.'
      },
      {
        period_number: 4,
        day_title: 'Day 4: Types of Reactions — Decomposition (Thermal, Electrolytic, Photolytic)',
        learning_objective: 'Classify decomposition reactions by the form of external energy required (heat, electricity, or sunlight).',
        topics_covered: 'Decomposition definition (AB -> A + B). Energy absorption (endothermic). 1. Thermal Decomposition: Heating green FeSO4 crystals (turns reddish-brown Fe2O3, releases pungent SO2 + SO3 gases), Heating white Pb(NO3)2 powder (emits brown NO2 fumes). 2. Electrolytic Decomposition: Acidified water electrolysis (cathode collects H2, anode collects O2 in 2:1 volume ratio). 3. Photolytic Decomposition: Sunlight breakdown of AgCl (white to grey) and AgBr (black & white photography).',
        duration_minutes: 45,
        prerequisites: 'Distinction between exothermic and endothermic processes.',
        pedagogy_focus: 'Visual diagram breakdown, color shift observations, and energy classification.',
        time_breakdown: [
          { phase: 'Warm-up & Hook', minutes: 5, activity: 'Show a dark amber medicine bottle: "Why are chemicals like silver chloride stored in dark bottles?"' },
          { phase: 'Core Concept Delivery', minutes: 22, activity: 'Systematically teach 3 energy modes (Thermal, Electrolytic, Photolytic) with corresponding NCERT reactions.' },
          { phase: 'Diagram & Concept Check', minutes: 13, activity: 'Draw water electrolysis diagram on board; explain 2:1 gas volume ratio (H2O formula origin).' },
          { phase: 'Wrap-up & Daily Task', minutes: 5, activity: 'Exit check: match energy form to decomposition equation.' }
        ],
        blackboard_plan: [
          'Decomposition: AB ➔ A + B (Requires energy input: Heat / Electricity / Light)',
          'Thermal: 2FeSO4(s) ➔ Fe2O3(s) [red-brown] + SO2(g) + SO3(g) | 2Pb(NO3)2 ➔ 2PbO + 4NO2 [brown fumes] + O2',
          'Electrolytic: 2H2O(l) ➔ 2H2(g) [Cathode, 2 vol] + O2(g) [Anode, 1 vol]',
          'Photolytic: 2AgCl(s) [white] ➔ 2Ag(s) [grey] + Cl2(g) (in sunlight)'
        ],
        intuitive_hook: 'Disassembling a Lego spaceship: To break apart tightly snapped bricks, you must provide external mechanical pulling energy (or heat/electricity)!',
        daily_task: 'CW: Why is the volume of gas collected over one electrode double during electrolysis of water? HW: What happens when lead nitrate is heated in a dry test tube? State observations and equation.'
      },
      {
        period_number: 5,
        day_title: 'Day 5: Types of Reactions — Displacement & Double Displacement (Precipitation)',
        learning_objective: 'Predict displacement using the metal reactivity series and understand ion exchange in precipitation reactions.',
        topics_covered: 'Single Displacement (A + BC -> AC + B): More reactive metal displaces less reactive metal. Iron nail dipped in blue CuSO4 solution (iron nail gets reddish-brown copper coat, solution turns pale green FeSO4). Reactivity series correlation. Double Displacement (AB + CD -> AD + CB): Mutual exchange of ions. Precipitation reactions: Sodium sulphate + Barium chloride (Na2SO4 + BaCl2 -> BaSO4 [white insoluble precipitate] + 2NaCl). Reaction of Lead nitrate with Potassium iodide (yellow PbI2 precipitate).',
        duration_minutes: 45,
        prerequisites: 'Basic knowledge of positive/negative ions and reactivity of metals.',
        pedagogy_focus: 'Color change comparison, ionic exchange flowcharts, and precipitate identification.',
        time_breakdown: [
          { phase: 'Warm-up & Hook', minutes: 5, activity: 'Ask: "Can a newcomer displace an existing player on a football team? Only if they are more active!"' },
          { phase: 'Core Concept Delivery', minutes: 22, activity: 'Explain Single Displacement with Fe + CuSO4 and Double Displacement with Na2SO4 + BaCl2.' },
          { phase: 'Guided Board Practice', minutes: 13, activity: 'Students write balanced molecular and ionic equations; identify precipitate colors (BaSO4 white, PbI2 yellow).' },
          { phase: 'Wrap-up & Daily Task', minutes: 5, activity: 'Quick oral quiz on reactivity order (Zn > Fe > Cu).' }
        ],
        blackboard_plan: [
          'Single Displacement: Fe(s) + CuSO4(aq, blue) ➔ FeSO4(aq, pale green) + Cu(s, red-brown)',
          'Reactivity Order: Zn > Fe > Cu (More reactive displaces less reactive)',
          'Double Displacement: Na2SO4(aq) + BaCl2(aq) ➔ BaSO4(s) [White Insoluble PPT] + 2NaCl(aq)',
          'Lead Iodide PPT: Pb(NO3)2(aq) + 2KI(aq) ➔ PbI2(s) [Yellow PPT] + 2KNO3(aq)'
        ],
        intuitive_hook: 'Partner swapping at a dance: In single displacement, an energetic dancer cuts in and takes over. In double displacement, two couples politely swap partners simultaneously!',
        daily_task: 'CW: Identify the type of reaction and name the precipitate formed when potassium iodide is mixed with lead nitrate solution. HW: Describe two observations when an iron nail is placed in copper sulphate solution for 45 minutes.'
      },
      {
        period_number: 6,
        day_title: 'Day 6: Oxidation, Reduction & Redox Mechanics (Agent Identification)',
        learning_objective: 'Master simultaneous oxidation and reduction and flawlessly identify oxidizing and reducing agents.',
        topics_covered: 'Classical & modern definitions: Oxidation (gain of oxygen / loss of hydrogen / loss of electrons) and Reduction (loss of oxygen / gain of hydrogen / gain of electrons). Redox reactions: Both processes happen simultaneously. Step-by-step identification matrix: 1. Substance oxidized, 2. Substance reduced, 3. Oxidizing agent, 4. Reducing agent. Landmark equations: CuO + H2 -> Cu + H2O, ZnO + C -> Zn + CO, MnO2 + 4HCl -> MnCl2 + 2H2O + Cl2.',
        duration_minutes: 45,
        prerequisites: 'Balancing chemical equations and basic valency transfers.',
        pedagogy_focus: 'Color-coded arrow mapping on blackboard and agent matrix practice.',
        time_breakdown: [
          { phase: 'Warm-up & Hook', minutes: 5, activity: 'Show an apple slice turning brown in air: "What invisible gas is attacking the fruit flesh?"' },
          { phase: 'Core Concept Delivery', minutes: 22, activity: 'Define oxidation/reduction; teach the Golden Rule: Substance oxidized is the Reducing Agent and vice versa.' },
          { phase: 'Interactive Drill on Board', minutes: 13, activity: 'Map arrows on board for CuO + H2 -> Cu + H2O and ZnO + C -> Zn + CO with 4-quadrant student checks.' },
          { phase: 'Wrap-up & Daily Task', minutes: 5, activity: 'Exit ticket on identifying the oxidizing agent in a test equation.' }
        ],
        blackboard_plan: [
          'Oxidation: Gain of Oxygen (+O) OR Loss of Hydrogen (-H)',
          'Reduction: Loss of Oxygen (-O) OR Gain of Hydrogen (+H)',
          'Golden Rule: Substance Oxidized = Reducing Agent | Substance Reduced = Oxidizing Agent',
          'Redox Matrix: CuO [Reduced / OA] + H2 [Oxidized / RA] ➔ Cu + H2O'
        ],
        intuitive_hook: 'Passing a hot potato: The person who tosses away oxygen is reduced, and the person catching the oxygen is oxidized. They cannot play without each other!',
        daily_task: 'CW: In the reaction ZnO + C ➔ Zn + CO, identify: (a) substance oxidized, (b) oxidizing agent. HW: In MnO2 + 4HCl ➔ MnCl2 + 2H2O + Cl2, identify the substance oxidized, substance reduced, and oxidizing agent.'
      },
      {
        period_number: 7,
        day_title: 'Day 7: Everyday Redox (Corrosion & Rancidity) + Board Exam Mastery Workshop',
        learning_objective: 'Relate redox reactions to daily degradation (corrosion, rancidity) and conquer high-weightage board exam problems.',
        topics_covered: 'Corrosion: Definition, conditions needed (oxygen + moisture). Rusting of iron formula (Fe2O3.xH2O). Tarnishing of silver (black Ag2S coating). Corrosion of copper (green basic copper carbonate CuCO3.Cu(OH)2). Prevention: Painting, greasing, galvanization (zinc coating), electroplating, alloys (stainless steel). Rancidity: Aerial oxidation of fats/oils causing unpleasant smell/taste. Prevention: Flushing with unreactive nitrogen gas, vacuum packing, airtight jars, antioxidants (BHA/BHT). Board exam workshop: Identifying unknown compounds X, Y, Z and multi-step reaction reasoning.',
        duration_minutes: 45,
        prerequisites: 'Redox fundamentals and knowledge of all 5 reaction types.',
        pedagogy_focus: 'Problem-solving workshop, commercial packaging examples, and marking scheme strategies.',
        time_breakdown: [
          { phase: 'Warm-up & Hook', minutes: 5, activity: 'Hold up a puffed potato chips bag: "Why is 70% of the bag filled with nitrogen gas? Is it cheating or chemistry?"' },
          { phase: 'Core Concept Delivery', minutes: 20, activity: 'Explain corrosion mechanisms, metal coating formulas, and rancidity prevention methods.' },
          { phase: 'Board PYQ Workshop', minutes: 15, activity: 'Solve 2022-2024 board questions on unknown compounds (e.g. brown shiny element X heated in air turns black).' },
          { phase: 'Wrap-up & Chapter Summary', minutes: 5, activity: 'Celebrate full chapter mastery; issue revision checklist and diagnostic test homework.' }
        ],
        blackboard_plan: [
          'Rust Formula: Hydrated Ferric Oxide Fe2O3.xH2O (Requires both O2 and H2O)',
          'Metal Coatings: Silver ➔ Black (Ag2S) | Copper ➔ Green [CuCO3.Cu(OH)2]',
          'Galvanization: Protecting iron by coating with a sacrificial thin layer of Zinc (Zn)',
          'Rancidity: Oxidation of fats/oils | Prevention: Nitrogen flushing, airtight containers, antioxidants'
        ],
        intuitive_hook: 'Nitrogen gas in chips bags acts like an invisible bodyguard, keeping aggressive oxygen molecules away from crispy oils so chips stay fresh and crunchy for months!',
        daily_task: 'CW: Why do chips makers flush bags with nitrogen gas? HW: A shiny brown element "X" on heating in air forms a black compound "Y". Name X and Y and write the balanced chemical equation.'
      }
    ]
  },
  teaching_guide: {
    chapter_handling_strategy: {
      teacher_mindset: 'Never jump straight to abstract chemical formulas on day 1. Start with sensory observations (color change, heat release, fizzing). Chemistry in Class 10 feels intimidating to students because of formulas; keep the tone inquisitive and demystify equations as mere "recipes".',
      handling_weak_students: 'For students struggling with balancing or valencies, enforce the 3-column inventory box (Element | Reactant | Product). Do not allow them to guess in their head. Emphasize that formulas inside boxes can never be edited — only numbers in front can be multiplied. Praise small balancing wins.',
      pacing_and_classroom_control: 'Spend the first 5 minutes strictly on the curiosity hook without writing textbook definitions. Keep demonstrations safe (always use safety tongs/goggles for Magnesium ribbon). Dedicate the final 7 minutes exclusively to student writing/practice so doubts surface before homework.'
    },
    topics: [
      {
        topic_name: 'Observations & Indicators of Chemical Reactions (Activity 1.1 Magnesium Ribbon)',
        source_reference: 'NCERT Science Class 10, Section 1.1 (Pages 1-3)',
        what_to_teach: 'Definition of chemical change vs physical change. 4 observable signs: change in state, color change, evolution of gas (H2), and temperature change. Detailed study of Activity 1.1: burning magnesium ribbon in air producing dazzling white light and white powder Magnesium Oxide (2Mg + O2 -> 2MgO).',
        verbatim_teacher_script: 'Good morning class! Look at this piece of ribbon in my hand. It looks like a dull grey metal strip. But watch what happens when I clean it with sandpaper and bring it near the flame. (Light the ribbon). Notice that brilliant, blinding white flame! Now look at the watch glass — what do we have? It is no longer a shiny metal ribbon; it has transformed into a pure white powder. Students, this is Magnesium Oxide. A completely new substance formed, intense light emitted, heat released — this is the essence of a Chemical Reaction!',
        how_to_explain_step_by_step: [
          'Step 1 (The Hook): Show the dull magnesium ribbon and ask why sandpaper is mandatory before burning (removes protective oxide film).',
          'Step 2 (The Experiment): Burn ribbon with tongs with safety glasses; write word equation: Magnesium + Oxygen -> Magnesium Oxide.',
          'Step 3 (Concept Anchor): List the 4 observable indicators that prove a chemical change happened (State, Color, Gas, Temp).'
        ],
        blackboard_layout: {
          left_side: 'Key Terms:\n• Reactants\n• Products\n• Chemical Change\n• Oxide Film',
          center: 'Observation & Reaction:\n2Mg(s) + O2(g) ➔ 2MgO(s)\nFlame: Dazzling White\nResidue: White Powder (Magnesium Oxide)',
          right_side: 'Board Traps:\nQ: Why clean with sandpaper?\nA: Removes basic magnesium oxide layer so Mg touches oxygen directly.'
        },
        intuitive_analogy: 'Baking a cake vs melting an ice cube: Melted ice can be refrozen (physical), but a baked cake can never be un-baked into flour and eggs (chemical change)!',
        real_world_examples: ['Rusting of iron gates during monsoon season', 'Digestion of food in our stomach', 'Fermentation of grapes into wine'],
        in_class_check_questions: [
          {
            question: 'What is the color and chemical identity of the powder formed when magnesium ribbon burns in air?',
            expected_answer: 'White powder of Magnesium Oxide (MgO).'
          },
          {
            question: 'Why must the ribbon be cleaned with sandpaper before burning?',
            expected_answer: 'To rub off the protective coating of basic magnesium oxide formed by reaction with atmospheric oxygen.'
          }
        ],
        weak_student_remedy: 'Tell struggling students: Think of lighting a matchstick. Once the wooden tip burns to black ash and smoke, can you un-burn it? No! Same with Magnesium ribbon.',
        common_mistakes_and_fixes: [
          {
            mistake: 'Students write that Magnesium ribbon melts into liquid.',
            correction: 'Clarify that it burns with combustion, not melts; it produces solid ash (MgO).'
          }
        ],
        teacher_delivery_tips: 'Always wear dark safety goggles during the Mg ribbon demo to protect eyes from UV glare.'
      },
      {
        topic_name: 'Balancing Chemical Equations by Hit & Trial (Law of Conservation of Mass)',
        source_reference: 'NCERT Science Class 10, Section 1.1.2 (Pages 3-6)',
        what_to_teach: 'Subscripts cannot be changed; only stoichiometric coefficients can be placed before compounds. Mass of each element must remain invariant based on Lavoisier\'s Law of Conservation of Mass. Step-by-step table method to balance Fe + H2O -> Fe3O4 + H2.',
        verbatim_teacher_script: 'Students, imagine you run a pizza shop. If your recipe says 1 dough base + 2 spoons cheese = 1 pizza, what happens if a customer demands a pizza with 3 spoons of cheese? You have to adjust your entire batch ingredients! In chemistry, Antoine Lavoisier gave us the Law of Conservation of Mass: Atoms cannot magically appear or disappear. Every single atom entering a reaction must leave the reaction. So when you see Fe + H2O -> Fe3O4 + H2, our job is not to change the chemical formula, but to find how many molecules must react together.',
        how_to_explain_step_by_step: [
          'Step 1 (The Golden Law): Explain Law of Conservation of Mass. Draw a seesaw balance scale on the board.',
          'Step 2 (The Rule of Box): Draw boxes around formulas (e.g. [Fe] + [H2O] -> [Fe3O4] + [H2]). Explain: Subscripts inside boxes are untouchable!',
          'Step 3 (Table Algorithm): Build a 3-column table (Element, LHS, RHS). Balance the element with highest atom count first (Oxygen), then metals (Iron), then Hydrogen.'
        ],
        blackboard_layout: {
          left_side: 'Golden Rule:\nNEVER change subscripts!\nChange ONLY coefficients.\nLaw of Mass Conservation',
          center: 'Step-by-Step Balancing:\nFe + H2O ➔ Fe3O4 + H2\n1. Balance O: Fe + 4H2O ➔ Fe3O4 + H2\n2. Balance H: Fe + 4H2O ➔ Fe3O4 + 4H2\n3. Balance Fe: 3Fe + 4H2O ➔ Fe3O4 + 4H2\nFinal: 3Fe(s) + 4H2O(g) ➔ Fe3O4(s) + 4H2(g)',
          right_side: 'Pro Traps:\n❌ H2 + O2 ➔ H2O2 (Wrong! H2O2 is poison)\n✓ 2H2 + O2 ➔ 2H2O (Correct!)'
        },
        intuitive_analogy: 'Baking a sandwich: If 2 slices of bread + 1 cheese slice = 1 sandwich, you cannot alter the recipe to have 3 slices without changing the whole batch coefficient.',
        real_world_examples: ['Burning of cooking gas (methane + oxygen -> carbon dioxide + water)', 'Respiration in humans (glucose oxidation)'],
        in_class_check_questions: [
          {
            question: 'Why do we balance a chemical equation?',
            expected_answer: 'To satisfy the Law of Conservation of Mass, ensuring total mass of reactants equals total mass of products.'
          }
        ],
        weak_student_remedy: 'Have the student draw dots for each atom on LHS and RHS. Count dots like currency coins until both sides have the exact same count.',
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
        topic_name: 'Combination & Exothermic Reactions (Slaked Lime & Whitewashing Chemistry)',
        source_reference: 'NCERT Science Class 10, Section 1.2.1 (Pages 6-8)',
        what_to_teach: 'Definition and general formula of combination reaction (A + B -> AB). Activity: Quicklime (CaO) reacting vigorously with water to form slaked lime (Ca(OH)2) + heat. Whitewashing chemistry: Ca(OH)2 reacting with atmospheric CO2 to form shiny CaCO3 layer after 2-3 days. Exothermic vs Endothermic reactions. Respiration as an exothermic process.',
        verbatim_teacher_script: 'Class, how many of you have seen white paint being prepared from solid white stones (Chuna) before Diwali? When the painter drops quicklime stones into a bucket of water, what happens? The water begins to boil and hiss violently without any gas stove underneath! Why? Because Calcium Oxide combines with Water to form Slaked Lime and releases massive amounts of heat. Two reactants joined into one single product — that is a Combination Reaction!',
        how_to_explain_step_by_step: [
          'Step 1 (Domestic Hook): Ask about whitewashing houses with Chuna (Quicklime).',
          'Step 2 (Chemical Formulation): Write CaO + H2O -> Ca(OH)2 + Heat on board. Define combination (A + B -> AB) and Exothermic.',
          'Step 3 (Board Exam Secret): Explain why walls shine 2-3 days later: Ca(OH)2 absorbs atmospheric CO2 to form a shiny thin layer of Calcium Carbonate (CaCO3).'
        ],
        blackboard_layout: {
          left_side: 'Definitions:\n• Combination: A + B ➔ AB\n• Exothermic: Releases heat\n• Endothermic: Absorbs heat',
          center: 'The Whitewash Sequence:\n1. In Bucket:\nCaO(s) [Quicklime] + H2O(l) ➔ Ca(OH)2(aq) [Slaked Lime] + Heat\n\n2. On Wall (After 2-3 days):\nCa(OH)2(aq) + CO2(g) ➔ CaCO3(s) [Shiny Marble finish] + H2O(l)',
          right_side: 'Common Formula Confusions:\n• Quicklime = CaO\n• Slaked lime = Ca(OH)2\n• Limestone / Marble = CaCO3'
        },
        intuitive_analogy: 'Instant hand warmers: Two separate harmless chemicals mix inside a pouch and instantly emit comforting warmth without any fire!',
        real_world_examples: ['Burning of coal (C + O2 -> CO2 + Heat)', 'Respiration in humans releasing energy for cells', 'Decomposition of vegetable matter into compost'],
        in_class_check_questions: [
          {
            question: 'Why does a whitewashed wall start shining after two to three days?',
            expected_answer: 'Calcium hydroxide reacts slowly with CO2 in air to form a thin shiny protective layer of Calcium Carbonate (CaCO3).'
          }
        ],
        weak_student_remedy: 'Use the Marriage Analogy: Two separate individuals (CaO and H2O) come together to form one united household (Ca(OH)2).',
        common_mistakes_and_fixes: [
          {
            mistake: 'Confusing CaO (Quicklime) with Ca(OH)2 (Slaked Lime).',
            correction: 'Teach mnemonic: Quick-lime has NO water (Dry CaO). Slaked-lime has drunk water (Wet Ca(OH)2).'
          }
        ],
        teacher_delivery_tips: 'Caution students never to touch the beaker with bare hands during the quicklime demo as the exothermic temperature can exceed 80°C.'
      },
      {
        topic_name: 'Decomposition Reactions (Thermal, Electrolytic & Photolytic)',
        source_reference: 'NCERT Science Class 10, Section 1.2.2 (Pages 8-10)',
        what_to_teach: 'Decomposition definition (AB -> A + B). Energy absorption (endothermic). 1. Thermal Decomposition: Heating green FeSO4 crystals (turns reddish-brown Fe2O3, releases pungent SO2 + SO3 gases), Heating white Pb(NO3)2 powder (emits brown NO2 fumes). 2. Electrolytic Decomposition: Acidified water electrolysis (cathode collects H2, anode collects O2 in 2:1 volume ratio). 3. Photolytic Decomposition: Sunlight breakdown of AgCl (white to grey) and AgBr (black & white photography).',
        verbatim_teacher_script: 'Now class, imagine combination in reverse. Instead of two things joining, we take ONE large molecule and break it down into two or more smaller pieces. But remember: molecules don\'t break on their own. They need energy! If we supply heat, it\'s Thermal Decomposition. If we pass electric current, it\'s Electrolytic. If sunlight does the job, it\'s Photolytic. Notice this green crystal in the test tube — Ferrous Sulphate. As I heat it, the green color vanishes into reddish-brown rust, and you smell the pungent odor of burning matchsticks!',
        how_to_explain_step_by_step: [
          'Step 1 (Comparative Concept): Break down "De-composition" = breakup of compound using energy (Endothermic).',
          'Step 2 (Thermal Mastery): Teach FeSO4 heating (green -> reddish brown Fe2O3 + SO2 + SO3) and Pb(NO3)2 heating (brown fumes of NO2).',
          'Step 3 (Electrolytic & Photolytic): Water electrolysis 2:1 volume ratio and AgCl decomposition in dark bottles.'
        ],
        blackboard_layout: {
          left_side: '3 Energy Sources:\n1. Heat (Thermal Δ)\n2. Electricity (Electrolytic)\n3. Light (Photolytic hν)',
          center: 'NCERT Landmark Reactions:\n• 2FeSO4(s) ➔ Fe2O3(s) [red-brown] + SO2↑ + SO3↑\n• 2Pb(NO3)2(s) ➔ 2PbO [yellow] + 4NO2↑ [brown fumes] + O2↑\n• 2H2O(l) ➔ 2H2(g) [Cathode, 2 vol] + O2(g) [Anode, 1 vol]\n• 2AgCl(s) [white] ➔ 2Ag(s) [grey] + Cl2(g)',
          right_side: 'Board Exam Question:\nQ: Why store AgCl in dark bottles?\nA: To prevent photolytic decomposition by ambient sunlight.'
        },
        intuitive_analogy: 'Disassembling a Lego spaceship: To break apart tightly snapped bricks, you must provide external mechanical pulling energy (or heat/electricity)!',
        real_world_examples: ['Black and white photographic film development using silver bromide', 'Industrial extraction of aluminum metal from bauxite ore by electrolysis'],
        in_class_check_questions: [
          {
            question: 'What gas produces brown fumes when lead nitrate is heated?',
            expected_answer: 'Nitrogen dioxide (NO2).'
          },
          {
            question: 'Why is the gas collected at the cathode double that of the anode during water electrolysis?',
            expected_answer: 'Water (H2O) contains hydrogen and oxygen in a 2:1 ratio by atoms, so 2 volumes of H2 are released for every 1 volume of O2.'
          }
        ],
        weak_student_remedy: 'Explain with Lego: A big Lego castle needs hitting or pulling force (energy) to break apart into individual bricks.',
        common_mistakes_and_fixes: [
          {
            mistake: 'Confusing brown fumes of NO2 with oxygen gas.',
            correction: 'Brown fumes are always Nitrogen Dioxide; Oxygen is odorless and colorless.'
          }
        ],
        teacher_delivery_tips: 'This Pb(NO3)2 reaction is tested almost every 2 years in CBSE boards as an unknown compound "X" question.'
      },
      {
        topic_name: 'Displacement, Reactivity Series & Double Displacement (Precipitation)',
        source_reference: 'NCERT Science Class 10, Section 1.2.3 & 1.2.4 (Pages 10-12)',
        what_to_teach: 'Single Displacement (A + BC -> AC + B): More reactive metal displaces less reactive metal. Iron nail dipped in blue CuSO4 solution (iron nail gets reddish-brown copper coat, solution turns pale green FeSO4). Reactivity series correlation. Double Displacement (AB + CD -> AD + CB): Mutual exchange of ions. Precipitation reactions: Sodium sulphate + Barium chloride (Na2SO4 + BaCl2 -> BaSO4 [white insoluble precipitate] + 2NaCl). Reaction of Lead nitrate with Potassium iodide (yellow PbI2 precipitate).',
        verbatim_teacher_script: 'Class, let\'s talk about the rule of strength. In chemistry, metals have a hierarchy called the Reactivity Series. Zinc is more reactive than Iron, and Iron is more reactive than Copper. If an Iron nail is dipped into a blue solution of Copper Sulphate, Iron says to Copper: "Get out of here, I am stronger than you!" Iron takes the sulphate seat, and Copper gets kicked out onto the iron nail as a reddish-brown powder. But in Double Displacement, nobody kicks anyone out — both compounds politely swap their partners like dance partners swapping simultaneously, creating an insoluble solid called a precipitate!',
        how_to_explain_step_by_step: [
          'Step 1 (Reactivity Hierarchy): Teach mnemonic for reactivity series (K > Na > Ca > Mg > Al > Zn > Fe > Pb > H > Cu > Ag > Au).',
          'Step 2 (Single Displacement): Demonstrate Fe + CuSO4 (blue -> pale green FeSO4 + red-brown Cu coat on nail).',
          'Step 3 (Double Displacement & PPT): Mix Na2SO4 and BaCl2 on board; explain white solid BaSO4 settling down.'
        ],
        blackboard_layout: {
          left_side: 'Reactivity Hierarchy:\nZn > Fe > Cu\n\nRule:\nMore reactive displaces less reactive',
          center: '1. Single Displacement:\nFe(s) + CuSO4(aq) [Blue] ➔ FeSO4(aq) [Pale Green] + Cu(s) [Red-Brown]\n\n2. Double Displacement (Precipitation):\nNa2SO4(aq) + BaCl2(aq) ➔ BaSO4(s) [White Insoluble PPT] + 2NaCl(aq)\nPb(NO3)2(aq) + 2KI(aq) ➔ PbI2(s) [Yellow PPT] + 2KNO3(aq)',
          right_side: 'Precipitate Definition:\nAn insoluble solid that separates out from the solution during a chemical reaction.'
        },
        intuitive_analogy: 'Partner swapping at a dance: In single displacement, an energetic dancer cuts in and takes over. In double displacement, two couples politely swap partners simultaneously!',
        real_world_examples: ['Purification of copper by displacement', 'Water softening using precipitation reactions'],
        in_class_check_questions: [
          {
            question: 'Will a reaction occur if copper metal is dipped into ferrous sulphate solution?',
            expected_answer: 'No, because copper is less reactive than iron and cannot displace it.'
          }
        ],
        weak_student_remedy: 'Musical chairs analogy: Stronger kid takes the chair in single displacement. Double displacement is two pairs swapping hats.',
        common_mistakes_and_fixes: [
          {
            mistake: 'Students think the blue color simply disappears.',
            correction: 'Clarify that it changes to pale green due to the formation of Ferrous Sulphate (FeSO4).'
          }
        ],
        teacher_delivery_tips: 'Keep an iron nail in CuSO4 solution at the beginning of the period so students see the vivid color change live by mid-class.'
      },
      {
        topic_name: 'Oxidation, Reduction & Redox Mechanics (Agent Matrix)',
        source_reference: 'NCERT Science Class 10, Section 1.2.5 (Pages 12-13)',
        what_to_teach: 'Classical & modern definitions: Oxidation (gain of oxygen / loss of hydrogen / loss of electrons) and Reduction (loss of oxygen / gain of hydrogen / gain of electrons). Redox reactions: Both processes happen simultaneously. Step-by-step identification matrix: 1. Substance oxidized, 2. Substance reduced, 3. Oxidizing agent, 4. Reducing agent. Landmark equations: CuO + H2 -> Cu + H2O, ZnO + C -> Zn + CO, MnO2 + 4HCl -> MnCl2 + 2H2O + Cl2.',
        verbatim_teacher_script: 'Listen carefully, because this is where 60% of students lose marks on exams! Oxidation means gaining Oxygen or losing Hydrogen. Reduction means losing Oxygen or gaining Hydrogen. But here is the trick: they never happen alone. If someone loses oxygen, someone ELSE must take it! That is why we call it RED-OX (Reduction + Oxidation). And here is the golden secret to never get confused: The substance that gets oxidized is the REDUCING AGENT. The substance that gets reduced is the OXIDIZING AGENT. Think of a travel agent: a travel agent gives tickets to others; an oxidizing agent gives oxygen to others!',
        how_to_explain_step_by_step: [
          'Step 1 (Clear Definitions): Write +O / -H (Oxidation) and -O / +H (Reduction) in two columns.',
          'Step 2 (Color Arrow Mapping): Draw CuO + H2 -> Cu + H2O on board. Draw an arrow from CuO to Cu (losing O = Reduction). Draw an arrow from H2 to H2O (gaining O = Oxidation).',
          'Step 3 (The 4-Quadrant Matrix): Fill 4 blanks: Substance Oxidized, Substance Reduced, Oxidizing Agent, Reducing Agent.'
        ],
        blackboard_layout: {
          left_side: 'Definitions:\nOxidation: +O or -H\nReduction: -O or +H\nRedox: Both happen together',
          center: 'Redox Arrow Mapping:\n       ┌─── Gained Oxygen (Oxidation) ───┐\n       │                                 ▼\n      CuO(s)    +    H2(g)    ➔    Cu(s)  +  H2O(l)\n       │                                 ▲\n       └─── Lost Oxygen (Reduction) ─────┘\n\nIdentification Matrix:\n• Substance Oxidized = H2\n• Substance Reduced = CuO\n• Oxidizing Agent = CuO (Gave oxygen)\n• Reducing Agent = H2 (Took oxygen)',
          right_side: 'Golden Rule:\nSubstance Oxidized ➔ Reducing Agent\nSubstance Reduced ➔ Oxidizing Agent\n(Always pick from Reactant side only!)'
        },
        intuitive_analogy: 'Passing a hot potato: The person who tosses away oxygen is reduced, and the person catching the oxygen is oxidized. They cannot play without each other!',
        real_world_examples: ['Cellular respiration burning glucose to release life energy', 'Photosynthesis in green plants (reduction of CO2 into glucose)'],
        in_class_check_questions: [
          {
            question: 'In the reaction ZnO + C -> Zn + CO, which substance acts as the reducing agent?',
            expected_answer: 'Carbon (C), because it gains oxygen and gets oxidized to CO.'
          }
        ],
        weak_student_remedy: 'Remind them: Agents are ALWAYS on the left side of the arrow (reactants)! Never pick a product as an oxidizing or reducing agent.',
        common_mistakes_and_fixes: [
          {
            mistake: 'Picking products (like Cu or H2O) as oxidizing or reducing agents.',
            correction: 'Hammer this rule: "Agents are hired before the reaction starts! They are ALWAYS on the Reactant (LHS) side."'
          }
        ],
        teacher_delivery_tips: 'Draw curved arrows with two different colored chalks/markers connecting reactants directly to their products.'
      },
      {
        topic_name: 'Everyday Redox: Corrosion Prevention & Rancidity Preservation',
        source_reference: 'NCERT Science Class 10, Section 1.3 (Pages 13-14)',
        what_to_teach: 'Corrosion: Definition, conditions needed (oxygen + moisture). Rusting of iron formula (Fe2O3.xH2O). Tarnishing of silver (black Ag2S coating). Corrosion of copper (green basic copper carbonate CuCO3.Cu(OH)2). Prevention: Painting, greasing, galvanization (zinc coating), electroplating, alloys (stainless steel). Rancidity: Aerial oxidation of fats/oils causing unpleasant smell/taste. Prevention: Flushing with unreactive nitrogen gas, vacuum packing, airtight jars, antioxidants (BHA/BHT). Board exam workshop: Identifying unknown compounds X, Y, Z and multi-step reaction reasoning.',
        verbatim_teacher_script: 'Students, oxidation doesn\'t just happen in laboratory test tubes. It is happening in your kitchen, on your bicycle, and even inside your snack cupboard! When iron sits outside in rainy season, oxygen and water attack it, creating brittle brown rust (Fe2O3.xH2O). When you open a pack of potato chips that expired months ago, it smells disgusting and tastes oily. That is Rancidity — aerial oxidation of fats and oils! Why do chip packets look like balloons? Because manufacturers flush out reactive oxygen and fill them with unreactive Nitrogen gas to keep your chips crunchy and safe!',
        how_to_explain_step_by_step: [
          'Step 1 (Corrosion Concept): Define corrosion; emphasize both Air (O2) AND Moisture (H2O) are required for rusting of iron.',
          'Step 2 (Other Metal Coatings): Black coating on Silver (Ag2S) and Green coating on Copper (Basic copper carbonate).',
          'Step 3 (Prevention & Rancidity): Explain Galvanization (zinc sacrificial layer) and Nitrogen packaging / airtight storage / antioxidants.'
        ],
        blackboard_layout: {
          left_side: 'Corrosion Conditions:\n1. Oxygen (Air)\n2. Moisture (Water)\nBoth are mandatory!',
          center: 'Formulas & Coatings:\n• Rust: Fe2O3.xH2O [Hydrated Ferric Oxide]\n• Silver Tarnish: Ag2S [Black Silver Sulphide]\n• Copper Corrosion: CuCO3.Cu(OH)2 [Green Basic Copper Carbonate]\n\nPrevention:\n• Galvanization (Zinc coating Zn)\n• Painting / Greasing / Electroplating\n• Stainless Steel Alloys',
          right_side: 'Rancidity:\n• Oxidation of fats & oils\n• Causes foul odor and bad taste\n\nRemedies:\n1. Nitrogen gas flushing\n2. Vacuum packaging\n3. Airtight containers\n4. Antioxidants (BHA/BHT)'
        },
        intuitive_analogy: 'Nitrogen gas in chips bags acts like an invisible bodyguard, keeping aggressive oxygen molecules away from crispy oils so chips stay fresh and crunchy for months!',
        real_world_examples: ['Galvanized iron roofing sheets', 'Nitrogen-flushed potato chips bags (Lays, Kurkure)', 'Silver jewelry turning black over time'],
        in_class_check_questions: [
          {
            question: 'Why do potato chips manufacturers flush bags of chips with nitrogen gas?',
            expected_answer: 'Nitrogen is an unreactive gas that prevents oxidation and rancidity of oils and fats in the chips.'
          },
          {
            question: 'What is the chemical formula of rust on iron?',
            expected_answer: 'Hydrated ferric oxide: Fe2O3.xH2O.'
          }
        ],
        weak_student_remedy: 'The Umbrella Metaphor: Galvanization with zinc is like putting a raincoat on iron. Zinc sacrifices itself so iron stays intact.',
        common_mistakes_and_fixes: [
          {
            mistake: 'Saying iron rusts because of water alone.',
            correction: 'Emphasize that BOTH dry oxygen AND liquid water are strictly necessary (NCERT test tube experiment with anhydrous calcium chloride).'
          }
        ],
        teacher_delivery_tips: 'Hold up an actual potato chips packet in class to hook attention on the first second of the rancidity explanation.'
      }
    ]
  },
  mandatory_notes: {
    heading: 'Compulsory Classroom Notebook Notes — Board Standard',
    instructions_for_students: 'Every student must copy these exact definitions, balanced equations, and observation tables in their fair science notebook.',
    unmissable_important_notes_and_facts: [
      {
        fact: 'Mass can neither be created nor destroyed in a chemical reaction (Antoine Lavoisier, 1789). Consequently, total mass of elements on reactant side MUST equal total mass of elements on product side.',
        why_unmissable: 'Zero marks if equation is unbalanced; foundational rule for all stoichiometry in board exams.',
        exam_weightage: 'Guaranteed 2-3 Marks in every board paper',
        memory_anchor: 'Rule: Never change chemical formula subscripts; only alter prefix coefficients!'
      },
      {
        fact: 'Quick lime (CaO) + Water (H2O) -> Slaked lime [Ca(OH)2] + Enormous Heat. Slaked lime applied to walls reacts with atmospheric CO2 over 2-3 days forming shiny Calcium Carbonate (CaCO3).',
        why_unmissable: 'Top favorite CBSE/Board exam "Substance X and Y" identification problem asked in alternate years.',
        exam_weightage: '3 to 5 Marks Case/Reasoning Question',
        memory_anchor: 'X = CaO (white powder, hissing sound) -> Y = Ca(OH)2 (whitewash liquid) -> Z = CaCO3 (shiny marble layer).'
      },
      {
        fact: 'Lead Nitrate [2Pb(NO3)2] on heating undergoes thermal decomposition yielding 2PbO (yellow residue), 4NO2 (pungent reddish-brown fumes), and O2 gas.',
        why_unmissable: 'Frequent practical-based board question on gas observation and residue color identification.',
        exam_weightage: '2 to 3 Marks Board Practical/Theory',
        memory_anchor: 'Brown Fumes = Nitrogen Dioxide (NO2); Yellow solid = Lead Monoxide (PbO).'
      },
      {
        fact: 'In Redox: Substance gaining oxygen or losing hydrogen is OXIDIZED (acts as Reducing Agent). Substance losing oxygen or gaining hydrogen is REDUCED (acts as Oxidizing Agent).',
        why_unmissable: 'Students frequently invert oxidizing/reducing agents in MnO2 + 4HCl and CuO + H2 reactions.',
        exam_weightage: '3 Marks Board Standard',
        memory_anchor: 'Remember: Reducing Agent undergoes Oxidation; Oxidizing Agent undergoes Reduction!'
      }
    ],
    words_meanings_and_daily_usage: [
      {
        word: 'Precipitate',
        meaning: 'An insoluble solid that separates from a solution during a liquid chemical reaction.',
        contextual_meaning: 'In double displacement reactions, when aqueous solutions of two ionic salts exchange ions, one insoluble product settles down as a precipitate.',
        daily_life_usage_example: 'When hard tap water is boiled with detergent or curd curdles in warm milk, the curdled white solid particles form a natural precipitate.',
        synonyms: ['Insoluble residue', 'Sediment', 'Deposit']
      },
      {
        word: 'Exothermic',
        meaning: 'Characterized by or causing the liberation and release of thermal energy (heat).',
        contextual_meaning: 'Reactions in which chemical bonds formed in products release more heat energy than was absorbed to break reactant bonds.',
        daily_life_usage_example: 'Instant hand warmers used in winter trekking produce soothing heat through the spontaneous exothermic oxidation of iron powder with air.',
        synonyms: ['Heat-releasing', 'Heat-generating', 'Thermal-emitting']
      },
      {
        word: 'Rancidity',
        meaning: 'The unpleasant odor and foul taste developed in oils and fatty foods due to aerial oxidation.',
        contextual_meaning: 'Slow aerial oxidation of unsaturated fatty acids and lipid molecules over prolonged exposure to oxygen and sunlight.',
        daily_life_usage_example: 'Potato chips left open overnight become stale, soggy, and smell bitter due to oxidative rancidity of frying oil.',
        synonyms: ['Spoilage', 'Staleness', 'Lipid oxidation']
      },
      {
        word: 'Corrosion',
        meaning: 'The slow, progressive deterioration and eating away of a metal by atmospheric moisture, oxygen, or acids.',
        contextual_meaning: 'Electrochemical oxidation of refined metals into their more chemically stable oxides, carbonates, or sulphides.',
        daily_life_usage_example: 'Iron window grills developing flaky reddish-brown rust (hydrated ferric oxide) during rainy monsoon seasons.',
        synonyms: ['Rusting', 'Oxidation wear', 'Atmospheric decay']
      }
    ],
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
    day_wise_assignments: [
      {
        day_number: 1,
        day_title: 'Observing Chemical Changes & Word Equations',
        topic_focus: 'Chemical reaction indicators & skeletal equations',
        classwork: [
          {
            q_no: 1,
            question: 'Why should a magnesium ribbon be cleaned with sandpaper before burning in air?',
            marks: 2,
            solution_hints: 'To remove the protective layer of basic magnesium carbonate/oxide formed by slow reaction with air.'
          },
          {
            q_no: 2,
            question: 'Write the word equation and identify reactants and products when zinc granules react with dilute sulphuric acid.',
            marks: 2,
            solution_hints: 'Zinc + Sulphuric Acid -> Zinc Sulphate + Hydrogen gas. Evolution of bubbles and heat confirms reaction.'
          }
        ],
        homework: [
          {
            level: 'Basic',
            question: 'List four distinct observable characteristics that confirm a chemical reaction has taken place.',
            marks: 2,
            guided_clue: 'Think of temperature rise, evolution of gas bubbles, color change, or precipitate formation.'
          },
          {
            level: 'Standard',
            question: 'Write a balanced chemical equation with state symbols for: Barium chloride reacts with aluminium sulphate to give aluminium chloride and a precipitate of barium sulphate.',
            marks: 3,
            guided_clue: '3BaCl2(aq) + Al2(SO4)3(aq) -> 3BaSO4(s) + 2AlCl3(aq).'
          },
          {
            level: 'Brain-Teaser (HOTS)',
            question: 'Why is photosynthesis considered an endothermic reaction whereas respiration is exothermic? Explain using the concept of energy exchange.',
            marks: 5,
            guided_clue: 'Compare sunlight energy absorption by chlorophyll vs glucose oxidation releasing ATP energy.'
          }
        ],
        estimated_time_mins: 30
      },
      {
        day_number: 2,
        day_title: 'Balancing Chemical Equations Mastery',
        topic_focus: 'Law of Conservation of Mass & Step-by-Step Balancing Method',
        classwork: [
          {
            q_no: 1,
            question: 'Balance: Fe + H2O -> Fe3O4 + H2. Show atom inventory table.',
            marks: 2,
            solution_hints: '3Fe + 4H2O -> Fe3O4 + 4H2. Element table: Fe (3 vs 3), H (8 vs 8), O (4 vs 4).'
          },
          {
            q_no: 2,
            question: 'Translate and balance: Hydrogen gas combines with nitrogen to form ammonia.',
            marks: 2,
            solution_hints: 'N2(g) + 3H2(g) -> 2NH3(g).'
          }
        ],
        homework: [
          {
            level: 'Basic',
            question: 'Why must a chemical equation always be balanced? Which fundamental physical law does it satisfy?',
            marks: 2,
            guided_clue: 'Antoine Lavoisier Law of Conservation of Mass — atoms cannot be created or destroyed.'
          },
          {
            level: 'Standard',
            question: 'Balance the following: (a) HNO3 + Ca(OH)2 -> Ca(NO3)2 + H2O, (b) NaOH + H2SO4 -> Na2SO4 + H2O.',
            marks: 3,
            guided_clue: 'Notice polyatomic nitrate (NO3) and sulphate (SO4) groups balance together.'
          },
          {
            level: 'Brain-Teaser (HOTS)',
            question: 'A student writes: H2 + O2 -> H2O2 as the equation for water formation because it is already balanced. Explain two conceptual flaws in this logic.',
            marks: 5,
            guided_clue: 'H2O2 is hydrogen peroxide, not water (H2O). Formula subscripts cannot be altered to satisfy balancing.'
          }
        ],
        estimated_time_mins: 35
      },
      {
        day_number: 3,
        day_title: 'Combination Reactions & Whitewashing Chemistry',
        topic_focus: 'Combination reactions, Slaking of lime, Exothermic processes',
        classwork: [
          {
            q_no: 1,
            question: 'Define combination reaction with two industrial examples.',
            marks: 2,
            solution_hints: 'Two or more reactants unite to form a single product. CaO + H2O -> Ca(OH)2 and C + O2 -> CO2.'
          },
          {
            q_no: 2,
            question: 'Why does a solution of slaked lime turn milky when breath is exhaled through it?',
            marks: 2,
            solution_hints: 'CO2 from breath reacts with Ca(OH)2 forming insoluble white CaCO3 precipitate.'
          }
        ],
        homework: [
          {
            level: 'Basic',
            question: 'Write the chemical name and formula for quicklime and slaked lime.',
            marks: 2,
            guided_clue: 'Quicklime = Calcium oxide (CaO); Slaked lime = Calcium hydroxide [Ca(OH)2].'
          },
          {
            level: 'Standard',
            question: 'Explain why whitewashed walls get a shiny white finish only after 2 to 3 days and not immediately.',
            marks: 3,
            guided_clue: 'Slow atmospheric carbonation converts Ca(OH)2 into a thin crystal film of CaCO3.'
          },
          {
            level: 'Brain-Teaser (HOTS)',
            question: 'A baker mixes water with quicklime in a steel vessel. The mixture boils violently without any burner. Identify the type of reaction, write the balanced equation, and explain why this cannot be stored in plastic containers.',
            marks: 5,
            guided_clue: 'Vigorous exothermic combination reaction releasing extreme heat melting standard plastics.'
          }
        ],
        estimated_time_mins: 35
      },
      {
        day_number: 4,
        day_title: 'Decomposition Reactions (Thermal, Electrolytic, Photolytic)',
        topic_focus: 'Endothermic breakdown reactions & energy sources',
        classwork: [
          {
            q_no: 1,
            question: 'What is observed when green ferrous sulphate crystals are heated strongly in a dry boiling tube?',
            marks: 2,
            solution_hints: 'Color changes from pale green to reddish-brown (Fe2O3) and choking smell of burning sulphur (SO2 + SO3).'
          },
          {
            q_no: 2,
            question: 'Why is the volume of gas collected over one electrode twice that over the other during electrolysis of water?',
            marks: 2,
            solution_hints: 'Water molecule has 2 atoms of Hydrogen for every 1 atom of Oxygen (H2O stoichiometry).'
          }
        ],
        homework: [
          {
            level: 'Basic',
            question: 'Why are decomposition reactions called the exact opposite of combination reactions?',
            marks: 2,
            guided_clue: 'A single reactant breaks down into two or more simpler products requiring heat, light, or electricity.'
          },
          {
            level: 'Standard',
            question: 'Solid lead nitrate is heated in a test tube. (a) State the color of fumes evolved. (b) State the color of residue left. (c) Write balanced chemical equation.',
            marks: 3,
            guided_clue: 'Brown NO2 fumes, yellow PbO residue. 2Pb(NO3)2 -> 2PbO + 4NO2 + O2.'
          },
          {
            level: 'Brain-Teaser (HOTS)',
            question: 'Silver chloride is stored in dark brown glass bottles in chemistry laboratories. What happens if it is exposed to direct sunlight? Write the balanced equation and practical application.',
            marks: 5,
            guided_clue: 'Photolytic decomposition: 2AgCl -> 2Ag (grey metal) + Cl2(g). Used in black-and-white photography.'
          }
        ],
        estimated_time_mins: 35
      },
      {
        day_number: 5,
        day_title: 'Displacement & Double Displacement Reactions',
        topic_focus: 'Reactivity series, single replacement, precipitation & ion exchange',
        classwork: [
          {
            q_no: 1,
            question: 'What happens when an iron nail is immersed in copper sulphate solution for 20 minutes? Write the balanced equation.',
            marks: 2,
            solution_hints: 'Blue solution fades to pale light green (FeSO4) and reddish-brown copper deposits on the iron nail.'
          },
          {
            q_no: 2,
            question: 'Differentiate between displacement and double displacement reactions with one equation each.',
            marks: 2,
            solution_hints: 'Displacement: More reactive element displaces less reactive. Double displacement: Mutual exchange of ions between two aqueous compounds.'
          }
        ],
        homework: [
          {
            level: 'Basic',
            question: 'Can copper displace iron from iron sulphate solution? Give reasons based on reactivity.',
            marks: 2,
            guided_clue: 'No, because Copper is placed below Iron in the chemical reactivity series.'
          },
          {
            level: 'Standard',
            question: 'On mixing aqueous sodium sulphate and barium chloride: (a) What is the precipitate color? (b) Name the precipitate. (c) Write the ionic balanced equation.',
            marks: 3,
            guided_clue: 'White precipitate of Barium Sulphate: Na2SO4 + BaCl2 -> BaSO4(s) + 2NaCl.'
          },
          {
            level: 'Brain-Teaser (HOTS)',
            question: 'A student mixes solution A (lead nitrate) with solution B (potassium iodide). (i) State the color and chemical formula of the precipitate formed. (ii) Name the type of reaction. (iii) Write balanced equation. (iv) Is this a redox reaction? Justify.',
            marks: 5,
            guided_clue: 'Bright yellow precipitate of Lead Iodide (PbI2). Double displacement / precipitation reaction; oxidation states do not change, so not redox.'
          }
        ],
        estimated_time_mins: 40
      },
      {
        day_number: 6,
        day_title: 'Oxidation, Reduction & Redox Mechanics',
        topic_focus: 'Redox reactions, Oxidizing and reducing agents, Electronic & oxygen transfer',
        classwork: [
          {
            q_no: 1,
            question: 'Identify substance oxidized, substance reduced, oxidizing agent, and reducing agent in: CuO + H2 -> Cu + H2O.',
            marks: 2,
            solution_hints: 'CuO loses O -> Reduced (Oxidizing Agent). H2 gains O -> Oxidized (Reducing Agent).'
          },
          {
            q_no: 2,
            question: 'In the reaction: MnO2 + 4HCl -> MnCl2 + 2H2O + Cl2, which substance is oxidized and which is the reducing agent?',
            marks: 2,
            solution_hints: 'HCl loses hydrogen to become Cl2 -> HCl is oxidized (HCl is the reducing agent).'
          }
        ],
        homework: [
          {
            level: 'Basic',
            question: 'Define Oxidation and Reduction in terms of gain and loss of oxygen and hydrogen.',
            marks: 2,
            guided_clue: 'Oxidation = Gain of O or Loss of H; Reduction = Gain of H or Loss of O.'
          },
          {
            level: 'Standard',
            question: 'A shiny reddish-brown metal "X" turns black on heating in open air. When hydrogen gas is passed over this hot black substance, it regains its reddish-brown color. Identify X, the black substance, and write both balanced equations.',
            marks: 3,
            guided_clue: 'X = Copper (Cu); Black substance = Copper(II) Oxide (CuO). 2Cu + O2 -> 2CuO; CuO + H2 -> Cu + H2O.'
          },
          {
            level: 'Brain-Teaser (HOTS)',
            question: 'Zinc oxide reacts with carbon: ZnO + C -> Zn + CO. (a) Identify substance reduced. (b) Identify reducing agent. (c) Explain why carbon is vital in metal extraction metallurgy based on this reaction.',
            marks: 5,
            guided_clue: 'ZnO is reduced to Zn; Carbon is oxidized to CO (reducing agent). Carbon removes oxygen from metal oxide to yield pure free metal.'
          }
        ],
        estimated_time_mins: 35
      },
      {
        day_number: 7,
        day_title: 'Corrosion, Rancidity & Everyday Impact of Redox',
        topic_focus: 'Everyday redox consequences, rusting prevention, food preservation',
        classwork: [
          {
            q_no: 1,
            question: 'Why are potato chips packets flushed with unreactive nitrogen gas?',
            marks: 2,
            solution_hints: 'Nitrogen creates an inert antioxidant atmosphere preventing aerial oxidation of fats and oils (rancidity).'
          },
          {
            q_no: 2,
            question: 'Name the green coating formed on copper utensils and black coating formed on silver ornaments when exposed to air.',
            marks: 2,
            solution_hints: 'Copper = Basic copper carbonate [CuCO3.Cu(OH)2]; Silver = Silver sulphide (Ag2S).'
          }
        ],
        homework: [
          {
            level: 'Basic',
            question: 'What is rancidity? Name two common synthetic antioxidant food additives used in industry.',
            marks: 2,
            guided_clue: 'Spontaneous oxidation of fats/oils causing foul odor/taste. Antioxidants: BHA and BHT.'
          },
          {
            level: 'Standard',
            question: 'Explain three distinct chemical and physical methods used to prevent the rusting of iron structures.',
            marks: 3,
            guided_clue: 'Galvanization (sacrificial zinc coating), painting/greasing (barrier method), and alloying (stainless steel).'
          },
          {
            level: 'Brain-Teaser (HOTS)',
            question: 'An iron bridge in a coastal port corrodes five times faster than an identical iron bridge in a dry desert city. Explain the electrochemical conditions accelerating corrosion in coastal zones, write the rust formula, and propose the best protection.',
            marks: 5,
            guided_clue: 'High humidity + dissolved salt electrolytes (NaCl) in seawater mist accelerate electrochemical rusting. Rust = Fe2O3.xH2O. Galvanization or cathodic protection.'
          }
        ],
        estimated_time_mins: 35
      }
    ],
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
  revision_test_plan: {
    detailed_chapter_analysis_summary: `NCERT Class 10 Chapter 1 "Chemical Reactions and Equations" establishes the bedrock of secondary school chemical science. A chemical reaction represents a transformation in which chemical bonds between reactant atoms are broken and new bonds are formed to yield products with entirely distinct chemical identities and physical properties. 

Core Observational Indicators:
1. Change in State: Formation of liquid water from hydrogen and oxygen gases.
2. Change in Color: Rusting of iron or turning of blue copper sulphate solution to light green when iron is added.
3. Evolution of a Gas: Vigorous effervescence of hydrogen gas when granulated zinc reacts with dilute sulphuric acid ($Zn + H_2SO_4 \\rightarrow ZnSO_4 + H_2 \\uparrow$).
4. Change in Temperature: Exothermic temperature spike when quicklime reacts with water, or endothermic chilling during ammonium chloride dissolution.
5. Formation of a Precipitate: Insoluble barium sulphate ($BaSO_4$) precipitation upon mixing sodium sulphate and barium chloride solutions.

Conservation of Mass & Stoichiometry:
Antoine Lavoisier's Law of Conservation of Mass dictates that matter can neither be created nor destroyed in a chemical reaction. Therefore, the total number of atoms of each individual element present in the reactants MUST strictly equal the total number of atoms in the products. Equations are balanced by altering prefix stoichiometric coefficients; formula subscripts are immutable.

The 5 Classical Reaction Archetypes:
1. Combination Reactions: Two or more reactants combine to yield a solitary product ($A + B \\rightarrow AB$). Archetype: $CaO(s) + H_2O(l) \\rightarrow Ca(OH)_2(aq) + \\text{Heat}$.
2. Decomposition Reactions: A solitary compound breaks down into two or more simpler fragments ($AB \\rightarrow A + B$). Strictly endothermic, driven by Heat (Thermal: $2FeSO_4 \\rightarrow Fe_2O_3 + SO_2 + SO_3$), Electricity (Electrolytic: $2H_2O \\xrightarrow{\\text{electric current}} 2H_2 + O_2$), or Sunlight (Photolytic: $2AgCl \\xrightarrow{h\\nu} 2Ag + Cl_2$).
3. Displacement Reactions: A more electrochemically reactive element displaces a less reactive element from its aqueous salt solution ($Fe + CuSO_4 \\rightarrow FeSO_4 + Cu$).
4. Double Displacement (Precipitation): Mutual interchange of ions between two aqueous ionic electrolytes ($Na_2SO_4 + BaCl_2 \\rightarrow BaSO_4\\downarrow + 2NaCl$).
5. Redox Reactions (Oxidation-Reduction): Simultaneous transfer of oxygen/hydrogen or electrons. The substance gaining oxygen/losing electrons is oxidized (reducing agent); the substance losing oxygen/gaining electrons is reduced (oxidizing agent). Everyday consequences encompass Corrosion of structural metals ($Fe_2O_3 \\cdot xH_2O$) and Rancidity of unsaturated dietary lipids, counteracted by inert packaging ($N_2$ gas flushing) and chemical antioxidants.`,
    detailed_important_notes: [
      {
        category: 'Foundational Law',
        note_title: 'Law of Conservation of Mass & Stoichiometric Invariance',
        key_principles: [
          'Total mass of reactants before reaction strictly equals total mass of products after reaction.',
          'The number of atoms of each element remains identical on both sides of a balanced equation.',
          'Subscripts in chemical formulas represent fixed molecular valencies and cannot ever be modified during balancing.'
        ],
        board_special_highlight: 'Always write physical state notations: (s) for solid, (l) for liquid, (g) for gas, and (aq) for aqueous solution.'
      },
      {
        category: 'Whitewashing Chemistry Cycle',
        note_title: 'The Industrial Quicklime - Slaked Lime - Limestone Triad',
        key_principles: [
          'Quick Lime [CaO] reacts violently with water in a highly exothermic reaction forming Slaked Lime [Ca(OH)2].',
          'Slaked lime applied to walls reacts slowly with atmospheric carbon dioxide over 2 to 3 days.',
          'Forms a brilliant, shiny, protective white layer of Calcium Carbonate [CaCO3] on the surface.'
        ],
        board_special_highlight: 'Guaranteed 3-mark board question: "Substance X used in whitewashing... name X, write reaction with water and CO2."'
      },
      {
        category: 'Decomposition Mechanics',
        note_title: 'Thermal & Photolytic Color Transformations',
        key_principles: [
          'Green ferrous sulphate crystals ($FeSO_4 \\cdot 7H_2O$) lose water of crystallization on gentle heating to turn white ($FeSO_4$), then decompose on strong heating into reddish-brown ferric oxide ($Fe_2O_3$) with suffocating fumes of $SO_2$ and $SO_3$.',
          'White lead nitrate [$2Pb(NO_3)_2$] decomposes on heating into yellow lead monoxide ($PbO$), pungent reddish-brown fumes of nitrogen dioxide ($NO_2$), and oxygen gas.',
          'White silver chloride turns grey in sunlight due to photolytic decomposition: $2AgCl \\rightarrow 2Ag + Cl_2$.'
        ],
        board_special_highlight: 'Examiners award marks specifically for identifying the color of fumes and the color of the solid residue.'
      },
      {
        category: 'Redox Differentiation',
        note_title: 'Oxidation, Reduction, Oxidizing & Reducing Agents',
        key_principles: [
          'Oxidation: Addition of oxygen OR removal of hydrogen.',
          'Reduction: Addition of hydrogen OR removal of oxygen.',
          'The substance that undergoes oxidation acts as the Reducing Agent.',
          'The substance that undergoes reduction acts as the Oxidizing Agent.'
        ],
        board_special_highlight: 'In $MnO_2 + 4HCl \\rightarrow MnCl_2 + 2H_2O + Cl_2$: $MnO_2$ is reduced (Oxidizing Agent); $HCl$ is oxidized to $Cl_2$ (Reducing Agent).'
      }
    ],
    comprehensive_chapter_qa: [
      {
        q_no: 1,
        question_number: 1,
        type: 'Short Answer (2M)',
        marks_category: '2 Marks (Short Answer)',
        question: 'Why does the color of copper sulphate solution change when an iron nail is dipped in it? Write the balanced chemical equation.',
        detailed_model_answer: 'When an iron nail is dipped in copper sulphate solution, iron is more chemically reactive than copper according to the reactivity series of metals. Iron displaces copper from its blue copper sulphate ($CuSO_4$) solution to form pale green ferrous sulphate ($FeSO_4$) solution. The displaced copper metal is deposited as a reddish-brown coating on the iron nail.\n\nBalanced Chemical Equation:\n$$Fe(s) + CuSO_4(aq) \\rightarrow FeSO_4(aq) + Cu(s)$$\n(Blue Solution) \\quad\\quad\\quad (Light Green Solution) + (Reddish-brown deposit)',
        marks: 2,
        key_points_for_full_marks: [
          'Mentioning that Iron is more reactive than Copper (0.5 Mark)',
          'Stating color transition from blue to pale light green and reddish-brown deposit (0.5 Mark)',
          'Correct balanced equation with physical state symbols (1 Mark)'
        ],
        marking_scheme_breakdown: [
          '1 Mark for correct balanced chemical equation with states',
          '1 Mark for mentioning displacement reaction and color change from blue to green'
        ],
        common_pitfall_warning: 'Do not write that copper reacts with iron. Copper is displaced, not oxidized into an iron compound.'
      },
      {
        q_no: 2,
        question_number: 2,
        type: 'Standard Conceptual (3M)',
        marks_category: '3 Marks (Conceptual / Equation)',
        question: 'A shiny brown-colored element "X" on heating in air becomes black in color. (a) Name the element "X" and the black colored compound formed. (b) Write the balanced chemical equation for the reaction. (c) What happens when hydrogen gas is passed over this hot black substance? Write the equation.',
        detailed_model_answer: '(a) Identification:\n• The shiny brown-colored element "X" is Copper ($Cu$).\n• The black colored compound formed is Copper(II) Oxide ($CuO$).\n\n(b) Equation for Blackening on Heating in Air:\n$$2Cu(s) + O_2(g) \\xrightarrow{\\Delta} 2CuO(s)$$\n(Brown Metal) \\quad\\quad\\quad (Black Solid)\n\n(c) Reaction with Hydrogen Gas:\nWhen hydrogen gas is passed over heated black copper(II) oxide, the black coating turns brown again because hydrogen reduces copper(II) oxide back to metallic copper:\n$$CuO(s) + H_2(g) \\xrightarrow{\\Delta} Cu(s) + H_2O(g)$$\n(Black Solid) \\quad\\quad\\quad\\quad (Brown Metal)',
        marks: 3,
        key_points_for_full_marks: [
          'Correct identification of X as Copper and black compound as CuO (1 Mark)',
          'Balanced oxidation equation $2Cu + O_2 \\rightarrow 2CuO$ (1 Mark)',
          'Reverse reduction equation $CuO + H_2 \\rightarrow Cu + H_2O$ and color return (1 Mark)'
        ],
        marking_scheme_breakdown: [
          '1 Mark: Correct identification of X and CuO',
          '1 Mark: Balanced equation for oxidation of copper',
          '1 Mark: Balanced equation for reduction of copper(II) oxide'
        ],
        common_pitfall_warning: 'Do not write Copper(I) Oxide ($Cu_2O$) which is red; the black product is strictly Copper(II) Oxide ($CuO$).'
      },
      {
        q_no: 3,
        question_number: 3,
        type: 'Long Analytical (5M)',
        marks_category: '5 Marks (Long / Analytical)',
        question: '(a) Differentiate between displacement and double displacement reactions with one balanced equation each. (b) What happens when lead nitrate powder is heated in a boiling tube? Write observations and balanced chemical equation. (c) Explain why potato chips packets are flushed with nitrogen gas and name the chemical phenomenon involved.',
        detailed_model_answer: `(a) Differentiation between Displacement and Double Displacement:
• Displacement Reaction: A reaction in which a more reactive element displaces a less reactive element from its aqueous salt solution.
  $$Zn(s) + CuSO_4(aq) \\rightarrow ZnSO_4(aq) + Cu(s)$$
• Double Displacement Reaction: A reaction in which two different ionic compounds in aqueous solution exchange their ions mutually to form two new compounds, one of which is usually an insoluble precipitate.
  $$Na_2SO_4(aq) + BaCl_2(aq) \\rightarrow BaSO_4(s)\\downarrow + 2NaCl(aq)$$
  (White precipitate of Barium Sulphate is formed)

(b) Heating of Lead Nitrate:
• Observations:
  1. Evolution of pungent, reddish-brown fumes of Nitrogen Dioxide ($NO_2$) gas.
  2. A glowing splinter inserted near the mouth of the tube relights due to oxygen gas ($O_2$).
  3. A yellow solid residue of Lead(II) Monoxide ($PbO$) remains in the boiling tube.
• Balanced Chemical Equation:
  $$2Pb(NO_3)_2(s) \\xrightarrow{\\Delta} 2PbO(s) + 4NO_2(g) + O_2(g)$$

(c) Preservation of Potato Chips & Nitrogen Flushing:
• Phenomenon: The chemical phenomenon involved is Rancidity (aerial oxidation of unsaturated fats and vegetable oils leading to unpleasant foul odor and disagreeable taste).
• Reason for Flushing: Potato chips contain oils and fats. Nitrogen is an unreactive, inert gas that displaces oxygen from the package, creating an antioxidant environment that prevents aerial oxidation of the fats, thus preserving crunchiness, taste, and shelf-life.`,
        marks: 5,
        key_points_for_full_marks: [
          'Clear definition and balanced equations for displacement and double displacement (2 Marks)',
          'Lead nitrate heating observations (brown fumes, yellow residue) and balanced equation (2 Marks)',
          'Rancidity explanation and antioxidant role of inert Nitrogen gas (1 Mark)'
        ],
        marking_scheme_breakdown: [
          '2 Marks for Part (a): Definitions and balanced equations',
          '2 Marks for Part (b): Brown NO2 fumes observation + balanced thermal decomposition equation',
          '1 Mark for Part (c): Definition of Rancidity and nitrogen packaging mechanism'
        ],
        common_pitfall_warning: 'Do not balance lead nitrate with incorrect coefficients. Remember: 2 molecules of lead nitrate produce 2 PbO, 4 NO2, and 1 O2.'
      }
    ],
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
  const [selectedPlanDay, setSelectedPlanDay] = useState<number | 'all'>('all');
  const [selectedCwHwDay, setSelectedCwHwDay] = useState<number | 'all'>('all');

  const handleCopyDayPlan = (p: typeof suiteData.teaching_plan.periods[0]) => {
    const text = `Day ${p.period_number}: ${p.day_title}
Duration: ${p.duration_minutes} Mins
Target Learning Objective: ${p.learning_objective || 'N/A'}
Pedagogy Style: ${p.pedagogy_focus || 'N/A'}

1. KYA PADHANA HAI (TOPICS & CONCEPTS):
${p.topics_covered}

2. 45-MIN CLASS SCHEDULE:
${(p.time_breakdown || []).map((t) => `• [${t.minutes}m] ${t.phase}: ${t.activity}`).join('\n')}

3. BLACKBOARD & TEACHING PLAN:
${(p.blackboard_plan || []).map((bp, i) => `${i + 1}. ${bp}`).join('\n')}

4. INTUITIVE REAL-WORLD HOOK:
${p.intuitive_hook || 'N/A'}

5. DAILY PRACTICE TASK:
${p.daily_task || 'N/A'}`;

    navigator.clipboard.writeText(text);
    toast.success(`Copied Day ${p.period_number} plan to clipboard!`);
  };

  const [selectedGuideTopic, setSelectedGuideTopic] = useState<number | 'all'>('all');

  const handleCopyGuideScript = (t: typeof suiteData.teaching_guide.topics[0]) => {
    const text = `TOPIC: ${t.topic_name}
REFERENCE: ${t.source_reference || 'NCERT Textbook'}

📢 READY-TO-USE TEACHER SCRIPT (Class Me Yeh Boliye):
"${t.verbatim_teacher_script || t.how_to_explain}"

STEP-BY-STEP TEACHING METHOD:
${(t.how_to_explain_step_by_step || [t.how_to_explain]).map((s, i) => `${i + 1}. ${s}`).join('\n')}

INTUITIVE HOOK / ANALOGY:
${t.intuitive_analogy}

BLACKBOARD STRUCTURE:
• Left: ${t.blackboard_layout?.left_side || 'Key Terms'}
• Center: ${t.blackboard_layout?.center || 'Core Reactions & Derivation'}
• Right: ${t.blackboard_layout?.right_side || 'Exam Traps & Summary'}

REMEDY FOR WEAK/CONFUSED STUDENTS:
${t.weak_student_remedy || 'Break down formulas into simpler dots/elements.'}

COMMON MISTAKES & HOW TO FIX:
${t.common_mistakes_and_fixes.map((m) => `❌ Mistake: ${m.mistake}\n✓ Teacher Fix: ${m.correction}`).join('\n\n')}`;

    navigator.clipboard.writeText(text);
    toast.success(`Copied classroom delivery script for "${t.topic_name}"!`);
  };

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
      const res = await fetch(`${API_URL}/api/scans?chapter_id=${chapterId}`, {
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
    const activeChap = chaptersList.find((c) => c.id === selectedChapterId);
    const hasPdf = Boolean(activeChap?.has_pdf || activeChap?.pdf_url);
    const scanCount = useScannedTextbook ? chapterScans.length : 0;

    toast.info(
      `Generating complete 7-Core Teacher Lesson Suite for "${finalChapter}"${
        hasPdf
          ? ' (Grounded in Cloudflare Chapter PDF ☁️)'
          : scanCount > 0
          ? ` (Grounded in ${scanCount} scanned textbook pages)`
          : ''
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
          pdf_url: activeChap?.pdf_url || undefined,
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
            json.pdf_used || hasPdf
              ? ' (100% Grounded in Cloudflare Chapter PDF ☁️)'
              : scanCount > 0
              ? ` (Grounded in ${scanCount} textbook scans)`
              : ''
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

              {/* Cloudflare Chapter PDF Grounding Card */}
              {(() => {
                const activeChap = chaptersList.find((c) => c.id === selectedChapterId);
                const hasPdf = Boolean(activeChap?.has_pdf || activeChap?.pdf_url);
                if (hasPdf) {
                  return (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-emerald-500/15 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 text-blue-900 dark:text-blue-200">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-base shrink-0">
                          ☁️
                        </div>
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>Official Cloudflare Chapter PDF Connected</span>
                            <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-none text-[10px] font-bold">
                              Cloudflare R2 Direct Grounding
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Original chapter PDF is saved in Cloudflare. AI will read all pages, diagrams, formulas, and exercises directly from this textbook PDF.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border-emerald-500/30 text-xs px-2.5 py-1">
                          ✓ 100% PDF Grounded
                        </Badge>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

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
              ) : !chaptersList.find((c) => c.id === selectedChapterId)?.has_pdf ? (
                <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    No physical scans or PDF attached for this chapter. AI will generate standard NCERT / Board-aligned curriculum content.
                  </span>
                </div>
              ) : null}
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

        {/* 6-Core Module Sub-Tabs (Teaching Plan, Guide, Notes, Day-Wise CW+HW, PYQ, Chapter Mastery & Revision) */}
        <Tabs value={activeModuleTab} onValueChange={setActiveModuleTab} className="w-full space-y-4">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto p-1.5 bg-muted/80 rounded-2xl gap-1 border border-border shadow-2xs print:hidden">
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
              <span>4. Day-Wise CW + HW</span>
            </TabsTrigger>

            <TabsTrigger
              value="pyq"
              className="text-xs py-2 font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs flex items-center justify-center gap-1.5 cursor-pointer rounded-xl"
            >
              <History className="w-3.5 h-3.5" />
              <span>5. PYQ Analysis</span>
            </TabsTrigger>

            <TabsTrigger
              value="revision"
              className="text-xs py-2 font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs flex items-center justify-center gap-1.5 cursor-pointer rounded-xl"
            >
              <Award className="w-3.5 h-3.5" />
              <span>6. Chapter Mastery &amp; Revision</span>
            </TabsTrigger>
          </TabsList>

          {/* ========================================================================= */}
          {/* MODULE 1: 🗓️ Chapter Teaching Plan (Day 1 se Day 7 Detailed Roadmap) */}
          {/* ========================================================================= */}
          <TabsContent value="plan" className="space-y-4">
            <Card className="border-border shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      Module 1: 7-Day Chapter Teaching Roadmap &amp; Day-Wise Pedagogy
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Day 1 se Day 7 tak detailed breakdown • 45-min classroom flow • Blackboard plan • Intuitive hooks • Daily practice
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                    <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-bold text-xs px-2.5 py-1">
                      {suiteData.teaching_plan.periods.length} Days Structured Plan
                    </Badge>
                    <Badge variant="outline" className="text-xs font-semibold text-muted-foreground px-2.5 py-1">
                      <Clock className="w-3 h-3 mr-1 text-indigo-500" />
                      {suiteData.teaching_plan.periods.reduce((acc, p) => acc + (p.duration_minutes || 45), 0)} Mins Total
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Sequence Rationale Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/5 via-primary/5 to-transparent border border-indigo-200/60 dark:border-indigo-800/40 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-indigo-950 dark:text-indigo-300">
                    <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Pedagogical Sequence Rationale (Kyun Is Order Me Padhana Hai):</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed pl-6">
                    {suiteData.teaching_plan.sequence_rationale}
                  </p>
                </div>

                {/* Day-by-Day Quick Switcher & Stepper Filter */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5 text-primary" /> Select Day / Filter Timeline:
                    </span>
                    {selectedPlanDay !== 'all' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPlanDay('all')}
                        className="h-6 text-[11px] text-primary hover:text-primary/80 px-2 cursor-pointer"
                      >
                        View All Days
                      </Button>
                    )}
                  </div>

                  {/* Day Pills Filter */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      variant={selectedPlanDay === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPlanDay('all')}
                      className={`h-7 px-3 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                        selectedPlanDay === 'all'
                          ? 'bg-primary text-primary-foreground shadow-2xs'
                          : 'hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      All Days ({suiteData.teaching_plan.periods.length})
                    </Button>
                    {suiteData.teaching_plan.periods.map((p) => {
                      const isSelected = selectedPlanDay === p.period_number;
                      return (
                        <Button
                          key={p.period_number}
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedPlanDay(p.period_number)}
                          className={`h-7 px-3 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-2xs dark:bg-indigo-500'
                              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Day {p.period_number}
                        </Button>
                      );
                    })}
                  </div>

                  {/* 7-Day Mini-Map Stepper (Visual Progress) */}
                  <div className="hidden md:grid grid-cols-7 gap-1.5 pt-1">
                    {suiteData.teaching_plan.periods.slice(0, 7).map((p) => {
                      const isCurrent = selectedPlanDay === p.period_number;
                      const shortTitle = p.day_title.replace(/^Day \d+:\s*/i, '');
                      return (
                        <button
                          key={p.period_number}
                          onClick={() => setSelectedPlanDay(p.period_number)}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isCurrent
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-2xs ring-1 ring-indigo-500/30'
                              : 'border-border bg-card/60 hover:bg-card hover:border-border/80'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                              isCurrent
                                ? 'bg-indigo-600 text-white'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              D{p.period_number}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {p.duration_minutes}m
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-foreground line-clamp-2 leading-tight">
                            {shortTitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Day-by-Day Cards */}
                <div className="space-y-4 pt-1">
                  {suiteData.teaching_plan.periods
                    .filter((p) => selectedPlanDay === 'all' || p.period_number === selectedPlanDay)
                    .map((p) => (
                      <div
                        key={p.period_number}
                        className="rounded-2xl border border-border bg-card shadow-xs hover:border-border/80 transition-all overflow-hidden"
                      >
                        {/* Day Card Header Bar */}
                        <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                              D{p.period_number}
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-bold text-foreground">
                                  {p.day_title}
                                </h3>
                                <Badge variant="outline" className="text-[10px] font-semibold py-0.5 px-2 text-muted-foreground">
                                  <Clock className="w-3 h-3 mr-1 text-indigo-500" />
                                  {p.duration_minutes} Mins
                                </Badge>
                                {p.pedagogy_focus && (
                                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
                                    <Presentation className="w-3 h-3 mr-1" />
                                    {p.pedagogy_focus}
                                  </Badge>
                                )}
                              </div>

                              {p.learning_objective && (
                                <p className="text-xs text-indigo-900 dark:text-indigo-300 font-medium flex items-center gap-1.5 pt-0.5">
                                  <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                  <span><strong>Target Goal:</strong> {p.learning_objective}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyDayPlan(p)}
                              className="h-7 text-xs font-semibold cursor-pointer gap-1 text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="w-3 h-3" />
                              Copy Day {p.period_number} Plan
                            </Button>
                          </div>
                        </div>

                        {/* Day Card Structured Sub-Parts */}
                        <div className="p-4 sm:p-5 space-y-4">
                          {/* PART 1: 📖 Kya Padhana Hai (Topics & Concepts) */}
                          <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/30 border border-border/60">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>1. Kya Padhana Hai (Detailed Topics &amp; Core Concepts):</span>
                            </div>
                            <p className="text-xs text-foreground/90 leading-relaxed pl-5">
                              {p.topics_covered}
                            </p>
                            {p.prerequisites && (
                              <p className="text-[11px] text-muted-foreground pl-5 pt-1">
                                <span className="font-semibold text-foreground/80">Prerequisites needed:</span> {p.prerequisites}
                              </p>
                            )}
                          </div>

                          {/* PART 2: ⏱️ 45-Min Classroom Flow (Period Breakdown) */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>2. 45-Minute Classroom Delivery Flow:</span>
                              </span>
                              <span className="text-[11px] text-muted-foreground">Standard 4-Phase Period</span>
                            </div>

                            {p.time_breakdown && p.time_breakdown.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                {p.time_breakdown.map((tb, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 rounded-xl border border-border/80 bg-card/60 flex flex-col justify-between gap-1.5 shadow-2xs"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-foreground">
                                        {tb.phase}
                                      </span>
                                      <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 bg-muted/40">
                                        {tb.minutes}m
                                      </Badge>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-normal">
                                      {tb.activity}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                                <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                                  <span className="font-bold block text-[11px] text-foreground">0-5 Mins: Warm-up</span>
                                  <p className="text-[11px] text-muted-foreground">Recall previous class concepts &amp; pose inquiry hook.</p>
                                </div>
                                <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                                  <span className="font-bold block text-[11px] text-foreground">5-25 Mins: Core Concept</span>
                                  <p className="text-[11px] text-muted-foreground">Blackboard delivery of definitions, formulas &amp; reactions.</p>
                                </div>
                                <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                                  <span className="font-bold block text-[11px] text-foreground">25-38 Mins: Guided Demo</span>
                                  <p className="text-[11px] text-muted-foreground">Live activity, sample equation balancing or student turns.</p>
                                </div>
                                <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                                  <span className="font-bold block text-[11px] text-foreground">38-45 Mins: Recap &amp; Task</span>
                                  <p className="text-[11px] text-muted-foreground">Quick understanding check and assign homework.</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* PART 3, 4, 5 GRID: Blackboard Plan, Intuitive Hook, Daily Practice */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-1">
                            {/* PART 3: 📋 Blackboard & Presentation Plan */}
                            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-200">
                                <Edit3 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                                <span>3. Blackboard Plan (Board Pe Kya Likhein):</span>
                              </div>
                              {p.blackboard_plan && p.blackboard_plan.length > 0 ? (
                                <ul className="space-y-1.5 text-xs text-slate-800 dark:text-slate-300">
                                  {p.blackboard_plan.map((bp, bidx) => (
                                    <li key={bidx} className="flex items-start gap-1.5 text-[11px] leading-relaxed">
                                      <span className="font-bold text-primary mt-0.5">•</span>
                                      <span>{bp}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-[11px] text-muted-foreground">
                                  Write clear definitions, reactions with state symbols, and box final formulas.
                                </p>
                              )}
                            </div>

                            {/* PART 4: 💡 Intuitive Real-World Analogy / Hook */}
                            <div className="p-3.5 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 dark:text-amber-300">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>4. Intuitive Hook &amp; Easy Analogy:</span>
                              </div>
                              <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                                {p.intuitive_hook || 'Use everyday household examples to ground abstract scientific terminology.'}
                              </p>
                            </div>

                            {/* PART 5: ✏️ Daily Practice Task (CW & HW) */}
                            <div className="p-3.5 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 dark:text-emerald-300">
                                <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>5. Daily Practice (Classwork + HW):</span>
                              </div>
                              <p className="text-[11px] text-emerald-900 dark:text-emerald-200 leading-relaxed">
                                {p.daily_task || 'Assign 1 quick classwork question and 1 textbook end-chapter question.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

            {/* ========================================================================= */}
            {/* MODULE 2: 📖 Topic-wise Teaching Guide & Ready-to-Teach Classroom Kit */}
            {/* ========================================================================= */}
            <TabsContent value="guide" className="space-y-4">
              <Card className="border-border shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Module 2: Master Teaching Guide &amp; Ready-to-Teach Classroom Kit
                      </CardTitle>
                      <CardDescription className="text-xs">
                        How to handle students &amp; chapter • Verbatim teacher speech script • Blackboard layout • In-class check questions
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                      <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 font-bold text-xs px-2.5 py-1">
                        {suiteData.teaching_guide.topics.length} Core Topics Kit
                      </Badge>
                      <Badge variant="outline" className="text-xs font-semibold text-muted-foreground px-2.5 py-1">
                        <Presentation className="w-3 h-3 mr-1 text-blue-500" />
                        Ready-to-Deliver Script Included
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* MASTER CHAPTER HANDLING STRATEGY (How to Handle Chapter & Students) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent border border-blue-200/70 dark:border-blue-800/40 space-y-3.5">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide">
                        Chapter Handling Strategy: How to Guide Students &amp; Manage the Classroom
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* 1. Mindset */}
                      <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-1.5 shadow-2xs">
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5" /> 1. Teacher Mindset &amp; Tone
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {suiteData.teaching_guide.chapter_handling_strategy?.teacher_mindset ||
                            'Start with tangible sensory observations before writing abstract symbols. Demystify equations as mere recipes to eliminate chemistry formula anxiety.'}
                        </p>
                      </div>

                      {/* 2. Weak Students */}
                      <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-1.5 shadow-2xs">
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" /> 2. Handling Weak Students
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {suiteData.teaching_guide.chapter_handling_strategy?.handling_weak_students ||
                            'Enforce the 3-column inventory box (Element | LHS | RHS). Never allow them to balance in their head. Emphasize that formula subscripts inside boxes are untouchable!'}
                        </p>
                      </div>

                      {/* 3. Pacing */}
                      <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-1.5 shadow-2xs">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> 3. Pacing &amp; Control
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {suiteData.teaching_guide.chapter_handling_strategy?.pacing_and_classroom_control ||
                            'Keep the first 5 minutes strictly on the curiosity hook without definitions. Dedicate the last 7 minutes exclusively to student writing so doubts surface before home.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Topic Selector Filter */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <ListOrdered className="w-3.5 h-3.5 text-blue-600" /> Filter by Topic:
                      </span>
                      {selectedGuideTopic !== 'all' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedGuideTopic('all')}
                          className="h-6 text-[11px] text-primary hover:text-primary/80 px-2 cursor-pointer"
                        >
                          Show All Topics
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        variant={selectedGuideTopic === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedGuideTopic('all')}
                        className={`h-7 px-3 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                          selectedGuideTopic === 'all'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        All Topics ({suiteData.teaching_guide.topics.length})
                      </Button>
                      {suiteData.teaching_guide.topics.map((t, idx) => {
                        const isSelected = selectedGuideTopic === idx + 1;
                        return (
                          <Button
                            key={idx}
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedGuideTopic(idx + 1)}
                            className={`h-7 px-3 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Topic {idx + 1}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Topic Cards */}
                  {suiteData.teaching_guide.topics
                    .filter((_, idx) => selectedGuideTopic === 'all' || selectedGuideTopic === idx + 1)
                    .map((t, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-border bg-card shadow-xs hover:border-border/80 transition-all overflow-hidden space-y-4"
                      >
                        {/* Topic Header */}
                        <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 font-black text-xs flex items-center justify-center shrink-0">
                              T{idx + 1}
                            </span>
                            <div>
                              <h3 className="text-base font-bold text-foreground">
                                {t.topic_name}
                              </h3>
                              {t.source_reference && (
                                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1 pt-0.5">
                                  <BookOpen className="w-3 h-3 text-emerald-600" />
                                  {t.source_reference}
                                </span>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyGuideScript(t)}
                            className="h-7 text-xs font-semibold cursor-pointer gap-1.5 text-muted-foreground hover:text-foreground self-end md:self-auto"
                          >
                            <Copy className="w-3 h-3" />
                            Copy Teaching Script
                          </Button>
                        </div>

                        <div className="p-4 sm:p-5 space-y-4 pt-0">
                          {/* 📢 READY-MADE TEACHER DELIVERY SCRIPT (Class Me Yeh Boliye) */}
                          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-200 dark:border-blue-900/40 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-blue-950 dark:text-blue-300 flex items-center gap-1.5">
                                <Quote className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Ready-to-Use Classroom Script (Class Me Yeh Boliye):</span>
                              </span>
                              <Badge variant="outline" className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 border-blue-400/30">
                                Verbatim Teacher Dialogue
                              </Badge>
                            </div>
                            <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed font-normal italic pl-2 border-l-2 border-blue-500/60">
                              "{t.verbatim_teacher_script || t.how_to_explain}"
                            </p>
                          </div>

                          {/* What to Teach & How to Explain Step-by-Step */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* What to teach */}
                            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1.5">
                              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                What to Teach (Core Syllabus &amp; Definitions)
                              </span>
                              <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                                {t.what_to_teach}
                              </p>
                            </div>

                            {/* 3-Step Pedagogy Flow */}
                            <div className="p-3.5 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 space-y-1.5">
                              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-300 flex items-center gap-1.5">
                                <Presentation className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                Step-by-Step Delivery Flow
                              </span>
                              {t.how_to_explain_step_by_step && t.how_to_explain_step_by_step.length > 0 ? (
                                <ul className="space-y-1.5 text-xs text-indigo-900 dark:text-indigo-300 pl-5">
                                  {t.how_to_explain_step_by_step.map((step, sIdx) => (
                                    <li key={sIdx} className="leading-relaxed list-disc">
                                      {step}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed pl-5">
                                  {t.how_to_explain}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* 📋 BLACKBOARD 3-COLUMN STRUCTURE SIMULATOR */}
                          {t.blackboard_layout && (
                            <div className="space-y-2 pt-1">
                              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Edit3 className="w-3.5 h-3.5 text-primary" />
                                Blackboard Layout (Left | Center | Right)
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Left Board */}
                                <div className="p-3 rounded-xl bg-slate-900 text-slate-100 dark:bg-slate-950 border border-slate-700/80 font-mono text-[11px] space-y-1 shadow-2xs">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block border-b border-slate-700 pb-1">
                                    [Left Board] Terms &amp; Rules
                                  </span>
                                  <pre className="whitespace-pre-wrap font-mono leading-relaxed text-slate-300">
                                    {t.blackboard_layout.left_side}
                                  </pre>
                                </div>

                                {/* Center Board */}
                                <div className="p-3 rounded-xl bg-slate-900 text-slate-100 dark:bg-slate-950 border border-slate-700/80 font-mono text-[11px] space-y-1 shadow-2xs">
                                  <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block border-b border-slate-700 pb-1">
                                    [Center Board] Reactions &amp; Mechanics
                                  </span>
                                  <pre className="whitespace-pre-wrap font-mono leading-relaxed text-slate-200">
                                    {t.blackboard_layout.center}
                                  </pre>
                                </div>

                                {/* Right Board */}
                                <div className="p-3 rounded-xl bg-slate-900 text-slate-100 dark:bg-slate-950 border border-slate-700/80 font-mono text-[11px] space-y-1 shadow-2xs">
                                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block border-b border-slate-700 pb-1">
                                    [Right Board] Traps &amp; Summary
                                  </span>
                                  <pre className="whitespace-pre-wrap font-mono leading-relaxed text-slate-300">
                                    {t.blackboard_layout.right_side}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Intuitive Analogy & Real-World Examples */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Analogy */}
                            {t.intuitive_analogy && (
                              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-900 dark:text-amber-300">
                                  <strong className="block font-bold">Memorable Everyday Analogy:</strong>
                                  <span className="leading-relaxed">{t.intuitive_analogy}</span>
                                </div>
                              </div>
                            )}

                            {/* Real world examples */}
                            {t.real_world_examples && t.real_world_examples.length > 0 && (
                              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1.5">
                                <span className="text-xs font-bold text-foreground block">
                                  Real-World Context &amp; Examples:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {t.real_world_examples.map((ex, exIdx) => (
                                    <span
                                      key={exIdx}
                                      className="px-2.5 py-1 rounded-lg bg-card text-[11px] text-foreground font-medium border border-border/80"
                                    >
                                      • {ex}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* In-Class Diagnostic Questions & Weak Student Remedy */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* In-Class Spot Check */}
                            {t.in_class_check_questions && t.in_class_check_questions.length > 0 && (
                              <div className="p-3.5 rounded-xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 space-y-2">
                                <span className="text-xs font-bold text-blue-950 dark:text-blue-300 flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  <span>In-Class Spot Check Questions (Bacho Se Pucho):</span>
                                </span>
                                <div className="space-y-2 text-xs">
                                  {t.in_class_check_questions.map((cq, qIdx) => (
                                    <div key={qIdx} className="space-y-0.5">
                                      <p className="font-semibold text-foreground">
                                        Q{qIdx + 1}: "{cq.question}"
                                      </p>
                                      <p className="text-[11px] text-muted-foreground pl-3 border-l border-blue-400">
                                        Expected: {cq.expected_answer}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Weak Student Remedy */}
                            {t.weak_student_remedy && (
                              <div className="p-3.5 rounded-xl border border-purple-200/80 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/20 space-y-1.5">
                                <span className="text-xs font-bold text-purple-950 dark:text-purple-300 flex items-center gap-1.5">
                                  <Target className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                  <span>Agar Bachha Confuse Ho Toh (Weak Student Remedy):</span>
                                </span>
                                <p className="text-xs text-purple-900 dark:text-purple-200 leading-relaxed pl-5">
                                  {t.weak_student_remedy}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Common Student Mistakes vs Teacher Correction */}
                          {t.common_mistakes_and_fixes && t.common_mistakes_and_fixes.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-border/80">
                              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                Common Student Mistakes &amp; How to Correct Them
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
                            <div className="p-3 rounded-xl bg-muted/60 text-xs text-muted-foreground flex items-center gap-2">
                              <span className="font-bold text-foreground shrink-0 flex items-center gap-1">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Blackboard Pro-Tip:
                              </span>
                              <span>{t.teacher_delivery_tips}</span>
                            </div>
                          )}
                        </div>
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

                  {/* UNMISSABLE IMPORTANT NOTES & SCIENTIFIC FACTS (Galati Se Bhi Miss Nahi Ho Sakti) */}
                  {suiteData.mandatory_notes.unmissable_important_notes_and_facts && suiteData.mandatory_notes.unmissable_important_notes_and_facts.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-transparent border-2 border-rose-300 dark:border-rose-800 space-y-3 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span className="text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-200 uppercase tracking-wide">
                            Compulsory Unmissable Facts &amp; Important Notes (Galati Se Bhi Miss Nahi Ho Sakti)
                          </span>
                        </div>
                        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[10px] font-bold self-start sm:self-auto">
                          100% Accurate • Board Mandatory
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {suiteData.mandatory_notes.unmissable_important_notes_and_facts.map((item, idx) => {
                          if (typeof item === 'string') {
                            return (
                              <div key={idx} className="p-3.5 rounded-xl bg-card border border-rose-200/80 dark:border-rose-900/40 text-xs space-y-1 shadow-2xs">
                                <span className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                                  <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" /> Essential Rule #{idx + 1}
                                </span>
                                <p className="text-foreground leading-relaxed font-medium">{item}</p>
                              </div>
                            );
                          }
                          return (
                            <div key={idx} className="p-3.5 rounded-xl bg-card border border-rose-200/80 dark:border-rose-900/40 text-xs space-y-2 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                                  <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" /> Unmissable #{idx + 1}
                                </span>
                                {item.exam_weightage && (
                                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                    {item.exam_weightage}
                                  </span>
                                )}
                              </div>
                              <p className="text-foreground leading-relaxed font-semibold">{item.fact}</p>
                              {item.why_unmissable && (
                                <p className="text-[11px] text-muted-foreground border-l-2 border-rose-400 pl-2">
                                  <strong className="text-rose-700 dark:text-rose-300">Why Unmissable:</strong> {item.why_unmissable}
                                </p>
                              )}
                              {item.memory_anchor && (
                                <div className="p-2 rounded-lg bg-muted/60 text-[11px] font-medium text-foreground flex items-center gap-1.5">
                                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span><strong>Memory Anchor:</strong> {item.memory_anchor}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

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

                  {/* WORDS, MEANINGS & DAILY LIFE USAGE */}
                  {suiteData.mandatory_notes.words_meanings_and_daily_usage && suiteData.mandatory_notes.words_meanings_and_daily_usage.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                          Words, Precise Meanings &amp; Daily Life Practical Usage
                        </h3>
                        <Badge variant="outline" className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-500/10 border-blue-200 dark:border-blue-800">
                          Everyday Usage &amp; Vocabulary
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {suiteData.mandatory_notes.words_meanings_and_daily_usage.map((w, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-border bg-card space-y-2.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                {w.word}
                              </span>
                              {w.synonyms && w.synonyms.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {w.synonyms.map((s, sIdx) => (
                                    <span key={sIdx} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="space-y-1 text-xs">
                              <p className="text-foreground leading-relaxed">
                                <strong className="text-muted-foreground">Meaning:</strong> {w.meaning}
                              </p>
                              {w.contextual_meaning && (
                                <p className="text-[11px] text-muted-foreground">
                                  <strong>In This Chapter:</strong> {w.contextual_meaning}
                                </p>
                              )}
                            </div>

                            {w.daily_life_usage_example && (
                              <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-200/60 dark:border-blue-800/40 text-xs space-y-1">
                                <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  Usage in Daily Life:
                                </span>
                                <p className="text-[11px] text-foreground/90 leading-relaxed pl-4 border-l border-blue-400/50">
                                  "{w.daily_life_usage_example}"
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Important Diagrams */}
                  {suiteData.mandatory_notes.important_diagrams && suiteData.mandatory_notes.important_diagrams.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-border">
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
            {/* MODULE 4: 📝 Day-Wise Classwork + Homework (Day 1 se Day 7) */}
            {/* ========================================================================= */}
            <TabsContent value="practice" className="space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Module 4: Day-Wise Classwork &amp; Tiered Homework Assignments (Day 1 to 7)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Har din ka classwork practice • Tiered daily homework (Basic, Standard, HOTS) • 100% textbook accurate
                      </CardDescription>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        let text = `DAY-WISE CW + HW: ${suiteData.metadata.chapterTitle}\n\n`;
                        if (suiteData.classwork_homework.day_wise_assignments && suiteData.classwork_homework.day_wise_assignments.length > 0) {
                          text += suiteData.classwork_homework.day_wise_assignments.map((d) => 
                            `--- DAY ${d.day_number}: ${d.day_title} ---\n` +
                            `CLASSWORK:\n` +
                            d.classwork.map((c) => `Q${c.q_no} (${c.marks}M): ${c.question}\n(Hint: ${c.solution_hints})`).join('\n') +
                            `\nHOMEWORK:\n` +
                            d.homework.map((h, i) => `Q${i + 1} [${h.level}] (${h.marks}M): ${h.question}\n(Clue: ${h.guided_clue})`).join('\n') +
                            `\n`
                          ).join('\n');
                        } else {
                          text += `CLASSWORK:\n` +
                            suiteData.classwork_homework.classwork_practice.map((c) => `Q${c.q_no} (${c.marks}M): ${c.question}`).join('\n') +
                            `\nHOMEWORK:\n` +
                            suiteData.classwork_homework.homework_assignment.map((h, i) => `Q${i + 1} [${h.level}] (${h.marks}M): ${h.question}`).join('\n');
                        }
                        copyToClipboard(text, 'hw');
                      }}
                      className="gap-1.5 text-xs font-semibold self-start sm:self-auto cursor-pointer"
                    >
                      {copiedKey === 'hw' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy All Days CW+HW
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Day-Wise Navigation Stepper */}
                  {suiteData.classwork_homework.day_wise_assignments && suiteData.classwork_homework.day_wise_assignments.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-purple-500" />
                          Filter by Teaching Day:
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          Showing {selectedCwHwDay === 'all' ? `All ${suiteData.classwork_homework.day_wise_assignments.length} Days` : `Day ${selectedCwHwDay}`}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedCwHwDay === 'all' ? 'default' : 'outline'}
                          onClick={() => setSelectedCwHwDay('all')}
                          className="h-8 text-xs font-bold rounded-xl cursor-pointer"
                        >
                          All Days
                        </Button>
                        {suiteData.classwork_homework.day_wise_assignments.map((d) => (
                          <Button
                            key={d.day_number}
                            type="button"
                            size="sm"
                            variant={selectedCwHwDay === d.day_number ? 'default' : 'outline'}
                            onClick={() => setSelectedCwHwDay(d.day_number)}
                            className="h-8 text-xs font-bold rounded-xl cursor-pointer"
                          >
                            Day {d.day_number}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Day-Wise Cards List */}
                  {suiteData.classwork_homework.day_wise_assignments && suiteData.classwork_homework.day_wise_assignments.length > 0 ? (
                    <div className="space-y-5">
                      {suiteData.classwork_homework.day_wise_assignments
                        .filter((d) => selectedCwHwDay === 'all' || selectedCwHwDay === d.day_number)
                        .map((dayItem) => (
                          <div
                            key={dayItem.day_number}
                            className="p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-4"
                          >
                            {/* Day Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                              <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center border border-purple-500/20">
                                  D{dayItem.day_number}
                                </span>
                                <div>
                                  <h4 className="font-bold text-sm text-foreground">
                                    Day {dayItem.day_number}: {dayItem.day_title}
                                  </h4>
                                  {dayItem.topic_focus && (
                                    <p className="text-xs text-muted-foreground">
                                      Focus: {dayItem.topic_focus}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[11px] font-semibold text-muted-foreground">
                                  <Clock className="w-3 h-3 mr-1 text-purple-500" />
                                  ~{dayItem.estimated_time_mins || 30} Mins HW
                                </Badge>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const text = `DAY ${dayItem.day_number}: ${dayItem.day_title}\n\nCLASSWORK:\n${dayItem.classwork.map(c => `Q${c.q_no} (${c.marks}M): ${c.question}\nHint: ${c.solution_hints}`).join('\n\n')}\n\nHOMEWORK:\n${dayItem.homework.map((h, i) => `Q${i+1} [${h.level}] (${h.marks}M): ${h.question}\nClue: ${h.guided_clue}`).join('\n\n')}`;
                                    copyToClipboard(text, `day_hw_${dayItem.day_number}`);
                                  }}
                                  className="h-7 px-2 text-xs font-semibold cursor-pointer"
                                >
                                  {copiedKey === `day_hw_${dayItem.day_number}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 mr-1" />
                                  )}
                                  Copy Day {dayItem.day_number}
                                </Button>
                              </div>
                            </div>

                            {/* Classwork */}
                            <div className="space-y-2.5">
                              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                                In-Class Guided Practice (Solve During 45-Min Class):
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {dayItem.classwork.map((cw, cIdx) => (
                                  <div key={cIdx} className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-xs text-foreground">CW Q{cw.q_no}</span>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted">
                                        {cw.marks} Marks
                                      </span>
                                    </div>
                                    <p className="text-xs font-semibold text-foreground leading-relaxed">{cw.question}</p>
                                    <div className="p-2 rounded-lg bg-muted/60 text-[11px] text-muted-foreground">
                                      <span className="font-bold text-foreground">Teacher Blackboard Hint:</span> {cw.solution_hints}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Tiered Homework */}
                            <div className="space-y-2.5 pt-2 border-t border-border/80">
                              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5 text-indigo-600" />
                                Tiered Homework Assignment Set (Basic, Standard, HOTS):
                              </span>
                              <div className="space-y-2.5">
                                {dayItem.homework.map((hw, hIdx) => {
                                  const badgeColor =
                                    hw.level === 'Basic'
                                      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                                      : hw.level === 'Standard'
                                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';

                                  return (
                                    <div key={hIdx} className="p-3.5 rounded-xl border border-border bg-card space-y-1.5 shadow-2xs">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-xs text-foreground">HW Q{hIdx + 1}</span>
                                          <Badge className={`text-[10px] font-bold px-2 py-0 border ${badgeColor}`}>
                                            {hw.level}
                                          </Badge>
                                        </div>
                                        <span className="text-xs font-bold text-muted-foreground">
                                          {hw.marks} Marks
                                        </span>
                                      </div>
                                      <p className="text-xs font-semibold text-foreground leading-relaxed">{hw.question}</p>
                                      <div className="p-2 rounded-lg bg-muted/40 text-[11px] text-muted-foreground flex items-start gap-1.5">
                                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                        <span><strong className="text-foreground">Student Clue:</strong> {hw.guided_clue}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    /* Fallback to legacy classwork and homework if day_wise_assignments is absent */
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" /> In-Class Guided Practice
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {suiteData.classwork_homework.classwork_practice.map((cw, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-border bg-card space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-foreground">Classwork Q{cw.q_no}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted">{cw.marks} Marks</span>
                              </div>
                              <p className="text-xs font-medium text-foreground">{cw.question}</p>
                              <div className="p-2 rounded-lg bg-muted/60 text-[11px] text-muted-foreground">
                                <span className="font-bold text-foreground">Teacher Blackboard Hint:</span> {cw.solution_hints}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-border">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-indigo-500" /> Tiered Homework Assignment Set
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {suiteData.classwork_homework.homework_assignment.map((hw, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-foreground">HW Q{idx + 1} • {hw.level}</span>
                                <span className="text-xs font-bold text-muted-foreground">{hw.marks} Marks</span>
                              </div>
                              <p className="text-xs font-semibold text-foreground leading-relaxed">{hw.question}</p>
                              <div className="p-2 rounded-lg bg-muted/40 text-[11px] text-muted-foreground flex items-start gap-1.5">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <span><strong className="text-foreground">Student Clue:</strong> {hw.guided_clue}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
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
            {/* MODULE 6: 🔄 Chapter Mastery & Revision (Complete Analysis & Q&As)        */}
            {/* ========================================================================= */}
            <TabsContent value="revision" className="space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Award className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        Module 6: Chapter Mastery, Detailed Analysis Summary &amp; Comprehensive Q&amp;A
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Complete chapter analysis • 100% textbook accuracy • Comprehensive board Q&amp;A with model answers • Detailed important notes
                      </CardDescription>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        let text = `CHAPTER MASTERY & REVISION: ${suiteData.metadata.chapterTitle}\n\n`;
                        if (suiteData.revision_test_plan.detailed_chapter_analysis_summary) {
                          text += `DETAILED CHAPTER ANALYSIS SUMMARY:\n${suiteData.revision_test_plan.detailed_chapter_analysis_summary}\n\n`;
                        }
                        if (suiteData.revision_test_plan.comprehensive_chapter_qa && suiteData.revision_test_plan.comprehensive_chapter_qa.length > 0) {
                          text += `COMPREHENSIVE CHAPTER Q&A:\n` +
                            suiteData.revision_test_plan.comprehensive_chapter_qa.map((qa, i) => 
                              `Q${qa.question_number || qa.q_no || i + 1} [${qa.marks_category || qa.type || `${qa.marks}M`}]: ${qa.question}\nMODEL ANSWER:\n${qa.detailed_model_answer || qa.answer}\n`
                            ).join('\n\n') + '\n\n';
                        }
                        text += `RAPID CHEAT SHEET BULLETS:\n` +
                          suiteData.revision_test_plan.rapid_cheat_sheet_bullets.map(b => `• ${b}`).join('\n');
                        copyToClipboard(text, 'revision');
                      }}
                      className="gap-1.5 text-xs font-semibold self-start sm:self-auto cursor-pointer"
                    >
                      {copiedKey === 'revision' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Mastery Kit
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* 1. Complete Chapter Detailed Analysis Summary (Zero Hallucination) */}
                  {suiteData.revision_test_plan.detailed_chapter_analysis_summary && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-500/5 via-primary/5 to-transparent border border-rose-200/80 dark:border-rose-900/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide">
                            1. Complete Chapter Detailed Analysis Summary (100% Textbook Grounded)
                          </h3>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-[10px] font-bold">
                          Zero AI Hallucination Guarantee
                        </Badge>
                      </div>

                      <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line bg-card/60 p-4 rounded-xl border border-border/80">
                        {suiteData.revision_test_plan.detailed_chapter_analysis_summary}
                      </div>
                    </div>
                  )}

                  {/* 2. Detailed Important Notes */}
                  {suiteData.revision_test_plan.detailed_important_notes && suiteData.revision_test_plan.detailed_important_notes.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        2. Exhaustive Chapter Notes &amp; Core Scientific Principles
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {suiteData.revision_test_plan.detailed_important_notes.map((n, idx) => {
                          if (typeof n === 'string') {
                            return (
                              <div key={idx} className="p-4 rounded-xl border border-border bg-card space-y-1.5 shadow-2xs">
                                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                  <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Note #{idx + 1}
                                </span>
                                <p className="text-xs text-muted-foreground leading-relaxed">{n}</p>
                              </div>
                            );
                          }
                          return (
                            <div key={idx} className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-foreground">{n.note_title}</span>
                                {n.category && (
                                  <Badge variant="outline" className="text-[10px] bg-muted/60">
                                    {n.category}
                                  </Badge>
                                )}
                              </div>
                              {n.key_principles && (
                                <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
                                  {n.key_principles.map((kp, kIdx) => (
                                    <li key={kIdx} className="leading-relaxed">{kp}</li>
                                  ))}
                                </ul>
                              )}
                              {n.board_special_highlight && (
                                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-300 font-medium">
                                  <strong>Board Highlight:</strong> {n.board_special_highlight}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Comprehensive Chapter Q&A with Model Answers */}
                  {suiteData.revision_test_plan.comprehensive_chapter_qa && suiteData.revision_test_plan.comprehensive_chapter_qa.length > 0 && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-indigo-500" />
                          3. Comprehensive Chapter Questions &amp; Full Model Answers (Board Exam Standard)
                        </h3>
                        <Badge variant="outline" className="text-[10px] text-indigo-700 bg-indigo-500/10 border-indigo-200">
                          Short (2M) • Conceptual (3M) • Long (5M)
                        </Badge>
                      </div>

                      <div className="space-y-3.5">
                        {suiteData.revision_test_plan.comprehensive_chapter_qa.map((qaItem, idx) => {
                          const qNum = qaItem.question_number || qaItem.q_no || idx + 1;
                          const category = qaItem.marks_category || qaItem.type || `${qaItem.marks} Marks`;
                          const modelAns = qaItem.detailed_model_answer || qaItem.answer;

                          const badgeStyle =
                            qaItem.marks === 2
                              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                              : qaItem.marks === 3
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';

                          return (
                            <div
                              key={idx}
                              className="p-4 sm:p-5 rounded-2xl border border-border bg-card space-y-3 shadow-2xs"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-foreground">Question {qNum}</span>
                                  <Badge className={`text-[10px] font-bold px-2 py-0 border ${badgeStyle}`}>
                                    {category}
                                  </Badge>
                                </div>
                                <span className="text-xs font-bold text-primary">
                                  {qaItem.marks} Marks
                                </span>
                              </div>

                              <p className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed">
                                {qaItem.question}
                              </p>

                              {/* Model Answer */}
                              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1.5 text-xs">
                                <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Full Marks Model Answer:
                                </span>
                                <div className="text-foreground/90 whitespace-pre-line leading-relaxed pl-5 font-mono text-[11px] sm:text-xs">
                                  {modelAns}
                                </div>
                              </div>

                              {/* Marking Scheme Breakdown / Key Points */}
                              {((qaItem.marking_scheme_breakdown && qaItem.marking_scheme_breakdown.length > 0) ||
                                (qaItem.key_points_for_full_marks && qaItem.key_points_for_full_marks.length > 0)) && (
                                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-xs space-y-1">
                                  <span className="font-bold text-primary flex items-center gap-1">
                                    <ListOrdered className="w-3.5 h-3.5" /> Marking Scheme &amp; Key Points:
                                  </span>
                                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-foreground/80 pl-2">
                                    {(qaItem.marking_scheme_breakdown || qaItem.key_points_for_full_marks || []).map((pt, pIdx) => (
                                      <li key={pIdx}>{pt}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Common Pitfall Warning */}
                              {qaItem.common_pitfall_warning && (
                                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-900 dark:text-rose-300 flex items-start gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                  <span><strong>Examiner Pitfall Warning:</strong> {qaItem.common_pitfall_warning}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 4. Revision Timeline Schedule */}
                  <div className="space-y-3 pt-2 border-t border-border">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary" /> 4. Multi-Stage Revision Timeline
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

                  {/* 5. Top Must-Solve Questions */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-500" /> 5. Top Must-Solve Board Examination Questions
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

                  {/* 6. Chapter Test Blueprint */}
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs uppercase tracking-wider text-primary">
                        6. Formal Chapter Test Blueprint
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

                  {/* 7. Rapid 5-Min Pre-Exam Cheat Sheet */}
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
