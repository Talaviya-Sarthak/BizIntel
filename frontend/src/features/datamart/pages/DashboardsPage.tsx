import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button, Spinner } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { toApiError } from '../../../lib/api';
import { formatDate } from '../../../utils/format';
import { PlusIcon, GridIcon, TrashIcon, EyeIcon } from '../../../components/ui/icons';
import { useCreateDashboard, useDashboards, useDeleteDashboard } from '../hooks/useDashboards';

const LAYOUT_OPTIONS = [
  { value: '1', label: 'Single column' },
  { value: '2', label: 'Two columns' },
  { value: '3', label: 'Three columns' },
];

export function DashboardsPage() {
  const navigate = useNavigate();
  const dashboardsQuery = useDashboards();
  const createMutation = useCreateDashboard();
  const deleteMutation = useDeleteDashboard();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [layout, setLayout] = useState<'1' | '2' | '3'>('2');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleCreate() {
    try {
      const dashboard = await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        layout,
      });
      setCreateOpen(false);
      setName('');
      setDescription('');
      navigate(`/datamart/dashboards/${dashboard.id}`);
    } catch {
      // surfaced via createMutation.errorMessage
    }
  }

  async function handleDelete(id: string) {
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      setDeleteError(toApiError(error).message);
    }
  }

  if (dashboardsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-white/[0.06] bg-[#181818] py-20">
        <Spinner size="md" />
      </div>
    );
  }

  if (dashboardsQuery.isError) {
    return (
      <ErrorState message={toApiError(dashboardsQuery.error).message} onRetry={() => dashboardsQuery.refetch()} />
    );
  }

  const dashboards = dashboardsQuery.data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Live Dashboards"
        description="Arrange analyses and metrics into live, at-a-glance dashboards. Widgets pull fresh results whenever you open one."
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)} className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs border border-white/20">
            <PlusIcon className="h-3.5 w-3.5" />
            New dashboard
          </Button>
        }
      />

      {dashboards.length === 0 ? (
        <EmptyState
          icon={GridIcon}
          title="No dashboards created yet"
          description="Create a dashboard to arrange your saved analyses and metrics as interactive widgets."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((dashboard) => (
            <article
              key={dashboard.id}
              className="group flex cursor-pointer flex-col gap-2 rounded-xl border border-white/[0.06] bg-[#181818] p-4 shadow-sm transition hover:border-white/20"
              onClick={() => navigate(`/datamart/dashboards/${dashboard.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs">
                  <GridIcon className="h-4 w-4" />
                </span>
                <button
                  type="button"
                  aria-label={`Delete ${dashboard.name}`}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-400/10 hover:text-red-400 opacity-0 group-hover:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleDelete(dashboard.id);
                  }}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
              <h3 className="mt-1 truncate text-xs font-semibold text-zinc-100">{dashboard.name}</h3>
              {dashboard.description ? (
                <p className="line-clamp-2 text-[11px] text-zinc-400">{dashboard.description}</p>
              ) : null}
              <div className="mt-auto flex items-center justify-between text-[10.5px] text-zinc-500 pt-2">
                <span>{dashboard.layout}-column layout</span>
                <span>{formatDate(dashboard.createdAt)}</span>
              </div>
              <Button variant="ghost" size="sm" className="mt-2 w-full text-zinc-300 hover:text-white hover:bg-white/[0.05]">
                <EyeIcon className="h-3.5 w-3.5" />
                Open
              </Button>
            </article>
          ))}
        </div>
      )}

      {createMutation.error ? (
        <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-xs text-red-300">
          {toApiError(createMutation.error).message}
        </p>
      ) : null}

      {deleteError ? (
        <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-xs text-red-300">
          {deleteError}
        </p>
      ) : null}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New dashboard"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={createMutation.isPending}
              disabled={!name.trim()}
              onClick={() => void handleCreate()}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            id="dashboard-name"
            label="Name"
            placeholder="e.g. Executive overview"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            id="dashboard-description"
            label="Description (optional)"
            placeholder="What does this dashboard show?"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <Select
            label="Layout"
            value={layout}
            onChange={(event) => setLayout(event.target.value as '1' | '2' | '3')}
            options={LAYOUT_OPTIONS}
          />
        </div>
      </Modal>
    </div>
  );
}