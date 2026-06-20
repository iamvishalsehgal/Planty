import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import AddPlant from "@/pages/AddPlant";
import Diagnose from "@/pages/Diagnose";
import Calendar from "@/pages/Calendar";
import Profile from "@/pages/Profile";
import PlantDetail from "@/pages/PlantDetail";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="add" element={<AddPlant />} />
          <Route path="diagnose" element={<Diagnose />} />
          <Route path="profile" element={<Profile />} />
          <Route path="plant/:id" element={<PlantDetail />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
