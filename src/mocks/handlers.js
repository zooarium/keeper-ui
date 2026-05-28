// MSW request handlers — shared between browser (dev) and Node (tests).
// Override per test: server.use(http.get('*/things', () => HttpResponse.json(...)))
import { http, HttpResponse } from 'msw';

export const handlers = [
  // --- Auth ---
  http.post('*/users/auth', () =>
    HttpResponse.json({
      data: {
        token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: { id: 1, email: 'user@example.com', role: 'user', permissions: [] },
      },
    })
  ),

  http.post('*/users/refresh', () =>
    HttpResponse.json({
      data: { token: 'mock-access-token-refreshed', refresh_token: 'mock-refresh-token-2' },
    })
  ),

  // --- Things (template — replace with your resource) ---
  http.get('*/things', () =>
    HttpResponse.json({
      data: {
        things: [
          { id: 1, name: 'Thing One' },
          { id: 2, name: 'Thing Two' },
        ],
      },
    })
  ),

  http.post('*/things', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: { id: Date.now(), ...body } }, { status: 201 });
  }),

  http.put('*/things/:id', async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: { id: Number(params.id), ...body } });
  }),

  http.delete('*/things/:id', () => new HttpResponse(null, { status: 204 })),
];
