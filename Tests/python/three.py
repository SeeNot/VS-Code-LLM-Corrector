from three_two import ShoppingCart


def apply_vip_discount(cart: ShoppingCart, discount_percent: float):
	if not isinstance(cart, ShoppingCart):
		raise TypeError("Nepieciešams ShoppingCart objekts")

	if cart.user_status == 'VIP':
		discount_amount = cart.total_value * (discount_percent / 100)
		cart.total_value -= discount_amount
		return True
	return False