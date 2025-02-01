<h1>GrvMkr</h1>

<script lang="ts">
    let audioContext: AudioContext | null = null;
    let audioBuffer: AudioBuffer | null = null;
  
    async function loadSound(): Promise<void> {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
  
      const response = await fetch('./kick.wav');
      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    }
  
    async function playSound(): Promise<void> {
      if (!audioBuffer) await loadSound();
      if (!audioContext || !audioBuffer) return;
  
      const source: AudioBufferSourceNode = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    }
  </script>
  
  <button on:click={playSound}>Play Sound</button>
  