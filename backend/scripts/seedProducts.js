
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Product from "../models/Product.js";

dotenv.config();

const products = [
  {
    name: "LED Bulb 9W",
    slug: "led-bulb-9w",
    sku: "VE-LED-009",
    description: "Energy-efficient LED bulb for everyday home lighting.",
    shortDescription: "9W energy-saving LED bulb",
    category: "LED Lights",
    brand: "Vishal Electricals",
    price: 99,
    compareAtPrice: 129,
    stock: 50,
    isActive: true,
    isFeatured: true,
    isBestSeller: true,
    images: [
      {
        url: "https://placehold.co/600x600/fef3c7/92400e?text=LED+Bulb",
        alt: "LED bulb",
      },
    ],
    specifications: [
      { name: "Power", value: "9W" },
      { name: "Type", value: "LED" },
    ],
    warranty: {
      duration: 6,
      unit: "months",
      description: "Sample warranty; confirm actual brand terms before sale.",
    },
    tags: ["LED", "bulb", "lighting"],
  },
  {
    name: "Ceiling Fan",
    slug: "ceiling-fan",
    sku: "VE-FAN-001",
    description: "Ceiling fan for everyday household use.",
    shortDescription: "Home ceiling fan",
    category: "Fans",
    brand: "Vishal Electricals",
    price: 1499,
    compareAtPrice: 1799,
    stock: 20,
    isActive: true,
    isFeatured: true,
    images: [
      {
        url: "https://placehold.co/600x600/e0f2fe/075985?text=Ceiling+Fan",
        alt: "Ceiling fan",
      },
    ],
    specifications: [
      { name: "Type", value: "Ceiling Fan" },
      { name: "Usage", value: "Home" },
    ],
    warranty: {
      duration: 1,
      unit: "years",
      description: "Sample warranty; confirm actual brand terms before sale.",
    },
    tags: ["fan", "ceiling fan"],
  },
  {
    name: "Electrical Wire 90m",
    slug: "electrical-wire-90m",
    sku: "VE-WIRE-090",
    description: "Electrical wire for suitable household wiring applications.",
    shortDescription: "90-metre electrical wire",
    category: "Wires & Cables",
    brand: "Vishal Electricals",
    price: 1299,
    stock: 15,
    isActive: true,
    isFeatured: true,
    images: [
      {
        url: "https://placehold.co/600x600/ffe4e6/9f1239?text=Electrical+Wire",
        alt: "Electrical wire",
      },
    ],
    specifications: [
      { name: "Length", value: "90 metres" },
      { name: "Type", value: "Electrical wire" },
    ],
    tags: ["wire", "cable", "electrical"],
  },
  {
    name: "Modular Switch",
    slug: "modular-switch",
    sku: "VE-SW-001",
    description: "Modular switch for compatible electrical installations.",
    shortDescription: "Modular electrical switch",
    category: "Switches",
    brand: "Vishal Electricals",
    price: 75,
    stock: 100,
    isActive: true,
    isFeatured: true,
    images: [
      {
        url: "https://placehold.co/600x600/ede9fe/5b21b6?text=Switch",
        alt: "Modular switch",
      },
    ],
    specifications: [
      { name: "Type", value: "Modular switch" },
    ],
    tags: ["switch", "modular"],
  },
  {
    name: "Air Cooler",
    slug: "air-cooler",
    sku: "VE-COOLER-001",
    description: "Air cooler for home use.",
    shortDescription: "Home air cooler",
    category: "Coolers",
    brand: "Vishal Electricals",
    price: 5499,
    compareAtPrice: 5999,
    stock: 8,
    isActive: true,
    isFeatured: true,
    images: [
      {
        url: "https://placehold.co/600x600/cffafe/155e75?text=Air+Cooler",
        alt: "Air cooler",
      },
    ],
    specifications: [
      { name: "Type", value: "Air cooler" },
      { name: "Usage", value: "Home" },
    ],
    tags: ["cooler", "air cooler"],
  },
  {
    name: "Extension Board",
    slug: "extension-board",
    sku: "VE-EXT-001",
    description: "Extension board for compatible household electronics.",
    shortDescription: "Multi-socket extension board",
    category: "Electrical Appliances",
    brand: "Vishal Electricals",
    price: 349,
    stock: 25,
    isActive: true,
    isFeatured: true,
    images: [
      {
        url: "https://placehold.co/600x600/ffedd5/9a3412?text=Extension+Board",
        alt: "Extension board",
      },
    ],
    specifications: [
      { name: "Type", value: "Extension board" },
    ],
    tags: ["extension board", "appliances"],
  },
];

const seedProducts = async () => {
  try {
    await connectDB();

    let added = 0;
    let updated = 0;

    for (const product of products) {
      const existing = await Product.findOne({
        $or: [
          { slug: product.slug },
          { sku: product.sku },
        ],
      });

      if (existing) {
        console.log(`Already exists, skipped: ${product.name}`);
        continue;
      }

      await Product.create(product);
      console.log(`Added: ${product.name}`);
      added++;
    }

    updated = 0;

    console.log("\nProduct seeding complete.");
    console.log(`Added: ${added}`);
    console.log(`Updated: ${updated}`);
    console.log(`Sample products processed: ${products.length}`);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedProducts();
