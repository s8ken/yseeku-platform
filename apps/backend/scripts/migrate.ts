import fs from 'fs';
import path from 'path';
import { connectDatabase, disconnectDatabase } from '../src/config/database';

type Migration = { up: () => Promise<void>; down?: () => Promise<void> };

async function run() {
  const dir = path.join(process.cwd(), 'apps/backend/migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.js')).sort();
  await connectDatabase();
  for (const f of files) {
    const mod: Migration = await import(path.join(dir, f));
    if (mod.up) {
      console.log(`Running migration: ${f}`);
      await mod.up();
    }
  }
  await disconnectDatabase();
}

run().catch(err => { console.error(err); process.exit(1); });

