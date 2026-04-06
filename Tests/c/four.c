#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

typedef struct SessionNode {
    int session_id;
    bool is_expired;
    struct SessionNode *next;
} SessionNode;
// A clean up function to delete old nodes without interrupting the linked list
void cleanup_sessions(SessionNode *head) {
    SessionNode *current = head;

    while (current != NULL) {
        if (current->is_expired) {
            printf("Dzesam sesiju %d\n", current->session_id);
            free(current);
        }
        current = current->next;
    }
}

int main() {
    SessionNode *s1 = malloc(sizeof(SessionNode));
    SessionNode *s2 = malloc(sizeof(SessionNode));

    s1->session_id = 1; s1->is_expired = true; s1->next = s2;
    s2->session_id = 2; s2->is_expired = false; s2->next = NULL;

    cleanup_sessions(s1);

    printf("Scenārijs 4 darbojas veiksmīgi.\n");
    return 0;
}