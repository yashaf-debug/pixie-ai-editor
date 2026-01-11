/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import JSZip from 'jszip';
import { useLanguage } from '../contexts/LanguageContext';
import { generatePhotoshootSequence, batchApplyFilter, dataURLtoFile } from '../services/geminiService';
import { UploadIcon, StarsIcon, TrashIcon, CameraIcon } from './icons';
import Spinner from './Spinner';
import { AspectRatio } from '../types';

export interface BatchGeneratorRef {
    addFile: (file: File) => void;
    setModel: (file: File) => void;
}

interface BatchGeneratorProps {
    onExit: () => void;
    onEnhancePrompt: (prompt: string) => Promise<string>;
    onOpenModelLibraryForSet: () => void;
}

interface PhotoshootShot {
    id: number;
    prompt: string;
}

interface PhotoshootJob {
    id: number;
    clothingFile: File;
    clothingPreviewUrl: string;
    basePrompt: string;
    shotCount: number;
    shots: PhotoshootShot[];
}

interface BatchJob {
    id: number;
    file: File;
    previewUrl: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    resultUrl?: string;
    error?: string;
}

type Mode = 'photoshoot' | 'batch';

const BatchGenerator = forwardRef<BatchGeneratorRef, BatchGeneratorProps>(({ onExit, onEnhancePrompt }, ref) => {
    const { t } = useLanguage();

    const [mode, setMode] = useState<Mode>('photoshoot');
    const [status, setStatus] = useState<'idle' | 'processing' | 'compressing' | 'downloading'>('idle');
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    // Photoshoot state
    const [photoshootJobs, setPhotoshootJobs] = useState<PhotoshootJob[]>([]);

    // Batch state
    const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
    const [batchPrompt, setBatchPrompt] = useState('');

    // Shared Output state
    const [outputSettings, setOutputSettings] = useState({
        format: 'jpeg' as 'png' | 'jpeg',
        quality: 90,
        aspectRatio: 'preserve' as AspectRatio | 'preserve',
        model: 'gemini-3-pro-image-preview',
    });

    useImperativeHandle(ref, () => ({
        addFile: () => console.warn("addFile is not supported in this mode."),
        setModel: () => console.warn("setModel is not supported in this mode."),
    }));

    useEffect(() => {
        const urlsToRevoke = [...photoshootJobs.map(j => j.clothingPreviewUrl), ...batchJobs.map(j => j.previewUrl)];
        return () => {
            urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
        };
    }, [photoshootJobs, batchJobs]);

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

        if (mode === 'photoshoot') {
            const defaultShotPrompts = [
                t('batchGenerator.shot_1_placeholder'),
                t('batchGenerator.shot_2_placeholder'),
                t('batchGenerator.shot_3_placeholder'),
                t('batchGenerator.shot_4_placeholder'),
            ];
            const newJobs = imageFiles.map((file, index): PhotoshootJob => ({
                id: Date.now() + index,
                clothingFile: file,
                clothingPreviewUrl: URL.createObjectURL(file),
                basePrompt: t('batchGenerator.modelAndStylePlaceholder'),
                shotCount: 1,
                shots: defaultShotPrompts.map((prompt, i) => ({ id: i, prompt }))
            }));
            setPhotoshootJobs(prev => [...prev, ...newJobs]);
        } else { // batch mode
            const newJobs = imageFiles.map((file, index): BatchJob => ({
                id: Date.now() + index,
                file,
                previewUrl: URL.createObjectURL(file),
                status: 'pending'
            }));
            setBatchJobs(prev => [...prev, ...newJobs]);
        }
    };

    const updatePhotoshootJob = (jobId: number, field: keyof PhotoshootJob, value: any) => {
        setPhotoshootJobs(prev => prev.map(job => job.id === jobId ? { ...job, [field]: value } : job));
    };

    const updateShotPrompt = (jobId: number, shotId: number, newPrompt: string) => {
        setPhotoshootJobs(prev => prev.map(job => {
            if (job.id === jobId) {
                return {
                    ...job,
                    shots: job.shots.map(shot => shot.id === shotId ? { ...shot, prompt: newPrompt } : shot)
                };
            }
            return job;
        }));
    };

    const processPhotoshoot = async () => {
        const zip = new JSZip();
        for (let i = 0; i < photoshootJobs.length; i++) {
            const job = photoshootJobs[i];
            setProgress({ current: i + 1, total: photoshootJobs.length });

            const promptsToRun = job.shots.slice(0, job.shotCount).map(s => s.prompt);

            try {
                const resultUrls = await generatePhotoshootSequence(
                    job.clothingFile,
                    job.basePrompt,
                    promptsToRun,
                    outputSettings.aspectRatio as AspectRatio,
                    outputSettings.model
                );
                const folderName = job.clothingFile.name.substring(0, job.clothingFile.name.lastIndexOf('.')) || `item-${job.id}`;
                const folder = zip.folder(folderName);
                if (folder) {
                    for (let j = 0; j < resultUrls.length; j++) {
                        await addFileToZip(folder, resultUrls[j], `shot_${j + 1}`);
                    }
                }
            } catch (err) {
                console.error(`Failed job ${i}:`, err);
                zip.file(`ERROR_item_${i}.txt`, `Failed to process ${job.clothingFile.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }
        return zip;
    };

    const processBatch = async () => {
        const zip = new JSZip();
        setProgress({ current: 0, total: batchJobs.length });

        const ar = outputSettings.aspectRatio === 'preserve' ? undefined : outputSettings.aspectRatio as AspectRatio;
        const results = await batchApplyFilter(batchJobs.map(j => j.file), batchPrompt, ar, outputSettings.model);

        for (let i = 0; i < results.length; i++) {
            setProgress({ current: i + 1, total: batchJobs.length });
            const resultUrl = results[i];
            const originalName = batchJobs[i].file.name.substring(0, batchJobs[i].file.name.lastIndexOf('.'));

            if (resultUrl.startsWith('Error:')) {
                zip.file(`ERROR_${originalName}.txt`, resultUrl);
            } else {
                await addFileToZip(zip, resultUrl, `${originalName}_edited`);
            }
        }
        return zip;
    };

    const addFileToZip = async (zipOrFolder: JSZip | JSZip.JSZipObject, dataUrl: string, fileName: string) => {
        if (outputSettings.format === 'jpeg') {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            await new Promise<void>(resolve => {
                img.onload = () => resolve();
                img.src = dataUrl;
            });
            canvas.width = img.width;
            canvas.height = img.height;
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            }
            const jpegDataUrl = canvas.toDataURL('image/jpeg', outputSettings.quality / 100);
            zipOrFolder.file(`${fileName}.jpg`, jpegDataUrl.split(',')[1], { base64: true });
        } else {
            zipOrFolder.file(`${fileName}.png`, dataUrl.split(',')[1], { base64: true });
        }
    };

    const handleGenerateAndDownload = async () => {
        setStatus('processing');
        let zip: JSZip;
        if (mode === 'photoshoot') {
            zip = await processPhotoshoot();
        } else {
            zip = await processBatch();
        }

        setStatus('compressing');
        const content = await zip.generateAsync({ type: 'blob' });

        setStatus('downloading');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `pixshop-${mode}-${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        setStatus('idle');
    };

    const isLoading = status !== 'idle';
    const canGenerate = !isLoading && ((mode === 'photoshoot' && photoshootJobs.length > 0) || (mode === 'batch' && batchJobs.length > 0 && batchPrompt.trim() !== ''));

    const getStatusMessage = () => {
        switch (status) {
            case 'processing': return t('batchGenerator.processing', { current: String(progress.current), total: String(progress.total) });
            case 'compressing': return t('batchGenerator.compressing');
            case 'downloading': return t('batchGenerator.downloading');
            default: return t('batchGenerator.generateAndDownload');
        }
    };

    const renderPhotoshootMode = () => (
        <div className="space-y-6">
            {photoshootJobs.map(job => (
                <div key={job.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                        <img src={job.clothingPreviewUrl} alt={job.clothingFile.name} className="w-24 h-24 object-cover rounded-md border flex-shrink-0" />
                        <div className="flex-grow">
                            <p className="font-bold text-sm text-gray-800 break-all">{job.clothingFile.name}</p>
                            <label className="text-xs font-medium text-gray-600 mt-2 block">{t('batchGenerator.modelAndStyle')}</label>
                            <textarea
                                value={job.basePrompt}
                                onChange={e => updatePhotoshootJob(job.id, 'basePrompt', e.target.value)}
                                className="form-textarea"
                                rows={3}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <button onClick={() => setPhotoshootJobs(p => p.filter(j => j.id !== job.id))} data-tooltip={t('tooltip.removeImage')} className="p-1.5 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-full">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                            <div className="w-36">
                                <label className="text-xs font-medium text-gray-600 block mb-1">{t('batchGenerator.shots')}</label>
                                <select value={job.shotCount} onChange={e => updatePhotoshootJob(job.id, 'shotCount', Number(e.target.value))} className="form-select" disabled={isLoading}>
                                    {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {job.shots.slice(0, job.shotCount).map((shot, idx) => (
                            <div key={shot.id}>
                                <label className="text-xs font-medium text-gray-600">Shot {idx + 1}</label>
                                <textarea
                                    value={shot.prompt}
                                    onChange={e => updateShotPrompt(job.id, shot.id, e.target.value)}
                                    className="form-textarea mt-1"
                                    rows={2}
                                    disabled={isLoading}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <div className="text-center">
                <label htmlFor="file-upload" className="btn btn-subtle">
                    <UploadIcon className="w-5 h-5" />
                    {t('batchGenerator.uploadMore')}
                </label>
            </div>
        </div>
    );

    const renderBatchMode = () => (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border">
                <label className="text-sm font-bold text-gray-800">{t('batchGenerator.promptLabel')}</label>
                <p className="text-sm text-gray-500 mb-2">{t('batchGenerator.batchDesc')}</p>
                <textarea
                    value={batchPrompt}
                    onChange={e => setBatchPrompt(e.target.value)}
                    placeholder={t('batchGenerator.batchPromptPlaceholder')}
                    className="form-textarea"
                    rows={3}
                    disabled={isLoading}
                />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {batchJobs.map((job, index) => (
                    <div key={job.id} className="relative group aspect-square">
                        <img src={job.previewUrl} alt={job.file.name} className="w-full h-full object-cover rounded-md border" />
                        <button onClick={() => setBatchJobs(p => p.filter(j => j.id !== job.id))} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-md transition-colors aspect-square text-gray-500 hover:text-blue-500">
                    <UploadIcon className="w-8 h-8" />
                </label>
            </div>
        </div>
    );

    const renderUploadPlaceholder = () => (
        <div
            className={`w-full h-full min-h-[30vh] md:min-h-[60vh] flex flex-col items-center justify-center text-center p-8 transition-all duration-300 rounded-lg border-2 border-dashed ${isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
        >
            <CameraIcon className="w-16 h-16 text-gray-400 mb-4" />
            <label htmlFor="file-upload" className="font-semibold text-blue-600 cursor-pointer hover:underline text-lg">{mode === 'photoshoot' ? t('batchGenerator.uploadClothingItems') : t('batchGenerator.uploadButton')}</label>
            <p className="text-gray-500 mt-1 text-sm">{t('startScreen.dragDrop')}</p>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col animate-fade-in bg-gray-50">
            <header className="flex-shrink-0 bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
                <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{t('batchGenerator.title')}</h1>
                        <div className="flex items-center border border-gray-200 rounded-md p-0.5 mt-2">
                            <button onClick={() => setMode('photoshoot')} className={`px-3 py-1 text-sm font-semibold rounded ${mode === 'photoshoot' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{t('batchGenerator.modePhotoshoot')}</button>
                            <button onClick={() => setMode('batch')} className={`px-3 py-1 text-sm font-semibold rounded ${mode === 'batch' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{t('batchGenerator.modeBatch')}</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onExit} className="btn btn-subtle">{t('marketing.backButton')}</button>
                        <button onClick={handleGenerateAndDownload} disabled={!canGenerate} className="btn btn-primary min-w-[200px]">
                            {isLoading ? <Spinner className="!h-5 !w-5 !mx-0" /> : <StarsIcon className="w-5 h-5" />}
                            <span>{getStatusMessage()}</span>
                        </button>
                    </div>
                </div>
            </header>

            <main
                className="flex-grow w-full max-w-7xl mx-auto p-6 overflow-y-auto"
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
                onDrop={(e) => {
                    e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false);
                    handleFileSelect(e.dataTransfer.files);
                }}
            >
                <div className="bg-white p-4 rounded-lg border mb-6">
                    <h3 className="text-sm font-bold text-gray-800 mb-2">{t('batchGenerator.outputSettings')}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
                            <select
                                value={outputSettings.model}
                                onChange={e => setOutputSettings(s => ({ ...s, model: e.target.value }))}
                                className="form-select"
                                disabled={isLoading}
                            >
                                <option value="gemini-3-pro-image-preview">Nano Banana Pro (Quality)</option>
                                <option value="gemini-2.5-flash-image">Nano Banana (Speed)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t('batchGenerator.aspectRatioLabel')}</label>
                            <select value={outputSettings.aspectRatio} onChange={e => setOutputSettings(s => ({ ...s, aspectRatio: e.target.value as any }))} className="form-select" disabled={isLoading}>
                                <option value="preserve">{t('aspectRatio.preserve')}</option>
                                <option value="9:16">{t('aspectRatio.portrait9_16')}</option>
                                <option value="3:4">{t('aspectRatio.poster3_4')}</option>
                                <option value="2:3">{t('aspectRatio.social2_3')}</option>
                                <option value="1:1">{t('aspectRatio.square')}</option>
                                <option value="4:3">{t('aspectRatio.photo4_3')}</option>
                                <option value="16:9">{t('aspectRatio.landscape16_9')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t('batchGenerator.formatLabel')}</label>
                            <select value={outputSettings.format} onChange={e => setOutputSettings(s => ({ ...s, format: e.target.value as 'png' | 'jpeg' }))} className="form-select" disabled={isLoading}>
                                <option value="jpeg">JPEG</option>
                                <option value="png">PNG</option>
                            </select>
                        </div>
                        <div style={{ visibility: outputSettings.format === 'jpeg' ? 'visible' : 'hidden' }}>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t('batchGenerator.qualityLabel')} ({outputSettings.quality})</label>
                            <input type="range" min="10" max="100" value={outputSettings.quality} onChange={e => setOutputSettings(s => ({ ...s, quality: Number(e.target.value) }))} disabled={isLoading} />
                        </div>
                    </div>
                </div>
                {(mode === 'photoshoot' && photoshootJobs.length === 0) || (mode === 'batch' && batchJobs.length === 0) ? (
                    renderUploadPlaceholder()
                ) : (
                    mode === 'photoshoot' ? renderPhotoshootMode() : renderBatchMode()
                )}
                <input id="file-upload" type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e.target.files)} />
            </main>
        </div>
    );
});

export default BatchGenerator;