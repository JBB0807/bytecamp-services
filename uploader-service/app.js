const express = require('express');
const axios = require('axios');
const { google } = require('googleapis');
const multer = require('multer');
const upload = multer();
//include dotenv package
require('dotenv').config();


const app = express();
app.use(express.json());


const PORT = process.env.PORT || 3000;

const FLY_API_BASE_URL = process.env.FLY_API_BASE_URL
const FLY_API_TOKEN = process.env.FLY_API_TOKEN
//not from env at the moment
const GOOGLE_API_CREDENTIALS = 'the_google_api_credentials.json';

let machinePool = []; // To store machine objects

class Machine {
  constructor(id, ip) {
    this.id = id;
    this.ip = ip;
  }
}

// Helper function to initialize Google APIs
async function initializeGoogleApis() {
  const auth = new google.auth.GoogleAuth({
    keyFile: GOOGLE_API_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth.getClient();
}

// Helper function to create a machine
async function createMachine() {
  const response = await axios.post(
    `${FLY_API_BASE_URL}/v1/machines`,
    { /* Add machine configuration here */ },
    { headers: { Authorization: `Bearer ${FLY_API_TOKEN}` } }
  );

  //look at all question marks, we are ensuring safety
  const machine = new Machine(response.data.id, response.data.config?.network?.ip_addresses);

  // Suspend the machine for now, we'll unsuspend when needed
  await axios.post(
    `${FLY_API_BASE_URL}/v1/machines/${machine.id}/suspend`,
    {},
    { headers: { Authorization: `Bearer ${FLY_API_TOKEN}` } }
  );

  return machine;
}

// Endpoint to create Fly machines asynchronously
app.post('/machines/create', async (req, res) => {
  const { count = 1 } = req.body;

  res.sendStatus(200); // Respond immediately

  // Asynchronously create machines
  try {
    const promises = Array.from({ length: count }, createMachine);
    const results = await Promise.all(promises);
    machinePool.push(...results);
  } catch (error) {
    console.error('Error creating machines:', error);
  }
});

// Endpoint to get a machine (or multiple machines)
app.post('/machines/get', async (req, res) => {
  const { count = 1 } = req.body;
  const allocatedMachines = [];

  try {
    // Use existing machines first
    while (allocatedMachines.length < count && machinePool.length > 0) {
      allocatedMachines.push(machinePool.pop());
    }

    // Create new machines if needed
    const needed = count - allocatedMachines.length;
    if (needed > 0) {
      const promises = Array.from({ length: needed }, createMachine);
      const results = await Promise.all(promises);
      allocatedMachines.push(...results);
    }

    res.json({ machines: allocatedMachines });
  } catch (error) {
    console.error('Error retrieving machines:', error);
    res.status(500).json({ error: 'Failed to retrieve machines' });
  }
});

// Endpoint to upload files to Google Drive
app.post('/drive/upload', upload.fields([{ name: 'pythonFile' }, { name: 'jsonFile', maxCount: 1 }]), async (req, res) => {
  const { folderLink } = req.body;
    const { pythonFile, jsonFile } = req.files;

  if (!folderLink || !pythonFile) {
    return res.status(400).json({ error: 'Folder link and Python file are required' });
  }

  try {
    const driveClient = google.drive({ version: 'v3', auth: await initializeGoogleApis() });

    const folderId = folderLink.split('/').pop(); // Extract folder ID from link

    const uploadFile = async (file, mimeType) => {
      const response = await driveClient.files.create({
        requestBody: {
          name: file.originalname,
          parents: [folderId],
        },
        media: {
          mimeType,
          body: Buffer.from(file.buffer),
        },
      });
      return response.data;
    };

    const pythonResponse = await uploadFile(pythonFile[0], 'text/x-python');
    let jsonResponse;
    if (jsonFile) {
      jsonResponse = await uploadFile(jsonFile[0], 'application/json');
    }

    res.json({
      pythonFileId: pythonResponse.id,
      jsonFileId: jsonResponse?.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Endpoint to insert data into Google Sheets
app.post('/sheets/insert', async (req, res) => {
  const { spreadsheetId, range, data } = req.body;

  if (!spreadsheetId || !range || !data) {
    return res.status(400).json({ error: 'Spreadsheet ID, range, and data are required' });
  }

  try {
    const sheetsClient = google.sheets({ version: 'v4', auth: await initializeGoogleApis() });

    await sheetsClient.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: Array.isArray(data) ? data : [data],
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to insert data into the sheet' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
