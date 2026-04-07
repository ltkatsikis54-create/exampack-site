module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { notes } = req.body;

  if (!notes || notes.trim().length < 10) {
    return res.status(400).json({ error: 'Please paste at least a few lines of notes.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `You are a study guide generator for STEM college students. Given the following lecture notes, produce a study pack with exactly three sections. Use HTML formatting (h4, ul, li, p, strong tags). Do NOT use any emoji. Do NOT wrap in code blocks. Do NOT use markdown. Output raw HTML only.

SECTION 1: CHEAT SHEET
Identify the 5-8 most important concepts. For each, give a one-sentence definition or explanation. Use <h4>CHEAT SHEET</h4> as the header, then a <ul> with <li> items. Bold the concept name with <strong>.

SECTION 2: ACTIVE-RECALL QUESTIONS
Write 5 questions that test understanding (not just memorization). Mix question types: define, compare, explain why, apply to a scenario. Use <h4>ACTIVE-RECALL QUESTIONS</h4> as the header.

SECTION 3: PRACTICE QUIZ
Write 5 multiple-choice questions (A-D). Use <h4>PRACTICE QUIZ</h4> as the header. After all 5 questions, add <h4>ANSWER KEY</h4> with the correct answers listed.

Here are the lecture notes:

${notes}`
          }
        ]
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Anthropic API error:', errData);
      return res.status(500).json({ error: 'AI service error. Please try again.' });
    }

    const data = await response.json();
    const text = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    return res.status(200).json({ result: text });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
