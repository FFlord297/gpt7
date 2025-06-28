// === Chat Endpoint (AI Integration) ===
app.post('/chat', authMiddleware, async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // Get Hugging Face API key from environment variables
    const HF_API_KEY = process.env.HF_API_KEY;
    if (!HF_API_KEY) {
      return res.status(500).json({ error: 'AI API key not configured' });
    }

    // Call Hugging Face Inference API with the user message
    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        inputs: {
          past_user_inputs: [], // Placeholder for previous inputs, can be updated later
          generated_responses: [], // Placeholder for previous responses, can be updated later
          text: userMessage, // The current user message
        },
      }),
    });

    // Check if the response from the API is ok (status in the range 200-299)
    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF API Error:', response.status, errorText);
      return res.status(response.status).json({ error: 'AI API error', details: errorText });
    }

    // Parse the JSON response to extract generated text
    const data = await response.json();
    let botReply = "Sorry, I couldn't generate a reply.";

    // Determine the bot's reply based on the API response structure
    if (data.generated_text) {
      botReply = data.generated_text;
    } else if (Array.isArray(data) && data[0]?.generated_text) {
      botReply = data[0].generated_text;
    } else if (data.conversation && data.conversation.generated_responses?.length > 0) {
      botReply = data.conversation.generated_responses[data.conversation.generated_responses.length - 1];
    }

    // Save the chat history logic (this part can be implemented as needed)
    // const chatRecord = { message: userMessage, reply: botReply, timestamp: Date.now() };
    // chatHistories[req.user].push(chatRecord);

    // Send the bot's reply back to the client
    res.json({ reply: botReply });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});
