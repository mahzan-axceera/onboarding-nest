import { CollectionCreateSchema } from "typesense/lib/Typesense/Collections";


export const postSchema: CollectionCreateSchema = {
  name: 'posts',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'content', type: 'string' },
    { name: 'authorId', type: 'string' },
    { name: 'createdAt', type: 'int64' },
  ],
  default_sorting_field: 'createdAt',
};