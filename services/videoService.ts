/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

const loadFFmpeg = async (): Promise<FFmpeg> => {
    if (ffmpeg) {
        return ffmpeg;
    }
    ffmpeg = new FFmpeg();
    // Using unpkg for core files as it's configured with the correct COOP/COEP headers
    // for SharedArrayBuffer to work. Version is aligned with the main ffmpeg library.
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
    
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    return ffmpeg;
};

export const mergeAudioAndVideo = async (
    videoFile: File, 
    audioFile: File,
    onProgress: (progress: number) => void
): Promise<Blob> => {
    const ffmpegInstance = await loadFFmpeg();
    
    ffmpegInstance.on('progress', ({ progress }) => {
        onProgress(Math.min(1, progress) * 100);
    });

    await ffmpegInstance.writeFile('input.mp4', await fetchFile(videoFile));
    await ffmpegInstance.writeFile('input.wav', await fetchFile(audioFile));
    
    // Command to merge video and audio.
    // -c:v copy: Copies the video stream without re-encoding, preserving quality.
    // -c:a aac: Encodes the audio to AAC, a standard for MP4 containers.
    // -shortest: Finishes encoding when the shortest input stream ends.
    await ffmpegInstance.exec([
        '-i', 'input.mp4', 
        '-i', 'input.wav', 
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-shortest',
        'output.mp4'
    ]);
    
    const data = await ffmpegInstance.readFile('output.mp4');
    
    // Unlink files to free up memory in the virtual file system
    await ffmpegInstance.deleteFile('input.mp4');
    await ffmpegInstance.deleteFile('input.wav');
    await ffmpegInstance.deleteFile('output.mp4');
    
    return new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' });
};