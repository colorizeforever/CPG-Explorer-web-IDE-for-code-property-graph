import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./shared/components/Layout";
import Dashboard from "./pages/Dashboard";
import CallGraph from "./pages/CallGraph";
import PackageMap from "./pages/PackageMap";
import DataFlow from "./pages/DataFlow";
import SourceView from "./pages/SourceView";

const App = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/callgraph" element={<CallGraph />} />
      <Route path="/packages" element={<PackageMap />} />
      <Route path="/dataflow" element={<DataFlow />} />
      <Route path="/source" element={<SourceView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Layout>
);

export default App;
