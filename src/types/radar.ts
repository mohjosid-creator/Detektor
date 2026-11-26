export type TerrainPresetId =
  | 'mineral_kompleks'
  | 'aluvial'
  | 'karst'
  | 'vulkanik'
  | 'pesisir';

export type MetalType =
  | 'emas'
  | 'nikel'
  | 'perak'
  | 'besi'
  | 'pirit'
  | 'uranium';

export type DetectionTargetMode = 'semua' | 'air' | 'logam';

export type WorkspaceTab =
  | 'scanner3d'
  | 'radargram'
  | 'calibration'
  | 'hardware'
  | 'guide';

export interface CalibrationConfig {
  zeroOffsetNs: number;
  airVelocityMns: number;
  soilVelocityMns: number;
  dielectricThreshold: number;
  tvgSlopeDbM: number;
  antennaFreqMHz: 50 | 100 | 250 | 400;
  maxDepthM: number;
  gainDb: number;
  detectionMode: DetectionTargetMode;
  magneticThresholdNt: number;
  eddyThresholdUs: number;
  radiationThresholdCpm: number;
}

export interface AScanSample {
  depthM: number;
  travelTimeNs: number;
  amplitudeMv: number;
  permittivity: number;
  conductivityMSm: number;
}

export interface ScanPoint {
  id: string;
  index: number;
  xM: number;
  zM: number;
  lat: number;
  lon: number;
  elevationM: number;
  peakPermittivity: number;
  waterConfidence: number;
  detectedDepthM: number | null;
  salinityPpm: number;
  // Multi-sensor metal & radioactive telemetry
  magneticAnomalyNt: number;
  eddyDecayUs: number;
  chargeabilityMvV: number;
  radiationCpm: number;
  detectedMetalType: MetalType | null;
  detectedMetalDepthM: number | null;
  metalConfidence: number;
  timestamp: string;
  aScan: AScanSample[];
}

export interface AquiferPocket {
  id: string;
  name: string;
  formation: string;
  centerXM: number;
  centerZM: number;
  depthM: number;
  thicknessM: number;
  radiusXM: number;
  radiusZM: number;
  permittivity: number;
  volumetricWaterPct: number;
  estimatedVolumeM3: number;
  estimatedFlowLs: number;
  confidence: number;
  lat: number;
  lon: number;
  qualityClass: 'Air Tawar Berkualitas Baik' | 'Air Tawar Sedang (Mineral)' | 'Payau / Intrusi Ringan';
  boreholeRecommended: boolean;
}

export interface MineralDeposit {
  id: string;
  name: string;
  metalType: MetalType;
  chemicalFormula: string;
  formation: string;
  centerXM: number;
  centerZM: number;
  depthM: number;
  thicknessM: number;
  radiusXM: number;
  radiusZM: number;
  conductivityMSm: number;
  magneticAnomalyNt: number;
  eddyDecayUs: number;
  chargeabilityMvV: number;
  radiationCpm: number;
  gradeEstimate: string;
  confidence: number;
  lat: number;
  lon: number;
  drillingRecommended: boolean;
}

export interface GeologicalStratum {
  name: string;
  material: string;
  topDepthM: number;
  bottomDepthM: number;
  permittivityRange: string;
  colorHex: string;
}

export interface TerrainScenario {
  id: TerrainPresetId;
  name: string;
  regionExample: string;
  description: string;
  baseLat: number;
  baseLon: number;
  baseElevationM: number;
  gridWidthM: number;
  gridLengthM: number;
  strata: GeologicalStratum[];
  aquifers: AquiferPocket[];
  minerals: MineralDeposit[];
}

export interface RadarAlert {
  id: string;
  timestamp: string;
  category: 'air' | 'logam' | 'radioaktif';
  metalType?: MetalType;
  title: string;
  message: string;
  severity: 'high' | 'medium';
  depthM: number;
  permittivity: number;
  confidence: number;
  estimatedFlowLs?: number;
  signatureSummary: string;
  lat: number;
  lon: number;
  acknowledged: boolean;
}

export interface SerialConnectionState {
  supported: boolean;
  connected: boolean;
  portName: string;
  baudRate: number;
  packetsReceived: number;
  lastPacketAt: string | null;
  error: string | null;
}
