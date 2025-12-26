import React from 'react';
import { Item } from '../../types/item.types';
import ItemTable from './ItemTable';
import './ListView.css';

interface ListViewProps {
  items: Item[];
}

const ListView: React.FC<ListViewProps> = ({ items }) => {
  return (
    <div className="list-view">
      <ItemTable items={items} />
    </div>
  );
};

export default ListView;

