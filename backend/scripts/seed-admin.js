const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const { USER_ROLES } = require('../src/config/constants');

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

const createAdminUser = async () => {
  try {
    await connectDB();

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      $or: [{ email: 'admin@noon-app.com' }, { role: USER_ROLES.ADMIN }],
    });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      return;
    }

    // Create admin user
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@noon-app.com',
      password: 'Admin@123456', // Change this to a secure password
      phone: '+1234567890',
      role: USER_ROLES.ADMIN,
      isActive: true,
      emailVerified: true, // Pre-verify admin email
    };

    const adminUser = await User.create(adminData);

    console.log('✅ Admin user created successfully!');
    console.log('Email:', adminUser.email);
    console.log(
      'Password: Admin@123456 (Please change this after first login)'
    );
    console.log('Role:', adminUser.role);
    console.log('ID:', adminUser._id);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the script
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };
