import { ALLOWED_METHODS, DEFAULT_RESPONSES } from './Constants';
import Router from 'koa-router';
import { IObjectKeys, IPathObject, PathParametersResponse } from '../Types';
import statuses from 'statuses';
import { ZodValidatorProps } from '../ZodValidator';
import { FillSchemaParameters } from './Schema.Utils';

const FormatPath = (path: string, specs: PathParametersResponse) => {
  specs.parameters.forEach((param) => {
    if (param.in === 'path') {
      path = path.replace(`:${param.name}`, `{${param.name}}`);
    }
  });
  return path;
};
export const MapAllMethods = (router: Router) => {
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

export const GeneratePathParameters = (
  method: string,
  stack: Router.Layer,
): PathParametersResponse => {
  const schema = FindSchemaInStack(stack);
  const options: PathParametersResponse = {
    parameters: [],
    responses: (schema?.responseCodes ?? DEFAULT_RESPONSES).reduce(
      (map: IObjectKeys, code) => {
        map[code] = { description: statuses(code) };
        return map;
      },
      {},
    ),
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