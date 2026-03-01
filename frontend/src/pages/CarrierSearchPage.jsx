import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { carrierAPI } from '../api/apiClient';
import useDebounce from '../hooks/useDebounce';
import { FiSearch, FiFilter, FiClock, FiDollarSign, FiTruck, FiAnchor, FiWind, FiChevronLeft, FiChevronRight, FiArrowRight } from 'react-icons/fi';
import CustomSelect from '../components/common/CustomSelect';

const TRANSPORT_ICONS = {
    SEA: <FiAnchor />,
    AIR: <FiWind />,
    ROAD: <FiTruck />,
};

export default function CarrierSearchPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [services, setServices] = useState([]);
    const [carriers, setCarriers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
    const [error, setError] = useState(null);

    // Filters from URL
    const [origin, setOrigin] = useState(searchParams.get('origin') || '');
    const [destination, setDestination] = useState(searchParams.get('destination') || '');
    const [transportMode, setTransportMode] = useState(searchParams.get('transport_mode') || '');
    const [carrierId, setCarrierId] = useState(searchParams.get('carrier_group_id') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'price');
    const [sortOrder, setSortOrder] = useState(searchParams.get('sort_order') || 'ASC');
    const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

    const debouncedOrigin = useDebounce(origin);
    const debouncedDestination = useDebounce(destination);

    // Load carriers for filter dropdown
    useEffect(() => {
        carrierAPI.listGroups().then((res) => setCarriers(res.data.data || [])).catch(() => { });
    }, []);

    const fetchServices = useCallback(async () => {
        const controller = new AbortController();

        setLoading(true);
        setError(null);
        try {
            const params = { page, limit: 20, sort_by: sortBy, sort_order: sortOrder };
            if (debouncedOrigin) params.origin = debouncedOrigin;
            if (debouncedDestination) params.destination = debouncedDestination;
            if (transportMode) params.transport_mode = transportMode;
            if (carrierId) params.carrier_group_id = carrierId;

            // Update URL
            const urlParams = new URLSearchParams();
            Object.entries(params).forEach(([k, v]) => { if (v) urlParams.set(k, v); });
            setSearchParams(urlParams, { replace: true });

            const res = await carrierAPI.searchServices(params, { signal: controller.signal });
            setServices(res.data.data || []);
            setPagination(res.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 });
        } catch (err) {
            // Ignore cancellation — expected when a newer request supersedes this one
            if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
                setError(err.response?.data?.message || 'Failed to load carrier services');
            }
        }
        setLoading(false);

        return () => controller.abort();
    }, [debouncedOrigin, debouncedDestination, transportMode, carrierId, sortBy, sortOrder, page]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setPage(1);
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Carrier Services</h1>
                    <p className="page-subtitle">Search and compare carrier services across air, sea, and road modes</p>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-input-wrapper">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Origin city..."
                        value={origin}
                        onChange={(e) => { setOrigin(e.target.value); setPage(1); }}
                        id="filter-origin"
                    />
                </div>
                <div className="search-input-wrapper">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Destination city..."
                        value={destination}
                        onChange={(e) => { setDestination(e.target.value); setPage(1); }}
                        id="filter-destination"
                    />
                </div>
                <CustomSelect
                    id="filter-transport-mode"
                    value={transportMode}
                    onChange={(val) => { setTransportMode(val); setPage(1); }}
                    placeholder="All Modes"
                    options={[
                        { value: '', label: 'All Modes' },
                        { value: 'AIR', label: '✈️ Air' },
                        { value: 'SEA', label: '🚢 Sea' },
                        { value: 'ROAD', label: '🚛 Road' },
                    ]}
                />
                <CustomSelect
                    id="filter-carrier"
                    value={carrierId}
                    onChange={(val) => { setCarrierId(val); setPage(1); }}
                    placeholder="All Carriers"
                    options={[
                        { value: '', label: 'All Carriers' },
                        ...carriers.map((c) => ({ value: String(c.id), label: c.name })),
                    ]}
                />
            </div>

            {/* Sort Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', alignSelf: 'center' }}>
                    <FiFilter size={14} style={{ marginRight: '4px' }} /> Sort by:
                </span>
                {[
                    { key: 'price', label: 'Price', icon: <FiDollarSign size={14} /> },
                    { key: 'transit_time_days', label: 'Transit Time', icon: <FiClock size={14} /> },
                    { key: 'carrier_name', label: 'Carrier', icon: <FiTruck size={14} /> },
                ].map(({ key, label, icon }) => (
                    <button
                        key={key}
                        className={`btn btn-sm ${sortBy === key ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleSort(key)}
                        id={`sort-${key}`}
                    >
                        {icon} {label} {sortBy === key ? (sortOrder === 'ASC' ? '↑' : '↓') : ''}
                    </button>
                ))}
            </div>

            {/* Error */}
            {error && <div className="alert alert-error">{error}</div>}

            {/* Loading */}
            {loading ? (
                <div className="loader"><div className="spinner"></div></div>
            ) : services.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <div className="empty-state-title">No services found</div>
                    <div className="empty-state-text">Try adjusting your filters or search criteria</div>
                </div>
            ) : (
                <>
                    {/* Results Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
                        {services.map((svc) => (
                            <div key={svc.id} className="card" id={`service-card-${svc.id}`}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-base)', marginBottom: '0.25rem' }}>
                                            {svc.carrierGroup?.name || 'Unknown'}
                                        </div>
                                        <span className={`badge badge-${svc.transport_mode.toLowerCase()}`}>
                                            {TRANSPORT_ICONS[svc.transport_mode]} {svc.transport_mode}
                                        </span>
                                    </div>
                                    <div className="price-tag">${parseFloat(svc.price).toLocaleString()}</div>
                                </div>

                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.75rem', background: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--radius-md)', marginBottom: '1rem'
                                }}>
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>From</div>
                                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{svc.origin}</div>
                                    </div>
                                    <div style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                                        <FiArrowRight size={18} strokeWidth={2.5} />
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>To</div>
                                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{svc.destination}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                    <div>
                                        <FiClock size={12} style={{ marginRight: '4px' }} />
                                        {svc.transit_time_days} day{svc.transit_time_days !== 1 ? 's' : ''} transit
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        Max: {parseFloat(svc.max_weight_kg).toLocaleString()} kg
                                    </div>
                                    <div>
                                        Code: {svc.carrierGroup?.code}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        Max: {parseFloat(svc.max_volume_cbm)} cbm
                                    </div>
                                </div>

                                <button
                                    className="btn btn-primary btn-sm"
                                    style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}
                                    onClick={() => navigate('/booking', { state: { selectedService: svc } })}
                                    id={`book-service-${svc.id}`}
                                >
                                    Book Now
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="pagination-btn"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                id="pagination-prev"
                            >
                                <FiChevronLeft />
                            </button>
                            {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                                const p = i + 1;
                                return (
                                    <button
                                        key={p}
                                        className={`pagination-btn ${page === p ? 'active' : ''}`}
                                        onClick={() => setPage(p)}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            <span className="pagination-info">
                                of {pagination.totalPages}
                            </span>
                            <button
                                className="pagination-btn"
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                id="pagination-next"
                            >
                                <FiChevronRight />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
