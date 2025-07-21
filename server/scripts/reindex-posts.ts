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
    id: post.id.toString(), // required as string
    authorId: Number(post.authorId), // required as int64
    createdAt: new Date(post.createdAt).getTime(),
  }));

  const result = await typesense.collections('posts').documents().import(
    formatted.map(p => JSON.stringify(p)).join('\n'),
    { action: 'upsert' }
  );

  console.log(result);
  console.log('✅ Reindexing complete');
})();