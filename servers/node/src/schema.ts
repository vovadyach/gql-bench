import { readFileSync } from 'fs';
import { resolve } from 'path';

export const typeDefs = readFileSync(
  resolve(__dirname, '../../../schema/benchmark.graphql'),
  'utf-8',
);
