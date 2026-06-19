import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SafeHtml, SocialIcon, socialIcon, SOCIAL_PLATFORMS } from '@aviary-ui/ui';
import AppForm from '@/components/AppForm';

describe('social registry', () => {
  it('resolves a known key to a brand icon and unknown to a fallback', () => {
    const known = socialIcon('facebook');
    const fallback = socialIcon('mastodon'); // not in registry
    expect(typeof known).toBe('object'); // forwardRef component
    expect(fallback).toBeTruthy();
    // fallback differs from a known platform icon
    expect(fallback).not.toBe(known);
  });

  it('renders without throwing for a custom platform', () => {
    render(<SocialIcon platform="totally-made-up" />);
  });
});

describe('SafeHtml', () => {
  it('strips script tags but keeps safe markup', () => {
    const { container } = render(
      <SafeHtml html={'<p>hi <b>there</b></p><script>alert(1)</script>'} />
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('b')).not.toBeNull();
    expect(container.textContent).toContain('hi there');
  });
});

describe('AppForm', () => {
  it('prefills social rows from the contact.social map (known + custom)', () => {
    render(
      <AppForm
        mode="edit"
        initial={{
          name: 'Acme',
          status: 1,
          contact: { social: { facebook: 'https://fb.com/a', mastodon: 'https://m.social/a' } },
        }}
        onSubmit={vi.fn().mockResolvedValue()}
        onCancel={() => {}}
      />
    );
    // custom key input appears for the unknown 'mastodon' platform
    expect(screen.getByDisplayValue('mastodon')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://fb.com/a')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://m.social/a')).toBeInTheDocument();
  });

  it('serializes rows back to a social map on submit (round-trip)', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(
      <AppForm
        mode="edit"
        initial={{
          name: 'Acme',
          status: 1,
          contact: { social: { facebook: 'https://fb.com/a', mastodon: 'https://m.social/a' } },
        }}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /update/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.name).toBe('Acme');
    expect(payload.contact.social).toEqual({
      facebook: 'https://fb.com/a',
      mastodon: 'https://m.social/a',
    });
  });

  it('drops social rows with an empty value', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(
      <AppForm
        mode="edit"
        initial={{
          name: 'Acme',
          status: 1,
          contact: { social: { facebook: '' } },
        }}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /update/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].contact.social).toEqual({});
  });

  it('blocks submit when name is empty', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<AppForm mode="create" initial={null} onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    await waitFor(() => expect(screen.getByText('Name is required.')).toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('registry has unique keys', () => {
    const keys = SOCIAL_PLATFORMS.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
