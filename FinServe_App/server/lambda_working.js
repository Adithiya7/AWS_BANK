exports.handler = async (event) => {
  const { accountId, amount } = event;

  console.log(`🚨 High-value deposit detected!`);
  console.log(`Account ID: ${accountId}, Amount: ${amount}`);

  // Email alert happens via SNS, optionally add more logic here

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Handled high-value deposit' })
  };
};

