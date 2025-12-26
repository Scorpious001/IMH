import React, { useState, useEffect } from 'react';
import { requisitionsService } from '../../services/requisitionsService';
import { useAuth } from '../../contexts/AuthContext';
import { Requisition, RequisitionStatus } from '../../types/requisition.types';
import { locationsService } from '../../services/locationsService';
import { Location } from '../../types/location.types';
import RequisitionCard from '../../components/requisition/RequisitionCard';
import RequisitionDetailView from '../../components/requisition/RequisitionDetailView';
import CreateRequisitionForm from '../../components/requisition/CreateRequisitionForm';
import './RequisitionsPage.css';

const RequisitionsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('requisitions', 'create');
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RequisitionStatus | 'ALL'>('ALL');
  const [locationFilter, setLocationFilter] = useState<number | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

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
      const [requisitionsData, locationsData] = await Promise.all([
        requisitionsService.getAll(params),
        locationsService.getAll(),
      ]);
      setRequisitions(requisitionsData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading requisitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: {
    from_location_id: number;
    to_location_id: number;
    lines: Array<{ item_id: number; qty: number }>;
    needed_by?: string;
    notes?: string;
  }) => {
    try {
      await requisitionsService.create(data);
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating requisition:', error);
      alert('Failed to create requisition');
    }
  };

  const handlePick = async () => {
    if (!selectedRequisition) return;
    try {
      await requisitionsService.pick(selectedRequisition.id);
      loadData();
      setSelectedRequisition(null);
    } catch (error) {
      console.error('Error picking requisition:', error);
      alert('Failed to mark requisition as picked');
    }
  };

  const handleComplete = async () => {
    if (!selectedRequisition) return;
    if (!window.confirm('Complete this requisition? This will transfer stock.')) {
      return;
    }
    try {
      await requisitionsService.complete(selectedRequisition.id);
      loadData();
      setSelectedRequisition(null);
    } catch (error) {
      console.error('Error completing requisition:', error);
      alert('Failed to complete requisition');
    }
  };

  const handleApprove = async () => {
    if (!selectedRequisition) return;
    try {
      await requisitionsService.approve(selectedRequisition.id);
      loadData();
      // Refresh selected requisition
      const updated = await requisitionsService.getById(selectedRequisition.id);
      setSelectedRequisition(updated);
    } catch (error: any) {
      console.error('Error approving requisition:', error);
      alert(error.response?.data?.error || 'Failed to approve requisition');
    }
  };

  const handleDeny = async (reason?: string) => {
    if (!selectedRequisition) return;
    try {
      await requisitionsService.deny(selectedRequisition.id, reason);
      loadData();
      // Refresh selected requisition
      const updated = await requisitionsService.getById(selectedRequisition.id);
      setSelectedRequisition(updated);
    } catch (error: any) {
      console.error('Error denying requisition:', error);
      alert(error.response?.data?.error || 'Failed to deny requisition');
    }
  };

  if (loading) {
    return <div className="page-loading">Loading requisitions...</div>;
  }

  return (
    <div className="requisitions-page">
      <div className="page-header">
        <h1>Requisitions</h1>
        {canCreate && (
          <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
            Create Requisition
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <CreateRequisitionForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      {selectedRequisition && (
        <div className="modal-overlay" onClick={() => setSelectedRequisition(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <RequisitionDetailView
              requisition={selectedRequisition}
              onPick={handlePick}
              onComplete={handleComplete}
              onApprove={handleApprove}
              onDeny={handleDeny}
              onClose={() => setSelectedRequisition(null)}
            />
          </div>
        </div>
      )}

      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RequisitionStatus | 'ALL')}
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="DENIED">Denied</option>
            <option value="PICKED">Picked</option>
            <option value="COMPLETED">Completed</option>
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

      <div className="requisitions-list">
        {requisitions.length === 0 ? (
          <div className="empty-state">
            <p>No requisitions found</p>
            {canCreate && (
              <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
                Create First Requisition
              </button>
            )}
          </div>
        ) : (
          requisitions.map((requisition) => (
            <RequisitionCard
              key={requisition.id}
              requisition={requisition}
              onClick={() => setSelectedRequisition(requisition)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default RequisitionsPage;
