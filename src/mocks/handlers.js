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
        user: { id: 1, email: 'user@example.com', role: 1, app_id: 1, permissions: [] },
      },
    })
  ),

  http.post('*/users/refresh', () =>
    HttpResponse.json({
      data: { token: 'mock-access-token-refreshed', refresh_token: 'mock-refresh-token-2' },
    })
  ),

  // --- Apps ---
  http.get('*/apps', () =>
    HttpResponse.json({
      data: [
        {
          id: 1,
          name: 'Acme Store',
          status: 1,
          tagline: 'Everything under one roof',
          logo_url: 'https://example.com/logo.png',
          about: { heading: 'Who we are', body: '<p>Family run since <b>1984</b>.</p>' },
          contact: {
            email: 'hello@acme.com',
            phone1: '+1 555 0100',
            phone2: '',
            hours: 'Mon–Fri 9:00–17:00\nSat 10:00–14:00',
            address: {
              line1: '1 Market St',
              line2: '',
              city: 'Springfield',
              state: 'IL',
              postal_code: '62701',
              country: 'USA',
            },
            social: { facebook: 'https://facebook.com/acme', x: 'https://x.com/acme' },
          },
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
        },
      ],
    })
  ),

  http.get('*/apps/:id', ({ params }) =>
    HttpResponse.json({
      data: {
        id: Number(params.id),
        name: 'Acme Store',
        status: 1,
        tagline: 'Everything under one roof',
        logo_url: 'https://example.com/logo.png',
        about: { heading: 'Who we are', body: '<p>Family run since <b>1984</b>.</p>' },
        contact: {
          email: 'hello@acme.com',
          phone1: '+1 555 0100',
          phone2: '',
          hours: 'Mon–Fri 9:00–17:00',
          address: {
            line1: '1 Market St',
            line2: '',
            city: 'Springfield',
            state: 'IL',
            postal_code: '62701',
            country: 'USA',
          },
          social: { facebook: 'https://facebook.com/acme' },
        },
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      },
    })
  ),

  http.post('*/apps', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: { id: Date.now(), ...body } }, { status: 201 });
  }),

  http.put('*/apps/:id', async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: { id: Number(params.id), ...body } });
  }),

  http.delete('*/apps/:id', () => new HttpResponse(null, { status: 204 })),

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

  // --- Divisions ---
  http.get('*/divisions', () =>
    HttpResponse.json({
      data: [
        {
          id: 1,
          app_id: 1,
          name: 'Headquarters',
          parent_id: 0,
          path: '1',
          depth: 0,
          status: 1,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 2,
          app_id: 1,
          name: 'Sales',
          parent_id: 1,
          path: '1.2',
          depth: 1,
          status: 1,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
    })
  ),

  http.post('*/divisions', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { data: { id: Date.now(), depth: 0, path: '', ...body } },
      { status: 201 }
    );
  }),

  http.put('*/divisions/:id/move', async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: { id: Number(params.id), parent_id: body.parent_id } });
  }),

  http.put('*/divisions/:id', async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: { id: Number(params.id), ...body } });
  }),

  http.delete('*/divisions/:id', () => new HttpResponse(null, { status: 204 })),

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
