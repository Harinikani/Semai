'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { mockDashboardStats } from '@/lib/mock-data'
import { DashboardStats } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Ticket
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const priorityColors = {
  Critical: 'critical',
  High: 'warning',
  Medium: 'secondary',
  Low: 'outline',
} as const

const statusColors = {
  Open: 'destructive',
  'In Progress': 'warning',
  Resolved: 'success',
  Closed: 'outline',
} as const

export default function DashboardPage() {
  // Use mock data directly
  const stats = mockDashboardStats
  const loading = false

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Failed to load dashboard data</p>
      </div>
    )
  }

  const { statistics } = stats

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Endangered species monitoring overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_tickets}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statistics.status_breakdown.open}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statistics.status_breakdown.in_progress}
            </div>
            <p className="text-xs text-muted-foreground">Being handled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.status_breakdown.resolved}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Breakdown</CardTitle>
          <CardDescription>Tickets by priority level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Critical</span>
                <Badge variant="critical">{statistics.priority_breakdown.critical}</Badge>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600"
                  style={{
                    width: `${(statistics.priority_breakdown.critical / statistics.total_tickets) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">High</span>
                <Badge variant="warning">{statistics.priority_breakdown.high}</Badge>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500"
                  style={{
                    width: `${(statistics.priority_breakdown.high / statistics.total_tickets) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Medium</span>
                <Badge variant="secondary">{statistics.priority_breakdown.medium}</Badge>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-500"
                  style={{
                    width: `${(statistics.priority_breakdown.medium / statistics.total_tickets) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Low</span>
                <Badge variant="outline">{statistics.priority_breakdown.low}</Badge>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${(statistics.priority_breakdown.low / statistics.total_tickets) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tickets and Top Species */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
            <CardDescription>Latest endangered species sightings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.recent_tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/dashboard/tickets/${ticket.id}`}
                  className="block"
                >
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">
                          {ticket.species_common_name}
                        </p>
                        <Badge variant={priorityColors[ticket.priority]}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {ticket.location}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(ticket.created_at)}
                      </p>
                    </div>
                    <Badge variant={statusColors[ticket.status]} className="flex-shrink-0">
                      {ticket.status}
                    </Badge>
                  </div>
                </Link>
              ))}

              {statistics.recent_tickets.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No recent tickets
                </p>
              )}
            </div>

            <div className="mt-4">
              <Link href="/dashboard/tickets">
                <Button variant="outline" className="w-full">
                  View All Tickets
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Top Endangered Species */}
        <Card>
          <CardHeader>
            <CardTitle>Top Endangered Species</CardTitle>
            <CardDescription>Most frequently reported species</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.top_endangered_species.map((species, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{species.species_name}</p>
                    <p className="text-xs text-muted-foreground">{species.endangered_status}</p>
                  </div>
                  <Badge variant="secondary">{species.ticket_count} tickets</Badge>
                </div>
              ))}

              {statistics.top_endangered_species.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
