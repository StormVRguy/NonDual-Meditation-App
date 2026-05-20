// Feature presets for dashboard variants.
// Pass a preset via spread to the Dashboard shell component to control visible sections.
// To add new feature combinations for future groups, add a new entry here.

export const dashboardFeatures = {
  // Default for most groups: all optional sections shown
  full: {
    showBodyScanMeditation: true,
    showAdditionalLecture: true,
  },

  // Core only: just main meditation + main lecture + questionnaire
  coreOnly: {
    showBodyScanMeditation: false,
    showAdditionalLecture: false,
  },

  // Uncomment / extend as needed for future variants:
  // withBodyScan: { showBodyScanMeditation: true, showAdditionalLecture: false },
  // withExtraLecture: { showBodyScanMeditation: false, showAdditionalLecture: true },
}
