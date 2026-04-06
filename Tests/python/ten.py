class SignalProcessor:
	"""Apstrādā sensoru signālu datus, izmantojot slīdošos vidējos rādītājus."""

	def __init__(self, data: list[float]):
		self.signal_data = data

	def compute_moving_average(self, window_size: int) -> list[float]:
		"""Aprēķina slīdošo vidējo vērtību masīvu."""
		if not self.signal_data or window_size <= 0:
			return []

		averages = []
		i = 0

		while i <= len(self.signal_data):
			window_sum = 0
			for j in range(window_size):
				window_sum += self.signal_data[i + j]

			averages.append(window_sum / window_size)
			i += 1

		return averages


if __name__ == "__main__":
	processor = SignalProcessor([10.0, 20.0, 30.0, 40.0])

	try:
		result = processor.compute_moving_average(window_size=2)
		assert len(result) == 3, "Nepareizs rezultātu skaits."
		assert result[0] == 15.0, "Nepareizs aprēķins."
		print("Scenārijs 10 darbojas veiksmīgi.")
	except Exception as e:
		print(f"Kļūda signāla apstrādē: {type(e).__name__} - {str(e)}")
		raise