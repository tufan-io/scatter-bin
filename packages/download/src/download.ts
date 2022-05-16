import * as fs from "fs";
import * as https from "https";
import Url from "url";
// import rimraf from "rimraf";
import zlib from "zlib";
const { untar } = require("./untar");

export const debug = (msg: string) =>
  !!process.env.SCATTER_BIN_DEBUG && console.log(`[SCATTER_BIN_DEBUG] ${msg}`);

export const trace = (message: string) => {
  if (process.env.npm_config_loglevel !== "silent") {
    console.log(message);
  }
};

const httpsGet = async function (
  url: string,
  _private?: boolean,
  redirects = 0
) {
  return new Promise<Buffer>((resolve, reject) => {
    const data: Buffer[] = [];
    // const data = new Blob();
    
    debug(`fetching ${url}`);
    const {} = Url.parse(url);
    const headers = _private
      ? {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        }
      : undefined;
    https
      .get(
        url.replace(/^https:\/\//, `https://${process.env.GITHUB_TOKEN}@`),
        (res) => {
          const { statusCode, headers } = res;
          debug(
            `statusCode ${JSON.stringify({ statusCode, headers }, null, 2)}`
          );
          if (!statusCode) {
            reject({ url, response: res });
          }
          // handle redirects, we'll limit to 10, but really it should be much smaller - 1 or 2 at most.
          if (
            (res.statusCode === 301 || res.statusCode === 302) &&
            redirects < 10
          ) {
            const { location } = headers;
            debug(
              `redirect: ${JSON.stringify(
                { statusCode, headers, url, redirects },
                null,
                2
              )}`
            );
            return httpsGet(location!, _private, redirects + 1)
              .then(resolve)
              .catch(reject);
          } else if (400 <= statusCode!) {
            const {
              headers,
              trailers,
              // aborted,
              // upgrade,
              method,
              statusCode,
              statusMessage,
            } = res;
            const details = {
              url,
              headers,
              trailers,
              // aborted,
              // upgrade,
              method,
              statusCode,
              statusMessage,
            };
            const err = new Error(
              `${statusCode} ${statusMessage}\n${JSON.stringify(
                details,
                null,
                2
              )}`
            );
            reject(err);
          }
          res.on("data", (chunk) => {
            data.push(chunk);
          });
          res.on("end", () => {
            resolve(Buffer.concat(data));
          });
        }
      )
      .on("error", (err) => {
        reject(err);
      });
  });
};

export default async function download(
  tgzUrl: string,
  dstDir: string,
  _private?: boolean
) {
  const tgzBuffer = await httpsGet(tgzUrl, _private);
  // rimraf.sync(dstDir);
  fs.mkdirSync(dstDir, { recursive: true });
  const unzipped = zlib.unzipSync(tgzBuffer);
  debug(`unzip release asset - success`);
  const files = untar(unzipped, dstDir);
  debug(`untar release asset - success`);
  return files;
}

// download(
//   //  `https://github.com/tufan-io/noun-and-verb/releases/download/0.0.1-alpha/noun-and-verb-0.0.1-alpha.tgz`,
//   `https://github.com/tufan-io/noun-and-verb/releases/download/0.0.1-alpha/noun_and_verb.0.0.1-alpha.mac_m1.tar.gz`,
//   `./.tmp/dwn`,
//   true
// )
//   .catch(console.error)
//   .then(console.log);
