import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  modFetchReports,
  modResolveReport,
  modFetchRequests,
  modResolveRequest,
  modLookupUser,
  modBanUser,
  modFetchCommunities,
  modDeleteContent,
  modUpdateCommunity,
} from '../features/moderator/moderatorSlice';
import { Link } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';
import { communityAvatar } from '../lib/avatars';
import { uploadMedia } from '../lib/media';
import {
  ShieldIcon,
  FlagIcon,
  InboxIcon,
  UsersIcon,
  SearchIcon,
  TrashIcon,
  CalendarIcon,
} from '../components/icons';

const TABS = [
  { id: 'reports', label: 'Reports', icon: <FlagIcon /> },
  { id: 'requests', label: 'Requests', icon: <InboxIcon /> },
  { id: 'users', label: 'Users', icon: <UsersIcon /> },
  { id: 'communities', label: 'Communities', icon: <CalendarIcon /> },
];

/* ----------------------------- Reports tab ----------------------------- */
function ReportsTab() {
  const dispatch = useDispatch();
  const reports = useSelector((s) => s.moderator.reports);
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    dispatch(modFetchReports(status));
  }, [dispatch, status]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Reported content</h2>
        <select
          className="select select-bordered select-sm rounded-full"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All</option>
        </select>
      </div>

      {reports.length === 0 ? (
        <EmptyState text="No reports here. The community is behaving! 🎉" />
      ) : (
        <div className="grid gap-3">
          {reports.map((r) => (
            <div key={r._id} className="card bg-base-100 border border-base-200 shadow-sm">
              <div className="card-body p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge badge-error badge-sm uppercase">{r.contentType}</span>
                  {r.communityId && <span className="badge badge-ghost badge-sm">{r.communityId}</span>}
                  <span className="badge badge-outline badge-sm">{r.status}</span>
                  <span className="text-xs text-base-content/40 ml-auto">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className="text-sm mt-1">
                  Author: <span className="font-medium">{r.contentAuthorUsername}</span> · Reported by{' '}
                  <span className="font-medium">{r.reporterUsername}</span>
                </p>
                {r.reason && (
                  <p className="text-sm italic text-base-content/70">“{r.reason}”</p>
                )}
                <p className="text-xs font-mono text-base-content/40 break-all">id: {r.contentId}</p>

                {r.status === 'pending' && (
                  <div className="card-actions justify-end mt-1">
                    <button
                      className="btn btn-ghost btn-sm rounded-full"
                      onClick={() => dispatch(modResolveReport({ id: r._id, action: 'dismiss' }))}
                    >
                      Dismiss
                    </button>
                    <button
                      className="btn btn-error btn-sm rounded-full gap-1"
                      onClick={() => dispatch(modResolveReport({ id: r._id, action: 'delete' }))}
                    >
                      <TrashIcon /> Delete content
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Requests tab ---------------------------- */
function RequestsTab() {
  const dispatch = useDispatch();
  const requests = useSelector((s) => s.moderator.requests);
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    dispatch(modFetchRequests(status));
  }, [dispatch, status]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">User requests</h2>
        <select
          className="select select-bordered select-sm rounded-full"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All</option>
        </select>
      </div>

      {requests.length === 0 ? (
        <EmptyState text="No requests right now." />
      ) : (
        <div className="grid gap-3">
          {requests.map((r) => (
            <div key={r._id} className="card bg-base-100 border border-base-200 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.senderUsername}</span>
                  {r.communityId && <span className="badge badge-ghost badge-sm">{r.communityId}</span>}
                  <span className="badge badge-outline badge-sm">{r.status}</span>
                  <span className="text-xs text-base-content/40 ml-auto">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm mt-1">{r.message}</p>

                {r.status === 'pending' && (
                  <div className="card-actions justify-end mt-1">
                    <button
                      className="btn btn-ghost btn-sm rounded-full"
                      onClick={() => dispatch(modResolveRequest({ id: r._id, action: 'dismissed' }))}
                    >
                      Dismiss
                    </button>
                    <button
                      className="btn btn-primary btn-sm rounded-full"
                      onClick={() => dispatch(modResolveRequest({ id: r._id, action: 'reviewed' }))}
                    >
                      Mark reviewed
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Users tab ------------------------------ */
function UsersTab() {
  const dispatch = useDispatch();
  const lookup = useSelector((s) => s.moderator.userLookup);
  const [identifier, setIdentifier] = useState('');
  const [expanded, setExpanded] = useState(false);

  const search = (e) => {
    e.preventDefault();
    if (identifier.trim()) {
      dispatch(modLookupUser(identifier.trim()));
      setExpanded(false);
    }
  };

  const u = lookup?.user;

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Look up a user</h2>
      <form onSubmit={search} className="flex gap-2 mb-4">
        <input
          className="input input-bordered rounded-full flex-1"
          placeholder="User id or username…"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <button className="btn btn-primary rounded-full gap-1">
          <SearchIcon /> Search
        </button>
      </form>

      {u && (
        <div className="card bg-base-100 border border-base-200 shadow-sm mb-4">
          <button
            type="button"
            className="card-body p-4 text-left w-full"
            onClick={() => setExpanded((e) => !e)}
          >
            <div className="flex items-center gap-3">
              <UserAvatar user={u} className="w-12 rounded-2xl" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold">{u.username}</h3>
                  {u.moderator && <span className="badge badge-secondary badge-sm">Mod</span>}
                  {u.isBanned && <span className="badge badge-error badge-sm">Banned</span>}
                </div>
                <p className="text-sm text-base-content/60">{u.email}</p>
                <p className="text-xs font-mono text-base-content/40 break-all">id: {u.id}</p>
              </div>
              <button
                type="button"
                className={`btn btn-sm rounded-full shrink-0 ${u.isBanned ? 'btn-success' : 'btn-error'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(modBanUser({ id: u.id, banned: !u.isBanned }));
                }}
              >
                {u.isBanned ? 'Unban' : 'Ban'}
              </button>
            </div>
            <p className="text-xs text-base-content/40 mt-2">
              {expanded ? '▲ Hide content' : '▼ Show posts, comments & chat messages'}
            </p>
          </button>
        </div>
      )}

      {u && expanded && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ContentList
            title={`Posts (${lookup.posts?.total ?? 0})`}
            items={lookup.posts?.items || []}
            render={(p) => p.title || p.content}
            kind="posts"
          />
          <ContentList
            title={`Comments (${lookup.comments?.total ?? 0})`}
            items={lookup.comments?.items || []}
            render={(c) => c.content}
            kind="comments"
          />
          <ContentList
            title={`Chat (${lookup.messages?.total ?? 0})`}
            items={lookup.messages?.items || []}
            render={(m) => m.content || (m.media?.url ? '[media]' : '(empty)')}
            kind="messages"
            className="lg:col-span-2"
          />
        </div>
      )}
    </div>
  );
}

function ContentList({ title, items, render, kind, className = '' }) {
  const dispatch = useDispatch();
  return (
    <div className={`card bg-base-100 border border-base-200 shadow-sm ${className}`}>
      <div className="card-body p-4">
        <h3 className="font-semibold mb-2">{title}</h3>
        {items.length === 0 ? (
          <p className="text-sm text-base-content/40">Nothing here.</p>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {items.map((it) => (
              <li
                key={it._id}
                className="flex items-start gap-2 bg-base-200/50 rounded-2xl p-2 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="line-clamp-2">{render(it)}</p>
                  <p className="text-[10px] font-mono text-base-content/40 break-all">{it._id}</p>
                </div>
                <button
                  className="btn btn-ghost btn-xs text-error"
                  title="Delete"
                  onClick={() => dispatch(modDeleteContent({ kind, id: it._id }))}
                >
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* --------------------------- Communities tab --------------------------- */
function CommunitiesTab() {
  const dispatch = useDispatch();
  const communities = useSelector((s) => s.moderator.communities);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', imageUrl: '' });
  const [iconFile, setIconFile] = useState(null);

  useEffect(() => {
    dispatch(modFetchCommunities(''));
  }, [dispatch]);

  const doSearch = (e) => {
    e.preventDefault();
    dispatch(modFetchCommunities(search.trim()));
  };

  const openEdit = (c) => {
    setEditId(c._id);
    setEditForm({ name: c.name, imageUrl: c.imageUrl || '' });
    setIconFile(null);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    let imageUrl = editForm.imageUrl;
    if (iconFile) {
      const up = await uploadMedia(iconFile);
      imageUrl = up.url;
    }
    await dispatch(modUpdateCommunity({ communityId: editId, payload: { name: editForm.name, imageUrl } }));
    setEditId(null);
    dispatch(modFetchCommunities(search.trim()));
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">All communities</h2>
      <form onSubmit={doSearch} className="flex gap-2 mb-4">
        <input
          className="input input-bordered rounded-full flex-1"
          placeholder="Search by id or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary rounded-full gap-1">
          <SearchIcon /> Search
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {communities.map((c) => (
          <div key={c._id} className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <div className="avatar">
                  <div className="w-12 rounded-xl">
                    <img src={communityAvatar(c)} alt="" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/c/${encodeURIComponent(c._id)}/chat`}
                    className="font-bold hover:text-primary link link-hover"
                  >
                    {c.name}
                  </Link>
                  <p className="text-xs font-mono text-base-content/40">{c._id}</p>
                </div>
                <span className={`badge badge-sm ${c.type === 'course' ? 'badge-secondary' : 'badge-primary'}`}>
                  {c.type}
                </span>
              </div>
              <div className="card-actions justify-end mt-2">
                <button type="button" className="btn btn-ghost btn-xs rounded-full" onClick={() => openEdit(c)}>
                  Edit
                </button>
                <Link to={`/c/${encodeURIComponent(c._id)}/posts`} className="btn btn-primary btn-xs rounded-full">
                  Open
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editId && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl">
            <h3 className="font-bold">Edit community</h3>
            <form onSubmit={saveEdit} className="flex flex-col gap-3 mt-3">
              <input
                className="input input-bordered rounded-2xl"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
              <input
                type="file"
                accept="image/*"
                className="file-input file-input-bordered rounded-2xl w-full"
                onChange={(e) => setIconFile(e.target.files?.[0] || null)}
              />
              <div className="modal-action">
                <button type="button" className="btn btn-ghost rounded-2xl" onClick={() => setEditId(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary rounded-2xl">
                  Save
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/40" onClick={() => setEditId(null)} />
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="card bg-base-100 border border-dashed border-base-300 rounded-3xl">
      <div className="card-body items-center text-center text-base-content/50 py-10">
        <p>{text}</p>
      </div>
    </div>
  );
}

/* ------------------------------- Page ---------------------------------- */
export default function ModeratorPage() {
  const [tab, setTab] = useState('reports');

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl text-secondary">
          <ShieldIcon />
        </span>
        <h1 className="text-3xl font-extrabold">Moderator</h1>
        <span className="badge badge-secondary">full control</span>
      </div>

      <div role="tablist" className="tabs tabs-box bg-base-100 rounded-2xl mb-5 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            className={`tab gap-2 ${tab === t.id ? 'tab-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'reports' && <ReportsTab />}
      {tab === 'requests' && <RequestsTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'communities' && <CommunitiesTab />}
    </div>
  );
}
