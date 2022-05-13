import tar from "tar";
import * as path from "path";
import { Octokit } from "@octokit/rest";
import * as fs from "fs";

export type Platform = "mac" | "mac_x86" | "win" | "nix";

export type Config = {
  owner: string;
  repo: string;
  binRepo: string;
  binPath: string;
  private?: boolean;
  tmpDir: string;
  version: string;
  platforms: Platform[];
};

const trace = (message: string) => {
  console.log(`@scatter-bin/upload: ${message}`);
};

const warn = (message: string) => {
  console.warn(`@scatter-bin/upload: WARNING: ${message}`);
};

export default async function upload(config: Config) {
  const { owner, repo, version } = config;
  const filePaths = await compress(config);
  await ensureRelease(owner, repo, version);
  await uploadArtifacts({ owner, repo, tag: version, filePaths });
}

export async function compress({ binPath, platforms, repo, tmpDir }: Config) {
  // create compressed tar-balls
  const filePaths: string[] = [];
  fs.mkdirSync(tmpDir, { recursive: true });
  for (const platform of platforms) {
    const platformBin = `${binPath}/${platform}`;
    const platformZip = `${tmpDir}/${repo}.${platform}.tar.gz`;
    trace(`compressing ${platformBin} -> ${platformZip}`);
    await tar.create(
      {
        gzip: true,
        file: platformZip,
        cwd: platformBin,
      },
      ['.']
    );
    filePaths.push(platformZip);
  }
  return filePaths;
}

async function uploadArtifacts({
  owner,
  repo,
  tag,
  filePaths,
}: {
  owner: string;
  repo: string;
  tag: string;
  filePaths: string[];
}) {
  const release = await ensureRelease(owner, repo, tag);
  const github = getGithub();
  for (const filePath of filePaths) {
    const assetName = path.basename(filePath);
    if (
      release?.data?.assets?.filter((a: any) => a.name === assetName).length ===
      0
    ) {
      // asset does not exist, upload it
      const uploaded_asset = await github.repos.uploadReleaseAsset({
        url: release.data.upload_url,
        release_id: tag,
        name: assetName,
        data: fs.readFileSync(filePath),
      } as any);
      trace(`uploaded ${assetName}`);
    } else {
      // asset exists, skip it
      warn(`'${assetName}' already exists, skipping`);
    }
  }
}

async function ensureRelease(owner: string, repo: string, tag: string) {
  const github = getGithub();
  try {
    return await github.repos.getReleaseByTag({
      owner,
      repo,
      tag,
    });
  } catch (err) {
    trace(`creating release ${tag}`);
    // create new release here.
    return await github.repos.createRelease({
      owner,
      repo,
      tag_name: tag,
    });
  }
}

function getGithub() {
  let github;
  if (!github) {
    const auth = process.env.GITHUB_TOKEN;
    if (!auth) {
      throw new Error(`ERROR: missing environment variable GITHUB_TOKEN`);
    }
    github = new Octokit({
      auth,
      userAgent: "scatter-bin-uploader",
      baseUrl: "https://api.github.com",
    });
  }
  return github;
}

// here for manual testing
if (true) {
  upload({
    owner: "tufan-io",
    repo: "noun-and-verb",
    binRepo: "https://github.com/tufan-io/noun-and-verb",
    binPath: "./bin",
    private: true,
    tmpDir: "./bin/.tmp",
    version: "0.0.1-alpha",
    platforms: ["mac", "mac_x86", "win", "nix"],
  }).catch(console.error);
}
