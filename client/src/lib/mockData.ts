import { type Group, type ActivityItem } from "@shared/schema";

export const mockGroups: Group[] = [
  {
    id: "1",
    name: "Roommates",
    description: "Shared apartment tasks and responsibilities",
    memberCount: 3,
    isPremium: false,
    members: [
      { id: "1", name: "Sarah" },
      { id: "2", name: "John" },
      { id: "3", name: "Alex" },
    ],
    tasks: [
      {
        id: "1",
        title: "Clean kitchen",
        completed: true,
        assignedTo: "Sarah",
        dueDate: "2 hours ago",
        status: "completed",
      },
      {
        id: "2",
        title: "Pay rent",
        completed: false,
        assignedTo: "John",
        dueDate: "tomorrow",
        status: "overdue",
      },
      {
        id: "3",
        title: "Buy groceries",
        completed: false,
        assignedTo: "Team",
        dueDate: "in 2 days",
        status: "pending",
      },
    ],
  },
  {
    id: "2",
    name: "Family",
    description: "Family events and household management",
    memberCount: 5,
    isPremium: true,
    members: [
      { id: "4", name: "Mom" },
      { id: "5", name: "Dad" },
      { id: "6", name: "Emma" },
      { id: "7", name: "Liam" },
      { id: "8", name: "Olivia" },
    ],
    tasks: [
      {
        id: "4",
        title: "Schedule dentist appointment",
        completed: false,
        assignedTo: "Mom",
        dueDate: "this week",
        status: "pending",
      },
      {
        id: "5",
        title: "Plan weekend trip",
        completed: false,
        assignedTo: "Dad",
        dueDate: "in 5 days",
        status: "pending",
      },
      {
        id: "6",
        title: "Homework help",
        completed: true,
        assignedTo: "Emma",
        dueDate: "yesterday",
        status: "completed",
      },
    ],
  },
  {
    id: "3",
    name: "Work Team",
    description: "Project deadlines and team coordination",
    memberCount: 8,
    isPremium: true,
    members: [
      { id: "9", name: "Michael" },
      { id: "10", name: "Rachel" },
      { id: "11", name: "David" },
      { id: "12", name: "Lisa" },
      { id: "13", name: "James" },
      { id: "14", name: "Sophie" },
      { id: "15", name: "Chris" },
      { id: "16", name: "Anna" },
    ],
    tasks: [
      {
        id: "7",
        title: "Submit quarterly report",
        completed: false,
        assignedTo: "Michael",
        dueDate: "today",
        status: "overdue",
      },
      {
        id: "8",
        title: "Client presentation prep",
        completed: false,
        assignedTo: "Rachel",
        dueDate: "in 3 days",
        status: "pending",
      },
      {
        id: "9",
        title: "Code review",
        completed: true,
        assignedTo: "David",
        dueDate: "yesterday",
        status: "completed",
      },
    ],
  },
];

export const mockActivities: Record<string, ActivityItem[]> = {
  "1": [
    {
      id: "a1",
      message: "Sarah completed 'Clean kitchen'",
      timestamp: "2 hours ago",
    },
    {
      id: "a2",
      message: "Task 'Buy groceries' assigned to Team",
      timestamp: "1 day ago",
    },
  ],
  "2": [
    {
      id: "a3",
      message: "Emma completed 'Homework help'",
      timestamp: "1 day ago",
    },
    {
      id: "a4",
      message: "Task 'Plan weekend trip' assigned to Dad",
      timestamp: "2 days ago",
    },
  ],
  "3": [
    {
      id: "a5",
      message: "David completed 'Code review'",
      timestamp: "1 day ago",
    },
    {
      id: "a6",
      message: "Task 'Client presentation prep' assigned to Rachel",
      timestamp: "3 days ago",
    },
  ],
};

export const suggestedMessages: Record<string, string[]> = {
  "1": [
    "Hey John, just a friendly reminder about the rent payment due tomorrow. Let me know if you need anything!",
    "Team, don't forget we need to pick up groceries in the next couple of days. Who's available?",
  ],
  "2": [
    "Hi Mom, gentle reminder about scheduling the dentist appointment this week. Would you like help finding available times?",
  ],
  "3": [
    "Hi Michael, wanted to check in about the quarterly report that's due today. Is there anything I can help with to get it submitted?",
  ],
};
