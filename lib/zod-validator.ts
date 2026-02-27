import { Context, Next } from 'koa';
import { ZodType } from 'zod';
import { FileRequestObjectType, ResponseType } from './types';

export interface ZodValidatorProps {
  summary?: string;
  description?: string;
  query?: ZodType;
  params?: ZodType;
  header?: ZodType;
  body?: ZodType;
  files?: FileRequestObjectType;
  filesValidator?: ZodType;
  response?: ResponseType;
}

export const ZodValidator = (props: ZodValidatorProps) => {
  const _ValidatorMiddleware = async (ctx: Context, next: Next) => {
    if (props.query && 'query' in ctx.request) {
      await props.query.parseAsync(ctx.request.query);
    }
    if (props.params && 'params' in ctx) {
      await props.params.parseAsync(ctx.params);
    }
    if (props.header) {
      await props.header.parseAsync(ctx.request.header);
    }
    if (props.body && 'body' in ctx.request) {
      await props.body.parseAsync(ctx.request.body);
    }
    if (props.filesValidator && 'files' in ctx.request) {
      await props.filesValidator.parseAsync(ctx.request.files);
    }
    if (props.response?.validate) {
      return next().then(async () => {
        await props.response!.body!.parseAsync(ctx.body);
      });
    } else {
      return next();
    }
  };
  _ValidatorMiddleware._VALIDATOR_PROPS = props;
  return _ValidatorMiddleware;
};
