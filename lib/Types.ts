
export type SchemaType = {
  type: string | null;
  format?: string | null;
  required?: string[];
  properties?: BodyProperties;
  items?: {
    type: string | null;
  };
};

export type BodyProperties = {
  [key: string]: SchemaType;
};

export type Parameter = {
  in: string;
  name: string;
  explode?: boolean;
  description?: string;
  required?: boolean;
  schema: SchemaType;
};

export type RequestBody = {
  content: {
    'application/json': {
      schema: SchemaType;
    };
  };
};

export type IObjectKeys = {
  [key: string]: { description: string };
};

export type PathParametersResponse = {
  summary?: string;
  description?: string;
  parameters: Parameter[];
  requestBody?: RequestBody;
  responses: IObjectKeys;
  tags?: [string];
};

export type IPathObject = {
  [key: string]: {
    [key: string]: PathParametersResponse;
  };
}