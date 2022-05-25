#!/bin/sh
# @copyright Itential, LLC 2019

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

# update the adapter information file
node utils/adapterInfo.js

# security audit on the code
npm audit --registry=https://registry.npmjs.org --audit-level=moderate

# lint the code
npm run lint

# test the code
npm run test
