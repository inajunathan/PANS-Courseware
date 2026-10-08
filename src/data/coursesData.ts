import { Course } from '../types';

export const coursesData: Course[] = [
  // 400 Level (Featured in Stitch design)
  {
    id: 'pch-401',
    code: 'PCH 401',
    title: 'Pharmaceutical Chemistry: SAR & Drug Design',
    level: '400',
    semester: 'First',
    units: 3,
    specialization: 'Pharmaceutical Chemistry',
    description: 'Comprehensive study of Structure-Activity Relationships (SAR), rational drug design, receptor-ligand interactions, stereochemistry in medicinal chemistry, and physicochemical properties influencing bioactivity.',
    leadLecturer: 'Prof. A. Adebayo, PhD, FPSN',
    department: 'Department of Pharmaceutical Chemistry',
    pdfCount: 8,
    pqCount: 12,
    tutorialCount: 6,
    lectureUnits: [
      {
        id: 'pch401-u1',
        unitNumber: 1,
        title: 'Introduction to Structure-Activity Relationships (SAR) & Drug Design',
        lecturer: 'Prof. A. Adebayo',
        totalPages: 28,
        fileSize: '8.4 MB',
        dateUploaded: 'Sep 14, 2026',
        isVerified: true
      },
      {
        id: 'pch401-u2',
        unitNumber: 2,
        title: 'Stereochemical & Electronic Factors in Bioactivity',
        lecturer: 'Dr. O. Adeleke',
        totalPages: 34,
        fileSize: '11.2 MB',
        dateUploaded: 'Sep 21, 2026',
        isVerified: true
      },
      {
        id: 'pch401-u3',
        unitNumber: 3,
        title: 'SAR of Beta-Lactam & Broad Spectrum Antibiotics',
        lecturer: 'Prof. A. Adebayo',
        totalPages: 42,
        fileSize: '14.8 MB',
        dateUploaded: 'Oct 02, 2026',
        isVerified: true
      },
      {
        id: 'pch401-u4',
        unitNumber: 4,
        title: 'Rational Design of Antineoplastic & Alkylating Agents',
        lecturer: 'Dr. K. Ibrahim',
        totalPages: 30,
        fileSize: '9.6 MB',
        dateUploaded: 'Oct 15, 2026',
        isVerified: true
      }
    ]
  },
  {
    id: 'pco-401',
    code: 'PCO 401',
    title: 'Advanced Pharmacology: Chemotherapy & Autacoids',
    level: '400',
    semester: 'First',
    units: 4,
    specialization: 'Pharmacology & Toxicology',
    description: 'Mechanisms of action, resistance profiles, therapeutic protocols, and toxicities of antimicrobial, antiviral, antifungal, antiparasitic, and anticancer agents.',
    leadLecturer: 'Prof. (Mrs.) E. Bello, FAS',
    department: 'Department of Pharmacology & Therapeutics',
    pdfCount: 10,
    pqCount: 14,
    tutorialCount: 8,
    lectureUnits: [
      {
        id: 'pco401-u1',
        unitNumber: 1,
        title: 'Fundamentals of Antimicrobial Chemotherapy & Resistance Mechanisms',
        lecturer: 'Prof. E. Bello',
        totalPages: 36,
        fileSize: '9.2 MB',
        dateUploaded: 'Sep 16, 2026',
        isVerified: true
      },
      {
        id: 'pco401-u2',
        unitNumber: 2,
        title: 'Autacoids, Histamine Receptors & Eicosanoid Biosynthesis Pathways',
        lecturer: 'Dr. T. Okafor',
        totalPages: 29,
        fileSize: '7.8 MB',
        dateUploaded: 'Sep 24, 2026',
        isVerified: true
      }
    ]
  },
  {
    id: 'pct-401',
    code: 'PCT 401',
    title: 'Biopharmaceutics & Applied Pharmacokinetics',
    level: '400',
    semester: 'Second',
    units: 3,
    specialization: 'Pharmaceutics & Industrial Pharmacy',
    description: 'Physicochemical factors governing drug dissolution, membrane transport mechanisms, one- and two-compartment kinetic models, non-linear pharmacokinetics, and bioavailability studies.',
    leadLecturer: 'Dr. S. O. Balogun',
    department: 'Department of Pharmaceutics & Pharmaceutical Technology',
    pdfCount: 7,
    pqCount: 9,
    tutorialCount: 5,
    lectureUnits: [
      {
        id: 'pct401-u1',
        unitNumber: 1,
        title: 'Compartmental Modeling & Mathematical Formulations in Drug Disposition',
        lecturer: 'Dr. S. O. Balogun',
        totalPages: 32,
        fileSize: '8.1 MB',
        dateUploaded: 'Oct 05, 2026',
        isVerified: true
      }
    ]
  },

  // 100 Level
  {
    id: 'chm-101',
    code: 'CHM 101',
    title: 'General Physical & Inorganic Chemistry',
    level: '100',
    semester: 'First',
    units: 3,
    specialization: 'Basic Sciences & Pre-Pharmacy',
    description: 'Atomic structure, chemical bonding, gas laws, chemical thermodynamics, equilibria, and periodic relationships for prospective pharmacy scholars.',
    leadLecturer: 'Dr. J. N. Eze',
    department: 'Department of Chemistry',
    pdfCount: 6,
    pqCount: 15,
    tutorialCount: 9,
    lectureUnits: [
      {
        id: 'chm101-u1',
        unitNumber: 1,
        title: 'Atomic Theory, Quantum Numbers & Hybridization',
        lecturer: 'Dr. J. N. Eze',
        totalPages: 24,
        fileSize: '5.6 MB',
        dateUploaded: 'Aug 28, 2026',
        isVerified: true
      }
    ]
  },
  {
    id: 'bio-101',
    code: 'BIO 101',
    title: 'Introductory Cell Biology & Genetics',
    level: '100',
    semester: 'First',
    units: 3,
    specialization: 'Basic Sciences & Pre-Pharmacy',
    description: 'Cellular ultrastructure, membrane physiology, mitotic and meiotic divisions, Mendelian inheritance, and molecular biology basics.',
    leadLecturer: 'Prof. C. Danladi',
    department: 'Department of Biological Sciences',
    pdfCount: 5,
    pqCount: 11,
    tutorialCount: 4,
    lectureUnits: [
      {
        id: 'bio101-u1',
        unitNumber: 1,
        title: 'Eukaryotic Cell Structure & Organelle Functions',
        lecturer: 'Prof. C. Danladi',
        totalPages: 22,
        fileSize: '6.4 MB',
        dateUploaded: 'Aug 30, 2026',
        isVerified: true
      }
    ]
  },

  // 200 Level
  {
    id: 'pch-201',
    code: 'PCH 201',
    title: 'Pharmaceutical Organic Chemistry I',
    level: '200',
    semester: 'First',
    units: 3,
    specialization: 'Pharmaceutical Chemistry',
    description: 'Mechanisms of organic reactions, aliphatic and aromatic substitution, synthesis of medicinal intermediates, and spectroscopic characterization (IR, UV-Vis, NMR).',
    leadLecturer: 'Dr. (Mrs.) Y. A. Yusuf',
    department: 'Department of Pharmaceutical Chemistry',
    pdfCount: 9,
    pqCount: 10,
    tutorialCount: 7,
    lectureUnits: [
      {
        id: 'pch201-u1',
        unitNumber: 1,
        title: 'Electrophilic Aromatic Substitution & Benzene Derivative Synthesis',
        lecturer: 'Dr. Y. A. Yusuf',
        totalPages: 31,
        fileSize: '7.9 MB',
        dateUploaded: 'Sep 05, 2026',
        isVerified: true
      }
    ]
  },
  {
    id: 'phs-201',
    code: 'PHS 201',
    title: 'Human Systemic Physiology for Pharmacists',
    level: '200',
    semester: 'First',
    units: 4,
    specialization: 'Core Professional',
    description: 'Comprehensive study of cardiovascular, respiratory, renal, and neuroendocrine systems with pharmacological clinical correlation.',
    leadLecturer: 'Prof. M. B. Sanusi',
    department: 'Department of Human Physiology',
    pdfCount: 11,
    pqCount: 13,
    tutorialCount: 6,
    lectureUnits: [
      {
        id: 'phs201-u1',
        unitNumber: 1,
        title: 'Cardiac Electrophysiology, Hemodynamics & Blood Pressure Regulation',
        lecturer: 'Prof. M. B. Sanusi',
        totalPages: 40,
        fileSize: '12.1 MB',
        dateUploaded: 'Sep 10, 2026',
        isVerified: true
      }
    ]
  },

  // 300 Level
  {
    id: 'pcg-301',
    code: 'PCG 301',
    title: 'Pharmacognosy & Phytochemistry',
    level: '300',
    semester: 'First',
    units: 3,
    specialization: 'Pharmacognosy & Drug Development',
    description: 'Secondary plant metabolites: alkaloids, glycosides, flavonoids, tannins, and essential oils. Extraction, chromatographic separation, and medicinal utilization.',
    leadLecturer: 'Dr. F. O. Akintola',
    department: 'Department of Pharmacognosy',
    pdfCount: 8,
    pqCount: 9,
    tutorialCount: 5,
    lectureUnits: [
      {
        id: 'pcg301-u1',
        unitNumber: 1,
        title: 'Biosynthetic Pathways & Classification of Plant Alkaloids',
        lecturer: 'Dr. F. O. Akintola',
        totalPages: 27,
        fileSize: '8.7 MB',
        dateUploaded: 'Sep 12, 2026',
        isVerified: true
      }
    ]
  },
  {
    id: 'pct-301',
    code: 'PCT 301',
    title: 'Pharmaceutical Microbiology & Sterilization Technology',
    level: '300',
    semester: 'Second',
    units: 3,
    specialization: 'Pharmaceutics & Industrial Pharmacy',
    description: 'Bacterial kinetics, microbial contamination in pharmaceuticals, industrial sterilization techniques, cleanroom validation, and antibiotic assay protocols.',
    leadLecturer: 'Dr. G. K. Mustapha',
    department: 'Department of Pharmaceutics',
    pdfCount: 7,
    pqCount: 8,
    tutorialCount: 4,
    lectureUnits: [
      {
        id: 'pct301-u1',
        unitNumber: 1,
        title: 'Thermal & Radiation Sterilization Validation in Hospital Practice',
        lecturer: 'Dr. G. K. Mustapha',
        totalPages: 25,
        fileSize: '6.9 MB',
        dateUploaded: 'Sep 18, 2026',
        isVerified: true
      }
    ]
  },

  // 500 Level
  {
    id: 'pcp-501',
    code: 'PCP 501',
    title: 'Clinical Pharmacokinetics & Therapeutic Drug Monitoring',
    level: '500',
    semester: 'First',
    units: 3,
    specialization: 'Clinical Pharmacy & Pharmacy Practice',
    description: 'Dosage regimen individualization, narrow therapeutic index drugs (Digoxin, Aminoglycosides, Phenytoin, Theophylline), and hepatic/renal impairment adjustments.',
    leadLecturer: 'Pharm. (Dr.) B. A. Ogundele, FPCPharm',
    department: 'Department of Clinical Pharmacy',
    pdfCount: 12,
    pqCount: 11,
    tutorialCount: 6,
    lectureUnits: [
      {
        id: 'pcp501-u1',
        unitNumber: 1,
        title: 'Aminoglycoside Dosing Nomograms & Peak/Trough Monitoring',
        lecturer: 'Pharm. (Dr.) B. A. Ogundele',
        totalPages: 38,
        fileSize: '10.5 MB',
        dateUploaded: 'Sep 08, 2026',
        isVerified: true
      }
    ]
  },

  // 600 Level (Doctor of Pharmacy Professional Year)
  {
    id: 'pcp-601',
    code: 'PCP 601',
    title: 'Advanced Pharmacotherapy & Clinical Ward Rounds',
    level: '600',
    semester: 'First',
    units: 5,
    specialization: 'Clinical Pharmacy & Pharmacy Practice',
    description: 'Evidence-based pharmacotherapy across cardiology, nephrology, oncology, critical care, and infectious diseases during multidisciplinary ward rounds.',
    leadLecturer: 'Prof. H. U. Chukwu, FPSN, FPCPharm',
    department: 'Department of Clinical Pharmacy & Hospital Practice',
    pdfCount: 14,
    pqCount: 16,
    tutorialCount: 10,
    lectureUnits: [
      {
        id: 'pcp601-u1',
        unitNumber: 1,
        title: 'Clinical Case Presentation Guidelines & SOAP Note Formulations',
        lecturer: 'Prof. H. U. Chukwu',
        totalPages: 44,
        fileSize: '13.4 MB',
        dateUploaded: 'Aug 25, 2026',
        isVerified: true
      }
    ]
  }
];
