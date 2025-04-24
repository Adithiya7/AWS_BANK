#!/bin/bash

LAMBDA_NAME="HighValueDepositHandler"
ROLE_ARN="arn:aws:iam::253360284544:role/EC2"
ZIP_FILE="high-value-deposit.zip"
REGION="us-east-1"

# Navigate to function directory
cd /root/AWS_PROJECT/AWS_finserve/server/highvalue_handler || exit

# Install dependencies (if any) and zip
npm install --omit=dev
zip -r $ZIP_FILE . -x "*.git*" "node_modules/aws-sdk/*"

# Create Lambda (if not created yet)
aws lambda get-function --function-name $LAMBDA_NAME --region $REGION > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Creating Lambda..."
  aws lambda create-function \
    --function-name $LAMBDA_NAME \
    --runtime nodejs18.x \
    --role $ROLE_ARN \
    --handler index.handler \
    --zip-file fileb://$ZIP_FILE \
    --timeout 10 \
    --memory-size 128 \
    --region $REGION
else
  echo "Updating existing Lambda..."
  aws lambda update-function-code \
    --function-name $LAMBDA_NAME \
    --zip-file fileb://$ZIP_FILE \
    --region $REGION
fi

