// CollectionsAdmin.tsx
import React, { useEffect, useState } from 'react';

interface Collection {
  id?: string;
  name: string;
  season?: string;
  series?: string;
  description?: string;
  imageUrl?: string;
}

export function CollectionsAdmin() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [editing, setEditing] = useState<Collection | null>(null);

  useEffect(() => {
    fetch('/api/collections')
      .then((res) => res.json())
      .then(setCollections);
  }, []);

  const emptyCollection: Collection = {
    name: '',
    season: '',
    series: '',
    description: '',
    imageUrl: '',
  };

  const current = editing ?? emptyCollection;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const method = editing?.id ? 'PUT' : 'POST';
    const url = editing?.id
      ? `/api/admin/collections/${editing.id}`
      : '/api/admin/collections';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(current),
    });

    if (!res.ok) return;

    const updated = await res.json();
    setCollections(updated);
    setEditing(null);
  }

  function handleChange<K extends keyof Collection>(key: K, value: Collection[K]) {
    setEditing((prev) => ({ ...(prev ?? emptyCollection), [key]: value }));
  }

  return (
    <div className="row">
      <div className="col-md-5 mb-3">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              className="form-control"
              value={current.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Season</label>
            <input
              className="form-control"
              value={current.season ?? ''}
              onChange={(e) => handleChange('season', e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Series</label>
            <input
              className="form-control"
              value={current.series ?? ''}
              onChange={(e) => handleChange('series', e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Image URL</label>
            <input
              className="form-control"
              value={current.imageUrl ?? ''}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={3}
              value={current.description ?? ''}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary me-2">
            {editing?.id ? 'Update collection' : 'Create collection'}
          </button>
          {editing && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="col-md-7">
        <ul className="list-group">
          {collections.map((col) => (
            <li
              key={col.id}
              className="list-group-item d-flex justify-content-between align-items-start"
            >
              <div>
                <div className="fw-semibold">{col.name}</div>
                <div className="text-muted small">
                  {col.season || 'Unknown'} | {col.series || 'N/A'}
                </div>
              </div>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setEditing(col)}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}