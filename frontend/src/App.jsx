import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import CarrierSearchPage from './pages/CarrierSearchPage';
import BookingPage from './pages/BookingPage';
import TrackingListPage from './pages/TrackingListPage';
import TrackingDetailPage from './pages/TrackingDetailPage';
import Navbar from './components/common/Navbar';

export default function App() {
  return (
    <BrowserRouter>
      <BookingProvider>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/carriers" replace />} />
              <Route path="/carriers" element={<CarrierSearchPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/tracking" element={<TrackingListPage />} />
              <Route path="/tracking/:id" element={<TrackingDetailPage />} />
            </Routes>
          </main>
        </div>
      </BookingProvider>
    </BrowserRouter>
  );
}
