const Koa = require('koa');
const KoaRouter = require('koa-router');
const { z } = require('zod');
const KoaBodyParser = require('koa-bodyparser');
const { ZodValidator, ZodValidatorProps, KoaRouterSwagger } = require('../dist');

const app = new Koa();

app.use(KoaBodyParser());

const router = new KoaRouter();

const RouterSchema = {
  summary: 'Make test post request',
  description: `Make [API](https://en.wikipedia.org/wiki/API) Request`,
  responseCodes: [200, 201, 400, 500],
  body: z.object({
    string: z.string().optional(),
    uuid: z.string().uuid(),
    email: z.string().email(),
    url: z.string().url(),
    stringDateTime: z.string().datetime(),
    number: z.number(),
    boolean: z.boolean(),
    object: z.object({
      element1: z.string(),
      element2: z.string()
    }),
    array: z.array(z.string()),
    number_array: z.array(z.number()),
    date: z.coerce.date()
  }),
  params: z.object({
    param1: z.string(),
  }),
  header: z.object({
    'user-agent': z.string()
  })
};

router.post('/test/:param1', ZodValidator(RouterSchema), (ctx) => {
  ctx.body = {
    query: ctx.request.query,
    params: ctx.params,
    body: ctx.request.body,
  };
});

app.use(
  KoaRouterSwagger(router, {
    routePrefix: '/docs',
    exposeSpec: true,
    specPrefix: '/docs/spec',
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
