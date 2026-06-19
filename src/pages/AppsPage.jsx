import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppLayout,
  Button,
  Card,
  CardBody,
  Badge,
  Spinner,
  Input,
  Select,
  Modal,
  IconPlus,
  IconEye,
  useNotification,
} from '@aviary-ui/ui';
import { storage } from '@aviary-ui/core';
import { useApps } from '@/hooks/useApps';
import AppForm from '@/components/AppForm';
import { NAV_ITEMS } from '@/config/nav';

const ROLE_SYSADMIN = 1;

const PAGE_SIZE = 10;

const STATUS_LABEL = { 0: 'Inactive', 1: 'Active' };
const STATUS_COLOR = { 0: 'danger', 1: 'success' };

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-GB') : '—';
}

export default function AppsPage() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { apps, isLoading, error, refetch, create } = useApps();

  const isSysAdmin = storage.getUser()?.role === ROLE_SYSADMIN;

  const [filters, setFilters] = useState({ name: '', status: '' });
  const [page, setPage] = useState(1);
  const [isModalOpen, setModalOpen] = useState(false);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const filtered = apps.filter((a) => {
    const nameMatch = !filters.name || a.name.toLowerCase().includes(filters.name.toLowerCase());
    const statusMatch = filters.status === '' || String(a.status) === filters.status;
    return nameMatch && statusMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const handleCreate = async (payload) => {
    try {
      await create(payload);
      closeModal();
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    }
  };

  return (
    <AppLayout navItems={NAV_ITEMS} appName="Keeper">
      <div className="page-header d-print-none mb-3">
        <div className="row align-items-center">
          <div className="col">
            <h2 className="page-title">Apps</h2>
          </div>
          {isSysAdmin && (
            <div className="col-auto ms-auto">
              <Button onClick={openAdd} className="d-flex align-items-center gap-2">
                <IconPlus size={16} />
                New App
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters — only system admins manage more than one app */}
      {isSysAdmin && (
        <Card className="mb-3">
          <CardBody>
            <div className="row g-3 align-items-end">
              <div className="col-md-4 col-sm-6">
                <label className="form-label">Name</label>
                <Input
                  type="text"
                  name="name"
                  placeholder="Search by name…"
                  value={filters.name}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-3 col-sm-6">
                <label className="form-label">Status</label>
                <Select name="status" value={filters.status} onChange={handleFilterChange}>
                  <option value="">All statuses</option>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </Select>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Table */}
      <Card>
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
            <div className="p-5 text-center text-secondary">
              <p className="mb-3">
                {apps.length === 0 ? 'No apps yet.' : 'No apps match filters.'}
              </p>
              {apps.length === 0 && isSysAdmin && <Button onClick={openAdd}>Add first app</Button>}
            </div>
          ) : (
            <>
              <table className="table table-vcenter table-hover card-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Updated</th>
                    <th className="w-1" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((app) => (
                    <tr
                      key={app.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/apps/${app.id}`)}
                    >
                      <td className="text-secondary">{app.id}</td>
                      <td className="fw-medium">{app.name}</td>
                      <td>
                        <Badge color={STATUS_COLOR[app.status] ?? 'secondary'}>
                          {STATUS_LABEL[app.status] ?? app.status}
                        </Badge>
                      </td>
                      <td className="text-secondary">{formatDate(app.created_at)}</td>
                      <td className="text-secondary">{formatDate(app.updated_at)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost-primary"
                          size="sm"
                          icon
                          onClick={() => navigate(`/apps/${app.id}`)}
                          title="View details"
                        >
                          <IconEye size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="card-footer d-flex align-items-center justify-content-between">
                  <span className="text-secondary small">
                    {filtered.length} app{filtered.length !== 1 ? 's' : ''}
                  </span>
                  <ul className="pagination m-0">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage((p) => p - 1)}>
                        prev
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setPage(p)}>
                          {p}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage((p) => p + 1)}>
                        next
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Add App Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="New App" size="lg" scrollable>
        <AppForm mode="create" initial={null} onSubmit={handleCreate} onCancel={closeModal} />
      </Modal>
    </AppLayout>
  );
}
