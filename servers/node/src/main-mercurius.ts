import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModuleMercurius } from './app.module-mercurius';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModuleMercurius, // ← Mercurius module instead of Apollo
    new FastifyAdapter(),
    { logger: false },
  );

  const port = process.env.PORT || 3003;
  await app.listen(port, '0.0.0.0');
  console.info(`[Mercurius] GraphQL ready at http://localhost:${port}/graphql`);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
