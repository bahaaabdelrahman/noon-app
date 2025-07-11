const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

const User = require('../src/models/User');
const { USER_ROLES } = require('../src/config/constants');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = query => new Promise(resolve => rl.question(query, resolve));

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

const createCustomAdminUser = async () => {
  try {
    await connectDB();

    console.log('\n🔐 Admin User Creation Tool');
    console.log('============================\n');

    // Get user input
    const firstName = await question('Enter admin first name: ');
    const lastName = await question('Enter admin last name: ');
    const email = await question('Enter admin email: ');
    const password = await question(
      'Enter admin password (min 8 characters): '
    );
    const phone = await question('Enter admin phone (optional): ');

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format!');
      rl.close();
      return;
    }

    // Validate password length
    if (password.length < 8) {
      console.log('❌ Password must be at least 8 characters!');
      rl.close();
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User with this email already exists!');
      rl.close();
      return;
    }

    // Create admin user
    const adminData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.trim() || undefined,
      role: USER_ROLES.ADMIN,
      isActive: true,
      emailVerified: true,
    };

    const adminUser = await User.create(adminData);

    console.log('\n✅ Admin user created successfully!');
    console.log('================================');
    console.log('ID:', adminUser._id);
    console.log('Name:', `${adminUser.firstName} ${adminUser.lastName}`);
    console.log('Email:', adminUser.email);
    console.log('Role:', adminUser.role);
    console.log('Phone:', adminUser.phone || 'Not provided');
    console.log('\n🔑 You can now login with these credentials!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
};

// Run the script
createCustomAdminUser();
