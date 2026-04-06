#ifndef ECOMMERCE_H
#define ECOMMERCE_H

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