import React, { useState } from 'react';
import { CalibrationConfig, SerialConnectionState } from '../types/radar';
import {
  calculateToppWaterContentPct,
  calculateVelocityFromPermittivity,
  DEFAULT_CALIBRATION,
  METAL_METADATA,
  SPEED_OF_LIGHT_M_NS,
} from '../utils/radarPhysics';
import { Check, RotateCcw, Send, Sliders } from 'lucide-react';

interface CalibrationPanelProps {
  calibration: CalibrationConfig;
  onChange: (next: CalibrationConfig) => void;
  serialState: SerialConnectionState;
  onSendCalibrationSerial: (cmd: string) => Promise<boolean>;
}

const REFERENCE_MEDIA = [
  { label: 'Udara Terbuka (Kalibrasi Nol)', eps: 1.0, desc: 'Referensi kecepatan cahaya ruang hampa' },
  { label: 'Pasir Kering / Batuan Masif', eps: 4.5, desc: 'Tanah kering tanpa cadangan air bebas' },
  { label: 'Lempung Lembap (Aquitard)', eps: 14.0, desc: 'Kelembaban terikat, permeabilitas rendah' },
  { label: 'Akuifer Pasir Jenuh Air Tawar', eps: 32.0, desc: 'Potensi sumber mata air siap bor' },
  { label: 'Rongga Sungai Bawah Tanah', eps: 65.0, desc: 'Dominan air bebas dalam rongga karst' },
  { label: 'Air Murni (20 °C)', eps: 80.0, desc: 'Batas maksimum permitivitas air tawar' },
];

export const CalibrationPanel: React.FC<CalibrationPanelProps> = ({
  calibration,
  onChange,
  serialState,
  onSendCalibrationSerial,
}) => {
  const [testTwoWayNs, setTestTwoWayNs] = useState(280);
  const [testPermittivity, setTestPermittivity] = useState(28);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const computedVelocity = calculateVelocityFromPermittivity(testPermittivity);
  const computedDepthM = Math.max(
    0,
    (testTwoWayNs - calibration.zeroOffsetNs) * 0.5 * computedVelocity
  );
  const toppMoisturePct = calculateToppWaterContentPct(testPermittivity);

  const handleSyncToHardware = async () => {
    const cmd = `CAL:${calibration.zeroOffsetNs.toFixed(2)},${calibration.soilVelocityMns.toFixed(
      3
    )},${calibration.dielectricThreshold.toFixed(1)},${calibration.maxDepthM}`;
    const ok = await onSendCalibrationSerial(cmd);
    if (ok) {
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold text-slate-900">
            Studio Kalibrasi Sensor Air, Logam & Radiasi Nuklir Alam
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Kalibrasi menyeluruh memastikan akurasi kedalaman GPR serta ambang pemisahan antara air tanah, bijih besi/nikel magnetik, emas/perak berkonduktivitas tinggi, pirit, dan anomali uranium.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_CALIBRATION)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Standar Pabrik
          </button>
          <button
            type="button"
            disabled={!serialState.connected}
            onClick={handleSyncToHardware}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              serialState.connected
                ? 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            {syncSuccess ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
            {syncSuccess
              ? 'Terkirim ke ESP32'
              : serialState.connected
              ? 'Kirim Kalibrasi ke ESP32'
              : 'Hubungkan USB ESP32 untuk Sinkronisasi'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Calibration Sliders (Water + Metal + Radiation) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Sliders className="w-4 h-4 text-sky-600" />
            Kalibrasi Parameter Multi-Sensor
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">1. Zero-Time Offset GPR (t₀ di udara)</span>
                <span className="font-mono tabular-nums font-semibold text-sky-700">
                  {calibration.zeroOffsetNs.toFixed(1)} ns
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={8.0}
                step={0.1}
                value={calibration.zeroOffsetNs}
                onChange={(e) => onChange({ ...calibration, zeroOffsetNs: Number(e.target.value) })}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">2. Kecepatan Gelombang Tanah Rata-Rata (v)</span>
                <span className="font-mono tabular-nums font-semibold text-sky-700">
                  {calibration.soilVelocityMns.toFixed(3)} m/ns
                </span>
              </div>
              <input
                type="range"
                min={0.045}
                max={0.16}
                step={0.002}
                value={calibration.soilVelocityMns}
                onChange={(e) => onChange({ ...calibration, soilVelocityMns: Number(e.target.value) })}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">3. Ambang Deteksi Air Tanah (εr)</span>
                <span className="font-mono tabular-nums font-semibold text-sky-700">
                  εr ≥ {calibration.dielectricThreshold}
                </span>
              </div>
              <input
                type="range"
                min={14}
                max={45}
                step={1}
                value={calibration.dielectricThreshold}
                onChange={(e) =>
                  onChange({ ...calibration, dielectricThreshold: Number(e.target.value) })
                }
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-4">
              <div className="text-xs font-semibold text-slate-800">
                Ambang Deteksi Sensor Logam & Radioaktif
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">4. Ambang Anomali Magnetometer (Besi/Nikel)</span>
                  <span className="font-mono tabular-nums font-semibold text-orange-600">
                    ΔB ≥ {calibration.magneticThresholdNt} nT
                  </span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={600}
                  step={20}
                  value={calibration.magneticThresholdNt}
                  onChange={(e) =>
                    onChange({ ...calibration, magneticThresholdNt: Number(e.target.value) })
                  }
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">5. Ambang Eddy Decay PI (Emas/Perak/Tembaga)</span>
                  <span className="font-mono tabular-nums font-semibold text-amber-600">
                    τ ≥ {calibration.eddyThresholdUs} µs
                  </span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={400}
                  step={10}
                  value={calibration.eddyThresholdUs}
                  onChange={(e) =>
                    onChange({ ...calibration, eddyThresholdUs: Number(e.target.value) })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">6. Ambang Radiasi Geiger-Müller (Uranium)</span>
                  <span className="font-mono tabular-nums font-semibold text-lime-700">
                    ≥ {calibration.radiationThresholdCpm} CPM
                  </span>
                </div>
                <input
                  type="range"
                  min={45}
                  max={250}
                  step={5}
                  value={calibration.radiationThresholdCpm}
                  onChange={(e) =>
                    onChange({ ...calibration, radiationThresholdCpm: Number(e.target.value) })
                  }
                  className="w-full accent-lime-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Physics Calculator + Metal & Water Signatures */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Kalkulator Kedalaman TWT & Matriks Tanda Khas Mineral
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-slate-700">Waktu Pantul Terukur (ns)</span>
              <input
                type="number"
                min={5}
                max={1500}
                value={testTwoWayNs}
                onChange={(e) => setTestTwoWayNs(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-700">Permitivitas Dielektrik (εr)</span>
              <input
                type="number"
                min={1}
                max={80}
                step={0.5}
                value={testPermittivity}
                onChange={(e) => setTestPermittivity(Number(e.target.value) || 1)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3.5">
            <div>
              <div className="text-[11px] text-slate-500">Kecepatan Lokal (v)</div>
              <div className="text-lg font-mono font-semibold tabular-nums text-slate-900">
                {computedVelocity.toFixed(3)} <span className="text-xs text-slate-500">m/ns</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Kedalaman Aktual (d)</div>
              <div className="text-lg font-mono font-semibold tabular-nums text-sky-700">
                {computedDepthM.toFixed(2)} <span className="text-xs text-slate-500">meter</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Kadar Air Volumetrik</div>
              <div className="text-lg font-mono font-semibold tabular-nums text-emerald-700">
                {toppMoisturePct.toFixed(1)} <span className="text-xs text-slate-500">%</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 font-mono">
            Rumus Fisika: v = c / √εr (c = {SPEED_OF_LIGHT_M_NS.toFixed(4)} m/ns) · d = ((t − t₀) × v) / 2
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-800 mb-2">
              Tabel Klasifikasi Tanda Khas Logam & Mineral Bawah Bumi
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-1.5 pr-2 font-medium">Target</th>
                    <th className="py-1.5 pl-2 font-medium">Karakteristik Multi-Sensor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(METAL_METADATA).map(([k, m]) => (
                    <tr key={k} className="hover:bg-slate-50">
                      <td className="py-2 pr-2 font-semibold text-slate-900 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: m.colorHex }}
                          />
                          {m.label}
                        </span>
                      </td>
                      <td className="py-2 pl-2 text-slate-600">{m.characteristic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-800 mb-2">
              Referensi Konstanta Dielektrik Air & Batuan
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <tbody className="divide-y divide-slate-100">
                  {REFERENCE_MEDIA.map((m) => (
                    <tr
                      key={m.label}
                      onClick={() => setTestPermittivity(m.eps)}
                      className="hover:bg-sky-50/70 cursor-pointer"
                    >
                      <td className="py-1.5 pr-2 font-medium text-slate-800">{m.label}</td>
                      <td className="py-1.5 px-2 font-mono tabular-nums text-sky-700">εr {m.eps}</td>
                      <td className="py-1.5 pl-2 text-slate-500">{m.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
