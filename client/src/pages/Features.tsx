import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Bot, ArrowRight, Trash2, Copy } from "lucide-react";
import { analyzeMessage, rewriteMessage } from "@/lib/messageRewriter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Language support
const LANGUAGES = {
  en: { name: "English", flag: "🇬🇧" },
  fr: { name: "Français", flag: "🇫🇷" },
  es: { name: "Español", flag: "🇪🇸" },
};






// Translations
const translations = {
  en: {
    title: "Communication Tools",
    subtitle: "De-escalate conflicts and communicate with clarity using our AI-powered features",
    safeSendTitle: "Message Safety & Rewrite",
    safeSendDesc: "Analyze your message's conflict risk and get an instant calm rewrite. Track your improvement over time.",
    yourMessage: "Your Message",
    safeSendPlaceholder: "You ALWAYS forget to do your tasks! This is so frustrating!",
    analyze: "Analyze & Rewrite",
    conflictRisk: "Conflict Risk Level",
    riskLow: "Low Risk",
    riskMedium: "Medium Risk",
    riskHigh: "High Risk",
    before: "Before",
    after: "After",
    riskyPhrasesFound: "risky phrase found",
    suggestedImprovements: "Suggested Improvements:",
    history: "Message History",
    noHistory: "No messages analyzed yet",
    clear: "Clear History",
    copy: "Copy",
    copied: "Copied!",
    analyzing: "Analyzing...",
    send: "Send",
    conversationsTitle: "Conversations",
    newConversation: "New",
    newConvTitle: "New conversation",
    coachTitle: "CalmlyAI",
    coachDesc: "Get real-time advice on social skills, conflict management, and communication tips.",
    coachWelcome: "Hi! I'm here to help you communicate better. What would you like advice on?",
    startConversation: "Start Conversation",
    hideChat: "Hide Chat",
    askCoach: "Ask me anything about communication...",
    tryAsking: "Try asking about:",
    handlingConflict: "How do I handle conflict better?",
    effectiveApologies: "How do I give effective apologies?",
    manageGroups: "Manage Your Groups",
  },
  fr: {
    title: "Outils de Communication",
    subtitle: "Désamorcez les conflits et communiquez avec clarté en utilisant nos fonctionnalités alimentées par l'IA",
    safeSendTitle: "Sécurité des Messages & Réécriture",
    safeSendDesc: "Analysez le risque de conflit de votre message et obtenez une réécriture calme instantanée. Suivez votre amélioration au fil du temps.",
    yourMessage: "Votre Message",
    safeSendPlaceholder: "Tu OUBLIES TOUJOURS de faire tes tâches! C'est tellement frustrant!",
    analyze: "Analyser & Réécrire",
    conflictRisk: "Niveau de Risque de Conflit",
    riskLow: "Risque Faible",
    riskMedium: "Risque Moyen",
    riskHigh: "Risque Élevé",
    before: "Avant",
    after: "Après",
    riskyPhrasesFound: "phrase risquée trouvée",
    suggestedImprovements: "Améliorations Suggérées:",
    history: "Historique des Messages",
    noHistory: "Aucun message analysé",
    clear: "Effacer l'Historique",
    copy: "Copier",
    copied: "Copié!",
    analyzing: "Analyse...",
    send: "Envoyer",
    conversationsTitle: "Conversations",
    newConversation: "Nouveau",
    newConvTitle: "Nouvelle conversation",
    coachTitle: "CalmlyAI",
    coachDesc: "Obtenez des conseils en temps réel sur les compétences sociales, la gestion des conflits et les conseils de communication.",
    coachWelcome: "Salut ! Je suis là pour t'aider à mieux communiquer. De quoi veux-tu parler ?",
    startConversation: "Commencer une Conversation",
    hideChat: "Masquer le Chat",
    askCoach: "Posez-moi n'importe quelle question sur la communication...",
    tryAsking: "Essayez de demander :",
    handlingConflict: "Comment puis-je mieux gérer les conflits ?",
    effectiveApologies: "Comment présenter des excuses efficaces ?",
    manageGroups: "Gérer Vos Groupes",
  },
  es: {
    title: "Herramientas de Comunicación",
    subtitle: "Desescala conflictos y comunicate con claridad usando nuestras funciones impulsadas por IA",
    safeSendTitle: "Seguridad de Mensajes y Reescritura",
    safeSendDesc: "Analiza el riesgo de conflicto de tu mensaje y obtén una reescritura tranquila instantánea. Sigue tu mejora a lo largo del tiempo.",
    yourMessage: "Su Mensaje",
    safeSendPlaceholder: "¡SIEMPRE olvidas tus tareas! ¡Esto es muy frustrante!",
    analyze: "Analizar y Reescribir",
    conflictRisk: "Nivel de Riesgo de Conflicto",
    riskLow: "Riesgo Bajo",
    riskMedium: "Riesgo Medio",
    riskHigh: "Riesgo Alto",
    before: "Antes",
    after: "Después",
    riskyPhrasesFound: "frase de riesgo encontrada",
    suggestedImprovements: "Mejoras Sugeridas:",
    history: "Historial de Mensajes",
    noHistory: "Sin mensajes analizados",
    clear: "Borrar Historial",
    copy: "Copiar",
    copied: "¡Copiado!",
    analyzing: "Analizando...",
    send: "Enviar",
    conversationsTitle: "Conversaciones",
    newConversation: "Nuevo",
    newConvTitle: "Nueva conversación",
    coachTitle: "CalmlyAI",
    coachDesc: "Obtenga asesoramiento en tiempo real sobre habilidades sociales, gestión de conflictos y consejos de comunicación.",
    coachWelcome: "¡Hola! Estoy aquí para ayudarte a comunicarte mejor. ¿Sobre qué te gustaría recibir consejos?",
    startConversation: "Iniciar Conversación",
    hideChat: "Ocultar Chat",
    askCoach: "Pregúntame cualquier cosa sobre comunicación...",
    tryAsking: "Intenta preguntar sobre:",
    handlingConflict: "¿Cómo puedo manejar mejor los conflictos?",
    effectiveApologies: "¿Cómo puedo pedir disculpas de manera efectiva?",
    manageGroups: "Gestionar Tus Grupos",
  },
};

export default function Features() {
  const [language, setLanguage] = useState("en");
  const [, setLocation] = useLocation();
  const t = translations[language as keyof typeof translations];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);



  return (
    <div className="min-h-screen py-12" id="features-top">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Language Selector */}
        <div className="flex justify-center gap-2 mb-12">
          {Object.entries(LANGUAGES).map(([code, { name, flag }]) => (
            <Button
              key={code}
              variant={language === code ? "default" : "outline"}
              onClick={() => setLanguage(code)}
              className="gap-2"
            >
              {flag} {name}
            </Button>
          ))}
        </div>

        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold">{t.title}</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{t.subtitle}</p>
        </div>

        {/* Features */}
        <div className="space-y-12 max-w-5xl mx-auto">
          <SafeSendAndRewriteFeature language={language} t={t} />
          <SocialSkillsCoachFeature language={language} t={t} />
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Button size="lg" onClick={() => setLocation("/groups")}>
            {t.manageGroups}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* =================== SafeSendAndRewriteFeature =================== */
function SafeSendAndRewriteFeature({ language, t }: any) {
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch history from API
  const { data: history = [] } = useQuery<any[]>({
    queryKey: ['/api/features/safety-checks'],
    queryFn: async () => {
      const res = await fetch('/api/features/safety-checks');
      const data = await res.json();
      console.log('[History] Fetched data:', data);
      console.log('[History] First item:', data[0]);
      return data;
    },
  });

  const saveAnalysisMutation = useMutation({
    mutationFn: async (newAnalysis: any) => {
      const res = await apiRequest('POST', '/api/features/safety-checks', newAnalysis);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/features/safety-checks'] });
    }
  });

  const deleteAnalysisMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('[Delete] Attempting to delete analysis with ID:', id);
      const res = await apiRequest('DELETE', `/api/features/safety-checks/${id}`);
      console.log('[Delete] Response status:', res.status);
      if (!res.ok && res.status !== 204) {
        throw new Error(`Delete failed with status ${res.status}`);
      }
    },
    onSuccess: () => {
      console.log('[Delete] Success - invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['/api/features/safety-checks'] });
      toast({
        title: "Deleted",
        description: "Message removed from history",
      });
    },
    onError: (error) => {
      console.error('[Delete] Error:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      console.log('[Clear] Attempting to clear all history');
      const res = await apiRequest('DELETE', '/api/features/safety-checks');
      console.log('[Clear] Response status:', res.status);
      if (!res.ok && res.status !== 204) {
        throw new Error(`Clear failed with status ${res.status}`);
      }
    },
    onSuccess: () => {
      console.log('[Clear] Success - invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['/api/features/safety-checks'] });
      toast({
        title: "History cleared",
        description: "All messages have been removed",
      });
    },
    onError: (error) => {
      console.error('[Clear] Error:', error);
      toast({
        title: "Error",
        description: "Failed to clear history",
        variant: "destructive",
      });
    }
  });

  const getRiskLevel = (conflictRisk: number) => {
    if (conflictRisk >= 0.7) return { level: "high", color: "bg-destructive", label: t.riskHigh, percentage: 90 };
    if (conflictRisk >= 0.4) return { level: "medium", color: "bg-yellow-500", label: t.riskMedium, percentage: 55 };
    return { level: "low", color: "bg-success", label: t.riskLow, percentage: 20 };
  };

  const handleAnalyzeAndRewrite = async () => {
    if (!message.trim()) return;

    // Optimistic / Local loading state
    // Note: We can also use saveAnalysisMutation.isPending, but we have two async steps (analyze AI + save DB)

    try {
      // 1. Analyze with AI
      const result = await analyzeMessage(message, language);
      const rewritten = await rewriteMessage(message, language);
      const fullAnalysis = { ...result, rewritten, timestamp: new Date() }; // Date for local display

      setAnalysis(fullAnalysis);
      setMessage("");

      // 2. Save to DB
      saveAnalysisMutation.mutate(fullAnalysis);

    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to analyze message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loading = saveAnalysisMutation.isPending;

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const highlightRiskyPhrases = (text: string, riskyPhrases: any[]) => {
    if (!riskyPhrases || riskyPhrases.length === 0) return <span>{text}</span>;
    const parts: any[] = [];
    let lastIndex = 0;
    const sorted = [...riskyPhrases].sort((a: any, b: any) => a.startIndex - b.startIndex);
    sorted.forEach((phrase: any, idx: number) => {
      if (phrase.startIndex > lastIndex) parts.push(<span key={`text-${idx}`}>{text.substring(lastIndex, phrase.startIndex)}</span>);
      parts.push(<mark key={`phrase-${idx}`} className="bg-destructive/20 text-destructive rounded px-1">{phrase.text}</mark>);
      lastIndex = phrase.endIndex;
    });
    if (lastIndex < text.length) parts.push(<span key="text-end">{text.substring(lastIndex)}</span>);
    return <>{parts}</>;
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Card */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2 flex-1">
                <CardTitle className="text-2xl">{t.safeSendTitle}</CardTitle>
                <CardDescription className="text-base">{t.safeSendDesc}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.yourMessage}</label>
                <Textarea
                  placeholder={t.safeSendPlaceholder}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>
              <Button
                onClick={handleAnalyzeAndRewrite}
                className="w-full sm:w-auto"
                disabled={loading}
              >
                {loading ? t.analyzing : t.analyze}
              </Button>
            </div>

            {analysis && (
              <div className="space-y-6 pt-6 border-t">
                {/* Conflict Risk Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{t.conflictRisk}</label>
                    <Badge className={getRiskLevel(analysis.conflictRisk || 0.5).color}>
                      {getRiskLevel(analysis.conflictRisk || 0.5).label}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all ${getRiskLevel(analysis.conflictRisk || 0.5).color}`}
                      style={{ width: `${getRiskLevel(analysis.conflictRisk || 0.5).percentage}%` }}
                    />
                  </div>
                </div>

                {/* Before & After */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Badge variant="destructive">{t.before}</Badge>
                    <Card className="p-4 bg-destructive/5 border-destructive/20">
                      <p className="text-sm leading-relaxed">
                        {highlightRiskyPhrases(analysis.original, analysis.riskyPhrases)}
                      </p>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    <Badge className="bg-success text-success-foreground">{t.after}</Badge>
                    <Card className="p-4 bg-success/5 border-success/20">
                      <p className="text-sm leading-relaxed">{analysis.rewritten}</p>
                    </Card>
                  </div>
                </div>

                {/* Suggestions */}
                {analysis.riskyPhrases.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">{t.suggestedImprovements}</h4>
                    <div className="space-y-2">
                      {analysis.riskyPhrases.map((phrase: any, idx: number) => (
                        <Card key={idx} className="p-3 bg-muted/50">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                            <span className="text-destructive font-medium">"{phrase.text}"</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-success font-medium">"{phrase.suggestion}"</span>
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
      </div>

      {/* History Sidebar */}
      <div>
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t.history}</CardTitle>
              {history.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => clearHistoryMutation.mutate()}
                  disabled={clearHistoryMutation.isPending}
                  className="text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {t.clear}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noHistory}</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((item: any, idx: number) => {
                  const riskLevel = getRiskLevel(item.conflictRisk || 0.5);
                  return (
                    <Card key={item._id || idx} className="p-3 bg-muted/30 text-xs">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className={riskLevel.color} variant="outline">
                            {riskLevel.label}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(item.rewritten, idx);
                              }}
                              className="text-muted-foreground hover:text-foreground transition-colors p-1"
                              title={copied === idx ? t.copied : t.copy}
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                console.log('[Delete Button] Clicked! Item:', item);
                                console.log('[Delete Button] Item _id:', item._id);
                                if (item._id) {
                                  console.log('[Delete Button] Calling mutation with ID:', item._id);
                                  deleteAnalysisMutation.mutate(item._id);
                                } else {
                                  console.error('[Delete Button] No _id found for item:', item);
                                  toast({
                                    title: "Error",
                                    description: "Cannot delete: missing ID",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              disabled={deleteAnalysisMutation.isPending}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="line-clamp-2 text-muted-foreground">{item.original}</p>
                        <p className="line-clamp-2 text-success font-medium">{item.rewritten}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* =================== SocialSkillsCoachFeature (modifié: rename titles) =================== */
function SocialSkillsCoachFeature({ language, t }: any) {
  // UI toggles
  const [isOpen, setIsOpen] = useState(false);

  // Conversations: saved history + possibly an active unsaved conversation
  const [conversations, setConversations] = useState<any[]>([]); // all conversations (saved + active)
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Editing state for renaming a conversation
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState<string>("");

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // localStorage key
  const STORAGE_KEY = "calmly_coach_conversations_v1";

  // Helper: create UUID (fallback)
  const makeId = () => {
    if (typeof crypto !== "undefined" && (crypto as any).randomUUID) return (crypto as any).randomUUID();
    return Math.random().toString(36).slice(2, 9);
  };

  // Generate a local title (≈6-8 words) using keywords & fallback to first words.
  const generateLocalTitle = (text: string, lang: string) => {
    if (!text || !text.trim()) return lang === "fr" ? "Demande de conseil" : "Request for advice";
    const cleaned = text.replace(/\s+/g, " ").trim().replace(/^[^\wÀ-ÖØ-öø-ÿ]+|[^\wÀ-ÖØ-öø-ÿ]+$/g, "");
    const words = cleaned.split(" ").filter(Boolean);
    const first7 = words.slice(0, 7).join(" ");
    // simple keyword mapping (multilang)
    const lowercase = cleaned.toLowerCase();
    const kw = {
      friend: ["ami", "friend", "amigo", "copain", "copine"],
      school: ["école", "school", "colegio", "clase", "homework", "devoir"],
      stress: ["stress", "anx", "angoisse", "anxiété", "anxious", "stressé"],
      girl: ["fille", "girl", "crush", "chérie"],
      parents: ["parents", "maman", "papa", "parent"],
      work: ["travail", "boss", "job", "empleo", "trabajo"],
      group: ["groupe", "group", "friends", "amis", "copains"],
    };

    // check which keyword appears
    let theme: string | null = null;
    for (const [k, list] of Object.entries(kw)) {
      if (list.some((w) => lowercase.includes(w))) {
        theme = k;
        break;
      }
    }

    // templates per theme & language (aim ~7 words)
    const templates: any = {
      fr: {
        friend: "Gérer un conflit récent avec un ami",
        school: "Naviguer une situation compliquée à l'école",
        stress: "Faire face à un stress émotionnel persistant",
        girl: "Comprendre une dynamique difficile avec une fille",
        parents: "Gérer un désaccord avec mes parents",
        work: "Résoudre un problème difficile au travail",
        group: "Gérer une dynamique tendue dans mon groupe",
      },
      en: {
        friend: "Handle a recent conflict with a friend",
        school: "Navigate a complicated situation at school",
        stress: "Coping with ongoing emotional stress",
        girl: "Understand a difficult situation with a girl",
        parents: "Handle a disagreement with my parents",
        work: "Resolve a difficult issue at work",
        group: "Navigate tense dynamics in my group",
      },
      es: {
        friend: "Manejar un conflicto reciente con un amigo",
        school: "Navegar una situación complicada en la escuela",
        stress: "Enfrentar un estrés emocional persistente",
        girl: "Entender una dinámica difícil con una chica",
        parents: "Manejar un desacuerdo con mis padres",
        work: "Resolver un problema difícil en el trabajo",
        group: "Navegar dinámicas tensas en mi grupo",
      },
    };

    if (theme) {
      const langTpl = templates[lang] || templates.en;
      return langTpl[theme] || first7 + (words.length > 7 ? "..." : "");
    }

    // fallback: make it a bit more natural: capitalize and add ellipsis if longer
    const fallback = first7.charAt(0).toUpperCase() + first7.slice(1) + (words.length > 7 ? "..." : "");
    return fallback;
  };

  // Persist saved conversations (only those with saved: true)
  const persistConversations = (allConvs: any[]) => {
    try {
      const toSave = allConvs.filter((c) => c.saved);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error("Failed to save conversations", e);
    }
  };

  // Load conversations on mount:
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : [];
      // saved conversations are considered "saved": true
      const loaded = (saved || []).map((c: any) => ({ ...c, saved: true }));
      // create a new unsaved conversation that user will start in
      const newId = makeId();
      const newConv = {
        id: newId,
        title: t.newConvTitle,
        messages: [{ type: "coach", message: t.coachWelcome }],
        saved: false,
        createdAt: Date.now(),
      };
      setConversations([newConv, ...loaded]);
      setSelectedId(newId);
    } catch (e) {
      console.error("Failed to load conversations", e);
      // fallback to one new conv
      const newId = makeId();
      setConversations([{
        id: newId,
        title: t.newConvTitle,
        messages: [{ type: "coach", message: t.coachWelcome }],
        saved: false,
        createdAt: Date.now(),
      }]);
      setSelectedId(newId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // NEW: Update initial unsaved conversation when language changes
  useEffect(() => {
    setConversations(prev => prev.map(c => {
      // If conversation is not saved, has only 1 message (the welcome message)
      if (!c.saved && c.messages.length === 1 && c.messages[0].type === "coach") {
        return {
          ...c,
          title: t.newConvTitle,
          messages: [{ ...c.messages[0], message: t.coachWelcome }]
        };
      }
      return c;
    }));
  }, [language, t.newConvTitle, t.coachWelcome]);

  // helper to get selected conversation object
  const selectedConv = conversations.find((c) => c.id === selectedId) || null;

  // Coach prompt builder
  const getCoachPrompt = (q: string, lang: string) => {
    const prompts: any = {
      en: `You are a friendly communication coach. Answer this question about communication, relationships, or conflict management in a helpful and supportive way. Keep it concise (1-2 sentences).\n\nQuestion: "${q}"\n\nRespond naturally and helpfully.`,
      fr: `Vous êtes un coach en communication bienveillant. Répondez à cette question sur la communication, les relations ou la gestion des conflits de manière utile et soutenue. Soyez concis (1-2 phrases).\n\nQuestion: "${q}"\n\nRépondez naturellement et utilement.`,
      es: `Eres un entrenador de comunicación amable. Responde esta pregunta sobre comunicación, relaciones o gestión de conflictos de manera útil y solidaria. Sé conciso (1-2 oraciones).\n\nPregunta: "${q}"\n\nResponde naturalmente y útilmente.`,
    };
    return prompts[lang] || prompts.en;
  };

  // Call backend API for coach response
  const callCoachAPI = async (messages: any[]) => {
    try {
      const response = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Map frontend message format to backend expected format if needed, 
        // but backend ai.ts logic I wrote expects {role, content}.
        // Frontend has {type, message}.
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.type, content: m.message })),
          language
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error("Coach API error:", error);
      return language === "fr"
        ? "Désolé, je rencontre des difficultés techniques pour me connecter à mon cerveau. Veuillez réessayer dans un instant."
        : language === "es"
          ? "Lo siento, tengo problemas técnicos para conectar con mi cerebro. Por favor, inténtelo de nuevo en un momento."
          : "Sorry, I'm having technical trouble connecting to my brain right now. Please try again in a moment.";
    }
  };

  // When user asks: add their message, possibly save conversation (title gen) and get reply
  const handleAsk = async () => {
    if (!question.trim()) return;
    if (!selectedId) return;

    setLoading(true);

    // Add user message to selected conv
    const conv = conversations.find((c) => c.id === selectedId);
    if (!conv) {
      setLoading(false);
      return;
    }

    const userMsg = { type: "user", message: question, timestamp: Date.now() };
    const updatedMessages = [...conv.messages, userMsg];
    let updatedConv: any = { ...conv, messages: updatedMessages };

    // If this was the first user message (messages length before adding user was 1 => only coach welcome),
    // then generate a title locally and mark saved.
    const isFirstUserMessage = conv.messages.filter((m: any) => m.type === "user").length === 0;

    if (isFirstUserMessage) {
      const title = generateLocalTitle(question, language);
      updatedConv.title = title;
      updatedConv.saved = true;
      updatedConv.createdAt = Date.now();
    }

    // update conversations state (optimistic)
    setConversations((prev) => prev.map((c) => (c.id === updatedConv.id ? updatedConv : c)));

    // Persist immediately if saved (Fix for persistence issue)
    if (updatedConv.saved) {
      setTimeout(() => {
        persistConversations(
          conversations.map((c) => (c.id === updatedConv.id ? updatedConv : c))
        );
      }, 0);
    }

    // Call coach API for the reply with FULL HISTORY (Fix for context issue)
    const reply = await callCoachAPI(updatedMessages);
    const replyMsg = { type: "coach", message: reply, timestamp: Date.now() };

    const finalMessages = [...updatedMessages, replyMsg];
    const finalConv = { ...updatedConv, messages: finalMessages };

    setConversations((prev) => prev.map((c) => (c.id === finalConv.id ? finalConv : c)));

    // Persist after reply if saved
    if (finalConv.saved) {
      setTimeout(() => {
        persistConversations(
          conversations.map((c) => (c.id === finalConv.id ? finalConv : c))
        );
      }, 0);
    }

    setQuestion("");
    setLoading(false);

    // scroll to bottom
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  // Select a saved conversation from sidebar
  const openConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    setSelectedId(id);
  };

  // Create a brand new conversation (unsaved) and select it
  const newConversation = () => {
    const newId = makeId();
    const conv = {
      id: newId,
      title: t.newConvTitle,
      messages: [{ type: "coach", message: t.coachWelcome }],
      saved: false,
      createdAt: Date.now(),
    };
    setConversations((prev) => [conv, ...prev]);
    setSelectedId(newId);
  };

  // Delete a saved conversation
  const deleteConversation = (id: string) => {
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    persistConversations(remaining);
    // if deleted was selected -> select first available or create new
    if (selectedId === id) {
      const first = remaining[0];
      if (first) setSelectedId(first.id);
      else newConversation();
    }
  };

  // Save (rename) title for a conversation
  const saveTitle = (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setConversations((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, title: trimmed, saved: c.saved ?? true } : c));
      // persist saved ones
      persistConversations(updated);
      return updated;
    });
    setEditingId(null);
    setDraftTitle("");
  };

  // Start editing a conv title
  const startEditing = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    setEditingId(id);
    setDraftTitle(conv.title || "");
    // ensure selected
    setSelectedId(id);
  };

  const firstRender = useRef(true);

  // auto-scroll only on new messages, not on first render
  useEffect(() => {
    // 🚫 Empêche le scroll automatique quand tu es sur /features
    if (location.pathname === "/features") return;
    if (firstRender.current) {
      firstRender.current = false;
      return; // ne pas scroller au montage
    }

    const lastMsg = selectedConv?.messages[selectedConv.messages.length - 1];
    if (!lastMsg) return;

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConv?.messages]);


  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2 flex-1">
            <CardTitle className="text-2xl">{t.coachTitle}</CardTitle>
            <CardDescription className="text-base">{t.coachDesc}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Conversations & Sidebar */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{t.conversationsTitle}</h4>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={newConversation}>{t.newConversation}</Button>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* saved + unsaved conversations */}
              {conversations.map((conv) => {
                const isSelected = conv.id === selectedId;
                const firstUserMsg = conv.messages?.find((m: any) => m.type === "user")?.message || conv.messages?.[0]?.message || "";

                return (
                  <div
                    key={conv.id}
                    className={`p-2 rounded border ${isSelected ? "border-primary" : "border-transparent"} bg-muted/10`}
                    onClick={() => openConversation(conv.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-left flex-1">
                        {editingId === conv.id ? (
                          <input
                            autoFocus
                            className="w-full text-sm border-b border-muted focus:outline-none bg-background p-1 rounded"
                            value={draftTitle}
                            onChange={(e) => setDraftTitle(e.target.value)}
                            onBlur={() => saveTitle(conv.id, draftTitle)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveTitle(conv.id, draftTitle);
                              if (e.key === "Escape") {
                                setEditingId(null);
                                setDraftTitle("");
                              }
                            }}
                          />
                        ) : (
                          <div className="font-medium text-sm line-clamp-2">{conv.title}</div>
                        )}
                        <div className="text-xs text-muted-foreground">{conv.saved ? `${conv.messages.filter((m: any) => m.type === "user").length} messages` : "New"}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(conv.id);
                          }}
                          className="text-muted-foreground hover:text-foreground text-xs px-2"
                          aria-label="Rename conversation"
                        >
                          ✏️
                        </button>

                        {conv.saved && (
                          <button
                            className="text-destructive ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv.id);
                            }}
                            aria-label="Delete conversation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* preview */}
                    <p className="text-xs line-clamp-2 text-muted-foreground mt-2">{firstUserMsg}</p>
                  </div>
                );
              })}

              {conversations.length === 0 && (
                <div className="text-sm text-muted-foreground">No conversations</div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-4 max-h-96 overflow-y-auto p-4 bg-muted/30 rounded-lg">
              {selectedConv?.messages.map((msg: any, idx: number) => (
                <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                  <Card className={`max-w-[80%] p-3 ${msg.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    {msg.timestamp && <p className="text-xs text-muted-foreground mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>}
                  </Card>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <Input
                placeholder={t.askCoach}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleAsk()}
                disabled={loading}
              />
              <Button onClick={handleAsk} disabled={loading}>
                {loading ? "..." : t.send}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t.tryAsking}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestion(t.handlingConflict)}
                >
                  {t.handlingConflict}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestion(t.effectiveApologies)}
                >
                  {t.effectiveApologies}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
