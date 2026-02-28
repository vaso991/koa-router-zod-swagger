import { Context, Next } from 'koa';
import { ZodType } from 'zod';
import { FileRequestObjectType, ResponseType } from './types';
import {
  getZodValidatorGlobalConfig,
  type ParsedAssignTarget,
} from './zod-validator-config';

const isRecord = (value: unknown): value is Record<string, any> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const replaceRecordValues = (target: unknown, source: unknown): boolean => {
  if (!isRecord(target) || !isRecord(source)) {
    return false;
  }
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  Object.assign(target, source);
  return true;
};

const assignParsedValue = (
  target: ParsedAssignTarget,
  parsedValue: unknown,
  request: Record<string, any>,
  context: Record<string, any>,
): void => {
  if (target === 'query') {
    if (!replaceRecordValues(request.query, parsedValue)) {
      request.query = parsedValue;
    }
    return;
  }

  if (target === 'params') {
    context.params = parsedValue;
    return;
  }

  if (target === 'header') {
    if (
      !replaceRecordValues(request.header, parsedValue) &&
      request.req &&
      typeof request.req === 'object'
    ) {
      (request.req as Record<string, any>).headers = parsedValue;
    }
    return;
  }

  if (target === 'body') {
    request.body = parsedValue;
    return;
  }

  request.files = parsedValue;
};

export interface ZodValidatorProps {
  summary?: string;
  description?: string;
  query?: ZodType<any>;
  params?: ZodType<any>;
  header?: ZodType<any>;
  body?: ZodType<any>;
  files?: FileRequestObjectType;
  filesValidator?: ZodType<any>;
  assignParsedData?: boolean | ParsedAssignTarget[];
  response?: ResponseType;
}

export const ZodValidator = (props: ZodValidatorProps) => {
  const validatorMiddleware = async (ctx: Context, next: Next) => {
    const request = ctx.request as Record<string, any>;
    const context = ctx as unknown as Record<string, any>;
    const assignParsedData =
      props.assignParsedData !== undefined
        ? props.assignParsedData
        : getZodValidatorGlobalConfig().assignParsedData;
    const shouldAssign = (target: ParsedAssignTarget): boolean => {
      if (assignParsedData === true) {
        return true;
      }
      if (Array.isArray(assignParsedData)) {
        return assignParsedData.includes(target);
      }
      return false;
    };

    if (props.query && 'query' in request) {
      const parsedQuery = await props.query.parseAsync(request.query);
      if (shouldAssign('query')) {
        assignParsedValue('query', parsedQuery, request, context);
      }
    }
    if (props.params && 'params' in context) {
      const parsedParams = await props.params.parseAsync(context.params);
      if (shouldAssign('params')) {
        assignParsedValue('params', parsedParams, request, context);
      }
    }
    if (props.header) {
      const parsedHeader = await props.header.parseAsync(request.header);
      if (shouldAssign('header')) {
        assignParsedValue('header', parsedHeader, request, context);
      }
    }
    if (props.body && 'body' in request) {
      const parsedBody = await props.body.parseAsync(request.body);
      if (shouldAssign('body')) {
        assignParsedValue('body', parsedBody, request, context);
      }
    }
    if (props.filesValidator && 'files' in request) {
      const parsedFiles = await props.filesValidator.parseAsync(request.files);
      if (shouldAssign('files')) {
        assignParsedValue('files', parsedFiles, request, context);
      }
    }
    if (props.response?.validate) {
      return next().then(async () => {
        await props.response!.body!.parseAsync(ctx.body);
      });
    } else {
      return next();
    }
  };
  validatorMiddleware._VALIDATOR_PROPS = props;
  return validatorMiddleware;
};
