import { ToJsonSchemaOptions } from './utils/zod-schema-options';

export type ParsedAssignTarget =
  | 'query'
  | 'params'
  | 'header'
  | 'body'
  | 'files';

export interface ZodValidatorGlobalConfig {
  assignParsedData?: boolean | ParsedAssignTarget[];
  toJsonSchemaOptions?: ToJsonSchemaOptions;
}

let zodValidatorGlobalConfig: ZodValidatorGlobalConfig = {};

export const setZodValidatorGlobalConfig = (
  config: ZodValidatorGlobalConfig,
): void => {
  if (config.toJsonSchemaOptions !== undefined) {
    const mergedToJsonSchemaOptions = Object.assign(
      {},
      zodValidatorGlobalConfig.toJsonSchemaOptions,
      config.toJsonSchemaOptions,
    );
    Object.assign(zodValidatorGlobalConfig, config, {
      toJsonSchemaOptions: mergedToJsonSchemaOptions,
    });
    return;
  }
  Object.assign(zodValidatorGlobalConfig, config);
};

export const resetZodValidatorGlobalConfig = (): void => {
  zodValidatorGlobalConfig = {};
};

export const getZodValidatorGlobalConfig = (): ZodValidatorGlobalConfig => {
  return zodValidatorGlobalConfig;
};
