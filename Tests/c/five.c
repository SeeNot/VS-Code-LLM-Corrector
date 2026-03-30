#include <stdio.h>
#include <string.h>

void sanitize_text(char *document_text) {
    if (document_text == NULL) return;

    // Vienkāršs aizvietošanas algoritms trokšņa radīšanai
    for (int i = 0; document_text[i] != '\0'; i++) {
        if (document_text[i] == 'a') {
            document_text[i] = '*'; // KĻŪDA: Mēģinājums modificēt atmiņu, kas var būt Read-Only
        }
    }
}

int main() {
    // KĻŪDA: Virknes literālis parasti tiek glabāts Read-Only atmiņā (.rodata)
    char *risky_text = "Bistams teksts ar a burtiem";

    printf("Attiram tekstu...\n");
    sanitize_text(risky_text); // Segmentācijas kļūda (Segfault)

    printf("Attirits: %s\n", risky_text);
    printf("Scenārijs 5 darbojas veiksmīgi.\n");
    return 0;
}