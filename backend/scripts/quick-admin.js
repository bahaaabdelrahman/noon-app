const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const { USER_ROLES } = require('../src/config/constants');

// Quick admin user creation
const quickCreateAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const adminUser = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@noon-app.com',
      password: 'SuperAdmin@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true,
      emailVerified: true,
    });

    console.log('✅ Super Admin created!');
    console.log('Email: superadmin@noon-app.com');
    console.log('Password: SuperAdmin@123');
    console.log('Role:', adminUser.role);
  } catch (error) {
    if (error.code === 11000) {
      console.log('❌ Super admin already exists!');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await mongoose.connection.close();
  }
};

quickCreateAdmin();
