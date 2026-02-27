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

    const middleware = KoaRouterSwagger(router, uiConfig);

    expect(koaSwaggerSpy).toHaveBeenCalledTimes(1);
    expect(middleware).toBe(uiConfig);
    expect(uiConfig.swaggerOptions.spec.info).toEqual({ title: 'Demo API' });
    expect(uiConfig.swaggerOptions.spec.openapi).toBe('3.0.0');
    expect(uiConfig.swaggerOptions.spec.paths).toEqual(
      expect.objectContaining({
        '/v1/posts/{id}': expect.objectContaining({
          post: expect.any(Object),
        }),
      }),
    );
  });

  it('initializes swaggerOptions and spec when omitted', () => {
    const router = new Router();
    router.get('/health', async () => {});
    const uiConfig = {};

    const koaSwaggerSpy = vi
      .spyOn(swaggerUi, 'koaSwagger')
      .mockImplementation((config) => config as never);

    const middleware = KoaRouterSwagger(router, uiConfig);

    expect(koaSwaggerSpy).toHaveBeenCalledTimes(1);
    expect(middleware).toBe(uiConfig);
    expect((uiConfig as any).swaggerOptions.spec.openapi).toBe('3.0.0');
    expect((uiConfig as any).swaggerOptions.spec.paths).toEqual(
      expect.objectContaining({
        '/health': expect.objectContaining({
          get: expect.any(Object),
        }),
      }),
    );
  });
});
