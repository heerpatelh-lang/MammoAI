/**
 * MammoAI — Educational AI Companion Engine
 * 
 * Includes:
 * 1. Strict Medical Safety Layer (intercepts diagnosis, medication, cancer confirmation)
 * 2. Assessment Context Awareness (incorporates active indicators and results)
 * 3. Educational Knowledge Base & Fallback Response Engine
 */

export const MEDICAL_SAFETY_DISCLAIMER_ANSWER = 
  "MammoAI cannot determine whether you have cancer. This prototype only provides an educational assessment based on the indicators entered. Please discuss your mammogram report and concerns with a qualified healthcare professional.";

/**
 * Checks if the prompt triggers strict medical safety restrictions.
 */
export function checkSafetyViolation(query) {
  const text = query.toLowerCase().trim();

  // Explicit cancer diagnosis inquiry
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
      return {
        isBlocked: true,
        response: MEDICAL_SAFETY_DISCLAIMER_ANSWER
      };
    }
  }

  // Medication or treatment prescribing inquiry
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

/**
 * Processes a user message in context of the current assessment.
 * 
 * @param {string} userMessage
 * @param {Object|null} activeAssessment
 * @returns {Object} { reply: string, isSafetyNotice: boolean }
 */
export function getChatbotResponse(userMessage, activeAssessment) {
  const safetyCheck = checkSafetyViolation(userMessage);
  if (safetyCheck.isBlocked) {
    return {
      reply: safetyCheck.response,
      isSafetyNotice: true
    };
  }

  const query = userMessage.toLowerCase();

  // 1. Inquiries about the user's specific result/assessment
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

  // 2. Questions for doctor
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

  // 3. Breast density explanation
  if (query.includes("density") || query.includes("dense") || query.includes("heterogeneously") || query.includes("fatty")) {
    return {
      reply: "Breast density refers to the proportion of fibrous and glandular tissue compared to fatty tissue seen on a mammogram. Dense tissue (heterogeneously dense or extremely dense) appears white on an X-ray, just like potential abnormalities do, which can make subtle changes harder to spot. Having dense breasts is very common (found in nearly 50% of screening individuals) and is an anatomical characteristic, NOT cancer.",
      isSafetyNotice: false
    };
  }

  // 4. Calcification explanation
  if (query.includes("calcification") || query.includes("calcium") || query.includes("white spots")) {
    return {
      reply: "Calcifications are tiny deposits of calcium salts within breast tissue that appear as bright white specks on mammograms. They are extremely common and not caused by taking calcium vitamins. **Macrocalcifications** are larger, coarse, and almost always benign. **Microcalcifications** are tiny specks that radiologists examine for specific patterns or clusters to decide if a magnification view or biopsy is needed.",
      isSafetyNotice: false
    };
  }

  // 5. Lump or mass inquiry
  if (query.includes("lump") || query.includes("mass") || query.includes("cyst") || query.includes("fibroadenoma")) {
    return {
      reply: "Finding a lump or having a mass noted on a report understandably causes worry, but roughly 80% of all breast lumps evaluated turn out to be completely benign! Frequent benign causes include fluid-filled cysts (which look like bubbles on ultrasound), fibroadenomas (common firm fibrous growths), or hormonal glandular changes. A doctor will typically perform a gentle ultrasound to examine its internal structure.",
      isSafetyNotice: false
    };
  }

  // 6. Mammogram explanation
  if (query.includes("what is a mammogram") || query.includes("mammography") || query.includes("how does a mammogram work")) {
    return {
      reply: "A mammogram is a low-dose X-ray of breast tissue. It compresses the tissue momentarily to spread out overlapping structures and captures detailed images from multiple angles. It is currently the primary proven tool for detecting subtle tissue variations years before any physical change could ever be felt.",
      isSafetyNotice: false
    };
  }

  // 7. BI-RADS explanation
  if (query.includes("bi-rads") || query.includes("birads") || query.includes("category")) {
    return {
      reply: "BI-RADS stands for **Breast Imaging Reporting and Data System**. It is a standardized medical scoring system used by radiologists:\n• BI-RADS 0: Incomplete (additional views needed)\n• BI-RADS 1: Negative (normal)\n• BI-RADS 2: Benign (non-cancerous finding)\n• BI-RADS 3: Probably Benign (>98% benign; usually 6-month checkup)\n• BI-RADS 4: Suspicious (biopsy recommended)\n• BI-RADS 5: Highly suggestive of malignancy\n• BI-RADS 6: Known biopsy-proven malignancy",
      isSafetyNotice: false
    };
  }

  // 8. General inquiry / Fallback
  return {
    reply: "MammoAI is here to help you understand mammography terminology, screening guidelines, and your prototype assessment indicators. You can ask me about breast density, calcifications, what lumps often indicate, or what questions to bring to your doctor. How can I assist your learning today?",
    isSafetyNotice: false
  };
}
