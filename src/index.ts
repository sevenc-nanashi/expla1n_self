import p5 from "p5";
import { width, height, ox, oy } from "./const";
import * as quine from "./quine";
import * as audio from "./audio";
import * as pixelizer from "./pixelizer";
import * as midi from "./midi";
import * as text from "./text";
import { currentSection } from "./time";
import { createPe, togglePerformance } from "./performance";

const pe = createPe("index.ts");
let ready = false;
let graphics: p5.Graphics;
let invertGraphics: p5.Graphics;
let font: p5.Font;
export function preload() {
  quine.preload();
  text.preload();
  audio.preload();
  pixelizer.preload();
  font = p.loadFont("./assets/firple.ttf");
}

export let rate = 1;
let renderTarget = 0;
let fullScreen = false;
export function setup() {
  const canvas = p.createCanvas(width, height, "webgl");
  p.frameRate(30);
  p.drawingContext.disable(p.drawingContext.DEPTH_TEST);
  canvas.mouseClicked(() => {
    if (!audio.audio.isPlaying()) {
      audio.audio.play();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      renderTarget = (renderTarget + (e.shiftKey ? -1 : 1)) % 7;
    } else if (e.key === "e") {
      rate -= 0.5;
      audio.audio.rate(rate);
    } else if (e.key === "r") {
      rate += 0.5;
      audio.audio.rate(rate);
    } else if (e.key === "f") {
      const element = document.querySelector(".p5Canvas")!;
      fullScreen = !fullScreen;
      if (fullScreen) {
        element.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    } else if (e.key === "p") {
      togglePerformance();
    } else if (e.key === " ") {
      if (!audio.audio.isPlaying()) {
        audio.audio.play();
      }
    } else {
      return;
    }
    e.preventDefault();
  });
  graphics = p.createGraphics(width, height);
  invertGraphics = p.createGraphics(width, height);
  audio.setup();
  midi.setup();
  quine.setup();

  ready = true;
}

export function draw() {
  try {
    if (!ready) {
      return;
    }
    p.background(0, 0, 0);
    quine.reset();
    quine.draw();
    graphics.background(0, 0, 0);
    invertGraphics.background(0, 0, 0);
    pe("text.draw");
    text.draw();
    pe("midi.draw");
    const { chord, bass } = midi.draw();
    pe("audio.draw");
    audio.draw();
    pe("quine.draw");
    graphics.image(quine.bgGraphics, 0, 0);
    graphics.image(audio.graphics, 0, 0);
    graphics.image(midi.graphics, 0, 0);
    graphics.image(text.graphics, 0, 0);
    invertGraphics.image(text.graphics, 0, 0);

    if (renderTarget === 0) {
      if (currentSection() === "ended") {
        graphics.fill([255, 255, 255, 64]);
        graphics.rect(0, 0, width, height);
      }
      pe("pixelizer.draw");
      pixelizer.draw(graphics, invertGraphics);
    } else {
      const graphicsArray = [
        text.graphics,
        audio.graphics,
        midi.graphics,
        quine.bgGraphics,
        quine.fontGraphics,
      ];
      const target = graphicsArray[renderTarget - 1];
      p.image(target, ox, oy);
    }

    if (!fullScreen) {
      p.textFont(font);
      p.textSize(16);
      p.fill(255);
      p.text(
        Object.entries({
          FPS: Math.round(p.frameRate()),
          chord,
          bass,
          rate,
          section: currentSection(),
        })
          .map(([k, v]) => k + ": " + v)
          .join(", ") + "（Voicevox：春日部つむぎ）",
        ox + 32,
        oy + 32
      );
    }
    pe("end");
  } catch (e) {
    console.error(e);
  }
}
