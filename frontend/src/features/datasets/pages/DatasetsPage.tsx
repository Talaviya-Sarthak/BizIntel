import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Upload } from 'lucide-react';
import { Logo } from '../../../components/ui/Logo';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import { DatasetList } from '../components/DatasetList';
import { DatasetDetail } from '../components/DatasetDetail';
import { DatasetUpload } from '../components/DatasetUpload';
import type { Dataset } from '../types';
import {
  MenuIcon,
  CloseIcon,
  DatabaseZapIcon,
} from '../../landing/components/icons';

const NAV_ITEMS = [
  { label: 'Overview', path: '/dashboard' },
  { label: 'DataMart', path: '/datasets', active: true },
];

export function DatasetsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const initials = (user?.name ?? 'U')
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/signin', { replace: true });
    } catch {
      // ignore
    } finally {
      setSigningOut(false);
    }
  }

  function handleUploadSuccess() {
    setShowUpload(false);
    setPage(1);
  }

  function handleDeleteSuccess() {
    setSelectedDataset(null);
  }

  return (
    <div className="flex min-h-screen bg-surface-deep">
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-surface-elevated/60 backdrop-blur transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Logo />
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-4" aria-label="Workspace">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                item.active
                  ? 'bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              )}
            >
              {item.label === 'DataMart' && <DatabaseZapIcon className="h-4 w-4" />}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 p-4">
          <p className="text-xs text-slate-500">Enterprise Intelligence · v0.1</p>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-surface-deep/80 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-300 hover:bg-white/5 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-semibold text-white">
              {selectedDataset ? 'Dataset Detail' : 'DataMart'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-semibold text-cyan-300 ring-1 ring-cyan-400/30">
                {initials}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} loading={signingOut}>
              Sign out
            </Button>
          </div>
        </header>

        <main className="flex-1 px-5 py-10 sm:px-8">
          <div className="mx-auto max-w-6xl">
            {selectedDataset ? (
              <DatasetDetail
                dataset={selectedDataset}
                onBack={() => setSelectedDataset(null)}
                onDeleted={handleDeleteSuccess}
              />
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="section-label">DataMart</span>
                    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      Datasets
                    </h2>
                    <p className="text-sm text-slate-400">
                      Upload, manage, and preview your CSV datasets.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setShowUpload(true)}>
                    <Upload className="mr-1.5 h-4 w-4" />
                    Upload
                  </Button>
                </div>

                {showUpload && (
                  <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white">Upload CSV Dataset</h3>
                      <button
                        type="button"
                        onClick={() => setShowUpload(false)}
                        className="rounded-md p-1 text-slate-400 hover:text-white transition-colors"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <DatasetUpload
                      onSuccess={handleUploadSuccess}
                      onCancel={() => setShowUpload(false)}
                    />
                  </div>
                )}

                <div className="mt-6">
                  <DatasetList
                    page={page}
                    limit={10}
                    onPageChange={setPage}
                    onView={setSelectedDataset}
                  />
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
