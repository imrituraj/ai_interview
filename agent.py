import asyncio
import logging
from enum import Enum
from dotenv import load_dotenv

from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
)
from livekit.agents.llm import function_tool
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import google, deepgram, silero
from e2b_code_interpreter import AsyncSandbox

load_dotenv()
logger = logging.getLogger("agent")


# ─── State Machine ────────────────────────────────────────────────────────────

class AgentState(Enum):
    GREETING = "GREETING"
    RESUME_SCAN = "RESUME_SCAN"
    CODING_TASK = "CODING_TASK"
    FEEDBACK = "FEEDBACK"


class InterviewContext:
    """Holds mutable state shared between tool calls."""
    def __init__(self):
        self.state = AgentState.GREETING
        self.sandbox: AsyncSandbox | None = None

    async def initialize(self):
        self.sandbox = await AsyncSandbox.create()

    async def cleanup(self):
        if self.sandbox:
            await self.sandbox.kill()


# ─── Tools ────────────────────────────────────────────────────────────────────

def make_tools(ctx: InterviewContext):
    """Create tool functions bound to the shared interview context."""

    @function_tool(description="Execute Python or JavaScript code inside a secure sandbox and return the output.")
    async def run_code(language: str, code: str) -> str:
        if not ctx.sandbox:
            return "Error: Sandbox not initialized."
        try:
            logger.info(f"E2B: running {language} code")
            execution = await ctx.sandbox.run_code(code, language=language)
            output = ""
            if execution.text:
                output += execution.text + "\n"
            if execution.error:
                output += f"Error: {execution.error.name} — {execution.error.value}\n"
            return output or "Code executed successfully with no output."
        except Exception as e:
            return f"Execution failed: {str(e)}"

    @function_tool(description="Advance the interview state machine. Valid values: GREETING, RESUME_SCAN, CODING_TASK, FEEDBACK")
    async def transition_state(next_state: str) -> str:
        try:
            ctx.state = AgentState(next_state.upper())
            logger.info(f"State → {ctx.state.name}")
            return f"State is now {ctx.state.name}."
        except ValueError:
            valid = [s.name for s in AgentState]
            return f"Invalid state. Valid options: {valid}"

    return [run_code, transition_state]


# ─── System Prompt ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are Ruth, a Senior Staff Engineer at a top-tier tech firm. "
    "Your goal is to conduct a 20-minute mock technical interview.\n\n"
    "Personality:\n"
    "• Tone: Professional, encouraging, but rigorous.\n"
    "• Use the Socratic Method — if the user is stuck, ask a guiding question "
    "about their logic or time complexity. Do NOT give answers directly.\n\n"
    "Rules:\n"
    "  1. Introduce yourself, then ask the candidate to explain a project from their resume.\n"
    "  2. Present a coding challenge. Ask them to explain their approach BEFORE coding.\n"
    "  3. Call run_code whenever the candidate says they are ready to test their solution.\n"
    "  4. If you sense silence or hesitation, nudge: 'Tell me what you're thinking right now.'\n\n"
    "State machine — call transition_state to advance:\n"
    "  GREETING → RESUME_SCAN → CODING_TASK → FEEDBACK\n\n"
    "CRITICAL: All spoken responses must be under 30 words. Be concise for low-latency voice."
)


# ─── LiveKit Entrypoints ──────────────────────────────────────────────────────

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    interview_ctx = InterviewContext()
    await interview_ctx.initialize()

    import asyncio

    @ctx.room.on("disconnected")
    def on_disconnected(*_):
        asyncio.create_task(interview_ctx.cleanup())

    session = AgentSession(
        vad=ctx.proc.userdata["vad"],
        stt=deepgram.STT(model="nova-3"),
        llm=google.LLM(model="gemini-2.5-flash"),
        tts=deepgram.TTS(model="aura-asteria-en"),
    )

    await session.start(
        room=ctx.room,
        agent=Agent(
            instructions=SYSTEM_PROMPT,
            tools=make_tools(interview_ctx),
        ),
    )

    await asyncio.sleep(1)
    await session.say(
        "Hello, I'm Ruth. Welcome to your technical interview. "
        "Could you walk me through a recent project from your resume?",
        allow_interruptions=True,
    )


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        )
    )
