#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int processor_id;
    int *multipliers;
    int count;
} DataPipeline;

int* get_default_multipliers() {
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

    printf("Inicializējam datus...\n");

    if (pipe.multipliers[0] != 2) {
        printf("Kļūda: Pirmā reizinātāja vērtība ir %d, nevis 2!\n", pipe.multipliers[0]);
        return 1;
    }

    printf("Scenārijs 2 darbojas veiksmīgi.\n");
    return 0;
}