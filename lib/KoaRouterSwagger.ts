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
} from 'zod';
import { ZodValidatorProps } from './ZodValidator';

type BodyProperty = {
  type: string | null,
  required?: string[],
  properties?: BodyProperties,
  items?: {
    type: string | null
  }
}
type BodyProperties = {
  [key: string]: BodyProperty
}

type Parameter = {
  in: string;
  name: string;
  description?: string;
  type?: string | null;
  required?: boolean;
  schema?: BodyProperty
};

type IObjectKeys = {
  [key: string]: { description: string };
};

type PathParametersResponse = {
  parameters: Parameter[];
  responses: IObjectKeys;
  tags?: [string];
};

interface IPathObject {
  [key: string]: {
    [key: string]: PathParametersResponse;
  };
}

const DEFAULT_RESPONSES = [200, 400];

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
  const options: PathParametersResponse = {
    parameters: [],
    responses: DEFAULT_RESPONSES.reduce((map: IObjectKeys, code) => {
      map[code] = { description: statuses(code) };
      return map;
    }, {}),
  };
  if (stack.opts?.prefix) {
    options.tags = [stack.opts.prefix];
  }
  const schema = FindSchemaInStack(stack);
  FillSchemeParameters(options.parameters, schema);
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

function FillSchemeParameters(
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
    parameters.push({
      in: type,
      name: key,
      type: GetTypeFromZodType(zodType),
      required: isRequiredFlag,
    });
  }
};
const FillSchemaRequestBody = (
  parameters: Parameter[],
  object: AnyZodObject,
  parentObject?: BodyProperty,
) => {
  const properties: BodyProperties = {};
  const required = [];
  for (const key in object.shape) {
    const zodType = object.shape[key] as ZodType;
    properties[key] = {
      type: GetTypeFromZodType(zodType)
    };
    if (zodType instanceof ZodArray) {
      properties[key].items = {
        type: GetTypeFromZodType(zodType.element)
      }
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
        properties: properties
      }
    });
  }
};

const GetTypeFromZodType = (type: ZodType): string | null => {
  switch (type.constructor) {
    case ZodString:
      return 'string';
    case ZodNumber:
      return 'number';
    case ZodBigInt:
      return 'integer';
    case ZodBoolean:
      return 'boolean';
    case ZodArray:
      return 'array';
    case ZodObject:
      return 'object';
    case ZodOptional:
      return GetTypeFromZodType((type._def as ZodOptionalDef).innerType);
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
  uiConfig.swaggerOptions.spec.swagger = '2.0';
  uiConfig.swaggerOptions.spec.paths = paths;
  return koaSwagger(uiConfig);
}

export { KoaRouterSwagger };
