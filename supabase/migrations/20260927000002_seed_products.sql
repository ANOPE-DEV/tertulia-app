-- Seed products from lib/data.ts (17 items across 5 categories)
insert into public.products (id, cat, name, origin, price, unit, stock, rating, reviews, badge, description, sommelier_note, sort_order) values
  ('comte', 'queijos', 'Comté 18 meses', 'Jura, França', 89, '200 g', 4, 4.9, 132, 'Mais vendido', 'Massa firme com notas de avelã tostada e manteiga. Afinado por 18 meses em caves de pedra no Jura.', 'Sirva em lascas finas, com um Chablis gelado.', 10),
  ('parm', 'queijos', 'Parmigiano Reggiano 24 meses', 'Emília-Romanha, Itália', 78, '200 g', 12, 4.8, 210, '', 'Cristais crocantes e final longo, levemente adocicado. Quebre em lascas com faca de ponta.', 'Com gotas de balsâmico envelhecido.', 20),
  ('roq', 'queijos', 'Roquefort AOP', 'Aveyron, França', 69, '150 g', 3, 4.7, 64, '', 'Leite de ovelha maturado em cavernas naturais. Veios azuis intensos, textura cremosa e final salino.', 'Com Sauternes ou mel de flor de laranjeira.', 30),
  ('manch', 'queijos', 'Manchego Curado', 'La Mancha, Espanha', 72, '200 g', 9, 4.8, 88, '', 'Leite de ovelha manchega, 12 meses de cura. Firme, amanteigado, com notas de nozes.', 'Com Rioja e marmelada.', 40),
  ('barolo', 'vinhos', 'Barolo DOCG 2018', 'Piemonte, Itália', 420, '750 ml', 6, 4.9, 57, 'Sommelier indica', 'Nebbiolo de taninos firmes, com cereja, rosas secas e um toque de alcatrão. Safra em ótimo momento.', 'Decante uma hora antes de servir.', 10),
  ('chablis', 'vinhos', 'Chablis Premier Cru 2021', 'Borgonha, França', 310, '750 ml', 5, 4.8, 41, 'Lote limitado', 'Chardonnay mineral e cítrico, sem passagem por madeira. Recebemos 24 garrafas deste lote.', 'Sirva entre 10 e 12 °C.', 20),
  ('douro', 'vinhos', 'Douro Tinto Reserva 2019', 'Douro, Portugal', 189, '750 ml', 18, 4.7, 176, 'Mais vendido', 'Touriga Nacional e Touriga Franca. Fruta escura, esteva e taninos macios.', 'Vai bem com queijos curados e carnes assadas.', 30),
  ('rioja', 'vinhos', 'Rioja Gran Reserva 2015', 'Rioja, Espanha', 260, '750 ml', 7, 4.8, 69, '', 'Tempranillo com cinco anos entre barrica e garrafa. Couro, baunilha e frutas secas.', 'Com Manchego curado, sem erro.', 40),
  ('robusto', 'charutos', 'Robusto Maduro', 'Estelí, Nicarágua', 68, 'unidade', 14, 4.8, 95, 'Mais vendido', 'Capa maduro oleosa, notas de cacau e café. Cerca de 50 minutos de fumada.', 'Com um Porto Tawny ou café coado.', 10),
  ('corona', 'charutos', 'Corona Habano', 'Vuelta Abajo, Cuba', 112, 'unidade', 4, 4.9, 38, 'Lote limitado', 'Terroso e cremoso, com cedro e especiarias. Guardado em umidor a 70%.', 'Com rum envelhecido.', 20),
  ('petit', 'charutos', 'Petit Corona', 'República Dominicana', 46, 'unidade', 22, 4.6, 51, '', 'Suave e floral, ideal para 30 minutos. Bom ponto de partida.', 'Para quem está começando.', 30),
  ('velatab', 'casa', 'Vela Tabaco & Baunilha', 'Cera de soja · 220 g', 139, 'unidade', 8, 4.9, 112, 'Mais vendido', 'Cerca de 45 horas de queima, pavio de algodão, pote de vidro âmbar.', 'Acenda 20 minutos antes dos convidados.', 10),
  ('velafigo', 'casa', 'Vela Figo & Couro', 'Cera de soja · 220 g', 139, 'unidade', 5, 4.8, 47, '', 'Figo maduro sobre fundo de couro e cedro. 45 horas de queima.', '', 20),
  ('tabua', 'casa', 'Tábua de oliveira', 'Madeira maciça · 40 cm', 220, 'unidade', 6, 4.9, 29, '', 'Cada peça tem veios únicos. Acabamento em óleo mineral.', 'Hidrate com óleo mineral uma vez por mês.', 30)
on conflict (id) do update set
  cat = excluded.cat,
  name = excluded.name,
  origin = excluded.origin,
  price = excluded.price,
  unit = excluded.unit,
  stock = excluded.stock,
  rating = excluded.rating,
  reviews = excluded.reviews,
  badge = excluded.badge,
  description = excluded.description,
  sommelier_note = excluded.sommelier_note,
  sort_order = excluded.sort_order;

-- Kits (with old_price for savings display)
insert into public.products (id, cat, name, origin, price, old_price, unit, stock, rating, reviews, badge, description, sommelier_note, sort_order) values
  ('kfranca', 'kit', 'Noite Francesa', 'Chablis 1er Cru · Comté 18 meses · Roquefort AOP', 430, 468, 'kit para 4 pessoas', 5, 4.9, 36, 'Sommelier indica', 'Um branco mineral e dois queijos franceses de estilos opostos. Acompanha cartão com a ordem de degustação.', 'Comece pelo Comté e termine no Roquefort.', 10),
  ('kclassica', 'kit', 'Tertúlia Clássica', 'Barolo 2018 · Parmigiano 24 meses · Robusto Maduro', 520, 566, 'kit para 2 pessoas', 3, 5.0, 22, 'Lote limitado', 'Vinho, queijo e charuto para uma noite longa. O kit que dá nome à casa.', 'Deixe o charuto para depois do último gole.', 20),
  ('kaconchego', 'kit', 'Presente Aconchego', 'Douro Reserva · Manchego Curado · Vela Tabaco & Baunilha', 365, 400, 'caixa presente', 9, 4.8, 58, 'Mais vendido', 'Em caixa de madeira com laço, pronto para presentear. Incluímos cartão escrito à mão.', '', 30)
on conflict (id) do update set
  cat = excluded.cat,
  name = excluded.name,
  origin = excluded.origin,
  price = excluded.price,
  old_price = excluded.old_price,
  unit = excluded.unit,
  stock = excluded.stock,
  rating = excluded.rating,
  reviews = excluded.reviews,
  badge = excluded.badge,
  description = excluded.description,
  sommelier_note = excluded.sommelier_note,
  sort_order = excluded.sort_order;
