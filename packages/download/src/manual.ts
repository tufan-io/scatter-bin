import download from "./download";

download(
  `https://github.com/tufan-io/noun-and-verb/releases/download/0.0.1-alpha/noun-and-verb.mac.tar.gz`,
  `./.tmp`,
  true
)
  .catch(console.error)
  .then(console.log);
