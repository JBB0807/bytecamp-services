// src/index.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const axios = require('axios');

const {
  FLY_ORG,
  COMMON_BUCKET,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_ENDPOINT_URL_S3,
  AWS_REGION,
  FLY_ACCESS_TOKEN,
  IMAGE_REF
} = process.env;

// --- ENV debug ---
console.log('--- ENV START ---');
console.log('FLY_ORG:              ', FLY_ORG);
console.log('COMMON_BUCKET:        ', COMMON_BUCKET);
console.log('AWS_ACCESS_KEY_ID:    ', AWS_ACCESS_KEY_ID ? '(found)' : '(NOT SET)');
console.log('AWS_SECRET_ACCESS_KEY:', AWS_SECRET_ACCESS_KEY ? '(found)' : '(NOT SET)');
console.log('AWS_ENDPOINT_URL_S3:  ', AWS_ENDPOINT_URL_S3);
console.log('AWS_REGION:           ', AWS_REGION);
console.log('FLY_ACCESS_TOKEN:     ', FLY_ACCESS_TOKEN ? '(found)' : '(NOT SET)');
console.log('IMAGE_REF:            ', IMAGE_REF);
console.log('--- ENV END   ---');

// S3 client
const s3 = new AWS.S3({
  endpoint: AWS_ENDPOINT_URL_S3,
  region: AWS_REGION,
  credentials: new AWS.Credentials(AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY),
  s3ForcePathStyle: true
});

// Fly Machines API client
function createFlyClient() {
  return axios.create({
    baseURL: 'https://api.machines.dev/v1',
    headers: {
      Authorization: `Bearer ${FLY_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
}

const app = express();
app.use(express.json({ limit: '10mb' }));

app.post('/deploy', async (req, res) => {
  console.log('Received /deploy:', req.body);
  const { appName, region = 'sea', notebookName } = req.body;
  if (!appName || !notebookName) {
    return res.status(400).json({ error: 'appName and notebookName required' });
  }

  // resolve path based on SSH-inspected layout
  const notebookPath = path.join(__dirname, '../snakeapi_service/notebooks', notebookName);
  console.log('Resolved notebookPath:', notebookPath);
  console.log('File exists:', fs.existsSync(notebookPath));
  if (!fs.existsSync(notebookPath)) {
    console.error('Notebook not found at:', notebookPath);
    return res.status(500).json({ error: `Notebook not found: ${notebookPath}` });
  }

  try {
    const fly = createFlyClient();

    console.log('Creating Fly app:', appName);
    await fly.post('/apps', {
      app_name: appName,
      org_slug: FLY_ORG,
      primary_region: region
    });

    console.log('Uploading notebook to S3');
    const data = fs.readFileSync(notebookPath);
    const key = `${appName}/notebooks/${Date.now()}-notebook.ipynb`;
    console.log('S3 key:', key);
    await s3.putObject({
      Bucket: COMMON_BUCKET,
      Key: key,
      Body: data,
      ContentType: 'application/json'
    }).promise();

    console.log('Creating machine');
    const machineConfig = {
      name: `${appName}-machine`,
      region,
      count: 1,
      vm_size: 'shared-cpu-1x',
      autostart: true,
      config: {
        image: IMAGE_REF,
        env: {
          INSTANCE_PREFIX: appName,
          NOTEBOOK_KEY: key,
          BUCKET_NAME: COMMON_BUCKET,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
          AWS_ENDPOINT_URL_S3,
          AWS_REGION
        },
        services: [{
          internal_port: 3006,
          protocol: 'tcp',
          ports: [{ port: 80, handlers: ['http'] }]
        }]
      }
    };
    console.log('Machine config:', machineConfig);
    await fly.post(`/apps/${appName}/machines`, machineConfig);

    console.log('Deployment successful:', appName);
    return res.json({ status: 'created', url: `https://${appName}.fly.dev` });
  } catch (err) {
    console.error('Deployment error:', err.stack || err);
    return res.status(500).json({ error: err.response?.data || err.message });
  }
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, '0.0.0.0', () => console.log(`Listening on port ${PORT}`));
