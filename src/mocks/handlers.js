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

  // --- Guest Keys ---
  http.get('*/guest-keys', () =>
    HttpResponse.json({
      data: [
        {
          id: 1,
          app_id: 1,
          division_id: 1,
          user_id: 1,
          name: 'Public site key',
          domain: 'shop.acme.com',
          site_key: 'kpr_guest_key_abc123',
          status: 1,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
    })
  ),

  http.post('*/guest-keys', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { data: { id: Date.now(), site_key: 'kpr_guest_key_new', status: 1, ...body } },
      { status: 201 }
    );
  }),

  http.put('*/guest-keys/:id', async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: { id: Number(params.id), ...body } });
  }),

  http.delete('*/guest-keys/:id', ({ params }) =>
    HttpResponse.json({ data: { id: Number(params.id) } })
  ),
];
