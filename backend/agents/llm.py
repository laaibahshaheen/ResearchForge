from dotenv import load_dotenv
from langchain_groq import ChatGroq
import os

load_dotenv()

groq_key = os.getenv("GROQ_API_KEY")
if not groq_key:
    raise EnvironmentError(
        "GROQ_API_KEY not found. Add it to backend/.env as: GROQ_API_KEY=gsk_7sXmih6CmNgxUoFlKsXdWGdyb3FY9rGzfoQuSYvLgW02kW9PGR29re"
    )

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    max_tokens=2048,
)