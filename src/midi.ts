import p5 from "p5";
import * as quine from "./quine";
import * as audio from "./audio";
import * as midiData from "./midiData";
import * as voicevoxData from "./voicevoxData";
import * as eventsData from "./eventsData";
import { width, height } from "./const";
import { createPe } from "./performance";
import { currentSection } from "./time";

const pe = createPe("midi.ts");
const radiusX = height / 2;
const radiusY = height / 2;
export let graphics: p5.Graphics;
export function setup() {
  graphics = p.createGraphics(width, height);
}
const ticksToTime = (ticks: number) => (ticks / midiData.ppq) * (60 / 140);

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
  pe("drawOpenHihats");
  drawOpenHihats(audioTime);
  pe("drawCrashes");
  drawCrashes(audioTime);
  pe("drawPianoRoll");
  drawPianoRoll(audioTime);
  pe("drawKick");
  drawKick(audioTime);
  pe("drawClap");
  drawClap(audioTime);
  pe("drawBell");
  drawBell(audioTime);

  return { chord, bass };
}

function drawChords(audioTime: number) {
  const [time, notes, name] = midiData.chords.find(
    (c) => c[0][0] <= audioTime && audioTime < c[0][1],
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
    (c) => c[0][0] <= audioTime && audioTime < c[0][1],
  ) ?? [undefined, undefined];
  if (time) {
    const [start] = time;
    const progress = Math.min(1, (audioTime - start) / 0.5);
    quine.lightUp(name, [0, 128, 255, 96 * (1 - progress)]);
    return name;
  }
}
function drawOpenHihats(audioTime: number) {
  if (midiData.openHihats[0] > audioTime) {
    return;
  }
  const lastTimeIndex = midiData.openHihats.findIndex((t) => t > audioTime);
  const lastTime =
    lastTimeIndex === -1
      ? midiData.openHihats[midiData.openHihats.length - 1]
      : midiData.openHihats[lastTimeIndex - 1];
  if (lastTime) {
    const progress = Math.min(1, (audioTime - lastTime) / 0.5);
    if (progress === 1) {
      return;
    }
    quine.lightUp("Hihat", [255, 128, 0, 64 * (1 - progress)]);
  }
}
const hasPrevFewSecondsCache: { [key: number]: boolean } = {};
const hasPrevFewSeconds = (lastTime: number) => {
  if (hasPrevFewSecondsCache[lastTime] == undefined) {
    hasPrevFewSecondsCache[lastTime] = !!midiData.openHihats.find(
      (t) => t > lastTime - 2 && t < lastTime && t !== lastTime,
    );
  }
  return hasPrevFewSecondsCache[lastTime];
};
function drawCrashes(audioTime: number) {
  if (midiData.crashes[0] > audioTime) {
    return;
  }
  const lastTimeIndex = midiData.crashes.findIndex((t) => t > audioTime);
  const lastTime =
    lastTimeIndex === -1
      ? midiData.crashes[midiData.crashes.length - 1]
      : midiData.crashes[lastTimeIndex - 1];
  if (lastTime) {
    const progress = Math.min(1, (audioTime - lastTime) / 2);
    if (progress === 1) {
      return;
    }
    let text: string;
    let alpha: number;
    const prevFewSeconds = hasPrevFewSeconds(lastTime);
    const nextTime = midiData.crashes[lastTimeIndex];
    if (!nextTime || (nextTime - lastTime > 2 && prevFewSeconds)) {
      text = "CRASHcrash";
      alpha = 128;
    } else if (!prevFewSeconds && nextTime - lastTime > 2) {
      text = "CRASHcrash";
      alpha = 96;
    } else {
      text = lastTimeIndex % 2 === 0 ? "CRASH" : "crash";
      alpha = 96;
    }
    quine.lightUp(text, [255, 255, 255, alpha * (1 - progress)]);
  }
}

let vvNotes: [number, number, number][] = [];
function drawPianoRoll(audioTime: number, color: number[] = [255, 255, 255]) {
  const widthRatio = 0.5;
  const left = (quine.numChars / 2) * (1 - widthRatio);
  const right = (quine.numChars / 2) * (1 + widthRatio);
  const duration = 1.5;
  const width = right - left;
  if (vvNotes.length === 0) {
    const findSection = (time: number) => {
      if (!eventsData.sections) {
        throw new Error("No sections");
      }
      const section = eventsData.sections.find(
        (s) => s.startTime <= time && time < s.endTime,
      );
      return section ? section.name : undefined;
    };
    vvNotes = voicevoxData.notes.filter(
      ([start, end]) =>
        findSection(start) !== "intro" && findSection(end) !== "intro",
    );
  }
  const draw = (piano: [number, number, number][]) => {
    for (const [start, end, midi] of piano) {
      let x = right + ((start - audioTime - duration / 2) / duration) * width;
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
      quine.rect(x, 8 + y, w, 1, [
        ...color,
        start < audioTime && audioTime < end ? 255 : 128,
      ]);
    }
  };

  // draw(midiData.melody);
  draw(midiData.solo);
  draw(vvNotes);
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

function drawBell(audioTime: number) {
  const [startTime, endTime, level] = midiData.bell.find(
    (c) => ticksToTime(c[0]) <= audioTime && audioTime < ticksToTime(c[1]),
  ) ?? [undefined, undefined, undefined];
  if (!startTime) {
    return;
  }
  const currentMeasure = Math.floor(startTime / midiData.ppq / 4);
  if (currentMeasure === 48) {
    return;
  }
  const firstBellInMeasure = midiData.bell.find(
    (c) => Math.floor(c[0] / midiData.ppq / 4) === currentMeasure,
  );
  const bellsInMeasure = midiData.bell.filter((c) => {
    const diff = c[0] - firstBellInMeasure[0];
    return diff >= 0 && diff < midiData.ppq * 4;
  });
  const widthRatio = 0.25;
  const left = (quine.numChars / 2) * (1 - widthRatio);
  const right = (quine.numChars / 2) * (1 + widthRatio);
  const startTick = firstBellInMeasure[0];
  const endTick = firstBellInMeasure[0] + midiData.ppq * 4;
  for (const [start, end, level] of bellsInMeasure) {
    const x =
      left + ((start - startTick) / (endTick - startTick)) * (right - left);
    const w = ((end - start) / (endTick - startTick)) * (right - left);
    const y = 100 - level;
    const startTime = ticksToTime(start);
    const endTime = ticksToTime(end);
    quine.rect(x, 54 + y, w, 1, [
      255,
      255,
      128,
      startTime <= audioTime && audioTime < endTime
        ? 255
        : audioTime < startTime
          ? 128
          : 32,
    ]);
  }
}
