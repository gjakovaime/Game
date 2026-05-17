import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef } from 'react';
import { AUDIO_FILES } from '../data/audioFiles';

// ─── Praise / mistake audio ───────────────────────────────────────────────────
const SUCCESS_SOUNDS = [
  require('../../assets/audio/praises/eraShumMire-success.wav'),
  require('../../assets/audio/praises/eraUrra-success.wav'),
  require('../../assets/audio/praises/erabravo-success.wav'),
];

const FAIL_SOUNDS = [
  require('../../assets/audio/praises/eragabim-fail.wav'),
  require('../../assets/audio/praises/erajo-fail.wav'),
];

function pickRandom<T>(arr: T[]): T | null {
  return arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;
}

// ë → w  |  ç → c  |  spaces → hyphens  |  lowercase  |  strip punctuation
export function normalizeAudioKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/ë/g, 'w')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, '-')
    .replace(/[!?.,]/g, '')
    .trim();
}

function wordCandidates(key: string): string[] {
  return [
    `/audio/words/${key}.mp3`,
    `/audio/words/${key}.wav`,
    `/audio/sentences/${key}.wav`,
    `/audio/sentences/${key}.mp3`,
  ];
}

function englishCandidates(key: string): string[] {
  return [
    `/audio/english/${key}.mp3`,
    `/audio/english/${key}.wav`,
  ];
}

// ─── Web audio via HTML Audio API ────────────────────────────────────────────
const isWeb = typeof window !== 'undefined' && typeof (window as any).Audio === 'function';

let _webAudio: any = null;

function stopWebAudio() {
  if (_webAudio) { _webAudio.pause(); _webAudio.src = ''; _webAudio = null; }
}

function speakWeb(candidates: string[], rate: number, onEnd?: () => void): void {
  stopWebAudio();
  let idx = 0;

  const tryNext = () => {
    if (idx >= candidates.length) { onEnd?.(); return; }
    const uri = candidates[idx++];
    const audio = new (window as any).Audio(uri);
    _webAudio = audio;
    audio.onerror  = () => { if (_webAudio === audio) { _webAudio = null; tryNext(); } };
    audio.onended  = () => { if (_webAudio === audio) { _webAudio = null; onEnd?.(); } };
    audio.playbackRate = rate;
    audio.play().catch(() => { if (_webAudio === audio) { _webAudio = null; tryNext(); } });
  };

  tryNext();
}

// ─── Pre-gesture unlock queue (web only) ─────────────────────────────────────
let _unlocked = false;
let _pendingSpeak: (() => void) | null = null;

if (isWeb && typeof window.addEventListener === 'function') {
  const unlock = () => {
    _unlocked = true;
    const fn = _pendingSpeak;
    _pendingSpeak = null;
    fn?.();
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown',     unlock, { once: true });
} else {
  _unlocked = true;
}

// ─── Native audio via expo-av ────────────────────────────────────────────────
let _nativeSound: Audio.Sound | null = null;

async function stopNativeAudio() {
  if (_nativeSound) {
    try { await _nativeSound.stopAsync(); await _nativeSound.unloadAsync(); } catch {}
    _nativeSound = null;
  }
}

async function playNative(asset: any, rate: number, onEnd?: () => void) {
  await stopNativeAudio();
  try {
    const { sound } = await Audio.Sound.createAsync(asset, { rate, shouldCorrectPitch: true });
    _nativeSound = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        if (_nativeSound === sound) _nativeSound = null;
        onEnd?.();
      }
    });
    await sound.playAsync();
  } catch {
    onEnd?.();
  }
}

function speakNative(key: string, rate: number, onEnd?: () => void) {
  const asset = AUDIO_FILES[key];
  if (asset !== undefined) {
    playNative(asset, rate, onEnd);
  } else {
    onEnd?.();
  }
}

// ─── expo-av asset playback (for praises / mistakes) ────────────────────────
function playAsset(asset: number) {
  Audio.Sound.createAsync(asset).then(({ sound }) => {
    sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  }).catch(() => {});
}

export function useSpeech() {
  const isMounted = useRef(true);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
    return () => { isMounted.current = false; };
  }, []);

  const stop = useCallback(() => {
    if (isWeb) stopWebAudio();
    else stopNativeAudio();
  }, []);

  const speak = useCallback((text: string, rate = 1, onEnd?: () => void) => {
    stop();
    const key = normalizeAudioKey(text);

    if (isWeb) {
      const doSpeak = () => {
        if (!isMounted.current) return;
        speakWeb(wordCandidates(key), rate, onEnd);
      };
      if (_unlocked) doSpeak();
      else _pendingSpeak = doSpeak;
    } else {
      if (!isMounted.current) return;
      speakNative(key, rate, onEnd);
    }
  }, [stop]);

  const speakSlow = useCallback((text: string) => speak(text, 0.65), [speak]);

  const speakEnglish = useCallback((text: string, rate = 1, onEnd?: () => void) => {
    stop();
    if (!isMounted.current) return;
    if (isWeb) {
      const key = normalizeAudioKey(text);
      const doSpeak = () => {
        if (!isMounted.current) return;
        speakWeb(englishCandidates(key), rate, onEnd);
      };
      if (_unlocked) doSpeak();
      else _pendingSpeak = doSpeak;
    } else {
      onEnd?.();
    }
  }, [stop]);

  const praise = useCallback(() => {
    const asset = pickRandom(SUCCESS_SOUNDS);
    if (asset !== null) playAsset(asset);
  }, []);

  const mistake = useCallback(() => {
    const asset = pickRandom(FAIL_SOUNDS);
    if (asset !== null) playAsset(asset);
  }, []);

  return { speak, speakSlow, speakEnglish, stop, praise, mistake };
}
