import type p5 from "p5";
import { width, height } from "./const";
import * as audio from "./audio";
import { lyrics } from "./eventsData";
import { charWidth, charHeight } from "./quine";
import { currentMeasure, currentSection } from "./time";

let misakiFont: p5.Font;
let pMPFont: p5.Font;
export let graphics: p5.Graphics;
export function preload() {
  misakiFont = p.loadFont("./assets/misaki_gothic.ttf");
  pMPFont = p.loadFont("./assets/PixelMplus12-Regular.ttf");
  graphics = p.createGraphics(width, height);
}
export function draw() {
  const audioTime = audio.audio.currentTime();
  graphics.clear();
  graphics.textFont(misakiFont);
  graphics.textSize(charHeight * 8);
  graphics.scale(charWidth / charHeight, 1);

  graphics.translate(
    (Math.round((width / (charWidth / charHeight) - width) / 2 / charWidth) +
      0.5) *
      charWidth +
      1,
    0
  );
  graphics.fill(255);
  const line = lyrics.find(
    (l) => l.startTime <= audioTime && audioTime < l.endTime
  );
  if (line) {
    let x = width / 2 - graphics.textWidth(line.lyric) / 2;
    const rx = Math.round(x / charHeight) * charHeight + 2;
    const y = Math.round((height * 0.7) / charHeight) * charHeight;
    graphics.text(line.lyric, rx, y);
  }
  if (currentSection() === "interlude") {
    const texts = [
      "Drum: RVK-808",
      "Crash: SI-Drum Kit",
      "Bass/Chord: Vital",
      "Bell: The Bells",
      "Melody: Soft Piano (LABS)",
      "Solo: Electric Piano (LABS)",
      "DAW: Cakewalk",
      "Vocal: 春日部つむぎ (Voicevox)",
    ];
    const text = texts[currentMeasure() - 18];

    if (text) {
      drawCenterText(text);
    }
  }
  if (currentSection() === "outro") {
    const texts = [
      "Monospace: Firple",
      "Pixel (Large): PixelMplus",
      "Pixel (Small): 美咲ゴシック",
      "Language: TypeScript",
      "Renderer: Google Chrome",
      "MV Edit: AviUtl",
      "Movie: p5.js",
    ];
    const text = texts[currentMeasure() - 66];
    if (text) {
      drawCenterText(text);
    }
  }
  if (currentSection() === "ended") {
    drawCenterText("expla1n(self)", { offsetY: charHeight * -12, font: "pmp" });

    graphics.textFont(misakiFont);
    graphics.textSize(charHeight * 8);
    const text = "Music/MV/Mix: Nanashi.\nSpecial Thanks: DTM鯖";
    for (const [j, line] of text.split("\n").entries()) {
      const x = width / 2 - graphics.textWidth(line) / 2;
      const rx = Math.round(x / charHeight) * charHeight;
      const y =
        Math.round((height / 2 + charHeight * 6) / charHeight) * charHeight +
        1 +
        j * charHeight * 8;
      graphics.text(line, rx, y);
    }
  }
  graphics.resetMatrix();
}

function drawCenterText(
  text: string,
  args: { offsetY?: number; font?: "pmp" | "misaki" } = {}
) {
  const { offsetY = 0, font = "misaki" } = args;
  graphics.textFont(font === "pmp" ? pMPFont : misakiFont);
  const fpc = font === "pmp" ? 12 : 8;
  graphics.textSize(charHeight * fpc);

  for (const [j, line] of text.split("\n").entries()) {
    const x =
      Math.round((width / 2 - graphics.textWidth(line) / 2) / charHeight) *
      charHeight;
    const y =
      Math.round((height / 2 + (charHeight * fpc) / 2 + offsetY) / charHeight) *
        charHeight +
      j * charHeight * fpc;
    graphics.text(line, x, y);
  }
}
