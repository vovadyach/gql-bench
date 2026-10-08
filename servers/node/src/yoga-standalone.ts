import { createServer } from 'node:http';
import { createSchema, createYoga } from 'graphql-yoga';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  // same defaults as the @graphql-yoga/nestjs driver
  logging: false,
  maskedErrors: false,
});

const port = Number(process.env.PORT) || 3010;
const server = createServer(yoga);

server.listen(port, '0.0.0.0', () => {
  console.info(`[Yoga Standalone] GraphQL ready at http://localhost:${port}/graphql`);
});
