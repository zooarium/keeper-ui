import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AppLayout,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  Spinner,
  FormField,
  Input,
  Select,
  Modal,
  ConfirmDialog,
  SafeHtml,
  SocialIcon,
  socialLabel,
  IconPlus,
  IconEdit,
  IconTrash,
  IconArrowLeft,
  IconLogin2,
  useNotification,
} from '@aviary-ui/ui';
import { storage } from '@aviary-ui/core';
import { useApp, APPS_KEY } from '@/hooks/useApps';
import { useDivisions } from '@/hooks/useDivisions';
import { useUsers } from '@/hooks/useUsers';
import { useGuestKeys } from '@/hooks/useGuestKeys';
import { fetchImpersonationServices, launchImpersonation } from '@/api/impersonation';
import AppForm from '@/components/AppForm';
import { NAV_ITEMS } from '@/config/nav';

const SECTION_PAGE_SIZE = 10;

const STATUS_LABEL = { 0: 'Inactive', 1: 'Active' };
const STATUS_COLOR = { 0: 'danger', 1: 'success' };
const ROLE_LABEL = { 0: 'User', 1: 'Sysadmin' };

function formatDate(d) {
  return d ? new Date(d).toLocaleString('en-GB') : '—';
}

function formatDateShort(d) {
  return d ? new Date(d).toLocaleDateString('en-GB') : '—';
}

// Build a division's full root→leaf name chain. Returns e.g. ["Headquarters", "Sales"].
function divisionChain(id, divisions) {
  const byId = new Map(divisions.map((d) => [d.id, d]));
  const chain = [];
  const seen = new Set();
  let cur = byId.get(id);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    chain.unshift(cur.name);
    cur = cur.parent_id ? byId.get(cur.parent_id) : null;
  }
  return chain;
}

// "Sales (Headquarters)" — parens show ancestors only; plain name for roots.
function divisionLabel(id, divisions, fallback = '—') {
  const chain = divisionChain(id, divisions);
  if (chain.length === 0) return fallback;
  const name = chain[chain.length - 1];
  const ancestors = chain.slice(0, -1);
  return ancestors.length > 0 ? `${name} (${ancestors.join(' / ')})` : name;
}

// ─── Division Modal ───────────────────────────────────────────────────────────

const EMPTY_DIV = { name: '', status: 1, parent_id: '' };

function DivisionModal({ isOpen, onClose, onSave, initial, isEdit, divisions }) {
  const [form, setForm] = useState(EMPTY_DIV);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const firstRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setForm(initial ?? EMPTY_DIV);
      setErrors({});
    }
  }, [isOpen, initial]);

  useEffect(() => {
    if (isOpen) firstRef.current?.focus();
  }, [isOpen]);

  // Parent options: same-app divisions, excluding self (a division can't be its own parent).
  const parentOptions = divisions.filter((d) => d.id !== initial?.id);

  const change = (e) => {
    const { id, value } = e.target;
    let val = value;
    if (id === 'status') val = Number(value);
    else if (id === 'parent_id') val = value === '' ? '' : Number(value);
    setForm((p) => ({ ...p, [id]: val }));
    if (errors[id]) setErrors((p) => ({ ...p, [id]: null }));
  };

  const validate = (f) => {
    const errs = {};
    if (!f.name.trim()) errs.name = 'Name is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Division' : 'New Division'}>
      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Name" htmlFor="name" error={errors.name}>
          <Input
            id="name"
            type="text"
            placeholder="Division name"
            ref={firstRef}
            error={errors.name}
            value={form.name}
            onChange={change}
          />
        </FormField>
        <FormField label="Parent" htmlFor="parent_id">
          <Select id="parent_id" value={form.parent_id} onChange={change}>
            <option value="">None (root)</option>
            {parentOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {divisionLabel(d.id, divisions)}
              </option>
            ))}
          </Select>
        </FormField>
        {isEdit && (
          <FormField label="Status" htmlFor="status">
            <Select id="status" value={form.status} onChange={change}>
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </Select>
          </FormField>
        )}
        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── User Modal ───────────────────────────────────────────────────────────────

const EMPTY_USER = {
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  division_id: '',
  role: 0,
  status: 1,
};

function UserModal({ isOpen, onClose, onSave, initial, isEdit, divisions }) {
  const [form, setForm] = useState(EMPTY_USER);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const firstRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setForm(
        initial
          ? {
              firstname: initial.firstname ?? '',
              lastname: initial.lastname ?? '',
              email: initial.email ?? '',
              password: '',
              division_id: initial.division_id ?? '',
              role: initial.role ?? 0,
              status: initial.status ?? 1,
            }
          : EMPTY_USER
      );
      setErrors({});
    }
  }, [isOpen, initial]);

  useEffect(() => {
    if (isOpen) firstRef.current?.focus();
  }, [isOpen]);

  const change = (e) => {
    const { id, value } = e.target;
    let val = value;
    if (id === 'role' || id === 'status' || id === 'division_id') val = Number(value);
    setForm((p) => ({ ...p, [id]: val }));
    if (errors[id]) setErrors((p) => ({ ...p, [id]: null }));
  };

  const validate = (f) => {
    const errs = {};
    if (!f.firstname.trim()) errs.firstname = 'First name is required.';
    if (!f.lastname.trim()) errs.lastname = 'Last name is required.';
    if (!f.email.trim()) errs.email = 'Email is required.';
    if (!isEdit && f.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (!f.division_id) errs.division_id = 'Division is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (isEdit && !payload.password) delete payload.password;
      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit User' : 'New User'}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-2">
          <div className="col-sm-6">
            <FormField label="First Name" htmlFor="firstname" error={errors.firstname}>
              <Input
                id="firstname"
                type="text"
                ref={firstRef}
                error={errors.firstname}
                value={form.firstname}
                onChange={change}
              />
            </FormField>
          </div>
          <div className="col-sm-6">
            <FormField label="Last Name" htmlFor="lastname" error={errors.lastname}>
              <Input
                id="lastname"
                type="text"
                error={errors.lastname}
                value={form.lastname}
                onChange={change}
              />
            </FormField>
          </div>
        </div>
        <FormField label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            error={errors.email}
            value={form.email}
            onChange={change}
          />
        </FormField>
        <FormField
          label={isEdit ? 'Password (leave blank to keep current)' : 'Password'}
          htmlFor="password"
          error={errors.password}
        >
          <Input
            id="password"
            type="password"
            error={errors.password}
            value={form.password}
            onChange={change}
          />
        </FormField>
        <FormField label="Division" htmlFor="division_id" error={errors.division_id}>
          <Select
            id="division_id"
            value={form.division_id}
            onChange={change}
            error={errors.division_id}
          >
            <option value="">Select division</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {divisionLabel(d.id, divisions)}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Role" htmlFor="role">
          <Select id="role" value={form.role} onChange={change}>
            <option value={0}>User</option>
            <option value={1}>Sysadmin</option>
          </Select>
        </FormField>
        {isEdit && (
          <FormField label="Status" htmlFor="status">
            <Select id="status" value={form.status} onChange={change}>
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </Select>
          </FormField>
        )}
        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Divisions Section ────────────────────────────────────────────────────────

function DivisionsSection({ appId }) {
  const { showNotification } = useNotification();
  const { divisions, isLoading, error, refetch, create, update, remove, move } =
    useDivisions(appId);

  const divName = (id) => divisions.find((d) => d.id === id)?.name || '—';

  const [nameFilter, setNameFilter] = useState('');
  const [visible, setVisible] = useState(SECTION_PAGE_SIZE);
  const [modalState, setModalState] = useState({ isOpen: false, isEdit: false, item: null });
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  const filtered = divisions.filter(
    (d) => !nameFilter || d.name.toLowerCase().includes(nameFilter.toLowerCase())
  );
  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  const openAdd = () => setModalState({ isOpen: true, isEdit: false, item: null });
  const openEdit = (item) => setModalState({ isOpen: true, isEdit: true, item });
  const closeModal = () => setModalState({ isOpen: false, isEdit: false, item: null });

  const handleSave = async (form) => {
    const parentId = form.parent_id === '' ? null : Number(form.parent_id);
    try {
      if (modalState.isEdit) {
        // parent_id is not part of UpdateDivisionRequest — moving uses the dedicated endpoint.
        await update(modalState.item.id, { name: form.name, status: form.status });
        const currentParent = modalState.item.parent_id ?? null;
        if (parentId !== currentParent) {
          await move(modalState.item.id, parentId);
        }
      } else {
        const payload = { app_id: appId, name: form.name };
        if (parentId != null) payload.parent_id = parentId;
        await create(payload);
      }
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    }
  };

  const requestDelete = (item) => {
    setConfirmState({
      isOpen: true,
      message: `Delete division "${item.name}"? Blocked if it has children or assigned users.`,
      onConfirm: async () => {
        try {
          await remove(item.id);
        } catch (err) {
          showNotification(err.message, 'error');
        } finally {
          setConfirmState((p) => ({ ...p, isOpen: false }));
        }
      },
    });
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Divisions</CardTitle>
          <div className="card-options gap-2">
            <Input
              type="text"
              placeholder="Filter by name…"
              value={nameFilter}
              onChange={(e) => {
                setNameFilter(e.target.value);
                setVisible(SECTION_PAGE_SIZE);
              }}
              style={{ width: 200 }}
            />
            <Button size="sm" onClick={openAdd} className="d-flex align-items-center gap-1">
              <IconPlus size={14} />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardBody noPadding>
          {isLoading ? (
            <Spinner centered />
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-danger mb-3">{error}</p>
              <Button variant="outline-danger" onClick={refetch}>
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-secondary">
              {divisions.length === 0 ? 'No divisions for this app.' : 'No divisions match filter.'}
            </div>
          ) : (
            <>
              <table className="table table-vcenter table-hover card-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Parent</th>
                    <th>Path</th>
                    <th>Depth</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="w-1" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((d) => (
                    <tr key={d.id}>
                      <td className="text-secondary">{d.id}</td>
                      <td className="fw-medium">{d.name}</td>
                      <td className="text-secondary">{d.parent_id ? divName(d.parent_id) : '—'}</td>
                      <td className="text-secondary font-monospace small">{d.path}</td>
                      <td className="text-secondary">{d.depth}</td>
                      <td>
                        <Badge color={STATUS_COLOR[d.status] ?? 'secondary'}>
                          {STATUS_LABEL[d.status] ?? d.status}
                        </Badge>
                      </td>
                      <td className="text-secondary">{formatDateShort(d.created_at)}</td>
                      <td>
                        <div className="d-flex gap-1 justify-content-end">
                          <Button
                            variant="ghost-primary"
                            size="sm"
                            icon
                            onClick={() => openEdit(d)}
                            title="Edit"
                          >
                            <IconEdit size={15} />
                          </Button>
                          <Button
                            variant="ghost-danger"
                            size="sm"
                            icon
                            onClick={() => requestDelete(d)}
                            title="Delete"
                          >
                            <IconTrash size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasMore && (
                <div className="card-footer text-center">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setVisible((v) => v + SECTION_PAGE_SIZE)}
                  >
                    Load more ({filtered.length - visible} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <DivisionModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onSave={handleSave}
        initial={
          modalState.item
            ? {
                id: modalState.item.id,
                name: modalState.item.name,
                status: modalState.item.status,
                parent_id: modalState.item.parent_id ?? '',
              }
            : null
        }
        isEdit={modalState.isEdit}
        divisions={divisions}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((p) => ({ ...p, isOpen: false }))}
      />
    </>
  );
}

// ─── Users Section ────────────────────────────────────────────────────────────

function UsersSection({ appId }) {
  const { showNotification } = useNotification();
  const { users, isLoading, error, refetch, create, update, remove } = useUsers(appId);
  const { divisions } = useDivisions(appId);

  const [nameFilter, setNameFilter] = useState('');
  const [visible, setVisible] = useState(SECTION_PAGE_SIZE);
  const [modalState, setModalState] = useState({ isOpen: false, isEdit: false, item: null });
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  // Impersonation ("login as user") is sysadmin-only. The service registry is
  // fetched from keeper so the picker knows where to hand off the one-time code.
  const currentUser = storage.getUser();
  const canImpersonate = currentUser?.role === 1;
  const [impServices, setImpServices] = useState([]);
  const [impState, setImpState] = useState({ isOpen: false, user: null });

  useEffect(() => {
    if (!canImpersonate) return;
    fetchImpersonationServices()
      .then(setImpServices)
      .catch(() => {});
  }, [canImpersonate]);

  const handleLaunchImpersonation = async (service) => {
    try {
      await launchImpersonation({ targetUserId: impState.user.id, service });
      showNotification(`Opened ${service.key} as ${impState.user.email} in a new tab.`, 'success');
      setImpState({ isOpen: false, user: null });
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const filtered = users.filter((u) => {
    if (!nameFilter) return true;
    const full = `${u.firstname} ${u.lastname} ${u.email}`.toLowerCase();
    return full.includes(nameFilter.toLowerCase());
  });
  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  const openAdd = () => setModalState({ isOpen: true, isEdit: false, item: null });
  const openEdit = (item) => setModalState({ isOpen: true, isEdit: true, item });
  const closeModal = () => setModalState({ isOpen: false, isEdit: false, item: null });

  const handleSave = async (form) => {
    try {
      if (modalState.isEdit) {
        const payload = {};
        if (form.firstname) payload.firstname = form.firstname;
        if (form.lastname) payload.lastname = form.lastname;
        if (form.email) payload.email = form.email;
        if (form.password) payload.password = form.password;
        if (form.division_id) payload.division_id = Number(form.division_id);
        payload.role = form.role;
        payload.status = form.status;
        await update(modalState.item.id, payload);
      } else {
        await create({
          app_id: appId,
          division_id: Number(form.division_id),
          firstname: form.firstname,
          lastname: form.lastname,
          email: form.email,
          password: form.password,
          role: form.role,
        });
      }
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    }
  };

  const requestDelete = (item) => {
    setConfirmState({
      isOpen: true,
      message: `Delete user "${item.firstname} ${item.lastname}" (${item.email})? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await remove(item.id);
        } catch (err) {
          showNotification(err.message, 'error');
        } finally {
          setConfirmState((p) => ({ ...p, isOpen: false }));
        }
      },
    });
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <div className="card-options gap-2">
            <Input
              type="text"
              placeholder="Filter by name / email…"
              value={nameFilter}
              onChange={(e) => {
                setNameFilter(e.target.value);
                setVisible(SECTION_PAGE_SIZE);
              }}
              style={{ width: 220 }}
            />
            <Button size="sm" onClick={openAdd} className="d-flex align-items-center gap-1">
              <IconPlus size={14} />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardBody noPadding>
          {isLoading ? (
            <Spinner centered />
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-danger mb-3">{error}</p>
              <Button variant="outline-danger" onClick={refetch}>
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-secondary">
              {users.length === 0 ? 'No users for this app.' : 'No users match filter.'}
            </div>
          ) : (
            <>
              <table className="table table-vcenter table-hover card-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Division</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="w-1" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((u) => (
                    <tr key={u.id}>
                      <td className="text-secondary">{u.id}</td>
                      <td className="fw-medium">
                        {u.firstname} {u.lastname}
                      </td>
                      <td className="text-secondary">{u.email}</td>
                      <td className="text-secondary">
                        {divisionLabel(u.division_id, divisions, u.division_name || '—')}
                      </td>
                      <td>
                        <Badge color={u.role === 1 ? 'purple' : 'secondary'}>
                          {ROLE_LABEL[u.role] ?? u.role}
                        </Badge>
                      </td>
                      <td>
                        <Badge color={STATUS_COLOR[u.status] ?? 'secondary'}>
                          {STATUS_LABEL[u.status] ?? u.status}
                        </Badge>
                      </td>
                      <td className="text-secondary">{formatDateShort(u.created_at)}</td>
                      <td>
                        <div className="d-flex gap-1 justify-content-end">
                          {canImpersonate && u.role !== 1 && impServices.length > 0 && (
                            <Button
                              variant="ghost-secondary"
                              size="sm"
                              icon
                              onClick={() => setImpState({ isOpen: true, user: u })}
                              title="Login as this user"
                            >
                              <IconLogin2 size={15} />
                            </Button>
                          )}
                          <Button
                            variant="ghost-primary"
                            size="sm"
                            icon
                            onClick={() => openEdit(u)}
                            title="Edit"
                          >
                            <IconEdit size={15} />
                          </Button>
                          <Button
                            variant="ghost-danger"
                            size="sm"
                            icon
                            onClick={() => requestDelete(u)}
                            title="Delete"
                          >
                            <IconTrash size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasMore && (
                <div className="card-footer text-center">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setVisible((v) => v + SECTION_PAGE_SIZE)}
                  >
                    Load more ({filtered.length - visible} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <UserModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onSave={handleSave}
        initial={modalState.item}
        isEdit={modalState.isEdit}
        divisions={divisions}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((p) => ({ ...p, isOpen: false }))}
      />

      <Modal
        isOpen={impState.isOpen}
        onClose={() => setImpState({ isOpen: false, user: null })}
        title={impState.user ? `Login as ${impState.user.firstname} ${impState.user.lastname}` : 'Login as user'}
      >
        <p className="text-secondary">
          Open a session as <strong>{impState.user?.email}</strong> in the selected
          application. It opens in a new tab; your admin session stays active here.
        </p>
        <div className="d-flex flex-column gap-2">
          {impServices.map((svc) => (
            <Button key={svc.key} variant="outline-primary" onClick={() => handleLaunchImpersonation(svc)}>
              <IconLogin2 size={16} className="me-2" />
              {svc.key}
            </Button>
          ))}
        </div>
      </Modal>
    </>
  );
}

// ─── Guest Key Modal ────────────────────────────────────────────────────────────

const EMPTY_GUESTKEY = { name: '', domain: '', division_id: '', user_id: '', status: 1 };

function GuestKeyModal({ isOpen, onClose, onSave, initial, isEdit, divisions, users }) {
  const [form, setForm] = useState(EMPTY_GUESTKEY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const firstRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setForm(
        initial
          ? {
              name: initial.name ?? '',
              domain: initial.domain ?? '',
              division_id: initial.division_id ?? '',
              user_id: initial.user_id ?? '',
              status: initial.status ?? 1,
            }
          : EMPTY_GUESTKEY
      );
      setErrors({});
    }
  }, [isOpen, initial]);

  useEffect(() => {
    if (isOpen) firstRef.current?.focus();
  }, [isOpen]);

  const change = (e) => {
    const { id, value } = e.target;
    let val = value;
    if (id === 'status' || id === 'division_id' || id === 'user_id') val = Number(value);
    setForm((p) => ({ ...p, [id]: val }));
    if (errors[id]) setErrors((p) => ({ ...p, [id]: null }));
  };

  const validate = (f) => {
    const errs = {};
    if (!f.name.trim()) errs.name = 'Name is required.';
    if (!isEdit && !f.domain.trim()) errs.domain = 'Domain is required.';
    if (!isEdit && !f.division_id) errs.division_id = 'Division is required.';
    if (!isEdit && !f.user_id) errs.user_id = 'Guest user is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Guest Key' : 'New Guest Key'}>
      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Name" htmlFor="name" error={errors.name}>
          <Input
            id="name"
            type="text"
            placeholder="Guest key name"
            ref={firstRef}
            error={errors.name}
            value={form.name}
            onChange={change}
          />
        </FormField>
        {!isEdit && (
          <>
            <FormField label="Domain" htmlFor="domain" error={errors.domain}>
              <Input
                id="domain"
                type="text"
                placeholder="shop.acme.com"
                error={errors.domain}
                value={form.domain}
                onChange={change}
              />
              <small className="form-hint">
                URL the public UI is served from. Normalized server-side and must be unique.
              </small>
            </FormField>
            <FormField label="Division" htmlFor="division_id" error={errors.division_id}>
              <Select
                id="division_id"
                value={form.division_id}
                onChange={change}
                error={errors.division_id}
              >
                <option value="">Select division</option>
                {divisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {divisionLabel(d.id, divisions)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Guest User" htmlFor="user_id" error={errors.user_id}>
              <Select id="user_id" value={form.user_id} onChange={change} error={errors.user_id}>
                <option value="">Select user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstname} {u.lastname} ({u.email})
                  </option>
                ))}
              </Select>
            </FormField>
          </>
        )}
        {isEdit && (
          <>
            <FormField label="Domain" htmlFor="domain">
              <Input id="domain" type="text" value={form.domain} disabled readOnly />
              <small className="form-hint">Domain is immutable once created.</small>
            </FormField>
            <FormField label="Status" htmlFor="status">
              <Select id="status" value={form.status} onChange={change}>
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </Select>
            </FormField>
          </>
        )}
        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Guest Keys Section ───────────────────────────────────────────────────────

function GuestKeysSection({ appId }) {
  const { showNotification } = useNotification();
  const { guestKeys, isLoading, error, refetch, create, update, remove } = useGuestKeys(appId);
  const { divisions } = useDivisions(appId);
  const { users } = useUsers(appId);

  const divName = (id) => divisionLabel(id, divisions);
  const userName = (id) => {
    const u = users.find((x) => x.id === id);
    return u ? `${u.firstname} ${u.lastname}` : '—';
  };

  const [nameFilter, setNameFilter] = useState('');
  const [visible, setVisible] = useState(SECTION_PAGE_SIZE);
  const [modalState, setModalState] = useState({ isOpen: false, isEdit: false, item: null });
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  const filtered = guestKeys.filter(
    (k) => !nameFilter || k.name.toLowerCase().includes(nameFilter.toLowerCase())
  );
  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  const openAdd = () => setModalState({ isOpen: true, isEdit: false, item: null });
  const openEdit = (item) => setModalState({ isOpen: true, isEdit: true, item });
  const closeModal = () => setModalState({ isOpen: false, isEdit: false, item: null });

  const copyKey = async (key) => {
    try {
      await navigator.clipboard.writeText(key);
      showNotification('Site key copied!', 'success');
    } catch {
      showNotification('Copy failed.', 'error');
    }
  };

  const handleSave = async (form) => {
    try {
      if (modalState.isEdit) {
        await update(modalState.item.id, { name: form.name, status: form.status });
      } else {
        await create({
          app_id: appId,
          division_id: Number(form.division_id),
          user_id: Number(form.user_id),
          name: form.name,
          domain: form.domain.trim(),
        });
      }
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    }
  };

  const requestDelete = (item) => {
    setConfirmState({
      isOpen: true,
      message: `Delete (revoke) guest key "${item.name}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await remove(item.id);
        } catch (err) {
          showNotification(err.message, 'error');
        } finally {
          setConfirmState((p) => ({ ...p, isOpen: false }));
        }
      },
    });
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Guest Keys</CardTitle>
          <div className="card-options gap-2">
            <Input
              type="text"
              placeholder="Filter by name…"
              value={nameFilter}
              onChange={(e) => {
                setNameFilter(e.target.value);
                setVisible(SECTION_PAGE_SIZE);
              }}
              style={{ width: 200 }}
            />
            <Button size="sm" onClick={openAdd} className="d-flex align-items-center gap-1">
              <IconPlus size={14} />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardBody noPadding>
          {isLoading ? (
            <Spinner centered />
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-danger mb-3">{error}</p>
              <Button variant="outline-danger" onClick={refetch}>
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-secondary">
              {guestKeys.length === 0
                ? 'No guest keys for this app.'
                : 'No guest keys match filter.'}
            </div>
          ) : (
            <>
              <table className="table table-vcenter table-hover card-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Domain</th>
                    <th>Site Key</th>
                    <th>Division</th>
                    <th>Guest User</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="w-1" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((k) => (
                    <tr key={k.id}>
                      <td className="text-secondary">{k.id}</td>
                      <td className="fw-medium">{k.name}</td>
                      <td className="text-secondary text-truncate" style={{ maxWidth: 180 }}>
                        {k.domain || '—'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-link p-0 text-secondary font-monospace small text-truncate"
                          style={{ maxWidth: 180 }}
                          title="Click to copy"
                          onClick={() => copyKey(k.site_key)}
                        >
                          {k.site_key}
                        </button>
                      </td>
                      <td className="text-secondary">{divName(k.division_id)}</td>
                      <td className="text-secondary">{userName(k.user_id)}</td>
                      <td>
                        <Badge color={STATUS_COLOR[k.status] ?? 'secondary'}>
                          {STATUS_LABEL[k.status] ?? k.status}
                        </Badge>
                      </td>
                      <td className="text-secondary">{formatDateShort(k.created_at)}</td>
                      <td>
                        <div className="d-flex gap-1 justify-content-end">
                          <Button
                            variant="ghost-primary"
                            size="sm"
                            icon
                            onClick={() => openEdit(k)}
                            title="Edit"
                          >
                            <IconEdit size={15} />
                          </Button>
                          <Button
                            variant="ghost-danger"
                            size="sm"
                            icon
                            onClick={() => requestDelete(k)}
                            title="Delete"
                          >
                            <IconTrash size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasMore && (
                <div className="card-footer text-center">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setVisible((v) => v + SECTION_PAGE_SIZE)}
                  >
                    Load more ({filtered.length - visible} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <GuestKeyModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onSave={handleSave}
        initial={modalState.item}
        isEdit={modalState.isEdit}
        divisions={divisions}
        users={users}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((p) => ({ ...p, isOpen: false }))}
      />
    </>
  );
}

// ─── App Overview (read-only display) ──────────────────────────────────────────

function Field({ label, children, full }) {
  return (
    <div className={full ? 'col-12' : 'col-sm-6 col-md-4'}>
      <div className="text-secondary small mb-1">{label}</div>
      {children}
    </div>
  );
}

function hasAny(obj) {
  return obj && Object.values(obj).some((v) => v != null && String(v).trim() !== '');
}

function AppOverview({ app }) {
  const about = app.about ?? {};
  const contact = app.contact ?? {};
  const address = contact.address ?? {};
  const social = contact.social ?? {};
  const socialEntries = Object.entries(social).filter(([, v]) => v && String(v).trim() !== '');

  const addressLine = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ]
    .filter((v) => v && String(v).trim() !== '')
    .join(', ');

  return (
    <div className="d-flex flex-column gap-4">
      {/* Basic */}
      <div className="row g-3">
        <Field label="ID">
          <div className="fw-medium">{app.id}</div>
        </Field>
        <Field label="Name">
          <div className="fw-medium">{app.name}</div>
        </Field>
        <Field label="Status">
          <Badge color={STATUS_COLOR[app.status] ?? 'secondary'}>
            {STATUS_LABEL[app.status] ?? app.status}
          </Badge>
        </Field>
        {app.tagline && (
          <Field label="Tagline">
            <div>{app.tagline}</div>
          </Field>
        )}
        {app.logo_url && (
          <Field label="Logo">
            <img
              src={app.logo_url}
              alt={`${app.name} logo`}
              style={{ maxHeight: 40, maxWidth: 160, objectFit: 'contain' }}
            />
          </Field>
        )}
        <Field label="Created">
          <div>{formatDate(app.created_at)}</div>
        </Field>
        <Field label="Updated">
          <div>{formatDate(app.updated_at)}</div>
        </Field>
      </div>

      {/* About */}
      {(about.heading || about.body) && (
        <div className="border-top pt-3">
          <h4
            className="text-secondary text-uppercase fw-bold mb-2"
            style={{ fontSize: '0.75rem' }}
          >
            About
          </h4>
          {about.heading && <div className="fw-medium mb-2">{about.heading}</div>}
          {about.body && <SafeHtml html={about.body} />}
        </div>
      )}

      {/* Contact */}
      {(hasAny({ ...contact, address: undefined, social: undefined }) || addressLine) && (
        <div className="border-top pt-3">
          <h4
            className="text-secondary text-uppercase fw-bold mb-2"
            style={{ fontSize: '0.75rem' }}
          >
            Contact
          </h4>
          <div className="row g-3">
            {contact.email && (
              <Field label="Email">
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </Field>
            )}
            {contact.phone1 && (
              <Field label="Phone 1">
                <div>{contact.phone1}</div>
              </Field>
            )}
            {contact.phone2 && (
              <Field label="Phone 2">
                <div>{contact.phone2}</div>
              </Field>
            )}
            {contact.hours && (
              <Field label="Business hours" full>
                <div style={{ whiteSpace: 'pre-wrap' }}>{contact.hours}</div>
              </Field>
            )}
            {addressLine && (
              <Field label="Address" full>
                <div>{addressLine}</div>
              </Field>
            )}
          </div>
        </div>
      )}

      {/* Social */}
      {socialEntries.length > 0 && (
        <div className="border-top pt-3">
          <h4
            className="text-secondary text-uppercase fw-bold mb-2"
            style={{ fontSize: '0.75rem' }}
          >
            Social media
          </h4>
          <div className="d-flex flex-wrap gap-3">
            {socialEntries.map(([key, url]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="d-flex align-items-center gap-1 text-decoration-none"
                title={socialLabel(key)}
              >
                <SocialIcon platform={key} size={18} />
                <span>{socialLabel(key)}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AppDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const appId = Number(id);
  const { app, isLoading, error, refetch, update, remove } = useApp(appId);
  const { divisions } = useDivisions(appId);
  const { users } = useUsers(appId);

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const openEdit = () => setEditOpen(true);

  const handleEditSave = async (payload) => {
    try {
      await update(payload);
      setEditOpen(false);
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    }
  };

  const handleDelete = async () => {
    try {
      await remove();
      navigate('/apps');
    } catch (err) {
      showNotification(err.message, 'error');
      setConfirmDelete(false);
    }
  };

  const canDelete = !isLoading && divisions.length === 0 && users.length === 0;

  return (
    <AppLayout navItems={NAV_ITEMS} appName="Keeper">
      <div className="page-header d-print-none mb-3">
        <div className="row align-items-center">
          <div className="col-auto">
            <Button
              variant="ghost-secondary"
              size="sm"
              icon
              onClick={() => navigate('/apps')}
              title="Back to apps"
            >
              <IconArrowLeft size={18} />
            </Button>
          </div>
          <div className="col">
            <h2 className="page-title">{app ? app.name : 'App Details'}</h2>
          </div>
        </div>
      </div>

      {/* App Info */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>App Info</CardTitle>
          {app && (
            <div className="card-options gap-2">
              <Button size="sm" variant="ghost-primary" icon onClick={openEdit} title="Edit app">
                <IconEdit size={16} />
              </Button>
              {canDelete && (
                <Button
                  size="sm"
                  variant="ghost-danger"
                  icon
                  onClick={() => setConfirmDelete(true)}
                  title="Delete app"
                >
                  <IconTrash size={16} />
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <Spinner centered />
          ) : error ? (
            <div className="text-center">
              <p className="text-danger mb-3">{error}</p>
              <Button variant="outline-danger" onClick={refetch}>
                Retry
              </Button>
            </div>
          ) : !app ? (
            <p className="text-secondary mb-0">App not found.</p>
          ) : (
            <AppOverview app={app} />
          )}
        </CardBody>
      </Card>

      {/* Only render sections when app is loaded */}
      {!isLoading && app && (
        <>
          <DivisionsSection appId={appId} />
          <UsersSection appId={appId} />
          <GuestKeysSection appId={appId} />
        </>
      )}

      {/* Edit App Modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit App"
        size="lg"
        scrollable
      >
        {app && (
          <AppForm
            mode="edit"
            initial={app}
            onSubmit={handleEditSave}
            onCancel={() => setEditOpen(false)}
          />
        )}
      </Modal>

      {/* Delete App Confirmation */}
      <ConfirmDialog
        isOpen={confirmDelete}
        message={`Delete app "${app?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </AppLayout>
  );
}
