import {
  AnyValidator,
  AnyZodValidator,
  FileRequestObjectType,
  JsonSchemaType,
  ParameterType,
  PathParametersResponseType,
  RequestBodyType,
} from '../Types';
import { ZodValidatorProps } from '../ZodValidator';
import { AnyZodObject, ZodEffects } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { } from 'joi-to-json-schema';
import { VALIDATOR_TYPES, getValidatorType } from './Validator.Utils';

export const FillSchemaParameters = (
  options: PathParametersResponseType,
  schema?: ZodValidatorProps,
) => {
  if (schema) {
    schema.params &&
      FillSchemaParameter(options.parameters, schema.params, 'path');
    schema.query &&
      FillSchemaParameter(options.parameters, schema.query, 'query');
    schema.header &&
      FillSchemaParameter(options.parameters, schema.header, 'header');
    if (schema.body) {
      options.requestBody = FillSchemaBody(schema.body, schema.files);
    }
  }
};

const FillSchemaParameter = (
  parameters: ParameterType[],
  object: AnyValidator,
  type: string,
) => {
  const validatorType = getValidatorType(object);
  const schema = validatorType === VALIDATOR_TYPES.ZOD ? zodToJsonSchema((object as AnyZodValidator)) as JsonSchemaType : ;
  if (schema.properties) {
    for (const [key, zodDesc] of Object.entries(schema.properties)) {
      const parameter: ParameterType = {
        in: type,
        name: key,
        schema: zodDesc,
        required: schema.required?.includes(key),
      };
      parameters.push(parameter);
    }
  }
  return parameters;
};
export const FillSchemaBody = (
  object: AnyZodObject | ZodEffects<AnyZodObject>,
  files?: FileRequestObjectType,
): RequestBodyType | undefined => {
  const hasFiles = files && Object.keys(files).length > 0;
  const contentType = hasFiles ? 'multipart/form-data' : 'application/json';
  const schema = zodToJsonSchema(object) as JsonSchemaType;

  if (hasFiles) {
    GenerateSchemaBodyFiles(files, schema);
  }
  return {
    content: {
      [contentType]: {
        schema,
      },
    },
  };
};

const GenerateSchemaBodyFiles = (
  files: FileRequestObjectType,
  schema: JsonSchemaType,
) => {
  if (!schema.properties) {
    schema.properties = {};
  }
  if (!schema.required) {
    schema.required = [];
  }
  for (const [key, file] of Object.entries(files)) {
    if (file === false) {
      continue;
    }
    if (file === true) {
      // @ts-ignore
      schema.properties[key] = {
        type: 'string',
        format: 'binary',
      };
      schema.required.push(key);
      continue;
    }
    if (file.multiple) {
      // @ts-ignore
      schema.properties[key] = {
        type: 'array',
        items: {
          type: 'string',
          format: 'binary',
        },
      };
    } else {
      // @ts-ignore
      schema.properties[key] = {
        type: 'string',
        format: 'binary',
      };
    }
    if (file.optional !== true) {
      schema.required.push(key);
    }
  }
  return schema;
};
