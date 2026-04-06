#include <stdio.h>
#include <string.h>
#include <assert.h>

typedef struct {
    int id;
    char name[50];
    char *tags;
} CustomerProfile;

void init_customer(CustomerProfile *c, int id, const char *name, const char *initial_tag) {
    static char tag_buffer[256];

    c->id = id;
    strncpy(c->name, name, sizeof(c->name) - 1);

    strcpy(tag_buffer, initial_tag);
    c->tags = tag_buffer;
}

int main() {
    CustomerProfile c1, c2;

    init_customer(&c1, 1, "Janis Berzins", "premium");
    init_customer(&c2, 2, "Anna Lapina", "new_user");

    // Testēšana
    assert(strcmp(c1.tags, "premium") == 0 && "Kļūda: c1 tagi tika pārrakstīti!");
    printf("Scenārijs 1 darbojas veiksmīgi.\n");
    return 0;
}