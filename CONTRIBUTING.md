# Contributing

:+1: :tada: First off, thanks for taking the time to contribute! :tada: :+1:

The following is a set of rules for contributing.

## Table Of Contents

[Code of Conduct](#code-of-conduct)

[How Can I Contribute?](#how-can-i-contribute)

* [Reporting Bugs](#reporting-bugs)
* [Your First Code Contribution](#your-first-code-contribution)
* [Merge Requests](#merge-requests)

[Styleguides](#styleguides)

* [Git Commit Messages](#git-commit-messages)
* [JavaScript Styleguide](#javascript-styleguide)
* [Tests Styleguide](#tests-styleguide)
* [Documentation Styleguide](#documentation-styleguide)

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [support@itential.com](mailto:support@itential.com).

## How to Contribute

### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers understand your report :pencil:, reproduce the behavior :computer: :left_right_arrow: :computer:, and find related reports :mag_right:.

Before creating bug reports, please check [this list](#before-submitting-a-bug-report) as you might find out that you don't need to create one. When you are creating a bug report, please [include as many details as possible](#how-do-i-submit-a-good-bug-report). If you have an Itential support contract, please create an Itential Service Desk ticket. If you don't have an Itential support contract, please send an email of the issue to [support@itential.com](mailto:support@itential.com).

#### Before Submitting A Bug Report

* **Check the [User Guide](README.md).** You might be able to find the cause of the problem and fix things yourself. Most importantly, check if you can reproduce the problem __in the latest version__.
* **Work through the troubleshooting process.** Troubleshooting will include changing the log level of Itential Automation Platform (IAP) and adapters and checking the logs to see what the issues are. These logs should be included in any ticket you open for this issue.
* **Check for resolutions to the issue.** Check the [Itential Knowledge Base](https://itential.atlassian.net/servicedesk/customer/kb/view/286883841?applicationId=605994d2-2cb2-3174-af59-ed5b23ff5fd5&spaceKey=PKB&src=1187380921) to see if there is a known resolution for the issue you are having.
* **Ask around in chat if you are an Itential employee** to see if others are experiencing the same issue.

#### How to Submit a (Good) Bug Report

Bugs are tracked through the Itential Service Desk. Explain the problem and include additional details to help maintainers reproduce the problem:

* **Use a clear and descriptive title** for the issue to identify the problem.
* **Describe the exact steps which reproduce the problem** in as much detail as possible. For example, start by explaining how you configured the adapter (e.g., which properties you used and how they were set) or how you are using an artifact.
* **Provide specific examples to demonstrate the steps**. Include logs, or copy/paste snippets, in your examples.
* **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
* **Explain which behavior you expected to see instead and why.**
* **Include screenshots and animated GIFs** which show you following the described steps and clearly demonstrate the problem. You can use [this tool](https://www.cockos.com/licecap/) to record GIFs on macOS and Windows. Use [this tool](https://github.com/colinkeenan/silentcast) or [program](https://github.com/rhcarvalho/byzanz-guiz) on Linux.
* **If the problem wasn't triggered by a specific action**, describe what you were doing before the problem happened and share more information using the guidelines below.

Provide more context by answering these questions:

* **Did the problem start happening recently** (e.g. after updating to a new version/tag) or was this always a problem?
* If the problem started happening recently, **can you reproduce the problem in an older version/tag?** What's the most recent version in which the problem does not happen?
* **Can you reliably reproduce the issue?** If not, provide details about how often the problem happens and under which conditions it normally happens.

Include details about your configuration and environment:

* **Which version of the adapter/artifact are you using?** You can get the exact version by checking the project version in the package.json file.
* **What's the name and version of the OS you're using**?
* **Are you running or using IAP in a virtual machine?** If so, which VM software are you using and which operating systems and versions are used for the host and guest?
* **Are there firewalls between IAP and any other system you are integrating with?** If so, have you tried running curl from the system IAP is on to the other system to verify you have connectivity between the systems?

### Your First Code Contribution

#### Local development

This project can be developed locally on all operating systems. For instructions on how to do this, follow the steps highlighted in the [User Guide](README.md). The [User Guide](README.md)provides many more details on cloning the repository for local development, how to lint and test your changes. 

#### Development Process

The following provides a local copy of the repository along with dependencies.

```json
go to the repository you are interested in working on
click on the Clone button to get the link(s) you can use to clone the repository
git clone <link to clone the project>
npm install
```

Prior to making changes you should create a branch to work in. The branch should be named with the type of change (major, minor or patch) and then a Jira issue number or a description of the issue.

```json
git checkout -b <name_of_your_new_branch>
```

Make all of the desired changes.

> **Note:** All code changes should be accompanied by additional Unit and Integration tests to minimize the likelihood that any changes will negatively impact the adapter/artifact as well as to ensure the desired functionality is achieved.

| Files | Changes |
| ------- | ------- |
| .codeclimate.yml, .eslintignore, .eslintrc.js, .gitignore, .gitlab-ci.yml, .jshintrc, .npmignore | These are foundational files that are used in linting and building of the adapter. Changes to these files are heavily scrutinized and may be implemented in a different manner so that the changes can be implemented across all adapters.|
| CODE_OF_CONDUCT.md, CONTRIBUTING.md, LICENSE, README.md | These are license and process files for the repository. Changes to these files may require legal review and may also be implemented in a different manner so that the changes can be implemented across all adapters.|
| utils/*, adapterBase.js | Changes to these files will rarely be accepted. These are process files that need to be changed through the builder process and migration.|
| adapter.js | Changes to this file are code changes. They should be accompanied by the appropriate unit and integration tests. If new methods are added, they should also be added to the pronghorn.json file, otherwise integration tests are likely to fail.|
| error.json, propertiesSchema.json | These files are utilized by the Itential Runtime libraries. You can make changes to these files, but the changes should be appending of new errors or properties. Removal of errors and properties can result in rejection of the changes.|
| pacakge.json, package-lock.json | The package-lock.json is automatically generated and should only be updated when the dependencies inside of the package.json are modified. You can make changes to the package.json to add additional scripts, add new dependencies, modify names, etc. However, changing the scripts or dependencies that are Itential specific will be overriden during the acceptance process.|
| pronghorn.json | Changes to this file are made for integration into IAP. The most common change here is adding new methods that shoud be exposed to the IAP Workflow.|
| entities/* | Changes to these files include adding new capabilities, updating existing capabilities, or removing deprecated capabilities in the adapter. Translation configuration can also be modified here.|
| test/* | Changes to these files include adding, updating, or removing unit and integration tests in the adapter. Tests should never be removed unless the methods that are being tested are removed also. Both the unit and integration test file should have a marker that identifies where modification can take place. Modifications above that marker are likely to be rejected or implemented in a different manner.|

> **Note:** It is a best practice to lint and test your code prior to committing changes into the repository. You can lint your code by running **npm run lint** and test it by running **node utils/testRunner.sh**. However, there are pre-commit hooks that will run these scripts when you commit your changes.

Commit the changes to the repository.

```json
git commit -a -m "<descriptive message>" 
```

> **Note:** There are pre-commit hooks in place. If the pre-commit hooks fail, you will need to address those issues before moving forward.

Push the changes into the repository. This should only be done after the commit has successfully completed.

```json
git push origin <name_of_your_new_branch>
```

Create a [Merge Request](#merge-request).

### Merge Requests

* Fill out the provided merge request template.
* Reference related issues and merge requests liberally.
* Include screenshots and animated GIFs in your merge request whenever possible.
* Follow the project [Styleguide](#styleguides).
* End all files with a newline.

## Styleguide

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Consider starting the commit message with an applicable emoji _(not required)_:
    * :art: `:art:` When improving the format/structure of the code.
    * :racehorse: `:racehorse:` When improving performance
    * :non-potable_water: `:non-potable_water:` When plugging memory leaks.
    * :memo: `:memo:` When writing documentation.
    * :penguin: `:penguin:` When fixing something on Linux.
    * :apple: `:apple:` When fixing something on macOS.
    * :checkered_flag: `:checkered_flag:` When fixing something on Windows.
    * :bug: `:bug:` When fixing a bug.
    * :fire: `:fire:` When removing code or files.
    * :green_heart: `:green_heart:` When fixing the CI build.
    * :white_check_mark: `:white_check_mark:` When adding tests,
    * :lock: `:lock:` When dealing with security.
    * :arrow_up: `:arrow_up:` When upgrading dependencies.
    * :arrow_down: `:arrow_down:` When downgrading dependencies.
    * :shirt: `:shirt:` When removing linter warnings.

__Avoid installing unnecessary packages.__ Do not install packages just because they might be "nice to have". Itential Opensource projects are supposed to be minimal, specific, and compact by design.

_return to [README](./README.md)_
