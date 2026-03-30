#include <stdio.h>
#include <assert.h>

typedef struct {
    int id;
    int spoiled;
} Item;

typedef struct {
    Item items[10];
    int count;
} Inventory;

void remove_spoiled(Inventory *inv) {
    for (int i = 0; i < inv->count; i++) {
        if (inv->items[i].spoiled) {
            // Nobīdam visus nākamos elementus pa kreisi
            for (int j = i; j < inv->count - 1; j++) {
                inv->items[j] = inv->items[j + 1];
            }
            inv->count--;

            // KĻŪDA: Trūkst i--, jo esošajā indeksā tagad atrodas JAUNS elements,
            // kas joprojām jāpārbauda nākamajā iterācijā.
        }
    }
}

int main() {
    Inventory inv;
    inv.count = 4;
    inv.items[0] = (Item){1, 1}; // Spoiled
    inv.items[1] = (Item){2, 1}; // Spoiled - ŠIS TIKS IZLAISTS!
    inv.items[2] = (Item){3, 0}; // Fresh
    inv.items[3] = (Item){4, 1}; // Spoiled

    remove_spoiled(&inv);

    // Pārbaudām, vai palika kāds bojāts priekšmets
    int has_spoiled = 0;
    for (int i = 0; i < inv.count; i++) {
        if (inv.items[i].spoiled) has_spoiled = 1;
    }

    assert(has_spoiled == 0 && "Kļūda: Ne visi bojātie priekšmeti tika izdzēsti!");
    printf("Scenārijs 9 darbojas veiksmīgi.\n");
    return 0;
}