'use strict';
/* ---------- CONTENT: the 10-day travel deck ----------
   Every item keeps its Italian text in the field `fr` (the field name is shared with the French app, Parlons Voyage,
   so that fixes in one code base can be carried over to the other). */
const pad2 = n => String(n).padStart(2, '0');

/* ---------- IPA -> Russian respelling with the stress mark (approximate, for learners) ---------- */
const CY_CONS = { p: 'п', b: 'б', t: 'т', d: 'д', k: 'к', g: 'г', f: 'ф', v: 'в', s: 'с', z: 'з', m: 'м', n: 'н', 'ŋ': 'н', l: 'л', r: 'р', 'ʃ': 'ш', 'ʒ': 'ж', h: 'х', x: 'х', 'tʃ': 'ч', 'dʒ': 'дж', ts: 'ц', dz: 'дз' };
const CY_VOW = { a: 'а', e: 'е', 'ɛ': 'е', i: 'и', o: 'о', 'ɔ': 'о', u: 'у' };
// a vowel after a soft sound (ʎ, ɲ, j): ля, лье, льо, лью
const CY_SOFT = { a: 'я', e: 'е', 'ɛ': 'е', o: 'о', 'ɔ': 'о', u: 'ю', i: 'и' };
// j + vowel at the start of a word or after a vowel: я, е, йо, ю
const CY_J = { a: 'я', e: 'е', 'ɛ': 'е', o: 'йо', 'ɔ': 'йо', u: 'ю', i: 'и' };
const ACUTE = '́';
const CY_HARD = ['ts', 'tʃ', 'ʃ', 'dʒ', 'ʒ', 'dz'];
function cyWord(w) {
  const tk = [];
  for (let i = 0; i < w.length; i++) {
    const two = w.slice(i, i + 2);
    if (['tʃ', 'dʒ', 'ts', 'dz'].includes(two)) { tk.push(two); i++; } else if (!'ː.‿'.includes(w[i])) tk.push(w[i]);
  }
  const isV = t => t in CY_VOW;
  const near = (k, step) => { for (let j = k + step; j >= 0 && j < tk.length; j += step) if (tk[j] !== 'ˈ') return tk[j]; return ''; };
  let out = '', stress = false, mode = '';   // mode: how the next vowel is written after a soft sound or a glide
  const mark = () => { if (stress) { stress = false; return ACUTE; } return ''; };
  tk.forEach((t, k) => {
    const prev = near(k, -1), next = near(k, 1);
    if (t === 'ˈ') { stress = true; return; }
    if (isV(t)) {
      if (mode === 'soft') { out += CY_SOFT[t] + mark(); mode = ''; return; }
      if (mode === 'j') { out += CY_J[t] + mark(); mode = ''; return; }
      if (mode === 'ji') { out += 'и' + CY_VOW[t] + mark(); mode = ''; return; }
      // i after a vowel (not u) that is not followed by one and not stressed is a glide: mai, poi, lei (but lui)
      if (t === 'i' && prev && isV(prev) && prev !== 'u' && !(next && isV(next)) && !stress) { out += 'й'; return; }
      out += ((t === 'e' || t === 'ɛ') && (!prev || isV(prev)) ? 'э' : CY_VOW[t]) + mark();
      return;
    }
    if (t === 'j') {
      if (!(next && isV(next))) out += 'й';
      else if (!prev || isV(prev)) mode = 'j';
      else if (CY_HARD.includes(prev)) mode = 'ji';
      else { out += 'ь'; mode = 'soft'; }
      return;
    }
    if (t === 'w') { out += 'у'; return; }
    if (t === 'ʎ' || t === 'ɲ') {
      if (next === t) return;   // double: written once
      out += (t === 'ʎ' ? 'ль' : 'нь');
      if (next && isV(next)) mode = 'soft';
      return;
    }
    // a consonant doubled before an affricate keeps the affricate letter: pizza, cappuccino
    if (t === 't' && (next === 'ts' || next === 'tʃ')) { out += CY_CONS[next]; return; }
    if (t === 'd' && (next === 'dz' || next === 'dʒ')) { out += 'д'; return; }
    out += CY_CONS[t] || '';
  });
  return out;
}
function ipaCy(ipa) {
  return ipa.split(' / ').map(form => form.split(' ').map(w => {
    const m = w.match(/^([^,.!?;:]*)([,.!?;:]*)$/);
    return m ? cyWord(m[1]) + m[2] : cyWord(w);
  }).join(' ')).join(' / ');
}

const DAYS = [
  { d: 1, e: '👋', en: 'Greetings & asking to repeat', ru: 'Приветствие и переспрос' },
  { d: 2, e: '☕', en: 'At the bar: coffee & cornetto', ru: 'Бар: кофе и корнетто' },
  { d: 3, e: '💶', en: 'Prices & payment', ru: 'Цены и оплата' },
  { d: 4, e: '🍝', en: 'Restaurant', ru: 'Ресторан' },
  { d: 5, e: '🏨', en: 'Hotel', ru: 'Отель' },
  { d: 6, e: '🧭', en: 'Getting around', ru: 'Дорога и ориентирование' },
  { d: 7, e: '🔁', en: 'Review & role-play', ru: 'Повторение и диалоги', review: true },
  { d: 8, e: '🍅', en: 'Market & shop', ru: 'Рынок и магазин' },
  { d: 9, e: '🆘', en: 'Help & problems', ru: 'Помощь и проблемы' },
  { d: 10, e: '🎭', en: 'Final dialogues', ru: 'Итоговые диалоги', review: true },
];
const DAY = Object.fromEntries(DAYS.map(x => [x.d, x]));

// k: 's' = Say it, 'h' = Understand by ear
const PF = 'per faˈvore';
const ph = (d, n, k, sc, en, fr, ru, ipa, ne, nr) => {
  ipa = ipa.replace('{pf}', PF);
  return { id: `it-d${pad2(d)}-${pad2(n)}`, kind: 'ph', d, k, sc, en, fr, ru, ipa, cy: ipaCy(ipa), ne, nr };
};

const PH = [
  /* Day 1 */
  ph(1, 1, 's', '👋🙂', 'Hello / Good morning', 'Buongiorno!', 'Здравствуйте! / Добрый день!', 'bwonˈdʒorno',
    'Until mid-afternoon; later say Buonasera. This deck uses the polite form Lei.', 'До середины дня; ближе к вечеру говорят Buonasera. В этой колоде — вежливое обращение Lei.'),
  ph(1, 2, 's', '🙏😊', 'Thank you', 'Grazie.', 'Спасибо.', 'ˈgrattsje',
    'Works as a stand-alone reply; Grazie mille = thanks a lot.', 'Можно использовать как самостоятельную реплику; Grazie mille — большое спасибо.'),
  ph(1, 3, 's', '🙋', 'Excuse me', 'Mi scusi.', 'Извините.', 'mi ˈskuzi',
    'Scusi is polite (Lei); scusa is for friends.', 'Scusi — вежливо (Lei); scusa — для своих.'),
  ph(1, 4, 's', '🤷❓', 'I don’t understand', 'Non capisco.', 'Я не понимаю.', 'non kaˈpisko',
    'Follow it with a request to repeat or to speak slowly.', 'После этого можно попросить повторить или говорить медленнее.'),
  ph(1, 5, 's', '🔁🗣️', 'Can you repeat that, please?', 'Può ripetere, per favore?', 'Вы можете повторить, пожалуйста?', 'pwɔ riˈpɛtere, {pf}',
    'Può = can you (polite Lei); say it as one chunk.', 'Può — «вы можете» (вежливо, Lei); произносим как цельную реплику.'),
  ph(1, 6, 's', '🐢🗣️', 'More slowly, please', 'Più piano, per favore.', 'Помедленнее, пожалуйста.', 'pju ˈpjano, {pf}',
    'piano = slowly, softly; più = more.', 'piano — медленно, тихо; più — более.'),
  ph(1, 7, 's', '👋🚪', 'Goodbye', 'Arrivederci!', 'До свидания!', 'arriveˈdertʃi',
    'To close a conversation; Ciao is only for friends.', 'Для завершения разговора; Ciao — только для своих.'),

  /* Day 2 */
  ph(2, 1, 's', '☕🧍', 'An espresso, please', 'Un caffè, per favore.', 'Кофе (эспрессо), пожалуйста.', 'un kafˈfɛ, {pf}',
    'In Italy un caffè is a small espresso.', 'В Италии un caffè — это маленький эспрессо.'),
  ph(2, 2, 's', '💧🥤', 'Still water, please', 'Un’acqua naturale, per favore.', 'Воду без газа, пожалуйста.', 'unˈakkwa natuˈrale, {pf}',
    'naturale = still; frizzante = sparkling.', 'naturale — без газа; frizzante — с газом.'),
  ph(2, 3, 's', '🥐☕', 'A cappuccino and a croissant, please', 'Un cappuccino e un cornetto, per favore.', 'Капучино и круассан, пожалуйста.',
    'un kapputˈtʃino e un korˈnetto, {pf}',
    'il cornetto = the Italian croissant (in the north often brioche).', 'il cornetto — итальянский круассан (на севере часто brioche).'),
  ph(2, 4, 's', '🧍☕', 'At the counter, please', 'Al banco, per favore.', 'У стойки, пожалуйста.', 'al ˈbaŋko, {pf}',
    'Coffee at the counter is usually cheaper than at a table.', 'Кофе у стойки обычно дешевле, чем за столиком.'),
  ph(2, 5, 's', '🥡☕', 'To take away, please', 'Da portare via, per favore.', 'С собой, пожалуйста.', 'da porˈtare ˈvia, {pf}',
    'The answer to: Qui o da portare via?', 'Ответ на вопрос Qui o da portare via?'),
  ph(2, 6, 'h', '🪑❓🥡', 'For here or to take away?', 'Qui o da portare via?', 'Здесь или с собой?', 'kwi o da porˈtare ˈvia',
    'Answer Qui or Da portare via.', 'Нужно ответить Qui или Da portare via.'),
  ph(2, 7, 's', '🙅🙂', 'No, thank you', 'No, grazie.', 'Нет, спасибо.', 'nɔ, ˈgrattsje',
    'For example, when they offer you something else.', 'Например, когда предлагают что-то ещё.'),

  /* Day 3 */
  ph(3, 1, 's', '🏷️❓', 'How much is it?', 'Quanto costa?', 'Сколько это стоит?', 'ˈkwanto ˈkɔsta',
    'For several items: Quanto costano?', 'Для нескольких вещей: Quanto costano?'),
  ph(3, 2, 's', '💳❓', 'Can I pay by card?', 'Posso pagare con la carta?', 'Я могу оплатить картой?', 'ˈpɔsso paˈgare kon la ˈkarta',
    'con la carta = by card.', 'con la carta — картой.'),
  ph(3, 3, 's', '💳🙂', 'By card, please', 'Con la carta, per favore.', 'Картой, пожалуйста.', 'kon la ˈkarta, {pf}',
    'A short answer when asked how you’ll pay.', 'Короткий ответ, когда спрашивают способ оплаты.'),
  ph(3, 4, 'h', '💳❓💶', 'By card or in cash?', 'Con la carta o in contanti?', 'Картой или наличными?', 'kon la ˈkarta o in konˈtanti',
    'in contanti = in cash; learn to recognize it.', 'in contanti — наличными; это выражение для узнавания.'),
  ph(3, 5, 's', '✍️🏷️', 'Can you write down the price, please?', 'Può scrivere il prezzo, per favore?', 'Вы можете написать цену, пожалуйста?',
    'pwɔ ˈskrivere il ˈprɛttso, {pf}',
    'A fallback way to confirm the amount.', 'Запасной способ уточнить сумму.'),
  ph(3, 6, 'h', '🧾💶', 'That’s twelve euros fifty', 'Sono dodici euro e cinquanta.', 'С вас 12 евро 50 центов.', 'ˈsono ˈdoditʃi ˈɛuro e tʃiŋˈkwanta',
    'euro does not change in the plural; practise other amounts too.', 'euro во множественном числе не меняется; для проверки используем и другие суммы.'),
  ph(3, 7, 's', '🧾🙂', 'The receipt, please', 'Lo scontrino, per favore.', 'Чек, пожалуйста.', 'lo skonˈtrino, {pf}',
    'lo scontrino = the till receipt; shops give it to you as a rule.', 'lo scontrino — кассовый чек; в Италии его выдают всегда.'),

  /* Day 4 */
  ph(4, 1, 's', '🪑🪑', 'A table for two, please', 'Un tavolo per due, per favore.', 'Столик на двоих, пожалуйста.', 'un ˈtavolo per ˈdue, {pf}',
    'il tavolo = table; per due = for two.', 'il tavolo — стол; per due — на двоих.'),
  ph(4, 2, 'h', '📅❓', 'Have you booked?', 'Ha prenotato?', 'Вы бронировали?', 'a prenoˈtato',
    'You can answer No or Sì, a nome Anna. The h is silent.', 'Можно ответить No или Sì, a nome Anna. Буква h не читается.'),
  ph(4, 3, 's', '📖🍽️', 'The menu, please', 'Il menù, per favore.', 'Меню, пожалуйста.', 'il meˈnu, {pf}',
    'Stress on the last syllable: menù.', 'Ударение на последний слог: menù.'),
  ph(4, 4, 's', '🍷🏠', 'The house wine, please', 'Il vino della casa, per favore.', 'Домашнее вино, пожалуйста.', 'il ˈvino ˈdella ˈkasa, {pf}',
    'Often served by the carafe: un quarto (¼ l), mezzo litro (½ l).', 'Часто подают в графине: un quarto (¼ л), mezzo litro (½ л).'),
  ph(4, 5, 's', '🧾🍽️', 'The bill, please', 'Il conto, per favore.', 'Счёт, пожалуйста.', 'il ˈkonto, {pf}',
    'Il coperto on the bill is the cover charge.', 'Il coperto в счёте — плата за обслуживание стола.'),
  ph(4, 6, 's', '🤔🍽️', 'What do you recommend?', 'Che cosa mi consiglia?', 'Что вы мне посоветуете?', 'ke ˈkɔsa mi konˈsiʎʎa',
    'The answer may be hard to follow: it’s fine to ask them to point to it on the menu.', 'Ответ может оказаться сложным: можно попросить показать в меню.'),
  ph(4, 7, 'h', '🚫🪑', 'We’re fully booked', 'Siamo al completo.', 'Мест нет.', 'ˈsjamo al komˈplɛto',
    'At a restaurant: no tables; at a hotel: no rooms.', 'В ресторане — нет столиков; в отеле — нет номеров.'),

  /* Day 5 */
  ph(5, 1, 's', '🏨📋', 'I have a reservation under the name Anna', 'Ho una prenotazione a nome Anna.', 'У меня бронирование на имя Анна.',
    'ɔ ˈuna prenotatˈtsjone a ˈnome ˈanna',
    'On a real trip, give the name on the booking. Ho: the h is silent.', 'В поездке называй имя из бронирования. Ho: h не читается.'),
  ph(5, 2, 's', '🌙🌙', 'For two nights', 'Per due notti.', 'На две ночи.', 'per ˈdue ˈnɔtti',
    'una notte = one night; due notti = two nights.', 'una notte — ночь; due notti — две ночи.'),
  ph(5, 3, 's', '🍳❓', 'Is breakfast included?', 'La colazione è inclusa?', 'Завтрак включён?', 'la kolatˈtsjone ɛ inˈkluza',
    'la colazione = breakfast; inclusa agrees with colazione.', 'la colazione — завтрак; inclusa согласуется с colazione.'),
  ph(5, 4, 's', '⏰🍳', 'What time is breakfast?', 'A che ora è la colazione?', 'Во сколько завтрак?', 'a ke ˈora ɛ la kolatˈtsjone',
    'A che ora…? = At what time…?', 'A che ora…? — Во сколько…?'),
  ph(5, 5, 's', '🛄⏰', 'What time do I need to check out?', 'A che ora devo lasciare la camera?', 'Во сколько нужно освободить номер?',
    'a ke ˈora ˈdevo laʃˈʃare la ˈkamera',
    'la camera = the (hotel) room.', 'la camera — номер в отеле.'),
  ph(5, 6, 's', '📶🔑', 'What is the Wi-Fi password?', 'Qual è la password del Wi-Fi?', 'Какой пароль от Wi-Fi?', 'kwaˈlɛ la ˈpaswɔrd del ˈwaifai',
    'Qual è is written without an apostrophe.', 'Qual è пишется без апострофа.'),
  ph(5, 7, 'h', '🛂', 'Some ID, please', 'Un documento, per favore.', 'Ваш документ, пожалуйста.', 'un dokuˈmento, {pf}',
    'Hotels in Italy register every guest, so they ask for a passport or an ID card.', 'Отели в Италии регистрируют гостей, поэтому просят паспорт или удостоверение.'),

  /* Day 6 */
  ph(6, 1, 's', '🚻', 'Where is the toilet?', 'Dov’è il bagno?', 'Где туалет?', 'doˈvɛ il ˈbaɲɲo',
    'il bagno = bathroom, toilet.', 'il bagno — ванная, туалет.'),
  ph(6, 2, 's', '🚉', 'Where is the train station?', 'Dov’è la stazione?', 'Где железнодорожный вокзал?', 'doˈvɛ la statˈtsjone',
    'la stazione = the (railway) station.', 'la stazione — вокзал, станция.'),
  ph(6, 3, 's', '🎫❓', 'Where can I buy a ticket?', 'Dove posso comprare il biglietto?', 'Где я могу купить билет?', 'ˈdove ˈpɔsso komˈprare il biʎˈʎetto',
    'Bus tickets are often sold at the tabaccheria (sign with a T).', 'Билеты на автобус часто продают в tabaccheria (вывеска с буквой T).'),
  ph(6, 4, 's', '🗺️👆', 'Can you show me on the map?', 'Può mostrarmi sulla mappa?', 'Вы можете показать мне на карте?', 'pwɔ mosˈtrarmi ˈsulla ˈmappa',
    'sulla = su + la, on the.', 'sulla = su + la, «на».'),
  ph(6, 5, 'h', '➡️', 'To the right', 'A destra.', 'Направо.', 'a ˈdɛstra',
    'Listening only; the arrow stays hidden until you answer.', 'Для узнавания на слух; стрелка скрыта до ответа.'),
  ph(6, 6, 'h', '⬅️', 'To the left', 'A sinistra.', 'Налево.', 'a siˈnistra',
    'Listening only; the arrow stays hidden until you answer.', 'Для узнавания на слух; стрелка скрыта до ответа.'),
  ph(6, 7, 'h', '⬆️', 'Straight ahead', 'Sempre dritto.', 'Прямо.', 'ˈsɛmpre ˈdritto',
    'Also heard: sempre diritto.', 'Можно услышать и sempre diritto.'),

  /* Day 8 */
  ph(8, 1, 's', '🍅❓', 'Do you have tomatoes?', 'Avete dei pomodori?', 'У вас есть помидоры?', 'aˈvete dei pomoˈdɔri',
    'Avete = do you (the shop, plural) have; dei pomodori = some tomatoes.', 'Avete — «у вас есть» (к магазину, мн. ч.); dei pomodori — помидоры.'),
  ph(8, 2, 's', '🧀⚖️', 'I’d like 100 grams of parmesan', 'Vorrei un etto di parmigiano.', 'Я хотела бы сто граммов пармезана.',
    'vorˈrɛi un ˈɛtto di parmiˈdʒano',
    'un etto = 100 g; due etti = 200 g.', 'un etto — 100 г; due etti — 200 г.'),
  ph(8, 3, 's', '🍑🍑', 'Half a kilo of peaches, please', 'Mezzo chilo di pesche, per favore.', 'Полкило персиков, пожалуйста.',
    'ˈmɛddzo ˈkilo di ˈpɛske, {pf}',
    'Practise the quantity inside the whole phrase.', 'Количество тренируем внутри всей фразы.'),
  ph(8, 4, 's', '👉🍅', 'These ones, please', 'Questi, per favore.', 'Вот эти, пожалуйста.', 'ˈkwesti, {pf}',
    'At Italian markets the seller picks the fruit: point and say questi.', 'На итальянском рынке фрукты выбирает продавец: покажи и скажи questi.'),
  ph(8, 5, 's', '⚖️💶❓', 'How much is it per kilo?', 'Quanto costa al chilo?', 'Сколько стоит килограмм?', 'ˈkwanto ˈkɔsta al ˈkilo',
    'A spoken question to the seller.', 'Разговорный вопрос продавцу.'),
  ph(8, 6, 'h', '🛒❓', 'Anything else?', 'Altro?', 'Что-нибудь ещё?', 'ˈaltro',
    'Variant to recognize: Qualcos’altro?', 'Вариант для узнавания: Qualcos’altro?'),
  ph(8, 7, 's', '✅🛍️', 'That’s all, thank you', 'Basta così, grazie.', 'Это всё, спасибо.', 'ˈbasta koˈsi, ˈgrattsje',
    'Works in shops, markets and bars.', 'Подходит в магазине, на рынке и в баре.'),

  /* Day 9 */
  ph(9, 1, 's', '🆘', 'I need help', 'Ho bisogno di aiuto.', 'Мне нужна помощь.', 'ɔ biˈzoɲɲo di aˈjuto',
    'After this, explain what the problem is. In an emergency: Aiuto!', 'После этой фразы поясняем, в чём проблема. В экстренном случае: Aiuto!'),
  ph(9, 2, 's', '🔧🚫', 'It doesn’t work', 'Non funziona.', 'Это не работает.', 'non funˈtsjona',
    'You can point at the object or screen.', 'Можно показать предмет или экран.'),
  ph(9, 3, 's', '⚠️📅', 'There is a problem with my reservation', 'C’è un problema con la mia prenotazione.', 'Есть проблема с моим бронированием.',
    'tʃɛ un proˈblɛma kon la ˈmia prenotatˈtsjone',
    'il problema is masculine despite the -a.', 'il problema — мужского рода, несмотря на -a.'),
  ph(9, 4, 's', '🇬🇧❓', 'Do you speak English?', 'Parla inglese?', 'Вы говорите по-английски?', 'ˈparla iŋˈglese',
    'A fallback to keep talking, not a required first line.', 'Запасной способ продолжить общение, а не обязательная первая реплика.'),
  ph(9, 5, 's', '✍️❓', 'Can you write it down for me, please?', 'Me lo può scrivere, per favore?', 'Вы можете мне это написать, пожалуйста?',
    'me lo pwɔ ˈskrivere, {pf}',
    'me lo = it for me; a general request, not only for prices.', 'me lo — «мне это»; универсальная просьба, не только о цене.'),
  ph(9, 6, 's', '📍🔎', 'I’m looking for this address', 'Cerco questo indirizzo.', 'Я ищу этот адрес.', 'ˈtʃerko ˈkwesto indiˈrittso',
    'l’indirizzo = the address.', 'l’indirizzo — адрес.'),
  ph(9, 7, 'h', '⏳✋', 'One moment, please', 'Un attimo, per favore.', 'Минутку, пожалуйста.', 'un ˈattimo, {pf}',
    'For recognition, so you don’t mistake the pause for a refusal.', 'Реплика для понимания, чтобы не принять паузу за отказ.'),
];

// Direction arrows would give the answer away in the listening hints
PH.filter(p => ['it-d06-05', 'it-d06-06', 'it-d06-07'].includes(p.id)).forEach(p => { p.hideScene = true; });

/* ---------- The 1000-word core list (js/vocab.js) ---------- */
// tp: topic id; g: m / f / pl; n: numeric value for number words
const WORDS = CORE_ROWS.map(r => ({
  id: r[0], kind: r[10] ? 'nm' : 'wd', k: 's', tp: r[1], d: 0, ru: r[10] ? String(r[9]) : r[2], en: r[10] ? String(r[9]) : r[3],
  ru0: r[2], en0: r[3], fr: r[4], ipa: r[5], cy: r[6] || ipaCy(r[5]), sc: r[7], g: r[8], n: r[9],
}));
const VOC = WORDS.filter(w => w.kind === 'wd');
const NUM = WORDS.filter(w => w.kind === 'nm');
const TOPIC = Object.fromEntries(TOPICS.map(t => [t.id, t]));
// Travel-first order (the list order is the alternative)
const TOPIC_ORDER_TRAVEL = ['01', '16', '09', '10', '08', '17', '02', '11', '12', '07', '03', '04', '18', '19', '05', '06', '15', '14', '13', '20'];
const WORD_INDEX = Object.fromEntries(WORDS.map((w, i) => [w.id, i]));
function wordSequence(order) {
  const rank = Object.fromEntries((order === 'list' ? TOPICS.map(t => t.id) : TOPIC_ORDER_TRAVEL).map((id, i) => [id, i]));
  return WORDS.slice().sort((a, b) => (rank[a.tp] - rank[b.tp]) || (WORD_INDEX[a.id] - WORD_INDEX[b.id]));
}

const ITEMS = [...PH, ...WORDS];
const IT = Object.fromEntries(ITEMS.map(x => [x.id, x]));

/* ---------- Italian number words (for prices and dialogues) ---------- */
const U_ = ['zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci', 'undici', 'dodici', 'tredici', 'quattordici',
  'quindici', 'sedici', 'diciassette', 'diciotto', 'diciannove'];
const TENS_ = { 2: 'venti', 3: 'trenta', 4: 'quaranta', 5: 'cinquanta', 6: 'sessanta', 7: 'settanta', 8: 'ottanta', 9: 'novanta' };
function itNum(n) {
  if (n < 20) return U_[n];
  if (n < 100) {
    const t = TENS_[Math.floor(n / 10)], u = n % 10;
    if (u === 0) return t;
    // the tens drop their last vowel before uno and otto; tre takes an accent at the end
    return (u === 1 || u === 8 ? t.slice(0, -1) : t) + (u === 3 ? 'tré' : U_[u]);
  }
  const h = Math.floor(n / 100), r = n % 100;
  return (h === 1 ? 'cento' : U_[h] + 'cento') + (r ? itNum(r) : '');
}
const euroWord = e => (e === 1 ? 'un' : itNum(e));
function priceIt(e, c) { return euroWord(e) + ' euro' + (c ? ' e ' + itNum(c) : ''); }
function priceParts(e, c) { return [euroWord(e), 'euro'].concat(c ? ['e', itNum(c)] : []); }
function priceNum(e, c) { return c ? `${e},${pad2(c)} €` : `${e} €`; }
function priceEn(e, c) { return c ? `€${e}.${pad2(c)}` : `€${e}`; }
// "Sono dodici euro", but "È un euro"
const priceSay = (e, c) => (e === 1 && !c ? 'È un euro' : 'Sono ' + priceIt(e, c));
const rnd = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function rndPrice(max) { return { e: 1 + Math.floor(Math.random() * max), c: rnd([0, 0, 0, 10, 20, 30, 40, 50, 50, 60, 70, 80, 90]) }; }

// Prices from the course, for the listening practice
const PRICES_FIXED = [[1, 20], [2, 50], [3, 0], [7, 20], [12, 50], [18, 0], [20, 0], [35, 0], [49, 0], [95, 0]];

/* ---------- Role-play scenarios (randomized each time) ---------- */
const T_ = (w, fr, en, ru) => ({ w, fr, en, ru });
const SCEN = [
  {
    id: 'bar', e: '☕', en: 'At the bar', ru: 'В баре', days: [7, 10],
    build() {
      const dr = rnd([{ fr: 'un caffè', en: 'an espresso', ru: 'эспрессо' }, { fr: 'un cappuccino', en: 'a cappuccino', ru: 'капучино' }, { fr: 'un tè', en: 'a tea', ru: 'чай' }]);
      const ex = rnd([null, { fr: 'un cornetto', en: 'a croissant', ru: 'круассан' }, { fr: 'due cornetti', en: 'two croissants', ru: 'два круассана' }]);
      const place = rnd([{ fr: 'Al banco', en: 'At the counter', ru: 'У стойки' }, { fr: 'Al tavolo', en: 'At a table', ru: 'За столиком' }]);
      const pay = rnd([{ fr: 'Con la carta', en: 'By card', ru: 'Картой' }, { fr: 'In contanti', en: 'In cash', ru: 'Наличными' }]);
      const p = rndPrice(12);
      return [
        T_('them', 'Buongiorno! Cosa prende?', 'Hello! What will you have?', 'Здравствуйте! Что будете?'),
        T_('me', `Buongiorno! Vorrei ${dr.fr}${ex ? ' e ' + ex.fr : ''}, per favore.`, `Hello! I’d like ${dr.en}${ex ? ' and ' + ex.en : ''}, please.`, `Здравствуйте! Я хотела бы ${dr.ru}${ex ? ' и ' + ex.ru : ''}, пожалуйста.`),
        T_('them', 'Al banco o al tavolo?', 'At the counter or at a table?', 'У стойки или за столиком?'),
        T_('me', `${place.fr}, per favore.`, `${place.en}, please.`, `${place.ru}, пожалуйста.`),
        T_('them', `${priceSay(p.e, p.c)}. Con la carta o in contanti?`, `That’s ${priceEn(p.e, p.c)}. By card or in cash?`, `С вас ${priceNum(p.e, p.c)}. Картой или наличными?`),
        T_('me', `${pay.fr}, per favore.`, `${pay.en}, please.`, `${pay.ru}, пожалуйста.`),
        T_('them', 'Grazie! Buona giornata!', 'Thank you! Have a nice day!', 'Спасибо! Хорошего дня!'),
        T_('me', 'Grazie, arrivederci!', 'Thank you, goodbye!', 'Спасибо, до свидания!'),
      ];
    },
  },
  {
    id: 'resto', e: '🍝', en: 'At the restaurant', ru: 'В ресторане', days: [7, 10],
    build() {
      const n = rnd([['due', 'two', 'двоих'], ['tre', 'three', 'троих'], ['quattro', 'four', 'четверых']]);
      const booked = Math.random() < 0.4, full = !booked && Math.random() < 0.25;
      const s = [T_('them', 'Buonasera! Ha prenotato?', 'Good evening! Have you booked?', 'Добрый вечер! Вы бронировали?')];
      if (booked) {
        s.push(T_('me', 'Sì, a nome Anna.', 'Yes, under the name Anna.', 'Да, на имя Анна.'));
        s.push(T_('them', 'Benissimo. Prego, da questa parte.', 'Very good. This way, please.', 'Отлично. Пожалуйста, сюда.'));
      } else {
        s.push(T_('me', `No. Un tavolo per ${n[0]}, per favore.`, `No. A table for ${n[1]}, please.`, `Нет. Столик на ${n[2]}, пожалуйста.`));
        if (full) {
          s.push(T_('them', 'Mi dispiace, siamo al completo.', 'Sorry, we’re full.', 'Простите, мест нет.'));
          s.push(T_('me', 'Grazie. Arrivederci!', 'Thank you. Goodbye!', 'Спасибо. До свидания!'));
          return s;
        }
        s.push(T_('them', 'Certo. Prego, da questa parte.', 'Of course. This way, please.', 'Конечно. Пожалуйста, сюда.'));
      }
      s.push(T_('them', 'Ecco il menù.', 'Here is the menu.', 'Вот меню.'));
      s.push(T_('me', 'Che cosa mi consiglia?', 'What do you recommend?', 'Что вы мне посоветуете?'));
      const rec = rnd([['la carbonara', 'the carbonara', 'карбонару'], ['il pesce del giorno', 'the fish of the day', 'рыбу дня'], ['le lasagne', 'the lasagne', 'лазанью']]);
      s.push(T_('them', `Le consiglio ${rec[0]}.`, `I recommend ${rec[1]}.`, `Советую ${rec[2]}.`));
      s.push(T_('me', 'Il vino della casa, per favore.', 'The house wine, please.', 'Домашнее вино, пожалуйста.'));
      s.push(T_('them', 'Certo.', 'Of course.', 'Конечно.'));
      s.push(T_('me', 'Il conto, per favore.', 'The bill, please.', 'Счёт, пожалуйста.'));
      s.push(T_('them', 'Subito.', 'Right away.', 'Сейчас.'));
      return s;
    },
  },
  {
    id: 'hotel', e: '🏨', en: 'At the hotel desk', ru: 'На ресепшене', days: [7, 10],
    build() {
      const nt = rnd([['due', 'two', 'две'], ['tre', 'three', 'три'], ['quattro', 'four', 'четыре']]);
      const a = rnd([7, 8]), b = rnd([10, 11]);
      return [
        T_('them', 'Buongiorno! Ha una prenotazione?', 'Hello! Do you have a reservation?', 'Здравствуйте! У вас есть бронирование?'),
        T_('me', 'Sì, ho una prenotazione a nome Anna.', 'Yes, I have a reservation under the name Anna.', 'Да, у меня бронирование на имя Анна.'),
        T_('them', 'Per quante notti?', 'For how many nights?', 'На сколько ночей?'),
        T_('me', `Per ${nt[0]} notti.`, `For ${nt[1]} nights.`, `На ${nt[2]} ночи.`),
        T_('them', 'Un documento, per favore.', 'Some ID, please.', 'Ваш документ, пожалуйста.'),
        T_('me', 'Ecco.', 'Here you are.', 'Вот, пожалуйста.'),
        T_('them', 'Grazie. Ecco la chiave.', 'Thank you. Here is your key.', 'Спасибо. Вот ваш ключ.'),
        T_('me', 'La colazione è inclusa?', 'Is breakfast included?', 'Завтрак включён?'),
        T_('them', `Sì, dalle ${itNum(a)} alle ${itNum(b)}.`, `Yes, from ${a} to ${b}.`, `Да, с ${a} до ${b}.`),
        T_('me', 'Qual è la password del Wi-Fi?', 'What is the Wi-Fi password?', 'Какой пароль от Wi-Fi?'),
        T_('them', 'Ecco la password.', 'Here is the password.', 'Вот пароль.'),
        T_('me', 'Grazie. Arrivederci!', 'Thank you. Goodbye!', 'Спасибо. До свидания!'),
      ];
    },
  },
  {
    id: 'way', e: '🧭', en: 'Asking the way', ru: 'Как пройти', days: [7, 10],
    build() {
      const pl = rnd([
        { q: 'Dov’è la stazione?', en: 'Where is the train station?', ru: 'Где вокзал?' },
        { q: 'Dov’è il bagno?', en: 'Where is the toilet?', ru: 'Где туалет?' },
        { q: 'Dove posso comprare il biglietto?', en: 'Where can I buy a ticket?', ru: 'Где я могу купить билет?' },
      ]);
      const dir = rnd([
        ['Sempre dritto, poi a sinistra.', 'Straight ahead, then to the left.', 'Прямо, потом налево.'],
        ['Sempre dritto, poi a destra.', 'Straight ahead, then to the right.', 'Прямо, потом направо.'],
        ['A destra, poi sempre dritto.', 'To the right, then straight ahead.', 'Направо, потом прямо.'],
        ['A sinistra, poi sempre dritto.', 'To the left, then straight ahead.', 'Налево, потом прямо.'],
      ]);
      return [
        T_('me', `Mi scusi. ${pl.q}`, `Excuse me. ${pl.en}`, `Извините. ${pl.ru}`),
        T_('them', dir[0], dir[1], dir[2]),
        T_('me', 'Non capisco. Più piano, per favore.', 'I don’t understand. More slowly, please.', 'Я не понимаю. Помедленнее, пожалуйста.'),
        T_('them', dir[0], dir[1], dir[2]),
        T_('me', 'Può mostrarmi sulla mappa?', 'Can you show me on the map?', 'Вы можете показать мне на карте?'),
        T_('them', 'Sì, certo. Qui.', 'Yes, of course. Here.', 'Да, конечно. Вот здесь.'),
        T_('me', 'Grazie mille. Arrivederci!', 'Thank you very much. Goodbye!', 'Большое спасибо. До свидания!'),
      ];
    },
  },
  {
    id: 'market', e: '🍅', en: 'At the market', ru: 'На рынке', days: [10],
    build() {
      if (Math.random() < 0.5) {
        const q = rnd([['Mezzo chilo', 'Half a kilo', 'Полкило'], ['Un chilo', 'One kilo', 'Килограмм']]);
        const p = { e: rnd([2, 3, 4]), c: rnd([0, 50]) };
        return [
          T_('me', 'Buongiorno! Avete dei pomodori?', 'Hello! Do you have tomatoes?', 'Здравствуйте! У вас есть помидоры?'),
          T_('them', 'Sì, certo. Quanti?', 'Yes, of course. How many?', 'Да, конечно. Сколько?'),
          T_('me', `${q[0]}, per favore.`, `${q[1]}, please.`, `${q[2]}, пожалуйста.`),
          T_('them', 'Altro?', 'Anything else?', 'Что-нибудь ещё?'),
          T_('me', 'Basta così, grazie.', 'That’s all, thank you.', 'Это всё, спасибо.'),
          T_('them', `${priceSay(p.e, p.c)}.`, `That’s ${priceEn(p.e, p.c)}.`, `С вас ${priceNum(p.e, p.c)}.`),
          T_('me', 'Con la carta, per favore.', 'By card, please.', 'Картой, пожалуйста.'),
        ];
      }
      const pk = rnd([20, 24, 28, 32, 36]), et = rnd([[1, 'un etto', '100 grams', 'сто граммов'], [2, 'due etti', '200 grams', 'двести граммов']]);
      const cents = pk * et[0] * 10, e = Math.floor(cents / 100), c = cents % 100;
      return [
        T_('me', 'Buongiorno! Quanto costa il parmigiano al chilo?', 'Hello! How much is the parmesan per kilo?', 'Здравствуйте! Сколько стоит килограмм пармезана?'),
        T_('them', `Costa ${priceIt(pk, 0)} al chilo.`, `It’s ${priceEn(pk, 0)} a kilo.`, `${priceNum(pk, 0)} за килограмм.`),
        T_('me', `Vorrei ${et[1]}, per favore.`, `I’d like ${et[2]}, please.`, `Я хотела бы ${et[3]}, пожалуйста.`),
        T_('them', 'Ecco. Altro?', 'Here you are. Anything else?', 'Вот. Что-нибудь ещё?'),
        T_('me', 'Basta così, grazie.', 'That’s all, thank you.', 'Это всё, спасибо.'),
        T_('them', `${priceSay(e, c)}.`, `That’s ${priceEn(e, c)}.`, `С вас ${priceNum(e, c)}.`),
        T_('me', 'Con la carta, per favore.', 'By card, please.', 'Картой, пожалуйста.'),
      ];
    },
  },
  {
    id: 'problem', e: '🆘', en: 'A problem at the hotel', ru: 'Проблема в отеле', days: [10],
    build() {
      return [
        T_('me', 'Mi scusi. C’è un problema con la mia prenotazione.', 'Excuse me. There is a problem with my reservation.', 'Извините. Есть проблема с моим бронированием.'),
        T_('them', 'Un attimo, per favore. Come si chiama?', 'One moment, please. What is your name?', 'Минутку, пожалуйста. Как вас зовут?'),
        T_('me', 'Anna. Parla inglese?', 'Anna. Do you speak English?', 'Анна. Вы говорите по-английски?'),
        T_('them', 'Un po’.', 'A little.', 'Немного.'),
        T_('me', 'Me lo può scrivere, per favore?', 'Can you write it down for me, please?', 'Вы можете мне это написать, пожалуйста?'),
        T_('them', 'Certo. Un attimo, per favore.', 'Of course. One moment, please.', 'Конечно. Минутку, пожалуйста.'),
        T_('me', 'Grazie.', 'Thank you.', 'Спасибо.'),
      ];
    },
  },
];
