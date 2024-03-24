import _ from "lodash";
import fs from "node:fs/promises";
import { gzipSync } from "node:zlib";

(async () => {
  const vvproj: {
    song: {
      tpqn: number;
      tracks: {
        notes: {
          position: number;
          duration: number;
          noteNumber: number;
        }[];
      }[];
    };
  } = JSON.parse(await fs.readFile("./assets/expla1n_self.vvproj", "utf-8"));

  const tpqn = vvproj.song.tpqn;
  const tickToTime = (tick: number) => (tick / tpqn) * (60 / 140);

  const data = await jsonEncodeAndGzip(
    vvproj.song.tracks[0].notes.map(
      (n) =>
        [
          tickToTime(n.position),
          tickToTime(n.position + n.duration),
          n.noteNumber,
        ] as [number, number, number]
    )
  );
  await fs.writeFile(
    "./src/voicevoxData.ts",
    `
    import { ungzip } from "./compress";
    export let notes: [number, number, number][];
    ungzip("${data}", ${data.length}).then(v => notes = v);
    `
  );
})();

async function jsonEncodeAndGzip(data: any) {
  const json = JSON.stringify(data);
  const buffer = Buffer.from(json, "utf-8");
  return gzipSync(buffer).toString("base64");
}
