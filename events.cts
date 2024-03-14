import yaml from "js-yaml";
import fs from "fs/promises";
import { gzipSync } from "zlib";

(async () => {
  const data = await fs.readFile("./events.yml", "utf-8");
  const { lyrics, sections } = yaml.load(data) as {
    lyrics: Record<string, string>;
    sections: Record<string, string>;
  };
  const lyricsData = Object.entries(lyrics).map(([key, value]) => {
    const [[startMeasure, startBeat], [endMeasure, endBeat]] = key
      .split("-")
      .map((s) => s.split("/").map(Number));
    const startBeatInt = (startMeasure - 1) * 4 + startBeat;
    const endBeatInt = (endMeasure - 1) * 4 + endBeat;
    const startTime = (startBeatInt * 60) / 140;
    const endTime = (endBeatInt * 60) / 140;
    return {
      startTime,
      endTime,
      lyric: value,
    };
  });
  const sectionsData = Object.entries(sections).map(([key, value]) => {
    const [[startMeasure, startBeat], [endMeasure, endBeat]] = key
      .split("-")
      .map((s) => s.split("/").map(Number));
    const startBeatInt = (startMeasure - 1) * 4 + startBeat;
    const endBeatInt = (endMeasure - 1) * 4 + endBeat;
    const startTime = (startBeatInt * 60) / 140;
    const endTime = (endBeatInt * 60) / 140;
    return {
      startTime,
      endTime,
      name: value,
    };
  });
  await fs.writeFile(
    "./src/eventsData.ts",
    `
    import { ungzip } from "./compress";
    export let lyrics: { startTime: number; endTime: number; lyric: string }[];
    export type Section = ${sectionsData.map((s) => `"${s.name}"`).join(" | ")}
    export let sections: { startTime: number; endTime: number; name: Section }[];
    ungzip("${await jsonEncodeAndGzip(lyricsData)}").then(v => lyrics = v);
    ungzip("${await jsonEncodeAndGzip(sectionsData)}").then(v => sections = v);
    `
  );
})();

async function jsonEncodeAndGzip(data: any) {
  const json = JSON.stringify(data);
  const buffer = Buffer.from(json, "utf-8");
  return gzipSync(buffer).toString("base64");
}
