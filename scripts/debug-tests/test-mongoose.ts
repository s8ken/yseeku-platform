import mongoose, { Schema, Document } from 'mongoose';

async function testMongooseSave() {
  await mongoose.connect('mongodb://localhost:27017/test_mongoose_save');
  
  const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    apiKeys: [{ provider: String, key: String }]
  });

  const User = mongoose.model('User', UserSchema);

  try {
    await User.deleteMany({});
    
    // 1. Create user
    console.log('Creating user...');
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    // 2. Fetch user without password
    console.log('Fetching user without password...');
    const user = await User.findOne({ email: 'test@example.com' }).select('-password');
    
    if (!user) throw new Error('User not found');

    // 3. Modify and save
    console.log('Modifying and saving...');
    user.apiKeys.push({ provider: 'anthropic', key: 'sk-test' });
    
    await user.save();
    console.log('Save successful!');

  } catch (error: any) {
    console.error('Save failed:', error.message);
    if (error.errors) {
      console.error('Validation errors:', Object.keys(error.errors));
    }
  } finally {
    await mongoose.connection.close();
  }
}

testMongooseSave();
