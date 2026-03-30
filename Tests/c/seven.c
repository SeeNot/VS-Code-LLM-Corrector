#include <stdio.h>
#include <assert.h>

typedef struct {
    int *data;
    int size;
    int current_index;
} DataStream;

int get_next(DataStream *stream, int *out_value) {
    if (stream->current_index >= stream->size) {
        return 0; // Straume ir izsmelta
    }
    *out_value = stream->data[stream->current_index++];
    return 1;
}

void analyze_stream(DataStream *stream) {
    int val;
    int sum = 0;

    // Pirmais caurgājiens: aprēķina summu
    while (get_next(stream, &val)) {
        sum += val;
    }

    // KĻŪDA: 'current_index' nav atiestatīts uz 0.
    // Otrais caurgājiens nestrādās, un 'count' būs 0.
    int count = 0;
    while (get_next(stream, &val)) {
        count++;
    }

    if (count == 0) {
        printf("Kļūda: Dalīšana ar nulli!\n");
        return;
    }

    printf("Videjais: %d\n", sum / count);
}

int main() {
    int raw_data[] = {10, 20, 30};
    DataStream stream = {raw_data, 3, 0};

    analyze_stream(&stream); // Izraisīs dalīšanu ar nulli vai kļūdas paziņojumu

    // Mēs gribam tikt garām bez kļūdām
    printf("Scenārijs 7 darbojas veiksmīgi.\n");
    return 0;
}