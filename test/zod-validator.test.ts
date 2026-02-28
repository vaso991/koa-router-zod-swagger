import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodType } from 'zod';
import {
  resetZodValidatorGlobalConfig,
  setZodValidatorGlobalConfig,
} from '../lib/zod-validator-config';
import {
  ZodValidator,
} from '../lib/zod-validator';

const createParser = (parsedValue: unknown = undefined) =>
  ({
    parseAsync: vi.fn().mockResolvedValue(parsedValue),
  }) as unknown as ZodType;

describe('ZodValidator', () => {
  beforeEach(() => {
    resetZodValidatorGlobalConfig();
  });

  it('validates request parts and calls next', async () => {
    const query = createParser();
    const params = createParser();
    const header = createParser();
    const body = createParser();
    const files = createParser();
    const props = {
      query,
      params,
      header,
      body,
      filesValidator: files,
    };

    const middleware = ZodValidator(props);
    const ctx = {
      request: {
        query: { q: 'search' },
        header: { 'x-request-id': 'req-1' },
        body: { name: 'post' },
        files: { file1: { size: 10 } },
      },
      params: { id: '42' },
      body: undefined,
    } as any;
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware(ctx, next);

    expect(query.parseAsync).toHaveBeenCalledWith(ctx.request.query);
    expect(params.parseAsync).toHaveBeenCalledWith(ctx.params);
    expect(header.parseAsync).toHaveBeenCalledWith(ctx.request.header);
    expect(body.parseAsync).toHaveBeenCalledWith(ctx.request.body);
    expect(files.parseAsync).toHaveBeenCalledWith(ctx.request.files);
    expect(next).toHaveBeenCalledTimes(1);
    expect((middleware as any)._VALIDATOR_PROPS).toBe(props);
  });

  it('validates response body when response validation is enabled', async () => {
    const responseBody = createParser();
    const middleware = ZodValidator({
      response: {
        validate: true,
        body: responseBody,
      },
    });
    const ctx = {
      request: {
        header: {},
      },
      body: undefined,
    } as any;
    const next = vi.fn().mockImplementation(async () => {
      ctx.body = { ok: true };
    });

    await middleware(ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(responseBody.parseAsync).toHaveBeenCalledWith({ ok: true });
  });

  it('uses global assignParsedData when route assignParsedData is not provided', async () => {
    const query = createParser({ q: 'parsed' });
    const params = createParser({ id: 42 });
    const header = createParser({ 'x-request-id': 'parsed-id' });
    const body = createParser({ name: 'parsed' });
    const files = createParser({ file1: { size: 999 } });

    setZodValidatorGlobalConfig({ assignParsedData: ['params', 'body'] });

    const middleware = ZodValidator({
      query,
      params,
      header,
      body,
      filesValidator: files,
    });

    const queryInput = { q: 'raw' };
    const paramsInput = { id: '42' };
    const headerInput = { 'x-request-id': 'raw-id' };
    const bodyInput = { name: 'raw' };
    const filesInput = { file1: { size: 1 } };

    const ctx = {
      request: {
        query: queryInput,
        header: headerInput,
        body: bodyInput,
        files: filesInput,
      },
      params: paramsInput,
      body: undefined,
    } as any;

    await middleware(ctx, vi.fn().mockResolvedValue(undefined));

    expect(ctx.request.query).toBe(queryInput);
    expect(ctx.params).toEqual({ id: 42 });
    expect(ctx.request.header).toBe(headerInput);
    expect(ctx.request.body).toEqual({ name: 'parsed' });
    expect(ctx.request.files).toBe(filesInput);
  });

  it('lets route assignParsedData override global config', async () => {
    setZodValidatorGlobalConfig({ assignParsedData: true });

    const query = createParser({ q: 'parsed' });
    const params = createParser({ id: 42 });
    const body = createParser({ name: 'parsed' });

    const middleware = ZodValidator({
      query,
      params,
      body,
      assignParsedData: false,
    });

    const queryInput = { q: 'raw' };
    const paramsInput = { id: '42' };
    const bodyInput = { name: 'raw' };
    const ctx = {
      request: {
        query: queryInput,
        header: {},
        body: bodyInput,
      },
      params: paramsInput,
      body: undefined,
    } as any;

    await middleware(ctx, vi.fn().mockResolvedValue(undefined));

    expect(ctx.request.query).toBe(queryInput);
    expect(ctx.params).toBe(paramsInput);
    expect(ctx.request.body).toBe(bodyInput);
  });

  it('resetZodValidatorGlobalConfig clears global assignParsedData', async () => {
    setZodValidatorGlobalConfig({ assignParsedData: true });
    resetZodValidatorGlobalConfig();

    const body = createParser({ name: 'parsed' });
    const middleware = ZodValidator({ body });
    const bodyInput = { name: 'raw' };
    const ctx = {
      request: {
        header: {},
        body: bodyInput,
      },
      body: undefined,
    } as any;

    await middleware(ctx, vi.fn().mockResolvedValue(undefined));

    expect(ctx.request.body).toBe(bodyInput);
  });
});
