const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

const { CloudWatchLogsClient, DescribeLogStreamsCommand, CreateLogGroupCommand, CreateLogStreamCommand, PutLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

const app = express();

// AWS Configuration
const cloudwatchlogs = new CloudWatchLogsClient({ region: 'us-east-1' });

const logGroupName = 'FinserveBankingActions';
const logStreamName = 'DepositActivity';

// Ensure log group and stream exist
async function ensureLogStream() {
  try {
    const describeCmd = new DescribeLogStreamsCommand({ logGroupName });
    const data = await cloudwatchlogs.send(describeCmd);
    const logStream = data.logStreams?.find(s => s.logStreamName === logStreamName);

    if (!logStream) {
      try {
        await cloudwatchlogs.send(new CreateLogGroupCommand({ logGroupName }));
      } catch (e) {
        if (e.name !== 'ResourceAlreadyExistsException') throw e;
      }

      await cloudwatchlogs.send(new CreateLogStreamCommand({ logGroupName, logStreamName }));
      return { uploadSequenceToken: null };
    }

    return logStream;
  } catch (err) {
    console.error('Error ensuring log stream:', err);
    return null;
  }
}

// Function to log to CloudWatch
async function logToCloudWatch(message) {
  const logStream = await ensureLogStream();
  if (!logStream) return;

  const logEvents = [
    {
      message: message,
      timestamp: Date.now()
    }
  ];

  const params = {
    logGroupName,
    logStreamName,
    logEvents,
    sequenceToken: logStream.uploadSequenceToken
  };

  try {
    await cloudwatchlogs.send(new PutLogEventsCommand(params));
    console.log('✅ Logged to CloudWatch:', message);
  } catch (err) {
    console.error('CloudWatch logging failed:', err);
  }
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
app.post('/api/deposit', async function (req, res) {
  const { accountId, amount } = req.body;

  console.log('📥 Received Deposit Request:', req.body);

  if (!accountId || !amount) {
    console.warn('⚠️ Missing accountId or amount in request body');
    return res.status(400).json({ status: 'error', message: 'Invalid input' });
  }

  const logMessage = `Deposit | AccountID: ${accountId}, Amount: ${amount}`;
  await logToCloudWatch(logMessage);

  res.json({ status: 'success', message: 'Deposit successful' });
});

// Fallback Route
app.use((req, res) => {
  res.status(404).send('Page not found');
});

module.exports = app;

