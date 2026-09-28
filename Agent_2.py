## Agent Logic and code - Agent_2.py

import sqlite3
import os
import json

from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage

from langgraph.graph import START, END, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode

from scipy.stats import pearsonr, ttest_ind, f_oneway

import webbrowser
import plotly.graph_objects as go

from event_bridge import broadcast_event
from langchain_core.runnables import RunnableConfig

from langchain_openai import ChatOpenAI

# Fast System 1 Gatekeeper


load_dotenv()

llm = ChatOpenAI(
    base_url=os.environ.get("FIREWORKS_BASE_URL", "https://api.fireworks.ai/inference/v1"),
    api_key=os.environ["FIREWORKS_API_KEY"],
    model_name="accounts/fireworks/models/deepseek-v4p1-flash", 
    temperature=0.1

)


memory = []

def load_dashboard(payload: dict):
    """Broadcast the Plotly JSON specification to connected frontend clients."""
    print("[Agent] Broadcasting chart update to dashboard...")
    broadcast_event("chart_update", {"chart": payload})


def get_database_schema():
    """Get the database tables and their SQL schema."""
    connection = sqlite3.connect("database.db")
    cursor = connection.cursor()

    cursor.execute("""
        SELECT name, sql
        FROM sqlite_master
        WHERE type = 'table'
    """)

    rows = cursor.fetchmany(100)
    
    connection.close()
    return rows


@tool
def execute_sql(query: str):
    """Execute a read-only SQL query and return the result."""
    
    broadcast_event("tool_event", {
        "tool": "execute_sql",
        "input": {"query": query},
        "status": "running"
    })

    connection = sqlite3.connect("database.db")
    cursor = connection.cursor()
    cursor.execute(query)
    result = cursor.fetchall()
    connection.close()

    broadcast_event("tool_event", {
        "tool": "execute_sql",
        "input": {"query": query},
        "output": result[:20] if isinstance(result, list) else result,
        "row_count": len(result) if isinstance(result, list) else None,
        "status": "completed"
    })

    return result


@tool
def correlation(x_values: list[float], y_values: list[float]):
    """Calculates correlation between two numeric datasets values"""
    
    broadcast_event("tool_event", {
        "tool": "correlation",
        "input": {"x_count": len(x_values), "y_count": len(y_values)},
        "status": "running"
    })

    r, p = pearsonr(x_values, y_values)
    res = {
        "correlation": float(r),
        "p_value": float(p),
    }

    broadcast_event("tool_event", {
        "tool": "correlation",
        "output": res,
        "status": "completed"
    })

    return res


@tool
def t_test(group_a: list[float], group_b: list[float]):
    """Test whether two independent numeric groups have significantly different means. Returns the t-statistic and p-value."""
    
    broadcast_event("tool_event", {
        "tool": "t_test",
        "input": {"group_a_size": len(group_a), "group_b_size": len(group_b)},
        "status": "running"
    })

    statistic, p = ttest_ind(group_a, group_b, equal_var=False)

    print("GROUP A:", group_a)
    print("GROUP B:", group_b)

    res = {
        "statistic": float(statistic),
        "p_value": float(p),
    }

    broadcast_event("tool_event", {
        "tool": "t_test",
        "output": res,
        "status": "completed"
    })

    return res


@tool
def anova(group1: list[float], group2: list[float], group3: list[float]):
    """Compare the means of three numeric groups using one-way ANOVA."""
    
    broadcast_event("tool_event", {
        "tool": "anova",
        "input": {"group1_size": len(group1), "group2_size": len(group2), "group3_size": len(group3)},
        "status": "running"
    })

    statistic, p = f_oneway(group1, group2, group3)
    res = {
        "statistic": float(statistic),
        "p_value": float(p),
    }

    broadcast_event("tool_event", {
        "tool": "anova",
        "output": res,
        "status": "completed"
    })

    return res


@tool
def create_plot(
    chart_type: str,
    x_values: list,
    y_values: list[float],
    title: str,
    x_label: str = "X",
    y_label: str = "Y"
):
    """Create a chart and open it in the browser."""
    
    print("TYPE:", chart_type)
    print("X:", x_values)
    print("Y:", y_values)

    broadcast_event("tool_event", {
        "tool": "create_plot",
        "input": {
            "chart_type": chart_type,
            "title": title,
            "x_label": x_label,
            "y_label": y_label,
            "point_count": len(x_values)
        },
        "status": "running"
    })

    if chart_type == "bar":
        fig = go.Figure(go.Bar(x=x_values, y=y_values))
    elif chart_type == "line":
        fig = go.Figure(
            go.Scatter(
                x=x_values,
                y=y_values,
                mode="lines+markers"
            )
        )
    elif chart_type == "scatter":
        fig = go.Figure(
            go.Scatter(
                x=x_values,
                y=y_values,
                mode="markers"
            )
        )
    else:
        return {"error": "Invalid chart type"}

    fig.update_layout(
        title=title,
        xaxis_title=x_label,
        yaxis_title=y_label,
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)"
    )

    payload = json.loads(fig.to_json())

    # Broadcast to modern dashboard
    load_dashboard(payload)

    broadcast_event("tool_event", {
        "tool": "create_plot",
        "output": {"rendered": title, "chart_type": chart_type},
        "status": "completed"
    })

    return f"Rendered '{title}'. Plotted data: {list(zip(x_values, y_values))}"


tools = [execute_sql, correlation, t_test, anova, create_plot]

temp_llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite",
    google_api_key=os.environ.get("GEMINI_API_KEY"),
)

llm_with_tools = llm.bind_tools(tools)


def agent_node(state: MessagesState, config= None):
    

    # 1. Read mode passed during invoke (defaults to "normal")
    mode = (config or {}).get("configurable", {}).get("mode", "normal")
    schema = get_database_schema()

    # 2. Select system prompt based on mode
    if mode == "meeting":
        
        prompt_content = f"""
            You are an Ambient Meeting Intelligence HUD.
            Your goal is to silently serve analytics and charts to the screen.

            STRICT HUD RULES:
            - ALWAYS call `create_plot` when data or metrics are retrieved from SQL.
            - Text MUST be under 20 words (1 sentence max highlighting the top insight/leader).
            - ZERO filler or pleasantries. Do NOT repeat chart numbers in text.
            - Do not invent tables or columns.
            - When working with large tables, always compute aggregates (SUM, AVG, COUNT) inside SQL.

            Current Database Tables: {schema}
            Current memory: {memory}
            """
    else:
        
        prompt_content = f"""
            You are a database assistant.

            Help the user understand and work with their database.

            Do not invent tables or columns.
            
            Dont use a tool if thats not wanted so dont waste time

            Your final text will be converted into tts, so try to structure the response to be spoken well

            When working with large tables, always compute aggregates (SUM, AVG, COUNT) inside SQL rather than fetching raw rows. For statistical tests, use SQL to filter or sample data to under 1,000 points before calling tools.

            Current Data Base Tables: {schema}

            Current memory: {memory}
            """
    response = llm_with_tools.invoke(
        [prompt_content] + state["messages"]
        )

    return {
         "messages": [response]
        }


tool_node = ToolNode(tools)


def should_continue(state: MessagesState):
    
    last_message = state["messages"][-1]

    if last_message.tool_calls:
        return "tools"

    return END


builder = StateGraph(MessagesState)

builder.add_node(
    "agent",
    agent_node
)

builder.add_node(
    "tools",
    tool_node
)

builder.add_edge(
    START,
    "agent"
)

builder.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        END: END
    }
)

builder.add_edge(
    "tools",
    "agent"
)

graph = builder.compile()


def run_agent(user_text: str,mode: str = "normal"):
    """Executes the agent for the user text and returns the spoken text response."""
    broadcast_event("agent_state", {"state": "Thinking"})

    result = graph.invoke({
        "messages": [
            {
                "role": "user",
                "content": user_text
            }
        ]
    },{"configurable": {"mode": mode}})

    final_message = result["messages"][-1]

    
    if isinstance(final_message.content, str):
        reply_text = final_message.content
    elif isinstance(final_message.content, list) and len(final_message.content) > 0:
        first = final_message.content[0]
        if isinstance(first, dict) and "text" in first:
            reply_text = first["text"]
        elif isinstance(first, str):
            reply_text = first
        else:
            reply_text = str(first)
    else:
        reply_text = str(final_message.content)

    memory_chunck = {
        "user said": user_text,
        "Agent": reply_text
    }

    memory.append(memory_chunck)


    broadcast_event("agent_reply", {"text": reply_text})

    return reply_text
