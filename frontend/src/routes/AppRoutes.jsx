import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, RequireRole } from './ProtectedRoute.jsx';
import EventLayout from './EventLayout.jsx';
import AppLayout from '../components/layout/AppLayout.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import EventsPage from '../pages/EventsPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import CandidatesPage from '../pages/CandidatesPage.jsx';
import CandidateDetailPage from '../pages/CandidateDetailPage.jsx';
import SelectorsPage from '../pages/SelectorsPage.jsx';
import SelectorDetailPage from '../pages/SelectorDetailPage.jsx';
import MyCandidatesPage from '../pages/MyCandidatesPage.jsx';
import EvaluationPage from '../pages/EvaluationPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import { ForbiddenPage, NotFoundPage } from '../pages/ErrorPages.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/events" replace />} />
        <Route path="/403" element={<ForbiddenPage />} />

        {/* Pages hors événement */}
        <Route element={<AppLayout />}>
          <Route path="/events" element={<EventsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Pages liées à un événement : /events/:eventId/... */}
        <Route path="/events/:eventId" element={<EventLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          <Route element={<RequireRole roles={['ADMIN']} />}>
            <Route path="candidates" element={<CandidatesPage />} />
            <Route path="candidates/:candidateId" element={<CandidateDetailPage />} />
            <Route path="selectors" element={<SelectorsPage />} />
            <Route path="selectors/:selectorId" element={<SelectorDetailPage />} />
          </Route>

          <Route element={<RequireRole roles={['SELECTOR']} />}>
            <Route path="my-candidates" element={<MyCandidatesPage />} />
            <Route path="my-candidates/:candidateId" element={<EvaluationPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage inLayout />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
