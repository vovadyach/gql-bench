// src/app.module.ts
//
// Apollo-based module. Used by Express and Fastify+Apollo.
// Imports shared types, data service, and resolver.

import {Module} from "@nestjs/common";
import {GraphQLModule} from "@nestjs/graphql";
import {ApolloDriver, ApolloDriverConfig} from "@nestjs/apollo";

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: false,
      introspection: false,
    })
  ],
  providers: []
})
export class AppModule {}
