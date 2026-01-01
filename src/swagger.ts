import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "REST API Documentation",
      version: "1.0.0",
      description: "API for managing Users, Posts, and Comments with JWT authentication",
      contact: {
        name: "Dotan and Emily",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
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
          required: ["email", "password"],
          properties: {
            _id: {
              type: "string",
              description: "User ID (MongoDB ObjectId)",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            password: {
              type: "string",
              description: "User password (hashed)",
            },
            refreshTokens: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of refresh tokens",
            },
          },
        },
        UserRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            password: {
              type: "string",
              example: "password123",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            accessToken: {
              type: "string",
              description: "JWT access token",
            },
            refreshToken: {
              type: "string",
              description: "JWT refresh token",
            },
          },
        },
        Post: {
          type: "object",
          required: ["sender", "message"],
          properties: {
            _id: {
              type: "string",
              description: "Post ID (MongoDB ObjectId)",
            },
            sender: {
              type: "string",
              description: "User who created the post",
            },
            message: {
              type: "string",
              description: "Post content",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Post creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Post last update timestamp",
            },
          },
        },
        PostRequest: {
          type: "object",
          required: ["sender", "message"],
          properties: {
            sender: {
              type: "string",
              example: "John Doe",
            },
            message: {
              type: "string",
              example: "This is my first post!",
            },
          },
        },
        Comment: {
          type: "object",
          required: ["postId", "sender", "message"],
          properties: {
            _id: {
              type: "string",
              description: "Comment ID (MongoDB ObjectId)",
            },
            postId: {
              type: "string",
              description: "ID of the post this comment belongs to",
            },
            sender: {
              type: "string",
              description: "User who created the comment",
            },
            message: {
              type: "string",
              description: "Comment content",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Comment creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Comment last update timestamp",
            },
          },
        },
        CommentRequest: {
          type: "object",
          required: ["sender", "message"],
          properties: {
            sender: {
              type: "string",
              example: "Jane Smith",
            },
            message: {
              type: "string",
              example: "Great post!",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Error message",
            },
          },
        },
      },
    },
    security: [],
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
