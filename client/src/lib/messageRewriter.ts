import { type MessageAnalysis, type RiskyPhrase } from "@shared/schema";

// Patterns that indicate risky communication
const riskyPatterns = [
  { pattern: /you\s+always/gi, suggestion: "I've noticed that sometimes" },
  { pattern: /you\s+never/gi, suggestion: "It seems like" },
  { pattern: /this\s+is\s+so\s+frustrating/gi, suggestion: "I'm feeling frustrated" },
  { pattern: /you\s+don't\s+care/gi, suggestion: "I feel like my concerns aren't being heard" },
  { pattern: /you're\s+being/gi, suggestion: "I perceive this situation as" },
  { pattern: /why\s+can't\s+you/gi, suggestion: "I would appreciate if we could" },
  { pattern: /!\s*!+/g, suggestion: "." },
  { pattern: /you\s+forgot/gi, suggestion: "I noticed that" },
  { pattern: /you\s+should/gi, suggestion: "It might help if" },
  { pattern: /this\s+is\s+your\s+fault/gi, suggestion: "Let's work together on this" },
];

// Calm rewriting transformations
const calmTransformations = [
  { from: /you\s+always/gi, to: "I've noticed that sometimes you" },
  { from: /you\s+never/gi, to: "It seems like you haven't" },
  { from: /this\s+is\s+so\s+frustrating!/gi, to: "I'm feeling frustrated about this." },
  { from: /you\s+don't\s+care/gi, to: "I feel like my concerns aren't being heard" },
  { from: /you're\s+being\s+(\w+)/gi, to: "I perceive this situation as $1" },
  { from: /why\s+can't\s+you\s+just/gi, to: "I would appreciate if we could" },
  { from: /you\s+forgot\s+to/gi, to: "I noticed that we need to" },
  { from: /you\s+should\s+have/gi, to: "It might have helped if we had" },
  { from: /this\s+is\s+your\s+fault/gi, to: "Let's work together to address this" },
  { from: /!\s*!+/g, to: "." },
];

export function analyzeMessage(message: string): MessageAnalysis {
  const riskyPhrases: RiskyPhrase[] = [];
  let rewritten = message;

  // Find risky phrases
  riskyPatterns.forEach(({ pattern, suggestion }) => {
    const matches = message.matchAll(pattern);
    for (const match of matches) {
      if (match.index !== undefined) {
        riskyPhrases.push({
          text: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          suggestion,
        });
      }
    }
  });

  // Apply calm transformations
  calmTransformations.forEach(({ from, to }) => {
    rewritten = rewritten.replace(from, to);
  });

  // If no transformations were made, provide a gentle version
  if (rewritten === message && message.length > 0) {
    // Add a gentle opening if the message seems direct
    if (!message.toLowerCase().startsWith("i ") && !message.toLowerCase().startsWith("could ")) {
      rewritten = "I wanted to share that " + message.charAt(0).toLowerCase() + message.slice(1);
    }
  }

  return {
    original: message,
    rewritten,
    riskyPhrases,
  };
}

export function rewriteMessage(message: string): string {
  let result = message;

  // Apply calm transformations
  calmTransformations.forEach(({ from, to }) => {
    result = result.replace(from, to);
  });

  // If no transformations were made, provide a gentle version
  if (result === message && message.length > 0) {
    // Add a gentle opening if the message seems direct
    if (!message.toLowerCase().startsWith("i ") && !message.toLowerCase().startsWith("could ")) {
      result = "I wanted to share that " + message.charAt(0).toLowerCase() + message.slice(1);
    }
  }

  return result;
}
