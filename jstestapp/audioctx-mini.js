

function audioctx_mini(){
    return {
        decodeAudioData: function(){},
        listener: {
            positionX: 0,
            positionY: 0,
            positionZ: 0,
            setPosition: function(){},
            setOrientation: function(){}
        },
        /*
        createBuffersource: function(){
            return dummynode();
        },
        createBuffer: function(){
            return dummynode();
        },
        createPanner: function(){
            return dummynode();
        },
        createGain: function(){
            return dummynode();
        },
        */
    }
}

module.exports = audioctx_mini;

