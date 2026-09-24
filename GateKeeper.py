import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field



class FastGate(BaseModel):
  trigger: bool =Field(
      description=(
          "True ONLY if the speaker is asking an explicit QUESTION or COMMAND"
          " to get new data (e.g., 'what is...', 'show me...', 'which"
          " countries...'). False if the speaker is just STATING facts, reading"
          " numbers, commenting, or saying filler ('as you can see...', 'top 5"
          " are...', 'that's good', 'okay')."
      )
  )

  confidence: float = Field(
      ge=0.0,
      le=1.0,
      description="Confidence score between 0.0 and 1.0 that a visual chart or data check is needed.",
  )


model = ChatGoogleGenerativeAI(
    model = "gemini-3.1-flash-lite",
    temperature=0.0,
    max_output_tokens=100,
    api_key=os.getenv("GEMINI_API_KEY")
)




gatekeeper = model.with_structured_output(FastGate, method="json_schema")

GATEKEEPER_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are a low-latency triage filter for an autonomous meeting HUD.
        Your sole job: Decide whether the dashboard needs to run a NEW query or update its visual.


        RULES:
        1. Return trigger=False if the latest utterance:
        - Is conversational feedback or agreement on existing data (e.g., "That's very good", "Okay", "Right", "Looks weird").
        - Is chit-chat or off-topic banter (e.g., "grab a coffee", "wait for Alex").

        2. Return trigger=True ONLY if the latest utterance:
        - Asks a NEW question or requests metrics NOT currently shown.
        - Demands a pivot or drill-down (e.g., "What about Germany specifically?", "Show monthly profit instead", "Break this down by year").
        """,
            ),
            (
            "human",
            """Recent Context: {context}
        Latest Utterance: "{latest}"
        """,
    ),
])


gatekeeper_chain = GATEKEEPER_PROMPT | gatekeeper


def check_gate(
    latest_speech: str,
    context_list: list[str],
):
  """Takes real values from Voice_Engine and injects them into the prompt placeholders."""
  # Turn the list of past turns into a single string
  past = " | ".join(context_list[:-1]) if len(context_list) > 1 else "None"

  # This is where the placeholders {context}, {latest} get their values
  return gatekeeper_chain.invoke({
      "context": past,
      "latest": latest_speech,
  })