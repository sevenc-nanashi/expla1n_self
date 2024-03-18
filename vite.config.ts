import { defineConfig } from "vite";
export default defineConfig({
  server: {
    port: 3141,
  },
  plugins: [
    {
      name: "fix-imports",
      transformIndexHtml(html) {
        return html
          .replace('"assets/index.js"', '"src/loader.ts" type="module"')
          .replace("p5.js", "p5.min.js")
          .replace("p5.sound.js", "p5.sound.min.js");
      },
    },
  ],
});
