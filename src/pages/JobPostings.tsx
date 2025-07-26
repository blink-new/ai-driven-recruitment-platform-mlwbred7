import React, { useState } from 'react'
import { Plus, Search, Filter, MapPin, Clock, Users, Brain, Edit, Trash2, Eye, Target } from 'lucide-react'
import { blink } from '../blink/client'

interface JobPosting {
  id: string
  title: string
  department: string
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'remote'
  salary: { min: number; max: number }
  description: string
  requirements: string[]
  skills: string[]
  experience: string
  postedDate: string
  status: 'active' | 'paused' | 'closed'
  applicants: number
  aiMatchingEnabled: boolean
  matchingCriteria: {
    skillsWeight: number
    experienceWeight: number
    educationWeight: number
    locationWeight: number
  }
}

export default function JobPostings() {
  const [jobs, setJobs] = useState<JobPosting[]>([
    {
      id: '1',
      title: 'Senior Full Stack Developer',
      department: 'Engineering',
      location: 'San Francisco, CA',
      type: 'full-time',
      salary: { min: 120000, max: 180000 },
      description: 'We are looking for a senior full stack developer to join our growing engineering team...',
      requirements: [
        '5+ years of experience in full stack development',
        'Proficiency in React, Node.js, and TypeScript',
        'Experience with cloud platforms (AWS/GCP)',
        'Strong problem-solving skills'
      ],
      skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL'],
      experience: '5+ years',
      postedDate: '2024-01-15',
      status: 'active',
      applicants: 47,
      aiMatchingEnabled: true,
      matchingCriteria: {
        skillsWeight: 40,
        experienceWeight: 30,
        educationWeight: 15,
        locationWeight: 15
      }
    },
    {
      id: '2',
      title: 'Product Manager',
      department: 'Product',
      location: 'Remote',
      type: 'full-time',
      salary: { min: 100000, max: 140000 },
      description: 'Join our product team to drive innovation and user experience...',
      requirements: [
        '3+ years of product management experience',
        'Experience with agile methodologies',
        'Strong analytical and communication skills',
        'Technical background preferred'
      ],
      skills: ['Product Strategy', 'Agile', 'Analytics', 'User Research'],
      experience: '3+ years',
      postedDate: '2024-01-18',
      status: 'active',
      applicants: 23,
      aiMatchingEnabled: true,
      matchingCriteria: {
        skillsWeight: 35,
        experienceWeight: 35,
        educationWeight: 20,
        locationWeight: 10
      }
    },
    {
      id: '3',
      title: 'UX Designer',
      department: 'Design',
      location: 'New York, NY',
      type: 'full-time',
      salary: { min: 80000, max: 120000 },
      description: 'Create beautiful and intuitive user experiences for our products...',
      requirements: [
        '2+ years of UX design experience',
        'Proficiency in Figma and design systems',
        'Portfolio demonstrating user-centered design',
        'Experience with user research'
      ],
      skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
      experience: '2+ years',
      postedDate: '2024-01-20',
      status: 'paused',
      applicants: 31,
      aiMatchingEnabled: false,
      matchingCriteria: {
        skillsWeight: 45,
        experienceWeight: 25,
        educationWeight: 20,
        locationWeight: 10
      }
    }
  ])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isGeneratingJob, setIsGeneratingJob] = useState(false)

  const [newJob, setNewJob] = useState({
    title: '',
    department: '',
    location: '',
    type: 'full-time' as const,
    salaryMin: '',
    salaryMax: '',
    description: '',
    requirements: '',
    skills: '',
    experience: ''
  })

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleGenerateJobDescription = async () => {
    if (!newJob.title || !newJob.department) return

    setIsGeneratingJob(true)
    try {
      // Call Supabase Edge Function for AI job generation
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-job-generator`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle: newJob.title,
          company: 'Our Company',
          basicRequirements: `${newJob.department} department position with competitive salary`
        })
      })

      if (!response.ok) {
        throw new Error(`AI job generation failed: ${response.statusText}`)
      }

      const jobData = await response.json()

      setNewJob(prev => ({
        ...prev,
        description: jobData.description,
        requirements: jobData.requirements.join('\n'),
        skills: jobData.skills.join(', '),
        experience: '3+ years' // Default experience level
      }))
    } catch (error) {
      console.error('Error generating job description:', error)
    } finally {
      setIsGeneratingJob(false)
    }
  }

  const handleCreateJob = async () => {
    try {
      const jobId = Date.now().toString()
      const job: JobPosting = {
        id: jobId,
        title: newJob.title,
        department: newJob.department,
        location: newJob.location,
        type: newJob.type,
        salary: { 
          min: parseInt(newJob.salaryMin) || 0, 
          max: parseInt(newJob.salaryMax) || 0 
        },
        description: newJob.description,
        requirements: newJob.requirements.split('\n').filter(r => r.trim()),
        skills: newJob.skills.split(',').map(s => s.trim()).filter(s => s),
        experience: newJob.experience,
        postedDate: new Date().toISOString().split('T')[0],
        status: 'active',
        applicants: 0,
        aiMatchingEnabled: true,
        matchingCriteria: {
          skillsWeight: 40,
          experienceWeight: 30,
          educationWeight: 15,
          locationWeight: 15
        }
      }

      // Save to database
      await blink.db.jobs.create({
        id: jobId,
        title: job.title,
        department: job.department,
        location: job.location,
        job_type: job.type,
        salary_min: job.salary.min,
        salary_max: job.salary.max,
        description: job.description,
        requirements: JSON.stringify(job.requirements),
        skills: JSON.stringify(job.skills),
        experience_required: job.experience,
        status: job.status,
        created_at: new Date().toISOString(),
        user_id: 'current_user'
      })

      setJobs(prev => [job, ...prev])
      setShowCreateModal(false)
      setNewJob({
        title: '',
        department: '',
        location: '',
        type: 'full-time',
        salaryMin: '',
        salaryMax: '',
        description: '',
        requirements: '',
        skills: '',
        experience: ''
      })
    } catch (error) {
      console.error('Error creating job:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'paused': return 'text-yellow-600 bg-yellow-50'
      case 'closed': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Postings</h1>
          <p className="text-gray-600">Create and manage job listings with AI-powered candidate matching</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Create Job Posting
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search jobs by title or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status.toUpperCase()}
                  </span>
                  {job.aiMatchingEnabled && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">
                      <Brain className="w-3 h-3" />
                      AI Matching
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {job.type}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {job.applicants} applicants
                  </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skills.slice(0, 5).map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 5 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-sm">
                      +{job.skills.length - 5} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Salary:</span> ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}
                    <span className="mx-2">•</span>
                    <span className="font-medium">Posted:</span> {new Date(job.postedDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                  <Eye className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                  <Edit className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {job.aiMatchingEnabled && (
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">AI Matching Criteria</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Skills:</span>
                    <span className="ml-1 font-medium">{job.matchingCriteria.skillsWeight}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Experience:</span>
                    <span className="ml-1 font-medium">{job.matchingCriteria.experienceWeight}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Education:</span>
                    <span className="ml-1 font-medium">{job.matchingCriteria.educationWeight}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <span className="ml-1 font-medium">{job.matchingCriteria.locationWeight}%</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
                  View Applicants ({job.applicants})
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  AI Match Candidates
                </button>
              </div>
              
              <div className="flex gap-2">
                {job.status === 'active' ? (
                  <button className="px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md hover:bg-yellow-100">
                    Pause Posting
                  </button>
                ) : (
                  <button className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100">
                    Activate Posting
                  </button>
                )}
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  Edit Job
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New Job Posting</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={newJob.title}
                    onChange={(e) => setNewJob(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newJob.department}
                    onChange={(e) => setNewJob(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Engineering"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newJob.location}
                    onChange={(e) => setNewJob(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. San Francisco, CA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                  <select
                    value={newJob.type}
                    onChange={(e) => setNewJob(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary</label>
                  <input
                    type="number"
                    value={newJob.salaryMin}
                    onChange={(e) => setNewJob(prev => ({ ...prev, salaryMin: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="80000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary</label>
                  <input
                    type="number"
                    value={newJob.salaryMax}
                    onChange={(e) => setNewJob(prev => ({ ...prev, salaryMax: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="120000"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateJobDescription}
                  disabled={!newJob.title || !newJob.department || isGeneratingJob}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <Brain className="w-4 h-4" />
                  {isGeneratingJob ? 'Generating...' : 'Generate with AI'}
                </button>
                <span className="text-sm text-gray-500">Fill title and department first</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                <textarea
                  value={newJob.description}
                  onChange={(e) => setNewJob(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the role and responsibilities..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (one per line)</label>
                <textarea
                  value={newJob.requirements}
                  onChange={(e) => setNewJob(prev => ({ ...prev, requirements: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="5+ years of experience&#10;Bachelor's degree in Computer Science&#10;Proficiency in React and Node.js"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={newJob.skills}
                    onChange={(e) => setNewJob(prev => ({ ...prev, skills: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="React, Node.js, TypeScript, AWS"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                  <input
                    type="text"
                    value={newJob.experience}
                    onChange={(e) => setNewJob(prev => ({ ...prev, experience: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="5+ years"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateJob}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Create Job Posting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}