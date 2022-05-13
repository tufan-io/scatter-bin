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
        "postversion": "build_bin && scatter-bin-release"  
      },
    ```

### `scatter-bin-release`:
  - ensure no staged/unstaged changes
  - tag source repo with version
  - clone bin-repo
  - fix package.json:version to match source repo
  - commit package.json
  - tag bin repo with version
  - create release at version
  - push changes to origin
  - make release at version
  - upload compressed binaries
  - publish binary repo to npm

... sip a Piña Colada and appreciate the beauty of this automation!
