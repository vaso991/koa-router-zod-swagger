import Router from 'koa-router';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ZodValidator } from '../lib/zod-validator';
import { MapAllMethods } from '../lib/utils/router-utils';

describe('Router.Utils', () => {
  it('maps route schemas to swagger paths and formats path params', () => {
    const router = new Router({ prefix: '/api' });
    router.get(
      '/users/:id',
      ZodValidator({
        summary: 'Get user',
        description: 'Returns one user',
        params: z.object({ id: z.string() }),
        query: z.object({ expand: z.string().optional() }),
        body: z.object({ createdAt: z.date() }),
        response: {
          validate: false,
          possibleStatusCodes: [204],
        },
      }),
      async () => {},
    );
    router.options('/users/:id', async () => {});

    const paths = MapAllMethods(router);
    const getPath = paths['/api/users/{id}']?.get;

    expect(Object.keys(paths)).toEqual(['/api/users/{id}']);
    expect(getPath).toBeDefined();
    expect(getPath?.tags).toEqual(['/api']);
    expect(getPath?.summary).toBe('Get user');
    expect(getPath?.description).toBe('Returns one user');
    expect(getPath?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          in: 'path',
          name: 'id',
          required: true,
        }),
        expect.objectContaining({
          in: 'query',
          name: 'expand',
          required: undefined,
        }),
      ]),
    );
    expect(getPath?.requestBody?.content['application/json']?.schema?.properties?.createdAt).toEqual(
      expect.objectContaining({
        type: 'string',
        format: 'date-time',
      }),
    );
    expect(Object.keys(getPath?.responses || {})).toEqual(['204']);
  });

  it('handles example routes for query partials, files and custom responses', () => {
    const router = new Router();
    router.get(
      '/test',
      ZodValidator({
        query: z
          .object({
            ar: z.array(z.string()),
            num: z.coerce.number().optional(),
          })
          .partial(),
      }),
      async () => {},
    );
    router.post(
      '/files',
      ZodValidator({
        body: z.object({
          field: z.string(),
        }),
        files: {
          file: true,
          multipleFiles: { multiple: true },
          optionalFile: { optional: true },
        },
      }),
      async () => {},
    );
    router.get(
      '/response',
      ZodValidator({
        response: {
          description: 'Response returned successfully',
          validate: true,
          possibleStatusCodes: [201, 300, 401],
          body: z.object({
            test: z.boolean(),
          }),
        },
      }),
      async () => {},
    );

    const paths = MapAllMethods(router);
    const testGet = paths['/test']?.get;
    const filesPost = paths['/files']?.post;
    const responseGet = paths['/response']?.get;

    expect(testGet?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          in: 'query',
          name: 'ar',
          required: undefined,
        }),
        expect.objectContaining({
          in: 'query',
          name: 'num',
          required: undefined,
        }),
      ]),
    );

    const multipartSchema = filesPost?.requestBody?.content['multipart/form-data']
      ?.schema;
    expect(multipartSchema?.properties?.field).toEqual(
      expect.objectContaining({
        type: 'string',
      }),
    );
    expect(multipartSchema?.properties?.file).toEqual({
      type: 'string',
      format: 'binary',
    });
    expect(multipartSchema?.properties?.multipleFiles).toEqual({
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
    expect(multipartSchema?.required).toEqual(
      expect.arrayContaining(['field', 'file', 'multipleFiles']),
    );
    expect(multipartSchema?.required).not.toContain('optionalFile');

    expect(Object.keys(responseGet?.responses || {})).toEqual([
      '201',
      '300',
      '401',
    ]);
    expect(responseGet?.responses['201'].description).toBe(
      'Response returned successfully',
    );
    expect(
      responseGet?.responses['201'].content?.['application/json']?.schema
        ?.properties?.test,
    ).toEqual(
      expect.objectContaining({
        type: 'boolean',
      }),
    );
  });
});
