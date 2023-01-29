import Koa from 'koa';
import KoaRouter from 'koa-router';
import { z } from 'zod';
import KoaBodyParser from 'koa-bodyparser';
import { ZodValidator, ZodValidatorProps, KoaRouterSwagger } from '../lib';

const app = new Koa();

app.use(KoaBodyParser());

const router = new KoaRouter();

const RouterSchema: ZodValidatorProps = {
  query: z.object({
    queryParam: z.string(),
  }),
  body: z.object({
    bodyParamString: z.string(),
    bodyParamNumber: z.number(),
  }),
  params: z.object({
    param1: z.string(),
  }),
};

router.post('/test/:param1', ZodValidator(RouterSchema), (ctx) => {
  ctx.body = {
    query: ctx.request.query,
    params: ctx.params,
    body: ctx.request.body,
  };
});

router.get(
  '/docs',
  KoaRouterSwagger(router, {
    routePrefix: false,
    title: 'Test Api',
    swaggerOptions: {
      spec: {
        info: {
          version: '1.0.0',
          description: 'This is test api specs',
        },
      },
    },
  }),
);

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Server started in port 3000');
});
