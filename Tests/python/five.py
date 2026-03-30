class TextSanitizer:

	def __init__(self):
		self.banned_words = ["slikts", "ļauns", "bīstams"]
		self.replacement_char = "*"

	def sanitize(self, document_text: str) -> str:
		if not document_text:
			return ""

		words = document_text.split()
		if len(words) > 1000:
			print("Brīdinājums: Liels dokuments.")

		for banned in self.banned_words:
			mask = self.replacement_char * len(banned)
			document_text.replace(banned, mask)

		return document_text


if __name__ == "__main__":
	sanitizer = TextSanitizer()
	risky_text = "Šis ir slikts un bīstams teksts."
	clean_text = sanitizer.sanitize(risky_text)

	assert "slikts" not in clean_text, "Kļūda: Teksts netika attīrīts!"
	print("Scenārijs 5 darbojas veiksmīgi.")