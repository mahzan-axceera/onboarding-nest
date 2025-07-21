import { CollectionCreateSchema } from "typesense/lib/Typesense/Collections";


export const postSchema: CollectionCreateSchema = {
  name: 'posts',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'bodyText', type: 'string' },
    { name: 'imageUrl', type: 'string' },
    { name: 'authorId', type: 'int64' },
    { name: 'createdAt', type: 'int64' },
  ],
  default_sorting_field: 'createdAt',
};