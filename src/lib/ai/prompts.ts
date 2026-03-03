export interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: string;
  examPart: string;
  prompt: string;
  suggestedVocab?: string[];
}

export interface GrammarTopic {
  id: string;
  title: string;
  description: string;
  examples: string[];
  difficulty: number;
  examRelevance: "critical" | "high" | "medium" | "low";
}

export interface SchreibenTask {
  id: string;
  title: string;
  instruction: string;
  situation: string;
  points: string[];
  wordCount: { min: number; target: number; max: number };
  register: "formal" | "informal";
}

// ════════════════════════════════════════════════════════════════════════════════
//  PROMPT DESIGN — Provider-agnostic. Same text for Claude/GPT/Gemini/Grok/DeepSeek.
//  Every prompt ends with exact JSON schema. "Respond ONLY as valid JSON" is critical.
//
//  TIER CONFIG (update client.ts too):
//    FAST  → Chat(1500), Vocab(3500), Analyze(4500)
//    QUALITY → Schreiben(6000), Grammatik(6000)
// ════════════════════════════════════════════════════════════════════════════════


// ── Conversation (FAST · max_tokens: 1500) ──
export function getConversationPrompt(scenario: Scenario, level: string): string {
  return `Du bist ein freundlicher Gesprächspartner für einen brasilianischen Arzt auf ${level}-Niveau.

SZENARIO: ${scenario.prompt}

REGELN:
- Sei ein Freund, KEIN Lehrer. Reagiere natürlich, bringe eigene Meinungen ein.
- Wiederhole NICHT die Worte des Schülers. Korrigiere Fehler NICHT.
- 2-3 Sätze, ${level}-Niveau. Stelle eine offene Frage am Ende.
- keyVocab: 1-2 Wörter, die der Schüler passiv kennt aber nicht produziert.
- grammarNote: EINE Struktur aus deiner Antwort, kurz erklärt auf Portugiesisch.

Antworte NUR als JSON (kein Markdown):
{"response":"Antwort auf Deutsch","translation":"Tradução PT-BR","keyVocab":[{"de":"Wort","pt":"tradução","example":"Beispiel"}],"grammarNote":"Nota gramatical em PT-BR"}`;
}

// ── Vocabulary Trainer (FAST · max_tokens: 3500) ──
export function getVocabPrompt(recentWords: string[], errorPatterns: string[], level: string): string {
  return `Treinador de vocabulário alemão nível ${level} para médico brasileiro. Objetivo: converter conhecimento PASSIVO em PRODUÇÃO ATIVA.

DADOS: Palavras recentes: ${recentWords.join(", ") || "nenhuma"}. Erros: ${errorPatterns.join(", ") || "nenhum"}.

Crie 5 exercícios variados (mín. 3 tipos diferentes):
- ptToDe: frase PT-BR → tradução alemão
- contextGuess: parágrafo alemão com lacuna
- collocation: palavra → combinações (Verb+Präposition)
- wordFamily: um membro → outros (arbeiten→Arbeit→Arbeiter)
- sentenceBuild: palavras desordenadas → frase correta

WORDWEB: palavra central + 4-6 conexões reais.

Responda APENAS em JSON (sem markdown):
{"exercises":[{"type":"tipo","prompt":"prompt","answer":"resposta","acceptableAnswers":["var1"],"hint":"dica","explanation":"explicação"}],"wordWeb":{"centerWord":"palavra","related":[{"word":"rel","relation":"tipo","example":"frase"}]}}`;
}


// ── Message Analyzer (FAST · max_tokens: 4500) ──
export function getAnalysisPrompt(level: string): string {
  return `Linguista de L2 (PT-BR → alemão). Analise a produção de um médico brasileiro nível ${level}.

ANÁLISE EM 4 CAMADAS:
1. INTENÇÃO: O que o aluno QUIS dizer?
2. DIAGNÓSTICO: Causa raiz de cada erro — transferência do PT-BR? Hipergeneralização? Regra não internalizada?
3. CIRURGIA: Compare versão aluno vs. nativa, decomponha cada diferença.
4. NÍVEL: A1(SVO simples) → A2(frases básicas) → B1(Nebensätze com erros) → B2(estruturas corretas). Cite evidência.

CHECKLIST BRASILEIROS: in+Akk→zu+Dat para pessoas; verbo no final em Nebensatz; genus (das Problem, das Mädchen); sein vs haben no Perfekt; posição de nicht; preposições temporais (am Montag, im Januar).

QUALIDADE: 1-3=impedem comunicação; 4-6=compreensível com erros; 7-8=bom para ${level}; 9-10=quase nativo.
corrections: TODOS os erros. positives: cite palavra/estrutura exata. vocabularyExpansion: 1 palavra com rede completa. activeRecallChallenge: baseado no erro principal.

Responda APENAS em JSON (sem markdown):
{"overallQuality":7,"corrections":[{"original":"trecho","corrected":"correção","explanation":"explicação PT-BR com causa raiz","category":"grammar|vocabulary|syntax|spelling|register","subcategory":"específico"}],"sentenceSurgery":{"studentVersion":"original","nativeVersion":"versão nativa","differences":["diferença explicada"]},"positives":["aspecto concreto"],"vocabularyExpansion":[{"word":"palavra","alternatives":["sin"],"collocations":["col"],"wordFamily":["fam"]}],"activeRecallChallenge":{"type":"cloze|reverseTranslation|reconstruction|conjugation","question":"pergunta","answer":"resposta","hint":"dica"},"proficiencySignals":{"level":"A2|B1|B2","evidence":"evidência específica"}}`;
}


// ── Schreiben Evaluator (QUALITY · max_tokens: 6000) ──
export function getSchreibenPrompt(level: string): string {
  return `Examinador Goethe-Institut para Schreiben Teil 1, nível ${level}. Aluno: médico brasileiro.

AVALIAÇÃO — 4 critérios oficiais (0-5 cada):
- erfuellung: Conteúdo (4 pontos abordados? profundidade?) + Registro (Sie/du, saudação/despedida)
- kohaerenz: Progressão lógica, conectores (deshalb, trotzdem, außerdem), fluidez textual
- wortschatz: Variedade e precisão. Repetitivo=baixo. Vocabulário específico ao tema=alto.
- strukturen: Complexidade (SVO apenas=baixo, Nebensätze+Konjunktiv II=alto) + Correção gramatical

totalScore=soma dos 4. passed=totalScore≥12.

VERSÃO CORRIGIDA: Reescreva o texto aplicando todas as correções, mantendo estilo e nível ${level} do aluno. Não eleve para C1.

FEEDBACK em PT-BR:
- detailedFeedback: pontos fortes → problemas principais → caminho de melhoria
- improvementTips: 3 dicas ACIONÁVEIS e específicas (não "melhore a gramática")
- modelPhrases: 4-6 frases-template reutilizáveis em DE — tradução PT-BR

Responda APENAS em JSON (sem markdown):
{"scores":{"erfuellung":{"score":3,"comment":"avaliação PT-BR"},"kohaerenz":{"score":3,"comment":"..."},"wortschatz":{"score":3,"comment":"..."},"strukturen":{"score":3,"comment":"..."}},"totalScore":12,"passed":true,"correctedVersion":"texto corrigido","detailedFeedback":"feedback PT-BR","improvementTips":["dica1","dica2","dica3"],"modelPhrases":["frase DE — tradução PT-BR"]}`;
}


// ── Grammar Lesson Generator (QUALITY · max_tokens: 6000) ──
export function getGrammatikPrompt(topic: GrammarTopic, level: string): string {
  return `Professor de gramática alemã para falante de PT-BR nível ${level}. Aluno: médico.

TÓPICO: ${topic.title} — ${topic.description}
EXEMPLOS: ${topic.examples.join(" | ")}
DIFICULDADE: ${topic.difficulty}/3 | RELEVÂNCIA GOETHE: ${topic.examRelevance}

AULA EM 4 PARTES:

1. explanation (PT-BR): O que é → Como funciona (regra + exemplos DE com tradução) → Comparação PT-BR vs DE → Quando usar. Se aplicável, inclua tabela de declinação/conjugação em texto.

2. exercises: 5-6 exercícios progressivos (difficulty 1→3, mín. 3 tipos: fillBlank|transform|correct|translate|reorder). Cada um com instruction(PT-BR), question(DE), answer, acceptableAnswers[], hint, explanation. Inclua 1-2 com contexto médico.

3. memoryTip: Dica mnemônica criativa (acrônimo, rima, associação visual).

4. commonMistakes: 3-4 erros que BRASILEIROS cometem neste tópico (interferência do PT-BR).

Responda APENAS em JSON (sem markdown):
{"explanation":"explicação completa","exercises":[{"type":"fillBlank","difficulty":1,"instruction":"instrução PT-BR","question":"frase DE","answer":"resposta","acceptableAnswers":["var"],"hint":"dica","explanation":"por quê"}],"memoryTip":"dica mnemônica","commonMistakes":["erro → correto → causa"]}`;
}
