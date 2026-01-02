import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Database, Trash2, User } from "lucide-react";

interface SavedData {
    _id: string;
    data: {
        text: string;
        testerName?: string;
        source: string;
        [key: string]: any;
    };
    createdAt: string;
}

export default function BetaTesters() {
    const [content, setContent] = useState("");
    const [testerName, setTesterName] = useState("");
    const [dataList, setDataList] = useState<SavedData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const { toast } = useToast();

    // Load all data from backend
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/get");
            if (!response.ok) throw new Error("Failed to fetch data");
            const data = await response.json();
            setDataList(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Could not load data from MongoDB",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Run on mount
    useEffect(() => {
        fetchData();
    }, []);

    // Save new data
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !testerName.trim()) {
            toast({
                title: "Missing Info",
                description: "Please provide both your name and a message.",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: content,
                    testerName: testerName,
                    source: "Beta Page"
                }),
            });

            if (!response.ok) throw new Error("Failed to save data");

            toast({
                title: "Success",
                description: "Your feedback has been saved to Atlas!",
            });

            setContent(""); // Clear message input (keep name for convenience)
            fetchData(); // Refresh list
        } catch (error: any) {
            toast({
                title: "Save Error",
                description: error.message || "Failed to save data. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Delete data
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this entry?")) return;

        setIsDeleting(id);
        try {
            const response = await fetch(`/api/delete/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete entry");

            toast({
                title: "Deleted",
                description: "Entry removed from MongoDB Atlas.",
            });

            fetchData(); // Refresh list
        } catch (error: any) {
            toast({
                title: "Delete Error",
                description: error.message || "Failed to delete entry.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="min-h-screen py-12 bg-slate-50/50">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-12 space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        Beta Tester Hub
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Help us refine CalmlyAI by sharing your thoughts directly to our cloud database.
                    </p>
                </div>

                <div className="grid gap-8">
                    {/* Form Card */}
                    <Card className="border-2 border-primary/10 shadow-lg overflow-hidden">
                        <div className="bg-primary/5 px-6 py-2 text-xs font-semibold text-primary uppercase tracking-wider">
                            Live Connection: MongoDB Atlas
                        </div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5 text-primary" />
                                Submit Feedback
                            </CardTitle>
                            <CardDescription>
                                Tell us who you are and what you think about the app.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid sm:grid-cols-[200px_1fr] gap-4">
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={testerName}
                                            onChange={(e) => setTesterName(e.target.value)}
                                            placeholder="Your Name"
                                            disabled={isSaving}
                                            className="pl-9 bg-white"
                                        />
                                    </div>
                                    <Input
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Describe your experience or suggest a feature..."
                                        disabled={isSaving}
                                        className="flex-1 bg-white"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isSaving || !content.trim() || !testerName.trim()} className="w-full sm:w-auto">
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save to Cloud
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* List Card */}
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
                            <div>
                                <CardTitle>Live Data Stream</CardTitle>
                                <CardDescription>
                                    Recently saved documents from all beta testers.
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {isLoading && dataList.length === 0 ? (
                                <div className="flex flex-col items-center py-12 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                    <p>Connecting to Atlas...</p>
                                </div>
                            ) : dataList.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <p>No data found in the collection.</p>
                                    <p className="text-sm">Be the first to save something!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {dataList.map((item) => (
                                        <div
                                            key={item._id}
                                            className="group relative flex flex-col p-4 rounded-xl bg-white border border-slate-200 hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-muted-foreground bg-slate-100 px-2 py-1 rounded">
                                                        ID: {item._id}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                                                        <User className="h-3 w-3" />
                                                        {item.data?.testerName || "Anonymous"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(item.createdAt).toLocaleString()}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDelete(item._id)}
                                                        disabled={isDeleting === item._id}
                                                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                                        title="Delete entry"
                                                    >
                                                        {isDeleting === item._id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-slate-800 font-medium pr-10">
                                                {typeof item.data === 'string'
                                                    ? item.data
                                                    : item.data?.text || JSON.stringify(item.data)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
