"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compress = void 0;
const tslib_1 = require("tslib");
const tar_1 = tslib_1.__importDefault(require("tar"));
const path = tslib_1.__importStar(require("path"));
const rest_1 = require("@octokit/rest");
const fs = tslib_1.__importStar(require("fs"));
const trace = (message) => {
    console.log(`@scatter-bin/upload: ${message}`);
};
const warn = (message) => {
    console.warn(`@scatter-bin/upload: WARNING: ${message}`);
};
async function upload(config) {
    const { owner, repo, version } = config;
    const filePaths = await compress(config);
    await ensureRelease(owner, repo, version);
    await uploadArtifacts({ owner, repo, tag: version, filePaths });
}
exports.default = upload;
async function compress({ binPath, platforms, repo, tmpDir }) {
    // create compressed tar-balls
    const filePaths = [];
    fs.mkdirSync(tmpDir, { recursive: true });
    for (const platform of platforms) {
        const platformBin = `${binPath}/${platform}`;
        const platformZip = `${tmpDir}/${repo}-${platform}.tar.gz`;
        trace(`compressing ${platformBin} -> ${platformZip}`);
        await tar_1.default.create({
            gzip: true,
            file: platformZip,
        }, [platformBin]);
        filePaths.push(platformZip);
    }
    return filePaths;
}
exports.compress = compress;
async function uploadArtifacts({ owner, repo, tag, filePaths, }) {
    const release = await ensureRelease(owner, repo, tag);
    const github = getGithub();
    for (const filePath of filePaths) {
        const assetName = path.basename(filePath);
        if (release?.data?.assets?.filter((a) => a.name === assetName).length ===
            0) {
            // asset does not exist, upload it
            const uploaded_asset = await github.repos.uploadReleaseAsset({
                url: release.data.upload_url,
                release_id: tag,
                name: assetName,
                data: fs.readFileSync(filePath),
            });
            trace(`uploaded ${assetName}`);
        }
        else {
            // asset exists, skip it
            warn(`'${assetName}' already exists, skipping`);
        }
    }
}
async function ensureRelease(owner, repo, tag) {
    const github = getGithub();
    try {
        return await github.repos.getReleaseByTag({
            owner,
            repo,
            tag,
        });
    }
    catch (err) {
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
        github = new rest_1.Octokit({
            auth,
            userAgent: "scatter-bin-uploader",
            baseUrl: "https://api.github.com",
        });
    }
    return github;
}
// here for manual testing
// if (true) {
//   upload({
//     owner: "tufan-io",
//     repo: "noun-and-verb",
//     binRepo: "https://github.com/tufan-io/noun-and-verb",
//     binPath: "./bin",
//     private: true,
//     tmpDir: "./.tmp",
//     version: "0.0.1-alpha",
//     platforms: ["mac", "mac_x86", "win", "nix"],
//   }).catch(console.error);
// }
