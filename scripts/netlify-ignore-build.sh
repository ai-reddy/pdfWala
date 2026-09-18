#!/bin/bash

# Compare the current commit with the previous commit.
# Exit 0 = Netlify should SKIP the build.
# Exit 1 = Netlify should BUILD.

if git diff --quiet "$CACHED_COMMIT_REF" "$COMMIT_REF" -- \
  ':(exclude).github/' \
  ':(exclude)README.md' \
  ':(exclude)docs/' \
  ':(exclude)**/*.md'
then
  echo "No application changes detected. Skipping Netlify build."
  exit 0
else
  echo "Application changes detected. Proceeding with Netlify build."
  exit 1
fi
