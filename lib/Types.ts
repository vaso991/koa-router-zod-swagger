import { HTTP_STATUS_CODES } from './utils/Constants';
import { AnyZodObject } from 'zod';

export type SchemaType = {
  type: string | null;
  format?: string | null;
  required?: string[];
  properties?: BodyPropertiesType;
  items?: {
    type: string | null;
  };
};

export type BodyPropertiesType = {
  [key: string]: SchemaType;
};

export type ParameterType = {
  in: string;
  name: string;
  explode?: boolean;
  description?: string;
  required?: boolean;
  schema: SchemaType;
};

export type RequestBodyType = {
  content: {
    'application/json': {
      schema?: SchemaType;
    };
  };
};

export type ObjectKeysType = {
  [key: string]: { description: string };
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
}

export type HttpStatusCodesType = typeof HTTP_STATUS_CODES[number];
export type ResponseType = {
  description?: string,
  validate?: boolean,
  possibleStatusCodes?: number[],
  body: AnyZodObject
}

export type SwaggerResponseType = {
  [code: string]: {
    description?: string,
    content?: {
      [key: 'application/json' | string] : {
        schema?: SchemaType
      }
    }
  }
}