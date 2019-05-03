# Contributing

:+1: :tada: First off, thanks for taking the time to contribute! :tada: :+1:

The following is a set of guidelines for contributing. [These are mostly guidelines, not rules](https://www.youtube.com/watch?v=jl0hMfqNQ-g). Use your best judgment, and feel free to propose changes to this document in a merge request.

#### Table Of Contents

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

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers understand your report :pencil:, reproduce the behavior :computer: :left_right_arrow: :computer:, and find related reports :mag_right:.

Before creating bug reports, please check [this list](#before-submitting-a-bug-report) as you might find out that you don't need to create one. When you are creating a bug report, please [include as many details as possible](#how-do-i-submit-a-good-bug-report). Fill out the [gitlab issue template](https://gitlab.com/itentialopensource/argo/issues/new); the information it asks for helps us resolve issues faster.

> **Note:** If you find a **Closed** issue that seems like it is the same thing that you're experiencing, open a new issue and include a link to the original issue in the body of your new one.

#### Before Submitting A Bug Report

* **Check the [User Guide](README.md).** You might be able to find the cause of the problem and fix things yourself. Most importantly, check if you can reproduce the problem __in the latest version__.
* **Perform a [cursory search](https://gitlab.com/itentialopensource/argo/issues)** to see if the problem has already been reported and is being worked on. If it has **and the issue is still open**, add a comment to the existing issue instead of opening a new one.
* **Ask around in chat if you are an Itential employee** to see if others are experiencing the same issue.

#### How Do I Submit A (Good) Bug Report?

Bugs are tracked as [gitlab issues](https://docs.gitlab.com/ee/user/project/issues/). Create an issue and fill out the [gitlab issue template](https://gitlab.com/itentialopensource/argo/issues/new).

Explain the problem and include additional details to help maintainers reproduce the problem:

* **Use a clear and descriptive title** for the issue to identify the problem.
* **Describe the exact steps which reproduce the problem** in as many details as possible. For example, start by explaining how you setup and started the project, e.g. which command exactly you used in the terminal, or how you started the project otherwise.
* **Provide specific examples to demonstrate the steps**. Include links to files or projects, or copy/paste-able snippets, which you use in those examples.
* **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
* **Explain which behavior you expected to see instead and why.**
* **Include screenshots and animated GIFs** which show you following the described steps and clearly demonstrate the problem. You can use [this tool](https://www.cockos.com/licecap/) to record GIFs on macOS and Windows, and [this tool](https://github.com/colinkeenan/silentcast) or [this tool](https://github.com/GNOME/byzanz) on Linux.
* **If the problem wasn't triggered by a specific action**, describe what you were doing before the problem happened and share more information using the guidelines below.

Provide more context by answering these questions:

* **Did the problem start happening recently** (e.g. after updating to a new version/tag) or was this always a problem?
* If the problem started happening recently, **can you reproduce the problem in an older version/tag?** What's the most recent version in which the problem doesn't happen?
* **Can you reliably reproduce the issue?** If not, provide details about how often the problem happens and under which conditions it normally happens.

Include details about your configuration and environment:

* **Which version of argo are you using?** You can get the exact version by checking the project's version in its VERSION file.
* **What's the name and version of the OS you're using**?
* **Are you running or using the project in a virtual machine?** If so, which VM software are you using and which operating systems and versions are used for the host and the guest?

### Your First Code Contribution

#### Local development

This project can be developed locally on all operating systems. For instructions on how to do this, follow the steps highlighted in the [User Guide](README.md).

### Merge Requests

* Fill out the provided merge request template.
* Reference related issues and merge requests liberally.
* Include screenshots and animated GIFs in your merge request whenever possible.
* Follow the project's [Styleguide](#styleguides).
* End all files with a newline.

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Consider starting the commit message with an applicable emoji _(not required)_:
    * :art: `:art:` when improving the format/structure of the code
    * :racehorse: `:racehorse:` when improving performance
    * :non-potable_water: `:non-potable_water:` when plugging memory leaks
    * :memo: `:memo:` when writing docs
    * :penguin: `:penguin:` when fixing something on Linux
    * :apple: `:apple:` when fixing something on macOS
    * :checkered_flag: `:checkered_flag:` when fixing something on Windows
    * :bug: `:bug:` when fixing a bug
    * :fire: `:fire:` when removing code or files
    * :green_heart: `:green_heart:` when fixing the CI build
    * :white_check_mark: `:white_check_mark:` when adding tests
    * :lock: `:lock:` when dealing with security
    * :arrow_up: `:arrow_up:` when upgrading dependencies
    * :arrow_down: `:arrow_down:` when downgrading dependencies
    * :shirt: `:shirt:` when removing linter warnings

### Docker Styleguide

All shell scripts must be POSIX compliant and pass testing via [shellcheck](https://github.com/koalaman/shellcheck).

__Order build steps from less-frequently changed to more-frequently changed.__ eg:

```
# Rarely changed base package requirements:
RUN apt-get update -qq && apt-get install -qq make ant netcat gawk

# More commonly changed layer (nso isntaller example):
RUN curl -L -o nso_installer.bin https://address.com/path/to/installer.bin \
```

__Bundle like-steps to keep layer stages compact and specific.__ eg:

```
# Bundle all package install steps into one run command:
RUN apt-get update -qq && apt-get install -qq make ant netcat gawk

# Set all environment variables in one layer:
ENV NCS_LOG_DIR=/var/log/ncs \
    NCS_RUN_DIR=/var/opt/ncs \
    NCS_CONFIG_DIR=/etc/ncs \
    NCS_DIR=/opt/ncs/current
```

__Avoid installing unnecessary packages.__ Don't install packages just because they might be "nice to have". Images are supposed to be minimal, specific, and compact by design.

__Each container must have only one purpose/concern.__ For example, if adding an external service, write a separate image for that external service and leverage the separate image's container in conjunction with the official ci images. Do __NOT__ simply add the external service into the argo images.

__Use multi-line arguments.__ Instead of creating extremely long command strings, use a space and a backslash (`\`) to span the argument over multiple lines .This makes MRs much easier to read and review. eg:

```
# bad
ENV NCS_LOG_DIR=/var/log/ncs NCS_RUN_DIR=/var/opt/ncs NCS_CONFIG_DIR=/etc/ncs NCS_DIR=/opt/ncs/current

# good
ENV NCS_LOG_DIR=/var/log/ncs \
    NCS_RUN_DIR=/var/opt/ncs \
    NCS_CONFIG_DIR=/etc/ncs \
    NCS_DIR=/opt/ncs/current
```

_return to [README](./README.md)_
