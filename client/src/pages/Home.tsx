import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Shield, ArrowRight, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function HeroSection() {
  const [, setLocation] = useLocation();

  // 🔹 Navigation stable, scroll en haut après navigation
  const handleNavigate = (path: string) => {
    setLocation(path);

    // attendre que la nouvelle page soit chargée
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50); // 50ms suffit généralement
  };

  return (
    <div className="min-h-screen">
      {/* Beta Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 text-center">
        <div className="container mx-auto flex items-center justify-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span className="font-medium">🚀 Beta Version - Your feedback helps us improve!</span>
        </div>
      </div>

      <section className="relative overflow-hidden py-20 sm:py-32 lg:py-40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-success/5"></div>

        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-success/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-purple-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left content */}
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <div className="inline-block">
                  <span className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                    ✨ AI-Powered Communication
                  </span>
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                  <span className="bg-gradient-to-r from-primary via-purple-500 to-success bg-clip-text text-transparent">
                    De-escalate
                  </span>
                  <br />
                  <span>conflicts with</span>
                  <br />
                  <span className="bg-gradient-to-r from-success to-primary bg-clip-text text-transparent">
                    clarity
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                  Transform heated moments into meaningful conversations. CalmlyAI helps you communicate better, resolve conflicts faster, and strengthen relationships.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  className="w-full sm:w-auto group"
                  onClick={() => handleNavigate("/features")}
                >
                  Get early access
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="flex gap-8 pt-8 border-t border-border">
                <div>
                  <div className="text-2xl font-bold">AI-Powered</div>
                  <p className="text-sm text-muted-foreground">Real-time analysis</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">Multilingual</div>
                  <p className="text-sm text-muted-foreground">Any language</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">24/7</div>
                  <p className="text-sm text-muted-foreground">Always available</p>
                </div>
              </div>
            </div>

            {/* Right - Interactive Card */}
            <div className="relative lg:h-[600px] flex items-center justify-center animate-float">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-success/20 rounded-2xl blur-2xl"></div>

                <Card className="relative p-8 backdrop-blur-xl bg-card/80 border border-primary/20 shadow-2xl hover:shadow-primary/20 transition-all duration-500">
                  <div className="space-y-6">

                    {/* Message 1 */}
                    <div className="flex items-start gap-4 animate-slide-in-left" style={{ animationDelay: "0.2s" }}>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/20 border border-destructive/30">
                        <MessageSquare className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
                          <p className="text-sm font-medium text-foreground">
                            You never listen! Stop being so careless!
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground ml-2">Angry tone detected ⚠️</p>
                      </div>
                    </div>

                    {/* Transform label */}
                    <div className="flex justify-center animate-bounce" style={{ animationDelay: "0.4s" }}>
                      <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                        <p className="text-xs font-medium text-primary">CalmlyAI Transform</p>
                      </div>
                    </div>

                    {/* Message 2 */}
                    <div className="flex items-start gap-4 justify-end animate-slide-in-right" style={{ animationDelay: "0.6s" }}>
                      <div className="space-y-2 flex-1">
                        <div className="bg-success/10 rounded-xl p-4 border border-success/30 ml-auto max-w-xs">
                          <p className="text-sm font-medium text-foreground">
                            I feel like my concerns aren't being heard. Can we talk about this?
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mr-2">Calm & respectful ✓</p>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/20 border border-success/30">
                        <Shield className="h-5 w-5 text-success" />
                      </div>
                    </div>

                  </div>
                </Card>

                <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/30 rounded-full blur-3xl opacity-40 animate-pulse"></div>
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-success/30 rounded-full blur-3xl opacity-40 animate-pulse" style={{ animationDelay: "0.5s" }}></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        .animate-slide-in-left { animation: slide-in-left 0.6s ease-out forwards; }
        .animate-slide-in-right { animation: slide-in-right 0.6s ease-out forwards; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}
