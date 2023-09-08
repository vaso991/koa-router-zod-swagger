import { AnyValidator } from '../Types';

export enum VALIDATOR_TYPES {
  ZOD,
  JOI,
}

export const getValidatorType = (validator: AnyValidator) => {
  if ('parseAsync' in validator) {
    return VALIDATOR_TYPES.ZOD;
  } else if ('validateAsync' in validator) {
    return VALIDATOR_TYPES.JOI;
  }
};
