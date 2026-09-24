# test_flow.py
from Agent_2 import run_agent
from GateKeeper import gatekeeper

# Test 1: Casual conversation (Should be IGNORED)
banter = "Can everyone see my screen? Let's get started."
res_banter = gatekeeper.invoke(f"Context: None\nLatest: {banter}")
print(
    f"Banter Test -> Trigger: {res_banter.trigger} | Conf:"
    f" {res_banter.confidence:.2f}"
)

# Test 2: Analytical request (Should TRIGGER)
data_q = "Can we see total sales by country from our invoices?"
res_data = gatekeeper.invoke(f"Context: None\nLatest: {data_q}")
print(
    f"Data Test   -> Trigger: {res_data.trigger} | Conf:"
    f" {res_data.confidence:.2f}"
)

if res_data.trigger and res_data.confidence >= 0.75:
  print("\nRunning Agent_2...")
  output = run_agent(data_q)
  print("Agent Output:", output)