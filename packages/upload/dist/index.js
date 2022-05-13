"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const getUploadConfig_1 = tslib_1.__importDefault(require("./getUploadConfig"));
const readPkgJson_1 = tslib_1.__importDefault(require("./readPkgJson"));
const upload_1 = tslib_1.__importDefault(require("./upload"));
const validateDir_1 = tslib_1.__importDefault(require("./validateDir"));
async function default_1(pwd) {
    const pkgJson = (0, readPkgJson_1.default)(pwd);
    const config = (0, getUploadConfig_1.default)(pkgJson);
    (0, validateDir_1.default)(config.binPath, config.platforms);
    return (0, upload_1.default)(config);
}
exports.default = default_1;
