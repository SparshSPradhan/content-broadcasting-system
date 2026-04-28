import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../config/env';


const isProd = env.NODE_ENV === 'production';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Content Broadcasting System API',
      version: '1.0.0',
      description: `
## Overview
A backend system for broadcasting educational content from teachers to students.

## Authentication
All protected routes require a Bearer JWT token. Obtain it via **/api/auth/login**.

## Roles
- **Principal**: Can view all content, approve/reject, and access analytics
- **Teacher**: Can upload content, view own uploads, and view their analytics

## Public API
The **/content/live/:teacherId** endpoint is **public** (no auth required) and rate-limited.
It returns the currently active content based on scheduling and rotation logic.

## Scheduling Logic
Content is scheduled using start/end time windows. Within a window, multiple content items
rotate based on their \`rotationDuration\` (in minutes). The rotation is computed using
modular arithmetic from the earliest \`startTime\` as the epoch.
      `,
      contact: {
        name: 'API Support',
        email: 'support@school.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
      {
        url: 'https://your-production-domain.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token (obtained from /api/auth/login)',
        },
      },
      schemas: {
        RegisterInput: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@school.com' },
            password: {
              type: 'string',
              minLength: 8,
              example: 'Password123!',
              description: 'Must contain uppercase, lowercase, and number',
            },
            role: { type: 'string', enum: ['principal', 'teacher'] },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'principal@school.com' },
            password: { type: 'string', example: 'Password123!' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            code: { type: 'string' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                totalPages: { type: 'integer' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication & registration' },
      { name: 'Content', description: 'Content upload, management & approval' },
      { name: 'Broadcasting - Public', description: 'Public live content endpoint (no auth)' },
      { name: 'Analytics', description: 'Subject analytics & content usage tracking' },
      { name: 'Scheduling', description: 'Rotation slots & schedule management' },
      { name: 'Users', description: 'User management' },
    ],
  },
//   apis: ['./src/modules/**/*.route.ts', './src/routes/*.ts'],
apis: isProd
    ? ['./dist/modules/**/*.route.js', './dist/routes/*.js']  // production
    : ['./src/modules/**/*.route.ts', './src/routes/*.ts'],   // local

};

export const swaggerSpec = swaggerJsdoc(options);