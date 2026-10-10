#!/usr/bin/env python3
"""Assembles data/grammar_course.json (Italian grammar A1–B2, one year) from the parts in tools/source/parts:
modules_1..6.json (72 topics), checkpoints_glossary_verbs.json, plus italian_sources.json and italian_reference_paths.json.
The weekly calendar keeps the layout of the French course in tools/source/french_ref (2 topics a week, review and
checkpoint weeks)."""
import json, pathlib, unicodedata

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'tools/source'
load = lambda p: json.loads(p.read_text(encoding='utf8'))
nfc = lambda x: json.loads(unicodedata.normalize('NFC', json.dumps(x, ensure_ascii=False)))

modules = []
for i in range(1, 7):
    modules += load(SRC / f'parts/modules_{i}.json')
modules.sort(key=lambda m: m['order'])
extra = load(SRC / 'parts/checkpoints_glossary_verbs.json')
sources = load(SRC / 'italian_sources.json') if (SRC / 'italian_sources.json').exists() else []
paths = load(SRC / 'italian_reference_paths.json') if (SRC / 'italian_reference_paths.json').exists() else {}
fr = load(SRC / 'french_ref/french_grammar_course.json')

# reference links per topic (main grammar reference), when the research found them
src_ids = {s['id'] for s in sources}
for m in modules:
    p = paths.get(m['id']) or []
    m['grammar_reference_paths'] = p[:2]
    m['reference_ids'] = ['S-GRAM'] if p and 'S-GRAM' in src_ids else []

to_it = lambda s: s.replace('fr-grammar-', 'it-grammar-').replace('fr-check-', 'it-check-')
weeks = []
for w in fr['weeks']:
    w = dict(w)
    w['new_module_ids'] = [to_it(x) for x in w['new_module_ids']]
    w['review_module_ids'] = [to_it(x) for x in w['review_module_ids']]
    w['checkpoint_id'] = to_it(w['checkpoint_id']) if w['checkpoint_id'] else None
    w['weekly_task_ru'] = 'Решить одну практическую ситуацию на итальянском с темами недели; назвать две собственные ошибки и правильные варианты.'
    weeks.append(w)

ids = {m['id'] for m in modules}
for w in weeks:
    for x in w['new_module_ids'] + w['review_module_ids']:
        assert x in ids, x
for m in modules:
    assert m['suggested_week'] in {w['week'] for w in weeks if m['id'] in w['new_module_ids']}, m['id']

course = {
    'schema_version': '1.0.0',
    'package_type': 'grammar_course',
    'course_id': 'italian-grammar-a1-b2-year-v1',
    'created_at': '2026-10-10',
    'title_ru': 'Итальянская грамматика: с основ к B1 и далее к B2',
    'interface_language': 'ru',
    'explanation_language': 'ru',
    'target_language': 'it-IT',
    'optional_task_language': 'en',
    'english_translation_included': False,
    'scope_ru': 'Авторская учебная последовательность для взрослой начинающей. Это структурированный план, краткие правила и стартовый банк упражнений, не исчерпывающий справочник всех исключений и не полный курс четырёх речевых навыков. Распределение по ступеням ориентировочное (по описаниям уровней CEFR для итальянского и программам CILS, CELI, PLIDA), не официальный экзаменационный список.',
    'starting_level_ru': 'Не подтверждён диагностикой. Наличие словарной колоды из 1000 карточек не означает уровень B1. Все темы вначале not_started.',
    'goal_ru': 'Основная цель — практический B1 с проверкой чтения, письма, аудирования и разговора; B2 — продолжение при готовности. Достижение уровня к конкретной дате не гарантируется.',
    'counts': {
        'modules': len(modules), 'examples': sum(len(m['examples']) for m in modules), 'training_exercises': sum(len(m['exercises']) for m in modules),
        'checkpoints': len(extra['checkpoints']), 'checkpoint_exercises': sum(len(c['exercises']) for c in extra['checkpoints']),
        'weeks': len(weeks), 'reference_verbs': len(extra['verb_reference']['items']),
    },
    'integration': {'separate_namespace': True, 'preserve_existing_progress': True, 'related_vocab_deck_id': 'italian-core-1000-ru-en-it-v1',
                    'vocabulary_link_kind': 'topic_id', 'do_not_mutate_existing_decks': True, 'does_not_require_existing_vocabulary_deck': True},
    'pacing': fr['pacing'],
    'routes': [
        {'id': 'b1_core', 'title_ru': 'База и закрепление B1', 'default': True,
         'rule_ru': 'Недели 1–39: основа и B1; в 40–52 закрепление по реальным ошибкам. Темы 39 (futuro anteriore) и 46 (нереальное прошлое) можно отложить как B1+→B2.'},
        {'id': 'b2_extension', 'title_ru': 'Продолжение к B2', 'default': False,
         'rule_ru': 'Материалы недель 40–52 подключаются после проверки базы. Срок можно продлить.'},
    ],
    'travel_preview_module_ids': [f'it-grammar-{n:03d}' for n in (1, 2, 3, 4, 5, 7, 10, 11, 14, 15, 16, 25, 29)],
    'travel_preview_rule_ru': 'Это приоритеты и знакомство с готовыми конструкциями для поездки, а не требование пройти 13 тем за 10 дней. Предпросмотр не отмечает тему освоенной.',
    'mastery_policy': fr['mastery_policy'],
    'review_policy': fr['review_policy'],
    'grading_contract': {
        'normalise_unicode': 'NFC', 'apostrophes_equivalent': ["'", '’'], 'ignore_letter_case': True, 'collapse_whitespace': True,
        'ignore_terminal_punctuation': True, 'do_not_strip_diacritics_for_correctness': True, 'accept_equivalent_hyphens': True,
        'show_italian_keyboard_chars': ['à', 'è', 'é', 'ì', 'ò', 'ù', '’'],
        'free_production_exact_match_forbidden': True,
        'unknown_valid_variant_ru': fr['grading_contract']['unknown_valid_variant_ru'],
        'closed_task_variants_ru': fr['grading_contract']['closed_task_variants_ru'],
        'cloze_rendering_ru': 'Оценивай только заполненный фрагмент. Если показываешь собранную фразу, не оставляй пробел после конечного апострофа: un’ + amica → un’amica; l’ + ho → l’ho.',
    },
    'audio_contract': {'recordings_included': False, 'use_field': 'examples[].tts_text', 'do_not_speak_russian_as_italian': True, 'tts_is_not_human_recording': True,
                       'require_explicit_play': True, 'do_not_read_solution_before_answer': True, 'browser_voice_availability_not_guaranteed': True,
                       'assessment_of_pronunciation_not_included': True},
    'glossary': extra['glossary'],
    'verb_reference': extra['verb_reference'],
    'weeks': weeks,
    'modules': modules,
    'checkpoints': extra['checkpoints'],
    'sources': sources,
    'omitted_by_design_ru': [
        'Автоматическая сертификация уровня B1/B2.',
        'Полная фонетика, словарь B2 и все четыре речевых навыка: развиваются отдельной практикой.',
        'Активное заучивание passato remoto, trapassato remoto и редких исключений: только узнавание.',
        'Годовой исчерпывающий банк новых упражнений: при повторении требуются дополнительные примеры и диалоги.',
    ],
    'editorial_note_ru': 'Примеры и ответы учебные, в том числе от первого лица (от лица женщины); они не описывают биографию пользователя. Разделение по уровням и календарь — авторская организация, темы могут перекрываться между уровнями.',
}
course = nfc(course)
(ROOT / 'data/grammar_course.json').write_text(json.dumps(course, ensure_ascii=False, indent=1), encoding='utf8')
print('counts', course['counts'], 'sources', len(sources), 'topics with links', sum(1 for m in modules if m['grammar_reference_paths']))
