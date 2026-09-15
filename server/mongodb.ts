import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';
let databaseConnected = false;

export function isDatabaseAvailable() {
    return databaseConnected;
}

export async function connectDB() {
    try {
        if (!MONGODB_URI) {
            console.warn('MONGODB_URI is not defined. Using in-memory storage.');
            return false;
        }
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        databaseConnected = true;
        console.log('Connected to MongoDB Atlas');
        return true;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        console.warn('Falling back to in-memory storage.');
        databaseConnected = false;
        return false;
    }
}

// Define a simple schema for generic JSON data
const GenericDataSchema = new mongoose.Schema({
    data: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
});

export const GenericData = mongoose.model('GenericData', GenericDataSchema);

const TaskSchema = new mongoose.Schema({
    id: String,
    title: String,
    description: String,
    priority: { type: String, enum: ["low", "medium", "high"] },
    urgent: Boolean,
    dueDate: String,
    assignedTo: String,
    status: { type: String, enum: ["pending", "completed"] },
    createdBy: String
});

const ChatMessageSchema = new mongoose.Schema({
    id: String,
    sender: String,
    content: String,
    timestamp: String,
    isAI: Boolean,
    type: { type: String, enum: ["message", "suggestion", "tip"] },
    readBy: [String]
});

const MemberSchema = new mongoose.Schema({
    id: String,
    name: String,
    role: { type: String, enum: ["owner", "admin", "member"] },
    email: String,
    avatar: String
});

const GroupSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    name: String,
    description: String,
    owner: String,
    members: [MemberSchema],
    tasks: [TaskSchema],
    chat: [ChatMessageSchema],
    createdAt: String,
    inviteToken: { type: String, unique: true },
    maxMembers: Number,
    permissions: {
        canAddTasks: { type: String, enum: ["owner", "admin", "everyone"] }
    },
    // Client user isolation: each group is linked to the browser client that created it
    clientUserId: { type: String, index: true }
});

export const GroupModel = mongoose.model('Group', GroupSchema);

const MessageAnalysisSchema = new mongoose.Schema({
    original: String,
    rewritten: String,
    riskyPhrases: [{
        text: String,
        startIndex: Number,
        endIndex: Number,
        suggestion: String
    }],
    conflictRisk: Number,
    timestamp: { type: Date, default: Date.now },
    // Client user isolation: each analysis is linked to the browser client that created it
    clientUserId: { type: String, index: true }
});

export const MessageAnalysisModel = mongoose.model('MessageAnalysis', MessageAnalysisSchema);
