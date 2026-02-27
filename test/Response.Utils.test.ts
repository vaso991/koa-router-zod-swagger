import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { generateResponses } from '../lib/utils/Response.Utils';

describe('Response.Utils', () => {
  it('returns default swagger responses when validator props are missing', () => {
    const responses = generateResponses();

    expect(Object.keys(responses)).toEqual(['200', '201', '400', '500']);
    expect(responses['200'].description).toBe('OK');
    expect(responses['201'].description).toBe('Created');
    expect(responses['400'].description).toBe('Bad Request');
    expect(responses['500'].description).toBe('Internal Server Error');
  });

  it('uses custom status codes and applies custom description to the first one', () => {
    const responses = generateResponses({
      response: {
        validate: false,
        description: 'Accepted for async processing',
        possibleStatusCodes: [202, 422],
      },
    });

    expect(Object.keys(responses)).toEqual(['202', '422']);
    expect(responses['202'].description).toBe('Accepted for async processing');
    expect(responses['422'].description).toBe('Unprocessable Entity');
  });

  it('adds response body schema and converts date fields to date-time', () => {
    const responses = generateResponses({
      response: {
        validate: true,
        possibleStatusCodes: [201],
        body: z.object({
          createdAt: z.date(),
          name: z.string(),
        }),
      },
    });

    const schema = responses['201'].content?.['application/json']?.schema;
    expect(schema?.properties?.createdAt).toEqual(
      expect.objectContaining({
        type: 'string',
        format: 'date-time',
      }),
    );
    expect(schema?.properties?.name).toEqual(
      expect.objectContaining({
        type: 'string',
      }),
    );
  });
});
