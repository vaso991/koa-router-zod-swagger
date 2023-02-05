# koa-router-zod-swagger

> Validate router input and host swagger ui based on @koa/router and zod schema

## Installation

```sh
$ npm install koa-router-zod-swagger

$ yarn add koa-router-zod-swagger

$ pnpm install koa-router-zod-swagger
```
> Uses [`Zod`](https://github.com/colinhacks/zod), [`@koa/router`](https://github.com/koajs/router) And [`koa2-swagger-ui`](https://github.com/scttcper/koa2-swagger-ui)

## Usage

### Import Packages

```js
import Koa from 'koa';
import KoaRouter from 'koa-router';
import { z } from 'zod';
import { ZodValidator, ZodValidatorProps, KoaRouterSwagger } from 'koa-router-zod-swagger';
const app = new Koa();
const router = new KoaRouter();
```

### Create validation Zod object schema ([See Zod Documentation](https://github.com/colinhacks/zod#readme))

```js
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
  header: z.object({
    'user-agent': z.string()
  })
};
```
### Validate Input
```js
router.post('/api/:param1', ZodValidator(RouterSchema), (ctx) => {
  ctx.body = {
    query: ctx.request.query,
    params: ctx.params,
    body: ctx.request.body,
  };
});
```

### Serve Swagger Docs (pass [koa2-swagger-ui](https://github.com/scttcper/koa2-swagger-ui#config) config as `uiConfig`)

```js
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
```