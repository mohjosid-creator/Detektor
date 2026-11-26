import { RadarAlert } from '../types/radar';

let audioCtx: AudioContext | null = null;

export function playAcousticPing(
  severity: 'high' | 'medium' = 'high',
  category: 'air' | 'logam' | 'radioaktif' = 'air'
): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    if (category === 'radioaktif') {
      // Crisp Geiger double-click pulse
      osc.type = 'square';
      osc.frequency.setValueAtTime(1420, now);
      osc.frequency.setValueAtTime(1780, now + 0.12);
    } else if (category === 'logam') {
      // Clear high metallic harmonic ping
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1180, now);
      osc.frequency.exponentialRampToValueAtTime(1560, now + 0.14);
    } else {
      // Smooth hydro-sonar ping
      osc.type = 'sine';
      const baseFreq = severity === 'high' ? 880 : 660;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.24);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.32);
  } catch {
    // Ignore audio context restrictions if user hasn't interacted yet
  }
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  return await Notification.requestPermission();
}

export function dispatchDeviceNotification(
  alert: RadarAlert,
  options: { soundEnabled: boolean; browserPushEnabled: boolean }
): void {
  if (options.soundEnabled) {
    playAcousticPing(alert.severity, alert.category);
  }

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(
        alert.category === 'radioaktif'
          ? [90, 40, 90, 40, 140]
          : alert.severity === 'high'
          ? [120, 60, 120]
          : [80]
      );
    } catch {
      // Vibration blocked or unsupported
    }
  }

  if (
    options.browserPushEnabled &&
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    try {
      new Notification(alert.title, {
        body: `${alert.message} · Kedalaman ${alert.depthM} m · ${alert.signatureSummary} (${alert.lat.toFixed(5)}, ${alert.lon.toFixed(5)})`,
        tag: alert.id,
      });
    } catch {
      // Fallback gracefully inside restricted iframes
    }
  }
}
