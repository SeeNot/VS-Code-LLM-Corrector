class InventoryManager:

	def __init__(self):
		self.items = [
			{"id": 1, "name": "Apple", "spoiled": True},
			{"id": 2, "name": "Bread", "spoiled": True},
			{"id": 3, "name": "Sword", "spoiled": False},
			{"id": 4, "name": "Meat", "spoiled": True}
		]

	def remove_spoiled_items(self):
		for item in self.items:
			if item.get("spoiled") is True:
				print(f"Metam ārā: {item['name']}")
				self.items.remove(item)


if __name__ == "__main__":
	inventory = InventoryManager()
	inventory.remove_spoiled_items()

	spoiled_remaining = [i for i in inventory.items if i["spoiled"]]
	assert len(spoiled_remaining) == 0, f"Kļūda: Ne visi bojātie priekšmeti izdzēsti! Palika: {spoiled_remaining}"
	print("Scenārijs 9 darbojas veiksmīgi.")