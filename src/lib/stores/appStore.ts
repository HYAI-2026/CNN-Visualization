import { writable } from 'svelte/store';

export const predictions = writable<number[]>(Array(10).fill(0));
export const isModelLoaded = writable(false);
export const predictedIndex = writable<number | null>(null);