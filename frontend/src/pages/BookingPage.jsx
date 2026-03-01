import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { carrierAPI, shipmentAPI } from '../api/apiClient';
import CustomSelect from '../components/common/CustomSelect';
import {
    FiPlus, FiTrash2, FiCheck, FiArrowRight, FiArrowLeft,
    FiAnchor, FiWind, FiTruck, FiClock, FiPackage, FiUser,
    FiMail, FiPhone, FiMapPin, FiBox, FiCalendar, FiDollarSign,
    FiNavigation, FiLayers, FiShield, FiCheckCircle
} from 'react-icons/fi';

function generateKey() {
    return 'idem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

const TRANSPORT_ICONS = { SEA: <FiAnchor />, AIR: <FiWind />, ROAD: <FiTruck /> };

const STEP_LABELS = [
    { num: 1, label: 'Shipment Details', desc: 'Basic information', icon: <FiPackage size={16} /> },
    { num: 2, label: 'Configure Legs', desc: 'Transport routes', icon: <FiNavigation size={16} /> },
    { num: 3, label: 'Review & Submit', desc: 'Confirm booking', icon: <FiCheckCircle size={16} /> },
];

/* ─── Animated Step Bar ─── */
function StepBar({ currentStep }) {
    const progress = ((currentStep - 1) / (STEP_LABELS.length - 1)) * 100;
    return (
        <div style={{
            background: '#fff', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)', padding: '2rem 2.5rem',
            marginBottom: '2rem', position: 'relative', overflow: 'hidden'
        }}>
            {/* Progress track */}
            <div style={{
                position: 'absolute', top: 0, left: 0, height: '3px',
                width: `${progress}%`, background: 'var(--color-accent)',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '0 0 4px 0'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {STEP_LABELS.map((s, idx) => {
                    const isActive = currentStep === s.num;
                    const isDone = currentStep > s.num;
                    return (
                        <div key={s.num} style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            flex: idx < STEP_LABELS.length - 1 ? 1 : 'none'
                        }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: '50%', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                background: isDone ? 'var(--color-text-primary)' : isActive ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
                                color: isDone ? '#fff' : isActive ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
                                transition: 'all 0.3s ease', fontWeight: 700, fontSize: '0.875rem',
                                border: isActive ? '3px solid rgba(200, 245, 66, 0.4)' : 'none',
                                boxShadow: isActive ? '0 0 0 4px rgba(200, 245, 66, 0.15)' : 'none'
                            }}>
                                {isDone ? <FiCheck size={18} /> : s.icon}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{
                                    fontWeight: 600, fontSize: '0.875rem',
                                    color: isDone || isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                    transition: 'color 0.3s ease'
                                }}>{s.label}</div>
                                <div style={{
                                    fontSize: '0.75rem', color: 'var(--color-text-light)',
                                    whiteSpace: 'nowrap'
                                }}>{s.desc}</div>
                            </div>
                            {idx < STEP_LABELS.length - 1 && (
                                <div style={{
                                    flex: 1, height: 2, marginLeft: '1rem', marginRight: '1rem',
                                    background: isDone ? 'var(--color-text-primary)' : 'var(--color-border)',
                                    transition: 'background 0.4s ease', borderRadius: 1
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Reusable Section Card ─── */
function SectionCard({ icon, title, subtitle, children, style }) {
    return (
        <div style={{
            background: '#fff', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)', padding: '2rem',
            transition: 'box-shadow 0.3s ease', ...style
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg-tertiary)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-text-primary)'
                }}>{icon}</div>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{title}</h3>
                    {subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, marginTop: 2 }}>{subtitle}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

/* ─── Form Field with Icon ─── */
function FormField({ icon, label, required, children, style }) {
    return (
        <div style={{ ...style }}>
            <label style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)',
                marginBottom: '0.5rem'
            }}>
                {icon && <span style={{ color: 'var(--color-text-muted)' }}>{icon}</span>}
                {label}
                {required && <span style={{ color: 'var(--color-danger)', marginLeft: 2 }}>*</span>}
            </label>
            {children}
        </div>
    );
}

/* ─── Stat Pill ─── */
function StatPill({ icon, label, value, accent }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', background: accent ? 'rgba(200, 245, 66, 0.12)' : 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-full)', fontSize: '0.8125rem'
        }}>
            <span style={{ color: 'var(--color-text-muted)', display: 'flex' }}>{icon}</span>
            <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
            <span style={{ fontWeight: 700, color: accent ? '#4a7c00' : 'var(--color-text-primary)' }}>{value}</span>
        </div>
    );
}

/* ─── Info Row (label + value pair used in summary tiles) ─── */
function InfoRow({ label, value }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.55rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', textAlign: 'right' }}>{value || '—'}</span>
        </div>
    );
}

/* ═══════════════════════════════════════════ 
   MAIN COMPONENT 
   ═══════════════════════════════════════════ */
export default function BookingPage() {
    const { shipment, setShipment, step, setStep, resetBooking, preSelectedService, setPreSelectedService } = useBooking();
    const navigate = useNavigate();
    const location = useLocation();
    const [savedDraft, setSavedDraft] = useState(false);

    // If arriving from Carrier Search with a pre-selected service, store it
    useEffect(() => {
        if (location.state?.selectedService && !preSelectedService) {
            setPreSelectedService(location.state.selectedService);
            window.history.replaceState({}, '');
        }
    }, [location.state]);

    const handleSaveDraft = () => {
        // Shipment persisted on server — clear local context and go to tracking list filtered to drafts
        setSavedDraft(true);
        setTimeout(() => {
            resetBooking();
            navigate('/tracking?status=DRAFT');
        }, 900);
    };

    return (
        <div>
            {/* ── Page Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">Book a Shipment</h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.35rem', fontSize: '0.9375rem' }}>
                        Create and submit your multi-leg shipment booking
                    </p>
                </div>

                {/* Save as Draft — only visible once a shipment record exists */}
                {shipment && (
                    <button
                        onClick={handleSaveDraft}
                        disabled={savedDraft}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.45rem',
                            padding: '0.55rem 1.1rem',
                            background: savedDraft ? 'rgba(200,245,66,0.15)' : 'var(--color-bg-secondary)',
                            border: `1.5px solid ${savedDraft ? 'rgba(200,245,66,0.5)' : 'var(--color-border)'}`,
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.8rem', fontWeight: 600,
                            color: savedDraft ? '#4a7c00' : 'var(--color-text-secondary)',
                            cursor: savedDraft ? 'default' : 'pointer',
                            transition: 'all 0.2s ease',
                            marginTop: '0.25rem',
                            fontFamily: 'var(--font-family)',
                        }}
                        onMouseEnter={e => { if (!savedDraft) { e.currentTarget.style.borderColor = 'var(--color-text-muted)'; e.currentTarget.style.background = 'var(--color-bg-tertiary)'; } }}
                        onMouseLeave={e => { if (!savedDraft) { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-bg-secondary)'; } }}
                    >
                        {savedDraft
                            ? <><FiCheck size={13} /> Saved!</>
                            : <><FiLayers size={13} /> Save as Draft</>
                        }
                    </button>
                )}
            </div>

            <StepBar currentStep={step} />

            <div style={{ animation: 'fadeSlideUp 0.35s ease forwards', opacity: 0 }}>
                {step === 1 && <ShipmentDetailsForm />}
                {step === 2 && <LegConfigurator />}
                {step === 3 && <ReviewAndSubmit />}
            </div>

            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes confettiBounce {
                    0%, 100% { transform: scale(1); }
                    50%      { transform: scale(1.15); }
                }
            `}</style>
        </div>
    );
}

/* ═══════════════════════════════════════════ 
   STEP 1: Shipment Details 
   ═══════════════════════════════════════════ */
function ShipmentDetailsForm() {
    const { shipment, setShipment, setStep } = useBooking();
    const [formData, setFormData] = useState({
        shipper_name: shipment?.shipper_name || '',
        shipper_email: shipment?.shipper_email || '',
        shipper_phone: shipment?.shipper_phone || '',
        pickup_address: shipment?.pickup_address || '',
        delivery_address: shipment?.delivery_address || '',
        cargo_type: shipment?.cargo_type || '',
        total_weight_kg: shipment?.total_weight_kg || '',
        total_volume_cbm: shipment?.total_volume_cbm || '',
        required_delivery_date: shipment?.required_delivery_date || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [maxCapacity, setMaxCapacity] = useState({ weight: 0, volume: 0 });

    useEffect(() => {
        carrierAPI.searchServices({ limit: 100 }).then(res => {
            const services = res.data.data || [];
            if (services.length > 0) {
                const maxW = Math.max(...services.map(s => parseFloat(s.max_weight_kg) || 0));
                const maxV = Math.max(...services.map(s => parseFloat(s.max_volume_cbm) || 0));
                setMaxCapacity({ weight: maxW, volume: maxV });
            }
        }).catch(err => console.error("Error fetching max capacity:", err));
    }, []);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Immediate validation against global max system capacity
        const inputWeight = parseFloat(formData.total_weight_kg);
        const inputVolume = parseFloat(formData.total_volume_cbm);

        if (maxCapacity.weight > 0 && inputWeight > maxCapacity.weight) {
            setError(`No carriers in our system can handle the weight of ${inputWeight.toLocaleString()} kg. The maximum supported weight is ${maxCapacity.weight.toLocaleString()} kg.`);
            return;
        }
        if (maxCapacity.volume > 0 && inputVolume > maxCapacity.volume) {
            setError(`No carriers in our system can handle a volume of ${inputVolume.toLocaleString()} cbm. The maximum supported volume is ${maxCapacity.volume.toLocaleString()} cbm.`);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const payload = {
                ...formData,
                total_weight_kg: inputWeight,
                total_volume_cbm: inputVolume,
                required_delivery_date: formData.required_delivery_date || undefined,
            };
            let res;
            if (shipment?.id) {
                res = await shipmentAPI.update(shipment.id, { ...payload, version: shipment.version });
            } else {
                res = await shipmentAPI.create(payload);
            }
            setShipment(res.data.data);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.messages?.join(', ') || err.response?.data?.message || 'Failed to save shipment details');
        }
        setLoading(false);
    };

    const inputStyle = {
        width: '100%', padding: '10px 14px', fontFamily: 'var(--font-family)',
        fontSize: '0.875rem', color: 'var(--color-text-primary)',
        background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', outline: 'none',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

            <SectionCard icon={<FiUser size={18} />} title="Contact Information" subtitle="Who is shipping this cargo?" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <FormField icon={<FiUser size={13} />} label="Shipper Name" required>
                        <input style={inputStyle} name="shipper_name" value={formData.shipper_name} onChange={handleChange} required placeholder="Full name" id="input-shipper-name"
                            onFocus={e => { e.target.style.borderColor = '#1a1a2e'; e.target.style.boxShadow = '0 0 0 3px rgba(26,26,46,0.08)'; }}
                            onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />
                    </FormField>
                    <FormField icon={<FiMail size={13} />} label="Email">
                        <input style={inputStyle} type="email" name="shipper_email" value={formData.shipper_email} onChange={handleChange} placeholder="email@example.com" id="input-shipper-email"
                            onFocus={e => { e.target.style.borderColor = '#1a1a2e'; e.target.style.boxShadow = '0 0 0 3px rgba(26,26,46,0.08)'; }}
                            onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />
                    </FormField>
                    <FormField icon={<FiPhone size={13} />} label="Phone">
                        <input style={inputStyle} name="shipper_phone" value={formData.shipper_phone} onChange={handleChange} placeholder="+1 234 567 890" id="input-shipper-phone"
                            onFocus={e => { e.target.style.borderColor = '#1a1a2e'; e.target.style.boxShadow = '0 0 0 3px rgba(26,26,46,0.08)'; }}
                            onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />
                    </FormField>
                </div>
            </SectionCard>

            <SectionCard icon={<FiMapPin size={18} />} title="Addresses" subtitle="Pickup and delivery locations" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FormField icon={<FiMapPin size={13} />} label="Pickup Address" required>
                        <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} name="pickup_address" value={formData.pickup_address} onChange={handleChange} required placeholder="Full pickup address" id="input-pickup-address"
                            onFocus={e => { e.target.style.borderColor = '#1a1a2e'; e.target.style.boxShadow = '0 0 0 3px rgba(26,26,46,0.08)'; }}
                            onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />
                    </FormField>
                    <FormField icon={<FiMapPin size={13} />} label="Delivery Address" required>
                        <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} name="delivery_address" value={formData.delivery_address} onChange={handleChange} required placeholder="Full delivery address" id="input-delivery-address"
                            onFocus={e => { e.target.style.borderColor = '#1a1a2e'; e.target.style.boxShadow = '0 0 0 3px rgba(26,26,46,0.08)'; }}
                            onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />
                    </FormField>
                </div>
            </SectionCard>

            <SectionCard icon={<FiBox size={18} />} title="Cargo Details" subtitle="Weight, volume, and scheduling" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                    <FormField icon={<FiBox size={13} />} label="Cargo Type" required>
                        <input style={inputStyle} name="cargo_type" value={formData.cargo_type} onChange={handleChange} required placeholder="Electronics" id="input-cargo-type"
                            onFocus={e => { e.target.style.borderColor = '#1a1a2e'; e.target.style.boxShadow = '0 0 0 3px rgba(26,26,46,0.08)'; }}
                            onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />
                    </FormField>
                    <FormField label="Weight (kg)" required>
                        <input style={inputStyle} type="number" step="0.01" min="0.01" name="total_weight_kg" value={formData.total_weight_kg} onChange={handleChange} required placeholder="0.00" id="input-weight"
                            onFocus={e => { e.target.style.borderColor = '#1a1a2e'; e.target.style.boxShadow = '0 0 0 3px rgba(26,26,46,0.08)'; }}
                            onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />
                    </FormField>
                    <FormField label="Volume (cbm)" required>
                        <input style={inputStyle} type="number" step="0.01" min="0.01" name="total_volume_cbm" value={formData.total_volume_cbm} onChange={handleChange} required placeholder="0.00" id="input-volume"
                            onFocus={e => { e.target.style.borderColor = '#1a1a2e'; e.target.style.boxShadow = '0 0 0 3px rgba(26,26,46,0.08)'; }}
                            onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />
                    </FormField>
                    <FormField icon={<FiCalendar size={13} />} label="Delivery Date">
                        <input style={inputStyle} type="date" name="required_delivery_date" value={formData.required_delivery_date} onChange={handleChange} id="input-delivery-date"
                            onFocus={e => { e.target.style.borderColor = '#1a1a2e'; e.target.style.boxShadow = '0 0 0 3px rgba(26,26,46,0.08)'; }}
                            onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />
                    </FormField>
                </div>
            </SectionCard>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="btn-next-step"
                    style={{ padding: '14px 32px', fontSize: '0.9375rem', borderRadius: 'var(--radius-full)' }}>
                    {loading ? 'Saving...' : 'Next: Configure Legs'} <FiArrowRight />
                </button>
            </div>
        </form>
    );
}

/* ═══════════════════════════════════════════ 
   STEP 2: Leg Configurator 
   ═══════════════════════════════════════════ */
function LegConfigurator() {
    const { shipment, setShipment, setStep, preSelectedService, setPreSelectedService } = useBooking();
    const [carriers, setCarriers] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedCarrier, setSelectedCarrier] = useState(shipment?.carrier_group_id || '');
    const [selectedService, setSelectedService] = useState('');
    const [loading, setLoading] = useState(false);
    const [addingLeg, setAddingLeg] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        carrierAPI.listGroups().then((res) => setCarriers(res.data.data || [])).catch(() => { });
    }, []);

    useEffect(() => {
        if (selectedCarrier) {
            carrierAPI.getGroupServices(selectedCarrier)
                .then((res) => {
                    setServices(res.data.data || []);
                    // If we have a preSelectedService, auto-select it once services load
                    if (preSelectedService && String(preSelectedService.carrier_group_id) === String(selectedCarrier)) {
                        setSelectedService(String(preSelectedService.id));
                    }
                })
                .catch(() => setServices([]));
        } else { setServices([]); }
    }, [selectedCarrier]);

    // Auto-select carrier when preSelectedService is set
    useEffect(() => {
        if (preSelectedService && !selectedCarrier) {
            setSelectedCarrier(String(preSelectedService.carrier_group_id));
        }
    }, [preSelectedService]);

    const addLeg = async () => {
        if (!selectedService) return;
        setAddingLeg(true);
        setError(null);
        try {
            const legOrder = (shipment?.legs?.length || 0) + 1;
            const res = await shipmentAPI.addLeg(shipment.id, {
                carrier_service_id: parseInt(selectedService, 10),
                leg_order: legOrder,
            });
            setShipment(res.data.data);
            setSelectedService('');
            setPreSelectedService(null); // Clear pre-selection after use
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add leg');
        }
        setAddingLeg(false);
    };

    const removeLeg = async (legId) => {
        try {
            const res = await shipmentAPI.deleteLeg(shipment.id, legId);
            setShipment(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove leg');
        }
    };

    const legs = shipment?.legs || [];
    const totalPrice = legs.reduce((sum, l) => sum + parseFloat(l.price || 0), 0);
    const totalTransit = legs.reduce((sum, l) => sum + (l.transit_time_days || 0), 0);


    return (
        <div>
            {/* Pre-selected service info */}
            {preSelectedService && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.85rem 1.25rem', marginBottom: '1.25rem',
                    background: '#eff6ff', border: '1px solid #bfdbfe',
                    borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: '#1e40af'
                }}>
                    <FiCheckCircle size={16} style={{ flexShrink: 0 }} />
                    <span>
                        Pre-selected: <strong>{preSelectedService.origin} → {preSelectedService.destination}</strong> via{' '}
                        <strong>{preSelectedService.carrierGroup?.name || 'carrier'}</strong> — ${parseFloat(preSelectedService.price).toLocaleString()}
                    </span>
                </div>
            )}

            {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

            {/* Add Leg Panel */}
            <SectionCard icon={<FiPlus size={18} />} title="Add Transport Leg" subtitle="Select a carrier and route for this leg" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <FormField icon={<FiTruck size={13} />} label="Carrier Group">
                        <CustomSelect
                            id="select-carrier-group"
                            value={selectedCarrier}
                            onChange={(val) => { setSelectedCarrier(val); setSelectedService(''); }}
                            placeholder="Select a carrier..."
                            disabled={!!(shipment?.carrier_group_id && legs.length > 0)}
                            options={[
                                ...carriers.map((c) => ({ value: String(c.id), label: `${c.name} (${c.code})` })),
                            ]}
                        />
                    </FormField>
                    <FormField icon={<FiNavigation size={13} />} label="Service Route">
                        <CustomSelect
                            id="select-service"
                            value={selectedService}
                            onChange={(val) => setSelectedService(val)}
                            placeholder="Select a service..."
                            disabled={!selectedCarrier}
                            options={services.map((s) => ({
                                value: String(s.id),
                                label: `${s.origin} → ${s.destination} (${s.transport_mode}) — $${parseFloat(s.price).toLocaleString()} / ${s.transit_time_days}d`,
                            }))}
                        />
                    </FormField>
                    <button className="btn btn-primary" onClick={addLeg}
                        disabled={!selectedService || addingLeg} id="btn-add-leg"
                        style={{ height: 42, borderRadius: 'var(--radius-md)', padding: '0 20px' }}>
                        <FiPlus size={15} /> {addingLeg ? 'Adding...' : 'Add'}
                    </button>
                </div>
                {shipment?.carrier_group_id && legs.length > 0 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        marginTop: '0.75rem', padding: '0.5rem 0.75rem',
                        background: '#fffbeb', borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem', color: '#92400e'
                    }}>
                        <FiShield size={12} /> Carrier locked — all legs must use the same carrier group
                    </div>
                )}
            </SectionCard>

            {/* Legs Visual Route */}
            {legs.length > 0 && (
                <SectionCard icon={<FiLayers size={18} />} title={`Route • ${legs.length} leg${legs.length !== 1 ? 's' : ''}`} style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {legs.sort((a, b) => a.leg_order - b.leg_order).map((leg, idx) => (
                            <div key={leg.id} style={{
                                position: 'relative', display: 'flex', alignItems: 'center', gap: '1rem',
                                padding: '1rem 1.25rem',
                                background: idx % 2 === 0 ? '#fff' : 'var(--color-bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                borderLeft: '3px solid var(--color-accent)',
                                marginBottom: idx < legs.length - 1 ? 0 : 0,
                                transition: 'background 0.15s ease'
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                                onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : 'var(--color-bg-secondary)'}>

                                {/* Step Number */}
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    background: 'var(--color-accent)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: '0.8rem', flexShrink: 0,
                                    color: 'var(--color-accent-text)'
                                }}>{leg.leg_order}</div>

                                {/* Route */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{leg.origin}</span>
                                        <span style={{ color: 'var(--color-text-light)', fontSize: '0.875rem' }}>→</span>
                                        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{leg.destination}</span>
                                        <span className={`badge badge-${leg.transport_mode.toLowerCase()}`} style={{ marginLeft: '0.25rem' }}>
                                            {TRANSPORT_ICONS[leg.transport_mode]} {leg.transport_mode}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.75rem' }}>
                                        <span><FiClock size={11} style={{ marginRight: 3 }} />{leg.transit_time_days} day{leg.transit_time_days !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>

                                {/* Price */}
                                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-primary)', flexShrink: 0 }}>
                                    ${parseFloat(leg.price).toLocaleString()}
                                </div>

                                {/* Delete */}
                                <button onClick={() => removeLeg(leg.id)} id={`btn-remove-leg-${leg.id}`}
                                    style={{
                                        background: 'none', border: '1px solid transparent', borderRadius: '50%',
                                        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: 'var(--color-text-light)',
                                        transition: 'all 0.15s ease', flexShrink: 0
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecaca'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-light)'; e.currentTarget.style.borderColor = 'transparent'; }}>
                                    <FiTrash2 size={14} />
                                </button>

                                {/* Connector dot */}
                                {idx < legs.length - 1 && (
                                    <div style={{
                                        position: 'absolute', left: 14, bottom: -5,
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: 'var(--color-accent)', zIndex: 1, border: '2px solid #fff'
                                    }} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Totals Bar */}
                    <div style={{
                        display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem',
                        marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)'
                    }}>
                        <StatPill icon={<FiClock size={13} />} label="Transit:" value={`${totalTransit} day${totalTransit !== 1 ? 's' : ''}`} />
                        <StatPill icon={<FiDollarSign size={13} />} label="Total:" value={`$${totalPrice.toLocaleString()}`} accent />
                    </div>
                </SectionCard>
            )}

            {/* Nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setStep(1)} id="btn-back-to-details"
                    style={{ borderRadius: 'var(--radius-full)' }}>
                    <FiArrowLeft size={14} /> Back
                </button>
                <button className="btn btn-primary btn-lg" onClick={() => setStep(3)} disabled={legs.length === 0} id="btn-review"
                    style={{ padding: '14px 32px', fontSize: '0.9375rem', borderRadius: 'var(--radius-full)' }}>
                    Review & Submit <FiArrowRight size={14} />
                </button>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════ 
   STEP 3: Review & Submit 
   ═══════════════════════════════════════════ */
function ReviewAndSubmit() {
    const { shipment, setShipment, setStep, resetBooking } = useBooking();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    const legs = shipment?.legs || [];
    const totalPrice = legs.reduce((sum, l) => sum + parseFloat(l.price || 0), 0);
    const totalTransit = legs.reduce((sum, l) => sum + (l.transit_time_days || 0), 0);

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            const idempotencyKey = generateKey();
            const res = await shipmentAPI.submit(shipment.id, idempotencyKey);
            setShipment(res.data.data);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit shipment');
        }
        setSubmitting(false);
    };

    /* ── Success Screen ── */
    if (submitted) {
        const s = shipment;
        return (
            <div style={{
                maxWidth: 540, margin: '0 auto', textAlign: 'center',
                background: '#fff', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)', padding: '3.5rem 2.5rem',
                boxShadow: '0 8px 40px rgba(0,0,0,0.06)'
            }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1.25rem',
                    background: 'linear-gradient(135deg, #c8f542 0%, #a3d92e 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'confettiBounce 0.6s ease'
                }}>
                    <FiCheck size={32} color="#1a1a2e" strokeWidth={3} />
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '0.4rem' }}>
                    Shipment Booked!
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginBottom: '1.75rem' }}>
                    Your shipment has been successfully submitted and is now being processed.
                </p>
                <div style={{
                    padding: '1.25rem', background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-lg)', marginBottom: '2rem',
                    border: '1px solid var(--color-border)'
                }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                        Shipment Number
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '0.25rem', letterSpacing: '-0.5px' }}>
                        {s?.shipment_number || 'N/A'}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button className="btn btn-primary" onClick={() => navigate(`/tracking/${s?.id}`)} id="btn-view-tracking"
                        style={{ padding: '12px 28px', borderRadius: 'var(--radius-full)' }}>
                        View Tracking <FiArrowRight size={14} />
                    </button>
                    <button className="btn btn-secondary" onClick={resetBooking} id="btn-new-booking"
                        style={{ padding: '12px 28px', borderRadius: 'var(--radius-full)' }}>
                        New Booking
                    </button>
                </div>
            </div>
        );
    }

    /* ── Review Screen ── */
    const s = shipment;

    return (
        <div>
            {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

            {/* ── Shipper Identity Banner ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '1.25rem',
                padding: '1.5rem 2rem', marginBottom: '1rem',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)',
                borderRadius: 'var(--radius-xl)',
                color: '#fff',
            }}>
                <div style={{
                    width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--color-accent)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.25rem', fontWeight: 800, color: '#1a1a2e',
                }}>
                    {s?.shipper_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)', marginBottom: '0.2rem' }}>Shipper</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.3px' }}>{s?.shipper_name || '—'}</div>
                    {(s?.shipper_email || s?.shipper_phone) && (
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {s.shipper_email && <span><FiMail size={11} style={{ marginRight: 4 }} />{s.shipper_email}</span>}
                            {s.shipper_phone && <span><FiPhone size={11} style={{ marginRight: 4 }} />{s.shipper_phone}</span>}
                        </div>
                    )}
                </div>
                {/* Shipment ID chip */}
                <div style={{
                    padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)',
                    background: 'rgba(255,255,255,0.1)', fontSize: '0.75rem',
                    fontWeight: 600, color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap'
                }}>
                    Draft #{s?.id}
                </div>
            </div>

            {/* ── Three Info Tile Groups ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem', marginBottom: '1rem' }}>

                {/* Cargo */}
                <div style={{
                    background: '#fff', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)', padding: '1.25rem',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: '#eef6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                            <FiBox size={15} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>Cargo</span>
                    </div>
                    <InfoRow label="Type" value={s?.cargo_type} />
                    <InfoRow label="Weight" value={`${parseFloat(s?.total_weight_kg).toLocaleString()} kg`} />
                    <InfoRow label="Volume" value={`${parseFloat(s?.total_volume_cbm)} cbm`} />
                </div>

                {/* Addresses */}
                <div style={{
                    background: '#fff', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)', padding: '1.25rem',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                            <FiMapPin size={15} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>Route</span>
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem', fontWeight: 600 }}>PICKUP</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>{s?.pickup_address}</div>
                    </div>
                    <div style={{ width: 2, height: 16, background: 'var(--color-border)', marginLeft: 6, marginBottom: '0.75rem', borderRadius: 2 }} />
                    <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem', fontWeight: 600 }}>DELIVERY</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>{s?.delivery_address}</div>
                    </div>
                </div>

                {/* Carrier & Date */}
                <div style={{
                    background: '#fff', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)', padding: '1.25rem',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: '#fefce8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ca8a04' }}>
                            <FiTruck size={15} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>Carrier</span>
                    </div>
                    <InfoRow label="Carrier" value={s?.carrierGroup?.name || '—'} />
                    {s?.required_delivery_date && <InfoRow label="Required By" value={s.required_delivery_date} />}
                </div>
            </div>

            {/* ── Route Legs Visual ── */}
            <div style={{
                background: '#fff', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)', padding: '1.5rem',
                marginBottom: '1rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiNavigation size={15} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>
                        Route · {legs.length} leg{legs.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Leg rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {legs.sort((a, b) => a.leg_order - b.leg_order).map((leg, idx) => (
                        <div key={leg.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {/* Step bubble */}
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                background: 'var(--color-accent)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: '0.75rem', color: '#1a1a2e',
                            }}>{leg.leg_order}</div>

                            {/* Route pill */}
                            <div style={{
                                flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.65rem 1rem',
                                background: 'var(--color-bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.875rem',
                            }}>
                                <span style={{ fontWeight: 700 }}>{leg.origin}</span>
                                <FiArrowRight size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                                <span style={{ fontWeight: 700 }}>{leg.destination}</span>
                                <span className={`badge badge-${leg.transport_mode.toLowerCase()}`} style={{ marginLeft: 'auto' }}>
                                    {TRANSPORT_ICONS[leg.transport_mode]} {leg.transport_mode}
                                </span>
                            </div>

                            {/* Transit */}
                            <div style={{ width: 70, textAlign: 'center', fontSize: '0.78rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                                <FiClock size={11} style={{ marginRight: 3 }} />
                                {leg.transit_time_days}d
                            </div>

                            {/* Price */}
                            <div style={{ width: 80, textAlign: 'right', fontWeight: 800, fontSize: '0.9375rem', flexShrink: 0 }}>
                                ${parseFloat(leg.price).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals bar */}
                <div style={{
                    display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                    gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem',
                    borderTop: '1px dashed var(--color-border)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        <FiClock size={13} />
                        <span>Total transit:</span>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{totalTransit} day{totalTransit !== 1 ? 's' : ''}</strong>
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-full)',
                        background: 'rgba(200, 245, 66, 0.15)', border: '1px solid rgba(200,245,66,0.4)',
                    }}>
                        <FiDollarSign size={14} style={{ color: '#4a7c00' }} />
                        <span style={{ fontSize: '0.8rem', color: '#4a7c00', fontWeight: 600 }}>Total:</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a1a2e' }}>${totalPrice.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* ── Warning ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.875rem 1.25rem', marginBottom: '1.5rem',
                background: '#fffbeb', border: '1px solid #fed7aa',
                borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: '#92400e',
            }}>
                <FiShield size={16} style={{ flexShrink: 0 }} />
                <span>Upon submission, pricing and transit times will be <strong>snapshotted</strong> and locked. They will not change even if carrier rates are updated later.</span>
            </div>

            {/* ── Actions ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-secondary" onClick={() => setStep(2)} id="btn-back-to-legs"
                    style={{ borderRadius: 'var(--radius-full)' }}>
                    <FiArrowLeft size={14} /> Back
                </button>
                <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={submitting} id="btn-submit-shipment"
                    style={{ padding: '14px 36px', fontSize: '0.9375rem', borderRadius: 'var(--radius-full)' }}>
                    {submitting ? 'Submitting...' : <><FiCheck size={16} /> Confirm & Submit</>}
                </button>
            </div>
        </div>
    );
}
