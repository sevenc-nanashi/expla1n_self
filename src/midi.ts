import p5 from "p5";
import * as quine from "./quine";
import * as audio from "./audio";
import * as midiData from "./midiData";
import { width, height } from "./const";
import { createPe } from "./performance";

const pe = createPe("midi.ts");
const radiusX = height / 2;
const radiusY = height / 2;
const drawHihat = lightUpNumberArray(
  "hihat",
  0.5,
  "openHihats",
  [255, 128, 0],
  64
);
const drawCrash = lightUpNumberArray(
  "crashCRASH",
  2,
  "crashes",
  [255, 255, 255],
  128
);
export let graphics: p5.Graphics;
export function setup() {
  graphics = p.createGraphics(width, height);
}

export function draw() {
  if (!audio.audio) {
    return {};
  }
  graphics.clear();
  const audioTime = audio.audio.currentTime();

  pe("drawChords");
  const chord = drawChords(audioTime);
  pe("drawBass");
  const bass = drawBass(audioTime);
  pe("drawHihat");
  drawHihat(audioTime);
  pe("drawCrash");
  drawCrash(audioTime);
  pe("drawSolo");
  drawSolo(audioTime);
  pe("drawKick");
  drawKick(audioTime);
  pe("drawClap");
  drawClap(audioTime);

  return { chord, bass };
}

function drawChords(audioTime: number) {
  const [time, notes, name] = midiData.chords.find(
    (c) => c[0][0] <= audioTime && audioTime < c[0][1]
  ) ?? [undefined, undefined, undefined];
  if (time) {
    const [start] = time;
    const progress = Math.min(1, (audioTime - start) / 2);
    quine.lightUp(name, [255, 128, 255, 96 * (1 - progress)]);
    return name;
  }
}
function drawBass(audioTime: number) {
  const [time, name] = midiData.bass.find(
    (c) => c[0][0] <= audioTime && audioTime < c[0][1]
  ) ?? [undefined, undefined];
  if (time) {
    const [start] = time;
    const progress = Math.min(1, (audioTime - start) / 0.5);
    quine.lightUp(name, [0, 128, 255, 96 * (1 - progress)]);
    return name;
  }
}
function lightUpNumberArray(
  chars: string,
  duration: number,
  arrayKey: "openHihats" | "crashes",
  color: number[],
  alpha: number
) {
  return (audioTime: number) => {
    const array = midiData[arrayKey];
    if (!array) {
      return;
    }
    if (array[0] > audioTime) {
      return;
    }
    const lastTimeIndex = array.findIndex((t) => t > audioTime);
    const lastTime =
      lastTimeIndex === -1 ? array[array.length - 1] : array[lastTimeIndex - 1];
    if (lastTime) {
      const progress = Math.min(1, (audioTime - lastTime) / duration);
      if (progress === 1) {
        return;
      }
      quine.lightUp(chars, [
        color[0],
        color[1],
        color[2],
        alpha * (1 - progress),
      ]);
    }
  };
}

function drawSolo(audioTime: number) {
  const widthRatio = 0.5;
  const left = (quine.numChars / 2) * (1 - widthRatio);
  const right = (quine.numChars / 2) * (1 + widthRatio);
  const duration = 1.5;
  const width = right - left;
  for (const piano of [midiData.melody, midiData.solo]) {
    for (const [start, end, midi] of piano) {
      let x = right + ((start - audioTime) / duration) * width;
      let w = ((end - start) / duration) * width;
      if (right < x) {
        break;
      }
      if (x + w < left) {
        continue;
      }
      if (x < left) {
        w -= left - x;
        x = left;
      }
      if (right < x + w) {
        w = right - x;
      }

      const y = 84 - midi;
      quine.rect(x, 8 + y, w, 1, [255, 255, 255, 255]);
    }
  }
}

function drawKick(audioTime: number) {
  if (midiData.kicks[0] > audioTime) {
    return;
  }
  const lastTimeIndex = midiData.kicks.findIndex((t) => t > audioTime);
  const lastTime =
    lastTimeIndex === -1
      ? midiData.kicks[midiData.kicks.length - 1]
      : midiData.kicks[lastTimeIndex - 1];
  if (lastTime) {
    const progress = Math.min(1, (audioTime - lastTime) / 0.5);
    if (progress === 1) {
      return;
    }
    graphics.noFill();
    graphics.stroke(255, 192, 255, 255 * (1 - progress));
    graphics.strokeWeight(quine.charWidth * (2 - progress));
    graphics.ellipse(0, height / 2, radiusX * progress, radiusY * progress);
  }
}
function drawClap(audioTime: number) {
  if (midiData.claps[0] > audioTime) {
    return;
  }
  const lastTimeIndex = midiData.claps.findIndex((t) => t > audioTime);
  const lastTime =
    lastTimeIndex === -1
      ? midiData.claps[midiData.claps.length - 1]
      : midiData.claps[lastTimeIndex - 1];
  if (lastTime) {
    const progress = Math.min(1, (audioTime - lastTime) / 0.5);
    if (progress === 1) {
      return;
    }
    graphics.noFill();
    graphics.stroke(192, 192, 255, 255 * (1 - progress));
    graphics.strokeWeight(quine.charWidth * (2 - progress));
    graphics.ellipse(width, height / 2, radiusX * progress, radiusY * progress);
  }
}