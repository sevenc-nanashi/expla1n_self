import type p5_ from "p5";
import { height, width } from "./const";
import { charWidth, numChars } from "./quine";
import { rate } from ".";

declare const p5: typeof p5_;

export let fft: p5_.FFT;
export let audio: p5_.SoundFile;
export let graphics: p5_.Graphics;
export function preload() {
  audio = p.loadSound("./assets/expla1n_self.mp3");
  audio.setVolume(0.5);
}

export function setup() {
  fft = new p5.FFT();
  graphics = p.createGraphics(width, height);
}

export function draw() {
  graphics.clear();
  const spectrum = fft.analyze();
  const freqPerChar = spectrum.length / (numChars * 2);
  graphics.noStroke();
  graphics.fill(255, 255, 255, 64);
  for (let i = 0; i < Math.ceil(numChars); i++) {
    const spLeft = Math.floor((i * freqPerChar) * rate);
    const spRight = Math.floor(((i + 1) * freqPerChar) * rate);

    const spHeight =
      spectrum.slice(spLeft, spRight).reduce((a, b) => a + b, 0) /
        (spRight - spLeft) -
      32;
    if (spHeight < 0) {
      continue;
    }

    const left = i * charWidth;
    const right = (i + 1) * charWidth;

    graphics.rect(left, height - spHeight, right - left, height);
  }
}
