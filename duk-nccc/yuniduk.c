/* Main */

#include <stdio.h>
#include "duktape.h"

#include "duk_print_alert.h"

#define BOOTSTRAP_FILE (SCRIPTROOT "/bootstrap.js")

void dukregisternccc(duk_context* ctx);

void
dukdebugwrite(long level, const char* file, long line, const char* func, const char* msg){
    fprintf(stderr, "D%ld %s:%d (%s): %s\n", level, file, line, func, msg);
}

static void
dukload(duk_context* ctx, const char* filename, int flags){
    long siz;
    FILE* fp;
    char* buf;
    fp = fopen(filename, "r");
    fseek(fp,0,SEEK_END);
    siz = ftell(fp);
    fseek(fp,0,SEEK_SET);
    buf = malloc(siz+1);
    fread(buf,1,siz,fp);
    buf[siz] = 0;

    duk_push_string(ctx, filename);
    duk_compile_string_filename(ctx, flags, buf);
    free(buf);
    duk_call(ctx, 0);
    duk_pop(ctx);
}

int main(int argc, char *argv[]) {
    duk_context *ctx = duk_create_heap_default();
    duk_print_alert_init(ctx, 0);
    dukregisternccc(ctx);
    duk_eval_string(ctx, "print(JSON.stringify(NCCC));");
    duk_eval_string(ctx, "print(NCCC.corelib.util_rawcall);");
    dukload(ctx, BOOTSTRAP_FILE, DUK_COMPILE_EVAL);
    duk_destroy_heap(ctx);
    return 0;
}
