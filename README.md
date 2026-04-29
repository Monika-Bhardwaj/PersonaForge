# PersonaForge

PersonaForge is a persona-based AI chatbot application featuring three Scaler/InterviewBit founders: Anshuman Singh, Abhimanyu Saxena, and Kshitij Mishra. It provides a premium, glassmorphic chat interface using React, powered by a Python FastAPI backend that interfaces with OpenAI's LLMs.

## Features
- **Persona Switcher:** Seamlessly switch between three distinct founder personas, each with their own unique background and communication style.
- **Gemini-Style UI:** A clean, responsive interface mimicking modern AI chatbots.
- **Streaming Responses:** Real-time typing indicators and text streaming using Server-Sent Events (SSE).
- **Suggestion Chips:** Quick-start contextual questions for each persona.
- **Rate Limiting:** Built-in API rate limiting using SlowAPI.

## Architecture
- **Frontend:** React + Babel Standalone + Tailwind CSS. The frontend is built without node dependencies so it can be served as static HTML directly or via any web server.
- **Backend:** Python FastAPI, Uvicorn, and OpenAI SDK.

## Setup Instructions

### Prerequisites
- Python 3.8+
- An OpenAI API Key

### Backend Setup
1. Navigate to the `backend` directory:
   \`\`\`bash
   cd backend
   \`\`\`
2. Create a virtual environment and install dependencies:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   pip install -r requirements.txt
   \`\`\`
3. Create a `.env` file in the `backend` directory (copy `.env.example`):
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   Add your `OPENAI_API_KEY` to the `.env` file.
4. Run the FastAPI server:
   \`\`\`bash
   uvicorn main:app --reload
   \`\`\`
   The server will run on `http://localhost:8000`.

### Frontend Setup
1. Simply open `frontend/index.html` in your web browser.
2. Alternatively, serve it using a simple HTTP server:
   \`\`\`bash
   cd frontend
   python -m http.server 3000
   \`\`\`
   And open `http://localhost:3000`.

## Deployment
- **Frontend:** Can be deployed to Vercel or Netlify by pointing the build directory to `/frontend` with no build command required.
- **Backend:** Can be deployed to Heroku, Render, or Railway. Ensure `OPENAI_API_KEY` is set in the environment variables.

## Project Deliverables
- `prompts.md`: Contains the system prompts and few-shot examples for each persona.
- `reflection.md`: A reflection on prompt engineering and the development process.
