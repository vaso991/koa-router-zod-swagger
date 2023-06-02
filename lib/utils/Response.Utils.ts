import { ZodValidatorProps } from '../ZodValidator';
import { SwaggerResponseType } from '../Types';
import { DEFAULT_RESPONSES_CODES } from './Constants';
import statuses from 'statuses';
import { GenerateSchemaBody } from './Schema.Utils';
export const generateResponses = (schema?: ZodValidatorProps): SwaggerResponseType => {
  const responseStatusCodes = schema?.response?.possibleStatusCodes || DEFAULT_RESPONSES_CODES;
  const response = responseStatusCodes.reduce(
    (map: SwaggerResponseType, code) => {
      map[code] = { description: statuses(code) };
      return map;
    },
    {},
  );
  if (schema?.response?.description) {
    response[responseStatusCodes[0]].description = schema?.response?.description;
  }
  if (schema?.response?.body) {
    response[responseStatusCodes[0]].content = {
      'application/json': {
        schema: GenerateSchemaBody(schema.response.body)
      }
    }
  }
  return response;

}