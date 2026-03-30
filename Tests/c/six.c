#include <stdio.h>
#include <string.h>
#include <assert.h>

typedef struct {
    int id;
    char role[20];
} DatabaseRecord;

int check_admin_access(DatabaseRecord *record) {
    // Simulējam lomas iegūšanu no citas sistēmas daļas
    char required_role[20];
    strcpy(required_role, "ADMIN");

    // KĻŪDA: Tiek salīdzinātas rādītāju adreses, nevis virkņu saturs.
    // Šis nosacījums vienmēr būs nepatiess (false).
    if (record->role == required_role) {
        return 1;
    }
    return 0;
}

int main() {
    DatabaseRecord my_user = {1005, "ADMIN"};

    int has_access = check_admin_access(&my_user);

    assert(has_access == 1 && "Kļūda: Pieeja atteikta, kaut gan lomai jābūt ADMIN!");
    printf("Scenārijs 6 darbojas veiksmīgi.\n");
    return 0;
}