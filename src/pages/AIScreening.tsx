import React, { useState, useRef } from 'react'
import { Upload, FileText, Brain, CheckCircle, XCircle, Clock, Star, Download } from 'lucide-react'
import { blink } from '../blink/client'

interface ScreeningResult {
  id: string
  candidateName: string
  fileName: string
  overallScore: number
  skills: { name: string; match: number }[]
  experience: { years: number; relevance: number }
  education: { level: string; relevance: number }
  keyStrengths: string[]
  concerns: string[]
  recommendation: 'hire' | 'interview' | 'reject'
  aiSummary: string
  uploadedAt: string
}

export default function AIScreening() {
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [screeningResults, setScreeningResults] = useState<ScreeningResult[]>([
    {
      id: '1',
      candidateName: 'Sarah Johnson',
      fileName: 'sarah_johnson_resume.pdf',
      overallScore: 92,
      skills: [
        { name: 'React', match: 95 },
        { name: 'TypeScript', match: 88 },
        { name: 'Node.js', match: 85 },
        { name: 'AWS', match: 78 }
      ],
      experience: { years: 5, relevance: 90 },
      education: { level: 'Bachelor\'s in Computer Science', relevance: 85 },
      keyStrengths: ['Strong technical leadership', 'Full-stack expertise', 'Agile methodology'],
      concerns: ['Limited cloud architecture experience'],
      recommendation: 'hire',
      aiSummary: 'Exceptional candidate with strong technical skills and leadership experience. Perfect fit for senior developer role.',
      uploadedAt: '2024-01-20T10:30:00Z'
    },
    {
      id: '2',
      candidateName: 'Michael Chen',
      fileName: 'michael_chen_resume.pdf',
      overallScore: 76,
      skills: [
        { name: 'Python', match: 82 },
        { name: 'Django', match: 75 },
        { name: 'PostgreSQL', match: 70 },
        { name: 'Docker', match: 65 }
      ],
      experience: { years: 3, relevance: 75 },
      education: { level: 'Master\'s in Software Engineering', relevance: 90 },
      keyStrengths: ['Strong analytical skills', 'Database optimization', 'Clean code practices'],
      concerns: ['Limited frontend experience', 'No team leadership experience'],
      recommendation: 'interview',
      aiSummary: 'Solid technical foundation with room for growth. Good candidate for mid-level position with mentorship.',
      uploadedAt: '2024-01-20T09:15:00Z'
    }
  ])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true)
    setIsAnalyzing(true)

    try {
      for (const file of Array.from(files)) {
        // Upload file to storage
        const { publicUrl } = await blink.storage.upload(file, `resumes/${file.name}`, { upsert: true })
        
        // Extract text from resume
        const resumeText = await blink.data.extractFromBlob(file)
        
        // Call Supabase Edge Function for AI resume analysis
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        
        const response = await fetch(`${supabaseUrl}/functions/v1/ai-resume-screening`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resumeText,
            jobRequirements: 'Software Developer position with React, TypeScript, and Node.js experience'
          })
        })

        if (!response.ok) {
          throw new Error(`AI analysis failed: ${response.statusText}`)
        }

        const analysis = await response.json()

        // Extract candidate name from filename or use AI
        const candidateName = file.name.replace(/[_-]/g, ' ').replace('.pdf', '').replace(/\b\w/g, l => l.toUpperCase())

        const newResult: ScreeningResult = {
          id: Date.now().toString(),
          candidateName,
          fileName: file.name,
          overallScore: analysis.overallScore,
          skills: analysis.skills?.technical?.map((skill: string, index: number) => ({
            name: skill,
            match: Math.max(70, analysis.skills?.matchScore - (index * 5)) || 75
          })) || [],
          experience: {
            years: analysis.experience?.years || 3,
            relevance: analysis.experience?.matchScore || 75
          },
          education: {
            level: analysis.education?.degree || 'Bachelor\'s Degree',
            relevance: analysis.education?.relevance || 80
          },
          keyStrengths: analysis.strengths || [],
          concerns: analysis.concerns || [],
          recommendation: analysis.recommendation as 'hire' | 'interview' | 'reject',
          aiSummary: analysis.summary || 'AI analysis completed successfully.',
          uploadedAt: new Date().toISOString()
        }

        // Save to database
        await blink.db.candidates.create({
          id: newResult.id,
          name: candidateName,
          email: `${candidateName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          phone: '+1-555-0123',
          resume_url: publicUrl,
          ai_score: analysis.overallScore,
          skills: JSON.stringify(analysis.skills),
          experience_years: analysis.experience.years,
          status: 'screening',
          created_at: new Date().toISOString(),
          user_id: 'current_user'
        })

        setScreeningResults(prev => [newResult, ...prev])
      }
    } catch (error) {
      console.error('Error analyzing resume:', error)
    } finally {
      setIsUploading(false)
      setIsAnalyzing(false)
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'hire': return 'text-green-600 bg-green-50'
      case 'interview': return 'text-yellow-600 bg-yellow-50'
      case 'reject': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'hire': return <CheckCircle className="w-4 h-4" />
      case 'interview': return <Clock className="w-4 h-4" />
      case 'reject': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Resume Screening</h1>
        <p className="text-gray-600">Upload resumes and let AI analyze candidate fit with intelligent scoring</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Upload Resumes for AI Analysis</h2>
        </div>
        
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault()
            const files = e.dataTransfer.files
            if (files.length > 0) handleFileUpload(files)
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isUploading ? 'Processing Resumes...' : 'Drop resumes here or click to upload'}
          </h3>
          <p className="text-gray-500 mb-4">
            {isAnalyzing ? 'AI is analyzing candidate profiles...' : 'Supports PDF, DOC, DOCX files up to 10MB each'}
          </p>
          {isAnalyzing && (
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>AI Analysis in Progress...</span>
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        />
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Screening Results ({screeningResults.length})</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Export Results
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              Bulk Actions
            </button>
          </div>
        </div>

        {screeningResults.map((result) => (
          <div key={result.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{result.candidateName}</h3>
                  <p className="text-sm text-gray-500">{result.fileName}</p>
                  <p className="text-xs text-gray-400">
                    Analyzed {new Date(result.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="text-2xl font-bold text-gray-900">{result.overallScore}</span>
                    <span className="text-gray-500">/100</span>
                  </div>
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(result.recommendation)}`}>
                    {getRecommendationIcon(result.recommendation)}
                    {result.recommendation.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Skills */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Skills Match</h4>
                <div className="space-y-2">
                  {result.skills.slice(0, 4).map((skill, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{skill.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${skill.match}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8">{skill.match}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience & Education */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Background</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Experience</span>
                      <span className="text-sm font-medium">{result.experience.years} years</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${result.experience.relevance}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Education</span>
                      <span className="text-sm font-medium">{result.education.relevance}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{result.education.level}</p>
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">AI Analysis</h4>
                <p className="text-sm text-gray-600 mb-3">{result.aiSummary}</p>
                
                <div className="space-y-2">
                  <div>
                    <h5 className="text-xs font-medium text-green-700 mb-1">Strengths</h5>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {result.keyStrengths.slice(0, 2).map((strength, index) => (
                        <li key={index}>• {strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {result.concerns.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-red-700 mb-1">Concerns</h5>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {result.concerns.slice(0, 1).map((concern, index) => (
                          <li key={index}>• {concern}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">
                  View Full Analysis
                </button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded">
                  <Download className="w-4 h-4 inline mr-1" />
                  Download Resume
                </button>
              </div>
              
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  Schedule Interview
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  Move to Pipeline
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}