const fs = require("fs");
const path = require("path");
const { env } = require("process");
const tinyurl = require("tinyurl");

const leaseOrderMetadataDirectory = "./data/order-metadata";

const metadataTemplate = {
  nftType: "leasemgt.v0",
  name: "",
  description: "",
  collection: {
    name: "Lease Order Collection",
    family: "Lease Order Collection",
  },
  attributes: [
    {
      trait_type: "Reference",
      value: "",
    },
    {
      trait_type: "Title",
      value: "",
    },
    {
      trait_type: "Created At",
      value: "",
    },
  ],
  createdAt: "",
};

class MetadataHelper {
  static async saveMetadata(order, leases) {
    const metadata = { ...metadataTemplate };
    metadata.name = order.reference;
    const orderLink = `${env.ORDER_LINK_PREFIX}/${order.reference}`;
    const tinyOrderLink = await tinyurl.shorten(orderLink);
    metadata.description = `Lease MGT Order NFT ${order.reference} is directly linked to: ${tinyOrderLink}`;
    metadata.createdAt = order.createdAt;
    metadata.attributes.find((attr) => attr.trait_type === "Reference").value = order.reference;
    metadata.attributes.find((attr) => attr.trait_type === "Title").value = order.title;
    metadata.attributes.find((attr) => attr.trait_type === "Created At").value = order.createdAt;
    metadata.attributes = [
      ...metadata.attributes,
      ...leases
        .map((lease, i) => {
          const leaseKey = `Lease ${i + 1}`;
          return Object.entries(lease)
            .map(([key, value]) => {
              if (!value) return null;
              const itemKey = `${leaseKey} ${key.at(0).toUpperCase() + key.slice(1)}`;
              return {
                trait_type: itemKey,
                value: value,
              };
            })
            .filter((x) => x);
        })
        .flat(),
    ];

    const filepath = path.join(leaseOrderMetadataDirectory, order.reference.toString() + ".json");
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(metadata, null, 2), "utf8");
    console.log("Metadata file has been written successfully.");
  }

  static getMetadata(reference) {
    const metaDataFilePath = path.join(leaseOrderMetadataDirectory, reference + ".json");
    if (fs.existsSync(metaDataFilePath)) {
      const metadata = JSON.parse(fs.readFileSync(metaDataFilePath, "utf8"));
      return metadata;
    } else {
      return null;
    }
  }
}

module.exports = MetadataHelper;
