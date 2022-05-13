"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path = tslib_1.__importStar(require("path"));
const fs = tslib_1.__importStar(require("fs"));
function readPkgJson(dir) {
    const pkgPath = `${path.resolve(dir).replace(/\\/g, "/")}/package.json`;
    const raw = fs.readFileSync(pkgPath, "utf8");
    return {
        packageJson: JSON.parse(raw),
        path: pkgPath,
    };
}
exports.default = readPkgJson;
