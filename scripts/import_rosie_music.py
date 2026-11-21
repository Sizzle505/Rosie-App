#!/usr/bin/env python3
"""Import verified WAV masters from one-time Dropbox transfer URLs, then
encode loudness-matched, seam-crossfaded browser MP3s. Masters stay in Dropbox
and /tmp; only optimized assets are committed to the RosieVerse repository."""
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import subprocess
import urllib.request

MASTER_DIR=Path("/tmp/rosieverse-music-masters")
DEST=Path("public/rosie-music")
TRACKS=[
  ("galactic-march","Galactic March(2).wav","Galactic March","cdbbce77bc6e61c75630e028b616ec510161f1e9c564d3fa083cac4bdc81d0fc",True),
  ("cosmic-interlude","Untitled(2).wav","Cosmic Interlude","e5819a040849484cd10b1c5ca313399fe9bcfdabd9e5db6f18b9c5a0b8540081",True),
  ("cosmic-arpeggio","Cosmic Arpeggio(2).wav","Cosmic Arpeggio","d4b781e0327162ee895a04942fb5847bf23d208ddfd9ee60a8c0aac09978a495",True),
  ("haiku-garden","静かな庭.wav","Quiet Garden","b4c76e2394220ac3b479287776b64315243034da91af3fd0160d0b8277a469b8",True),
  ("ember-tunnel","Deep Gear Discovery.wav","Deep Gear Discovery","89e761a517f9b7bd9432aa6eab0122d5ea31e421d72e6af31e5a54cadb7459aa",True),
  ("yacht-voyage","海の冒険.wav","Sea Adventure","da97273f81a7cf5ac02b70f4016d2168f2cfff99c09d9760766882b018a9bc34",True),
  ("whimsical-journey","Whimsical Journey.wav","Whimsical Journey","59d5e7454aa0b1d60c1826a3abf12f58919bb397df61e0f46c4738b4fe2e2b14",True),
  ("victory-fanfare","Triumphal Flourish.wav","Triumphal Flourish","a212a056bcee0fad6d42ec205ffb5393011f90386c58ee2593bd663ebd56f0b8",False),
  ("oracle-secret","Oracle's Secret.wav","Oracle's Secret","39c045463dcdf6a4566cae0691487dc907814936569421a4980be371c393eee0",True),
  ("cheese-heist","The Cheese Heist.wav","The Cheese Heist","cea584a7f6d17e20010e83d709c44d2f767019644aeb86b72bd179385be2e411",True),
  ("clockwork-nostalgia","Clockwork Nostalgia.wav","Clockwork Nostalgia","e01a32a12da4688a5342913d33095317d8c0814b79783bad95144b5ac6ed627b",True),
  ("candlelit-library","Candlelit Library.wav","Candlelit Library","3b24db7e097acedf24627e22896564e86a660d75c5deba7159727cb44788552d",True),
  ("pulse-arena","Pulse of the Arena.wav","Pulse of the Arena","b3e64b91bf07858aa392794fa438be97d19c777460d63d5c2484e0a694191e78",True),
]
def sha256(path):
  value=hashlib.sha256()
  with open(path,"rb") as stream:
    for block in iter(lambda:stream.read(1024*1024),b""):value.update(block)
  return value.hexdigest()

def duration(path):
  details=json.loads(subprocess.check_output([
    "ffprobe","-v","error","-show_entries","format=duration","-of","json",str(path)
  ],text=True))
  return float(details["format"]["duration"])

def retrieve(index,entry):
  slug,original,_,expected,_=entry
  source=os.environ.get(f"ROSIE_SOURCE_{index:02}")
  if not source or not source.startswith("https://"):
    raise RuntimeError(f"Missing HTTPS source for {slug}")
  target=MASTER_DIR/f"{index:02}.wav"
  # Exactly one GET per single-use Dropbox URL.
  with urllib.request.urlopen(source,timeout=180) as response, target.open("wb") as dst:
    while block:=response.read(1024*1024):dst.write(block)
  actual=sha256(target)
  if actual!=expected:raise RuntimeError(f"WAV checksum mismatch for {slug}: {actual}")
  print(f"VERIFIED {index:02} {slug} {target.stat().st_size} bytes",flush=True)
  return target

def render(index,entry):
  slug,original,title,expected,loop=entry
  src=MASTER_DIR/f"{index:02}.wav"
  out=DEST/f"{slug}.mp3"
  length=duration(src)
  if length<8:raise RuntimeError(f"Audio unexpectedly short: {slug}")
  if loop:
    # Preserve the entire original 0-5 second opening. The previous master
    # skipped these five seconds on EVERY page entry, often starting mid-phrase.
    #
    # Layout: intact first five seconds + (original 5s->end crossfaded with
    # original 0s->5s). The last sample corresponds to source t=5, which
    # exactly meets the sample when the player seeks to loop_start_seconds=5.
    # Safari loops with a SINGLE gesture-authorized HTMLAudioElement.
    filtergraph=(
      "[0:a]atrim=start=0:end=5,asetpts=PTS-STARTPTS[intro];"
      "[1:a]atrim=start=5,asetpts=PTS-STARTPTS[body];"
      "[2:a]atrim=start=0:end=5,asetpts=PTS-STARTPTS[head];"
      "[body][head]acrossfade=d=4:c1=tri:c2=tri[loop];"
      "[intro][loop]concat=n=2:v=0:a=1,"
      "afade=t=in:st=0:d=0.15,"
      "loudnorm=I=-18:TP=-1.5:LRA=9,aresample=44100[out]"
    )
  else:
    fade_at=max(.0,length-.25)
    filtergraph=f"[0:a]afade=t=in:st=0:d=0.07,afade=t=out:st={fade_at}:d=0.25,loudnorm=I=-18:TP=-1.5:LRA=9,aresample=44100[out]"
  subprocess.run([
    "ffmpeg","-hide_banner","-nostdin","-loglevel","error","-y",
    "-i",str(src),*(["-i",str(src),"-i",str(src)] if loop else []),
    "-filter_complex",filtergraph,"-map","[out]",
    "-c:a","libmp3lame","-b:a","128k","-ar","44100",
    "-metadata",f"title={title}","-metadata","artist=RosieVerse Original Soundtrack",
    "-id3v2_version","3",str(out)
  ],check=True)
  length_out=duration(out)
  expected_length=length+(1 if loop else 0)
  if abs(length_out-expected_length)>1.5:raise RuntimeError(f"Bad encode duration {slug}: {length_out}")
  size=out.stat().st_size
  if size<15000 or size>8*1024*1024:raise RuntimeError(f"Unexpected output size: {slug}: {size}")
  print(f"ENCODED {slug}: {size} bytes ({length_out:.2f}s)",flush=True)
  return {"id":slug,"title":title,"original":original,
          "master_sha256":expected,"duration":round(length_out,2),
          "filename":out.name,"sha256":sha256(out),"bytes":size,"loop":loop,
          "opening_preserved":True,"loop_start_seconds":5 if loop else 0,
          "start_fade_seconds":0.15 if loop else 0.07}

def main():
  MASTER_DIR.mkdir(parents=True,exist_ok=True)
  DEST.mkdir(parents=True,exist_ok=True)
  with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results=list(pool.map(lambda arg:retrieve(*arg),enumerate(TRACKS,1)))
  catalog=[render(i,entry) for i,entry in enumerate(TRACKS,1)]
  (DEST/"catalog.json").write_text(json.dumps({
    "version":1,"source":"Original user-supplied Suno WAV masters",
    "loudness":"-18 LUFS; -1.5 dBTP",
    "format":"MP3 128kbps stereo, 44.1kHz",
    "loop_crossfade_seconds":4,
    "natural_opening":True,
    "looping_instruction":"Play from 0 on entry; after first end seek to loop_start_seconds",
    "tracks":catalog
  },ensure_ascii=False,indent=2)+"\n",encoding="utf8")
  print(f"SUCCESS: {len(catalog)} tracks, {sum(t['bytes'] for t in catalog)} bytes",flush=True)
if __name__=="__main__":main()
