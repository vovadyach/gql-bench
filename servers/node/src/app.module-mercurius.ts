import {Module} from "@nestjs/common";
import {GraphQLModule} from "@nestjs/graphql";
import {MercuriusDriver, MercuriusDriverConfig} from "@nestjs/mercurius";
import {BenchResolver, DataService} from "./shared";

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      autoSchemaFile: true,
      graphiql: false
    }),
  ],
  providers: [DataService, BenchResolver],
})
export class AppModuleMercurius {}
