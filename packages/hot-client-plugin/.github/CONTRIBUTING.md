# Contributing to Hot Client Plugin

Loving Hot Client Plugin and want to get involved? Thanks! There are plenty of ways you can help.

Please take a moment to review this document in order to make the contribution process easy and effective for everyone involved.

Following these guidelines helps to communicate that you respect the time of the developers managing and developing this open source project. In return, they should reciprocate that respect in addressing your issue or assessing patches and features.

## Code guidelines

The Hot Client Plugin has its own code style configured with `eslint`. Please, use your favourite editor's [appropriate plugin](https://eslint.org/docs/user-guide/integrations) to enable `eslint` hits.

Also, there is a `pre-commit` git hook exists to check for code style before commit.

## Submitting a Pull Request

Good pull requests, such as patches, improvements, and new features, are a fantastic help. They should remain focused in scope and avoid containing unrelated commits.

Please **ask first** if somebody else is already working on this or the core developers think your feature is in-scope for Hot Client Plugin. Generally always have a related issue with discussions for whatever you are including.

Please also provide a **test plan**, i.e. specify how you verified that your addition works.

## Folders and Files Decription
```
.github/                                - github related files
  ISSUE_TEMPLATE/                       - github issue templates
    bug_report.md                       - bug report template
    feature_request.md                  - feature request template
lib/                                    - actual plugin files
  __tests__/                            - unit tests folder
    HotClientPlugin.test.js             - unit tests for Hot Client Plugin
  HotCLient.js                          - Hot Client injected to browser
  HotClientPlugin.js                    - actual Hot Client Plugin code
.eslintrc.js                            - code style configuration
.gitignore                              - files git should ignore
.travis.yml                             - Travis CI configuration file
CODE_OF_CONDUCT.md                      - assumed contributors code of conduct (enforced)
CONTRIBUTING.md                         - contributing guide (current file)
LICENSE                                 - software LICENSE
package-lock.json                       - packages lock file
package.json                            - NPM package file
README.md                               - useful quick to read information
```
## Setting Up a Local Copy

1. Clone the repo with `git clone https://github.com/maxim-andrews/hot-client-plugin`;
2. Run `npm install` and `npm i webpack --no-save` in the root `hot-client-plugin` folder.

Once it is done, you can modify any file locally and run `npm test` to process plugin's unit tests.

If you are looking to test modified plugin code in specific setup you have to run `npm link` in the cloned `hot-client-plugin` folder to notify `npm` of your local package. Then you have to run `npm link hot-client-plugin` in the folder of the project you are looking to test modifications.

After this you can `require` plugin as you would do with average npm package installed from `npmjs.com` or other npm package registry.

## Tips for contributors using Windows

### Line endings

By default git would use `CRLF` line endings which would cause the scripts to fail. You can change it for this repo only by setting `autocrlf` to false by running `git config core.autocrlf false`. You can also enable it for all your repos by using the `--global` flag if you wish to do so.

*Many thanks to [facebook](https://raw.githubusercontent.com/facebook/create-react-app/next/CONTRIBUTING.md) for the inspiration with this contributing guide*
