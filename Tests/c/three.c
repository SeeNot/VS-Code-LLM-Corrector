// main.c
#include <stdio.h>
#include <assert.h>
#include "three-two.h" // Iekļauj kļūdaino galvenes failu

void setup_cart(struct ShoppingCart *cart, int user_id) {
    cart->item_count = 1;
    cart->total_value = 99.99;
    // cart->owner.user_id = user_id; // Tiek izmantots pēc salabošanas
}

int main() {
    /*
     KĻŪDA: Kompilators izmetīs kļūdu: "field 'cart' has incomplete type"
     vai "field 'owner' has incomplete type", neļaujot kodam pat nokompilēties.
    */

    printf("Scenārijs 3 darbojas veiksmīgi.\n");
    return 0;
}