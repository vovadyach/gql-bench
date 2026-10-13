import express from 'express';
import { createSchema, createYoga } from 'graphql-yoga';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

async function main() {
  const app = express();
  const port = Number(process.env.PORT) || 3006;

  const yoga = createYoga({
    schema: createSchema({ typeDefs, resolvers }),
    // same defaults as the @graphql-yoga/nestjs driver
    logging: false,
    maskedErrors: false,
  });

  app.use(yoga.graphqlEndpoint, yoga);

  app.listen(port, '0.0.0.0', () => {
    console.info(`[Raw Express+Yoga] GraphQL ready at http://localhost:${port}/graphql`);
  });
}

main().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
