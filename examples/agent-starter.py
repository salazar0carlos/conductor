#!/usr/bin/env python3
"""
Conductor Agent - Python Starter

This is a sample agent that polls the Conductor API for tasks and executes them.
Customize this script based on your agent's capabilities.

Usage:
    python agent-starter.py --agent-id YOUR_AGENT_ID --api-key YOUR_API_KEY

Requirements:
    pip install requests anthropic openai
"""

import argparse
import json
import logging
import time
from typing import Dict, Any, Optional
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ConductorAgent:
    """Base class for Conductor agents"""

    def __init__(
        self,
        agent_id: str,
        api_key: str,
        capabilities: list[str],
        base_url: str = "http://localhost:3000",
        poll_interval: int = 5
    ):
        self.agent_id = agent_id
        self.api_key = api_key
        self.capabilities = capabilities
        self.base_url = base_url
        self.poll_interval = poll_interval
        self.running = True

    def poll_for_task(self) -> Optional[Dict[str, Any]]:
        """Poll the API for an available task"""
        try:
            response = requests.post(
                f"{self.base_url}/api/tasks/poll",
                json={
                    "agent_id": self.agent_id,
                    "capabilities": self.capabilities
                },
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("data"):
                    return data["data"]
            return None

        except Exception as e:
            logger.error(f"Error polling for task: {e}")
            return None

    def send_heartbeat(self, status: str = "active") -> bool:
        """Send heartbeat to indicate agent is alive"""
        try:
            response = requests.post(
                f"{self.base_url}/api/agents/heartbeat",
                json={
                    "agent_id": self.agent_id,
                    "status": status
                },
                headers={"Content-Type": "application/json"}
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error sending heartbeat: {e}")
            return False

    def log_task_message(self, task_id: str, message: str, level: str = "info", data: Optional[Dict] = None):
        """Log a message for a task"""
        try:
            requests.post(
                f"{self.base_url}/api/tasks/{task_id}/logs",
                json={
                    "agent_id": self.agent_id,
                    "level": level,
                    "message": message,
                    "data": data or {}
                },
                headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            logger.error(f"Error logging task message: {e}")

    def complete_task(self, task_id: str, output_data: Dict[str, Any]) -> bool:
        """Mark task as completed"""
        try:
            response = requests.post(
                f"{self.base_url}/api/tasks/{task_id}/complete",
                json={
                    "agent_id": self.agent_id,
                    "output_data": output_data
                },
                headers={"Content-Type": "application/json"}
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error completing task: {e}")
            return False

    def fail_task(self, task_id: str, error_message: str) -> bool:
        """Mark task as failed"""
        try:
            response = requests.post(
                f"{self.base_url}/api/tasks/{task_id}/fail",
                json={
                    "agent_id": self.agent_id,
                    "error_message": error_message
                },
                headers={"Content-Type": "application/json"}
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error failing task: {e}")
            return False

    def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the given task. Override this method in your agent implementation.

        Args:
            task: The task object containing title, description, input_data, etc.

        Returns:
            Dictionary containing the output data
        """
        raise NotImplementedError("Subclasses must implement execute_task()")

    def run(self):
        """Main agent loop"""
        logger.info(f"Agent {self.agent_id} starting...")
        logger.info(f"Capabilities: {', '.join(self.capabilities)}")

        heartbeat_counter = 0

        while self.running:
            try:
                # Send heartbeat every 6 polls (30 seconds if poll_interval is 5)
                if heartbeat_counter % 6 == 0:
                    self.send_heartbeat("active")
                    logger.debug("Sent heartbeat")
                heartbeat_counter += 1

                # Poll for task
                task = self.poll_for_task()

                if task:
                    task_id = task["id"]
                    logger.info(f"Received task: {task['title']}")

                    self.log_task_message(task_id, f"Task assigned to agent {self.agent_id}")

                    try:
                        # Update heartbeat to busy
                        self.send_heartbeat("busy")

                        # Execute the task
                        self.log_task_message(task_id, "Starting task execution")
                        output_data = self.execute_task(task)

                        # Complete the task
                        self.log_task_message(task_id, "Task completed successfully")
                        self.complete_task(task_id, output_data)
                        logger.info(f"Task {task_id} completed successfully")

                    except Exception as e:
                        logger.error(f"Task execution failed: {e}")
                        self.log_task_message(task_id, f"Task execution failed: {str(e)}", level="error")
                        self.fail_task(task_id, str(e))

                    finally:
                        # Reset to active
                        self.send_heartbeat("active")
                else:
                    logger.debug("No tasks available")

                # Wait before next poll
                time.sleep(self.poll_interval)

            except KeyboardInterrupt:
                logger.info("Shutting down agent...")
                self.running = False
                self.send_heartbeat("offline")
                break
            except Exception as e:
                logger.error(f"Error in agent loop: {e}")
                time.sleep(self.poll_interval)


class ExampleAgent(ConductorAgent):
    """Example agent implementation"""

    def __init__(self, agent_id: str, api_key: str, **kwargs):
        super().__init__(
            agent_id=agent_id,
            api_key=api_key,
            capabilities=["coding", "analysis", "documentation"],
            **kwargs
        )
        # Initialize your AI client here (Anthropic, OpenAI, etc.)
        # self.ai_client = anthropic.Anthropic(api_key=api_key)

    def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a task using AI"""
        task_id = task["id"]
        title = task["title"]
        description = task.get("description", "")
        input_data = task.get("input_data", {})
        task_type = task.get("type", "feature")

        logger.info(f"Executing {task_type} task: {title}")

        # Log progress
        self.log_task_message(task_id, f"Analyzing task requirements")

        # Here you would call your AI model
        # For example with Anthropic:
        # response = self.ai_client.messages.create(
        #     model="claude-sonnet-4",
        #     messages=[{
        #         "role": "user",
        #         "content": f"Task: {title}\nDescription: {description}\nInput: {json.dumps(input_data)}"
        #     }]
        # )

        # Simulate work
        time.sleep(2)
        self.log_task_message(task_id, "Processing task with AI model")
        time.sleep(2)
        self.log_task_message(task_id, "Generating output")
        time.sleep(1)

        # Return output data
        return {
            "result": f"Completed {task_type} task: {title}",
            "task_type": task_type,
            "execution_time": "5 seconds",
            "model": "example-model",
            "success": True
        }


def main():
    parser = argparse.ArgumentParser(description="Run a Conductor agent")
    parser.add_argument("--agent-id", required=True, help="Agent ID from Conductor")
    parser.add_argument("--api-key", required=True, help="AI API key (Anthropic/OpenAI)")
    parser.add_argument("--base-url", default="http://localhost:3000", help="Conductor API base URL")
    parser.add_argument("--poll-interval", type=int, default=5, help="Polling interval in seconds")

    args = parser.parse_args()

    # Create and run agent
    agent = ExampleAgent(
        agent_id=args.agent_id,
        api_key=args.api_key,
        base_url=args.base_url,
        poll_interval=args.poll_interval
    )

    agent.run()


if __name__ == "__main__":
    main()
