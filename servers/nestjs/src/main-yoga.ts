import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { NestFactory } from '@nestjs/core';
import { AppModuleYoga } from './app.module-yoga';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModuleYoga,
    new FastifyAdapter(),
    { logger: false },
  );

  const port = process.env.PORT || 3004;
  await app.listen(port, '0.0.0.0');
  console.info(`[Yoga] GraphQL ready at http://localhost:${port}/graphql`);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
