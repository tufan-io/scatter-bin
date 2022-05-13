"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
/**
 * @scatter-bin/upload expects that each platform desired to be supported
 * has a directory under `binDir` dedicated to it. This allows for any
 * platform specific dependencies (e.g. native modules with pkg) to be
 * included in the tarball that is uploaded to the release directory.
 */
function validateDir(binDir, platforms) {
    const errors = [
        `Incorrect directory structure for binDir - ${binDir}`,
    ];
    platforms.forEach((platform) => {
        const stat = fs.statSync(`${binDir}/${platform}`);
        if (!stat.isDirectory) {
            errors.push(`  ${binDir}/${platform} is not a directory`);
        }
    });
    if (errors.length > 1) {
        throw new Error(errors.join("\n"));
    }
}
exports.default = validateDir;
