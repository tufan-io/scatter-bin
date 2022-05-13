import * as path from "path";
import * as fs from "fs";

export default function readPkgJson(dir: string) {
  const pkgPath = `${path.resolve(dir).replace(/\\/g, "/")}/package.json`;
  const raw = fs.readFileSync(pkgPath, 'utf8');
  return {
    packageJson: JSON.parse(raw),
    path: pkgPath,
  };
}

