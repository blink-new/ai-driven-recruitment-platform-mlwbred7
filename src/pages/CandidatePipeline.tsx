import React, { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { User, Mail, Phone, MapPin, Star, Calendar, MessageSquare, FileText, MoreHorizontal } from 'lucide-react'
import { blink } from '../blink/client'

interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  location: string
  position: string
  aiScore: number
  avatar?: string
  skills: string[]
  experience: string
  appliedDate: string
  lastActivity: string
  notes: string
  resumeUrl?: string
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'
}

interface PipelineStage {
  id: string
  title: string
  candidates: Candidate[]
  color: string
}

const SortableCandidate = ({ candidate }: { candidate: Candidate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg border border-gray-200 p-4 mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{candidate.name}</h4>
            <p className="text-sm text-gray-500">{candidate.position}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">{candidate.aiScore}</span>
          </div>
          <button className="p-1 text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-3 h-3" />
          <span className="truncate">{candidate.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-3 h-3" />
          <span>{candidate.location}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {candidate.skills.slice(0, 3).map((skill, index) => (
          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
            {skill}
          </span>
        ))}
        {candidate.skills.length > 3 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
            +{candidate.skills.length - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Applied {new Date(candidate.appliedDate).toLocaleDateString()}</span>
        <div className="flex gap-2">
          <button className="p-1 text-gray-400 hover:text-blue-600">
            <MessageSquare className="w-3 h-3" />
          </button>
          <button className="p-1 text-gray-400 hover:text-blue-600">
            <FileText className="w-3 h-3" />
          </button>
          <button className="p-1 text-gray-400 hover:text-blue-600">
            <Calendar className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

const PipelineColumn = ({ stage }: { stage: PipelineStage }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 min-h-[600px] w-80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
          <h3 className="font-semibold text-gray-900">{stage.title}</h3>
          <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-sm">
            {stage.candidates.length}
          </span>
        </div>
      </div>

      <SortableContext items={stage.candidates.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {stage.candidates.map((candidate) => (
            <SortableCandidate key={candidate.id} candidate={candidate} />
          ))}
        </div>
      </SortableContext>

      {stage.candidates.length === 0 && (
        <div className="text-center text-gray-400 mt-8">
          <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No candidates in this stage</p>
        </div>
      )}
    </div>
  )
}

export default function CandidatePipeline() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [stages, setStages] = useState<PipelineStage[]>([
    {
      id: 'applied',
      title: 'Applied',
      color: 'bg-blue-500',
      candidates: [
        {
          id: '1',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          phone: '+1-555-0123',
          location: 'San Francisco, CA',
          position: 'Senior Full Stack Developer',
          aiScore: 92,
          skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL'],
          experience: '5+ years',
          appliedDate: '2024-01-20',
          lastActivity: '2024-01-20',
          notes: 'Strong technical background with leadership experience',
          status: 'applied'
        },
        {
          id: '2',
          name: 'Michael Chen',
          email: 'michael.chen@email.com',
          phone: '+1-555-0124',
          location: 'Seattle, WA',
          position: 'Senior Full Stack Developer',
          aiScore: 76,
          skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
          experience: '3+ years',
          appliedDate: '2024-01-19',
          lastActivity: '2024-01-19',
          notes: 'Good technical skills, needs frontend experience',
          status: 'applied'
        }
      ]
    },
    {
      id: 'screening',
      title: 'AI Screening',
      color: 'bg-yellow-500',
      candidates: [
        {
          id: '3',
          name: 'Emily Rodriguez',
          email: 'emily.rodriguez@email.com',
          phone: '+1-555-0125',
          location: 'Austin, TX',
          position: 'Senior Full Stack Developer',
          aiScore: 88,
          skills: ['React', 'Python', 'AWS', 'MongoDB'],
          experience: '4+ years',
          appliedDate: '2024-01-18',
          lastActivity: '2024-01-21',
          notes: 'Excellent problem-solving skills',
          status: 'screening'
        }
      ]
    },
    {
      id: 'interview',
      title: 'Interview',
      color: 'bg-purple-500',
      candidates: [
        {
          id: '4',
          name: 'David Kim',
          email: 'david.kim@email.com',
          phone: '+1-555-0126',
          location: 'New York, NY',
          position: 'Senior Full Stack Developer',
          aiScore: 85,
          skills: ['React', 'Node.js', 'GraphQL', 'Kubernetes'],
          experience: '6+ years',
          appliedDate: '2024-01-15',
          lastActivity: '2024-01-22',
          notes: 'Scheduled for technical interview on Jan 25',
          status: 'interview'
        },
        {
          id: '5',
          name: 'Lisa Wang',
          email: 'lisa.wang@email.com',
          phone: '+1-555-0127',
          location: 'Los Angeles, CA',
          position: 'Senior Full Stack Developer',
          aiScore: 90,
          skills: ['Vue.js', 'Node.js', 'TypeScript', 'GCP'],
          experience: '5+ years',
          appliedDate: '2024-01-16',
          lastActivity: '2024-01-22',
          notes: 'Completed first round, scheduling final interview',
          status: 'interview'
        }
      ]
    },
    {
      id: 'offer',
      title: 'Offer',
      color: 'bg-green-500',
      candidates: [
        {
          id: '6',
          name: 'Alex Thompson',
          email: 'alex.thompson@email.com',
          phone: '+1-555-0128',
          location: 'Chicago, IL',
          position: 'Senior Full Stack Developer',
          aiScore: 94,
          skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker'],
          experience: '7+ years',
          appliedDate: '2024-01-10',
          lastActivity: '2024-01-23',
          notes: 'Offer extended, awaiting response',
          status: 'offer'
        }
      ]
    },
    {
      id: 'hired',
      title: 'Hired',
      color: 'bg-emerald-500',
      candidates: []
    },
    {
      id: 'rejected',
      title: 'Rejected',
      color: 'bg-red-500',
      candidates: []
    }
  ])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the candidate being moved
    let candidate: Candidate | undefined
    let sourceStageId: string | undefined

    for (const stage of stages) {
      const foundCandidate = stage.candidates.find(c => c.id === activeId)
      if (foundCandidate) {
        candidate = foundCandidate
        sourceStageId = stage.id
        break
      }
    }

    if (!candidate || !sourceStageId) return

    // Determine target stage
    let targetStageId = overId

    // If dropped on a candidate, find which stage that candidate belongs to
    if (!stages.find(s => s.id === overId)) {
      for (const stage of stages) {
        if (stage.candidates.find(c => c.id === overId)) {
          targetStageId = stage.id
          break
        }
      }
    }

    if (sourceStageId === targetStageId) return

    // Update candidate status
    const updatedCandidate = { ...candidate, status: targetStageId as any }

    // Update stages
    setStages(prevStages => {
      return prevStages.map(stage => {
        if (stage.id === sourceStageId) {
          return {
            ...stage,
            candidates: stage.candidates.filter(c => c.id !== activeId)
          }
        }
        if (stage.id === targetStageId) {
          return {
            ...stage,
            candidates: [...stage.candidates, updatedCandidate]
          }
        }
        return stage
      })
    })

    // Update in database
    try {
      await blink.db.candidates.update(activeId, {
        status: targetStageId,
        updated_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating candidate status:', error)
    }
  }

  const activeCandidate = activeId ? 
    stages.flatMap(s => s.candidates).find(c => c.id === activeId) : null

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Candidate Pipeline</h1>
        <p className="text-gray-600">Drag and drop candidates through your hiring process</p>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        {stages.map((stage) => (
          <div key={stage.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
              <h3 className="font-medium text-gray-900 text-sm">{stage.title}</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stage.candidates.length}</p>
            <p className="text-xs text-gray-500">candidates</p>
          </div>
        ))}
      </div>

      {/* Pipeline Board */}
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCorners}
      >
        <div className="flex gap-6 overflow-x-auto pb-6">
          {stages.map((stage) => (
            <PipelineColumn key={stage.id} stage={stage} />
          ))}
        </div>

        <DragOverlay>
          {activeCandidate ? (
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-lg rotate-3">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{activeCandidate.name}</h4>
                    <p className="text-sm text-gray-500">{activeCandidate.position}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">{activeCandidate.aiScore}</span>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Bulk Email Candidates
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Schedule Interviews
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
            Generate Reports
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
            Export Pipeline
          </button>
        </div>
      </div>
    </div>
  )
}