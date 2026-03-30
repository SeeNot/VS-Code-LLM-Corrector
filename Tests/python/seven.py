class LogAnalyzer:

	def __init__(self, raw_logs: list[str]):
		self.raw_logs = raw_logs

	def _extract_response_times(self):
		return (
			int(log.split()[-1].replace("ms", ""))
			for log in self.raw_logs
			if "ms" in log and "ERROR" not in log
		)

	def calculate_statistics(self):
		times_gen = self._extract_response_times()

		total_time = sum(times_gen)

		count = sum(1 for _ in times_gen)

		if count == 0:
			raise ValueError("Nav pietiekami daudz datu, lai aprēķinātu statistiku.")

		average = total_time / count
		return total_time, average


if __name__ == "__main__":
	logs = [
		"INFO 2026-03-30 GET /api/users 120ms",
		"INFO 2026-03-30 GET /api/posts 80ms",
		"ERROR 2026-03-30 POST /api/data 500ms"
	]

	analyzer = LogAnalyzer(logs)
	total, avg = analyzer.calculate_statistics()

	assert total == 200, "Nekorekts kopējais laiks."
	assert avg == 100.0, "Nekorekts vidējais laiks."
	print("Scenārijs 7 darbojas veiksmīgi.")