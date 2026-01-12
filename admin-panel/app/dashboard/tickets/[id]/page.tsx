'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getTicketById, updateTicket } from '@/lib/mock-data'
import { Ticket } from '@/types'
import { formatDate } from '@/lib/utils'
import {
  AlertCircle,
  MapPin,
  User,
  Calendar,
  Mail,
  Phone,
  ArrowLeft,
  ExternalLink,
  Check,
  Image as ImageIcon,
} from 'lucide-react'
import Image from 'next/image'

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

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  // Load mock ticket data
  const initialTicket = getTicketById(params.id)
  const [ticket, setTicket] = useState<Ticket | null>(initialTicket || null)
  const loading = false

  // Form state
  const [status, setStatus] = useState<string>(ticket?.status || 'Open')
  const [priority, setPriority] = useState<string>(ticket?.priority || 'Medium')
  const [comments, setComments] = useState('')

  const handleUpdate = () => {
    if (!ticket) return

    // Update mock data
    const updated = updateTicket(ticket.id, {
      status: status as any,
      priority: priority as any,
      admin_comments: comments
        ? (ticket.admin_comments ? `${ticket.admin_comments}\n\n[${new Date().toLocaleString()}] admin@semai.com: ${comments}` : `[${new Date().toLocaleString()}] admin@semai.com: ${comments}`)
        : ticket.admin_comments,
    })

    if (updated) {
      setTicket(updated)
      setComments('')
      alert('Ticket updated successfully!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Ticket not found</p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/tickets')}>
          Back to Tickets
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/tickets')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{ticket.species_common_name}</h1>
          <p className="text-muted-foreground italic">{ticket.species_scientific_name}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
          <Badge variant={statusColors[ticket.status]}>{ticket.status}</Badge>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Species Image */}
          {ticket.image_url && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Scanned Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={ticket.image_url}
                    alt={ticket.species_common_name}
                    fill
                    className="object-cover"
                  />
                </div>
                {ticket.confidence_score && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">AI Confidence:</span>
                    <span className="font-semibold">
                      {(ticket.confidence_score * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{ticket.location}</p>
                {ticket.location_details && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {ticket.location_details}
                  </p>
                )}
              </div>

              {ticket.latitude && ticket.longitude && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Coordinates:</p>
                  <p className="text-sm font-mono">
                    {ticket.latitude.toFixed(4)}, {ticket.longitude.toFixed(4)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${ticket.latitude},${ticket.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                  >
                    View on Google Maps
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(ticket.scan_timestamp)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Reported By
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="font-medium">{ticket.user_name}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${ticket.user_email}`} className="hover:underline">
                  {ticket.user_email}
                </a>
              </div>
              {ticket.user_phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${ticket.user_phone}`} className="hover:underline">
                    {ticket.user_phone}
                  </a>
                </div>
              )}

              {ticket.is_repeat_scan && (
                <div className="pt-3 border-t">
                  <Badge variant="warning" className="w-full justify-center">
                    ⚠️ Repeat Scan - Scanned {ticket.previous_scan_count} times before
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Conservation Information */}
          <Card>
            <CardHeader>
              <CardTitle>Conservation Information</CardTitle>
              <CardDescription>
                Status: <strong>{ticket.endangered_status}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.habitat && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">🌍 Habitat</h4>
                  <p className="text-sm text-muted-foreground">{ticket.habitat}</p>
                </div>
              )}
              {ticket.threats && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">⚠️ Threats</h4>
                  <p className="text-sm text-muted-foreground">{ticket.threats}</p>
                </div>
              )}
              {ticket.conservation_notes && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">📋 Conservation Notes</h4>
                  <p className="text-sm text-muted-foreground">{ticket.conservation_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Update Ticket */}
          <Card>
            <CardHeader>
              <CardTitle>Update Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Add Comment</Label>
                <Textarea
                  placeholder="Enter admin comments..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                />
              </div>

              <Button onClick={handleUpdate} className="w-full">
                <Check className="mr-2 h-4 w-4" />
                Update Ticket
              </Button>
            </CardContent>
          </Card>

          {/* Admin Comments History */}
          {ticket.admin_comments && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md">
                    {ticket.admin_comments}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resolution Info */}
          {ticket.resolved_at && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  Resolved
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Resolved by:</span>
                  <p className="font-medium">{ticket.resolved_by}</p>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Resolved at:</span>
                  <p className="font-medium">{formatDate(ticket.resolved_at)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
