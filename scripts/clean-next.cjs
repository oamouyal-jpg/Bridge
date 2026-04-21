const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

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

/**
 * Kill any `node` process that's currently holding `.next/` open (typically a
 * lingering `next dev`). Without this, the `.next` dir can't be removed on
 * Windows because Next keeps file handles, and you end up in the loop where
 * the browser still sees chunks from the old bundle.
 */
function killDevServers() {
  if (process.platform !== "win32") return;
  let csv = "";
  try {
    // tasklist /v returns a CSV with the full window title for each process.
    // We then grep for "next dev" / "start-server.js" in `wmic` output because
    // `tasklist` alone doesn't show the command line. `wmic` is built in on
    // every Windows 10/11 / Server.
    csv = execSync(
      'wmic process where "name=\'node.exe\'" get ProcessId,CommandLine /format:csv',
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    );
  } catch {
    return;
  }
  const selfPid = process.pid;
  const pids = [];
  for (const line of csv.split(/\r?\n/)) {
    // Only match processes that look like a running Next dev server. We
    // deliberately do NOT match on "next" alone because this script itself is
    // named `clean-next.cjs` and would be caught (we'd commit suicide).
    const isNextDev =
      /[\\\/]next[\\\/]dist[\\\/]bin[\\\/]next/i.test(line) ||
      /[\\\/]next[\\\/]dist[\\\/]server[\\\/]lib[\\\/]start-server/i.test(line);
    if (!isNextDev) continue;
    const m = line.match(/,(\d+)\s*$/);
    if (!m) continue;
    const pid = Number(m[1]);
    if (pid === selfPid) continue;
    pids.push(pid);
  }
  for (const pid of pids) {
    try {
      process.kill(pid);
      console.log("Stopped next dev (pid", pid + ")");
    } catch {
      /* already gone */
    }
  }
}

console.log("Cleaning Next.js caches…");
killDevServers();
rmQuiet(".next");
rmQuiet("node_modules/.cache");
rmQuiet(".turbo");
