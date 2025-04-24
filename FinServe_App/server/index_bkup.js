const awsServerlessExpress = require('aws-serverless-express');
const app = require('./app'); // Load the Express app
const server = awsServerlessExpress.createServer(app);

// Lambda handler
exports.handler = (event, context) => {
  return awsServerlessExpress.proxy(server, event, context);
};
