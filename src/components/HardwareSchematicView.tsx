import React from 'react';
import { ADDITIONAL_METAL_HARDWARE, HARDWARE_BOM } from '../data/hardwareDocs';
import { SchematicDiagramSVG } from './SchematicDiagramSVG';
import { Cpu, Layers, ShieldAlert, Zap } from 'lucide-react';

export const HardwareSchematicView: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Intro & System Architecture Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold text-slate-900">
              Spesifikasi Teknis, Alat Tambahan Logam/Uranium & Skematik Rangkaian
            </h2>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Radar GPR standar mampu mendeteksi keberadaan air dan pantulan benda logam, namun{' '}
              <span className="font-semibold text-slate-900">
                tidak dapat membedakan jenis logam
              </span>{' '}
              (apakah emas, perak, besi, nikel, pirit, atau uranium) secara spesifik. Dengan menambahkan 4 modul sensor geofisika di bawah ini, sistem AquaRadar menjadi alat eksplorasi multi-mineral yang lengkap dengan total biaya keseluruhan sekitar{' '}
              <span className="font-semibold text-slate-900">Rp 4.140.000</span>.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs space-y-1">
            <div className="text-slate-500">Arsitektur Sistem Gabungan</div>
            <div className="font-mono font-semibold text-slate-900">
              GPR + PI Coil + Magneto + IP + Geiger
            </div>
            <div className="text-slate-600">Target: Air, Au, Ag, Ni, Fe, FeS₂, U₃O₈</div>
          </div>
        </div>

        {/* Technical Hardware Spec Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
              <Cpu className="w-4 h-4 text-sky-600" />
              Unit Utama (GPR Air)
            </div>
            <div className="text-sm font-mono font-semibold text-slate-900">ESP32-S3 + GPR 100MHz</div>
            <p className="text-xs text-slate-600 mt-1">
              Mengukur kedalaman lapisan tanah & akuifer air melalui konstanta dielektrik (εr).
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
              <Zap className="w-4 h-4 text-amber-600" />
              Logam Mulia (Au, Ag)
            </div>
            <div className="text-sm font-mono font-semibold text-slate-900">Pulse Induction (PI)</div>
            <p className="text-xs text-slate-600 mt-1">
              Memilah Emas, Perak & Tembaga dari logam besi rongsokan lewat konstanta peluruhan arus Eddy (µs).
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
              <Layers className="w-4 h-4 text-orange-600" />
              Feromagnetik & Sulfida
            </div>
            <div className="text-sm font-mono font-semibold text-slate-900">Magneto + IP 4-Pin</div>
            <p className="text-xs text-slate-600 mt-1">
              Magnetometer mendeteksi Besi & Nikel (nT), sedangkan elektroda IP mendeteksi Pirit (FeS₂).
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
              <ShieldAlert className="w-4 h-4 text-lime-600" />
              Mineral Radioaktif
            </div>
            <div className="text-sm font-mono font-semibold text-slate-900">Geiger-Müller SBM-20</div>
            <p className="text-xs text-slate-600 mt-1">
              Menghitung emisi sinar Gamma/Beta (CPM) untuk menemukan bijih Uranium (U₃O₈) & Monazit.
            </p>
          </div>
        </div>
      </div>

      {/* NEW DEDICATED SECTION: Additional Hardware Required for Metal & Uranium Detection */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Alat Tambahan yang Diperlukan untuk Mendeteksi Logam & Uranium
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Tambahkan 4 komponen sensor berikut ke rangka kereta AquaRadar agar perangkat dapat mengklasifikasikan Emas, Nikel, Perak, Besi, Pirit, dan Uranium.
            </p>
          </div>
          <div className="text-xs font-mono font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-md">
            Biaya Tambahan Upgrade Logam: Rp 1.330.000
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-3 font-medium">Kode</th>
                <th className="py-2.5 px-3 font-medium">Alat Tambahan</th>
                <th className="py-2.5 px-3 font-medium">Target Logam/Mineral</th>
                <th className="py-2.5 px-3 font-medium">Spesifikasi & Cara Kerja</th>
                <th className="py-2.5 pl-3 font-medium text-right">Estimasi Harga</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ADDITIONAL_METAL_HARDWARE.map((item) => (
                <tr key={item.code} className="hover:bg-slate-50 align-top">
                  <td className="py-3 pr-3 font-mono font-semibold text-amber-700 whitespace-nowrap">
                    {item.code}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900 min-w-[200px]">
                    {item.name}
                    <div className="font-normal text-slate-500 mt-0.5">{item.spec}</div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800 min-w-[160px]">
                    {item.targetCapability}
                  </td>
                  <td className="py-3 px-3 text-slate-600 min-w-[240px] leading-relaxed">
                    {item.functionDesc}
                  </td>
                  <td className="py-3 pl-3 font-mono tabular-nums font-medium text-slate-900 text-right whitespace-nowrap">
                    {item.estPriceIdr}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive & Downloadable SVG Wiring Schematic */}
      <SchematicDiagramSVG />

      {/* Base GPR Bill of Materials (BOM) Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Daftar Komponen Dasar Unit Radar GPR & Kontrol Utama (BOM)
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Komponen inti untuk pemetaan air bawah tanah, pemrosesan mikrokontroler, GPS, dan catu daya lapangan.
            </p>
          </div>
          <div className="text-xs font-mono font-semibold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-md">
            Estimasi Dasar GPR: Rp 2.810.000
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-3 font-medium">Kode</th>
                <th className="py-2.5 px-3 font-medium">Nama Komponen</th>
                <th className="py-2.5 px-3 font-medium">Spesifikasi Teknis</th>
                <th className="py-2.5 px-3 font-medium">Jml</th>
                <th className="py-2.5 px-3 font-medium">Fungsi dalam Sistem</th>
                <th className="py-2.5 pl-3 font-medium text-right">Estimasi Harga</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {HARDWARE_BOM.map((item) => (
                <tr key={item.code} className="hover:bg-slate-50 align-top">
                  <td className="py-3 pr-3 font-mono font-semibold text-sky-700 whitespace-nowrap">
                    {item.code}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900 min-w-[190px]">
                    {item.name}
                  </td>
                  <td className="py-3 px-3 text-slate-600 min-w-[210px]">{item.spec}</td>
                  <td className="py-3 px-3 font-mono tabular-nums text-slate-800 whitespace-nowrap">
                    {item.qty}
                  </td>
                  <td className="py-3 px-3 text-slate-600 min-w-[230px] leading-relaxed">
                    {item.functionDesc}
                  </td>
                  <td className="py-3 pl-3 font-mono tabular-nums font-medium text-slate-900 text-right whitespace-nowrap">
                    {item.estPriceIdr}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
