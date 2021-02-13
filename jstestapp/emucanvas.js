// Minimal canvas emulator to implement Emscripten SDL for DOSbox

function context(GL, is_framebuffer){
    console.log("Fake Canvas context.");
    if(! is_framebuffer){
        throw "UNSUP."
    }else{
        const tex = GL.createTexture();
        const prog = GL.createProgram();
        const psh = GL.createShader(GL.FRAGMENT_SHADER);
        const vsh = GL.createShader(GL.VERTEX_SHADER);
        const vtx = GL.createBuffer();
        const idx = GL.createBuffer();

        // Vertex array
        //  p0 = (-1,-1)   p2    p3
        //  p1 = (1,-1)   
        //  p2 = (-1,1)   p0    p1
        //  p3 = (1,1)
        //
        // Index: 0,1,2,2,1,3
        const points = new Float32Array([-1,-1,1,-1,-1,1,1,1]);
        const indices = new Int16Array([0,1,2,2,1,3]);


        const prog_v =
            "attribute vec2 pos;\n" +
            "varying highp vec2 cd;\n" +
            "uniform vec4 loc;\n" + /* loc = (offsx,offsy,magx,magy) */
            "void main(void){\n" +
            "  cd = vec2((pos.x + 1.0)/2.0,(1.0 - pos.y)/2.0);\n" +
            "  gl_Position = vec4(loc.x + pos.x * loc.z, loc.y + pos.y * loc.w, 0.0, 1.0);\n" +
            "}";

        const prog_p = 
            "uniform sampler2D tex;\n" +
            "varying highp vec2 cd;\n" +
            "void main(void){\n" +
            "  gl_FragColor = texture2D(tex, cd);\n" +
            "}";

        // Compile shaders
        GL.shaderSource(vsh, prog_v);
        GL.compileShader(vsh);
        if(! GL.getShaderParameter(vsh, GL.COMPILE_STATUS)){
            console.log("VSH COMPERR", GL.getShaderInfoLog(vsh));
        }
        GL.shaderSource(psh, prog_p);
        GL.compileShader(psh);
        if(! GL.getShaderParameter(psh, GL.COMPILE_STATUS)){
            console.log("PSH COMPERR", GL.getShaderInfoLog(psh));
        }
        GL.attachShader(prog, vsh);
        GL.attachShader(prog, psh);
        GL.linkProgram(prog);

        const loc = new Float32Array(4);
        const uloc = GL.getUniformLocation(prog, "loc");
        const utex = GL.getUniformLocation(prog, "tex");
        const apos = GL.getAttribLocation(prog, "pos");

        // Buffer data
        GL.bindBuffer(GL.ARRAY_BUFFER, vtx);
        GL.bufferData(GL.ARRAY_BUFFER, points, GL.STATIC_DRAW);
        GL.bindBuffer(GL.ARRAY_BUFFER, idx);
        GL.bufferData(GL.ARRAY_BUFFER, indices, GL.STATIC_DRAW);
        GL.bindBuffer(GL.ARRAY_BUFFER, null);

        GL.__framebuffer_mode = true;
        GL.__currentimage = false;
        GL.__drawframebuffer = function(){
            const img = GL.__currentimage;
            if(! img) return;
            // Transfer Y-FLIPed texture
            GL.activeTexture(GL.TEXTURE0);
            GL.bindTexture(GL.TEXTURE_2D, tex);
            // Configure texture
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
            GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 
                          img.width, img.height, 0,
                          GL.RGBA, GL.UNSIGNED_BYTE, img.data);

            // Setup rasterizer
            GL.disable(GL.BLEND);
            GL.disable(GL.CULL_FACE);
            GL.disable(GL.STENCIL_TEST);
            GL.disable(GL.DEPTH_TEST);
            GL.disable(GL.SCISSOR_TEST);
            GL.viewport(0,0,1280,720);

            GL.useProgram(prog);

            // Setup parameters
            GL.uniform1i(utex, 0); // TEXTURE0

            loc[0] = 0;
            loc[1] = 0;
            loc[2] = 1;
            loc[3] = 1;
            GL.uniform4fv(uloc, loc); // loc

            GL.bindBuffer(GL.ARRAY_BUFFER, vtx);
            GL.enableVertexAttribArray(apos);
            GL.vertexAttribPointer(apos, 2, GL.FLOAT, GL.FALSE, 0, 0); // pos

            // Draw
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, idx);
            GL.drawElements(GL.TRIANGLES, 3 * 2, GL.UNSIGNED_SHORT, 0);
            // Unbind objects
            GL.bindTexture(GL.TEXTURE_2D, null);
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
            GL.bindBuffer(GL.ARRAY_BUFFER, null);
        }

        return {
            //fillStyle: null,
            //globalAlpha: 1,
            //globalCompositeOperation: "copy",
            //drawImage: function(){},
            //getImageData: function(){ console.log("GetImage."); },
            createImageData: function(x, y){ 
                console.log("CreateImageData.", x, y);
                return {width: x, height: y, data: new Uint8Array(x * y * 4)}; 
            },
            putImageData: function(img, x /* IGNORE */, y /* IGNORE */){
                GL.__currentimage = img;
            },
            //fillRect: function(){},
            //save: function(){},
            //restore: function(){},
        };
    }
}

export default context;
