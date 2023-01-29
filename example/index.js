const Koa = require('koa');
const KoaRouter = require('koa-router');
const { z } = require('zod');
const KoaBodyParser = require('koa-bodyparser');
const { ZodValidator, ZodValidatorProps, KoaRouterSwagger } = require('../dist');

const app = new Koa();

app.use(KoaBodyParser());

const router = new KoaRouter();

const RouterSchema = {
  body: z.object({
    string: z.string().optional(),
    number: z.number(),
    boolean: z.boolean(),
    object: z.object({
      element1: z.string(),
      element2: z.string()
    }),
    array: z.array(z.string())
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
