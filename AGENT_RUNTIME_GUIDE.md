# Agent Runtime Guide — DeutschTutor Pro

> **Audience:** Qualquer IA que será integrada como provider de respostas em tempo real.
>
> Se você está sendo chamada por uma API para responder a um aluno de alemão,
> este documento define EXATAMENTE como você deve responder.
>
> **Última atualização:** Março 2026

---

## O que você precisa saber em 30 segundos

1. Você recebe um **system prompt** + **mensagem(ns) do usuário**
2. Você DEVE retornar **JSON válido** — nunca texto livre, nunca markdown
3. O JSON deve seguir a **interface TypeScript exata** (documentada abaixo por endpoint)
4. O aluno é um **médico brasileiro** aprendendo **alemão nível Goethe B1**
5. Explicações em **PT-BR**, conteúdo linguístico em **alemão**
6. Se não sabe algo, invente algo pedagogicamente correto — não retorne erro

---

## Endpoints e seus contratos

Você será chamada em um destes 5 contextos. Cada um tem um system prompt
específico e um formato JSON de resposta obrigatório.

---

### Endpoint 1: Chat (Conversação)

**Quando:** O aluno está praticando conversação em um cenário (restaurante, médico, entrevista, etc.)

**System prompt recebido:** Instruções em alemão definindo seu papel no cenário + instruções de formato JSON.

**Você recebe:** Histórico de mensagens (user/assistant) — até 20 mensagens.

**Você retorna:**

```json
{
  "response": "Sua resposta EM ALEMÃO, 2-4 frases, nível B1",
  "translation": "Tradução em português brasileiro",
  "keyVocab": [
    {
      "de": "palavra em alemão",
      "pt": "tradução",
      "example": "Frase de exemplo em alemão"
    }
  ],
  "grammarNote": "Nota gramatical em PT-BR sobre algo que você usou na resposta"
}
```

**Regras:**
- Responda EM ALEMÃO, como o personagem do cenário
- 2-4 frases — não mais (o aluno precisa falar mais que você)
- Termine com uma pergunta para manter a conversa fluindo
- NÃO corrija erros do aluno diretamente — existe um sistema separado para isso
- `keyVocab`: 1-3 palavras relevantes da sua resposta
- `grammarNote`: algo útil sobre uma estrutura que você usou
- Se possível, use vocabulário médico (o aluno é médico)

**max_tokens:** 800

---

### Endpoint 2: Analyze (Análise de mensagem — "Sentence Surgery")

**Quando:** O aluno enviou uma mensagem e quer análise detalhada.

**System prompt recebido:** Instruções em PT-BR para análise linguística profunda.

**Você recebe:** A mensagem do aluno + contexto das últimas 4 mensagens.

**Você retorna:**

```json
{
  "overallQuality": 7,
  "corrections": [
    {
      "original": "o que o aluno escreveu (errado)",
      "corrected": "versão corrigida em alemão",
      "explanation": "Explicação detalhada em PT-BR de POR QUE está errado",
      "category": "grammar",
      "subcategory": "praepositionen"
    }
  ],
  "sentenceSurgery": {
    "studentVersion": "frase exata do aluno",
    "nativeVersion": "como um nativo B2/C1 falaria",
    "differences": [
      "diferença 1 explicada em PT-BR",
      "diferença 2 explicada em PT-BR"
    ]
  },
  "positives": [
    "Aspecto positivo ESPECÍFICO — não genérico como 'bom trabalho'"
  ],
  "vocabularyExpansion": [
    {
      "word": "palavra que o aluno usou",
      "alternatives": ["sinônimo1", "sinônimo2"],
      "collocations": ["combinação comum 1"],
      "wordFamily": ["substantivo", "adjetivo", "verbo relacionados"]
    }
  ],
  "activeRecallChallenge": {
    "type": "reverseTranslation",
    "question": "Pergunta do desafio em PT-BR",
    "answer": "Resposta esperada em alemão",
    "hint": "Dica útil"
  },
  "proficiencySignals": {
    "level": "B1",
    "evidence": "Evidência específica de por que este nível"
  }
}
```

**Regras:**
- `overallQuality`: 1 (muito ruim) a 10 (nativo). Seja justo — B1 com alguns erros = 5-7
- `corrections`: Liste TODOS os erros. Cada correção deve ter explicação detalhada
- `category` deve ser exatamente: `"grammar"`, `"vocabulary"`, `"syntax"`, `"spelling"`, ou `"register"`
- `subcategory`: seja específico — `"dativ_akkusativ"`, `"wortstellung"`, `"konjugation"`, etc.
- `sentenceSurgery`: compare a frase do aluno com a versão nativa — diferenças em PT-BR
- `positives`: coisas ESPECÍFICAS que o aluno fez bem (não "boa tentativa")
- `activeRecallChallenge.type`: `"cloze"`, `"reverseTranslation"`, `"reconstruction"`, ou `"conjugation"`
- Se a mensagem do aluno está perfeita, `corrections` fica vazio e `overallQuality` ≥ 8

**max_tokens:** 1200

---

### Endpoint 3: Schreiben (Avaliação de escrita)

**Quando:** O aluno escreveu um e-mail/texto e quer avaliação nos critérios Goethe B1.

**System prompt recebido:** Instruções em PT-BR com os 4 critérios Goethe.

**Você recebe:** O texto do aluno + instrução da tarefa + 4 pontos + registro (formal/informal).

**Você retorna:**

```json
{
  "scores": {
    "erfuellung": { "score": 4, "comment": "Comentário específico em PT-BR" },
    "kohaerenz": { "score": 3, "comment": "Comentário específico" },
    "wortschatz": { "score": 4, "comment": "Comentário específico" },
    "strukturen": { "score": 3, "comment": "Comentário específico" }
  },
  "totalScore": 14,
  "passed": true,
  "correctedVersion": "Texto COMPLETO reescrito em alemão com melhorias",
  "detailedFeedback": "Feedback detalhado, encorajador e construtivo em PT-BR",
  "improvementTips": [
    "Dica prática 1 em PT-BR",
    "Dica prática 2",
    "Dica prática 3"
  ],
  "modelPhrases": [
    "Ich würde mich freuen, wenn... — Eu ficaria feliz se...",
    "Mit freundlichen Grüßen — Atenciosamente"
  ]
}
```

**Regras:**
- **Critérios Goethe B1 oficiais** — não invente critérios:
  - `erfuellung` (0-5): Todos os 4 pontos abordados? Registro (du/Sie) correto?
  - `kohaerenz` (0-5): Texto fluido, conectado logicamente? Usa conectores?
  - `wortschatz` (0-5): Vocabulário variado e adequado? Evita repetições?
  - `strukturen` (0-5): Gramática correta? Variedade de estruturas?
- `totalScore` = soma dos 4 scores (0-20)
- `passed` = `totalScore >= 12`
- `correctedVersion`: reescreva o texto INTEIRO em alemão, corrigido e melhorado
- `improvementTips`: exatamente 3 dicas práticas e acionáveis
- `modelPhrases`: 2-4 frases modelo úteis com tradução
- Seja JUSTO mas ENCORAJADOR — o aluno está aprendendo, não é nativo

**max_tokens:** 3000

---

### Endpoint 4: Grammatik (Geração de aula)

**Quando:** O aluno quer estudar um tópico de gramática (Nebensätze, Konjunktiv II, etc.)

**System prompt recebido:** Instruções em PT-BR + dados do tópico (título, descrição, exemplos).

**Você recebe:** Pedido para gerar aula completa sobre o tópico.

**Você retorna:**

```json
{
  "explanation": "Explicação clara em PT-BR da regra gramatical, com exemplos em alemão. Compare com português quando ajudar. Use negrito (markdown mínimo) para termos-chave.",
  "exercises": [
    {
      "type": "fillBlank",
      "difficulty": 1,
      "instruction": "Complete a lacuna com a preposição correta (in/an/auf + Dativ ou Akkusativ):",
      "question": "Ich bin ___ Park. (estar no parque)",
      "answer": "im",
      "acceptableAnswers": ["in dem"],
      "hint": "Wo? = Dativ",
      "explanation": "'Wo?' (onde?) pede Dativ. 'im' = 'in dem'"
    },
    {
      "type": "transform",
      "difficulty": 2,
      "instruction": "Transforme para uma oração subordinada com 'weil':",
      "question": "Ich lerne Deutsch. Ich möchte in Deutschland arbeiten.",
      "answer": "Ich lerne Deutsch, weil ich in Deutschland arbeiten möchte.",
      "acceptableAnswers": [],
      "hint": "Lembre: weil envia o verbo conjugado para o final",
      "explanation": "Em Nebensatz com 'weil', o verbo conjugado (möchte) vai para o final da oração."
    }
  ],
  "memoryTip": "Dica mnemônica criativa e memorável em PT-BR para lembrar a regra",
  "commonMistakes": [
    "Brasileiros frequentemente esquecem de mover o verbo para o final em orações com 'weil'",
    "Confundir Dativ e Akkusativ com Wechselpräpositionen: Wo? = Dativ, Wohin? = Akkusativ"
  ]
}
```

**Regras:**
- `explanation`: clara, concisa, em PT-BR com exemplos em alemão
- `exercises`: 4-6 exercícios em ordem PROGRESSIVA de dificuldade (1→2→3)
- `type` deve ser exatamente: `"fillBlank"`, `"transform"`, `"correct"`, `"translate"`, ou `"reorder"`
- `difficulty`: 1 (básico), 2 (intermediário), 3 (avançado)
- `acceptableAnswers`: variações corretas que o sistema aceita (pode ser vazio `[]`)
- `memoryTip`: algo criativo que ajude a lembrar (acrônimo, imagem mental, comparação com PT)
- `commonMistakes`: erros que BRASILEIROS especificamente cometem
- Compare com português sempre que facilitar a compreensão

**max_tokens:** 3000

---

### Endpoint 5: Vocab (Exercícios de vocabulário)

**Quando:** O aluno quer treinar vocabulário com foco em produção ativa.

**System prompt recebido:** Instruções em PT-BR + lista de palavras recentes + padrões de erro.

**Você recebe:** Pedido para gerar 5 exercícios variados + word web.

**Você retorna:**

```json
{
  "exercises": [
    {
      "type": "ptToDe",
      "prompt": "Traduza: 'Eu preciso marcar uma consulta com o médico.'",
      "answer": "Ich muss einen Termin beim Arzt vereinbaren.",
      "acceptableAnswers": [
        "Ich muss einen Arzttermin vereinbaren.",
        "Ich muss einen Termin beim Arzt machen."
      ],
      "hint": "vereinbaren = marcar/agendar",
      "explanation": "'einen Termin vereinbaren' é a colocação padrão para marcar consulta/reunião."
    },
    {
      "type": "contextGuess",
      "prompt": "Der Patient hat starke ___. Er kann kaum laufen. (dor)",
      "answer": "Schmerzen",
      "acceptableAnswers": ["Rückenschmerzen"],
      "hint": "Substantivo plural, muito usado no contexto médico",
      "explanation": "'Schmerzen' (dores) é plural. No singular: 'der Schmerz'."
    }
  ],
  "wordWeb": {
    "centerWord": "der Termin",
    "related": [
      {
        "word": "vereinbaren",
        "relation": "colocação",
        "example": "einen Termin vereinbaren"
      },
      {
        "word": "absagen",
        "relation": "colocação",
        "example": "einen Termin absagen"
      },
      {
        "word": "die Terminvereinbarung",
        "relation": "família",
        "example": "Die Terminvereinbarung ist online möglich."
      }
    ]
  }
}
```

**Regras:**
- `exercises`: exatamente 5 exercícios com tipos VARIADOS
- `type` deve ser exatamente: `"ptToDe"`, `"contextGuess"`, `"collocation"`, `"wordFamily"`, ou `"sentenceBuild"`
- Foque em **PRODUÇÃO ATIVA** — o aluno deve escrever/produzir, não apenas reconhecer
- Evite palavras que o aluno já aprendeu recentemente (lista fornecida no prompt)
- `wordWeb`: rede de uma palavra com 3-6 palavras relacionadas
- `relation` deve ser: `"sinônimo"`, `"antônimo"`, `"colocação"`, `"família"`, ou `"composto"`
- Inclua vocabulário médico quando possível

**max_tokens:** 1500

---

## Validação de resposta

Antes de retornar para o app, sua resposta passa por `safeParseJSON<T>()`:

```typescript
function safeParseJSON<T>(text: string): T | null {
  // 1. Remove ```json ... ``` (code fences)
  // 2. Tenta JSON.parse()
  // 3. Se falhar, tenta extrair JSON com regex /\{[\s\S]*\}/
  // 4. Se tudo falhar, retorna null → sistema usa fallback
}
```

**Portanto:**
- Retornar JSON puro é o melhor (sem code fences)
- Se você acidentalmente colocar code fences, o parser remove
- Se você adicionar texto antes/depois do JSON, o parser tenta extrair
- Mas NÃO confie nisso — retorne APENAS JSON válido

---

## Testes de validação

Se você é uma IA sendo integrada ao sistema, teste estes cenários:

### Teste 1: Chat
**Input:** System prompt de conversação + `[{"role":"user","content":"Hallo, ich möchte einen Termin vereinbaren."}]`
**Esperado:** JSON com `response` (alemão), `translation` (PT-BR), `keyVocab` (array), `grammarNote` (string)

### Teste 2: Analyze
**Input:** System prompt de análise + `"Analise esta mensagem do aluno: 'Ich gehe in den Arzt weil ich bin krank.'"`
**Esperado:** JSON com `corrections` contendo pelo menos 2 erros (preposição + Wortstellung em Nebensatz)

### Teste 3: Schreiben
**Input:** System prompt de Schreiben + texto informal de 100 palavras sobre festa de aniversário
**Esperado:** JSON com 4 scores (0-5 cada), `totalScore`, `passed`, `correctedVersion` (texto completo)

### Teste 4: Grammatik
**Input:** System prompt de gramática sobre Nebensätze + pedido de aula
**Esperado:** JSON com `explanation`, 4-6 `exercises` progressivos, `memoryTip`, `commonMistakes`

### Teste 5: Vocab
**Input:** System prompt de vocabulário + pedido de 5 exercícios
**Esperado:** JSON com exatamente 5 `exercises` com tipos variados + `wordWeb` com 3+ related words

---

## Erros comuns de IAs

| Erro | Impacto | Solução |
|------|---------|---------|
| Retornar texto livre em vez de JSON | Parse falha, fallback genérico | Sempre retornar JSON puro |
| Envolver JSON em ```json ``` | Parser remove, mas evite | Não use code fences |
| Campo faltando no JSON | TypeScript type mismatch | Inclua TODOS os campos |
| `corrections` como string em vez de array | UI quebra | Sempre retorne array, mesmo vazio `[]` |
| `score` como string "4" em vez de number 4 | Cálculos errados | Use tipos numéricos |
| `overallQuality` fora de 1-10 | Exibição estranha | Respeite os ranges |
| Explicações em alemão em vez de PT-BR | Aluno não entende | Explicações SEMPRE em PT-BR |
| Respostas de chat em PT-BR | Aluno não pratica | Respostas de chat SEMPRE em alemão |

---

## Resumo para implementação rápida

Se você está implementando um novo adapter de provider:

1. Aceite `{systemPrompt, messages[], maxTokens}` como input
2. Chame a API do provider com esses parâmetros
3. Pegue o texto de resposta (content[0].text ou choices[0].message.content)
4. Retorne esse texto como string — o app faz o parse
5. Em caso de erro, throw — o app trata e retorna fallback

O app não precisa saber QUAL IA respondeu — apenas precisa do texto JSON.

---

*Documento criado por Claude (Anthropic) — março 2026.*
*Atualize quando novos endpoints de IA forem adicionados ou formatos mudarem.*
