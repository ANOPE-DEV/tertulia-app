-- Subscription plans
insert into public.subscription_plans (id, name, tagline, price_cents, description, perks) values
  ('bon_vivant', 'Bon Vivant', 'Para paladares apaixonados e iniciantes.',
   39900,
   'Todo mês, um vinho e um queijo harmonizados escolhidos pelo sommelier, mais um mimo surpresa da casa. Entregue direto na sua porta.',
   '["1 vinho selecionado pelo sommelier",
     "1 queijo harmonizado",
     "1 mimo surpresa da casa",
     "Cartão com nota de degustação",
     "Entrega mensal em casa",
     "Pontos em dobro nas compras avulsas"]'::jsonb),
  ('fin_bec', 'Fin Bec', 'Para paladares exigentes e colecionadores.',
   82000,
   'Rótulos de coleção, queijos de origem e mimos exclusivos — a curadoria mais fina da casa, entregue todo mês.',
   '["1 vinho de coleção (safra e lote limitado)",
     "1 queijo de origem controlada",
     "1 mimo exclusivo (charutos, taças, acessórios)",
     "Cartão do sommelier com harmonização",
     "Acesso antecipado a lotes limitados",
     "Sommelier disponível por WhatsApp",
     "Entrega mensal em casa"]'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  price_cents = excluded.price_cents,
  description = excluded.description,
  perks = excluded.perks;

-- Rewards
insert into public.rewards (id, name, cost, sort_order) values
  ('saca', 'Saca-rolhas de sommelier', 800, 10),
  ('cortador', 'Cortador de charuto duplo', 1200, 20),
  ('tacas', 'Par de taças de cristal', 2000, 30),
  ('degust', 'Degustação guiada na loja, para 2', 3000, 40)
on conflict (id) do update set
  name = excluded.name,
  cost = excluded.cost,
  sort_order = excluded.sort_order;
