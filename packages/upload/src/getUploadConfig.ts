import { Config } from "./upload";

export default function (pkgJson: any): Config {
  const scatterBin = pkgJson["scatter-bin"];
  if (!scatterBin) {
    throw new Error("scatter-bin upload not found in package.json");
  }

  const {
    binRepo,
    binPath,
    private: _private,
    variants,
    tmpDir,
  } = {
    binPath: "./bin",
    variants: ["mac", "mac_x86", "win", "nix"],
    tmpDir: "./bin/.tmp",
    ...scatterBin,
  } as any;

  const { version } = pkgJson.version;
  if (!binRepo || !version) {
    throw new Error("package.json is missing scatter-bin.binRepo and version");
  }
  
  const { owner, repo } = binRepo.match(
    /.*github.com\/<?owner>([^\/]+)\/<?repo>([^\/]+)\/?/
  )?.groups;
  return {
    owner,
    repo,
    binRepo,
    binPath,
    private: _private,
    platforms: variants,
    version,
    tmpDir,
  };
}
