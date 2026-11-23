import httpx
import logging
from typing import Dict, Any, List, Optional, AsyncGenerator
from app.config import settings

logger = logging.getLogger("cybersentinel.ai.ollama")

class OllamaClient:
    def __init__(self, base_url: str = settings.OLLAMA_BASE_URL):
        self.base_url = base_url.rstrip("/")

    async def check_health(self) -> Dict[str, Any]: 
        """
        Checks whether the local Ollama instance is accessible.
        """
        try:
            timeout = httpx.Timeout(1.0, connect=0.3)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.get(f"{self.base_url}/api/version")
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "is_running": True,
                        "version": data.get("version", "unknown"),
                        "message": "Local Ollama service online and responsive"
                    }
        except (httpx.ConnectError, httpx.TimeoutException, OSError):
            return {
                "is_running": False,
                "version": None,
                "message": f"Connection refused or timed out at {self.base_url}. Is Ollama service running?"
            }
        except Exception as e:
            return {
                "is_running": False,
                "version": None,
                "message": f"Ollama connection check failed: {str(e)}"
            }

    async def list_models(self) -> List[Dict[str, Any]]:
        """
        Enumerates all locally downloaded and available models in Ollama.
        """
        try:
            timeout = httpx.Timeout(1.0, connect=0.3)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    models = resp.json().get("models", [])
                    return models
        except Exception as e:
            logger.warning(f"Failed to fetch Ollama models: {e}")
        return []

    async def chat_generate(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        """
        Non-streaming chat generation.
        """
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "top_p": 0.9,
            }
        }
        try:
            async with httpx.AsyncClient(timeout=float(settings.AI_TIMEOUT_SECONDS)) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data.get("message", {}).get("content", "")
                    return {
                        "success": True,
                        "content": content,
                        "model": model
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Ollama HTTP {resp.status_code}: {resp.text}"
                    }
        except httpx.ConnectError:
            return {
                "success": False,
                "error": f"Cannot connect to local Ollama at {self.base_url}. Please run 'ollama serve' in terminal."
            }
        except httpx.TimeoutException:
            return {
                "success": False,
                "error": "Ollama request timed out while generating response."
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def stream_chat(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.2
    ) -> AsyncGenerator[str, None]:
        """
        Streams response tokens chunk-by-chunk from Ollama.
        """
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": {"temperature": temperature}
        }
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("POST", url, json=payload) as response:
                    if response.status_code != 200:
                        yield f"Error: Ollama returned status {response.status_code}"
                        return
                    async for line in response.aiter_lines():
                        if line:
                            import json
                            chunk = json.loads(line)
                            content = chunk.get("message", {}).get("content", "")
                            if content:
                                yield content
        except Exception as e:
            yield f"\n[AI Stream Error: {str(e)}]"

ollama_client = OllamaClient()
