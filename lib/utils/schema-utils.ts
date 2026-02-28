import {
  FileRequestObjectType,
  JsonSchemaType,
  ParameterType,
  PathParametersResponseType,
  RequestBodyType,
} from '../types';
import { ZodValidatorProps } from '../zod-validator';
import { ZodType } from 'zod';
import { toJsonSchemaOptions } from './zod-schema-options';

export const fillSchemaParameters = (
  options: PathParametersResponseType,
  validatorProps?: ZodValidatorProps,
) => {
  if (validatorProps) {
    validatorProps.params &&
      fillSchemaParameter(options.parameters, validatorProps.params, 'path');
    validatorProps.query &&
      fillSchemaParameter(options.parameters, validatorProps.query, 'query');
    validatorProps.header &&
      fillSchemaParameter(options.parameters, validatorProps.header, 'header');
    if (validatorProps.body) {
      options.requestBody = fillSchemaBody(
        validatorProps.body,
        validatorProps.files,
      );
    }
  }
};

const fillSchemaParameter = (
  parameters: ParameterType[],
  object: ZodType,
  type: string,
) => {
  const schema = object.toJSONSchema(toJsonSchemaOptions) as JsonSchemaType;
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
};

export const fillSchemaBody = (
  zodSchema: ZodType,
  files?: FileRequestObjectType,
): RequestBodyType | undefined => {
  const hasFiles = files && Object.keys(files).length > 0;
  const contentType = hasFiles ? 'multipart/form-data' : 'application/json';
  const schema = zodSchema.toJSONSchema(toJsonSchemaOptions) as JsonSchemaType;

  if (hasFiles) {
    generateSchemaBodyFiles(files, schema);
  }
  return {
    content: {
      [contentType]: {
        schema,
      },
    },
  };
};

const generateSchemaBodyFiles = (
  files: FileRequestObjectType,
  schema: JsonSchemaType,
) => {
  if (!schema.properties) {
    schema.properties = {};
  }
  if (!schema.required) {
    schema.required = [];
  }
  const properties = schema.properties as Record<string, JsonSchemaType>;
  const required = schema.required;

  for (const [key, file] of Object.entries(files)) {
    if (file === false) {
      continue;
    }
    if (file === true) {
      properties[key] = { type: 'string', format: 'binary' };
      required.push(key);
      continue;
    }
    if (file.multiple) {
      properties[key] = {
        type: 'array',
        items: { type: 'string', format: 'binary' },
      };
    } else {
      properties[key] = { type: 'string', format: 'binary' };
    }
    if (file.optional !== true) {
      required.push(key);
    }
  }
};
