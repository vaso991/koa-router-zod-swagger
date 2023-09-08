import { Context, Next } from 'koa';
import { AnyZodObject, ZodEffects } from 'zod';
import {
  AnyJoiValidator,
  AnyValidator,
  AnyZodValidator,
  FileRequestObjectType,
  ResponseType,
} from './Types';
import { AnySchema } from 'joi';
import { VALIDATOR_TYPES, getValidatorType } from './utils/Validator.Utils';

export interface ZodValidatorProps {
  summary?: string;
  description?: string;
  query?: AnyValidator;
  params?: AnyValidator;
  header?: AnyValidator;
  body?: AnyValidator;
  files?: FileRequestObjectType;
  filesValidator?: AnyValidator;
  response?: ResponseType;
}

const validateObject = async (validator: AnyValidator, data: unknown) => {
  const validatorType = getValidatorType(validator);
  if (validatorType === VALIDATOR_TYPES.ZOD) {
    await (validator as AnyZodValidator).parseAsync(data);
  } else if (validatorType === VALIDATOR_TYPES.JOI) {
    await (validator as AnyJoiValidator).validateAsync(data);
  }
};

export const ZodValidator = (props: ZodValidatorProps) => {
  const _ValidatorMiddleware = async (ctx: Context, next: Next) => {
    if (props.query && 'query' in ctx.request) {
      await validateObject(props.query, ctx.request.query);
    }
    if (props.params && 'params' in ctx) {
      await validateObject(props.params, ctx.params);
    }
    if (props.header) {
      await validateObject(props.header, ctx.request.header);
    }
    if (props.body && 'body' in ctx.request) {
      await validateObject(props.body, ctx.request.body);
    }
    if (props.filesValidator && 'files' in ctx.request) {
      await validateObject(props.filesValidator, ctx.request.files);
    }
    if (props.response?.validate) {
      return next().then(async () => {
        if (props.response) {
          await props.response.body.parseAsync(ctx.body);
        }
      });
    } else {
      return next();
    }
  };
  _ValidatorMiddleware._VALIDATOR_PROPS = props;
  return _ValidatorMiddleware;
};
