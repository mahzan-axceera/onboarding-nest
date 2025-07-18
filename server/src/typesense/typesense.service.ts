// src/typesense/typesense.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'typesense';
import { postSchema } from './schemas/posts.schema';

@Injectable()
export class TypesenseService implements OnModuleInit {
  private client: Client;

  constructor() {
    this.client = new Client({
      nodes: [
        {
          host: 'localhost',
          port: 8108,
          protocol: 'http',
        },
      ],
      apiKey: 'xyz', 
      connectionTimeoutSeconds: 5,
    });
  }

  async onModuleInit() {
    try {
      await this.client.collections('posts').retrieve();
    } catch (err) {
      if (err.httpStatus === 404) {
        await this.client.collections().create(postSchema);
      }
    }
  }

  async indexPost(post: any) {
    return this.client.collections('posts').documents().upsert(post);
  }

  async deletePost(id: string) {
    return this.client.collections('posts').documents(id).delete();
  }

  async searchPosts(query: string) {
    const searchResult = await this.client.collections('posts').documents().search({
      q: query,
      query_by: 'title,bodyText',
    });
    return searchResult.hits?.map(hit => hit.document) ?? [];
  }
}