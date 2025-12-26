import React from 'react';
import UsersTab from '../../components/settings/UsersTab';
import './UsersPage.css';

const UsersPage: React.FC = () => {
  return (
    <div className="users-page">
      <h1>Users</h1>
      <UsersTab />
    </div>
  );
};

export default UsersPage;

