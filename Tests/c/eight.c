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
    // KĻŪDA: malloc neattīra atmiņu. 'is_visible' paliek ar atkritumvērtību,
    // atšķirībā no calloc vai manuālas inicializācijas.
    GraphicElement *el = (GraphicElement*)malloc(sizeof(GraphicElement));
    el->id = id;
    el->label = label;
    // 'is_visible' nav iestatīts!
    return el;
}

void render(GraphicElement *el) {
    // C valodā jebkura vērtība, kas nav 0, ir "true".
    // Garbage vērtība var izraisīt zīmēšanu vai tās izlaišanu neprognozējami.
    if (el->is_visible) {
        printf("Zimeju elementu %d: %s\n", el->id, el->label);
    }
}

int main() {
    GraphicElement *btn = create_element(1, "Saglabat");

    // Kļūda: Mēs ekspektējam, ka noklusējumā tas būs inicializēts kā konkrēts stāvoklis
    // (piemēram, false vai true), bet te paļaujamies uz nedefinētu uzvedību.
    render(btn);

    free(btn);
    printf("Scenārijs 8 darbojas veiksmīgi.\n");
    return 0;
}