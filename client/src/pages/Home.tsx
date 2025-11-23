import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Shield, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-success/5 py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight" data-testid="text-hero-title">
                  Proactive conflict resolution with AI
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl" data-testid="text-hero-subtitle">
                  Simplify and de-escalate conflict in your relationships with the help of intelligent mediation
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/features" data-testid="link-explore-features">
                  <Button size="lg" className="w-full sm:w-auto" data-testid="button-get-early-access">
                    Get early access
                  </Button>
                </Link>
              </div>
            </div>

            {/* Illustration */}
            <div className="relative lg:h-[500px] flex items-center justify-center">
              <div className="relative w-full max-w-md">
                <Card className="p-8 backdrop-blur-sm bg-card/50 border-card-border" data-testid="card-hero-illustration">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4" data-testid="container-message-example-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="h-3 bg-muted rounded w-3/4" data-testid="placeholder-text-1"></div>
                        <div className="h-3 bg-muted rounded w-full" data-testid="placeholder-text-2"></div>
                        <div className="h-3 bg-muted rounded w-2/3" data-testid="placeholder-text-3"></div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 pl-14" data-testid="container-message-example-2">
                      <div className="space-y-2 flex-1">
                        <div className="h-3 bg-primary/20 rounded w-full" data-testid="placeholder-response-1"></div>
                        <div className="h-3 bg-primary/20 rounded w-5/6" data-testid="placeholder-response-2"></div>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10">
                        <Shield className="h-5 w-5 text-success" />
                      </div>
                    </div>
                  </div>
                </Card>
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-success/10 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Description Section */}
      <section className="py-20 bg-card/30" data-testid="section-mission-description">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <Card className="p-8 space-y-4" data-testid="card-mission">
              <h2 className="text-2xl font-bold" data-testid="text-mission-title">Mission:</h2>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-mission-description">
                To help everyone communicate better and preserve peace in their relationships
              </p>
            </Card>
            <Card className="p-8 space-y-4" data-testid="card-description">
              <h2 className="text-2xl font-bold" data-testid="text-description-title">Description:</h2>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-description-content">
                CalmlyAI anticipates disagreements and guides everyone towards clearer, more balanced and humane communication.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Key Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful tools to improve your communication
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-6 hover-elevate transition-all space-y-4" data-testid="card-feature-preview-safe-send">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Safe Send Check</h3>
              <p className="text-muted-foreground">
                Get instant feedback on your messages with risky phrases highlighted and calm alternatives suggested.
              </p>
            </Card>
            <Card className="p-6 hover-elevate transition-all space-y-4" data-testid="card-feature-preview-calm-rewrite">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <MessageSquare className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold">Calm Rewrite</h3>
              <p className="text-muted-foreground">
                Transform stressful messages into balanced, emotionally neutral communication instantly.
              </p>
            </Card>
            <Card className="p-6 hover-elevate transition-all space-y-4" data-testid="card-feature-preview-task-groups">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Task Groups</h3>
              <p className="text-muted-foreground">
                Manage shared tasks with gentle reminders and activity tracking for better collaboration.
              </p>
            </Card>
          </div>
          <div className="text-center mt-12">
            <Link href="/features" data-testid="link-explore-all-features">
              <Button size="lg" data-testid="button-explore-all-features">Explore All Features</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
