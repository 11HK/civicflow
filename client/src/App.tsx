import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { RequireAuth, RequireAdmin } from "@/components/guards";
import { Home } from "@/pages/Home";
import { Services } from "@/pages/Services";
import { ServiceDetail } from "@/pages/ServiceDetail";
import { CivicPath } from "@/pages/CivicPath";
import { MyPaths } from "@/pages/MyPaths";
import { Documents } from "@/pages/Documents";
import { Assistant } from "@/pages/Assistant";
import { Profile } from "@/pages/Profile";
import { Admin } from "@/pages/Admin";
import { NotFound } from "@/pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:slug" element={<ServiceDetail />} />
        <Route
          path="/civic-path/:id"
          element={
            <RequireAuth>
              <CivicPath />
            </RequireAuth>
          }
        />
        <Route
          path="/my-paths"
          element={
            <RequireAuth>
              <MyPaths />
            </RequireAuth>
          }
        />
        <Route
          path="/documents"
          element={
            <RequireAuth>
              <Documents />
            </RequireAuth>
          }
        />
        <Route path="/assistant" element={<Assistant />} />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/*"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}
