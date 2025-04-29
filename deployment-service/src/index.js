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

const s3 = new AWS.S3({
  endpoint: AWS_ENDPOINT_URL_S3,
  region: AWS_REGION,
  credentials: new AWS.Credentials(AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY),
  s3ForcePathStyle: true
});

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
  const { appName, region = 'sea', notebookName } = req.body;
  if (!appName || !notebookName) {
    return res.status(400).json({ error: 'appName and notebookName required' });
  }

  try {
    const fly = createFlyClient();

    await fly.post('/apps', {
      app_name: appName,
      org_slug: FLY_ORG,
      primary_region: region
    });

    await fly.post(`/apps/${appName}/secrets`, {
      secrets: {
        INSTANCE_PREFIX: appName,
        BUCKET_NAME: COMMON_BUCKET,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        AWS_ENDPOINT_URL_S3,
        AWS_REGION
      }
    });

    const notebookFile = path.join(__dirname, '../snakeapi_service/notebooks', notebookName);
    if (!fs.existsSync(notebookFile)) {
      throw new Error(`Notebook file ${notebookName} not found.`);
    }

    const notebookData = fs.readFileSync(notebookFile);
    const timestamp = Date.now();

    const notebookKey = `${appName}/notebooks/${timestamp}-notebook.ipynb`;

    await s3.putObject({
      Bucket: COMMON_BUCKET,
      Key: notebookKey,
      Body: notebookData,
      ContentType: 'application/json'
    }).promise();

    const machineConfig = {
      name: `${appName}-machine`,
      config: {
        image: IMAGE_REF,
        env: {
          INSTANCE_PREFIX: appName,
          NOTEBOOK_KEY: notebookKey,
          BUCKET_NAME: COMMON_BUCKET,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
          AWS_ENDPOINT_URL_S3,
          AWS_REGION
        },
        services: [{
          ports: [{ port: 3006, handlers: ["http"] }],
          protocol: "tcp",
          internal_port: 3006
        }]
      }
    };

    await fly.post(`/apps/${appName}/machines`, machineConfig);

    res.json({
      status: 'created',
      app: appName,
      url: `https://${appName}.fly.dev`
    });
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.post('/upload', async (req, res) => {
  const { appName, notebookName } = req.body;
  if (!appName || !notebookName) {
    return res.status(400).json({ error: 'appName and notebookName required' });
  }

  try {
    const notebookFile = path.join(__dirname, '../snakeapi_service/notebooks', notebookName);
    if (!fs.existsSync(notebookFile)) {
      throw new Error(`Notebook file ${notebookName} not found.`);
    }

    const notebookData = fs.readFileSync(notebookFile);
    const timestamp = Date.now();

    const notebookKey = `${appName}/notebooks/${timestamp}-notebook.ipynb`;

    await s3.putObject({
      Bucket: COMMON_BUCKET,
      Key: notebookKey,
      Body: notebookData,
      ContentType: 'application/json'
    }).promise();

    res.json({ status: 'uploaded', notebookKey });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/delete/:appName', async (req, res) => {
  const appName = req.params.appName;
  if (!appName) {
    return res.status(400).json({ error: 'appName required' });
  }

  try {
    const fly = createFlyClient();
    await fly.delete(`/apps/${appName}`);
    res.json({ status: 'deleted', app: appName });
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

const port = process.env.PORT || 3006;
app.listen(port, '0.0.0.0', () => console.log(`Listening on port ${port}`));
