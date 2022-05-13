import * as fs from "fs";
import { Platform } from "./upload";


/**
 * @scatter-bin/upload expects that each platform desired to be supported
 * has a directory under `binDir` dedicated to it. This allows for any
 * platform specific dependencies (e.g. native modules with pkg) to be 
 * included in the tarball that is uploaded to the release directory.
 */
export default function validateDir(binDir: string, platforms: Platform[] ) {
  const errors: string[] = [
    `Incorrect directory structure for binDir - ${binDir}`,
  ];

  platforms.forEach((platform) => {
    const stat = fs.statSync(`${binDir}/${platform}`);
    if (!stat.isDirectory) {
      errors.push(`  ${binDir}/${platform} is not a directory`);
    }
  })

  if (errors.length > 1) {
    throw new Error(errors.join("\n"));
  }
}