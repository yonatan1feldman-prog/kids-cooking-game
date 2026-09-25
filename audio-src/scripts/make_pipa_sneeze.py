# Run from audio-src/: python scripts/make_pipa_sneeze.py  (writes work/sfx/pipa-sneeze.ogg; copy it to final/sfx and public/assets/sounds/sfx)
# Pipa's sneeze: Kokoro (Apache-2.0) says "Ah... CHOO!", pitched up to a small creature's voice, trimmed, -18 LUFS.
import numpy as np, soundfile as sf, pyloudnorm as pyln, subprocess
from kokoro_onnx import Kokoro
k = Kokoro("tools/kokoro/kokoro-v1.0.onnx", "tools/kokoro/voices-v1.0.bin")
x, sr = k.create("Ahh... CHOO!", voice="af_sky", speed=1.0, lang="en-us")
env = np.convolve(np.abs(x), np.ones(240) / 240, "same"); idx = np.where(env > env.max() * 0.01)[0]
x = x[max(0, idx[0] - 200): idx[-1] + 2000]
sf.write("work/sfx/sneeze-raw.wav", x, sr)
# +5 semitones (asetrate), back to 44.1k; soft fade-out
f = 2 ** (5 / 12)
subprocess.run(["tools/ffmpeg/bin/ffmpeg.exe", "-loglevel", "error", "-y", "-i", "work/sfx/sneeze-raw.wav", "-af",
                f"asetrate={int(sr * f)},aresample=44100,highpass=f=120,afade=t=out:st=0:d=0", "work/sfx/sneeze-pitched.wav"])
y, sr2 = sf.read("work/sfx/sneeze-pitched.wav")
L = pyln.Meter(sr2, block_size=min(0.4, len(y) / sr2 * 0.9)).integrated_loudness(np.concatenate([y, y, y]))
y = y * 10 ** ((-18 - L) / 20); y = y / max(1, np.abs(y).max() / 10 ** (-1.5 / 20))
fo = int(0.05 * sr2); y[-fo:] *= np.linspace(1, 0, fo)
sf.write("work/sfx/sneeze.wav", y, sr2)
subprocess.run(["tools/ffmpeg/bin/ffmpeg.exe", "-loglevel", "error", "-y", "-i", "work/sfx/sneeze.wav", "-c:a", "libvorbis", "-q:a", "4", "work/sfx/pipa-sneeze.ogg"])
print(len(y) / sr2, "s")
