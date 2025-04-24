const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const AWS = require('aws-sdk');

const app = express();

// AWS Configuration
AWS.config.update({ region: 'us-east-1' });
const cloudwatchlogs = new AWS.CloudWatchLogs();

const logGroupName = 'FinserveBankingActions';
const logStreamName = 'DepositActivity';

// Ensure log group and stream exist
function ensureLogStream(callback) {
  cloudwatchlogs.describeLogStreams({ logGroupName }, function (err, data) {
    if (err || !data.logStreams.find(s => s.logStreamName === logStreamName)) {
      // Create log group if not found
      cloudwatchlogs.createLogGroup({ logGroupName }, () => {
        cloudwatchlogs.createLogStream({ logGroupName, logStreamName }, callback);
      });
    } else {
      callback(null, data.logStreams.find(s => s.logStreamName === logStreamName));
    }
  });
}

// Function to log to CloudWatch
function logToCloudWatch(message) {
  ensureLogStream((err, logStream) => {
    if (err) {
      console.error('Failed to prepare log stream:', err);
      return;
    }

    const params = {
      logGroupName,
      logStreamName,
      logEvents: [
        {
          message: message,
          timestamp: Date.now(),
        },
      ],
      sequenceToken: logStream?.uploadSequenceToken
    };

    cloudwatchlogs.putLogEvents(params, function (err, data) {
      if (err) console.error('CloudWatch logging failed:', err);
      else console.log('✅ Logged to CloudWatch:', message);
    });
  });
}

// Express Setup
app.set('port', process.env.PORT || 3000);
app.engine('.html', require('ejs').__express);
app.set('views', path.join(__dirname, '../public/views'));
app.set('view engine', 'html');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '../public')));

// Frontend Route
app.get('/bank', function (req, res) {
  res.render('index', {});
});

// API Route
app.post('/api/deposit', function (req, res) {
  const { accountId, amount } = req.body;

  console.log('📥 Received Deposit Request:', req.body);

  if (!accountId || !amount) {
    console.warn('⚠️ Missing accountId or amount in request body');
    return res.status(400).json({ status: 'error', message: 'Invalid input' });
  }

  const logMessage = `Deposit | AccountID: ${accountId}, Amount: ${amount}`;
  logToCloudWatch(logMessage);

  res.json({ status: 'success', message: 'Deposit successful' });
});

// Fallback Route
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// ✅ Instead of starting a server here, we export the app
module.exports = app;
