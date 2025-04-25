require('dotenv').config();
const express = require('express');
const axios = require('axios');
const AWS = require('aws-sdk');

const {
  FLY_API_TOKEN,
  FLY_ORG,
  CONTAINER_IMAGE,
  COMMON_BUCKET,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_ENDPOINT_URL_S3,
  AWS_REGION
} = process.env;

if (
  !FLY_API_TOKEN ||
  !FLY_ORG ||
  !CONTAINER_IMAGE ||
  !COMMON_BUCKET ||
  !AWS_ACCESS_KEY_ID ||
  !AWS_SECRET_ACCESS_KEY ||
  !AWS_ENDPOINT_URL_S3 ||
  !AWS_REGION
) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

async function createFlyClient() {
  const response = await axios.post(
    'https://api.fly.io/api/v1/cli_sessions',
    null,
    { headers: { Authorization: `Bearer ${FLY_API_TOKEN}` } }
  );
  return axios.create({
    baseURL: 'https://api.machines.dev/v1',
    headers: {
      Authorization: `Bearer ${response.data.token}`,
      'Content-Type': 'application/json'
    }
  });
}

const s3 = new AWS.S3({
  endpoint: AWS_ENDPOINT_URL_S3,
  region: AWS_REGION,
  credentials: new AWS.Credentials(AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY),
  s3ForcePathStyle: true
});

(async () => {
  const fly = await createFlyClient();
  const app = express();
  app.use(express.json());

  app.post('/servers', async (req, res) => {
    const { appName, region = 'sea' } = req.body;
    try {
      await fly.post('/apps', { name: appName, org_slug: FLY_ORG, primary_region: region });
      await fly.post(
        `/apps/${appName}/extensions`,
        { name: 'tigris_object_storage', settings: { bucket_name: COMMON_BUCKET } }
      );
      await fly.post(
        `/apps/${appName}/secrets`,
        { secrets: { INSTANCE_PREFIX: appName, BUCKET_NAME: COMMON_BUCKET } }
      );
      await fly.post(`/apps/${appName}/deploys`, { image: CONTAINER_IMAGE });
      res.json({ status: 'created', app: appName, url: `https://${appName}.fly.dev` });
    } catch (error) {
      res.status(500).json({ error: error.response?.data || error.message });
    }
  });

  app.post('/servers/:name/notebook', async (req, res) => {
    const name = req.params.name;
    try {
      await s3.putObject({
        Bucket: COMMON_BUCKET,
        Key: `${name}/notebook.ipynb`,
        Body: JSON.stringify(req.body),
        ContentType: 'application/json'
      }).promise();
      await fly.post(`/apps/${name}/deploys`, { image: CONTAINER_IMAGE });
      res.json({ status: 'updated', app: name });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/servers/:name', async (req, res) => {
    const name = req.params.name;
    try {
      await fly.delete(`/apps/${name}`);
      res.json({ status: 'deleted', app: name });
    } catch (error) {
      res.status(500).json({ error: error.response?.data || error.message });
    }
  });

  const port = process.env.PORT || 3006;
  app.listen(port, () => console.log(`Listening on port ${port}`));
})();
