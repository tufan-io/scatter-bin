# @scatter-bin

scatter-bin helps distribute cross platform binaries via npm.

It assumes that you have already created binaries via either [`pkg`](https://www.npmjs.com/package/pkg) or even [`deno compile`](https://deno.land/manual/tools/compiler).

It assumes you have two repos - 
1. source repo
2. binary repo

## Getting started

1. Create some source only npm/deno module
   - `npm install --save-dev @scatter-bin/upload`
2. Create necessary binary packages with either `pkg` or `deno compile`
3. Configure `scatter-bin` in source modules package.json
   ```json
    "scatter-bin": {
      "url": "https://github.com/{owner}/{repo}"
      "private": false,
      "binPath": "./bin",
      "variants": ["mac", "mac_m1", "win", "nix"]
    },
  ```
4. Create a binary repo - which can appropriately invoke the binary
   - ensure this repo is available on github
   - `npm install --save-dev @scatter-bin/download`
   - NOTE: this will create a file - `./scripts/post-install.js`
5. Configure `scatter-bin` in binary modules package.json
  ```json
    "scatter-bin": {
      "url": "https://github.com/{owner}/{repo}"
      "private": false
    },
    "version": "{version}",
    "scripts": {
      "postinstall": "./scripts/post-install.js"
    }
  ```
6. Create and configure GITHUB_TOKEN as appropriate 
   - ```export GITHUB_TOKEN=xxx```
   - source repo: required for upload
   - binary repo: required for private modules
7. In source repo,
  ```
  npx scatter-bin-upload
  ```

When your binary modules execute `npm install binary-module`, the `scripts/post-install.js`
will download, un-compress and create appropriate bin-links, with the platform specific
binary.

## Why do we need this?

Both `pkg` and `deno` binaries very quickly tend towards 100MB in size per platform. 
Once we have decided to distribute binaries, we want improve the user experience by 
reducing both:
1. the download/install time
2. the disk-space consumed. 

`scatter-bin` is inspired by node-pre-gyp, but skips the build if binary not found step. 



## Where are the files hosted?
Currently, `scatter-bin` only supports hosting the module on github. 

[Github releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases#storage-and-bandwidth-quotas) offers a very generous quota:
> Each file included in a release must be under 2 GB. There is no limit on the total size of a release, nor bandwidth usage.



## Which platforms are supported?

`scatter-bin` currently supports upto 4 variants
 - `mac`
 - `mac_m1`
 - `win`
 - `nix`

Because we auto-detect the platform on the download, these variants are hard coded.
Currently, using deno to create pre-compiled binaries is our preferred mechanism - and
these are the four binaries generate-able via `deno compile`



## How does `scatter-bin` work?
`scatter-bin` consists of two modules - `@scatter-bin/upload` and `@scatter-bin/download`.

### `@scatter-bin/upload`
Given a set of binary files (or directories), this is responsible for creating 
tarballs and uploading it to a github release in a specified repo. 

#### Config

##### `package.json`

```json
  "scatter-bin": {
    "url": "https://github.com/{owner}/{repo}"
    "private": false,
    "binPath": "./bin",
    "variants": ["mac", "mac_m1", "win", "nix"]
  },
  "version": "{version}"
```

##### Environment variable
For uploading artifacts, `scatter-bin` expects an environment variable `process.env.GITHUB_TOKEN`
to have been configured correctly


### `@scatter-bin/download`

`@scatter-bin/download` is installed as a dev-dependency in the target binary repo. 
It installs a bundles (no-dependency) script as `scripts/post-install.js` and 
adds a `postinstall` run-script that invokes this script.

#### Config (in binary repo)

##### `package.json`

```json
  "scatter-bin": {
    "url": "https://github.com/{owner}/{repo}"
    "private": false
  },
  "version": "{version}",
  "scripts": {
    "postinstall": "./scripts/scatter-bin-download.js"
  }
```

##### Environment variable
When downloading artifacts from private github repos, `scatter-bin` expects an environment 
variable `process.env.GITHUB_TOKEN` to have been configured correctly
