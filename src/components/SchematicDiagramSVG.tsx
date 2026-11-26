import React, { useRef, useState } from 'react';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';
import { exportTextFile } from '../utils/geospatialExport';

type ModuleFocus = 'all' | 'power' | 'adc' | 'rf' | 'metals' | 'gps' | 'encoder' | 'oled';

const MODULE_NOTES: Record<ModuleFocus, { title: string; details: string }> = {
  all: {
    title: 'Diagram Skematik Multi-Sensor AquaRadar (Air + Logam + Uranium)',
    details:
      'Klik salah satu blok modul atau tombol filter di atas untuk melihat pin pengkabelan ESP32-S3 termasuk modul tambahan Pulse Induction, Magnetometer, Elektroda IP, dan Detektor Radiasi Geiger-Müller.',
  },
  power: {
    title: 'Blok Daya: Baterai LiFePO4 12.8V → Buck 5V → LDO 3.3V',
    details:
      'Wajib memasang Sekring 5A dan Dioda TVS SMBJ15A. Buck Converter 5V menyuplai Pulser RF, Driver Koil PI IRF540N, ADS1256, dan HV Booster Geiger. LDO 3.3V khusus menyuplai logika ESP32-S3 dan Magnetometer.',
  },
  adc: {
    title: 'Blok Akuisisi: ADS1256 24-Bit ADC (Antarmuka SPI)',
    details:
      'SCLK→GPIO12, MISO→GPIO13, MOSI→GPIO11, CS→GPIO10, DRDY→GPIO9. Kanal AIN0 membaca sinyal pantulan GPR (Air), AIN1 membaca peluruhan arus Eddy Koil PI (Emas/Perak), dan AIN2 membaca tegangan Polarisasi Terinduksi IP (Pirit).',
  },
  rf: {
    title: 'Blok Radar GPR: Pulser Avalanche, LNA & Antena Bowtie 100 MHz',
    details:
      'GPIO4 memicu pulsa TX nanodetik dan GPIO5 mengatur gerbang sampling. Antena TX & RX berimpedansi 50 Ohm dipasang menghadap tanah dengan pelindung karbon belakang.',
  },
  metals: {
    title: 'Blok Upgrade Deteksi Logam & Uranium (PI + Magnetometer + IP + Geiger)',
    details:
      '1) Koil PI (Emas/Perak/Tembaga): Gate MOSFET IRF540N dipicu oleh GPIO38, sinyal peluruhan Eddy masuk ke ADS1256 AIN1. 2) Magnetometer QMC5883L/RM3100 (Besi/Nikel): terhubung paralel ke bus I2C GPIO21/22 (alamat 0x0D). 3) Elektroda IP 4-Pin (Pirit): terhubung ke ADS1256 AIN2. 4) Tabung Geiger SBM-20 + HV 400V (Uranium): pulsa cacahan masuk ke interupsi GPIO8.',
  },
  gps: {
    title: 'Blok Geospasial: GPS u-blox NEO-M8N (UART1 9600 bps)',
    details:
      'TX GPS masuk ke GPIO18 (RX ESP32) dan RX GPS masuk ke GPIO17 (TX ESP32). Menandai koordinat presisi setiap sumber air dan urat logam.',
  },
  encoder: {
    title: 'Blok Odometer: Rotary Encoder 600 PPR Roda Kereta',
    details:
      'Phase A ke GPIO6 (Interrupt) dan Phase B ke GPIO7 dengan resistor pull-up 4.7 kOhm ke rel 3.3V.',
  },
  oled: {
    title: 'Blok Antarmuka Lokal: OLED 1.3" SH1106 (I2C) & Buzzer',
    details:
      'SDA→GPIO21, SCL→GPIO22 (alamat 0x3C). Buzzer aktif terhubung ke GPIO15 via transistor NPN 2N2222 untuk alarm audio lapangan.',
  },
};

export const SchematicDiagramSVG: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [focus, setFocus] = useState<ModuleFocus>('all');
  const [zoom, setZoom] = useState(1);

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const raw = serializer.serializeToString(svgRef.current);
    exportTextFile('aquaradar_skematik_multisensor.svg', raw, 'image/svg+xml;charset=utf-8;');
  };

  const dim = (key: ModuleFocus) => (focus === 'all' || focus === key ? 1 : 0.22);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Diagram Skematik Rangkaian Multi-Sensor (Air, Logam & Uranium)
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Menampilkan seluruh pin ESP32-S3 termasuk jalur tambahan untuk Koil PI, Magnetometer, Elektroda IP, dan Tabung Geiger-Müller.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.8, Number((z - 0.15).toFixed(2))))}
            className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
            title="Perkecil"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono tabular-nums text-slate-600 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
            className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
            title="Perbesar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDownloadSvg}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh Skematik (.svg)
          </button>
        </div>
      </div>

      {/* Filter Segmented Control */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg w-fit">
        {(
          [
            ['all', 'Semua Jalur'],
            ['metals', 'Sensor Logam & Uranium'],
            ['power', 'Daya 12V/5V/3.3V'],
            ['rf', 'Pulser GPR & Antena'],
            ['adc', 'SPI ADC ADS1256'],
            ['gps', 'GPS NEO-M8N'],
            ['oled', 'OLED & Buzzer'],
          ] as Array<[ModuleFocus, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFocus(key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              focus === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Interactive SVG Blueprint Canvas */}
      <div className="w-full overflow-auto rounded-xl border border-slate-800 bg-[#0b1322] p-4">
        <div style={{ width: `${Math.round(1080 * zoom)}px` }} className="mx-auto transition-all">
          <svg
            ref={svgRef}
            viewBox="0 0 1160 760"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto block select-none"
          >
            <defs>
              <pattern id="schemGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.7" />
              </pattern>
              <marker id="arrowCyan" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L7,3 z" fill="#38bdf8" />
              </marker>
              <marker id="arrowAmber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L7,3 z" fill="#f59e0b" />
              </marker>
              <marker id="arrowLime" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L7,3 z" fill="#a3e635" />
              </marker>
            </defs>

            <rect width="1160" height="760" fill="#0b1322" />
            <rect width="1160" height="760" fill="url(#schemGrid)" />

            <rect x="16" y="16" width="1128" height="728" fill="none" stroke="#334155" strokeWidth="1.5" />
            <rect x="740" y="684" width="404" height="60" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="754" y="706" fill="#f8fafc" fontSize="13" fontWeight="700" fontFamily="Outfit, sans-serif">
              AQUARADAR MULTI-MINERAL REV 2.0
            </text>
            <text x="754" y="726" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono, monospace">
              GPR 100MHz + PI Coil + Magneto + IP + Geiger SBM-20
            </text>

            {/* ==================== POWER RAIL STAGE (TOP) ==================== */}
            <g opacity={dim('power')} onClick={() => setFocus('power')} className="cursor-pointer">
              <rect x="40" y="40" width="160" height="80" rx="6" fill="#111c30" stroke="#ef4444" strokeWidth="1.8" />
              <text x="120" y="64" textAnchor="middle" fill="#fca5a5" fontSize="12" fontWeight="700">BATERAI LiFePO4</text>
              <text x="120" y="84" textAnchor="middle" fill="#f8fafc" fontSize="11" fontFamily="JetBrains Mono, monospace">12.8V 10Ah + BMS</text>
              <text x="120" y="104" textAnchor="middle" fill="#94a3b8" fontSize="10">Sekring 5A + TVS SMBJ15A</text>

              <path d="M 200 80 L 274 80" stroke="#ef4444" strokeWidth="2.4" markerEnd="url(#arrowAmber)" />

              <rect x="278" y="40" width="180" height="80" rx="6" fill="#111c30" stroke="#f59e0b" strokeWidth="1.8" />
              <text x="368" y="64" textAnchor="middle" fill="#fcd34d" fontSize="12" fontWeight="700">BUCK CONVERTER 5V</text>
              <text x="368" y="84" textAnchor="middle" fill="#f8fafc" fontSize="11" fontFamily="JetBrains Mono, monospace">LM2596 / XL4015 (3A)</text>
              <text x="368" y="104" textAnchor="middle" fill="#94a3b8" fontSize="10">Suplai RF, PI Coil &amp; Geiger</text>

              <path d="M 458 80 L 538 80" stroke="#f59e0b" strokeWidth="2.4" markerEnd="url(#arrowAmber)" />

              <rect x="542" y="40" width="175" height="80" rx="6" fill="#111c30" stroke="#10b981" strokeWidth="1.8" />
              <text x="630" y="64" textAnchor="middle" fill="#6ee7b7" fontSize="12" fontWeight="700">LDO REGULATOR 3.3V</text>
              <text x="630" y="84" textAnchor="middle" fill="#f8fafc" fontSize="11" fontFamily="JetBrains Mono, monospace">AMS1117-3.3 Low Noise</text>
              <text x="630" y="104" textAnchor="middle" fill="#94a3b8" fontSize="10">Rel Logika ESP32 &amp; Mag</text>

              <path d="M 630 120 L 630 198" fill="none" stroke="#10b981" strokeWidth="2" />
            </g>

            {/* ==================== CENTRAL MCU: ESP32-S3 ==================== */}
            <g>
              <rect x="410" y="200" width="300" height="330" rx="8" fill="#132238" stroke="#38bdf8" strokeWidth="2.2" />
              <text x="560" y="228" textAnchor="middle" fill="#e0f2fe" fontSize="15" fontWeight="700" fontFamily="Outfit, sans-serif">
                ESP32-S3-WROOM-1
              </text>
              <text x="560" y="246" textAnchor="middle" fill="#7dd3fc" fontSize="11" fontFamily="JetBrains Mono, monospace">
                Dual-Core 240MHz · Multi-Sensor Fusion
              </text>
              <line x1="428" y1="258" x2="692" y2="258" stroke="#1e3a5f" strokeWidth="1" />

              {/* Left side pins */}
              <text x="424" y="282" fill="#cbd5e1" fontSize="10.5" fontFamily="JetBrains Mono, monospace">GPIO18 (GPS_RX)</text>
              <text x="424" y="302" fill="#cbd5e1" fontSize="10.5" fontFamily="JetBrains Mono, monospace">GPIO17 (GPS_TX)</text>
              <text x="424" y="336" fill="#cbd5e1" fontSize="10.5" fontFamily="JetBrains Mono, monospace">GPIO6  (ENC_A)</text>
              <text x="424" y="356" fill="#cbd5e1" fontSize="10.5" fontFamily="JetBrains Mono, monospace">GPIO7  (ENC_B)</text>
              <text x="424" y="392" fill="#6ee7b7" fontSize="10.5" fontFamily="JetBrains Mono, monospace">GPIO21 (I2C_SDA)</text>
              <text x="424" y="412" fill="#6ee7b7" fontSize="10.5" fontFamily="JetBrains Mono, monospace">GPIO22 (I2C_SCL)</text>
              <text x="424" y="446" fill="#fca5a5" fontSize="10.5" fontFamily="JetBrains Mono, monospace">GPIO15 (BUZZER)</text>
              <text x="424" y="486" fill="#bef264" fontSize="10.5" fontFamily="JetBrains Mono, monospace">GPIO8  (GEIGER_INT)</text>
              <text x="424" y="510" fill="#fde047" fontSize="10.5" fontFamily="JetBrains Mono, monospace">GPIO38 (PI_COIL_TX)</text>

              {/* Right side pins */}
              <text x="696" y="282" textAnchor="end" fill="#cbd5e1" fontSize="10.5" fontFamily="JetBrains Mono, monospace">(SPI_MOSI) GPIO11</text>
              <text x="696" y="302" textAnchor="end" fill="#cbd5e1" fontSize="10.5" fontFamily="JetBrains Mono, monospace">(SPI_MISO) GPIO13</text>
              <text x="696" y="322" textAnchor="end" fill="#cbd5e1" fontSize="10.5" fontFamily="JetBrains Mono, monospace">(SPI_SCLK) GPIO12</text>
              <text x="696" y="342" textAnchor="end" fill="#cbd5e1" fontSize="10.5" fontFamily="JetBrains Mono, monospace">(ADC_CS)   GPIO10</text>
              <text x="696" y="362" textAnchor="end" fill="#cbd5e1" fontSize="10.5" fontFamily="JetBrains Mono, monospace">(ADC_DRDY) GPIO9</text>
              <text x="696" y="410" textAnchor="end" fill="#7dd3fc" fontSize="10.5" fontFamily="JetBrains Mono, monospace">(PULSER_TX) GPIO4</text>
              <text x="696" y="432" textAnchor="end" fill="#7dd3fc" fontSize="10.5" fontFamily="JetBrains Mono, monospace">(GATE_SYNC) GPIO5</text>

              {/* USB-C Port */}
              <rect x="495" y="560" width="130" height="44" rx="5" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
              <text x="560" y="579" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="600">USB-C / Wi-Fi</text>
              <text x="560" y="594" textAnchor="middle" fill="#94a3b8" fontSize="10">Ke Aplikasi AquaRadar</text>
              <path d="M 560 530 L 560 558" stroke="#38bdf8" strokeWidth="2.2" markerEnd="url(#arrowCyan)" />
            </g>

            {/* ==================== LEFT PERIPHERALS ==================== */}
            <g opacity={dim('gps')} onClick={() => setFocus('gps')} className="cursor-pointer">
              <rect x="40" y="200" width="220" height="92" rx="6" fill="#111c30" stroke="#22d3ee" strokeWidth="1.6" />
              <text x="150" y="224" textAnchor="middle" fill="#67e8f9" fontSize="12" fontWeight="700">GPS NEO-M8N (UART)</text>
              <text x="150" y="244" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono, monospace">Antena GNSS WGS84</text>
              <path d="M 260 278 L 408 278" stroke="#22d3ee" strokeWidth="1.6" />
              <path d="M 408 298 L 260 298" stroke="#22d3ee" strokeWidth="1.6" strokeDasharray="4,3" />
            </g>

            <g opacity={dim('encoder')} onClick={() => setFocus('encoder')} className="cursor-pointer">
              <rect x="40" y="308" width="220" height="72" rx="6" fill="#111c30" stroke="#a78bfa" strokeWidth="1.6" />
              <text x="150" y="330" textAnchor="middle" fill="#c4b5fd" fontSize="11.5" fontWeight="700">ROTARY ENCODER 600 PPR</text>
              <text x="150" y="350" textAnchor="middle" fill="#94a3b8" fontSize="10">Odometer Roda (Pull-Up 4.7kΩ)</text>
              <path d="M 260 332 L 408 332" stroke="#a78bfa" strokeWidth="1.6" />
              <path d="M 260 352 L 408 352" stroke="#a78bfa" strokeWidth="1.6" />
            </g>

            <g opacity={dim('oled')} onClick={() => setFocus('oled')} className="cursor-pointer">
              <rect x="40" y="394" width="220" height="82" rx="6" fill="#111c30" stroke="#34d399" strokeWidth="1.6" />
              <text x="150" y="416" textAnchor="middle" fill="#6ee7b7" fontSize="11.5" fontWeight="700">OLED SH1106 &amp; BUZZER</text>
              <text x="150" y="436" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono, monospace">I2C Addr 0x3C · NPN 2N2222</text>
              <path d="M 408 392 L 320 392 L 320 415 L 260 415" fill="none" stroke="#34d399" strokeWidth="1.6" />
              <path d="M 408 412 L 332 412 L 332 432 L 260 432" fill="none" stroke="#34d399" strokeWidth="1.6" />
              <path d="M 408 446 L 260 446" fill="none" stroke="#ef4444" strokeWidth="1.6" />
            </g>

            {/* NEW: MAGNETOMETER (I2C) + GEIGER MULLER (URANIUM) */}
            <g opacity={dim('metals')} onClick={() => setFocus('metals')} className="cursor-pointer">
              <rect x="40" y="492" width="220" height="84" rx="6" fill="#111c30" stroke="#f97316" strokeWidth="1.8" />
              <text x="150" y="514" textAnchor="middle" fill="#fdba74" fontSize="11.5" fontWeight="700">MAGNETOMETER RM3100/QMC</text>
              <text x="150" y="532" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono, monospace">I2C 0x0D · Anomali nT</text>
              <text x="150" y="550" textAnchor="middle" fill="#94a3b8" fontSize="9.5">Deteksi Besi (Fe) &amp; Nikel (Ni)</text>
              <path d="M 320 432 L 320 518 L 260 518" fill="none" stroke="#f97316" strokeWidth="1.6" strokeDasharray="4,2" />

              <rect x="40" y="592" width="220" height="90" rx="6" fill="#111c30" stroke="#a3e635" strokeWidth="1.8" />
              <text x="150" y="614" textAnchor="middle" fill="#bef264" fontSize="11.5" fontWeight="700">TABUNG GEIGER SBM-20</text>
              <text x="150" y="632" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono, monospace">HV Booster 400V → TTL Pulse</text>
              <text x="150" y="650" textAnchor="middle" fill="#94a3b8" fontSize="9.5">Deteksi Uranium (U₃O₈) · CPM</text>
              <path d="M 260 622 L 372 622 L 372 482 L 408 482" fill="none" stroke="#a3e635" strokeWidth="1.8" markerEnd="url(#arrowLime)" />
            </g>

            {/* ==================== RIGHT PERIPHERALS ==================== */}
            {/* ADS1256 24-bit ADC */}
            <g opacity={dim('adc')} onClick={() => setFocus('adc')} className="cursor-pointer">
              <rect x="820" y="200" width="290" height="175" rx="6" fill="#111c30" stroke="#38bdf8" strokeWidth="1.8" />
              <text x="965" y="224" textAnchor="middle" fill="#7dd3fc" fontSize="12" fontWeight="700">ADC PRESISI ADS1256 (24-BIT)</text>
              <text x="965" y="242" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono, monospace">30 kSPS · AIN0 (GPR) · AIN1 (PI) · AIN2 (IP)</text>
              <line x1="834" y1="252" x2="1096" y2="252" stroke="#1e293b" strokeWidth="1" />
              <text x="836" y="280" fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono, monospace">DIN / DOUT / SCLK</text>
              <text x="836" y="304" fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono, monospace">CS / DRDY</text>
              <text x="1094" y="340" textAnchor="end" fill="#7dd3fc" fontSize="10" fontFamily="JetBrains Mono, monospace">AIN0 ← GPR LNA</text>
              <text x="1094" y="358" textAnchor="end" fill="#fde047" fontSize="10" fontFamily="JetBrains Mono, monospace">AIN1 ← Koil PI Eddy</text>
              <text x="1094" y="372" textAnchor="end" fill="#38bdf8" fontSize="10" fontFamily="JetBrains Mono, monospace">AIN2 ← Elektroda IP</text>

              <path d="M 710 278 L 820 278" stroke="#38bdf8" strokeWidth="1.6" />
              <path d="M 820 298 L 710 298" stroke="#38bdf8" strokeWidth="1.6" />
              <path d="M 710 318 L 820 318" stroke="#38bdf8" strokeWidth="1.6" />
              <path d="M 710 338 L 820 338" stroke="#38bdf8" strokeWidth="1.6" />
              <path d="M 820 358 L 710 358" stroke="#38bdf8" strokeWidth="1.6" strokeDasharray="3,3" />
            </g>

            {/* RF Pulser GPR */}
            <g opacity={dim('rf')} onClick={() => setFocus('rf')} className="cursor-pointer">
              <rect x="820" y="394" width="290" height="114" rx="6" fill="#111c30" stroke="#f59e0b" strokeWidth="1.8" />
              <text x="965" y="416" textAnchor="middle" fill="#fcd34d" fontSize="12" fontWeight="700">MODUL GPR PULSER &amp; ANTENA BOWTIE</text>
              <text x="965" y="434" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono, monospace">100 MHz (Air &amp; Stratigrafi Kedalaman)</text>
              <text x="965" y="470" textAnchor="middle" fill="#94a3b8" fontSize="10">TX/RX 50Ω Coax · Perisai Karbon</text>

              <path d="M 710 406 L 820 406" stroke="#f59e0b" strokeWidth="1.8" markerEnd="url(#arrowAmber)" />
              <path d="M 710 428 L 820 428" stroke="#f59e0b" strokeWidth="1.8" markerEnd="url(#arrowAmber)" />
              <path d="M 1055 394 L 1055 377" stroke="#7dd3fc" strokeWidth="2" markerEnd="url(#arrowCyan)" />
            </g>

            {/* NEW: KOIL PULSE INDUCTION (PI) & ELEKTRODA IP */}
            <g opacity={dim('metals')} onClick={() => setFocus('metals')} className="cursor-pointer">
              <rect x="820" y="524" width="290" height="136" rx="6" fill="#111c30" stroke="#eab308" strokeWidth="1.8" />
              <text x="965" y="548" textAnchor="middle" fill="#fde047" fontSize="11.5" fontWeight="700">KOIL PI (EMOS/PERAK) &amp; ELEKTRODA IP</text>
              <text x="965" y="568" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono, monospace">Driver IRF540N + Op-Amp INA128</text>
              <text x="965" y="588" textAnchor="middle" fill="#cbd5e1" fontSize="10">4 Patok Stainless IP (Deteksi Pirit FeS₂)</text>
              <text x="965" y="610" textAnchor="middle" fill="#94a3b8" fontSize="9.5">Sinyal peluruhan Eddy (µs) → ADS1256 AIN1</text>

              {/* GPIO38 PI_COIL_TX to IRF540N */}
              <path d="M 710 506 L 765 506 L 765 556 L 820 556" fill="none" stroke="#eab308" strokeWidth="1.8" markerEnd="url(#arrowAmber)" />
              {/* Return analog lines from PI & IP up to ADS1256 AIN1 & AIN2 */}
              <path d="M 1110 552 L 1130 552 L 1130 356 L 1110 356" fill="none" stroke="#fde047" strokeWidth="1.8" markerEnd="url(#arrowAmber)" />
              <path d="M 1110 584 L 1138 584 L 1138 368 L 1110 368" fill="none" stroke="#38bdf8" strokeWidth="1.6" markerEnd="url(#arrowCyan)" />
            </g>
          </svg>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-slate-900">{MODULE_NOTES[focus].title}</div>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{MODULE_NOTES[focus].details}</p>
      </div>
    </div>
  );
};
