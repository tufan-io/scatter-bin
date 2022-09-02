const sh = require("shelljs");
const fs = require("fs");
const color = require("ansi-colors");

async function main(dir = process.cwd()) {
  // ensure no staged/unstaged changes in src repo
  gitClean(dir);

  // read from scatter-bin config in package.json
  const srcPkgJson = JSON.parse(fs.readFileSync(`${dir}/package.json`, "utf8"));
  const binRepo = srcPkgJson["scatter-bin"].binRepo;
  const binPath = srcPkgJson["scatter-bin"].binPath;

  // clone bin-repo to .tmp
  sh.mkdir("-p", "./.tmp", { cwd: dir });
  const binRepoDir = `${dir}/.tmp/${binRepo.split("/").pop()}`;
  sh.exec(`git clone ${binRepo} ./.tmp/.`);
  const binPkgJson = JSON.parse(
    fs.readFileSync(`${dir}/.tmp/${binPath}/package.json`, "utf8")
  );

  // get version - assume src repo version as starting point
  const version = await confirmVersion(srcPkgJson.version);

  // verify that both repos do not have this version, verified via tags.
  await verifyReleasableVersion(version, binRepoDir, dir);
  // conditionally update package.json:versions and commit the change
  writeAndCommitPkgJson(dir, srcPkgJson, version);
  writeAndCommitPkgJson(binRepoDir, binPkgJson, version);

  // tag repos
  makeTag(dir, version);
  makeTag(binRepoDir, version);

  // TODO: upload
  
  // publishing the module itself is outside this scope.
}

async function gitClean(cwd) {
  if (!((await sh.exec(`git status --porcelain`, { cwd })) === "")) {
    console.log(color.red("Please commit your changes before releasing"));
    process.exit(-1);
  }
}

async function confirmVersion(version) {
  console.log(
    `${colors.dim(`Will upload as version:`)} ${colors.bold(`${version}`)}`
  );
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const ask = async () =>
    new Promise((resolve) => {
      rl.question(colors.bold(`Enter new version:`), (answer) => {
        answer = answer !== "" ? answer : `${version}`;
        if (semver.valid(answer)) {
          rl.close();
          console.log(colors.green(`Will upload as release '${answer}'`));
          resolve(answer);
        } else {
          console.log(colors.red(`Invalid version, please try again`));
          return ask();
        }
      });
    });
  return ask();
}

async function verifyReleasableVersion(version, binRepoDir, dir) {
  if (!(await isNewTag(binRepoDir, version))) {
    console.log(
      `${colors.red(`Version ${version} already exists on bin repo`)}`
    );
    process.exit(-1);
  }
  if (!(await isNewTag(dir, version))) {
    console.log(
      `${colors.red(`Version ${version} already exists on src repo`)}`
    );
    process.exit(-1);
  }
}

async function isNewTag(cwd, tag) {
  const tags = sh.exec(`git tag -l`, { cwd });
  return !tags.includes(tag);
}

async function writeAndCommitPkgJson(dir, pkgJson, version) {
  if (pkgJson.version !== version) {
    pkgJson.version = version;
    fs.writeFileSync(
      `${dir}/package.json`,
      JSON.stringify(pkgJson, null, 2),
      "utf8"
    );
    sh.exec(`git add package.json`, { cwd: dir });
    sh.exec(`git commit -m "chore: bump version ${version}"`, { cwd: dir });
    sh.exec(`git push`, { cwd: dir });
  }
}

async function makeTag(dir, version) {
  sh.exec(`git tag ${version}`, { cwd: dir });
  sh.exec(`git push origin ${version}`, { cwd: dir });
}
