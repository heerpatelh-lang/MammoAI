/**
 * MammoAI — Educational Content, Quiz, & Follow-Up Tracker
 */

export const EDUCATIONAL_ARTICLES = [
  {
    id: "what-is-mammogram",
    title: "What is a Mammogram?",
    category: "Basics",
    readTime: "3 min read",
    tags: ["screening", "imaging", "basics"],
    summary: "A mammogram is a low-dose X-ray examination of the breasts used to detect and evaluate breast changes.",
    content: `
      <p>A mammogram is a specialized, low-dose X-ray examination of the breast. It allows radiologists to examine internal tissue structures long before any physical lump could be felt during an examination.</p>
      <h4>Screening vs. Diagnostic Mammograms</h4>
      <ul>
        <li><strong>Screening Mammogram:</strong> Performed routinely for individuals without any signs or symptoms of breast disease. Usually consists of two views per breast.</li>
        <li><strong>Diagnostic Mammogram:</strong> Performed when a symptom is present (such as a palpable lump or skin change) or when an area on a screening mammogram requires magnified or additional angled views.</li>
      </ul>
      <p>Modern digital mammography and 3D mammography (tomosynthesis) take images from multiple angles to construct a detailed layer-by-layer view of breast tissue.</p>
    `
  },
  {
    id: "breast-density",
    title: "What is Breast Tissue Density?",
    category: "Tissue Density",
    readTime: "4 min read",
    tags: ["density", "dense", "heterogeneous", "fatty"],
    summary: "Breast density refers to the proportion of fibroglandular tissue compared to fatty tissue seen on a mammogram.",
    content: `
      <p>Breast density is not determined by how breasts feel during an exam; it is strictly a radiological measurement of tissue composition seen on an X-ray.</p>
      <h4>The 4 BI-RADS Density Categories:</h4>
      <ol>
        <li><strong>Almost entirely fatty:</strong> The breast is composed almost entirely of fat, which appears transparent/dark on X-rays.</li>
        <li><strong>Scattered fibroglandular densities:</strong> Common distribution with scattered areas of glandular and connective tissue.</li>
        <li><strong>Heterogeneously dense:</strong> Many areas of glandular and fibrous tissue that can obscure smaller findings.</li>
        <li><strong>Extremely dense:</strong> Substantial fibrous and glandular tissue that lowers the sensitivity of standard 2D mammography.</li>
      </ol>
      <h4>Why Density Matters</h4>
      <p>Dense tissue appears white on a mammogram, and small masses or tumors also appear white. This creates a "masking effect" (like looking for a polar bear in a snowstorm). Having dense breasts is very common (found in nearly 40-50% of screening individuals), but your provider may recommend supplemental imaging such as automated ultrasound or MRI.</p>
    `
  },
  {
    id: "calcifications",
    title: "Understanding Calcifications",
    category: "Findings",
    readTime: "3 min read",
    tags: ["calcifications", "calcium", "macrocalcification", "microcalcification"],
    summary: "Calcifications are tiny deposits of calcium in breast tissue that show up as white spots on a mammogram.",
    content: `
      <p>Calcifications are very common and are found in many mammograms, especially in individuals over 50. They are not caused by dietary calcium or calcium supplements.</p>
      <h4>Types of Calcifications:</h4>
      <ul>
        <li><strong>Macrocalcifications:</strong> Larger, coarse calcium spots often caused by aging arteries, past injuries, or harmless inflammation. They are almost always non-cancerous (benign) and rarely require follow-up.</li>
        <li><strong>Microcalcifications:</strong> Very small specks of calcium. When clustered together in specific geometric patterns or along a milk duct, they can sometimes indicate rapid cellular growth, which requires magnified views or a needle biopsy to evaluate.</li>
      </ul>
      <p>Finding calcifications simply means the radiologist will examine their size, shape, and distribution to decide if they are benign or need closer inspection.</p>
    `
  },
  {
    id: "lump-mass",
    title: "What Can a Lump or Mass Indicate?",
    category: "Findings",
    readTime: "4 min read",
    tags: ["lump", "mass", "cyst", "fibroadenoma"],
    summary: "The majority of breast lumps turn out to be benign. Common non-cancerous causes include fluid-filled cysts and fibroadenomas.",
    content: `
      <p>Discovering a lump or reading that a mass was noted on a mammogram can cause immediate worry, but the vast majority (around 80%) of biopsied breast lumps are benign (non-cancerous).</p>
      <h4>Common Benign Causes:</h4>
      <ul>
        <li><strong>Cysts:</strong> Fluid-filled sacs that fluctuate in size and tenderness with hormonal cycles. Readily identified using an ultrasound.</li>
        <li><strong>Fibroadenomas:</strong> Smooth, firm, rubbery benign tumors composed of glandular and stromal tissue, very common in younger individuals.</li>
        <li><strong>Fibrocystic Changes:</strong> General lumpy or rope-like texture caused by normal hormonal shifts.</li>
        <li><strong>Fat Necrosis:</strong> Harmless scar tissue that forms following a breast injury or surgery.</li>
      </ul>
      <p>Any persistent lump or new mass should always be clinically evaluated by a doctor, usually with targeted ultrasound and diagnostic mammography.</p>
    `
  },
  {
    id: "screening-importance",
    title: "Why Regular Screening Matters",
    category: "Prevention",
    readTime: "3 min read",
    tags: ["screening", "guidelines", "prevention", "age"],
    summary: "Routine screening mammograms detect changes years before they can be felt physically, enabling earlier, less invasive interventions.",
    content: `
      <p>Screening mammograms are designed to detect potential issues at the earliest possible stage, often years before physical signs or symptoms become evident.</p>
      <h4>Screening Guidelines</h4>
      <p>General screening guidelines from major healthcare organizations suggest:</p>
      <ul>
        <li><strong>Ages 40 to 49:</strong> Option or recommendation to begin annual or biennial screening based on individual discussion with a healthcare provider.</li>
        <li><strong>Ages 50 to 74:</strong> Regular screening every 1 to 2 years for average-risk individuals.</li>
        <li><strong>High-Risk Individuals:</strong> Those with strong family histories, genetic mutations (such as BRCA1/2), or chest radiation at a young age may begin personalized screening earlier, often incorporating MRI.</li>
      </ul>
      <p>Discuss your individual risk profile with your doctor to establish your optimal screening schedule.</p>
    `
  },
  {
    id: "abnormal-finding",
    title: "What Happens After an Abnormal Finding?",
    category: "Follow-Up",
    readTime: "4 min read",
    tags: ["biopsy", "follow-up", "abnormal", "diagnostic", "callback"],
    summary: "Being called back for additional imaging after a screening mammogram is common and does NOT mean you have cancer.",
    content: `
      <p>Approximately 10% of screening mammograms result in a "call-back" for additional imaging. It is crucial to understand that fewer than 1 in 10 called-back individuals turn out to have cancer.</p>
      <h4>Typical Follow-Up Steps:</h4>
      <ol>
        <li><strong>Diagnostic Mammogram:</strong> Specialized high-magnification or spot compression views that focus on the exact area of concern.</li>
        <li><strong>Breast Ultrasound:</strong> Uses sound waves to determine whether a finding is a fluid-filled harmless cyst or solid tissue.</li>
        <li><strong>Follow-Up Mammogram in 6 Months:</strong> Used when a finding is categorized as "probably benign" (BI-RADS 3) to monitor for stability over time.</li>
        <li><strong>Minimally Invasive Biopsy:</strong> If a finding remains uncertain, a small needle sample is taken with local numbing medicine to examine cells under a microscope.</li>
      </ol>
      <p>Remember that a callback is simply an abundance of caution to ensure complete clarity.</p>
    `
  }
];

export const MYTH_FACT_QUESTIONS = [
  {
    id: 1,
    statement: "Having dense breast tissue means you have cancer.",
    isFact: false,
    explanation: "MYTH. Breast density does not mean you have cancer. Nearly half of all women who get mammograms have dense breasts. While density can make reading mammograms harder and represents a mild contributing risk factor, it is a normal anatomical characteristic, not a diagnosis."
  },
  {
    id: 2,
    statement: "Most breast lumps turn out to be non-cancerous (benign).",
    isFact: true,
    explanation: "FACT. Approximately 80% of breast lumps evaluated by clinicians are benign. Common benign causes include fluid-filled cysts, fibroadenomas, hormonal changes, and past tissue trauma."
  },
  {
    id: 3,
    statement: "If no one in my family had breast cancer, I don't need regular mammograms.",
    isFact: false,
    explanation: "MYTH. About 75% to 85% of people diagnosed with breast cancer have NO family history of the disease. Regular screening is recommended for all eligible individuals regardless of family background."
  },
  {
    id: 4,
    statement: "A mammogram callback means the radiologist found cancer.",
    isFact: false,
    explanation: "MYTH. Getting called back for extra views occurs in about 10% of screening exams. Only a small fraction (fewer than 10% of those called back) have a malignant finding. Callbacks are typically for clearer angles, resolving overlapping tissue, or taking ultrasound views."
  },
  {
    id: 5,
    statement: "Calcifications on a mammogram are always dangerous.",
    isFact: false,
    explanation: "MYTH. Calcifications are extremely common and the vast majority (especially large, rounded macrocalcifications) are completely benign and part of normal aging or healing."
  },
  {
    id: 6,
    statement: "Digital 3D mammograms (tomosynthesis) help radiologists see through dense tissue more clearly.",
    isFact: true,
    explanation: "FACT. 3D mammograms capture multiple slices through the breast, reducing overlapping tissue confusion and improving detection in dense breasts compared to standard 2D mammograms alone."
  }
];

/**
 * Returns personalized educational articles based on current assessment indicators.
 */
export function getRecommendedArticles(assessment) {
  if (!assessment || !assessment.category) {
    return [EDUCATIONAL_ARTICLES[0], EDUCATIONAL_ARTICLES[1]];
  }

  const recommended = [];
  const { lump, density, calcification, category } = assessment;

  if (density === "Heterogeneously dense" || density === "Extremely dense") {
    recommended.push(EDUCATIONAL_ARTICLES.find(a => a.id === "breast-density"));
  }

  if (lump === "Yes") {
    recommended.push(EDUCATIONAL_ARTICLES.find(a => a.id === "lump-mass"));
  }

  if (calcification === "Yes") {
    recommended.push(EDUCATIONAL_ARTICLES.find(a => a.id === "calcifications"));
  }

  if (category === "Higher Concern" || category === "Moderate Concern") {
    recommended.push(EDUCATIONAL_ARTICLES.find(a => a.id === "abnormal-finding"));
  }

  recommended.push(EDUCATIONAL_ARTICLES.find(a => a.id === "what-is-mammogram"));
  recommended.push(EDUCATIONAL_ARTICLES.find(a => a.id === "screening-importance"));

  // Deduplicate and slice top 3-4
  const unique = Array.from(new Set(recommended.filter(Boolean)));
  return unique.slice(0, 4);
}
