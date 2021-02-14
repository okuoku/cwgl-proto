/* Main */

#include <stdio.h>
#include "duktape.h"

int main(int argc, char *argv[]) {
    duk_context *ctx = duk_create_heap_default();
    duk_destroy_heap(ctx);
    return 0;
}
