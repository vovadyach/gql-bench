import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const port = process.env.PORT || 3001;

  await app.listen(port);
  console.log(`[Express] GraphQL ready at http://localhost:${port}/graphql`);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
