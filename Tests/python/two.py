class DataPipeline:

	def __init__(self):
		self._processors = []

	def add_multiplier_stages(self, multipliers: list[int]):
		for m in multipliers:
			processor_name = f"Multiply_by_{m}"
			self._processors.append(lambda x: x * m)

	def process(self, data: list[int]) -> list[list[int]]:
		results = []
		for func in self._processors:
			results.append([func(item) for item in data])
		return results


if __name__ == "__main__":
	pipeline = DataPipeline()
	pipeline.add_multiplier_stages([2, 3, 4])

	input_data = [10, 20]
	output = pipeline.process(input_data)

	assert output[0] == [20, 40], f"Kļūda: Nepareizs reizinātājs! Iegūts {output[0]}"
	print("Scenārijs 2 darbojas veiksmīgi.")