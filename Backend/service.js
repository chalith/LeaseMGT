const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const MetadataHelper = require("./metadata-helper");

const leasesFilePath = "./data/leases.json";
const leaseOrdersFilePath = "./data/lease-orders.json";

class LeaseService {
  leases = [];
  leaseOrders = [];

  constructor() {
    this.#init();
  }

  #init() {
    fs.mkdirSync(path.dirname(leasesFilePath), { recursive: true });
    this.#readDataFromFiles();
  }

  #readDataFromFiles() {
    if (!fs.existsSync(leasesFilePath)) {
      fs.writeFileSync(leasesFilePath, JSON.stringify(this.leases, null, 2));
    } else {
      this.leases = JSON.parse(fs.readFileSync(leasesFilePath));
    }
    if (!fs.existsSync(leaseOrdersFilePath)) {
      fs.writeFileSync(leaseOrdersFilePath, JSON.stringify(this.leaseOrders, null, 2));
    } else {
      this.leaseOrders = JSON.parse(fs.readFileSync(leaseOrdersFilePath));
    }
  }

  #persistLeaseOrders() {
    fs.writeFileSync(leaseOrdersFilePath, JSON.stringify(this.leaseOrders, null, 2));
  }

  #persistLeases() {
    fs.writeFileSync(leasesFilePath, JSON.stringify(this.leases, null, 2));
  }

  async createMetadata(leaseOrder, leases) {
    await MetadataHelper.saveMetadata(leaseOrder, leases);
  }

  getMetadata(reference) {
    return MetadataHelper.getMetadata(reference);
  }

  updateAllLeases(updatedLeases) {
    this.leases = updatedLeases;
    this.#persistLeases();
  }

  getAllLeases() {
    return this.leases;
  }

  getLeaseOrder(reference) {
    return this.leaseOrders.find((leaseOrder) => leaseOrder.reference === reference);
  }

  getAllLeaseOrders() {
    return this.leaseOrders;
  }

  getLeaseOrderByReference(reference) {
    return this.leaseOrders.find((leaseOrder) => leaseOrder.reference === reference);
  }

  async addLeaseOrder(leaseOrder) {
    const leases = this.leases.filter((lease) => leaseOrder.leases.includes(lease.reference));
    if (!leases.length) {
      throw new Error("Leases not found");
    }

    const reference = uuidv4();
    leaseOrder.reference = reference;
    leaseOrder.createdAt = new Date().toISOString();
    await this.createMetadata(leaseOrder, leases);
    this.leaseOrders.push(leaseOrder);
    this.#persistLeaseOrders();
    return leaseOrder;
  }

  updateLeaseOrder(updatedLeaseOrder) {
    const index = this.leaseOrders.findIndex((leaseOrder) => leaseOrder.reference === updatedLeaseOrder.reference);
    let updated = null;
    if (index !== -1) {
      this.leaseOrders[index] = { ...this.leaseOrders[index], ...updatedLeaseOrder };
      updated = this.leaseOrders[index];
    }
    this.#persistLeaseOrders();
    return updated;
  }

  updateLeaseOrderNftId(reference, nftId) {
    const index = this.leaseOrders.findIndex((leaseOrder) => leaseOrder.reference === reference);
    let updated = null;
    if (index !== -1) {
      this.leaseOrders[index] = { ...this.leaseOrders[index], nftId: nftId };
      updated = this.leaseOrders[index];
    }
    this.#persistLeaseOrders();
    return updated;
  }

  deleteLeaseOrder(reference) {
    const index = this.leaseOrders.findIndex((leaseOrder) => leaseOrder.reference === reference);
    let deleted = null;
    if (index !== -1) {
      deleted = this.leaseOrders.splice(index, 1);
    }
    return deleted;
  }
}

module.exports = LeaseService;
