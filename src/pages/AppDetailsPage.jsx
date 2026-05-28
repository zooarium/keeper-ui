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
  IconPlus,
  IconEdit,
  IconTrash,
  IconArrowLeft,
  useNotification,
} from '@aviary-ui/ui';
import { useApp, APPS_KEY } from '@/hooks/useApps';
import { useDivisions } from '@/hooks/useDivisions';
import { useUsers } from '@/hooks/useUsers';
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

// ─── Division Modal ───────────────────────────────────────────────────────────

const EMPTY_DIV = { name: '', status: 1 };

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

  const change = (e) => {
    const { id, value } = e.target;
    setForm((p) => ({ ...p, [id]: id === 'status' ? Number(value) : value }));
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
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
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
        {isEdit && (
          <FormField label="Status" htmlFor="status">
            <Select id="status" value={form.status} onChange={change}>
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </Select>
          </FormField>
        )}
        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}</Button>
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
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
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
          <Select id="division_id" value={form.division_id} onChange={change} error={errors.division_id}>
            <option value="">Select division</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
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
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Divisions Section ────────────────────────────────────────────────────────

function DivisionsSection({ appId }) {
  const { showNotification } = useNotification();
  const { divisions, isLoading, error, refetch, create, update, remove } = useDivisions(appId);

  const [nameFilter, setNameFilter] = useState('');
  const [visible, setVisible] = useState(SECTION_PAGE_SIZE);
  const [modalState, setModalState] = useState({ isOpen: false, isEdit: false, item: null });
  const [confirmState, setConfirmState] = useState({ isOpen: false, message: '', onConfirm: () => {} });

  const filtered = divisions.filter(
    (d) => !nameFilter || d.name.toLowerCase().includes(nameFilter.toLowerCase())
  );
  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  const openAdd = () => setModalState({ isOpen: true, isEdit: false, item: null });
  const openEdit = (item) => setModalState({ isOpen: true, isEdit: true, item });
  const closeModal = () => setModalState({ isOpen: false, isEdit: false, item: null });

  const handleSave = async (form) => {
    try {
      if (modalState.isEdit) {
        await update(modalState.item.id, { name: form.name, status: form.status });
      } else {
        await create({ app_id: appId, name: form.name });
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
              onChange={(e) => { setNameFilter(e.target.value); setVisible(SECTION_PAGE_SIZE); }}
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
              <Button variant="outline-danger" onClick={refetch}>Retry</Button>
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
                  <Button variant="outline-secondary" size="sm" onClick={() => setVisible((v) => v + SECTION_PAGE_SIZE)}>
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
        initial={modalState.item ? { name: modalState.item.name, status: modalState.item.status } : null}
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
  const [confirmState, setConfirmState] = useState({ isOpen: false, message: '', onConfirm: () => {} });

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
              onChange={(e) => { setNameFilter(e.target.value); setVisible(SECTION_PAGE_SIZE); }}
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
              <Button variant="outline-danger" onClick={refetch}>Retry</Button>
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
                      <td className="fw-medium">{u.firstname} {u.lastname}</td>
                      <td className="text-secondary">{u.email}</td>
                      <td className="text-secondary">{u.division_name || '—'}</td>
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
                  <Button variant="outline-secondary" size="sm" onClick={() => setVisible((v) => v + SECTION_PAGE_SIZE)}>
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
    </>
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
  const [editForm, setEditForm] = useState({ name: '', status: 1 });
  const [editErrors, setEditErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editNameRef = useRef(null);

  useEffect(() => {
    if (editOpen) editNameRef.current?.focus();
  }, [editOpen]);

  const openEdit = () => {
    setEditForm({ name: app.name, status: app.status });
    setEditErrors({});
    setEditOpen(true);
  };

  const handleEditChange = (e) => {
    const { id: fid, value } = e.target;
    setEditForm((p) => ({ ...p, [fid]: fid === 'status' ? Number(value) : value }));
    if (editErrors[fid]) setEditErrors((p) => ({ ...p, [fid]: null }));
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) { setEditErrors({ name: 'Name is required.' }); return; }
    setSaving(true);
    try {
      await update({ name: editForm.name.trim(), status: editForm.status });
      setEditOpen(false);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSaving(false);
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
            <Button variant="ghost-secondary" size="sm" icon onClick={() => navigate('/apps')} title="Back to apps">
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
                <Button size="sm" variant="ghost-danger" icon onClick={() => setConfirmDelete(true)} title="Delete app">
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
              <Button variant="outline-danger" onClick={refetch}>Retry</Button>
            </div>
          ) : !app ? (
            <p className="text-secondary mb-0">App not found.</p>
          ) : (
            <div className="row g-3">
              <div className="col-sm-6 col-md-4">
                <div className="text-secondary small mb-1">ID</div>
                <div className="fw-medium">{app.id}</div>
              </div>
              <div className="col-sm-6 col-md-4">
                <div className="text-secondary small mb-1">Name</div>
                <div className="fw-medium">{app.name}</div>
              </div>
              <div className="col-sm-6 col-md-4">
                <div className="text-secondary small mb-1">Status</div>
                <Badge color={STATUS_COLOR[app.status] ?? 'secondary'}>
                  {STATUS_LABEL[app.status] ?? app.status}
                </Badge>
              </div>
              <div className="col-sm-6 col-md-4">
                <div className="text-secondary small mb-1">Created</div>
                <div>{formatDate(app.created_at)}</div>
              </div>
              <div className="col-sm-6 col-md-4">
                <div className="text-secondary small mb-1">Updated</div>
                <div>{formatDate(app.updated_at)}</div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Only render sections when app is loaded */}
      {!isLoading && app && (
        <>
          <DivisionsSection appId={appId} />
          <UsersSection appId={appId} />
        </>
      )}

      {/* Edit App Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit App">
        <form onSubmit={handleEditSave} noValidate>
          <FormField label="Name" htmlFor="name" error={editErrors.name}>
            <Input
              id="name"
              type="text"
              ref={editNameRef}
              error={editErrors.name}
              value={editForm.name}
              onChange={handleEditChange}
            />
          </FormField>
          <FormField label="Status" htmlFor="status">
            <Select id="status" value={editForm.status} onChange={handleEditChange}>
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </Select>
          </FormField>
          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{saving ? 'Saving…' : 'Update'}</Button>
          </div>
        </form>
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
