#include <stdio.h>
#include <string.h>

void sanitize_text(char *document_text) {
    if (document_text == NULL) return;

    for (int i = 0; document_text[i] != '\0'; i++) {
        if (document_text[i] == 'a') {
            document_text[i] = '*';
        }
    }
}

int main() {
    char *risky_text = "Bistams teksts ar a burtiem";

    printf("Attiram tekstu...\n");
    sanitize_text(risky_text);

    printf("Attirits: %s\n", risky_text);
    printf("Scenārijs 5 darbojas veiksmīgi.\n");
    return 0;
}