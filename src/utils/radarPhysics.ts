import {
  AScanSample,
  CalibrationConfig,
  MetalType,
  ScanPoint,
  TerrainPresetId,
  TerrainScenario,
} from '../types/radar';

export const SPEED_OF_LIGHT_M_NS = 0.299792458;

export const METAL_METADATA: Record<
  MetalType,
  {
    label: string;
    colorHex: string;
    threeColor: number;
    emissiveColor: number;
    characteristic: string;
  }
> = {
  emas: {
    label: 'Emas (Au)',
    colorHex: '#eab308',
    threeColor: 0xfacc15,
    emissiveColor: 0x854d0e,
    characteristic: 'Konduktivitas sangat tinggi, non-magnetik, peluruhan Eddy panjang (PI ≥ 380 µs)',
  },
  perak: {
    label: 'Perak (Ag)',
    colorHex: '#cbd5e1',
    threeColor: 0xe2e8f0,
    emissiveColor: 0x475569,
    characteristic: 'Konduktivitas tertinggi (63 MS/m), non-magnetik, peluruhan Eddy ekstrem',
  },
  nikel: {
    label: 'Nikel (Ni)',
    colorHex: '#10b981',
    threeColor: 0x34d399,
    emissiveColor: 0x065f46,
    characteristic: 'Feromagnetik sedang (ΔB +420 nT), laterit/sulfida konduktif menengah',
  },
  besi: {
    label: 'Bijih Besi (Fe)',
    colorHex: '#ea580c',
    threeColor: 0xf97316,
    emissiveColor: 0x7c2d12,
    characteristic: 'Anomali magnetik ekstrem (ΔB > 1200 nT), permeabilitas magnetik tinggi',
  },
  pirit: {
    label: 'Pirit (FeS₂)',
    colorHex: '#d97706',
    threeColor: 0xfbbf24,
    emissiveColor: 0x78350f,
    characteristic: 'Efek Polarisasi Terinduksi (IP > 45 mV/V) tinggi, paramagnetik lemah',
  },
  uranium: {
    label: 'Uranium (U₃O₈)',
    colorHex: '#84cc16',
    threeColor: 0xa3e635,
    emissiveColor: 0x3f6212,
    characteristic: 'Emisi radiasi Gamma/Beta tinggi (Geiger ≥ 140 CPM), asosiasi granit/batupasir',
  },
};

export const DEFAULT_CALIBRATION: CalibrationConfig = {
  zeroOffsetNs: 2.4,
  airVelocityMns: 0.2998,
  soilVelocityMns: 0.088,
  dielectricThreshold: 22,
  tvgSlopeDbM: 1.4,
  antennaFreqMHz: 100,
  maxDepthM: 40,
  gainDb: 18,
  detectionMode: 'semua',
  magneticThresholdNt: 180,
  eddyThresholdUs: 190,
  radiationThresholdCpm: 90,
};

export const TERRAIN_SCENARIOS: Record<TerrainPresetId, TerrainScenario> = {
  mineral_kompleks: {
    id: 'mineral_kompleks',
    name: 'Zona Eksplorasi Multi-Mineral & Akuifer',
    regionExample: 'Papua / Sulawesi Tengah / Kalimantan Barat',
    description:
      'Formasi kompleks yang memadukan kantong air tanah dengan urat emas-perak epitermal, nikel laterit, bijih besi, pirit sulfida, dan anomali uranium.',
    baseLat: -2.4185,
    baseLon: 121.3562,
    baseElevationM: 318,
    gridWidthM: 60,
    gridLengthM: 60,
    strata: [
      {
        name: 'Topsoil & Laterit Permukaan',
        material: 'Tanah lapuk kaya oksida besi',
        topDepthM: 0,
        bottomDepthM: 5,
        permittivityRange: 'εr 6–10',
        colorHex: '#7c4a32',
      },
      {
        name: 'Lempung Saprolit & Pasir',
        material: 'Zona pembawa akuifer & nikel',
        topDepthM: 5,
        bottomDepthM: 18,
        permittivityRange: 'εr 16–32',
        colorHex: '#6e6552',
      },
      {
        name: 'Zona Urat Kuarsa & Sulfida',
        material: 'Mineralisasi emas, perak, pirit',
        topDepthM: 18,
        bottomDepthM: 30,
        permittivityRange: 'εr 8–14 (σ tinggi)',
        colorHex: '#46525f',
      },
      {
        name: 'Batuan Dasar Granitik / Ultrabasa',
        material: 'Host rock besi & mineral radioaktif',
        topDepthM: 30,
        bottomDepthM: 40,
        permittivityRange: 'εr 6–9',
        colorHex: '#252e38',
      },
    ],
    aquifers: [
      {
        id: 'aq-kom-1',
        name: 'Akuifer Lembah K1',
        formation: 'Pasir Kerikil Aluvial Bersih',
        centerXM: -15,
        centerZM: -14,
        depthM: 13.5,
        thicknessM: 5.5,
        radiusXM: 9.5,
        radiusZM: 8.5,
        permittivity: 34.2,
        volumetricWaterPct: 37.8,
        estimatedVolumeM3: 1420,
        estimatedFlowLs: 3.1,
        confidence: 94,
        lat: -2.41837,
        lon: 121.35606,
        qualityClass: 'Air Tawar Berkualitas Baik',
        boreholeRecommended: true,
      },
    ],
    minerals: [
      {
        id: 'min-emas-1',
        name: 'Urat Emas Epitermal Au-1',
        metalType: 'emas',
        chemicalFormula: 'Au · SiO₂',
        formation: 'Urat Kuarsa Hidrotermal',
        centerXM: 10,
        centerZM: -12,
        depthM: 19.5,
        thicknessM: 3.8,
        radiusXM: 6.5,
        radiusZM: 5.5,
        conductivityMSm: 4100,
        magneticAnomalyNt: 18,
        eddyDecayUs: 420,
        chargeabilityMvV: 32,
        radiationCpm: 24,
        gradeEstimate: '6.8 g/ton Au',
        confidence: 93,
        lat: -2.41839,
        lon: 121.35629,
        drillingRecommended: true,
      },
      {
        id: 'min-perak-1',
        name: 'Kantong Perak Ag-1',
        metalType: 'perak',
        chemicalFormula: 'Ag · Ag₂S',
        formation: 'Asosiasi Sulfida Perak',
        centerXM: 16,
        centerZM: 4,
        depthM: 16.0,
        thicknessM: 3.4,
        radiusXM: 5.2,
        radiusZM: 5.2,
        conductivityMSm: 5800,
        magneticAnomalyNt: 12,
        eddyDecayUs: 485,
        chargeabilityMvV: 29,
        radiationCpm: 21,
        gradeEstimate: '145 g/ton Ag',
        confidence: 90,
        lat: -2.41854,
        lon: 121.35634,
        drillingRecommended: true,
      },
      {
        id: 'min-nikel-1',
        name: 'Endapan Nikel Laterit Ni-1',
        metalType: 'nikel',
        chemicalFormula: '(Ni,Mg)₃Si₂O₅(OH)₄',
        formation: 'Zona Saprolit Garnierit',
        centerXM: -14,
        centerZM: 12,
        depthM: 11.2,
        thicknessM: 4.8,
        radiusXM: 8.5,
        radiusZM: 7.0,
        conductivityMSm: 980,
        magneticAnomalyNt: 460,
        eddyDecayUs: 245,
        chargeabilityMvV: 19,
        radiationCpm: 22,
        gradeEstimate: '2.15% Ni',
        confidence: 91,
        lat: -2.41861,
        lon: 121.35607,
        drillingRecommended: true,
      },
      {
        id: 'min-besi-1',
        name: 'Lensa Bijih Besi Magnetit Fe-1',
        metalType: 'besi',
        chemicalFormula: 'Fe₃O₄',
        formation: 'Skarn Magnetit Masif',
        centerXM: 2,
        centerZM: 15,
        depthM: 22.0,
        thicknessM: 5.2,
        radiusXM: 7.0,
        radiusZM: 6.2,
        conductivityMSm: 1650,
        magneticAnomalyNt: 1480,
        eddyDecayUs: 310,
        chargeabilityMvV: 24,
        radiationCpm: 20,
        gradeEstimate: '61.4% Fe',
        confidence: 96,
        lat: -2.41864,
        lon: 121.35622,
        drillingRecommended: true,
      },
      {
        id: 'min-pirit-1',
        name: 'Zona Pirit Sulfida Py-1',
        metalType: 'pirit',
        chemicalFormula: 'FeS₂',
        formation: 'Diseminasi Sulfida Piritik',
        centerXM: -2,
        centerZM: -2,
        depthM: 24.5,
        thicknessM: 4.4,
        radiusXM: 6.0,
        radiusZM: 6.0,
        conductivityMSm: 840,
        magneticAnomalyNt: 115,
        eddyDecayUs: 205,
        chargeabilityMvV: 64,
        radiationCpm: 26,
        gradeEstimate: 'Indikator Emas / Sulfida 14%',
        confidence: 89,
        lat: -2.41848,
        lon: 121.35618,
        drillingRecommended: false,
      },
      {
        id: 'min-uranium-1',
        name: 'Anomali Uranium U-1',
        metalType: 'uranium',
        chemicalFormula: 'UO₂ / U₃O₈',
        formation: 'Urat Granit & Batupasir Mineral Radioaktif',
        centerXM: 14,
        centerZM: 17,
        depthM: 29.0,
        thicknessM: 4.2,
        radiusXM: 5.8,
        radiusZM: 5.8,
        conductivityMSm: 410,
        magneticAnomalyNt: 45,
        eddyDecayUs: 155,
        chargeabilityMvV: 16,
        radiationCpm: 340,
        gradeEstimate: '0.18% eU₃O₈ (340 CPM)',
        confidence: 95,
        lat: -2.41865,
        lon: 121.35633,
        drillingRecommended: false,
      },
    ],
  },
  aluvial: {
    id: 'aluvial',
    name: 'Lembah Aluvial & Dataran Sungai',
    regionExample: 'Bekasi / Klaten / Lembah Brantas',
    description:
      'Endapan pasir berpori dan kerikil sungai yang diapit lapisan lempung kedap air, disertai endapan emas plaser dan pasir besi sungai purba.',
    baseLat: -7.7024,
    baseLon: 110.6012,
    baseElevationM: 142,
    gridWidthM: 60,
    gridLengthM: 60,
    strata: [
      {
        name: 'Topsoil Humus & Lanau',
        material: 'Tanah permukaan gembur',
        topDepthM: 0,
        bottomDepthM: 4.5,
        permittivityRange: 'εr 5–9',
        colorHex: '#6b4f35',
      },
      {
        name: 'Lempung Kedap (Aquitard)',
        material: 'Lempung plastis penahan tekanan',
        topDepthM: 4.5,
        bottomDepthM: 12,
        permittivityRange: 'εr 12–16',
        colorHex: '#8d7156',
      },
      {
        name: 'Pasir Berpori & Kerikil',
        material: 'Zona pembawa air utama (Akuifer)',
        topDepthM: 12,
        bottomDepthM: 28,
        permittivityRange: 'εr 24–38',
        colorHex: '#4f5d6b',
      },
      {
        name: 'Batuan Dasar Breksi',
        material: 'Bedrock kedap gelombang tinggi',
        topDepthM: 28,
        bottomDepthM: 40,
        permittivityRange: 'εr 6–8',
        colorHex: '#28323e',
      },
    ],
    aquifers: [
      {
        id: 'aq-alu-1',
        name: 'Kantong Akuifer Aluvial A1',
        formation: 'Lensa Pasir Kasar & Kerikil Sungai Purba',
        centerXM: -10,
        centerZM: -8,
        depthM: 16.5,
        thicknessM: 6.2,
        radiusXM: 11.5,
        radiusZM: 9.0,
        permittivity: 34.8,
        volumetricWaterPct: 38.4,
        estimatedVolumeM3: 1840,
        estimatedFlowLs: 3.4,
        confidence: 94,
        lat: -7.70247,
        lon: 110.60111,
        qualityClass: 'Air Tawar Berkualitas Baik',
        boreholeRecommended: true,
      },
      {
        id: 'aq-alu-2',
        name: 'Urat Air Tertekan A2',
        formation: 'Akuifer Semi-Tertekan Bawah Lempung',
        centerXM: 14,
        centerZM: 12,
        depthM: 23.0,
        thicknessM: 5.0,
        radiusXM: 8.5,
        radiusZM: 12.0,
        permittivity: 29.5,
        volumetricWaterPct: 31.8,
        estimatedVolumeM3: 1290,
        estimatedFlowLs: 2.2,
        confidence: 87,
        lat: -7.70229,
        lon: 110.60133,
        qualityClass: 'Air Tawar Berkualitas Baik',
        boreholeRecommended: true,
      },
    ],
    minerals: [
      {
        id: 'min-alu-emas',
        name: 'Endapan Emas Plaser P1',
        metalType: 'emas',
        chemicalFormula: 'Au · Black Sand',
        formation: 'Alur Sungai Purba Dasar Kerikil',
        centerXM: 8,
        centerZM: -10,
        depthM: 14.5,
        thicknessM: 2.8,
        radiusXM: 5.5,
        radiusZM: 7.5,
        conductivityMSm: 3400,
        magneticAnomalyNt: 220,
        eddyDecayUs: 365,
        chargeabilityMvV: 22,
        radiationCpm: 20,
        gradeEstimate: '2.4 g/m³ Au Plaser',
        confidence: 88,
        lat: -7.70231,
        lon: 110.60127,
        drillingRecommended: true,
      },
    ],
  },
  karst: {
    id: 'karst',
    name: 'Kawasan Karst & Batu Gamping',
    regionExample: 'Gunungkidul / Maros / Pacitan',
    description:
      'Rongga sungai bawah tanah dan rekahan pelarutan pada formasi batu gamping beserta kantong mineral sulfida dan pirit.',
    baseLat: -8.0315,
    baseLon: 110.6184,
    baseElevationM: 265,
    gridWidthM: 60,
    gridLengthM: 60,
    strata: [
      {
        name: 'Tanah Merah Terra Rossa',
        material: 'Pelapukan residu kapur',
        topDepthM: 0,
        bottomDepthM: 3.5,
        permittivityRange: 'εr 6–10',
        colorHex: '#8a4a32',
      },
      {
        name: 'Gamping Terkekarkan',
        material: 'Batu gamping berongga mikro',
        topDepthM: 3.5,
        bottomDepthM: 18,
        permittivityRange: 'εr 7–11',
        colorHex: '#9d9583',
      },
      {
        name: 'Zona Lorong Sungai Bawah Tanah',
        material: 'Kavitasi jenuh air karst',
        topDepthM: 18,
        bottomDepthM: 32,
        permittivityRange: 'εr 36–62',
        colorHex: '#5b666d',
      },
      {
        name: 'Gamping Masif Padat',
        material: 'Batuan dasar karbonat pejal',
        topDepthM: 32,
        bottomDepthM: 40,
        permittivityRange: 'εr 7–8',
        colorHex: '#373e44',
      },
    ],
    aquifers: [
      {
        id: 'aq-kar-1',
        name: 'Sungai Bawah Tanah K1',
        formation: 'Konduit Pelarutan Batu Gamping',
        centerXM: 2,
        centerZM: -4,
        depthM: 24.5,
        thicknessM: 7.4,
        radiusXM: 7.2,
        radiusZM: 18.0,
        permittivity: 52.4,
        volumetricWaterPct: 48.2,
        estimatedVolumeM3: 2950,
        estimatedFlowLs: 6.8,
        confidence: 96,
        lat: -8.03154,
        lon: 110.61842,
        qualityClass: 'Air Tawar Sedang (Mineral)',
        boreholeRecommended: true,
      },
    ],
    minerals: [
      {
        id: 'min-kar-pirit',
        name: 'Urat Pirit & Perak Karbonat',
        metalType: 'pirit',
        chemicalFormula: 'FeS₂ · Ag',
        formation: 'Pengisian Rekahan Karst Hidrotermal',
        centerXM: -15,
        centerZM: 10,
        depthM: 19.0,
        thicknessM: 3.6,
        radiusXM: 6.0,
        radiusZM: 6.5,
        conductivityMSm: 920,
        magneticAnomalyNt: 95,
        eddyDecayUs: 215,
        chargeabilityMvV: 58,
        radiationCpm: 23,
        gradeEstimate: 'Pirit 11% + Jejak Perak',
        confidence: 86,
        lat: -8.03163,
        lon: 110.61826,
        drillingRecommended: false,
      },
    ],
  },
  vulkanik: {
    id: 'vulkanik',
    name: 'Lereng Gunungapi & Tuf Vulkanik',
    regionExample: 'Sleman / Pongkor / Batu Malang',
    description:
      'Lapisan lahar, abu vulkanik, dan breksi andesit berpori dengan aliran mata air lereng serta potensi urat kuarsa emas-perak.',
    baseLat: -7.6581,
    baseLon: 110.4229,
    baseElevationM: 485,
    gridWidthM: 60,
    gridLengthM: 60,
    strata: [
      {
        name: 'Abu Vulkanik & Pasir Lahar',
        material: 'Endapan piroklastik lepas',
        topDepthM: 0,
        bottomDepthM: 7,
        permittivityRange: 'εr 5–8',
        colorHex: '#58534c',
      },
      {
        name: 'Tuf Pasiran Berpori',
        material: 'Lapisan resapan cepat',
        topDepthM: 7,
        bottomDepthM: 21,
        permittivityRange: 'εr 18–32',
        colorHex: '#63686e',
      },
      {
        name: 'Breksi Andesit Rekahan',
        material: 'Akuifer rekahan lereng',
        topDepthM: 21,
        bottomDepthM: 33,
        permittivityRange: 'εr 22–30',
        colorHex: '#434b54',
      },
      {
        name: 'Aliran Lava Beku',
        material: 'Basalt & andesit masif',
        topDepthM: 33,
        bottomDepthM: 40,
        permittivityRange: 'εr 6–9',
        colorHex: '#232830',
      },
    ],
    aquifers: [
      {
        id: 'aq-vul-1',
        name: 'Mata Air Lereng V1',
        formation: 'Kontak Tuf Pasiran & Breksi Andesit',
        centerXM: -12,
        centerZM: 6,
        depthM: 14.2,
        thicknessM: 5.5,
        radiusXM: 10.5,
        radiusZM: 10.5,
        permittivity: 31.2,
        volumetricWaterPct: 35.1,
        estimatedVolumeM3: 1520,
        estimatedFlowLs: 4.1,
        confidence: 91,
        lat: -7.65805,
        lon: 110.42279,
        qualityClass: 'Air Tawar Berkualitas Baik',
        boreholeRecommended: true,
      },
    ],
    minerals: [
      {
        id: 'min-vul-emas',
        name: 'Urat Kuarsa Emas-Perak V-Au',
        metalType: 'emas',
        chemicalFormula: 'Au-Ag (Epitermal)',
        formation: 'Zona Rekahan Breksi Andesit',
        centerXM: 12,
        centerZM: -8,
        depthM: 23.5,
        thicknessM: 4.0,
        radiusXM: 6.5,
        radiusZM: 6.0,
        conductivityMSm: 3900,
        magneticAnomalyNt: 35,
        eddyDecayUs: 410,
        chargeabilityMvV: 44,
        radiationCpm: 25,
        gradeEstimate: '5.2 g/ton Au · 48 g/ton Ag',
        confidence: 92,
        lat: -7.65817,
        lon: 110.42301,
        drillingRecommended: true,
      },
    ],
  },
  pesisir: {
    id: 'pesisir',
    name: 'Dataran Pesisir & Endapan Pantai',
    regionExample: 'Cilacap / Indramayu / Bangka',
    description:
      'Memisahkan lensa air tawar dangkal dari zona payau, sekaligus memetakan konsentrasi pasir besi (Fe) serta mineral berat radioaktif monazit/uranium.',
    baseLat: -6.3274,
    baseLon: 108.3249,
    baseElevationM: 8,
    gridWidthM: 60,
    gridLengthM: 60,
    strata: [
      {
        name: 'Pasir Pantai Kering',
        material: 'Endapan eolian permukaan',
        topDepthM: 0,
        bottomDepthM: 3,
        permittivityRange: 'εr 4–6',
        colorHex: '#a59373',
      },
      {
        name: 'Pasir Lensa Air Tawar',
        material: 'Lensa tawar mengapung',
        topDepthM: 3,
        bottomDepthM: 12,
        permittivityRange: 'εr 24–32',
        colorHex: '#6c7a7c',
      },
      {
        name: 'Lanau Payau Konduktif',
        material: 'Zona transisi salinitas tinggi',
        topDepthM: 12,
        bottomDepthM: 25,
        permittivityRange: 'εr 28–42 (σ tinggi)',
        colorHex: '#485258',
      },
      {
        name: 'Lempung Marin Tua',
        material: 'Sedimen dasar laut purba',
        topDepthM: 25,
        bottomDepthM: 40,
        permittivityRange: 'εr 14–18',
        colorHex: '#252e34',
      },
    ],
    aquifers: [
      {
        id: 'aq-pes-1',
        name: 'Lensa Air Tawar P1',
        formation: 'Pasir Kuarsa Tawar Dangkal',
        centerXM: -6,
        centerZM: -10,
        depthM: 8.5,
        thicknessM: 4.2,
        radiusXM: 12.0,
        radiusZM: 9.5,
        permittivity: 28.9,
        volumetricWaterPct: 33.0,
        estimatedVolumeM3: 1180,
        estimatedFlowLs: 1.7,
        confidence: 89,
        lat: -6.32749,
        lon: 108.32485,
        qualityClass: 'Air Tawar Berkualitas Baik',
        boreholeRecommended: true,
      },
    ],
    minerals: [
      {
        id: 'min-pes-besi',
        name: 'Konsentrasi Pasir Besi Ilmenit',
        metalType: 'besi',
        chemicalFormula: 'FeTiO₃ · Fe₃O₄',
        formation: 'Endapan Pantai Mineral Berat',
        centerXM: 13,
        centerZM: -6,
        depthM: 6.5,
        thicknessM: 3.2,
        radiusXM: 8.0,
        radiusZM: 6.5,
        conductivityMSm: 1450,
        magneticAnomalyNt: 1120,
        eddyDecayUs: 270,
        chargeabilityMvV: 20,
        radiationCpm: 42,
        gradeEstimate: '54% Fe Total',
        confidence: 93,
        lat: -6.32745,
        lon: 108.32502,
        drillingRecommended: true,
      },
      {
        id: 'min-pes-uranium',
        name: 'Lensa Monazit / Uranium Pesisir',
        metalType: 'uranium',
        chemicalFormula: '(Ce,La,Th,U)PO₄',
        formation: 'Plaser Mineral Radioaktif Berat',
        centerXM: 11,
        centerZM: 13,
        depthM: 15.0,
        thicknessM: 3.0,
        radiusXM: 5.5,
        radiusZM: 5.5,
        conductivityMSm: 380,
        magneticAnomalyNt: 60,
        eddyDecayUs: 145,
        chargeabilityMvV: 14,
        radiationCpm: 265,
        gradeEstimate: '0.12% eU/Th (265 CPM)',
        confidence: 91,
        lat: -6.32728,
        lon: 108.3250,
        drillingRecommended: false,
      },
    ],
  },
};

export function calculateVelocityFromPermittivity(permittivity: number): number {
  return SPEED_OF_LIGHT_M_NS / Math.sqrt(Math.max(1, permittivity));
}

export function calculateToppWaterContentPct(permittivity: number): number {
  const e = Math.min(80, Math.max(1, permittivity));
  const theta =
    -5.3e-2 + 2.92e-2 * e - 5.5e-4 * e * e + 4.3e-6 * e * e * e;
  return Math.max(0, Math.min(100, Number((theta * 100).toFixed(1))));
}

export function metersToLatLon(
  baseLat: number,
  baseLon: number,
  offsetXM: number,
  offsetZM: number
): { lat: number; lon: number } {
  const dLat = -offsetZM / 111320;
  const dLon = offsetXM / (111320 * Math.cos((baseLat * Math.PI) / 180));
  return {
    lat: Number((baseLat + dLat).toFixed(6)),
    lon: Number((baseLon + dLon).toFixed(6)),
  };
}

function rickerWavelet(dtNs: number, freqMHz: number): number {
  const fGHz = freqMHz / 1000;
  const arg = Math.PI * fGHz * dtNs;
  const sq = arg * arg;
  return (1 - 2 * sq) * Math.exp(-sq);
}

export function sampleSubsurfaceAt(
  scenario: TerrainScenario,
  xM: number,
  zM: number,
  config: CalibrationConfig,
  index: number
): ScanPoint {
  const samplesCount = 64;
  const maxDepth = config.maxDepthM;
  const aScan: AScanSample[] = [];

  let peakPermittivity = 5.0;
  let detectedDepthM: number | null = null;
  let bestConfidence = 0;

  // Multi-sensor metal telemetry accumulators
  let magneticAnomalyNt = 12;
  let eddyDecayUs = 45;
  let chargeabilityMvV = 4;
  let radiationCpm = 18;
  let detectedMetalType: MetalType | null = null;
  let detectedMetalDepthM: number | null = null;
  let metalConfidence = 0;

  const seed = Math.sin(xM * 12.9898 + zM * 78.233) * 43758.5453;
  const baseNoise = seed - Math.floor(seed);

  // Evaluate nearby mineral deposits for PI, Magnetometer, IP & Geiger readings
  let bestMetalWeight = 0;
  for (const min of scenario.minerals) {
    const dx = (xM - min.centerXM) / min.radiusXM;
    const dz = (zM - min.centerZM) / min.radiusZM;
    const radialDistSq = dx * dx + dz * dz;
    if (radialDistSq < 1.8) {
      const w = Math.exp(-radialDistSq * 1.5);
      magneticAnomalyNt += min.magneticAnomalyNt * w;
      eddyDecayUs = Math.max(eddyDecayUs, 45 + min.eddyDecayUs * w);
      chargeabilityMvV = Math.max(chargeabilityMvV, 4 + min.chargeabilityMvV * w);
      radiationCpm = Math.max(radiationCpm, 18 + min.radiationCpm * w);

      if (w > 0.34 && w > bestMetalWeight) {
        bestMetalWeight = w;
        const meetsCriteria =
          min.magneticAnomalyNt * w >= config.magneticThresholdNt ||
          min.eddyDecayUs * w >= config.eddyThresholdUs ||
          min.radiationCpm * w >= config.radiationThresholdCpm ||
          min.chargeabilityMvV * w >= 28;

        if (meetsCriteria) {
          detectedMetalType = min.metalType;
          detectedMetalDepthM = min.depthM;
          metalConfidence = Math.min(98, Math.round(64 + w * 32));
        }
      }
    }
  }

  for (let i = 0; i < samplesCount; i++) {
    const depthM = (i / (samplesCount - 1)) * maxDepth;

    let permittivity = 6.5;
    let conductivity = 8;
    for (const s of scenario.strata) {
      if (depthM >= s.topDepthM && depthM <= s.bottomDepthM) {
        if (s.name.includes('Lempung')) {
          permittivity = 13.5;
          conductivity = 38;
        } else if (s.name.includes('Payau')) {
          permittivity = 24.0;
          conductivity = 140;
        } else if (s.name.includes('Pasir Berpori') || s.name.includes('Tuf') || s.name.includes('Saprolit')) {
          permittivity = 14.0;
          conductivity = 18;
        } else if (s.name.includes('Dasar') || s.name.includes('Masif') || s.name.includes('Lava')) {
          permittivity = 7.2;
          conductivity = 6;
        } else {
          permittivity = 6.2;
          conductivity = 10;
        }
        break;
      }
    }

    // Aquifer permittivity boost
    let aquiferBoost = 0;
    let isSaline = false;
    for (const aq of scenario.aquifers) {
      const dx = (xM - aq.centerXM) / aq.radiusXM;
      const dz = (zM - aq.centerZM) / aq.radiusZM;
      const dy = (depthM - aq.depthM) / (aq.thicknessM * 0.65);
      const distSq = dx * dx + dz * dz + dy * dy;
      if (distSq < 1.35) {
        const weight = Math.exp(-distSq * 1.45);
        const boost = (aq.permittivity - permittivity) * weight;
        if (boost > aquiferBoost) {
          aquiferBoost = boost;
          isSaline = aq.qualityClass.includes('Payau');
        }
      }
    }

    permittivity += aquiferBoost;
    if (isSaline) conductivity += 110;

    // Metal conductivity boost in subsurface depth slice
    for (const min of scenario.minerals) {
      const dx = (xM - min.centerXM) / min.radiusXM;
      const dz = (zM - min.centerZM) / min.radiusZM;
      const dy = (depthM - min.depthM) / (min.thicknessM * 0.7);
      const distSq = dx * dx + dz * dz + dy * dy;
      if (distSq < 1.2) {
        conductivity += min.conductivityMSm * 0.1 * Math.exp(-distSq * 1.5);
      }
    }

    const localVel = calculateVelocityFromPermittivity(permittivity);
    const travelTimeNs =
      config.zeroOffsetNs + (2 * depthM) / Math.max(0.03, (localVel + config.soilVelocityMns) * 0.5);

    const directWave = rickerWavelet(travelTimeNs - config.zeroOffsetNs, config.antennaFreqMHz) * 95;
    let reflectionSum = 0;

    // Negative polarity GPR reflection for water aquifers
    for (const aq of scenario.aquifers) {
      const dx = (xM - aq.centerXM) / aq.radiusXM;
      const dz = (zM - aq.centerZM) / aq.radiusZM;
      const radialDist = Math.sqrt(dx * dx + dz * dz);
      if (radialDist < 1.3) {
        const hyperbolaDepth = Math.sqrt(aq.depthM * aq.depthM + Math.pow(radialDist * 3.2, 2));
        const dtDepth = depthM - hyperbolaDepth;
        const dtNs = (2 * dtDepth) / config.soilVelocityMns;
        const ampScale = (1 - radialDist * 0.55) * (aq.permittivity / 35) * 125;
        reflectionSum -= rickerWavelet(dtNs, config.antennaFreqMHz) * ampScale;
      }
    }

    // Positive phase-inverted strong metallic GPR reflection for ore bodies
    for (const min of scenario.minerals) {
      const dx = (xM - min.centerXM) / min.radiusXM;
      const dz = (zM - min.centerZM) / min.radiusZM;
      const radialDist = Math.sqrt(dx * dx + dz * dz);
      if (radialDist < 1.35) {
        const hyperbolaDepth = Math.sqrt(min.depthM * min.depthM + Math.pow(radialDist * 2.8, 2));
        const dtDepth = depthM - hyperbolaDepth;
        const dtNs = (2 * dtDepth) / config.soilVelocityMns;
        const ampScale = (1 - radialDist * 0.5) * 145;
        reflectionSum += rickerWavelet(dtNs, config.antennaFreqMHz) * ampScale;
      }
    }

    const attenuation = Math.exp(-0.045 * depthM * (config.antennaFreqMHz / 100));
    const tvgFactor = Math.pow(10, (config.gainDb + config.tvgSlopeDbM * depthM) / 40);
    const jitter = Math.sin(i * 7.3 + baseNoise * 12) * 4.5;
    const amplitudeMv = Number(
      Math.max(-240, Math.min(240, (directWave + reflectionSum * attenuation) * tvgFactor * 0.45 + jitter)).toFixed(2)
    );

    if (depthM > 2.5 && permittivity > peakPermittivity) {
      peakPermittivity = permittivity;
      if (permittivity >= config.dielectricThreshold) {
        detectedDepthM = Number(depthM.toFixed(1));
      }
    }

    aScan.push({
      depthM: Number(depthM.toFixed(2)),
      travelTimeNs: Number(travelTimeNs.toFixed(1)),
      amplitudeMv,
      permittivity: Number(permittivity.toFixed(1)),
      conductivityMSm: Number(conductivity.toFixed(1)),
    });
  }

  if (peakPermittivity >= config.dielectricThreshold) {
    bestConfidence = Math.min(98, Math.round(58 + (peakPermittivity - config.dielectricThreshold) * 1.8));
  } else {
    bestConfidence = Math.max(8, Math.round((peakPermittivity / config.dielectricThreshold) * 45));
  }

  const { lat, lon } = metersToLatLon(scenario.baseLat, scenario.baseLon, xM, zM);

  return {
    id: `scan-${index}`,
    index,
    xM: Number(xM.toFixed(2)),
    zM: Number(zM.toFixed(2)),
    lat,
    lon,
    elevationM: Number((scenario.baseElevationM + Math.sin(xM * 0.08) * 1.4).toFixed(1)),
    peakPermittivity: Number(peakPermittivity.toFixed(1)),
    waterConfidence: bestConfidence,
    detectedDepthM,
    salinityPpm: scenario.id === 'pesisir' && xM > 4 ? 1450 : 185,
    magneticAnomalyNt: Number(magneticAnomalyNt.toFixed(1)),
    eddyDecayUs: Number(eddyDecayUs.toFixed(0)),
    chargeabilityMvV: Number(chargeabilityMvV.toFixed(1)),
    radiationCpm: Number(radiationCpm.toFixed(0)),
    detectedMetalType,
    detectedMetalDepthM,
    metalConfidence,
    timestamp: new Date().toISOString(),
    aScan,
  };
}

export function generateLawnmowerPath(
  widthM = 50,
  lengthM = 50,
  lines = 7,
  pointsPerLine = 22
): Array<{ x: number; z: number }> {
  const path: Array<{ x: number; z: number }> = [];
  const halfW = widthM / 2;
  const halfL = lengthM / 2;

  for (let l = 0; l < lines; l++) {
    const z = -halfL + (l / (lines - 1)) * lengthM;
    const reverse = l % 2 === 1;
    for (let p = 0; p < pointsPerLine; p++) {
      const t = p / (pointsPerLine - 1);
      const x = reverse ? halfW - t * widthM : -halfW + t * widthM;
      path.push({ x, z });
    }
  }
  return path;
}
