import React, { useState, useEffect } from 'react';
import { countsService } from '../../services/countsService';
import { useAuth } from '../../contexts/AuthContext';
import { CountSession, CountStatus } from '../../types/count.types';
import { locationsService } from '../../services/locationsService';
import { Location } from '../../types/location.types';
import CountSessionList from '../../components/count/CountSessionList';
import CountSessionDetailView from '../../components/count/CountSessionDetailView';
import CreateCountSessionForm from '../../components/count/CreateCountSessionForm';
import SpotCheck from '../../components/count/SpotCheck';
import './CountsPage.css';

const CountsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('counts', 'create');
  const [sessions, setSessions] = useState<CountSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CountStatus | 'ALL'>('ALL');
  const [locationFilter, setLocationFilter] = useState<number | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedSession, setSelectedSession] = useState<CountSession | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSpotCheck, setShowSpotCheck] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter, locationFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      if (locationFilter) {
        params.location_id = locationFilter;
      }
      const [sessionsData, locationsData] = await Promise.all([
        countsService.getAll(params),
        locationsService.getAll(),
      ]);
      setSessions(sessionsData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading count sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: { location_id: number; notes?: string }) => {
    try {
      await countsService.create(data);
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating count session:', error);
      alert('Failed to create count session');
    }
  };

  const handleAddLine = async (data: {
    item_id: number;
    counted_qty: number;
    reason_code?: string;
    notes?: string;
  }) => {
    if (!selectedSession) return;
    try {
      await countsService.addLine(selectedSession.id, data);
      // Reload the selected session to get updated data
      const updatedSession = await countsService.getById(selectedSession.id);
      setSelectedSession(updatedSession);
      loadData();
    } catch (error) {
      console.error('Error adding count line:', error);
      alert('Failed to add count line');
    }
  };

  const handleComplete = async () => {
    if (!selectedSession) return;
    if (!window.confirm('Complete this count session? You will not be able to add more lines.')) {
      return;
    }
    try {
      await countsService.complete(selectedSession.id);
      loadData();
      const updatedSession = await countsService.getById(selectedSession.id);
      setSelectedSession(updatedSession);
    } catch (error) {
      console.error('Error completing count session:', error);
      alert('Failed to complete count session');
    }
  };

  const handleApprove = async () => {
    if (!selectedSession) return;
    if (
      !window.confirm(
        'Approve this count session? This will adjust stock levels based on variances.'
      )
    ) {
      return;
    }
    try {
      await countsService.approve(selectedSession.id);
      loadData();
      setSelectedSession(null);
    } catch (error) {
      console.error('Error approving count session:', error);
      alert('Failed to approve count session');
    }
  };

  const handleSpotCheck = async (data: {
    item_id: number;
    location_id: number;
    counted_qty: number;
    reason_code?: string;
    notes?: string;
  }) => {
    try {
      // Find or create an IN_PROGRESS count session for this location
      let session = sessions.find(
        (s) => s.location === data.location_id && s.status === 'IN_PROGRESS'
      );

      if (!session) {
        // Create a new count session for this location
        session = await countsService.create({
          location_id: data.location_id,
          notes: 'Auto-created for spot check',
        });
        await loadData(); // Reload to get the new session
        // Get the session again to ensure we have the latest data
        session = await countsService.getById(session.id);
      }

      // Add the count line to the session
      await countsService.addLine(session.id, {
        item_id: data.item_id,
        counted_qty: data.counted_qty,
        reason_code: data.reason_code,
        notes: data.notes,
      });

      setShowSpotCheck(false);
      loadData();
      alert('Spot check submitted successfully');
    } catch (error: any) {
      console.error('Error submitting spot check:', error);
      throw error; // Re-throw to let SpotCheck component handle the error display
    }
  };

  if (loading) {
    return <div className="page-loading">Loading count sessions...</div>;
  }

  return (
    <div className="counts-page">
      <div className="page-header">
        <h1>Counts</h1>
        <div className="header-actions">
          {canCreate && (
            <button className="btn-secondary" onClick={() => setShowSpotCheck(true)}>
              Spot Check
            </button>
          )}
          {canCreate && (
            <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
              Start Count Session
            </button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <CreateCountSessionForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      {showSpotCheck && (
        <div className="modal-overlay" onClick={() => setShowSpotCheck(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <SpotCheck
              onSubmit={handleSpotCheck}
              onCancel={() => setShowSpotCheck(false)}
            />
          </div>
        </div>
      )}

      {selectedSession && (
        <div className="modal-overlay" onClick={() => setSelectedSession(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <CountSessionDetailView
              session={selectedSession}
              onAddLine={handleAddLine}
              onComplete={handleComplete}
              onApprove={handleApprove}
              onClose={() => setSelectedSession(null)}
            />
          </div>
        </div>
      )}

      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CountStatus | 'ALL')}
          >
            <option value="ALL">All</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="APPROVED">Approved</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Location:</label>
          <select
            value={locationFilter || ''}
            onChange={(e) => setLocationFilter(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <CountSessionList
        sessions={sessions}
        onSessionClick={(session) => setSelectedSession(session)}
      />
    </div>
  );
};

export default CountsPage;
