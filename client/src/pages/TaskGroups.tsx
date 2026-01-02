import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Users, User, MessageSquare, Settings, AlertCircle, Heart, Copy, Check, Loader2, Trash2, Shield, Sparkles, AlertTriangle } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { analyzeMessage } from '@/lib/messageRewriter';
import { Progress } from "@/components/ui/progress";
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { type Group, type Task, type ChatMessage, type GroupMember } from '@shared/schema';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Main Component
export default function TaskGroupApp() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  // Initialize user from sessionStorage to allow multi-tab testing (separate simple identities per tab)
  const [currentUser, setCurrentUser] = useState<string>(() => {
    const saved = sessionStorage.getItem('calmly_user_id');
    return (saved || 'user-1').trim();
  });
  const [currentUserName, setCurrentUserName] = useState<string>('You');
  const [activeView, setActiveView] = useState<'list' | 'create' | 'group'>('list');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [newlyCreatedGroup, setNewlyCreatedGroup] = useState<Group | null>(null); // Immediate access to new group
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [joinName, setJoinName] = useState('');
  const [joinEmail, setJoinEmail] = useState('');

  // Parse invite token from URL
  const searchParams = new URLSearchParams(window.location.search);
  const inviteToken = searchParams.get('invite');

  // Fetch groups for the current user
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery<Group[]>({
    queryKey: [`/api/groups?userId=${currentUser}`],
    refetchInterval: 2000, // Poll every 2 seconds for chat updates
  });

  // Fetch invite group details if token exists
  const { data: inviteGroup, isLoading: isLoadingInvite, error: inviteError } = useQuery<Group>({
    queryKey: ['/api/groups/invite', inviteToken],
    enabled: !!inviteToken,
  });

  // Prioritize the server/cache group (which gets updates) over the local temporary one
  // newlyCreatedGroup is ONLY for the split second before the server acknowledges the new group in the list
  const activeGroup = groups.find(g => g.id === activeGroupId) || newlyCreatedGroup;

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: { name: string; description: string; ownerName: string; ownerEmail: string; maxMembers: number }) => {
      // Include the current user ID in the payload so the backend knows who owns it
      const payload = { ...groupData, ownerId: currentUser };
      const res = await apiRequest('POST', '/api/groups', payload);
      if (!res.ok) {
        const error = await res.json();
        const details = error.details ? error.details.map((d: any) => `${d.path}: ${d.message}`).join(', ') : (error.message || "Unknown error");
        throw new Error(details);
      }
      return res.json();
    },
    onSuccess: (newGroup) => {
      // Set the new group directly state to ensure immediate render
      setNewlyCreatedGroup(newGroup);
      setActiveGroupId(newGroup.id);

      // Optimistically update cache to avoid flicker/empty screen
      queryClient.setQueryData([`/api/groups?userId=${currentUser}`], (old: Group[] | undefined) => {
        return old ? [...old, newGroup] : [newGroup];
      });

      // queryClient.invalidateQueries({ queryKey: [`/api/groups?userId=${currentUser}`] });
      setActiveView('group');
      toast({ title: "Group created!", description: `${newGroup.name} is ready.` });
    },
    onError: (error: Error) => {
      let desc = error.message;

      // Try to parse the error message if it comes from our API
      try {
        if (desc.includes(': {')) {
          const jsonPart = desc.substring(desc.indexOf(':') + 1);
          const data = JSON.parse(jsonPart);
          if (data.error === "Validation failed" && data.details) {
            desc = "Please check your inputs: " + data.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join(', ');
          } else if (data.message) {
            desc = data.message;
          } else if (data.error) {
            desc = data.error;
          }
        }
      } catch (e) {
        console.error("Failed to parse error", e);
      }

      toast({
        title: "Failed to create group",
        description: desc || "Please try again.",
        variant: "destructive"
      });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async ({ token, userName, email }: { token: string; userName: string; email: string }) => {
      const res = await apiRequest('POST', '/api/groups/join', { token, userName, email });
      return res.json();
    },
    onSuccess: (data: any) => {
      // The server returns { group: Group, memberId: string }
      const { group: joinedGroup, memberId } = data;

      // Update current user identity to the new member ID and persist it
      setCurrentUser(memberId);
      sessionStorage.setItem('calmly_user_id', memberId);

      // Invalidate queries for the NEW user ID so we can see the group
      queryClient.invalidateQueries({ queryKey: [`/api/groups?userId=${memberId}`] });

      setActiveGroupId(joinedGroup.id);
      setActiveView('group');
      // Clear invite param
      window.history.replaceState({}, '', '/groups');
      toast({ title: "Joined group!", description: `You have joined ${joinedGroup.name} as ${joinName}.` });
    },
    onError: (error) => {
      toast({ title: "Failed to join", description: "Invalid link or server error.", variant: "destructive" });
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      await apiRequest('DELETE', `/api/groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups?userId=${currentUser}`] });
      setActiveGroupId(null);
      setActiveView('list');
      toast({ title: "Group deleted", description: "The group has been permanently removed." });
    },
    onError: (error) => {
      toast({ title: "Failed to delete", description: "Could not delete the group.", variant: "destructive" });
    }
  });

  // Handlers
  const handleCreateGroup = (groupData: { name: string; description: string; ownerName: string; ownerEmail: string; maxMembers: number }) => {
    createGroupMutation.mutate(groupData);
  };

  const handleJoinGroup = () => {
    if (inviteToken && joinName) {
      joinGroupMutation.mutate({ token: inviteToken, userName: joinName, email: joinEmail });
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    deleteGroupMutation.mutate(groupId);
  };

  const handleCopyInviteLink = (group: Group) => {
    const link = `${window.location.origin}/groups?invite=${group.inviteToken}`;
    navigator.clipboard.writeText(link);
    setCopiedLinkId(group.id);
    setTimeout(() => setCopiedLinkId(null), 2000);
    toast({ title: "Link copied!", description: "Share this link to invite others." });
  };

  // Render Loading
  if ((inviteToken && isLoadingInvite) || isLoadingGroups) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Render Invite Join Screen
  if (inviteToken && inviteGroup) {
    const spotsRemaining = inviteGroup.maxMembers - inviteGroup.members.length;
    const isFull = spotsRemaining <= 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <Users className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Join "{inviteGroup.name}"</h1>
          <p className="text-gray-600 mb-6">{inviteGroup.description}</p>
          <div className="mb-8">
            <p className="text-sm text-gray-500">
              {inviteGroup.members.length} / {inviteGroup.maxMembers} members
            </p>
            {isFull ? (
              <p className="text-sm text-red-600 font-semibold mt-2">
                ⚠️ This group is full
              </p>
            ) : (
              <p className="text-sm text-green-600 font-semibold mt-2">
                ✓ {spotsRemaining} spot{spotsRemaining !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>

          {!isFull && (
            <>
              <div className="space-y-4 mb-6 text-left">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                  <input
                    type="email"
                    value={joinEmail}
                    onChange={(e) => setJoinEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleJoinGroup}
                disabled={joinGroupMutation.isPending || !joinName}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joinGroupMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Join Group
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-4">
        {activeView === 'list' && (
          <GroupListView
            groups={groups}
            onCreateClick={() => setActiveView('create')}
            onGroupClick={(id: string) => {
              setNewlyCreatedGroup(null); // Clear temporary new group
              setActiveGroupId(id);
              setActiveView('group');
            }}
            onCopyLink={handleCopyInviteLink}
            copiedLinkId={copiedLinkId}
          />
        )}

        {activeView === 'create' && (
          <GroupCreationFlow
            onGroupCreated={handleCreateGroup}
            onCancel={() => setActiveView('list')}
            currentUser={currentUser}
            isCreating={createGroupMutation.isPending}
          />
        )}

        {activeView === 'group' && (
          activeGroup ? (
            <GroupDetailView
              group={activeGroup}
              currentUser={currentUser}
              newlyCreatedGroup={newlyCreatedGroup}
              setNewlyCreatedGroup={setNewlyCreatedGroup}
              onBack={() => {
                setNewlyCreatedGroup(null);
                setActiveView('list');
              }}
              onCopyInviteLink={() => handleCopyInviteLink(activeGroup)}
              onDeleteGroup={() => handleDeleteGroup(activeGroup.id)}
              copiedLinkId={copiedLinkId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">Loading Group...</h3>
              <p className="text-gray-500">Just a moment while we set things up.</p>
              <button onClick={() => setActiveView('list')} className="mt-8 text-indigo-600 hover:underline">
                Return to list
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// Subcomponents (Simplified for brevity but functional)

function GroupListView({ groups, onCreateClick, onGroupClick, onCopyLink, copiedLinkId }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Your Groups</h2>
          <p className="text-gray-600 mt-1">Manage your groups and communications</p>
        </div>
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold transition"
        >
          <Plus className="w-5 h-5" />
          Create Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No groups yet</h3>
          <p className="text-gray-600 mt-2">Create your first group to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group: Group) => (
            <div
              key={group.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
              onClick={() => onGroupClick(group.id)}
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900">{group.name}</h3>
                <p className="text-gray-600 text-sm mt-2">{group.description}</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MessageSquare className="w-4 h-4" />
                    {group.chat.length} message{group.chat.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyLink(group);
                  }}
                  className="mt-4 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  {copiedLinkId === group.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy invite link
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupCreationFlow({ onGroupCreated, onCancel, isCreating }: any) {
  const [step, setStep] = useState<'members' | 'name' | 'description' | 'creator'>('members');
  const [memberCount, setMemberCount] = useState(2);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  const handleNext = () => {
    if (step === 'members') setStep('name');
    else if (step === 'name') setStep('description');
    else if (step === 'description') setStep('creator');
  };

  const handleCreate = () => {
    onGroupCreated({
      name: name.trim(),
      description: description.trim(),
      ownerName: ownerName.trim(),
      ownerEmail: ownerEmail.trim(),
      maxMembers: memberCount
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Create a New Group</h2>

        {step === 'members' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                How many members in this group?
              </label>
              <div className="flex items-center gap-4 mb-4">
                <input
                  type="range"
                  min="1"
                  max="500"
                  value={memberCount}
                  onChange={(e) => setMemberCount(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={memberCount}
                  onChange={(e) => setMemberCount(Math.min(500, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-center font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <p className="text-center mt-2 text-2xl font-bold text-indigo-600">{memberCount} member{memberCount !== 1 ? 's' : ''}</p>
              <p className="text-xs text-gray-500 text-center mt-2">Free plan: max 5 | Premium: max 10 | Business: up to 500</p>
            </div>
          </div>
        )}

        {step === 'name' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Group Name</label>
              <input
                type="text"
                placeholder="e.g. Project Team, Family..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {step === 'description' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Group Description</label>
              <textarea
                placeholder="Describe the context..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {step === 'creator' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Your Details</h3>
            <p className="text-sm text-gray-500 mb-4">This will be shared with the group members.</p>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Your Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Your Email</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-8">
          <button onClick={onCancel} disabled={isCreating} className="flex-1 px-6 py-3 border border-gray-300 rounded-lg">Cancel</button>

          {step !== 'creator' ? (
            <button
              onClick={handleNext}
              disabled={(step === 'name' && !name)}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={!ownerName || !ownerEmail || isCreating}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex justify-center"
            >
              {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Group"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function GroupDetailView({ group, currentUser, onBack, onCopyInviteLink, onDeleteGroup, copiedLinkId, newlyCreatedGroup, setNewlyCreatedGroup }: any) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'chat' | 'members'>('tasks');
  const isOwner = group.owner === currentUser;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900 font-semibold">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
        <div className="flex items-center gap-2">
          {group.activeTypers && group.activeTypers.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full animate-pulse mr-2">
              <div className="flex gap-0.5">
                <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"></span>
              </div>
              <span className="font-semibold">
                {group.activeTypers.length} typing
              </span>
            </div>
          )}
          <button onClick={onCopyInviteLink} className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700">
            {copiedLinkId === group.id ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Invite</>}
          </button>

          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 ml-4 px-3 py-1 bg-red-50 rounded hover:bg-red-100 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Group
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the group
                    "{group.name}" and remove all data associated with it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeleteGroup} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {['tasks', 'chat', 'members'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-3 font-semibold border-b-2 transition ${activeTab === tab ? 'text-indigo-600 border-indigo-600' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === 'tasks' ? group.tasks.length : tab === 'chat' ? group.chat.length : group.members.length})
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && <TasksTab group={group} currentUser={currentUser} isOwner={isOwner} />}
      {activeTab === 'chat' && <ChatTab
        group={group}
        currentUser={currentUser}
        onMessageSent={(updatedGroup: Group) => {
          // If we are looking at the newly created group, update its state too so the chat shows the new message
          if (newlyCreatedGroup && newlyCreatedGroup.id === updatedGroup.id) {
            setNewlyCreatedGroup(updatedGroup);
          }
        }}
      />}
      {activeTab === 'members' && <MembersTab group={group} currentUser={currentUser} isOwner={isOwner} />}
    </div>
  );
}

function TasksTab({ group, currentUser, isOwner }: any) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    urgent: false,
    dueDate: '',
  });

  const addTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const res = await apiRequest('POST', `/api/groups/${group.id}/tasks`, taskData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups?userId=${currentUser}`] });
      setShowForm(false);
      setFormData({ title: '', description: '', priority: 'medium', urgent: false, dueDate: '' });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await apiRequest('DELETE', `/api/groups/${group.id}/tasks/${taskId}?requesterId=${currentUser}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups?userId=${currentUser}`] });
      toast({ title: "Task deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: "Could not delete task.", variant: "destructive" });
    }
  });

  const handleSubmit = () => {
    if (!formData.title) return;
    addTaskMutation.mutate({
      ...formData,
      createdBy: currentUser,
      status: 'pending'
    });
  };

  const member = group.members.find((m: any) => m.id === currentUser);
  const canManageTasks = member?.role === 'owner' || member?.role === 'admin';

  return (
    <div className="space-y-4" >
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-semibold transition"
      >
        <Plus className="w-4 h-4" />
        Add Task
      </button>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <input
            type="text"
            placeholder="Task title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-4">
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.urgent}
              onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })}
            />
            <span className="text-sm font-semibold text-gray-700">Urgent</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={addTaskMutation.isPending}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold transition"
            >
              {addTaskMutation.isPending ? "Creating..." : "Create"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {group.tasks.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No tasks yet</p>
        ) : (
          group.tasks.map((task: Task) => (
            <div key={task.id} className="bg-white rounded-lg shadow p-4 flex items-start justify-between group/task">
              <div>
                <h4 className="font-semibold text-gray-900">{task.title}</h4>
                <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {task.urgent && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold">Urgent</span>}
                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Priority: {task.priority}</span>
                  {task.dueDate && <span className="text-xs text-gray-500 flex items-center bg-gray-50 px-2 py-1 rounded border border-gray-100">Due: {task.dueDate}</span>}
                  <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded font-medium border border-indigo-100 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Added by: {group.members.find((m: any) => m.id === task.createdBy)?.name || "Unknown"}
                    {task.createdBy === currentUser && " (You)"}
                  </span>
                </div>
              </div>

              {(canManageTasks || task.createdBy === currentUser) && (
                <button
                  onClick={() => deleteTaskMutation.mutate(task.id)}
                  disabled={deleteTaskMutation.isPending}
                  className="p-1 text-gray-400 hover:text-red-500 transition opacity-0 group-hover/task:opacity-100"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div >
  );
}

function ChatTab({ group, currentUser, onMessageSent }: any) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  // We use a ref to track the previous number of messages to detect new ones
  const prevChatLengthRef = useRef(group.chat.length);

  // New Message Notification
  useEffect(() => {
    // Check if new messages arrived
    if (group.chat.length > prevChatLengthRef.current) {
      const lastMsg = group.chat[group.chat.length - 1];

      // If the last message is NOT from me, and not from AI (optional logic), show notification
      if (lastMsg.sender !== currentUser) {
        const senderName = getSenderName(lastMsg.sender);

        // Show a "New message" toast
        toast({
          title: "New Message",
          description: `${senderName} sent a message`,
          duration: 3000,
        });
      }
    }
    // Update ref
    prevChatLengthRef.current = group.chat.length;
  }, [group.chat, currentUser, toast]); // Dependencies ensuring we run when chat updates

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    apiRequest('POST', `/api/groups/${group.id}/typing`, { userId: currentUser, isTyping: false }).catch(() => { });
  };

  // Debounced AI Analysis
  useEffect(() => {
    if (!message.trim() || message.length < 5) {
      setAnalysis(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const result = await analyzeMessage(message);
        setAnalysis(result);
      } catch (err) {
        console.error("AI Analysis error:", err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [message]);

  const handleApplyRewrite = () => {
    if (analysis?.rewritten) {
      setMessage(analysis.rewritten);
      setAnalysis(null);
      toast({
        title: "Message Optimized",
        description: "Replaced with the CalmlyAI version.",
      });
    }
  };

  const lastTypingPingRef = useRef<number>(0);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    // Clear existing local stop-timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Refresh typing status with a simple throttle for server pings
    const now = Date.now();
    if (!isTyping || now - lastTypingPingRef.current > 2000) {
      setIsTyping(true);
      lastTypingPingRef.current = now;
      apiRequest('POST', `/api/groups/${group.id}/typing`, { userId: currentUser, isTyping: true }).catch(() => { });
    }

    // Set a new local timeout to auto-stop if no activity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 7000); // 7 seconds of quiet before we say they stopped
  };

  const handleInputBlur = () => {
    // If they leave the input, stop typing immediately
    stopTyping();
  };

  const addMessageMutation = useMutation({
    mutationFn: async (msgData: any) => {
      // Clear typing status immediately on send
      stopTyping();

      const res = await apiRequest('POST', `/api/groups/${group.id}/messages`, msgData);
      return res.json();
    },
    onSuccess: (updatedGroupFromApi) => {
      // Manually update the groups cache to show the message immediately
      queryClient.setQueryData([`/api/groups?userId=${currentUser}`], (old: Group[] | undefined) => {
        if (!old) return [updatedGroupFromApi];
        return old.map(g => g.id === updatedGroupFromApi.id ? updatedGroupFromApi : g);
      });

      // Notify parent to update newlyCreatedGroup if needed
      if (onMessageSent) {
        onMessageSent(updatedGroupFromApi);
      }

      // Do NOT invalidate queries to avoid the "Loading..." flicker or data loss if server is out of sync
      // queryClient.invalidateQueries({ queryKey: [`/api/groups?userId=${currentUser}`] });
      setMessage('');
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await apiRequest('POST', `/api/groups/${group.id}/messages/${messageId}/read`, { userId: currentUser });
      return res.json();
    },
    onSuccess: (updatedGroup) => {
      // Optimistic cache update
      queryClient.setQueryData([`/api/groups?userId=${currentUser}`], (old: Group[] | undefined) => {
        if (!old) return [updatedGroup];
        return old.map(g => g.id === updatedGroup.id ? updatedGroup : g);
      });

      if (onMessageSent) {
        onMessageSent(updatedGroup);
      }
    }
  });

  // Automatically mark unread messages as read
  useEffect(() => {
    group.chat.forEach((msg: ChatMessage) => {
      // If message is from someone else and I haven't read it yet
      if (msg.sender !== currentUser && !msg.readBy?.includes(currentUser)) {
        markAsReadMutation.mutate(msg.id);
      }
    });
  }, [group.chat, currentUser, group.id]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    addMessageMutation.mutate({
      sender: currentUser,
      content: message,
      type: 'message'
    });
  };

  const getSenderName = (senderId: string) => {
    const member = group.members.find((m: GroupMember) => m.id === senderId);
    return member ? member.name : 'Unknown User';
  };

  // The server now returns names directly in activeTypers
  const activeTyperNames = group.activeTypers || [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4 h-96 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-3 p-2">
          {group.chat.length === 0 ? (
            <p className="text-gray-600 text-center py-12">Start the conversation...</p>
          ) : (
            group.chat.map((msg: ChatMessage) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === currentUser ? 'items-end' : 'items-start'}`}>
                {!msg.isAI && (
                  <span className={`text-xs text-gray-500 mb-1 ${msg.sender === currentUser ? 'mr-1' : 'ml-1'}`}>
                    {getSenderName(msg.sender)}
                  </span>
                )}
                <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.isAI ? 'bg-indigo-100 text-indigo-900 border border-indigo-300' :
                  msg.sender === currentUser ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-900'
                  }`}>
                  {msg.isAI && <p className="text-xs font-semibold mb-1">🤖 AI Coach</p>}
                  <p className="text-sm">{msg.content}</p>
                </div>
                {msg.sender === currentUser && !msg.isAI && (
                  <div className="flex items-center mt-1 mr-1">
                    {msg.readBy && msg.readBy.length > 0 ? (
                      <div
                        className="flex items-center text-indigo-500"
                        title={`Seen by: ${msg.readBy.map(id => id === currentUser ? 'You' : getSenderName(id)).join(', ')}`}
                      >
                        <Check className="w-3 h-3" />
                        <Check className="w-3 h-3 -ml-1.5" />
                        <span className="text-[10px] ml-1 font-semibold opacity-80">
                          Seen by {msg.readBy.length > 1
                            ? `${getSenderName(msg.readBy[0])} +${msg.readBy.length - 1}`
                            : getSenderName(msg.readBy[0]) === 'You' && msg.readBy.length === 1 ? 'Sent' : getSenderName(msg.readBy[0])}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <Check className="w-3 h-3" />
                        <span className="text-[10px] ml-1">Sent</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
        </div>

        {/* Typing Indicator */}
        {activeTyperNames.length > 0 && (
          <div className="py-2 px-2">
            <div className="flex items-center gap-2 text-gray-500 text-sm bg-gray-50 rounded-lg p-2 w-fit">
              <span className="flex gap-1 items-center h-full">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
              </span>
              <span>
                {activeTyperNames.join(", ")} {activeTyperNames.length === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* AI Analysis Preview */}
      {message.trim().length >= 5 && (
        <div className={`p-4 rounded-xl border transition-all duration-300 ${analysis?.conflictRisk > 0.6 ? 'bg-red-50 border-red-200' :
          analysis?.conflictRisk > 0.3 ? 'bg-amber-50 border-amber-200' :
            'bg-indigo-50 border-indigo-200'
          }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className={`w-5 h-5 ${analysis?.conflictRisk > 0.6 ? 'text-red-500' :
                analysis?.conflictRisk > 0.3 ? 'text-amber-500' :
                  'text-indigo-500'
                }`} />
              <span className="font-bold text-sm text-gray-800">CalmlyAI Analysis</span>
            </div>
            {isAnalyzing ? (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Analyzing...
              </div>
            ) : analysis && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Conflict Risk:</span>
                <span className={`text-xs font-bold ${analysis.conflictRisk > 0.6 ? 'text-red-600' :
                  analysis.conflictRisk > 0.3 ? 'text-amber-600' :
                    'text-green-600'
                  }`}>
                  {Math.round(analysis.conflictRisk * 100)}%
                </span>
              </div>
            )}
          </div>

          {!isAnalyzing && analysis && (
            <div className="space-y-4">
              <Progress
                value={analysis.conflictRisk * 100}
                className="h-2"
                indicatorClassName={
                  analysis.conflictRisk > 0.6 ? 'bg-red-500' :
                    analysis.conflictRisk > 0.3 ? 'bg-amber-500' :
                      'bg-green-500'
                }
              />

              {analysis.conflictRisk > 0.4 && (
                <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-indigo-700">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Suggested Rewrite</span>
                  </div>
                  <p className="text-sm text-gray-700 italic mb-3">"{analysis.rewritten}"</p>
                  <button
                    onClick={handleApplyRewrite}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
                  >
                    Use CalmlyAI version
                  </button>
                </div>
              )}

              {analysis.conflictRisk <= 0.4 && analysis.conflictRisk > 0 && (
                <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Your message looks good and respectful!
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Your message..."
          value={message}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleSendMessage}
          disabled={addMessageMutation.isPending}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-semibold transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}

function MembersTab({ group, currentUser, isOwner }: any) {
  const { toast } = useToast();

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await apiRequest('DELETE', `/api/groups/${group.id}/members/${memberId}?requesterId=${currentUser}`);
      const text = await res.text();
      if (!text || !text.trim()) return null;
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse response:", text);
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups?userId=${currentUser}`] });
      toast({ title: "Member removed", description: "The member has been removed from the group." });
    },
    onError: (error: any) => {
      console.error("Remove member error:", error);
      toast({
        title: "Failed to remove member",
        description: error.message || "Could not remove the member.",
        variant: "destructive"
      });
    }
  });

  const leaveMemberMutation = useMutation({
    mutationFn: async () => {
      console.log("Leave group mutation called for user:", currentUser, "in group:", group.id);
      const res = await apiRequest('DELETE', `/api/groups/${group.id}/members/${currentUser}?requesterId=${currentUser}`);
      const text = await res.text();
      if (!text || !text.trim()) return null;
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse response:", text);
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups?userId=${currentUser}`] });
      // Redirect to groups list after leaving
      window.location.href = '/groups';
      toast({ title: "Left group", description: "You have left the group." });
    },
    onError: (error: any) => {
      console.error("Leave group error:", error);
      toast({
        title: "Failed to leave group",
        description: error.message || "Could not leave the group.",
        variant: "destructive"
      });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string; newRole: string }) => {
      console.log("Updating role:", { memberId, newRole, currentUser });
      const res = await apiRequest('PATCH', `/api/groups/${group.id}/members/${memberId}/role`, {
        requesterId: currentUser,
        newRole,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups?userId=${currentUser}`] });
      toast({ title: "Role updated", description: "The member's role has been updated." });
    },
    onError: (error: any) => {
      console.error("Update role error:", error);
      toast({
        title: "Failed to update role",
        description: error.message || "Could not update the role.",
        variant: "destructive"
      });
    }
  });

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from the group?`)) {
      removeMemberMutation.mutate(memberId);
    }
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    console.log("handleRoleChange called:", { memberId, newRole });
    updateRoleMutation.mutate({ memberId, newRole });
  };

  console.log("MembersTab render:", { isOwner, currentUser, groupOwner: group.owner });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Leave Group button for non-owners */}
      {!isOwner && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 px-4 py-2 bg-red-50 rounded-lg hover:bg-red-100 transition font-semibold"
                disabled={leaveMemberMutation.isPending}
              >
                {leaveMemberMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Leaving...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Leave Group
                  </>
                )}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave this group?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to leave "{group.name}"? You will need a new invite link to rejoin.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => leaveMemberMutation.mutate()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Leave Group
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <div className="space-y-3">
        {group.members.map((member: GroupMember) => {
          const isMemberOwner = member.id === group.owner;
          const canManage = isOwner && !isMemberOwner;

          return (
            <div key={member.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{member.name}</p>
                  {isMemberOwner && (
                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded font-semibold">
                      Owner
                    </span>
                  )}
                  {member.id === currentUser && !isMemberOwner && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      You
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{member.email}</p>
              </div>

              <div className="flex items-center gap-3">
                {canManage ? (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      disabled={updateRoleMutation.isPending}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="text-red-600 hover:text-red-700 text-sm font-semibold px-3 py-1 bg-red-50 rounded hover:bg-red-100 transition"
                          disabled={removeMemberMutation.isPending}
                        >
                          Kick
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove {member.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {member.name} from the group? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeMemberMutation.mutate(member.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <span className="text-xs text-gray-500 capitalize px-3 py-1 bg-gray-100 rounded">
                    {member.role}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
