export type Category = "queijos" | "vinhos" | "charutos" | "casa" | "kit";

export interface Product {
  id: string;
  cat: Category;
  name: string;
  origin: string;
  price: number;
  old?: number;
  unit: string;
  stock: number;
  rating: number;
  reviews: number;
  badge: string;
  desc: string;
  note: string;
}

export interface CategoryDef {
  id: Exclude<Category, "kit">;
  label: string;
  title: string;
  sub: string;
}

export interface Pairing {
  w: string;
  c: string;
  why: string;
  ids: string[];
}

export interface Article {
  id: string;
  kicker: string;
  mins: number;
  title: string;
  lede: string;
  body: string[];
  shop: string;
  shopLabel: string;
}

export interface QuizItem {
  q: string;
  o: string[];
  a: number;
  e: string;
}

export interface GlossaryItem {
  t: string;
  d: string;
}

export interface Level {
  name: string;
  min: number;
  perk: string;
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
}

export const P: Product[] = [
  { id: "comte", cat: "queijos", name: "Comté 18 meses", origin: "Jura, França", price: 89, unit: "200 g", stock: 4, rating: 4.9, reviews: 132, badge: "Mais vendido", desc: "Massa firme com notas de avelã tostada e manteiga. Afinado por 18 meses em caves de pedra no Jura.", note: "Sirva em lascas finas, com um Chablis gelado." },
  { id: "parm", cat: "queijos", name: "Parmigiano Reggiano 24 meses", origin: "Emília-Romanha, Itália", price: 78, unit: "200 g", stock: 12, rating: 4.8, reviews: 210, badge: "", desc: "Cristais crocantes e final longo, levemente adocicado. Quebre em lascas com faca de ponta.", note: "Com gotas de balsâmico envelhecido." },
  { id: "roq", cat: "queijos", name: "Roquefort AOP", origin: "Aveyron, França", price: 69, unit: "150 g", stock: 3, rating: 4.7, reviews: 64, badge: "", desc: "Leite de ovelha maturado em cavernas naturais. Veios azuis intensos, textura cremosa e final salino.", note: "Com Sauternes ou mel de flor de laranjeira." },
  { id: "manch", cat: "queijos", name: "Manchego Curado", origin: "La Mancha, Espanha", price: 72, unit: "200 g", stock: 9, rating: 4.8, reviews: 88, badge: "", desc: "Leite de ovelha manchega, 12 meses de cura. Firme, amanteigado, com notas de nozes.", note: "Com Rioja e marmelada." },
  { id: "barolo", cat: "vinhos", name: "Barolo DOCG 2018", origin: "Piemonte, Itália", price: 420, unit: "750 ml", stock: 6, rating: 4.9, reviews: 57, badge: "Sommelier indica", desc: "Nebbiolo de taninos firmes, com cereja, rosas secas e um toque de alcatrão. Safra em ótimo momento.", note: "Decante uma hora antes de servir." },
  { id: "chablis", cat: "vinhos", name: "Chablis Premier Cru 2021", origin: "Borgonha, França", price: 310, unit: "750 ml", stock: 5, rating: 4.8, reviews: 41, badge: "Lote limitado", desc: "Chardonnay mineral e cítrico, sem passagem por madeira. Recebemos 24 garrafas deste lote.", note: "Sirva entre 10 e 12 °C." },
  { id: "douro", cat: "vinhos", name: "Douro Tinto Reserva 2019", origin: "Douro, Portugal", price: 189, unit: "750 ml", stock: 18, rating: 4.7, reviews: 176, badge: "Mais vendido", desc: "Touriga Nacional e Touriga Franca. Fruta escura, esteva e taninos macios.", note: "Vai bem com queijos curados e carnes assadas." },
  { id: "rioja", cat: "vinhos", name: "Rioja Gran Reserva 2015", origin: "Rioja, Espanha", price: 260, unit: "750 ml", stock: 7, rating: 4.8, reviews: 69, badge: "", desc: "Tempranillo com cinco anos entre barrica e garrafa. Couro, baunilha e frutas secas.", note: "Com Manchego curado, sem erro." },
  { id: "robusto", cat: "charutos", name: "Robusto Maduro", origin: "Estelí, Nicarágua", price: 68, unit: "unidade", stock: 14, rating: 4.8, reviews: 95, badge: "Mais vendido", desc: "Capa maduro oleosa, notas de cacau e café. Cerca de 50 minutos de fumada.", note: "Com um Porto Tawny ou café coado." },
  { id: "corona", cat: "charutos", name: "Corona Habano", origin: "Vuelta Abajo, Cuba", price: 112, unit: "unidade", stock: 4, rating: 4.9, reviews: 38, badge: "Lote limitado", desc: "Terroso e cremoso, com cedro e especiarias. Guardado em umidor a 70%.", note: "Com rum envelhecido." },
  { id: "petit", cat: "charutos", name: "Petit Corona", origin: "República Dominicana", price: 46, unit: "unidade", stock: 22, rating: 4.6, reviews: 51, badge: "", desc: "Suave e floral, ideal para 30 minutos. Bom ponto de partida.", note: "Para quem está começando." },
  { id: "velatab", cat: "casa", name: "Vela Tabaco & Baunilha", origin: "Cera de soja · 220 g", price: 139, unit: "unidade", stock: 8, rating: 4.9, reviews: 112, badge: "Mais vendido", desc: "Cerca de 45 horas de queima, pavio de algodão, pote de vidro âmbar.", note: "Acenda 20 minutos antes dos convidados." },
  { id: "velafigo", cat: "casa", name: "Vela Figo & Couro", origin: "Cera de soja · 220 g", price: 139, unit: "unidade", stock: 5, rating: 4.8, reviews: 47, badge: "", desc: "Figo maduro sobre fundo de couro e cedro. 45 horas de queima.", note: "" },
  { id: "tabua", cat: "casa", name: "Tábua de oliveira", origin: "Madeira maciça · 40 cm", price: 220, unit: "unidade", stock: 6, rating: 4.9, reviews: 29, badge: "", desc: "Cada peça tem veios únicos. Acabamento em óleo mineral.", note: "Hidrate com óleo mineral uma vez por mês." },
  { id: "kfranca", cat: "kit", name: "Noite Francesa", origin: "Chablis 1er Cru · Comté 18 meses · Roquefort AOP", price: 430, old: 468, unit: "kit para 4 pessoas", stock: 5, rating: 4.9, reviews: 36, badge: "Sommelier indica", desc: "Um branco mineral e dois queijos franceses de estilos opostos. Acompanha cartão com a ordem de degustação.", note: "Comece pelo Comté e termine no Roquefort." },
  { id: "kclassica", cat: "kit", name: "Tertúlia Clássica", origin: "Barolo 2018 · Parmigiano 24 meses · Robusto Maduro", price: 520, old: 566, unit: "kit para 2 pessoas", stock: 3, rating: 5.0, reviews: 22, badge: "Lote limitado", desc: "Vinho, queijo e charuto para uma noite longa. O kit que dá nome à casa.", note: "Deixe o charuto para depois do último gole." },
  { id: "kaconchego", cat: "kit", name: "Presente Aconchego", origin: "Douro Reserva · Manchego Curado · Vela Tabaco & Baunilha", price: 365, old: 400, unit: "caixa presente", stock: 9, rating: 4.8, reviews: 58, badge: "Mais vendido", desc: "Em caixa de madeira com laço, pronto para presentear. Incluímos cartão escrito à mão.", note: "" },
];

export const CATS: CategoryDef[] = [
  { id: "queijos", label: "Queijos", title: "Queijos", sub: "Afinados e cortados na hora do pedido." },
  { id: "vinhos", label: "Vinhos", title: "Vinhos", sub: "Seleção do sommelier, guardados a 14 °C." },
  { id: "charutos", label: "Charutos", title: "Charutos", sub: "Conservados em umidor a 70% de umidade." },
  { id: "casa", label: "Casa", title: "Casa e presentes", sub: "Velas, tábuas e acessórios para receber." },
];

export const PAIR: Pairing[] = [
  { w: "Chablis 1er Cru", c: "Comté 18 meses", why: "A acidez do Chablis limpa a gordura e realça a avelã do Comté.", ids: ["chablis", "comte"] },
  { w: "Rioja Gran Reserva", c: "Manchego Curado", why: "Clássico espanhol: o carvalho do Rioja acompanha as notas de nozes do queijo.", ids: ["rioja", "manch"] },
  { w: "Barolo 2018", c: "Parmigiano 24 meses", why: "Taninos firmes pedem um queijo duro e salgado.", ids: ["barolo", "parm"] },
  { w: "Sauternes", c: "Roquefort AOP", why: "Doce contra salgado, a combinação mais famosa da França.", ids: ["roq"] },
];

export const ART: Article[] = [
  { id: "rotulo", kicker: "Vinho", mins: 4, title: "Como ler um rótulo de vinho europeu", lede: "Região, classificação e safra dizem mais que a uva.", body: ["Na Europa, o rótulo costuma destacar o lugar, não a uva. Um Barolo é sempre Nebbiolo; um Chablis é sempre Chardonnay. A lei da denominação de origem define o que pode ser plantado ali.", "Siglas como DOCG, AOP e DOC indicam o nível de controle. Quanto mais específica a área, mais rígidas as regras de produção e envelhecimento.", "A safra informa o ano da colheita. Em regiões de clima instável, como a Borgonha, ela muda muito o estilo do vinho de um ano para o outro."], shop: "barolo", shopLabel: "Ver o Barolo DOCG 2018" },
  { id: "cascas", kicker: "Queijo", mins: 3, title: "Casca florida, lavada ou natural", lede: "A casca conta como o queijo foi maturado.", body: ["Casca florida é aquela penugem branca de fungos, típica do Brie e do Camembert. Deixa a massa cremosa de fora para dentro.", "Casca lavada recebe banhos de salmoura, cerveja ou vinho durante a maturação. O aroma é forte, mas o sabor costuma ser mais suave do que o cheiro sugere.", "Casca natural se forma sozinha com o tempo, como no Comté e no Parmigiano. É firme, seca e geralmente não se come."], shop: "comte", shopLabel: "Ver o Comté 18 meses" },
  { id: "temperatura", kicker: "Serviço", mins: 2, title: "A temperatura certa para cada garrafa", lede: "Tinto em temperatura ambiente brasileira quase sempre está quente demais.", body: ["Brancos leves e espumantes vão bem entre 6 e 10 °C. Brancos com mais corpo, como um Chablis Premier Cru, entre 10 e 12 °C.", "Tintos leves pedem cerca de 14 °C; tintos estruturados, como Barolo e Rioja, entre 16 e 18 °C. Vinte minutos na geladeira antes de servir costumam resolver.", "Queijos também têm temperatura: tire da geladeira uma hora antes para que aromas e textura apareçam."], shop: "chablis", shopLabel: "Ver o Chablis Premier Cru" },
];

export const QUIZ: QuizItem[] = [
  { q: "Qual uva é a base do Barolo?", o: ["Sangiovese", "Nebbiolo", "Tempranillo"], a: 1, e: "O Barolo é 100% Nebbiolo, do Piemonte." },
  { q: "Em que temperatura se serve um Chablis Premier Cru?", o: ["Entre 4 e 6 °C", "Entre 10 e 12 °C", "Em torno de 18 °C"], a: 1, e: "Frio demais esconde os aromas; 10 a 12 °C é o ponto." },
  { q: "O Roquefort é feito com leite de:", o: ["Vaca", "Cabra", "Ovelha"], a: 2, e: "Leite de ovelha da raça Lacaune, por lei." },
  { q: "O que é a “capa” de um charuto?", o: ["A folha externa", "O anel de papel", "A ponta que se corta"], a: 0, e: "A capa é a folha externa, responsável por boa parte do sabor e da aparência." },
];

export const GLOSS: GlossaryItem[] = [
  { t: "Terroir", d: "O conjunto de solo, clima, relevo e tradição que dá identidade a um vinho ou queijo de um lugar." },
  { t: "Taninos", d: "Compostos da casca e da semente da uva que causam a sensação de secura na boca." },
  { t: "Afinação", d: "Período de maturação do queijo em ambiente controlado, quando ele desenvolve sabor e textura." },
  { t: "Decantar", d: "Passar o vinho para outro recipiente para separar sedimentos e deixá-lo respirar." },
  { t: "DOC, DOCG, AOP", d: "Selos de denominação de origem que garantem região e regras de produção." },
  { t: "Corpo", d: "A sensação de peso do vinho na boca, ligada a álcool, açúcar e extrato." },
  { t: "Capa", d: "A folha externa do charuto, a mais nobre e delicada." },
  { t: "Umidor", d: "Caixa ou sala com umidade controlada, em torno de 70%, para conservar charutos." },
];

export const LEVELS: Level[] = [
  { name: "Apreciador", min: 0, perk: "Pontos em toda compra e quiz semanal." },
  { name: "Connoisseur", min: 1500, perk: "Acesso antecipado a lotes limitados e pontos em dobro no aniversário." },
  { name: "Mestre", min: 4000, perk: "Degustação anual exclusiva e sommelier por WhatsApp." },
];

export const REWARDS: Reward[] = [
  { id: "saca", name: "Saca-rolhas de sommelier", cost: 800 },
  { id: "cortador", name: "Cortador de charuto duplo", cost: 1200 },
  { id: "tacas", name: "Par de taças de cristal", cost: 2000 },
  { id: "degust", name: "Degustação guiada na loja, para 2", cost: 3000 },
];

export const TAB_ICONS: Record<string, string> = {
  home: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8 M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  shop: "M8 22h8 M7 10h10 M12 15v7 M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z",
  kits: "M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z",
  learn: "M12 7v14 M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
  club: "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526 M18 8a6 6 0 1 1-12 0a6 6 0 1 1 12 0",
};

export const brl = (n: number) =>
  "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const num = (n: number) => n.toLocaleString("pt-BR");

export const byId = (id: string) => P.find((p) => p.id === id)!;
