import { HTTP_STATUS_CODES } from './utils/Constants';
import { AnyZodObject } from 'zod';
import { JsonSchema7ObjectType, JsonSchema7Type } from 'zod-to-json-schema';

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
  possibleStatusCodes?: number[];
} & (
  | {
      validate: true;
      body: AnyZodObject;
    }
  | {
      validate?: false;
      body?: AnyZodObject;
    }
);

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
