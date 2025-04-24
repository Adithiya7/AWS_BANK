const AWS = require('aws-sdk');
const sns = new AWS.SNS();

exports.handler = async (event) => {
  const { accountId, amount } = event;

  console.log(`🚨 High-value deposit detected!`);
  console.log(`Account ID: ${accountId}, Amount: ${amount}`);

  // Define the threshold for high-value deposit
  const threshold = 10000;  // Example: deposits greater than $10,000

  // If the deposit is above the threshold, send an email via SNS
  if (amount >= threshold) {
    const snsMessage = {
      Message: `🚨 High-value deposit detected!\nAccount ID: ${accountId}\nAmount: ${amount}`,
      Subject: 'High-Value Deposit Alert',
      TopicArn: 'arn:aws:sns:us-east-1:253360284544:HighValueDepositAlert',  // Replace with your SNS topic ARN
    };

    try {
      // Publish to SNS
      await sns.publish(snsMessage).promise();
      console.log('✅ SNS notification sent successfully.');
    } catch (error) {
      console.error('❌ Failed to send SNS notification:', error);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Handled high-value deposit' })
  };
};

