import Fastify from 'fastify';
import mercurius from 'mercurius';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

async function main() {
  const app = Fastify({ logger: false });
  const port = Number(process.env.PORT) || 3008;

  app.register(mercurius, {
    schema: typeDefs,
    resolvers,
    graphiql: false,
  });

  await app.listen({ port, host: '0.0.0.0' });
  console.info(`[Raw Fastify+Mercurius] GraphQL ready at http://localhost:${port}/graphql`);
}

main().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
