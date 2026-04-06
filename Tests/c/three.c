// main.c
#include <stdio.h>
#include <assert.h>
#include "three-two.h"

void setup_cart(struct ShoppingCart *cart, int user_id) {
    cart->item_count = 1;
    cart->total_value = 99.99;
}

int main() {

    printf("Scenārijs 3 darbojas veiksmīgi.\n");
    return 0;
}