import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import { createSchema, createYoga } from 'graphql-yoga';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

async function main() {
  const app = fastify({ logger: false });
  const port = Number(process.env.PORT) || 3009;

  const yoga = createYoga<{ req: FastifyRequest; reply: FastifyReply }>({
    schema: createSchema({ typeDefs, resolvers }),
    // same defaults as the @graphql-yoga/nestjs driver
    logging: false,
    maskedErrors: false,
  });

  // Fastify 4 can't send Yoga's ponyfilled Response directly, so copy it over
  // (same bridge the @graphql-yoga/nestjs driver uses)
  app.route({
    url: yoga.graphqlEndpoint,
    method: ['GET', 'POST', 'OPTIONS'],
    handler: async (req, reply) => {
      const response = await yoga.handleNodeRequestAndResponse(req, reply, { req, reply });
      response.headers.forEach((value, key) => reply.header(key, value));
      reply.status(response.status);
      reply.send(response.body);
      return reply;
    },
  });

  await app.listen({ port, host: '0.0.0.0' });
  console.info(`[Raw Fastify+Yoga] GraphQL ready at http://localhost:${port}/graphql`);
}

main().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
