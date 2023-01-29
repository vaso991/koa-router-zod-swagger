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
} from 'zod';
import { ZodValidatorProps } from './ZodValidator';

type Parameters = {
  in: string;
  name: string;
  type: string | null;
  required: boolean;
};

type IObjectKeys = {
  [key: string]: { description: string };
};

type PathParametersResponse = {
  parameters: Parameters[];
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
  console.log(paths);
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
  FillSchmeParameters(options.parameters, schema);
  return options;
};

function FindSchemaInStack(
  stack: Router.Layer | Router.IMiddleware,
): ZodValidatorProps | undefined {
  if (Object.prototype.hasOwnProperty.call(stack, '$VALIDATOR_PROPS')) {
    // @ts-ignore
    return stack.$VALIDATOR_PROPS as ZodValidatorProps;
  }
  if ('stack' in stack) {
    for (const stackItem of stack.stack) {
      return FindSchemaInStack(stackItem);
    }
  }
}

function FillSchmeParameters(
  parameters: Parameters[],
  schema?: ZodValidatorProps,
) {
  if (schema) {
    schema.body && FillSchemaParameter(parameters, schema.body, 'formData');
    schema.query && FillSchemaParameter(parameters, schema.query, 'query');
    schema.params && FillSchemaParameter(parameters, schema.params, 'path');
  }
}
const FillSchemaParameter = (
  parameters: Parameters[],
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

const GetTypeFromZodType = (type: ZodType) => {
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
