import PortStd from "./port-std.js";

function dummybuffer(){
    return {};
}

function wrappromise(promise, success, fail){
    if(! success){
        return promise;
    }else{
        promise.then(success).catch(fail);
    }
}

function newbuffer(ch, size){
    const buffers = [new Float32Array(size), new Float32Array(size)];
    return {
        length: size,
        numberOfChannels: ch,
        getChannelData: function(c){
            return buffers[c];
        }
    };
}

let g_setAudioTick = false;
let g_audioEnqueue = false;
let g_audioPause = false;

function register(obj){
    g_setAudioTick = obj.setAudioTick;
    g_audioEnqueue = obj.audioEnqueue;
    g_audioPause = obj.audioPause;
    return audioctx_mini;
}

function audioctx_mini(){
    console.log("CREATING AUDIOCONTEXT");
    let counter = 0;
    let graphupdated = false;
    let streamnode = false;
    let stream_prevnode = false;
    let stream_prevtime = false;
    let stream_pressure = 0;
    let stream_buffer = false;

    function nodeforeach(point, proc){
        const x = Object.keys(point);
        x.forEach(e => proc(e, point[e]));
    }

    function graphupdate(){
        streamnode = false;
        console.log("Audio graph updated", the_context.destination);
        nodeforeach(the_context.destination.__nodesources,
                    function(id, node){
                        console.log("connected", id);
                        if(node.__nodetype == "scriptprocessor"){
                            console.log("streaming node", node);
                            streamnode = node;
                        }
                    });
    }

    function nodewatcher(type){
        counter++;
        const me = {
            __nodetype: type,
            __nodeid: counter,
            __nodesources: {},
            __nodesinks: {},
            connect: function(node, input, output){
                if(! node.__nodetype){
                    console.log("Trying to connect unsupported node (or param)", node);
                }else{
                    console.log("Connect", node);
                    me.__nodesinks[node.__nodeid] = node;
                    node.__nodesources[me.__nodeid] = me;
                    graphupdated = true;
                }
            },
            disconnect: function(node){
                if(! node){
                    console.log("Unimplemented: Disconnect all");
                }else if(! node.__nodetype){
                    console.log("Unimplemented: Disconnect ???", node);
                }else{
                    console.log("Disconnect", node);
                    me.__nodesinks[node.__nodeid] = null;
                    node.__nodesources[me.__nodeid] = null;
                    graphupdated = true;
                }
            },
        };
        return me;
    }

    function audiotick(){
        const curtime = PortStd.performance_now();
        //me.currentTime = curtime / 1000;
        if(graphupdated){
            graphupdate();
            graphupdated = false;
        }
        if(streamnode){
            if(stream_prevnode != streamnode){
                /* Node change, preroll again */
                stream_prevnode = streamnode;
                stream_prevtime = false;
            }
            if(! stream_prevtime){
                /* Preroll, pass a buffer now */
                stream_pressure = streamnode.bufferSize;
                stream_buffer = newbuffer(streamnode.channelCount, streamnode.bufferSize);
                stream_prevtime = curtime;
                streamnode.onaudioprocess({outputBuffer: stream_buffer});
                g_audioEnqueue(stream_buffer.getChannelData(0), stream_buffer.getChannelData(1));
            }else{
                /* Playing */
                const est_remain_samples = stream_pressure - ((curtime - stream_prevtime) * 48);
                if(est_remain_samples < (streamnode.bufferSize / 2) /* ??? */){
                    if(est_remain_samples < 256){
                        console.log("Audio Past deadline", est_remain_samples);
                    }else{
                        //console.log("est. samples", est_remain_samples);
                    }
                    streamnode.onaudioprocess({outputBuffer: stream_buffer});
                    g_audioEnqueue(stream_buffer.getChannelData(0), stream_buffer.getChannelData(1));
                    stream_prevtime = curtime;
                    if(est_remain_samples < 0){
                        stream_pressure = streamnode.bufferSize;
                    }else{
                        stream_pressure = est_remain_samples + streamnode.bufferSize;
                    }
                }
            }
        }else{
            /* Stop streaming */
            stream_prevtime = false;
            stream_prevnode = false;
            stream_buffer = false;
            g_audioPause();
        }
    }

    g_setAudioTick(audiotick);

    const the_context = {
        sampleRate: 48000,
        destination: {
            __nodeid: 0,
            __nodesources: {},
            __nodetype: "destination",
            channelCount: 2,
        },
        decodeAudioData: function(data, success, fail){
            const p = new Promise((res, err) => {
                res(dummybuffer());
            });
            return wrappromise(p, success, fail);
        },
        listener: {
            positionX: 0,
            positionY: 0,
            positionZ: 0,
            setPosition: function(){},
            setOrientation: function(){}
        },
        createGain: function(){
            let node = nodewatcher();
            node.gain = {};
            node.gain.setValueAtTime = function(){};
            return node;
        },
        createPanner: function(){
            let node = nodewatcher();
            node.setPosition = function(){};
            return node;
        },
        createBufferSource: function(){
            let node = nodewatcher("buffersource");
            node.playbackRate = {};
            node.playbackRate.value = 1;
            node.start = function(){};
            return node;
        },
        /*
        createBuffer: function(){
            console.log("dummy buffer");
            return dummynode();
        },
        */
        createScriptProcessor: function(bufsize, inch, outch){
            console.log("CREATING SCRIPTPROCESSOR",bufsize,inch,outch);
            let node = nodewatcher("scriptprocessor");
            if(! bufsize){
                bufsize = 4096;
            }
            if(! inch){
                inch = 2;
            }
            if(! outch){
                outch = 2;
            }
            node.bufferSize = bufsize;
            node.numberOfInputs = inch;
            node.numberOfOutputs = outch;
            node.channelCount = outch;
            return node;
        }
    };

    return the_context;
}

export default register;

