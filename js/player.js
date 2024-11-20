function playAudio() {
    var audio = document.getElementById("audioPlayer");
    audio.play();
}
function pauseAudio() {
    var audio = document.getElementById("audioPlayer");
    audio.pause();
}

function goBack() {
    window.history.back();
}

function goHome() {
    window.location.href = 'index.html';
}

var audio = document.getElementById("audioPlayer");
var progressBar = document.getElementById("progressBar");

// 更新进度条
audio.addEventListener("timeupdate", function () {
    var percent = (audio.currentTime / audio.duration) * 100;
    progressBar.value = percent;
});

// 调整播放位置
function seekAudio() {
    var time = (progressBar.value / 100) * audio.duration;
    audio.currentTime = time;
}

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var audioElement = document.getElementById('audioPlayer');
var audioSrc = audioCtx.createMediaElementSource(audioElement);
var analyser = audioCtx.createAnalyser();

// 连接音频源和分析器
audioSrc.connect(analyser);
analyser.connect(audioCtx.destination);

var canvas = document.getElementById('visualizer');
var canvasCtx = canvas.getContext('2d');

function drawVisualizer() {
    var WIDTH = canvas.width;
    var HEIGHT = canvas.height;

    analyser.fftSize = 256;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    function draw() {
        requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = '#000';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        var barWidth = (WIDTH / bufferLength) * 2.5;
        var barHeight;
        var x = 0;

        for (var i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i];

            canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
            canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);

            x += barWidth + 1;
        }
    }

    draw();
}

var lyrics = [];
var currentLine = 0;

// 解析歌词文件
function parseLyrics(data) {
    var lines = data.split('\n');
    lines.forEach(function (line) {
        var result = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
        if (result) {
            var minutes = parseInt(result[1]);
            var seconds = parseFloat(result[2]);
            var time = minutes * 60 + seconds;
            var text = result[3];
            console.log(time, text);
            lyrics.push({ time: time, text: text });
        }
    });
}

// 同步显示歌词
audio.addEventListener('timeupdate', function () {
    if (currentLine < lyrics.length && audio.currentTime >= lyrics[currentLine].time) {
        document.getElementById('lyrics').textContent = lyrics[currentLine].text;
        currentLine++;
    }
});

// 获取 URL 参数
function getUrlParams() {
    var params = {};
    var queryString = window.location.search.substring(1);
    var regex = /([^&=]+)=([^&]*)/g;
    var match;
    while ((match = regex.exec(queryString))) {
        params[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
    }
    return params;
}

// 动态加载资源
function loadResources() {
    var params = getUrlParams();
    var category = params['category'];
    var id = params['id'];

    if (category && id) {
        var basePath = 'music/' + category + '/' + id + '/';

        // 设置封面图片
        document.getElementById('cover').src = basePath + 'cover.webp';

        // 设置歌曲标题和歌手（如果有对应的信息，可以通过额外的文件或参数加载）
        // document.getElementById('song-title').textContent = '歌曲标题';
        // document.getElementById('song-artist').textContent = '歌手姓名';

        // 设置音频源
        audioElement.src = basePath + 'music.mp3';

        // 加载描述文件
        fetch(basePath + 'background.txt')
            .then(response => response.text())
            .then(data => {
                document.getElementById('song-description-text').textContent = data;
            })
            .catch(error => {
                console.error('无法加载歌曲描述：', error);
            });

        // 加载歌词文件
        fetch(basePath + 'lyrics.lrc')
            .then(response => response.text())
            .then(data => {
                parseLyrics(data);
            })
            .catch(error => {
                console.error('无法加载歌词：', error);
            });
    } else {
        console.error('缺少 category 或 id 参数');
    }
}

// 页面加载后调用
window.onload = function () {
    loadResources();
};

// 当音频开始播放时，启动可视化效果
audioElement.onplay = function () {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    drawVisualizer();
};