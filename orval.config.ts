import { defineConfig } from 'orval';

export default defineConfig({
  a7Service: {
    input: {
      target: './api-docs.json',
    },
    output: {
      mode: 'split',
      target: 'src/apiV2/a7-service/index.ts',
      schemas: 'src/apiV2/a7-service/model',
      client: 'react-query',
      clean: true,
    },
  },
});
