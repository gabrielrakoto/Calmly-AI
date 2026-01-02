import { type Group, type ActivityItem } from "@shared/schema";

export const mockGroups: Group[] = [];

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
};

export const suggestedMessages: Record<string, string[]> = {
  "1": [
    "Hey John, just a friendly reminder about the rent payment due tomorrow. Let me know if you need anything!",
    "Team, don't forget we need to pick up groceries in the next couple of days. Who's available?",
  ],
};
