const Koa = require('koa');
const KoaRouter = require('koa-router');
const KoaJsonError = require('koa-json-error');
const { z } = require('zod');
const KoaBodyParser = require('koa-bodyparser');
const { ZodValidator, KoaRouterSwagger } = require('../dist');

const app = new Koa();

app.use(KoaBodyParser());

app.use(KoaJsonError());

const router = new KoaRouter();

const effect = {
  body: z.object({
    password: z.string(),
    confirm: z.string()
  }).refine(data => data.password === data.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  })
};

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
      element2: z.string(),
      array3: z.array(z.string())
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

router.get('/test', ZodValidator({
  query: z.object({
    ar: z.array(z.string()),
    num: z.coerce.number().optional()
  }).partial()
}), (ctx) => ctx.body = ctx.query);

router.post('/test/:param1', ZodValidator(RouterSchema), (ctx) => {
  ctx.body = {
    query: ctx.request.query,
    params: ctx.params,
    body: ctx.request.body,
  };
});

router.post('/effect', ZodValidator(effect), (ctx) => {
  ctx.body = ctx.request.body;
})

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
