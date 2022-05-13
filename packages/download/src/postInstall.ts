import readPkgJson from "./readJson";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import isNodeModules from "./isNodeModules";
import download, { debug, trace } from "./download";
import binLinks, { getPaths } from "bin-links";

export default async function postInstall(pkgDir: string) {
  const { packageJson, path: pkgPath } = readPkgJson(pkgDir);
  const pkgRoot = path.dirname(pkgPath);
  const {
    "scatter-bin": { downloadUrl, private: _private, bin },
    version,
    name,
  } = packageJson;

  // 0. Compute install parameters
  const inNodeModules = isNodeModules(name);
  const global = !!process.env.npm_config_global;
  // const devInstall = !global && !inNodeModules;
  // if (devInstall) {
  //   throw new Error(
  //     `${name}:binary-install: development mode installation. Skipping postinstall`
  //   );
  // }
  if (_private && !process.env.GITHUB_TOKEN) {
    throw new Error(
      `${name}:binary-install: missing env variable GITHUB_TOKEN, required for private modules`
    );
  }

  const { platform } = process;
  // nodejs platforms: https://nodejs.org/api/os.html#osplatform
  // 'aix', 'darwin', 'freebsd','linux', 'openbsd', 'sunos', and 'win32'.
  // nodejs arch: https://nodejs.org/api/os.html#osarch
  // 'arm', 'arm64', 'ia32', 'mips', 'mipsel', 'ppc', 'ppc64', 's390', 's390x', and 'x64'.
  // CPU: https://nodejs.org/api/os.html#oscpus
  const _os =
    platform === "darwin"
      ? /Apple M1/.test(os.cpus()[0].model)
        ? "mac"
        : "mac_x86"
      : platform === "win32"
      ? "win"
      : "nix";

  // 1. download platform specific binary
  const tgzUrl = `${downloadUrl}/releases/download/${version}/${name
    .split("/")
    .pop()}.${_os}.tar.gz`;
  await download(tgzUrl, pkgRoot, _private);
  trace(`${name}:post-install: downloaded ${tgzUrl}`);

  // for deno packages, it's possible that we don't need to "install" the binary.
  // just position it so a javascript function can invoke it.
  // We can control for this be looking for the "bin" property in scatter-bin config.
  if (packageJson["scatter-bin"].bin) {
    // 2. fix package.json:bin to have the new binaries
    packageJson.bin =
      platform !== "win32"
        ? packageJson["scatter-bin"].bin
        : Object.entries(packageJson["scatter-bin"].bin).reduce(
            (acc: Record<string, string>, [key, val]) => {
              // on windows, binLinks lstats for the bin targets before linking.
              // this fails because extensions are not considered.
              // Manually add the exe extension before invoking binLinks
              if (
                !path.extname(val as string) &&
                fs.statSync(`${path.dirname(pkgPath)}/${val}.exe`)
              ) {
                acc[key] = `${val}.exe`;
              } else {
                acc[key] = val as string;
              }
              return acc;
            },
            {}
          );
    fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2), "utf8");

    // 3. compute link parameters
    const linkParams = {
      path: pkgRoot,
      pkg: packageJson,
      // true if it's a global install, false for local.  default: false
      global,
      // This is what the official example states:
      // true if it's the top level package being installed, false otherwise
      // in reality, there are four cases to unpack:

      // global, top => windows ? `${node-dir}` : `${node-dir}/bin`
      // !global, !top => should not install (at least, we subvert this by returning early)
      // global, top => ${node-dir}/node_modules/.bin` - not something we want.
      // !global, !top => ${pkg_root}/node_modules/.bin

      // so our choices for { global, top } that are accepctable,
      // boil down to
      // # global install
      //  {
      //    global: process.env.npm_config.global
      //    top: true,
      //  }
      // # local dependency install
      //  {
      //    global: !process.env.npm_config.global
      //    top: false,
      //  }
      //
      // Which can be simplified to
      //  {
      //    global: !process.env.npm_config.global
      //    top: !process.env.npm_config.global
      //  }

      top: global,
      // true if you'd like to recklessly overwrite files.
      force: false,
    };
    debug(
      JSON.stringify(
        {
          pkgRoot,
          global,
          packageJson,
          inNodeModules,
          linkParams,
          // getPaths: [
          //   {
          //     global: true,
          //     top: false,
          //     ...getPaths({ ...linkParams, global: true, top: false }),
          //   },
          //   {
          //     global: true,
          //     top: true,
          //     ...getPaths({ ...linkParams, global: true, top: true }),
          //   },
          //   {
          //     global: false,
          //     top: false,
          //     ...getPaths({ ...linkParams, global: false, top: false }),
          //   },
          //   {
          //     global: false,
          //     top: true,
          //     ...getPaths({ ...linkParams, global: false, top: true }),
          //   },
          // ],
        },
        null,
        2
      )
    );
    // 4. link binaries, this is exactly how npm does it.
    await binLinks(linkParams);
    trace(
      `${name}: post-install: ${tgzUrl.replace(/.*download\//, "")}`
    );
  }
}
