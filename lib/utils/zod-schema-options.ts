import { ZodType } from 'zod';
import { getZodValidatorGlobalConfig } from '../zod-validator-config';

export type ToJsonSchemaOptions = Parameters<ZodType['toJSONSchema']>[0];

const toJsonSchemaOptionsDefault: ToJsonSchemaOptions = {
  target: 'openapi-3.0',
  unrepresentable: 'any',
  override(ctx) {
    const def = ctx.zodSchema._zod.def;
    if (def.type === 'date') {
      ctx.jsonSchema.type = 'string';
      ctx.jsonSchema.format = 'date-time';
    }
  },
};

export const getToJsonSchemaOptions = (): ToJsonSchemaOptions => {
  return Object.assign(
    {},
    toJsonSchemaOptionsDefault,
    getZodValidatorGlobalConfig().toJsonSchemaOptions,
  );
};
