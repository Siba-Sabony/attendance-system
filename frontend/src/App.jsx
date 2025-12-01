import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeesPage from './pages/EmployeesPage';
import DatesPage from './pages/DatesPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './pages/Layout';
import ReportsPage from './pages/ReportsPage';
import ManageEmployeesPage from './pages/ManageEmployeesPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />

        <Route
          path="/employees"
          element={
            <Layout>
              <EmployeesPage />
            </Layout>
          }
        />

        <Route
          path="/ManageEmployees"
          element={
            <Layout>
              <ManageEmployeesPage />
            </Layout>
          }
        />

        <Route
          path="/dates"
          element={
            <Layout>
              <DatesPage />
            </Layout>
          }
        />

        <Route
          path="/reports"
          element={
            <Layout>
              <ReportsPage />
            </Layout>
          }
        />

        <Route
          path="/settings"
          element={
            <Layout>
              <SettingsPage />
            </Layout>
          }
        />

        <Route path="/employee" element={<EmployeeDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
