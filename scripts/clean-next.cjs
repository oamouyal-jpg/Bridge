const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function rmQuiet(relative) {
  const target = path.join(root, ...relative.split("/"));
  try {
    fs.rmSync(target, {
      recursive: true,
      force: true,
      maxRetries: 12,
      retryDelay: 250,
    });
    console.log("Removed", relative);
  } catch (e) {
    if (e && e.code !== "ENOENT") throw e;
  }
  if (fs.existsSync(target)) {
    console.warn(
      "Warning: still exists after delete (close VS Code terminals running `next dev`, then retry):",
      relative
    );
  }
}

console.log("Cleaning Next.js caches (stop `npm run dev` first on Windows)…");
rmQuiet(".next");
rmQuiet("node_modules/.cache");
rmQuiet(".turbo");
