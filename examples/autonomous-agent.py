#!/usr/bin/env python3
"""
Autonomous Coding Agent - REAL Implementation

This agent can actually execute coding tasks by:
1. Analyzing task requirements with AI
2. Reading and understanding existing code
3. Generating new code or modifications
4. Writing files to the codebase
5. Running tests and validation
6. Committing changes to git

Requirements:
    pip install requests anthropic gitpython
"""

import os
import json
import subprocess
from pathlib import Path
from typing import Dict, Any, List
import anthropic
from agent_starter import ConductorAgent

class AutonomousCodingAgent(ConductorAgent):
    """
    A real autonomous agent that can write code, modify files, and complete tasks
    """

    def __init__(
        self,
        agent_id: str,
        anthropic_api_key: str,
        workspace_path: str,
        **kwargs
    ):
        super().__init__(
            agent_id=agent_id,
            api_key=anthropic_api_key,
            capabilities=['coding', 'debugging', 'refactoring', 'testing', 'analysis'],
            **kwargs
        )
        self.ai_client = anthropic.Anthropic(api_key=anthropic_api_key)
        self.workspace = Path(workspace_path).resolve()
        self.model = "claude-sonnet-4"

    def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Autonomously execute a coding task
        """
        task_id = task["id"]
        title = task["title"]
        description = task.get("description", "")
        task_type = task.get("type", "feature")
        input_data = task.get("input_data", {})

        self.log_task_message(task_id, f"🤖 Starting autonomous execution of {task_type}: {title}")

        try:
            # Step 1: Analyze the task and create a plan
            self.log_task_message(task_id, "📋 Analyzing task requirements...")
            plan = self._create_execution_plan(title, description, task_type, input_data)
            self.log_task_message(task_id, f"Plan created: {len(plan['steps'])} steps")

            # Step 2: Gather context from existing codebase
            self.log_task_message(task_id, "🔍 Reading existing codebase...")
            context = self._gather_codebase_context(plan)
            self.log_task_message(task_id, f"Analyzed {len(context['files'])} relevant files")

            # Step 3: Execute each step of the plan
            results = []
            for i, step in enumerate(plan['steps'], 1):
                self.log_task_message(task_id, f"⚙️ Step {i}/{len(plan['steps'])}: {step['action']}")
                step_result = self._execute_step(task_id, step, context)
                results.append(step_result)

            # Step 4: Validate the changes
            self.log_task_message(task_id, "✅ Validating changes...")
            validation = self._validate_changes(task_id)

            # Step 5: Commit changes if validation passes
            if validation['success']:
                self.log_task_message(task_id, "💾 Committing changes to git...")
                commit_hash = self._commit_changes(title)
                self.log_task_message(task_id, f"✅ Committed: {commit_hash}")
            else:
                self.log_task_message(task_id, f"⚠️ Validation issues: {validation['issues']}", level="warning")

            # Return results
            return {
                "success": True,
                "task_type": task_type,
                "plan": plan,
                "steps_completed": len(results),
                "files_modified": [r['file'] for r in results if 'file' in r],
                "validation": validation,
                "commit": commit_hash if validation['success'] else None,
                "execution_summary": self._generate_summary(results)
            }

        except Exception as e:
            self.log_task_message(task_id, f"❌ Error during execution: {str(e)}", level="error")
            raise

    def _create_execution_plan(
        self,
        title: str,
        description: str,
        task_type: str,
        input_data: Dict
    ) -> Dict[str, Any]:
        """
        Use AI to create a step-by-step execution plan
        """
        prompt = f"""
You are an expert software engineer creating an execution plan for a coding task.

Task Type: {task_type}
Title: {title}
Description: {description}
Input Data: {json.dumps(input_data, indent=2)}

Create a detailed execution plan with specific steps. Each step should include:
1. action: What to do (e.g., "create_file", "modify_file", "run_command")
2. target: The file or command
3. description: Why this step is needed
4. dependencies: What needs to exist first

Return your plan as JSON with this structure:
{{
    "overview": "High-level summary of approach",
    "steps": [
        {{
            "action": "create_file",
            "target": "path/to/file.py",
            "description": "Create authentication module",
            "dependencies": []
        }}
    ],
    "estimated_complexity": "low|medium|high"
}}
"""

        response = self.ai_client.messages.create(
            model=self.model,
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}]
        )

        plan_text = response.content[0].text
        # Extract JSON from response (handle markdown code blocks)
        if "```json" in plan_text:
            plan_text = plan_text.split("```json")[1].split("```")[0].strip()
        elif "```" in plan_text:
            plan_text = plan_text.split("```")[1].split("```")[0].strip()

        return json.loads(plan_text)

    def _gather_codebase_context(self, plan: Dict) -> Dict[str, Any]:
        """
        Read relevant files from the codebase to understand context
        """
        context = {
            "files": {},
            "structure": {},
            "technologies": []
        }

        # Get project structure
        try:
            package_json = self.workspace / "package.json"
            if package_json.exists():
                with open(package_json) as f:
                    pkg = json.load(f)
                    context["technologies"] = list(pkg.get("dependencies", {}).keys())
        except:
            pass

        # Read relevant files based on plan
        for step in plan.get("steps", []):
            target = step.get("target", "")
            if target:
                file_path = self.workspace / target
                if file_path.exists():
                    try:
                        with open(file_path) as f:
                            context["files"][target] = f.read()
                    except:
                        pass

        return context

    def _execute_step(
        self,
        task_id: str,
        step: Dict,
        context: Dict
    ) -> Dict[str, Any]:
        """
        Execute a single step of the plan
        """
        action = step["action"]
        target = step["target"]
        description = step["description"]

        if action == "create_file":
            return self._create_file(task_id, target, description, context)
        elif action == "modify_file":
            return self._modify_file(task_id, target, description, context)
        elif action == "run_command":
            return self._run_command(task_id, target, description)
        else:
            return {"action": action, "status": "skipped"}

    def _create_file(
        self,
        task_id: str,
        file_path: str,
        description: str,
        context: Dict
    ) -> Dict[str, Any]:
        """
        Use AI to generate and write a new file
        """
        prompt = f"""
You are an expert software engineer writing code.

Task: Create a new file at {file_path}
Purpose: {description}

Existing codebase context:
Technologies: {', '.join(context.get('technologies', []))}

Related files:
{json.dumps({k: v[:500] for k, v in context.get('files', {}).items()}, indent=2)}

Generate the COMPLETE contents of this file. Include:
- All necessary imports
- Proper type hints/types
- Error handling
- Comments explaining complex logic
- Following the existing code style

Return ONLY the file contents, no explanations or markdown.
"""

        response = self.ai_client.messages.create(
            model=self.model,
            max_tokens=8000,
            messages=[{"role": "user", "content": prompt}]
        )

        file_contents = response.content[0].text

        # Remove markdown code blocks if present
        if "```" in file_contents:
            lines = file_contents.split("\n")
            code_lines = []
            in_code = False
            for line in lines:
                if line.strip().startswith("```"):
                    in_code = not in_code
                    continue
                if in_code or not any(line.startswith(x) for x in ["```", "#", "Here", "This"]):
                    code_lines.append(line)
            file_contents = "\n".join(code_lines).strip()

        # Write the file
        full_path = self.workspace / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)

        with open(full_path, 'w') as f:
            f.write(file_contents)

        self.log_task_message(task_id, f"✍️ Created {file_path} ({len(file_contents)} chars)")

        return {
            "action": "create_file",
            "file": file_path,
            "size": len(file_contents),
            "status": "success"
        }

    def _modify_file(
        self,
        task_id: str,
        file_path: str,
        description: str,
        context: Dict
    ) -> Dict[str, Any]:
        """
        Use AI to modify an existing file
        """
        full_path = self.workspace / file_path

        if not full_path.exists():
            return {"action": "modify_file", "status": "file_not_found"}

        with open(full_path) as f:
            original_content = f.read()

        prompt = f"""
You are an expert software engineer modifying existing code.

Task: Modify {file_path}
Purpose: {description}

Current file contents:
{original_content}

Related context:
{json.dumps({k: v[:500] for k, v in context.get('files', {}).items()}, indent=2)}

Modify this file to accomplish the task. Return the COMPLETE modified file contents.
Preserve existing functionality and code style. Return ONLY the code, no explanations.
"""

        response = self.ai_client.messages.create(
            model=self.model,
            max_tokens=8000,
            messages=[{"role": "user", "content": prompt}]
        )

        modified_content = response.content[0].text

        # Clean up markdown if present
        if "```" in modified_content:
            lines = modified_content.split("\n")
            code_lines = []
            in_code = False
            for line in lines:
                if line.strip().startswith("```"):
                    in_code = not in_code
                    continue
                if in_code:
                    code_lines.append(line)
            modified_content = "\n".join(code_lines).strip()

        # Write the modified file
        with open(full_path, 'w') as f:
            f.write(modified_content)

        self.log_task_message(task_id, f"✏️ Modified {file_path}")

        return {
            "action": "modify_file",
            "file": file_path,
            "original_size": len(original_content),
            "new_size": len(modified_content),
            "status": "success"
        }

    def _run_command(
        self,
        task_id: str,
        command: str,
        description: str
    ) -> Dict[str, Any]:
        """
        Run a command in the workspace
        """
        try:
            result = subprocess.run(
                command,
                shell=True,
                cwd=self.workspace,
                capture_output=True,
                text=True,
                timeout=60
            )

            self.log_task_message(
                task_id,
                f"🔧 Ran: {command}\nExit code: {result.returncode}"
            )

            return {
                "action": "run_command",
                "command": command,
                "exit_code": result.returncode,
                "stdout": result.stdout[:500],
                "stderr": result.stderr[:500],
                "status": "success" if result.returncode == 0 else "failed"
            }
        except Exception as e:
            self.log_task_message(task_id, f"❌ Command failed: {str(e)}", level="error")
            return {
                "action": "run_command",
                "command": command,
                "error": str(e),
                "status": "error"
            }

    def _validate_changes(self, task_id: str) -> Dict[str, Any]:
        """
        Validate that changes don't break anything
        """
        issues = []

        # Check if there are any uncommitted changes
        try:
            result = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=self.workspace,
                capture_output=True,
                text=True
            )
            if not result.stdout.strip():
                issues.append("No changes detected")
        except:
            issues.append("Git check failed")

        # Try to run linter/type checker if available
        try:
            # Check for TypeScript errors
            if (self.workspace / "tsconfig.json").exists():
                result = subprocess.run(
                    ["npm", "run", "type-check"],
                    cwd=self.workspace,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                if result.returncode != 0:
                    issues.append(f"Type errors: {result.stderr[:200]}")
        except:
            pass

        return {
            "success": len(issues) == 0,
            "issues": issues
        }

    def _commit_changes(self, message: str) -> str:
        """
        Commit changes to git
        """
        try:
            # Add all changes
            subprocess.run(
                ["git", "add", "."],
                cwd=self.workspace,
                check=True
            )

            # Commit
            subprocess.run(
                ["git", "commit", "-m", f"🤖 {message}"],
                cwd=self.workspace,
                check=True
            )

            # Get commit hash
            result = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                cwd=self.workspace,
                capture_output=True,
                text=True,
                check=True
            )

            return result.stdout.strip()[:8]
        except Exception as e:
            return f"commit_failed: {str(e)}"

    def _generate_summary(self, results: List[Dict]) -> str:
        """
        Generate a human-readable summary of what was done
        """
        files_created = [r['file'] for r in results if r.get('action') == 'create_file']
        files_modified = [r['file'] for r in results if r.get('action') == 'modify_file']
        commands_run = [r['command'] for r in results if r.get('action') == 'run_command']

        summary_parts = []
        if files_created:
            summary_parts.append(f"Created {len(files_created)} files: {', '.join(files_created)}")
        if files_modified:
            summary_parts.append(f"Modified {len(files_modified)} files: {', '.join(files_modified)}")
        if commands_run:
            summary_parts.append(f"Ran {len(commands_run)} commands")

        return " | ".join(summary_parts) if summary_parts else "No changes made"


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Run autonomous coding agent")
    parser.add_argument("--agent-id", required=True, help="Agent ID from Conductor")
    parser.add_argument("--api-key", required=True, help="Anthropic API key")
    parser.add_argument("--workspace", required=True, help="Path to codebase workspace")
    parser.add_argument("--base-url", default="http://localhost:3000", help="Conductor API URL")

    args = parser.parse_args()

    # Create and run the autonomous agent
    agent = AutonomousCodingAgent(
        agent_id=args.agent_id,
        anthropic_api_key=args.api_key,
        workspace_path=args.workspace,
        base_url=args.base_url
    )

    print(f"🤖 Autonomous Coding Agent started")
    print(f"📁 Workspace: {args.workspace}")
    print(f"🔗 Conductor: {args.base_url}")
    print(f"Waiting for tasks...\n")

    agent.run()


if __name__ == "__main__":
    main()
