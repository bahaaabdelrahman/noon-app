const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('./src/models/Category');
const Product = require('./src/models/Product');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await Category.deleteMany();
    await Product.deleteMany();

    // Create categories
    const electronics = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      isActive: true,
      level: 0,
    });

    const phones = await Category.create({
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Mobile phones and smartphones',
      parentCategory: electronics._id,
      isActive: true,
      level: 1,
    });

    const laptops = await Category.create({
      name: 'Laptops',
      slug: 'laptops',
      description: 'Laptop computers',
      parentCategory: electronics._id,
      isActive: true,
      level: 1,
    });

    const clothing = await Category.create({
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and clothing items',
      isActive: true,
      level: 0,
    });

    // Create products
    const products = [
      {
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        sku: 'APPLE-IPH15PRO-128',
        description: 'Latest iPhone with advanced features',
        price: 999.99,
        pricing: {
          price: 999.99,
          comparePrice: 1099.99,
          costPerItem: 750.0,
        },
        category: phones._id,
        brand: 'Apple',
        tags: ['smartphone', 'apple', 'ios'],
        status: 'active',
        visibility: 'public',
        isFeatured: true,
        images: [
          {
            url: '/images/iphone-15-pro.jpg',
            alt: 'iPhone 15 Pro',
            isPrimary: true,
            publicId: 'iphone-15-pro-main',
          },
        ],
        inventory: {
          quantity: 50,
          trackQuantity: true,
          lowStockThreshold: 10,
          allowBackorder: false,
        },
        specifications: {
          Display: '6.1-inch Super Retina XDR',
          Processor: 'A17 Pro chip',
          Storage: '128GB',
          Camera: '48MP Main camera',
        },
      },
      {
        name: 'MacBook Pro 16"',
        slug: 'macbook-pro-16',
        sku: 'APPLE-MBP16-512',
        description: 'Professional laptop for creative work',
        price: 2499.99,
        pricing: {
          price: 2499.99,
          costPerItem: 1800.0,
        },
        category: laptops._id,
        brand: 'Apple',
        tags: ['laptop', 'apple', 'macbook'],
        status: 'active',
        visibility: 'public',
        isFeatured: true,
        images: [
          {
            url: '/images/macbook-pro-16.jpg',
            alt: 'MacBook Pro 16"',
            isPrimary: true,
            publicId: 'macbook-pro-16-main',
          },
        ],
        inventory: {
          quantity: 25,
          trackQuantity: true,
          lowStockThreshold: 5,
          allowBackorder: false,
        },
        specifications: {
          Display: '16-inch Liquid Retina XDR',
          Processor: 'M3 Pro chip',
          Memory: '18GB unified memory',
          Storage: '512GB SSD',
        },
      },
      {
        name: 'Samsung Galaxy S24',
        slug: 'samsung-galaxy-s24',
        sku: 'SAMSUNG-S24-256',
        description: 'Latest Samsung flagship smartphone',
        price: 799.99,
        pricing: {
          price: 799.99,
          comparePrice: 849.99,
          costPerItem: 500.0,
        },
        category: phones._id,
        brand: 'Samsung',
        tags: ['smartphone', 'samsung', 'android'],
        status: 'active',
        visibility: 'public',
        images: [
          {
            url: '/images/samsung-galaxy-s24.jpg',
            alt: 'Samsung Galaxy S24',
            isPrimary: true,
            publicId: 'samsung-galaxy-s24-main',
          },
        ],
        inventory: {
          quantity: 75,
          trackQuantity: true,
          lowStockThreshold: 15,
          allowBackorder: false,
        },
        specifications: {
          Display: '6.2-inch Dynamic AMOLED 2X',
          Processor: 'Snapdragon 8 Gen 3',
          Storage: '256GB',
          Camera: '50MP Triple camera',
        },
      },
      {
        name: 'Casual T-Shirt',
        slug: 'casual-t-shirt',
        sku: 'GENERIC-TSHIRT-001',
        description: 'Comfortable cotton t-shirt',
        price: 29.99,
        pricing: {
          price: 29.99,
          costPerItem: 15.0,
        },
        category: clothing._id,
        brand: 'GenericBrand',
        tags: ['clothing', 'tshirt', 'casual'],
        status: 'active',
        visibility: 'public',
        images: [
          {
            url: '/images/casual-tshirt.jpg',
            alt: 'Casual T-Shirt',
            isPrimary: true,
            publicId: 'casual-tshirt-main',
          },
        ],
        inventory: {
          quantity: 100,
          trackQuantity: true,
          lowStockThreshold: 20,
          allowBackorder: false,
        },
        variants: [
          { name: 'Size', options: ['S', 'M', 'L', 'XL'] },
          { name: 'Color', options: ['Black', 'White', 'Blue', 'Red'] },
        ],
      },
    ];

    await Product.insertMany(products);

    console.log('Sample data created successfully!');
    console.log(`Created ${await Category.countDocuments()} categories`);
    console.log(`Created ${await Product.countDocuments()} products`);
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

const main = async () => {
  await connectDB();
  await seedData();
  mongoose.connection.close();
  console.log('Database connection closed');
};

main();
