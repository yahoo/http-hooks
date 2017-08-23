#!/bin/bash
# bumps the version, semver patch by default
# commit message like "foo bar [semver minor]" will cause the minor version to be bumped
# (this is a bit naive:  if the build gets triggered again then the bump will happen again)
export SEMVER_TYPE=`git log --pretty=format:"%s" | head -n1 | perl -lane '/semver ([[:alpha:]]+)/; print $1 || "patch"'`
npm version $SEMVER_TYPE --message "[skip ci] bump version to %s"
