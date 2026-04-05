require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const setupAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Hash the simple password "admin"
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin', salt);

    // Look for an existing user named 'admin'
    let adminUser = await User.findOne({ username: 'admin' });

    if (adminUser) {
      adminUser.passwordHash = passwordHash;
      adminUser.role = 'admin';
      await adminUser.save();
      console.log('Success: Re-secured existing admin user. Setting password to "admin".');
    } else {
      adminUser = new User({
        username: 'admin',
        passwordHash: passwordHash,
        role: 'admin'
      });
      await adminUser.save();
      console.log('Success: Injected a new admin account. Username: "admin", Password: "admin".');
    }

    process.exit(0);
  } catch (error) {
    console.error('Failed to setup admin user', error);
    process.exit(1);
  }
};

setupAdmin();
