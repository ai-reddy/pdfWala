#!/bin/bash

set -e

echo "========================================"
echo "pdfWala Netlify Build Check"
echo "========================================"

# First build / no previous commit available
if [ -z "$CACHED_COMMIT_REF" ]; then
  echo "No cached commit found."
  echo "Running build."
  exit 1
fi

echo "Previous commit: $CACHED_COMMIT_REF"
echo "Current commit:  $COMMIT_REF"

CHANGED_FILES=$(git diff --name-only "$CACHED_COMMIT_REF" "$COMMIT_REF")

echo ""
echo "Changed files:"
echo "$CHANGED_FILES"
echo ""

# No changes
if [ -z "$CHANGED_FILES" ]; then
  echo "No changes detected."
  echo "Skipping Netlify build."
  exit 0
fi

for file in $CHANGED_FILES; do

  case "$file" in

    # GitHub configuration
    .github/*)
      echo "Ignoring GitHub configuration: $file"
      ;;

    # Documentation
    *.md)
      echo "Ignoring documentation: $file"
      ;;

    # Everything else is considered deployable
    *)
      echo "Deployable change detected: $file"
      echo ""
      echo "Netlify build required."
      exit 1
      ;;

  esac

done

echo ""
echo "Only GitHub/documentation changes detected."
echo "Skipping Netlify build."

exit 0
