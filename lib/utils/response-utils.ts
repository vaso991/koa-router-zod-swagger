import { ZodValidatorProps } from '../zod-validator';
import { JsonSchemaType, SwaggerResponseType } from '../types';
import { DEFAULT_RESPONSES_CODES } from './constants';
import { getToJsonSchemaOptions } from './zod-schema-options';
import statuses from 'statuses';

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
          getToJsonSchemaOptions(),
        ) as JsonSchemaType,
      },
    };
  }
  return response;
};
