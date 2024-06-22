#!/bin/bash

# Make sure running from root directory. If directory 'cfn' is not found then exit
if [ ! -d "cfn" ]; then
  echo "Directory cfn/ not found." >&2
  exit 1
fi

CLOUDFORMATION_TEMPLATE_FILE=cfn/deploy-lambda-function.yaml.template
CLOUDFORMATION_TARGET_FILE=cfn/deploy-lambda-function.yaml
LAMBDA_FUNCTION_FILE=lambda/bedrock-kb-retrieve-generate.py

# Replace text {{LAMBDA_FUNCTION}} in $CLOUDFORMATION_TEMPLATE_FILE
# with the contents of $LAMBDA_FUNCTION_FILE
# and output to $CLOUDFORMATION_TARGET_FILE
awk -v replacement="$(cat $LAMBDA_FUNCTION_FILE | sed 's/^/          /')" '{ gsub("{{LAMBDA_FUNCTION}}", replacement); print }' $CLOUDFORMATION_TEMPLATE_FILE > $CLOUDFORMATION_TARGET_FILE

echo "Template file $CLOUDFORMATION_TEMPLATE_FILE has been built to $CLOUDFORMATION_TARGET_FILE"