import React from 'react';
import { AquiferPocket, MineralDeposit, ScanPoint, TerrainScenario } from '../types/radar';
import { exportToCSV, exportToGeoJSON, exportToKML } from '../utils/geospatialExport';
import { Camera, FileJson, FileSpreadsheet, Globe, X } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: TerrainScenario;
  scanPoints: ScanPoint[];
  aquifers: AquiferPocket[];
  minerals: MineralDeposit[];
  onCapture3DPng: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  scenario,
  scanPoints,
  aquifers,
  minerals,
  onCapture3DPng,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Ekspor Data Geospasial (Air, Logam & Mineral)
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Semua koordinat diekspor menggunakan sistem referensi geodetik standar{' '}
              <span className="font-mono font-medium text-slate-800">WGS84 (EPSG:4326)</span> untuk analisis lanjutan di QGIS, ArcGIS, atau Google Earth.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
            aria-label="Tutup modal ekspor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono tabular-nums">
          <div>
            <div className="text-[10px] text-slate-500">Titik Lintasan</div>
            <div className="font-semibold text-slate-900">{scanPoints.length} stasiun</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">Zona Akuifer</div>
            <div className="font-semibold text-sky-700">{aquifers.length} kantong</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">Deposit Logam</div>
            <div className="font-semibold text-amber-700">{minerals.length} urat</div>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => {
              exportToGeoJSON(scanPoints, aquifers, minerals, scenario);
              onClose();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-lg border border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileJson className="w-5 h-5 text-sky-600 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-slate-900">GeoJSON (.geojson)</div>
                <div className="text-xs text-slate-600">
                  Berisi poligon akuifer air, poligon deposit logam/uranium, titik bor, dan lintasan survei untuk QGIS / ArcGIS.
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-sky-700 shrink-0 ml-2">Unduh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              exportToKML(scanPoints, aquifers, minerals, scenario);
              onClose();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-lg border border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-slate-900">Google Earth KML (.kml)</div>
                <div className="text-xs text-slate-600">
                  Placemark warna-warni untuk sumber mata air, urat emas/perak, nikel, besi, pirit, dan uranium.
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-sky-700 shrink-0 ml-2">Unduh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              exportToCSV(scanPoints, scenario);
              onClose();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-lg border border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-slate-900">Tabel Survei Multi-Sensor CSV (.csv)</div>
                <div className="text-xs text-slate-600">
                  Data lengkap Latitude, Longitude, εr, Anomali Magnet (nT), Eddy PI (µs), IP (mV/V), dan Radiasi Geiger (CPM).
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-sky-700 shrink-0 ml-2">Unduh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onCapture3DPng();
              onClose();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-lg border border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-slate-700 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-slate-900">Tangkapan Layar Tomografi 3D (.png)</div>
                <div className="text-xs text-slate-600">
                  Ekspor visualisasi 3D lapisan tanah, akuifer, dan urat mineral untuk lampiran laporan.
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-sky-700 shrink-0 ml-2">Simpan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
