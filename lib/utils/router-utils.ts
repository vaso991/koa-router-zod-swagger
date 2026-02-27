import { ALLOWED_METHODS } from './constants';
import Router from 'koa-router';
import { PathObjectType, PathParametersResponseType } from '../types';
import { ZodValidatorProps } from '../zod-validator';
import { FillSchemaParameters } from './schema-utils';
import { generateResponses } from './response-utils';

const FormatPath = (path: string, specs: PathParametersResponseType) => {
  specs.parameters.forEach((param) => {
    if (param.in === 'path') {
      path = path.replace(`:${param.name}`, `{${param.name}}`);
    }
  });
  return path;
};
export const MapAllMethods = (router: Router) => {
  const paths: PathObjectType = {};
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

export const GeneratePathParameters = (
  method: string,
  stack: Router.Layer,
): PathParametersResponseType => {
  const schema = FindSchemaInStack(stack);
  const options: PathParametersResponseType = {
    parameters: [],
    responses: generateResponses(schema),
  };
  if (stack.opts?.prefix) {
    options.tags = [stack.opts.prefix];
  }
  options.summary = schema?.summary;
  options.description = schema?.description;

  FillSchemaParameters(options, schema);
  return options;
};

const FindSchemaInStack = (
  stack: Router.Layer | Router.IMiddleware,
): ZodValidatorProps | undefined => {
  if (Object.prototype.hasOwnProperty.call(stack, '_VALIDATOR_PROPS')) {
    // @ts-ignore
    return stack._VALIDATOR_PROPS as ZodValidatorProps;
  }
  if ('stack' in stack) {
    for (const stackItem of stack.stack) {
      const foundStackItem = FindSchemaInStack(stackItem);
      if (foundStackItem) {
        return foundStackItem;
      }
    }
  }
};
