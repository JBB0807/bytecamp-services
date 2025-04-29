const express = require('express');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const axios = require('axios');
const tar = require('tar');

const {
  FLY_ORG,
  COMMON_BUCKET,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_ENDPOINT_URL_S3,
  AWS_REGION,
  FLY_ACCESS_TOKEN
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

    await s3.putObject({
      Bucket: COMMON_BUCKET,
      Key: `${appName}/notebooks/${timestamp}-notebook.ipynb`,
      Body: notebookData,
      ContentType: 'application/json'
    }).promise();

    const tarFilePath = `/tmp/${appName}.tar.gz`;
    await tar.c(
      {
        gzip: true,
        file: tarFilePath,
        cwd: path.join(__dirname, '../snakeapi_service')
      },
      ['.']
    );

    const tarData = fs.readFileSync(tarFilePath);
    await fly.post(`/apps/${appName}/deploys`, tarData, {
      headers: { 'Content-Type': 'application/gzip' }
    });

    res.json({
      status: 'created',
      app: appName,
      url: `https://${appName}.fly.dev`
    });
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

const port = process.env.PORT || 3006;
app.listen(port, '0.0.0.0', () => console.log(`Listening on port ${port}`));
