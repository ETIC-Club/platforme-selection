import { useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import { ErrorState, Loader } from '../components/ui/Feedback.jsx';
import { useApi } from '../hooks/useApi.js';
import { api } from '../services/endpoints.js';

/** Charge l'événement de l'URL (/events/:eventId/…) et le partage avec les pages enfants. */
export default function EventLayout() {
  const { eventId } = useParams();
  const { data, error, loading, reload } = useApi(() => api.events.get(eventId), [eventId]);

  if (loading && !data) return <Loader full label="Chargement de l'événement…" />;
  if (error) {
    return (
      <div className="min-h-screen bg-white p-6">
        <ErrorState error={error} onRetry={reload} backTo={{ to: '/events?list=1', label: 'Mes événements' }} />
      </div>
    );
  }
  return <AppLayout event={data.event} context={{ event: data.event }} />;
}
