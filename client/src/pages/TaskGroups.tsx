import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Plus, Send, Clock, CheckCircle2 } from "lucide-react";
import { mockGroups, mockActivities, suggestedMessages } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import type { Group } from "@shared/schema";

export default function TaskGroups() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(mockGroups[0]);
  const { toast } = useToast();

  const handleTaskToggle = (taskId: string) => {
    toast({
      title: "Task updated",
      description: "Task status has been updated successfully.",
    });
  };

  const handleSendMessage = (message: string) => {
    toast({
      title: "Message sent!",
      description: "Your gentle reminder has been sent to the team.",
    });
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold" data-testid="text-groups-title">
            Task Groups
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Manage shared tasks with gentle reminders and activity tracking
          </p>
        </div>

        {/* Group Selection */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Your Groups</h2>
            <Button data-testid="button-create-group">
              <Plus className="h-4 w-4 mr-2" />
              Create New Group
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockGroups.map((group) => (
              <Card
                key={group.id}
                className={`hover-elevate cursor-pointer transition-all ${
                  selectedGroup?.id === group.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedGroup(group)}
                data-testid={`card-group-${group.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {group.memberCount} members
                        </p>
                      </div>
                    </div>
                    {group.isPremium && (
                      <Badge className="bg-primary text-primary-foreground" data-testid={`badge-premium-${group.id}`}>
                        Premium
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Selected Group Details */}
        {selectedGroup && (
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Group Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl" data-testid="text-selected-group-name">
                      {selectedGroup.name}
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      {selectedGroup.description}
                    </CardDescription>
                  </div>
                  {selectedGroup.isPremium ? (
                    <Badge className="bg-primary text-primary-foreground">Premium Group</Badge>
                  ) : (
                    <Badge variant="outline">Basic Group</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2" data-testid="container-group-members">
                  {selectedGroup.members.map((member) => (
                    <Badge key={member.id} variant="secondary" data-testid={`badge-member-${member.id}`}>
                      {member.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tasks List */}
            <Card>
              <CardHeader>
                <CardTitle>Shared Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedGroup.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-4 p-4 rounded-lg hover-elevate border"
                    data-testid={`task-${task.id}`}
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => handleTaskToggle(task.id)}
                      className="mt-1"
                      data-testid={`checkbox-task-${task.id}`}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        <Badge
                          variant={
                            task.status === 'completed'
                              ? 'default'
                              : task.status === 'overdue'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className={
                            task.status === 'completed'
                              ? 'bg-success text-success-foreground'
                              : ''
                          }
                          data-testid={`badge-status-${task.id}`}
                        >
                          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Assigned to: {task.assignedTo}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due {task.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Messaging Helper */}
            <Card>
              <CardHeader>
                <CardTitle>Messaging Helper</CardTitle>
                <CardDescription>
                  System-suggested gentle reminders for overdue tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {suggestedMessages[selectedGroup.id]?.map((message, idx) => (
                  <Card key={idx} className="p-4 bg-muted/30">
                    <div className="space-y-3">
                      <p className="text-sm leading-relaxed" data-testid={`text-suggested-message-${idx}`}>
                        {message}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => handleSendMessage(message)}
                        data-testid={`button-send-message-${idx}`}
                      >
                        <Send className="h-3 w-3 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockActivities[selectedGroup.id]?.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                      data-testid={`activity-${activity.id}`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-16">
          <Link href="/contact" data-testid="link-get-in-touch">
            <Button size="lg">Get in Touch</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
