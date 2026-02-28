import { ALLOWED_METHODS } from './constants';
import Router from 'koa-router';
import { PathObjectType, PathParametersResponseType } from '../types';
import { ZodValidatorProps } from '../zod-validator';
import { fillSchemaParameters } from './schema-utils';
import { generateResponses } from './response-utils';

interface WithValidatorProps {
  _VALIDATOR_PROPS: ZodValidatorProps;
}

const hasValidatorProps = (obj: unknown): obj is WithValidatorProps =>
  (typeof obj === 'object' || typeof obj === 'function') &&
  obj !== null &&
  '_VALIDATOR_PROPS' in (obj as object);

const formatPath = (path: string, specs: PathParametersResponseType) => {
  specs.parameters.forEach((param) => {
    if (param.in === 'path') {
      path = path.replace(`:${param.name}`, `{${param.name}}`);
    }
  });
  return path;
};

export const mapAllMethods = (router: Router) => {
  const paths: PathObjectType = {};
  router.stack.forEach((stack: Router.Layer) => {
    let { path } = stack;
    const method = stack.methods
      .find((method) => ALLOWED_METHODS.includes(method.toLowerCase()))
      ?.toLowerCase();
    if (!method) {
      return;
    }
    const specs = generatePathParameters(method, stack);

    path = formatPath(path, specs);

    if (!paths[path]) {
      paths[path] = {};
    }
    paths[path][method] = specs;
  });
  return paths;
};

export const generatePathParameters = (
  method: string,
  stack: Router.Layer,
): PathParametersResponseType => {
  const schema = findSchemaInStack(stack);
  const options: PathParametersResponseType = {
    parameters: [],
    responses: generateResponses(schema),
  };
  if (stack.opts?.prefix) {
    options.tags = [stack.opts.prefix];
  }
  options.summary = schema?.summary;
  options.description = schema?.description;

  fillSchemaParameters(options, schema);
  return options;
};

const findSchemaInStack = (
  stack: Router.Layer | Router.IMiddleware,
): ZodValidatorProps | undefined => {
  if (hasValidatorProps(stack)) {
    return stack._VALIDATOR_PROPS;
  }
  if ('stack' in stack) {
    for (const stackItem of stack.stack) {
      const foundStackItem = findSchemaInStack(stackItem);
      if (foundStackItem) {
        return foundStackItem;
      }
    }
  }
};
