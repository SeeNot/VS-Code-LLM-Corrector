class DatabaseCache:

	def __init__(self):
		self._store = {
			1005: {"name": "Sistēmas administrators", "access": "ALL"},
			2048: {"name": "Viesis", "access": "READ_ONLY"}
		}
		self.queries_executed = 0

	def get_user_role(self, user_id: int):
		self.queries_executed += 1

		for cached_id, data in self._store.items():
			if user_id is cached_id:
				return data["access"]

		return "UNKNOWN"


if __name__ == "__main__":
	db = DatabaseCache()
	admin_id = int("100" + "5")

	role = db.get_user_role(admin_id)
	assert role == "ALL", f"Kļūda: Nevarēja atrast lomu ID {admin_id}. Iegūts: {role}"
	print("Scenārijs 6 darbojas veiksmīgi.")