import "dotenv/config";
import mongoose from "mongoose";
import { connectToDb } from "./config/database.js";
import userModel from "./models/user.model.js";
import productModel from "./models/product.model.js";

const SEED_PRODUCTS = [
  {
    title: "Acid Wash Heavyweight Oversized Tee",
    description: "280 GSM premium French terry cotton with vintage garment dye and drop shoulder silhouette.",
    price: { amount: 1299, currency: "INR" },
    images: [
      { url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80" },
      { url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80" }
    ],
    varients: [
      {
        attributes: { Size: "S", Color: "Vintage Charcoal" },
        stock: 10,
        price: { amount: 1199, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "M", Color: "Vintage Charcoal" },
        stock: 15,
        price: { amount: 1299, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "L", Color: "Vintage Charcoal" },
        stock: 12,
        price: { amount: 1299, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "XL", Color: "Vintage Charcoal" },
        stock: 8,
        price: { amount: 1499, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "M", Color: "Washed Olive" },
        stock: 10,
        price: { amount: 1299, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "L", Color: "Washed Olive" },
        stock: 8,
        price: { amount: 1299, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80" }]
      }
    ]
  },
  {
    title: "Cuban Collar Textured Resort Shirt",
    description: "Breathable waffle-knit linen blend featuring camp collar and natural horn buttons.",
    price: { amount: 1899, currency: "INR" },
    images: [
      { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80" },
      { url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80" }
    ],
    varients: [
      {
        attributes: { Size: "S", Color: "Sand Beige" },
        stock: 5,
        price: { amount: 1799, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "M", Color: "Sand Beige" },
        stock: 12,
        price: { amount: 1899, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "L", Color: "Sand Beige" },
        stock: 8,
        price: { amount: 1899, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "XL", Color: "Sand Beige" },
        stock: 5,
        price: { amount: 2099, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "M", Color: "Midnight Navy" },
        stock: 9,
        price: { amount: 1899, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80" }]
      }
    ]
  },
  {
    title: "Tactical 6-Pocket Relaxed Cargo Pants",
    description: "Ripstop cotton utility trousers equipped with deep gusseted pockets and adjustable ankle bungee cords.",
    price: { amount: 2499, currency: "INR" },
    images: [
      { url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80" },
      { url: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80" }
    ],
    varients: [
      {
        attributes: { Size: "30", Color: "Matte Black" },
        stock: 6,
        price: { amount: 2399, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "32", Color: "Matte Black" },
        stock: 10,
        price: { amount: 2499, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "34", Color: "Matte Black" },
        stock: 6,
        price: { amount: 2499, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "36", Color: "Matte Black" },
        stock: 3,
        price: { amount: 2699, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "32", Color: "Military Olive" },
        stock: 8,
        price: { amount: 2499, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80" }]
      }
    ]
  },
  {
    title: "Varsity Wool & Leather Streetwear Jacket",
    description: "Heavyweight wool body with vegan leather contrast sleeves, chenille embroidery, and quilted satin interior.",
    price: { amount: 3999, currency: "INR" },
    images: [
      { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80" },
      { url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80" }
    ],
    varients: [
      {
        attributes: { Size: "S", Color: "Monochrome Black" },
        stock: 4,
        price: { amount: 3799, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "M", Color: "Monochrome Black" },
        stock: 7,
        price: { amount: 3999, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "L", Color: "Monochrome Black" },
        stock: 5,
        price: { amount: 3999, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "XL", Color: "Monochrome Black" },
        stock: 2,
        price: { amount: 4299, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "M", Color: "Forest Green / Cream" },
        stock: 5,
        price: { amount: 4199, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80" }]
      }
    ]
  },
  {
    title: "Retro Chunky Suede Low-Top Sneakers",
    description: "Multi-layered suede and breathable mesh upper with high-traction vulcanized rubber outsole.",
    price: { amount: 3299, currency: "INR" },
    images: [
      { url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80" },
      { url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80" }
    ],
    varients: [
      {
        attributes: { Size: "UK 7", Color: "Panda Black & White" },
        stock: 5,
        price: { amount: 3299, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "UK 8", Color: "Panda Black & White" },
        stock: 10,
        price: { amount: 3299, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "UK 9", Color: "Panda Black & White" },
        stock: 7,
        price: { amount: 3499, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "UK 10", Color: "Panda Black & White" },
        stock: 4,
        price: { amount: 3499, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "UK 8", Color: "Sand Mist" },
        stock: 8,
        price: { amount: 3399, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80" }]
      }
    ]
  },
  {
    title: "Tokyo Cyberpunk Kanji Oversized Tee",
    description: "Silkscreen graphic backprint on 270 GSM heavyweight combed cotton with ribbed crewneck.",
    price: { amount: 1399, currency: "INR" },
    images: [
      { url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80" },
      { url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80" }
    ],
    varients: [
      {
        attributes: { Size: "S", Color: "Phantom Black" },
        stock: 8,
        price: { amount: 1299, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "M", Color: "Phantom Black" },
        stock: 16,
        price: { amount: 1399, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "L", Color: "Phantom Black" },
        stock: 12,
        price: { amount: 1399, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "XL", Color: "Phantom Black" },
        stock: 4,
        price: { amount: 1499, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "M", Color: "Crimson Red" },
        stock: 9,
        price: { amount: 1399, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80" }]
      }
    ]
  },
  {
    title: "Heavy Corduroy Worker Jacket with Sherpa Collar",
    description: "Wide-wale plush corduroy jacket lined with insulating sherpa fleece and dual front utility pockets.",
    price: { amount: 3699, currency: "INR" },
    images: [
      { url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80" },
      { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80" }
    ],
    varients: [
      {
        attributes: { Size: "S", Color: "Tobacco Brown" },
        stock: 4,
        price: { amount: 3499, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "M", Color: "Tobacco Brown" },
        stock: 8,
        price: { amount: 3699, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "L", Color: "Tobacco Brown" },
        stock: 5,
        price: { amount: 3699, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "XL", Color: "Tobacco Brown" },
        stock: 3,
        price: { amount: 3999, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "M", Color: "Forest Emerald" },
        stock: 6,
        price: { amount: 3799, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80" }]
      }
    ]
  },
  {
    title: "Double Pleated Wide-Leg Linen Trousers",
    description: "Pure European linen tailored with front double pleats, belt loops, and back welt pockets for effortless resort style.",
    price: { amount: 2399, currency: "INR" },
    images: [
      { url: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=800&q=80" },
      { url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80" }
    ],
    varients: [
      {
        attributes: { Size: "30", Color: "Natural Flax" },
        stock: 6,
        price: { amount: 2299, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "32", Color: "Natural Flax" },
        stock: 12,
        price: { amount: 2399, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "34", Color: "Natural Flax" },
        stock: 8,
        price: { amount: 2399, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "36", Color: "Natural Flax" },
        stock: 3,
        price: { amount: 2599, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=800&q=80" }]
      },
      {
        attributes: { Size: "32", Color: "Terracotta" },
        stock: 9,
        price: { amount: 2399, currency: "INR" },
        images: [{ url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80" }]
      }
    ]
  }
];

async function seed() {
  try {
    await connectToDb();
    console.log("Connected to database for seeding.");

    // Find or create a default seller user
    let seller = await userModel.findOne({ role: "seller" });
    if (!seller) {
      seller = await userModel.create({
        email: "official.seller@snitch.co",
        fullname: "SNITCH Official Store",
        role: "seller",
        password: "SellerPassword123!"
      });
      console.log("Created default seller:", seller.email);
    }

    console.log(`Using seller ID: ${seller._id}`);

    // Insert products
    let insertedCount = 0;
    for (const p of SEED_PRODUCTS) {
      const existing = await productModel.findOne({ title: p.title });
      if (!existing) {
        await productModel.create({
          ...p,
          seller: seller._id
        });
        insertedCount++;
        console.log(`✓ Inserted product with ${p.varients.length} variants: "${p.title}"`);
      } else {
        console.log(`ℹ Product already exists: "${p.title}"`);
      }
    }

    console.log(`\nSeed completed! Added ${insertedCount} new products with variants.`);
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
