#ifndef ECOMMERCE_H
#define ECOMMERCE_H

// KĻŪDA: Cikliskā atkarība, jo abas struktūras pieprasa pilnu atmiņas izmēru viena no otras.
struct UserProfile {
    int user_id;
    struct ShoppingCart cart;
};

struct ShoppingCart {
    int item_count;
    float total_value;
    struct UserProfile owner;
};

#endif