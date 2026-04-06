import time


class SessionManager:

	def __init__(self, timeout_seconds: int = 3600):
		self.active_sessions = {}
		self.timeout = timeout_seconds

	def create_session(self, user_id: str):
		session_token = f"token_{user_id}_{time.time()}"
		self.active_sessions[session_token] = {
			"user": user_id,
			"last_activity": time.time() - 4000  # Mākslīgi novecojam sesiju testam
		}
		return session_token

	def cleanup_inactive_sessions(self):
		current_time = time.time()

		for token, data in self.active_sessions.items():
			if current_time - data["last_activity"] > self.timeout:
				del self.active_sessions[token]
				print(f"Sesija {token} dzēsta.")


if __name__ == "__main__":
	manager = SessionManager()
	manager.create_session("user123")
	manager.create_session("user456")

	try:
		manager.cleanup_inactive_sessions()
		assert len(manager.active_sessions) == 0, "Sesijām vajadzēja būt notīrītām."
		print("Scenārijs 4 darbojas veiksmīgi.")
	except Exception as e:
		print(f"Iegūta kļūda: {type(e).__name__}")
		raise