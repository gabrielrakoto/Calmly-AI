import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, MessageSquare, Bot, ArrowRight } from "lucide-react";
import { analyzeMessage, rewriteMessage } from "@/lib/messageRewriter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Features() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold" data-testid="text-features-title">
            Communication Tools
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            De-escalate conflicts and communicate with clarity using our AI-powered features
          </p>
        </div>

        {/* Features */}
        <div className="space-y-12 max-w-5xl mx-auto">
          <SafeSendCheckFeature />
          <CalmRewriteFeature />
          <SocialSkillsCoachFeature />
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link href="/groups" data-testid="link-manage-groups">
            <Button size="lg">
              Manage Your Groups
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function SafeSendCheckFeature() {
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzeMessage> | null>(null);

  const handleCheck = () => {
    if (message.trim()) {
      const result = analyzeMessage(message);
      setAnalysis(result);
    }
  };

  const highlightRiskyPhrases = (text: string, riskyPhrases: typeof analysis.riskyPhrases) => {
    if (!riskyPhrases || riskyPhrases.length === 0) {
      return <span>{text}</span>;
    }

    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    // Sort by start index to process in order
    const sorted = [...riskyPhrases].sort((a, b) => a.startIndex - b.startIndex);

    sorted.forEach((phrase, idx) => {
      // Add text before this phrase
      if (phrase.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {text.substring(lastIndex, phrase.startIndex)}
          </span>
        );
      }

      // Add highlighted phrase
      parts.push(
        <mark
          key={`phrase-${idx}`}
          className="bg-destructive/20 text-destructive rounded px-1"
        >
          {phrase.text}
        </mark>
      );

      lastIndex = phrase.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(<span key="text-end">{text.substring(lastIndex)}</span>);
    }

    return <>{parts}</>;
  };

  return (
    <Card data-testid="card-safe-send-check">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2 flex-1">
            <CardTitle className="text-2xl">Safe Send Check</CardTitle>
            <CardDescription className="text-base">
              Paste your message and get an instant rewrite in a calm, respectful tone. See risky sentences highlighted with better alternatives.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" data-testid="label-your-message">Your Message</label>
            <Textarea
              placeholder="You ALWAYS forget to do your tasks! This is so frustrating!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] resize-none"
              data-testid="input-safe-send-message"
            />
          </div>
          <Button onClick={handleCheck} className="w-full sm:w-auto" data-testid="button-check-message">
            Check Message
          </Button>
        </div>

        {analysis && (
          <div className="space-y-6 pt-6 border-t">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Before */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" data-testid="badge-before">Before</Badge>
                  {analysis.riskyPhrases.length > 0 && (
                    <span className="text-sm text-muted-foreground" data-testid="text-risky-count">
                      {analysis.riskyPhrases.length} risky phrase{analysis.riskyPhrases.length > 1 ? 's' : ''} found
                    </span>
                  )}
                </div>
                <Card className="p-4 bg-destructive/5 border-destructive/20" data-testid="card-before-message">
                  <p className="text-sm leading-relaxed" data-testid="text-before-message">
                    {highlightRiskyPhrases(analysis.original, analysis.riskyPhrases)}
                  </p>
                </Card>
              </div>

              {/* After */}
              <div className="space-y-3">
                <Badge className="bg-success text-success-foreground" data-testid="badge-after">After</Badge>
                <Card className="p-4 bg-success/5 border-success/20" data-testid="card-after-message">
                  <p className="text-sm leading-relaxed" data-testid="text-after-message">
                    {analysis.rewritten}
                  </p>
                </Card>
              </div>
            </div>

            {/* Suggestions */}
            {analysis.riskyPhrases.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold" data-testid="text-suggestions-title">Suggested Improvements:</h4>
                <div className="space-y-2" data-testid="container-suggestions">
                  {analysis.riskyPhrases.map((phrase, idx) => (
                    <Card key={idx} className="p-3 bg-muted/50" data-testid={`card-suggestion-${idx}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                        <span className="text-destructive font-medium" data-testid={`text-risky-phrase-${idx}`}>"{phrase.text}"</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-success font-medium" data-testid={`text-suggestion-${idx}`}>"{phrase.suggestion}"</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CalmRewriteFeature() {
  const [message, setMessage] = useState("");
  const [rewritten, setRewritten] = useState("");

  const handleRewrite = () => {
    if (message.trim()) {
      const result = rewriteMessage(message);
      setRewritten(result);
    }
  };

  return (
    <Card data-testid="card-calm-rewrite">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/10">
            <MessageSquare className="h-6 w-6 text-success" />
          </div>
          <div className="space-y-2 flex-1">
            <CardTitle className="text-2xl">Calm Rewrite</CardTitle>
            <CardDescription className="text-base">
              Transform stressful, conflict-related messages into balanced, emotionally neutral communication.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" data-testid="label-stressful-message">Stressful Message</label>
            <Textarea
              placeholder="You never listen to me! Why can't you just do what I asked?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] resize-none"
              data-testid="input-calm-rewrite-message"
            />
          </div>
          <Button onClick={handleRewrite} className="w-full sm:w-auto" data-testid="button-rewrite-message">
            Rewrite Message
          </Button>
        </div>

        {rewritten && (
          <div className="space-y-6 pt-6 border-t">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Original */}
              <div className="space-y-3">
                <Badge variant="outline" data-testid="badge-original">Original</Badge>
                <Card className="p-4 bg-muted/30" data-testid="card-original-message">
                  <p className="text-sm leading-relaxed" data-testid="text-original-message">
                    {message}
                  </p>
                </Card>
              </div>

              {/* Rewritten */}
              <div className="space-y-3">
                <Badge className="bg-success text-success-foreground" data-testid="badge-calm-version">Calm Version</Badge>
                <Card className="p-4 bg-success/5 border-success/20" data-testid="card-rewritten-message">
                  <p className="text-sm leading-relaxed" data-testid="text-rewritten-message">
                    {rewritten}
                  </p>
                </Card>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SocialSkillsCoachFeature() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<Array<{ type: 'user' | 'coach', message: string }>>([
    { type: 'coach', message: "Hi! I'm here to help you communicate better. What would you like advice on?" }
  ]);

  const sampleResponses: Record<string, string> = {
    "conflict": "When dealing with conflict, try using 'I' statements instead of 'you' statements. For example, say 'I feel frustrated when...' instead of 'You always...'. This helps express your feelings without blaming the other person.",
    "apology": "A good apology has three parts: 1) Acknowledge what you did, 2) Express genuine regret, and 3) Make amends. For example: 'I realize I didn't listen to your concerns. I'm sorry for dismissing your feelings. How can I make this right?'",
    "default": "Great question! Remember to listen actively, express yourself clearly using 'I' statements, and try to understand the other person's perspective. Would you like specific advice on a particular situation?"
  };

  const handleAsk = () => {
    if (question.trim()) {
      setConversation([...conversation, { type: 'user', message: question }]);
      
      // Simulate coach response
      setTimeout(() => {
        let response = sampleResponses.default;
        const lowerQuestion = question.toLowerCase();
        
        if (lowerQuestion.includes('conflict') || lowerQuestion.includes('argument') || lowerQuestion.includes('fight')) {
          response = sampleResponses.conflict;
        } else if (lowerQuestion.includes('apology') || lowerQuestion.includes('sorry')) {
          response = sampleResponses.apology;
        }
        
        setConversation(prev => [...prev, { type: 'coach', message: response }]);
      }, 500);
      
      setQuestion("");
    }
  };

  return (
    <Card data-testid="card-social-skills-coach">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2 flex-1">
            <CardTitle className="text-2xl">Social Skills Coach</CardTitle>
            <CardDescription className="text-base">
              Get real-time advice on social skills, conflict management, and communication tips.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between" data-testid="button-toggle-coach">
              {isOpen ? "Hide Chat" : "Start Conversation"}
              <ArrowRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-6 space-y-4">
            {/* Chat Messages */}
            <div className="space-y-4 max-h-96 overflow-y-auto p-4 bg-muted/30 rounded-lg" data-testid="container-chat-messages">
              {conversation.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`chat-message-${idx}`}
                >
                  <Card className={`max-w-[80%] p-3 ${
                    msg.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-card'
                  }`} data-testid={`card-chat-${msg.type}-${idx}`}>
                    <p className="text-sm leading-relaxed" data-testid={`text-chat-${msg.type}-${idx}`}>{msg.message}</p>
                  </Card>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Ask me anything about communication..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                data-testid="input-coach-question"
              />
              <Button onClick={handleAsk} data-testid="button-send-question">
                Send
              </Button>
            </div>

            {/* Example Questions */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground" data-testid="text-example-questions-label">Try asking about:</p>
              <div className="flex flex-wrap gap-2" data-testid="container-example-questions">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setQuestion("How do I handle conflict better?")}
                  data-testid="button-example-conflict"
                >
                  Handling conflict
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setQuestion("How do I apologize effectively?")}
                  data-testid="button-example-apology"
                >
                  Effective apologies
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
