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
//  TIER CONFIG (update routes too):
//    FAST  → Chat(1500, t=0.7), Vocab(3500, t=0.9), Analyze(4500, t=0.3)
//    QUALITY → Schreiben(6000, t=0.2), Exercises(4000, t=0.7)
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
export function getVocabPrompt(opts: {
  level: string;
  theme: { wortfeld: string; context: string; seedWords: string[] };
  requiredTypes: string[];
  excludeWords: string[];
  errorPatterns: string[];
  sessionSeed: number;
}): string {
  const { level, theme, requiredTypes, excludeWords, errorPatterns, sessionSeed } = opts;

  const excludeBlock = excludeWords.length > 0
    ? `\nPALAVRAS JÁ TREINADAS (NÃO repita): ${excludeWords.join(", ")}`
    : "";

  const errorsBlock = errorPatterns.length > 0
    ? `\nERROS FREQUENTES DO ALUNO: ${errorPatterns.join(", ")} — crie pelo menos 1 exercício que trabalhe esses pontos fracos.`
    : "";

  return `Treinador de vocabulário alemão nível ${level} para médico brasileiro.
Objetivo: converter conhecimento PASSIVO em PRODUÇÃO ATIVA com exercícios INTERATIVOS.

WORTFELD DESTA SESSÃO: ${theme.wortfeld}
CONTEXTO: ${theme.context}
PALAVRAS-SEMENTE (use como inspiração, NÃO copie literalmente): ${theme.seedWords.join(", ")}
${excludeBlock}${errorsBlock}

SEED DE VARIAÇÃO: ${sessionSeed}
Use este seed para variar seus exemplos. Cada sessão deve ser ÚNICA.

Crie EXATAMENTE 5 exercícios. TIPOS OBRIGATÓRIOS nesta sessão: ${requiredTypes.join(", ")}. Complete até 5 com tipos livres.

TIPOS DISPONÍVEIS:
1. ptToDe: frase situacional PT-BR → aluno DIGITA tradução completa em alemão
   - SEM campo options (o aluno digita)
   - instruction: "Traduza para alemão"

2. contextGuess: parágrafo de 2-3 frases em alemão com UMA lacuna (___) → aluno CLICA opção
   - OBRIGATÓRIO: options com EXATAMENTE 4 alternativas (1 correta + 3 distratores plausíveis)
   - Distratores devem ser palavras reais do mesmo Wortfeld, mesmo gênero/caso
   - instruction: "Complete a lacuna"

3. collocation: combinação real alemã → aluno CLICA opção correta
   - OBRIGATÓRIO: options com EXATAMENTE 4 alternativas (1 correta + 3 distratores)
   - Prompt: mostre o verbo/nome e peça a preposição/complemento correto
   - instruction: "Escolha a combinação correta"

4. wordFamily: dado um membro da família → aluno DIGITA derivação
   - SEM campo options (o aluno digita)
   - instruction: "Derive a palavra da mesma família"

5. sentenceBuild: frase em alemão desordenada → aluno CLICA palavras na ordem correta
   - OBRIGATÓRIO: scrambledWords com 5-8 palavras embaralhadas (inclua TODAS as palavras da resposta)
   - SEM campo options
   - A answer deve ser a frase completa na ordem correta
   - instruction: "Monte a frase na ordem correta"

CAMPOS DE CADA EXERCÍCIO:
- type: um dos 5 tipos acima
- instruction: instrução curta em PT-BR do que fazer
- prompt: o enunciado do exercício
- answer: resposta correta
- acceptableAnswers: 2-3 variações aceitáveis
- options: APENAS para contextGuess e collocation (array de 4 strings, ordem aleatória)
- scrambledWords: APENAS para sentenceBuild (array de strings embaralhadas)
- hint: dica gramatical ou primeira letra, NUNCA a resposta
- explanation: explicação em PT-BR de POR QUE a resposta é essa (gramática, uso, contexto)
- difficulty: 1 (fácil), 2 (médio) ou 3 (difícil)

REGRAS:
- Todos os exercícios DEVEM estar no Wortfeld "${theme.wortfeld}"
- Prompts de ptToDe: frases completas e situacionais, NUNCA palavras soltas
- explanation: SEMPRE explique raciocínio gramatical/semântico, não apenas "a resposta é X"
- Distratores em options: plausíveis mas claramente incorretos. Evite opções absurdas.
- Os distratores devem testar CONHECIMENTO REAL (mesma classe gramatical, mesmo campo semântico)
- Alterne dificuldades (1, 2, 3) entre os exercícios

WORDWEB: escolha UMA palavra central do Wortfeld + 5-6 conexões (sinônimos, antônimos, compostos, colocações, família). Cada conexão com frase-exemplo.

Responda APENAS em JSON (sem markdown, sem \`\`\`):
{"exercises":[{"type":"tipo","instruction":"instrução PT-BR","prompt":"enunciado","answer":"resposta","acceptableAnswers":["var1","var2"],"options":["a","b","c","d"],"scrambledWords":["word1","word2"],"hint":"dica","explanation":"explicação detalhada PT-BR","difficulty":2}],"wordWeb":{"centerWord":"palavra","related":[{"word":"rel","relation":"tipo","example":"frase completa"}]}}

IMPORTANTE: Para ptToDe e wordFamily, NÃO inclua options nem scrambledWords. Para sentenceBuild, NÃO inclua options. Inclua APENAS os campos pertinentes ao tipo.`;
}


// ── Message Analyzer (FAST · max_tokens: 4500 · temp: 0.3) ──
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


// ── Schreiben Evaluator (QUALITY · max_tokens: 6000 · temp: 0.2) ──
export function getSchreibenPrompt(level: string): string {
  return `Examinador Goethe-Institut para Schreiben Teil 1, nível ${level}. Aluno: médico brasileiro.

AVALIAÇÃO — 4 critérios oficiais (0-5 cada):
- erfuellung: Conteúdo (4 pontos abordados? profundidade?) + Registro (Sie/du, saudação/despedida)
- kohaerenz: Progressão lógica, conectores (deshalb, trotzdem, außerdem), fluidez textual
- wortschatz: Variedade e precisão. Repetitivo=baixo. Vocabulário específico ao tema=alto.
- strukturen: Complexidade (SVO apenas=baixo, Nebensätze+Konjunktiv II=alto) + Correção gramatical

totalScore=soma dos 4. passed=totalScore≥12.

VERSÃO CORRIGIDA: Reescreva o texto aplicando todas as correções, mantendo estilo e nível ${level} do aluno. Não eleve para C1.

CORREÇÕES: Liste TODOS os erros individuais encontrados no texto do aluno. Cada correção com trecho original, versão corrigida, explicação da causa raiz em PT-BR, categoria e subcategoria gramatical.

FEEDBACK em PT-BR:
- detailedFeedback: pontos fortes → problemas principais → caminho de melhoria
- improvementTips: 3 dicas ACIONÁVEIS e específicas (não "melhore a gramática")
- modelPhrases: 4-6 frases-template reutilizáveis em DE — tradução PT-BR

Responda APENAS em JSON (sem markdown):
{"scores":{"erfuellung":{"score":3,"comment":"avaliação PT-BR"},"kohaerenz":{"score":3,"comment":"..."},"wortschatz":{"score":3,"comment":"..."},"strukturen":{"score":3,"comment":"..."}},"totalScore":12,"passed":true,"correctedVersion":"texto corrigido","detailedFeedback":"feedback PT-BR","improvementTips":["dica1","dica2","dica3"],"modelPhrases":["frase DE — tradução PT-BR"],"corrections":[{"original":"trecho errado","corrected":"trecho corrigido","explanation":"causa raiz PT-BR","category":"grammar","subcategory":"Dativ/Akkusativ"}]}`;
}


// ── Grammar Exercise Generator (QUALITY · max_tokens: 4000 · temp: 0.7) ──
// NOTE: Grammar THEORY is now static (src/lib/grammar-lessons.ts).
//       This prompt generates ONLY exercises, called on-demand per student.
export function getGrammatikExercisePrompt(
  topic: GrammarTopic,
  level: string,
  errorPatterns: string[],
): string {
  const errorsBlock =
    errorPatterns.length > 0
      ? `\nERROS RECENTES DESTE ALUNO:\n${errorPatterns.map((e) => `• ${e}`).join("\n")}\nCrie pelo menos 2 exercícios que trabalhem DIRETAMENTE esses pontos fracos.\n`
      : "";

  return `Gerador de exercícios de gramática alemã nível ${level} para médico brasileiro.

TÓPICO: ${topic.title} — ${topic.description}
EXEMPLOS: ${topic.examples.join(" | ")}
DIFICULDADE DO TÓPICO: ${topic.difficulty}/3
${errorsBlock}
Gere EXATAMENTE 8 exercícios progressivos.

TIPOS OBRIGATÓRIOS (use no mínimo 4 tipos diferentes):
- fillBlank: Frase com UMA lacuna (___) para preencher. Instrução: "Complete com..."  
- transform: Transformar uma frase (reestruturar, mudar tempo verbal, voz, etc.)
- errorCorrection: Frase com UM erro gramatical — o aluno identifica e corrige
- translate: Traduzir frase situacional do PT-BR para alemão
- reorder: 5-7 palavras desordenadas → montar frase corretamente
- multipleChoice: Pergunta com 3-4 opções. Forneça em "options"

REGRAS DE DIFICULDADE:
- Exercícios 1-3 (difficulty: 1): Aplicação direta da regra, frases curtas e claras
- Exercícios 4-6 (difficulty: 2): Combinação de regras, frases mais elaboradas
- Exercícios 7-8 (difficulty: 3): Contexto real médico/hospitalar, múltiplas regras

QUALIDADE:
- Pelo menos 2 exercícios em contexto médico/hospitalar
- hint: dica gramatical ou a regra relevante (NUNCA a resposta!)
- acceptableAnswers: 2-3 variações válidas (sinônimos, ordem alternativa)
- explanation: explique POR QUÊ a resposta está correta, em PT-BR
- grammarFocus: especifique qual sub-regra está sendo testada
- NUNCA repita o mesmo padrão de frase em dois exercícios
- Frases devem ser realistas e naturais, não artificiais

Responda APENAS em JSON (sem markdown, sem \`\`\`):
{"exercises":[{"type":"fillBlank","difficulty":1,"instruction":"instrução PT-BR","question":"frase DE com ___","options":["a","b","c"],"answer":"resposta","acceptableAnswers":["var1"],"hint":"dica gramatical","explanation":"explicação PT-BR","grammarFocus":"sub-regra testada"}]}`;
}
