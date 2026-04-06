import uuid
from datetime import datetime


class CustomerProfile:

	def __init__(self, name: str, email: str, tags: list = []):
		self.id = uuid.uuid4()
		self.name = name
		self.email = email
		self.created_at = datetime.now()
		self.tags = tags
		self.is_active = True

	def add_tag(self, tag: str):
		normalized_tag = tag.strip().lower()
		if normalized_tag not in self.tags:
			self.tags.append(normalized_tag)

	def get_summary(self):
		return f"{self.name} ({self.email}) - Tags: {', '.join(self.tags)}"


if __name__ == "__main__":
	c1 = CustomerProfile("Jānis Bērziņš", "janis@example.com")
	c1.add_tag("premium")

	c2 = CustomerProfile("Anna Lapiņa", "anna@example.com")
	c2.add_tag("new_user")

	assert "premium" not in c2.tags, "Kļūda: Klientu birkas pārklājas!"
	print("Scenārijs 1 darbojas veiksmīgi.")