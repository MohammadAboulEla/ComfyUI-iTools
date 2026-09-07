from comfy_api.latest import io
from ..backend.shared import get_user_node_display_name_preferences


class IToolsPromptRecord(io.ComfyNode):
    @classmethod
    def define_schema(cls) -> io.Schema:
        display_name = (
            "Prompt Record 🪶"
            if get_user_node_display_name_preferences()
            else "iTools Prompt Record 🪶"
        )
        return io.Schema(
            node_id="iToolsPromptRecord",
            display_name=display_name,
            category="iTools",
            description=(
                "Tracks your prompts during node execution or when using ▶ button.\n"
                "Provides quick access to previously used prompts. "
                "Includes a history system that saves your favorite prompts."
            ),
            inputs=[
                io.String.Input(
                    "text",
                    default="",
                    multiline=True,
                    tooltip="Text prompt to record and output.",
                ),
                io.String.Input(
                    "timeline_data",
                    default="",
                    tooltip="Internal JSON history storage for timeline.",
                ),
            ],
            outputs=[
                io.String.Output("text", display_name="text"),
            ],
            is_output_node=True,
        )

    @classmethod
    def execute(
        cls,
        text: str = "",
        timeline_data: str = "",
        **kwargs,
    ) -> io.NodeOutput:
        return io.NodeOutput(text, ui={"text": [text]})
