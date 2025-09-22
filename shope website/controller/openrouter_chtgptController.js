// const axios = require('axios');

// exports.askOpenRouterGPT4 = async (req, res) => {
//   const prompt = req.body.prompt;

//   try {
//     const response = await axios.post(
//       'https://openrouter.ai/api/v1/chat/completions',
//       {
//         model: 'openai/gpt-4',
//         messages: [{ role: 'user', content: prompt }]
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
//           'Content-Type': 'application/json',
//           'HTTP-Referer': 'http://localhost:8000'
//         }
//       }
//     );

//     res.json(response.data);
//   } catch (error) {
//     console.error("OpenRouter GPT-4 Error:", error.response?.data || error.message);
//     res.status(500).json({ error: "Error from OpenRouter GPT-4" });
//   }
// };

const axios = require('axios');
require('dotenv').config();

exports.chatWithOpenRouter = async (req, res) => {
  try {
    // Get user input from body
    const userMessage = req.body.message;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/o4-mini-high', // ✅ Ensure model name
        messages: [
          { role: 'system', content: 'You are a helpful, concise assistant like ChatGPT-4-turbo.' },
          { role: 'user', content: userMessage }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    console.log('Assistant:', reply);

    // Send reply back to frontend
    res.json({ reply });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
  