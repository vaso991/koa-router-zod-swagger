import Router from 'koa-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as swaggerUi from 'koa2-swagger-ui';
import { z } from 'zod';
import { KoaRouterSwagger } from '../lib/koa-router-swagger';
import { ZodValidator } from '../lib/zod-validator';

describe('KoaRouterSwagger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates swagger middleware with generated OpenAPI 3 spec', () => {
    const router = new Router({ prefix: '/v1' });
    router.post(
      '/posts/:id',
      ZodValidator({
        params: z.object({ id: z.string() }),
      }),
      async () => {},
    );
    const uiConfig = {
      swaggerOptions: {
        spec: {
          info: {
            title: 'Demo API',
          },
        },
      },
    };

    const koaSwaggerSpy = vi
      .spyOn(swaggerUi, 'koaSwagger')
      .mockImplementation((config) => config as never);

    const result = KoaRouterSwagger(router, uiConfig);

    expect(koaSwaggerSpy).toHaveBeenCalledTimes(1);
    expect(result).not.toBe(uiConfig);

    const resultSpec = (result as any).swaggerOptions.spec;
    expect(resultSpec.info).toEqual({ title: 'Demo API' });
    expect(resultSpec.openapi).toBe('3.0.0');
    expect(resultSpec.paths).toEqual(
      expect.objectContaining({
        '/v1/posts/{id}': expect.objectContaining({
          post: expect.any(Object),
        }),
      }),
    );

    // original uiConfig must not be mutated
    expect((uiConfig.swaggerOptions.spec as any).openapi).toBeUndefined();
    expect((uiConfig.swaggerOptions.spec as any).paths).toBeUndefined();
  });

  it('initializes swaggerOptions and spec when omitted', () => {
    const router = new Router();
    router.get('/health', async () => {});
    const uiConfig = {};

    const koaSwaggerSpy = vi
      .spyOn(swaggerUi, 'koaSwagger')
      .mockImplementation((config) => config as never);

    const result = KoaRouterSwagger(router, uiConfig);

    expect(koaSwaggerSpy).toHaveBeenCalledTimes(1);
    expect((result as any).swaggerOptions.spec.openapi).toBe('3.0.0');
    expect((result as any).swaggerOptions.spec.paths).toEqual(
      expect.objectContaining({
        '/health': expect.objectContaining({
          get: expect.any(Object),
        }),
      }),
    );

    // original uiConfig must not be mutated
    expect(uiConfig).toEqual({});
  });
});
