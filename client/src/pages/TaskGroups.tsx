import React, { useState } from 'react';
import { Plus, Users, MessageSquare, Settings, AlertCircle, Heart, Copy, Check } from 'lucide-react';

// Types
interface GroupMember {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  email?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  urgent: boolean;
  dueDate?: string;
  assignedTo?: string;
  status: 'pending' | 'completed';
  createdBy: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isAI?: boolean;
  type?: 'message' | 'suggestion' | 'tip';
}

interface Group {
  id: string;
  name: string;
  description: string;
  owner: string;
  members: GroupMember[];
  tasks: Task[];
  chat: ChatMessage[];
  createdAt: Date;
  inviteLink: string;
  permissions: {
    canAddTasks: 'owner' | 'admin' | 'everyone';
  };
}

// Main Component
export default function TaskGroupApp() {
  const [currentUser] = useState<string>('user-1');
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeView, setActiveView] = useState<'list' | 'create' | 'group'>('list');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const activeGroup = groups.find(g => g.id === activeGroupId);

  const handleCreateGroup = (groupData: Omit<Group, 'id' | 'tasks' | 'chat' | 'createdAt' | 'inviteLink'>) => {
    const newGroup: Group = {
      ...groupData,
      id: `group-${Date.now()}`,
      tasks: [],
      chat: [],
      createdAt: new Date(),
      inviteLink: `${window.location.origin}?join=${Date.now()}`,
    };
    setGroups([...groups, newGroup]);
    setActiveGroupId(newGroup.id);
    setActiveView('group');
  };

  const handleAddTask = (task: Omit<Task, 'id' | 'createdBy'>) => {
    if (!activeGroup) return;
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdBy: currentUser,
    };
    setGroups(groups.map(g => 
      g.id === activeGroupId 
        ? { ...g, tasks: [...g.tasks, newTask] }
        : g
    ));
  };

  const handleAddMessage = (content: string) => {
    if (!activeGroup) return;
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: currentUser,
      content,
      timestamp: new Date(),
    };
    setGroups(groups.map(g => 
      g.id === activeGroupId
        ? { ...g, chat: [...g.chat, message] }
        : g
    ));
  };

  const handleAddAITip = (tip: ChatMessage) => {
    if (!activeGroup) return;
    setGroups(groups.map(g => 
      g.id === activeGroupId
        ? { ...g, chat: [...g.chat, tip] }
        : g
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    setGroups(groups.map(g => 
      g.id === activeGroupId
        ? { ...g, tasks: g.tasks.filter(t => t.id !== taskId) }
        : g
    ));
  };

  const handleToggleTaskStatus = (taskId: string) => {
    setGroups(groups.map(g => 
      g.id === activeGroupId
        ? {
            ...g,
            tasks: g.tasks.map(t => 
              t.id === taskId
                ? { ...t, status: t.status === 'pending' ? 'completed' : 'pending' }
                : t
            )
          }
        : g
    ));
  };

  const handleCopyInviteLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLinkId(activeGroupId);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-4">
        {activeView === 'list' && (
          <GroupListView
            groups={groups}
            onCreateClick={() => setActiveView('create')}
            onGroupClick={(id) => {
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
          />
        )}

        {activeView === 'group' && activeGroup && (
          <GroupDetailView
            group={activeGroup}
            currentUser={currentUser}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onToggleTaskStatus={handleToggleTaskStatus}
            onAddMessage={handleAddMessage}
            onAddAITip={handleAddAITip}
            onBack={() => setActiveView('list')}
            onCopyInviteLink={handleCopyInviteLink}
            copiedLinkId={copiedLinkId}
          />
        )}
      </div>
    </div>
  );
}

// Group List View
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
          {groups.map(group => (
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
                    onCopyLink(group.inviteLink);
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

// Group Creation Flow
function GroupCreationFlow({ onGroupCreated, onCancel, currentUser }: any) {
  const [step, setStep] = useState<'members' | 'name' | 'description'>('members');
  const [memberCount, setMemberCount] = useState(2);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleNext = () => {
    if (step === 'members') setStep('name');
    else if (step === 'name') setStep('description');
  };

  const handleCreate = () => {
    const members: GroupMember[] = [
      { id: currentUser, name: 'You', role: 'owner' },
      ...Array.from({ length: memberCount - 1 }, (_, i) => ({
        id: `member-${i}`,
        name: `Member ${i + 1}`,
        role: 'member' as const,
      })),
    ];

    onGroupCreated({
      name,
      description,
      owner: currentUser,
      members,
      permissions: { canAddTasks: 'owner' },
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
              <input
                type="range"
                min="1"
                max="20"
                value={memberCount}
                onChange={(e) => setMemberCount(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-center mt-4 text-2xl font-bold text-indigo-600">{memberCount} member{memberCount !== 1 ? 's' : ''}</p>
              <p className="text-xs text-gray-500 text-center mt-2">Free plan: max 5 members | Premium: max 10 | Business: 20+</p>
            </div>
          </div>
        )}

        {step === 'name' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Group Name</label>
              <input
                type="text"
                placeholder="e.g. Project Team, Family, Roommates..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {step === 'description' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Group Description</label>
              <textarea
                placeholder="Describe the context and purpose of the group (family, couple, roommates, project...)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-8">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
          >
            Cancel
          </button>
          {step !== 'description' ? (
            <button
              onClick={handleNext}
              disabled={step === 'name' && !name}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold transition"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={!name}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition"
            >
              Create Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Group Detail View
function GroupDetailView({
  group,
  currentUser,
  onAddTask,
  onDeleteTask,
  onToggleTaskStatus,
  onAddMessage,
  onAddAITip,
  onBack,
  onCopyInviteLink,
  copiedLinkId,
}: any) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'chat' | 'members'>('tasks');
  const isOwner = group.owner === currentUser;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 font-semibold"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
        <button
          onClick={() => onCopyInviteLink(group.inviteLink)}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
        >
          {copiedLinkId === group.id ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Invite
            </>
          )}
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {['tasks', 'chat', 'members'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeTab === tab
                ? 'text-indigo-600 border-indigo-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            {tab === 'tasks' && `Tasks (${group.tasks.length})`}
            {tab === 'chat' && `Chat (${group.chat.length})`}
            {tab === 'members' && `Members (${group.members.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && (
        <TasksTab
          group={group}
          isOwner={isOwner}
          onAddTask={onAddTask}
          onDeleteTask={onDeleteTask}
          onToggleTaskStatus={onToggleTaskStatus}
        />
      )}

      {activeTab === 'chat' && (
        <ChatTab
          group={group}
          currentUser={currentUser}
          onAddMessage={onAddMessage}
          onAddAITip={onAddAITip}
        />
      )}

      {activeTab === 'members' && (
        <MembersTab group={group} isOwner={isOwner} />
      )}
    </div>
  );
}

// Tasks Tab
function TasksTab({ group, isOwner, onAddTask, onDeleteTask, onToggleTaskStatus }: any) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    urgent: false,
    dueDate: '',
    assignedTo: '',
  });

  const handleSubmit = () => {
    if (!formData.title) return;
    onAddTask(formData);
    setFormData({ title: '', description: '', priority: 'medium', urgent: false, dueDate: '', assignedTo: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {isOwner && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-semibold transition"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      )}

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
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold transition"
            >
              Create
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
            <div
              key={task.id}
              className={`bg-white rounded-lg shadow p-4 flex items-start justify-between ${
                task.status === 'completed' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={() => onToggleTaskStatus(task.id)}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <h4 className={`font-semibold ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.title}
                  </h4>
                  {task.urgent && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">Urgent</span>}
                  <span className={`text-xs px-2 py-1 rounded ${
                    task.priority === 'high' ? 'bg-red-100 text-red-700' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-2">{task.description}</p>
                {task.dueDate && <p className="text-xs text-gray-500 mt-1">Due: {task.dueDate}</p>}
              </div>
              {isOwner && (
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="text-red-600 hover:text-red-700 font-semibold ml-4"
                >
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Chat Tab
function ChatTab({ group, currentUser, onAddMessage, onAddAITip }: any) {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (!message.trim()) return;
    onAddMessage(message);
    setMessage('');
  };

  const handleAddAITip = () => {
    const tips = [
      "💡 Use 'I' statements rather than 'you' when expressing feelings.",
      "🤝 Ask questions before judging. Curiosity strengthens relationships.",
      "⏸️ If the discussion heats up, take a step back. A pause can be lifesaving.",
      "👂 Listen really. Often, people just want to be heard.",
      "✨ Recognize others' efforts, even small ones, creates positivity.",
      "🌟 Assume good intentions. Most people are trying their best.",
      "💬 Say thank you more often. Gratitude transforms relationships.",
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    onAddAITip({
      id: `tip-${Date.now()}`,
      sender: 'AI Coach',
      content: randomTip,
      timestamp: new Date(),
      isAI: true,
      type: 'tip',
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4 h-96 overflow-y-auto space-y-3">
        {group.chat.length === 0 ? (
          <p className="text-gray-600 text-center py-12">Start the conversation...</p>
        ) : (
          group.chat.map((msg: ChatMessage) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === currentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.isAI
                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                    : msg.sender === currentUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {msg.isAI && <p className="text-xs font-semibold mb-1">🤖 AI Coach</p>}
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleSendMessage}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-semibold transition"
        >
          Send
        </button>
      </div>

      <button
        onClick={handleAddAITip}
        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
      >
        <AlertCircle className="w-4 h-4" />
        Daily AI Tip
      </button>
    </div>
  );
}

// Members Tab
function MembersTab({ group, isOwner }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-3">
        {group.members.map((member: GroupMember) => (
          <div key={member.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
            <div>
              <p className="font-semibold text-gray-900">{member.name}</p>
              <p className="text-sm text-gray-600">{member.email || 'Email not provided'}</p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
              member.role === 'owner' ? 'bg-purple-100 text-purple-700' :
              member.role === 'admin' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {member.role === 'owner' ? 'Owner' : member.role === 'admin' ? 'Admin' : 'Member'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}