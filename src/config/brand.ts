/**
 * NeoNattle — CENTRAL BRAND CONFIGURATION
 * Official brand identity, terminology, descriptors, and company attribution.
 */

export const BRAND = {
  name: 'NeoNattle',
  shortName: 'NeoNattle',
  companyName: 'Avenza',
  attribution: 'Developed by Avenza',
  productCategory: 'Educational Neonatal Environment Monitoring & Apnea Research Prototype',
  tagline: 'Intelligent Neonatal Monitoring & Environmental Research',
  descriptor: 'Educational Neonatal Environment Monitoring & Apnea Research Prototype',
  shortDescription: 'NeoNattle — Intelligent neonatal monitoring and environmental research prototype developed by Avenza.',
  prototypeLabel: 'Educational Neonatal Monitoring & Apnea Research Prototype',
  uiIdentity: 'NeoNattle — Developed by Avenza',
  version: 'v2.4-multimodal-lite',
  build: '2026.10-PROTOTYPE',
  organization: 'Avenza',
  disclaimerText: 'NEONATTLE IS AN EDUCATIONAL AND RESEARCH PROTOTYPE DEVELOPED BY AVENZA. PROTOTYPE APNEA SCORE IS AN EVIDENCE-DERIVED MODEL OUTPUT AND IS NOT A CLINICAL DIAGNOSIS. THIS SYSTEM IS NOT A SUBSTITUTE FOR A CLINICALLY VALIDATED MEDICAL MONITOR.',
  shortDisclaimer: 'NeoNattle is an educational research prototype developed by Avenza. Model output is not a medical diagnosis.',
  demoTag: 'NeoNattle: Synthetic Demo',
  liveTag: 'NeoNattle: Live Telemetry',
} as const;

export const APP_NAME = BRAND.name;
export const APP_TAGLINE = BRAND.tagline;
export const APP_DESCRIPTION = BRAND.shortDescription;
export const PROTOTYPE_LABEL = BRAND.prototypeLabel;
export const DEVELOPER_ATTRIBUTION = BRAND.attribution;

export const STORAGE_KEYS = {
  SETTINGS: 'avenza_system_settings_v2',
  SESSION: 'avenza_monitoring_session_v2',
  ROLE: 'avenza_operator_role_v2',
  LEGACY_SETTINGS: 'neonattle_settings',
  LEGACY_SESSION: 'neonattle_session',
} as const;
