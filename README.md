# koa-router-zod-swagger

> Validate router input and host swagger ui based on @koa/router and zod schema

## Version Compatibility

- `koa-router-zod-swagger@^2` is compatible with `zod@^4`.
- `koa-router-zod-swagger@^1` remains available for `zod@^3`.

## Installation

```sh
$ npm install koa-router-zod-swagger zod

$ yarn add koa-router-zod-swagger zod

$ pnpm install koa-router-zod-swagger zod
```
> Uses [`Zod@v4`](https://zod.dev/), [`@koa/router`](https://github.com/koajs/router) And [`koa2-swagger-ui`](https://github.com/scttcper/koa2-swagger-ui)

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

### Create validation Zod object schema ([See Zod Documentation](https://zod.dev/))

```js
const RouterSchema: ZodValidatorProps = {
  summary: 'Make test post request',
  description: `Make [API](https://en.wikipedia.org/wiki/API) Request`,
  query: z.object({
    queryParam: z.string(),
  }),
  body: z.object({
    bodyParamString: z.string(),
    bodyParamNumber: z.number(),
  }),
  files: {
    file1: true,
    multipleFiles: {
      multiple: true
    },
    optionalFile: {
      optional: true
    }
  },
  filesValidator: z.object({
    file1: z.object({ // formidable.File object
      size: z.number().min(5 * 1000).max(7 * 1000), // Min 5KB, Max 7KB.
      mimetype: z.enum(['image/png'])
    })
  }),
  params: z.object({
    param1: z.string(),
  }),
  header: z.object({
    'user-agent': z.string()
  }),
  response: {
    description: 'Response returned successfully',
    validate: true,
    body: z.object({
      query: z.object(),
      params: z.object(),
      body: z.object()
    })
  }
};
```
### Validate
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
