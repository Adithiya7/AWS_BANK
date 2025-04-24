#!/bin/bash

# === CONFIG ===
FUNC_NAME="HighValueDepositHandler"
ZIP_FILE="high-value-deposit.zip"
LAMBDA_DIR="/root/AWS_PROJECT/AWS_finserve/server/"
ROLE_ARN="arn:aws:iam::253360284544:role/EC2" # 🔁 Replace with your actual IAM role ARN
REGION="us-east-1"
RUNTIME="nodejs18.x"
HANDLER="index.handler"
TIMEOUT=10
MEMORY=128

# === Step 1: Go to Lambda source directory ===
cd "$LAMBDA_DIR" || { echo "❌ Directory not found: $LAMBDA_DIR"; exit 1; }

# === Step 2: Validate Lambda files ===
if [ ! -f "index.js" ]; then
  echo "❌ index.js not found in $LAMBDA_DIR"
  exit 1
fi

# === Step 3: Install dependencies ===
npm install

# === Step 4: Zip files ===
echo "📦 Creating zip file..."
zip -r "$ZIP_FILE" . -x "*.git*" "node_modules/aws-sdk/*" > /dev/null

if [ ! -f "$ZIP_FILE" ]; then
  echo "❌ Failed to create zip file."
  exit 1
fi

# === Step 5: Deploy to Lambda ===
# Check if function exists
EXISTS=$(aws lambda get-function --function-name "$FUNC_NAME" --region "$REGION" 2>/dev/null)

if [ -z "$EXISTS" ]; then
  echo "🚀 Creating Lambda function..."
  aws lambda create-function \
    --function-name "$FUNC_NAME" \
    --zip-file "fileb://$ZIP_FILE" \
    --handler "$HANDLER" \
    --runtime "$RUNTIME" \
    --timeout "$TIMEOUT" \
    --memory-size "$MEMORY" \
    --role "$ROLE_ARN" \
    --region "$REGION"
else
  echo "🔁 Updating existing Lambda function..."
  aws lambda update-function-code \
    --function-name "$FUNC_NAME" \
    --zip-file "fileb://$ZIP_FILE" \
    --region "$REGION"
fi

echo "✅ Lambda deployment complete."

