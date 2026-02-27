import { HTTP_STATUS_CODES } from './utils/constants';
import { ZodType } from 'zod';

export type JsonSchemaType = {
  type?: string;
  format?: string;
  properties?: Record<string, JsonSchemaType>;
  additionalProperties?: boolean | JsonSchemaType;
  required?: string[];
  items?: JsonSchemaType | JsonSchemaType[];
  enum?: unknown[];
  [key: string]: unknown;
};

export type ParameterType = {
  in: string;
  name: string;
  explode?: boolean;
  description?: string;
  required?: boolean;
  schema: JsonSchemaType;
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
  possibleStatusCodes?: number[];
} & (
  | {
      validate: true;
      body: ZodType<any>;
    }
  | {
      validate?: false;
      body?: ZodType<any>;
    }
);

export type SwaggerResponseType = {
  [code: string]: {
    description?: string;
    content?: {
      [key: 'application/json' | string]: {
        schema?: JsonSchemaType;
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
