#!/bin/sh

#exit on any failure in the pipeline
set -e

# --------------------------------------------------
# pre-commit
# --------------------------------------------------
# Contains the standard set of tasks to runbefore
# committing changes to the repo. If any tasks fail
# then the commit will be aborted.
# --------------------------------------------------

printf "%b" "Running pre-commit hooks...\\n"

# verify testing script is stubbed and no credentials
node utils/testRunner.js -r

# security audit on the code
npm audit --registry=https://registry.npmjs.org

# lint the code
npm run lint

# test the code
npm run test
