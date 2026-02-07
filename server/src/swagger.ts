import swaggerJSDoc from 'swagger-jsdoc';

const definition = {
  openapi: '3.0.0',
  info: {
    title: 'Word Hunt Solver API',
    version: '1.0.0',
    description: 'API for solving Word Hunt boards.',
  },
  servers: [
    {
      url: 'http://localhost:5174',
      description: 'Local dev server',
    },
  ],
  components: {
    schemas: {
      SolveRequest: {
        type: 'object',
        properties: {
          board: {
            type: 'array',
            items: { type: 'string', example: 'A' },
            minItems: 16,
            maxItems: 16,
          },
        },
        required: ['board'],
      },
      SolveResult: {
        type: 'object',
        properties: {
          word: { type: 'string', example: 'TEST' },
          path: { type: 'array', items: { type: 'number' }, example: [0, 1, 2, 3] },
          score: { type: 'number', example: 7 },
          length: { type: 'number', example: 4 },
        },
      },
      SolveResponse: {
        type: 'object',
        properties: {
          results: { type: 'array', items: { $ref: '#/components/schemas/SolveResult' } },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          wordsCount: { type: 'number', example: 1000 },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/solve': {
      post: {
        summary: 'Solve a Word Hunt board',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SolveRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Solved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SolveResponse' },
              },
            },
          },
          400: { description: 'Bad request' },
          503: { description: 'Dictionary not loaded' },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJSDoc({
  definition,
  apis: [],
});
