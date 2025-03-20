# Lease Management API

This document provides instructions on how to create a Linux systemd service to start the Lease Management API server.

## Prerequisites

- Node.js and npm installed on your system.
- The Lease Management API project cloned or copied to your server.
- SSL certificate files (`cert.pem`, `chain.pem`, `fullchain.pem`, `privkey.pem`) placed in the appropriate directory.

## Steps

### 1. Install Dependencies

Navigate to the project directory and install the required dependencies:

```sh
cd /path/to/your/project
npm install
```

### 2. Create a Systemd Service File

Create a new systemd service file for the Lease Management API. Open a terminal and run the following command:

```sh
sudo nano /etc/systemd/system/lease-management-api.service
```

Add the following content to the file:

```
[Unit]
Description=Lease Management API
After=network.target

[Service]
ExecStart=/usr/bin/node /path/to/your/project/index.js
WorkingDirectory=/path/to/your/project
Restart=always
User=your-username
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Replace `/path/to/your/project` with the actual path to your project directory and your-username with the user that should run the service.

### 3. Reload Systemd

Reload the systemd manager configuration to apply the new service:

```sh
sudo systemctl daemon-reload
```

### 4. Start and Enable the Service

Start the Lease Management API service:

```sh
sudo systemctl start lease-management-api
```

Enable the service to start on boot:

```sh
sudo systemctl enable lease-management-api
```

### 5. Check Service Status

Check the status of the service to ensure it is running correctly:

```sh
sudo systemctl status lease-management-api
```

You should see output indicating that the service is active and running.

### 6. Logs

To view the logs for the Lease Management API service, use the following command:

```sh
sudo journalctl -u lease-management-api -f
```

This will display the logs in real-time.
