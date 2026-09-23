const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Task API",
    version: "1.0.0",
    description: "A simple CRUD API for managing a to-do list."
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local server"
    }
  ],
  paths: {
    "/": {
      get: {
        summary: "API information",
        responses: {
          "200": {
            description: "Returns API information"
          }
        }
      }
    },
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "Returns health status"
          }
        }
      }
    },
    "/tasks": {
      get: {
        summary: "List tasks",
        responses: {
          "200": {
            description: "A list of tasks"
          }
        }
      },
      post: {
        summary: "Create task",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" }
                },
                required: ["title"]
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Created task"
          },
          "400": {
            description: "Invalid input"
          }
        }
      }
    },
    "/tasks/{id}": {
      get: {
        summary: "Get one task",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          "200": {
            description: "A single task"
          },
          "404": {
            description: "Task not found"
          }
        }
      },
      put: {
        summary: "Update task",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  done: { type: "boolean" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Updated task"
          },
          "400": {
            description: "Invalid input"
          },
          "404": {
            description: "Task not found"
          }
        }
      },
      delete: {
        summary: "Delete task",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          "204": {
            description: "Task deleted successfully"
          },
          "404": {
            description: "Task not found"
          }
        }
      }
    }
  }
};

module.exports = swaggerDocument;
