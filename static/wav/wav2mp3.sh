#!/bin/bash

mkdir -p ../mp3

for f in *.wav; do
  [ -e "$f" ] || continue
  ffmpeg -y -i "$f" -codec:a libmp3lame -qscale:a 6 "../mp3/${f%.wav}.mp3"
done
