import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Dashboard } from '@/pages/Dashboard'
import JobPostings from './pages/JobPostings'
import CandidatePipeline from './pages/CandidatePipeline'
import AIScreening from './pages/AIScreening'
import InterviewScheduler from './pages/InterviewScheduler'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <Sidebar />
          <div className="flex-1 lg:ml-0">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/jobs" element={<JobPostings />} />
                <Route path="/candidates" element={<CandidatePipeline />} />
                <Route path="/screening" element={<AIScreening />} />
                <Route path="/interviews" element={<InterviewScheduler />} />
                <Route path="/assessments" element={<div className="p-6"><h1 className="text-2xl font-bold">Assessments</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
                <Route path="/analytics" element={<div className="p-6"><h1 className="text-2xl font-bold">Analytics</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
                <Route path="/settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </Router>
  )
}

export default App