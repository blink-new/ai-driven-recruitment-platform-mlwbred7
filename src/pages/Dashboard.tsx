import { useState, useEffect } from 'react'
import { 
  Users, 
  Briefcase, 
  Brain, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  FileText,
  Target
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { blink } from '@/blink/client'

interface DashboardStats {
  totalCandidates: number
  activeJobs: number
  pendingScreenings: number
  interviewsToday: number
  hiringRate: number
  avgTimeToHire: number
}

interface RecentActivity {
  id: string
  type: 'screening' | 'interview' | 'hire' | 'application'
  candidate: string
  job: string
  timestamp: string
  status: 'completed' | 'pending' | 'scheduled'
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCandidates: 0,
    activeJobs: 0,
    pendingScreenings: 0,
    interviewsToday: 0,
    hiringRate: 0,
    avgTimeToHire: 0
  })
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    try {
      // Simulate loading dashboard data
      setTimeout(() => {
        setStats({
          totalCandidates: 1247,
          activeJobs: 23,
          pendingScreenings: 89,
          interviewsToday: 12,
          hiringRate: 78,
          avgTimeToHire: 14
        })

        setRecentActivity([
          {
            id: '1',
            type: 'screening',
            candidate: 'Sarah Johnson',
            job: 'Senior Frontend Developer',
            timestamp: '2 hours ago',
            status: 'completed'
          },
          {
            id: '2',
            type: 'interview',
            candidate: 'Michael Chen',
            job: 'Product Manager',
            timestamp: '4 hours ago',
            status: 'scheduled'
          },
          {
            id: '3',
            type: 'hire',
            candidate: 'Emily Rodriguez',
            job: 'UX Designer',
            timestamp: '1 day ago',
            status: 'completed'
          },
          {
            id: '4',
            type: 'application',
            candidate: 'David Kim',
            job: 'Backend Engineer',
            timestamp: '2 days ago',
            status: 'pending'
          }
        ])
        
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'screening': return <Brain className="h-4 w-4" />
      case 'interview': return <Calendar className="h-4 w-4" />
      case 'hire': return <CheckCircle className="h-4 w-4" />
      case 'application': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, HR Manager</h1>
        <p className="text-gray-600">Here's what's happening with your recruitment pipeline today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Candidates</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCandidates.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeJobs}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Target className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-blue-600">5 closing this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Screenings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingScreenings}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <AlertCircle className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-orange-600">Requires attention</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Interviews Today</p>
                <p className="text-3xl font-bold text-gray-900">{stats.interviewsToday}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Clock className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-gray-600">Next at 2:00 PM</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hiring Performance</CardTitle>
            <CardDescription>Key recruitment metrics this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Hiring Success Rate</span>
                <span className="text-sm text-gray-600">{stats.hiringRate}%</span>
              </div>
              <Progress value={stats.hiringRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Average Time to Hire</span>
                <span className="text-sm text-gray-600">{stats.avgTimeToHire} days</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Candidate Satisfaction</span>
                <span className="text-sm text-gray-600">4.2/5</span>
              </div>
              <Progress value={84} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your recruitment pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-gray-100 rounded-full">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.candidate}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {activity.job}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </Badge>
                    <span className="text-xs text-gray-400">{activity.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full">
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to streamline your workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center space-y-2">
              <Briefcase className="h-5 w-5" />
              <span className="text-sm">Post New Job</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Brain className="h-5 w-5" />
              <span className="text-sm">Run AI Screening</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Calendar className="h-5 w-5" />
              <span className="text-sm">Schedule Interview</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <FileText className="h-5 w-5" />
              <span className="text-sm">Create Assessment</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}