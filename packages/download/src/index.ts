import postInstall from "./postInstall";
// import { realpathSync } from "fs";
// import { pathToFileURL } from "url";

// function wasCalledAsScript() {
//     // We use realpathSync to resolve symlinks, as cli scripts will often
//     // be executed from symlinks in the `node_modules/.bin`-folder
//     const realPath = realpathSync(process.argv[1]);

//     // Convert the file-path to a file-url before comparing it
//     const realPathAsUrl = pathToFileURL(realPath).href;

//     return import.meta.url === realPathAsUrl;
// }

if (!module.parent) {
  // if (!process.env['npm_config_argv']) {
  //   console.log('This is meant to be run from within npm script.');
  // } else {
  postInstall(process.cwd()).catch(console.error);
  // }
}
