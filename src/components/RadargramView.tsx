import React, { useEffect, useRef } from 'react';
import {
  CalibrationConfig,
  ScanPoint,
  TerrainScenario,
} from '../types/radar';
import { METAL_METADATA } from '../utils/radarPhysics';

interface RadargramViewProps {
  scenario: TerrainScenario;
  scanPoints: ScanPoint[];
  calibration: CalibrationConfig;
  selectedTargetId: string | null;
  onSelectTarget: (id: string) => void;
}

export const RadargramView: React.FC<RadargramViewProps> = ({
  scenario,
  scanPoints,
  calibration,
  selectedTargetId,
  onSelectTarget,
}) => {
  const bScanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const aScanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const multiChannelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const latestPoint = scanPoints[scanPoints.length - 1] ?? null;

  // Render B-Scan Radargram Cross-Section
  useEffect(() => {
    const canvas = bScanCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#09111e';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (i / 4) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (scanPoints.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Belum ada data radargram. Tekan "Mulai Pemindaian" untuk merekam profil B-Scan.', w / 2, h / 2);
      return;
    }

    const visiblePoints = scanPoints.slice(-90);
    const colW = Math.max(4, w / Math.max(visiblePoints.length, 24));

    visiblePoints.forEach((pt, colIdx) => {
      const x = colIdx * colW;
      const samples = pt.aScan;
      const cellH = h / samples.length;

      for (let r = 0; r < samples.length; r++) {
        const s = samples[r];
        const y = r * cellH;

        if (s.permittivity >= calibration.dielectricThreshold) {
          const intensity = Math.min(1, (s.permittivity - calibration.dielectricThreshold) / 22);
          const g = Math.round(165 + intensity * 70);
          const b = Math.round(220 + intensity * 35);
          ctx.fillStyle = `rgba(14, ${g}, ${b}, ${0.55 + intensity * 0.45})`;
        } else if (s.conductivityMSm >= 85) {
          const mInt = Math.min(1, s.conductivityMSm / 260);
          ctx.fillStyle = `rgba(250, 204, 21, ${0.4 + mInt * 0.55})`;
        } else {
          const normAmp = Math.max(-1, Math.min(1, s.amplitudeMv / 110));
          if (normAmp > 0) {
            const v = Math.round(normAmp * 180);
            ctx.fillStyle = `rgb(${25 + Math.round(v * 0.6)}, ${35 + Math.round(v * 0.35)}, ${55 + Math.round(v * 0.1)})`;
          } else {
            const v = Math.round(Math.abs(normAmp) * 180);
            ctx.fillStyle = `rgb(${15}, ${30 + Math.round(v * 0.3)}, ${50 + Math.round(v * 0.55)})`;
          }
        }
        ctx.fillRect(x, y, colW + 0.6, cellH + 0.6);
      }

      if (pt.detectedDepthM !== null) {
        const markerY = (pt.detectedDepthM / calibration.maxDepthM) * h;
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(x, markerY - 1.5, colW, 3);
      }
      if (pt.detectedMetalDepthM !== null && pt.detectedMetalType) {
        const markerY = (pt.detectedMetalDepthM / calibration.maxDepthM) * h;
        ctx.fillStyle = METAL_METADATA[pt.detectedMetalType].colorHex;
        ctx.fillRect(x, markerY - 2, colW, 4);
      }
    });

    ctx.fillStyle = 'rgba(9, 17, 30, 0.78)';
    ctx.fillRect(0, 0, 44, h);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    for (let i = 0; i <= 4; i++) {
      const d = Math.round((i / 4) * calibration.maxDepthM);
      const y = i === 0 ? 14 : i === 4 ? h - 6 : (i / 4) * h + 4;
      ctx.fillText(`${d}m`, 6, y);
    }
  }, [scanPoints, calibration]);

  // Render Live A-Scan Oscilloscope
  useEffect(() => {
    const canvas = aScanCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#09111e';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.45, 0);
    ctx.lineTo(w * 0.45, h);
    ctx.stroke();

    if (!latestPoint) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Menunggu sinyal A-Scan...', w / 2, h / 2);
      return;
    }

    const samples = latestPoint.aScan;
    const threshX = w * 0.6 + (calibration.dielectricThreshold / 60) * (w * 0.36);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(threshX, 0);
    ctx.lineTo(threshX, h);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    samples.forEach((s, i) => {
      const y = (i / (samples.length - 1)) * h;
      const x = w * 0.6 + Math.min(1, s.permittivity / 60) * (w * 0.36);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    samples.forEach((s, i) => {
      const y = (i / (samples.length - 1)) * h;
      const x = w * 0.3 + (s.amplitudeMv / 240) * (w * 0.22);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Amplitudo (mV)', 8, 14);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Permitivitas (εr)', w * 0.6, 14);
  }, [latestPoint, calibration]);

  // Render Multi-Sensor Metal & Radiation Line Plot (Magnetometer, Eddy PI, IP, Geiger CPM)
  useEffect(() => {
    const canvas = multiChannelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#09111e';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (i / 4) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const visible = scanPoints.slice(-90);
    if (visible.length < 2) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Menunggu rekaman multi-sensor (Magnetometer, PI Eddy, IP & Geiger)...', w / 2, h / 2);
      return;
    }

    const drawSeries = (
      color: string,
      getValue: (pt: ScanPoint) => number,
      maxVal: number
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      visible.forEach((pt, idx) => {
        const x = (idx / (visible.length - 1)) * w;
        const norm = Math.min(1, Math.max(0, getValue(pt) / maxVal));
        const y = h - 10 - norm * (h - 24);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    drawSeries('#f97316', (p) => p.magneticAnomalyNt, 1500);
    drawSeries('#facc15', (p) => p.eddyDecayUs, 500);
    drawSeries('#38bdf8', (p) => p.chargeabilityMvV, 75);
    drawSeries('#a3e635', (p) => p.radiationCpm, 360);
  }, [scanPoints]);

  // Render Top-Down 2D Geospatial Contour Map (Water + Metals)
  useEffect(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#0c1524';
    ctx.fillRect(0, 0, w, h);

    const toCanvasX = (xM: number) => ((xM + 30) / 60) * w;
    const toCanvasY = (zM: number) => ((zM + 30) / 60) * h;

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.lineWidth = 1;
    for (let m = -20; m <= 20; m += 10) {
      const gx = toCanvasX(m);
      const gy = toCanvasY(m);
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    // Aquifer footprints
    for (const aq of scenario.aquifers) {
      const cx = toCanvasX(aq.centerXM);
      const cy = toCanvasY(aq.centerZM);
      const rx = (aq.radiusXM / 60) * w;
      const ry = (aq.radiusZM / 60) * h;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(14, 165, 233, 0.28)';
      ctx.fill();
      ctx.lineWidth = aq.id === selectedTargetId ? 2.5 : 1.5;
      ctx.strokeStyle = aq.id === selectedTargetId ? '#22d3ee' : '#0284c7';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#22d3ee';
      ctx.fill();

      ctx.fillStyle = '#e0f2fe';
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Air (${aq.depthM}m)`, cx, cy - 8);
      ctx.restore();
    }

    // Mineral / Metal footprints
    for (const min of scenario.minerals) {
      const cx = toCanvasX(min.centerXM);
      const cy = toCanvasY(min.centerZM);
      const rx = (min.radiusXM / 60) * w;
      const ry = (min.radiusZM / 60) * h;
      const meta = METAL_METADATA[min.metalType];

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = `${meta.colorHex}33`;
      ctx.fill();
      ctx.lineWidth = min.id === selectedTargetId ? 2.5 : 1.5;
      ctx.strokeStyle = min.id === selectedTargetId ? '#ffffff' : meta.colorHex;
      ctx.stroke();

      ctx.fillStyle = meta.colorHex;
      ctx.fillRect(cx - 4, cy - 4, 8, 8);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${meta.label} (${min.depthM}m)`, cx, cy - 8);
      ctx.restore();
    }

    if (scanPoints.length > 0) {
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      scanPoints.forEach((pt, idx) => {
        const px = toCanvasX(pt.xM);
        const py = toCanvasY(pt.zM);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      const last = scanPoints[scanPoints.length - 1];
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(toCanvasX(last.xM), toCanvasY(last.zM), 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [scenario, scanPoints, selectedTargetId]);

  const handleMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xM = ((e.clientX - rect.left) / rect.width) * 60 - 30;
    const zM = ((e.clientY - rect.top) / rect.height) * 60 - 30;

    let closestId: string | null = null;
    let minDist = Infinity;

    for (const aq of scenario.aquifers) {
      const dist = Math.hypot(xM - aq.centerXM, zM - aq.centerZM);
      if (dist < Math.max(aq.radiusXM, aq.radiusZM) && dist < minDist) {
        minDist = dist;
        closestId = aq.id;
      }
    }
    for (const min of scenario.minerals) {
      const dist = Math.hypot(xM - min.centerXM, zM - min.centerZM);
      if (dist < Math.max(min.radiusXM, min.radiusZM) && dist < minDist) {
        minDist = dist;
        closestId = min.id;
      }
    }

    if (closestId) {
      onSelectTarget(closestId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Radargram GPR, Spektrum Multi-Sensor Logam & Peta Kontur Geospasial
          </h2>
          <p className="text-sm text-slate-600">
            Pantulan biru menandakan air tanah (εr tinggi), sedangkan pantulan emas/kuning berkonduktivitas tinggi dipadukan dengan grafik Magnetometer, Eddy PI, IP, dan Geiger untuk membedakan jenis logam dan uranium.
          </p>
        </div>
        <div className="flex items-center gap-6 text-xs font-mono tabular-nums text-slate-700">
          <div>
            <div className="text-slate-400 uppercase text-[10px]">Frekuensi GPR</div>
            <div className="text-sm font-semibold text-slate-900">{calibration.antennaFreqMHz} MHz</div>
          </div>
          <div>
            <div className="text-slate-400 uppercase text-[10px]">Anomali Magnet</div>
            <div className="text-sm font-semibold text-orange-600">
              {latestPoint ? `${latestPoint.magneticAnomalyNt} nT` : '—'}
            </div>
          </div>
          <div>
            <div className="text-slate-400 uppercase text-[10px]">Radiasi Gamma</div>
            <div className="text-sm font-semibold text-lime-700">
              {latestPoint ? `${latestPoint.radiationCpm} CPM` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Main B-Scan + A-Scan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Profil Penampang B-Scan (Kedalaman vs Jarak Lintasan)
            </h3>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              Rentang 0 – {calibration.maxDepthM} m · TVG {calibration.tvgSlopeDbM} dB/m
            </span>
          </div>
          <div className="w-full overflow-hidden rounded-lg border border-slate-800 bg-[#09111e]">
            <canvas ref={bScanCanvasRef} width={780} height={320} className="w-full h-[300px] block" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 pt-1">
            <span>Biru terang: Akuifer Air (εr ≥ {calibration.dielectricThreshold})</span>
            <span>Emas / Kuning: Anomali Konduktif Logam & Sulfida</span>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Osiloskop A-Scan</h3>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {latestPoint ? `#${latestPoint.index}` : 'Idle'}
            </span>
          </div>
          <div className="w-full overflow-hidden rounded-lg border border-slate-800 bg-[#09111e]">
            <canvas ref={aScanCanvasRef} width={340} height={320} className="w-full h-[300px] block" />
          </div>
          {latestPoint && (
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-mono tabular-nums">
              <div className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5">
                <div className="text-[10px] text-slate-500">Puncak εr</div>
                <div className="font-semibold text-slate-900">{latestPoint.peakPermittivity}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5">
                <div className="text-[10px] text-slate-500">Eddy PI</div>
                <div className="font-semibold text-amber-700">{latestPoint.eddyDecayUs} µs</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5">
                <div className="text-[10px] text-slate-500">Geiger</div>
                <div className="font-semibold text-lime-700">{latestPoint.radiationCpm} CPM</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Sensor Metal & Radiation Trace */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Grafik Jejak Multi-Sensor Logam & Radioaktif Sepanjang Lintasan
          </h3>
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-700">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-orange-500 inline-block" /> Magnetometer (nT · Besi/Nikel)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-yellow-400 inline-block" /> Eddy PI (µs · Emas/Perak)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-sky-400 inline-block" /> IP (mV/V · Pirit)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-lime-400 inline-block" /> Geiger (CPM · Uranium)
            </span>
          </div>
        </div>
        <div className="w-full overflow-hidden rounded-lg border border-slate-800 bg-[#09111e]">
          <canvas ref={multiChannelCanvasRef} width={1120} height={160} className="w-full h-[150px] block" />
        </div>
      </div>

      {/* Top-Down Grid Map + Strata Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Peta Grid Survei Tampak Atas (Air & Deposit Logam)
            </h3>
            <span className="text-xs text-slate-500">Klik zona mana saja untuk memilih</span>
          </div>
          <div className="w-full overflow-hidden rounded-lg border border-slate-800 bg-[#0c1524]">
            <canvas
              ref={mapCanvasRef}
              width={520}
              height={360}
              onClick={handleMapClick}
              className="w-full h-[320px] block cursor-crosshair"
            />
          </div>
        </div>

        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Interpretasi Lapisan Stratigrafi — {scenario.name}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3 font-medium">Lapisan Geologi</th>
                  <th className="py-2 px-3 font-medium">Kedalaman</th>
                  <th className="py-2 px-3 font-medium">Permitivitas</th>
                  <th className="py-2 pl-3 font-medium">Karakteristik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scenario.strata.map((s) => (
                  <tr key={s.name} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-3 font-medium text-slate-900">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-sm shrink-0 border border-slate-300"
                          style={{ backgroundColor: s.colorHex }}
                        />
                        {s.name}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {s.topDepthM}–{s.bottomDepthM} m
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-sky-700 whitespace-nowrap">
                      {s.permittivityRange}
                    </td>
                    <td className="py-2.5 pl-3 text-slate-600">{s.material}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
