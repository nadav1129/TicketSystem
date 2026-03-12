import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/Dashboard/DashboardPage';
import TicketsPage from './pages/Tickets/TicketsPage';
import MyTicketsPage from './pages/MyTickets/MyTicketsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import TicketDetailsPage from './pages/TicketDetail/TicketDetailPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/tickets" element={<TicketsPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/my-tickets" element={<MyTicketsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/:viewerType/tickets/:ticketId" element={<TicketDetailsPage />} />
    </Routes>
  );
}
