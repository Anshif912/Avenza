/**
 * AVENZA — CENTRAL BRAND CONFIGURATION
 * Official brand identity, terminology, descriptors, and disclaimers.
 */

export const BRAND = {
  name: 'AVENZA',
  shortName: 'AVENZA',
  tagline: 'Intelligent Neonatal Monitoring & AI-Assisted Apnea Event Detection',
  descriptor: 'Intelligent Neonatal Monitoring & AI-Assisted Apnea Event Detection',
  shortDescription: 'Multimodal neonatal monitoring and prototype apnea-event detection.',
  prototypeLabel: 'AI-ASSISTED APNEA EVENT DETECTION — PROTOTYPE',
  version: 'v2.4-multimodal-lite',
  build: '2026.09-PROTOTYPE',
  organization: 'AVENZA Systems',
  disclaimerText: 'AVENZA IS AN EDUCATIONAL / RESEARCH PROTOTYPE. PROTOTYPE APNEA SCORE IS AN EVIDENCE-DERIVED MODEL OUTPUT AND IS NOT A CLINICAL DIAGNOSIS. THIS SYSTEM IS NOT A SUBSTITUTE FOR A CLINICALLY VALIDATED MEDICAL MONITOR.',
  shortDisclaimer: 'Prototype educational software. Model output is not a medical diagnosis.',
  demoTag: 'AVENZA — SYNTHETIC DEMO',
  liveTag: 'AVENZA — LIVE MONITORING',
} as const;

export const APP_NAME = BRAND.name;
export const APP_TAGLINE = BRAND.tagline;
export const APP_DESCRIPTION = BRAND.shortDescription;
export const PROTOTYPE_LABEL = BRAND.prototypeLabel;

export const STORAGE_KEYS = {
  SETTINGS: 'avenza_system_settings_v2',
  SESSION: 'avenza_monitoring_session_v2',
  ROLE: 'avenza_operator_role_v2',
  LEGACY_SETTINGS: 'neonattle_settings',
  LEGACY_SESSION: 'neonattle_session',
} as const;
