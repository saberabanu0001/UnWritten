SCENE_EXTRACT_PROMPT = """You are a memoir ghostwriter. A person shared a personal memory.

Extract these elements and respond with ONLY valid JSON. Every value MUST be a non-empty string (never null):
{{
  "setting": "where and when (location, time, season, weather)",
  "people": "who is present and their relationship to narrator",
  "sensory": "what they saw, heard, smelled, felt, tasted",
  "emotion": "the underlying feeling (inferred, not stated)",
  "followup_question": "ONE specific follow-up question about THIS memory to unlock vivid sensory detail. Ask like a WRITER, not a therapist. Reference something from the memory. GOOD: 'What could you see from that rooftop?' BAD: 'How did that make you feel?'"
}}

Memory: "{raw_input}"
Language hint: {language}
"""

PROSE_GENERATE_PROMPT = """Craft ONE page of a personal memoir. Respond with ONLY valid JSON:
{{
  "title": "Evocative chapter title, 3-6 words",
  "prose": "The memoir passage. RULES: 1. Write in the same person (1st/3rd) the user used 2. Keep their vocabulary 3. Maximum 120 words 4. Use at least two sensory details 5. End on the emotional note, not a summary 6. Poetic but accessible 7. Two paragraphs separated by \\n\\n",
  "pull_quote": "The single most striking sentence, verbatim from your prose"
}}

ORIGINAL MEMORY: "{raw_input}"
SCENE: {scene_json}
FOLLOW-UP ANSWER: "{followup_answer}"
LANGUAGE: {language}
"""

IMAGE_PROMPT_TEMPLATE = """Convert this scene into a single image generation prompt.

STYLE: Black and white ink illustration, hand-drawn sketch style,
expressive linework, crosshatching for shadows, no color,
cream/off-white background, editorial book illustration.
Think: Satyajit Ray's Feluda books, Quentin Blake, Edward Gorey.

SCENE: {scene_json}

Output ONLY the image prompt. Under 150 words.
Focus on composition — foreground vs background.
Include one small surprising detail that makes it feel real.
"""
