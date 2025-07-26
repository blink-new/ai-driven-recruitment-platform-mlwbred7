import React, { useState } from 'react'
import { Calendar, Clock, User, MapPin, Video, Phone, Mail, Plus, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { blink } from '../blink/client'

interface Interview {
  id: string
  candidateName: string
  candidateEmail: string
  position: string
  type: 'phone' | 'video' | 'in-person'
  date: string
  time: string
  duration: number
  interviewer: string
  interviewerEmail: string
  location?: string
  meetingLink?: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled'
  notes: string
  round: number
  aiScore?: number
}

interface TimeSlot {
  time: string
  available: boolean
  interview?: Interview
}

export default function InterviewScheduler() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const [interviews, setInterviews] = useState<Interview[]>([
    {
      id: '1',
      candidateName: 'Sarah Johnson',
      candidateEmail: 'sarah.johnson@email.com',
      position: 'Senior Full Stack Developer',
      type: 'video',
      date: '2024-01-25',
      time: '10:00',
      duration: 60,
      interviewer: 'John Smith',
      interviewerEmail: 'john.smith@company.com',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      status: 'confirmed',
      notes: 'Technical interview - focus on React and system design',
      round: 2,
      aiScore: 92
    },
    {
      id: '2',
      candidateName: 'Michael Chen',
      candidateEmail: 'michael.chen@email.com',
      position: 'Senior Full Stack Developer',
      type: 'phone',
      date: '2024-01-25',
      time: '14:00',
      duration: 30,
      interviewer: 'Jane Doe',
      interviewerEmail: 'jane.doe@company.com',
      status: 'scheduled',
      notes: 'Initial screening call',
      round: 1,
      aiScore: 76
    },
    {
      id: '3',
      candidateName: 'Emily Rodriguez',
      candidateEmail: 'emily.rodriguez@email.com',
      position: 'Senior Full Stack Developer',
      type: 'in-person',
      date: '2024-01-26',
      time: '11:00',
      duration: 90,
      interviewer: 'Bob Wilson',
      interviewerEmail: 'bob.wilson@company.com',
      location: 'Conference Room A, 2nd Floor',
      status: 'confirmed',
      notes: 'Final round - meet the team',
      round: 3,
      aiScore: 88
    }
  ])

  const [newInterview, setNewInterview] = useState({
    candidateName: '',
    candidateEmail: '',
    position: '',
    type: 'video' as const,
    date: '',
    time: '',
    duration: 60,
    interviewer: '',
    interviewerEmail: '',
    location: '',
    meetingLink: '',
    notes: '',
    round: 1
  })

  // Generate time slots for a day
  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const dateStr = date.toISOString().split('T')[0]
    
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const interview = interviews.find(i => i.date === dateStr && i.time === time)
        
        slots.push({
          time,
          available: !interview,
          interview
        })
      }
    }
    
    return slots
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getInterviewsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return interviews.filter(interview => interview.date === dateStr)
  }

  const handleScheduleInterview = async () => {
    try {
      const interviewId = Date.now().toString()
      const interview: Interview = {
        id: interviewId,
        candidateName: newInterview.candidateName,
        candidateEmail: newInterview.candidateEmail,
        position: newInterview.position,
        type: newInterview.type,
        date: newInterview.date,
        time: newInterview.time,
        duration: newInterview.duration,
        interviewer: newInterview.interviewer,
        interviewerEmail: newInterview.interviewerEmail,
        location: newInterview.location || undefined,
        meetingLink: newInterview.meetingLink || undefined,
        status: 'scheduled',
        notes: newInterview.notes,
        round: newInterview.round
      }

      // Save to database
      await blink.db.interviews.create({
        id: interviewId,
        candidate_name: interview.candidateName,
        candidate_email: interview.candidateEmail,
        position: interview.position,
        interview_type: interview.type,
        interview_date: interview.date,
        interview_time: interview.time,
        duration_minutes: interview.duration,
        interviewer_name: interview.interviewer,
        interviewer_email: interview.interviewerEmail,
        location: interview.location,
        meeting_link: interview.meetingLink,
        status: interview.status,
        notes: interview.notes,
        round_number: interview.round,
        created_at: new Date().toISOString(),
        user_id: 'current_user'
      })

      // Send confirmation email using Supabase Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-interview-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateEmail: interview.candidateEmail,
          candidateName: interview.candidateName,
          interviewDate: new Date(interview.date).toLocaleDateString(),
          interviewTime: interview.time,
          interviewType: interview.type,
          jobTitle: interview.position,
          companyName: 'Our Company'
        })
      })

      if (emailResponse.ok) {
        const emailData = await emailResponse.json()
        console.log('Interview confirmation email generated:', emailData.message)
      }

      setInterviews(prev => [...prev, interview])
      setShowScheduleModal(false)
      setNewInterview({
        candidateName: '',
        candidateEmail: '',
        position: '',
        type: 'video',
        date: '',
        time: '',
        duration: 60,
        interviewer: '',
        interviewerEmail: '',
        location: '',
        meetingLink: '',
        notes: '',
        round: 1
      })
    } catch (error) {
      console.error('Error scheduling interview:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50'
      case 'scheduled': return 'text-blue-600 bg-blue-50'
      case 'completed': return 'text-gray-600 bg-gray-50'
      case 'cancelled': return 'text-red-600 bg-red-50'
      case 'rescheduled': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />
      case 'phone': return <Phone className="w-4 h-4" />
      case 'in-person': return <MapPin className="w-4 h-4" />
      default: return <Calendar className="w-4 h-4" />
    }
  }

  const filteredInterviews = interviews.filter(interview => {
    if (filterStatus === 'all') return true
    return interview.status === filterStatus
  })

  const days = getDaysInMonth(currentDate)
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Scheduler</h1>
          <p className="text-gray-600">Manage and schedule candidate interviews with automated notifications</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              List
            </button>
          </div>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Schedule Interview
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              Today
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            <div className="grid grid-cols-7 gap-px mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="bg-gray-50 h-32"></div>
                }
                
                const dayInterviews = getInterviewsForDate(day)
                const isToday = day.toDateString() === new Date().toDateString()
                const isSelected = day.toDateString() === selectedDate.toDateString()
                
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`bg-white h-32 p-2 cursor-pointer hover:bg-gray-50 ${
                      isSelected ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayInterviews.slice(0, 3).map(interview => (
                        <div
                          key={interview.id}
                          className={`text-xs p-1 rounded truncate ${getStatusColor(interview.status)}`}
                        >
                          {interview.time} - {interview.candidateName}
                        </div>
                      ))}
                      {dayInterviews.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayInterviews.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Selected Day Details */}
          <div className="border-t border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Scheduled Interviews</h4>
                <div className="space-y-3">
                  {getInterviewsForDate(selectedDate).map(interview => (
                    <div key={interview.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {getTypeIcon(interview.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{interview.time}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                            {interview.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{interview.candidateName}</p>
                        <p className="text-xs text-gray-500">{interview.position}</p>
                      </div>
                    </div>
                  ))}
                  {getInterviewsForDate(selectedDate).length === 0 && (
                    <p className="text-gray-500 text-sm">No interviews scheduled for this day</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Available Time Slots</h4>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {generateTimeSlots(selectedDate).filter(slot => slot.available).slice(0, 12).map(slot => (
                    <button
                      key={slot.time}
                      onClick={() => {
                        setNewInterview(prev => ({
                          ...prev,
                          date: selectedDate.toISOString().split('T')[0],
                          time: slot.time
                        }))
                        setShowScheduleModal(true)
                      }}
                      className="p-2 text-sm text-gray-600 bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300"
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* List View Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Interviews</h2>
            <div className="flex items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                More Filters
              </button>
            </div>
          </div>

          {/* Interview List */}
          <div className="divide-y divide-gray-200">
            {filteredInterviews.map(interview => (
              <div key={interview.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{interview.candidateName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                          {interview.status}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          Round {interview.round}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-2">{interview.position}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(interview.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {interview.time} ({interview.duration} min)
                        </div>
                        <div className="flex items-center gap-1">
                          {getTypeIcon(interview.type)}
                          {interview.type}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p><span className="font-medium">Interviewer:</span> {interview.interviewer}</p>
                        {interview.location && (
                          <p><span className="font-medium">Location:</span> {interview.location}</p>
                        )}
                        {interview.meetingLink && (
                          <p><span className="font-medium">Meeting Link:</span> 
                            <a href={interview.meetingLink} className="text-blue-600 hover:underline ml-1">
                              Join Meeting
                            </a>
                          </p>
                        )}
                        {interview.notes && (
                          <p className="mt-2"><span className="font-medium">Notes:</span> {interview.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {interview.aiScore && (
                      <div className="text-right mr-4">
                        <div className="text-sm text-gray-500">AI Score</div>
                        <div className="text-lg font-bold text-gray-900">{interview.aiScore}</div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">
                        Reschedule
                      </button>
                      <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded">
                        Cancel
                      </button>
                      <button className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded">
                        Join
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Schedule New Interview</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Name</label>
                  <input
                    type="text"
                    value={newInterview.candidateName}
                    onChange={(e) => setNewInterview(prev => ({ ...prev, candidateName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Email</label>
                  <input
                    type="email"
                    value={newInterview.candidateEmail}
                    onChange={(e) => setNewInterview(prev => ({ ...prev, candidateEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="john.doe@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={newInterview.position}
                  onChange={(e) => setNewInterview(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Senior Software Engineer"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interview Type</label>
                  <select
                    value={newInterview.type}
                    onChange={(e) => setNewInterview(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="video">Video Call</option>
                    <option value="phone">Phone Call</option>
                    <option value="in-person">In-Person</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newInterview.date}
                    onChange={(e) => setNewInterview(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={newInterview.time}
                    onChange={(e) => setNewInterview(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <select
                    value={newInterview.duration}
                    onChange={(e) => setNewInterview(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Round</label>
                  <select
                    value={newInterview.round}
                    onChange={(e) => setNewInterview(prev => ({ ...prev, round: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Round 1 - Screening</option>
                    <option value={2}>Round 2 - Technical</option>
                    <option value={3}>Round 3 - Final</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interviewer</label>
                  <input
                    type="text"
                    value={newInterview.interviewer}
                    onChange={(e) => setNewInterview(prev => ({ ...prev, interviewer: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interviewer Email</label>
                  <input
                    type="email"
                    value={newInterview.interviewerEmail}
                    onChange={(e) => setNewInterview(prev => ({ ...prev, interviewerEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="jane.smith@company.com"
                  />
                </div>
              </div>

              {newInterview.type === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                  <input
                    type="url"
                    value={newInterview.meetingLink}
                    onChange={(e) => setNewInterview(prev => ({ ...prev, meetingLink: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="https://meet.google.com/abc-defg-hij"
                  />
                </div>
              )}

              {newInterview.type === 'in-person' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newInterview.location}
                    onChange={(e) => setNewInterview(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Conference Room A, 2nd Floor"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newInterview.notes}
                  onChange={(e) => setNewInterview(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Interview focus areas, special instructions, etc."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleInterview}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Schedule Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}