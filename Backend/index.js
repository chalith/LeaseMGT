const express = require("express");
const fs = require("fs");
const https = require("https");
const http = require("http");
const LeaseService = require("./service");
const initEnv = require("./environment");
const multer = require("multer");
const path = require("path");
const app = express();
const cors = require("cors");

// Load SSL certificate and key
const sslOptions = fs.existsSync(path.resolve(__dirname, "ssl"))
  ? {
      key: fs.readFileSync(path.resolve(__dirname, "ssl/privkey.pem")),
      cert: fs.readFileSync(path.resolve(__dirname, "ssl/cert.pem")),
      ca: [fs.readFileSync(path.resolve(__dirname, "ssl/chain.pem")), fs.readFileSync(path.resolve(__dirname, "ssl/fullchain.pem"))],
    }
  : null;

const uploadDirectory = "./data/uploads";

initEnv();

const sslPort = process.env.SSL_PORT ?? 443;
const port = process.env.NON_SSL_PORT ?? 80;

const leaseService = new LeaseService();

app.use(express.json());

const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : [];
console.log("Allowed origins: ", allowedOrigins);
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = "The CORS policy for this site does not allow access from the specified origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);

app.get("/", (req, res) => {
  res.send("Lease Management API");
});

// Get Lease Order by reference
// Request: GET /api/lease-order/:reference
// Response: 200 OK
// {
//   title: "string",
//   leases: ["string"],
//   nftId: "string",
//   createdAt: "string"
// }
app.get("/api/lease-order/:reference", (req, res) => {
  if (!req.params.reference) {
    res.status(400).json({ message: "Reference is required" });
    return;
  }

  const result = leaseService.getLeaseOrder(req.params.reference);

  if (!result) {
    res.status(404).json({ message: "Lease Order not found" });
    return;
  }

  res.json(result);
});

// Get Lease Order by reference
// Request: GET /api/lease-order/:reference
// Response: 200 OK
// {
//   title: "string",
//   leases: ["string"],
//   nftId: "string",
//   createdAt: "string"
// }
app.delete("/api/lease-order/:reference", (req, res) => {
  if (!req.params.reference) {
    res.status(400).json({ message: "Reference is required" });
    return;
  }

  const result = leaseService.deleteLeaseOrder(req.params.reference);
  if (!result) {
    res.status(404).json({ message: "Lease Order not found" });
    return;
  }
  res.json({ leaseOrder: result, message: "Lease Order has been deleted successfully" });
});

// Get all Lease Orders
// Request: GET /api/lease-orders
// Response: 200 OK
// [
//   {
//     title: "string",
//     leases: ["string"],
//     nftId: "string",
//     createdAt: "string"
//   },
// ]
app.get("/api/lease-orders", (req, res) => {
  try {
    const result = leaseService.getAllLeaseOrders();
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Get all Leases
// Request: GET /api/leases
// Response: 200 OK
// [
//   {
//     reference: "string",
//     property: "string"
//   },
// ]
app.get("/api/leases", (req, res) => {
  try {
    const result = leaseService.getAllLeases();
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Download all Leases to a file
// Request: GET /api/download-leases
// Response: 200 OK
// File download
app.get("/api/download-leases", (req, res) => {
  try {
    const leases = leaseService.getAllLeases();
    const filePath = "./leases.json";
    fs.writeFileSync(filePath, JSON.stringify(leases, null, 2));
    res.download(filePath, "leases.json", (err) => {
      if (err) {
        res.status(500).json({ message: "Error downloading the file" });
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload a file with leases
// Request: PUT /api/upload-leases
// Form data: file
// Response: 200 OK
const upload = multer({ dest: uploadDirectory });
app.put("/api/upload-leases", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "File is required" });
    return;
  }

  try {
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, "utf8");
    const leases = JSON.parse(fileContent);
    leaseService.updateAllLeases(leases);
    res.json({ message: "Leases have been uploaded and updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Lease Order Metadata by reference
// Request: GET /api/lease-order-metadata/:reference
// Response: 200 OK
// {
//   nftType: "string",
//   name: "string",
//   description: "string",
//   collection: {
//     name: "string",
//     family: "string",
//   },
//   attributes: [
//     {
//       trait_type: "string",
//       value: "string",
//     },
//   ],
//   createdAt: "string"
// }
app.get("/api/lease-order-metadata/:reference", (req, res) => {
  if (!req.params.reference) {
    res.status(400).json({ message: "Reference is required" });
    return;
  }

  try {
    const result = leaseService.getMetadata(req.params.reference);
    if (!result) {
      res.status(404).json({ message: "Metadata not found" });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Create Lease Order
// Request: POST /api/create-lease-order
// {
//   title: "string",
//   leases: ["string"],
// }
// Response: 200 OK
// {
//   leaseOrder: {
//     reference: "string",
//     title: "string",
//     leases: ["string"],
//     createdAt: "string"
//   },
//   message: "string"
// }
app.post("/api/create-lease-order", async (req, res) => {
  if (!req.body.title || !req.body.leases) {
    res.status(400).json({ message: "Title and Leases are required" });
    return;
  }

  try {
    const result = await leaseService.addLeaseOrder(req.body);
    res.json({ leaseOrder: result, message: "Lease Order has been created successfully" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Update Lease Order
// Request: PUT /api/update-lease-order
// {
//   reference: "string",
//   nftId: "string"
// }
// Response: 200 OK
// {
//   leaseOrder: {
//     reference: "string",
//     title: "string",
//     leases: ["string"],
//     nftId: "string"
//     createdAt: "string"
//   },
//   message: "string",
// }
app.put("/api/update-lease-order-nft", (req, res) => {
  if (!req.body.reference) {
    res.status(400).json({ message: "Reference is required" });
    return;
  } else if (!req.body.nftId) {
    res.status(400).json({ message: "NFT ID is required" });
    return;
  }

  try {
    const result = leaseService.updateLeaseOrderNftId(req.body.reference, req.body.nftId);
    if (!result) {
      res.status(404).json({ message: "Lease Order not found" });
      return;
    }
    res.json({ leaseOrder: result, message: "Lease Order has been updated successfully" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

console.log(`Server is running`);
http.createServer(app).listen(port, () => {
  console.log(`http://localhost:${port}`);
});
if (sslOptions) {
  https.createServer(sslOptions, app).listen(sslPort, () => {
    console.log(`https://localhost:${sslPort}`);
  });
}
