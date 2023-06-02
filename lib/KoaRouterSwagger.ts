import Router from 'koa-router';
import { koaSwagger, KoaSwaggerUiOptions } from 'koa2-swagger-ui';
import { MapAllMethods } from './utils/Router.Utils';
import { PathObjectType } from './Types';

const KoaRouterSwagger = (
  router: Router,
  uiConfig: Partial<KoaSwaggerUiOptions>,
) => {
  const paths = MapAllMethods(router);

  return CreateKoaSwagger(paths, router, uiConfig);
};

function CreateKoaSwagger(
  paths: PathObjectType,
  router: Router,
  uiConfig: Partial<KoaSwaggerUiOptions>,
) {
  if (!uiConfig.swaggerOptions) {
    uiConfig.swaggerOptions = {};
  }
  if (!uiConfig.swaggerOptions.spec) {
    uiConfig.swaggerOptions.spec = {};
  }
  uiConfig.swaggerOptions.spec.openapi = '3.0.0';
  uiConfig.swaggerOptions.spec.paths = paths;
  return koaSwagger(uiConfig);
}

export { KoaRouterSwagger };
