import fs from "node:fs";
import path from "node:path";

// 1. Patch OpenNext package load-manifest plugin
const openNextPlugin = path.resolve(
  "node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/load-manifest.js"
);

if (fs.existsSync(openNextPlugin)) {
  let content = fs.readFileSync(openNextPlugin, "utf8");
  let modified = false;

  // Add preview-props to manifests glob
  if (
    content.includes("**/{*-manifest,required-server-files,prefetch-hints}.json")
  ) {
    content = content.replace(
      "**/{*-manifest,required-server-files,prefetch-hints}.json",
      "**/{*-manifest,required-server-files,prefetch-hints,preview-props}.json"
    );
    modified = true;
  }

  // Add preview-props to fallback list
  if (
    content.includes('p.endsWith("prefetch-hints"))') &&
    !content.includes('p.endsWith("preview-props"))')
  ) {
    content = content.replace(
      'p.endsWith("prefetch-hints"))',
      'p.endsWith("prefetch-hints") || p.endsWith("preview-props"))'
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(openNextPlugin, content, "utf8");
    console.log("Patched @opennextjs/cloudflare load-manifest.js plugin.");
  } else {
    console.log("@opennextjs/cloudflare plugin is up-to-date.");
  }
}

// 2. Patch existing .open-next handler if present
const handlerFile = path.resolve(
  ".open-next/server-functions/default/handler.mjs"
);
if (fs.existsSync(handlerFile)) {
  let handlerContent = fs.readFileSync(handlerFile, "utf8");
  if (
    handlerContent.includes('p.endsWith("prefetch-hints"))return{}}') &&
    !handlerContent.includes('p.endsWith("preview-props")')
  ) {
    handlerContent = handlerContent.replace(
      'p.endsWith("prefetch-hints"))return{}}',
      'p.endsWith("prefetch-hints")||p.endsWith("preview-props"))return{}}'
    );
    fs.writeFileSync(handlerFile, handlerContent, "utf8");
    console.log("Patched .open-next/server-functions/default/handler.mjs.");
  } else {
    console.log(".open-next handler is up-to-date.");
  }
}
