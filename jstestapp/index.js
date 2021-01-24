
/*
const BOOTPROTOCOL = "unity";
const BOOTSTRAP = "app3/webgl.framework.js";
const BOOTWASM = "app3/webgl.wasm";
const APPFS_DIR = "app3/appfs";
const DLLFILE = "../apps/out/appdll_app3.dll";
*/

/*
const BOOTPROTOCOL = "unity";
const BOOTSTRAP = "app4/webgl.framework.js";
const BOOTWASM = "app4/webgl.wasm";
const APPFS_DIR = "app4/appfs";
const DLLFILE = "../apps/out/appdll_app4.dll";
*/

const BOOTPROTOCOL = "plain";
const BOOTSTRAP = "app/example_emscripten_opengl3.js";
const BOOTWASM = "app/example_emscripten_opengl3.wasm";
const BOOTARGS = [];
const APPFS_DIR = false;
const DLLFILE = "../apps/out/appdll_app.dll";

/*
const BOOTPROTOCOL = "unity";
const BOOTSTRAP = "app2/gltest2.framework.js";
const BOOTWASM = "app2/gltest2.wasm";
const APPFS_DIR = "app2/appfs";
const DLLFILE = "../apps/out/appdll_app2.dll";
*/

/*
const BOOTPROTOCOL = "godot";
const BOOTSTRAP = "app5/pp.webgl.js";
const BOOTWASM = "app5/webgl.wasm";
const GODOT_ARGS = ["--main-pack","webgl.pck"]; // target path
const APPFS_DIR = "app5/appfs";
const DLLFILE = "../apps/out/appdll_app5.dll";
*/

/*
const BOOTPROTOCOL = "plain";
const BOOTSTRAP = "app6/pp.dosbox-x.js";
const BOOTWASM = "app6/dosbox-x.wasm";
const BOOTARGS = ["-conf", "/appfs/conf"];
const APPFS_DIR = "app6/appfs";
const DLLFILE = "../apps/out/appdll_app6.dll";
*/

const process = require("process");
const fs = require("fs");
const Crypto = require("crypto");
const GL = require("./webgl-cwgl.js");
const audioctx_mini = require("./audioctx-mini.js");
const performance = require('perf_hooks').performance;
const storage = require("./storage.js");
const EmuCanvas = require("./emucanvas.js");
const WebAssembly = require("./wasmproxy.js")(DLLFILE);

const orig_setInterval = global.setInterval;

function setInterval(cb, timeout){
    orig_setInterval(cb, timeout);
    return -1;
}

const nav = {};
const doc = {};
const wnd = {};

wnd.document = doc;
wnd.navigator = nav;
const acinit = {
    setAudioTick: function(proc){
        audio_tick_handler = proc;
    },
    audioEnqueue: function(ch0, ch1){
        if(g_ctx){
            g_ctx.yfrm_audio_enqueue0(ch0, ch1, ch0.length);
        }
    },
    audioPause: function(){
        if(g_ctx){
            g_ctx.yfrm_audio_pause0();
        }
    }
};
wnd.AudioContext = audioctx_mini(acinit);

let audio_tick_handler = false;

function audiotick(){
    if(audio_tick_handler){
        audio_tick_handler();
    }
}

function fake_gRV(buffer){
    Crypto.randomFillSync(buffer);
    return buffer;
}

const crypto = {};
crypto.getRandomValues = fake_gRV;

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
    audiotick();
    while(true){
        let term = g_ctx.yfrm_fill_events();
        if(term <= 0){
            return;
        }
        process_events(evtbuf, term);
    }
}

// Bootstrap resources
function bootstrap_script(){
    return fs.readFileSync(BOOTSTRAP, "utf8");
}
function bootstrap_wasm(){
    return fs.readFileSync(BOOTWASM);
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

function send_Keyevent(name, buf, offs){
    const keycode = buf[offs+2];
    const flags = buf[offs+3];
    const keyname = buf[offs+4];
    //console.log(name, String.fromCharCode([keyname]));
    const evt = {
        key: String.fromCharCode([keyname]),
        keyCode: keycode,
        which: keycode,
        altKey: flags & 8 ? true : false,
        ctrlKey: flags & 4 ? true : false,
        shiftKey: flags & 2 ? true : false,
        metaKey: flags & 16 ? true : false,
        repeat: flags & 1 ? true : false,
    };
    dispatch_event(name, evt);
}

function send_KeyDown(buf, offs){
    send_Keyevent("keydown", buf, offs);
}

function send_KeyUp(buf,offs){
    send_Keyevent("keyup", buf, offs);
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
            case 200:
                send_KeyDown(evtbuf, offs);
                break;
            case 201:
                send_KeyUp(evtbuf, offs);
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
    width: 1280,
    height: 720,
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
    focus: function(){},
    addEventListener: fake_aEL(2, "CANVAS"),
    removeEventListener: fake_rEL(2, "CANVAS"),
    getContext: function(type,attr){
        console.log("Draw context", type, attr);
        if(type == "webgl"){
            g_ctx = GL(1280,720,attr);
            g_ctx.canvas = this;
            g_ctx.cwgl_frame_begin();
            g_ctx.__framebuffer_mode = false;
            handleevents();
            return g_ctx;
        }else if(type == "2d"){
            // Framebuffer canvas context
            g_ctx = GL(1280,720,attr);
            g_ctx.canvas = this;
            g_ctx.cwgl_frame_begin();
            g_ctx.__framebuffer_mode = true;
            handleevents();

            return EmuCanvas(g_ctx, true);
        }
        return null;
    },
    requestFullscreen: function(){
        console.log("Ignored requestFullscreen");
    },
    id: "canvas"
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
        const now = performance.now();
        if(g_ctx){
            checkheapdump();
            checkframebuffer();
            g_ctx.cwgl_frame_end();
            //console.log("RAF", now);
            g_ctx.cwgl_frame_begin();
            handleevents();
        }
        cb(now);
    });
    return 99.99;
}

function checkframebuffer(){
    if(g_ctx.__framebuffer_mode){
        g_ctx.__drawframebuffer();
    }
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

function fake_settimeout(cb, ms, bogus){
    //console.log("sTO", cb, ms);
    if(bogus){
        console.log("huh?", arguments);
        throw "unknown";
    }
    setTimeout(function(){
        if(g_ctx){
            checkheapdump();
            checkframebuffer();
            g_ctx.cwgl_frame_end();
            const now = performance.now();
            //console.log("FRAME", now);
            g_ctx.cwgl_frame_begin();
            handleevents();
        }
        cb();
    }, ms);
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

function fake_gEBI(tgt){
    console.log("Fake getElementById", tgt);
    return null;
}

function fake_cEl(typ){
    console.log("Fake cEL", typ);
    return {};
}

wnd.document.querySelector = fake_queryselector;
wnd.document.addEventListener = fake_aEL(1, "Document"); // specialHTMLTargets[1]
wnd.document.getElementById = fake_gEBI;
wnd.document.createElement = fake_cEl;
wnd.addEventListener = fake_aEL(0, "Window"); // specialHTMLTargets[2]
//wnd.removeEventListener = fake_rEL(0, "Window");
wnd.navigator.userAgent = "bogus";
wnd.navigator.appVersion = "bogus";

wnd.document.URL = "";

// Boot
global.my_window = wnd;
global.my_doc = wnd.document;
global.my_module = my_module;
global.my_screen = my_screen;
global.fake_settimeout = fake_settimeout;
global.AudioContext = wnd.AudioContext;

function boot_plain(){ // Emscripten plain
    const bootstrap = bootstrap_script();
    let window = global.my_window;
    let navigator = window.navigator;
    let document = global.my_doc;
    var Module = global.my_module;
    let screen = global.my_screen;
    let setTimeout = global.fake_settimeout;
    let AudioContext = window.AudioContext;
    my_module.wasmBinary = bootstrap_wasm();
    if(BOOTARGS){
        my_module.arguments = BOOTARGS;
    }
    function mountFS(){
        if(APPFS_DIR){
            const APPFS = storage.genfs(FS, APPFS_DIR);
            FS.mkdir("/appfs");
            FS.mount(APPFS, {}, "/appfs");
        }
    }
    global.my_module.preRun.push(mountFS);
    eval(bootstrap);
}

function boot_unity(){ // Unity
    const bootstrap = bootstrap_script();

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
    let document = global.my_doc;
    var Module = global.my_module;
    let screen = global.my_screen;
    let setTimeout = global.fake_settimeout;
    let alert = fake_alert;
    let AudioContext = window.AudioContext;

    const preamble = "function unityFramework(Module){function peekFS(){return FS;} Module.peekFS = peekFS; //"

    eval(preamble + bootstrap + "\n\n global.initfunc = unityFramework;");

    let init = global.initfunc;
    my_module.noFSInit = true;
    my_module.unityFileSystemInit = function(){}; // FIXME: Handle idbfs
    my_module.wasmBinary = bootstrap_wasm();
    init(global.my_module);
}

async function boot_godot(){ // Godot
    const bootstrap = bootstrap_script();
    // Fake rAF on Global ("real" rAF is at window.)

    function fake_alert(obj){
        console.log("ALERT", obj);
    }

    let window = global.my_window;
    let navigator = window.navigator;
    let document = global.my_doc;
    let screen = global.my_screen;
    let setTimeout = global.fake_settimeout;
    let alert = fake_alert;
    window.alert = fake_alert;
    let requestAnimationFrame = window.requestAnimationFrame;
    let AudioContext = window.AudioContext;

    eval(bootstrap + "\n\n global.the_godot = Godot;");

    let my_Godot = global.the_godot;

    /* Filler for favicon override... */
    const Blob = function(){return {};}
    URL.createObjectURL = function(){
        console.log("Ignored createObjectURL...");
    };
    document.head = {};
    document.head.appendChild = function(){};
    /* Emulate engine.init() */
    const godotconfig = {};
    godotconfig.wasmBinary = bootstrap_wasm();
    godotconfig.canvas = my_canvas;
    my_Godot(godotconfig).then(godot_module => {
        const FS = godot_module.FS;
        console.log(godot_module);
        const APPFS = storage.genfs(FS, APPFS_DIR);
        /* Instantiate filesystem */
        //godot_module.FS.mkdir("/appfs");
        //godot_module.FS.mount(APPFS, {}, "/appfs");
        FS.root = false;
        FS.mount(APPFS, {}, "/");
        FS.mount(FS.filesystems.MEMFS, {}, "/userfs");
        /* Lock filesystem */
        FS.mkdir = function(nod){console.log("Ignored mkdir",nod);};
        FS.mount = function(fs,opt,nod){console.log("Ignored mount",fs,opt,nod);};
        /* Emulate engine.start() */
        godotconfig.locale = "en";
        godotconfig.callMain(GODOT_ARGS);
    });
}

function boot(){
    switch(BOOTPROTOCOL){
        case "unity":
            boot_unity();
            break;
        case "plain":
            boot_plain();
            break;
        case "godot":
            boot_godot();
            break;
        default:
            throw "unknown boot protocol";
    }
}

boot();
