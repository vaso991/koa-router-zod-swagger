export type ParsedAssignTarget =
  | 'query'
  | 'params'
  | 'header'
  | 'body'
  | 'files';

export interface ZodValidatorGlobalConfig {
  assignParsedData?: boolean | ParsedAssignTarget[];
}

let zodValidatorGlobalConfig: ZodValidatorGlobalConfig = {};

export const setZodValidatorGlobalConfig = (
  config: ZodValidatorGlobalConfig,
): void => {
  zodValidatorGlobalConfig = { ...zodValidatorGlobalConfig, ...config };
};

export const resetZodValidatorGlobalConfig = (): void => {
  zodValidatorGlobalConfig = {};
};

export const getZodValidatorGlobalConfig = (): ZodValidatorGlobalConfig => {
  return zodValidatorGlobalConfig;
};
