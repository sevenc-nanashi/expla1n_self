import * as midi from "@tonejs/midi";
import { Chord, Note } from "@patrady/chord-js";
import _ from "lodash";
import fs from "node:fs/promises";
import { gzipSync } from "node:zlib";

(async () => {
  const midiData = await fs.readFile("./assets/expla1n_self.mid");
  const parsed = new midi.Midi(midiData);
  console.log("Tracks:");
  for (const track of parsed.tracks) {
    console.log("- " + track.name);
  }
  const chordInfos = await parseChords(parsed);
  const bassInfo = await parseBass(parsed);
  const bellInfo = await parseBell(parsed);
  const melodyInfo = await parsePiano(parsed, "Melody / SofP");
  const soloInfo = await parsePiano(parsed, "Solo / EleP");
  const { closedHihats, openHihats, kicks, claps } = await parse808(parsed);
  const crashes = await parseCrash(parsed);
  const consts: [string, string, any][] = [
    ["chords", "[[number, number], number[], string][]", chordInfos],
    ["bass", "[[number, number], string][]", bassInfo],
    ["crashes", "number[]", crashes],
    ["openHihats", "number[]", openHihats],
    ["bell", "[number, number, number][]", bellInfo],
    ["melody", "[number, number, number][]", melodyInfo],
    ["solo", "[number, number, number][]", soloInfo],
    ["kicks", "number[]", kicks],
    ["claps", "number[]", claps],
    ["closedHihats", "number[]", closedHihats],
  ];
  for (const [name, key, value] of consts) {
    console.log(name, value.length);
  }
  await fs.writeFile(
    "./src/midiData.ts",
    `
    import { ungzip } from "./compress";
    export const ppq = ${parsed.header.ppq};
    ${(
      await Promise.all(
        consts.map(async ([name, key, value]) => {
          const b64 = await jsonEncodeAndGzip(value);
          return `export let ${name}: ${key}; ungzip("${b64}", ${b64.length}).then(v => ${name} = v);`;
        })
      )
    ).join("\n")}
    `
  );
})();

async function parseChords(parsed: midi.Midi) {
  const chordTrack = parsed.tracks.find((t) => t.name === "Chord / Vital");
  if (!chordTrack) {
    throw new Error("No chord track found");
  }
  const chords = _.groupBy(chordTrack.notes, (n) => n.ticks);
  const chordInfos: [[number, number], number[], string][] = [];
  for (const [ticks, events] of Object.entries(chords)) {
    const notes = events.map((e) => Note.fromMidi(e.midi));
    const chord = Chord.for(notes);
    console.log(
      Math.floor(events[0].bars),
      (events[0].bars % 1) * 4,
      chord?.getName()
    );
    const time = events[0].time;
    const endTime = events[0].time + events[0].duration;
    const name = chord?.getName();
    if (!name) {
      console.log("Unknown chord", notes);
      continue;
    }

    chordInfos.push([
      [time, endTime],
      events.map((n) => n.midi),
      name.replace("ø7", "m7b5").replace("maj7", "M7"),
    ]);
  }

  return chordInfos;
}

async function parsePiano(parsed: midi.Midi, name: string) {
  const soloTrack = parsed.tracks.find((t) => t.name === name);
  if (!soloTrack) {
    throw new Error("No solo track found");
  }
  const soloInfos: [number, number, number][] = [];
  for (const note of soloTrack.notes) {
    soloInfos.push([note.time, note.time + note.duration, note.midi]);
  }
  soloInfos.sort((a, b) => a[0] - b[0]);
  console.log(
    name,
    "highest",
    soloInfos.map((s) => s[2]).sort((a, b) => b - a)[0]
  );

  return soloInfos;
}

async function parseBell(parsed: midi.Midi) {
  const soloTrack = parsed.tracks.find((t) => t.name === "Bell / The Bells");
  if (!soloTrack) {
    throw new Error("No solo track found");
  }
  const soloInfos: [number, number, number][] = [];
  for (const note of soloTrack.notes) {
    soloInfos.push([note.ticks, note.ticks + note.durationTicks, note.midi]);
  }
  soloInfos.sort((a, b) => a[0] - b[0]);
  console.log(
    "bell highest",
    soloInfos.map((s) => s[2]).sort((a, b) => b - a)[0]
  );

  return soloInfos;
}

async function parseBass(parsed: midi.Midi) {
  const bassTrack = parsed.tracks.find((t) => t.name === "Bass / Vital");
  if (!bassTrack) {
    throw new Error("No bass track found");
  }
  const bassInfos: [[number, number], string][] = [];
  for (const event of bassTrack.notes) {
    const time = event.time;
    const endTime = event.time + event.duration;
    const note = Note.fromMidi(event.midi);
    bassInfos.push([[time, endTime], note.getScientificName()]);
  }

  return bassInfos;
}

async function parse808(parsed: midi.Midi) {
  const drumTrack = parsed.tracks.find((t) => t.name === "Drum / 808");
  if (!drumTrack) {
    throw new Error("No drum track found");
  }
  const kickTrack = parsed.tracks.find((t) => t.name === "Kick / 808");
  if (!kickTrack) {
    throw new Error("No kick track found");
  }

  const getTimes = (midi: number) =>
    drumTrack.notes
      .filter((n) => n.midi === midi)
      .map((n) => n.time)
      .sort((a, b) => a - b);
  const closedHihats: number[] = getTimes(38);
  const openHihats: number[] = getTimes(50);
  const claps: number[] = getTimes(39);

  const kicks: number[] = kickTrack.notes
    .map((n) => n.time)
    .sort((a, b) => a - b);

  return { closedHihats, openHihats, kicks, claps };
}

async function parseCrash(parsed: midi.Midi) {
  const crashTrack = parsed.tracks.find((t) => t.name === "Crash / SI Drum");
  if (!crashTrack) {
    throw new Error("No crash track found");
  }
  return crashTrack.notes.map((n) => n.time);
}

async function jsonEncodeAndGzip(data: any) {
  const json = JSON.stringify(data);
  const buffer = Buffer.from(json, "utf-8");
  return gzipSync(buffer).toString("base64");
}
