#include "cwgl.h"
#include "yfrm.h"

#include "imgui.h"

bool ImGui_ImplCwgl_Init(cwgl_ctx_t* ctx);
void ImGui_ImplCwgl_RenderDrawData(ImDrawData* draw_data);

int
main(int ac, char** av){
    int w,h;
    int buf[128];
    cwgl_ctx_t* ctx;
    yfrm_init();

    w = 1280;
    h = 720;
    ctx = yfrm_cwgl_ctx_create(w,h,0,0);
    ImGui::CreateContext();
    ImGuiIO& io = ImGui::GetIO(); 



    ImGui::StyleColorsDark();
    ImGui_ImplCwgl_Init(ctx);

    /* Loop */
    bool showdemo = true;
    int frame;
    frame = 0;
    for(;;){
        yfrm_frame_begin0(ctx);

        /* Clear */
        cwgl_viewport(ctx, 0, 0, w, h);
        cwgl_clearColor(ctx, 0, 0, 0, 1.0f);
        cwgl_clear(ctx, 0x4000 /* COLOR BUFFER BIT */);

        /* Draw something */
        // FIXME: Should go to backend
        io.DisplaySize = ImVec2((float)w, (float)h);
        io.DisplayFramebufferScale = ImVec2(1.0f, 1.0f);

        io.DeltaTime = 1.0f/60.0f; /* 60Hz */

        ImGui::NewFrame();
        ImGui::ShowDemoWindow(&showdemo);
        ImGui::Render();
        ImGui_ImplCwgl_RenderDrawData(ImGui::GetDrawData());

        while(yfrm_query0(0, buf, 128) > 0){}
        yfrm_frame_end0(ctx);
        frame ++;
    }

    return 0;
}
