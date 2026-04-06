#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <assert.h>

typedef struct {
    int id;
    bool is_visible;
    char *label;
} GraphicElement;

GraphicElement* create_element(int id, char *label) {
    GraphicElement *el = (GraphicElement*)malloc(sizeof(GraphicElement));
    el->id = id;
    el->label = label;
    return el;
}

void render(GraphicElement *el) {
    if (el->is_visible) {
        printf("Zimeju elementu %d: %s\n", el->id, el->label);
    }
}

int main() {
    GraphicElement *btn = create_element(1, "Saglabat");

    render(btn);

    free(btn);
    printf("Scenārijs 8 darbojas veiksmīgi.\n");
    return 0;
}