import Router from 'koa-router';
import { koaSwagger, KoaSwaggerUiOptions } from 'koa2-swagger-ui';
import statuses from 'statuses';
import {
  AnyZodObject,
  ZodType,
  ZodObject,
  ZodString,
  ZodNumber,
  ZodBigInt,
  ZodBoolean,
  ZodArray,
  ZodOptional,
  ZodOptionalDef,
  ZodDate,
} from 'zod';
import { ZodValidatorProps } from './ZodValidator';

type SchemaType = {
  type: string | null;
  format?: string | null;
  required?: string[];
  properties?: BodyProperties;
  items?: {
    type: string | null;
  };
};
type BodyProperties = {
  [key: string]: SchemaType;
};

type Parameter = {
  in: string;
  name: string;
  explode?: boolean;
  description?: string;
  required?: boolean;
  schema: SchemaType;
};

type IObjectKeys = {
  [key: string]: { description: string };
};

type PathParametersResponse = {
  summary?: string;
  description?: string;
  parameters: Parameter[];
  responses: IObjectKeys;
  tags?: [string];
};

interface IPathObject {
  [key: string]: {
    [key: string]: PathParametersResponse;
  };
}

const DEFAULT_RESPONSES = [200, 201, 400, 500];

const ALLOWED_METHODS = ['get', 'put', 'patch', 'post', 'delete'];

const KoaRouterSwagger = (
  router: Router,
  uiConfig: Partial<KoaSwaggerUiOptions>,
) => {
  const paths = MapAllMethods(router);

  return CreateKoaSwagger(paths, router, uiConfig);
};

const MapAllMethods = (router: Router) => {
  const paths: IPathObject = {};
  router.stack.forEach((stack: Router.Layer) => {
    let { path } = stack;
    const method = stack.methods
      .find((method) => ALLOWED_METHODS.includes(method.toLowerCase()))
      ?.toLowerCase();
    if (!method) {
      return;
    }
    const specs = GeneratePathParameters(method, stack);

    path = FormatPath(path, specs);

    if (!paths[path]) {
      paths[path] = {};
    }
    paths[path][method] = specs;
  });
  return paths;
};

const GeneratePathParameters = (
  method: string,
  stack: Router.Layer,
): PathParametersResponse => {
  const schema = FindSchemaInStack(stack);
  const options: PathParametersResponse = {
    parameters: [],
    responses: (schema?.responseCodes ?? DEFAULT_RESPONSES).reduce((map: IObjectKeys, code) => {
      map[code] = { description: statuses(code) };
      return map;
    }, {}),
  };
  if (stack.opts?.prefix) {
    options.tags = [stack.opts.prefix];
  }
  options.summary = schema?.summary;
  options.description = schema?.description;
  
  FillSchemaParameters(options.parameters, schema);
  return options;
};

function FindSchemaInStack(
  stack: Router.Layer | Router.IMiddleware,
): ZodValidatorProps | undefined {
  if (Object.prototype.hasOwnProperty.call(stack, '_VALIDATOR_PROPS')) {
    // @ts-ignore
    return stack._VALIDATOR_PROPS as ZodValidatorProps;
  }
  if ('stack' in stack) {
    for (const stackItem of stack.stack) {
      return FindSchemaInStack(stackItem);
    }
  }
}

function FillSchemaParameters(
  parameters: Parameter[],
  schema?: ZodValidatorProps,
) {
  if (schema) {
    schema.params && FillSchemaParameter(parameters, schema.params, 'path');
    schema.query && FillSchemaParameter(parameters, schema.query, 'query');
    schema.header && FillSchemaParameter(parameters, schema.header, 'header');
    schema.body && FillSchemaRequestBody(parameters, schema.body);
  }
}
const FillSchemaParameter = (
  parameters: Parameter[],
  object: AnyZodObject,
  type: string,
) => {
  for (const key in object.shape) {
    const zodType = object.shape[key] as ZodType;
    if (zodType instanceof ZodObject) {
      FillSchemaParameter(parameters, zodType, type);
      continue;
    }
    const isRequiredFlag = !zodType.isOptional();
    const { type: _type, zodType: _zodType } = GetTypeFromZodType(zodType);
    const parameter: Parameter = {
      in: type,
      name: key,
      schema: {
        type: _type
      },
      required: isRequiredFlag,
    };
    if (_zodType instanceof ZodArray) {
      parameter.explode = true;
      parameter.schema.items = {
        type: GetTypeFromZodType(_zodType.element).type
      }
    }
    parameters.push(parameter);
  }
};
const FillSchemaRequestBody = (
  parameters: Parameter[],
  object: AnyZodObject,
  parentObject?: SchemaType,
) => {
  const properties: BodyProperties = {};
  const required = [];
  for (const key in object.shape) {
    const zodType = object.shape[key] as ZodType;
    const { type: _type } = GetTypeFromZodType(zodType);
    properties[key] = {
      type: _type,
      format: GetFormatFromZodType(zodType)
    };
    if (zodType instanceof ZodArray) {
      properties[key].items = {
        type: _type,
      };
    }
    const isRequiredFlag = !zodType.isOptional();
    if (isRequiredFlag) {
      required.push(key);
    }
    if (zodType instanceof ZodObject) {
      FillSchemaRequestBody(parameters, zodType, properties[key]);
    }
  }
  if (parentObject) {
    parentObject.required = required;
    parentObject.properties = properties;
    parentObject.type = 'object';
  } else {
    parameters.push({
      in: 'body',
      name: 'body',
      required: !object.isOptional(),
      schema: {
        type: 'object',
        required: required,
        properties: properties,
      },
    });
  }
};

const GetTypeFromZodType = (type: ZodType): {type: string, zodType: ZodType } => {
  switch (type.constructor) {
    case ZodString:
    case ZodDate:
      return {type: 'string', zodType: type};
    case ZodNumber:
      return {type: 'number', zodType: type};
    case ZodBigInt:
      return {type: 'integer', zodType: type};
    case ZodBoolean:
      return {type: 'boolean', zodType: type};
    case ZodArray:
      return {type: 'array', zodType: type};
    case ZodObject:
      return {type: 'object', zodType: type};
    case ZodOptional:
      return GetTypeFromZodType((type._def as ZodOptionalDef).innerType);
  }
  return { type: 'string', zodType: type };
};

const GetFormatFromZodType = (type: ZodType): string | null => {
  if (type instanceof ZodString) {
    if (type.isUUID) {
      return 'uuid';
    }
    if (type.isEmail) {
      return 'email';
    }
    if (type.isURL) {
      return 'uri';
    }
    if (type.isDatetime) {
      return 'date-time';
    }
  }
  switch (type.constructor) {
    case ZodDate:
      return 'date-time';
  }
  return null;
};

const FormatPath = (path: string, specs: PathParametersResponse) => {
  specs.parameters.forEach((param) => {
    if (param.in === 'path') {
      path = path.replace(`:${param.name}`, `{${param.name}}`);
    }
  });
  return path;
};

function CreateKoaSwagger(
  paths: IPathObject,
  router: Router,
  uiConfig: Partial<KoaSwaggerUiOptions>,
) {
  if (!uiConfig.swaggerOptions) {
    uiConfig.swaggerOptions = {};
  }
  if (!uiConfig.swaggerOptions.spec) {
    uiConfig.swaggerOptions.spec = {};
  }
  uiConfig.swaggerOptions.spec.openapi = '3.0.0';
  uiConfig.swaggerOptions.spec.paths = paths;
  return koaSwagger(uiConfig);
}

export { KoaRouterSwagger };
