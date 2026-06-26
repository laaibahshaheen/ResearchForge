from agents.llm import llm

question = input("Ask something: ")

response = llm.invoke(question)

print("\nAnswer:\n")
print(response.content)