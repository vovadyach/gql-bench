import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { BenchResolver, DataService } from './shared';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';

@Module({
  imports: [
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      autoSchemaFile: true,
      introspection: false,
    }),
  ],
  providers: [BenchResolver, DataService],
})
export class AppModuleYoga {}
