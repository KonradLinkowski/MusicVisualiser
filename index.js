function inter(v, start, end) {
  const newVal = []
  for (let i = 0; i < 3; i += 1) {
    newVal[i] = start[i] + (end[i] - start[i]) * v
  }
  return newVal
}

async function fun() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function createAnalyser(fftSize) {
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = fftSize;
    const length = analyser.frequencyBinCount;
    return {
      analyser,
      length,
      data: new Uint8Array(length)
    };
  }

  try {
    const contexts = [
      document.querySelector('#canv1').getContext('2d'),
      document.querySelector('#canv2').getContext('2d'),
      document.querySelector('#canv3').getContext('2d')
    ];
    contexts.forEach(cont => {
      cont.canvas.width = 800
      cont.canvas.height = 400
    });

    contexts[2].canvas.width = 800;
    contexts[2].canvas.height = 800;

    const bar = createAnalyser(256);
    const osci = createAnalyser(2048);
    const circle = createAnalyser(256);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    source = audioCtx.createMediaStreamSource(stream);
    source.connect(osci.analyser);
    osci.analyser.connect(bar.analyser);
    bar.analyser.connect(circle.analyser);


    function drawOsci(context, analyser, data, length) {
      requestAnimationFrame(() => drawOsci(context, analyser, data, length));
      analyser.getByteTimeDomainData(data);
      context.fillStyle = 'black';
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
      context.lineWidth = 5;
      context.beginPath();
      const sliceWidth = context.canvas.width * 1.0 / length;
      let x = 0;
      for (let i = 0; i < length; i++) {
        const v = data[i] / 128.0;
        const y = v * context.canvas.height / 2;
        const color = inter(y / context.canvas.height, [200, 10, 10], [10, 10, 250]);
        context.strokeStyle = `rgb(${color.join()})`;

        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }

        x += sliceWidth;
      }
      context.lineTo(context.canvas.width, context.canvas.height / 2);
      context.stroke();
    };

    function drawBar(context, analyser, data, length) {
      requestAnimationFrame(() => drawBar(context, analyser, data, length));

      analyser.getByteFrequencyData(data);

      context.fillStyle = 'rgb(0, 0, 0)';
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
      const barWidth = (context.canvas.width / length) * 2.5;
      let x = 0;
      for (let i = 0; i < length; i++) {
        const barHeight = data[i] / 2;

        const color = inter(barHeight / 200, [200, 50, 100], [10, 10, 250]);

        context.fillStyle = `rgb(${color.join()})`;
        context.fillRect(x, context.canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    }

    function drawCircleBar(context, analyser, data, length) {
      requestAnimationFrame(() => drawCircleBar(context, analyser, data, length));

      analyser.getByteFrequencyData(data);

      context.fillStyle = 'rgb(0, 0, 0)';
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
      const barWidth = (context.canvas.width / length) * 2;
      let x = context.canvas.width / 2;
      const angle = 360 / length;
      for (let i = 0; i < length; i++) {
        const barHeight = data[i] / 2;

        const color = inter(barHeight / 200, [200, 50, 100], [10, 10, 250]);

        context.fillStyle = `rgb(${color.join()})`;

        context.save();
        context.translate(context.canvas.width / 2, context.canvas.height / 2);
        context.rotate(-angle * i * Math.PI / 180);
        context.translate(-context.canvas.width / 2, -context.canvas.height / 2);

        context.fillRect(x, (context.canvas.height / 2 - 250) - barHeight, barWidth, barHeight + 10);
        context.restore();
      }
    }

    drawOsci(contexts[0], osci.analyser, osci.data, osci.length);
    drawBar(contexts[1], bar.analyser, bar.data, bar.length);
    drawCircleBar(contexts[2], circle.analyser, circle.data, circle.length);
  } catch (e) {
    console.error(e);
  }
}

let started = false;

document.addEventListener('click', () => {
  if (started) return;
  started = true;
  fun();
})

