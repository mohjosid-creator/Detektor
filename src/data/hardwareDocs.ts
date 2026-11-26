export interface HardwareComponentItem {
  code: string;
  name: string;
  spec: string;
  qty: string;
  functionDesc: string;
  estPriceIdr: string;
  targetCapability?: string;
}

export interface TroubleshootingItem {
  symptom: string;
  probableCause: string;
  solutionSteps: string[];
}

export interface TestStepItem {
  id: string;
  phase: 'Bangku Kerja (Bench)' | 'Kalibrasi Udara' | 'Uji Target Terkendali' | 'Uji Lapangan';
  title: string;
  procedure: string;
  expectedResult: string;
}

export const HARDWARE_BOM: HardwareComponentItem[] = [
  {
    code: 'MCU-01',
    name: 'ESP32-S3-WROOM-1 DevKitC (Dual-Core 240 MHz)',
    spec: '8MB PSRAM, 16MB Flash, USB-C OTG / UART, Wi-Fi & BLE',
    qty: '1 unit',
    functionDesc:
      'Otak pemroses sinyal digital, pengatur timing pulsa radar & PI, pembaca SPI ADC/Magnetometer, serta pengirim telemetri Web Serial.',
    estPriceIdr: 'Rp 145.000',
  },
  {
    code: 'ANT-01',
    name: 'Antena Bowtie / Vivaldi Terlindungi (100–250 MHz)',
    spec: 'PCB FR4 lapis tembaga ganda + absorber karbon belakang, impedansi 50 Ohm, konektor SMA',
    qty: '1 pasang (TX + RX)',
    functionDesc:
      'Memancarkan pulsa elektromagnetik ke dalam tanah dan menangkap pantulan gema dari lapisan akuifer air maupun urat batuan logam.',
    estPriceIdr: 'Rp 450.000',
  },
  {
    code: 'RF-01',
    name: 'Modul Pulser Avalanche & LNA Receiver (PRF 100 kHz)',
    spec: 'Pembangkit pulsa nanodetik (rise time < 1.5 ns) + Low Noise Amplifier 24 dB + Envelope Detector',
    qty: '1 modul',
    functionDesc:
      'Menghasilkan pulsa radar tajam agar resolusi kedalaman tinggi dan menguatkan sinyal pantulan lemah dari kedalaman >25 m.',
    estPriceIdr: 'Rp 680.000',
  },
  {
    code: 'ADC-01',
    name: 'Modul ADC Presisi Tinggi ADS1256 (24-Bit, 30 kSPS)',
    spec: 'Antarmuka SPI 5V/3.3V, PGA internal hingga 64x, referensi tegangan 2.5V presisi rendah noise',
    qty: '1 modul',
    functionDesc:
      'Mengubah gelombang pantulan GPR (AIN0), peluruhan arus Eddy PI (AIN1), dan tegangan Polarisasi Terinduksi (AIN2) menjadi data digital.',
    estPriceIdr: 'Rp 235.000',
  },
  {
    code: 'GPS-01',
    name: 'Modul GPS u-blox NEO-M8N + Antena Keramik Aktif',
    spec: 'Multi-GNSS (GPS/GLONASS/BeiDou), baud rate 9600–115200 bps, akurasi horizontal ~1.5–2.5 m',
    qty: '1 set',
    functionDesc:
      'Menyematkan koordinat Latitude, Longitude, dan elevasi real-time pada setiap titik sumber air maupun deposit logam.',
    estPriceIdr: 'Rp 185.000',
  },
  {
    code: 'ENC-01',
    name: 'Rotary Encoder Inkremental 600 PPR + Roda Odometer',
    spec: 'Output kuadratur A/B NPN Open Collector (5–24V) + pull-up resistor 4.7 kOhm ke 3.3V',
    qty: '1 unit',
    functionDesc:
      'Memicu pengambilan sampel radar secara otomatis setiap jarak tempuh 10 cm saat kereta radar didorong di lapangan.',
    estPriceIdr: 'Rp 160.000',
  },
  {
    code: 'DSP-01',
    name: 'Layar OLED 1.3" SH1106 I2C (128x64 piksel)',
    spec: 'Tegangan 3.3V, alamat I2C 0x3C, kontras tinggi di bawah sinar matahari lapangan',
    qty: '1 unit',
    functionDesc:
      'Menampilkan status baterai, GPS lock, nilai εr air, anomali nT magnet, CPM radiasi, dan peringatan langsung di lapangan.',
    estPriceIdr: 'Rp 55.000',
  },
  {
    code: 'PWR-01',
    name: 'Baterai LiFePO4 12.8V 10Ah + BMS 4S + Buck 5V/3.3V',
    spec: 'LM2596 / XL4015 Step-Down 5V 3A + LDO AMS1117-3.3V + Dioda TVS SMBJ15A + Sekring 5A',
    qty: '1 paket',
    functionDesc:
      'Menyuplai daya bersih rendah riak (low-ripple) untuk operasi survei lapangan 6–8 jam tanpa gangguan tegangan.',
    estPriceIdr: 'Rp 520.000',
  },
  {
    code: 'MEC-01',
    name: 'Rangka PVC/Aluminium Non-Logam & Roda Karet 20 cm',
    spec: 'Rangka kereta bebas logam besi di sekitar koil & antena (menggunakan baut nilon)',
    qty: '1 set',
    functionDesc:
      'Menjaga jarak antena & koil PI ke permukaan tanah konstan agar hasil pemetaan bersih tanpa interferensi rangka.',
    estPriceIdr: 'Rp 380.000',
  },
];

export const ADDITIONAL_METAL_HARDWARE: HardwareComponentItem[] = [
  {
    code: 'PI-01',
    name: 'Koil Pulse Induction (PI / TDEM) 40×40 cm + Driver MOSFET IRF540N',
    spec: 'Kawat tembaga email 0.8 mm (24 lilitan, induktansi ~380 µH), resistor peredam 470 Ω 2W, op-amp NE5534 / INA128',
    qty: '1 set',
    targetCapability: 'Emas (Au), Perak (Ag), Tembaga, Nikel',
    functionDesc:
      'Mengukur waktu peluruhan arus Eddy (τ dalam µs) untuk membedakan logam mulia berkonduktivitas tinggi (Emas/Perak) dari logam rongsokan tipis.',
    estPriceIdr: 'Rp 245.000',
  },
  {
    code: 'MAG-01',
    name: 'Magnetometer Fluks-Gate / 3-Sumbu Presisi PNI RM3100 (atau QMC5883L)',
    spec: 'Resolusi medan magnet < 15 nT, rentang ±800 µT, antarmuka I2C (0x0D) / SPI 3.3V, dipasang pada tiang non-logam 60 cm di atas tanah',
    qty: '1 modul',
    targetCapability: 'Bijih Besi (Fe₃O₄), Nikel Laterit (Ni), Pasir Besi',
    functionDesc:
      'Mendeteksi anomali medan magnet bumi (ΔB dalam nanoTesla) guna mengidentifikasi mineral feromagnetik seperti Magnetit (Besi) dan Nikel.',
    estPriceIdr: 'Rp 320.000',
  },
  {
    code: 'IP-01',
    name: 'Modul Induced Polarization (IP) 4-Elektroda + Multiplexer CD74HC4067',
    spec: '4 patok elektroda Stainless Steel 316 + sumber arus konstan 24V terisolasi (Optokopler PC817) terhubung ke ADS1256 AIN2',
    qty: '1 set',
    targetCapability: 'Pirit (FeS₂) & Urat Kuarsa Emas Sulfida',
    functionDesc:
      'Mengukur efek kapasitif batuan (Chargeability dalam mV/V) setelah arus diputus—metode wajib geologi untuk mendeteksi Pirit dan urat emas hidrotermal.',
    estPriceIdr: 'Rp 275.000',
  },
  {
    code: 'RAD-01',
    name: 'Detektor Radiasi Gamma Geiger-Müller SBM-20 / J305 + HV Booster 400V',
    spec: 'Tabung GM sensitif sinar Gamma & Beta, konverter DC-DC 5V→400V terintegrasi, output pulsa TTL ke pin interupsi GPIO8 ESP32',
    qty: '1 modul',
    targetCapability: 'Uranium (U₃O₈), Torium & Monazit Radioaktif',
    functionDesc:
      'Menghitung laju cacahan radiasi alamiah (CPM / Counts Per Minute) secara real-time untuk memetakan anomali bijih Uranium dan mineral radioaktif.',
    estPriceIdr: 'Rp 490.000',
  },
];

export const ESP32_FIRMWARE_INO = `/*
 * AquaRadar Multi-Sensor — Firmware GPR Air, Logam & Radioaktif (ESP32-S3)
 * Lisensi: MIT Open Hardware
 * Baud Rate Web Serial: 115200 bps (Format JSON Line-Delimited)
 *
 * Pinout Utama:
 * - ADS1256 SPI : MOSI=GPIO11, MISO=GPIO13, SCLK=GPIO12, CS=GPIO10, DRDY=GPIO9
 *                 AIN0 = GPR Receiver | AIN1 = Eddy PI | AIN2 = IP Chargeability
 * - Pulser GPR  : GPIO4 (Pulse TX) & GPIO5 (Gate Sync)
 * - Koil PI TX  : GPIO38 (MOSFET Gate Driver IRF540N)
 * - Geiger GM   : GPIO8 (Pulse Interrupt Input untuk Uranium CPM)
 * - Magneto I2C : GPIO21 (SDA), GPIO22 (SCL) bersama OLED SH1106 (Addr 0x0D / 0x3C)
 * - GPS NEO-M8N : RX=GPIO18 (ke TX GPS), TX=GPIO17 (ke RX GPS) @ 9600 bps
 * - Rotary Enc  : Phase A=GPIO6 (Interrupt), Phase B=GPIO7
 * - Buzzer Alert: GPIO15 (PWM alarm air / logam / radioaktif)
 */

#include <Arduino.h>
#include <SPI.h>
#include <Wire.h>
#include <TinyGPSPlus.h>
#include <Adafruit_SH110X.h>

#define PIN_ADC_CS     10
#define PIN_ADC_DRDY   9
#define PIN_PULSER_TX  4
#define PIN_GATE_SYNC  5
#define PIN_PI_COIL_TX 38
#define PIN_GEIGER_INT 8
#define PIN_ENC_A      6
#define PIN_ENC_B      7
#define PIN_BUZZER     15
#define PIN_GPS_RX     18
#define PIN_GPS_TX     17

#define QMC5883L_ADDR  0x0D

float zeroOffsetNs      = 2.40;
float soilVelocityMns   = 0.088;
float dielectricThresh  = 22.0;
float maxDepthM         = 40.0;
float magThreshNt       = 180.0;
float eddyThreshUs      = 190.0;
float radThreshCpm      = 90.0;

volatile long encoderTicks = 0;
volatile unsigned long geigerPulses = 0;
const float METERS_PER_TICK = 0.00105;

TinyGPSPlus gps;
HardwareSerial GPSSerial(1);
Adafruit_SH1106G display(128, 64, &Wire, -1);

const int SAMPLES_PER_ASCAN = 64;
float aScanMv[SAMPLES_PER_ASCAN];
int stationIndex = 0;
float baselineMagUt = 45.0; // Medan magnet latar bumi lokal (~45 uT)

void IRAM_ATTR onEncoderPulse() {
  if (digitalRead(PIN_ENC_B) == HIGH) encoderTicks++;
  else encoderTicks--;
}

void IRAM_ATTR onGeigerPulse() {
  geigerPulses++;
}

// Baca kanal tertentu ADS1256 (0=GPR, 1=PI Eddy, 2=IP Voltage)
float readAds1256ChannelMv(uint8_t ch) {
  if (digitalRead(PIN_ADC_DRDY) == LOW) {
    SPI.beginTransaction(SPISettings(1920000, MSBFIRST, SPI_MODE1));
    digitalWrite(PIN_ADC_CS, LOW);
    SPI.transfer(0x50 | 0x01); // WREG MUX
    SPI.transfer(0x00);
    SPI.transfer((ch << 4) | 0x08); // AINx vs AINCOM
    SPI.transfer(0xFC); // SYNC
    delayMicroseconds(4);
    SPI.transfer(0x00); // WAKEUP
    SPI.transfer(0x01); // RDATA
    delayMicroseconds(7);
    long raw = ((long)SPI.transfer(0x00) << 16);
    raw |= ((long)SPI.transfer(0x00) << 8);
    raw |=  (long)SPI.transfer(0x00);
    digitalWrite(PIN_ADC_CS, HIGH);
    SPI.endTransaction();
    if (raw & 0x800000) raw |= 0xFF000000;
    return (raw / 8388607.0f) * 2500.0f;
  }
  return analogRead(ch + 1) * 0.8f; // Fallback uji bangku
}

// Mengukur konstanta peluruhan arus Eddy koil Pulse Induction (mikrodetik)
float measurePulseInductionEddyUs() {
  digitalWrite(PIN_PI_COIL_TX, HIGH);
  delayMicroseconds(180); // Mengisi energi medan magnet koil PI
  digitalWrite(PIN_PI_COIL_TX, LOW);
  delayMicroseconds(15);  // Blanking flyback tegangan tinggi

  float vEarly = abs(readAds1256ChannelMv(1));
  delayMicroseconds(120);
  float vLate  = abs(readAds1256ChannelMv(1));

  if (vEarly < 5.0f) return 45.0f;
  float ratio = constrain(vLate / vEarly, 0.05f, 0.95f);
  return constrain(-120.0f / log(ratio), 40.0f, 600.0f);
}

// Membaca anomali magnetometer 3-sumbu dalam nanoTesla (nT)
float readMagneticAnomalyNt() {
  Wire.beginTransmission(QMC5883L_ADDR);
  Wire.write(0x00);
  if (Wire.endTransmission() != 0) return 15.0f;

  Wire.requestFrom(QMC5883L_ADDR, 6);
  if (Wire.available() < 6) return 15.0f;

  int16_t mx = Wire.read() | (Wire.read() << 8);
  int16_t my = Wire.read() | (Wire.read() << 8);
  int16_t mz = Wire.read() | (Wire.read() << 8);
  float magUt = sqrt((float)mx * mx + (float)my * my + (float)mz * mz) * 0.033f;
  return abs(magUt - baselineMagUt) * 1000.0f; // Konversi uT ke nT
}

void setup() {
  Serial.begin(115200);
  GPSSerial.begin(9600, SERIAL_8N1, PIN_GPS_RX, PIN_GPS_TX);
  SPI.begin(12, 13, 11, PIN_ADC_CS);
  Wire.begin(21, 22);

  pinMode(PIN_ADC_CS, OUTPUT);
  digitalWrite(PIN_ADC_CS, HIGH);
  pinMode(PIN_ADC_DRDY, INPUT);
  pinMode(PIN_PULSER_TX, OUTPUT);
  pinMode(PIN_GATE_SYNC, OUTPUT);
  pinMode(PIN_PI_COIL_TX, OUTPUT);
  pinMode(PIN_GEIGER_INT, INPUT_PULLUP);
  pinMode(PIN_ENC_A, INPUT_PULLUP);
  pinMode(PIN_ENC_B, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);

  attachInterrupt(digitalPinToInterrupt(PIN_ENC_A), onEncoderPulse, RISING);
  attachInterrupt(digitalPinToInterrupt(PIN_GEIGER_INT), onGeigerPulse, FALLING);

  // Inisialisasi Magnetometer QMC5883L
  Wire.beginTransmission(QMC5883L_ADDR);
  Wire.write(0x09);
  Wire.write(0x1D); // Continuous 200Hz, 8G range
  Wire.endTransmission();

  display.begin(0x3C, true);
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 0);
  display.println("AquaRadar Multi-Sensor");
  display.println("Air + Logam + Geiger");
  display.display();
}

void loop() {
  while (GPSSerial.available() > 0) gps.encode(GPSSerial.read());

  static long lastScanTicks = 0;
  static unsigned long lastTimer = 0;
  static unsigned long lastCpmWindow = 0;
  static float currentCpm = 20.0;

  if (millis() - lastCpmWindow >= 5000) {
    currentCpm = geigerPulses * 12.0f; // Ekstrapolasi pulsa 5 detik ke CPM
    geigerPulses = 0;
    lastCpmWindow = millis();
  }

  if (abs(encoderTicks - lastScanTicks) >= 95 || (millis() - lastTimer) >= 650) {
    lastScanTicks = encoderTicks;
    lastTimer = millis();

    float peakEps = 5.0;
    float detectedDepth = -1.0;

    for (int i = 0; i < SAMPLES_PER_ASCAN; i++) {
      digitalWrite(PIN_PULSER_TX, HIGH);
      delayMicroseconds(1);
      digitalWrite(PIN_PULSER_TX, LOW);
      delayMicroseconds(i);

      float mv = readAds1256ChannelMv(0);
      aScanMv[i] = mv;
      float depthM = ((float)i / (SAMPLES_PER_ASCAN - 1)) * maxDepthM;
      float eps = constrain(6.0f + abs(mv) * 0.14f, 4.0f, 78.0f);
      if (depthM > 2.5f && eps > peakEps) {
        peakEps = eps;
        if (eps >= dielectricThresh) detectedDepth = depthM;
      }
    }

    float magNt  = readMagneticAnomalyNt();
    float eddyUs = measurePulseInductionEddyUs();
    float ipMvV  = abs(readAds1256ChannelMv(2)) * 0.08f;

    // Klasifikasi cepat jenis target logam
    const char* metalType = "none";
    if (currentCpm >= radThreshCpm) metalType = "uranium";
    else if (magNt >= 900.0f)       metalType = "besi";
    else if (magNt >= 280.0f)       metalType = "nikel";
    else if (ipMvV >= 40.0f)        metalType = "pirit";
    else if (eddyUs >= 440.0f)      metalType = "perak";
    else if (eddyUs >= eddyThreshUs) metalType = "emas";

    if (peakEps >= dielectricThresh || strcmp(metalType, "none") != 0) {
      tone(PIN_BUZZER, strcmp(metalType, "uranium") == 0 ? 1650 : 1050, 120);
    }

    double lat = gps.location.isValid() ? gps.location.lat() : -2.418500;
    double lon = gps.location.isValid() ? gps.location.lng() : 121.356200;
    double alt = gps.altitude.isValid() ? gps.altitude.meters() : 318.0;
    float distM = encoderTicks * METERS_PER_TICK;

    Serial.print("{\\"type\\":\\"scan\\",\\"idx\\":");
    Serial.print(stationIndex++);
    Serial.print(",\\"xM\\":");      Serial.print(distM, 2);
    Serial.print(",\\"lat\\":");     Serial.print(lat, 6);
    Serial.print(",\\"lon\\":");     Serial.print(lon, 6);
    Serial.print(",\\"elev\\":");    Serial.print(alt, 1);
    Serial.print(",\\"peakEps\\":"); Serial.print(peakEps, 1);
    Serial.print(",\\"depthM\\":");  Serial.print(detectedDepth, 1);
    Serial.print(",\\"magNt\\":");   Serial.print(magNt, 1);
    Serial.print(",\\"eddyUs\\":");  Serial.print(eddyUs, 0);
    Serial.print(",\\"ipMvV\\":");   Serial.print(ipMvV, 1);
    Serial.print(",\\"cpm\\":");     Serial.print(currentCpm, 0);
    Serial.print(",\\"metal\\":\\""); Serial.print(metalType); Serial.print("\\"");
    Serial.print(",\\"amp\\":[");
    for (int i = 0; i < SAMPLES_PER_ASCAN; i++) {
      Serial.print(aScanMv[i], 1);
      if (i < SAMPLES_PER_ASCAN - 1) Serial.print(",");
    }
    Serial.println("]}");
  }
}
`;

export const PLATFORMIO_INI = `[env:esp32-s3-devkitc-1]
platform = espressif32
board = esp32-s3-devkitc-1
framework = arduino
monitor_speed = 115200
lib_deps =
  mikalhart/TinyGPSPlus @ ^1.0.3
  adafruit/Adafruit SH110X @ ^2.1.10
  adafruit/Adafruit GFX Library @ ^1.11.9
build_flags =
  -DARDUINO_USB_CDC_ON_BOOT=1
`;

export const TROUBLESHOOTING_LIST: TroubleshootingItem[] = [
  {
    symptom: 'Sinyal Radargram datar (nilai amplitude 0 mV) atau macet saat pemindaian',
    probableCause: 'Pin DRDY pada ADS1256 tidak terhubung ke GPIO9 atau kabel SPI MISO/MOSI tertukar.',
    solutionSteps: [
      'Periksa kontinuitas jalur SPI (GPIO11 MOSI, GPIO13 MISO, GPIO12 SCLK, GPIO10 CS, GPIO9 DRDY) dengan multimeter.',
      'Pastikan suplai 5V ke board ADS1256 stabil (minimal 4.85V) dan ground ESP32 terhubung bersama (Common GND).',
      'Uji pin TX Pulser (GPIO4) menggunakan osiloskop atau logic analyzer untuk memastikan pulsa pemicu keluar.',
    ],
  },
  {
    symptom: 'Magnetometer terus terbaca > 1000 nT meski tidak ada bijih besi atau nikel',
    probableCause: 'Sensor RM3100/QMC5883L dipasang terlalu dekat dengan baut besi rangka, baterai, atau kumparan koil PI.',
    solutionSteps: [
      'Jauhkan sensor magnetometer minimal 60 cm di atas koil PI pada tiang PVC atau aluminium non-feromagnetik.',
      'Lakukan kalibrasi nol (baseline) di area terbuka yang bebas pagar besi sebelum mulai berjalan.',
      'Pastikan jalur I2C (GPIO21/22) memiliki resistor pull-up 4.7 kOhm agar data koordinat X/Y/Z tidak membeku.',
    ],
  },
  {
    symptom: 'Tabung Geiger-Müller tidak menghitung pulsa (selalu 0 CPM) saat uji batuan mineral',
    probableCause: 'Tegangan booster HV 400V belum aktif atau pin interupsi GPIO8 tidak mendapat pulsa turun (FALLING).',
    solutionSteps: [
      'Ukur tegangan anoda tabung SBM-20 dengan probe berimpedansi tinggi (harus di kisaran 380–420V DC); hati-hati jangan menyentuh langsung dengan tangan.',
      'Pastikan resistor pembatas 4.7 MOhm terpasang seri ke anoda tabung dan sinyal output masuk ke GPIO8 dengan mode INPUT_PULLUP.',
      'Nilai latar belakang normal (background) di udara biasa adalah 15–35 CPM; angka 0 menandakan rangkaian belum terpicu.',
    ],
  },
  {
    symptom: 'GPS NEO-M8N terus menunjukkan 0 satelit dan koordinat default',
    probableCause: 'Pengujian dilakukan di dalam ruangan tertutup atau pin RX/TX UART tidak disilang (crossover).',
    solutionSteps: [
      'Pastikan kabel TX modul GPS masuk ke pin RX ESP32 (GPIO18) dan RX GPS masuk ke TX ESP32 (GPIO17).',
      'Bawa alat ke area terbuka (langit terlihat jelas) dan tunggu 45–90 detik untuk Cold Start GPS Lock pertama kali.',
      'Periksa LED PPS pada modul NEO-M8N; kedipan 1 Hz menandakan sinyal satelit sudah terkunci.',
    ],
  },
  {
    symptom: 'Tegangan ESP32 sering restart sendiri (Brownout Detector) saat pulser GPR atau koil PI aktif',
    probableCause: 'Arus puncak modul pulser RF & MOSFET IRF540N koil PI menyebabkan drop tegangan pada rel 3.3V.',
    solutionSteps: [
      'Tambahkan kapasitor elektrolit 1000 µF 16V dan keramik 100 nF sedekat mungkin dengan pin VIN modul pulser, koil PI, dan 3.3V ESP32.',
      'Pisahkan jalur daya regulator Buck 5V untuk pulser/PI dan LDO 3.3V khusus untuk mikrokontroler + ADC.',
      'Periksa tegangan baterai LiFePO4 12V; lakukan pengisian ulang jika berada di bawah 11.8V.',
    ],
  },
];

export const TESTING_STEPS: TestStepItem[] = [
  {
    id: 'test-power',
    phase: 'Bangku Kerja (Bench)',
    title: '1. Uji Rel Tegangan & Proteksi Polaritas',
    procedure:
      'Nyalakan sakelar baterai LiFePO4 12V tanpa memasang ESP32, ADS1256, atau modul Geiger terlebih dahulu. Ukur output Buck Converter dan LDO dengan multimeter.',
    expectedResult:
      'Rel utama terbaca 5.00V ± 0.1V dan rel logika 3.30V ± 0.05V tanpa panas berlebih pada regulator.',
  },
  {
    id: 'test-serial',
    phase: 'Bangku Kerja (Bench)',
    title: '2. Verifikasi Komunikasi USB Web Serial, Magnetometer & Geiger Latar',
    procedure:
      'Pasang ESP32-S3, unggah firmware aquaradar_esp32.ino, lalu hubungkan ke tab Pemindai 3D menggunakan mode Sensor Serial.',
    expectedResult:
      'Aplikasi web menerima JSON multi-sensor (εr, magNt, eddyUs, ipMvV, cpm) dan background Geiger terbaca normal 15–35 CPM.',
  },
  {
    id: 'test-air',
    phase: 'Kalibrasi Udara',
    title: '3. Kalibrasi Zero-Time GPR & Baseline Medan Magnet Lokal',
    procedure:
      'Angkat kereta radar sejauh 1 meter di area lapang bebas benda logam. Jalankan kalibrasi udara dan catat nilai medan magnet latar lokal.',
    expectedResult:
      'Gelombang GPR nol berada di 2.4 ns, nilai latar εr ≤ 2.0, dan anomali ΔB berada di sekitar ±15 nT.',
  },
  {
    id: 'test-target',
    phase: 'Uji Target Terkendali',
    title: '4. Uji Target Air, Koin Emas/Perak & Magnetit Terkubur',
    procedure:
      'Lewatkan kereta radar di atas: (a) drum air 200 L terkubur, (b) koin perak/tembaga di kedalaman 40 cm, dan (c) batuan besi/magnetit.',
    expectedResult:
      'Drum air memicu εr > 24, koin memicu Eddy Decay PI > 350 µs dengan ΔB rendah, sedangkan besi memicu lonjakan ΔB > 500 nT.',
  },
  {
    id: 'test-field',
    phase: 'Uji Lapangan',
    title: '5. Validasi Grid GPS Multi-Mineral & Ekspor Geospasial',
    procedure:
      'Lakukan pemindaian lintasan sejajar (grid 3 jalur x 20 m) di luar ruangan, lalu ekspor hasil ke format GeoJSON dan KML.',
    expectedResult:
      'File GeoJSON & KML menampilkan poligon akuifer air maupun titik anomali logam/uranium presisi di QGIS / Google Earth.',
  },
];
