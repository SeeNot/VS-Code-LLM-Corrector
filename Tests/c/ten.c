#include <stdio.h>
#include <assert.h>

void compute_moving_average(float *data, int data_length, int window, float *output) {
    if (window <= 0 || data_length == 0) return;

    int i = 0;
    while (i < data_length) {
        float sum = 0;
        for (int j = 0; j < window; j++) {
            sum += data[i + j];
        }
        output[i] = sum / window;
        i++;
    }
}

int main() {
    float signal[] = {10.0, 20.0, 30.0, 40.0};
    int len = 4;
    float result[4] = {0};

    compute_moving_average(signal, len, 2, result);

    assert(result[0] == 15.0 && "Nepareizs aprekins.");
    printf("Scenārijs 10 darbojas veiksmīgi.\n");
    return 0;
}