import * as path from "path";

export default function isNodeModules(name: string) {
  // if grand-parent directory is "node_modules", we are being installed in node_modules
  // this is sufficient to know if we are a top module in most cases.
  // Only misses the case where a module is being installed manually within node_modules
  // from a git clone. Given we should be installing binaries, this is even less
  // probable to trigger a false alarm.
  const scopedName = name.split("/").length === 2;
  return scopedName
    ? __dirname.split(path.sep).slice(-3, -1)[0] === "node_modules"
    : __dirname.split(path.sep).slice(-2, -1)[0] === "node_modules";
}
