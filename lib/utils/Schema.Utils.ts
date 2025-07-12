import {
  FileRequestObjectType,
  JsonSchemaType,
  ParameterType,
  PathParametersResponseType,
  RequestBodyType,
} from '../Types';
import { ZodValidatorProps } from '../ZodValidator';
import { AnyZodObject, ZodEffects } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const FillSchemaParameters = (
  options: PathParametersResponseType,
  validatorProps?: ZodValidatorProps,
) => {
  if (validatorProps) {
    validatorProps.params &&
      FillSchemaParameter(options.parameters, validatorProps.params, 'path');
    validatorProps.query &&
      FillSchemaParameter(options.parameters, validatorProps.query, 'query');
    validatorProps.header &&
      FillSchemaParameter(options.parameters, validatorProps.header, 'header');
    if (validatorProps.body) {
      options.requestBody = FillSchemaBody(
        validatorProps.body,
        validatorProps.files,
      );
    }
  }
};

const FillSchemaParameter = (
  parameters: ParameterType[],
  object: AnyZodObject | ZodEffects<AnyZodObject>,
  type: string,
) => {
  const schema = zodToJsonSchema(object) as JsonSchemaType;
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
  zodSchema: AnyZodObject | ZodEffects<AnyZodObject>,
  files?: FileRequestObjectType,
): RequestBodyType | undefined => {
  const hasFiles = files && Object.keys(files).length > 0;
  const contentType = hasFiles ? 'multipart/form-data' : 'application/json';
  const schema = zodToJsonSchema(zodSchema) as JsonSchemaType;

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
