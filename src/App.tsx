import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Creators from './pages/Creators';
import CreatorDetail from './pages/CreatorDetail';
import Programs from './pages/Programs';
import Collect from './pages/Collect';
import Editor from './pages/Editor';
import Analytics from './pages/Analytics';
import Export from './pages/Export';
import Games from './pages/Games';
import Rewards from './pages/Rewards';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Submit from './pages/Submit';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/submit" element={<Submit />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="creators" element={<Creators />} />
          <Route path="creators/:id" element={<CreatorDetail />} />
          <Route path="programs" element={<Programs />} />
          <Route path="collect" element={<Collect />} />
          <Route path="editor" element={<Editor />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="export" element={<Export />} />
          <Route path="games" element={<Games />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
