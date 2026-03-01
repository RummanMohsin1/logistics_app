import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { shipmentAPI } from '../api/apiClient';
import { useBooking } from '../context/BookingContext';
import useDebounce from '../hooks/useDebounce';
import {
    FiSearch, FiChevronRight, FiChevronLeft, FiPackage, FiEye,
    FiEdit3, FiAlertCircle, FiTruck, FiLoader, FiLayers, FiTrash2,
} from 'react-icons/fi';

const STATUS_ORDER = ['', 'DRAFT', 'BOOKED', 'IN_TRANSIT', 'DELIVERED', 'CLOSED', 'EXCEPTION'];

const STATUS_META = {
    DRAFT: { color: '#6b7280', bg: '#f3f4f6', label: 'Draft' },
    BOOKED: { color: '#2563eb', bg: '#eff6ff', label: 'Booked' },
    IN_TRANSIT: { color: '#d97706', bg: '#fffbeb', label: 'In Transit' },
    DELIVERED: { color: '#16a34a', bg: '#f0fdf4', label: 'Delivered' },
    CLOSED: { color: '#374151', bg: '#f9fafb', label: 'Closed' },
    EXCEPTION: { color: '#dc2626', bg: '#fef2f2', label: 'Exception' },
};

function formatDate(raw) {
    if (!raw) return '—';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TrackingListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loadDraft } = useBooking();

    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [deleteModal, setDeleteModal] = useState(null); // { id, label }
    const [deleting, setDeleting] = useState(false);

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

    const debouncedSearch = useDebounce(search);

    const fetchShipments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { page, limit: 20 };
            if (debouncedSearch) params.search = debouncedSearch;
            if (statusFilter) params.status = statusFilter;

            const urlParams = new URLSearchParams();
            Object.entries(params).forEach(([k, v]) => { if (v) urlParams.set(k, v); });
            setSearchParams(urlParams, { replace: true });

            const res = await shipmentAPI.list(params);
            setShipments(res.data.data || []);
            setPagination(res.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load shipments');
        }
        setLoading(false);
    }, [debouncedSearch, statusFilter, page]);

    useEffect(() => { fetchShipments(); }, [fetchShipments]);

    const handleEditDraft = async (shipmentId) => {
        setEditingId(shipmentId);
        try {
            const res = await shipmentAPI.get(shipmentId);
            loadDraft(res.data.data);
            navigate('/booking');
        } catch {
            setError('Failed to load draft. Please try again.');
            setEditingId(null);
        }
    };

    const handleDeleteDraft = async () => {
        if (!deleteModal) return;
        setDeleting(true);
        try {
            await shipmentAPI.delete(deleteModal.id);
            setDeleteModal(null);
            fetchShipments();
        } catch {
            setDeleteModal(null);
        }
        setDeleting(false);
    };

    const draftCount = shipments.filter(s => s.status === 'DRAFT').length;

    return (
        <div>
            {/* ── Page Header ── */}
            <div className="page-header" style={{ alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Track Shipments</h1>
                    <p className="page-subtitle">Monitor your shipments through their lifecycle</p>
                </div>

                {!loading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.4rem 0.9rem',
                            background: 'var(--color-bg-secondary)',
                            border: '1.5px solid var(--color-border)',
                            borderRadius: 'var(--radius-full)',
                        }}>
                            <FiLayers size={13} style={{ color: 'var(--color-text-muted)' }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                {pagination.total}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                {pagination.total === 1 ? 'shipment' : 'shipments'}
                            </span>
                        </div>
                        {draftCount > 0 && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.4rem 0.8rem',
                                background: '#fefce8', border: '1.5px solid #fde68a',
                                borderRadius: 'var(--radius-full)',
                            }}>
                                <FiEdit3 size={12} style={{ color: '#ca8a04' }} />
                                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#92400e' }}>
                                    {draftCount} draft{draftCount !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Filters ── */}
            <div className="filters-bar">
                <div className="search-input-wrapper" style={{ minWidth: '280px', flex: 1 }}>
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by shipment number or shipper name..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        id="tracking-search"
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {STATUS_ORDER.map(s => {
                        const meta = s ? STATUS_META[s] : null;
                        const isActive = statusFilter === s;
                        return (
                            <button
                                key={s || 'ALL'}
                                onClick={() => { setStatusFilter(s); setPage(1); }}
                                id={`filter-status-${s || 'all'}`}
                                style={{
                                    padding: '0.35rem 0.85rem',
                                    borderRadius: 'var(--radius-full)',
                                    border: `1.5px solid ${isActive ? (meta ? meta.color : 'var(--color-text-primary)') : 'var(--color-border)'}`,
                                    background: isActive ? (meta ? meta.bg : 'var(--color-accent)') : 'var(--color-bg)',
                                    color: isActive ? (meta ? meta.color : 'var(--color-text-primary)') : 'var(--color-text-muted)',
                                    fontSize: '0.78rem', fontWeight: isActive ? 700 : 500,
                                    cursor: 'pointer', fontFamily: 'var(--font-family)',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                {s || 'All'}
                            </button>
                        );
                    })}
                </div>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            {loading ? (
                <div className="loader"><div className="spinner"></div></div>
            ) : shipments.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><FiPackage size={48} /></div>
                    <div className="empty-state-title">No shipments found</div>
                    <div className="empty-state-text">
                        {search || statusFilter
                            ? 'Try adjusting your search or filter criteria'
                            : 'Create your first shipment from the Book Shipment page'}
                    </div>
                </div>
            ) : (
                <>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Shipment #</th>
                                    <th>Shipper</th>
                                    <th>Carrier</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'center' }}>Legs</th>
                                    <th>Total Price</th>
                                    <th>Created</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {shipments.map(s => {
                                    const meta = STATUS_META[s.status] || STATUS_META.DRAFT;
                                    const isDraft = s.status === 'DRAFT';
                                    const createdRaw = s.createdAt || s.created_at;
                                    const livePrice = s.legs?.reduce((sum, l) => sum + parseFloat(l.price || 0), 0);
                                    const displayPrice = s.total_price
                                        ? parseFloat(s.total_price)
                                        : (s.legs?.length ? livePrice : null);

                                    return (
                                        <tr key={s.id}>
                                            {/* Shipment # */}
                                            <td style={{ maxWidth: 180, minWidth: 120 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                                    {isDraft && (
                                                        <span style={{
                                                            width: 7, height: 7, borderRadius: '50%',
                                                            background: '#f59e0b', flexShrink: 0, display: 'inline-block',
                                                        }} />
                                                    )}
                                                    <span
                                                        title={s.shipment_number || `DRAFT-${s.id}`}
                                                        style={{
                                                            fontWeight: 700, fontFamily: 'monospace',
                                                            fontSize: isDraft ? '0.8rem' : '0.78rem',
                                                            color: isDraft ? 'var(--color-text-primary)' : '#1d4ed8',
                                                            whiteSpace: 'nowrap', overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            maxWidth: isDraft ? 'none' : 140, display: 'block',
                                                        }}
                                                    >
                                                        {s.shipment_number || `DRAFT-${s.id}`}
                                                    </span>
                                                </div>
                                            </td>

                                            <td style={{ fontWeight: 500 }}>{s.shipper_name}</td>

                                            <td>
                                                {s.carrierGroup ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem' }}>
                                                        <FiTruck size={12} style={{ color: 'var(--color-text-muted)' }} />
                                                        {s.carrierGroup.name}
                                                    </span>
                                                ) : <span style={{ color: 'var(--color-text-light)' }}>—</span>}
                                            </td>

                                            <td>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                    padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)',
                                                    background: meta.bg, color: meta.color,
                                                    fontSize: '0.73rem', fontWeight: 700,
                                                    border: `1px solid ${meta.color}22`, letterSpacing: '0.3px',
                                                }}>
                                                    {s.status === 'EXCEPTION' && <FiAlertCircle size={10} />}
                                                    {s.status.replace('_', ' ')}
                                                </span>
                                            </td>

                                            <td style={{ textAlign: 'center' }}>
                                                {s.legs?.length > 0 ? (
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                                        padding: '0.15rem 0.5rem',
                                                        background: 'var(--color-bg-tertiary)',
                                                        borderRadius: 'var(--radius-full)',
                                                        fontSize: '0.78rem', fontWeight: 700,
                                                    }}>
                                                        {s.legs.length}
                                                    </span>
                                                ) : <span style={{ color: 'var(--color-text-light)' }}>—</span>}
                                            </td>

                                            <td>
                                                {displayPrice != null ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                                        <span style={{
                                                            fontWeight: 700, fontSize: '0.9rem',
                                                            color: s.total_price ? '#16a34a' : 'var(--color-text-primary)',
                                                        }}>
                                                            ${displayPrice.toLocaleString()}
                                                        </span>
                                                        {isDraft && s.legs?.length > 0 && (
                                                            <span style={{ fontSize: '0.68rem', color: 'var(--color-text-light)', lineHeight: 1 }}>
                                                                live estimate
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : <span style={{ color: 'var(--color-text-light)' }}>—</span>}
                                            </td>

                                            <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                                {formatDate(createdRaw)}
                                            </td>

                                            {/* Actions — unified icon-only group */}
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                                    {isDraft && (
                                                        <>
                                                            <ActionIconBtn
                                                                title="Edit draft"
                                                                id={`edit-draft-${s.id}`}
                                                                onClick={() => handleEditDraft(s.id)}
                                                                disabled={!!editingId}
                                                                hoverColor="#92400e" hoverBg="#fefce8" hoverBorder="#fde68a"
                                                            >
                                                                {editingId === s.id
                                                                    ? <FiLoader size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                                                    : <FiEdit3 size={12} />}
                                                            </ActionIconBtn>
                                                            <ActionIconBtn
                                                                title="Delete draft"
                                                                id={`delete-draft-${s.id}`}
                                                                onClick={() => setDeleteModal({ id: s.id, label: `DRAFT-${s.id}` })}
                                                                hoverColor="#dc2626" hoverBg="#fef2f2" hoverBorder="#fca5a5"
                                                            >
                                                                <FiTrash2 size={12} />
                                                            </ActionIconBtn>
                                                        </>
                                                    )}
                                                    <ActionIconBtn
                                                        title="View shipment"
                                                        id={`view-shipment-${s.id}`}
                                                        as="link"
                                                        to={`/tracking/${s.id}`}
                                                        hoverColor="#1d4ed8" hoverBg="#eff6ff" hoverBorder="#bfdbfe"
                                                    >
                                                        <FiEye size={12} />
                                                    </ActionIconBtn>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {shipments.some(s => s.status === 'DRAFT') && (
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                            marginTop: '0.75rem', padding: '0.75rem 1rem',
                            background: '#fffbeb', border: '1px solid #fde68a',
                            borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: '#92400e',
                        }}>
                            <FiAlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span>
                                <strong>Draft pricing is live</strong> — prices shown reflect current carrier rates
                                and will be snapshotted at submission. Drafts can be edited until submitted.
                            </span>
                        </div>
                    )}

                    {pagination.totalPages > 1 && (
                        <div className="pagination">
                            <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                <FiChevronLeft />
                            </button>
                            {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                                const p = i + 1;
                                return (
                                    <button key={p} className={`pagination-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>
                                        {p}
                                    </button>
                                );
                            })}
                            <span className="pagination-info">of {pagination.totalPages}</span>
                            <button className="pagination-btn" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                                <FiChevronRight />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ── Delete confirmation modal ── */}
            {deleteModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{
                        background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                        width: 400, padding: '2rem',
                    }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: '50%',
                            background: '#fef2f2', border: '1px solid #fca5a5',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '1.25rem',
                        }}>
                            <FiTrash2 size={20} color="#dc2626" />
                        </div>

                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>
                            Delete draft?
                        </h3>
                        <p style={{ margin: '0 0 1.75rem', fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                            <strong style={{ color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>
                                {deleteModal.label}
                            </strong>{' '}
                            and all its legs will be permanently deleted. This cannot be undone.
                        </p>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-ghost"
                                onClick={() => setDeleteModal(null)}
                                disabled={deleting}
                                id="modal-cancel-delete"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteDraft}
                                disabled={deleting}
                                id="modal-confirm-delete"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.5rem 1.25rem',
                                    background: '#dc2626', color: 'white',
                                    border: 'none', borderRadius: 'var(--radius-md)',
                                    fontWeight: 600, fontSize: '0.875rem',
                                    cursor: deleting ? 'default' : 'pointer',
                                    opacity: deleting ? 0.7 : 1,
                                    fontFamily: 'var(--font-family)',
                                }}
                            >
                                <FiTrash2 size={13} />
                                {deleting ? 'Deleting…' : 'Delete Draft'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/** Unified icon-only action button — renders as <button> or <Link> */
function ActionIconBtn({ children, as, to, hoverColor, hoverBg, hoverBorder, ...rest }) {
    const base = {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 30, height: 30,
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-text-muted)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        fontFamily: 'var(--font-family)',
        textDecoration: 'none',
    };
    const onEnter = e => {
        e.currentTarget.style.background = hoverBg;
        e.currentTarget.style.borderColor = hoverBorder;
        e.currentTarget.style.color = hoverColor;
    };
    const onLeave = e => {
        e.currentTarget.style.background = 'var(--color-bg-secondary)';
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.color = 'var(--color-text-muted)';
    };
    if (as === 'link') {
        return (
            <Link to={to} style={base} onMouseEnter={onEnter} onMouseLeave={onLeave} {...rest}>
                {children}
            </Link>
        );
    }
    return (
        <button style={base} onMouseEnter={onEnter} onMouseLeave={onLeave} {...rest}>
            {children}
        </button>
    );
}
