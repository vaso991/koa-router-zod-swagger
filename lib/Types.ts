import { JsonSchema7Type } from 'zod-to-json-schema/src/parseDef';
import { HTTP_STATUS_CODES } from './utils/Constants';
import { AnyZodObject, ZodEffects, ZodSchema } from 'zod';
import { JsonSchema7ObjectType } from 'zod-to-json-schema/src/parsers/object';
import { AnySchema } from 'joi';

export type AnyZodValidator = ZodSchema;
export type AnyJoiValidator = AnySchema;
export type AnyValidator = AnyZodValidator | AnyJoiValidator;

export type JsonSchemaType =
  | JsonSchema7ObjectType
  | {
      properties?: Record<string, JsonSchemaType>;
      additionalProperties?: boolean | JsonSchemaType;
      required?: string[];
    };

export type ParameterType = {
  in: string;
  name: string;
  explode?: boolean;
  description?: string;
  required?: boolean;
  schema: JsonSchema7Type;
};

type RequestType = 'application/json' | 'multipart/form-data';

export type RequestBodyType = {
  content: Partial<
    Record<
      RequestType,
      {
        schema?: JsonSchemaType;
      }
    >
  >;
};

export type PathParametersResponseType = {
  summary?: string;
  description?: string;
  parameters: ParameterType[];
  requestBody?: RequestBodyType;
  responses: SwaggerResponseType;
  tags?: [string];
};

export type PathObjectType = {
  [key: string]: {
    [key: string]: PathParametersResponseType;
  };
};

export type HttpStatusCodesType = (typeof HTTP_STATUS_CODES)[number];
export type ResponseType = {
  description?: string;
  validate?: boolean;
  possibleStatusCodes?: number[];
  body: AnyZodObject;
};

export type SwaggerResponseType = {
  [code: string]: {
    description?: string;
    content?: {
      [key: 'application/json' | string]: {
        schema?: JsonSchema7Type;
      };
    };
  };
};

export type FileRequestType =
  | boolean
  | {
      optional?: boolean;
      multiple?: boolean;
    };
export type FileRequestObjectType = Record<string, FileRequestType>;
