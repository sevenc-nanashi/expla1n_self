import { audio } from "./audio";
import { Section, sections } from "./eventsData";

export function currentBeat() {
  return Math.floor(audio.currentTime() / (60 / 140));
}

export function currentMeasure() {
  return Math.floor(currentBeat() / 4) + 1;
}

export function currentBeatInMeasure() {
  return currentBeat() % 4;
}

export function currentSection(): Section | "ended" | undefined {
  const s = sections.find(
    (s) => s.startTime <= audio.currentTime() && audio.currentTime() < s.endTime
  )?.name;
  if (s) {
    return s;
  }
  if (audio.currentTime() > sections[sections.length - 1].endTime) {
    return "ended";
  }
  return undefined;
}
