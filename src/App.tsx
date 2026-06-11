import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import RuleSelection from "./pages/RuleSelection";
import SamplePrep from "./pages/SamplePrep";
import TrialTask from "./pages/TrialTask";
import ResultCompare from "./pages/ResultCompare";
import EvaluationReport from "./pages/EvaluationReport";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<RuleSelection />} />
          <Route path="samples" element={<SamplePrep />} />
          <Route path="tasks" element={<TrialTask />} />
          <Route path="results/:taskId" element={<ResultCompare />} />
          <Route path="reports" element={<EvaluationReport />} />
          <Route path="history" element={<EvaluationReport />} />
        </Route>
      </Routes>
    </Router>
  );
}
