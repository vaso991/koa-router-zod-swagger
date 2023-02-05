import { Context, Next } from 'koa';
import { AnyZodObject } from 'zod';

export interface ZodValidatorProps {
  summary?: string;
  description?: string;
  responseCodes?: number[];
  query?: AnyZodObject;
  params?: AnyZodObject;
  header: AnyZodObject;
  body?: AnyZodObject;
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
    return next();
  };
  _ValidatorMiddleware._VALIDATOR_PROPS = props;
  return _ValidatorMiddleware;
};