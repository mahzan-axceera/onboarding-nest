
import { PrismaClient } from '@prisma/client';
import { Client } from 'typesense';

const prisma = new PrismaClient();
const typesense = new Client({
  nodes: [{ host: 'localhost', port: 8108, protocol: 'http' }],
  apiKey: 'xyz',
});

(async () => {
  const posts = await prisma.post.findMany();

  const formatted = posts.map(post => ({
    ...post,
    createdAt: new Date(post.createdAt).getTime(),
  }));

  for (const post of formatted) {
    await typesense.collections('posts').documents().upsert(post);
  }

  console.log('✅ Reindexing complete');
})();