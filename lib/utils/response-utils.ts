import { ZodValidatorProps } from '../zod-validator';
import { JsonSchemaType, SwaggerResponseType } from '../types';
import { DEFAULT_RESPONSES_CODES } from './constants';
import statuses from 'statuses';
import { ZodType } from 'zod';

type ToJSONSchemaParams = Parameters<ZodType['toJSONSchema']>[0];

const toJsonSchemaOptions: ToJSONSchemaParams = {
  target: 'draft-7',
  unrepresentable: 'any',
  override(ctx) {
    if (
      (ctx.zodSchema as unknown as { def: { type: string } }).def.type ===
      'date'
    ) {
      ctx.jsonSchema['type'] = 'string';
      ctx.jsonSchema['format'] = 'date-time';
    }
  },
};
export const generateResponses = (
  validatorProps?: ZodValidatorProps,
): SwaggerResponseType => {
  const responseStatusCodes =
    validatorProps?.response?.possibleStatusCodes || DEFAULT_RESPONSES_CODES;
  const response = responseStatusCodes.reduce(
    (map: SwaggerResponseType, code) => {
      map[code] = { description: statuses(code) };
      return map;
    },
    {},
  );
  if (validatorProps?.response?.description) {
    response[responseStatusCodes[0]].description =
      validatorProps?.response?.description;
  }
  if (validatorProps?.response?.body) {
    response[responseStatusCodes[0]].content = {
      'application/json': {
        schema: validatorProps.response.body.toJSONSchema(
          toJsonSchemaOptions,
        ) as JsonSchemaType,
      },
    };
  }
  return response;
};
