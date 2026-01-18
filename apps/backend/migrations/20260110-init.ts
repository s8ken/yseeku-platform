import mongoose from 'mongoose';

export async function up(): Promise<void> {
  await mongoose.connection.db.collection('__migrations').updateOne(
    { name: '20260110-init' },
    { $set: { appliedAt: new Date() } },
    { upsert: true }
  );
}

