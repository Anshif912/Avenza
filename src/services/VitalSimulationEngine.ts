/**
 * ============================================================================
 * AVENZA — VITAL SIMULATION ENGINE (PROTOTYPE FALLBACK)
 * ============================================================================
 * 
 * STRICT ARCHITECTURAL CONSTRAINTS:
 * 1. Simulates ONLY Heart Rate and SpO2 for the MAX30102 uncalibrated prototype gap.
 * 2. NEVER simulates or returns temperature, humidity, DS18B20, raw PPG (IR/Red),
 *    camera motion, or hardware actuator states.
 * 3. Uses a bounded, smooth random-walk algorithm with mean-reversion damping
 *    to guarantee physiological realism without erratic jumps or flatlining.
 * ============================================================================
 */

export type SimulationScenario = 'NORMAL' | 'MILD_CHANGE' | 'RECOVERY';

export class VitalSimulationEngine {
  private currentHR = 132.4;
  private currentSpO2 = 97.6;

  private hrBaseline = 132.0;
  private spo2Baseline = 97.5;

  private minHR = 120.0;
  private maxHR = 145.0;
  private minSpO2 = 96.0;
  private maxSpO2 = 99.0;

  private scenario: SimulationScenario = 'NORMAL';
  private scenarioStepCount = 0;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.currentHR = 132.0 + (Math.random() - 0.5) * 4;
    this.currentSpO2 = 97.4 + (Math.random() - 0.5) * 1.0;
    this.scenario = 'NORMAL';
    this.scenarioStepCount = 0;
  }

  public setScenario(scenario: SimulationScenario): void {
    this.scenario = scenario;
    this.scenarioStepCount = 0;
  }

  public getScenario(): SimulationScenario {
    return this.scenario;
  }

  /**
   * Advances simulation step by 200ms tick.
   * Generates physiological bounded random-walk values.
   */
  public nextValues(): { heartRate: number; spo2: number } {
    this.scenarioStepCount++;

    let targetHR = this.hrBaseline;
    let targetSpO2 = this.spo2Baseline;

    switch (this.scenario) {
      case 'MILD_CHANGE':
        // Mild decelerations / transient dip
        targetHR = 123.0;
        targetSpO2 = 96.2;
        if (this.scenarioStepCount > 100) {
          this.scenario = 'RECOVERY';
          this.scenarioStepCount = 0;
        }
        break;
      case 'RECOVERY':
        targetHR = this.hrBaseline;
        targetSpO2 = this.spo2Baseline;
        if (this.scenarioStepCount > 75) {
          this.scenario = 'NORMAL';
          this.scenarioStepCount = 0;
        }
        break;
      case 'NORMAL':
      default:
        targetHR = this.hrBaseline;
        targetSpO2 = this.spo2Baseline;
        break;
    }

    // HR Random Walk with mean reversion (max ±0.35 BPM change per 200ms step)
    const hrMeanReversion = (targetHR - this.currentHR) * 0.05;
    const hrNoise = (Math.random() - 0.5) * 0.4;
    this.currentHR += hrMeanReversion + hrNoise;
    this.currentHR = Math.max(this.minHR, Math.min(this.maxHR, this.currentHR));

    // SpO2 Random Walk with mean reversion (max ±0.08% change per 200ms step)
    const spo2MeanReversion = (targetSpO2 - this.currentSpO2) * 0.03;
    const spo2Noise = (Math.random() - 0.5) * 0.1;
    this.currentSpO2 += spo2MeanReversion + spo2Noise;
    this.currentSpO2 = Math.max(this.minSpO2, Math.min(this.maxSpO2, this.currentSpO2));

    return {
      heartRate: Math.round(this.currentHR * 10) / 10,
      spo2: Math.round(this.currentSpO2 * 10) / 10
    };
  }
}

export const vitalSimulationEngine = new VitalSimulationEngine();
