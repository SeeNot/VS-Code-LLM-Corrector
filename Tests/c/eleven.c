#include <stdio.h>

float calculate_total(float price, float tax_rate) {
    float total = price + (price * tax_rate)
    return total;
}

int main() {
    printf("Total: %.2f\n", calculate_total(100.0, 0.21));
    return 0;
}