import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef } from 'react';

// ─── Praise / mistake audio ───────────────────────────────────────────────────
// require.context is a web-only Metro/webpack feature — not available on native.
let SUCCESS_SOUNDS: number[] = [];
let FAIL_SOUNDS: number[]    = [];
try {
  const successCtx = (require as any).context('../../assets/audio/praises', false, /-success\.(wav|mp3)$/);
  const failCtx    = (require as any).context('../../assets/audio/praises', false, /-fail\.(wav|mp3)$/);
  SUCCESS_SOUNDS = successCtx.keys().map((k: string) => successCtx(k));
  FAIL_SOUNDS    = failCtx.keys().map((k: string) => failCtx(k));
} catch {}

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
  if (!isWeb) { onEnd?.(); return; }
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
  // On native there's no gesture gate — audio can play immediately.
  _unlocked = true;
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
    stopWebAudio();
  }, []);

  const speak = useCallback((text: string, rate = 1, onEnd?: () => void) => {
    stop();
    const doSpeak = () => {
      if (!isMounted.current) return;
      speakWeb(wordCandidates(normalizeAudioKey(text)), rate, onEnd);
    };
    if (_unlocked) doSpeak();
    else _pendingSpeak = doSpeak;
  }, [stop]);

  const speakSlow = useCallback((text: string) => speak(text, 0.65), [speak]);

  const speakEnglish = useCallback((text: string, rate = 1, onEnd?: () => void) => {
    stop();
    const doSpeak = () => {
      if (!isMounted.current) return;
      speakWeb(englishCandidates(normalizeAudioKey(text)), rate, onEnd);
    };
    if (_unlocked) doSpeak();
    else _pendingSpeak = doSpeak;
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
