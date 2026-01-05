import React, { useState, useEffect } from 'react';
import { reportsService } from '../../services/reportsService';
import { vendorsService } from '../../services/vendorsService';
import { SuggestedOrder, SuggestedOrdersResponse } from '../../types/report.types';
import { Vendor } from '../../types/vendor.types';
import SuggestedOrderCard from './SuggestedOrderCard';
import './SuggestedOrdersSection.css';

const SuggestedOrdersSection: React.FC = () => {
  const [suggestions, setSuggestions] = useState<SuggestedOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorFilter, setVendorFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    loadSuggestions();
  }, [vendorFilter]);

  const loadVendors = async () => {
    try {
      const data = await vendorsService.getAll();
      setVendors(data.filter((v) => v.is_active));
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const data: SuggestedOrdersResponse = await reportsService.getSuggestedOrders(
        vendorFilter || undefined
      );
      // Transform the data to match the expected structure
      const transformedSuggestions = (data.suggestions || []).map((suggestion: any) => ({
        ...suggestion,
        current_stock: Number(suggestion.current_on_hand || suggestion.current_stock || 0),
        par: Number(suggestion.par || 0),
        suggested_qty: Number(suggestion.suggested_order_qty || suggestion.suggested_qty || 0),
        avg_daily_usage: Number(suggestion.avg_daily_usage || 0),
        lead_time_days: Number(suggestion.lead_time_days || 0),
        projected_on_hand: Number(suggestion.projected_on_hand || 0),
        days_until_below_par: Number(suggestion.days_until_below_par || 0),
      }));
      setSuggestions(transformedSuggestions);
    } catch (error: any) {
      console.error('Error loading suggested orders:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="suggestions-loading">Loading suggested orders...</div>;
  }

  return (
    <div className="suggested-orders-section">
      <div className="section-header">
        <h2>Suggested Orders</h2>
        <div className="vendor-filter">
          <label>Filter by Vendor:</label>
          <select
            value={vendorFilter || ''}
            onChange={(e) => setVendorFilter(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">All Vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="suggestions-content">
        {suggestions.length === 0 ? (
          <div className="empty-suggestions">
            <p>No suggested orders at this time</p>
          </div>
        ) : (
          <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <SuggestedOrderCard
                key={`${suggestion.item_id}-${index}`}
                suggestion={suggestion}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestedOrdersSection;

