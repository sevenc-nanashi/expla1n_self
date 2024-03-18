import { draw, setup, preload } from "./index";

// @ts-ignore
new window.p5((p) => {
  // @ts-ignore
  window.p = p;
  p.preload = preload;
  p.setup = setup;
  p.draw = draw;
});
