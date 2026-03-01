import { useState, useRef, useEffect } from 'react';

/**
 * CustomSelect — a fully styled dropdown that replaces native <select>.
 *
 * Props:
 *   value       — currently selected value (string)
 *   onChange    — called with the new value string
 *   options     — [{ value: string, label: string }]
 *   placeholder — text shown when nothing is selected
 *   disabled    — boolean
 *   id          — id attr for the trigger button
 *   style       — extra inline styles on the root wrapper
 *   className   — extra CSS class on the root wrapper
 */
export default function CustomSelect({
    value,
    onChange,
    options = [],
    placeholder = 'Select...',
    disabled = false,
    id,
    style,
    className = '',
}) {
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(-1);
    const rootRef = useRef(null);
    const listRef = useRef(null);

    const selected = options.find((o) => String(o.value) === String(value));

    /* ── Close on outside click ── */
    useEffect(() => {
        const onDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, []);

    /* ── Keyboard navigation ── */
    const onKeyDown = (e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (open && highlighted >= 0) {
                onChange(options[highlighted].value);
                setOpen(false);
            } else {
                setOpen((v) => !v);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            setHighlighted((h) => Math.min(h + 1, options.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    const handleSelect = (val) => {
        onChange(val);
        setOpen(false);
        setHighlighted(-1);
    };

    /* ── Scroll highlighted option into view ── */
    useEffect(() => {
        if (open && listRef.current && highlighted >= 0) {
            const item = listRef.current.children[highlighted];
            if (item) item.scrollIntoView({ block: 'nearest' });
        }
    }, [highlighted, open]);

    return (
        <div
            ref={rootRef}
            className={`custom-select-root ${className}`}
            style={{ position: 'relative', ...style }}
        >
            {/* ── Trigger button ── */}
            <button
                type="button"
                id={id}
                onClick={() => !disabled && setOpen((v) => !v)}
                onKeyDown={onKeyDown}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={`custom-select-trigger${open ? ' open' : ''}${disabled ? ' disabled' : ''}`}
            >
                <span className={`custom-select-label${!selected ? ' placeholder' : ''}`}>
                    {selected ? selected.label : placeholder}
                </span>
                {/* Chevron */}
                <svg
                    className={`custom-select-chevron${open ? ' rotated' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    width="16" height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {/* ── Dropdown list ── */}
            {open && (
                <ul
                    ref={listRef}
                    role="listbox"
                    className="custom-select-list"
                >
                    {options.map((opt, idx) => {
                        const isSelected = String(opt.value) === String(value);
                        const isHovered = idx === highlighted;
                        return (
                            <li
                                key={opt.value}
                                role="option"
                                aria-selected={isSelected}
                                className={`custom-select-option${isSelected ? ' selected' : ''}${isHovered ? ' highlighted' : ''}`}
                                onMouseEnter={() => setHighlighted(idx)}
                                onMouseLeave={() => setHighlighted(-1)}
                                onMouseDown={(e) => {
                                    e.preventDefault(); // don't steal focus from trigger
                                    handleSelect(opt.value);
                                }}
                            >
                                {isSelected && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2.5"
                                        strokeLinecap="round" strokeLinejoin="round"
                                        style={{ flexShrink: 0 }}>
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                                <span style={{ flex: 1 }}>{opt.label}</span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
