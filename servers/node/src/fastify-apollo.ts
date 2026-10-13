import Fastify from 'fastify';
import { ApolloServer } from '@apollo/server';
import fastifyApollo, { fastifyApolloDrainPlugin } from '@as-integrations/fastify';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

async function main() {
  const app = Fastify({ logger: false });
  const port = Number(process.env.PORT) || 3007;

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: false, // same as the NestJS AppModule
    plugins: [fastifyApolloDrainPlugin(app)],
  });
  await server.start();

  await app.register(fastifyApollo(server));

  await app.listen({ port, host: '0.0.0.0' });
  console.info(`[Raw Fastify+Apollo] GraphQL ready at http://localhost:${port}/graphql`);
}

main().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
