import { AquiferPocket, MineralDeposit, ScanPoint, TerrainScenario } from '../types/radar';
import { METAL_METADATA } from './radarPhysics';

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToGeoJSON(
  scanPoints: ScanPoint[],
  aquifers: AquiferPocket[],
  minerals: MineralDeposit[],
  scenario: TerrainScenario
): void {
  const features: Array<Record<string, unknown>> = [];

  if (scanPoints.length > 1) {
    features.push({
      type: 'Feature',
      properties: {
        featureType: 'survey_track',
        name: `Lintasan Survei Multi-Sensor — ${scenario.name}`,
        totalStations: scanPoints.length,
        coordinateSystem: 'EPSG:4326',
      },
      geometry: {
        type: 'LineString',
        coordinates: scanPoints.map((pt) => [pt.lon, pt.lat, pt.elevationM]),
      },
    });
  }

  for (const aq of aquifers) {
    const ring: number[][] = [];
    const segments = 24;
    const metersPerDegLat = 111320;
    const metersPerDegLon = 111320 * Math.cos((aq.lat * Math.PI) / 180);

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const dLon = (Math.cos(theta) * aq.radiusXM) / metersPerDegLon;
      const dLat = (Math.sin(theta) * aq.radiusZM) / metersPerDegLat;
      ring.push([Number((aq.lon + dLon).toFixed(6)), Number((aq.lat + dLat).toFixed(6))]);
    }

    features.push({
      type: 'Feature',
      properties: {
        featureType: 'aquifer_zone',
        category: 'air_bawah_tanah',
        id: aq.id,
        name: aq.name,
        formation: aq.formation,
        depth_m: aq.depthM,
        thickness_m: aq.thicknessM,
        permittivity_er: aq.permittivity,
        volumetric_water_pct: aq.volumetricWaterPct,
        estimated_volume_m3: aq.estimatedVolumeM3,
        estimated_flow_ls: aq.estimatedFlowLs,
        confidence_pct: aq.confidence,
        quality_class: aq.qualityClass,
        borehole_recommended: aq.boreholeRecommended,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [ring],
      },
    });

    features.push({
      type: 'Feature',
      properties: {
        featureType: 'borehole_target',
        category: 'air_bawah_tanah',
        id: `${aq.id}-target`,
        name: `Titik Bor Air: ${aq.name}`,
        target_depth_m: aq.depthM,
        estimated_flow_ls: aq.estimatedFlowLs,
        confidence_pct: aq.confidence,
      },
      geometry: {
        type: 'Point',
        coordinates: [aq.lon, aq.lat, scenario.baseElevationM - aq.depthM],
      },
    });
  }

  for (const min of minerals) {
    const ring: number[][] = [];
    const segments = 24;
    const metersPerDegLat = 111320;
    const metersPerDegLon = 111320 * Math.cos((min.lat * Math.PI) / 180);

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const dLon = (Math.cos(theta) * min.radiusXM) / metersPerDegLon;
      const dLat = (Math.sin(theta) * min.radiusZM) / metersPerDegLat;
      ring.push([Number((min.lon + dLon).toFixed(6)), Number((min.lat + dLat).toFixed(6))]);
    }

    features.push({
      type: 'Feature',
      properties: {
        featureType: 'mineral_deposit',
        category: min.metalType === 'uranium' ? 'mineral_radioaktif' : 'deposit_logam',
        id: min.id,
        name: min.name,
        metal_type: METAL_METADATA[min.metalType].label,
        chemical_formula: min.chemicalFormula,
        formation: min.formation,
        depth_m: min.depthM,
        thickness_m: min.thicknessM,
        conductivity_msm: min.conductivityMSm,
        magnetic_anomaly_nt: min.magneticAnomalyNt,
        eddy_decay_us: min.eddyDecayUs,
        chargeability_mv_v: min.chargeabilityMvV,
        radiation_cpm: min.radiationCpm,
        grade_estimate: min.gradeEstimate,
        confidence_pct: min.confidence,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [ring],
      },
    });

    features.push({
      type: 'Feature',
      properties: {
        featureType: 'mineral_target_point',
        category: min.metalType,
        id: `${min.id}-point`,
        name: `Titik Anomali ${METAL_METADATA[min.metalType].label}: ${min.name}`,
        target_depth_m: min.depthM,
        grade_estimate: min.gradeEstimate,
        confidence_pct: min.confidence,
      },
      geometry: {
        type: 'Point',
        coordinates: [min.lon, min.lat, scenario.baseElevationM - min.depthM],
      },
    });
  }

  for (const pt of scanPoints) {
    features.push({
      type: 'Feature',
      properties: {
        featureType: 'gpr_station',
        station_index: pt.index,
        elevation_m: pt.elevationM,
        peak_permittivity: pt.peakPermittivity,
        water_confidence_pct: pt.waterConfidence,
        detected_water_depth_m: pt.detectedDepthM,
        magnetic_anomaly_nt: pt.magneticAnomalyNt,
        eddy_decay_us: pt.eddyDecayUs,
        chargeability_mv_v: pt.chargeabilityMvV,
        radiation_cpm: pt.radiationCpm,
        detected_metal_type: pt.detectedMetalType,
        detected_metal_depth_m: pt.detectedMetalDepthM,
        timestamp: pt.timestamp,
      },
      geometry: {
        type: 'Point',
        coordinates: [pt.lon, pt.lat, pt.elevationM],
      },
    });
  }

  const geojson = {
    type: 'FeatureCollection',
    name: `AquaRadar_MultiSensor_${scenario.id}_${new Date().toISOString().slice(0, 10)}`,
    crs: {
      type: 'name',
      properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
    },
    features,
  };

  triggerDownload(
    `aquaradar_${scenario.id}_${Date.now()}.geojson`,
    JSON.stringify(geojson, null, 2),
    'application/geo+json'
  );
}

export function exportToKML(
  scanPoints: ScanPoint[],
  aquifers: AquiferPocket[],
  minerals: MineralDeposit[],
  scenario: TerrainScenario
): void {
  const trackCoords = scanPoints
    .map((pt) => `${pt.lon},${pt.lat},${pt.elevationM}`)
    .join(' ');

  const aquiferPlacemarks = aquifers
    .map((aq) => {
      const metersPerDegLat = 111320;
      const metersPerDegLon = 111320 * Math.cos((aq.lat * Math.PI) / 180);
      const ringCoords: string[] = [];
      for (let i = 0; i <= 24; i++) {
        const theta = (i / 24) * Math.PI * 2;
        const lon = (aq.lon + (Math.cos(theta) * aq.radiusXM) / metersPerDegLon).toFixed(6);
        const lat = (aq.lat + (Math.sin(theta) * aq.radiusZM) / metersPerDegLat).toFixed(6);
        ringCoords.push(`${lon},${lat},${scenario.baseElevationM}`);
      }

      return `
    <Placemark>
      <name>${aq.name} (${aq.depthM} m · ${aq.estimatedFlowLs} L/detik)</name>
      <description><![CDATA[
        <b>Kategori:</b> Air Bawah Tanah (Akuifer)<br/>
        <b>Formasi:</b> ${aq.formation}<br/>
        <b>Kedalaman Puncak:</b> ${aq.depthM} m<br/>
        <b>Permitivitas Dielektrik (εr):</b> ${aq.permittivity}<br/>
        <b>Estimasi Debit:</b> ${aq.estimatedFlowLs} L/detik<br/>
        <b>Tingkat Keyakinan:</b> ${aq.confidence}%
      ]]></description>
      <Style>
        <IconStyle><color>ffeb9b06</color><scale>1.2</scale></IconStyle>
        <PolyStyle><color>66e69402</color></PolyStyle>
        <LineStyle><color>ffeb9b06</color><width>2</width></LineStyle>
      </Style>
      <MultiGeometry>
        <Point><coordinates>${aq.lon},${aq.lat},${scenario.baseElevationM}</coordinates></Point>
        <Polygon><outerBoundaryIs><LinearRing><coordinates>${ringCoords.join(' ')}</coordinates></LinearRing></outerBoundaryIs></Polygon>
      </MultiGeometry>
    </Placemark>`;
    })
    .join('\n');

  const mineralPlacemarks = minerals
    .map((min) => {
      const metersPerDegLat = 111320;
      const metersPerDegLon = 111320 * Math.cos((min.lat * Math.PI) / 180);
      const ringCoords: string[] = [];
      for (let i = 0; i <= 24; i++) {
        const theta = (i / 24) * Math.PI * 2;
        const lon = (min.lon + (Math.cos(theta) * min.radiusXM) / metersPerDegLon).toFixed(6);
        const lat = (min.lat + (Math.sin(theta) * min.radiusZM) / metersPerDegLat).toFixed(6);
        ringCoords.push(`${lon},${lat},${scenario.baseElevationM}`);
      }
      const kmlColor = min.metalType === 'uranium' ? 'ff35e6a3' : 'ff15b3ea';

      return `
    <Placemark>
      <name>${min.name} [${METAL_METADATA[min.metalType].label}] (${min.depthM} m)</name>
      <description><![CDATA[
        <b>Jenis Mineral/Logam:</b> ${METAL_METADATA[min.metalType].label} (${min.chemicalFormula})<br/>
        <b>Formasi:</b> ${min.formation}<br/>
        <b>Kedalaman:</b> ${min.depthM} m (Tebal ±${min.thicknessM} m)<br/>
        <b>Anomali Magnetik:</b> ${min.magneticAnomalyNt} nT<br/>
        <b>Eddy Decay (PI):</b> ${min.eddyDecayUs} µs<br/>
        <b>Chargeability (IP):</b> ${min.chargeabilityMvV} mV/V<br/>
        <b>Radiasi Gamma:</b> ${min.radiationCpm} CPM<br/>
        <b>Estimasi Kadar:</b> ${min.gradeEstimate}<br/>
        <b>Keyakinan:</b> ${min.confidence}%
      ]]></description>
      <Style>
        <IconStyle><color>${kmlColor}</color><scale>1.2</scale></IconStyle>
        <PolyStyle><color>6615b3ea</color></PolyStyle>
        <LineStyle><color>${kmlColor}</color><width>2</width></LineStyle>
      </Style>
      <MultiGeometry>
        <Point><coordinates>${min.lon},${min.lat},${scenario.baseElevationM}</coordinates></Point>
        <Polygon><outerBoundaryIs><LinearRing><coordinates>${ringCoords.join(' ')}</coordinates></LinearRing></outerBoundaryIs></Polygon>
      </MultiGeometry>
    </Placemark>`;
    })
    .join('\n');

  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.com/kml/2.2">
  <Document>
    <name>AquaRadar — ${scenario.name}</name>
    <description>Peta Lokasi Sumber Air &amp; Deposit Logam/Mineral Bawah Tanah — ${scenario.regionExample}</description>
    <Placemark>
      <name>Lintasan Survei Multi-Sensor</name>
      <Style><LineStyle><color>ff00a8ff</color><width>2.5</width></LineStyle></Style>
      <LineString><tessellate>1</tessellate><coordinates>${trackCoords}</coordinates></LineString>
    </Placemark>
    ${aquiferPlacemarks}
    ${mineralPlacemarks}
  </Document>
</kml>`;

  triggerDownload(
    `aquaradar_${scenario.id}_${Date.now()}.kml`,
    kml,
    'application/vnd.google-earth.kml+xml'
  );
}

export function exportToCSV(scanPoints: ScanPoint[], scenario: TerrainScenario): void {
  const headers = [
    'Indeks_Stasiun',
    'Waktu_ISO',
    'X_Meter',
    'Z_Meter',
    'Latitude_WGS84',
    'Longitude_WGS84',
    'Elevasi_mdpl',
    'Permitivitas_Puncak_er',
    'Keyakinan_Air_Persen',
    'Kedalaman_Air_m',
    'Anomali_Magnet_nT',
    'Eddy_Decay_PI_us',
    'Chargeability_IP_mVV',
    'Radiasi_Gamma_CPM',
    'Logam_Terdeteksi',
    'Kedalaman_Logam_m',
  ];

  const rows = scanPoints.map((pt) => [
    pt.index,
    pt.timestamp,
    pt.xM,
    pt.zM,
    pt.lat,
    pt.lon,
    pt.elevationM,
    pt.peakPermittivity,
    pt.waterConfidence,
    pt.detectedDepthM ?? '',
    pt.magneticAnomalyNt,
    pt.eddyDecayUs,
    pt.chargeabilityMvV,
    pt.radiationCpm,
    pt.detectedMetalType ?? '',
    pt.detectedMetalDepthM ?? '',
  ]);

  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  triggerDownload(
    `aquaradar_${scenario.id}_${Date.now()}.csv`,
    csvContent,
    'text/csv;charset=utf-8;'
  );
}

export function exportTextFile(
  filename: string,
  content: string,
  mimeType = 'text/plain;charset=utf-8;'
): void {
  triggerDownload(filename, content, mimeType);
}
