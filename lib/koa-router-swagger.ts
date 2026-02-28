import Router from 'koa-router';
import { koaSwagger, KoaSwaggerUiOptions } from 'koa2-swagger-ui';
import { mapAllMethods } from './utils/router-utils';

const KoaRouterSwagger = (
  router: Router,
  uiConfig: Partial<KoaSwaggerUiOptions>,
) => {
  const paths = mapAllMethods(router);

  const config: Partial<KoaSwaggerUiOptions> = {
    ...uiConfig,
    swaggerOptions: {
      ...uiConfig.swaggerOptions,
      spec: {
        ...uiConfig.swaggerOptions?.spec,
        openapi: '3.0.0',
        paths,
      },
    },
  };

  return koaSwagger(config);
};

export { KoaRouterSwagger };
