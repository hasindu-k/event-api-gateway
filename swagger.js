const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Event API Gateway",
      version: "1.0.0",
      description: "API Gateway for Event Management Microservices",
    },
    servers: [
      {
        url: process.env.BASE_URL || "http://localhost:8086",
        description: "API Gateway Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "67d7d4dcf89bc5fbeb0bf12a",
            },
            name: {
              type: "string",
              example: "Anuja Silva",
            },
            email: {
              type: "string",
              example: "anuja@gmail.com",
            },
            role: {
              type: "string",
              enum: ["USER", "ADMIN"],
              example: "USER",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: {
              type: "string",
              example: "Anuja Silva",
            },
            email: {
              type: "string",
              example: "anuja@gmail.com",
            },
            password: {
              type: "string",
              example: "123456",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              example: "anuja@gmail.com",
            },
            password: {
              type: "string",
              example: "123456",
            },
          },
        },
        UpdateUserRequest: {
          type: "object",
          properties: {
            name: {
              type: "string",
              example: "Anuja Perera",
            },
            email: {
              type: "string",
              example: "anuja.perera@gmail.com",
            },
            password: {
              type: "string",
              example: "newpassword123",
            },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
            },
            user: {
              $ref: "#/components/schemas/User",
            },
          },
        },
        UserExistsResponse: {
          type: "object",
          properties: {
            exists: {
              type: "boolean",
              example: true,
            },
            user: {
              nullable: true,
              allOf: [{ $ref: "#/components/schemas/User" }],
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
