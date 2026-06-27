import os
from langchain_groq import ChatGroq

# On Railway, env vars are set directly — no .env file needed
# load_dotenv() is removed to prevent it from overriding Railway variables
groq_key = os.environ.get("GROQ_API_KEY")
if not groq_key:
    raise EnvironmentError("GROQ_API_KEY not found in environment variables.")

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    max_tokens=2048,
)
