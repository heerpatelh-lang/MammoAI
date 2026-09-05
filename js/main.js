/**
 * MammoAI — Complete Client Application (Detecting Hope Early)
 * Unified robust script (Zero-dependency, CORS-free for file:// and http://)
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. DEMONSTRATION ASSESSMENT MODEL & CONFIGURATION
     ========================================================================== */
  const MODEL_CONFIG = {
    weights: {
      ageCategory: {
        "Under 40": { weight: 0.2, label: "Baseline age category (<40)" },
        "40–49": { weight: 1.0, label: "Recommended screening initiation age band" },
        "50–59": { weight: 1.8, label: "Statistical peak incidence age band" },
        "60+": { weight: 2.0, label: "Elevated statistical incidence age band" }
      },
      lump: {
        "No": { weight: 0.0, label: "No mass reported" },
        "Yes": { weight: 4.0, label: "Reported lump/mass (primary physical/radiological finding)" },
        "Unclear / Not reported": { weight: 0.0, label: "Unreported or unclear mass status" }
      },
      density: {
        "Low / fatty": { weight: 0.2, label: "Low density / mostly fatty (minimal masking effect)" },
        "Scattered": { weight: 0.8, label: "Scattered fibroglandular densities" },
        "Heterogeneously dense": { weight: 2.0, label: "Heterogeneously dense (moderate masking effect)" },
        "Extremely dense": { weight: 2.8, label: "Extremely dense (significant masking effect)" },
        "Not reported": { weight: 0.0, label: "Density not documented" }
      },
      calcification: {
        "No": { weight: 0.0, label: "No calcifications reported" },
        "Yes": { weight: 2.2, label: "Calcifications noted" },
        "Unclear / Not reported": { weight: 0.0, label: "Calcification status not noted" }
      }
    },
    thresholds: {
      lowerMax: 2.4,
      moderateMax: 5.4
    }
  };

  function getInfluenceLevel(weight, isUnclear) {
    if (isUnclear) return "Unreported / Not Factored";
    if (weight >= 3.0) return "Significant";
    if (weight >= 1.0) return "Contributing";
    return "No additional contribution";
  }

  function calculateAssessment(inputs) {
    const { ageCategory, lump, density, calcification } = inputs;

    const ageData = MODEL_CONFIG.weights.ageCategory[ageCategory] || { weight: 0 };
    const lumpData = MODEL_CONFIG.weights.lump[lump] || { weight: 0 };
    const densityData = MODEL_CONFIG.weights.density[density] || { weight: 0 };
    const calcData = MODEL_CONFIG.weights.calcification[calcification] || { weight: 0 };

    const rawScore = Number((ageData.weight + lumpData.weight + densityData.weight + calcData.weight).toFixed(1));

    let category = "Lower Concern";
    let badgeColor = "lower";
    let icon = "🟢";

    if (rawScore > MODEL_CONFIG.thresholds.moderateMax) {
      category = "Higher Concern";
      badgeColor = "higher";
      icon = "🔴";
    } else if (rawScore >= MODEL_CONFIG.thresholds.lowerMax) {
      category = "Moderate Concern";
      badgeColor = "moderate";
      icon = "🟡";
    }

    const factors = [
      {
        id: "lump",
        title: "Lump / Mass",
        answer: lump,
        weight: lumpData.weight,
        isUnclear: lump === "Unclear / Not reported",
        influence: getInfluenceLevel(lumpData.weight, lump === "Unclear / Not reported"),
        percent: Math.min(100, Math.round((lumpData.weight / 4.0) * 100)),
        educationalSummary: lump === "Yes"
          ? "A reported lump or mass is an indicator that warrants prompt evaluation by a clinician to determine if it is a cyst, fibroadenoma, or requires further imaging."
          : lump === "Unclear / Not reported"
          ? "This indicator was not clearly documented in your report. The prototype does not treat it as positive, but recommends clarifying your report with your provider."
          : "No lump or mass was reported, which is reassuring, though routine screening remains essential."
      },
      {
        id: "density",
        title: "Breast Tissue Density",
        answer: density,
        weight: densityData.weight,
        isUnclear: density === "Not reported",
        influence: getInfluenceLevel(densityData.weight, density === "Not reported"),
        percent: Math.min(100, Math.round((densityData.weight / 2.8) * 100)),
        educationalSummary: density === "Heterogeneously dense" || density === "Extremely dense"
          ? "Dense tissue is very common, occurring in nearly half of screening patients. While it is one contributing factor and can mask small details on standard mammography, density alone is not cancer."
          : density === "Not reported"
          ? "Breast density was not specified in your report. In many regions, providers provide density notifications following screening."
          : "Lower density tissue provides high contrast transparency on screening mammograms, making structural visualization straightforward."
      },
      {
        id: "calcification",
        title: "Calcifications",
        answer: calcification,
        weight: calcData.weight,
        isUnclear: calcification === "Unclear / Not reported",
        influence: getInfluenceLevel(calcData.weight, calcification === "Unclear / Not reported"),
        percent: Math.min(100, Math.round((calcData.weight / 2.2) * 100)),
        educationalSummary: calcification === "Yes"
          ? "Calcifications are tiny calcium deposits in breast tissue. The vast majority of calcifications (especially macrocalcifications) are benign, though certain patterns warrant diagnostic magnification views."
          : calcification === "Unclear / Not reported"
          ? "Calcification status was not stated. Unclear indicators are not counted as findings by the prototype."
          : "No calcifications were noted on this indicator."
      },
      {
        id: "ageCategory",
        title: "Age Category",
        answer: ageCategory,
        weight: ageData.weight,
        isUnclear: false,
        influence: getInfluenceLevel(ageData.weight, false),
        percent: Math.min(100, Math.round((ageData.weight / 2.0) * 100)),
        educationalSummary: ageCategory === "50–59" || ageCategory === "60+"
          ? "Age is a well-established demographic factor in screening guidelines; clinical organizations recommend regular biennial or annual mammograms in this age bracket."
          : ageCategory === "40–49"
          ? "Ages 40–49 mark the standard recommended window for individuals to begin regular screening conversations with healthcare providers."
          : "Under 40 is below average baseline screening age unless genetic or family history triggers earlier surveillance."
      }
    ];

    return {
      ageCategory,
      lump,
      density,
      calcification,
      score: rawScore,
      category,
      badgeColor,
      icon,
      factors,
      timestamp: new Date().toISOString()
    };
  }

  /* ==========================================================================
     2. DYNAMIC EXPLANATION & GUIDANCE GENERATOR
     ========================================================================== */
  function generateDynamicExplanation(assessment) {
    const { category, lump, density, calcification, ageCategory } = assessment;

    const keyFactors = [];
    if (lump === "Yes") keyFactors.push("a reported lump or mass");
    if (density === "Heterogeneously dense" || density === "Extremely dense") {
      keyFactors.push(`dense breast tissue (${density.toLowerCase()})`);
    }
    if (calcification === "Yes") keyFactors.push("the notation of calcifications");

    let opening = "";
    if (category === "Lower Concern") {
      opening = `Your selected indicators resulted in a **Lower Concern** category in this educational prototype. `;
    } else if (category === "Moderate Concern") {
      opening = `Your selected indicators resulted in a **Moderate Concern** category in this educational prototype. `;
    } else {
      opening = `Your selected indicators resulted in a **Higher Concern** category in this educational prototype. `;
    }

    let middle = "";
    if (keyFactors.length > 0) {
      middle = `In this model, ${keyFactors.join(" and ")} contributed directly to your assessment score along with your age category (${ageCategory}). `;
    } else {
      middle = `None of the higher-concern physical or radiological indicators (such as reported lumps or elevated density) were selected. `;
    }

    let unclearNotes = [];
    if (lump === "Unclear / Not reported") unclearNotes.push("lump/mass");
    if (density === "Not reported") unclearNotes.push("tissue density");
    if (calcification === "Unclear / Not reported") unclearNotes.push("calcifications");

    let missingNote = "";
    if (unclearNotes.length > 0) {
      missingNote = `Note: Information for ${unclearNotes.join(" and ")} was marked as unclear or not reported. The prototype does not treat missing indicators as positive findings, but completing those details with your provider will give a fuller picture. `;
    }

    const closing = `**Important**: These demonstration findings alone cannot determine whether cancer is present or absent. Only a qualified healthcare provider can interpret your complete clinical history and full imaging series.`;

    return opening + middle + missingNote + closing;
  }

  function getResultMeaning(category) {
    switch (category) {
      case "Lower Concern":
        return {
          title: "What does Lower Concern mean?",
          body: "Your selected indicators did not produce an elevated concern category in this educational prototype. This does not rule out a medical condition or replace regular checkups. You should continue following your healthcare professional's routine screening recommendations."
        };
      case "Moderate Concern":
        return {
          title: "What does Moderate Concern mean?",
          body: "Your selected indicators produced a Moderate Concern category in this prototype due to one or more notable findings (such as dense tissue, calcifications, or age profile). This does NOT mean that cancer is present. It means that discussing these specific findings with a qualified healthcare professional is recommended."
        };
      case "Higher Concern":
        return {
          title: "What does Higher Concern mean?",
          body: "Your selected indicators produced a Higher Concern category in this prototype, primarily driven by reported findings such as a lump or multiple converging indicators. This does NOT mean that cancer is present. However, prompt medical follow-up is recommended to review complete diagnostic imaging."
        };
      default:
        return {
          title: "Understanding Your Assessment",
          body: "Review your findings with a healthcare provider."
        };
    }
  }

  function getRecommendedAction(category) {
    switch (category) {
      case "Lower Concern":
        return {
          title: "Continue Routine Screening & Breast Awareness",
          action: "Continue routine screening according to your healthcare professional's recommendations and your personal risk profile.",
          steps: [
            "Maintain your routine screening appointment schedule (usually annual or biennial).",
            "Practice ongoing personal breast awareness and report any new changes.",
            "Keep copies of prior mammogram records for year-over-year comparison."
          ]
        };
      case "Moderate Concern":
        return {
          title: "Discuss Mammogram Findings with Your Doctor",
          action: "Schedule a discussion with your healthcare provider to review your complete radiology report and discuss if supplementary imaging (like ultrasound) is indicated.",
          steps: [
            "Obtain a full copy of your official radiology report, including BI-RADS assessment.",
            "Ask your doctor about the clinical significance of your breast density and calcification status.",
            "Clarify if any 6-month short-interval follow-up or routine re-screening is recommended."
          ]
        };
      case "Higher Concern":
        return {
          title: "Seek Medical Follow-Up Promptly",
          action: "Promptly contact your primary care physician or breast health specialist to review the findings and coordinate diagnostic workup.",
          steps: [
            "Contact your doctor's office or imaging center to schedule a prompt follow-up consultation.",
            "Inquire about diagnostic imaging (diagnostic mammogram with spot compression or targeted ultrasound).",
            "Bring prior imaging discs or reports to aid the radiologist in comparison."
          ]
        };
      default:
        return {
          title: "Consult a Healthcare Provider",
          action: "Discuss your results with a licensed doctor.",
          steps: ["Schedule an appointment with your healthcare professional."]
        };
    }
  }

  function generateDoctorQuestions(assessment) {
    const { category, lump, density, calcification } = assessment;
    const questions = [
      "What is the overall BI-RADS category assigned to my mammogram, and what does it mean for my care?"
    ];

    if (lump === "Yes") {
      questions.push("Regarding the reported lump/mass, is it suspected to be a fluid-filled cyst, benign tissue, or does it require targeted diagnostic ultrasound/biopsy?");
      questions.push("Has this area changed compared to any previous mammograms?");
    }

    if (density === "Heterogeneously dense" || density === "Extremely dense") {
      questions.push(`My report indicates ${density.toLowerCase()} tissue. Does this reduce the visibility of findings, and should we consider supplementary screening such as automated breast ultrasound (ABUS) or MRI?`);
    }

    if (calcification === "Yes") {
      questions.push("Are the calcifications categorized as typically benign (like macrocalcifications) or do they require magnification views to check their distribution and morphology?");
    }

    if (lump === "Unclear / Not reported" || density === "Not reported" || calcification === "Unclear / Not reported") {
      questions.push("Could you help me review my official written report to clarify items that were unclear or not documented?");
    }

    if (category === "Higher Concern") {
      questions.push("What are the immediate next diagnostic steps, and how soon should they be completed?");
      questions.push("Can your office help coordinate the diagnostic imaging appointment or referral?");
    } else {
      questions.push("Based on my personal and family history, at what interval should I schedule my next mammogram?");
    }

    questions.push("What symptoms or physical changes should I monitor between regular screenings?");
    return questions;
  }

  /* ==========================================================================
     3. EDUCATIONAL CONTENT & QUIZ DATA
     ========================================================================== */
  const EDUCATIONAL_ARTICLES = [
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
          <li><strong>Screening Mammogram:</strong> Performed routinely for individuals without signs or symptoms of breast disease. Usually consists of two views per breast.</li>
          <li><strong>Diagnostic Mammogram:</strong> Performed when a symptom is present (such as a palpable lump or skin change) or when an area on a screening mammogram requires magnified or additional angled views.</li>
        </ul>
        <p>Modern digital 3D mammography (tomosynthesis) takes images from multiple angles to construct a detailed layer-by-layer view of breast tissue.</p>
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
        <p>Approximately 10% of screening mammograms result in a "call-back" for additional imaging. Fewer than 1 in 10 called-back individuals turn out to have cancer.</p>
        <h4>Typical Follow-Up Steps:</h4>
        <ol>
          <li><strong>Diagnostic Mammogram:</strong> Specialized high-magnification or spot compression views focusing on the exact area of concern.</li>
          <li><strong>Breast Ultrasound:</strong> Uses sound waves to determine whether a finding is a fluid-filled harmless cyst or solid tissue.</li>
          <li><strong>Follow-Up Mammogram in 6 Months:</strong> Used when a finding is categorized as "probably benign" (BI-RADS 3) to monitor for stability over time.</li>
          <li><strong>Minimally Invasive Biopsy:</strong> If a finding remains uncertain, a small needle sample is taken with local numbing medicine to examine cells under a microscope.</li>
        </ol>
        <p>Remember that a callback is simply an abundance of caution to ensure complete clarity.</p>
      `
    }
  ];

  const MYTH_FACT_QUESTIONS = [
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

  function getRecommendedArticles(assessment) {
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

    const unique = Array.from(new Set(recommended.filter(Boolean)));
    return unique.slice(0, 4);
  }

  /* ==========================================================================
     4. CHATBOT COMPANION & SAFETY LAYER
     ========================================================================== */
  const MEDICAL_SAFETY_DISCLAIMER_ANSWER = 
    "MammoAI cannot determine whether you have cancer. This prototype only provides an educational assessment based on the indicators entered. Please discuss your mammogram report and concerns with a qualified healthcare professional.";

  function checkSafetyViolation(query) {
    const text = query.toLowerCase().trim();
    const cancerDiagnosisPatterns = [
      /do i have (breast )?cancer/i,
      /have i got cancer/i,
      /is it cancer/i,
      /could i have cancer/i,
      /am i going to die/i,
      /do i have a tumor/i,
      /is this malignant/i,
      /is my lump cancerous/i,
      /will i get cancer/i,
      /tell me if i have cancer/i,
      /rule out cancer/i,
      /do you think it's cancer/i
    ];

    for (const pattern of cancerDiagnosisPatterns) {
      if (pattern.test(text)) {
        return { isBlocked: true, response: MEDICAL_SAFETY_DISCLAIMER_ANSWER };
      }
    }

    const treatmentPatterns = [
      /what medication should i take/i,
      /what medicine/i,
      /what drug/i,
      /should i take tamoxifen/i,
      /prescribe/i,
      /how should i treat this/i,
      /treatment plan for my cancer/i,
      /chemotherapy dose/i
    ];

    for (const pattern of treatmentPatterns) {
      if (pattern.test(text)) {
        return {
          isBlocked: true,
          response: "MammoAI cannot prescribe medications, recommend treatments, or suggest clinical therapies. Any treatment plan or medication must be determined solely by a qualified oncologist or healthcare provider. Please consult your physician directly."
        };
      }
    }

    return { isBlocked: false };
  }

  function getChatbotResponse(userMessage, activeAssessment) {
    const safetyCheck = checkSafetyViolation(userMessage);
    if (safetyCheck.isBlocked) {
      return { reply: safetyCheck.response, isSafetyNotice: true };
    }

    const query = userMessage.toLowerCase();

    if (query.includes("why did i get") || query.includes("my result") || query.includes("my assessment") || query.includes("my concern")) {
      if (!activeAssessment || !activeAssessment.category) {
        return {
          reply: "You haven't completed an assessment yet! You can click 'Start Assessment' in the navigation to enter the 4 indicators (Age, Lump/Mass, Density, Calcification) and receive a personalized breakdown.",
          isSafetyNotice: false
        };
      }
      const { category, lump, density, calcification, ageCategory, score } = activeAssessment;
      return {
        reply: `Your prototype result was **${category}** (demonstration score: ${score}). This was produced because you selected:
• **Age Category:** ${ageCategory}
• **Lump / Mass:** ${lump}
• **Tissue Density:** ${density}
• **Calcification:** ${calcification}

${lump === 'Yes' ? '• The reported lump/mass had the highest influence in this rule-based model.\n' : ''}${density === 'Heterogeneously dense' || density === 'Extremely dense' ? '• Your dense breast tissue contributed to the score due to its masking effect on standard screening.\n' : ''}Remember, this is a student educational prototype model and has not been clinically validated. It does not mean cancer is present.`,
        isSafetyNotice: false
      };
    }

    if (query.includes("doctor") || query.includes("ask my doctor") || query.includes("question to ask") || query.includes("prepare")) {
      if (activeAssessment && activeAssessment.category) {
        return {
          reply: `Here are suggested questions to ask your doctor based on your **${activeAssessment.category}** assessment:
1. "What is the official BI-RADS score on my full radiology report?"
2. ${activeAssessment.density.includes("dense") ? `"Given my ${activeAssessment.density.toLowerCase()} tissue, would automated ultrasound (ABUS) or 3D tomosynthesis provide better visualization?"` : `"What routine screening schedule is appropriate for my age and history?"`}
3. ${activeAssessment.lump === 'Yes' ? `"What specific targeted follow-up is recommended for the reported lump?"` : `"Are there any subtle findings or calcifications that require short-interval 6-month monitoring?"`}
4. "How do my current images compare to any previous mammograms?"

You can also use the **Doctor Question Generator** on the Results page to copy a complete printable list!`,
          isSafetyNotice: false
        };
      }
      return {
        reply: "Great questions to ask your doctor include: 'What is my BI-RADS score?', 'What is my breast density category and does it require supplemental screening?', and 'When should my next routine mammogram be scheduled?'",
        isSafetyNotice: false
      };
    }

    if (query.includes("density") || query.includes("dense") || query.includes("heterogeneously") || query.includes("fatty")) {
      return {
        reply: "Breast density refers to the proportion of fibrous and glandular tissue compared to fatty tissue seen on a mammogram. Dense tissue (heterogeneously dense or extremely dense) appears white on an X-ray, just like potential abnormalities do, which can make subtle changes harder to spot. Having dense breasts is very common (found in nearly 50% of screening individuals) and is an anatomical characteristic, NOT cancer.",
        isSafetyNotice: false
      };
    }

    if (query.includes("calcification") || query.includes("calcium") || query.includes("white spots")) {
      return {
        reply: "Calcifications are tiny deposits of calcium salts within breast tissue that appear as bright white specks on mammograms. They are extremely common and not caused by taking calcium vitamins. **Macrocalcifications** are larger, coarse, and almost always benign. **Microcalcifications** are tiny specks that radiologists examine for specific patterns or clusters to decide if a magnification view or biopsy is needed.",
        isSafetyNotice: false
      };
    }

    if (query.includes("lump") || query.includes("mass") || query.includes("cyst") || query.includes("fibroadenoma")) {
      return {
        reply: "Finding a lump or having a mass noted on a report understandably causes worry, but roughly 80% of all breast lumps evaluated turn out to be completely benign! Frequent benign causes include fluid-filled cysts (which look like bubbles on ultrasound), fibroadenomas (common firm fibrous growths), or hormonal glandular changes. A doctor will typically perform a gentle ultrasound to examine its internal structure.",
        isSafetyNotice: false
      };
    }

    if (query.includes("what is a mammogram") || query.includes("mammography") || query.includes("how does a mammogram work")) {
      return {
        reply: "A mammogram is a low-dose X-ray of breast tissue. It compresses the tissue momentarily to spread out overlapping structures and captures detailed images from multiple angles. It is currently the primary proven tool for detecting subtle tissue variations years before any physical change could ever be felt.",
        isSafetyNotice: false
      };
    }

    if (query.includes("bi-rads") || query.includes("birads") || query.includes("category")) {
      return {
        reply: "BI-RADS stands for **Breast Imaging Reporting and Data System**. It is a standardized medical scoring system used by radiologists:\n• BI-RADS 0: Incomplete (additional views needed)\n• BI-RADS 1: Negative (normal)\n• BI-RADS 2: Benign (non-cancerous finding)\n• BI-RADS 3: Probably Benign (>98% benign; usually 6-month checkup)\n• BI-RADS 4: Suspicious (biopsy recommended)\n• BI-RADS 5: Highly suggestive of malignancy\n• BI-RADS 6: Known biopsy-proven malignancy",
        isSafetyNotice: false
      };
    }

    return {
      reply: "MammoAI is here to help you understand mammography terminology, screening guidelines, and your prototype assessment indicators. You can ask me about breast density, calcifications, what lumps often indicate, or what questions to bring to your doctor. How can I assist your learning today?",
      isSafetyNotice: false
    };
  }

  /* ==========================================================================
     5. CENTRAL APPLICATION STATE & CONTROLLERS
     ========================================================================== */
  const state = {
    activeView: 'home',
    currentAssessmentStep: 1,
    formInputs: {
      ageCategory: '',
      lump: '',
      density: '',
      calcification: ''
    },
    assessment: null,
    chatHistory: [
      {
        sender: 'assistant',
        text: "Hello! I am your **MammoAI Companion**. I'm here to explain mammogram terminology, discuss screening concepts, or help you understand your educational assessment. What would you like to explore?",
        isSafetyNotice: false
      }
    ],
    quiz: {
      currentIndex: 0,
      score: 0
    },
    followUpChecklist: {
      reviewReport: false,
      discussDoctor: false,
      prepQuestions: false,
      followSchedule: false
    }
  };

  function loadStoredState() {
    try {
      const saved = localStorage.getItem('mammoai_assessment');
      if (saved) {
        state.assessment = JSON.parse(saved);
        state.formInputs = {
          ageCategory: state.assessment.ageCategory,
          lump: state.assessment.lump,
          density: state.assessment.density,
          calcification: state.assessment.calcification
        };
      }
      const savedList = localStorage.getItem('mammoai_checklist');
      if (savedList) {
        state.followUpChecklist = JSON.parse(savedList);
      }
    } catch (e) {}
  }

  function saveAssessmentToStorage() {
    try {
      if (state.assessment) {
        localStorage.setItem('mammoai_assessment', JSON.stringify(state.assessment));
      }
    } catch (e) {}
  }

  function clearUserAssessment() {
    state.assessment = null;
    state.formInputs = { ageCategory: '', lump: '', density: '', calcification: '' };
    state.currentAssessmentStep = 1;
    try {
      localStorage.removeItem('mammoai_assessment');
    } catch (e) {}
    renderAssessmentForm();
    renderResultsView();
    renderRecommendedLearning();
    navigateTo('home');
    showToast("Assessment data successfully cleared.");
  }

  /* ==========================================================================
     6. NAVIGATION & ROUTING
     ========================================================================== */
  function navigateTo(viewName) {
    state.activeView = viewName;
    window.history.pushState({ view: viewName }, '', `#${viewName}`);
    renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderCurrentView() {
    const views = document.querySelectorAll('.view-section');
    views.forEach(v => v.classList.remove('active-view'));

    const activeElem = document.getElementById(`view-${state.activeView}`);
    if (activeElem) {
      activeElem.classList.add('active-view');
    } else {
      document.getElementById('view-home')?.classList.add('active-view');
    }

    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-navigate') === state.activeView) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    if (state.activeView === 'results') {
      renderResultsView();
    } else if (state.activeView === 'learn') {
      renderRecommendedLearning();
    } else if (state.activeView === 'assess') {
      renderAssessmentForm();
    }
  }

  function setupNavigation() {
    document.querySelectorAll('[data-navigate]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = el.getAttribute('data-navigate');
        navigateTo(targetView);
        document.getElementById('mobile-nav')?.classList.remove('open');
      });
    });

    document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => {
      document.getElementById('mobile-nav')?.classList.toggle('open');
    });

    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.view) {
        state.activeView = e.state.view;
        renderCurrentView();
      }
    });
  }

  /* ==========================================================================
     7. ASSESSMENT FORM WIZARD
     ========================================================================== */
  function getStepKey(stepIndex) {
    switch(stepIndex) {
      case 1: return 'ageCategory';
      case 2: return 'lump';
      case 3: return 'density';
      case 4: return 'calcification';
      default: return '';
    }
  }

  function updateStepButtons() {
    const currentKey = getStepKey(state.currentAssessmentStep);
    const nextBtn = document.getElementById('btn-step-next');
    if (nextBtn) {
      const isAnswered = Boolean(state.formInputs[currentKey]);
      nextBtn.disabled = !isAnswered;
    }
  }

  function renderAssessmentForm() {
    for (let i = 1; i <= 4; i++) {
      const stepTab = document.getElementById(`step-indicator-${i}`);
      if (!stepTab) continue;
      stepTab.classList.remove('active', 'completed');
      if (i === state.currentAssessmentStep) {
        stepTab.classList.add('active');
      } else if (i < state.currentAssessmentStep) {
        stepTab.classList.add('completed');
      }
    }

    for (let i = 1; i <= 4; i++) {
      const stepCard = document.getElementById(`step-card-${i}`);
      if (!stepCard) continue;
      stepCard.style.display = (i === state.currentAssessmentStep) ? 'block' : 'none';
    }

    const currentKey = getStepKey(state.currentAssessmentStep);
    const selectedVal = state.formInputs[currentKey];
    const stepCard = document.getElementById(`step-card-${state.currentAssessmentStep}`);
    if (stepCard) {
      stepCard.querySelectorAll('.indicator-option').forEach(btn => {
        btn.classList.toggle('selected', btn.getAttribute('data-value') === selectedVal);
      });
    }

    const backBtn = document.getElementById('btn-step-back');
    if (backBtn) {
      backBtn.style.visibility = (state.currentAssessmentStep === 1) ? 'hidden' : 'visible';
    }

    const nextBtn = document.getElementById('btn-step-next');
    if (nextBtn) {
      nextBtn.innerHTML = (state.currentAssessmentStep === 4)
        ? 'Analyze My Results →'
        : 'Continue →';
    }

    updateStepButtons();
  }

  function setupAssessmentForm() {
    document.querySelectorAll('.indicator-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const stepKey = btn.getAttribute('data-step-key');
        const value = btn.getAttribute('data-value');
        state.formInputs[stepKey] = value;

        const parent = btn.closest('.step-options-grid');
        parent.querySelectorAll('.indicator-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        updateStepButtons();
      });
    });

    document.getElementById('btn-step-next')?.addEventListener('click', () => {
      if (state.currentAssessmentStep < 4) {
        state.currentAssessmentStep++;
        renderAssessmentForm();
      } else {
        runAssessmentAnalysis();
      }
    });

    document.getElementById('btn-step-back')?.addEventListener('click', () => {
      if (state.currentAssessmentStep > 1) {
        state.currentAssessmentStep--;
        renderAssessmentForm();
      }
    });
  }

  function runAssessmentAnalysis() {
    navigateTo('analyzing');

    const step1 = document.getElementById('analysis-phase-1');
    const step2 = document.getElementById('analysis-phase-2');
    const step3 = document.getElementById('analysis-phase-3');
    const step4 = document.getElementById('analysis-phase-4');
    const stepFinal = document.getElementById('analysis-phase-final');

    const phases = [step1, step2, step3, step4, stepFinal];
    phases.forEach(p => { if (p) { p.classList.remove('active', 'done'); } });

    state.assessment = calculateAssessment(state.formInputs);
    saveAssessmentToStorage();

    setTimeout(() => { step1?.classList.add('active'); }, 200);
    setTimeout(() => {
      step1?.classList.remove('active');
      step1?.classList.add('done');
      step2?.classList.add('active');
    }, 1000);
    setTimeout(() => {
      step2?.classList.remove('active');
      step2?.classList.add('done');
      step3?.classList.add('active');
    }, 1800);
    setTimeout(() => {
      step3?.classList.remove('active');
      step3?.classList.add('done');
      step4?.classList.add('active');
    }, 2500);
    setTimeout(() => {
      step4?.classList.remove('active');
      step4?.classList.add('done');
      stepFinal?.classList.add('active');
    }, 3200);
    setTimeout(() => {
      navigateTo('results');
    }, 3900);
  }

  /* ==========================================================================
     8. RESULTS VIEW & EXPLAIN MY RESULT
     ========================================================================== */
  function renderResultsView() {
    const resultsContainer = document.getElementById('results-content');
    const emptyState = document.getElementById('results-empty-state');

    if (!state.assessment) {
      if (resultsContainer) resultsContainer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (resultsContainer) resultsContainer.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    const { category, badgeColor, icon, factors } = state.assessment;

    const badgeElem = document.getElementById('result-category-badge');
    if (badgeElem) {
      badgeElem.className = `concern-badge badge-${badgeColor}`;
      badgeElem.innerHTML = `<span class="badge-icon">${icon}</span> <span class="badge-label">${category}</span>`;
    }

    const factorsGrid = document.getElementById('result-factors-grid');
    if (factorsGrid) {
      factorsGrid.innerHTML = factors.map(f => `
        <div class="factor-summary-card">
          <div class="factor-meta">
            <span class="factor-name">${f.title}</span>
            <span class="factor-influence-pill pill-${f.influence.toLowerCase().replace(/[^a-z0-9]/g, '-')}">${f.influence}</span>
          </div>
          <div class="factor-answer">${f.answer}</div>
        </div>
      `).join('');
    }

    const explanationText = document.getElementById('dynamic-explanation-text');
    if (explanationText) {
      explanationText.innerHTML = generateDynamicExplanation(state.assessment).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    const factorBreakdownContainer = document.getElementById('factor-breakdown-list');
    if (factorBreakdownContainer) {
      factorBreakdownContainer.innerHTML = factors.map(f => `
        <div class="factor-detail-item">
          <div class="factor-detail-header">
            <div class="factor-detail-title">
              <strong>${f.title}</strong>
              <span class="factor-user-answer">Your answer: <em>${f.answer}</em></span>
            </div>
            <span class="factor-influence-pill pill-${f.influence.toLowerCase().replace(/[^a-z0-9]/g, '-')}">
              Model Influence: ${f.influence}
            </span>
          </div>
          <p class="factor-detail-desc">${f.educationalSummary}</p>
          <div class="factor-bar-wrapper">
            <div class="factor-bar-track">
              <div class="factor-bar-fill" style="width: ${f.percent}%"></div>
            </div>
          </div>
        </div>
      `).join('');
    }

    const meaning = getResultMeaning(category);
    const meaningBody = document.getElementById('result-meaning-body');
    if (meaningBody) {
      meaningBody.textContent = meaning.body;
    }

    const action = getRecommendedAction(category);
    const actionTitle = document.getElementById('recommended-action-title');
    const actionDesc = document.getElementById('recommended-action-desc');
    const actionSteps = document.getElementById('recommended-action-steps');

    if (actionTitle) actionTitle.textContent = action.title;
    if (actionDesc) actionDesc.textContent = action.action;
    if (actionSteps) {
      actionSteps.innerHTML = action.steps.map(s => `<li>${s}</li>`).join('');
    }

    renderDoctorQuestions();
  }

  function renderDoctorQuestions() {
    if (!state.assessment) return;
    const questions = generateDoctorQuestions(state.assessment);
    const listElem = document.getElementById('doctor-questions-list');
    if (listElem) {
      listElem.innerHTML = questions.map(q => `
        <li class="doctor-question-item">
          <span class="question-check">○</span>
          <span class="question-text">${q}</span>
        </li>
      `).join('');
    }

    const copyBtn = document.getElementById('btn-copy-questions');
    if (copyBtn) {
      copyBtn.onclick = () => {
        const textToCopy = questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n');
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast("Questions copied to clipboard!");
          copyBtn.textContent = "✓ Questions Copied!";
          setTimeout(() => {
            copyBtn.textContent = "📋 Copy Questions";
          }, 2500);
        }).catch(() => {
          showToast("Questions list ready to copy.");
        });
      };
    }
  }

  /* ==========================================================================
     9. CHATBOT COMPANION INTERFACE
     ========================================================================== */
  function formatMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n•/g, '<br>•')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n([0-9]+\.)/g, '<br>$1');
  }

  function renderChatHistory() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    container.innerHTML = state.chatHistory.map(msg => `
      <div class="chat-message ${msg.sender}-message ${msg.isSafetyNotice ? 'safety-alert-message' : ''}">
        <div class="message-sender-tag">${msg.sender === 'user' ? 'You' : 'MammoAI Companion'}</div>
        <div class="message-bubble">
          ${formatMarkdown(msg.text)}
        </div>
      </div>
    `).join('');

    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }

  function sendMessage(userText) {
    state.chatHistory.push({
      sender: 'user',
      text: userText,
      isSafetyNotice: false
    });
    renderChatHistory();

    const chatContainer = document.getElementById('chat-messages');
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-message assistant-message typing';
    typingIndicator.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatContainer?.appendChild(typingIndicator);
    chatContainer?.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });

    setTimeout(() => {
      typingIndicator.remove();
      const response = getChatbotResponse(userText, state.assessment);
      state.chatHistory.push({
        sender: 'assistant',
        text: response.reply,
        isSafetyNotice: response.isSafetyNotice
      });
      renderChatHistory();
    }, 400);
  }

  function setupChatbot() {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const promptPills = document.querySelectorAll('.prompt-pill');

    chatForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = chatInput?.value.trim();
      if (!query) return;
      sendMessage(query);
      if (chatInput) chatInput.value = '';
    });

    promptPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const prompt = pill.getAttribute('data-prompt');
        if (prompt) {
          sendMessage(prompt);
        }
      });
    });

    renderChatHistory();
  }

  /* ==========================================================================
     10. LEARN SECTION, ARTICLES & QUIZ
     ========================================================================== */
  function renderArticlesList(articles) {
    const container = document.getElementById('learning-articles-grid');
    if (!container) return;

    if (articles.length === 0) {
      container.innerHTML = `<p class="no-results-text">No articles found matching your query. Try searching for "density", "lump", or "calcifications".</p>`;
      return;
    }

    container.innerHTML = articles.map(art => `
      <div class="educational-card" id="card-${art.id}">
        <div class="card-category-pill">${art.category} • ${art.readTime}</div>
        <h3 class="card-title">${art.title}</h3>
        <p class="card-summary">${art.summary}</p>
        <button class="btn-expand-article" data-article-id="${art.id}">Read Guide ↓</button>
        <div class="article-full-content" id="content-${art.id}" style="display: none;">
          ${art.content}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-expand-article').forEach(btn => {
      btn.addEventListener('click', () => {
        const artId = btn.getAttribute('data-article-id');
        const contentElem = document.getElementById(`content-${artId}`);
        if (contentElem) {
          const isShown = contentElem.style.display === 'block';
          contentElem.style.display = isShown ? 'none' : 'block';
          btn.textContent = isShown ? 'Read Guide ↓' : 'Collapse Guide ↑';
        }
      });
    });
  }

  function renderRecommendedLearning() {
    const recContainer = document.getElementById('recommended-articles-wrapper');
    if (!recContainer) return;

    const recs = getRecommendedArticles(state.assessment);
    if (!state.assessment) {
      recContainer.innerHTML = `
        <div class="recommended-banner">
          <p>💡 Complete an assessment to see personalized reading recommendations based on your reported density, mass, or calcifications.</p>
          <button class="btn-secondary" data-navigate="assess">Take Assessment →</button>
        </div>
      `;
      recContainer.querySelector('button')?.addEventListener('click', () => navigateTo('assess'));
      return;
    }

    recContainer.innerHTML = `
      <div class="personalized-rec-header" style="margin-bottom: 12px;">
        <h4 style="color: var(--plum-primary); font-size: 1.15rem;">Recommended based on your ${state.assessment.category} indicators:</h4>
      </div>
      <div class="recommended-cards-grid">
        ${recs.map(art => `
          <div class="rec-mini-card" data-jump-article="${art.id}">
            <span class="rec-category">${art.category}</span>
            <h5>${art.title}</h5>
            <p>${art.summary}</p>
            <span class="rec-link">Explore Topic →</span>
          </div>
        `).join('')}
      </div>
    `;

    recContainer.querySelectorAll('.rec-mini-card').forEach(card => {
      card.addEventListener('click', () => {
        const artId = card.getAttribute('data-jump-article');
        const targetCard = document.getElementById(`card-${artId}`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const contentElem = document.getElementById(`content-${artId}`);
          const btn = targetCard.querySelector('.btn-expand-article');
          if (contentElem && btn) {
            contentElem.style.display = 'block';
            btn.textContent = 'Collapse Guide ↑';
          }
        }
      });
    });
  }

  function renderQuizQuestion() {
    const quizBox = document.getElementById('myth-fact-box');
    if (!quizBox) return;

    const currentQ = MYTH_FACT_QUESTIONS[state.quiz.currentIndex];

    if (!currentQ) {
      quizBox.innerHTML = `
        <div class="quiz-complete-card">
          <h3>🎉 Quiz Complete!</h3>
          <p class="quiz-score-badge">You got <strong>${state.quiz.score} / ${MYTH_FACT_QUESTIONS.length}</strong> correct!</p>
          <p style="color: var(--text-muted); margin-bottom: 20px;">You've taken a wonderful step toward understanding breast health and screening facts.</p>
          <button class="btn-primary" id="btn-restart-quiz">Restart Quiz</button>
        </div>
      `;
      document.getElementById('btn-restart-quiz')?.addEventListener('click', () => {
        setupMythFactQuiz();
      });
      return;
    }

    quizBox.innerHTML = `
      <div class="quiz-header">
        <span class="quiz-progress">Question ${state.quiz.currentIndex + 1} of ${MYTH_FACT_QUESTIONS.length}</span>
        <span class="quiz-score">Score: ${state.quiz.score}</span>
      </div>
      <div class="quiz-question-statement">
        "${currentQ.statement}"
      </div>
      <div class="quiz-actions" id="quiz-btn-group">
        <button class="btn-quiz btn-myth" id="btn-answer-myth">MYTH</button>
        <button class="btn-quiz btn-fact" id="btn-answer-fact">FACT</button>
      </div>
      <div class="quiz-feedback-box" id="quiz-feedback" style="display: none;"></div>
    `;

    document.getElementById('btn-answer-myth')?.addEventListener('click', () => handleQuizAnswer(false));
    document.getElementById('btn-answer-fact')?.addEventListener('click', () => handleQuizAnswer(true));
  }

  function handleQuizAnswer(userChoseFact) {
    const currentQ = MYTH_FACT_QUESTIONS[state.quiz.currentIndex];
    const isCorrect = (userChoseFact === currentQ.isFact);

    if (isCorrect) state.quiz.score++;

    const feedbackBox = document.getElementById('quiz-feedback');
    const btnGroup = document.getElementById('quiz-btn-group');
    if (btnGroup) btnGroup.style.display = 'none';

    if (feedbackBox) {
      feedbackBox.style.display = 'block';
      feedbackBox.className = `quiz-feedback-box ${isCorrect ? 'correct' : 'incorrect'}`;
      feedbackBox.innerHTML = `
        <div class="feedback-badge">${isCorrect ? '✓ Correct!' : '✗ Not quite!'}</div>
        <p class="feedback-explanation">${currentQ.explanation}</p>
        <button class="btn-primary" id="btn-next-question">
          ${state.quiz.currentIndex + 1 < MYTH_FACT_QUESTIONS.length ? 'Next Question →' : 'View Final Score →'}
        </button>
      `;

      document.getElementById('btn-next-question')?.addEventListener('click', () => {
        state.quiz.currentIndex++;
        renderQuizQuestion();
      });
    }
  }

  function setupMythFactQuiz() {
    state.quiz.currentIndex = 0;
    state.quiz.score = 0;
    renderQuizQuestion();
  }

  function setupLearnSection() {
    renderArticlesList(EDUCATIONAL_ARTICLES);

    document.getElementById('library-search-input')?.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      if (!term) {
        renderArticlesList(EDUCATIONAL_ARTICLES);
        return;
      }
      const filtered = EDUCATIONAL_ARTICLES.filter(art => 
        art.title.toLowerCase().includes(term) ||
        art.summary.toLowerCase().includes(term) ||
        art.tags.some(t => t.toLowerCase().includes(term))
      );
      renderArticlesList(filtered);
    });

    setupMythFactQuiz();
  }

  /* ==========================================================================
     11. FOLLOW-UP CHECKLIST
     ========================================================================== */
  function setupChecklist() {
    const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    checkboxes.forEach(cb => {
      const key = cb.getAttribute('data-checklist-key');
      if (key && state.followUpChecklist[key]) {
        cb.checked = true;
      }
      cb.addEventListener('change', () => {
        if (key) {
          state.followUpChecklist[key] = cb.checked;
          try {
            localStorage.setItem('mammoai_checklist', JSON.stringify(state.followUpChecklist));
          } catch (e) {}
        }
      });
    });
  }

  /* ==========================================================================
     12. COMPETITION DEMO MODE
     ========================================================================== */
  function loadDemoScenario(scenarioNumber) {
    if (scenarioNumber === '1') {
      state.formInputs = {
        ageCategory: '40–49',
        lump: 'No',
        density: 'Low / fatty',
        calcification: 'No'
      };
    } else if (scenarioNumber === '2') {
      state.formInputs = {
        ageCategory: '50–59',
        lump: 'No',
        density: 'Heterogeneously dense',
        calcification: 'Yes'
      };
    } else if (scenarioNumber === '3') {
      state.formInputs = {
        ageCategory: '60+',
        lump: 'Yes',
        density: 'Extremely dense',
        calcification: 'Yes'
      };
    }

    state.currentAssessmentStep = 4;
    showToast(`Loaded Demonstration Scenario ${scenarioNumber}`);
    runAssessmentAnalysis();
  }

  function setupDemoMode() {
    const demoToggle = document.getElementById('toggle-demo-mode');
    const demoModal = document.getElementById('demo-scenarios-modal');
    const closeDemoModal = document.getElementById('btn-close-demo-modal');

    demoToggle?.addEventListener('click', () => {
      demoModal?.classList.add('active');
    });

    closeDemoModal?.addEventListener('click', () => {
      demoModal?.classList.remove('active');
    });

    document.querySelectorAll('[data-demo-scenario]').forEach(btn => {
      btn.addEventListener('click', () => {
        const scenario = btn.getAttribute('data-demo-scenario');
        loadDemoScenario(scenario);
        demoModal?.classList.remove('active');
      });
    });
  }

  /* ==========================================================================
     13. TOOLTIPS & GLOBAL LISTENERS
     ========================================================================== */
  function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  function setupGlobalEvents() {
    const infoModal = document.getElementById('info-modal');
    const infoModalTitle = document.getElementById('info-modal-title');
    const infoModalBody = document.getElementById('info-modal-body');
    const infoModalClose = document.getElementById('info-modal-close');

    const questionExplanations = {
      ageCategory: {
        title: "Why does age matter?",
        body: "Breast cancer incidence statistically rises with age. Clinical screening recommendations (such as starting regular mammograms in your 40s and continuing through your 70s) are established around age-based evidence. In our prototype, age is one demographic indicator considered alongside physical findings."
      },
      lump: {
        title: "What does lump or mass mean?",
        body: "A lump or mass refers to an identifiable focal density or palpable area in breast tissue. While a reported lump is the primary physical sign evaluated, roughly 80% of breast lumps turn out to be harmless, fluid-filled cysts or benign fibroadenomas. Any new lump should always be evaluated with targeted diagnostic imaging."
      },
      density: {
        title: "What is breast tissue density?",
        body: "Breast density compares the amount of fibrous and glandular tissue against fatty tissue on a mammogram. Dense tissue appears white on X-rays, which can mask small abnormalities that also appear white. Dense breasts are very common (nearly 50% of screening individuals) and are a normal anatomical feature, not cancer."
      },
      calcification: {
        title: "What are calcifications?",
        body: "Calcifications are microscopic calcium deposits in breast tissue. Macrocalcifications are large and almost always benign (caused by aging or old trauma). Microcalcifications are tiny specks; while usually non-cancerous, specific clustered patterns may warrant magnified views to verify."
      }
    };

    document.querySelectorAll('.btn-question-info').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const topic = btn.getAttribute('data-info-topic');
        const data = questionExplanations[topic];
        if (data && infoModal && infoModalTitle && infoModalBody) {
          infoModalTitle.textContent = data.title;
          infoModalBody.textContent = data.body;
          infoModal.classList.add('active');
        }
      });
    });

    infoModalClose?.addEventListener('click', () => {
      infoModal?.classList.remove('active');
    });

    window.addEventListener('click', (e) => {
      if (e.target === infoModal) infoModal?.classList.remove('active');
      const demoModal = document.getElementById('demo-scenarios-modal');
      if (e.target === demoModal) demoModal?.classList.remove('active');
    });

    document.getElementById('btn-clear-assessment')?.addEventListener('click', () => {
      if (confirm("Clear your current assessment and inputs from this browser?")) {
        clearUserAssessment();
      }
    });

    const toggleAiLogicBtn = document.getElementById('btn-toggle-ai-logic');
    const aiLogicContent = document.getElementById('transparent-ai-logic-details');
    toggleAiLogicBtn?.addEventListener('click', () => {
      const isVisible = aiLogicContent?.style.display === 'block';
      if (aiLogicContent) aiLogicContent.style.display = isVisible ? 'none' : 'block';
      if (toggleAiLogicBtn) {
        toggleAiLogicBtn.innerHTML = isVisible 
          ? '<span>🧠 How did MammoAI reach this result?</span> <span class="arrow">↓</span>'
          : '<span>🧠 How did MammoAI reach this result?</span> <span class="arrow">↑</span>';
      }
    });
  }

  /* Initialize on DOM Ready */
  document.addEventListener('DOMContentLoaded', () => {
    loadStoredState();
    setupNavigation();
    setupAssessmentForm();
    setupChatbot();
    setupLearnSection();
    setupChecklist();
    setupDemoMode();
    setupGlobalEvents();
    renderCurrentView();
  });

})();
