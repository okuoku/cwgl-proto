
const process = require("process");
const fs = require("fs");
const GL = require("./webgl-cwgl.js");
const indexedDB = require("fake-indexeddb");
const performance = require('perf_hooks').performance;

const nav = {};
const doc = {};
const wnd = {};

wnd.document = doc;
wnd.navigator = nav;

function sleep(ms){
    return new Promise((res) => setTimeout(res, ms));
}

let g_ctx = null;
const pixels0 = new Uint8Array(1920 * 1080 * 4);
const pixels1 = new Uint8Array(1920 * 1080 * 4);
let flip_fb = 0;
let shots = 0;


// FakeFetch

function fake_fetch(path, opts) {
    console.log("Fake fetch", path, opts);
    if(path == "example_emscripten_opengl3.wasm"){
        return new Promise(ret => {
            ret({
                ok: true,
                arrayBuffer: function(){
                    let bin = fs.readFileSync("app/example_emscripten_opengl3.wasm");
                    console.log(bin);
                    return new Promise(res => {
                        res(bin);
                    });
                }
            });
        });
    }else if(path == "build.wasm"){
        // Remap for Unity
        return new Promise(ret => {
            ret({
                ok: true,
                arrayBuffer: function(){
                    let bin = fs.readFileSync("app2/gltest2.wasm");
                    console.log(bin);
                    return new Promise(res => {
                        res(bin);
                    });
                }
            });
        });
    }else{
        return null;
    }
}

// Emscripten patches

function fake_aEL(typ, lis, usecapture){
    console.log("Add Event Listender", typ, lis, usecapture);
}

function fake_rEL(typ){
    console.log("Remove Event Listender", typ);
}

const my_canvas = {
    style: {
        cursor: "bogus"
    },
    getBoundingClientRect: function(){
        return {
            top: 0,
            bottom: 720,
            left: 0,
            right: 1280,
            x: 0,
            y: 0,
            width: 1280,
            height: 720
        };
    },
    addEventListener: fake_aEL,
    removeEventListener: fake_rEL,
    getContext: function(type,attr){
        console.log("Draw context", type, attr);
        if(type == "webgl"){
            g_ctx = GL(1280,720,attr);
            g_ctx.canvas = this;
            g_ctx.cwgl_frame_begin();
            return g_ctx;
        }
        return null;
    }

};

const my_module = {
    locateFile: function (path, scriptDirectory) {
        return path;
    },
    canvas: my_canvas,
    // For Unity
    preRun: [],
    postRun: [],
    SystemInfo: {
        hasWebGL: true,
        gpu: "Dummy GPU"
    },
    webglContextAttributes: {
        premultipliedAlpha: false,
        preserveDrawingBuffer: false
    },
    setInterval: setInterval,
    // app2 application (Unity)
    dataUrl: "Build/gltest2.data",
    frameworkUrl: "Build/gltest2.framework.js",
    codeUrl: "Build/gltest2.wasm",
    streamingAssetsUrl: "StreamingAssets",
    companyName: "DefaultCompany",
    productName: "WebGLUTSTest",
    productVersion: "0.1",

};

const my_screen = {
    width: 1280,
    height: 720
};


wnd.navigator.getGamepads = function(){
    console.log("GetGamepads");
    return [];
}

wnd.requestAnimationFrame = function(cb){
    console.log("rAF");
    process.nextTick(async function(){
        g_ctx.cwgl_frame_end();
        const now = performance.now();
        console.log("RAF", now);
        g_ctx.cwgl_frame_begin();
        cb(now);
    });
    return 99.99;
}

wnd.indexedDB = indexedDB;

function fake_settimeout(cb, ms){
    console.log("sTO", cb, ms);
    process.nextTick(async function(){
        g_ctx.cwgl_frame_end();
        await sleep(ms);
        const now = performance.now();
        console.log("FRAME", now);
        g_ctx.cwgl_frame_begin();
        cb();
    });
}


// FakeDom

function fake_queryselector(tgt){
    console.log("querySelector", tgt);
    if(tgt == "#canvas"){
        return my_canvas;
    }else{
        return null;
    }
}

wnd.document.querySelector = fake_queryselector;
wnd.document.addEventListener = fake_aEL; // specialHTMLTargets[1]
wnd.addEventListener = fake_aEL; // specialHTMLTargets[2]
wnd.navigator.userAgent = "bogus";
wnd.navigator.appVersion = "bogus";

wnd.document.URL = "";

// Boot
global.my_window = wnd;
global.my_fetch = fake_fetch;
global.my_doc = wnd.document;
global.my_module = my_module;
global.my_screen = my_screen;
global.fake_settimeout = fake_settimeout;

function boot(){ // Emscripten plain
    const bootstrap = fs.readFileSync("app/example_emscripten_opengl3.js", "utf8");
    let window = global.my_window;
    let navigator = window.navigator;
    let fetch = global.my_fetch;
    let document = global.my_doc;
    var Module = global.my_module;
    let screen = global.my_screen;
    let setTimeout = global.fake_settimeout;
    eval(bootstrap);
}

/*
function boot(){ // Unity
    const bootstrap = fs.readFileSync("app2/gltest2.framework.js", "utf8");
    // Unity preload
    function cb_injectdata(data) { // From Unity 2020.1
        let view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        let pos = 0;
        let prefix = "UnityWebData1.0\0";
        pos += prefix.length;
        let headerSize = view.getUint32(pos, true); 
        pos += 4;
        while (pos < headerSize) {
            let offset = view.getUint32(pos, true); 
            pos += 4;
            let size = view.getUint32(pos, true); 
            pos += 4;
            let pathLength = view.getUint32(pos, true); 
            pos += 4;
            let path = String.fromCharCode.apply(null, data.subarray(pos, pos + pathLength)); 
            pos += pathLength;
            for (var folder = 0, folderNext = path.indexOf("/", folder) + 1 ;
                 folderNext > 0; 
                 folder = folderNext, folderNext = path.indexOf("/", folder) + 1){
                console.log("Inject Dir", path);
                Module.FS_createPath(path.substring(0, folder), path.substring(folder, folderNext - 1), true, true);
            }
            console.log("Inject File", path);
            Module.FS_createDataFile(path, null, data.subarray(offset, offset + size), true, true, true);
        }
    }

    function injectdata(){
        let data = fs.readFileSync("app2/gltest2.data");
        cb_injectdata(data);
    }

    global.my_module.preRun.push(injectdata);

    function fake_alert(obj){
        console.log("ALERT", obj);
    }

    let window = global.my_window;
    let navigator = window.navigator;
    let fetch = global.my_fetch;
    let document = global.my_doc;
    var Module = global.my_module;
    let screen = global.my_screen;
    let setTimeout = global.fake_settimeout;
    let alert = fake_alert;
    eval(bootstrap + "\n\n global.initfunc = unityFramework;");

    let init = global.initfunc;
    init(global.my_module);
}
*/

boot();

