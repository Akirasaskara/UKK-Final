import Joi from 'joi';

export const environmentSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  PORT: Joi.number().default(3000),
  APP_PORT: Joi.number().default(3000),
  APP_BASE_URL: Joi.string().uri().default('http://localhost:3000'),
  DATABASE_URL: Joi.string().required().messages({
    'any.required': 'DATABASE_URL environment variable is required',
  }),
  JWT_SECRET: Joi.string().min(32).required().messages({
    'any.required': 'JWT_SECRET environment variable is required and must be at least 32 characters long',
    'string.min': 'JWT_SECRET must be at least 32 characters long for security',
  }),
  JWT_EXPIRATION: Joi.string().default('1d'),
  CORS_ALLOWED_ORIGINS: Joi.string().default('http://localhost:3001'),
  TRUST_PROXY: Joi.string().default('1'),
  SWAGGER_ENABLED: Joi.boolean().default((parent) => parent.NODE_ENV !== 'production'),
  STORAGE_DRIVER: Joi.string().valid('local', 's3').default('local'),
  LOCAL_UPLOAD_DIR: Joi.string().default('uploads'),
  AWS_REGION: Joi.string().default('us-east-1'),
  S3_BUCKET_NAME: Joi.string().optional().allow(''),
  S3_PUBLIC_BASE_URL: Joi.string().optional().allow(''),
  UPLOAD_MAX_BYTES: Joi.number().default(5242880),
  RATE_LIMIT_TTL_MS: Joi.number().default(60000),
  RATE_LIMIT_DEFAULT: Joi.number().default(100),
});
