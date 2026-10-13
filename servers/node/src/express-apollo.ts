import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

async function main() {
  const app = express();
  const port = Number(process.env.PORT) || 3005;

  // introspection off, same as the NestJS AppModule
  const server = new ApolloServer({ typeDefs, resolvers, introspection: false });
  await server.start();

  app.use('/graphql', express.json(), expressMiddleware(server));

  app.listen(port, '0.0.0.0', () => {
    console.info(`[Raw Express+Apollo] GraphQL ready at http://localhost:${port}/graphql`);
  });
}

main().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
