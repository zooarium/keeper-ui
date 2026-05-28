import React from 'react';
import { AppLayout, Card, CardBody } from '@aviary-ui/ui';
import { NAV_ITEMS } from '@/config/nav';
import { config } from '@/infra/config';

export default function DashboardPage() {
  return (
    <AppLayout navItems={NAV_ITEMS} appName={config.appName}>
      <div className="page-header d-print-none mb-3">
        <div className="row align-items-center">
          <div className="col">
            <h2 className="page-title">Dashboard</h2>
          </div>
        </div>
      </div>

      <Card>
        <CardBody>
          <p className="text-secondary mb-0">Replace this placeholder with your page content.</p>
        </CardBody>
      </Card>
    </AppLayout>
  );
}
