import { resolve } from "path";
import readline from "readline";
import semver from "semver";
import colors from "ansi-colors";

export default async function confirmVersion(version: String) {
  console.log(
    `${colors.dim(`Will upload as version:`)} ${colors.bold(`${version}`)}`
  );
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const ask = async () =>
    new Promise((res, rej) => {
      rl.question(colors.bold(`Enter new version:`), (answer: string) => {
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
