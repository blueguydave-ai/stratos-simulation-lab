import { cpSync, mkdirSync, rmSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });
for (const path of ["index.html", "app.js", "styles.css", "src"]) {
  cpSync(path, "dist/" + path, { recursive: true });
}
console.log("STRATOS static frontend prepared in dist/");
