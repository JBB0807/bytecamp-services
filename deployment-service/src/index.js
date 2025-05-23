const express = require("express");
const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
const axios = require("axios");
require("dotenv").config();

const {
  FLY_ORG,
  COMMON_BUCKET,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_ENDPOINT_URL_S3,
  AWS_REGION,
  FLY_ACCESS_TOKEN,
  IMAGE_REF,
} = process.env;

// Log environment variables for debugging
console.log("--- ENV START ---");
console.log("FLY_ORG:              ", FLY_ORG);
console.log("COMMON_BUCKET:        ", COMMON_BUCKET);
console.log(
  "AWS_ACCESS_KEY_ID:    ",
  AWS_ACCESS_KEY_ID ? "(found)" : "(NOT SET)"
);
console.log(
  "AWS_SECRET_ACCESS_KEY:",
  AWS_SECRET_ACCESS_KEY ? "(found)" : "(NOT SET)"
);
console.log("AWS_ENDPOINT_URL_S3:  ", AWS_ENDPOINT_URL_S3);
console.log("AWS_REGION:           ", AWS_REGION);
console.log(
  "FLY_ACCESS_TOKEN:     ",
  FLY_ACCESS_TOKEN ? "(found)" : "(NOT SET)"
);
console.log("IMAGE_REF:            ", IMAGE_REF);
console.log("--- ENV END   ---");

// Initialize S3 client
const s3 = new AWS.S3({
  endpoint: AWS_ENDPOINT_URL_S3,
  region: AWS_REGION,
  credentials: new AWS.Credentials(AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY),
  s3ForcePathStyle: true,
});

// Create Fly Machines API client
function createFlyClient() {
  return axios.create({
    baseURL: "https://api.machines.dev/v1",
    headers: {
      Authorization: `Bearer ${FLY_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
}

// Create Fly GraphQL client (for IP allocation)
const gqlClient = axios.create({
  baseURL: "https://api.fly.io/graphql",
  headers: {
    Authorization: `Bearer ${FLY_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
});

// Define GraphQL mutation for IP allocation
const ALLOCATE_IP_MUTATION = `
mutation AllocateIp($input: AllocateIPAddressInput!) {
  allocateIpAddress(input: $input) {
    ipAddress {
      address
      type
    }
  }
}
`;

const app = express();
app.use(express.json({ limit: "10mb" }));

app.post("/deploy", async (req, res) => {
  console.log("Received /deploy:", req.body);
  const {
    appName,
    // , region
    // , notebookName
  } = req.body;
  if (!appName) {
    return res.status(400).json({ error: "appName required" });
  }

  try {
    const fly = createFlyClient();

    console.log("Creating Fly app:", appName);
    await fly.post("/apps", {
      app_name: appName,
      org_slug: FLY_ORG,
      primary_region: "sea",
    });

    console.log("Creating machine");
    const machineConfig = {
      name: `${appName}-machine`,
      region: "sea",
      count: 1,
      vm_size: "shared-cpu-1x",
      autostart: true,
      config: {
        image: IMAGE_REF,
        env: {
          INSTANCE_PREFIX: appName,
          // NOTEBOOK_KEY: key,
          COMMON_BUCKET: COMMON_BUCKET,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
          AWS_ENDPOINT_URL_S3,
          AWS_REGION,
        },
        http_service: {
          internal_port: 8000,
          force_https: true,
          auto_stop_machines: "stop",
          auto_start_machines: true,
          min_machines_running: 0,
          processes: ["app"],
        },
        services: [
          {
            protocol: "tcp",
            internal_port: 8000,
            ports: [
              { port: 443, handlers: ["tls", "http"] },
              { port: 80, handlers: ["http"] },
            ],
          },
        ],
        guest: {
          memory_mb: 512,
          cpu_kind: "shared",
          cpus: 1,
        },
      },
    };
    console.log("Machine config:", JSON.stringify(machineConfig, null, 2));
    await fly.post(`/apps/${appName}/machines`, machineConfig);

    console.log("Allocating IPv4 via GraphQL API");
    const v4resp = await gqlClient.post("", {
      query: ALLOCATE_IP_MUTATION,
      variables: { input: { appId: appName, type: "v4" } },
    });
    const ipv4 = v4resp.data.data.allocateIpAddress.ipAddress.address;
    console.log("Allocated IPv4:", ipv4);

    console.log("Allocating IPv6 via GraphQL API");
    const v6resp = await gqlClient.post("", {
      query: ALLOCATE_IP_MUTATION,
      variables: { input: { appId: appName, type: "v6" } },
    });
    const ipv6 = v6resp.data.data.allocateIpAddress.ipAddress.address;
    console.log("Allocated IPv6:", ipv6);

    const machines = await fly.get(`/apps/${appName}/machines`);
    const firstPrivateIp = machines.data[0]?.private_ip;
    if (!firstPrivateIp) {
      console.error("No private IP found for the machine:", machines.data);
      return machines.status(500).json({ error: "No private IP found" });
    }
    console.log("First private IP:", firstPrivateIp);

    return res.json({
      status: "created",
      app: appName,
      ipv4,
      ipv6 : firstPrivateIp,
      url_v4: `http://${ipv4}`,
      url_v6: `http://[${firstPrivateIp}]`,
    });
  } catch (err) {
    console.error(
      "Deployment error:",
      err.response?.data || err.stack || err.message
    );
    return res.status(500).json({ error: err.response?.data || err.message });
  }
});

// Upload notebook to S3 for an existing app
app.post("/:appName/upload", async (req, res) => {
  const { appName } = req.params;
  const { notebookName, fileContentBase64 } = req.body;

  if (!notebookName || !fileContentBase64) {
    return res
      .status(400)
      .json({ error: "notebookName and fileContentBase64 are required" });
  }

  try {
    const buffer = Buffer.from(fileContentBase64, "base64");
    const key = `${appName}/notebooks/${notebookName}`;

    console.log(`Uploading notebook to: s3://${COMMON_BUCKET}/${key}`);
    await s3
      .putObject({
        Bucket: COMMON_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: "application/json",
      })
      .promise();

    return res.json({ status: "uploaded", app: appName, key });
  } catch (err) {
    console.error("Notebook upload error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// restart a Fly app
app.post("/:appName/restart", async (req, res) => {
  const { appName } = req.params;
  try {
    const fly = createFlyClient();
    const { data: machines } = await fly.get(`/apps/${appName}/machines`);
    if (!machines || !Array.isArray(machines) || machines.length === 0) {
      return res.status(404).json({ error: "No machines found for this app" });
    }
    const results = await Promise.all(
      machines.map(machine =>
        fly.post(`/apps/${appName}/machines/${machine.id}/restart`)
      )
    );
    res.json({ status: "restarted", app: appName, count: results.length });
  } catch (err) {
    console.error("Restart error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});


// Delete a Fly app
app.post("/:appName/delete", async (req, res) => {
  const { appName } = req.params;

  try {
    const fly = createFlyClient();
    console.log("Destroying Fly app:", appName);

    //check if the app exists
    console.log("Checking if app exists:", appName);

    const appCheck = await fly.get(`/apps/${appName}`);
    console.log("App check response:", appCheck.status);
  
    await fly.delete(`/apps/${appName}`);

    return res.json({ status: "deleted", app: appName });
  } catch (err) {

    //handle the 404 error and not treat it as a failure (no app to delete)
    if (err.response?.status === 404) {
      console.log("App not found, nothing to delete:", appName);
      return res.status(200).json({ error: "App not found" });
    }

    const errorData = err.response?.data || err.stack || err.message;
    console.error("App deletion error:", errorData);
    return res.status(500).json({ errorData });
  }
});

//deploy fly app based on appname
app.post("/deploy/:appName", async (req, res) => {
  const { appName } = req.params;
  const { region } = req.body;

  if (!appName || !region) {
    return res.status(400).json({ error: "appName and region are required" });
  }

  try {
    const fly = createFlyClient();
    console.log("Creating Fly app:", appName);
    await fly.post("/apps", {
      app_name: appName,
      org_slug: FLY_ORG,
      primary_region: region,
    });

    return res.json({ status: "created", app: appName });
  } catch (err) {
    console.error("App creation error:", err.response?.data || err.message);
    return res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.get("/notebook/:appName", async (req, res) => {
  try {
    const { appName } = req.params;
    const prefix = `${appName}/notebooks/`;
    const list = await s3
      .listObjectsV2({ Bucket: COMMON_BUCKET, Prefix: prefix })
      .promise();
    if (!list.Contents || list.Contents.length === 0) {
      return res.status(404).json({ error: "Notebook not found" });
    }
    const latest = list.Contents.reduce((prev, curr) =>
      prev.LastModified > curr.LastModified ? prev : curr
    );
    const data = await s3
      .getObject({ Bucket: COMMON_BUCKET, Key: latest.Key })
      .promise();
    res.send(data.Body.toString("utf-8"));
  } catch (error) {
    console.error("Failed to load notebook:", error);
    res.status(500).json({ error: "Failed to load notebook" });
  }
});


const LISTEN_PORT = process.env.NODE_PORT || 8080;
app.listen(LISTEN_PORT, () => {
  console.log(`Server running at :${LISTEN_PORT}`);
});
