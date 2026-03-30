#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int processor_id;
    int *multipliers;
    int count;
} DataPipeline;

int* get_default_multipliers() {
    // KĻŪDA: Masīvs ir alocēts stekā. Atgriežot norādi uz to,
    // rodas "Dangling pointer" (karājošā norāde).
    int default_arr[] = {2, 3, 4};
    return default_arr;
}

void init_pipeline(DataPipeline *pipeline) {
    pipeline->processor_id = 101;
    pipeline->count = 3;
    pipeline->multipliers = get_default_multipliers();
}

int main() {
    DataPipeline pipe;
    init_pipeline(&pipe);

    // Mākslīgi izsaucam citu funkciju, lai pārrakstītu steka atmiņu
    printf("Inicializējam datus...\n");

    // KĻŪDA: Šeit visticamāk tiks izdrukāti atkritumdati (garbage values)
    if (pipe.multipliers[0] != 2) {
        printf("Kļūda: Pirmā reizinātāja vērtība ir %d, nevis 2!\n", pipe.multipliers[0]);
        return 1;
    }

    printf("Scenārijs 2 darbojas veiksmīgi.\n");
    return 0;
}