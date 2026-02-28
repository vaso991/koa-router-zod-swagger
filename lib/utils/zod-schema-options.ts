import { ZodType } from 'zod';

type ToJSONSchemaParams = Parameters<ZodType['toJSONSchema']>[0];

export const toJsonSchemaOptions: ToJSONSchemaParams = {
  target: 'draft-7',
  unrepresentable: 'any',
  override(ctx) {
    const def = ctx.zodSchema._zod.def;
    if (def.type === 'date') {
      ctx.jsonSchema.type = 'string';
      ctx.jsonSchema.format = 'date-time';
    }
  },
};
