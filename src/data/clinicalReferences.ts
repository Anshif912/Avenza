export type ClinicalPopulation =
  | 'GENERAL_NEONATAL'
  | 'TERM_NEWBORN'
  | 'LATE_PRETERM'
  | 'PRETERM'
  | 'VERY_PRETERM';

export type ClinicalParameter =
  | 'HEART_RATE'
  | 'RESPIRATORY_RATE'
  | 'SPO2'
  | 'TEMPERATURE'
  | 'APNEA_DURATION'
  | 'BRADYCARDIA'
  | 'DESATURATION';

export interface AuthoritativeSource {
  organization: string;
  title: string;
  year: number;
  url: string;
  guidelineSection?: string;
}

export interface ClinicalReferenceItem {
  id: string;
  parameter: ClinicalParameter;
  population: ClinicalPopulation;
  gestationalAgeRangeWeeks?: { min: number; max: number };
  normalRange?: {
    min: number;
    max: number;
    unit: string;
  };
  reviewThreshold?: {
    low?: number;
    high?: number;
    unit: string;
    description: string;
  };
  durationCriterionSec?: number;
  source: AuthoritativeSource;
  clinicalContext: string;
  notes: string;
  limitations: string;
}

export interface PopulationProfile {
  id: ClinicalPopulation;
  label: string;
  gestationalWeeksLabel: string;
  description: string;
  heartRateRange: { min: number; max: number; unit: string };
  respiratoryRateRange: { min: number; max: number; unit: string };
  temperatureRange: { min: number; max: number; unit: string };
  spo2TargetRange: { min: number; max: number; unit: string };
  bradycardiaThresholdBpm: number;
  apneaClinicalThresholdSec: number;
  sources: AuthoritativeSource[];
}

/* ============================================================
   AUTHORITATIVE SOURCES REPOSITORY
   Peer-reviewed and recognized clinical organization references
   ============================================================ */

export const AUTHORITATIVE_SOURCES = {
  WHO_NEWBORN_EXAM: {
    organization: 'World Health Organization (WHO)',
    title: 'Pregnancy, Childbirth, Postpartum and Newborn Care: A Guide for Essential Practice (3rd Edition)',
    year: 2015,
    url: 'https://www.who.int/publications/i/item/9789241549356',
    guidelineSection: 'Section K11: Examination of the Newborn Baby',
  },
  WHO_THERMAL_CARE: {
    organization: 'World Health Organization (WHO)',
    title: 'Thermal Protection of the Newborn: A Practical Guide',
    year: 1997,
    url: 'https://www.who.int/publications/i/item/WHO-RHT-MSM-97.2',
    guidelineSection: 'Chapter 2: Normal body temperature of the newborn',
  },
  AAP_AOP_GUIDELINE: {
    organization: 'American Academy of Pediatrics (AAP)',
    title: 'Apnea of Prematurity (Committee on Fetus and Newborn, Eichenwald EC)',
    year: 2016,
    url: 'https://doi.org/10.1542/peds.2015-3757',
    guidelineSection: 'Pediatrics 2016; 137(1):e20153757',
  },
  AAP_OXYGEN_TARGETING: {
    organization: 'American Academy of Pediatrics (AAP)',
    title: 'Oxygen Targeting in Extremely Low Birth Weight Infants',
    year: 2018,
    url: 'https://doi.org/10.1542/peds.2018-0388',
    guidelineSection: 'Clinical Report: Pulse Oximetry Saturation Target Ranges',
  },
  NELSON_PEDIATRICS: {
    organization: 'Nelson Textbook of Pediatrics',
    title: 'Nelson Textbook of Pediatrics, 21st Edition — Normal Neonatal Vital Signs',
    year: 2020,
    url: 'https://www.clinicalkey.com/#!/content/book/3-s2.0-B9780323529501001183',
    guidelineSection: 'Chapter 118: Assessment of the Newborn Infant',
  },
};

/* ============================================================
   CLINICAL POPULATION PROFILES
   ============================================================ */

export const CLINICAL_POPULATION_PROFILES: Record<ClinicalPopulation, PopulationProfile> = {
  GENERAL_NEONATAL: {
    id: 'GENERAL_NEONATAL',
    label: 'General Neonatal (Standard Reference)',
    gestationalWeeksLabel: 'All Gestational Ages',
    description: 'General newborn vital sign reference ranges based on standard WHO guidance.',
    heartRateRange: { min: 100, max: 160, unit: 'BPM' },
    respiratoryRateRange: { min: 30, max: 60, unit: 'breaths/min' },
    temperatureRange: { min: 36.5, max: 37.5, unit: '°C' },
    spo2TargetRange: { min: 92, max: 98, unit: '%' },
    bradycardiaThresholdBpm: 100,
    apneaClinicalThresholdSec: 20,
    sources: [AUTHORITATIVE_SOURCES.WHO_NEWBORN_EXAM, AUTHORITATIVE_SOURCES.WHO_THERMAL_CARE, AUTHORITATIVE_SOURCES.AAP_AOP_GUIDELINE],
  },
  TERM_NEWBORN: {
    id: 'TERM_NEWBORN',
    label: 'Term Newborn Infant',
    gestationalWeeksLabel: '≥ 37 Weeks Gestation',
    description: 'Healthy term neonate with mature cardiorespiratory central control.',
    heartRateRange: { min: 100, max: 160, unit: 'BPM' },
    respiratoryRateRange: { min: 30, max: 60, unit: 'breaths/min' },
    temperatureRange: { min: 36.5, max: 37.5, unit: '°C' },
    spo2TargetRange: { min: 94, max: 99, unit: '%' },
    bradycardiaThresholdBpm: 100,
    apneaClinicalThresholdSec: 20,
    sources: [AUTHORITATIVE_SOURCES.WHO_NEWBORN_EXAM, AUTHORITATIVE_SOURCES.WHO_THERMAL_CARE],
  },
  LATE_PRETERM: {
    id: 'LATE_PRETERM',
    label: 'Late Preterm Infant',
    gestationalWeeksLabel: '34 to < 37 Weeks Gestation',
    description: 'Infants with developing central respiratory drive; susceptible to transient periodic breathing.',
    heartRateRange: { min: 110, max: 165, unit: 'BPM' },
    respiratoryRateRange: { min: 35, max: 65, unit: 'breaths/min' },
    temperatureRange: { min: 36.5, max: 37.5, unit: '°C' },
    spo2TargetRange: { min: 92, max: 97, unit: '%' },
    bradycardiaThresholdBpm: 100,
    apneaClinicalThresholdSec: 20,
    sources: [AUTHORITATIVE_SOURCES.AAP_AOP_GUIDELINE, AUTHORITATIVE_SOURCES.WHO_NEWBORN_EXAM],
  },
  PRETERM: {
    id: 'PRETERM',
    label: 'Preterm Infant',
    gestationalWeeksLabel: '28 to < 34 Weeks Gestation',
    description: 'NICU patient with immature brainstem respiratory pacing; apnea of prematurity common.',
    heartRateRange: { min: 120, max: 170, unit: 'BPM' },
    respiratoryRateRange: { min: 40, max: 70, unit: 'breaths/min' },
    temperatureRange: { min: 36.5, max: 37.5, unit: '°C' },
    spo2TargetRange: { min: 90, max: 95, unit: '%' },
    bradycardiaThresholdBpm: 100,
    apneaClinicalThresholdSec: 20,
    sources: [AUTHORITATIVE_SOURCES.AAP_AOP_GUIDELINE, AUTHORITATIVE_SOURCES.AAP_OXYGEN_TARGETING],
  },
  VERY_PRETERM: {
    id: 'VERY_PRETERM',
    label: 'Very / Extremely Preterm Infant',
    gestationalWeeksLabel: '< 28 Weeks Gestation',
    description: 'Extremely vulnerable neonate requiring strict oxygen targeting (90-95%) and thermal servo control.',
    heartRateRange: { min: 120, max: 180, unit: 'BPM' },
    respiratoryRateRange: { min: 40, max: 75, unit: 'breaths/min' },
    temperatureRange: { min: 36.5, max: 37.5, unit: '°C' },
    spo2TargetRange: { min: 90, max: 94, unit: '%' },
    bradycardiaThresholdBpm: 100,
    apneaClinicalThresholdSec: 20,
    sources: [AUTHORITATIVE_SOURCES.AAP_AOP_GUIDELINE, AUTHORITATIVE_SOURCES.AAP_OXYGEN_TARGETING],
  },
};

/* ============================================================
   DETAILED CLINICAL REFERENCE ITEMS
   ============================================================ */

export const CLINICAL_REFERENCE_DATABASE: ClinicalReferenceItem[] = [
  {
    id: 'REF_HR_WHO',
    parameter: 'HEART_RATE',
    population: 'GENERAL_NEONATAL',
    normalRange: { min: 100, max: 160, unit: 'BPM' },
    reviewThreshold: {
      low: 100,
      high: 160,
      unit: 'BPM',
      description: 'Values outside 100-160 BPM warrant review for bradycardia, tachycardia, or agitation/sleep context.',
    },
    source: AUTHORITATIVE_SOURCES.WHO_NEWBORN_EXAM,
    clinicalContext: 'Standard newborn physical examination resting rate.',
    notes: 'Heart rate fluctuates physiologically: may decrease to 90–100 BPM in deep quiet sleep or elevate to 180 BPM during vigorous crying.',
    limitations: 'Resting pulse rate is context-dependent. Isolated bradycardia or tachycardia without concomitant signs is not diagnostic of apnea.',
  },
  {
    id: 'REF_RR_WHO',
    parameter: 'RESPIRATORY_RATE',
    population: 'GENERAL_NEONATAL',
    normalRange: { min: 30, max: 60, unit: 'breaths/min' },
    reviewThreshold: {
      low: 30,
      high: 60,
      unit: 'breaths/min',
      description: 'Rates <30 indicate bradypnea/hypoventilation; >60 indicate tachypnea.',
    },
    source: AUTHORITATIVE_SOURCES.WHO_NEWBORN_EXAM,
    clinicalContext: 'Counted over a full 60-second observation period in quiet state.',
    notes: 'Neonatal breathing is naturally irregular. Periodic breathing (pauses 3–10s followed by tachypneic bursts) can occur physiologically.',
    limitations: 'AVENZA webcam measures camera-derived thoracic/abdominal motion evidence, not direct spirometric airflow. Label appropriately.',
  },
  {
    id: 'REF_TEMP_WHO',
    parameter: 'TEMPERATURE',
    population: 'GENERAL_NEONATAL',
    normalRange: { min: 36.5, max: 37.5, unit: '°C' },
    reviewThreshold: {
      low: 36.5,
      high: 37.5,
      unit: '°C',
      description: 'Cold stress/hypothermia (<36.5°C) or hyperthermia (>37.5°C).',
    },
    source: AUTHORITATIVE_SOURCES.WHO_THERMAL_CARE,
    clinicalContext: 'Axillary temperature in neutral thermal environment.',
    notes: 'Neonates have high surface-area-to-mass ratios and limited non-shivering thermogenesis (brown adipose tissue).',
    limitations: 'Environmental chamber temperature differs from core/skin body temperature; MLX90614 contactless IR provides contextual surface tracking.',
  },
  {
    id: 'REF_APNEA_AAP',
    parameter: 'APNEA_DURATION',
    population: 'PRETERM',
    durationCriterionSec: 20,
    reviewThreshold: {
      description: 'Cessation of breathing ≥20 seconds OR shorter pause (<20s) with bradycardia (HR <100) or desaturation (SpO2 ≤85%).',
      unit: 'seconds',
    },
    source: AUTHORITATIVE_SOURCES.AAP_AOP_GUIDELINE,
    clinicalContext: 'Clinical definition of Apnea of Prematurity (AOP).',
    notes: 'Most events in preterm infants are mixed or obstructive, secondary to central brainstem immaturity and upper airway collapse.',
    limitations: 'AVENZA prototype uses a 10-second algorithmic evidence accumulation window (DETECTION_WINDOW_MS) for early awareness, clearly distinguished from the ≥20s clinical guideline.',
  },
  {
    id: 'REF_SPO2_AAP',
    parameter: 'SPO2',
    population: 'PRETERM',
    normalRange: { min: 90, max: 95, unit: '%' },
    reviewThreshold: {
      low: 85,
      unit: '%',
      description: 'Clinically significant hypoxemia desaturation nadir ≤85% or rapid negative desaturation slope.',
    },
    source: AUTHORITATIVE_SOURCES.AAP_OXYGEN_TARGETING,
    clinicalContext: 'NICU pulse oximetry monitoring in preterm neonates on supplemental oxygen or room air.',
    notes: 'Target range 90–95% balances avoidance of hypoxic tissue injury with prevention of hyperoxia-induced retinopathy of prematurity (ROP) and bronchopulmonary dysplasia (BPD).',
    limitations: 'Optical PPG signal quality and perfusion index must be confirmed before desaturation is attributed to physiological hypoxia.',
  },
];

/* ============================================================
   CLINICAL REFERENCE EVALUATOR FUNCTIONS
   ============================================================ */

export type ReferenceEvaluationStatus =
  | 'WITHIN_REFERENCE'
  | 'OUTSIDE_REFERENCE_LOW'
  | 'OUTSIDE_REFERENCE_HIGH'
  | 'INSUFFICIENT_DATA'
  | 'NOT_APPLICABLE';

export function evaluateHeartRateReference(
  hr: number | null,
  population: ClinicalPopulation = 'GENERAL_NEONATAL'
): {
  status: ReferenceEvaluationStatus;
  statusLabel: string;
  referenceText: string;
  source: AuthoritativeSource;
  isWarning: boolean;
} {
  const profile = CLINICAL_POPULATION_PROFILES[population] || CLINICAL_POPULATION_PROFILES.GENERAL_NEONATAL;
  const refText = `${profile.heartRateRange.min}–${profile.heartRateRange.max} BPM`;
  const source = AUTHORITATIVE_SOURCES.WHO_NEWBORN_EXAM;

  if (hr === null || hr === undefined) {
    return {
      status: 'INSUFFICIENT_DATA',
      statusLabel: 'WAITING FOR SIGNAL',
      referenceText: refText,
      source,
      isWarning: false,
    };
  }

  if (hr < profile.heartRateRange.min) {
    return {
      status: 'OUTSIDE_REFERENCE_LOW',
      statusLabel: 'OUTSIDE REFERENCE RANGE (LOW)',
      referenceText: refText,
      source,
      isWarning: true,
    };
  }

  if (hr > profile.heartRateRange.max) {
    return {
      status: 'OUTSIDE_REFERENCE_HIGH',
      statusLabel: 'OUTSIDE REFERENCE RANGE (HIGH)',
      referenceText: refText,
      source,
      isWarning: true,
    };
  }

  return {
    status: 'WITHIN_REFERENCE',
    statusLabel: 'WITHIN REFERENCE RANGE',
    referenceText: refText,
    source,
    isWarning: false,
  };
}

export function evaluateTemperatureReference(
  temp: number | null,
  population: ClinicalPopulation = 'GENERAL_NEONATAL'
): {
  status: ReferenceEvaluationStatus;
  statusLabel: string;
  referenceText: string;
  source: AuthoritativeSource;
  isWarning: boolean;
} {
  const profile = CLINICAL_POPULATION_PROFILES[population] || CLINICAL_POPULATION_PROFILES.GENERAL_NEONATAL;
  const refText = `${profile.temperatureRange.min}–${profile.temperatureRange.max} °C`;
  const source = AUTHORITATIVE_SOURCES.WHO_THERMAL_CARE;

  if (temp === null || temp === undefined) {
    return {
      status: 'INSUFFICIENT_DATA',
      statusLabel: 'WAITING FOR SENSOR',
      referenceText: refText,
      source,
      isWarning: false,
    };
  }

  if (temp < profile.temperatureRange.min) {
    return {
      status: 'OUTSIDE_REFERENCE_LOW',
      statusLabel: 'COLD STRESS / HYPOTHERMIA REVIEW',
      referenceText: refText,
      source,
      isWarning: true,
    };
  }

  if (temp > profile.temperatureRange.max) {
    return {
      status: 'OUTSIDE_REFERENCE_HIGH',
      statusLabel: 'ELEVATED TEMP REVIEW',
      referenceText: refText,
      source,
      isWarning: true,
    };
  }

  return {
    status: 'WITHIN_REFERENCE',
    statusLabel: 'WITHIN REFERENCE RANGE',
    referenceText: refText,
    source,
    isWarning: false,
  };
}

export function evaluateSpO2Reference(
  spo2: number | null,
  baseline: number | null,
  population: ClinicalPopulation = 'GENERAL_NEONATAL'
): {
  statusLabel: string;
  targetText: string;
  deltaText: string;
  source: AuthoritativeSource;
  isDesaturating: boolean;
} {
  const profile = CLINICAL_POPULATION_PROFILES[population] || CLINICAL_POPULATION_PROFILES.GENERAL_NEONATAL;
  const targetText = `${profile.spo2TargetRange.min}–${profile.spo2TargetRange.max}%`;
  const source = AUTHORITATIVE_SOURCES.AAP_OXYGEN_TARGETING;

  if (spo2 === null || spo2 === undefined) {
    return {
      statusLabel: 'WAITING FOR SIGNAL',
      targetText,
      deltaText: '--',
      source,
      isDesaturating: false,
    };
  }

  const delta = baseline !== null ? spo2 - baseline : 0;
  const deltaText = delta !== 0 ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%` : '0%';

  if (spo2 <= 85 || delta <= -3) {
    return {
      statusLabel: 'DESATURATION EVIDENCE',
      targetText,
      deltaText,
      source,
      isDesaturating: true,
    };
  }

  if (spo2 < profile.spo2TargetRange.min) {
    return {
      statusLabel: 'BELOW TARGET RANGE',
      targetText,
      deltaText,
      source,
      isDesaturating: false,
    };
  }

  return {
    statusLabel: 'WITHIN TARGET RANGE',
    targetText,
    deltaText,
    source,
    isDesaturating: false,
  };
}
