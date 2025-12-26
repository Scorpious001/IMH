import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Item } from '../../types/item.types';
import StatusIndicator from '../shared/StatusIndicator';
import './ItemTable.css';

interface ItemTableProps {
  items: Item[];
}

type SortField = 'name' | 'short_code' | 'category_name' | 'property_on_hand';
type SortDirection = 'asc' | 'desc';

const ItemTable: React.FC<ItemTableProps> = ({ items }) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'short_code':
        aValue = a.short_code.toLowerCase();
        bValue = b.short_code.toLowerCase();
        break;
      case 'category_name':
        aValue = (a.category_name || '').toLowerCase();
        bValue = (b.category_name || '').toLowerCase();
        break;
      case 'property_on_hand':
        aValue = a.property_on_hand || 0;
        bValue = b.property_on_hand || 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatus = (item: Item): 'good' | 'warning' | 'critical' => {
    if (item.is_below_par_anywhere) return 'critical';
    return 'good';
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) {
      return <span className="sort-icon">⇅</span>;
    }
    return <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  if (items.length === 0) {
    return <div className="table-empty">No items found</div>;
  }

  return (
    <div className="item-table-container">
      <table className="item-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('name')} className="sortable">
              Name <SortIcon field="name" />
            </th>
            <th onClick={() => handleSort('short_code')} className="sortable">
              Code <SortIcon field="short_code" />
            </th>
            <th onClick={() => handleSort('category_name')} className="sortable">
              Category <SortIcon field="category_name" />
            </th>
            <th onClick={() => handleSort('property_on_hand')} className="sortable">
              On Hand <SortIcon field="property_on_hand" />
            </th>
            <th>Unit</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item) => (
            <tr key={item.id} onClick={() => navigate(`/catalog/${item.id}`)}>
              <td className="item-name-cell">
                {item.photo_url && (
                  <img src={item.photo_url} alt={item.name} className="item-thumbnail" />
                )}
                <span>{item.name}</span>
              </td>
              <td>{item.short_code}</td>
              <td>{item.category_name || 'Uncategorized'}</td>
              <td>{item.property_on_hand || 0}</td>
              <td>{item.unit_of_measure}</td>
              <td>
                <StatusIndicator status={getStatus(item)} />
              </td>
              <td>
                <button
                  className="view-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/catalog/${item.id}`);
                  }}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ItemTable;

