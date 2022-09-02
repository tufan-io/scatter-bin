# @scatter-bin/release

>
> This module is a work-in-progress. 
> If you are seeing this notice, the rest of this document is aspirational 
>

Automates the orchestration between the source and binary repos when making 
releases using scatter-bin.

## Release Orchestration

- commit changes to source repo.
- use `npm version` to bump the version (select appropriately)
- implement a `postversion` run-script
  
    ```
      "scripts": {
        "postversion": "build_bin && scatter-bin-release && scatter-bin-upload"  
      },
    ```

### `scatter-bin-release`:
  - ensure no staged/unstaged changes in src repo
  - clone bin-repo to .tmp
  - confirm version to release
  - ensure this version is not current version of bin-repo
  - set bin-repo version (change & commit)
  - tag source-repo with version
  - tag bin-repo with version
  - push changes to origin (both src and bin repos)
  - run scatter-bin-upload, which creates a release on the bin-repo
  - publish the bin-repo to npm registry of choice
  
... sip a Piña Colada and appreciate the beauty of this automation!
