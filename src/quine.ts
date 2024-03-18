import p5 from "p5";
import { width, height, ox, oy } from "./const";
export let charWidth: number;
export const charHeight = 11;
export const charPadding = 2;
const code =
  // @ts-ignore
  typeof window.c === "undefined"
    ? "dummy"
    : "window.c=`" +
      c
        .replace(/\\/g, "\\\\")
        .replace(/`/g, "\\`")
        .replace(/\n/g, "`+String.fromCharCode(10)+`") +
      "//";
const tail =
  "`;new p5(p=>{window.p=p;Object.assign(p," +
  'new Function(window.c.replaceAll(String.fromCharCode(10),"")' +
  ".replaceAll(String.fromCharCode(126),String.fromCharCode(32))" +
  ".replaceAll(String.fromCharCode(94),String.fromCharCode(10))" +
  ")())})";
let font: p5.Font;
const randTable =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
export let fontGraphics: p5.Graphics;
export let bgGraphics: p5.Graphics;
export let formattedLines: string[];
export let numLines: number;
export let numChars: number;
export function preload() {
  font = p.loadFont("./assets/firple.ttf", () => {
    fontLoaded = true;
  });
}
const getBase = (x: number, y: number) => {
  return Math.floor(y) * numChars + Math.floor(x);
};
export function rect(
  x: number,
  y: number,
  w: number,
  h: number,
  color: number[]
) {
  // bgGraphics.fill(color);
  // bgGraphics.rect(x * charWidth, y * charHeight, charWidth * w, charHeight * h);
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) {
      const base = getBase(x + i, y + j) * 4;
      bgGraphics.pixels[base] = color[0];
      bgGraphics.pixels[base + 1] = color[1];
      bgGraphics.pixels[base + 2] = color[2];
      bgGraphics.pixels[base + 3] = color[3];
    }
  }
}
// const charToPositions = new Map<string, number[]>();
// const charsToGraphics = new Map<string, p5.Graphics>();
// const charsToGraphics: Record<string, p5.Graphics> = {};
const charToPositions: Record<string, number[]> = {};

export function lightUp(chars: string, color: number[]) {
  for (const char of chars) {
    for (const pos of charToPositions[char]!) {
      const x = pos % numChars;
      const y = Math.floor(pos / numChars);
      rect(x, y, 1, 1, color);
    }
  }
}
export function reset() {
  bgGraphics?.clear();
  bgGraphics?.loadPixels();
  // fontGraphics.clear();
}
let drewQuine = false;
let fontLoaded = false;
export function setup() {
  fontGraphics = p.createGraphics(width, height);
}
export function draw() {
  if (!font || !fontGraphics || !fontLoaded || drewQuine) {
    return;
  }

  fontGraphics.textFont(font);
  charWidth = fontGraphics.textWidth("A") - 1;
  if (charWidth <= 0) {
    return;
  }
  numChars = Math.floor(width / charWidth);
  numLines = Math.floor(height / charHeight);
  bgGraphics = p.createGraphics(numChars, numLines);
  bgGraphics.loadPixels();
  const lines = code.match(new RegExp(".{1," + numChars + "}", "g")!);
  if (!lines) {
    throw new Error("lines is null");
  }

  formattedLines = Array.from({ length: numLines }, (_, i) => {
    let text = lines[i] || "";
    while (text.length < numChars) {
      text += randTable[Math.floor(Math.random() * randTable.length)];
    }

    return text;
  });
  // if (formattedLines.length * numChars < code.length) {
  //   console.error("formattedLines.length * numChars (%d) < code.length (%d)", formattedLines.length * numChars, code.length);
  // }
  console.log(
    "formattedLines.length * numChars (%d), code.length (%d)",
    formattedLines.length * numChars,
    code.length
  );

  const tailLines: string[] = [];
  let tempTail = tail;
  while (tempTail.length > numChars) {
    tailLines.unshift(tempTail.slice(tempTail.length - numChars));
    tempTail = tempTail.slice(0, tempTail.length - numChars);
  }
  // formattedLines[formattedLines.length - tailLines.length - 1] =
  //   tempTail.padStart(numChars, "#");
  const lastLine = formattedLines[formattedLines.length - tailLines.length - 1];
  formattedLines[formattedLines.length - tailLines.length - 1] =
    lastLine.slice(0, lastLine.length - tempTail.length) + tempTail;
  for (let i = 0; i < tailLines.length; i++) {
    formattedLines[formattedLines.length - 1 - i] = tailLines[i];
  }
  fontGraphics.background(0);
  fontGraphics.fill(255);
  fontGraphics.textSize(charHeight - charPadding);

  console.log(formattedLines.join("\n"));

  for (const [i, line] of formattedLines.entries()) {
    for (const [j, char] of line.split("").entries()) {
      fontGraphics.text(
        char,
        j * charWidth,
        i * charHeight + (charHeight - charPadding)
      );
    }
  }

  for (let i = 0; i < numLines; i++) {
    for (let j = 0; j < numChars; j++) {
      const char = formattedLines[i][j];
      if (!charToPositions[char]) {
        charToPositions[char] = [];
      }
      charToPositions[char].push(i * numChars + j);
    }
  }
  drewQuine = true;

  // p.shader(shader);
}
