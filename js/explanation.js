/**
 * MammoAI — Explanation & Recommendation Engine
 * 
 * Generates dynamic, personalized, human-centered explanations
 * based on the active assessment object.
 */

/**
 * Generates a dynamic explanation text tailored to the user's exact inputs.
 * 
 * @param {Object} assessment
 * @returns {string}
 */
export function generateDynamicExplanation(assessment) {
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

/**
 * Returns the category-specific "What does this result mean?" text.
 */
export function getResultMeaning(category) {
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

/**
 * Returns the category-specific "What should I do next?" recommendation.
 */
export function getRecommendedAction(category) {
  switch (category) {
    case "Lower Concern":
      return {
        badge: "Routine Schedule",
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
        badge: "Provider Discussion",
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
        badge: "Prompt Follow-Up",
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
        badge: "Consultation",
        title: "Consult a Healthcare Provider",
        action: "Discuss your results with a licensed doctor.",
        steps: ["Schedule an appointment with your healthcare professional."]
      };
  }
}

/**
 * Dynamically generates a prioritized list of doctor discussion questions based on assessment inputs.
 * 
 * @param {Object} assessment
 * @returns {string[]}
 */
export function generateDoctorQuestions(assessment) {
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
