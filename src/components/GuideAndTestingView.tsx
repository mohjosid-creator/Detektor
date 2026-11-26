import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FolderGit2,
  Terminal,
  Wrench,
} from 'lucide-react';
import {
  ESP32_FIRMWARE_INO,
  PLATFORMIO_INI,
  TESTING_STEPS,
  TROUBLESHOOTING_LIST,
} from '../data/hardwareDocs';
import { exportTextFile } from '../utils/geospatialExport';

export const GuideAndTestingView: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<'ino' | 'ini' | null>(null);
  const [checkedTests, setCheckedTests] = useState<Record<string, boolean>>({});

  const copyText = async (text: string, type: 'ino' | 'ini') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback ignored
    }
  };

  const toggleTest = (id: string) => {
    setCheckedTests((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const passedCount = Object.values(checkedTests).filter(Boolean).length;

  return (
    <div className="space-y-8">
      {/* 1. Panduan Instalasi & Persiapan Pemula */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Panduan Lengkap Penggunaan, Instalasi & Perakitan Mandiri
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Disusun langkah demi langkah dalam bahasa yang mudah dipahami pemula agar Anda dapat merakit, menginstal perangkat lunak, menguji alat, dan memetakan sumber air bawah tanah secara mandiri.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-lg p-5 space-y-3 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-900">
              A. Cara Instalasi Software & Firmware (Di Laptop/PC)
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 leading-relaxed">
              <li>
                <span className="font-semibold text-slate-900">Siapkan Browser Pendukung:</span> Gunakan Google Chrome atau Microsoft Edge versi terbaru pada Windows, macOS, atau Linux agar fitur <span className="font-mono">Web Serial API</span> dan Notifikasi Real-Time bekerja penuh.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Instal Driver USB-UART:</span> Unduh dan instal driver <span className="font-mono">CP210x</span> atau <span className="font-mono">CH343</span> sesuai chip port USB pada board ESP32-S3 Anda.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Instal Arduino IDE 2.x atau PlatformIO:</span> Tambahkan URL Board Manager ESP32 (<span className="font-mono">espressif/arduino-esp32</span>), lalu instal library <span className="font-mono">TinyGPSPlus</span> dan <span className="font-mono">Adafruit SH110X</span> melalui Library Manager.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Unggah Kode Sumber Firmware:</span> Unduh file <span className="font-mono">aquaradar_esp32.ino</span> di bagian bawah halaman ini, pilih board <span className="font-mono">ESP32S3 Dev Module</span>, aktifkan opsi <span className="font-mono">USB CDC On Boot: Enabled</span>, lalu klik Upload.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Hubungkan ke Aplikasi Web:</span> Buka tab <span className="font-semibold">Pemindai 3D</span>, pilih mode <span className="font-semibold">Sensor Serial (ESP32)</span>, lalu pilih port COM yang muncul.
              </li>
            </ol>
          </div>

          <div className="border border-slate-200 rounded-lg p-5 space-y-3 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-900">
              B. Cara Menggunakan Aplikasi & Alat di Lapangan
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 leading-relaxed">
              <li>
                <span className="font-semibold text-slate-900">Aktifkan Notifikasi Perangkat:</span> Pada bar telemetri atas, tekan tombol <span className="font-semibold">Aktifkan Notifikasi</span> dan izinkan browser mengirim peringatan serta suara sonar ketika air terdeteksi.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Pilih Formasi Geologi & Frekuensi:</span> Gunakan 50–100 MHz untuk target akuifer dalam (15–40 m) atau 250–400 MHz untuk resolusi lapisan dangkal (2–15 m).
              </li>
              <li>
                <span className="font-semibold text-slate-900">Lakukan Kalibrasi Awal:</span> Sebelum menyentuh tanah, jalankan langkah Kalibrasi Udara di tab <span className="font-semibold">Kalibrasi</span> untuk mengunci <span className="font-mono">Zero-Time Offset</span>.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Dorong Kereta Secara Grid:</span> Tarik atau dorong kereta radar dengan kecepatan berjalan santai (~0.8 m/detik) membentuk jalur bolak-balik sejajar berjarak 5–10 meter antar jalur.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Baca Peta 3D & Ekspor Geospasial:</span> Klik kantong air berwarna biru di viewport 3D untuk memeriksa kedalaman bor & estimasi debit, lalu klik <span className="font-semibold">Ekspor Geospasial</span> untuk membuka peta di QGIS atau Google Earth.
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* 2. Repositori Kode Sumber & Unduhan Firmware */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <FolderGit2 className="w-6 h-6 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Repositori Kode Sumber & Firmware Mikrokontroler (Open Hardware)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Struktur proyek lengkap untuk mikrokontroler ESP32-S3 dan antarmuka web AquaRadar. Anda dapat menyalin, mengunduh file firmware langsung, atau mengelola repositori Anda sendiri dengan struktur di bawah.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://github.com/espressif/arduino-esp32"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Core SDK ESP32 (GitHub)
            </a>
            <button
              type="button"
              onClick={() => exportTextFile('aquaradar_esp32.ino', ESP32_FIRMWARE_INO)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Firmware (.ino)
            </button>
            <button
              type="button"
              onClick={() => exportTextFile('platformio.ini', PLATFORMIO_INI)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh platformio.ini
            </button>
          </div>
        </div>

        {/* Repository Tree + Quick Git Setup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 bg-slate-950 text-slate-200 rounded-lg p-4 font-mono text-xs leading-relaxed border border-slate-800">
            <div className="text-sky-400 font-semibold mb-2">Struktur Repositori Proyek</div>
            <pre className="whitespace-pre-wrap">{`aquaradar-open-gpr/
├── firmware/
│   ├── aquaradar_esp32.ino    # Kode utama akuisisi GPR
│   └── platformio.ini         # Konfigurasi dependensi
├── hardware/
│   ├── aquaradar_skematik.svg # Diagram pengkabelan
│   └── bom_komponen.csv       # Daftar suku cadang
├── web-app/
│   ├── src/components/        # Visualisasi 3D & B-Scan
│   └── src/utils/             # Fisika GPR & GeoJSON/KML
└── README.md`}</pre>
          </div>

          <div className="lg:col-span-7 bg-slate-950 text-slate-200 rounded-lg p-4 font-mono text-xs border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-400 font-semibold inline-flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  Konfigurasi PlatformIO (platformio.ini)
                </span>
                <button
                  type="button"
                  onClick={() => copyText(PLATFORMIO_INI, 'ini')}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white cursor-pointer"
                >
                  {copiedCode === 'ini' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode === 'ini' ? 'Tersalin' : 'Salin'}
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-slate-300">{PLATFORMIO_INI}</pre>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              Jalankan perintah <span className="text-slate-200">pio run --target upload</span> setelah menghubungkan kabel USB-C ESP32-S3.
            </div>
          </div>
        </div>

        {/* Full Firmware Source Code Viewer */}
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
            <span className="font-mono font-semibold text-slate-200">
              firmware/aquaradar_esp32.ino
            </span>
            <button
              type="button"
              onClick={() => copyText(ESP32_FIRMWARE_INO, 'ino')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] cursor-pointer"
            >
              {copiedCode === 'ino' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode === 'ino' ? 'Kode Tersalin' : 'Salin Seluruh Kode'}
            </button>
          </div>
          <pre className="p-4 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[380px] leading-relaxed">
            {ESP32_FIRMWARE_INO}
          </pre>
        </div>
      </section>

      {/* 3. Panduan Pengujian Pasca-Perakitan (Interactive Checklist) */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Panduan Pengujian & Validasi Perangkat (Pasca-Perakitan)
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Centang setiap tahapan uji di bawah untuk memastikan perangkat keras beroperasi aman dan akurat sebelum dibawa survei lapangan.
            </p>
          </div>
          <div className="text-xs font-mono font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-md">
            Progres Uji: {passedCount} / {TESTING_STEPS.length} Lolos
          </div>
        </div>

        <div className="space-y-3">
          {TESTING_STEPS.map((step) => {
            const done = !!checkedTests[step.id];
            return (
              <div
                key={step.id}
                onClick={() => toggleTest(step.id)}
                className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                  done
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    aria-label={`Tandai ${step.title}`}
                    className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border shrink-0 transition-colors ${
                      done
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-900 text-sm">{step.title}</span>
                      <span aria-hidden="true" className="text-slate-400">·</span>
                      <span className="font-mono text-sky-700">{step.phase}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-medium text-slate-800">Prosedur:</span> {step.procedure}
                    </p>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      <span className="font-medium">Hasil Diharapkan:</span> {step.expectedResult}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Panduan Troubleshooting */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-600" />
          <h3 className="text-base font-semibold text-slate-900">
            Troubleshooting Kendala Umum Saat Perakitan & Uji Lapangan
          </h3>
        </div>

        <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
          {TROUBLESHOOTING_LIST.map((item, idx) => (
            <div key={idx} className="p-4 bg-white hover:bg-slate-50/70 space-y-2">
              <div className="text-sm font-semibold text-slate-900">
                {idx + 1}. Gejala: {item.symptom}
              </div>
              <div className="text-xs text-amber-800">
                <span className="font-semibold">Penyebab Umum:</span> {item.probableCause}
              </div>
              <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-1">
                {item.solutionSteps.map((sol, sIdx) => (
                  <li key={sIdx}>{sol}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
