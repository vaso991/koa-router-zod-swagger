import {
  ZodArray,
  ZodBigInt,
  ZodBoolean,
  ZodDate,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodOptionalDef,
  ZodString,
  ZodType,
} from 'zod';

export const GetTypeFromZodType = (
  type: ZodType,
): { type: string; zodType: ZodType } => {
  switch (type.constructor) {
    case ZodString:
    case ZodDate:
      return { type: 'string', zodType: type };
    case ZodNumber:
      return { type: 'number', zodType: type };
    case ZodBigInt:
      return { type: 'integer', zodType: type };
    case ZodBoolean:
      return { type: 'boolean', zodType: type };
    case ZodArray:
      return { type: 'array', zodType: type };
    case ZodObject:
      return { type: 'object', zodType: type };
    case ZodOptional:
      return GetTypeFromZodType((type._def as ZodOptionalDef).innerType);
  }
  return { type: 'string', zodType: type };
};

export const GetFormatFromZodType = (type: ZodType): string | null => {
  if (type instanceof ZodString) {
    if (type.isUUID) {
      return 'uuid';
    }
    if (type.isEmail) {
      return 'email';
    }
    if (type.isURL) {
      return 'uri';
    }
    if (type.isDatetime) {
      return 'date-time';
    }
  }
  switch (type.constructor) {
    case ZodDate:
      return 'date-time';
  }
  return null;
};