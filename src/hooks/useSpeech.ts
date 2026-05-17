import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef } from 'react';

// ─── Praise / mistake audio (require.context, like animations) ────────────────
// Drop any *-success.wav or *-fail.wav into assets/audio/praises/ — no code changes needed.
const successCtx = (require as any).context('../../assets/audio/praises', false, /-success\.(wav|mp3)$/);
const failCtx    = (require as any).context('../../assets/audio/praises', false, /-fail\.(wav|mp3)$/);

const SUCCESS_SOUNDS: number[] = successCtx.keys().map((k: string) => successCtx(k));
const FAIL_SOUNDS: number[]    = failCtx.keys().map((k: string) => failCtx(k));

function pickRandom<T>(arr: T[]): T | null {
  return arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;
}

// Converts Albanian text to the audio filename stem (no extension).
// ë → w  |  ç → c  |  spaces → hyphens  |  lowercase  |  no punctuation
// Drop a file into public/audio/words/ or public/audio/sentences/ and it is
// picked up automatically — no registration needed.
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

// ─── Web audio via HTML Audio API ────────────────────────────────────────────
// expo-av's createAsync doesn't reliably throw on a 404, so playAsync() then
// fails silently. The HTML Audio API handles missing files correctly via onerror.

let _webAudio: HTMLAudioElement | null = null;

function stopWebAudio() {
  if (_webAudio) { _webAudio.pause(); _webAudio.src = ''; _webAudio = null; }
}

function speakWeb(candidates: string[], rate: number, onEnd?: () => void): void {
  stopWebAudio();
  let idx = 0;

  const tryNext = () => {
    if (idx >= candidates.length) { onEnd?.(); return; }
    const uri = candidates[idx++];
    const audio = new (window as any).Audio(uri) as HTMLAudioElement;
    _webAudio = audio;
    audio.onerror  = () => { if (_webAudio === audio) { _webAudio = null; tryNext(); } };
    audio.onended  = () => { if (_webAudio === audio) { _webAudio = null; onEnd?.(); } };
    audio.playbackRate = rate;
    audio.play().catch(() => { if (_webAudio === audio) { _webAudio = null; tryNext(); } });
  };

  tryNext();
}

// ─── Pre-gesture queue ───────────────────────────────────────────────────────
// Browsers block audio until the user interacts. We queue the first speak call
// and fire it synchronously on the first pointer/key event.
let _unlocked = false;
let _pendingSpeak: (() => void) | null = null;

if (typeof window !== 'undefined') {
  const unlock = () => {
    _unlocked = true;
    const fn = _pendingSpeak;
    _pendingSpeak = null;
    fn?.();
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown',     unlock, { once: true });
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
    if (_unlocked) {
      doSpeak();
    } else {
      _pendingSpeak = doSpeak;
    }
  }, [stop]);

  const speakSlow = useCallback((text: string) => speak(text, 0.65), [speak]);

  const praise = useCallback(() => {
    const asset = pickRandom(SUCCESS_SOUNDS);
    if (asset !== null) playAsset(asset);
  }, []);

  const mistake = useCallback(() => {
    const asset = pickRandom(FAIL_SOUNDS);
    if (asset !== null) playAsset(asset);
  }, []);

  return { speak, speakSlow, stop, praise, mistake };
}
