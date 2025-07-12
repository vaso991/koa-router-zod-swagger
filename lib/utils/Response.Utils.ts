import { ZodValidatorProps } from '../ZodValidator';
import { JsonSchemaType, SwaggerResponseType } from '../Types';
import { DEFAULT_RESPONSES_CODES } from './Constants';
import statuses from 'statuses';
import zodToJsonSchema from 'zod-to-json-schema';
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
        schema: zodToJsonSchema(validatorProps.response.body, {
          target: 'openApi3'
        }) as JsonSchemaType,
      },
    };
  }
  return response;
};
