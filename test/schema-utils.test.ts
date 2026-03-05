import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { PathParametersResponseType } from '../lib/types';
import { fillSchemaBody, fillSchemaParameters } from '../lib/utils/schema-utils';
import {
  resetZodValidatorGlobalConfig,
  setZodValidatorGlobalConfig,
} from '../lib/zod-validator-config';

const createPathOptions = (): PathParametersResponseType => ({
  parameters: [],
  responses: {},
});

describe('Schema.Utils', () => {
  beforeEach(() => {
    resetZodValidatorGlobalConfig();
  });

  it('fills path, query, header and request body schema from validator props', () => {
    const options = createPathOptions();

    fillSchemaParameters(options, {
      params: z.object({ id: z.string() }),
      query: z.object({ search: z.string() }),
      header: z.object({ 'x-request-id': z.string() }),
      body: z.object({ createdAt: z.date() }),
    });

    expect(options.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          in: 'path',
          name: 'id',
          required: true,
          schema: expect.objectContaining({ type: 'string' }),
        }),
        expect.objectContaining({
          in: 'query',
          name: 'search',
          required: true,
          schema: expect.objectContaining({ type: 'string' }),
        }),
        expect.objectContaining({
          in: 'header',
          name: 'x-request-id',
          required: true,
          schema: expect.objectContaining({ type: 'string' }),
        }),
      ]),
    );

    const bodySchema = options.requestBody?.content['application/json']?.schema;
    expect(bodySchema?.properties?.createdAt).toEqual(
      expect.objectContaining({
        type: 'string',
        format: 'date-time',
      }),
    );
  });

  it('does not mutate options when validator props are missing', () => {
    const options = createPathOptions();
    fillSchemaParameters(options);

    expect(options.parameters).toHaveLength(0);
    expect(options.requestBody).toBeUndefined();
  });

  it('generates multipart body schema for file uploads', () => {
    const body = fillSchemaBody(z.object({ title: z.string().optional() }), {
      avatar: true,
      gallery: { multiple: true },
      optionalFile: { optional: true },
      ignored: false,
    });

    const multipartSchema = body?.content['multipart/form-data']?.schema;
    expect(multipartSchema?.properties?.avatar).toEqual({
      type: 'string',
      format: 'binary',
    });
    expect(multipartSchema?.properties?.gallery).toEqual({
      type: 'array',
      items: {
        type: 'string',
        format: 'binary',
      },
    });
    expect(multipartSchema?.properties?.optionalFile).toEqual({
      type: 'string',
      format: 'binary',
    });
    expect(multipartSchema?.properties?.ignored).toBeUndefined();
    expect(multipartSchema?.required).toEqual(
      expect.arrayContaining(['avatar', 'gallery']),
    );
    expect(multipartSchema?.required).not.toContain('optionalFile');
  });

  it('initializes schema containers for files when base schema is not an object', () => {
    const body = fillSchemaBody(z.string(), { file: true });
    const multipartSchema = body?.content['multipart/form-data']?.schema;

    expect(multipartSchema?.properties?.file).toEqual({
      type: 'string',
      format: 'binary',
    });
    expect(multipartSchema?.required).toEqual(expect.arrayContaining(['file']));
  });

  it('maps coerced date fields to date-time format from example patterns', () => {
    const body = fillSchemaBody(
      z.object({
        date: z.coerce.date(),
      }),
    );
    const jsonSchema = body?.content['application/json']?.schema;

    expect(jsonSchema?.properties?.date).toEqual(
      expect.objectContaining({
        type: 'string',
        format: 'date-time',
      }),
    );
  });

  it('uses global toJsonSchemaOptions and merges them across set calls', () => {
    setZodValidatorGlobalConfig({
      toJsonSchemaOptions: {
        target: 'draft-2020-12',
      },
    });
    setZodValidatorGlobalConfig({
      toJsonSchemaOptions: {
        override(ctx) {
          const def = ctx.zodSchema._zod.def;
          if (def.type === 'date') {
            ctx.jsonSchema.type = 'string';
            ctx.jsonSchema.format = 'custom-date-time';
          }
        },
      },
    });

    const body = fillSchemaBody(
      z.object({
        createdAt: z.date(),
      }),
    );
    const jsonSchema = body?.content['application/json']?.schema;

    expect(jsonSchema?.$schema).toBe(
      'https://json-schema.org/draft/2020-12/schema',
    );
    expect(jsonSchema?.properties?.createdAt).toEqual(
      expect.objectContaining({
        type: 'string',
        format: 'custom-date-time',
      }),
    );
  });
});
