import { createContext, useContext, useState } from 'react';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
    const [shipment, setShipment] = useState(null);
    const [step, setStep] = useState(1); // 1=Details, 2=Legs, 3=Review
    const [preSelectedService, setPreSelectedService] = useState(null);

    const resetBooking = () => {
        setShipment(null);
        setStep(1);
        setPreSelectedService(null);
    };

    /**
     * Load an existing draft back into the booking flow.
     * steps: go to step 2 (legs) if the draft already has details saved,
     * or step 1 if for some reason it needs re-filling.
     */
    const loadDraft = (shipmentData) => {
        setShipment(shipmentData);
        setPreSelectedService(null);
        // If shipment already has a shipper name, details are done → go to legs step
        setStep(shipmentData?.shipper_name ? 2 : 1);
    };

    return (
        <BookingContext.Provider value={{ shipment, setShipment, step, setStep, resetBooking, loadDraft, preSelectedService, setPreSelectedService }}>
            {children}
        </BookingContext.Provider>
    );
}

export function useBooking() {
    const context = useContext(BookingContext);
    if (!context) throw new Error('useBooking must be used within a BookingProvider');
    return context;
}
