/**
 * MammoAI — Demonstration Assessment Model
 * 
 * IMPORTANT MEDICAL SAFETY:
 * This model is a transparent demonstration rule-based scoring prototype
 * designed for educational purposes only. It is NOT clinically validated,
 * does NOT diagnose cancer, and does NOT generate real cancer probabilities.
 */

export const MODEL_CONFIG = {
  // Demonstration weights for indicators
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
      "Unclear / Not reported": { weight: 0.0, label: "Unreported or unclear mass status (treated as non-positive, unverified)" }
    },
    density: {
      "Low / fatty": { weight: 0.2, label: "Low density / mostly fatty (minimal masking effect)" },
      "Scattered": { weight: 0.8, label: "Scattered fibroglandular densities (typical distribution)" },
      "Heterogeneously dense": { weight: 2.0, label: "Heterogeneously dense (moderate masking effect on mammograms)" },
      "Extremely dense": { weight: 2.8, label: "Extremely dense (significant masking effect and biological factor)" },
      "Not reported": { weight: 0.0, label: "Density not documented in report (treated as unverified)" }
    },
    calcification: {
      "No": { weight: 0.0, label: "No calcifications reported" },
      "Yes": { weight: 2.2, label: "Calcifications noted (may represent benign or diagnostic area of interest)" },
      "Unclear / Not reported": { weight: 0.0, label: "Calcification status not noted (treated as unverified)" }
    }
  },

  // Concern category thresholds
  thresholds: {
    lowerMax: 2.4,      // 0.0 - 2.4 => Lower Concern
    moderateMax: 5.4,   // 2.5 - 5.4 => Moderate Concern
    // > 5.4 => Higher Concern
  },

  // Maximum possible score for normalizing influence visualization bars
  maxTheoreticalScore: 11.0
};

/**
 * Calculates the educational assessment result based on user inputs.
 * 
 * @param {Object} inputs
 * @param {string} inputs.ageCategory
 * @param {string} inputs.lump
 * @param {string} inputs.density
 * @param {string} inputs.calcification
 * @returns {Object} assessment
 */
export function calculateAssessment(inputs) {
  const { ageCategory, lump, density, calcification } = inputs;

  const ageData = MODEL_CONFIG.weights.ageCategory[ageCategory] || { weight: 0, label: "Not provided" };
  const lumpData = MODEL_CONFIG.weights.lump[lump] || { weight: 0, label: "Not provided" };
  const densityData = MODEL_CONFIG.weights.density[density] || { weight: 0, label: "Not provided" };
  const calcData = MODEL_CONFIG.weights.calcification[calcification] || { weight: 0, label: "Not provided" };

  const rawScore = Number((ageData.weight + lumpData.weight + densityData.weight + calcData.weight).toFixed(1));

  // Determine Level of Concern
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

  // Factor breakdown with influence levels
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
      percent: Math.min(100, Math.round((calcData.weight / 2.5) * 100)),
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

/**
 * Classifies the numerical weight into a transparent human-readable influence tag.
 */
function getInfluenceLevel(weight, isUnclear) {
  if (isUnclear) return "Unreported / Not Factored";
  if (weight >= 3.0) return "Significant";
  if (weight >= 1.0) return "Contributing";
  return "No additional contribution";
}
