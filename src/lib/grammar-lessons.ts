// ════════════════════════════════════════════════════════════════════════════════
//  STATIC GRAMMAR LESSONS — Pre-written, zero API calls.
//  Each lesson is a comprehensive, self-contained grammar reference for B1
//  Brazilian Portuguese speakers studying German for medical purposes.
//
//  Exercises are NOT included here — they are generated on-demand by AI
//  via /api/grammatik/exercises, personalized to the student's error patterns.
// ════════════════════════════════════════════════════════════════════════════════

export interface LessonSection {
  title: string;
  content: string;
}

export interface LessonExample {
  de: string;
  pt: string;
  note?: string;
}

export interface LessonTable {
  caption: string;
  headers: string[];
  rows: string[][];
}

export interface LessonMistake {
  wrong: string;
  right: string;
  why: string;
}

export interface StaticGrammarLesson {
  topicId: string;
  sections: LessonSection[];
  examples: LessonExample[];
  tables?: LessonTable[];
  tip: string;
  mistakes: LessonMistake[];
}

// ────────────────────────────────────────────────────────────────────────────────

const LESSONS: Record<string, StaticGrammarLesson> = {

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  1. PERFEKT vs. PRÄTERITUM                                  ║
  // ╚══════════════════════════════════════════════════════════════╝
  "perfekt-praeteritum": {
    topicId: "perfekt-praeteritum",
    sections: [
      {
        title: "Dois passados, duas funções",
        content: `O alemão tem dois tempos verbais para o passado que brasileiros frequentemente confundem, já que em português usamos "fiz" e "tenho feito" com significados diferentes. Em alemão, a escolha entre Perfekt e Präteritum NÃO depende de aspecto temporal — depende de CONTEXTO DE USO.

O Perfekt (ich habe gemacht / ich bin gegangen) é o passado da FALA. Usado em conversas, e-mails informais, interações do dia a dia. Quando um paciente descreve sintomas, ele usa Perfekt: "Ich habe Schmerzen gehabt."

O Präteritum (ich machte / ich ging) é o passado da ESCRITA. Usado em narrativas, relatórios, textos formais e notícias. Prontuários médicos frequentemente usam Präteritum: "Der Patient klagte über Kopfschmerzen."`
      },
      {
        title: "haben ou sein? A regra do movimento",
        content: `A maioria dos verbos forma o Perfekt com "haben". Use "sein" quando o verbo indica:

• Mudança de LUGAR: gehen → ist gegangen, fahren → ist gefahren, kommen → ist gekommen
• Mudança de ESTADO: einschlafen → ist eingeschlafen, sterben → ist gestorben, aufwachen → ist aufgewacht
• Os verbos sein, werden, bleiben: ist gewesen, ist geworden, ist geblieben

Dica médica: verbos de mudança de estado são especialmente comuns em contexto clínico: "Der Patient ist gestern aufgewacht" (O paciente acordou ontem), "Die Schwellung ist zurückgegangen" (O inchaço diminuiu).`
      },
      {
        title: "Exceções importantes",
        content: `Alguns verbos SEMPRE usam Präteritum, mesmo na fala. São os verbos modais (konnte, musste, sollte, durfte, wollte) e os auxiliares (war, hatte). Ninguém diz "Ich habe gekonnt" em conversação — diz "Ich konnte".

Na região sul da Alemanha, Áustria e Suíça, o Perfekt domina até em situações onde o norte usaria Präteritum. Isso significa que, se você aprender bem o Perfekt, será compreendido em toda a região germanófona.`
      },
    ],
    examples: [
      { de: "Ich habe gestern den Patienten untersucht.", pt: "Eu examinei o paciente ontem.", note: "Perfekt — fala/conversa" },
      { de: "Der Arzt untersuchte den Patienten.", pt: "O médico examinou o paciente.", note: "Präteritum — relatório/prontuário" },
      { de: "Sie ist ins Krankenhaus gefahren.", pt: "Ela foi ao hospital.", note: "sein + Partizip II (mudança de lugar)" },
      { de: "Er hatte hohes Fieber.", pt: "Ele tinha febre alta.", note: "Präteritum com haben (sempre, mesmo na fala)" },
      { de: "Der Patient ist eingeschlafen.", pt: "O paciente adormeceu.", note: "sein (mudança de estado)" },
      { de: "Ich konnte nicht schlafen.", pt: "Eu não conseguia dormir.", note: "Modal no Präteritum (sempre, mesmo na fala)" },
    ],
    tip: "Pense assim: se você está FALANDO com alguém → Perfekt. Se está ESCREVENDO um relatório → Präteritum. Exceções: war, hatte e os modais (konnte, musste...) SEMPRE Präteritum, mesmo falando.",
    mistakes: [
      { wrong: "Ich bin den Patienten untersucht.", right: "Ich habe den Patienten untersucht.", why: "Untersuchen não indica mudança de lugar nem de estado → usa haben. Brasileiros confundem porque 'ir examinar' sugere movimento." },
      { wrong: "Ich habe ins Kino gegangen.", right: "Ich bin ins Kino gegangen.", why: "Gehen indica mudança de lugar → usa sein. Erro por transferência do PT-BR onde sempre usamos 'ter' como auxiliar." },
      { wrong: "Er hat gekonnt das machen.", right: "Er konnte das machen.", why: "Verbos modais usam Präteritum na fala, não Perfekt. O Perfekt de modais é raro e tem estrutura diferente." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  2. KONJUNKTIV II                                           ║
  // ╚══════════════════════════════════════════════════════════════╝
  "konjunktiv-ii": {
    topicId: "konjunktiv-ii",
    sections: [
      {
        title: "O subjuntivo alemão",
        content: `O Konjunktiv II é o equivalente ao nosso subjuntivo imperfeito ("se eu pudesse", "eu gostaria"). Em alemão, ele tem dois usos principais:

1. DESEJOS e CONDIÇÕES IRREAIS: "Wenn ich Arzt wäre, würde ich..." (Se eu fosse médico, eu...)
2. POLIDEZ: "Könnten Sie mir helfen?" (O senhor poderia me ajudar?)

Para brasileiros, o Konjunktiv II é relativamente intuitivo porque usamos o subjuntivo de forma parecida. A diferença é que o alemão tem formas próprias que precisam ser memorizadas.`
      },
      {
        title: "Duas formas: direta e com würde",
        content: `Existem duas maneiras de formar o Konjunktiv II:

FORMA COM WÜRDE (padrão para maioria dos verbos):
würde + infinitivo: "Ich würde gern nach Brasilien fliegen." (Eu gostaria de voar para o Brasil)

FORMA DIRETA (obrigatória para verbos frequentes):
sein → wäre, haben → hätte, können → könnte, müssen → müsste, dürfen → dürfte, sollen → sollte, wollen → wollte, wissen → wüsste, gehen → ginge, kommen → käme, geben → gäbe, brauchen → bräuchte

Na prática: use a forma direta para sein, haben e os modais. Para todos os outros verbos, use würde + infinitivo. Você será compreendido perfeitamente.`
      },
      {
        title: "Frases condicionais com wenn",
        content: `A estrutura condicional irreal segue o padrão:

Wenn + [sujeito] + ... + [Konj. II conjugado no FINAL], [Konj. II/würde] + [sujeito] + ... + [infinitivo].

"Wenn ich mehr Zeit hätte, würde ich mehr Deutsch lernen."
(Se eu tivesse mais tempo, eu aprenderia mais alemão.)

O wenn pode ser omitido — nesse caso, o verbo vai para a posição 1:
"Hätte ich mehr Zeit, würde ich mehr Deutsch lernen."
(Tivesse eu mais tempo, aprenderia mais alemão.)

Contexto médico: "Wenn der Patient früher gekommen wäre, hätten wir die Fraktur vermeiden können." (Se o paciente tivesse vindo antes, poderíamos ter evitado a fratura.)`
      },
    ],
    examples: [
      { de: "Ich hätte gern einen Kaffee.", pt: "Eu gostaria de um café.", note: "Polidez com hätte" },
      { de: "Könnten Sie das bitte wiederholen?", pt: "O senhor poderia repetir, por favor?", note: "Polidez com könnte" },
      { de: "Wenn ich reich wäre, würde ich eine Klinik eröffnen.", pt: "Se eu fosse rico, abriria uma clínica.", note: "Condição irreal" },
      { de: "An Ihrer Stelle würde ich einen Spezialisten aufsuchen.", pt: "No seu lugar, eu procuraria um especialista.", note: "Conselho com würde" },
      { de: "Es wäre besser, wenn Sie morgen wiederkämen.", pt: "Seria melhor se o senhor voltasse amanhã.", note: "wäre + wenn + Konj. II" },
      { de: "Ich müsste eigentlich noch die Befunde prüfen.", pt: "Eu deveria na verdade ainda verificar os resultados.", note: "Obrigação suavizada com müsste" },
    ],
    tables: [
      {
        caption: "Formas essenciais do Konjunktiv II",
        headers: ["Infinitivo", "Konjunktiv II", "Tradução"],
        rows: [
          ["sein", "wäre", "fosse/seria"],
          ["haben", "hätte", "tivesse/teria"],
          ["können", "könnte", "pudesse/poderia"],
          ["müssen", "müsste", "devesse/deveria"],
          ["dürfen", "dürfte", "tivesse permissão"],
          ["sollen", "sollte", "devesse"],
          ["wollen", "wollte", "quisesse"],
          ["wissen", "wüsste", "soubesse"],
          ["geben", "gäbe", "desse/houvesse"],
          ["kommen", "käme", "viesse"],
        ],
      },
    ],
    tip: "Para polidez no dia a dia, memorize estas 3 frases e adapte: \"Könnten Sie...?\" (poderia...?), \"Ich hätte gern...\" (eu gostaria de...) e \"Würden Sie bitte...?\" (faria o favor de...?). Com essas 3, você cobre 90% das situações.",
    mistakes: [
      { wrong: "Wenn ich wäre Arzt, ich würde...", right: "Wenn ich Arzt wäre, würde ich...", why: "Na oração com wenn, o verbo conjugado vai para o FINAL. Na oração principal, o verbo (würde) fica na posição 2 com inversão." },
      { wrong: "Ich könnte gern einen Kaffee.", right: "Ich hätte gern einen Kaffee.", why: "Para pedir algo que você QUER, use hätte (teria). Könnte é para CAPACIDADE (poderia). Em PT-BR usamos 'queria' para ambos, mas em alemão são distintos." },
      { wrong: "Wenn ich Arzt bin, würde ich...", right: "Wenn ich Arzt wäre, würde ich...", why: "Condição irreal exige Konjunktiv II em AMBAS as orações. Usar indicativo (bin) torna a frase factual, não hipotética." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  3. NEBENSÄTZE                                              ║
  // ╚══════════════════════════════════════════════════════════════╝
  "nebensaetze": {
    topicId: "nebensaetze",
    sections: [
      {
        title: "A regra fundamental: verbo no final",
        content: `Nebensätze (orações subordinadas) são a estrutura mais importante do alemão intermediário. A regra é simples e absoluta: quando uma oração começa com uma conjunção subordinativa, o verbo conjugado vai para o FINAL da oração.

Em português, dizemos "Eu vou porque eu quero" — o verbo fica no meio. Em alemão: "Ich gehe, weil ich das will" — o verbo "will" vai para o final, depois de tudo.

Isso é o conceito mais difícil para brasileiros porque nossa ordem é SVO em todas as orações. Em alemão, a subordinada inverte para SOV (sujeito-objeto-verbo).`
      },
      {
        title: "As conjunções essenciais para B1",
        content: `Conjunções CAUSAIS (por quê?):
• weil — porque (causa): "..., weil ich krank bin." (porque estou doente)
• da — já que/como (causa conhecida, mais formal): "Da er Arzt ist, kennt er sich aus."

Conjunções TEMPORAIS (quando?):
• wenn — quando/se (ações repetidas ou futuro): "Wenn ich nach Hause komme, ..."
• als — quando (evento ÚNICO no passado): "Als ich ein Kind war, ..."
• bevor/ehe — antes de: "Bevor Sie die Tablette nehmen, ..."
• nachdem — depois de: "Nachdem der Arzt kam, ..."
• während — enquanto: "Während ich warte, ..."
• seit/seitdem — desde que: "Seitdem ich in Deutschland bin, ..."

Conjunções CONDICIONAIS/CONCESSIVAS:
• wenn — se (condição): "Wenn Sie Fieber haben, ..."
• obwohl/obgleich — embora: "Obwohl er krank ist, arbeitet er."
• falls — caso: "Falls Sie Fragen haben, ..."

Outras essenciais:
• dass — que: "Ich glaube, dass er recht hat."
• ob — se (pergunta indireta): "Ich weiß nicht, ob er kommt."
• damit — para que: "Ich lerne Deutsch, damit ich in Deutschland arbeiten kann."`
      },
      {
        title: "Posição na frase e a vírgula",
        content: `Toda Nebensatz é separada por vírgula. A posição da subordinada pode ser:

DEPOIS da principal: "Ich bleibe zu Hause, weil ich krank bin."
ANTES da principal: "Weil ich krank bin, bleibe ich zu Hause."

Quando a subordinada vem ANTES, ela ocupa a posição 1 inteira da frase principal. Isso causa inversão: o verbo da principal fica na posição 2 e o sujeito vem depois: "Weil ich krank bin, BLEIBE ICH zu Hause."

Quando há verbos separáveis ou compostos, o verbo conjugado vai para o final e o prefixo/infinitivo fica junto: "..., weil ich morgen früh aufstehen muss." (porque eu preciso acordar cedo amanhã).`
      },
    ],
    examples: [
      { de: "Ich lerne Deutsch, weil ich in Deutschland arbeiten möchte.", pt: "Eu aprendo alemão porque quero trabalhar na Alemanha.", note: "weil + verbo no final" },
      { de: "Als ich in Brasilien war, habe ich als Arzt gearbeitet.", pt: "Quando eu estava no Brasil, trabalhei como médico.", note: "als (evento único passado)" },
      { de: "Obwohl der Patient Fieber hatte, wollte er nach Hause.", pt: "Embora o paciente tivesse febre, queria ir para casa.", note: "obwohl + inversão na principal" },
      { de: "Ich weiß nicht, ob die Ergebnisse schon da sind.", pt: "Não sei se os resultados já chegaram.", note: "ob (pergunta indireta)" },
      { de: "Bevor Sie das Medikament nehmen, lesen Sie den Beipackzettel.", pt: "Antes de tomar o medicamento, leia a bula.", note: "bevor + imperativo na principal" },
      { de: "Nachdem die OP beendet war, wurde der Patient auf die Station verlegt.", pt: "Depois que a cirurgia terminou, o paciente foi transferido para a enfermaria.", note: "nachdem + Plusquamperfekt" },
    ],
    tip: "Quando estiver em dúvida sobre a ordem, pense na subordinada como uma CAIXA: tudo entra dentro (sujeito, objetos, advérbios) e o verbo conjugado é a TAMPA que fecha a caixa no final. Wenn ich [morgen] [nach der Arbeit] [ins Kino] [gehen] WILL.",
    mistakes: [
      { wrong: "..., weil ich bin krank.", right: "..., weil ich krank bin.", why: "O verbo conjugado DEVE ir para o final na subordinada. Em PT-BR o verbo fica no meio, mas em alemão a conjunção 'empurra' o verbo para o fim." },
      { wrong: "Weil ich krank bin, ich bleibe zu Hause.", right: "Weil ich krank bin, bleibe ich zu Hause.", why: "Quando a subordinada vem antes, ela ocupa a posição 1. O verbo da principal deve ficar na posição 2 (inversão)." },
      { wrong: "Als ich war Kind...", right: "Als ich ein Kind war...", why: "Mesmo com als, o verbo vai para o final da subordinada." },
      { wrong: "Ich weiß nicht, wenn er kommt.", right: "Ich weiß nicht, ob er kommt.", why: "'Wenn' = quando/se (condição). 'Ob' = se (pergunta indireta/dúvida). Em PT-BR 'se' serve para ambos, mas em alemão são palavras diferentes." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  4. RELATIVSÄTZE                                            ║
  // ╚══════════════════════════════════════════════════════════════╝
  "relativsaetze": {
    topicId: "relativsaetze",
    sections: [
      {
        title: "O que são orações relativas?",
        content: `Relativsätze são orações que descrevem ou especificam um substantivo (o antecedente). Em português: "O médico QUE me atendeu foi ótimo." Em alemão, funcionam de forma similar, mas o pronome relativo muda de acordo com gênero, número e CASO.

Assim como nas Nebensätze, o verbo conjugado vai para o FINAL: "Der Arzt, der mich untersucht hat, war freundlich." (O médico que me examinou foi simpático.)

A diferença crucial em relação ao português: em PT-BR, usamos "que" para quase tudo. Em alemão, o pronome relativo precisa concordar com o antecedente E refletir sua função na oração relativa.`
      },
      {
        title: "Como escolher o pronome relativo",
        content: `O pronome relativo concorda com o antecedente em GÊNERO e NÚMERO, mas assume o CASO de acordo com sua função DENTRO da oração relativa:

1. Identifique o gênero/número do antecedente (der/die/das/die)
2. Identifique a função do pronome relativo NA SUA ORAÇÃO:
   — Sujeito → Nominativo (der/die/das/die)
   — Objeto direto → Acusativo (den/die/das/die)
   — Objeto indireto → Dativo (dem/der/dem/denen)
   — Posse → Genitivo (dessen/deren/dessen/deren)
3. Após preposição, o caso é determinado pela preposição.

Exemplo: "Die Patientin, DER ich geholfen habe..." (A paciente a QUEM eu ajudei...)
— Antecedente: die Patientin (feminino, singular)
— Função: objeto indireto de "helfen" (verbo que rege dativo)
— Resultado: der (feminino, dativo, singular)`
      },
    ],
    examples: [
      { de: "Der Arzt, der mich behandelt, ist sehr nett.", pt: "O médico que me trata é muito simpático.", note: "Nominativo masculino (der)" },
      { de: "Die Tablette, die Sie nehmen müssen, ist blau.", pt: "O comprimido que você precisa tomar é azul.", note: "Nominativo feminino (die)" },
      { de: "Den Patienten, den ich gestern untersucht habe, ...", pt: "O paciente que eu examinei ontem...", note: "Acusativo masculino (den)" },
      { de: "Die Ärztin, der ich vertraue, hat das empfohlen.", pt: "A médica em quem confio recomendou isso.", note: "Dativo feminino (der) — vertrauen rege dativo" },
      { de: "Das Krankenhaus, in dem ich arbeite, ist modern.", pt: "O hospital no qual eu trabalho é moderno.", note: "Dativo neutro após preposição in" },
      { de: "Der Patient, dessen Befund negativ war, wurde entlassen.", pt: "O paciente cujo resultado foi negativo recebeu alta.", note: "Genitivo (dessen) = cujo" },
    ],
    tables: [
      {
        caption: "Pronomes relativos",
        headers: ["Caso", "Masculino", "Feminino", "Neutro", "Plural"],
        rows: [
          ["Nominativo", "der", "die", "das", "die"],
          ["Acusativo", "den", "die", "das", "die"],
          ["Dativo", "dem", "der", "dem", "denen"],
          ["Genitivo", "dessen", "deren", "dessen", "deren"],
        ],
      },
    ],
    tip: "O pronome relativo se parece com o artigo definido — a única diferença está no dativo plural (denen em vez de den) e no genitivo (dessen/deren). Se você sabe declinar der/die/das, já sabe 90% dos relativos.",
    mistakes: [
      { wrong: "Der Arzt, das mich behandelt, ...", right: "Der Arzt, der mich behandelt, ...", why: "O gênero do pronome vem do antecedente (der Arzt = masculino), NÃO da oração relativa. 'Das' é neutro." },
      { wrong: "Die Patientin, die ich geholfen habe, ...", right: "Die Patientin, der ich geholfen habe, ...", why: "Helfen rege DATIVO. Embora o antecedente seja feminino, o caso dentro da relativa é dativo → der." },
      { wrong: "Der Patient, der ich untersucht habe, ...", right: "Der Patient, den ich untersucht habe, ...", why: "'Ich habe DEN Patienten untersucht' — dentro da relativa, o paciente é objeto direto (acusativo) → den." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  5. PASSIV                                                  ║
  // ╚══════════════════════════════════════════════════════════════╝
  "passiv": {
    topicId: "passiv",
    sections: [
      {
        title: "A voz passiva em alemão",
        content: `A voz passiva em alemão é formada com werden + Partizip II. É extremamente comum em contextos médicos e científicos — prontuários, artigos, instruções.

Aktiv: "Der Arzt untersucht den Patienten." (O médico examina o paciente.)
Passiv: "Der Patient wird untersucht." (O paciente é examinado.)

O agente (quem faz a ação) pode ser indicado com von + Dativo:
"Der Patient wird vom Arzt untersucht." (O paciente é examinado pelo médico.)

Note que o objeto direto do ativo (den Patienten, acusativo) torna-se sujeito do passivo (der Patient, nominativo). Se o verbo do ativo não tem objeto direto, o passivo usa "es" como sujeito formal: "Es wird hier nicht geraucht." (Não se fuma aqui.)`
      },
      {
        title: "Vorgangspassiv vs. Zustandspassiv",
        content: `O alemão distingue dois tipos de passiva:

VORGANGSPASSIV (werden + PP) — O PROCESSO da ação:
"Die Wunde wird verbunden." (A ferida está sendo enfaixada.) → ação em progresso

ZUSTANDSPASSIV (sein + PP) — O RESULTADO da ação:
"Die Wunde ist verbunden." (A ferida está enfaixada.) → estado resultante

Em contexto médico, essa distinção é crucial:
"Der Patient wird operiert." (O paciente está sendo operado.) — cirurgia em curso
"Der Patient ist operiert." (O paciente está operado.) — cirurgia já feita`
      },
    ],
    examples: [
      { de: "Der Patient wird morgen operiert.", pt: "O paciente será operado amanhã.", note: "Passiva no presente (futuro implícito)" },
      { de: "Die Blutprobe wurde analysiert.", pt: "A amostra de sangue foi analisada.", note: "Passiva no Präteritum (wurde)" },
      { de: "Das Medikament muss dreimal täglich eingenommen werden.", pt: "O medicamento deve ser tomado três vezes ao dia.", note: "Passiva com modal" },
      { de: "Die Wunde ist versorgt.", pt: "A ferida está tratada.", note: "Zustandspassiv (resultado)" },
      { de: "Hier wird nicht geraucht.", pt: "Não se fuma aqui.", note: "Passiva impessoal" },
    ],
    tables: [
      {
        caption: "Passiva nos diferentes tempos verbais",
        headers: ["Tempo", "Estrutura", "Exemplo"],
        rows: [
          ["Presente", "wird + PP", "wird untersucht"],
          ["Präteritum", "wurde + PP", "wurde untersucht"],
          ["Perfekt", "ist + PP + worden", "ist untersucht worden"],
          ["Modal", "modal + PP + werden", "muss untersucht werden"],
          ["Zustandspassiv", "ist + PP", "ist untersucht"],
        ],
      },
    ],
    tip: "Em textos médicos, pense: se a ação está ACONTECENDO → werden (processo). Se já ACONTECEU e você descreve o estado atual → sein (resultado). \"Der Arm wird gegipst\" (estão engessando) vs. \"Der Arm ist gegipst\" (está engessado).",
    mistakes: [
      { wrong: "Der Patient wurde operiert worden.", right: "Der Patient ist operiert worden.", why: "O Perfekt da passiva usa ist + PP + worden (não wurde). Wurde é para Präteritum simples." },
      { wrong: "Die Tablette wird von dem Patient genommen.", right: "Die Tablette wird vom Patienten genommen.", why: "Após 'von', usa-se Dativo. 'Der Patient' → 'dem Patienten' (n-Deklination). Brasileiros esquecem de declinar." },
      { wrong: "Es wird hier geraucht nicht.", right: "Hier wird nicht geraucht.", why: "'Nicht' vem antes do Partizip II na passiva. Além disso, quando há advérbio de lugar, 'es' é desnecessário." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  6. WECHSELPRÄPOSITIONEN                                   ║
  // ╚══════════════════════════════════════════════════════════════╝
  "praepositionen": {
    topicId: "praepositionen",
    sections: [
      {
        title: "Preposições que mudam de caso",
        content: `As Wechselpräpositionen são 9 preposições que podem reger tanto Acusativo quanto Dativo. A escolha depende de uma pergunta simples:

WOHIN? (Para onde? → movimento com destino) → ACUSATIVO
WO? (Onde? → posição estática/localização) → DATIVO

As 9 preposições: in, an, auf, über, unter, vor, hinter, neben, zwischen

Pense em dois cenários no hospital:
"Ich gehe IN DEN OP." (Eu vou PARA o centro cirúrgico.) → movimento, acusativo
"Ich bin IM OP." (Eu estou NO centro cirúrgico.) → localização, dativo

Em português, usamos a mesma preposição para ambos: "no hospital" (estou) e "no hospital" (vou). Em alemão, a preposição é a mesma, mas o artigo muda de caso.`
      },
      {
        title: "Contrações frequentes",
        content: `Na fala e escrita cotidiana, preposição + artigo se fundem:

in + dem = im (Im Krankenhaus = No hospital)
in + das = ins (Ins Krankenhaus = Para o hospital)
an + dem = am (Am Montag = Na segunda-feira)
an + das = ans (Ans Fenster = Para a janela)
auf + das = aufs (Aufs Dach = Para o telhado)

Essas contrações são obrigatórias na fala e muito comuns na escrita. Dizer "in dem Krankenhaus" em vez de "im Krankenhaus" soa artificial.`
      },
      {
        title: "Verbos que definem o caso",
        content: `Alguns verbos sempre implicam movimento (Akk) ou posição (Dat):

MOVIMENTO → Acusativo: stellen (colocar em pé), legen (colocar deitado), setzen (sentar algo/alguém), hängen (pendurar — transitivo)

POSIÇÃO → Dativo: stehen (estar em pé), liegen (estar deitado), sitzen (estar sentado), hängen (estar pendurado — intransitivo)

"Ich lege das Buch AUF DEN Tisch." (Acuso. → eu coloco o livro SOBRE a mesa)
"Das Buch liegt AUF DEM Tisch." (Dativo → o livro está SOBRE a mesa)`
      },
    ],
    examples: [
      { de: "Ich gehe in die Apotheke.", pt: "Eu vou à farmácia.", note: "Wohin? → Akk (die Apotheke)" },
      { de: "Ich bin in der Apotheke.", pt: "Eu estou na farmácia.", note: "Wo? → Dat (der Apotheke)" },
      { de: "Stellen Sie die Flasche auf den Tisch.", pt: "Coloque a garrafa sobre a mesa.", note: "Wohin? → Akk (movimento)" },
      { de: "Die Flasche steht auf dem Tisch.", pt: "A garrafa está sobre a mesa.", note: "Wo? → Dat (posição)" },
      { de: "Der Arzt hängt das Röntgenbild an die Wand.", pt: "O médico pendura a radiografia na parede.", note: "Akk (ação de pendurar)" },
      { de: "Das Röntgenbild hängt an der Wand.", pt: "A radiografia está pendurada na parede.", note: "Dat (estado pendurado)" },
    ],
    tables: [
      {
        caption: "As 9 Wechselpräpositionen",
        headers: ["Preposição", "Significado", "Exemplo Akk (Wohin?)", "Exemplo Dat (Wo?)"],
        rows: [
          ["in", "em/para dentro", "in den Raum", "im Raum"],
          ["an", "junto a/na borda", "an die Wand", "an der Wand"],
          ["auf", "sobre/em cima", "auf den Tisch", "auf dem Tisch"],
          ["über", "sobre/acima", "über die Straße", "über der Stadt"],
          ["unter", "sob/debaixo", "unter den Tisch", "unter dem Tisch"],
          ["vor", "diante de/antes", "vor die Tür", "vor der Tür"],
          ["hinter", "atrás de", "hinter das Haus", "hinter dem Haus"],
          ["neben", "ao lado de", "neben den Stuhl", "neben dem Stuhl"],
          ["zwischen", "entre", "zwischen die Bücher", "zwischen den Büchern"],
        ],
      },
    ],
    tip: "A pergunta mágica é: WO oder WOHIN? Se algo se MOVE para um destino → Acusativo. Se algo ESTÁ parado em um lugar → Dativo. Imagine: \"Wo? → WO-hnzimmer → Dativ\" (Wo tem 'D' em Dativ). \"Wohin? → AKKu → Akk\".",
    mistakes: [
      { wrong: "Ich gehe in dem Krankenhaus.", right: "Ich gehe ins Krankenhaus.", why: "Gehen = movimento com destino → Wohin? → Acusativo. 'In dem' é dativo (posição estática)." },
      { wrong: "Ich bin in den OP.", right: "Ich bin im OP.", why: "Sein = estar (posição) → Wo? → Dativo. 'In den' é acusativo (movimento)." },
      { wrong: "Das Buch liegt auf den Tisch.", right: "Das Buch liegt auf dem Tisch.", why: "Liegen = estar deitado (posição) → Wo? → Dativo. O verbo indica que o livro JÁ está lá." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  7. REFLEXIVE VERBEN                                        ║
  // ╚══════════════════════════════════════════════════════════════╝
  "reflexive-verben": {
    topicId: "reflexive-verben",
    sections: [
      {
        title: "Verbos reflexivos em alemão",
        content: `Verbos reflexivos usam o pronome "sich" e indicam que a ação recai sobre o próprio sujeito. Em português temos "eu me lavo", "ele se interessa" — o alemão funciona de forma similar, mas com algumas diferenças cruciais.

Existem dois tipos:
• ECHTE reflexive Verben — SÓ existem na forma reflexiva: sich freuen (alegrar-se), sich beeilen (apressar-se), sich erinnern (lembrar-se), sich erholen (recuperar-se).
• UNECHTE reflexive Verben — podem ser usados sem sich: sich waschen (lavar-se/lavar algo), sich anziehen (vestir-se/vestir alguém).

No contexto médico, muitos verbos reflexivos são essenciais: sich fühlen (sentir-se), sich hinlegen (deitar-se), sich ausruhen (descansar), sich übergeben (vomitar), sich verletzen (machucar-se).`
      },
      {
        title: "Acusativo ou Dativo reflexivo?",
        content: `O pronome reflexivo pode estar no acusativo ou no dativo:

ACUSATIVO (quando sich é o ÚNICO objeto):
"Ich wasche mich." (Eu me lavo.) — mich = a mim mesmo

DATIVO (quando há OUTRO objeto direto na frase):
"Ich wasche mir die Hände." (Eu lavo minhas mãos.) — mir = para mim; die Hände = objeto direto

Regra prática: se a frase já tem um objeto direto (acusativo), o reflexivo vai para o dativo.

A diferença na conjugação só aparece em ich e du:
Akk: mich, dich, sich, uns, euch, sich
Dat: mir, dir, sich, uns, euch, sich`
      },
    ],
    examples: [
      { de: "Ich fühle mich nicht wohl.", pt: "Eu não me sinto bem.", note: "sich fühlen — essencial em consultas" },
      { de: "Bitte setzen Sie sich.", pt: "Por favor, sente-se.", note: "sich setzen — formal com Sie" },
      { de: "Er hat sich den Arm gebrochen.", pt: "Ele quebrou o braço.", note: "Dativo reflexivo (sich=mir/dir/sich) + objeto direto (den Arm)" },
      { de: "Sie muss sich ausruhen.", pt: "Ela precisa descansar.", note: "Reflexivo com modal" },
      { de: "Der Patient hat sich übergeben.", pt: "O paciente vomitou.", note: "sich übergeben — linguagem médica" },
      { de: "Ich erinnere mich nicht daran.", pt: "Não me lembro disso.", note: "sich erinnern an + Akk" },
    ],
    tip: "Teste assim: se a frase já tem um 'quem/o quê' sendo afetado (objeto direto), o sich fica no dativo. \"Ich wasche MICH\" (lavo a mim = Akk). \"Ich wasche MIR die Hände\" (lavo as mãos PARA mim = Dat, porque 'die Hände' já é o objeto direto).",
    mistakes: [
      { wrong: "Ich fühle mich nicht gut.", right: "Ich fühle mich nicht wohl.", why: "Em alemão, 'sich wohl fühlen' é a expressão correta para 'sentir-se bem'. 'Sich gut fühlen' existe mas é menos idiomático em contexto de saúde." },
      { wrong: "Ich wasche mich die Hände.", right: "Ich wasche mir die Hände.", why: "Quando há outro objeto direto (die Hände), o reflexivo deve ser DATIVO (mir), não acusativo (mich)." },
      { wrong: "Er hat sich erinnert das.", right: "Er hat sich daran erinnert.", why: "Sich erinnern AN + Akk. Com pronomes, usa-se da(r)+prep: 'daran'. Brasileiros usam 'lembrar disso' sem preposição." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  8. INDIREKTE REDE                                          ║
  // ╚══════════════════════════════════════════════════════════════╝
  "indirekte-rede": {
    topicId: "indirekte-rede",
    sections: [
      {
        title: "O discurso indireto com Konjunktiv I",
        content: `O discurso indireto é usado para reportar o que alguém disse sem citar diretamente. Em alemão, usa-se o Konjunktiv I para marcar que você está reproduzindo a fala de outra pessoa, não afirmando um fato.

Direto: Der Arzt sagt: "Der Patient hat Fieber." (O médico diz: "O paciente tem febre.")
Indireto: Der Arzt sagt, der Patient habe Fieber. (O médico diz que o paciente tem febre.)

O Konjunktiv I é formado a partir do radical do infinitivo + terminações: -e, -est, -e, -en, -et, -en. A forma mais reconhecível é a 3ª pessoa singular (er/sie/es), que é onde o Konj. I se diferencia claramente do indicativo.

Na prática clínica, o Konjunktiv I aparece em prontuários e laudos: "Die Patientin gibt an, sie habe seit drei Tagen Schmerzen." (A paciente declara ter dores há três dias.)`
      },
      {
        title: "Quando usar Konjunktiv I ou II",
        content: `Use Konjunktiv I sempre que ele for DISTINGUÍVEL do indicativo. Quando a forma coincide com o indicativo, substitua pelo Konjunktiv II:

sein → er sei (Konj. I = claramente diferente de "er ist") ✓
haben → er habe (diferente de "er hat") ✓
kommen → sie kommen (Konj. I = igual ao indicativo!) → substitua por kämen (Konj. II) ✓

As formas mais usadas: sei, habe, könne, müsse, solle, wolle, wisse.

Na fala informal, muitos alemães simplesmente usam "dass" + indicativo: "Er sagt, dass er krank ist." Isso é gramaticalmente menos correto, mas muito comum na comunicação do dia a dia. Para textos profissionais e prontuários, prefira o Konjunktiv I.`
      },
    ],
    examples: [
      { de: "Der Patient sagt, er sei müde.", pt: "O paciente diz que está cansado.", note: "sei = Konj. I de sein" },
      { de: "Die Ärztin meint, die Werte seien normal.", pt: "A médica opina que os valores estão normais.", note: "seien = Konj. I plural" },
      { de: "Er behauptet, er habe nichts genommen.", pt: "Ele afirma que não tomou nada.", note: "habe = Konj. I de haben" },
      { de: "Sie sagt, sie könne nicht schlafen.", pt: "Ela diz que não consegue dormir.", note: "könne = Konj. I de können" },
      { de: "Der Bericht besagt, die OP sei erfolgreich gewesen.", pt: "O relatório indica que a cirurgia foi bem-sucedida.", note: "Formal/escrito" },
    ],
    tip: "Para B1, foque em memorizar sei e habe — são de longe as formas mais comuns do Konjunktiv I. Na dúvida na fala, use 'Er sagt, dass er krank ist' com dass + indicativo. Reserva o Konjunktiv I para textos escritos.",
    mistakes: [
      { wrong: "Er sagt, er ist krank.", right: "Er sagt, er sei krank.", why: "Na escrita formal, o discurso indireto exige Konjunktiv I (sei). 'Ist' é indicativo e soa como se VOCÊ estivesse confirmando o fato." },
      { wrong: "Er sagt, dass er sei krank.", right: "Er sagt, dass er krank sei.", why: "Com 'dass', o verbo vai para o FINAL (regra da Nebensatz). O Konjunktiv I se mantém, mas a posição muda." },
      { wrong: "Sie sagen, sie haben Schmerzen.", right: "Sie sagen, sie hätten Schmerzen.", why: "Na 3ª pessoa plural, 'haben' (Konj. I) = 'haben' (indicativo). Como são iguais, substitui-se pelo Konj. II: hätten." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  9. ADJEKTIVDEKLINATION                                     ║
  // ╚══════════════════════════════════════════════════════════════╝
  "adjektivdeklination": {
    topicId: "adjektivdeklination",
    sections: [
      {
        title: "Por que declinar adjetivos?",
        content: `Em português, o adjetivo concorda em gênero e número: "o médico bom", "a médica boa". Em alemão, quando o adjetivo vem ANTES do substantivo (posição atributiva), ele recebe uma terminação que depende de três fatores:

1. O GÊNERO do substantivo (der/die/das)
2. O CASO (Nominativo, Acusativo, Dativo, Genitivo)
3. O tipo de ARTIGO que vem antes (definido, indefinido, ou nenhum)

Se o adjetivo vem DEPOIS do verbo (posição predicativa), ele NÃO declina: "Der Arzt ist gut." (O médico é bom.) — "gut" sem terminação.

Isso parece complexo, mas há uma lógica: o adjetivo "herda" a terminação que falta. Se o artigo já mostra o gênero/caso, o adjetivo recebe -e ou -en. Se não há artigo, o adjetivo assume a função de mostrar o gênero.`
      },
      {
        title: "As três situações",
        content: `APÓS ARTIGO DEFINIDO (der/die/das/dem/den/des):
O adjetivo recebe -e ou -en. É a tabela mais simples — quase tudo é -en, exceto Nom. masc/fem/neutro e Akk. fem/neutro que são -e.

APÓS ARTIGO INDEFINIDO (ein/eine/einem/einen/einer):
Similar ao artigo definido, mas no Nom. masculino (ein großER Mann) e Nom./Akk. neutro (ein großES Kind), o adjetivo assume a terminação forte porque "ein" não mostra o gênero.

SEM ARTIGO (adjetivo "forte"):
O adjetivo recebe as terminações do artigo definido (quase): großer Mann, große Frau, großes Kind. Isso é raro no singular, mas comum no plural: "Kalte Getränke" (bebidas frias).`
      },
    ],
    examples: [
      { de: "der freundliche Arzt", pt: "o médico simpático", note: "Art. definido, Nom. masc. → -e" },
      { de: "ein freundlicher Arzt", pt: "um médico simpático", note: "Art. indefinido, Nom. masc. → -er" },
      { de: "die neue Kollegin", pt: "a nova colega", note: "Art. definido, Nom. fem. → -e" },
      { de: "mit dem kleinen Kind", pt: "com a criança pequena", note: "Art. definido, Dat. neutro → -en" },
      { de: "kaltes Wasser", pt: "água fria", note: "Sem artigo, Nom./Akk. neutro → -es" },
      { de: "Er verschrieb starke Schmerzmittel.", pt: "Ele receitou analgésicos fortes.", note: "Sem artigo, Akk. plural → -e" },
    ],
    tables: [
      {
        caption: "Após artigo definido (schwache Deklination)",
        headers: ["Caso", "Masc.", "Fem.", "Neutro", "Plural"],
        rows: [
          ["Nominativo", "-e", "-e", "-e", "-en"],
          ["Acusativo", "-en", "-e", "-e", "-en"],
          ["Dativo", "-en", "-en", "-en", "-en"],
          ["Genitivo", "-en", "-en", "-en", "-en"],
        ],
      },
      {
        caption: "Após artigo indefinido (gemischte Deklination)",
        headers: ["Caso", "Masc.", "Fem.", "Neutro", "Plural (kein)"],
        rows: [
          ["Nominativo", "-er", "-e", "-es", "-en"],
          ["Acusativo", "-en", "-e", "-es", "-en"],
          ["Dativo", "-en", "-en", "-en", "-en"],
          ["Genitivo", "-en", "-en", "-en", "-en"],
        ],
      },
      {
        caption: "Sem artigo (starke Deklination)",
        headers: ["Caso", "Masc.", "Fem.", "Neutro", "Plural"],
        rows: [
          ["Nominativo", "-er", "-e", "-es", "-e"],
          ["Acusativo", "-en", "-e", "-es", "-e"],
          ["Dativo", "-em", "-er", "-em", "-en"],
          ["Genitivo", "-en", "-er", "-en", "-er"],
        ],
      },
    ],
    tip: "A regra de ouro: alguém precisa mostrar o gênero. Se o artigo já mostra (der, die, das, dem, den), o adjetivo relaxa e usa -e ou -en. Se o artigo NÃO mostra (ein sem terminação) ou se não há artigo, o adjetivo assume o papel e recebe a terminação forte (-er, -es, -em).",
    mistakes: [
      { wrong: "der gut Arzt", right: "der gute Arzt", why: "Após artigo definido, Nom. masc. → terminação -e. O adjetivo NUNCA fica sem terminação antes de substantivo em alemão." },
      { wrong: "ein große Mann", right: "ein großer Mann", why: "Após 'ein' (que não mostra gênero no Nom. masc.), o adjetivo precisa mostrar: -er. Em PT-BR 'um grande homem' não tem essa marcação." },
      { wrong: "mit dem freundliche Arzt", right: "mit dem freundlichen Arzt", why: "Dativo após artigo definido → sempre -en. Brasileiros esquecem porque em português não existe essa variação." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  10. KONNEKTOREN                                            ║
  // ╚══════════════════════════════════════════════════════════════╝
  "konnektoren": {
    topicId: "konnektoren",
    sections: [
      {
        title: "Tipos de conectores e posição do verbo",
        content: `Os conectores em alemão dividem-se em três grupos, e a posição do verbo muda radicalmente dependendo do grupo. Entender isso é ESSENCIAL para construir frases complexas no nível B1.

POSIÇÃO 0 (Konjunktionen): und, aber, oder, denn, sondern
→ NÃO mudam a ordem da frase. O verbo fica na posição 2 normalmente.
"Ich lerne Deutsch, denn ich möchte in Deutschland arbeiten."

POSIÇÃO 1 (Adverbiale Konnektoren): deshalb, trotzdem, außerdem, dann, danach, jedoch, allerdings, sonst, folglich, daher, deswegen, nämlich, schließlich
→ Ocupam a posição 1 → INVERSÃO (verbo na 2, sujeito na 3).
"Deshalb lerne ich Deutsch."

POSIÇÃO FINAL (Subjunktionen): weil, dass, obwohl, wenn, als, ob, damit, bevor, nachdem, während, seit, bis
→ Verbo vai para o FINAL (regra da Nebensatz).
"..., weil ich Deutsch lerne."`
      },
      {
        title: "Os conectores mais importantes para B1",
        content: `CAUSA → CONSEQUÊNCIA:
weil (posição final) / denn (posição 0) / deshalb, daher, deswegen (posição 1)
"Ich bleibe zu Hause, weil ich krank bin."
"Ich bin krank, deshalb bleibe ich zu Hause."
"Ich bin krank, denn ich habe Fieber."

CONTRASTE / CONCESSÃO:
obwohl (pos. final) / aber (pos. 0) / trotzdem, jedoch, allerdings (pos. 1)
"Obwohl er Fieber hat, geht er zur Arbeit."
"Er hat Fieber, trotzdem geht er zur Arbeit."
"Er hat Fieber, aber er geht zur Arbeit."

ADIÇÃO:
und (pos. 0) / außerdem, zusätzlich (pos. 1)
"Er hat Fieber und Kopfschmerzen."
"Er hat Fieber. Außerdem hat er Kopfschmerzen."

SEQUÊNCIA:
dann, danach, anschließend (pos. 1) / nachdem, bevor (pos. final)
"Zuerst messen wir den Blutdruck, dann nehmen wir Blut ab."`
      },
    ],
    examples: [
      { de: "Der Patient ist müde, deshalb bleibt er im Bett.", pt: "O paciente está cansado, por isso ele fica na cama.", note: "deshalb → inversão" },
      { de: "Obwohl sie Schmerzen hat, möchte sie keine Tabletten.", pt: "Embora tenha dor, ela não quer comprimidos.", note: "obwohl → verbo no final" },
      { de: "Er hat Fieber, trotzdem geht er zur Arbeit.", pt: "Ele tem febre, mesmo assim vai trabalhar.", note: "trotzdem → inversão" },
      { de: "Ich brauche Ruhe, denn ich bin erschöpft.", pt: "Preciso de descanso, pois estou exausto.", note: "denn → sem inversão (pos. 0)" },
      { de: "Zuerst nehmen wir Blut ab, dann machen wir ein Röntgen.", pt: "Primeiro colhemos sangue, depois fazemos um raio-X.", note: "dann → inversão" },
      { de: "Sie sollten mehr trinken, sonst werden Sie dehydriert.", pt: "Você deveria beber mais, senão vai desidratar.", note: "sonst → inversão" },
    ],
    tip: "Memorize a regra dos 3 tipos: COPAS (und/aber/oder/denn/sondern) = posição 0, nada muda. ADBÉRVIO (deshalb/trotzdem/dann...) = posição 1, inverte. CAIXA (weil/dass/ob...) = fecha a caixa, verbo no final.",
    mistakes: [
      { wrong: "Deshalb ich lerne Deutsch.", right: "Deshalb lerne ich Deutsch.", why: "Conectores adverbiais (posição 1) causam INVERSÃO: verbo na posição 2, sujeito na 3. Brasileiros esquecem porque em PT-BR 'por isso eu aprendo' não inverte." },
      { wrong: "Ich bin krank, trotzdem ich gehe zur Arbeit.", right: "Ich bin krank, trotzdem gehe ich zur Arbeit.", why: "Trotzdem é conector adverbial (posição 1), NÃO subjunção. O verbo conJUGADO vem logo depois (inversão), não no final." },
      { wrong: "..., weil ich Deutsch lerne deshalb.", right: "..., weil ich Deutsch lerne. / ..., deshalb lerne ich...", why: "Não misture weil (subordinação) e deshalb (coordenação). Use um OU outro, não ambos na mesma estrutura." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  11. VERBEN MIT PRÄPOSITIONEN                               ║
  // ╚══════════════════════════════════════════════════════════════╝
  "verben-mit-praepositionen": {
    topicId: "verben-mit-praepositionen",
    sections: [
      {
        title: "Preposições fixas: não tem lógica, tem lista",
        content: `Muitos verbos alemães exigem uma preposição específica, e essa combinação precisa ser memorizada como UMA unidade. Não há lógica gramatical que explique por que "warten" pede "auf" e não "für" — é convenção.

Isso é parecido com o português: dizemos "depender DE", "pensar EM", "acreditar EM". A diferença é que as preposições alemãs são diferentes das portuguesas, e a preposição determina o caso do objeto.

Para brasileiros, o maior perigo é a TRANSFERÊNCIA: tentar traduzir a preposição do português. "Pensar em" ≠ "denken in" — é "denken AN + Akk". "Depender de" ≠ "abhängen von" (aqui por coincidência é parecido!). Cada combinação precisa ser aprendida.`
      },
      {
        title: "da(r)- e wo(r)- : substituindo coisas e fazendo perguntas",
        content: `Quando o complemento preposicional se refere a uma COISA (não pessoa), usa-se da(r)+ preposição em vez de repetir preposição + pronome:

"Ich freue mich auf den Urlaub." → "Ich freue mich DARAUF." (Me alegro com isso.)
"Ich denke an die Prüfung." → "Ich denke DARAN." (Penso nisso.)

Para PERGUNTAR sobre coisas: wo(r)+ preposição:
"WORAUF freust du dich?" (Com o que você se alegra?)
"WORAN denkst du?" (Em que você está pensando?)

O "r" aparece quando a preposição começa com vogal: dar+auf, dar+an, dar+über, wor+auf, wor+an.

Para PESSOAS, usa-se preposição + pronome normal:
"Auf wen wartest du?" (Por quem você espera?)
"Ich warte auf ihn." (Eu espero por ele.)`
      },
    ],
    examples: [
      { de: "Ich warte auf den Befund.", pt: "Eu espero o resultado.", note: "warten AUF + Akk" },
      { de: "Er interessiert sich für Kardiologie.", pt: "Ele se interessa por cardiologia.", note: "sich interessieren FÜR + Akk" },
      { de: "Ich freue mich auf die Ergebnisse.", pt: "Estou ansioso pelos resultados.", note: "sich freuen AUF + Akk (futuro)" },
      { de: "Sie hat sich über die Diagnose gewundert.", pt: "Ela se surpreendeu com o diagnóstico.", note: "sich wundern ÜBER + Akk" },
      { de: "Er leidet an einer chronischen Krankheit.", pt: "Ele sofre de uma doença crônica.", note: "leiden AN + Dat" },
      { de: "Worum handelt es sich?", pt: "Do que se trata?", note: "sich handeln UM + Akk — worum" },
    ],
    tables: [
      {
        caption: "Verbos com preposição mais frequentes",
        headers: ["Verbo", "Preposição + Caso", "Exemplo", "Tradução"],
        rows: [
          ["warten", "auf + Akk", "auf den Arzt warten", "esperar pelo médico"],
          ["sich freuen", "auf + Akk / über + Akk", "sich auf die Ferien freuen", "alegrar-se com (futuro/passado)"],
          ["denken", "an + Akk", "an die Familie denken", "pensar na família"],
          ["sich interessieren", "für + Akk", "sich für Medizin interessieren", "interessar-se por medicina"],
          ["abhängen", "von + Dat", "vom Ergebnis abhängen", "depender do resultado"],
          ["leiden", "an + Dat", "an Diabetes leiden", "sofrer de diabetes"],
          ["sich erinnern", "an + Akk", "sich an den Namen erinnern", "lembrar-se do nome"],
          ["achten", "auf + Akk", "auf die Dosierung achten", "prestar atenção na dosagem"],
          ["sich beschweren", "über + Akk", "sich über Schmerzen beschweren", "queixar-se de dor"],
          ["sich handeln", "um + Akk", "es handelt sich um...", "trata-se de..."],
        ],
      },
    ],
    tip: "Cada vez que aprender um verbo novo, anote-o COM sua preposição: 'warten AUF + Akk'. Trate verbo+preposição como uma unidade inseparável, como se fosse uma palavra só. Nunca decore 'warten' sozinho.",
    mistakes: [
      { wrong: "Ich denke über dich.", right: "Ich denke an dich.", why: "Denken pede AN (não über). Brasileiros traduzem 'pensar sobre' → 'denken über', mas em alemão 'denken an' = pensar em/sobre alguém." },
      { wrong: "Ich warte für den Arzt.", right: "Ich warte auf den Arzt.", why: "Warten pede AUF (não für). Em PT-BR 'esperAR por' → 'für' parece lógico, mas alemão usa 'auf'." },
      { wrong: "Ich freue mich darauf, aber ich freue mich auch daran.", right: "...freue mich darauf / ...freue mich darüber.", why: "Sich freuen AUF = antecipar algo futuro. Sich freuen ÜBER = alegrar-se com algo que aconteceu. 'An' não combina com freuen." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  12. ARTIKEL UND GENUS                                      ║
  // ╚══════════════════════════════════════════════════════════════╝
  "artikel-genus": {
    topicId: "artikel-genus",
    sections: [
      {
        title: "Três gêneros, poucas regras, muita memorização",
        content: `O alemão tem três gêneros gramaticais: masculino (der), feminino (die) e neutro (das). Diferente do português (que tem só masculino e feminino), o neutro adiciona uma camada de complexidade.

O gênero de um substantivo em alemão frequentemente NÃO corresponde ao gênero em português: "die Sonne" (o sol — fem. em alemão, masc. em PT-BR), "der Mond" (a lua — masc. em alemão, fem. em PT-BR).

A má notícia: não existe regra que funcione 100% das vezes. A boa notícia: existem padrões por SUFIXO e por CATEGORIA SEMÂNTICA que cobrem cerca de 70-80% dos substantivos. Para o resto, memorize o artigo JUNTO com a palavra. Nunca aprenda "Tisch" — aprenda "DER Tisch".`
      },
      {
        title: "Regras por sufixo",
        content: `MASCULINO (der) — sufixos:
-er (der Computer, der Drucker), -ling (der Frühling, der Lehrling), -ismus (der Organismus), -or (der Motor, der Doktor), -ant/-ent (der Patient, der Assistent)

FEMININO (die) — sufixos:
-ung (die Untersuchung, die Behandlung), -keit/-heit (die Krankheit, die Möglichkeit), -tion/-sion (die Operation, die Infusion), -ie (die Therapie, die Chirurgie), -schaft (die Wissenschaft), -tät (die Universität), -enz/-anz (die Kompetenz, die Toleranz)

NEUTRO (das) — sufixos:
-chen/-lein (das Mädchen, das Brötchen — diminutivos são SEMPRE neutro!), -ment (das Medikament, das Instrument), -um (das Datum, das Zentrum), -nis (das Ergebnis, das Verständnis — atenção: alguns -nis são femininos!)

Dica médica: termos médicos com -tion são sempre femininos (die Infektion, die Fraktur), com -ment são neutros (das Medikament).`
      },
      {
        title: "Regras semânticas",
        content: `MASCULINO (der): dias da semana (der Montag), meses (der Januar), estações (der Sommer), pontos cardeais (der Norden), marcas de carro (der BMW)

FEMININO (die): números (die Eins), navios (die Titanic), motos (die Harley), a maioria das flores (die Rose) e árvores (die Eiche)

NEUTRO (das): cores como substantivo (das Blau), metais (das Gold), letras do alfabeto (das A), idiomas (das Deutsch), hotéis/cinemas/cafés (das Hilton)

PALAVRAS COMPOSTAS: o gênero é SEMPRE determinado pela ÚLTIMA palavra do composto:
der Kranken + das Haus = DAS Krankenhaus (hospital)
die Blut + der Druck = DER Blutdruck (pressão arterial)`
      },
    ],
    examples: [
      { de: "der Patient / die Patientin", pt: "o paciente / a paciente", note: "Pessoas seguem gênero biológico" },
      { de: "das Mädchen", pt: "a menina", note: "Diminutivo -chen → NEUTRO (apesar de ser feminino semanticamente)" },
      { de: "die Untersuchung", pt: "o exame", note: "Sufixo -ung → sempre feminino" },
      { de: "das Medikament", pt: "o medicamento", note: "Sufixo -ment → neutro" },
      { de: "die Operation", pt: "a operação", note: "Sufixo -tion → sempre feminino" },
      { de: "der Blutdruck", pt: "a pressão arterial", note: "Composto: último componente = der Druck → masculino" },
    ],
    tip: "Regra dos 3 sufixos de ouro: -UNG = die (feminino), -CHEN = das (neutro), -ER = der (masculino). Essas três regras sozinhas cobrem centenas de palavras. Na dúvida sobre uma palavra nova, olhe o sufixo primeiro.",
    mistakes: [
      { wrong: "die Problem", right: "das Problem", why: "Problem é neutro. Brasileiros assumem feminino por analogia com 'problema' (masc. em PT-BR → confusão). Não há correspondência entre gêneros PT-DE." },
      { wrong: "der Mädchen", right: "das Mädchen", why: "Diminutivos (-chen/-lein) são SEMPRE neutros, mesmo que se refiram a uma menina. O sufixo prevalece sobre o sexo biológico." },
      { wrong: "die Krankenhaus", right: "das Krankenhaus", why: "Em compostos, o gênero é do ÚLTIMO componente: das Haus. 'Kranken' é apenas modificador." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  13. DATIV vs. AKKUSATIV                                   ║
  // ╚══════════════════════════════════════════════════════════════╝
  "dativ-akkusativ": {
    topicId: "dativ-akkusativ",
    sections: [
      {
        title: "Dois casos para objetos: direto e indireto",
        content: `Em alemão, o acusativo é usado para o objeto DIRETO (quem/o quê recebe a ação) e o dativo para o objeto INDIRETO (para quem/a quem). Em português, distinguimos com preposição: "Eu dou O LIVRO (direto) AO PACIENTE (indireto)." Em alemão, a distinção aparece no artigo e no pronome.

Akk: Ich sehe DEN Mann. (Eu vejo o homem.)
Dat: Ich helfe DEM Mann. (Eu ajudo o homem.)

A mudança é no artigo: der → den (Akk masculino), der → dem (Dat masculino), die → der (Dat feminino), das → dem (Dat neutro).

No dia a dia clínico, essa distinção é constante: "Ich gebe DEM Patienten (Dat) DAS Medikament (Akk)." (Dou ao paciente o medicamento.)`
      },
      {
        title: "Verbos que regem dativo",
        content: `A maioria dos verbos rege acusativo (objeto direto). Mas alguns verbos importantes exigem DATIVO. Memorize-os:

VERBOS COM DATIVO: helfen (ajudar), danken (agradecer), gefallen (agradar), gehören (pertencer), antworten (responder), glauben (acreditar em alguém), folgen (seguir), fehlen (faltar), gratulieren (parabenizar), vertrauen (confiar), widersprechen (contradizer), empfehlen (recomendar), raten (aconselhar), zuhören (ouvir atentamente), wehtun (doer), schmecken (ter gosto de/agradar), passen (servir/caber)

Em contexto médico: "Der Kopf tut MIR weh." (Minha cabeça dói.) — wehtun + Dativ
"Ich empfehle IHNEN eine Untersuchung." (Recomendo ao senhor um exame.) — empfehlen + Dat.

VERBOS COM DOIS OBJETOS (Dat + Akk): geben, schenken, zeigen, erklären, schicken, bringen, empfehlen
"Ich zeige DEM Patienten (Dat) DIE Ergebnisse (Akk)." (Eu mostro ao paciente os resultados.)`
      },
      {
        title: "Preposições que definem o caso",
        content: `Além dos verbos, as preposições determinam o caso:

SEMPRE ACUSATIVO: für, durch, gegen, ohne, um, bis, entlang
"Ich brauche ein Rezept FÜR DEN Patienten." (Preciso de uma receita para o paciente.)

SEMPRE DATIVO: mit, nach, bei, seit, von, zu, aus, außer, gegenüber
"Kommen Sie MIT DEM Befund zu mir." (Venha com o resultado até mim.)
"Nach DER Operation brauchen Sie Ruhe." (Após a cirurgia você precisa de repouso.)

WECHSELPRÄPOSITIONEN (Dat ou Akk): in, an, auf, über, unter, vor, hinter, neben, zwischen → depende de Wo?/Wohin? (veja o tópico Wechselpräpositionen)`
      },
    ],
    examples: [
      { de: "Ich untersuche den Patienten.", pt: "Eu examino o paciente.", note: "Akk — den (objeto direto)" },
      { de: "Ich helfe dem Patienten.", pt: "Eu ajudo o paciente.", note: "Dat — dem (helfen rege dativo)" },
      { de: "Ich gebe dem Patienten das Rezept.", pt: "Eu dou ao paciente a receita.", note: "Dat (dem) + Akk (das)" },
      { de: "Mir fehlt die Energie.", pt: "Me falta energia.", note: "Dat (mir) — fehlen rege dativo" },
      { de: "Er ist mit der Behandlung zufrieden.", pt: "Ele está satisfeito com o tratamento.", note: "mit + Dat (der Behandlung)" },
      { de: "Die Tablette ist für den Blutdruck.", pt: "O comprimido é para a pressão.", note: "für + Akk (den Blutdruck)" },
    ],
    tables: [
      {
        caption: "Artigos nos 4 casos",
        headers: ["Caso", "Masc.", "Fem.", "Neutro", "Plural"],
        rows: [
          ["Nominativo", "der/ein", "die/eine", "das/ein", "die/—"],
          ["Acusativo", "den/einen", "die/eine", "das/ein", "die/—"],
          ["Dativo", "dem/einem", "der/einer", "dem/einem", "den/—"],
          ["Genitivo", "des/eines", "der/einer", "des/eines", "der/—"],
        ],
      },
    ],
    tip: "Para verbos com dativo, use o acrônimo mnemônico: 'HelGA FaGraDa' — HELfen, Gefallen, Antworten, FAhlen (fehlen), GRAtulieren, DAnken. Se está na lista → Dativo. Se não está na lista → provavelmente Acusativo.",
    mistakes: [
      { wrong: "Ich helfe den Patienten.", right: "Ich helfe dem Patienten.", why: "Helfen rege DATIVO. 'Den' é acusativo. Brasileiros usam acusativo por padrão porque em PT-BR 'ajudar o paciente' usa objeto direto." },
      { wrong: "Ich gebe der Patient das Medikament.", right: "Ich gebe dem Patienten das Medikament.", why: "1) Dativo masculino = dem, não der. 2) Patient tem n-Deklination → Patienten no dativo." },
      { wrong: "Ich bin mit der Behandlung für den Rücken.", right: "Ich bin mit der Behandlung für den Rücken zufrieden.", why: "Embora os casos estejam corretos, a frase precisa de um adjetivo predicativo (zufrieden). Brasileiros omitem porque em PT-BR podemos dizer 'estou com o tratamento'." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  14. MODALVERBEN                                            ║
  // ╚══════════════════════════════════════════════════════════════╝
  "modalverben": {
    topicId: "modalverben",
    sections: [
      {
        title: "Os 6 verbos modais",
        content: `Os verbos modais modificam o significado do verbo principal. São 6 em alemão, e todos são fundamentais para a comunicação médica:

können = poder (capacidade/possibilidade): "Können Sie den Arm heben?" (Pode levantar o braço?)
müssen = precisar/ter que (necessidade/obrigação): "Sie müssen die Tablette nehmen." (Você precisa tomar o comprimido.)
sollen = dever (recomendação/mandado externo): "Sie sollen mehr Wasser trinken." (Você deve beber mais água.)
dürfen = ter permissão: "Darf ich Sie etwas fragen?" (Posso te perguntar algo?)
wollen = querer (vontade): "Ich will gesund werden." (Eu quero ficar saudável.)
möchten = gostaria (desejo educado): "Ich möchte einen Termin." (Eu gostaria de uma consulta.)

A estrutura é: modal conjugado na posição 2 + infinitivo do verbo principal no FINAL:
"Ich MUSS morgen zum Arzt GEHEN." (Eu preciso ir ao médico amanhã.)`
      },
      {
        title: "sollen vs. müssen: a diferença sutil",
        content: `Em português, "dever" cobre tanto sollen quanto müssen. Em alemão, a distinção é importante:

MÜSSEN = obrigação interna ou necessidade real:
"Ich muss zum Arzt." (Preciso ir ao médico — eu mesmo sinto a necessidade.)

SOLLEN = obrigação/recomendação EXTERNA (alguém disse para fazer):
"Ich soll zum Arzt." (Devo ir ao médico — o médico/minha mãe disse.)

Contexto médico:
"Sie müssen operiert werden." (Você PRECISA ser operado — necessidade médica.)
"Sie sollen sich ausruhen." (Você DEVE descansar — recomendação do médico.)

Na negação: "nicht müssen" = não precisar. "nicht sollen/dürfen" = não dever.
"Sie müssen nicht kommen." (Não precisa vir.)
"Sie sollen nicht rauchen." (Não deve fumar.)
"Sie dürfen nicht rauchen." (Não PODE fumar — proibido.)`
      },
    ],
    examples: [
      { de: "Können Sie tief einatmen?", pt: "Pode respirar fundo?", note: "können — capacidade, consulta médica" },
      { de: "Sie müssen nüchtern kommen.", pt: "Você precisa vir em jejum.", note: "müssen — necessidade médica" },
      { de: "Sie sollen dreimal täglich die Tropfen nehmen.", pt: "Você deve tomar as gotas três vezes ao dia.", note: "sollen — recomendação do médico" },
      { de: "Sie dürfen nach der OP nichts essen.", pt: "Você não pode comer nada após a cirurgia.", note: "nicht dürfen — proibição" },
      { de: "Ich möchte einen Termin beim Kardiologen.", pt: "Eu gostaria de uma consulta com o cardiologista.", note: "möchten — desejo educado" },
      { de: "Er will die OP nicht machen lassen.", pt: "Ele não quer fazer a cirurgia.", note: "wollen — vontade" },
    ],
    tables: [
      {
        caption: "Conjugação dos modais no presente",
        headers: ["", "können", "müssen", "sollen", "dürfen", "wollen", "möchten"],
        rows: [
          ["ich", "kann", "muss", "soll", "darf", "will", "möchte"],
          ["du", "kannst", "musst", "sollst", "darfst", "willst", "möchtest"],
          ["er/sie/es", "kann", "muss", "soll", "darf", "will", "möchte"],
          ["wir", "können", "müssen", "sollen", "dürfen", "wollen", "möchten"],
          ["ihr", "könnt", "müsst", "sollt", "dürft", "wollt", "möchtet"],
          ["sie/Sie", "können", "müssen", "sollen", "dürfen", "wollen", "möchten"],
        ],
      },
    ],
    tip: "Note o padrão: nos modais, ich e er/sie/es têm a MESMA forma (ich kann, er kann). Isso é diferente de verbos normais. Além disso, todos os modais (exceto sollen) mudam o Umlaut no plural: kann/können, muss/müssen, darf/dürfen.",
    mistakes: [
      { wrong: "Ich muss zum Arzt zu gehen.", right: "Ich muss zum Arzt gehen.", why: "Após modal, o verbo principal vai no infinitivo SEM 'zu'. A construção com 'zu' é para outros verbos (anfangen zu, versuchen zu), nunca modais." },
      { wrong: "Sie nicht müssen kommen.", right: "Sie müssen nicht kommen.", why: "O modal conjugado fica na posição 2 e 'nicht' vem depois. A negação fica entre o modal e o infinitivo." },
      { wrong: "Er will nicht dass rauchen.", right: "Er will nicht rauchen.", why: "Modal + infinitivo direto, sem 'dass'. Brasileiros inserem 'que' por influência do PT-BR ('ele quer que...')." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  15. INFINITIVSÄTZE                                         ║
  // ╚══════════════════════════════════════════════════════════════╝
  "infinitivsaetze": {
    topicId: "infinitivsaetze",
    sections: [
      {
        title: "Orações infinitivas com zu",
        content: `Em português, dizemos "Eu tentei fazer isso" — o infinitivo vem direto. Em alemão, a maioria dos verbos exige "zu" antes do infinitivo: "Ich habe versucht, das zu machen."

O "zu + Infinitivo" funciona como uma mini-oração. Em alemão, essa construção é separada por vírgula quando tem complementos, e o zu+infinitivo vai para o FINAL:

"Ich habe keine Lust, heute zum Arzt zu gehen." (Não tenho vontade de ir ao médico hoje.)

Se o verbo é separável, zu entra entre o prefixo e o verbo: aufstehen → aufzustehen, anfangen → anzufangen.

EXCEÇÃO: Após verbos modais (können, müssen...) e alguns outros (lassen, sehen, hören, gehen, fahren), NÃO se usa zu:
"Ich kann schwimmen." (NÃO: "Ich kann zu schwimmen.")`
      },
      {
        title: "um...zu, ohne...zu, statt...zu",
        content: `Três construções infinitivas importantes:

UM...ZU = para (finalidade):
"Ich lerne Deutsch, um in Deutschland zu arbeiten." (Aprendo alemão para trabalhar na Alemanha.)

OHNE...ZU = sem (ausência de ação):
"Er ging, ohne sich zu verabschieden." (Ele saiu sem se despedir.)

(AN)STATT...ZU = em vez de:
"Statt fernzusehen, sollte er lernen." (Em vez de assistir TV, ele deveria estudar.)

Atenção: essas construções só podem ser usadas quando o sujeito é o MESMO nas duas orações. Se os sujeitos são diferentes, use damit/ohne dass/statt dass:
"Ich lerne Deutsch, DAMIT meine Kinder stolz sind." (sujeitos diferentes → damit)`
      },
    ],
    examples: [
      { de: "Ich versuche, den Patienten zu beruhigen.", pt: "Eu tento acalmar o paciente.", note: "versuchen + zu + Infinitivo" },
      { de: "Es ist wichtig, die Dosierung einzuhalten.", pt: "É importante manter a dosagem.", note: "zu entre prefixo separável: ein-zu-halten" },
      { de: "Ich arbeite hart, um die Prüfung zu bestehen.", pt: "Eu trabalho duro para passar na prova.", note: "um...zu (finalidade)" },
      { de: "Er nahm das Medikament, ohne den Beipackzettel zu lesen.", pt: "Ele tomou o remédio sem ler a bula.", note: "ohne...zu (sem)" },
      { de: "Statt ins Bett zu gehen, arbeitet sie weiter.", pt: "Em vez de ir para a cama, ela continua trabalhando.", note: "statt...zu (em vez de)" },
      { de: "Ich habe vor, nächste Woche anzufangen.", pt: "Eu pretendo começar na próxima semana.", note: "vorhaben + an-zu-fangen (separável)" },
    ],
    tip: "Se o verbo é separável, zu entra NO MEIO: auf+zu+stehen, an+zu+fangen, ein+zu+nehmen. Pense no zu como uma cunha que se enfia entre o prefixo e o verbo. Se não é separável: zu verstehen, zu bekommen, zu empfehlen (zu fica antes).",
    mistakes: [
      { wrong: "Ich kann zu schwimmen.", right: "Ich kann schwimmen.", why: "Verbos modais NUNCA usam zu. Brasileiro coloca 'de' em 'posso de nadar' e transfere para o alemão com zu." },
      { wrong: "Ich versuche aufzustehen.", right: "Ich versuche, aufzustehen.", why: "Quando a oração infinitiva tem complementos ou é longa, uma vírgula é obrigatória. Na prática, sempre use vírgula antes de zu + infinitivo." },
      { wrong: "Um in Deutschland arbeiten.", right: "Um in Deutschland zu arbeiten.", why: "Na construção um...zu, o 'zu' é obrigatório antes do infinitivo. Brasileiros omitem porque em PT-BR 'para trabalhar' não tem equivalente de zu." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  16. KOMPARATIV UND SUPERLATIV                              ║
  // ╚══════════════════════════════════════════════════════════════╝
  "komparativ-superlativ": {
    topicId: "komparativ-superlativ",
    sections: [
      {
        title: "Formação regular",
        content: `Em alemão, comparativo e superlativo são formados com sufixos (como em inglês), não com "mais" e "o mais" como em português:

POSITIVO → KOMPARATIV → SUPERLATIV
schnell → schneller → am schnellsten (rápido → mais rápido → o mais rápido)
klein → kleiner → am kleinsten
langsam → langsamer → am langsamsten

Muitos adjetivos curtos (1 sílaba) com a/o/u ganham Umlaut:
alt → älter → am ältesten
groß → größer → am größten
jung → jünger → am jüngsten
kalt → kälter → am kältesten
warm → wärmer → am wärmsten
kurz → kürzer → am kürzesten
lang → länger → am längsten

COMPARAÇÃO: use "als" (não "wie"!) para comparativo:
"Berlin ist größer ALS München." (Berlim é maior DO QUE Munique.)

IGUALDADE: use "so...wie":
"Hamburg ist so groß WIE Köln." (Hamburgo é tão grande COMO Colônia.)`
      },
      {
        title: "Formas irregulares e uso atributivo",
        content: `Formas irregulares que precisam ser memorizadas:
gut → besser → am besten (bom → melhor → o melhor)
viel → mehr → am meisten (muito → mais → o mais)
gern → lieber → am liebsten (de bom grado → preferivelmente → o que mais gosta)
hoch → höher → am höchsten (alto → mais alto → o mais alto)
nah → näher → am nächsten (perto → mais perto → o mais perto)

POSIÇÃO ATRIBUTIVA (antes do substantivo), o superlativo usa artigo + -ste/-sten:
"Der BESTE Arzt" (O melhor médico.) — der + best+e (Nom. masc)
"Die SCHNELLSTE Behandlung" (O tratamento mais rápido.)
"Im NÄCHSTEN Krankenhaus" (No hospital mais próximo.) — im = Dat

O superlativo atributivo declina como qualquer adjetivo: der beste → den besten → dem besten...`
      },
    ],
    examples: [
      { de: "Diese Klinik ist moderner als die andere.", pt: "Esta clínica é mais moderna que a outra.", note: "Comparativo + als" },
      { de: "Er fühlt sich besser als gestern.", pt: "Ele se sente melhor do que ontem.", note: "Irregular: gut → besser" },
      { de: "Das ist das beste Krankenhaus der Stadt.", pt: "Este é o melhor hospital da cidade.", note: "Superlativo atributivo + Genitivo" },
      { de: "Am wichtigsten ist die regelmäßige Einnahme.", pt: "O mais importante é a ingestão regular.", note: "Superlativo predicativo: am + -sten" },
      { de: "Je mehr Sie trinken, desto besser.", pt: "Quanto mais você beber, melhor.", note: "Construção je...desto" },
    ],
    tip: "Para lembrar: comparativo SEMPRE termina em -ER (como inglês: bigger, faster). Superlativo predicativo SEMPRE usa AM + -(E)STEN. E comparação = ALS (não 'wie'!). 'So gut WIE' = tão bom quanto. 'Besser ALS' = melhor do que.",
    mistakes: [
      { wrong: "Berlin ist größer wie München.", right: "Berlin ist größer als München.", why: "Comparativo usa ALS, não wie. 'Wie' é para igualdade (so...wie). É o erro mais comum de estrangeiros." },
      { wrong: "Er ist mehr intelligent.", right: "Er ist intelligenter.", why: "Em alemão, sempre use o sufixo -er, nunca 'mehr + adjetivo' para comparativo. 'Mehr' só é usado com verbos (mehr essen) ou sozinho." },
      { wrong: "Das ist der am besten Arzt.", right: "Das ist der beste Arzt.", why: "Antes de substantivo (uso atributivo), use artigo + -ste/-sten, NÃO 'am...sten'. 'Am besten' é para uso predicativo (Er ist am besten)." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  17. TRENNBARE UND UNTRENNBARE VERBEN                      ║
  // ╚══════════════════════════════════════════════════════════════╝
  "trennbare-verben": {
    topicId: "trennbare-verben",
    sections: [
      {
        title: "Separáveis: o prefixo vai para o final",
        content: `Verbos separáveis (trennbare Verben) são verbos compostos onde o prefixo se separa do verbo na frase principal e vai para o FINAL:

aufstehen (levantar-se) → "Ich STEHE morgen früh AUF." (Eu levanto cedo amanhã.)
anfangen (começar) → "Die Sprechstunde FÄNGT um 8 Uhr AN." (O atendimento começa às 8.)

PREFIXOS SEPARÁVEIS (sempre tônicos — a ênfase recai sobre eles):
ab-, an-, auf-, aus-, bei-, ein-, her-, hin-, los-, mit-, nach-, vor-, weg-, zu-, zurück-

Cada prefixo carrega um significado geral:
auf- = abrir, para cima, início: aufmachen (abrir), aufstehen (levantar)
ein- = para dentro, ingestão: einnehmen (ingerir/tomar), einatmen (inspirar)
aus- = para fora, conclusão: ausatmen (expirar), ausfüllen (preencher)
an- = início, aproximação: anfangen (começar), anrufen (telefonar)
ab- = afastamento, redução: abnehmen (emagrecer/remover), absagen (cancelar)

No contexto médico: "Nehmen Sie das Medikament morgens EIN." (Tome o medicamento de manhã.) "Atmen Sie tief EIN und langsam AUS." (Inspire fundo e expire devagar.)`
      },
      {
        title: "Inseparáveis e exceções",
        content: `Verbos inseparáveis (untrennbare Verben) têm prefixos que NUNCA se separam:
be-, emp-, ent-, er-, ge-, miss-, ver-, zer- (esses prefixos são átonos)

behandeln (tratar) → "Ich BEHANDLE den Patienten." (Trato o paciente.) — 'be-' não separa
verstehen (entender) → "Ich VERSTEHE das nicht." (Não entendo isso.)
empfehlen (recomendar) → "Ich EMPFEHLE Ihnen Ruhe." (Recomendo descanso a você.)
untersuchen (examinar) → "Ich UNTERSUCHE Sie jetzt." (Examino você agora.)

Atenção: prefixos inseparáveis NÃO recebem ge- no Partizip II:
verstehen → verstanden (NÃO: geverstanden)
behandeln → behandelt (NÃO: gebehandelt)

Alguns prefixos podem ser AMBOS (durch-, über-, um-, unter-, wieder-):
umfahren (contornar — separável) vs. umfahren (atropelar — inseparável)
Regra: separável = significado concreto/literal. Inseparável = significado figurado/abstrato.`
      },
    ],
    examples: [
      { de: "Ich stehe jeden Tag um 6 Uhr auf.", pt: "Eu levanto todo dia às 6.", note: "auf|stehen — separável" },
      { de: "Nehmen Sie die Tablette vor dem Essen ein.", pt: "Tome o comprimido antes da refeição.", note: "ein|nehmen — separável (tomar remédio)" },
      { de: "Ich verstehe die Diagnose nicht.", pt: "Não entendo o diagnóstico.", note: "verstehen — inseparável (ver- não separa)" },
      { de: "Wann fängt die Sprechstunde an?", pt: "Quando começa o atendimento?", note: "an|fangen — separável em pergunta" },
      { de: "Der Arzt hat den Patienten untersucht.", pt: "O médico examinou o paciente.", note: "untersuchen — inseparável (Partizip II sem ge-)" },
      { de: "Bitte füllen Sie das Formular aus.", pt: "Por favor, preencha o formulário.", note: "aus|füllen — separável" },
    ],
    tip: "Os prefixos INseparáveis formam a palavra 'Bem Ger Ver Zer Ent Er Emp Miss'. Decore: BE-GE-VER-ZER-ENT-ER-EMP-MISS. Se o prefixo NÃO está nessa lista, provavelmente é separável. Ouça onde cai a tônica: se no PREFIXO (ÁUFstehen), é separável. Se no VERBO (verSTEHen), é inseparável.",
    mistakes: [
      { wrong: "Ich aufstehe um 6 Uhr.", right: "Ich stehe um 6 Uhr auf.", why: "Na frase principal, o verbo conjugado fica na posição 2 e o prefixo vai para o FINAL. O prefixo NÃO fica grudado." },
      { wrong: "Ich habe aufgestanden.", right: "Ich bin aufgestanden.", why: "Aufstehen (mudança de estado) usa sein no Perfekt, não haben. Além disso, aufGEstanden — o ge- fica entre o prefixo e o verbo." },
      { wrong: "Er hat die Patientin geuntersucht.", right: "Er hat die Patientin untersucht.", why: "Untersuchen é inseparável (unter- neste caso). Verbos inseparáveis NÃO recebem ge- no Partizip II." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  18. TEMPORALE PRÄPOSITIONEN                                ║
  // ╚══════════════════════════════════════════════════════════════╝
  "temporale-praepositionen": {
    topicId: "temporale-praepositionen",
    sections: [
      {
        title: "Quando usar cada preposição de tempo",
        content: `Em português, "em" serve para quase tudo temporal: "em janeiro", "em segunda", "em 2025". Em alemão, cada contexto temporal tem sua preposição específica:

AM + dia/data/parte do dia: am Montag (na segunda), am 15. März (em 15 de março), am Morgen (de manhã), am Wochenende (no fim de semana)
EXCEÇÃO: in der Nacht (à noite), nicht am Nacht!

IM + mês/estação: im Januar (em janeiro), im Sommer (no verão), im Herbst (no outono)

UM + hora exata: um 8 Uhr (às 8 horas), um Mitternacht (à meia-noite)

Dica: AM-IM-UM → Dia-Mês-Hora. Pense: A-I-U, do mais específico ao mais amplo.`
      },
      {
        title: "Duração, início e referência",
        content: `SEIT + Dativ = desde (ação que CONTINUA até o presente):
"Seit zwei Wochen habe ich Kopfschmerzen." (Tenho dor de cabeça há duas semanas.)

VOR + Dativ = há / atrás (ação PASSADA, terminada):
"Vor zwei Wochen hatte ich einen Unfall." (Há duas semanas tive um acidente.)

NACH + Dativ = depois de / após:
"Nach der Operation müssen Sie ruhen." (Após a cirurgia, precisa descansar.)

BIS = até (limite temporal, sem artigo ou com zu + Dat):
"Bis Freitag." (Até sexta.) "Bis zum nächsten Termin." (Até a próxima consulta.)

AB + Dativ = a partir de:
"Ab morgen nehmen Sie die neue Dosierung." (A partir de amanhã, tome a nova dosagem.)

IN + Dativ = daqui a (futuro):
"In zwei Wochen kommen Sie wieder." (Daqui a duas semanas, volte.)

FÜR + Akk = por (duração definida):
"Ich verschreibe das für drei Monate." (Prescrevo isso por três meses.)`
      },
    ],
    examples: [
      { de: "Der Termin ist am Dienstag um 14 Uhr.", pt: "A consulta é na terça às 14h.", note: "am (dia) + um (hora)" },
      { de: "Im Winter bin ich oft erkältet.", pt: "No inverno fico resfriado com frequência.", note: "im (estação)" },
      { de: "Seit drei Tagen habe ich Fieber.", pt: "Há três dias tenho febre.", note: "seit (começou e continua)" },
      { de: "Vor einer Woche wurde er operiert.", pt: "Há uma semana ele foi operado.", note: "vor (evento passado)" },
      { de: "Nach dem Essen nehmen Sie die Tablette.", pt: "Depois de comer tome o comprimido.", note: "nach (depois de)" },
      { de: "Kommen Sie in zwei Wochen wieder.", pt: "Volte daqui a duas semanas.", note: "in + Dat (futuro)" },
    ],
    tip: "AM-IM-UM é a regra de ouro: AM dia (am Montag), IM mês (im Mai), UM hora (um 8 Uhr). Para duração: SEIT = desde (até agora), VOR = há (já acabou), IN = daqui a (futuro). Nunca confunda seit e vor!",
    mistakes: [
      { wrong: "In Montag gehe ich zum Arzt.", right: "Am Montag gehe ich zum Arzt.", why: "Dias da semana usam AM, não in. Em PT-BR dizemos 'na segunda', mas em alemão é 'am Montag'." },
      { wrong: "Vor zwei Wochen bin ich krank.", right: "Seit zwei Wochen bin ich krank.", why: "Se a condição CONTINUA até agora → seit. Se TERMINOU → vor. 'Estou doente há duas semanas' (continua) = seit." },
      { wrong: "Ich bin seit 2020 nach Deutschland gekommen.", right: "Ich bin 2020 nach Deutschland gekommen.", why: "Seit é para ações que CONTINUAM. Chegar (kommen) é pontual. Para ano sem continuidade, use apenas o ano sem preposição." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  19. PLUSQUAMPERFEKT                                        ║
  // ╚══════════════════════════════════════════════════════════════╝
  "plusquamperfekt": {
    topicId: "plusquamperfekt",
    sections: [
      {
        title: "O passado antes do passado",
        content: `O Plusquamperfekt (mais-que-perfeito) expressa uma ação que aconteceu ANTES de outra ação passada. Em português: "Quando cheguei, ele já TINHA SAÍDO."

Formação: hatte/war + Partizip II
— hatte (para verbos que usam haben no Perfekt): "Ich hatte gegessen." (Eu tinha comido.)
— war (para verbos que usam sein no Perfekt): "Er war gegangen." (Ele tinha ido.)

A regra de haben vs. sein é a MESMA do Perfekt. Se o verbo usa "ist gegangen" no Perfekt, no Plusquamperfekt será "war gegangen".

No contexto clínico, o Plusquamperfekt é essencial para anamnese: "Bevor der Patient ins Krankenhaus kam, hatte er drei Tage Fieber gehabt." (Antes de o paciente ir ao hospital, ele tinha tido febre por três dias.)`
      },
      {
        title: "Uso com nachdem, bevor, als",
        content: `O Plusquamperfekt aparece quase sempre em combinação com conjunções temporais:

NACHDEM + Plusquamperfekt → Frase principal no Präteritum/Perfekt:
"Nachdem der Arzt die Diagnose gestellt HATTE, begann die Behandlung."
(Depois que o médico fez o diagnóstico, começou o tratamento.)

ALS + Plusquamperfekt (ação anterior):
"Als ich im Krankenhaus ANGEKOMMEN WAR, war der Patient schon entlassen."
(Quando cheguei ao hospital, o paciente já tinha recebido alta.)

BEVOR (a ação posterior no Plusquamperfekt):
"Bevor er zum Arzt ging, hatte er schon Schmerzmittel genommen."
(Antes de ir ao médico, ele já tinha tomado analgésicos.)

Regra prática: a ação que aconteceu PRIMEIRO fica no Plusquamperfekt. A que aconteceu DEPOIS fica no Präteritum ou Perfekt.`
      },
    ],
    examples: [
      { de: "Nachdem der Patient eingeschlafen war, begann die OP.", pt: "Depois que o paciente adormeceu, começou a cirurgia.", note: "nachdem + Plusq. → Prät. na principal" },
      { de: "Als ich ankam, hatte er schon gegessen.", pt: "Quando cheguei, ele já tinha comido.", note: "als + Prät. / hatte + PP" },
      { de: "Er hatte die Tabletten nicht genommen, deshalb ging es ihm schlecht.", pt: "Ele não tinha tomado os comprimidos, por isso se sentia mal.", note: "Plusq. como causa" },
      { de: "Bevor sie das Ergebnis bekam, hatte sie große Angst gehabt.", pt: "Antes de receber o resultado, ela tinha tido muito medo.", note: "bevor + Plusq." },
    ],
    tip: "Pense no Plusquamperfekt como o 'flashback' dentro do passado. Se você está contando uma história no passado (Präteritum) e precisa voltar MAIS atrás → Plusquamperfekt. Nachdem = 'depois que' SEMPRE pede Plusquamperfekt.",
    mistakes: [
      { wrong: "Nachdem er aß, ging er spazieren.", right: "Nachdem er gegessen hatte, ging er spazieren.", why: "Nachdem exige Plusquamperfekt (ação anterior). Usar Präteritum em ambas as orações apaga a sequência temporal." },
      { wrong: "Er war gegessen.", right: "Er hatte gegessen.", why: "Essen usa haben (não sein) no Perfekt → no Plusquamperfekt também: hatte gegessen. War é para verbos de movimento/mudança." },
      { wrong: "Bevor ich bin angekommen, ...", right: "Bevor ich angekommen war, ...", why: "Bevor introduz Nebensatz → verbo no final. Além disso, ankommen usa sein: war angekommen (não bin)." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  20. GENITIV                                                ║
  // ╚══════════════════════════════════════════════════════════════╝
  "genitiv": {
    topicId: "genitiv",
    sections: [
      {
        title: "O caso genitivo: posse e preposições",
        content: `O genitivo indica POSSE (de quem?) e é usado com certas preposições. Em português, usamos "de": "o carro DO médico". Em alemão: "das Auto DES Arztes."

FORMAÇÃO:
Masculino/Neutro: des + substantivo com -(e)s → des Arztes, des Krankenhauses
Feminino/Plural: der → der Ärztin, der Patienten
Artigo indefinido: eines Arztes, einer Ärztin

O -(e)s no final do substantivo masculino/neutro é uma marca adicional do genitivo:
— Substantivos de uma sílaba: +es (des Mannes, des Kindes)
— Substantivos de várias sílabas: +s (des Arztes, des Patienten — com n-Deklination)
— Substantivos terminados em -s, -ß, -z, -x: +es obrigatório (des Flusses)

Na fala coloquial, o genitivo está sendo substituído por "von + Dativ": "das Auto vom Arzt" em vez de "das Auto des Arztes". No entanto, na escrita formal e profissional (prontuários, relatórios), o genitivo é obrigatório.`
      },
      {
        title: "Preposições com genitivo",
        content: `As preposições de genitivo mais importantes para B1:

WEGEN (por causa de): "Wegen der Schmerzen konnte er nicht schlafen." (Por causa das dores, não conseguia dormir.)
TROTZ (apesar de): "Trotz des Fiebers ging er zur Arbeit." (Apesar da febre, foi trabalhar.)
WÄHREND (durante): "Während der Operation saß die Familie im Wartezimmer." (Durante a cirurgia, a família ficou na sala de espera.)
INNERHALB (dentro de): "Innerhalb einer Woche sollte die Schwellung zurückgehen." (Dentro de uma semana o inchaço deveria diminuir.)
AUSSERHALB (fora de): "Außerhalb der Sprechstunde bin ich nicht erreichbar." (Fora do horário de atendimento não estou disponível.)
STATT/ANSTATT (em vez de): "Statt eines Antibiotikums verschrieb er ein Schmerzmittel." (Em vez de um antibiótico, receitou um analgésico.)

Na fala coloquial, wegen e trotz são frequentemente usados com dativo: "wegen dem Regen" (informal). Na escrita: "wegen des Regens" (correto).`
      },
    ],
    examples: [
      { de: "Die Diagnose des Arztes war korrekt.", pt: "O diagnóstico do médico estava correto.", note: "Genitivo masculino: des Arztes" },
      { de: "Trotz der Behandlung besserte sich der Zustand nicht.", pt: "Apesar do tratamento, o estado não melhorou.", note: "trotz + Gen. feminino: der Behandlung" },
      { de: "Während der Untersuchung blieb er ruhig.", pt: "Durante o exame, ele ficou tranquilo.", note: "während + Gen. feminino" },
      { de: "Die Nebenwirkungen des Medikaments sind gering.", pt: "Os efeitos colaterais do medicamento são leves.", note: "Genitivo neutro: des Medikaments" },
      { de: "Wegen eines Unfalls wurde die Straße gesperrt.", pt: "Por causa de um acidente, a rua foi interditada.", note: "wegen + Gen. com artigo indef." },
    ],
    tip: "No genitivo masc./neutro, lembre-se: o artigo muda para DES E o substantivo ganha -(e)S. É um \"duplo S\": dES ArztES. No feminino/plural, só o artigo muda (para DER) e o substantivo fica igual.",
    mistakes: [
      { wrong: "Das Auto des Arzt.", right: "Das Auto des Arztes.", why: "No genitivo masculino/neutro, o substantivo TAMBÉM recebe -(e)s. Não basta mudar o artigo para 'des'." },
      { wrong: "Wegen dem Wetter...", right: "Wegen des Wetters...", why: "Wegen rege genitivo na escrita formal. 'Dem' é dativo. Use 'des Wetters' (neutro, genitivo com -s)." },
      { wrong: "Trotz die Schmerzen...", right: "Trotz der Schmerzen...", why: "Trotz rege genitivo. Plural no genitivo = der (não die). Die é nominativo/acusativo plural." },
    ],
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  21. WORTSTELLUNG IM HAUPTSATZ                              ║
  // ╚══════════════════════════════════════════════════════════════╝
  "wortstellung": {
    topicId: "wortstellung",
    sections: [
      {
        title: "A regra de ouro: verbo na posição 2",
        content: `Em alemão, a frase principal (Hauptsatz) segue uma regra fundamental: o verbo conjugado SEMPRE ocupa a 2ª posição. Isso não significa a segunda PALAVRA, mas o segundo ELEMENTO da frase.

Diferente do português, onde a ordem é relativamente livre, o alemão é rígido com a posição do verbo. Se você mover qualquer elemento para o início da frase, o sujeito precisa trocar de lugar para manter o verbo na posição 2. Isso chama-se "inversão" (Inversion).

Quando há mais de um verbo (modal + infinitivo, ou haben/sein + Partizip II), o verbo conjugado fica na posição 2 e o outro vai para o FINAL da frase. Isso cria o famoso "Satzklammer" (parêntese verbal):
"Ich HABE gestern einen Patienten UNTERSUCHT." (HABE...UNTERSUCHT = parêntese verbal)`
      },
      {
        title: "A ordem TMP e inversão para ênfase",
        content: `Quando a frase tem vários complementos, a ordem preferida é TMP:
Temporal (quando?) → Modal (como?) → Lokal (onde?)

"Ich fahre MORGEN MIT DEM ZUG NACH BERLIN."
(tempo: morgen / modo: mit dem Zug / lugar: nach Berlin)

Ao colocar qualquer elemento diferente do sujeito na posição 1, o sujeito vai para depois do verbo (posição 3). Isso é extremamente comum e não muda o significado, apenas a ênfase:

"Morgen gehe ich zum Arzt." — ênfase no tempo
"Zum Arzt gehe ich morgen." — ênfase no destino
"Leider kann ich nicht kommen." — ênfase no sentimento

A posição 1 conecta a frase com o contexto anterior. Por isso advérbios como deshalb, trotzdem, dann ocupam a posição 1 naturalmente.`
      },
      {
        title: "Posição de nicht",
        content: `A negação "nicht" tem regras de posição específicas:

NICH vai ANTES do elemento que nega:
"Ich komme NICHT morgen." (= venho, mas não amanhã — nego o tempo)
"Ich gehe NICHT ins Kino." (= não vou ao cinema — nego o destino)

Se nega o verbo/frase inteira, NICHT vai para o final (ou antes do infinitivo/Partizip/prefixo):
"Ich verstehe das NICHT." (Não entendo isso.)
"Ich kann das NICHT verstehen." (Não consigo entender isso.)
"Er kommt heute NICHT." (Ele não vem hoje.)

NICHT vai ANTES de: adjetivos predicativos, preposições, infinitivos, Partizip II, prefixos separáveis.
NICHT vai DEPOIS de: verbos conjugados, pronomes, objetos definidos pelo contexto.`
      },
    ],
    examples: [
      { de: "Ich gehe morgen ins Kino.", pt: "Eu vou amanhã ao cinema.", note: "Ordem básica: S-V-T-L" },
      { de: "Morgen gehe ich ins Kino.", pt: "Amanhã eu vou ao cinema.", note: "Inversão — tempo na posição 1" },
      { de: "Ich habe gestern einen Patienten untersucht.", pt: "Eu examinei um paciente ontem.", note: "Satzklammer: habe...untersucht" },
      { de: "Den Patienten habe ich gestern untersucht.", pt: "O paciente, eu examinei ontem.", note: "Akk na pos. 1 → inversão" },
      { de: "Ich fahre morgen mit dem Zug nach Berlin.", pt: "Vou amanhã de trem para Berlim.", note: "Ordem TMP" },
      { de: "Leider kann ich nicht kommen.", pt: "Infelizmente não posso vir.", note: "Advérbio na pos. 1 + nicht antes do infinitivo" },
    ],
    tip: "Imagine a posição 2 como um ímã que atrai o verbo conjugado. Não importa o que estiver na posição 1 — o verbo é puxado para a posição 2, SEMPRE. O sujeito simplesmente se acomoda ao redor. Se você errar a posição do verbo, a frase soa fundamentalmente errada para um alemão.",
    mistakes: [
      { wrong: "Morgen ich gehe ins Kino.", right: "Morgen gehe ich ins Kino.", why: "Quando algo diferente do sujeito está na posição 1, verbo e sujeito se INVERTEM. Brasileiros esquecem a inversão porque em PT-BR 'Amanhã eu vou' não inverte." },
      { wrong: "Ich gehe nicht morgen ins Kino, sondern übermorgen.", right: "Ich gehe nicht morgen, sondern übermorgen ins Kino.", why: "'Nicht' nega o elemento que vem imediatamente depois. Se quer negar o tempo, nicht deve ficar antes dele." },
      { wrong: "Ich gehe nach Berlin mit dem Zug morgen.", right: "Ich fahre morgen mit dem Zug nach Berlin.", why: "A ordem TMP (Tempo-Modal-Local) soa natural. Invertê-la causa estranhamento para falantes nativos." },
    ],
  },
};

// ────────────────────────────────────────────────────────────────────────────────

export function getStaticLesson(topicId: string): StaticGrammarLesson | undefined {
  return LESSONS[topicId];
}

export function hasStaticLesson(topicId: string): boolean {
  return topicId in LESSONS;
}
