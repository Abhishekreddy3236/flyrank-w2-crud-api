module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'A4 Auth API',
    version: '1.0.0',
    description: 'Authentication API with Supabase and JWT',
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/auth/signup': {
      post: {
        summary: 'Sign up a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'test@example.com' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Created' },
          400: { description: 'Bad Request' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Log in',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'test@example.com' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Success' },
          400: { description: 'Bad Request' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Log out',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'No Content' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/public/info': {
      get: {
        summary: 'Public info',
        responses: {
          200: { description: 'Success' },
        },
      },
    },
    '/protected/profile': {
      get: {
        summary: 'User profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Success' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/protected/dashboard': {
      get: {
        summary: 'User dashboard',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Success' },
          401: { description: 'Unauthorized' },
        },
      },
    },
  },
};
