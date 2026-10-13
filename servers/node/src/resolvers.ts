import { makeUser, cpuWork, getUptime } from './data';

const isoCreatedAt = ({ createdAt }: { createdAt: Date }) => createdAt.toISOString();

export const resolvers = {
  // Same cost model as the NestJS DateTime scalar: format a date only if the query selects it
  Comment: { createdAt: isoCreatedAt },
  Post: { createdAt: isoCreatedAt },
  User: { createdAt: isoCreatedAt },

  Query: {
    health: () => ({
      status: 'ok',
      adapter: process.env.ADAPTER || 'Unknown',
      uptimeSeconds: getUptime(),
      timestamp: new Date().toISOString(),
    }),

    user: async (_: unknown, { id }: { id: number }) => {
      await new Promise((r) => setTimeout(r, 1));
      return makeUser(id, 3, 2);
    },

    users: async (_: unknown, { page, pageSize }: { page: number; pageSize: number }) => {
      await new Promise((r) => setTimeout(r, 3));
      const items = Array.from({ length: pageSize }, (_, i) =>
        makeUser((page - 1) * pageSize + i, 3, 2),
      );
      return { items, total: 100, page, pageSize, hasMore: page + pageSize < 100 };
    },

    deepNested: async (_: unknown, { count }: { count: number }) => {
      await new Promise((r) => setTimeout(r, 3));
      cpuWork(10000);
      return Array.from({ length: count }, (_, i) => makeUser(i, 10, 8));
    },

    search: async (_: unknown, { input }: { input: { query: string; limit?: number } }) => {
      const start = performance.now();
      await new Promise((r) => setTimeout(r, 2));
      cpuWork(10000);
      const limit = input.limit || 10;
      const users = Array.from({ length: Math.min(limit, 20) }, (_, i) => makeUser(i, 2, 1));
      const posts = users.flatMap((u) => u.posts).slice(0, limit);
      return {
        users,
        posts,
        totalResults: users.length + posts.length,
        queryTimeMs: +(performance.now() - start).toFixed(2),
      };
    },
  },

  Mutation: {
    createPost: async (
      _: unknown,
      {
        userId,
        input,
      }: { userId: number; input: { title: string; body: string; tags?: string[] } },
    ) => {
      await new Promise((r) => setTimeout(r, 3));

      return {
        id: `post-new-${Date.now()}`,
        title: input.title,
        body: input.body,
        status: 'DRAFT',
        tags: input.tags || [],
        viewCount: 0,
        rating: 0,
        createdAt: new Date(),
        comments: [],
      };
    },
  },
};
