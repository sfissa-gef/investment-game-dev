import { useEffect, useState } from 'react';
import { getConfig, setConfig } from '../lib/db.js';
import { syncPendingSessions, testConnection } from '../lib/sync.js';

export default function SyncTab() {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [log, setLog] = useState([]);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    (async () => {
      setUrl(await getConfig('sync_url', ''));
      setToken(await getConfig('sync_token', ''));
    })();
  }, []);

  const save = async () => {
    await setConfig('sync_url', url);
    await setConfig('sync_token', token);
    setLog((l) => [`Saved sync settings at ${new Date().toLocaleTimeString()}`, ...l]);
  };

  const test = async () => {
    setTesting(true);
    const r = await testConnection();
    setConnection(r);
    setTesting(false);
  };

  const run = async () => {
    setSyncing(true);
    setLog((l) => ['Starting sync…', ...l]);
    try {
      const results = await syncPendingSessions({
        onProgress: (p) => setLog((l) => [
          `${p.status}${p.error ? ` – ${p.error}` : ''}  (${p.sessionId.slice(0, 8)}…)`,
          ...l,
        ]),
      });
      const ok = results.filter((r) => r.ok).length;
      setLog((l) => [`Done: ${ok}/${results.length} synced`, ...l]);
    } catch (err) {
      setLog((l) => [`Error: ${err.message}`, ...l]);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-body">
          <span className="text-badge uppercase tracking-wide text-ink/60">Server URL</span>
          <input value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://sync.example.org"
            className="min-h-touch rounded-lg border border-ink/15 bg-white px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-body">
          <span className="text-badge uppercase tracking-wide text-ink/60">Bearer token</span>
          <input value={token} onChange={(e) => setToken(e.target.value)}
            className="min-h-touch rounded-lg border border-ink/15 bg-white px-3 py-2" />
        </label>
      </div>
      <div className="flex gap-3">
        <button className="btn-secondary" onClick={save}>Save</button>
        <button className="btn-outline" onClick={test} disabled={testing || !url}>
          {testing ? 'Testing…' : 'Test connection'}
        </button>
        <button className="btn-primary" onClick={run} disabled={syncing || !url}>
          {syncing ? 'Syncing…' : 'Sync now'}
        </button>
      </div>
      {connection && (
        <p className={connection.ok ? 'chip chip-ok w-fit' : 'chip chip-warn w-fit'}>
          {connection.ok ? `Connected (${connection.status})` : `Failed: ${connection.error || connection.status}`}
        </p>
      )}
      {log.length > 0 && (
        <div className="card max-h-[220px] overflow-auto p-4 text-body">
          {log.map((line, i) => (
            <div key={i} className="border-b border-ink/5 py-1 text-ink/80">{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
