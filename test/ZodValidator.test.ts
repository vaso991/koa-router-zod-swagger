import { describe, expect, it, vi } from 'vitest';
import { ZodType } from 'zod';
import { ZodValidator } from '../lib/ZodValidator';

const createParser = () =>
  ({
    parseAsync: vi.fn().mockResolvedValue(undefined),
  }) as unknown as ZodType;

describe('ZodValidator', () => {
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
});
