import p5 from "p5";
import * as quine from "./quine";

let vs = `
precision highp float;

attribute vec3 aPosition;

void main() {
   vec4 positionVec4 = vec4(aPosition, 1.0);

   gl_Position = positionVec4;
}
`;

let fs = `
precision highp float;

uniform sampler2D fontTex;
uniform vec2 resolution;
uniform sampler2D otherTex;
uniform sampler2D invertTex;
uniform vec2 charSize;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  uv.y = 1.0 - uv.y;
  vec2 revXy = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
  vec2 xy = floor(revXy / charSize) * charSize + charSize / 2.0;
  vec2 uv2 = xy / resolution;
  vec4 fontColor = texture2D(fontTex, uv);
  vec4 otherColor = texture2D(otherTex, uv2);
  vec4 invertColor = texture2D(invertTex, uv2);

  // gl_FragColor = vec4(otherColor.rgb, fontColor.a);
  // gl_FragColor = vec4(1.0, 0.0, 1.0, fontColor.r);
  vec4 bgColor = vec4(otherColor.rgb * 0.1, 1.0);
  vec4 fgColor = mix(vec4(1.0, 1.0, 1.0, 1.0), otherColor, 0.9);
  gl_FragColor = mix(bgColor, fgColor, mix(fontColor.r, 1.0 - fontColor.r * 0.5, invertColor.r));
  // gl_FragColor = fontColor;
}
`;
// let fs = `
// precision highp float;

// uniform sampler2D fontTex;
// uniform vec2 resolution;
// uniform sampler2D otherTex;
// uniform sampler2D invertTex;
// uniform vec2 charSize;

// void main() {
//   vec2 xy = floor(gl_FragCoord.xy / charSize) * charSize + charSize / 2.0;

//   vec2 uv = gl_FragCoord.xy / resolution.xy;
//   uv.y = 1.0 - uv.y;
//   vec2 uv2 = xy / resolution;
//   uv2.y = 1.0 - uv2.y;

//   vec4 otherColor = texture2D(fontTex, uv);
//   gl_FragColor = mix(vec4(mod(floor(gl_FragCoord.xy / charSize + vec2(0.0, 0.5)), 2.0) * 0.5, 0.0, 1.0), otherColor, 0.5);
// }
// `;

let shader: p5.Shader;

export function preload() {
  shader = p.createShader(vs, fs);
}

export function draw(otherGraphics: p5.Graphics, invertGraphics: p5.Graphics) {
  p.shader(shader);
  shader.setUniform("fontTex", quine.fontGraphics);
  shader.setUniform("resolution", [p.width, p.height]);
  shader.setUniform("otherTex", otherGraphics);
  shader.setUniform("invertTex", invertGraphics);
  shader.setUniform("charNum", [quine.numChars, quine.numLines]);
  shader.setUniform("charSize", [quine.charWidth, quine.charHeight]);
  p.quad(-1, -1, 1, -1, 1, 1, -1, 1);
  p.resetShader();
}
