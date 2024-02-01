import { Context, Next } from 'koa';
import { AnyZodObject, ZodEffects, ZodError } from 'zod';
import { FileRequestObjectType, ResponseType } from './Types';

export interface ZodValidatorProps {
  summary?: string;
  description?: string;
  query?: AnyZodObject | ZodEffects<AnyZodObject>;
  params?: AnyZodObject | ZodEffects<AnyZodObject>;
  header?: AnyZodObject | ZodEffects<AnyZodObject>;
  body?: AnyZodObject | ZodEffects<AnyZodObject>;
  files?: FileRequestObjectType;
  filesValidator?: AnyZodObject | ZodEffects<AnyZodObject>;
  response?: ResponseType;
}

export const ZodValidator = (props: ZodValidatorProps) => {
  const _ValidatorMiddleware = async (ctx: Context, next: Next) => {
    try {
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
    } catch (error: unknown) {
      let errorMessage = 'Validation Error';
      try {
        errorMessage = JSON.stringify((error as ZodError).issues);
      } catch {}
      ctx.set('Content-Type', 'application/json');
      ctx.throw(errorMessage, 400);
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
