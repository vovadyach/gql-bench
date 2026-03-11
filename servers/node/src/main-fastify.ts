import 'reflect-metadata';
import {NestFactory} from "@nestjs/core";
import {FastifyAdapter, NestFastifyApplication} from "@nestjs/platform-fastify";
import {AppModule} from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: ['log', 'error', 'warn'] },
  );

  const port = process.env.PORT || 3002;
  await app.listen(port, '0.0.0.0'); // Fastify needs '0.0.0.0'
  console.info(`[Fastify] GraphQL ready at http://localhost:${port}/graphql`);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});