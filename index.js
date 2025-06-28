// === Chat Endpoint (AI Integration) ===
app.post('/chat', authMiddleware, async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // Hugging Face Inference API with conversational model
    const HF_API_KEY = process.env.HF_API_KEY;
    if (!HF_API_KEY) {
      return res.status(500).json({ error: 'AI API key not configured' });
    }

    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        inputs: {
          past_user_inputs: [],
          generated_responses: [],
          text: userMessage
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF API Error:', response.status, errorText);
      return res.status(500).json({ error: 'AI API error', details: `${response.status}: ${errorText}` });
    }

    const data = await response.json();
    let botReply = "Sorry, I couldn't generate a reply.";
    
    if (data.generated_text) {
      botReply = data.generated_text;
    } else if (Array.isArray(data) && data[0]?.generated_text) {
      botReply = data[0].generated_text;
    } else if (data.conversation && data.conversation.generated_responses && data.conversation.generated_responses.length > 0) {
      botReply = data.conversation.generated_responses[data.conversation.generated_responses.length - 1];
    }

    // Save chat history logic
    // ...

    res.json({ reply: botReply });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});
