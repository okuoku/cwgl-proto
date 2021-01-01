function dummynode(){
    return {
        connect: function(){},
        disconnect: function(){},
    };
}

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

function audioctx_mini(){
    return {
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
            let node = dummynode();
            node.gain = {};
            node.gain.setValueAtTime = function(){};
            return node;
        },
        createPanner: function(){
            let node = dummynode();
            node.setPosition = function(){};
            return node;
        },
        createBufferSource: function(){
            let node = dummynode();
            node.playbackRate = {};
            node.playbackRate.value = 1;
            node.start = function(){};
            return node;
        },
        /*
        createBuffer: function(){
            return dummynode();
        },
        */
    }
}

module.exports = audioctx_mini;

