import getUploadConfig from "./getUploadConfig";
import readPkgJson from "./readPkgJson";
import upload from "./upload";
import validateDir from "./validateDir";

export default async function(pwd: string) {
  const pkgJson = readPkgJson(pwd);
  const config = getUploadConfig(pkgJson.packageJson);
  validateDir(config.binPath, config.platforms);
  return upload(config);
}
