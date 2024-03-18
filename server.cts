import http from "http";
import esbuild from "esbuild";
import fs from "fs/promises";
import serveHandler from "serve-handler";

const server = http.createServer(async (request, response) => {
  if (request.url === "/") {
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end(await fs.readFile("index.html"));
    return;
  } else if (request.url === "/assets/index.js") {
    response.writeHead(200, {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-store",
    });
    response.end(await fs.readFile("./assets/index.js"));
    return;
  } else {
    serveHandler(request, response);
  }
});

server.listen(
  {
    port: 3141,
    host: "0.0.0.0",
  },
  async () => {
    console.log("Running at http://localhost:3000");
    const ctx = await esbuild.context({
      entryPoints: ["src/index.ts"],
      bundle: true,
      minify: true,
      format: "iife",
      write: false,
      globalName: "main",
      plugins: [
        {
          name: "quinize",
          setup(build) {
            build.onEnd(async (result) => {
              if (!result.outputFiles) {
                return;
              }
              const indexJs = result.outputFiles[0];
              const content = indexJs.text
                .trim()
                .replace(/.+?\{/, "")
                .replace(/\}\)\(\);$/, "")
                .replace(/\\/g, "\\\\")
                .replace(/`/g, "\\`")
                .replace(/\n/g, "^")
                .replace(/ /g, "~");

              const wrapped =
                `window.c=\`content\`;new p5(p=>{window.p=p;Object.assign(p,new Function(` +
                `window.c.replaceAll(String.fromCharCode(10),"")` +
                `.replaceAll(String.fromCharCode(126),String.fromCharCode(32))` +
                `.replaceAll(String.fromCharCode(94),String.fromCharCode(10))` +
                `)())})`;
              await fs.writeFile(
                "assets/index.js",
                wrapped.replace("content", content)
              );
              console.log("Build done");
            });
          },
        },
      ],
    });
    ctx.watch({});
  }
);
