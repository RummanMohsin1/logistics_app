import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shipmentAPI } from '../api/apiClient';
import {
    FiArrowLeft, FiClock, FiMapPin, FiPackage, FiTruck,
    FiAnchor, FiWind, FiAlertTriangle, FiCheck, FiChevronRight, FiInfo, FiLock,
} from 'react-icons/fi';

const TRANSPORT_ICONS = { SEA: <FiAnchor />, AIR: <FiWind />, ROAD: <FiTruck /> };

const STATUS_ACTIONS = {
    BOOKED: [
        { label: 'Mark In Transit', status: 'IN_TRANSIT', className: 'btn-primary' },
        { label: 'Record Exception', action: 'exception', className: 'btn-danger' },
    ],
    IN_TRANSIT: [
        { label: 'Mark Delivered', status: 'DELIVERED', className: 'btn-primary' },
        { label: 'Record Exception', action: 'exception', className: 'btn-danger' },
    ],
    EXCEPTION_UNRESOLVED: [
        { label: 'Resolve Exception', action: 'resolve', className: 'btn-danger' },
    ],
    EXCEPTION_RESOLVED: [
        { label: 'Resume In Transit', status: 'IN_TRANSIT', className: 'btn-primary' },
        { label: 'Mark Delivered', status: 'DELIVERED', className: 'btn-secondary' },
    ],
    DELIVERED: [
        { label: 'Close Shipment', status: 'CLOSED', className: 'btn-secondary' },
    ],
};

function getActions(shipment) {
    if (shipment.status === 'EXCEPTION') {
        return shipment.exception_resolved
            ? STATUS_ACTIONS.EXCEPTION_RESOLVED
            : STATUS_ACTIONS.EXCEPTION_UNRESOLVED;
    }
    return STATUS_ACTIONS[shipment.status] || [];
}

/**
 * Compute what button (if any) to show on a given leg.
 * Rules (per task spec):
 *   - Only show buttons when shipment is IN_TRANSIT
 *   - Sequential: a leg can only advance if all prior legs are DELIVERED
 *   - PENDING  → [Mark In Transit]  (if unlocked)
 *   - IN_TRANSIT → [Mark Completed]
 *   - DELIVERED  → nothing (checkmark shown)
 */
function getLegAction(leg, sortedLegs, shipmentStatus) {
    if (shipmentStatus !== 'IN_TRANSIT') return null;
    if (leg.status === 'DELIVERED') return null;

    // Sequential lock: all legs with lower leg_order must be DELIVERED
    const prevLegs = sortedLegs.filter(l => l.leg_order < leg.leg_order);
    const prevAllDone = prevLegs.every(l => l.status === 'DELIVERED');

    if (leg.status === 'PENDING') {
        if (!prevAllDone) return { locked: true }; // locked — show padlock
        return { label: 'Mark In Transit', next: 'IN_TRANSIT', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
    }
    if (leg.status === 'IN_TRANSIT') {
        return { label: 'Mark Completed', next: 'DELIVERED', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
    }
    return null;
}

export default function TrackingDetailPage() {
    const { id } = useParams();
    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [legLoading, setLegLoading] = useState(null);

    const [showExceptionForm, setShowExceptionForm] = useState(false);
    const [exceptionReasonCode, setExceptionReasonCode] = useState('');
    const [exceptionNotes, setExceptionNotes] = useState('');

    useEffect(() => { fetchShipment(); }, [id]);

    const fetchShipment = async () => {
        setLoading(true);
        try {
            const res = await shipmentAPI.get(id);
            setShipment(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load shipment');
        }
        setLoading(false);
    };

    const handleStatusTransition = async (newStatus) => {
        setActionLoading(true);
        setActionError(null);
        try {
            const res = await shipmentAPI.transitionStatus(id, {
                status: newStatus, version: shipment.version, changed_by: 'Admin',
            });
            setShipment(res.data.data);
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to update status');
        }
        setActionLoading(false);
    };

    const handleLegStatusUpdate = async (leg, nextStatus) => {
        setLegLoading(leg.id);
        setActionError(null);
        try {
            const res = await shipmentAPI.updateLeg(id, leg.id, { status: nextStatus });
            setShipment(res.data.data);
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to update leg status');
        }
        setLegLoading(null);
    };

    const handleRecordException = async () => {
        if (!exceptionReasonCode) return;
        setActionLoading(true);
        setActionError(null);
        try {
            const res = await shipmentAPI.recordException(id, {
                reason_code: exceptionReasonCode, notes: exceptionNotes,
                version: shipment.version, changed_by: 'Admin',
            });
            setShipment(res.data.data);
            setShowExceptionForm(false);
            setExceptionReasonCode('');
            setExceptionNotes('');
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to record exception');
        }
        setActionLoading(false);
    };

    const handleResolveException = async () => {
        setActionLoading(true);
        setActionError(null);
        try {
            const res = await shipmentAPI.resolveException(id, {
                notes: 'Exception resolved', version: shipment.version, changed_by: 'Admin',
            });
            setShipment(res.data.data);
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to resolve exception');
        }
        setActionLoading(false);
    };

    if (loading) return <div className="loader"><div className="spinner"></div></div>;
    if (error || !shipment) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">❌</div>
                <div className="empty-state-title">{error || 'Shipment not found'}</div>
                <Link to="/tracking" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Tracking</Link>
            </div>
        );
    }

    const legs = (shipment.legs || []).slice().sort((a, b) => a.leg_order - b.leg_order);
    const history = shipment.statusHistory || [];
    const actions = getActions(shipment);
    const allLegsDelivered = legs.length > 0 && legs.every(l => l.status === 'DELIVERED');
    const pendingLegsCount = legs.filter(l => l.status !== 'DELIVERED').length;

    return (
        <div>
            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link to="/tracking" className="btn btn-ghost" id="btn-back-tracking"><FiArrowLeft /></Link>
                <div style={{ flex: 1 }}>
                    <h1 className="page-title" style={{ fontSize: 'var(--font-size-2xl)' }}>
                        {shipment.shipment_number || `Draft #${shipment.id}`}
                    </h1>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
                        <span className={`badge badge-${shipment.status.toLowerCase().replace('_', '-')}`}>
                            {shipment.status.replace('_', ' ')}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                            {shipment.carrierGroup?.name}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {actions.map((act, i) => (
                        <button
                            key={i}
                            className={`btn ${act.className}`}
                            disabled={actionLoading}
                            onClick={() => {
                                if (act.action === 'exception') setShowExceptionForm(true);
                                else if (act.action === 'resolve') handleResolveException();
                                else handleStatusTransition(act.status);
                            }}
                            id={`btn-action-${act.status || act.action}`}
                        >
                            {act.label}
                        </button>
                    ))}
                </div>
            </div>

            {actionError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{actionError}</div>}

            {/* ── Exception form ── */}
            {showExceptionForm && (
                <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--color-danger)' }}>
                    <h3 style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>
                        <FiAlertTriangle style={{ marginRight: '0.5rem' }} /> Record Exception
                    </h3>
                    <div className="form-row" style={{ marginBottom: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Reason Code *</label>
                            <select className="form-select" value={exceptionReasonCode}
                                onChange={e => setExceptionReasonCode(e.target.value)} id="exception-reason-code">
                                <option value="">Select reason...</option>
                                <option value="DAMAGE">Cargo Damage</option>
                                <option value="DELAY">Transit Delay</option>
                                <option value="CUSTOMS">Customs Hold</option>
                                <option value="WEATHER">Weather Delay</option>
                                <option value="MECHANICAL">Vehicle/Vessel Issue</option>
                                <option value="DOCUMENTATION">Documentation Issue</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <input className="form-input" value={exceptionNotes}
                                onChange={e => setExceptionNotes(e.target.value)}
                                placeholder="Additional details..." id="exception-notes" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-danger" onClick={handleRecordException}
                            disabled={!exceptionReasonCode || actionLoading} id="btn-confirm-exception">
                            Confirm Exception
                        </button>
                        <button className="btn btn-ghost" onClick={() => setShowExceptionForm(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* ── Exception banner ── */}
            {shipment.status === 'EXCEPTION' && (
                shipment.exception_resolved ? (
                    <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                        marginBottom: '1.5rem', padding: '0.85rem 1rem',
                        background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 'var(--radius-md)', fontSize: '0.875rem',
                    }}>
                        <FiCheck size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <strong style={{ color: '#15803d' }}>Exception resolved</strong>
                            <span style={{ color: '#166534' }}> — Reason was: {shipment.exception_reason_code}</span>
                            {shipment.exception_notes && <span style={{ color: '#166534' }}> — {shipment.exception_notes}</span>}
                            <div style={{ marginTop: '0.25rem', color: '#15803d', fontSize: '0.8rem' }}>
                                Use the buttons above to resume the shipment flow.
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                        <FiAlertTriangle />
                        <div>
                            <strong>Exception Active</strong> — Reason: {shipment.exception_reason_code}
                            {shipment.exception_notes && <span> — {shipment.exception_notes}</span>}
                        </div>
                    </div>
                )
            )}

            {/* ── Info + Timeline ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '1rem' }}>
                        <FiPackage style={{ marginRight: '0.5rem' }} /> Shipment Info
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: 'var(--font-size-sm)' }}>
                        <InfoRow label="Shipper" value={shipment.shipper_name} />
                        {shipment.shipper_email && <InfoRow label="Email" value={shipment.shipper_email} />}
                        {shipment.shipper_phone && <InfoRow label="Phone" value={shipment.shipper_phone} />}
                        <InfoRow label="Cargo" value={shipment.cargo_type} />
                        <InfoRow label="Weight" value={`${parseFloat(shipment.total_weight_kg).toLocaleString()} kg`} />
                        <InfoRow label="Volume" value={`${parseFloat(shipment.total_volume_cbm)} cbm`} />
                        {shipment.total_price && <InfoRow label="Total Price" value={`$${parseFloat(shipment.total_price).toLocaleString()}`} highlight />}
                        {shipment.total_transit_days && <InfoRow label="Total Transit" value={`${shipment.total_transit_days} days`} />}
                        {shipment.submitted_at && <InfoRow label="Submitted" value={new Date(shipment.submitted_at).toLocaleString()} />}
                    </div>
                </div>

                {/* Timeline — fix EXCEPTION→EXCEPTION display */}
                <div className="card">
                    <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '1rem' }}>
                        <FiClock style={{ marginRight: '0.5rem' }} /> Timeline
                    </h3>
                    {history.length === 0 ? (
                        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>No history yet</div>
                    ) : (
                        <div style={{
                            maxHeight: history.length > 5 ? '380px' : 'none',
                            overflowY: history.length > 5 ? 'auto' : 'visible',
                            paddingRight: history.length > 5 ? '8px' : '0'
                        }}>
                            <div className="timeline">
                                {history.map((h) => {
                                    // When from_status === to_status it's an event/note (e.g. exception resolved),
                                    // NOT a status transition — display it differently.
                                    const isEvent = h.from_status && h.from_status === h.to_status;
                                    return (
                                        <div key={h.id} className="timeline-item">
                                            <div className="timeline-dot" />
                                            <div className="timeline-time">
                                                {new Date(h.createdAt || h.created_at).toLocaleString()}
                                            </div>
                                            <div className="timeline-content">
                                                {isEvent ? (
                                                    /* Event note — no arrow, just the status + italic note label */
                                                    <span className="timeline-status" style={{ fontStyle: 'italic', opacity: 0.85 }}>
                                                        {h.to_status.replace('_', ' ')} — {h.notes}
                                                    </span>
                                                ) : (
                                                    <>
                                                        {h.from_status && (
                                                            <span className="timeline-status">
                                                                {h.from_status.replace('_', ' ')} → {h.to_status.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                        {!h.from_status && (
                                                            <span className="timeline-status">{h.to_status.replace('_', ' ')}</span>
                                                        )}
                                                        {h.reason_code && (
                                                            <span style={{ marginLeft: '0.5rem', color: 'var(--color-warning)' }}>
                                                                ({h.reason_code})
                                                            </span>
                                                        )}
                                                        {h.notes && (
                                                            <div style={{ marginTop: '0.25rem', color: 'var(--color-text-muted)' }}>
                                                                {h.notes}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                                    by {h.changed_by}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Route Progress ── */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', margin: 0 }}>
                        <FiMapPin style={{ marginRight: '0.5rem' }} /> Route Progress
                    </h3>
                    {shipment.status === 'IN_TRANSIT' && !allLegsDelivered && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            fontSize: '0.75rem', color: '#92400e',
                            padding: '0.3rem 0.75rem',
                            background: '#fffbeb', border: '1px solid #fde68a',
                            borderRadius: 'var(--radius-full)',
                        }}>
                            <FiInfo size={12} />
                            {pendingLegsCount} leg{pendingLegsCount !== 1 ? 's' : ''} still to complete — advance each leg sequentially
                        </div>
                    )}
                </div>

                {legs.length === 0 ? (
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>No legs configured</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {legs.map((leg) => {
                            const isDelivered = leg.status === 'DELIVERED';
                            const isInTransit = leg.status === 'IN_TRANSIT';
                            const isException = leg.status === 'EXCEPTION';
                            const action = getLegAction(leg, legs, shipment.status);

                            return (
                                <div key={leg.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '1rem', background: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    borderLeft: `3px solid ${isDelivered ? 'var(--color-success)' :
                                        isInTransit ? 'var(--color-warning)' :
                                            isException ? 'var(--color-danger)' : 'var(--color-border)'
                                        }`,
                                    opacity: action?.locked ? 0.55 : 1,
                                    transition: 'opacity 0.2s',
                                }}>
                                    {/* Leg order circle */}
                                    <span style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 'var(--font-size-xs)', fontWeight: 700, flexShrink: 0,
                                        background: isDelivered ? 'var(--color-success)' :
                                            isInTransit ? 'var(--color-warning)' : 'var(--color-surface)',
                                        color: isDelivered || isInTransit ? 'white' : 'var(--color-text-muted)',
                                    }}>
                                        {isDelivered ? <FiCheck size={14} /> : leg.leg_order}
                                    </span>

                                    {/* Route info */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 600 }}>{leg.origin}</span>
                                            <FiChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
                                            <span style={{ fontWeight: 600 }}>{leg.destination}</span>
                                            <span className={`badge badge-${leg.transport_mode.toLowerCase()}`}>
                                                {TRANSPORT_ICONS[leg.transport_mode]} {leg.transport_mode}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                            {leg.snapshotted_transit_days || leg.transit_time_days} days transit •{' '}
                                            ${parseFloat(leg.snapshotted_price || leg.price).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Leg status badge — show "COMPLETED" for DELIVERED legs */}
                                    <span className={`badge badge-${leg.status.toLowerCase().replace('_', '-')}`}>
                                        {leg.status === 'DELIVERED' ? 'COMPLETED' : leg.status.replace('_', ' ')}
                                    </span>

                                    {/* Leg action button */}
                                    {action && !action.locked && (
                                        <button
                                            onClick={() => handleLegStatusUpdate(leg, action.next)}
                                            disabled={!!legLoading}
                                            id={`btn-leg-advance-${leg.id}`}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                padding: '0.3rem 0.8rem',
                                                background: action.bg, border: `1px solid ${action.border}`,
                                                borderRadius: 'var(--radius-md)',
                                                fontSize: '0.75rem', fontWeight: 600, color: action.color,
                                                cursor: legLoading ? 'default' : 'pointer',
                                                fontFamily: 'var(--font-family)', whiteSpace: 'nowrap',
                                                opacity: legLoading && legLoading !== leg.id ? 0.5 : 1,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {legLoading === leg.id ? 'Updating…' : action.label}
                                        </button>
                                    )}

                                    {/* Locked indicator — previous leg not done yet */}
                                    {action?.locked && (
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                            padding: '0.3rem 0.7rem',
                                            background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.72rem', color: 'var(--color-text-light)',
                                            flexShrink: 0,
                                        }}>
                                            <FiLock size={10} /> Awaiting prev. leg
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoRow({ label, value, highlight }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
            <span style={{
                fontWeight: highlight ? 700 : 500,
                color: highlight ? 'var(--color-success)' : 'var(--color-text-primary)',
            }}>{value}</span>
        </div>
    );
}
