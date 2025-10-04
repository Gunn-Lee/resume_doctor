import { Routes, Route } from "react-router-dom";
import AppShell from "./AppShell";
import Main from "../pages/Main";

/**
 * Application router
 */
export default function Router() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Main />} />
      </Routes>
    </AppShell>
  );
}
