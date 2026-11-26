import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  BellRing,
  CheckCircle2,
  Compass,
  Download,
  Droplets,
  Gem,
  MapPin,
  Pause,
  Play,
  Radio,
  RotateCcw,
  ShieldAlert,
  Usb,
  Volume2,
  VolumeX,
  Waves,
} from 'lucide-react';
import {
  CalibrationConfig,
  DetectionTargetMode,
  MetalType,
  RadarAlert,
  ScanPoint,
  SerialConnectionState,
  TerrainPresetId,
  WorkspaceTab,
} from './types/radar';
import {
  DEFAULT_CALIBRATION,
  generateLawnmowerPath,
  METAL_METADATA,
  sampleSubsurfaceAt,
  TERRAIN_SCENARIOS,
} from './utils/radarPhysics';
import {
  dispatchDeviceNotification,
  requestBrowserNotificationPermission,
} from './utils/notifications';
import {
  SubsurfaceViewport3D,
  SubsurfaceViewportHandle,
} from './components/SubsurfaceViewport3D';
import { RadargramView } from './components/RadargramView';
import { CalibrationPanel } from './components/CalibrationPanel';
import { HardwareSchematicView } from './components/HardwareSchematicView';
import { GuideAndTestingView } from './components/GuideAndTestingView';
import { ExportModal } from './components/ExportModal';

interface SerialPortLike {
  open: (options: { baudRate: number }) => Promise<void>;
  close: () => Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
}

const SURVEY_PATH = generateLawnmowerPath(50, 50, 7, 22);

function buildInitialScanPoints(
  presetId: TerrainPresetId,
  calibration: CalibrationConfig,
  count = 44
): ScanPoint[] {
  const scen = TERRAIN_SCENARIOS[presetId];
  const pts: ScanPoint[] = [];
  for (let i = 0; i < Math.min(count, SURVEY_PATH.length); i++) {
    const pos = SURVEY_PATH[i];
    pts.push(sampleSubsurfaceAt(scen, pos.x, pos.z, calibration, i));
  }
  return pts;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('scanner3d');
  const [presetId, setPresetId] = useState<TerrainPresetId>('mineral_kompleks');
  const [calibration, setCalibration] = useState<CalibrationConfig>(DEFAULT_CALIBRATION);

  const [scanPoints, setScanPoints] = useState<ScanPoint[]>(() =>
    buildInitialScanPoints('mineral_kompleks', DEFAULT_CALIBRATION, 44)
  );
  const [pathCursor, setPathCursor] = useState<number>(44);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<'simulation' | 'serial'>('simulation');

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(
    TERRAIN_SCENARIOS.mineral_kompleks.minerals[0]?.id ??
      TERRAIN_SCENARIOS.mineral_kompleks.aquifers[0]?.id ??
      null
  );
  const [depthSliceM, setDepthSliceM] = useState<number>(40);
  const [strataOpacity, setStrataOpacity] = useState<number>(0.32);
  const [showFlowVectors, setShowFlowVectors] = useState<boolean>(true);

  const [alerts, setAlerts] = useState<RadarAlert[]>(() => {
    const scen = TERRAIN_SCENARIOS.mineral_kompleks;
    const aq = scen.aquifers[0];
    const au = scen.minerals[0];
    const initial: RadarAlert[] = [];
    if (au) {
      initial.push({
        id: 'init-metal-1',
        timestamp: new Date().toLocaleTimeString('id-ID'),
        category: 'logam',
        metalType: au.metalType,
        title: `Anomali Logam Terdeteksi · ${au.name}`,
        message: `${METAL_METADATA[au.metalType].label} · ${au.gradeEstimate}`,
        severity: 'high',
        depthM: au.depthM,
        permittivity: 11.4,
        confidence: au.confidence,
        signatureSummary: `Eddy ${au.eddyDecayUs} µs · ΔB ${au.magneticAnomalyNt} nT`,
        lat: au.lat,
        lon: au.lon,
        acknowledged: false,
      });
    }
    if (aq) {
      initial.push({
        id: 'init-alert-1',
        timestamp: new Date().toLocaleTimeString('id-ID'),
        category: 'air',
        title: `Potensi Cadangan Air Terdeteksi · ${aq.name}`,
        message: `${aq.formation} · Permitivitas εr ${aq.permittivity}`,
        severity: 'high',
        depthM: aq.depthM,
        permittivity: aq.permittivity,
        confidence: aq.confidence,
        estimatedFlowLs: aq.estimatedFlowLs,
        signatureSummary: `εr ${aq.permittivity} · ${aq.estimatedFlowLs} L/dtk`,
        lat: aq.lat,
        lon: aq.lon,
        acknowledged: false,
      });
    }
    return initial;
  });
  const [activeToast, setActiveToast] = useState<RadarAlert | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );

  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  const [serialState, setSerialState] = useState<SerialConnectionState>(() => ({
    supported: typeof navigator !== 'undefined' && 'serial' in navigator,
    connected: false,
    portName: '',
    baudRate: 115200,
    packetsReceived: 0,
    lastPacketAt: null,
    error: null,
  }));

  const viewport3DRef = useRef<SubsurfaceViewportHandle | null>(null);
  const serialPortRef = useRef<SerialPortLike | null>(null);
  const serialReaderCancelRef = useRef<(() => Promise<void>) | null>(null);
  const lastAlertStationRef = useRef<number>(-10);

  const scenario = TERRAIN_SCENARIOS[presetId];
  const latestPoint = scanPoints[scanPoints.length - 1] ?? null;
  const currentPosition = latestPoint
    ? { x: latestPoint.xM, z: latestPoint.zM }
    : { x: SURVEY_PATH[0].x, z: SURVEY_PATH[0].z };

  const selectedAquifer = useMemo(
    () => scenario.aquifers.find((a) => a.id === selectedTargetId) ?? null,
    [scenario, selectedTargetId]
  );

  const selectedMineral = useMemo(
    () => scenario.minerals.find((m) => m.id === selectedTargetId) ?? null,
    [scenario, selectedTargetId]
  );

  const pushDetectionAlert = useCallback(
    (pt: ScanPoint) => {
      const checkWater = calibration.detectionMode !== 'logam' && pt.detectedDepthM !== null;
      const checkMetal =
        calibration.detectionMode !== 'air' &&
        pt.detectedMetalType !== null &&
        pt.detectedMetalDepthM !== null;

      if (!checkWater && !checkMetal) return;
      if (pt.index - lastAlertStationRef.current < 7) return;
      lastAlertStationRef.current = pt.index;

      if (checkMetal && pt.detectedMetalType) {
        const mType = pt.detectedMetalType;
        const meta = METAL_METADATA[mType];
        const isRadioactive = mType === 'uranium';
        const newAlert: RadarAlert = {
          id: `alert-metal-${pt.index}-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('id-ID'),
          category: isRadioactive ? 'radioaktif' : 'logam',
          metalType: mType,
          title: isRadioactive
            ? `Peringatan Radiasi Uranium Terdeteksi`
            : `Anomali ${meta.label} Terdeteksi`,
          message: `Stasiun #${pt.index} · Kedalaman ±${pt.detectedMetalDepthM} m`,
          severity: 'high',
          depthM: pt.detectedMetalDepthM ?? 15,
          permittivity: pt.peakPermittivity,
          confidence: pt.metalConfidence,
          signatureSummary: isRadioactive
            ? `Geiger ${pt.radiationCpm} CPM`
            : `ΔB ${pt.magneticAnomalyNt} nT · PI ${pt.eddyDecayUs} µs`,
          lat: pt.lat,
          lon: pt.lon,
          acknowledged: false,
        };

        setAlerts((prev) => [newAlert, ...prev].slice(0, 24));
        setActiveToast(newAlert);
        dispatchDeviceNotification(newAlert, {
          soundEnabled,
          browserPushEnabled: notifPermission === 'granted',
        });
        return;
      }

      if (checkWater && pt.detectedDepthM !== null) {
        let nearestAq = scenario.aquifers[0];
        let minDist = Infinity;
        for (const aq of scenario.aquifers) {
          const d = Math.hypot(pt.xM - aq.centerXM, pt.zM - aq.centerZM);
          if (d < minDist) {
            minDist = d;
            nearestAq = aq;
          }
        }

        const flow = nearestAq ? nearestAq.estimatedFlowLs : 1.8;
        const newAlert: RadarAlert = {
          id: `alert-water-${pt.index}-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('id-ID'),
          category: 'air',
          title:
            pt.peakPermittivity >= 30
              ? 'Cadangan Air Potensial Tinggi Terdeteksi'
              : 'Indikasi Lapisan Jenuh Air Terdeteksi',
          message: `Stasiun #${pt.index} · Permitivitas εr ${pt.peakPermittivity}`,
          severity: pt.peakPermittivity >= 30 ? 'high' : 'medium',
          depthM: pt.detectedDepthM,
          permittivity: pt.peakPermittivity,
          confidence: pt.waterConfidence,
          estimatedFlowLs: flow,
          signatureSummary: `εr ${pt.peakPermittivity} · ${flow} L/dtk`,
          lat: pt.lat,
          lon: pt.lon,
          acknowledged: false,
        };

        setAlerts((prev) => [newAlert, ...prev].slice(0, 24));
        setActiveToast(newAlert);
        dispatchDeviceNotification(newAlert, {
          soundEnabled,
          browserPushEnabled: notifPermission === 'granted',
        });
      }
    },
    [scenario, calibration.detectionMode, soundEnabled, notifPermission]
  );

  useEffect(() => {
    if (!activeToast) return;
    const timer = window.setTimeout(() => setActiveToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [activeToast]);

  useEffect(() => {
    if (!isScanning || dataSource !== 'simulation') return;

    const timer = window.setInterval(() => {
      setPathCursor((prevCursor) => {
        if (prevCursor >= SURVEY_PATH.length) {
          setIsScanning(false);
          return prevCursor;
        }
        const pos = SURVEY_PATH[prevCursor];
        const nextPt = sampleSubsurfaceAt(scenario, pos.x, pos.z, calibration, prevCursor);
        setScanPoints((prevPts) => [...prevPts, nextPt]);
        pushDetectionAlert(nextPt);
        return prevCursor + 1;
      });
    }, 360);

    return () => window.clearInterval(timer);
  }, [isScanning, dataSource, scenario, calibration, pushDetectionAlert]);

  const handleChangeScenario = (nextId: TerrainPresetId) => {
    setIsScanning(false);
    setPresetId(nextId);
    const nextScenario = TERRAIN_SCENARIOS[nextId];
    const initialPts = buildInitialScanPoints(nextId, calibration, 36);
    setScanPoints(initialPts);
    setPathCursor(36);
    lastAlertStationRef.current = 30;
    setSelectedTargetId(
      nextScenario.minerals[0]?.id ?? nextScenario.aquifers[0]?.id ?? null
    );
  };

  const handleResetScan = () => {
    setIsScanning(false);
    setScanPoints([]);
    setPathCursor(0);
    lastAlertStationRef.current = -10;
    setAlerts([]);
  };

  const handleEnableNotifications = async () => {
    const result = await requestBrowserNotificationPermission();
    setNotifPermission(result);
    if (result === 'granted') {
      const testAlert: RadarAlert = {
        id: `test-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        category: 'logam',
        metalType: 'emas',
        title: 'Notifikasi Real-Time Multi-Sensor Aktif',
        message: 'Perangkat Anda siap menerima peringatan seketika untuk air, logam & uranium.',
        severity: 'high',
        depthM: 19.5,
        permittivity: 34.2,
        confidence: 95,
        signatureSummary: 'GPR + PI + Magneto + Geiger Siaga',
        lat: scenario.baseLat,
        lon: scenario.baseLon,
        acknowledged: true,
      };
      setActiveToast(testAlert);
      dispatchDeviceNotification(testAlert, {
        soundEnabled,
        browserPushEnabled: true,
      });
    }
  };

  const handleTriggerTestAlert = () => {
    const targetMin = selectedMineral ?? scenario.minerals[0];
    const targetAq = selectedAquifer ?? scenario.aquifers[0];

    if (targetMin && (calibration.detectionMode === 'logam' || selectedMineral)) {
      const isRad = targetMin.metalType === 'uranium';
      const testAlert: RadarAlert = {
        id: `manual-test-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        category: isRad ? 'radioaktif' : 'logam',
        metalType: targetMin.metalType,
        title: `Uji Deteksi ${METAL_METADATA[targetMin.metalType].label} · ${targetMin.name}`,
        message: `${targetMin.formation} · Kadar ${targetMin.gradeEstimate}`,
        severity: 'high',
        depthM: targetMin.depthM,
        permittivity: 11.2,
        confidence: targetMin.confidence,
        signatureSummary: isRad
          ? `Geiger ${targetMin.radiationCpm} CPM`
          : `ΔB ${targetMin.magneticAnomalyNt} nT · PI ${targetMin.eddyDecayUs} µs`,
        lat: targetMin.lat,
        lon: targetMin.lon,
        acknowledged: false,
      };
      setAlerts((prev) => [testAlert, ...prev].slice(0, 24));
      setActiveToast(testAlert);
      dispatchDeviceNotification(testAlert, {
        soundEnabled,
        browserPushEnabled: notifPermission === 'granted',
      });
      return;
    }

    const testAlert: RadarAlert = {
      id: `manual-test-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID'),
      category: 'air',
      title: `Uji Deteksi Sumber Air · ${targetAq?.name ?? 'Akuifer'}`,
      message: `Simulasi sensor GPR pada εr ${targetAq?.permittivity ?? 32.5}`,
      severity: 'high',
      depthM: targetAq?.depthM ?? 16.5,
      permittivity: targetAq?.permittivity ?? 32.5,
      confidence: targetAq?.confidence ?? 92,
      estimatedFlowLs: targetAq?.estimatedFlowLs ?? 3.1,
      signatureSummary: `εr ${targetAq?.permittivity ?? 32.5} · ${targetAq?.estimatedFlowLs ?? 3.1} L/dtk`,
      lat: targetAq?.lat ?? scenario.baseLat,
      lon: targetAq?.lon ?? scenario.baseLon,
      acknowledged: false,
    };
    setAlerts((prev) => [testAlert, ...prev].slice(0, 24));
    setActiveToast(testAlert);
    dispatchDeviceNotification(testAlert, {
      soundEnabled,
      browserPushEnabled: notifPermission === 'granted',
    });
  };

  // Web Serial Connect for Real ESP32-S3 Multi-Sensor Hardware
  const handleConnectSerial = async () => {
    const navSerial = (navigator as unknown as {
      serial?: { requestPort: () => Promise<SerialPortLike> };
    }).serial;

    if (!navSerial) {
      setSerialState((s) => ({
        ...s,
        error:
          'Browser ini belum mendukung Web Serial API. Gunakan Google Chrome atau Microsoft Edge versi desktop.',
      }));
      return;
    }

    try {
      const port = await navSerial.requestPort();
      await port.open({ baudRate: 115200 });
      serialPortRef.current = port;
      setDataSource('serial');
      setIsScanning(false);
      setSerialState({
        supported: true,
        connected: true,
        portName: 'ESP32-S3 Multi-Sensor USB',
        baudRate: 115200,
        packetsReceived: 0,
        lastPacketAt: null,
        error: null,
      });

      if (port.readable) {
        const decoder = new TextDecoderStream();
        const readableDone = port.readable.pipeTo(
          decoder.writable as unknown as WritableStream<Uint8Array>
        );
        const reader = decoder.readable.getReader();
        let buffer = '';
        let cancelled = false;

        serialReaderCancelRef.current = async () => {
          cancelled = true;
          try {
            await reader.cancel();
            await readableDone.catch(() => {});
          } catch {
            // ignore
          }
        };

        void (async () => {
          try {
            while (!cancelled) {
              const { value, done } = await reader.read();
              if (done) break;
              if (value) {
                buffer += value;
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith('{')) continue;
                  try {
                    const parsed = JSON.parse(trimmed) as {
                      type?: string;
                      idx?: number;
                      xM?: number;
                      lat?: number;
                      lon?: number;
                      elev?: number;
                      peakEps?: number;
                      depthM?: number;
                      magNt?: number;
                      eddyUs?: number;
                      ipMvV?: number;
                      cpm?: number;
                      metal?: string;
                      amp?: number[];
                    };
                    if (parsed.type === 'scan' && Array.isArray(parsed.amp)) {
                      const samples = parsed.amp.map((mv, idx) => {
                        const d =
                          (idx / Math.max(1, parsed.amp!.length - 1)) * calibration.maxDepthM;
                        const eps = Math.min(78, Math.max(4, 6 + Math.abs(mv) * 0.14));
                        return {
                          depthM: Number(d.toFixed(2)),
                          travelTimeNs: Number(
                            (
                              calibration.zeroOffsetNs +
                              (2 * d) / calibration.soilVelocityMns
                            ).toFixed(1)
                          ),
                          amplitudeMv: mv,
                          permittivity: Number(eps.toFixed(1)),
                          conductivityMSm: 20,
                        };
                      });

                      const peakEps = parsed.peakEps ?? 6;
                      const detected =
                        parsed.depthM &&
                        parsed.depthM > 0 &&
                        peakEps >= calibration.dielectricThreshold
                          ? parsed.depthM
                          : null;

                      const rawMetal = parsed.metal as MetalType | 'none' | undefined;
                      const detectedMetal =
                        rawMetal && rawMetal !== 'none' && rawMetal in METAL_METADATA
                          ? (rawMetal as MetalType)
                          : null;

                      const newPt: ScanPoint = {
                        id: `serial-${parsed.idx ?? Date.now()}`,
                        index: parsed.idx ?? 0,
                        xM: ((parsed.xM ?? 0) % 50) - 25,
                        zM: 0,
                        lat: parsed.lat ?? scenario.baseLat,
                        lon: parsed.lon ?? scenario.baseLon,
                        elevationM: parsed.elev ?? scenario.baseElevationM,
                        peakPermittivity: peakEps,
                        waterConfidence: detected
                          ? Math.min(98, Math.round(58 + (peakEps - 20) * 1.8))
                          : 25,
                        detectedDepthM: detected,
                        salinityPpm: 200,
                        magneticAnomalyNt: parsed.magNt ?? 15,
                        eddyDecayUs: parsed.eddyUs ?? 45,
                        chargeabilityMvV: parsed.ipMvV ?? 5,
                        radiationCpm: parsed.cpm ?? 20,
                        detectedMetalType: detectedMetal,
                        detectedMetalDepthM: detectedMetal ? 12.0 : null,
                        metalConfidence: detectedMetal ? 88 : 0,
                        timestamp: new Date().toISOString(),
                        aScan: samples,
                      };

                      setScanPoints((prev) => [...prev.slice(-240), newPt]);
                      setSerialState((s) => ({
                        ...s,
                        packetsReceived: s.packetsReceived + 1,
                        lastPacketAt: new Date().toLocaleTimeString('id-ID'),
                      }));
                      pushDetectionAlert(newPt);
                    }
                  } catch {
                    // Ignore malformed line
                  }
                }
              }
            }
          } catch {
            // Stream closed
          }
        })();
      }
    } catch (err) {
      setSerialState((s) => ({
        ...s,
        connected: false,
        error: err instanceof Error ? err.message : 'Koneksi port serial dibatalkan.',
      }));
    }
  };

  const handleDisconnectSerial = async () => {
    try {
      await serialReaderCancelRef.current?.();
      await serialPortRef.current?.close();
    } catch {
      // ignore
    }
    serialPortRef.current = null;
    setSerialState((s) => ({
      ...s,
      connected: false,
      portName: '',
    }));
  };

  const handleSendCalibrationSerial = async (cmd: string): Promise<boolean> => {
    const port = serialPortRef.current;
    if (!port || !port.writable) return false;
    try {
      const encoder = new TextEncoder();
      const writer = port.writable.getWriter();
      await writer.write(encoder.encode(`${cmd}\n`));
      writer.releaseLock();
      return true;
    } catch {
      return false;
    }
  };

  const navItems: Array<{ id: WorkspaceTab; label: string }> = [
    { id: 'scanner3d', label: 'Pemindai 3D' },
    { id: 'radargram', label: 'Radargram & Sinyal' },
    { id: 'calibration', label: 'Kalibrasi' },
    { id: 'hardware', label: 'Perangkat & Skematik' },
    { id: 'guide', label: 'Panduan & Uji' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* ==================== TOP BAR (Strict 3-Zone Contract) ==================== */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('scanner3d')}
            className="text-xl font-display font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            AquaRadar
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border-sky-600 text-slate-900 font-semibold'
                      : 'border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor Geospasial
            </button>
          </div>
        </div>

        <nav className="md:hidden flex items-center gap-4 overflow-x-auto pt-2.5 mt-2.5 border-t border-slate-100 text-xs font-medium">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`py-1.5 px-1 border-b-2 whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-sky-600 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* ==================== MULTI-SENSOR TELEMETRY & NOTIFICATION RIBBON ==================== */}
      <div className="bg-slate-900 text-slate-200 border-b border-slate-800 px-4 sm:px-6 py-2">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono tabular-nums">
            <span className="text-slate-100 font-medium">
              {serialState.connected
                ? `● Terhubung: ${serialState.portName} (${serialState.packetsReceived} paket)`
                : isScanning
                ? '● Pemindaian Aktif'
                : '○ Siaga Multi-Sensor'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-sky-300">
              Air εr: {latestPoint ? latestPoint.peakPermittivity : '—'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-orange-300">
              ΔB: {latestPoint ? `${latestPoint.magneticAnomalyNt} nT` : '—'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-yellow-300">
              PI: {latestPoint ? `${latestPoint.eddyDecayUs} µs` : '—'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-lime-300">
              Geiger: {latestPoint ? `${latestPoint.radiationCpm} CPM` : '—'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">
              Stasiun: {scanPoints.length}/{SURVEY_PATH.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              )}
              Suara Alarm
            </button>

            {notifPermission !== 'granted' ? (
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                Aktifkan Notifikasi Perangkat
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTriggerTestAlert}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-600/30 hover:bg-sky-600/40 border border-sky-400/40 text-sky-200 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5" />
                Uji Notifikasi Real-Time
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ==================== MAIN WORKSPACE ==================== */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'scanner3d' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Control & Parameter Column */}
              <aside className="lg:col-span-4 xl:col-span-3 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-5">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-lg font-semibold text-slate-900">
                      Konsol Pemindai Air & Logam
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Tomografi 3D akuifer air tanah, bijih logam (Au, Ag, Ni, Fe, FeS₂) & uranium.
                    </p>
                  </div>

                  {/* Mode Filter Target Deteksi */}
                  <div>
                    <div className="text-xs font-semibold text-slate-700 mb-1.5">
                      Fokus Target Deteksi
                    </div>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                      {(
                        [
                          ['semua', 'Semua'],
                          ['air', 'Air Saja'],
                          ['logam', 'Logam'],
                        ] as Array<[DetectionTargetMode, string]>
                      ).map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() =>
                            setCalibration((c) => ({ ...c, detectionMode: mode }))
                          }
                          className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                            calibration.detectionMode === mode
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sumber Data Mode Switcher */}
                  <div>
                    <div className="text-xs font-semibold text-slate-700 mb-1.5">
                      Sumber Data Sensor
                    </div>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setDataSource('simulation')}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          dataSource === 'simulation'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Simulasi Lapangan
                      </button>
                      <button
                        type="button"
                        onClick={() => setDataSource('serial')}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          dataSource === 'serial'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Sensor ESP32 USB
                      </button>
                    </div>
                  </div>

                  {dataSource === 'simulation' ? (
                    <div className="space-y-2.5">
                      <label className="block">
                        <span className="text-xs font-semibold text-slate-700">
                          Formasi Geologi Lapangan
                        </span>
                        <select
                          value={presetId}
                          onChange={(e) => handleChangeScenario(e.target.value as TerrainPresetId)}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          {Object.values(TERRAIN_SCENARIOS).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {scenario.description}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">Koneksi Web Serial</span>
                        <span className="font-mono text-[11px] text-slate-500">115200 bps</span>
                      </div>
                      {!serialState.connected ? (
                        <button
                          type="button"
                          onClick={handleConnectSerial}
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Usb className="w-3.5 h-3.5" />
                          Hubungkan Port USB ESP32
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleDisconnectSerial}
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Putuskan Port Serial
                        </button>
                      )}
                      {serialState.error && (
                        <p className="text-[11px] text-rose-700 leading-snug">
                          {serialState.error}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Frekuensi & Threshold */}
                  <div className="space-y-3 pt-1 border-t border-slate-100">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-700">Frekuensi Antena GPR</span>
                        <span className="font-mono font-semibold text-sky-700">
                          {calibration.antennaFreqMHz} MHz
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-lg">
                        {([50, 100, 250, 400] as const).map((freq) => (
                          <button
                            key={freq}
                            type="button"
                            onClick={() =>
                              setCalibration((c) => ({ ...c, antennaFreqMHz: freq }))
                            }
                            className={`py-1 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                              calibration.antennaFreqMHz === freq
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {freq}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">Ambang Air (εr)</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900">
                          ≥ {calibration.dielectricThreshold}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={40}
                        step={1}
                        value={calibration.dielectricThreshold}
                        onChange={(e) =>
                          setCalibration((c) => ({
                            ...c,
                            dielectricThreshold: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-sky-600 cursor-pointer"
                      />
                    </div>

                    <label className="flex items-center justify-between text-xs text-slate-700 pt-1 cursor-pointer">
                      <span>Tampilkan Vektor Aliran Air 3D</span>
                      <input
                        type="checkbox"
                        checked={showFlowVectors}
                        onChange={(e) => setShowFlowVectors(e.target.checked)}
                        className="w-4 h-4 accent-sky-600 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Action Execution Bar */}
                <div className="pt-4 border-t border-slate-200 flex items-center gap-2">
                  {dataSource === 'simulation' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (pathCursor >= SURVEY_PATH.length) {
                          setScanPoints([]);
                          setPathCursor(0);
                          lastAlertStationRef.current = -10;
                        }
                        setIsScanning((v) => !v);
                      }}
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        isScanning
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-sky-600 hover:bg-sky-700 text-white'
                      }`}
                    >
                      {isScanning ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          Jeda Pemindaian
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          {pathCursor >= SURVEY_PATH.length
                            ? 'Ulangi Pemindaian'
                            : 'Mulai Pemindaian'}
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleResetScan}
                    title="Bersihkan jalur lintasan"
                    className="p-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </aside>

              {/* Main 3D Subsurface Viewport Stage */}
              <div className="lg:col-span-8 xl:col-span-9 min-h-[560px]">
                <SubsurfaceViewport3D
                  ref={viewport3DRef}
                  scenario={scenario}
                  scanPoints={scanPoints}
                  currentPosition={currentPosition}
                  selectedTargetId={selectedTargetId}
                  onSelectTarget={setSelectedTargetId}
                  depthSliceM={depthSliceM}
                  onDepthSliceChange={setDepthSliceM}
                  strataOpacity={strataOpacity}
                  onStrataOpacityChange={setStrataOpacity}
                  showFlowVectors={showFlowVectors}
                  detectionMode={calibration.detectionMode}
                />
              </div>
            </div>

            {/* Bottom Analytical Row: Unified Water & Mineral Target Inspector + Real-Time Alert Log */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {selectedMineral ? (
                      <Gem className="w-5 h-5 text-amber-600" />
                    ) : (
                      <Droplets className="w-5 h-5 text-sky-600" />
                    )}
                    <h2 className="text-base font-semibold text-slate-900">
                      Detail Target Terdeteksi (Sumber Air & Deposit Logam)
                    </h2>
                  </div>
                </div>

                {/* Target Switcher Strip (Aquifers + All Detected Metals) */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg">
                  {scenario.aquifers.map((aq) => (
                    <button
                      key={aq.id}
                      type="button"
                      onClick={() => setSelectedTargetId(aq.id)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        selectedTargetId === aq.id
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      Air: {aq.name}
                    </button>
                  ))}
                  {scenario.minerals.map((min) => (
                    <button
                      key={min.id}
                      type="button"
                      onClick={() => setSelectedTargetId(min.id)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                        selectedTargetId === min.id
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-sm shrink-0"
                        style={{ backgroundColor: METAL_METADATA[min.metalType].colorHex }}
                      />
                      {METAL_METADATA[min.metalType].label}
                    </button>
                  ))}
                </div>

                {selectedAquifer && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">
                        {selectedAquifer.formation}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{selectedAquifer.qualityClass}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-sky-700">
                        {selectedAquifer.boreholeRecommended
                          ? 'Direkomendasikan untuk Pengeboran Sumur'
                          : 'Zona Cadangan Sekunder'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="text-[11px] text-slate-500">Kedalaman Puncak</div>
                        <div className="text-xl font-mono font-semibold tabular-nums text-slate-900 mt-0.5">
                          {selectedAquifer.depthM} <span className="text-xs text-slate-500">m</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Tebal ±{selectedAquifer.thicknessM} m
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="text-[11px] text-slate-500">Estimasi Debit</div>
                        <div className="text-xl font-mono font-semibold tabular-nums text-sky-700 mt-0.5">
                          {selectedAquifer.estimatedFlowLs}{' '}
                          <span className="text-xs text-slate-500">L/dtk</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Vol ±{selectedAquifer.estimatedVolumeM3.toLocaleString('id-ID')} m³
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="text-[11px] text-slate-500">Permitivitas (εr)</div>
                        <div className="text-xl font-mono font-semibold tabular-nums text-slate-900 mt-0.5">
                          {selectedAquifer.permittivity}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Kadar air {selectedAquifer.volumetricWaterPct}%
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="text-[11px] text-slate-500">Keyakinan Deteksi</div>
                        <div className="text-xl font-mono font-semibold tabular-nums text-emerald-700 mt-0.5">
                          {selectedAquifer.confidence}%
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
                          {selectedAquifer.lat.toFixed(5)}, {selectedAquifer.lon.toFixed(5)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedMineral && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">
                        {selectedMineral.name} ({selectedMineral.chemicalFormula})
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{selectedMineral.formation}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-amber-700">
                        Estimasi Kadar: {selectedMineral.gradeEstimate}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="text-[11px] text-slate-500">Kedalaman Deposit</div>
                        <div className="text-xl font-mono font-semibold tabular-nums text-slate-900 mt-0.5">
                          {selectedMineral.depthM} <span className="text-xs text-slate-500">m</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Tebal ±{selectedMineral.thicknessM} m
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="text-[11px] text-slate-500">Anomali Magnet / PI</div>
                        <div className="text-xl font-mono font-semibold tabular-nums text-orange-600 mt-0.5">
                          {selectedMineral.magneticAnomalyNt}{' '}
                          <span className="text-xs text-slate-500">nT</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          Eddy PI: {selectedMineral.eddyDecayUs} µs
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="text-[11px] text-slate-500">IP &amp; Radiasi Geiger</div>
                        <div className="text-xl font-mono font-semibold tabular-nums text-lime-700 mt-0.5">
                          {selectedMineral.radiationCpm}{' '}
                          <span className="text-xs text-slate-500">CPM</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          IP: {selectedMineral.chargeabilityMvV} mV/V
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="text-[11px] text-slate-500">Keyakinan Klasifikasi</div>
                        <div className="text-xl font-mono font-semibold tabular-nums text-emerald-700 mt-0.5">
                          {selectedMineral.confidence}%
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
                          {selectedMineral.lat.toFixed(5)}, {selectedMineral.lon.toFixed(5)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Real-Time Device Notification Feed */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-sky-600" />
                    <h2 className="text-base font-semibold text-slate-900">
                      Log Notifikasi Real-Time (Air &amp; Logam)
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleTriggerTestAlert}
                    className="text-xs font-medium text-sky-700 hover:text-sky-800 cursor-pointer whitespace-nowrap"
                  >
                    + Uji Peringatan
                  </button>
                </div>

                {alerts.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
                    <Compass className="w-6 h-6 text-slate-400 mb-2" />
                    Belum ada anomali air atau logam yang memicu notifikasi pada sesi ini.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[215px] overflow-y-auto pr-1">
                    {alerts.map((al) => (
                      <div
                        key={al.id}
                        className="border border-slate-200 rounded-lg p-3 bg-slate-50/70 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                            {al.category === 'radioaktif' ? (
                              <ShieldAlert className="w-3.5 h-3.5 text-lime-600 shrink-0" />
                            ) : al.category === 'logam' ? (
                              <Gem className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            ) : al.severity === 'high' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            )}
                            <span>{al.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-600">{al.message}</div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono tabular-nums text-slate-500 pt-0.5">
                            <span className="inline-flex items-center gap-1">
                              <Waves className="w-3 h-3" /> {al.depthM} m
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{al.signatureSummary}</span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {al.lat.toFixed(5)}, {al.lon.toFixed(5)}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
                          {al.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'radargram' && (
          <RadargramView
            scenario={scenario}
            scanPoints={scanPoints}
            calibration={calibration}
            selectedTargetId={selectedTargetId}
            onSelectTarget={setSelectedTargetId}
          />
        )}

        {activeTab === 'calibration' && (
          <CalibrationPanel
            calibration={calibration}
            onChange={setCalibration}
            serialState={serialState}
            onSendCalibrationSerial={handleSendCalibrationSerial}
          />
        )}

        {activeTab === 'hardware' && <HardwareSchematicView />}

        {activeTab === 'guide' && <GuideAndTestingView />}
      </main>

      <footer className="bg-white border-t border-slate-200 px-4 sm:px-6 py-4 mt-8">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            AquaRadar — Sistem Pemetaan Air Bawah Tanah, Logam &amp; Mineral Multi-Sensor
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('hardware')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Alat Tambahan Logam &amp; Skematik
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Firmware ESP32 &amp; Uji Alat
            </button>
          </div>
        </div>
      </footer>

      {/* ==================== REAL-TIME FLOATING TOAST ALERT ==================== */}
      {activeToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 max-w-sm w-[calc(100%-2.5rem)] bg-slate-950 text-white border border-sky-500/60 rounded-xl p-4 shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <Activity
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                activeToast.category === 'radioaktif'
                  ? 'text-lime-400'
                  : activeToast.category === 'logam'
                  ? 'text-amber-400'
                  : 'text-sky-400'
              }`}
            />
            <div className="flex-1 space-y-1">
              <div className="text-xs font-semibold text-sky-300">
                Peringatan Sensor Real-Time
              </div>
              <div className="text-sm font-semibold text-white">{activeToast.title}</div>
              <div className="text-xs text-slate-300">
                Kedalaman <span className="font-mono font-semibold text-white">{activeToast.depthM} m</span> ·{' '}
                Keyakinan <span className="font-mono font-semibold text-emerald-400">{activeToast.confidence}%</span> ·{' '}
                <span className="font-mono font-semibold text-amber-300">{activeToast.signatureSummary}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                GPS: {activeToast.lat.toFixed(5)}, {activeToast.lon.toFixed(5)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveToast(null)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ==================== GEOSPATIAL EXPORT MODAL ==================== */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        scenario={scenario}
        scanPoints={scanPoints}
        aquifers={scenario.aquifers}
        minerals={scenario.minerals}
        onCapture3DPng={() => viewport3DRef.current?.capturePng()}
      />
    </div>
  );
}
