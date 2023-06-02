import { Parameter, PathParametersResponse, SchemaType } from '../Types';
import { ZodValidatorProps } from '../ZodValidator';
import { AnyZodObject, ZodArray, ZodEffects, ZodObject, ZodType } from 'zod';
import { GetFormatFromZodType, GetTypeFromZodType } from './Zod.Utils';

export const FillSchemaParameters = (
  options: PathParametersResponse,
  schema?: ZodValidatorProps,
) => {
  if (schema) {
    schema.params &&
    FillSchemaParameter(options.parameters, schema.params, 'path');
    schema.query &&
    FillSchemaParameter(options.parameters, schema.query, 'query');
    schema.header &&
    FillSchemaParameter(options.parameters, schema.header, 'header');
    schema.body && FillSchemaRequestBody(options, schema.body);
  }
};


const FillSchemaParameter = (
  parameters: Parameter[],
  object: AnyZodObject | ZodEffects<AnyZodObject>,
  type: string,
) => {
  if (object instanceof ZodEffects) {
    object = object.innerType();
  }
  for (const key in object.shape) {
    const zodType = object.shape[key] as ZodType;
    if (zodType instanceof ZodObject) {
      FillSchemaParameter(parameters, zodType, type);
      continue;
    }
    const isRequiredFlag = !zodType.isOptional();
    const { type: _type, zodType: _zodType } = GetTypeFromZodType(zodType);
    const parameter: Parameter = {
      in: type,
      name: key,
      schema: {
        type: _type,
      },
      required: isRequiredFlag,
    };
    if (_zodType instanceof ZodArray) {
      parameter.explode = true;
      parameter.schema.items = {
        type: GetTypeFromZodType(_zodType.element).type,
      };
    }
    parameters.push(parameter);
  }
};
const FillSchemaRequestBody = (
  options: PathParametersResponse,
  object: AnyZodObject | ZodEffects<AnyZodObject>,
  parentObject?: SchemaType,
) => {
  const bodySchema: SchemaType = {
    type: 'object',
  };
  if (object instanceof ZodEffects) {
    object = object.innerType();
  }
  for (const key in object.shape) {
    const zodType = object.shape[key] as ZodType;
    const { type: _type } = GetTypeFromZodType(zodType);
    if (!bodySchema.properties) bodySchema.properties = {};
    bodySchema.properties[key] = {
      type: _type,
      format: GetFormatFromZodType(zodType),
    };
    if (zodType instanceof ZodArray) {
      bodySchema.properties[key].items = {
        type: _type,
      };
    }
    const isRequiredFlag = !zodType.isOptional();
    if (isRequiredFlag) {
      if (!bodySchema.required) bodySchema.required = [];
      bodySchema.required.push(key);
    }
    if (zodType instanceof ZodObject) {
      FillSchemaRequestBody(options, zodType, bodySchema.properties[key]);
    }
  }
  if (parentObject) {
    parentObject.required = bodySchema.required;
    parentObject.properties = bodySchema.properties;
    parentObject.type = 'object';
  } else {
    options.requestBody = {
      content: {
        'application/json': {
          schema: bodySchema,
        },
      },
    };
  }
};
