import { NavLink } from 'react-router-dom';
import { FiSearch, FiPackage, FiMapPin } from 'react-icons/fi';
import { useBooking } from '../../context/BookingContext';

/** Custom ShipTrack brand logo — green truck matching Book Now button style */
export function ShipTrackLogo({ size = 32 }) {
    return (
        <svg
            width={size} height={size} viewBox="0 0 32 32"
            fill="none" xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={{ display: 'block', flexShrink: 0 }}
        >
            {/* Rounded background */}
            <rect width="32" height="32" rx="8" fill="#c8f542" />

            {/* High-quality modern truck icon (Material style) */}
            <g transform="translate(4, 4)" fill="#1e3505">
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
            </g>
        </svg>
    );
}

export default function Navbar() {
    const { resetBooking } = useBooking();

    return (
        <nav className="navbar">
            <NavLink to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
                <ShipTrackLogo size={32} />
                ShipTrack
            </NavLink>
            <div className="navbar-links">
                <NavLink to="/carriers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <FiSearch size={16} /> Carrier Search
                </NavLink>
                <NavLink
                    to="/booking"
                    onClick={resetBooking}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <FiPackage size={16} /> Book Shipment
                </NavLink>
                <NavLink to="/tracking" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <FiMapPin size={16} /> Track Shipments
                </NavLink>
            </div>
        </nav>
    );
}
