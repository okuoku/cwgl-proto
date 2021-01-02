/*
const UNITY_JS = "app2/gltest2.framework.js";
const UNITY_WASM = "app2/gltest2.wasm";
const UNITY_DATA = "app2/gltest2.data";
*/

const UNITY_JS = "app4/webgl.framework.js";
const UNITY_WASM = "app4/webgl.wasm";
const UNITY_DATA = "app4/webgl.data";
const APPFS_DIR = "app4/appfs";

const process = require("process");
const fs = require("fs");
const GL = require("./webgl-cwgl.js");
const audioctx_mini = require("./audioctx-mini.js");
const performance = require('perf_hooks').performance;
const storage = require("./storage.js")

const nav = {};
const doc = {};
const wnd = {};

wnd.document = doc;
wnd.navigator = nav;
wnd.AudioContext = audioctx_mini;

function sleep(ms){
    return new Promise((res) => setTimeout(res, ms));
}

let g_ctx = null;

let totalframe = 0;
let heapdump_to_go = -1;
let heapdump_next = -1;

// Event dispatcher
function handleevents(){
    const evtbuf = g_ctx.yfrm_evtbuf;
    while(true){
        let term = g_ctx.yfrm_fill_events();
        if(term <= 0){
            return;
        }
        process_events(evtbuf, term);
    }
}

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
                    let bin = fs.readFileSync(UNITY_WASM);
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
const evttarget0 = {}; /* Window */
const evttarget1 = {}; /* Document */
const evttarget2 = {}; /* Canvas */
const evttargets = [evttarget0, evttarget1, evttarget2];

function decode_button(btn){
    /* Priority encode */
    if(btn & 1){
        return 0;
    }
    if(btn & 4){
        return 2;
    }
    if(btn & 2){
        return 1;
    }
    if(btn & 8){
        return 3;
    }
    if(btn & 16){
        return 4;
    }
    return 0;
}

function send_Mouseevent(name, buf, offs){
    const x = buf[offs+2];
    const y = buf[offs+3];
    const button = buf[offs+4];
    const buttons = buf[offs+5];

    const evt = {
        screenX: x,
        screenY: y,
        clientX: x,
        clientY: y,
        ctrlKey: false, /* FIXME */
        shiftKey: false, /* FIXME */
        altKey: false, /* FIXME */
        metaKey: false, /* FIXME */
        button: decode_button(button),
        buttons: buttons

    };
    dispatch_event(name, evt);
}

function send_MouseDown(buf, offs){
    send_Mouseevent("mousedown", buf, offs);
}

function send_MouseUp(buf, offs){
    send_Mouseevent("mouseup", buf, offs);
}

function send_MouseScroll(buf, offs){
    const dx = buf[offs+2];
    const dy = buf[offs+3];
    /* FIXME: Implement */
}

function send_MouseMove(buf, offs){
    const x = buf[offs+2];
    const y = buf[offs+3];
    const buttons = buf[offs+6];
    let evt = {
        screenX: x,
        screenY: y,
        clientX: x,
        clientY: y,
        ctrlKey: false, /* FIXME */
        shiftKey: false, /* FIXME */
        altKey: false, /* FIXME */
        metaKey: false, /* FIXME */
        buttons: buttons,
    };
    dispatch_event("mousemove", evt);
}

// Gamecontroller state
let buttons = new Array(17);
let axis = new Array(6);

function set_buttonstate(evtbuf, offs){
    const type = evtbuf[offs+1];
    const button = evtbuf[offs+3];
    if(button >= 0){
        buttons[button] = type == 101 ? true : false;
    }
}

function set_axisstate(evtbuf, offs){
    const axisindex = evtbuf[offs+3];
    const value = evtbuf[offs+4];
    const frac = evtbuf[offs+5];

    if(axisindex >= 0){
        axis[axisindex] = value / frac;
    }
}

function gen_gamepad(){
    const out = [{
        id: "Player 1",
        index: 0,
        connected: true,
        timestamp: performance.now(),
        mapping: "standard",
        axes: axis,
        buttons: buttons.map(e => {
            return {
                pressed: e ? true : false,
                touched: false,
                value: e ? 1.0 : 0.0
            };
        })
    }];
    return out;
}

function process_events(evtbuf, term){
    let offs = 0;
    while(term > offs){
        let type = evtbuf[offs+1];
        let next = offs + evtbuf[offs];
        //console.log("Evt",offs,type,next);
        switch(type){
            case 0: /* MouseDown:x:y:button:buttons */
                send_MouseDown(evtbuf, offs);
                break;
            case 1: /* MouseUp:x:y:button:buttons */
                send_MouseUp(evtbuf, offs);
                break;
            case 2: /* MouseScroll:dx:dy */
                send_MouseScroll(evtbuf, offs);
                break;
            case 3: /* MouseMove:x:y:dx:dy:buttons */
                send_MouseMove(evtbuf, offs);
                break;
            case 100: /* ControllerButton */
            case 101:
                set_buttonstate(evtbuf, offs);
                break;
            case 102: /* ControllerAxis */
                set_axisstate(evtbuf, offs);
                break;
            default:
                /* Do nothing */
                break;
        }
        offs = next;
    }
}

function dispatch_event(tag, obj){
    obj.preventDefault = function(){};
    obj.type = tag;
    evttargets.forEach(e => {
        if (e[tag]) {
            //console.log("Trig", e[tag], tag, obj);
            e[tag](obj);
        }
    });
}

function fake_aEL(depth, name){
    return function(typ, listener, usecapture){
        // FIXME: implement usecapture
        console.log("Add Event Listener", depth, name, typ, listener, usecapture);
        evttargets[depth][typ] = listener;
    }
}

function fake_rEL(depth, name){
    return function(typ){
        console.log("Remove Event Listener", depth, name, typ);
        evttargets[depth][typ] = false;
    }
}

const my_canvas = {
    clientWidth: 1280,
    clientHeight: 720,
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
    addEventListener: fake_aEL(2, "CANVAS"),
    removeEventListener: fake_rEL(2, "CANVAS"),
    getContext: function(type,attr){
        console.log("Draw context", type, attr);
        if(type == "webgl"){
            g_ctx = GL(1280,720,attr);
            g_ctx.canvas = this;
            g_ctx.cwgl_frame_begin();
            handleevents();
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
    clearInterval: clearInterval,
    companyName: "DefaultCompany",
    productName: "WebGLUTSTest",
    productVersion: "0.1",

};

const my_screen = {
    width: 1280,
    height: 720
};


wnd.navigator.getGamepads = function(){
    return gen_gamepad();
}

wnd.requestAnimationFrame = function(cb){
    //console.log("rAF");
    setImmediate(function(){
        checkheapdump();
        g_ctx.cwgl_frame_end();
        const now = performance.now();
        //console.log("RAF", now);
        g_ctx.cwgl_frame_begin();
        handleevents();
        cb(now);
    });
    return 99.99;
}

function checkheapdump(){
    totalframe++;
    /*
    if(totalframe == heapdump_to_go){
        Heapdump.writeSnapshot("heap1.heapsnapshot");
    }else if(totalframe == heapdump_next){
        Heapdump.writeSnapshot("heap2.heapsnapshot");
    }else if(totalframe < heapdump_to_go){
        console.log("Heap dump countdown(1):", heapdump_to_go - totalframe);
    }else if(totalframe < heapdump_next){
        console.log("Heap dump countdown(2):", heapdump_next - totalframe);
    }
    */
}

function fake_settimeout(cb, ms){
    console.log("sTO", cb, ms);
    process.nextTick(async function(){
        checkheapdump();
        g_ctx.cwgl_frame_end();
        await sleep(ms);
        const now = performance.now();
        console.log("FRAME", now);
        g_ctx.cwgl_frame_begin();
        handleevents();
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
wnd.document.addEventListener = fake_aEL(1, "Document"); // specialHTMLTargets[1]
wnd.addEventListener = fake_aEL(0, "Window"); // specialHTMLTargets[2]
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
global.AudioContext = wnd.AudioContext;

/*
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
*/

function boot(){ // Unity
    const bootstrap = fs.readFileSync(UNITY_JS, "utf8");

    function GetFS(){
        const FS = my_module.peekFS();
        const APPFS = storage.genfs(FS, APPFS_DIR);
        // Remove current root
        FS.root = false;
        FS.mount(APPFS, {}, "/");
        console.log(FS);
        FS.mount(FS.filesystems.MEMFS, {}, "/idbfs");
    }

    global.my_module.preRun.push(GetFS);

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

    const preamble = "function unityFramework(Module){function peekFS(){return FS;} Module.peekFS = peekFS; //"

    eval(preamble + bootstrap + "\n\n global.initfunc = unityFramework;");

    let init = global.initfunc;
    my_module.noFSInit = true;
    my_module.unityFileSystemInit = function(){}; // FIXME: Handle idbfs
    init(global.my_module);
}

boot();

