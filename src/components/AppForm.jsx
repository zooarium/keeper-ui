import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  FormField,
  Input,
  Select,
  SocialIcon,
  SOCIAL_PLATFORMS,
  IconPlus,
  IconTrash,
} from '@aviary-ui/ui';

const CUSTOM = '__custom__';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  tagline: z.string().optional(),
  logo_url: z.string().optional(),
  status: z.coerce.number(),
  about: z.object({
    heading: z.string().optional(),
    body: z.string().optional(),
  }),
  contact: z.object({
    email: z.string().optional(),
    phone1: z.string().optional(),
    phone2: z.string().optional(),
    hours: z.string().optional(),
    address: z.object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    }),
  }),
  social: z
    .array(
      z.object({
        platform: z.string(),
        customKey: z.string().optional(),
        url: z.string().optional(),
      })
    )
    .optional(),
});

// Map a stored contact.social object → editable rows. Keys present in the
// registry bind to that platform; anything else becomes a custom-keyed row.
function socialToRows(social) {
  const entries = Object.entries(social ?? {});
  if (entries.length === 0) return [];
  const known = new Set(SOCIAL_PLATFORMS.map((p) => p.key));
  return entries.map(([key, url]) =>
    known.has(key)
      ? { platform: key, customKey: '', url: url ?? '' }
      : { platform: CUSTOM, customKey: key, url: url ?? '' }
  );
}

// Editable rows → contact.social map. Drops rows with no resolved key or no
// value; custom keys are lowercased/trimmed to match server normalization.
function rowsToSocial(rows) {
  const out = {};
  for (const r of rows ?? []) {
    const key = (r.platform === CUSTOM ? r.customKey : r.platform)?.trim().toLowerCase();
    const url = r.url?.trim();
    if (key && url) out[key] = url;
  }
  return out;
}

function buildDefaults(app) {
  return {
    name: app?.name ?? '',
    tagline: app?.tagline ?? '',
    logo_url: app?.logo_url ?? '',
    status: app?.status ?? 1,
    about: {
      heading: app?.about?.heading ?? '',
      body: app?.about?.body ?? '',
    },
    contact: {
      email: app?.contact?.email ?? '',
      phone1: app?.contact?.phone1 ?? '',
      phone2: app?.contact?.phone2 ?? '',
      hours: app?.contact?.hours ?? '',
      address: {
        line1: app?.contact?.address?.line1 ?? '',
        line2: app?.contact?.address?.line2 ?? '',
        city: app?.contact?.address?.city ?? '',
        state: app?.contact?.address?.state ?? '',
        postal_code: app?.contact?.address?.postal_code ?? '',
        country: app?.contact?.address?.country ?? '',
      },
    },
    social: socialToRows(app?.contact?.social),
  };
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <h4 className="mb-3 text-secondary text-uppercase fw-bold" style={{ fontSize: '0.75rem' }}>
        {title}
      </h4>
      {children}
    </div>
  );
}

/**
 * Sectioned create/edit form for an App. Reused by both the create modal
 * (AppsPage) and the edit modal (AppDetailsPage). Renders its own footer.
 *
 * @param {object}   props.initial  existing app (edit) or null (create)
 * @param {string}   props.mode     'create' | 'edit'
 * @param {Function} props.onSubmit (payload) => Promise — throws to keep open
 * @param {Function} props.onCancel
 */
export default function AppForm({ initial, mode = 'create', onSubmit, onCancel }) {
  const isEdit = mode === 'edit';
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(initial),
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'social' });
  const socialRows = watch('social') ?? [];

  useEffect(() => {
    reset(buildDefaults(initial));
  }, [initial, reset]);

  const submit = handleSubmit(async (values) => {
    const payload = {
      name: values.name.trim(),
      tagline: values.tagline?.trim() ?? '',
      logo_url: values.logo_url?.trim() ?? '',
      status: Number(values.status),
      about: {
        heading: values.about.heading?.trim() ?? '',
        body: values.about.body ?? '',
      },
      contact: {
        email: values.contact.email?.trim() ?? '',
        phone1: values.contact.phone1?.trim() ?? '',
        phone2: values.contact.phone2?.trim() ?? '',
        hours: values.contact.hours ?? '',
        address: {
          line1: values.contact.address.line1?.trim() ?? '',
          line2: values.contact.address.line2?.trim() ?? '',
          city: values.contact.address.city?.trim() ?? '',
          state: values.contact.address.state?.trim() ?? '',
          postal_code: values.contact.address.postal_code?.trim() ?? '',
          country: values.contact.address.country?.trim() ?? '',
        },
        social: rowsToSocial(values.social),
      },
    };
    await onSubmit(payload);
  });

  return (
    <form onSubmit={submit} noValidate>
      <Section title="Basic">
        <FormField label="Name" htmlFor="name" error={errors.name?.message}>
          <Input
            id="name"
            error={errors.name?.message}
            placeholder="App name"
            {...register('name')}
          />
        </FormField>
        <FormField label="Tagline" htmlFor="tagline">
          <Input id="tagline" placeholder="Short tagline" {...register('tagline')} />
        </FormField>
        <FormField label="Logo URL" htmlFor="logo_url">
          <Input id="logo_url" placeholder="https://…/logo.png" {...register('logo_url')} />
        </FormField>
        <FormField label="Status" htmlFor="status">
          <Select id="status" {...register('status')}>
            <option value={1}>Active</option>
            <option value={0}>Inactive</option>
          </Select>
        </FormField>
      </Section>

      <Section title="About">
        <FormField label="Heading" htmlFor="about.heading">
          <Input id="about.heading" {...register('about.heading')} />
        </FormField>
        <FormField label="Body (HTML allowed)" htmlFor="about.body">
          <textarea
            id="about.body"
            className="form-control"
            rows={10}
            placeholder="Rich text — HTML tags are allowed."
            {...register('about.body')}
          />
          <small className="form-hint">HTML is permitted; it is sanitized before display.</small>
        </FormField>
      </Section>

      <Section title="Contact">
        <div className="row g-2">
          <div className="col-sm-6">
            <FormField label="Email" htmlFor="contact.email">
              <Input id="contact.email" type="email" {...register('contact.email')} />
            </FormField>
          </div>
          <div className="col-sm-6">
            <FormField label="Phone 1" htmlFor="contact.phone1">
              <Input id="contact.phone1" {...register('contact.phone1')} />
            </FormField>
          </div>
          <div className="col-sm-6">
            <FormField label="Phone 2" htmlFor="contact.phone2">
              <Input id="contact.phone2" {...register('contact.phone2')} />
            </FormField>
          </div>
        </div>
        <FormField label="Business hours" htmlFor="contact.hours">
          <textarea
            id="contact.hours"
            className="form-control"
            rows={4}
            placeholder={'Mon–Fri 9:00–17:00\nSat 10:00–14:00'}
            {...register('contact.hours')}
          />
          <small className="form-hint">Free text — line breaks are preserved.</small>
        </FormField>
      </Section>

      <Section title="Address">
        <div className="row g-2">
          <div className="col-12">
            <FormField label="Line 1" htmlFor="contact.address.line1">
              <Input id="contact.address.line1" {...register('contact.address.line1')} />
            </FormField>
          </div>
          <div className="col-12">
            <FormField label="Line 2" htmlFor="contact.address.line2">
              <Input id="contact.address.line2" {...register('contact.address.line2')} />
            </FormField>
          </div>
          <div className="col-sm-6">
            <FormField label="City" htmlFor="contact.address.city">
              <Input id="contact.address.city" {...register('contact.address.city')} />
            </FormField>
          </div>
          <div className="col-sm-6">
            <FormField label="State" htmlFor="contact.address.state">
              <Input id="contact.address.state" {...register('contact.address.state')} />
            </FormField>
          </div>
          <div className="col-sm-6">
            <FormField label="Postal code" htmlFor="contact.address.postal_code">
              <Input
                id="contact.address.postal_code"
                {...register('contact.address.postal_code')}
              />
            </FormField>
          </div>
          <div className="col-sm-6">
            <FormField label="Country" htmlFor="contact.address.country">
              <Input id="contact.address.country" {...register('contact.address.country')} />
            </FormField>
          </div>
        </div>
      </Section>

      <Section title="Social media">
        {fields.length === 0 && (
          <p className="text-secondary small mb-2">No links yet. Add as many as you like.</p>
        )}
        {fields.map((field, i) => {
          const row = socialRows[i] ?? {};
          const isCustom = row.platform === CUSTOM;
          return (
            <div key={field.id} className="d-flex align-items-start gap-2 mb-2">
              <span className="pt-2 text-secondary" title="Icon preview">
                <SocialIcon platform={isCustom ? row.customKey : row.platform} />
              </span>
              <div style={{ width: 150 }}>
                <Select {...register(`social.${i}.platform`)} aria-label="Platform">
                  {SOCIAL_PLATFORMS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                  <option value={CUSTOM}>Other (custom)…</option>
                </Select>
              </div>
              {isCustom && (
                <div style={{ width: 130 }}>
                  <Input
                    placeholder="key (e.g. mastodon)"
                    aria-label="Custom platform key"
                    {...register(`social.${i}.customKey`)}
                  />
                </div>
              )}
              <div className="flex-grow-1">
                <Input
                  placeholder="https://…"
                  aria-label="URL or handle"
                  {...register(`social.${i}.url`)}
                />
              </div>
              <Button
                type="button"
                variant="ghost-danger"
                size="sm"
                icon
                onClick={() => remove(i)}
                title="Remove"
              >
                <IconTrash size={16} />
              </Button>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          className="d-flex align-items-center gap-1"
          onClick={() => append({ platform: SOCIAL_PLATFORMS[0].key, customKey: '', url: '' })}
        >
          <IconPlus size={14} />
          Add link
        </Button>
      </Section>

      <div className="d-flex justify-content-end gap-2 border-top pt-3">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEdit ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
