declare module 'butterchurn' {
  interface ButterchurnVisualizer {
    connectAudio(audioNode: AudioNode): void;
    loadPreset(preset: unknown, blendTime: number): void;
    setRendererSize(width: number, height: number): void;
    render(): void;
  }

  interface ButterchurnStatic {
    createVisualizer(
      audioContext: BaseAudioContext,
      canvas: HTMLCanvasElement,
      opts?: { width?: number; height?: number }
    ): ButterchurnVisualizer;
    // UMD double-wrap: Vite CJS interop may nest default
    default?: ButterchurnStatic;
  }

  const butterchurn: ButterchurnStatic;
  export default butterchurn;
}

declare module 'butterchurn-presets' {
  interface PresetsModule {
    getPresets(): Record<string, unknown>;
    default?: PresetsModule;
  }

  const presets: PresetsModule;
  export = presets;
}
