import uuid

class GraphicElement:

	def __init__(self):
		self.is_visible = True
		self.z_index = 0
		self._id = uuid.uuid4()

	def render(self):
		if self.is_visible:
			return f"Rendēju elementu {self._id} līmenī {self.z_index}"
		return ""


class ButtonWidget(GraphicElement):


	def __init__(self, label: str):
		self.label = label
		self.is_clicked = False




	def click(self):
		self.is_clicked = True
		print(f"Poga '{self.label}' noklikšķināta!")


if __name__ == "__main__":
	btn = ButtonWidget("Saglabāt")

	render_output = btn.render()

	assert "Rendēju elementu" in render_output, "Kļūda renderēšanas loģikā."
	print("Scenārijs 8 darbojas veiksmīgi.")